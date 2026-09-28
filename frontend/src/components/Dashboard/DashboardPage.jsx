import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCourses } from '../../hooks/useCourses';
import { useSocketEvents } from '../../hooks/useSocket';
import api from '../../utils/api';
import { cardCls } from '../../utils/constants';
import { AssignmentCard } from './AssignmentCard';
import { AnnouncementFeed } from './AnnouncementFeed';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { courses } = useCourses();
  const [dueThisWeek, setDueThisWeek] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, n] = await Promise.all([api.get('/assignments?due=week'), api.get('/announcements?limit=5')]);
      setDueThisWeek(a.data);
      setAnnouncements(n.data);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Any change to assignments/announcements/enrollment refreshes the dashboard live
  useSocketEvents(
    ['assignment:created', 'assignment:updated', 'assignment:deleted',
     'announcement:created', 'announcement:updated', 'announcement:deleted', 'course:updated'],
    load
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
      <p className="text-gray-600 mb-8">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 ${cardCls}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Due This Week</h2>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : dueThisWeek.length ? (
            <div className="space-y-4">
              {dueThisWeek.map((a) => <AssignmentCard key={a._id} assignment={a} />)}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No assignments due this week 🎉</p>
          )}
        </div>

        <div className="space-y-6">
          <div className={cardCls}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Courses</h3>
            {courses.length ? (
              <div className="space-y-2">
                {courses.slice(0, 6).map((c) => (
                  <Link key={c._id} to={`/contacts/${c._id}`}
                    className="block p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition">
                    <p className="font-semibold text-gray-900">{c.code}</p>
                    <p className="text-sm text-gray-600">{c.name}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">You are not enrolled in any course yet.</p>
            )}
          </div>
          <AnnouncementFeed announcements={announcements} />
        </div>
      </div>
    </div>
  );
};
