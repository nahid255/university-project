import React, { useEffect, useState } from 'react';
import {
  Flag,
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

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Community &amp; Content Moderation</h1>
        <p className="jstu-secondary">
          Review student abuse reports and moderate community discussions across the campus platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3.5 text-[15px] font-semibold relative whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'reports'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span className="tabular-nums">Reports Queue ({pendingReportsCount} pending)</span>
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3.5 text-[15px] font-semibold relative whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'posts'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span className="tabular-nums">Community Posts ({posts.length})</span>
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="jstu-surface p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, reporter, or author..."
            className="jstu-input pl-11"
          />
        </div>

        {activeTab === 'reports' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ReportStatus)}
            className="jstu-select sm:w-52"
            aria-label="Filter reports by status"
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
          <div className="space-y-4">
            {filteredReports.map((rep) => (
              <div key={rep.id} className="jstu-surface p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    <Badge variant="purple" size="sm">
                      {rep.targetType}
                    </Badge>
                    <h3 className="jstu-card-title truncate">{rep.targetTitle}</h3>
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

                <div className="space-y-3">
                  <p className="jstu-secondary">
                    <strong className="font-semibold text-slate-900 dark:text-slate-100">
                      Reason:
                    </strong>{' '}
                    {rep.reason} &middot;{' '}
                    <span className="jstu-meta">Reported by {rep.reporterName}</span>
                  </p>
                  <p className="jstu-inset p-4 jstu-secondary">{rep.details}</p>
                  {rep.actionTaken && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                      Action taken: {rep.actionTaken} ({rep.reviewedBy})
                    </p>
                  )}
                </div>

                {rep.status === 'pending' && (
                  <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                    <button
                      onClick={() =>
                        handleResolveReport(rep, 'dismissed', 'Reviewed — no policy violation')
                      }
                      className="jstu-btn-secondary"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() =>
                        handleResolveReport(rep, 'resolved', 'Warning issued / Resolved')
                      }
                      className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
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
                        className="jstu-btn-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Target &amp; Resolve</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No matching community posts"
          description="No community discussions match your current search filter."
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="jstu-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={post.status === 'active' ? 'success' : 'warning'} size="sm">
                    {post.status}
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {post.category}
                  </Badge>
                </div>
                <h3 className="jstu-card-title truncate">{post.title}</h3>
                <p className="jstu-meta tabular-nums">
                  By {post.authorName} &middot; {new Date(post.createdAt).toLocaleDateString()} &middot;{' '}
                  {post.likesCount} likes, {post.commentsCount} comments
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handleTogglePostVisibility(post)}
                  className="jstu-btn-secondary"
                >
                  {post.status === 'active' ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Restore</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeletePost(post)}
                  className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete post"
                  aria-label={`Delete post ${post.title}`}
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
