const express = require('express');
const Assignment = require('../models/Assignment');
const { authMiddleware } = require('../middleware/auth');
const { loadCourse, loadCourseOf, requireStaff, pick } = require('../middleware/course');
const { accessibleCourseIds } = require('../utils/access');
const { emitToCourse } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware);

const FIELDS = ['title', 'description', 'type', 'dueDate', 'weight', 'totalMarks', 'attachments'];

// List assignments across my courses. Query: courseId, type, due=week
router.get('/', async (req, res) => {
  const { courseId, type, due } = req.query;
  let ids = (await accessibleCourseIds(req.user)).map(String);
  if (courseId) ids = ids.filter((id) => id === courseId);

  const query = { course: { $in: ids } };
  if (type) query.type = type;
  if (due === 'week') {
    const now = new Date();
    query.dueDate = { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) };
  }

  const assignments = await Assignment.find(query).populate('course', 'name code').sort({ dueDate: 1 });
  res.json(assignments);
});

router.post('/:courseId', loadCourse, requireStaff, async (req, res) => {
  const assignment = await Assignment.create({ ...pick(req.body, FIELDS), course: req.course._id });
  await assignment.populate('course', 'name code');
  emitToCourse(req, req.course._id, 'assignment:created', { assignment });
  res.status(201).json(assignment);
});

router.put('/:assignmentId', loadCourseOf(Assignment, 'assignmentId'), requireStaff, async (req, res) => {
  req.doc.set(pick(req.body, FIELDS));
  await req.doc.save();
  await req.doc.populate('course', 'name code');
  emitToCourse(req, req.course._id, 'assignment:updated', { assignment: req.doc });
  res.json(req.doc);
});

router.delete('/:assignmentId', loadCourseOf(Assignment, 'assignmentId'), requireStaff, async (req, res) => {
  await req.doc.deleteOne();
  emitToCourse(req, req.course._id, 'assignment:deleted', { id: req.params.assignmentId });
  res.json({ message: 'Assignment deleted' });
});

module.exports = router;
