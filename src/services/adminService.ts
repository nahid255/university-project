import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { UserProfile, AdminStats, ActivityLog } from '../types';
import { INITIAL_USERS, INITIAL_ACTIVITIES } from '../data/initialData';
import { getNotices } from './noticeService';
import { getLostFoundItems, getClaimRequests } from './lostFoundService';
import { getResources } from './resourceService';
import { getPosts } from './communityService';
import { getMarketplaceListings, getBookListings } from './marketplaceService';
import { getEvents, getEventRegistrations } from './eventService';
import { getClubs } from './clubService';
import { getReports } from './reportService';
import { getTransportationRoutes } from './transportationService';

const USERS_STORAGE_KEY = 'campusmate_users_v1';
const ACTIVITIES_STORAGE_KEY = 'campusmate_activities_v1';
const ASSIGNMENTS_STORAGE_KEY = 'campusmate_assignments_v1';

export type AnalyticsDateRange = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsCategoryItem {
  label: string;
  count: number;
  color: string;
}

export interface AdminAnalyticsData {
  rangeLabel: string;
  summary: {
    newStudents: number;
    communityPosts: number;
    totalComments: number;
    marketplaceActive: number;
    booksActive: number;
    lostFoundActive: number;
    eventRegistrations: number;
    resourceDownloads: number;
    publishedNotices: number;
    pendingReports: number;
  };
  departmentDistribution: AnalyticsCategoryItem[];
  listingBreakdown: AnalyticsCategoryItem[];
  resourceByCategory: AnalyticsCategoryItem[];
  eventAttendance: {
    title: string;
    registered: number;
    capacity: number;
    waitlist: number;
  }[];
  activityByType: AnalyticsCategoryItem[];
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const [
    students,
    notices,
    lostFound,
    claims,
    resources,
    posts,
    marketplace,
    books,
    events,
    clubs,
    reports,
    routes,
  ] = await Promise.all([
    getAllUsers(),
    getNotices(true),
    getLostFoundItems(),
    getClaimRequests(),
    getResources(),
    getPosts({ includeHidden: true, limitCount: 200 }),
    getMarketplaceListings(200),
    getBookListings(200),
    getEvents(true),
    getClubs(),
    getReports(),
    getTransportationRoutes({ publishedOnly: false }),
  ]);

  let totalAssignments = 0;
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(query(collection(db, 'assignments'), limit(500)));
      totalAssignments = snap.size;
    } catch {
      totalAssignments = 0;
    }
  }
  if (totalAssignments === 0) {
    try {
      const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
      if (raw) {
        totalAssignments = JSON.parse(raw).length;
      }
    } catch {
      totalAssignments = 0;
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    totalStudents: students.filter((u) => u.role === 'student').length,
    totalPublishedNotices: notices.filter((n) => n.status === 'published').length,
    totalAssignments,
    totalLostFoundPosts: lostFound.length,
    totalStudyResources: resources.length,
    pendingClaimRequests: claims.filter((c) => c.status === 'pending').length,
    totalCommunityPosts: posts.filter((p) => p.status !== 'removed').length,
    activeMarketplaceListings: marketplace.filter((m) => m.status === 'Available').length,
    activeBookListings: books.filter((b) => b.status === 'Available').length,
    upcomingEventsCount: events.filter((e) => e.status === 'published' && e.date >= todayStr).length,
    totalClubs: clubs.length,
    pendingReportsCount: reports.filter((r) => r.status === 'pending').length,
    totalTransportRoutes: routes.length,
    activeTransportRoutes: routes.filter((r) => r.published && r.status === 'Active').length,
  };
};

const isWithinRange = (isoDate: string | undefined, range: AnalyticsDateRange): boolean => {
  if (range === 'all' || !isoDate) return true;
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return true;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return ts >= cutoff;
};

