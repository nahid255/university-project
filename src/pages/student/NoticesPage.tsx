import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Search,
  Filter,
  Pin,
  Calendar,
  Building,
  FileText,
  Download,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>University Notice Board</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official announcements, academic schedules, events, and campus circulars
          </p>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars by keyword, committee, or announcement title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notices Grid */}
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
              <div
                key={n.id}
                className={`p-6 rounded-3xl bg-white dark:bg-[#111C32] border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  n.isPinned
                    ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/15'
                    : isEmergency
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/15'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <Pin className="w-3 h-3 fill-amber-600" />
                        PINNED
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

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(n.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {n.department && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {n.department}
                      </span>
                    )}
                  </div>

                  <Link to={`/notices/${n.id}`} className="block group">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {n.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>

                  {n.attachmentName && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{n.attachmentName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/notices/${n.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 dark:text-slate-200 dark:hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <span>Read Notice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
