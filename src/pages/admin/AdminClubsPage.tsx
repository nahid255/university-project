import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getClubs,
  createClub,
  updateClub,
  deleteClub,
  getClubMemberships,
  reviewClubMembership,
  publishClubAnnouncement,
} from '../../services/clubService';
import { getAllUsers, logActivity } from '../../services/adminService';
import { Club, ClubCategory, ClubMembership, UserProfile } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CATEGORIES: ClubCategory[] = [
  'Technology',
  'Academic',
  'Cultural',
  'Sports',
  'Social Impact',
  'Arts & Media',
  'Other',
];

export const AdminClubsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'clubs' | 'requests'>('clubs');

  // Create/Edit Club Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ClubCategory>('Technology');
  const [presidentName, setPresidentName] = useState('');
  const [activitiesText, setActivitiesText] = useState('');
  const [managerUid, setManagerUid] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Announcement Modal
  const [annClub, setAnnClub] = useState<Club | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clubList, memList, userList] = await Promise.all([
        getClubs(),
        getClubMemberships(),
        getAllUsers(),
      ]);
      setClubs(clubList);
      setMemberships(memList);
      setUsers(userList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setName('');
    setTagline('');
    setDescription('');
    setCategory('Technology');
    setPresidentName('');
    setActivitiesText('Weekly Workshop, Annual Showcase');
    setManagerUid(users.find((u) => u.role === 'student')?.uid || '');
    setLogoUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (club: Club) => {
    setEditing(club);
    setName(club.name);
    setTagline(club.tagline);
    setDescription(club.description);
    setCategory(club.category);
    setPresidentName(club.presidentName);
    setActivitiesText(club.activities.join(', '));
    setManagerUid(club.managerIds[0] || '');
    setLogoUrl(club.logoUrl || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    if (logoUrl.trim() && !isSafeUrl(logoUrl.trim())) {
      setFormError('Please enter a valid http(s) logo URL.');
      return;
    }

    const activities = activitiesText
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    const managerIds = managerUid ? [managerUid] : [];
    const safeLogo = logoUrl.trim() ? sanitizeUrl(logoUrl.trim()) : undefined;

    if (editing) {
      await updateClub(editing.id, {
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        category,
        presidentName: presidentName.trim(),
        activities,
        managerIds,
        logoUrl: safeLogo,
      });
      logActivity({
        userId: currentUser.uid,
        userName: currentUser.fullName,
        action: 'Updated official club',
        target: name.trim(),
        type: 'admin',
      });
    } else {
      await createClub(
        {
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          category,
          presidentName: presidentName.trim(),
          activities,
          managerIds,
          logoUrl: safeLogo,
          isVerifiedOfficial: true,
        },
        currentUser
      );
      logActivity({
        userId: currentUser.uid,
        userName: currentUser.fullName,
        action: 'Registered official university club',
        target: name.trim(),
        type: 'admin',
      });
    }
    setIsModalOpen(false);
    await loadData();
  };

  const handleReviewMembership = async (
    req: ClubMembership,
    status: 'approved' | 'rejected'
  ) => {
    const club = clubs.find((c) => c.id === req.clubId);
    if (!club) return;
    await reviewClubMembership(req, status, club);
    await loadData();
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !annClub || !annTitle.trim() || !annContent.trim()) return;
    await publishClubAnnouncement(annClub, currentUser, annTitle, annContent);
    setAnnClub(null);
    setAnnTitle('');
    setAnnContent('');
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;
    await deleteClub(deleteTarget.id);
    logActivity({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      action: 'Deleted club',
      target: deleteTarget.name,
      type: 'admin',
    });
    setDeleteTarget(null);
    await loadData();
  };

  if (loading) {
    return <LoadingSpinner label="Loading official clubs administration..." />;
  }

  const pendingCount = memberships.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">Official Clubs &amp; Memberships</h1>
          <p className="jstu-secondary">
            Register verified official university clubs, assign student managers, and moderate membership requests.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[15px] font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Official Club</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setTab('clubs')}
          className={`pb-3.5 text-[15px] font-semibold relative whitespace-nowrap shrink-0 transition-colors ${
            tab === 'clubs'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span className="tabular-nums">Verified Clubs ({clubs.length})</span>
          {tab === 'clubs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab('requests')}
          className={`pb-3.5 text-[15px] font-semibold relative whitespace-nowrap shrink-0 transition-colors ${
            tab === 'requests'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span className="tabular-nums">Membership Requests ({pendingCount} pending)</span>
          {tab === 'requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
          )}
        </button>
      </div>

      {tab === 'clubs' ? (
        <div className="space-y-4">
          {clubs.length === 0 ? (
            <div className="jstu-surface p-10 text-center jstu-secondary">
              No official university clubs registered yet.
            </div>
          ) : (
            clubs.map((club) => (
              <div
                key={club.id}
                className="jstu-surface p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant="primary" size="sm">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Official</span>
                      </span>
                    </Badge>
                    <Badge variant="purple" size="sm">
                      {club.category}
                    </Badge>
                    <span className="jstu-meta tabular-nums">
                      {club.memberCount} members &middot; President: {club.presidentName}
                    </span>
                  </div>
                  <h3 className="jstu-card-title">{club.name}</h3>
                  <p className="jstu-secondary">{club.tagline}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setAnnClub(club)}
                    className="jstu-btn-secondary"
                  >
                    Post Announcement
                  </button>
                  <button
                    onClick={() => openEditModal(club)}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                    title="Edit club"
                    aria-label={`Edit ${club.name}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(club)}
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete club"
                    aria-label={`Delete ${club.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.length === 0 ? (
            <div className="jstu-surface p-10 text-center jstu-secondary">
              No membership requests to review.
            </div>
          ) : (
            memberships.map((req) => (
              <div
                key={req.id}
                className="jstu-surface p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="purple" size="sm">
                      {req.clubName}
                    </Badge>
                    <Badge
                      variant={
                        req.status === 'approved'
                          ? 'success'
                          : req.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {req.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="jstu-card-title">
                    {req.userName} <span className="font-mono text-sm">({req.studentId})</span>
                  </h4>
                  <p className="jstu-meta">
                    {req.department} &middot; {req.userEmail}
                  </p>
                  <p className="jstu-secondary pt-1">{req.reason}</p>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleReviewMembership(req, 'rejected')}
                      className="jstu-btn-secondary text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleReviewMembership(req, 'approved')}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Club Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Edit Official Club' : 'Register Verified Official Club'}
        description="Only administrators can create verified official university organizations"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveClub} className="space-y-4">
          {formError && (
            <p className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Club Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClubCategory)}
                className="jstu-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">Tagline</label>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="jstu-textarea"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Club President Name</label>
              <input
                type="text"
                required
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="jstu-input"
              />
            </div>

            <div>
              <label className="jstu-label">Assign Student Club Manager</label>
              <select
                value={managerUid}
                onChange={(e) => setManagerUid(e.target.value)}
                className="jstu-select"
              >
                <option value="">None assigned</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.fullName} ({u.studentId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">Activities (comma-separated)</label>
            <input
              type="text"
              value={activitiesText}
              onChange={(e) => setActivitiesText(e.target.value)}
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">Logo URL (Optional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="jstu-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[15px] font-semibold transition-colors"
            >
              {editing ? 'Save Club' : 'Register Official Club'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Club Announcement Modal */}
      <Modal
        isOpen={Boolean(annClub)}
        onClose={() => setAnnClub(null)}
        title={annClub ? `Post Update for ${annClub.name}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handlePostAnnouncement} className="space-y-4">
          <div>
            <label className="jstu-label">Announcement Title</label>
            <input
              type="text"
              required
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Announcement title..."
              className="jstu-input"
            />
          </div>
          <div>
            <label className="jstu-label">Announcement Content</label>
            <textarea
              rows={3}
              required
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Announcement content..."
              className="jstu-textarea"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAnnClub(null)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[15px] font-semibold transition-colors"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Official Club"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
      />
    </div>
  );
};
