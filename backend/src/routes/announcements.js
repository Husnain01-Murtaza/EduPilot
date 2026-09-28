const express = require('express');
const Announcement = require('../models/Announcement');
const { authMiddleware } = require('../middleware/auth');
const { loadCourse, loadCourseOf, requireStaff, pick } = require('../middleware/course');
const { accessibleCourseIds } = require('../utils/access');
const { emitToCourse } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware);

// Feed across all my courses (declared before /:courseId)
router.get('/', async (req, res) => {
  const ids = await accessibleCourseIds(req.user);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const items = await Announcement.find({ course: { $in: ids } })
    .populate('course', 'name code')
    .populate('createdBy', 'name email')
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit);
  res.json(items);
});

router.get('/:courseId', loadCourse, async (req, res) => {
  const items = await Announcement.find({ course: req.course._id })
    .populate('createdBy', 'name email')
    .sort({ isPinned: -1, createdAt: -1 });
  res.json(items);
});

router.post('/:courseId', loadCourse, requireStaff, async (req, res) => {
  const a = await Announcement.create({
    ...pick(req.body, ['title', 'message', 'isPinned']),
    course: req.course._id,
    createdBy: req.user._id,
  });
  await a.populate([{ path: 'createdBy', select: 'name email' }, { path: 'course', select: 'name code' }]);
  emitToCourse(req, req.course._id, 'announcement:created', { announcement: a });
  res.status(201).json(a);
});

router.put('/:announcementId', loadCourseOf(Announcement, 'announcementId'), requireStaff, async (req, res) => {
  req.doc.set(pick(req.body, ['title', 'message', 'isPinned']));
  await req.doc.save();
  emitToCourse(req, req.course._id, 'announcement:updated', { announcement: req.doc });
  res.json(req.doc);
});

router.delete('/:announcementId', loadCourseOf(Announcement, 'announcementId'), requireStaff, async (req, res) => {
  await req.doc.deleteOne();
  emitToCourse(req, req.course._id, 'announcement:deleted', { id: req.params.announcementId });
  res.json({ message: 'Announcement deleted' });
});

module.exports = router;
