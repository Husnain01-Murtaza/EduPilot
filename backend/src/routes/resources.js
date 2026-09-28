const express = require('express');
const Resource = require('../models/Resource');
const { authMiddleware } = require('../middleware/auth');
const { loadCourse, loadCourseOf, requireStaff, pick } = require('../middleware/course');
const { emitToCourse } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware);

router.get('/:courseId', loadCourse, async (req, res) => {
  const query = { course: req.course._id };
  if (req.query.type) query.type = req.query.type;
  res.json(await Resource.find(query).populate('uploadedBy', 'name email').sort({ createdAt: -1 }));
});

router.post('/:courseId', loadCourse, requireStaff, async (req, res) => {
  const resource = await Resource.create({
    ...pick(req.body, ['title', 'type', 'description', 'url']),
    course: req.course._id,
    uploadedBy: req.user._id,
  });
  emitToCourse(req, req.course._id, 'resource:created', { resource });
  res.status(201).json(resource);
});

router.delete('/:resourceId', loadCourseOf(Resource, 'resourceId'), requireStaff, async (req, res) => {
  await req.doc.deleteOne();
  emitToCourse(req, req.course._id, 'resource:deleted', { id: req.params.resourceId });
  res.json({ message: 'Resource deleted' });
});

module.exports = router;
