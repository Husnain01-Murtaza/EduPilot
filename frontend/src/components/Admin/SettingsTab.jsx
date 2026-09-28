import React, { useState, useEffect } from 'react';
import api, { errMsg } from '../../utils/api';
import { GRADE_COMPONENTS, cardCls, inputCls, btnCls } from '../../utils/constants';

// Grade weights drive the weighted course percentage / GPA shown to students
export const SettingsTab = ({ courseId }) => {
  const [weights, setWeights] = useState({});
  const [credits, setCredits] = useState(3);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/courses/${courseId}`).then(({ data }) => {
      setWeights(data.gradeWeights || {});
      setCredits(data.creditHours);
    });
  }, [courseId]);

  const total = GRADE_COMPONENTS.reduce((n, c) => n + (Number(weights[c]) || 0), 0);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/courses/${courseId}`, { gradeWeights: weights, creditHours: Number(credits) });
      setMsg('Saved');
    } catch (err) { setMsg(errMsg(err)); }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <form onSubmit={save} className={`${cardCls} max-w-md space-y-3`}>
      <h2 className="text-xl font-bold">Grading settings</h2>
      <p className="text-sm text-gray-600">Relative weights per component (ideally summing to 100). Currently: {total}</p>
      {GRADE_COMPONENTS.map((c) => (
        <div key={c} className="flex items-center gap-3">
          <label className="w-28 capitalize text-sm">{c}</label>
          <input type="number" min="0" max="100" className={inputCls} value={weights[c] ?? ''} onChange={(e) => setWeights({ ...weights, [c]: e.target.value })} />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <label className="w-28 text-sm">Credit hours</label>
        <input type="number" min="0" className={inputCls} value={credits} onChange={(e) => setCredits(e.target.value)} />
      </div>
      <button className={`w-full ${btnCls}`}>Save</button>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
    </form>
  );
};
