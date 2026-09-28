import React, { useState, useEffect } from 'react';
import api, { errMsg } from '../../utils/api';
import { GRADE_COMPONENTS, cardCls, inputCls, btnCls } from '../../utils/constants';

export const GradesTab = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student: '', component: 'quiz', label: '', score: '', maxScore: 100, feedback: '' });
  const [csv, setCsv] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.get(`/courses/${courseId}/students`).then((r) => setStudents(r.data)).catch(() => {}); }, [courseId]);

  const flash = (m) => { setMsg(m); setError(''); setTimeout(() => setMsg(''), 4000); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/grades/${courseId}`, { ...form, score: Number(form.score), maxScore: Number(form.maxScore) });
      flash('Grade saved');
      setForm({ ...form, score: '', feedback: '' });
    } catch (err) { setError(errMsg(err)); }
  };

  const importCsv = async () => {
    // format per line: email,component,label,score,maxScore
    const rows = csv.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const [studentEmail, component, label, score, maxScore] = line.split(',').map((s) => s.trim());
      return { studentEmail, component, label, score, maxScore };
    });
    try {
      const { data } = await api.post('/admin/grades/import', { courseId, rows });
      flash(`Imported ${data.imported} grades${data.errors.length ? ` — ${data.errors.length} skipped: ${data.errors.slice(0, 3).join('; ')}` : ''}`);
      setCsv('');
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {msg && <p className="lg:col-span-2 p-3 bg-green-100 text-green-800 rounded">{msg}</p>}
      {error && <p className="lg:col-span-2 p-3 bg-red-100 text-red-800 rounded">{error}</p>}

      <form onSubmit={save} className={`${cardCls} space-y-3`}>
        <h2 className="text-xl font-bold">Post a grade</h2>
        <select required className={inputCls} value={form.student} onChange={set('student')}>
          <option value="">Select student…</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
        </select>
        <select className={`${inputCls} capitalize`} value={form.component} onChange={set('component')}>
          {GRADE_COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Label (e.g. Quiz 2)" className={inputCls} value={form.label} onChange={set('label')} />
        <div className="flex gap-2">
          <input required type="number" min="0" step="any" placeholder="Score" className={inputCls} value={form.score} onChange={set('score')} />
          <input required type="number" min="1" step="any" placeholder="Out of" className={inputCls} value={form.maxScore} onChange={set('maxScore')} />
        </div>
        <textarea rows="2" placeholder="Feedback (optional)" className={inputCls} value={form.feedback} onChange={set('feedback')} />
        <button className={`w-full ${btnCls}`}>Save grade</button>
      </form>

      <div className={`${cardCls} space-y-3 self-start`}>
        <h2 className="text-xl font-bold">Bulk import</h2>
        <p className="text-sm text-gray-600">One grade per line: <code>email,component,label,score,maxScore</code></p>
        <textarea rows="8" className={`${inputCls} font-mono text-sm`} value={csv} onChange={(e) => setCsv(e.target.value)}
          placeholder={'ali@university.edu,quiz,Quiz 1,8,10\nsara@university.edu,midterm,,42,50'} />
        <button onClick={importCsv} disabled={!csv.trim()} className={`w-full ${btnCls}`}>Import</button>
      </div>
    </div>
  );
};
