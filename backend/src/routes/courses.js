const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { loadCourse, requireStaff, pick } = require('../middleware/course');
const { accessibleCourseIds, isStaff, same } = require('../utils/access');
const { emitToUser, emitToCourse } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware);

const serialize = (course, role) => {
  const obj = course.toObject();
  obj.studentCount = obj.students.length;
  obj.myRole = role;
  if (!isStaff(role)) delete obj.students; // students don't see the roster
  return obj;
};

const cleanWeights = (w) => {
  if (!w || typeof w !== 'object') return {};
  const out = {};
  ['quiz', 'assignment', 'midterm', 'final', 'project'].forEach((k) => {
    const n = Number(w[k]);
    if (Number.isFinite(n) && n >= 0) out[k] = n;
  });
  return out;
};

// List my courses
router.get('/', async (req, res) => {
  const ids = await accessibleCourseIds(req.user, { includeArchived: req.query.archived === 'true' });
  const courses = await Course.find({ _id: { $in: ids } })
    .populate('instructor teachingAssistants', 'name email')
    .sort({ semester: -1, code: 1 });
  res.json(courses.map((c) => serialize(c, req.user.role === 'super_admin' ? 'admin' : roleOf(c, req.user))));
});

function roleOf(course, user) {
  if (same(course.instructor, user._id) || course.teachingAssistants.some((t) => same(t, user._id))) return 'staff';
  return 'student';
}

// Create course
router.post('/', requireRole('admin', 'super_admin'), async (req, res) => {
  const { name, code, description, semester, creditHours, gradeWeights } = req.body;
  const instructor = req.user.role === 'super_admin' && req.body.instructor ? req.body.instructor : req.user._id;
  const course = await Course.create({
    name, code, description, semester, creditHours, instructor,
    gradeWeights: cleanWeights(gradeWeights),
  });
  await course.populate('instructor teachingAssistants', 'name email');
  emitToUser(req, instructor, 'course:created', { courseId: String(course._id) });
  res.status(201).json(serialize(course, 'staff'));
});

router.get('/:courseId', loadCourse, async (req, res) => {
  await req.course.populate('instructor teachingAssistants', 'name email');
  res.json(serialize(req.course, req.courseRole));
});

router.put('/:courseId', loadCourse, requireStaff, async (req, res) => {
  const updates = pick(req.body, ['name', 'description', 'creditHours', 'semester']);
  if (req.body.gradeWeights !== undefined) updates.gradeWeights = cleanWeights(req.body.gradeWeights);
  req.course.set(updates);
  await req.course.save();
  emitToCourse(req, req.course._id, 'course:updated');
  res.json(serialize(req.course, req.courseRole));
});

// Roster (staff only)
router.get('/:courseId/students', loadCourse, requireStaff, async (req, res) => {
  const students = await User.find({ _id: { $in: req.course.students } }).select('name email').sort('name');
  res.json(students);
});

// Enroll students by id or email(s)
router.post('/:courseId/enroll', loadCourse, requireStaff, async (req, res) => {
  const { studentId, email, emails } = req.body;
  const list = [...(emails || []), ...(email ? [email] : [])].map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  const query = studentId ? { _id: studentId } : { email: { $in: list } };
  const users = await User.find(query).select('_id email');
  const found = new Set(users.map((u) => u.email));
  const notFound = list.filter((e) => !found.has(e));

  req.course.students.addToSet(...users.map((u) => u._id));
  await req.course.save();

  const io = req.app.get('io');
  users.forEach((u) => {
    io.in(`user:${u._id}`).socketsJoin(`course:${req.course._id}`);
    emitToUser(req, u._id, 'course:updated', { courseId: String(req.course._id) });
  });
  res.json({ enrolled: users.length, notFound });
});

router.delete('/:courseId/students/:studentId', loadCourse, requireStaff, async (req, res) => {
  req.course.students.pull(req.params.studentId);
  await req.course.save();
  const io = req.app.get('io');
  io.in(`user:${req.params.studentId}`).socketsLeave(`course:${req.course._id}`);
  emitToUser(req, req.params.studentId, 'course:updated', { courseId: String(req.course._id) });
  res.json({ message: 'Student removed' });
});

// Add a TA (instructor or super_admin only). Promotes plain students to 'admin' role
router.post('/:courseId/tas', loadCourse, async (req, res) => {
  const allowed = req.user.role === 'super_admin' || same(req.course.instructor, req.user._id);
  if (!allowed) return res.status(403).json({ error: 'Only the instructor can add TAs' });
  const ta = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!ta) return res.status(404).json({ error: 'User not found' });
  req.course.teachingAssistants.addToSet(ta._id);
  await req.course.save();
  if (ta.role === 'student') {
    ta.role = 'admin';
    await ta.save();
  }
  req.app.get('io').in(`user:${ta._id}`).socketsJoin(`course:${req.course._id}`);
  emitToUser(req, ta._id, 'course:updated', { courseId: String(req.course._id) });
  res.json({ message: 'TA added' });
});

module.exports = router;
