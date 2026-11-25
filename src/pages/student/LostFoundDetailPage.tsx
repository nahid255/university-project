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
  Clock,
  Send,
  AlertCircle,
  Mail,
  Phone,
  Lock,
  Eye,
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

  // Claim Submission Modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [proofDetails, setProofDetails] = useState('');
  const [claimPhone, setClaimPhone] = useState(currentUser?.phone || '');
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Status Change / Delete
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

    setClaimSubmitted(true);
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
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Lost & Found Item Not Found
        </h2>
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Lost & Found</span>
        </Link>
      </div>
    );
  }

  const isReporter = currentUser?.uid === item.reporterId;
  const isAdmin = currentUser?.role === 'admin';
  const canManageItem = isReporter || isAdmin;
  const isFoundItem = item.type === 'found';

  // Has current user submitted a claim?
  const myClaim = claims.find((c) => c.claimantId === currentUser?.uid);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/lost-found"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lost & Found Board</span>
        </Link>
      </div>

      {/* Main Item Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photo */}
          <div className="h-64 sm:h-80 md:h-full min-h-[300px] bg-slate-100 dark:bg-slate-900 relative">
            {item.imageUrl && isSafeUrl(item.imageUrl) ? (
              <img
                src={sanitizeUrl(item.imageUrl)}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Search className="w-10 h-10 opacity-30" />
                <span className="text-xs">No Photo Uploaded</span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge
                variant={item.type === 'lost' ? 'danger' : 'success'}
                size="md"
                className="font-black uppercase tracking-wider backdrop-blur-md"
              >
                {item.type}
              </Badge>
              <Badge variant="purple" size="md" className="capitalize">
                {item.status}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 leading-snug">
                  {item.title}
                </h1>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Location: <strong className="text-slate-800 dark:text-slate-100">{item.location}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Date {item.type === 'lost' ? 'Lost' : 'Found'}:{' '}
                    <strong>{new Date(item.date).toLocaleDateString()}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Reported by: <strong>{item.reporterName}</strong>
                    {item.reporterStudentId && ` (${item.reporterStudentId})`}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Item Description
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* Contact Information Section with Privacy Protection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Contact Information</span>
                </h4>

                {item.isContactPublic || canManageItem ? (
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.contactEmail}</span>
                    </p>
                    {item.contactPhone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.contactPhone}</span>
                      </p>
                    )}
                    {item.isContactPublic && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block pt-1">
                        &bull; Contact details shared publicly by reporter
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Contact information is protected to prevent spam. If this is your item, submit a claim request below with verifying details to connect with the finder.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
              {/* If found item and user is NOT reporter */}
              {isFoundItem && !isReporter && item.status === 'active' && (
                <button
                  onClick={() => setIsClaimModalOpen(true)}
                  disabled={Boolean(myClaim)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-60"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{myClaim ? 'Claim Request Submitted' : 'Submit Claim Request'}</span>
                </button>
              )}

              {/* Owner or Admin action: mark resolved */}
              {canManageItem && item.status !== 'resolved' && (
                <button
                  onClick={handleMarkResolved}
                  className="inline-flex items-center gap-1.5 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Mark Resolved</span>
                </button>
              )}

              {canManageItem && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Claim Requests Section (Visible to Item Reporter and Administrators) */}
      {isFoundItem && (canManageItem || myClaim) && (
        <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Verification Claim Requests ({claims.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review claimant proofs to confirm rightful ownership
              </p>
            </div>
          </div>

          {claims.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No claim requests have been filed for this item yet.
            </p>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {claim.claimantName}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                        {claim.claimantEmail} &bull; {claim.claimantPhone}
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

                  <div className="text-xs text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 leading-relaxed">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-1">
                      Ownership Proof & Identifying Details:
                    </strong>
                    {claim.proofDetails}
                  </div>

                  {/* Actions for Item Reporter or Admin */}
                  {canManageItem && claim.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
                      <button
                        onClick={() => handleReviewClaim(claim.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        Reject Claim
                      </button>
                      <button
                        onClick={() => handleReviewClaim(claim.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                      >
                        Approve & Confirm Ownership
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claim Submission Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Submit Item Claim Request"
        description="Provide distinguishing proof so the finder can verify your ownership"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            Please describe features not visible in public pictures (e.g., serial number, hidden scratches, specific wallpapers, lock combinations, or specific engravings).
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Distinguishing Marks & Proof of Ownership
            </label>
            <textarea
              rows={4}
              required
              value={proofDetails}
              onChange={(e) => setProofDetails(e.target.value)}
              placeholder="e.g. My student ID number is written in silver ink on the battery cover, and the device lock code is 6 digits..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Your Contact Phone Number
            </label>
            <input
              type="text"
              required
              value={claimPhone}
              onChange={(e) => setClaimPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              Submit Claim Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
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
