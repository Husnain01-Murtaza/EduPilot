const Course = require('../models/Course');
const { roleInCourse, isStaff } = require('../utils/access');

const attach = (req, res, course) => {
  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return false;
  }
  const role = roleInCourse(req.user, course);
  if (!role) {
    res.status(403).json({ error: 'Access denied' });
    return false;
  }
  req.course = course;
  req.courseRole = role;
  return true;
};

// Loads :courseId and checks the user belongs to it
const loadCourse = async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (attach(req, res, course)) next();
};

// Loads a child document (Assignment, Announcement, ...) and its course
const loadCourseOf = (Model, param) => async (req, res, next) => {
  const doc = await Model.findById(req.params[param]);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const course = await Course.findById(doc.course);
  if (attach(req, res, course)) {
    req.doc = doc;
    next();
  }
};

const requireStaff = (req, res, next) =>
  isStaff(req.courseRole) ? next() : res.status(403).json({ error: 'Not authorized for this course' });

// Copy only whitelisted keys from an object (prevents mass assignment)
const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

module.exports = { loadCourse, loadCourseOf, requireStaff, pick };
