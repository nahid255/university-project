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
  CampusEvent,
  EventRegistration,
  UserProfile,
} from '../types';
import { INITIAL_EVENTS, INITIAL_EVENT_REGISTRATIONS } from '../data/initialDataV2';
import { createNotification } from './notificationService';

const EVENTS_KEY = 'campusmate_events_v2';
const REGISTRATIONS_KEY = 'campusmate_event_registrations_v2';

const getStoredEvents = (): CampusEvent[] => {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVENTS;
  }
};

const getStoredRegistrations = (): EventRegistration[] => {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY);
    if (!raw) {
      localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(INITIAL_EVENT_REGISTRATIONS));
      return INITIAL_EVENT_REGISTRATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVENT_REGISTRATIONS;
  }
};

export const getEvents = async (includeDrafts: boolean = false): Promise<CampusEvent[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = includeDrafts
        ? query(collection(db, 'events'), limit(60))
        : query(collection(db, 'events'), where('status', '==', 'published'), limit(60));
      const snap = await getDocs(q);
      const list: CampusEvent[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as CampusEvent));
      return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (e) {
      console.warn('Error fetching events from Firestore:', e);
    }
  }

  return getStoredEvents()
    .filter((ev) => (includeDrafts ? true : ev.status === 'published'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const createEvent = async (
  event: Omit<CampusEvent, 'id' | 'registeredCount' | 'waitlistCount' | 'createdAt' | 'updatedAt'>
): Promise<CampusEvent> => {
  const now = new Date().toISOString();
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newEvent: CampusEvent = {
    ...event,
    id,
    registeredCount: 0,
    waitlistCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'events', id), newEvent);
    return newEvent;
  }

  const all = getStoredEvents();
  all.push(newEvent);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(all));
  return newEvent;
};

export const updateEvent = async (
  id: string,
  updates: Partial<CampusEvent>
): Promise<CampusEvent> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'events', id), {
      ...updates,
      updatedAt: now,
    } as Record<string, unknown>);
    const all = await getEvents(true);
    const found = all.find((e) => e.id === id);
    if (found) return found;
  }

  const all = getStoredEvents();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Event not found.');

  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  localStorage.setItem(EVENTS_KEY, JSON.stringify(all));
  return all[idx];
};

export const deleteEvent = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'events', id));
    return;
  }
  const all = getStoredEvents().filter((e) => e.id !== id);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(all));
};

// Registrations
export const getEventRegistrations = async (eventId?: string): Promise<EventRegistration[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = eventId
        ? query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId))
        : query(collection(db, 'eventRegistrations'), limit(150));
      const snap = await getDocs(q);
      const list: EventRegistration[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as EventRegistration));
      return list;
    } catch (e) {
      console.warn('Error fetching event registrations:', e);
    }
  }

  const all = getStoredRegistrations();
  return eventId ? all.filter((r) => r.eventId === eventId) : all;
};

export const getUserRegistrations = async (userId: string): Promise<EventRegistration[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'eventRegistrations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: EventRegistration[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as EventRegistration));
      return list;
    } catch (e) {
      console.warn('Error fetching user registrations:', e);
    }
  }
  return getStoredRegistrations().filter((r) => r.userId === userId);
};

