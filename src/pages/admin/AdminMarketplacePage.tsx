import React, { useEffect, useState } from 'react';
import { ShoppingBag, BookCopy, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMarketplaceListings,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  getBookListings,
  updateBookListing,
  deleteBookListing,
} from '../../services/marketplaceService';
import {
  MarketplaceListing,
  BookListing,
  ListingStatus,
  BookListingStatus,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { logActivity } from '../../services/adminService';

export const AdminMarketplacePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'marketplace' | 'books'>('marketplace');
  const [marketplace, setMarketplace] = useState<MarketplaceListing[]>([]);
  const [books, setBooks] = useState<BookListing[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'marketplace' | 'book';
    id: string;
    title: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mkt, bk] = await Promise.all([
        getMarketplaceListings(120),
        getBookListings(120),
      ]);
      setMarketplace(mkt);
      setBooks(bk);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;
    if (deleteTarget.kind === 'marketplace') {
      await deleteMarketplaceListing(deleteTarget.id);
      setMarketplace((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } else {
      await deleteBookListing(deleteTarget.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    }
    logActivity({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      action: `Removed ${deleteTarget.kind} listing`,
      target: deleteTarget.title,
      type: 'admin',
    });
    setDeleteTarget(null);
  };

  if (loading) {
    return <LoadingSpinner label="Loading marketplace & book exchange moderation..." />;
  }

  const q = search.toLowerCase();
  const filteredMkt = marketplace.filter(
    (m) =>
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.sellerName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
  );
  const filteredBooks = books.filter(
    (b) =>
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.sellerName.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-purple-600" />
          <span>Marketplace &amp; Book Exchange Moderation</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Inspect active listings, update statuses, or remove policy-violating items
        </p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setTab('marketplace')}
          className={`pb-3 text-sm font-bold relative flex items-center gap-2 ${
            tab === 'marketplace' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Marketplace ({marketplace.length})</span>
          {tab === 'marketplace' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab('books')}
          className={`pb-3 text-sm font-bold relative flex items-center gap-2 ${
            tab === 'books' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <BookCopy className="w-4 h-4" />
          <span>Book Exchange ({books.length})</span>
          {tab === 'books' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings by title, seller, or category..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>

      {tab === 'marketplace' ? (
        <div className="space-y-3">
          {filteredMkt.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#111C32] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-blue-600">${item.price}</span>
                  <Badge variant="info" size="sm">
                    {item.category}
                  </Badge>
                  <Badge
                    variant={item.status === 'Available' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Seller: {item.sellerName} ({item.sellerEmail})
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={item.status}
                  onChange={async (e) => {
                    const updated = await updateMarketplaceListing(item.id, {
                      status: e.target.value as ListingStatus,
                    });
                    setMarketplace((prev) =>
                      prev.map((m) => (m.id === item.id ? updated : m))
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Sold">Sold</option>
                </select>
                <button
                  onClick={() =>
                    setDeleteTarget({ kind: 'marketplace', id: item.id, title: item.title })
                  }
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-[#111C32] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="purple" size="sm">
                    {book.listingType === 'Sale' ? `$${book.price}` : 'Exchange'}
                  </Badge>
                  <Badge variant="info" size="sm">
                    {book.subjectDepartment}
                  </Badge>
                  <Badge
                    variant={book.status === 'Available' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {book.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {book.title} — {book.author}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Owner: {book.sellerName} ({book.sellerEmail})
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={book.status}
                  onChange={async (e) => {
                    const updated = await updateBookListing(book.id, {
                      status: e.target.value as BookListingStatus,
                    });
                    setBooks((prev) => prev.map((b) => (b.id === book.id ? updated : b)));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800"
                >
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Sold">Sold</option>
                  <option value="Exchanged">Exchanged</option>
                </select>
                <button
                  onClick={() =>
                    setDeleteTarget({ kind: 'book', id: book.id, title: book.title })
                  }
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Listing"
        message={`Are you sure you want to remove "${deleteTarget?.title}"?`}
      />
    </div>
  );
};
