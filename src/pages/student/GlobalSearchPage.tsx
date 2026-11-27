import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Globe,
  Search,
  Bell,
  BookOpen,
  Users,
  ShoppingBag,
  BookCopy,
  CalendarHeart,
  Award,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';
import {
  globalSearch,
  GlobalSearchResults,
  EMPTY_SEARCH_RESULTS,
} from '../../services/searchService';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

type SearchTab =
  | 'all'
  | 'notices'
  | 'resources'
  | 'posts'
  | 'marketplace'
  | 'books'
  | 'events'
  | 'clubs'
  | 'students';

export const GlobalSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY_SEARCH_RESULTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQueryInput(q);
    if (!q.trim()) {
      setResults(EMPTY_SEARCH_RESULTS);
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        const res = await globalSearch(q);
        setResults(res);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(queryInput.trim() ? { q: queryInput.trim() } : {});
  };

  const totalCount =
    results.notices.length +
    results.resources.length +
    results.posts.length +
    results.marketplace.length +
    results.books.length +
    results.events.length +
    results.clubs.length +
    results.students.length;

  const tabs: { key: SearchTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Results', count: totalCount },
    { key: 'notices', label: 'Notices', count: results.notices.length },
    { key: 'resources', label: 'Resources', count: results.resources.length },
    { key: 'posts', label: 'Community', count: results.posts.length },
    { key: 'marketplace', label: 'Marketplace', count: results.marketplace.length },
    { key: 'books', label: 'Books', count: results.books.length },
    { key: 'events', label: 'Events', count: results.events.length },
    { key: 'clubs', label: 'Clubs', count: results.clubs.length },
    { key: 'students', label: 'Students', count: results.students.length },
  ];

  const showSection = (key: Exclude<SearchTab, 'all'>) =>
    (activeTab === 'all' || activeTab === key) && results[key].length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <div>
        <h1 className="jstu-page-title flex items-center gap-3">
          <Globe className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Campus Global Search</span>
        </h1>
        <p className="jstu-secondary mt-1.5">
          Search across notices, study resources, community posts, marketplace, books, events, clubs, and student profiles
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Try 'Algorithms', 'Calculator', 'Robotics', 'CSE', or a classmate's name..."
            className="jstu-input pl-11 min-h-[48px] text-base"
          />
        </div>
        <button type="submit" className="jstu-btn-primary min-h-[48px] px-6">
          Search
        </button>
      </form>

      {/* Filter Tabs */}
      {searchParams.get('q') && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold shrink-0 border transition-colors tabular-nums ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Searching campus modules..." />
      ) : !searchParams.get('q') ? (
        <EmptyState
          icon={Search}
          title="Search across JSTU Campus"
          description="Enter a keyword, course code, book title, club name, or student name above."
        />
      ) : totalCount === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches found"
          description={`We couldn't find any campus records matching "${searchParams.get('q')}".`}
        />
      ) : (
        <div className="space-y-6">
          {showSection('notices') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" /> Notices ({results.notices.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.notices.map((n) => (
                  <Link
                    key={n.id}
                    to={`/notices/${n.id}`}
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {n.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.category}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('resources') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Study Resources ({results.resources.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.resources.map((r) => (
                  <Link
                    key={r.id}
                    to={`/resources/${r.id}`}
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {r.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {r.courseCode} &middot; {r.category}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('posts') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Community Posts ({results.posts.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.posts.map((p) => (
                  <Link
                    key={p.id}
                    to="/community"
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {p.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        by {p.authorName} &middot; {p.category}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('marketplace') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" /> Marketplace ({results.marketplace.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.marketplace.map((m) => (
                  <Link
                    key={m.id}
                    to="/marketplace"
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 tabular-nums">
                        {m.title} &mdash; ${m.price}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {m.category} &middot; {m.condition} &middot; {m.status}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('books') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookCopy className="w-4 h-4 text-emerald-600" /> Book Exchange ({results.books.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.books.map((b) => (
                  <Link
                    key={b.id}
                    to="/books"
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {b.title} by {b.author}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {b.subjectDepartment} &middot; {b.listingType}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('events') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CalendarHeart className="w-4 h-4 text-purple-600" /> Campus Events ({results.events.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.events.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/events"
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {ev.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {ev.date} &middot; {ev.location}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('clubs') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Student Clubs ({results.clubs.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.clubs.map((c) => (
                  <Link
                    key={c.id}
                    to="/clubs"
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {c.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {c.category} &middot; {c.memberCount} members
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showSection('students') && (
            <section className="jstu-surface p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" /> Student Profiles ({results.students.length})
              </h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {results.students.map((s) => (
                  <Link
                    key={s.uid}
                    to={`/students/${s.uid}`}
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {s.fullName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.department} &middot; <span className="font-mono">{s.studentId}</span> &middot; {s.batch}
                      </p>
                    </div>
                    <Badge variant="primary" size="sm">
                      View Profile
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
