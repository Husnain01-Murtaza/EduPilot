import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../utils/api';
import { useCourses } from '../../hooks/useCourses';
import { cardCls, inputCls, btnCls } from '../../utils/constants';

export const AdminHome = () => {
  const { courses, refetch } = useCourses();
  const [form, setForm] = useState({ name: '', code: '', semester: '', creditHours: 3 });
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/courses', form);
      setForm({ name: '', code: '', semester: '', creditHours: 3 });
      refetch();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const managed = courses.filter((c) => c.myRole !== 'student');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <form onSubmit={create} className={`${cardCls} space-y-3`}>
          <h2 className="text-xl font-bold">Create course</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <input required placeholder="Course name" className={inputCls} value={form.name} onChange={set('name')} />
          <input required placeholder="Code (e.g. CS101)" className={inputCls} value={form.code} onChange={set('code')} />
          <input required placeholder="Semester (e.g. Fall 2026)" className={inputCls} value={form.semester} onChange={set('semester')} />
          <input type="number" min="0" placeholder="Credit hours" className={inputCls} value={form.creditHours} onChange={set('creditHours')} />
          <button className={`w-full ${btnCls}`}>Create</button>
        </form>

        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2 content-start">
          {managed.map((c) => (
            <Link key={c._id} to={`/admin/${c._id}`} className={`${cardCls} hover:shadow-lg transition`}>
              <p className="font-bold text-gray-900">{c.code}</p>
              <p className="text-gray-600">{c.name}</p>
              <p className="text-xs text-gray-500 mt-2">{c.semester} · {c.studentCount} students</p>
            </Link>
          ))}
          {!managed.length && <p className="text-gray-500">You don't manage any courses yet.</p>}
        </div>
      </div>
    </div>
  );
};
