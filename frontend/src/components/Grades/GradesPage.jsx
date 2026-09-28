import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useCourses } from '../../hooks/useCourses';
import { useSocketEvents } from '../../hooks/useSocket';
import { CourseSelector } from '../Common/CourseSelector';
import { cardCls, inputCls, btnCls, label } from '../../utils/constants';
import { percentToGpa, weightedPercentage, cgpaFrom } from '../../utils/gpa';

const barColor = (p) => (p >= 85 ? 'bg-green-500' : p >= 70 ? 'bg-blue-500' : p >= 55 ? 'bg-yellow-500' : 'bg-red-500');

const CourseGrades = ({ courseId }) => {
  const [data, setData] = useState(null);
  const [whatIf, setWhatIf] = useState({});

  const load = useCallback(async () => {
    const res = await api.get(`/grades/${courseId}`);
    setData(res.data);
    setWhatIf({});
  }, [courseId]);

  useEffect(() => { load().catch(() => setData(null)); }, [load]);
  useSocketEvents('grade:updated', (p) => { if (!p.courseId || p.courseId === courseId) load(); });

  if (!data) return <p className="text-gray-500">Loading grades...</p>;
  if (data.staffView) {
    return <p className="text-gray-600">You are staff for this course. Manage grades in the <Link className="text-blue-600 underline" to={`/admin/${courseId}`}>Admin panel</Link>.</p>;
  }

  const { grades, componentAverages, weights, percentage, gpa } = data;
  const components = [...new Set([...Object.keys(componentAverages), ...Object.keys(weights || {}).filter((k) => weights[k] > 0)])];
  const merged = Object.fromEntries(components.map((c) => [c, whatIf[c] !== undefined && whatIf[c] !== '' ? Number(whatIf[c]) : componentAverages[c] ?? 0]));
  const projected = weightedPercentage(merged, weights);
  const changed = Object.keys(whatIf).some((k) => whatIf[k] !== '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className={`lg:col-span-2 ${cardCls}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Grades</h2>
        {grades.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left">
                  <th className="p-3">Component</th><th className="p-3">Item</th>
                  <th className="p-3 text-center">Score</th><th className="p-3 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => {
                  const p = (g.score / g.maxScore) * 100;
                  return (
                    <tr key={g._id} className="border-b border-gray-200">
                      <td className="p-3 capitalize">{label(g.component)}</td>
                      <td className="p-3 text-gray-600">{g.label || g.assignment?.title || '—'}</td>
                      <td className="p-3 text-center font-medium">{g.score}/{g.maxScore}</td>
                      <td className="p-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-white font-medium ${barColor(p)}`}>{p.toFixed(1)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No grades posted yet</p>
        )}

        {components.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="font-bold text-gray-900 mb-1">What-if simulator</h3>
            <p className="text-sm text-gray-600 mb-4">Type a hypothetical average (0-100) for any component to see the projected result.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {components.map((c) => (
                <div key={c}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {label(c)} {weights?.[c] ? `(${weights[c]})` : ''}
                  </label>
                  <input type="number" min="0" max="100" className={inputCls}
                    placeholder={componentAverages[c] !== undefined ? componentAverages[c].toFixed(1) : 'not graded'}
                    value={whatIf[c] ?? ''} onChange={(e) => setWhatIf({ ...whatIf, [c]: e.target.value })} />
                </div>
              ))}
            </div>
            {changed && (
              <p className="mt-4 text-lg">
                Projected: <b>{projected.toFixed(1)}%</b> → GPA <b>{percentToGpa(projected).toFixed(2)}</b>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
          <p className="text-sm opacity-90">Course GPA</p>
          <p className="text-5xl font-bold mt-2">{gpa.toFixed(2)}</p>
          <p className="text-sm mt-2 opacity-90">{percentage.toFixed(1)}% overall</p>
        </div>
        <div className={cardCls}>
          <h3 className="font-bold text-gray-900 mb-4">Component Averages</h3>
          <div className="space-y-3">
            {Object.entries(componentAverages).map(([c, avg]) => (
              <div key={c}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="capitalize font-medium text-gray-700">{label(c)}</span>
                  <span className="font-bold">{avg.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${barColor(avg)}`} style={{ width: `${Math.min(avg, 100)}%` }} />
                </div>
              </div>
            ))}
            {!Object.keys(componentAverages).length && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const CgpaTab = () => {
  const [data, setData] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [extra, setExtra] = useState([]);
  const [draft, setDraft] = useState({ credits: 3, percentage: '' });

  const load = useCallback(() => api.get('/grades/me/cgpa').then((r) => setData(r.data)), []);
  useEffect(() => { load().catch(() => {}); }, [load]);
  useSocketEvents('grade:updated', load);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  const rows = data.courses.map((c) => ({
    ...c,
    percentage: overrides[c.courseId] !== undefined && overrides[c.courseId] !== '' ? Number(overrides[c.courseId]) : c.percentage,
  }));
  const projected = cgpaFrom([...rows, ...extra]);
  const modified = Object.values(overrides).some((v) => v !== '') || extra.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className={`lg:col-span-2 ${cardCls}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CGPA What-if Calculator</h2>
        <p className="text-sm text-gray-600 mb-4">Edit a course percentage or add a hypothetical course to see the effect on your CGPA.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 text-left"><th className="p-2">Course</th><th className="p-2">Credits</th><th className="p-2">Current %</th><th className="p-2">What-if %</th></tr>
          </thead>
          <tbody>
            {data.courses.map((c) => (
              <tr key={c.courseId} className="border-b">
                <td className="p-2">{c.code}</td>
                <td className="p-2">{c.credits}</td>
                <td className="p-2">{c.percentage.toFixed(1)}</td>
                <td className="p-2 w-32">
                  <input type="number" min="0" max="100" className={inputCls} value={overrides[c.courseId] ?? ''}
                    onChange={(e) => setOverrides({ ...overrides, [c.courseId]: e.target.value })} />
                </td>
              </tr>
            ))}
            {extra.map((x, i) => (
              <tr key={i} className="border-b bg-purple-50">
                <td className="p-2">Hypothetical</td><td className="p-2">{x.credits}</td><td className="p-2">—</td>
                <td className="p-2">{x.percentage}% <button className="text-red-600 ml-2" onClick={() => setExtra(extra.filter((_, j) => j !== i))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-2 mt-4 items-end">
          <div><label className="text-xs text-gray-600">Credits</label>
            <input type="number" min="1" className={inputCls} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: e.target.value })} /></div>
          <div><label className="text-xs text-gray-600">Expected %</label>
            <input type="number" min="0" max="100" className={inputCls} value={draft.percentage} onChange={(e) => setDraft({ ...draft, percentage: e.target.value })} /></div>
          <button className={btnCls} disabled={draft.percentage === ''}
            onClick={() => { setExtra([...extra, { credits: Number(draft.credits) || 3, percentage: Number(draft.percentage) }]); setDraft({ credits: 3, percentage: '' }); }}>
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6 text-center">
          <p className="text-sm opacity-90">Current CGPA</p>
          <p className="text-5xl font-bold mt-2">{data.cgpa.toFixed(2)}</p>
          <p className="text-xs mt-2 opacity-80">{data.totalCredits} credit hours</p>
        </div>
        {modified && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6 text-center">
            <p className="text-sm opacity-90">Projected CGPA</p>
            <p className="text-5xl font-bold mt-2">{projected.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const GradesPage = () => {
  const { courseId } = useParams();
  const { courses } = useCourses();
  const [tab, setTab] = useState('course');

  const tabCls = (t) => `pb-2 px-4 font-medium ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Grades & GPA</h1>
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        <button className={tabCls('course')} onClick={() => setTab('course')}>Course Grades</button>
        <button className={tabCls('cgpa')} onClick={() => setTab('cgpa')}>CGPA Calculator</button>
      </div>

      {tab === 'course' ? (
        <div className="space-y-6">
          <CourseSelector courses={courses} courseId={courseId} basePath="/grades" />
          {courseId && <CourseGrades key={courseId} courseId={courseId} />}
        </div>
      ) : (
        <CgpaTab />
      )}
    </div>
  );
};
