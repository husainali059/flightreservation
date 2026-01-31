import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Key, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'preferences'>('account');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Settings
      </h1>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'account' as const, label: 'Account', icon: Key },
          { id: 'notifications' as const, label: 'Notifications', icon: Bell },
          { id: 'preferences' as const, label: 'Preferences', icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <div className="card space-y-6 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Account</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <p className="mt-1 text-slate-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Change password</label>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use the link sent to your email to reset password, or contact support.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card space-y-6 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notifications</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage how you receive booking confirmations, flight updates, and promotional offers.
            Notification preferences can be updated in your profile.
          </p>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="card space-y-6 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Preferences</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Language, currency, and display preferences can be configured here in a future update.
          </p>
        </div>
      )}
    </div>
  );
}
