import React, { useEffect, useState } from 'react';
import {
  Bell,
  Plus,
  Search,
  Pin,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  CheckCircle,
  Eye,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Campus Notice Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Author and broadcast official university circulars, emergency updates, and examination seat plans
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Circular</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars by title, keyword, or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Notice List Table */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Notice Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Published Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((n) => (
                <tr
                  key={n.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      {n.isPinned && (
                        <span className="p-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          <Pin className="w-3 h-3 fill-amber-600" />
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-md">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {n.department || 'Administration'} &bull; Author: {n.authorName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="info" size="sm">
                      {n.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={n.status === 'published' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {n.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(n.publishedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(n)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit notice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(n.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete notice"
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule of Final Term Examinations - Fall 2026"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Issuing Department
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Academic Affairs"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="published">Published</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notice Content & Directive
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete announcements, seat plans, guidelines, and deadlines..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Attachment Document Name (Optional)
              </label>
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Midterm_Exam_Seat_Plan.pdf"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Attachment URL
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/file.pdf"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="pinNotice"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
            />
            <label
              htmlFor="pinNotice"
              className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none"
            >
              Pin this notice prominently to top of the student dashboard & notice board
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
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
