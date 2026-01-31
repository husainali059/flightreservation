import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get<{ profile?: { firstName: string; lastName: string; phone?: string } }>('/user/profile').then((res) => {
      if (res.success && res.data) {
        const p = (res.data as any).profile ?? res.data;
        setFirstName(p?.firstName ?? '');
        setLastName(p?.lastName ?? '');
        setPhone(p?.phone ?? '');
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const res = await api.put('/user/profile', { firstName, lastName, phone });
    setSaving(false);
    if (res.success) {
      setMessage('Profile updated.');
    } else {
      setMessage(res.error ?? 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      <p className="mt-1 text-gray-600 dark:text-gray-400">{user?.email}</p>
      <form onSubmit={handleSubmit} className="card mt-6 p-6">
        {message && (
          <div className={`rounded-lg p-3 text-sm ${message.includes('updated') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {message}
          </div>
        )}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input-field mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input-field mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field mt-1"
            />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary mt-6">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
