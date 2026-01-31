import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.post<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/login', {
      email,
      password,
    });
    setLoading(false);
    if (res.success && res.data) {
      const d = res.data as { user: { role?: string }; accessToken: string; refreshToken: string };
      setAuth(d.user as Parameters<typeof setAuth>[0], d.accessToken, d.refreshToken);
      if (d.user?.role === 'ADMIN' || d.user?.role === 'AGENT') navigate('/admin');
      else if (d.user?.role === 'CUSTOMER') navigate('/dashboard');
      else navigate('/');
    } else {
      setError(res.error ?? 'Login failed');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Log in</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          New here?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            Create an account
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
