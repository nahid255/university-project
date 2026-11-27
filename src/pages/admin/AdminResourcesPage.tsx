import React, { useEffect, useState } from 'react';
import {
  Search,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { getResources, deleteResource } from '../../services/resourceService';
import { StudyResource } from '../../types';
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Study Resources Moderation</h1>
        <p className="jstu-secondary">
          Review peer study material submissions, audit document validity, and moderate repository files.
        </p>
      </div>

      {/* Search Input */}
      <div className="jstu-surface p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title, course code, or contributor name..."
            className="jstu-input pl-11"
          />
        </div>
      </div>

      {/* Resources Table */}
      <div className="jstu-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="jstu-table-th">Material Title</th>
                <th className="jstu-table-th">Course</th>
                <th className="jstu-table-th">Category</th>
                <th className="jstu-table-th">Contributor</th>
                <th className="jstu-table-th">Downloads</th>
                <th className="jstu-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="jstu-table-td text-center py-10 jstu-secondary">
                    No study resources matched your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="jstu-table-td">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-sm">
                        {r.title}
                      </p>
                      <p className="jstu-meta">
                        {r.fileName} &middot; {r.fileSize}
                      </p>
                    </td>
                    <td className="jstu-table-td font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {r.courseCode}
                    </td>
                    <td className="jstu-table-td">
                      <Badge variant="purple" size="sm">
                        {r.category}
                      </Badge>
                    </td>
                    <td className="jstu-table-td text-slate-700 dark:text-slate-300">
                      {r.uploadedByName}
                    </td>
                    <td className="jstu-table-td font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {r.downloadsCount}
                    </td>
                    <td className="jstu-table-td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download or preview file"
                          aria-label={`Preview ${r.title}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteTargetId(r.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Moderate / Delete material"
                          aria-label={`Delete ${r.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
