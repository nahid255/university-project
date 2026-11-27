import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Pin,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../../services/noticeService';
import { Notice, NoticeCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const CATEGORIES: NoticeCategory[] = [
  'Academic',
  'Examination',
  'Admission',
  'Events',
  'Scholarships',
  'General',
  'Emergency',
];

export const AdminNoticesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('Academic');
  const [department, setDepartment] = useState('Academic Affairs');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isPinned, setIsPinned] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await getNotices(true); // true = include drafts
      setNotices(data);
    } catch (e) {
      console.error('Failed to load notices for admin', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('Academic');
    setDepartment('Academic Affairs');
    setStatus('published');
    setIsPinned(false);
    setAttachmentName('');
    setAttachmentUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (n: Notice) => {
    setEditingId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setCategory(n.category);
    setDepartment(n.department || 'Academic Affairs');
    setStatus(n.status);
    setIsPinned(n.isPinned);
    setAttachmentName(n.attachmentName || '');
    setAttachmentUrl(n.attachmentUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !content.trim()) return;

    if (editingId) {
      await updateNotice(editingId, {
        title: title.trim(),
        content: content.trim(),
        category,
        department: department.trim(),
        status,
        isPinned,
        attachmentName: attachmentName.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
    } else {
      await createNotice({
        title: title.trim(),
        content: content.trim(),
        category,
        department: department.trim(),
        status,
        isPinned,
        authorName: currentUser.fullName,
        authorId: currentUser.uid,
        attachmentName: attachmentName.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    await loadNotices();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteNotice(deleteId);
    setDeleteId(null);
    await loadNotices();
  };

  if (loading) {
    return <LoadingSpinner label="Loading notice manager..." />;
  }

  const filtered = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">Campus Notice Management</h1>
          <p className="jstu-secondary">
            Author and broadcast official university circulars, emergency updates, and examination seat plans.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[15px] font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Circular</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="jstu-surface p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars by title, keyword, or category..."
            className="jstu-input pl-11"
          />
        </div>
      </div>

      {/* Notice List Table */}
      <div className="jstu-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="jstu-table-th">Notice Title</th>
                <th className="jstu-table-th">Category</th>
                <th className="jstu-table-th">Status</th>
                <th className="jstu-table-th">Published Date</th>
                <th className="jstu-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filtered.map((n) => (
                <tr
                  key={n.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="jstu-table-td">
                    <div className="flex items-center gap-2.5">
                      {n.isPinned && (
                        <span
                          className="p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0"
                          title="Pinned circular"
                        >
                          <Pin className="w-3.5 h-3.5 fill-amber-600" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-md">
                          {n.title}
                        </p>
                        <p className="jstu-meta">
                          {n.department || 'Administration'} &middot; Author: {n.authorName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="jstu-table-td">
                    <Badge variant="info" size="sm">
                      {n.category}
                    </Badge>
                  </td>
                  <td className="jstu-table-td">
                    <Badge
                      variant={n.status === 'published' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {n.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="jstu-table-td jstu-meta font-mono tabular-nums whitespace-nowrap">
                    {new Date(n.publishedAt).toLocaleDateString()}
                  </td>
                  <td className="jstu-table-td text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(n)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit notice"
                        aria-label="Edit notice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(n.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete notice"
                        aria-label="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Circular' : 'Publish University Announcement'}
        description="Draft official circulars broadcasted to students and faculty"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="jstu-label">Notice Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule of Final Term Examinations - Fall 2026"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="jstu-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                className="jstu-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="jstu-label">Issuing Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Academic Affairs"
                className="jstu-input"
              />
            </div>

            <div>
              <label className="jstu-label">Publishing Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="jstu-select"
              >
                <option value="published">Published</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">Notice Content &amp; Directive</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete announcements, seat plans, guidelines, and deadlines..."
              className="jstu-textarea"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Attachment Document Name (Optional)</label>
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Midterm_Exam_Seat_Plan.pdf"
                className="jstu-input"
              />
            </div>

            <div>
              <label className="jstu-label">Attachment URL</label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/file.pdf"
                className="jstu-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="pinNotice"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
            />
            <label
              htmlFor="pinNotice"
              className="text-sm text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none"
            >
              Pin this notice prominently to top of the student dashboard &amp; notice board
            </label>
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
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-semibold"
            >
              {editingId ? 'Update Notice' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete University Notice"
        message="Are you sure you want to permanently delete this notice? Students will immediately lose access to this bulletin."
      />
    </div>
  );
};
