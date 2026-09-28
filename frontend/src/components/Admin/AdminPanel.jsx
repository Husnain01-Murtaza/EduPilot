import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CourseSelector } from '../Common/CourseSelector';
import { useCourses } from '../../hooks/useCourses';
import { ASSIGNMENT_TYPES, CONTACT_ROLES, RESOURCE_TYPES, label } from '../../utils/constants';
import { CrudTab } from './CrudTab';
import { GradesTab } from './GradesTab';
import { StudentsTab } from './StudentsTab';
import { SettingsTab } from './SettingsTab';

const TABS = ['assignments', 'grades', 'announcements', 'resources', 'contacts', 'students', 'settings'];

export const AdminPanel = () => {
  const { courseId } = useParams();
  const { courses } = useCourses();
  const [tab, setTab] = useState('assignments');
  const managed = courses.filter((c) => c.myRole !== 'student');

  const renderTab = () => {
    switch (tab) {
      case 'assignments':
        return (
          <CrudTab key="a" courseId={courseId} title="assignment" listUrl={`/assignments?courseId=${courseId}`}
            createUrl={`/assignments/${courseId}`} deleteUrl={(i) => `/assignments/${i._id}`}
            events={['assignment:created', 'assignment:updated', 'assignment:deleted']}
            initial={{ totalMarks: 100, weight: 0 }}
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'type', label: 'Type', type: 'select', options: ASSIGNMENT_TYPES, required: true },
              { name: 'dueDate', label: 'Due date', type: 'datetime-local', required: true },
              { name: 'weight', label: 'Weight (%)', type: 'number' },
              { name: 'totalMarks', label: 'Total marks', type: 'number' },
              { name: 'description', label: 'Description', type: 'textarea' },
            ]}
            renderItem={(a) => (
              <>
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-gray-600 capitalize">{label(a.type)} · {a.weight}% · due {new Date(a.dueDate).toLocaleString()}</p>
              </>
            )} />
        );
      case 'announcements':
        return (
          <CrudTab key="n" courseId={courseId} title="announcement" listUrl={`/announcements/${courseId}`}
            createUrl={`/announcements/${courseId}`} deleteUrl={(i) => `/announcements/${i._id}`}
            events={['announcement:created', 'announcement:updated', 'announcement:deleted']}
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'message', label: 'Message', type: 'textarea', required: true },
              { name: 'isPinned', label: 'Pin to top', type: 'checkbox' },
            ]}
            renderItem={(a) => (
              <>
                <p className="font-semibold">{a.isPinned && '📌 '}{a.title}</p>
                <p className="text-sm text-gray-600">{a.message}</p>
              </>
            )} />
        );
      case 'resources':
        return (
          <CrudTab key="r" courseId={courseId} title="resource" listUrl={`/resources/${courseId}`}
            createUrl={`/resources/${courseId}`} deleteUrl={(i) => `/resources/${i._id}`}
            events={['resource:created', 'resource:deleted']}
            fields={[
              { name: 'title', label: 'Title', required: true },
              { name: 'type', label: 'Type', type: 'select', options: RESOURCE_TYPES, required: true },
              { name: 'url', label: 'URL (Drive, Dropbox, website…)', type: 'url', required: true },
              { name: 'description', label: 'Description', type: 'textarea' },
            ]}
            renderItem={(r) => (
              <>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">{r.title}</a>
                <p className="text-sm text-gray-600 capitalize">{label(r.type)}</p>
              </>
            )} />
        );
      case 'contacts':
        return (
          <CrudTab key="c" courseId={courseId} title="contact" listUrl={`/contacts/${courseId}`}
            createUrl={`/contacts/${courseId}`} deleteUrl={(i) => `/contacts/${i._id}`}
            events={['contact:created', 'contact:updated', 'contact:deleted']}
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'role', label: 'Role', type: 'select', options: CONTACT_ROLES, required: true },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'phone', label: 'Phone' },
              { name: 'officeLocation', label: 'Office location' },
              { name: 'officeHours', label: 'Office hours (e.g. Mon 2-4 PM)' },
            ]}
            renderItem={(c) => (
              <>
                <p className="font-semibold">{c.name} <span className="text-xs uppercase text-blue-600">{label(c.role)}</span></p>
                <p className="text-sm text-gray-600">{[c.email, c.officeHours].filter(Boolean).join(' · ')}</p>
              </>
            )} />
        );
      case 'grades': return <GradesTab key="g" courseId={courseId} />;
      case 'students': return <StudentsTab key="s" courseId={courseId} />;
      default: return <SettingsTab key="t" courseId={courseId} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="text-blue-600 hover:underline text-sm">← All courses</Link>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
      </div>
      <CourseSelector courses={managed} courseId={courseId} basePath="/admin" />

      <div className="flex flex-wrap gap-2 border-b border-gray-300">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-4 font-medium capitalize ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
            {t}
          </button>
        ))}
      </div>

      {courseId && renderTab()}
    </div>
  );
};
