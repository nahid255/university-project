import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  Pin,
  Calendar,
  Building,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { getNotices } from '../../services/noticeService';
import { Notice, NoticeCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const CATEGORIES: ('All' | NoticeCategory)[] = [
  'All',
  'Academic',
  'Examination',
  'Admission',
  'Events',
  'Scholarships',
  'General',
  'Emergency',
];

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const data = await getNotices(false);
        setNotices(data);
      } catch (e) {
        console.error('Failed to load notices', e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading official notices..." />;
  }

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (n.department && n.department.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="jstu-page-title flex items-center gap-3">
          <Bell className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>University Notice Board</span>
        </h1>
        <p className="jstu-secondary mt-1.5">
          Official announcements, academic schedules, events, and campus circulars
        </p>
      </div>

      {/* Category Filters & Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars by keyword, committee, or announcement title..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices found"
          description="There are currently no announcements matching your selected category or query."
        />
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => {
            const isEmergency = n.category === 'Emergency';

            return (
              <article
                key={n.id}
                className={`jstu-surface p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  n.isPinned
                    ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10'
                    : isEmergency
                    ? 'border-rose-300 dark:border-rose-800/70 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-sm">
                    {n.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[13px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <Pin className="w-3.5 h-3.5 fill-amber-600" />
                        Pinned
                      </span>
                    )}

                    <Badge
                      variant={
                        isEmergency
                          ? 'danger'
                          : n.category === 'Examination'
                          ? 'purple'
                          : n.category === 'Scholarships'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {n.category}
                    </Badge>

                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-4 h-4" />
                      {new Date(n.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {n.department && (
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Building className="w-4 h-4" />
                        {n.department}
                      </span>
                    )}
                  </div>

                  <Link to={`/notices/${n.id}`} className="block group">
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {n.title}
                    </h2>
                  </Link>

                  <p className="text-[15px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>

                  {n.attachmentName && (
                    <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-lg">
                      <FileText className="w-4 h-4" />
                      <span>{n.attachmentName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200/80 dark:border-slate-800">
                  <Link to={`/notices/${n.id}`} className="jstu-btn-secondary">
                    <span>Read Notice</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
