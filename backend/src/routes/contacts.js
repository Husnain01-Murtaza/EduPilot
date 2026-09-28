const express = require('express');
const Contact = require('../models/Contact');
const { authMiddleware } = require('../middleware/auth');
const { loadCourse, loadCourseOf, requireStaff, pick } = require('../middleware/course');
const { emitToCourse } = require('../utils/realtime');

const router = express.Router();
router.use(authMiddleware);

const FIELDS = ['user', 'name', 'role', 'email', 'phone', 'officeLocation', 'officeHours', 'bio'];

router.get('/:courseId', loadCourse, async (req, res) => {
  res.json(await Contact.find({ course: req.course._id }).sort({ role: 1, name: 1 }));
});

router.post('/:courseId', loadCourse, requireStaff, async (req, res) => {
  const contact = await Contact.create({ ...pick(req.body, FIELDS), course: req.course._id });
  emitToCourse(req, req.course._id, 'contact:created', { contact });
  res.status(201).json(contact);
});

router.put('/:contactId', loadCourseOf(Contact, 'contactId'), requireStaff, async (req, res) => {
  req.doc.set(pick(req.body, FIELDS));
  await req.doc.save();
  emitToCourse(req, req.course._id, 'contact:updated', { contact: req.doc });
  res.json(req.doc);
});

router.delete('/:contactId', loadCourseOf(Contact, 'contactId'), requireStaff, async (req, res) => {
  await req.doc.deleteOne();
  emitToCourse(req, req.course._id, 'contact:deleted', { id: req.params.contactId });
  res.json({ message: 'Contact deleted' });
});

module.exports = router;