export const getAnalyticsData = async (
  range: AnalyticsDateRange = '30d'
): Promise<AdminAnalyticsData> => {
  const [
    users,
    posts,
    marketplace,
    books,
    lostFound,
    events,
    registrations,
    resources,
    notices,
    reports,
    activities,
  ] = await Promise.all([
    getAllUsers(),
    getPosts({ includeHidden: true, limitCount: 200 }),
    getMarketplaceListings(200),
    getBookListings(200),
    getLostFoundItems(),
    getEvents(true),
    getEventRegistrations(),
    getResources(),
    getNotices(true),
    getReports(),
    getAuditActivities(),
  ]);

  const students = users.filter((u) => u.role === 'student');
  const filteredStudents = students.filter((s) => isWithinRange(s.createdAt, range));
  const filteredPosts = posts.filter((p) => p.status !== 'removed' && isWithinRange(p.createdAt, range));
  const filteredMarketplace = marketplace.filter((m) => isWithinRange(m.createdAt, range));
  const filteredBooks = books.filter((b) => isWithinRange(b.createdAt, range));
  const filteredLostFound = lostFound.filter((l) => isWithinRange(l.createdAt, range));
  const filteredRegistrations = registrations.filter(
    (r) => r.status !== 'cancelled' && isWithinRange(r.registeredAt, range)
  );
  const filteredResources = resources.filter((r) => isWithinRange(r.uploadedAt, range));
  const filteredNotices = notices.filter(
    (n) => n.status === 'published' && isWithinRange(n.publishedAt, range)
  );
  const filteredReports = reports.filter((r) => isWithinRange(r.createdAt, range));

  // Department distribution
  const deptCounts: Record<string, number> = {};
  students.forEach((s) => {
    const dept = s.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const palette = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];
  const departmentDistribution = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count], idx) => ({
      label,
      count,
      color: palette[idx % palette.length],
    }));

  // Active Listings Breakdown
  const listingBreakdown: AnalyticsCategoryItem[] = [
    {
      label: 'Marketplace Items',
      count: filteredMarketplace.filter((m) => m.status === 'Available').length,
      color: '#2563EB',
    },
    {
      label: 'Book Exchange',
      count: filteredBooks.filter((b) => b.status === 'Available').length,
      color: '#10B981',
    },
    {
      label: 'Lost & Found Active',
      count: filteredLostFound.filter((l) => l.status === 'active').length,
      color: '#F59E0B',
    },
  ];

  // Resource downloads by category
  const resCats: Record<string, number> = {};
  resources.forEach((r) => {
    resCats[r.category] = (resCats[r.category] || 0) + (r.downloadsCount || 0);
  });
  const resourceByCategory = Object.entries(resCats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count], idx) => ({
      label,
      count,
      color: palette[idx % palette.length],
    }));

  // Event Attendance
  const eventAttendance = events
    .filter((e) => e.status === 'published')
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      registered: e.registeredCount,
      capacity: e.capacity,
      waitlist: e.waitlistCount,
    }));

  // Activity distribution
  const actMap: Record<string, number> = {};
  activities.forEach((a) => {
    actMap[a.type] = (actMap[a.type] || 0) + 1;
  });
  const activityByType = Object.entries(actMap).map(([label, count], idx) => ({
    label: label.replace('_', ' '),
    count,
    color: palette[idx % palette.length],
  }));

  const rangeLabels: Record<AnalyticsDateRange, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    all: 'All Time',
  };

  return {
    rangeLabel: rangeLabels[range],
    summary: {
      newStudents: filteredStudents.length,
      communityPosts: filteredPosts.length,
      totalComments: filteredPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0),
      marketplaceActive: filteredMarketplace.filter((m) => m.status === 'Available').length,
      booksActive: filteredBooks.filter((b) => b.status === 'Available').length,
      lostFoundActive: filteredLostFound.filter((l) => l.status === 'active').length,
      eventRegistrations: filteredRegistrations.length,
      resourceDownloads: filteredResources.reduce((acc, r) => acc + (r.downloadsCount || 0), 0),
      publishedNotices: filteredNotices.length,
      pendingReports: filteredReports.filter((r) => r.status === 'pending').length,
    },
    departmentDistribution,
    listingBreakdown,
    resourceByCategory,
    eventAttendance,
    activityByType,
  };
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(query(collection(db, 'users'), limit(250)));
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ ...d.data(), uid: d.id } as UserProfile));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Error fetching all users from Firestore:', e);
    }
  }

  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(raw);
};

export const updateUserRoleByAdmin = async (
  uid: string,
  newRole: 'student' | 'admin',
  caller?: UserProfile | null
): Promise<void> => {
  if (!caller || caller.role !== 'admin') {
    throw new Error('Unauthorized: University Administration clearance is required.');
  }

  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
  }

  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  const users: UserProfile[] = raw ? JSON.parse(raw) : INITIAL_USERS;
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx !== -1) {
    users[idx].role = newRole;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
};

export const getAuditActivities = async (): Promise<ActivityLog[]> => {
  const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITIES));
    return INITIAL_ACTIVITIES;
  }
  return JSON.parse(raw);
};

export const logActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const id = `act-${Date.now()}`;
  const newLog: ActivityLog = {
    ...activity,
    id,
    timestamp: new Date().toISOString(),
  };

  const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
  const logs: ActivityLog[] = raw ? JSON.parse(raw) : INITIAL_ACTIVITIES;
  logs.unshift(newLog);
  localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
};
