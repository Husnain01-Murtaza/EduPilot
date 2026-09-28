import React, { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../utils/api';
import { cardCls, inputCls, btnCls } from '../../utils/constants';

export const StudentsTab = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [emails, setEmails] = useState('');
  const [taEmail, setTaEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => api.get(`/courses/${courseId}/students`).then((r) => setStudents(r.data)), [courseId]);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const flash = (m) => { setMsg(m); setError(''); setTimeout(() => setMsg(''), 4000); };

  const enroll = async () => {
    const list = emails.split(/[\s,;]+/).filter(Boolean);
    try {
      const { data } = await api.post(`/courses/${courseId}/enroll`, { emails: list });
      flash(`Enrolled ${data.enrolled}${data.notFound.length ? `. Not registered yet: ${data.notFound.join(', ')}` : ''}`);
      setEmails('');
      load();
    } catch (err) { setError(errMsg(err)); }
  };

  const addTa = async () => {
    try {
      await api.post(`/courses/${courseId}/tas`, { email: taEmail });
      flash('TA added');
      setTaEmail('');
    } catch (err) { setError(errMsg(err)); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this student from the course?')) return;
    await api.delete(`/courses/${courseId}/students/${id}`);
    load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {msg && <p className="lg:col-span-3 p-3 bg-green-100 text-green-800 rounded">{msg}</p>}
      {error && <p className="lg:col-span-3 p-3 bg-red-100 text-red-800 rounded">{error}</p>}

      <div className="space-y-6">
        <div className={`${cardCls} space-y-3`}>
          <h2 className="text-xl font-bold">Enroll students</h2>
          <textarea rows="4" className={inputCls} placeholder="Student emails (comma or newline separated)" value={emails} onChange={(e) => setEmails(e.target.value)} />
          <button onClick={enroll} disabled={!emails.trim()} className={`w-full ${btnCls}`}>Enroll</button>
        </div>
        <div className={`${cardCls} space-y-3`}>
          <h2 className="text-xl font-bold">Add teaching assistant</h2>
          <input type="email" className={inputCls} placeholder="TA email (must be registered)" value={taEmail} onChange={(e) => setTaEmail(e.target.value)} />
          <button onClick={addTa} disabled={!taEmail} className={`w-full ${btnCls}`}>Add TA</button>
        </div>
      </div>

      <div className={`lg:col-span-2 ${cardCls}`}>
        <h2 className="text-xl font-bold mb-3">Roster ({students.length})</h2>
        <div className="divide-y">
          {students.map((s) => (
            <div key={s._id} className="py-2 flex justify-between text-sm">
              <span>{s.name} <span className="text-gray-500">· {s.email}</span></span>
              <button onClick={() => remove(s._id)} className="text-red-600 hover:text-red-800">Remove</button>
            </div>
          ))}
          {!students.length && <p className="text-gray-500">No students enrolled yet.</p>}
        </div>
      </div>
    </div>
  );
};
