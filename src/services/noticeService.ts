import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Notice, NoticeCategory } from '../types';
import { INITIAL_NOTICES } from '../data/initialData';

const NOTICES_STORAGE_KEY = 'campusmate_notices_v1';

export const getNotices = async (isAdmin: boolean = false): Promise<Notice[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = isAdmin
        ? collection(db, 'notices')
        : query(collection(db, 'notices'), where('status', '==', 'published'));
      const snap = await getDocs(q);
      const list: Notice[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Notice));
      if (list.length > 0) {
        return sortNotices(list);
      }
    } catch (e) {
      console.warn('Error fetching notices from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
  let allNotices: Notice[] = [];
  if (!raw) {
    allNotices = INITIAL_NOTICES;
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(INITIAL_NOTICES));
  } else {
    allNotices = JSON.parse(raw);
  }

  const filtered = isAdmin ? allNotices : allNotices.filter((n) => n.status === 'published');
  return sortNotices(filtered);
};

export const getNoticeById = async (id: string): Promise<Notice | null> => {
  const all = await getNotices(true);
  return all.find((n) => n.id === id) || null;
};

const sortNotices = (notices: Notice[]): Notice[] => {
  return [...notices].sort((a, b) => {
    // Pinned notices first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then newest publication date first
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
};

export const createNotice = async (
  notice: Omit<Notice, 'id' | 'publishedAt'>
): Promise<Notice> => {
  const id = `nt-${Date.now()}`;
  const newNotice: Notice = {
    ...notice,
    id,
    publishedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'notices', id), newNotice);
  }

  const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
  const all: Notice[] = raw ? JSON.parse(raw) : INITIAL_NOTICES;
  all.unshift(newNotice);
  localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(all));
  return newNotice;
};

export const updateNotice = async (
  id: string,
  updates: Partial<Notice>
): Promise<Notice> => {
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'notices', id), updates as Record<string, unknown>);
    const all = await getNotices(true);
    const found = all.find((n) => n.id === id);
    if (found) return found;
  }

  const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
  const all: Notice[] = raw ? JSON.parse(raw) : INITIAL_NOTICES;
  const idx = all.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Notice not found');

  all[idx] = { ...all[idx], ...updates };
  localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(all));
  return all[idx];
};

export const deleteNotice = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'notices', id));
  }

  const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
  const all: Notice[] = raw ? JSON.parse(raw) : INITIAL_NOTICES;
  const filtered = all.filter((n) => n.id !== id);
  localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(filtered));
};
