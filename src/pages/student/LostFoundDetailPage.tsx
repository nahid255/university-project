import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle,
  Mail,
  Phone,
  Lock,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLostFoundItemById,
  updateLostFoundItem,
  deleteLostFoundItem,
  getClaimRequests,
  submitClaimRequest,
  updateClaimStatus,
} from '../../services/lostFoundService';
import { LostFoundItem, ClaimRequest, ClaimStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

export const LostFoundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [proofDetails, setProofDetails] = useState('');
  const [claimPhone, setClaimPhone] = useState(currentUser?.phone || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadItemData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const foundItem = await getLostFoundItemById(id);
      setItem(foundItem);

      if (foundItem) {
        const allClaims = await getClaimRequests();
        const itemClaims = allClaims.filter((c) => c.itemId === foundItem.id);
        setClaims(itemClaims);
      }
    } catch (e) {
      console.error('Failed to load item detail', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItemData();
  }, [id]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !currentUser || !proofDetails.trim()) return;

    await submitClaimRequest({
      itemId: item.id,
      itemTitle: item.title,
      itemReporterId: item.reporterId,
      claimantId: currentUser.uid,
      claimantName: currentUser.fullName,
      claimantEmail: currentUser.email,
      claimantPhone: claimPhone.trim(),
      proofDetails: proofDetails.trim(),
    });

    setIsClaimModalOpen(false);
    setProofDetails('');
    await loadItemData();
  };

  const handleReviewClaim = async (claimId: string, status: ClaimStatus) => {
    await updateClaimStatus(claimId, status);
    await loadItemData();
  };

  const handleMarkResolved = async () => {
    if (!item) return;
    await updateLostFoundItem(item.id, { status: 'resolved' });
    await loadItemData();
  };

  const handleDeleteItem = async () => {
    if (!item) return;
    await deleteLostFoundItem(item.id);
    navigate('/lost-found');
  };

  if (loading) {
    return <LoadingSpinner label="Loading item report..." />;
  }

  if (!item) {
    return (
      <div className="text-center py-14 space-y-4">
        <h2 className="jstu-section-title">Lost &amp; Found Item Not Found</h2>
        <Link to="/lost-found" className="jstu-btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Lost &amp; Found</span>
        </Link>
      </div>
    );
  }

  const isReporter = currentUser?.uid === item.reporterId;
  const isAdmin = currentUser?.role === 'admin';
  const canManageItem = isReporter || isAdmin;
  const isFoundItem = item.type === 'found';
  const myClaim = claims.find((c) => c.claimantId === currentUser?.uid);

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      <div>
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost &amp; Found Board</span>
        </Link>
      </div>

      <div className="jstu-surface overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="h-64 sm:h-80 md:h-full min-h-[320px] bg-slate-100 dark:bg-slate-900 relative">
            {item.imageUrl && isSafeUrl(item.imageUrl) ? (
              <img
                src={sanitizeUrl(item.imageUrl)}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Search className="w-10 h-10 opacity-35" />
                <span className="text-sm">No Photo Uploaded</span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge
                variant={item.type === 'lost' ? 'danger' : 'success'}
                size="md"
                className="uppercase tracking-wider backdrop-blur-md"
              >
                {item.type}
              </Badge>
              <Badge variant="purple" size="md" className="capitalize">
                {item.status}
              </Badge>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <h1 className="jstu-page-title mt-1">
                  {item.title}
                </h1>
              </div>

              <div className="space-y-2.5 text-[15px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Location: <strong className="text-slate-900 dark:text-slate-100">{item.location}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 tabular-nums">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Date {item.type === 'lost' ? 'Lost' : 'Found'}:{' '}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {new Date(item.date).toLocaleDateString()}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Reported by: <strong className="text-slate-900 dark:text-slate-100">{item.reporterName}</strong>
                    {item.reporterStudentId && (
                      <span className="font-mono text-sm text-slate-500"> ({item.reporterStudentId})</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Item Description
                </h2>
                <p className="jstu-secondary whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              <div className="p-4 jstu-inset space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Contact Information</span>
                </h3>

                {item.isContactPublic || canManageItem ? (
                  <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{item.contactEmail}</span>
                    </p>
                    {item.contactPhone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{item.contactPhone}</span>
                      </p>
                    )}
                    {item.isContactPublic && (
                      <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold block pt-1">
                        Contact details shared publicly by reporter
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Contact information is protected to prevent spam. If this is your item, submit a claim request below with verifying details to connect with the finder.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3">
              {isFoundItem && !isReporter && item.status === 'active' && (
                <button
                  onClick={() => setIsClaimModalOpen(true)}
                  disabled={Boolean(myClaim)}
                  className="flex-1 jstu-btn-primary bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{myClaim ? 'Claim Request Submitted' : 'Submit Claim Request'}</span>
                </button>
              )}

              {canManageItem && item.status !== 'resolved' && (
                <button
                  onClick={handleMarkResolved}
                  className="jstu-btn-secondary text-blue-700 dark:text-blue-300"
                >
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Mark Resolved</span>
                </button>
              )}

              {canManageItem && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="min-w-[42px] min-h-[42px] flex items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  title="Delete post"
                  aria-label="Delete item report"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Requests Section */}
      {isFoundItem && (canManageItem || myClaim) && (
        <section className="jstu-surface p-6 sm:p-8 space-y-5">
          <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="jstu-section-title flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="tabular-nums">Verification Claim Requests ({claims.length})</span>
            </h2>
            <p className="jstu-secondary mt-1">
              Review claimant proofs to confirm rightful ownership
            </p>
          </div>

          {claims.length === 0 ? (
            <p className="text-[15px] text-slate-500 dark:text-slate-400 py-6 text-center">
              No claim requests have been filed for this item yet.
            </p>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="p-5 jstu-inset space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-semibold text-slate-950 dark:text-white">
                        {claim.claimantName}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 ml-2.5">
                        {claim.claimantEmail} &middot; {claim.claimantPhone}
                      </span>
                    </div>

                    <Badge
                      variant={
                        claim.status === 'approved'
                          ? 'success'
                          : claim.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {claim.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-[15px] text-slate-700 dark:text-slate-300 p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/70 dark:border-slate-800 leading-relaxed">
                    <strong className="block text-slate-900 dark:text-slate-100 mb-1">
                      Ownership Proof &amp; Identifying Details:
                    </strong>
                    {claim.proofDetails}
                  </div>

                  {canManageItem && claim.status === 'pending' && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleReviewClaim(claim.id, 'rejected')}
                        className="jstu-btn-secondary text-rose-600 dark:text-rose-400"
                      >
                        Reject Claim
                      </button>
                      <button
                        onClick={() => handleReviewClaim(claim.id, 'approved')}
                        className="jstu-btn-primary bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve &amp; Confirm Ownership
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Claim Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Submit Item Claim Request"
        description="Provide distinguishing proof so the finder can verify your ownership"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-5">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40 text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            Please describe features not visible in public pictures (e.g., serial number, hidden scratches, specific wallpapers, or engravings).
          </div>

          <div>
            <label className="jstu-label">Distinguishing Marks &amp; Proof of Ownership</label>
            <textarea
              rows={4}
              required
              value={proofDetails}
              onChange={(e) => setProofDetails(e.target.value)}
              placeholder="e.g. My student ID number is written in silver ink on the cover..."
              className="jstu-textarea"
            />
          </div>

          <div>
            <label className="jstu-label">Your Contact Phone Number</label>
            <input
              type="text"
              required
              value={claimPhone}
              onChange={(e) => setClaimPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              className="jstu-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="jstu-btn-primary bg-emerald-600 hover:bg-emerald-700"
            >
              Submit Claim Request
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Item Report"
        message="Are you sure you want to remove this lost & found report? This cannot be undone."
      />
    </div>
  );
};
