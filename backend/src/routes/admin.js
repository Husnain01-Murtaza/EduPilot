const express = require('express');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const Grade = require('../models/Grade');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { roleInCourse, isStaff } = require('../utils/access');
const { emitToUser } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware, requireRole('admin', 'super_admin'));

const staffFilter = (user) =>
  user.role === 'super_admin'
    ? { isArchived: false }
    : { isArchived: false, $or: [{ instructor: user._id }, { teachingAssistants: user._id }] };

router.get('/dashboard/stats', async (req, res) => {
  const courses = await Course.find(staffFilter(req.user));
  const totalAssignments = await Assignment.countDocuments({ course: { $in: courses.map((c) => c._id) } });
  res.json({
    totalCourses: courses.length,
    totalStudents: courses.reduce((n, c) => n + c.students.length, 0),
    totalAssignments,
    courses: courses.map((c) => ({ id: c._id, name: c.name, code: c.code, students: c.students.length })),
  });
});

// Bulk import grades.
// rows: [{ studentEmail | studentId, component, label?, score, maxScore? }]
router.post('/grades/import', async (req, res) => {
  const { courseId, rows } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (!isStaff(roleInCourse(req.user, course))) return res.status(403).json({ error: 'Not authorized' });
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'No rows provided' });

  const emails = rows.map((r) => String(r.studentEmail || '').toLowerCase()).filter(Boolean);
  const users = await User.find({ email: { $in: emails } }).select('email');
  const byEmail = new Map(users.map((u) => [u.email, u._id]));
  const enrolled = new Set(course.students.map(String));

  const ops = [];
  const errors = [];
  rows.forEach((r, i) => {
    const student = r.studentId || byEmail.get(String(r.studentEmail || '').toLowerCase());
    const score = Number(r.score);
    const maxScore = Number(r.maxScore) || 100;
    if (!student || !enrolled.has(String(student))) return errors.push(`Row ${i + 1}: student not found or not enrolled`);
    if (!Number.isFinite(score) || score < 0 || score > maxScore) return errors.push(`Row ${i + 1}: invalid score`);
    ops.push({
      updateOne: {
        filter: { student, course: course._id, component: r.component, label: r.label || '', assignment: null },
        update: { $set: { score, maxScore } },
        upsert: true,
      },
    });
  });

  if (ops.length) {
    await Grade.bulkWrite(ops);
    const ids = new Set(ops.map((o) => String(o.updateOne.filter.student)));
    ids.forEach((id) => emitToUser(req, id, 'grade:updated', { courseId: String(course._id) }));
  }
  res.json({ imported: ops.length, errors });
});

// ---- super_admin only ----
router.get('/semesters', requireRole('super_admin'), async (req, res) => {
  res.json(await Semester.find().sort({ createdAt: -1 }));
});

router.post('/semesters', requireRole('super_admin'), async (req, res) => {
  res.status(201).json(await Semester.create(req.body));
});

router.post('/semester/archive', requireRole('super_admin'), async (req, res) => {
  const { semesterName, newSemesterName } = req.body;
  const semester = await Semester.findOne({ name: semesterName });
  if (!semester) return res.status(404).json({ error: 'Semester not found' });

  const courses = await Course.find({ semester: semesterName });
  const grades = await Grade.find({ course: { $in: courses.map((c) => c._id) } }).select('_id');

  semester.isActive = false;
  semester.archivedData = { courses: courses.map((c) => c._id), grades: grades.map((g) => g._id) };
  await semester.save();
  await Course.updateMany({ semester: semesterName }, { isArchived: true });

  let next = null;
  if (newSemesterName) next = await Semester.findOneAndUpdate({ name: newSemesterName }, { isActive: true }, { upsert: true, new: true });
  res.json({ message: 'Semester archived', archivedSemester: semester, newSemester: next });
});

router.get('/users', requireRole('super_admin'), async (req, res) => {
  const q = req.query.q ? { $or: [{ email: new RegExp(req.query.q, 'i') }, { name: new RegExp(req.query.q, 'i') }] } : {};
  res.json(await User.find(q).limit(50).sort('name'));
});

router.put('/users/:userId/role', requireRole('super_admin'), async (req, res) => {
  const { role } = req.body;
  if (!['student', 'admin', 'super_admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
