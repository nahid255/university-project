import React, { useEffect, useState } from 'react';
import {
  Award,
  Search,
  Users,
  ShieldCheck,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
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
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Student Clubs & Organizations</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore verified official campus clubs, read club updates, and apply for membership
          </p>
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, interests, or activities..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((club) => {
            const membership = getMembershipForClub(club.id);

            return (
              <div
                key={club.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={sanitizeUrl(
                          club.logoUrl,
                          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                            club.name
                          )}`
                        )}
                        alt={club.name}
                        className="w-12 h-12 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                            {club.name}
                          </h3>
                          {club.isVerifiedOfficial && (
                            <span
                              title="Verified Official University Club"
                              className="inline-flex shrink-0"
                            >
                              <ShieldCheck className="w-4 h-4 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {club.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {club.tagline}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {club.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {club.memberCount} Members
                    </span>
                    <span>President: {club.presidentName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openClubModal(club)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                    >
                      View Club & Apply
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
        description={selectedClub ? `${selectedClub.category} • Led by ${selectedClub.presidentName}` : ''}
        maxWidth="xl"
      >
        {selectedClub && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Club Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedClub.isVerifiedOfficial && (
                    <Badge variant="primary" size="sm">
                      Verified Official Club
                    </Badge>
                  )}
                  <Badge variant="neutral" size="sm">
                    {selectedClub.memberCount} Active Members
                  </Badge>
                </div>
                {canManageSelected && (
                  <button
                    onClick={() => setEditingInfo(!editingInfo)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{editingInfo ? 'Cancel Edit' : 'Edit Club Info'}</span>
                  </button>
                )}
              </div>

              {editingInfo ? (
                <form onSubmit={handleSaveClubInfo} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Save Club Details
                  </button>
                </form>
              ) : (
                <>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedClub.tagline}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedClub.description}
                  </p>
                </>
              )}

              {selectedClub.activities.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Weekly Activities & Programs
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClub.activities.map((act, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Club Announcements */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-500" />
                <span>Club Announcements ({selectedClub.announcements.length})</span>
              </h4>

              {selectedClub.announcements.length === 0 ? (
                <p className="text-xs text-slate-400">No club announcements posted yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedClub.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {ann.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {canManageSelected && (
                <form
                  onSubmit={handlePublishAnnouncement}
                  className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2"
                >
                  <p className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                    Publish Club Announcement
                  </p>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement title..."
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <textarea
                    rows={2}
                    required
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Share meeting schedule, competition registration, or workshop update..."
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post Update</span>
                  </button>
                </form>
              )}
            </div>

            {/* Membership Status / Request Form */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Membership Status
              </h4>
              {(() => {
                const myMem = getMembershipForClub(selectedClub.id);
                if (myMem) {
                  return (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Application Status: <span className="capitalize">{myMem.status}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
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
                      <p className="text-xs text-rose-600 dark:text-rose-400">{joinError}</p>
                    )}
                    <textarea
                      rows={2}
                      required
                      value={joinReason}
                      onChange={(e) => setJoinReason(e.target.value)}
                      placeholder="Briefly describe your interest, skills, or why you'd like to join..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={submittingJoin}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {submittingJoin ? 'Submitting...' : 'Request Membership'}
                    </button>
                  </form>
                );
              })()}
            </div>

            {/* Manager Membership Requests Queue */}
            {canManageSelected && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Membership Applications ({clubRequests.length})
                </h4>
                {clubRequests.length === 0 ? (
                  <p className="text-xs text-slate-400">No applications yet.</p>
                ) : (
                  <div className="space-y-2">
                    {clubRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {req.userName} ({req.studentId})
                          </p>
                          <p className="text-[11px] text-slate-500">{req.department}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{req.reason}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleReviewMembership(req, 'rejected')}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleReviewMembership(req, 'approved')}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
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
