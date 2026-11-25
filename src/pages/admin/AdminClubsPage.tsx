import React, { useEffect, useState } from 'react';
import {
  Award,
  Plus,
  Edit3,
  Trash2,
  Users,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            <span>Official Clubs &amp; Memberships</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Register verified official university clubs, assign student managers, and moderate membership requests
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Official Club</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setTab('clubs')}
          className={`pb-3 text-sm font-bold relative ${
            tab === 'clubs' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <span>Verified Clubs ({clubs.length})</span>
          {tab === 'clubs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab('requests')}
          className={`pb-3 text-sm font-bold relative ${
            tab === 'requests' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <span>Membership Requests ({pendingCount} pending)</span>
          {tab === 'requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {tab === 'clubs' ? (
        <div className="space-y-3">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    <ShieldCheck className="w-3 h-3 mr-1 inline" />
                    Official
                  </Badge>
                  <Badge variant="purple" size="sm">
                    {club.category}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    {club.memberCount} members &bull; President: {club.presidentName}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {club.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{club.tagline}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setAnnClub(club)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Post Announcement
                </button>
                <button
                  onClick={() => openEditModal(club)}
                  className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(club)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {memberships.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
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
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {req.userName} ({req.studentId})
                </h4>
                <p className="text-xs text-slate-500">
                  {req.department} &bull; {req.userEmail}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">{req.reason}</p>
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewMembership(req, 'rejected')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleReviewMembership(req, 'approved')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          ))}
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
            <p className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Club Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClubCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tagline
            </label>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Club President Name
              </label>
              <input
                type="text"
                required
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assign Student Club Manager
              </label>
              <select
                value={managerUid}
                onChange={(e) => setManagerUid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Activities (comma-separated)
            </label>
            <input
              type="text"
              value={activitiesText}
              onChange={(e) => setActivitiesText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Logo URL (Optional)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white"
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
          <input
            type="text"
            required
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          />
          <textarea
            rows={3}
            required
            value={annContent}
            onChange={(e) => setAnnContent(e.target.value)}
            placeholder="Announcement content..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAnnClub(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white"
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
