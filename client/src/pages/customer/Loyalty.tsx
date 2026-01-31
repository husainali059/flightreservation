import { useEffect, useState } from 'react';
import { customerAPI } from '../../api/customerAPI';
import type { LoyaltyPointsData, LoyaltyTransactionItem } from '../../types/customer';
import { Gift, TrendingUp, Award } from 'lucide-react';

export default function Loyalty() {
  const [points, setPoints] = useState<LoyaltyPointsData | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customerAPI.getLoyaltyPoints().then((r) => r.success && r.data && setPoints(r.data)),
      customerAPI.getLoyaltyTransactions(20).then((r) => r.success && r.data && setTransactions(Array.isArray(r.data) ? r.data : [])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Loyalty & Rewards
      </h1>

      <div className="card flex flex-col items-center p-8 text-center sm:flex-row sm:justify-around sm:text-left">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40">
            <Gift className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Points balance</p>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {points?.pointsBalance ?? 0}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-8 sm:mt-0">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total earned</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              {points?.totalEarned ?? 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total redeemed</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              {points?.totalRedeemed ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
          <TrendingUp className="h-5 w-5" />
          How to earn points
        </h2>
        <ul className="space-y-2 text-slate-600 dark:text-slate-400">
          <li>• Book flights: earn 1 point per $1 spent</li>
          <li>• Complete profile: +100 points</li>
          <li>• Refer a friend: +200 points per referral</li>
          <li>• Write a review: +50 points</li>
        </ul>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
          <Award className="h-5 w-5" />
          Points history
        </h2>
        {transactions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-left font-medium text-slate-700 dark:text-slate-300">Date</th>
                  <th className="pb-3 text-left font-medium text-slate-700 dark:text-slate-300">Description</th>
                  <th className="pb-3 text-right font-medium text-slate-700 dark:text-slate-300">Points</th>
                  <th className="pb-3 text-right font-medium text-slate-700 dark:text-slate-300">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">{t.description ?? t.type}</td>
                    <td className="py-3 text-right font-medium">
                      <span className={t.points >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {t.points >= 0 ? '+' : ''}{t.points}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
