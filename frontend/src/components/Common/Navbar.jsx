import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';

const links = [
  ['/dashboard', 'Dashboard'],
  ['/assignments', 'Assignments'],
  ['/grades', 'Grades'],
  ['/contacts', 'Contacts'],
  ['/resources', 'Resources'],
];

export const Navbar = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const cls = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="font-extrabold text-blue-700 mr-4">EduPilot</span>
        {links.map(([to, text]) => (
          <NavLink key={to} to={to} className={cls}>{text}</NavLink>
        ))}
        {isStaff && <NavLink to="/admin" className={cls}>Admin</NavLink>}
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-gray-600">{user?.name} · {ROLE_LABELS[user?.role]}</span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
