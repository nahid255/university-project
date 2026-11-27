import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  LabCategoryId,
  LabExperimentProgress,
  LabExperimentSettings,
  LabStatus,
} from '../types/mylab';

const LAB_PROGRESS_KEY = 'campusmate_mylab_progress_v2';

const getAllStoredProgress = (): LabExperimentProgress[] => {
  try {
    const raw = localStorage.getItem(LAB_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as LabExperimentProgress[]) : [];
  } catch {
    return [];
  }
};

const saveAllStoredProgress = (items: LabExperimentProgress[]) => {
  try {
    localStorage.setItem(LAB_PROGRESS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not persist My Lab progress locally:', e);
  }
};

export const getUserLabProgress = async (
  userId: string
): Promise<LabExperimentProgress[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'labProgress'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: LabExperimentProgress[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as LabExperimentProgress));
      return list.sort(
        (a, b) =>
          new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching lab progress from Firestore:', e);
    }
  }

  return getAllStoredProgress()
    .filter((p) => p.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
};

async function upsertProgressRecord(
  userId: string,
  experimentId: string,
  categoryId: LabCategoryId,
  updater: (existing: LabExperimentProgress | undefined) => LabExperimentProgress
): Promise<LabExperimentProgress> {
  const docId = `${userId}_${experimentId}`;
  const currentList = await getUserLabProgress(userId);
  const existing = currentList.find((item) => item.id === docId);
  const nextRecord = updater(existing);

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'labProgress', docId), nextRecord, { merge: true });
    return nextRecord;
  }

  const all = getAllStoredProgress().filter((item) => item.id !== docId);
  all.unshift(nextRecord);
  saveAllStoredProgress(all);
  return nextRecord;
}

export const recordExperimentOpened = async (
  userId: string,
  experimentId: string,
  categoryId: LabCategoryId
): Promise<LabExperimentProgress> => {
  const now = new Date().toISOString();
  return upsertProgressRecord(userId, experimentId, categoryId, (existing) => {
    const nextStatus: LabStatus =
      existing?.status === 'completed' ? 'completed' : 'in_progress';
    return {
      id: `${userId}_${experimentId}`,
      userId,
      experimentId,
      categoryId,
      status: nextStatus,
      lastOpenedAt: now,
      completedAt: existing?.completedAt,
      challengesSolved: existing?.challengesSolved || [],
      settings: existing?.settings,
    };
  });
};

export const saveExperimentSettings = async (
  userId: string,
  experimentId: string,
  categoryId: LabCategoryId,
  settings: LabExperimentSettings
): Promise<LabExperimentProgress> => {
  const now = new Date().toISOString();
  return upsertProgressRecord(userId, experimentId, categoryId, (existing) => ({
    id: `${userId}_${experimentId}`,
    userId,
    experimentId,
    categoryId,
    status: existing?.status || 'in_progress',
    lastOpenedAt: now,
    completedAt: existing?.completedAt,
    challengesSolved: existing?.challengesSolved || [],
    settings: {
      ...(existing?.settings || {}),
      ...settings,
    },
  }));
};

export const markExperimentCompleted = async (
  userId: string,
  experimentId: string,
  categoryId: LabCategoryId,
  completed: boolean
): Promise<LabExperimentProgress> => {
  const now = new Date().toISOString();
  return upsertProgressRecord(userId, experimentId, categoryId, (existing) => ({
    id: `${userId}_${experimentId}`,
    userId,
    experimentId,
    categoryId,
    status: completed ? 'completed' : 'in_progress',
    lastOpenedAt: now,
    completedAt: completed ? now : undefined,
    challengesSolved: existing?.challengesSolved || [],
    settings: existing?.settings,
  }));
};

export const markChallengeSolved = async (
  userId: string,
  experimentId: string,
  categoryId: LabCategoryId,
  challengeId: string
): Promise<LabExperimentProgress> => {
  const now = new Date().toISOString();
  return upsertProgressRecord(userId, experimentId, categoryId, (existing) => {
    const prevSolved = existing?.challengesSolved || [];
    const nextSolved = prevSolved.includes(challengeId)
      ? prevSolved
      : [...prevSolved, challengeId];
    return {
      id: `${userId}_${experimentId}`,
      userId,
      experimentId,
      categoryId,
      status: existing?.status || 'in_progress',
      lastOpenedAt: now,
      completedAt: existing?.completedAt,
      challengesSolved: nextSolved,
      settings: existing?.settings,
    };
  });
};
