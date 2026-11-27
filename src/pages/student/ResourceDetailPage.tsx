import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Download,
  FileText,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getResourceById,
  incrementResourceDownload,
  deleteResource,
} from '../../services/resourceService';
import { StudyResource } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sanitizeUrl } from '../../utils/url';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState<StudyResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getResourceById(id);
        setResource(data);
      } catch (e) {
        console.error('Failed to load study resource', e);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id]);

  const handleDownload = async () => {
    if (!resource) return;
    await incrementResourceDownload(resource.id);
    setResource((prev) =>
      prev ? { ...prev, downloadsCount: prev.downloadsCount + 1 } : null
    );
    const safeHref = sanitizeUrl(resource.fileUrl);
    if (safeHref !== '#') {
      const link = document.createElement('a');
      link.href = safeHref;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async () => {
    if (!resource) return;
    await deleteResource(resource.id);
    navigate('/resources');
  };

  if (loading) {
    return <LoadingSpinner label="Loading resource details..." />;
  }

  if (!resource) {
    return (
      <div className="text-center py-14 space-y-4">
        <h2 className="jstu-section-title">Resource Not Found</h2>
        <Link to="/resources" className="jstu-btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resources</span>
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.uid === resource.uploadedById;
  const isAdmin = currentUser?.role === 'admin';
  const canDelete = isOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Study Resources Library</span>
        </Link>
      </div>

      <div className="jstu-surface p-6 sm:p-10 space-y-7">
        <div className="space-y-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-semibold px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {resource.courseCode}
            </span>
            <Badge variant="purple" size="md">
              {resource.category}
            </Badge>
          </div>

          <h1 className="jstu-page-title">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-[15px] text-slate-600 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-2 tabular-nums">
              <Calendar className="w-4 h-4" />
              <span>Uploaded on {new Date(resource.uploadedAt).toLocaleDateString()}</span>
            </span>

            <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <User className="w-4 h-4" />
              <span>By {resource.uploadedByName}</span>
            </span>

            <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums">
              <Download className="w-4 h-4" />
              <span>{resource.downloadsCount} student downloads</span>
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Material Summary &amp; Syllabus Context
          </h2>
          <p className="jstu-body whitespace-pre-line">
            {resource.description}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-950 dark:text-white truncate">
                {resource.fileName}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                {resource.fileSize} &middot; Verified Academic Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownload}
              className="jstu-btn-primary bg-indigo-600 hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              <span>Download Material</span>
            </button>

            {canDelete && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete resource"
                aria-label="Delete resource"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Study Resource"
        message="Are you sure you want to delete this study material from the campus repository?"
      />
    </div>
  );
};
