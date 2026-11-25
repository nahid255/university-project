import React, { useEffect, useState } from 'react';
import {
  Flag,
  Users,
  EyeOff,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getReports, updateReportStatus } from '../../services/reportService';
import { getPosts, updatePost, deletePost } from '../../services/communityService';
import { deleteMarketplaceListing, deleteBookListing } from '../../services/marketplaceService';
import { ContentReport, CommunityPost, ReportStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { logActivity } from '../../services/adminService';

export const AdminModerationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'posts'>('reports');
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [repList, postList] = await Promise.all([
        getReports(),
        getPosts({ includeHidden: true, limitCount: 100 }),
      ]);
      setReports(repList);
      setPosts(postList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveReport = async (
    report: ContentReport,
    status: ReportStatus,
    actionTaken: string,
    removeTarget: boolean = false
  ) => {
    if (!currentUser) return;
    if (removeTarget) {
      try {
        if (report.targetType === 'post') {
          await updatePost(report.targetId, { status: 'hidden' });
        } else if (report.targetType === 'marketplace') {
          await deleteMarketplaceListing(report.targetId);
        } else if (report.targetType === 'book') {
          await deleteBookListing(report.targetId);
        }
      } catch (e) {
        console.warn('Target removal skipped or already deleted:', e);
      }
    }

    const updated = await updateReportStatus(
      report.id,
      status,
      actionTaken,
      currentUser.fullName
    );
    logActivity({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      action: `Marked report ${status}`,
      target: report.targetTitle,
      type: 'admin',
    });
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (removeTarget) {
      await loadData();
    }
  };

  const handleTogglePostVisibility = async (post: CommunityPost) => {
    if (!currentUser) return;
    const nextStatus = post.status === 'active' ? 'hidden' : 'active';
    const updated = await updatePost(post.id, { status: nextStatus });
    logActivity({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      action: nextStatus === 'hidden' ? 'Hid community post' : 'Restored community post',
      target: post.title,
      type: 'admin',
    });
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePost = async (post: CommunityPost) => {
    if (!currentUser) return;
    await deletePost(post.id);
    logActivity({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      action: 'Deleted community post',
      target: post.title,
      type: 'admin',
    });
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  if (loading) {
    return <LoadingSpinner label="Loading moderation console..." />;
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      r.targetTitle.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.reporterName.toLowerCase().includes(q)
    );
  });

  const filteredPosts = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Flag className="w-6 h-6 text-rose-600" />
          <span>Community &amp; Content Moderation</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review student abuse reports and moderate community discussions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-bold relative ${
            activeTab === 'reports' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <span>Reports Queue ({reports.filter((r) => r.status === 'pending').length} pending)</span>
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-sm font-bold relative ${
            activeTab === 'posts' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <span>Community Posts ({posts.length})</span>
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, reporter, or author..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        {activeTab === 'reports' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReportStatus)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        )}
      </div>

      {activeTab === 'reports' ? (
        filteredReports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No reports in queue"
            description="All reported items matching your filter have been addressed."
          />
        ) : (
          <div className="space-y-3">
            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="purple" size="sm">
                      {rep.targetType}
                    </Badge>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {rep.targetTitle}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      rep.status === 'resolved'
                        ? 'success'
                        : rep.status === 'dismissed'
                        ? 'neutral'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {rep.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>
                    <strong>Reason:</strong> {rep.reason} &bull;{' '}
                    <span className="text-slate-400">Reported by {rep.reporterName}</span>
                  </p>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    {rep.details}
                  </p>
                  {rep.actionTaken && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Action taken: {rep.actionTaken} ({rep.reviewedBy})
                    </p>
                  )}
                </div>

                {rep.status === 'pending' && (
                  <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() =>
                        handleResolveReport(rep, 'dismissed', 'Reviewed — no policy violation')
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() =>
                        handleResolveReport(rep, 'resolved', 'Warning issued / Resolved')
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                    {(rep.targetType === 'post' ||
                      rep.targetType === 'marketplace' ||
                      rep.targetType === 'book') && (
                      <button
                        onClick={() =>
                          handleResolveReport(
                            rep,
                            'resolved',
                            'Target content hidden/removed by moderator',
                            true
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Target &amp; Resolve</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={post.status === 'active' ? 'success' : 'warning'} size="sm">
                    {post.status}
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {post.category}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500">
                  By {post.authorName} &bull; {new Date(post.createdAt).toLocaleDateString()} &bull;{' '}
                  {post.likesCount} likes, {post.commentsCount} comments
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePostVisibility(post)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                >
                  {post.status === 'active' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeletePost(post)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
