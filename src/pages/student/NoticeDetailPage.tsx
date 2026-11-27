import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  Download,
  FileText,
  Pin,
} from 'lucide-react';
import { getNoticeById } from '../../services/noticeService';
import { Notice } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sanitizeUrl } from '../../utils/url';

export const NoticeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
      <div className="text-center py-14 space-y-4">
        <h2 className="jstu-section-title">Notice Not Found</h2>
        <p className="jstu-secondary">
          The requested university announcement may have been moved, updated, or removed.
        </p>
        <Link to="/notices" className="jstu-btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Notice Board</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to="/notices"
          className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notice Board</span>
        </Link>
      </div>

      <article className="jstu-surface p-6 sm:p-10 space-y-7">
        <div className="space-y-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {notice.isPinned && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[13px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Pin className="w-3.5 h-3.5 fill-amber-600" />
                Pinned Notice
              </span>
            )}
            <Badge variant="primary" size="md">
              {notice.category}
            </Badge>
          </div>

          <h1 className="jstu-page-title">
            {notice.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-[15px] text-slate-600 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-2 tabular-nums">
              <Calendar className="w-4 h-4 text-slate-400" />
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
              <span className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{notice.department}</span>
              </span>
            )}

            <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <span>Issued by {notice.authorName}</span>
            </span>
          </div>
        </div>

        <div className="text-base text-slate-700 dark:text-slate-200 leading-[1.75] space-y-4">
          <p className="whitespace-pre-line">
            {notice.content}
          </p>
        </div>

        {notice.attachmentName && (
          <div className="p-5 jstu-inset flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  {notice.attachmentName}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Official Document &middot; Verified PDF
                </p>
              </div>
            </div>

            <a
              href={sanitizeUrl(notice.attachmentUrl)}
              download={notice.attachmentName}
              target="_blank"
              rel="noopener noreferrer"
              className="jstu-btn-primary"
            >
              <Download className="w-4 h-4" />
              <span>Download Circular</span>
            </a>
          </div>
        )}
      </article>
    </div>
  );
};
