import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useCourses } from '../../hooks/useCourses';
import { useSocketEvents } from '../../hooks/useSocket';
import { CourseSelector } from '../Common/CourseSelector';
import { RESOURCE_TYPES, cardCls, inputCls, label } from '../../utils/constants';

const ICONS = { textbook: '📘', lecture_slide: '🖼️', past_paper: '📝', link: '🔗', document: '📄' };

export const ResourcesPage = () => {
  const { courseId } = useParams();
  const { courses } = useCourses();
  const [resources, setResources] = useState([]);
  const [type, setType] = useState('');

  const load = useCallback(async () => {
    if (!courseId) return;
    const { data } = await api.get(`/resources/${courseId}`, { params: type ? { type } : {} });
    setResources(data);
  }, [courseId, type]);

  useEffect(() => { load().catch(() => setResources([])); }, [load]);
  useSocketEvents(['resource:created', 'resource:deleted'], (p) => { if (p.courseId === courseId) load(); });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
      <div className="flex flex-wrap gap-4">
        <CourseSelector courses={courses} courseId={courseId} basePath="/resources" />
        <select className={`${inputCls} max-w-xs capitalize`} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((r) => (
          <a key={r._id} href={r.url} target="_blank" rel="noopener noreferrer" className={`${cardCls} hover:shadow-lg transition block`}>
            <p className="text-xs uppercase font-semibold text-blue-600">{ICONS[r.type]} {label(r.type)}</p>
            <h3 className="font-bold text-gray-900">{r.title}</h3>
            {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
            <p className="text-xs text-gray-400 mt-2">Added {new Date(r.createdAt).toLocaleDateString()}</p>
          </a>
        ))}
        {courseId && !resources.length && <p className="text-gray-500">No resources yet.</p>}
      </div>
    </div>
  );
};
