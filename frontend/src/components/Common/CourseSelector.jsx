import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inputCls } from '../../utils/constants';

// Dropdown that navigates to `${basePath}/${courseId}`; auto-selects the first course
export const CourseSelector = ({ courses, courseId, basePath }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId && courses.length) navigate(`${basePath}/${courses[0]._id}`, { replace: true });
  }, [courseId, courses, basePath, navigate]);

  if (!courses.length) return <p className="text-gray-500">You are not part of any course yet.</p>;

  return (
    <select
      value={courseId || ''}
      onChange={(e) => navigate(`${basePath}/${e.target.value}`)}
      className={`${inputCls} max-w-md`}
    >
      {courses.map((c) => (
        <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
      ))}
    </select>
  );
};
