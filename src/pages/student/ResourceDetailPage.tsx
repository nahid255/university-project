import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  User,
  Download,
  FileText,
  Share2,
  Trash2,
  CheckCircle2,
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
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Resource Not Found
        </h2>
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
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
      {/* Back button */}
      <div>
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Study Resources Library</span>
        </Link>
      </div>

      {/* Main Resource Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {resource.courseCode}
            </span>
            <Badge variant="purple" size="md">
              {resource.category}
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Uploaded on {new Date(resource.uploadedAt).toLocaleDateString()}
              </span>
            </span>

            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5" />
              <span>By {resource.uploadedByName}</span>
            </span>

            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <Download className="w-3.5 h-3.5" />
              <span>{resource.downloadsCount} student downloads</span>
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Material Summary & Syllabus Context
          </h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {resource.description}
          </p>
        </div>

        {/* Download Box */}
        <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {resource.fileName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {resource.fileSize} &bull; Verified Academic Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Material</span>
            </button>

            {canDelete && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete resource"
              >
                <Trash2 className="w-4 h-4" />
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
