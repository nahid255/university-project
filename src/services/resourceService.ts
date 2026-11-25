import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { StudyResource, ResourceCategory } from '../types';
import { INITIAL_RESOURCES } from '../data/initialData';

const RESOURCES_STORAGE_KEY = 'campusmate_resources_v1';

export const getResources = async (): Promise<StudyResource[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'studyResources'));
      const list: StudyResource[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as StudyResource));
      if (list.length > 0) {
        return sortResources(list);
      }
    } catch (e) {
      console.warn('Error fetching study resources from Firebase:', e);
    }
  }

  const raw = localStorage.getItem(RESOURCES_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(INITIAL_RESOURCES));
    return INITIAL_RESOURCES;
  }
  return sortResources(JSON.parse(raw));
};

const sortResources = (res: StudyResource[]): StudyResource[] => {
  return [...res].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
};

export const getResourceById = async (id: string): Promise<StudyResource | null> => {
  const all = await getResources();
  return all.find((r) => r.id === id) || null;
};

export const createResource = async (
  resource: Omit<StudyResource, 'id' | 'uploadedAt' | 'downloadsCount'>
): Promise<StudyResource> => {
  const id = `res-${Date.now()}`;
  const newRes: StudyResource = {
    ...resource,
    id,
    uploadedAt: new Date().toISOString(),
    downloadsCount: 0,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'studyResources', id), newRes);
  }

  const all = await getResources();
  all.unshift(newRes);
  localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(all));
  return newRes;
};

export const incrementResourceDownload = async (id: string): Promise<number> => {
  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'studyResources', id), {
        downloadsCount: increment(1),
      });
    } catch (e) {
      console.warn('Failed to increment download counter in Firestore', e);
    }
  }

  const all = await getResources();
  const idx = all.findIndex((r) => r.id === id);
  if (idx !== -1) {
    all[idx].downloadsCount = (all[idx].downloadsCount || 0) + 1;
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(all));
    return all[idx].downloadsCount;
  }
  return 0;
};

export const deleteResource = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'studyResources', id));
  }

  const all = await getResources();
  const filtered = all.filter((r) => r.id !== id);
  localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(filtered));
};
