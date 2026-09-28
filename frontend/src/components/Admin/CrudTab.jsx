import React, { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../../utils/api';
import { useSocketEvents } from '../../hooks/useSocket';
import { cardCls, inputCls, btnCls } from '../../utils/constants';

/**
 * Generic list + create form + delete.
 * fields: [{ name, label, type: text|textarea|select|number|datetime-local|url|checkbox, options?, required? }]
 */
export const CrudTab = ({ courseId, title, listUrl, createUrl, deleteUrl, fields, events, renderItem, initial = {} }) => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get(listUrl);
    setItems(data);
  }, [listUrl]);

  useEffect(() => { load().catch(() => setItems([])); }, [load]);
  useSocketEvents(events, (p) => { if (!p?.courseId || p.courseId === courseId) load(); });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { ...form };
      fields.forEach((f) => { if (f.type === 'datetime-local' && payload[f.name]) payload[f.name] = new Date(payload[f.name]).toISOString(); });
      await api.post(createUrl, payload);
      setForm(initial);
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(deleteUrl(item));
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const setField = (f) => (e) =>
    setForm({ ...form, [f.name]: f.type === 'checkbox' ? e.target.checked : e.target.value });

  const renderField = (f) => {
    const common = { className: inputCls, required: f.required, value: form[f.name] ?? '', onChange: setField(f) };
    if (f.type === 'textarea') return <textarea rows="3" {...common} />;
    if (f.type === 'select') {
      return (
        <select {...common}>
          <option value="">Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
        </select>
      );
    }
    if (f.type === 'checkbox') return <input type="checkbox" checked={!!form[f.name]} onChange={setField(f)} />;
    return <input type={f.type || 'text'} {...common} />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={submit} className={`${cardCls} space-y-3 self-start`}>
        <h2 className="text-xl font-bold text-gray-900">Add {title}</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            {renderField(f)}
          </div>
        ))}
        <button disabled={busy} className={`w-full ${btnCls}`}>{busy ? 'Saving…' : 'Create'}</button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">{title} list</h2>
        {items.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow p-4 flex justify-between gap-4">
            <div className="min-w-0">{renderItem(item)}</div>
            <button onClick={() => remove(item)} className="text-red-600 hover:text-red-800 text-sm font-medium self-start">Delete</button>
          </div>
        ))}
        {!items.length && <p className="text-gray-500">Nothing here yet.</p>}
      </div>
    </div>
  );
};
