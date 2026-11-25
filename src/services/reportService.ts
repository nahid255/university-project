import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { ContentReport, ReportStatus, BlockedUser } from '../types';
import { INITIAL_REPORTS } from '../data/initialDataV2';

const REPORTS_STORAGE_KEY = 'campusmate_reports_v2';
const BLOCKED_STORAGE_KEY = 'campusmate_blocked_users_v2';

const getStoredReports = (): ContentReport[] => {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPORTS;
  }
};

export const getReports = async (): Promise<ContentReport[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const list: ContentReport[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ContentReport));
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching reports from Firestore:', e);
    }
  }

  return getStoredReports().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const submitReport = async (
  report: Omit<ContentReport, 'id' | 'status' | 'createdAt'>
): Promise<ContentReport> => {
  const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newReport: ContentReport = {
    ...report,
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'reports', id), newReport);
    return newReport;
  }

  const all = getStoredReports();
  all.unshift(newReport);
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(all));
  return newReport;
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  actionTaken: string,
  reviewedBy: string
): Promise<ContentReport> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      actionTaken,
      reviewedBy,
      reviewedAt: now,
    });
    const all = await getReports();
    const found = all.find((r) => r.id === reportId);
    if (found) return found;
  }

  const all = getStoredReports();
  const idx = all.findIndex((r) => r.id === reportId);
  if (idx === -1) throw new Error('Report not found');

  all[idx] = {
    ...all[idx],
    status,
    actionTaken,
    reviewedBy,
    reviewedAt: now,
  };
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(all));
  return all[idx];
};

// Blocked users management
const getStoredBlocked = (): BlockedUser[] => {
  try {
    const raw = localStorage.getItem(BLOCKED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getBlockedUsers = async (blockerId: string): Promise<BlockedUser[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'blockedUsers'), where('blockerId', '==', blockerId));
      const snap = await getDocs(q);
      const list: BlockedUser[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as BlockedUser));
      return list;
    } catch (e) {
      console.warn('Error fetching blocked users:', e);
    }
  }
  return getStoredBlocked().filter((b) => b.blockerId === blockerId);
};

export const isUserBlockedBy = async (
  blockerId: string,
  blockedId: string
): Promise<boolean> => {
  const id = `${blockerId}_${blockedId}`;
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, 'blockedUsers', id));
      return snap.exists();
    } catch (e) {
      console.warn('Error checking block relationship:', e);
    }
  }
  return getStoredBlocked().some((b) => b.id === id);
};

export const blockUser = async (
  blockerId: string,
  blockedId: string,
  blockedName: string
): Promise<BlockedUser> => {
  if (blockerId === blockedId) throw new Error('Cannot block yourself.');
  const id = `${blockerId}_${blockedId}`;
  const entry: BlockedUser = {
    id,
    blockerId,
    blockedId,
    blockedName,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'blockedUsers', id), entry);
    return entry;
  }

  const all = getStoredBlocked().filter((b) => b.id !== id);
  all.push(entry);
  localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(all));
  return entry;
};

export const unblockUser = async (blockerId: string, blockedId: string): Promise<void> => {
  const id = `${blockerId}_${blockedId}`;
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'blockedUsers', id));
    return;
  }

  const all = getStoredBlocked().filter((b) => b.id !== id);
  localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(all));
};
