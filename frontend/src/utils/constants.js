export const ASSIGNMENT_TYPES = ['assignment', 'quiz', 'project', 'exam'];
export const GRADE_COMPONENTS = ['quiz', 'assignment', 'midterm', 'final', 'project'];
export const CONTACT_ROLES = ['instructor', 'ta', 'lab_instructor'];
export const RESOURCE_TYPES = ['textbook', 'lecture_slide', 'past_paper', 'link', 'document'];

export const ROLE_LABELS = { student: 'Student', admin: 'Instructor/TA', super_admin: 'Super Admin' };

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
export const btnCls =
  'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition';
export const cardCls = 'bg-white rounded-lg shadow-md p-6';

export const label = (s) => String(s || '').replace(/_/g, ' ');
