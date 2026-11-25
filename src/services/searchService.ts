import {
  Notice,
  StudyResource,
  CommunityPost,
  MarketplaceListing,
  BookListing,
  CampusEvent,
  Club,
  UserProfile,
} from '../types';
import { getNotices } from './noticeService';
import { getResources } from './resourceService';
import { getPosts } from './communityService';
import { getMarketplaceListings, getBookListings } from './marketplaceService';
import { getEvents } from './eventService';
import { getClubs } from './clubService';
import { getAllUsers } from './adminService';

export interface GlobalSearchResults {
  notices: Notice[];
  resources: StudyResource[];
  posts: CommunityPost[];
  marketplace: MarketplaceListing[];
  books: BookListing[];
  events: CampusEvent[];
  clubs: Club[];
  students: UserProfile[];
}

export const EMPTY_SEARCH_RESULTS: GlobalSearchResults = {
  notices: [],
  resources: [],
  posts: [],
  marketplace: [],
  books: [],
  events: [],
  clubs: [],
  students: [],
};

/**
 * Performs a bounded parallel fetch across CampusMate modules and applies
 * case-insensitive substring matching on the client.
 * Note: Firestore does not natively support multi-field full-text search
 * without an external index, so queries are bounded via service limit()s.
 */
export const globalSearch = async (queryText: string): Promise<GlobalSearchResults> => {
  const q = queryText.trim().toLowerCase();
  if (!q) return EMPTY_SEARCH_RESULTS;

  const [
    notices,
    resources,
    posts,
    marketplace,
    books,
    events,
    clubs,
    users,
  ] = await Promise.all([
    getNotices(false),
    getResources(),
    getPosts({ limitCount: 60 }),
    getMarketplaceListings(60),
    getBookListings(60),
    getEvents(false),
    getClubs(),
    getAllUsers(),
  ]);

  const matches = (...fields: Array<string | undefined>) =>
    fields.some((f) => (f || '').toLowerCase().includes(q));

  return {
    notices: notices.filter((n) => matches(n.title, n.content, n.category, n.department)),
    resources: resources.filter((r) =>
      matches(r.title, r.description, r.courseCode, r.category, r.uploadedByName)
    ),
    posts: posts.filter((p) =>
      matches(p.title, p.content, p.category, p.authorName, p.authorDepartment)
    ),
    marketplace: marketplace.filter((m) =>
      matches(m.title, m.description, m.category, m.condition, m.sellerName)
    ),
    books: books.filter((b) =>
      matches(b.title, b.author, b.subjectDepartment, b.isbn, b.description, b.sellerName)
    ),
    events: events.filter((e) =>
      matches(e.title, e.description, e.category, e.location, e.organizer)
    ),
    clubs: clubs.filter((c) =>
      matches(c.name, c.tagline, c.description, c.category, c.presidentName)
    ),
    students: users.filter((u) =>
      matches(u.fullName, u.studentId, u.department, u.batch)
    ),
  };
};
