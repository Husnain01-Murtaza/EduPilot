import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { inputCls, btnCls } from '../../utils/constants';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');

  useEffect(() => clearError, [clearError]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.password.length < 8) return setLocalError('Password must be at least 8 characters');
    if (form.password !== form.confirm) return setLocalError('Passwords do not match');
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch {
      /* error is shown from the store */
    }
  };

  const shown = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Create account</h1>
        <p className="text-center text-gray-600 mb-8">Use your university email</p>

        {shown && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{shown}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Full name" className={inputCls} value={form.name} onChange={set('name')} />
          <input required type="email" placeholder="University email" className={inputCls} value={form.email} onChange={set('email')} />
          <input required type="password" placeholder="Password (min 8 characters)" className={inputCls} value={form.password} onChange={set('password')} />
          <input required type="password" placeholder="Confirm password" className={inputCls} value={form.confirm} onChange={set('confirm')} />
          <button type="submit" disabled={isLoading} className={`w-full ${btnCls}`}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already registered? <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
