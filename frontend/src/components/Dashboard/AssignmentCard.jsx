import React from 'react';
import { label } from '../../utils/constants';

const COLORS = {
  overdue: 'border-l-4 border-red-500 bg-red-50',
  due_soon: 'border-l-4 border-yellow-500 bg-yellow-50',
  upcoming: 'border-l-4 border-blue-500 bg-blue-50',
};
const BADGES = {
  overdue: 'bg-red-200 text-red-800',
  due_soon: 'bg-yellow-200 text-yellow-800',
  upcoming: 'bg-blue-200 text-blue-800',
};

export const urgencyOf = (dueDate) => {
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  return { days, urgency: days < 0 ? 'overdue' : days <= 3 ? 'due_soon' : 'upcoming' };
};

export const AssignmentCard = ({ assignment }) => {
  const { days, urgency } = urgencyOf(assignment.dueDate);
  return (
    <div className={`p-4 rounded-lg ${COLORS[urgency]}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {assignment.course?.code} · <span className="capitalize">{label(assignment.type)}</span>
            {assignment.weight ? ` · ${assignment.weight}%` : ''}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${BADGES[urgency]}`}>
          {days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{new Date(assignment.dueDate).toLocaleString()}</p>
    </div>
  );
};
