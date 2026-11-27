import React, { useEffect, useState } from 'react';
import {
  Award,
  Search,
  Users,
  ShieldCheck,
  Bell,
  Edit3,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getClubs,
  getUserMemberships,
  getClubMemberships,
  requestClubMembership,
  reviewClubMembership,
  publishClubAnnouncement,
  updateClub,
} from '../../services/clubService';
import { Club, ClubMembership, ClubCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sanitizeUrl } from '../../utils/url';

const CATEGORIES: ('All' | ClubCategory)[] = [
  'All',
  'Technology',
  'Academic',
  'Cultural',
  'Sports',
  'Social Impact',
  'Arts & Media',
  'Other',
];

export const ClubsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myMemberships, setMyMemberships] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Selected Club Modal
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubRequests, setClubRequests] = useState<ClubMembership[]>([]);
  const [joinReason, setJoinReason] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // Manager Tools inside Club Modal
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [editingInfo, setEditingInfo] = useState(false);
  const [editTagline, setEditTagline] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [clubList, memberships] = await Promise.all([
        getClubs(),
        getUserMemberships(currentUser.uid),
      ]);
      setClubs(clubList);
      setMyMemberships(memberships);
    } catch (e) {
      console.error('Failed to load clubs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const openClubModal = async (club: Club) => {
    setSelectedClub(club);
    setJoinReason('');
    setJoinError(null);
    setEditingInfo(false);
    setEditTagline(club.tagline);
    setEditDesc(club.description);

    const canManage =
      currentUser?.role === 'admin' || club.managerIds.includes(currentUser?.uid || '');
    if (canManage) {
      const reqs = await getClubMemberships(club.id);
      setClubRequests(reqs);
    } else {
      setClubRequests([]);
    }
  };

  const handleRequestMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClub) return;
    setJoinError(null);
    if (!joinReason.trim()) {
      setJoinError('Please share why you want to join this club.');
      return;
    }

    try {
      setSubmittingJoin(true);
      const created = await requestClubMembership(selectedClub, currentUser, joinReason);
      setMyMemberships((prev) => [created, ...prev.filter((m) => m.id !== created.id)]);
      setJoinReason('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleReviewMembership = async (
    membership: ClubMembership,
    status: 'approved' | 'rejected'
  ) => {
    if (!selectedClub) return;
    const updated = await reviewClubMembership(membership, status, selectedClub);
    setClubRequests((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    await loadData();
    const refreshedClub = (await getClubs()).find((c) => c.id === selectedClub.id);
    if (refreshedClub) setSelectedClub(refreshedClub);
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClub || !annTitle.trim() || !annContent.trim()) return;
    const updated = await publishClubAnnouncement(
      selectedClub,
      currentUser,
      annTitle.trim(),
      annContent.trim()
    );
    setSelectedClub(updated);
    setClubs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setAnnTitle('');
    setAnnContent('');
  };

  const handleSaveClubInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    const updated = await updateClub(selectedClub.id, {
      tagline: editTagline.trim(),
      description: editDesc.trim(),
    });
    setSelectedClub(updated);
    setClubs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingInfo(false);
  };

  if (loading) {
    return <LoadingSpinner label="Loading official student clubs..." />;
  }

  const filtered = clubs.filter((c) => {
    const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.tagline.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const getMembershipForClub = (clubId: string) =>
    myMemberships.find((m) => m.clubId === clubId);

  const canManageSelected =
    Boolean(selectedClub) &&
    (currentUser?.role === 'admin' ||
      selectedClub!.managerIds.includes(currentUser?.uid || ''));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Student Clubs &amp; Organizations</h1>
        <p className="jstu-secondary">
          Explore verified official campus clubs, read club updates, and apply for membership.
        </p>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, interests, or activities..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[38px] px-4 py-2 rounded-xl text-sm font-semibold shrink-0 border transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No clubs found"
          description="No verified campus clubs match your current search."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((club) => {
            const membership = getMembershipForClub(club.id);

            return (
              <div
                key={club.id}
                className="jstu-surface p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={sanitizeUrl(
                        club.logoUrl,
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                          club.name
                        )}`
                      )}
                      alt={club.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="jstu-card-title truncate">{club.name}</h3>
                        {club.isVerifiedOfficial && (
                          <span
                            title="Verified Official University Club"
                            className="inline-flex shrink-0"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </span>
                        )}
                      </div>
                      <p className="jstu-meta font-medium text-blue-600 dark:text-blue-400">
                        {club.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                    {club.tagline}
                  </p>
                  <p className="jstu-secondary line-clamp-3">{club.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {club.memberCount} Members
                    </span>
                    <span className="truncate">President: {club.presidentName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openClubModal(club)}
                      className="jstu-btn-primary flex-1"
                    >
                      View Club &amp; Apply
                    </button>
                    {membership && (
                      <Badge
                        variant={
                          membership.status === 'approved'
                            ? 'success'
                            : membership.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {membership.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Club Profile & Membership Modal */}
      <Modal
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClub(null)}
        title={selectedClub?.name || ''}
        description={
          selectedClub ? `${selectedClub.category} • Led by ${selectedClub.presidentName}` : ''
        }
        maxWidth="xl"
      >
        {selectedClub && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Club Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedClub.isVerifiedOfficial && (
                    <Badge variant="primary" size="sm">
                      Verified Official Club
                    </Badge>
                  )}
                  <span className="jstu-meta font-semibold tabular-nums">
                    {selectedClub.memberCount} Active Members
                  </span>
                </div>
                {canManageSelected && (
                  <button
                    onClick={() => setEditingInfo(!editingInfo)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{editingInfo ? 'Cancel Edit' : 'Edit Club Info'}</span>
                  </button>
                )}
              </div>

              {editingInfo ? (
                <form
                  onSubmit={handleSaveClubInfo}
                  className="jstu-inset p-4 space-y-3"
                >
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="jstu-input"
                  />
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="jstu-textarea"
                  />
                  <button type="submit" className="jstu-btn-primary">
                    Save Club Details
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-blue-600 dark:text-blue-400">
                    {selectedClub.tagline}
                  </p>
                  <p className="jstu-body">{selectedClub.description}</p>
                </>
              )}

              {selectedClub.activities.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Weekly Activities &amp; Programs
                  </h4>
                  <p className="jstu-secondary">
                    {selectedClub.activities.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {/* Club Announcements */}
            <div className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-800">
              <h4 className="jstu-card-title flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Club Announcements ({selectedClub.announcements.length})</span>
              </h4>

              {selectedClub.announcements.length === 0 ? (
                <p className="jstu-secondary">No club announcements posted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedClub.announcements.map((ann) => (
                    <div key={ann.id} className="jstu-inset p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                          {ann.title}
                        </span>
                        <span className="jstu-meta tabular-nums shrink-0">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="jstu-secondary">{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {canManageSelected && (
                <form
                  onSubmit={handlePublishAnnouncement}
                  className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/50 space-y-3"
                >
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    Publish Club Announcement
                  </p>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement title..."
                    className="jstu-input"
                  />
                  <textarea
                    rows={2}
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Share meeting schedule, competition registration, or workshop update..."
                    className="jstu-textarea"
                  />
                  <button type="submit" className="jstu-btn-primary">
                    <Plus className="w-4 h-4" />
                    <span>Post Update</span>
                  </button>
                </form>
              )}
            </div>

            {/* Membership Status / Request Form */}
            <div className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-800">
              <h4 className="jstu-card-title">Membership Status</h4>
              {(() => {
                const myMem = getMembershipForClub(selectedClub.id);
                if (myMem) {
                  return (
                    <div className="jstu-inset p-4 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                          Application Status: <span className="capitalize">{myMem.status}</span>
                        </p>
                        <p className="jstu-meta tabular-nums">
                          Requested on {new Date(myMem.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          myMem.status === 'approved'
                            ? 'success'
                            : myMem.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="md"
                      >
                        {myMem.status.toUpperCase()}
                      </Badge>
                    </div>
                  );
                }

                return (
                  <form onSubmit={handleRequestMembership} className="space-y-3">
                    {joinError && (
                      <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                        {joinError}
                      </p>
                    )}
                    <textarea
                      rows={3}
                      required
                      value={joinReason}
                      onChange={(e) => setJoinReason(e.target.value)}
                      placeholder="Briefly describe your interest, skills, or why you'd like to join..."
                      className="jstu-textarea"
                    />
                    <button
                      type="submit"
                      disabled={submittingJoin}
                      className="jstu-btn-primary"
                    >
                      {submittingJoin ? 'Submitting...' : 'Request Membership'}
                    </button>
                  </form>
                );
              })()}
            </div>

            {/* Manager Membership Requests Queue */}
            {canManageSelected && (
              <div className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                <h4 className="jstu-card-title tabular-nums">
                  Membership Applications ({clubRequests.length})
                </h4>
                {clubRequests.length === 0 ? (
                  <p className="jstu-secondary">No applications yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {clubRequests.map((req) => (
                      <div
                        key={req.id}
                        className="jstu-inset p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                            {req.userName} ({req.studentId})
                          </p>
                          <p className="jstu-meta">{req.department}</p>
                          <p className="jstu-secondary">{req.reason}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleReviewMembership(req, 'rejected')}
                                className="jstu-btn-secondary text-rose-600 dark:text-rose-400"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleReviewMembership(req, 'approved')}
                                className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl text-[15px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Approve
                              </button>
                            </>
                          ) : (
                            <Badge
                              variant={req.status === 'approved' ? 'success' : 'danger'}
                              size="sm"
                            >
                              {req.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
