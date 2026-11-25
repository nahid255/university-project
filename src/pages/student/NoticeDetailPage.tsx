import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Building,
  User,
  Download,
  FileText,
  Pin,
  Share2,
} from 'lucide-react';
import { getNoticeById } from '../../services/noticeService';
import { Notice } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sanitizeUrl } from '../../utils/url';

export const NoticeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getNoticeById(id);
        setNotice(data);
      } catch (e) {
        console.error('Failed to load notice details', e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Loading notice details..." />;
  }

  if (!notice) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Notice Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested university announcement may have been moved, updated, or removed.
        </p>
        <Link
          to="/notices"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Notice Board</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/notices"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notice Board</span>
        </Link>
      </div>

      {/* Main Notice Article */}
      <article className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header Tags & Title */}
        <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {notice.isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Pin className="w-3 h-3 fill-amber-600" />
                PINNED NOTICE
              </span>
            )}
            <Badge variant="primary" size="md">
              {notice.category}
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {notice.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Published on{' '}
                {new Date(notice.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </span>

            {notice.department && (
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{notice.department}</span>
              </span>
            )}

            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Issued by {notice.authorName}</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-4">
          <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
            {notice.content}
          </p>
        </div>

        {/* Attachment Card */}
        {notice.attachmentName && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {notice.attachmentName}
                </p>
                <p className="text-[11px] text-slate-400">
                  Official Document &bull; Verified PDF
                </p>
              </div>
            </div>

            <a
              href={sanitizeUrl(notice.attachmentUrl)}
              download={notice.attachmentName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Circular</span>
            </a>
          </div>
        )}
      </article>
    </div>
  );
};
