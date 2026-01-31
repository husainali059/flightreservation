import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">General</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Website name, contact info, and defaults. Stored in environment variables in production.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Website Name</label>
            <input type="text" defaultValue="FlightReserve" className="input-field" placeholder="FlightReserve" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Support Email</label>
            <input type="email" defaultValue="support@flightreserve.com" className="input-field" placeholder="support@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
            <select className="input-field">
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <button type="button" disabled={saving} onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); toast.success('Settings saved (demo)'); }, 500); }} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cancellation & Refund Policy</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure refund percentages by time before departure.</p>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>More than 7 days: 90% refund</li>
          <li>3–7 days: 50% refund</li>
          <li>Less than 3 days: 25% refund</li>
          <li>No-show: 0% refund</li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">Full policy editor can be added in CMS section.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Gateways</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Stripe and Razorpay keys are configured via server environment variables (.env).</p>
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET</p>
      </div>
    </div>
  );
}
