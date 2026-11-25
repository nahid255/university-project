import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Trash2,
  FileText,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { getResources, deleteResource } from '../../services/resourceService';
import { StudyResource, ResourceCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (e) {
      console.error('Failed to load resources for admin', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteResource(deleteTargetId);
    setDeleteTargetId(null);
    await loadResources();
  };

  if (loading) {
    return <LoadingSpinner label="Loading study resource repository..." />;
  }

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      r.uploadedByName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Study Resources Moderation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review peer study material submissions, audit document validity, and moderate repository files
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title, course code, or contributor name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Material Title</th>
                <th className="py-3.5 px-4">Course</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Contributor</th>
                <th className="py-3.5 px-4">Downloads</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3.5 px-4 sm:px-6">
                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1 max-w-sm">
                      {r.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {r.fileName} &bull; {r.fileSize}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {r.courseCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="purple" size="sm">
                      {r.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {r.uploadedByName}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {r.downloadsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Download or preview file"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setDeleteTargetId(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Moderate / Delete material"
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

      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Remove Study Resource"
        message="Are you sure you want to permanently delete this material from the university repository?"
      />
    </div>
  );
};
