import React, { useState } from 'react';
import { Flag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { submitReport } from '../../services/reportService';
import { ReportTargetType, UserProfile } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetOwnerId?: string;
}

const REPORT_REASONS = [
  'Spam or misleading content',
  'Harassment or abusive language',
  'Inappropriate or unsafe item/content',
  'Scam or fraudulent listing',
  'Misinformation or impersonation',
  'Other policy violation',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetType,
  targetId,
  targetTitle,
  targetOwnerId,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!details.trim()) {
      setError('Please provide brief details to help moderators review this report.');
      return;
    }

    try {
      setSubmitting(true);
      await submitReport({
        targetType,
        targetId,
        targetTitle,
        targetOwnerId,
        reporterId: currentUser.uid,
        reporterName: currentUser.fullName,
        reason,
        details: details.trim(),
      });
      setSubmitted(true);
      setDetails('');
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError(null);
    setDetails('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report Content or Abuse"
      description="Reports are reviewed privately by JSTU Campus moderators and administrators."
      maxWidth="md"
    >
      {submitted ? (
        <div className="py-6 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
              Report Submitted
            </h4>
            <p className="text-[15px] text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Thank you for helping keep JSTU Campus safe. Our moderation team will inspect this report shortly.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="jstu-btn-primary"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-semibold">Reporting:</span> {targetTitle}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="jstu-label">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="jstu-select"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="jstu-label">
              Additional Context
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain why this violates campus community guidelines..."
              className="jstu-textarea"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="jstu-btn-danger"
            >
              <Flag className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
