import { useState } from 'react';
import { Mail, MessageCircle, Phone } from 'lucide-react';

const faqs = [
  {
    category: 'Booking & Payments',
    items: [
      { q: 'How do I book a flight?', a: 'Use Search Flights to enter origin, destination, and dates. Select a flight and complete the checkout with passenger and payment details.' },
      { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, UPI, net banking, and digital wallets.' },
      { q: 'Is my payment secure?', a: 'Yes. All payments are processed through secure, PCI-compliant gateways.' },
    ],
  },
  {
    category: 'Cancellations & Refunds',
    items: [
      { q: 'How do I cancel a booking?', a: 'Go to My Bookings, open the booking, and click Cancel. Refund depends on the fare rules.' },
      { q: 'When will I get my refund?', a: 'Refunds are typically processed within 7–10 business days to the original payment method.' },
    ],
  },
  {
    category: 'Web Check-in',
    items: [
      { q: 'When can I check in online?', a: 'Web check-in is usually available 24–48 hours before departure.' },
      { q: 'Do I need to print my boarding pass?', a: 'You can use the digital boarding pass on your phone at most airports.' },
    ],
  },
];

export default function HelpPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredFaqs = faqs.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Help & Support
      </h1>

      <div className="card p-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Search help articles
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type your question..."
          className="input-field mt-2"
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">FAQ</h2>
        {filteredFaqs.map((cat) => (
          <div key={cat.category}>
            <h3 className="mb-3 font-medium text-slate-700 dark:text-slate-300">{cat.category}</h3>
            <div className="space-y-2">
              {cat.items.map((item, i) => {
                const key = `${cat.category}-${i}`;
                const isOpen = openKey === key;
                return (
                  <div key={key} className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-slate-900 dark:text-white"
                    >
                      {item.q}
                      <span className="text-slate-500">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card grid gap-6 p-6 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <Mail className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Email</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">support@flightreserve.com</p>
            <p className="text-xs text-slate-500">Response within 24 hours</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Phone className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Phone</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">+1 800 123 4567</p>
            <p className="text-xs text-slate-500">Mon–Fri 9am–6pm</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MessageCircle className="h-6 w-6 shrink-0 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Live chat</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Available on the website</p>
            <p className="text-xs text-slate-500">Quick answers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
