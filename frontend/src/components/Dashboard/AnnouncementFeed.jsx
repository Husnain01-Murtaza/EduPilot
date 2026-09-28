import React from 'react';
import { cardCls } from '../../utils/constants';

export const AnnouncementFeed = ({ announcements }) => (
  <div className={cardCls}>
    <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h3>
    {announcements.length ? (
      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a._id} className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded">
            <h4 className="font-semibold text-gray-900 text-sm">
              {a.isPinned && '📌 '}{a.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">{a.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {a.course?.code} · {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500 text-center py-4">No announcements yet</p>
    )}
  </div>
);
