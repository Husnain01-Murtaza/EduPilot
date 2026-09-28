import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useCourses } from '../../hooks/useCourses';
import { useSocketEvents } from '../../hooks/useSocket';
import { ASSIGNMENT_TYPES, inputCls, label } from '../../utils/constants';
import { AssignmentCard } from '../Dashboard/AssignmentCard';

export const AssignmentsPage = () => {
  const { courses } = useCourses();
  const [assignments, setAssignments] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = {};
    if (courseId) params.courseId = courseId;
    if (type) params.type = type;
    try {
      const { data } = await api.get('/assignments', { params });
      setAssignments(data);
    } finally {
      setLoading(false);
    }
  }, [courseId, type]);

  useEffect(() => { load(); }, [load]);
  useSocketEvents(['assignment:created', 'assignment:updated', 'assignment:deleted', 'course:updated'], load);

  const now = new Date();
  const visible = assignments.filter((a) => showPast || new Date(a.dueDate) >= now);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Assignments & Deadlines</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select className={`${inputCls} max-w-xs`} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.code}</option>)}
        </select>
        <select className={`${inputCls} max-w-xs capitalize`} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {ASSIGNMENT_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
          Show past deadlines
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : visible.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((a) => (
            <div key={a._id}>
              <AssignmentCard assignment={a} />
              {a.description && <p className="text-sm text-gray-600 mt-1 px-1">{a.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Nothing to show.</p>
      )}
    </div>
  );
};
