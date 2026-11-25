import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  MarketplaceListing,
  BookListing,
  UserProfile,
} from '../types';
import { INITIAL_MARKETPLACE, INITIAL_BOOKS } from '../data/initialDataV2';
import { createNotification } from './notificationService';
import { getOrCreateConversation, sendMessage } from './messagingService';

const MARKETPLACE_KEY = 'campusmate_marketplace_v2';
const BOOKS_KEY = 'campusmate_books_v2';

const getStoredMarketplace = (): MarketplaceListing[] => {
  try {
    const raw = localStorage.getItem(MARKETPLACE_KEY);
    if (!raw) {
      localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(INITIAL_MARKETPLACE));
      return INITIAL_MARKETPLACE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MARKETPLACE;
  }
};

const getStoredBooks = (): BookListing[] => {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKS;
  }
};

// Marketplace Listings
export const getMarketplaceListings = async (
  limitCount: number = 60
): Promise<MarketplaceListing[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(query(collection(db, 'marketplaceListings'), limit(limitCount)));
      const list: MarketplaceListing[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as MarketplaceListing));
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching marketplace listings from Firestore:', e);
    }
  }

  return getStoredMarketplace()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
};

export const createMarketplaceListing = async (
  listing: Omit<MarketplaceListing, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<MarketplaceListing> => {
  const now = new Date().toISOString();
  const id = `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newItem: MarketplaceListing = {
    ...listing,
    id,
    status: 'Available',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'marketplaceListings', id), newItem);
    return newItem;
  }

  const all = getStoredMarketplace();
  all.unshift(newItem);
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(all));
  return newItem;
};

export const updateMarketplaceListing = async (
  id: string,
  updates: Partial<MarketplaceListing>
): Promise<MarketplaceListing> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'marketplaceListings', id), {
      ...updates,
      updatedAt: now,
    } as Record<string, unknown>);
    const all = await getMarketplaceListings();
    const found = all.find((i) => i.id === id);
    if (found) return found;
  }

  const all = getStoredMarketplace();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Listing not found.');

  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(all));
  return all[idx];
};

export const deleteMarketplaceListing = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'marketplaceListings', id));
    return;
  }
  const all = getStoredMarketplace().filter((i) => i.id !== id);
  localStorage.setItem(MARKETPLACE_KEY, JSON.stringify(all));
};

// Book Exchange Listings
export const getBookListings = async (limitCount: number = 60): Promise<BookListing[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(query(collection(db, 'bookListings'), limit(limitCount)));
      const list: BookListing[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as BookListing));
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching book listings from Firestore:', e);
    }
  }

  return getStoredBooks()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
};

export const createBookListing = async (
  book: Omit<BookListing, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<BookListing> => {
  const now = new Date().toISOString();
  const id = `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newBook: BookListing = {
    ...book,
    id,
    status: 'Available',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'bookListings', id), newBook);
    return newBook;
  }

  const all = getStoredBooks();
  all.unshift(newBook);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(all));
  return newBook;
};

export const updateBookListing = async (
  id: string,
  updates: Partial<BookListing>
): Promise<BookListing> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'bookListings', id), {
      ...updates,
      updatedAt: now,
    } as Record<string, unknown>);
    const all = await getBookListings();
    const found = all.find((i) => i.id === id);
    if (found) return found;
  }

  const all = getStoredBooks();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Book listing not found.');

  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  localStorage.setItem(BOOKS_KEY, JSON.stringify(all));
  return all[idx];
};

export const deleteBookListing = async (id: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'bookListings', id));
    return;
  }
  const all = getStoredBooks().filter((i) => i.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(all));
};

// Privacy-conscious contact inquiry: notifies seller + opens 1-to-1 message thread
export const sendSellerInquiry = async (params: {
  buyer: UserProfile;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  listingType: 'marketplace' | 'book';
  messageText: string;
}): Promise<string> => {
  const conv = await getOrCreateConversation(params.buyer, {
    uid: params.sellerId,
    fullName: params.sellerName,
  });

  const prefix = params.listingType === 'book' ? '[Book Exchange Inquiry]' : '[Marketplace Inquiry]';
  await sendMessage(
    conv,
    params.buyer,
    `${prefix} Regarding "${params.listingTitle}": ${params.messageText.trim()}`
  );

  await createNotification({
    userId: params.sellerId,
    type: 'marketplace_inquiry',
    title: 'New Listing Inquiry',
    message: `${params.buyer.fullName} inquired about "${params.listingTitle}"`,
    link: `/messages?conv=${conv.id}`,
  });

  return conv.id;
};
