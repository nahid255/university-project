import React, { useEffect, useState } from 'react';
import {
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  FileQuestion,
} from 'lucide-react';
import {
  getLostFoundItems,
  getClaimRequests,
  updateClaimStatus,
  deleteLostFoundItem,
  updateLostFoundItem,
} from '../../services/lostFoundService';
import { LostFoundItem, ClaimRequest, ClaimStatus, LostFoundStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminLostFoundPage: React.FC = () => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'claims' | 'items'>('claims');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allItm, allClm] = await Promise.all([getLostFoundItems(), getClaimRequests()]);
      setItems(allItm);
      setClaims(allClm);
    } catch (e) {
      console.error('Failed to load lost and found moderation data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaimReview = async (claimId: string, status: ClaimStatus) => {
    await updateClaimStatus(claimId, status);
    await loadData();
  };

  const handleStatusChange = async (itemId: string, newStatus: LostFoundStatus) => {
    await updateLostFoundItem(itemId, { status: newStatus });
    await loadData();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteLostFoundItem(deleteTargetId);
    setDeleteTargetId(null);
    await loadData();
  };

  if (loading) {
    return <LoadingSpinner label="Loading lost & found moderation queue..." />;
  }

  const pendingClaims = claims.filter((c) => c.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-rose-500" />
            <span>Lost & Found Moderation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review ownership proof for claim requests and moderate community listings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Claim Requests</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold">
            {pendingClaims.length} Pending
          </span>
          {activeTab === 'claims' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'items'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>All Reported Items</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold">
            {items.length}
          </span>
          {activeTab === 'items' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Claims Tab */}
      {activeTab === 'claims' ? (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800">
              No claim requests have been filed yet.
            </div>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Claim on Found Item:
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {claim.itemTitle}
                    </h3>
                  </div>

                  <Badge
                    variant={
                      claim.status === 'approved'
                        ? 'success'
                        : claim.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="md"
                  >
                    {claim.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Claimant: {claim.claimantName}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {claim.claimantEmail} &bull; {claim.claimantPhone}
                    </span>
                  </div>

                  <div className="pt-2">
                    <strong className="block text-slate-700 dark:text-slate-300 mb-1">
                      Submitted Distinguishing Proof:
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      {claim.proofDetails}
                    </p>
                  </div>
                </div>

                {claim.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      onClick={() => handleClaimReview(claim.id, 'rejected')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleClaimReview(claim.id, 'approved')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                    >
                      Approve & Grant Ownership
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Items Tab Table */
        <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Item</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Reporter</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((itm) => (
                  <tr
                    key={itm.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                        {itm.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {itm.category} &bull; {new Date(itm.date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={itm.type === 'lost' ? 'danger' : 'success'} size="sm">
                        {itm.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {itm.reporterName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {itm.location}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={itm.status}
                        onChange={(e) =>
                          handleStatusChange(itm.id, e.target.value as LostFoundStatus)
                        }
                        className="px-2 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                      >
                        <option value="active">Active</option>
                        <option value="claimed">Claimed</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTargetId(itm.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message="Are you sure you want to remove this lost & found listing from the platform?"
      />
    </div>
  );
};
