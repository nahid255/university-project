import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { LostFoundItem, ClaimRequest, ClaimStatus, LostFoundStatus } from '../types';
import { INITIAL_LOST_FOUND, INITIAL_CLAIMS } from '../data/initialData';
import { createNotification } from './notificationService';

const LOST_FOUND_STORAGE_KEY = 'campusmate_lost_found_v1';
const CLAIMS_STORAGE_KEY = 'campusmate_claims_v1';

export const getLostFoundItems = async (): Promise<LostFoundItem[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'lostFoundItems'));
      const list: LostFoundItem[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as LostFoundItem));
      if (list.length > 0) {
        return sortItems(list);
      }
    } catch (e) {
      console.warn('Error fetching lost & found items from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(LOST_FOUND_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(LOST_FOUND_STORAGE_KEY, JSON.stringify(INITIAL_LOST_FOUND));
    return INITIAL_LOST_FOUND;
  }
  return sortItems(JSON.parse(raw));
};

const sortItems = (items: LostFoundItem[]): LostFoundItem[] => {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getLostFoundItemById = async (id: string): Promise<LostFoundItem | null> => {
  const items = await getLostFoundItems();
  return items.find((i) => i.id === id) || null;
};

export const createLostFoundItem = async (
  item: Omit<LostFoundItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<LostFoundItem> => {
  const id = `lf-${Date.now()}`;
  const now = new Date().toISOString();
  const newItem: LostFoundItem = {
    ...item,
    id,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'lostFoundItems', id), newItem);
  }

  const all = await getLostFoundItems();
  all.unshift(newItem);
  localStorage.setItem(LOST_FOUND_STORAGE_KEY, JSON.stringify(all));
  return newItem;
};

export const updateLostFoundItem = async (
  id: string,
  updates: Partial<LostFoundItem>
): Promise<LostFoundItem> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'lostFoundItems', id), {
      ...updates,
      updatedAt: now,
    } as Record<string, unknown>);
  }

  const all = await getLostFoundItems();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Lost & Found item not found');

  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  localStorage.setItem(LOST_FOUND_STORAGE_KEY, JSON.stringify(all));
  return all[idx];
};

export const deleteLostFoundItem = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'lostFoundItems', id));
  }

  const all = await getLostFoundItems();
  const filtered = all.filter((i) => i.id !== id);
  localStorage.setItem(LOST_FOUND_STORAGE_KEY, JSON.stringify(filtered));
};

// Claim requests management
export const getClaimRequests = async (): Promise<ClaimRequest[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'claimRequests'));
      const list: ClaimRequest[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ClaimRequest));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Error fetching claims from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(INITIAL_CLAIMS));
    return INITIAL_CLAIMS;
  }
  return JSON.parse(raw);
};

export const submitClaimRequest = async (
  claim: Omit<ClaimRequest, 'id' | 'submittedAt' | 'status'>
): Promise<ClaimRequest> => {
  const id = `clm-${Date.now()}`;
  const newClaim: ClaimRequest = {
    ...claim,
    id,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'claimRequests', id), newClaim);
  }

  const all = await getClaimRequests();
  all.unshift(newClaim);
  localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(all));
  return newClaim;
};

export const updateClaimStatus = async (
  claimId: string,
  status: ClaimStatus,
  reviewNotes?: string
): Promise<ClaimRequest> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'claimRequests', claimId), {
      status,
      reviewedAt: now,
      reviewNotes: reviewNotes || '',
    });
    const all = await getClaimRequests();
    const target = all.find((c) => c.id === claimId);
    if (target) {
      if (status === 'approved') {
        await updateLostFoundItem(target.itemId, { status: 'claimed' });
      }
      await createNotification({
        userId: target.claimantId,
        type: 'claim_update',
        title: `Claim Request ${status === 'approved' ? 'Approved' : 'Updated'}`,
        message: `Your claim for "${target.itemTitle}" was ${status}.`,
        link: `/lost-found/${target.itemId}`,
      });
      return target;
    }
  }

  const all = await getClaimRequests();
  const idx = all.findIndex((c) => c.id === claimId);
  if (idx === -1) throw new Error('Claim request not found');

  all[idx] = {
    ...all[idx],
    status,
    reviewedAt: now,
    reviewNotes: reviewNotes || all[idx].reviewNotes,
  };
  localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(all));

  // If approved, update item status to 'claimed'
  if (status === 'approved') {
    await updateLostFoundItem(all[idx].itemId, { status: 'claimed' });
  }

  await createNotification({
    userId: all[idx].claimantId,
    type: 'claim_update',
    title: `Claim Request ${status === 'approved' ? 'Approved' : 'Updated'}`,
    message: `Your claim for "${all[idx].itemTitle}" was ${status}.`,
    link: `/lost-found/${all[idx].itemId}`,
  });

  return all[idx];
};
