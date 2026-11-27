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
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Marketplace &amp; Book Exchange Moderation</h1>
        <p className="jstu-secondary">
          Inspect active listings, update statuses, or remove policy-violating items from student boards.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setTab('marketplace')}
          className={`pb-3.5 text-[15px] font-semibold relative flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            tab === 'marketplace'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="tabular-nums">Marketplace ({marketplace.length})</span>
          {tab === 'marketplace' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setTab('books')}
          className={`pb-3.5 text-[15px] font-semibold relative flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            tab === 'books'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookCopy className="w-4 h-4" />
          <span className="tabular-nums">Book Exchange ({books.length})</span>
          {tab === 'books' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="jstu-surface p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings by title, seller, or category..."
            className="jstu-input pl-11"
          />
        </div>
      </div>

      {tab === 'marketplace' ? (
        <div className="space-y-4">
          {filteredMkt.length === 0 ? (
            <div className="jstu-surface p-8 text-center jstu-secondary">
              No marketplace listings matched your search.
            </div>
          ) : (
            filteredMkt.map((item) => (
              <div
                key={item.id}
                className="jstu-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      ${item.price}
                    </span>
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
                  <h3 className="jstu-card-title truncate">{item.title}</h3>
                  <p className="jstu-meta">
                    Seller: {item.sellerName} ({item.sellerEmail})
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
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
                    className="jstu-select w-36 min-h-[40px] py-2"
                    aria-label={`Status for ${item.title}`}
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                  <button
                    onClick={() =>
                      setDeleteTarget({ kind: 'marketplace', id: item.id, title: item.title })
                    }
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete listing"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBooks.length === 0 ? (
            <div className="jstu-surface p-8 text-center jstu-secondary">
              No book exchange listings matched your search.
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div
                key={book.id}
                className="jstu-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant="purple" size="sm">
                      <span className="tabular-nums">
                        {book.listingType === 'Sale' ? `$${book.price}` : 'Exchange'}
                      </span>
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
                  <h3 className="jstu-card-title truncate">
                    {book.title} &mdash; {book.author}
                  </h3>
                  <p className="jstu-meta">
                    Owner: {book.sellerName} ({book.sellerEmail})
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <select
                    value={book.status}
                    onChange={async (e) => {
                      const updated = await updateBookListing(book.id, {
                        status: e.target.value as BookListingStatus,
                      });
                      setBooks((prev) => prev.map((b) => (b.id === book.id ? updated : b)));
                    }}
                    className="jstu-select w-36 min-h-[40px] py-2"
                    aria-label={`Status for ${book.title}`}
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
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete book listing"
                    aria-label={`Delete ${book.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
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
