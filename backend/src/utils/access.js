const Course = require('../models/Course');

const same = (a, b) => String(a?._id || a) === String(b?._id || b);

// Returns 'admin' (super_admin), 'staff' (instructor/TA), 'student' or null
const roleInCourse = (user, course) => {
  if (user.role === 'super_admin') return 'admin';
  if (
    same(course.instructor, user._id) ||
    course.teachingAssistants.some((t) => same(t, user._id))
  )
    return 'staff';
  if (course.students.some((s) => same(s, user._id))) return 'student';
  return null;
};

const isStaff = (role) => role === 'admin' || role === 'staff';

// IDs of every course the user can see
const accessibleCourseIds = async (user, { includeArchived = false } = {}) => {
  const filter = includeArchived ? {} : { isArchived: false };
  if (user.role !== 'super_admin') {
    filter.$or = [
      { students: user._id },
      { instructor: user._id },
      { teachingAssistants: user._id },
    ];
  }
  return Course.distinct('_id', filter);
};

module.exports = { same, roleInCourse, isStaff, accessibleCourseIds };
