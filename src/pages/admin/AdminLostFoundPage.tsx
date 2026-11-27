import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Lost &amp; Found Moderation</h1>
        <p className="jstu-secondary">
          Review ownership proof for claim requests and moderate community listings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3.5 text-[15px] font-semibold transition-colors relative flex items-center gap-2.5 ${
            activeTab === 'claims'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Claim Requests</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold tabular-nums">
            {pendingClaims.length} Pending
          </span>
          {activeTab === 'claims' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3.5 text-[15px] font-semibold transition-colors relative flex items-center gap-2.5 ${
            activeTab === 'items'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>All Reported Items</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold tabular-nums">
            {items.length}
          </span>
          {activeTab === 'items' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Claims Tab */}
      {activeTab === 'claims' ? (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="jstu-surface p-10 text-center jstu-secondary">
              No claim requests have been filed yet.
            </div>
          ) : (
            claims.map((claim) => (
              <div key={claim.id} className="jstu-surface p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="jstu-meta font-semibold uppercase tracking-wide">
                      Claim on Found Item
                    </span>
                    <h3 className="jstu-card-title mt-0.5">{claim.itemTitle}</h3>
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

                <div className="jstu-inset p-4 space-y-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Claimant: {claim.claimantName}
                    </span>
                    <span className="jstu-meta font-mono tabular-nums">
                      {claim.claimantEmail} &middot; {claim.claimantPhone}
                    </span>
                  </div>

                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-200 mb-1.5">
                      Submitted Distinguishing Proof:
                    </strong>
                    <p className="jstu-body whitespace-pre-line bg-white dark:bg-[#0F172A] p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      {claim.proofDetails}
                    </p>
                  </div>
                </div>

                {claim.status === 'pending' && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                    <button
                      onClick={() => handleClaimReview(claim.id, 'rejected')}
                      className="jstu-btn-secondary text-rose-600 dark:text-rose-400"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleClaimReview(claim.id, 'approved')}
                      className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl text-[15px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                    >
                      Approve &amp; Grant Ownership
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Items Tab Table */
        <div className="jstu-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="jstu-table-th">Item</th>
                  <th className="jstu-table-th">Type</th>
                  <th className="jstu-table-th">Reporter</th>
                  <th className="jstu-table-th">Location</th>
                  <th className="jstu-table-th">Status</th>
                  <th className="jstu-table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {items.map((itm) => (
                  <tr
                    key={itm.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="jstu-table-td">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                        {itm.title}
                      </p>
                      <p className="jstu-meta tabular-nums">
                        {itm.category} &middot; {new Date(itm.date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="jstu-table-td">
                      <Badge variant={itm.type === 'lost' ? 'danger' : 'success'} size="sm">
                        {itm.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="jstu-table-td">{itm.reporterName}</td>
                    <td className="jstu-table-td text-slate-600 dark:text-slate-400">
                      {itm.location}
                    </td>
                    <td className="jstu-table-td">
                      <select
                        value={itm.status}
                        onChange={(e) =>
                          handleStatusChange(itm.id, e.target.value as LostFoundStatus)
                        }
                        className="jstu-select min-h-[38px] w-36"
                        aria-label="Item status"
                      >
                        <option value="active">Active</option>
                        <option value="claimed">Claimed</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="jstu-table-td text-right">
                      <button
                        onClick={() => setDeleteTargetId(itm.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Delete listing"
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
