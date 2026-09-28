const express = require('express');
const Grade = require('../models/Grade');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { loadCourse, loadCourseOf, requireStaff } = require('../middleware/course');
const { isStaff } = require('../utils/access');
const { coursePercentage, percentToGpa } = require('../utils/gpa');
const { emitToUser } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware);

// Student: overall CGPA + per-course breakdown (declared before /:courseId)
router.get('/me/cgpa', async (req, res) => {
  const grades = await Grade.find({ student: req.user._id }).populate('course', 'name code creditHours gradeWeights');
  const byCourse = new Map();
  grades.forEach((g) => {
    if (!g.course) return;
    const key = String(g.course._id);
    if (!byCourse.has(key)) byCourse.set(key, { course: g.course, grades: [] });
    byCourse.get(key).grades.push(g);
  });

  let points = 0;
  let credits = 0;
  const courses = [...byCourse.values()].map(({ course, grades: gs }) => {
    const { percentage, gpa } = coursePercentage(gs, course.gradeWeights);
    const cr = course.creditHours || 3;
    points += gpa * cr;
    credits += cr;
    return { courseId: course._id, code: course.code, name: course.name, credits: cr, percentage, gpa };
  });

  res.json({ cgpa: credits ? points / credits : 0, totalCredits: credits, courses });
});

// Grades for a course. Students get their own; staff get everyone's (or ?studentId=)
router.get('/:courseId', loadCourse, async (req, res) => {
  const staff = isStaff(req.courseRole);
  const query = { course: req.course._id };
  if (!staff) query.student = req.user._id;
  else if (req.query.studentId) query.student = req.query.studentId;

  const grades = await Grade.find(query).populate('assignment', 'title').populate('student', 'name email').sort({ createdAt: 1 });

  if (staff && !req.query.studentId) return res.json({ staffView: true, grades });

  const weights = req.course.gradeWeights || {};
  const { percentage, gpa, componentAverages } = coursePercentage(grades, weights);
  res.json({ staffView: false, grades, percentage, gpa, componentAverages, weights, creditHours: req.course.creditHours });
});

// Create/update a grade (staff)
router.post('/:courseId', loadCourse, requireStaff, async (req, res) => {
  const { student, component, label = '', score, maxScore = 100, feedback, assignment = null } = req.body;
  if (!req.course.students.some((s) => String(s) === String(student))) {
    return res.status(400).json({ error: 'Student is not enrolled in this course' });
  }
  if (Number(score) > Number(maxScore)) return res.status(400).json({ error: 'Score cannot exceed max score' });

  const grade = await Grade.findOneAndUpdate(
    { student, course: req.course._id, component, label, assignment },
    { score, maxScore, feedback },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  emitToUser(req, student, 'grade:updated', { courseId: String(req.course._id), grade });
  res.status(201).json(grade);
});

router.delete('/:gradeId', loadCourseOf(Grade, 'gradeId'), requireStaff, async (req, res) => {
  await req.doc.deleteOne();
  emitToUser(req, req.doc.student, 'grade:updated', { courseId: String(req.course._id) });
  res.json({ message: 'Grade deleted' });
});

module.exports = router;