export const registerForEvent = async (
  event: CampusEvent,
  user: UserProfile
): Promise<EventRegistration> => {
  if (event.status !== 'published') {
    throw new Error('Registrations are only open for published events.');
  }

  const regId = `${event.id}_${user.uid}`;
  const existing = (await getEventRegistrations(event.id)).find(
    (r) => r.id === regId && r.status !== 'cancelled'
  );
  if (existing) {
    throw new Error('You are already registered or waitlisted for this event.');
  }

  const isFull = event.registeredCount >= event.capacity;
  const regStatus = isFull ? 'waitlisted' : 'registered';
  const now = new Date().toISOString();

  const reg: EventRegistration = {
    id: regId,
    eventId: event.id,
    eventTitle: event.title,
    userId: user.uid,
    userName: user.fullName,
    userEmail: user.email,
    studentId: user.studentId,
    status: regStatus,
    registeredAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'eventRegistrations', regId), reg);
    await updateDoc(doc(db, 'events', event.id), {
      registeredCount: isFull ? event.registeredCount : event.registeredCount + 1,
      waitlistCount: isFull ? event.waitlistCount + 1 : event.waitlistCount,
      updatedAt: now,
    });
  } else {
    const regs = getStoredRegistrations().filter((r) => r.id !== regId);
    regs.push(reg);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(regs));

    const events = getStoredEvents();
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx !== -1) {
      if (isFull) {
        events[idx].waitlistCount = (events[idx].waitlistCount || 0) + 1;
      } else {
        events[idx].registeredCount = (events[idx].registeredCount || 0) + 1;
      }
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    }
  }

  await createNotification({
    userId: user.uid,
    type: 'event_registration',
    title: isFull ? 'Added to Event Waitlist' : 'Event Registration Confirmed',
    message: isFull
      ? `"${event.title}" is at capacity. You have been placed on the waitlist.`
      : `Your seat for "${event.title}" on ${event.date} is confirmed!`,
    link: '/events',
  });

  return reg;
};

export const cancelEventRegistration = async (
  event: CampusEvent,
  userId: string
): Promise<void> => {
  const regId = `${event.id}_${userId}`;
  const regs = await getEventRegistrations(event.id);
  const target = regs.find((r) => r.id === regId);
  if (!target || target.status === 'cancelled') return;

  const wasRegistered = target.status === 'registered';
  const wasWaitlisted = target.status === 'waitlisted';
  const now = new Date().toISOString();

  // Promote earliest waitlisted user if a registered seat opened
  const nextWaitlisted = wasRegistered
    ? regs
        .filter((r) => r.status === 'waitlisted')
        .sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime())[0]
    : undefined;

  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'eventRegistrations', regId), {
      status: 'cancelled',
      updatedAt: now,
    });

    if (nextWaitlisted) {
      await updateDoc(doc(db, 'eventRegistrations', nextWaitlisted.id), {
        status: 'registered',
        updatedAt: now,
      });
      await updateDoc(doc(db, 'events', event.id), {
        waitlistCount: Math.max(0, event.waitlistCount - 1),
        updatedAt: now,
      });
    } else {
      await updateDoc(doc(db, 'events', event.id), {
        registeredCount: wasRegistered
          ? Math.max(0, event.registeredCount - 1)
          : event.registeredCount,
        waitlistCount: wasWaitlisted
          ? Math.max(0, event.waitlistCount - 1)
          : event.waitlistCount,
        updatedAt: now,
      });
    }
  } else {
    const allRegs = getStoredRegistrations();
    const rIdx = allRegs.findIndex((r) => r.id === regId);
    if (rIdx !== -1) {
      allRegs[rIdx].status = 'cancelled';
      allRegs[rIdx].updatedAt = now;
    }

    const events = getStoredEvents();
    const eIdx = events.findIndex((e) => e.id === event.id);

    if (nextWaitlisted) {
      const wIdx = allRegs.findIndex((r) => r.id === nextWaitlisted.id);
      if (wIdx !== -1) {
        allRegs[wIdx].status = 'registered';
        allRegs[wIdx].updatedAt = now;
      }
      if (eIdx !== -1) {
        events[eIdx].waitlistCount = Math.max(0, events[eIdx].waitlistCount - 1);
      }
    } else if (eIdx !== -1) {
      if (wasRegistered) {
        events[eIdx].registeredCount = Math.max(0, events[eIdx].registeredCount - 1);
      } else if (wasWaitlisted) {
        events[eIdx].waitlistCount = Math.max(0, events[eIdx].waitlistCount - 1);
      }
    }

    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(allRegs));
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }

  if (nextWaitlisted) {
    await createNotification({
      userId: nextWaitlisted.userId,
      type: 'event_registration',
      title: 'Promoted from Event Waitlist!',
      message: `A seat opened up for "${event.title}". Your registration is now confirmed!`,
      link: '/events',
    });
  }
};
