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
  TransportationRoute,
  RouteStatus,
  UserProfile,
} from '../types';
import { DEMO_TRANSPORTATION_ROUTES } from '../data/initialTransportationData';

const TRANSPORT_STORAGE_KEY = 'jstucampus_transportation_routes_v1';

const getDemoStoredRoutes = (): TransportationRoute[] => {
  try {
    const raw = localStorage.getItem(TRANSPORT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        TRANSPORT_STORAGE_KEY,
        JSON.stringify(DEMO_TRANSPORTATION_ROUTES)
      );
      return DEMO_TRANSPORTATION_ROUTES;
    }
    return JSON.parse(raw) as TransportationRoute[];
  } catch {
    return DEMO_TRANSPORTATION_ROUTES;
  }
};

const saveDemoStoredRoutes = (routes: TransportationRoute[]) => {
  localStorage.setItem(TRANSPORT_STORAGE_KEY, JSON.stringify(routes));
};

const assertAdmin = (user: UserProfile | null | undefined) => {
  if (!user || user.role !== 'admin') {
    throw new Error(
      'Unauthorized: Only University Administration personnel may manage transportation routes.'
    );
  }
};

export const getTransportationRoutes = async (options?: {
  publishedOnly?: boolean;
}): Promise<TransportationRoute[]> => {
  const publishedOnly = options?.publishedOnly ?? false;

  if (isFirebaseConfigured() && db) {
    const q = publishedOnly
      ? query(
          collection(db, 'transportationRoutes'),
          where('published', '==', true),
          limit(100)
        )
      : query(collection(db, 'transportationRoutes'), limit(100));

    const snap = await getDocs(q);
    const list: TransportationRoute[] = [];
    snap.forEach((d) =>
      list.push({ ...d.data(), id: d.id } as TransportationRoute)
    );
    return list.sort((a, b) => a.routeName.localeCompare(b.routeName));
  }

  // Local preview mode only (when Firebase is not configured)
  const demoList = getDemoStoredRoutes();
  return demoList
    .filter((r) => (publishedOnly ? r.published === true : true))
    .sort((a, b) => a.routeName.localeCompare(b.routeName));
};

export type CreateTransportationRouteInput = Omit<
  TransportationRoute,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByName' | 'isDemoData'
>;

export const createTransportationRoute = async (
  input: CreateTransportationRouteInput,
  adminUser: UserProfile
): Promise<TransportationRoute> => {
  assertAdmin(adminUser);

  if (!input.routeName.trim()) throw new Error('Route Name is required.');
  if (!input.busNumber.trim()) throw new Error('Bus Number / Name is required.');
  if (!input.startingPoint.trim()) throw new Error('Starting Location is required.');
  if (!input.destination.trim()) throw new Error('Destination is required.');
  if (!input.departureTime.trim()) throw new Error('Departure Time is required.');
  if (!input.arrivalTime.trim()) throw new Error('Arrival Time is required.');
  if (!input.operatingDays || input.operatingDays.length === 0) {
    throw new Error('Select at least one operating day.');
  }
  if (!input.stops || input.stops.length === 0) {
    throw new Error('Add at least one route stop.');
  }

  const now = new Date().toISOString();
  const id = `route-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const cleanedStops = input.stops
    .map((s) => ({
      name: s.name.trim(),
      ...(s.scheduledTime?.trim() ? { scheduledTime: s.scheduledTime.trim() } : {}),
    }))
    .filter((s) => s.name.length > 0);

  if (cleanedStops.length === 0) {
    throw new Error('Each route must contain at least one valid stop name.');
  }

  const newRoute: TransportationRoute = {
    id,
    routeName: input.routeName.trim(),
    busNumber: input.busNumber.trim(),
    startingPoint: input.startingPoint.trim(),
    destination: input.destination.trim(),
    stops: cleanedStops,
    departureTime: input.departureTime.trim(),
    arrivalTime: input.arrivalTime.trim(),
    operatingDays: input.operatingDays,
    ...(input.driverName?.trim() ? { driverName: input.driverName.trim() } : {}),
    ...(input.driverContact?.trim()
      ? { driverContact: input.driverContact.trim() }
      : {}),
    status: input.status,
    ...(input.statusNote?.trim() ? { statusNote: input.statusNote.trim() } : {}),
    published: Boolean(input.published),
    createdAt: now,
    updatedAt: now,
    createdBy: adminUser.uid,
    createdByName: adminUser.fullName,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'transportationRoutes', id), newRoute);
    return newRoute;
  }

  const all = getDemoStoredRoutes();
  all.push({ ...newRoute, isDemoData: true });
  saveDemoStoredRoutes(all);
  return newRoute;
};

export const updateTransportationRoute = async (
  routeId: string,
  updates: Partial<
    Omit<TransportationRoute, 'id' | 'createdAt' | 'createdBy' | 'isDemoData'>
  >,
  adminUser: UserProfile
): Promise<void> => {
  assertAdmin(adminUser);
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    ...updates,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'transportationRoutes', routeId), payload);
    return;
  }

  const all = getDemoStoredRoutes();
  const idx = all.findIndex((r) => r.id === routeId);
  if (idx === -1) throw new Error('Transportation route not found.');
  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  saveDemoStoredRoutes(all);
};

export const togglePublishTransportationRoute = async (
  routeId: string,
  published: boolean,
  adminUser: UserProfile
): Promise<void> => {
  return updateTransportationRoute(routeId, { published }, adminUser);
};

export const updateTransportationStatus = async (
  routeId: string,
  status: RouteStatus,
  adminUser: UserProfile,
  statusNote?: string
): Promise<void> => {
  return updateTransportationRoute(
    routeId,
    {
      status,
      statusNote: statusNote?.trim() || '',
    },
    adminUser
  );
};

export const deleteTransportationRoute = async (
  routeId: string,
  adminUser: UserProfile
): Promise<void> => {
  assertAdmin(adminUser);

  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'transportationRoutes', routeId));
    return;
  }

  const all = getDemoStoredRoutes().filter((r) => r.id !== routeId);
  saveDemoStoredRoutes(all);
};
