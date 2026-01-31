import SearchForm from '../components/SearchForm';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Hero gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/5 dark:from-primary-600/20 dark:to-primary-800/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-400/5 to-transparent dark:from-primary-500/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Book flights{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              easily
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Compare prices, choose your flight, and travel with confidence. Best deals on domestic and international routes.
          </p>
        </div>

        <div className="card card-hover mx-auto mt-10 max-w-4xl p-6 shadow-lg sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-slate-800 dark:text-slate-200">
            Where would you like to go?
          </h2>
          <SearchForm redirectToSearch />
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="card card-hover p-6 text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">1000+</div>
            <p className="mt-2 font-medium text-slate-600 dark:text-slate-400">Daily flights</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Across 50+ destinations</p>
          </div>
          <div className="card card-hover p-6 text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">Best</div>
            <p className="mt-2 font-medium text-slate-600 dark:text-slate-400">Price guarantee</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Transparent pricing</p>
          </div>
          <div className="card card-hover p-6 text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">24/7</div>
            <p className="mt-2 font-medium text-slate-600 dark:text-slate-400">Support</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">We're here to help</p>
          </div>
        </div>
      </div>
    </div>
  );
}
