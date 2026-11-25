import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  Club,
  ClubMembership,
  ClubAnnouncement,
  MembershipStatus,
  UserProfile,
} from '../types';
import { INITIAL_CLUBS, INITIAL_CLUB_MEMBERSHIPS } from '../data/initialDataV2';
import { createNotification } from './notificationService';

const CLUBS_KEY = 'campusmate_clubs_v2';
const MEMBERSHIPS_KEY = 'campusmate_club_memberships_v2';

const getStoredClubs = (): Club[] => {
  try {
    const raw = localStorage.getItem(CLUBS_KEY);
    if (!raw) {
      localStorage.setItem(CLUBS_KEY, JSON.stringify(INITIAL_CLUBS));
      return INITIAL_CLUBS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLUBS;
  }
};

const getStoredMemberships = (): ClubMembership[] => {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(INITIAL_CLUB_MEMBERSHIPS));
      return INITIAL_CLUB_MEMBERSHIPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CLUB_MEMBERSHIPS;
  }
};

export const getClubs = async (): Promise<Club[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(query(collection(db, 'clubs'), limit(60)));
      const list: Club[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Club));
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.warn('Error fetching clubs from Firestore:', e);
    }
  }

  return getStoredClubs().sort((a, b) => a.name.localeCompare(b.name));
};

export const createClub = async (
  club: Omit<Club, 'id' | 'announcements' | 'memberCount' | 'createdAt' | 'updatedAt'>,
  creator: UserProfile
): Promise<Club> => {
  if (creator.role !== 'admin') {
    throw new Error('Unauthorized: Only university administrators can create verified official clubs.');
  }

  const now = new Date().toISOString();
  const id = `club-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newClub: Club = {
    ...club,
    id,
    announcements: [],
    memberCount: 1,
    isVerifiedOfficial: true,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'clubs', id), newClub);
    return newClub;
  }

  const all = getStoredClubs();
  all.push(newClub);
  localStorage.setItem(CLUBS_KEY, JSON.stringify(all));
  return newClub;
};

export const updateClub = async (id: string, updates: Partial<Club>): Promise<Club> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'clubs', id), {
      ...updates,
      updatedAt: now,
    } as Record<string, unknown>);
    const all = await getClubs();
    const found = all.find((c) => c.id === id);
    if (found) return found;
  }

  const all = getStoredClubs();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Club not found.');
  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  localStorage.setItem(CLUBS_KEY, JSON.stringify(all));
  return all[idx];
};

export const deleteClub = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'clubs', id));
    return;
  }
  const all = getStoredClubs().filter((c) => c.id !== id);
  localStorage.setItem(CLUBS_KEY, JSON.stringify(all));
};

export const publishClubAnnouncement = async (
  club: Club,
  author: UserProfile,
  title: string,
  content: string
): Promise<Club> => {
  const isAuthorized = author.role === 'admin' || club.managerIds.includes(author.uid);
  if (!isAuthorized) {
    throw new Error('Unauthorized: Only admins or club managers can publish club announcements.');
  }

  const announcement: ClubAnnouncement = {
    id: `ca-${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    authorName: author.fullName,
    createdAt: new Date().toISOString(),
  };

  const updatedAnnouncements = [announcement, ...(club.announcements || [])];
  return updateClub(club.id, { announcements: updatedAnnouncements });
};

// Club Memberships
export const getClubMemberships = async (clubId?: string): Promise<ClubMembership[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = clubId
        ? query(collection(db, 'clubMemberships'), where('clubId', '==', clubId))
        : query(collection(db, 'clubMemberships'), limit(150));
      const snap = await getDocs(q);
      const list: ClubMembership[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ClubMembership));
      return list;
    } catch (e) {
      console.warn('Error fetching club memberships:', e);
    }
  }

  const all = getStoredMemberships();
  return clubId ? all.filter((m) => m.clubId === clubId) : all;
};

export const getUserMemberships = async (userId: string): Promise<ClubMembership[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'clubMemberships'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: ClubMembership[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ClubMembership));
      return list;
    } catch (e) {
      console.warn('Error fetching user memberships:', e);
    }
  }

  return getStoredMemberships().filter((m) => m.userId === userId);
};

export const requestClubMembership = async (
  club: Club,
  user: UserProfile,
  reason: string
): Promise<ClubMembership> => {
  const id = `${club.id}_${user.uid}`;
  const existing = (await getUserMemberships(user.uid)).find((m) => m.id === id);
  if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
    throw new Error(`You already have a ${existing.status} membership for ${club.name}.`);
  }

  const membership: ClubMembership = {
    id,
    clubId: club.id,
    clubName: club.name,
    userId: user.uid,
    userName: user.fullName,
    userEmail: user.email,
    studentId: user.studentId,
    department: user.department,
    reason: reason.trim(),
    role: 'member',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'clubMemberships', id), membership);
    return membership;
  }

  const all = getStoredMemberships().filter((m) => m.id !== id);
  all.unshift(membership);
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(all));
  return membership;
};

export const reviewClubMembership = async (
  membership: ClubMembership,
  status: MembershipStatus,
  club: Club
): Promise<ClubMembership> => {
  const now = new Date().toISOString();
  const updated: ClubMembership = {
    ...membership,
    status,
    reviewedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'clubMemberships', membership.id), {
      status,
      reviewedAt: now,
    });
    if (status === 'approved' && membership.status !== 'approved') {
      await updateDoc(doc(db, 'clubs', club.id), {
        memberCount: club.memberCount + 1,
        updatedAt: now,
      });
    }
  } else {
    const all = getStoredMemberships();
    const idx = all.findIndex((m) => m.id === membership.id);
    if (idx !== -1) {
      all[idx] = updated;
      localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(all));
    }

    if (status === 'approved' && membership.status !== 'approved') {
      const clubs = getStoredClubs();
      const cIdx = clubs.findIndex((c) => c.id === club.id);
      if (cIdx !== -1) {
        clubs[cIdx].memberCount = (clubs[cIdx].memberCount || 0) + 1;
        localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));
      }
    }
  }

  await createNotification({
    userId: membership.userId,
    type: 'club_membership',
    title: `Club Membership ${status === 'approved' ? 'Approved' : 'Updated'}`,
    message: `Your membership request for "${club.name}" was ${status}.`,
    link: '/clubs',
  });

  return updated;
};
