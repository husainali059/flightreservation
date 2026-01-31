import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} FlightReserve. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
