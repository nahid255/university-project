import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { AppNotification, NotificationType } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/initialDataV2';

const NOTIFICATIONS_STORAGE_KEY = 'campusmate_notifications_v2';

const getStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
};

const saveStoredNotifications = (items: AppNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
};

export const getNotifications = async (
  userId: string,
  limitCount: number = 30
): Promise<AppNotification[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const list: AppNotification[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as AppNotification));
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching notifications from Firestore:', e);
    }
  }

  const all = getStoredNotifications();
  return all
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
};

export const createNotification = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
}): Promise<AppNotification> => {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newNotif: AppNotification = {
    ...params,
    id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
      return newNotif;
    } catch (e) {
      console.warn('Failed to write notification to Firestore:', e);
    }
  }

  const all = getStoredNotifications();
  all.unshift(newNotif);
  saveStoredNotifications(all.slice(0, 200));
  return newNotif;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
      return;
    } catch (e) {
      console.warn('Failed to mark notification read in Firestore:', e);
    }
  }

  const all = getStoredNotifications();
  const idx = all.findIndex((n) => n.id === notificationId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], isRead: true };
    saveStoredNotifications(all);
  }
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.update(d.ref, { isRead: true });
      });
      await batch.commit();
      return;
    } catch (e) {
      console.warn('Failed to mark all notifications read in Firestore:', e);
    }
  }

  const all = getStoredNotifications();
  const updated = all.map((n) => (n.userId === userId ? { ...n, isRead: true } : n));
  saveStoredNotifications(updated);
};
