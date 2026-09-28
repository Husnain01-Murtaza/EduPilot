import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useCourses } from '../../hooks/useCourses';
import { useSocketEvents } from '../../hooks/useSocket';
import { CourseSelector } from '../Common/CourseSelector';
import { cardCls, label } from '../../utils/constants';

export const ContactsPage = () => {
  const { courseId } = useParams();
  const { courses } = useCourses();
  const [contacts, setContacts] = useState([]);

  const load = useCallback(async () => {
    if (!courseId) return;
    const { data } = await api.get(`/contacts/${courseId}`);
    setContacts(data);
  }, [courseId]);

  useEffect(() => { load().catch(() => setContacts([])); }, [load]);
  useSocketEvents(['contact:created', 'contact:updated', 'contact:deleted'], (p) => { if (p.courseId === courseId) load(); });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Course Contacts</h1>
      <CourseSelector courses={courses} courseId={courseId} basePath="/contacts" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((c) => (
          <div key={c._id} className={cardCls}>
            <span className="text-xs uppercase font-semibold text-blue-600">{label(c.role)}</span>
            <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
            <div className="text-sm text-gray-700 mt-2 space-y-1">
              {c.email && <p>✉️ <a className="text-blue-600 hover:underline" href={`mailto:${c.email}`}>{c.email}</a></p>}
              {c.phone && <p>📞 {c.phone}</p>}
              {c.officeLocation && <p>📍 {c.officeLocation}</p>}
              {c.officeHours && <p>🕒 {c.officeHours}</p>}
              {c.bio && <p className="text-gray-500 pt-1">{c.bio}</p>}
            </div>
          </div>
        ))}
        {courseId && !contacts.length && <p className="text-gray-500">No contacts listed for this course yet.</p>}
      </div>
    </div>
  );
};
