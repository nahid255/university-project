import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookCopy,
  Plus,
  Search,
  ShoppingBag,
  MessageSquare,
  Flag,
  Edit3,
  Trash2,
  Camera,
  Lock,
  Mail,
  Phone,
  ArrowLeftRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getBookListings,
  createBookListing,
  updateBookListing,
  deleteBookListing,
  sendSellerInquiry,
} from '../../services/marketplaceService';
import { uploadFile, validateFile } from '../../services/storage';
import {
  BookListing,
  BookListingType,
  BookListingStatus,
  ItemCondition,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReportModal } from '../../components/common/ReportModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CONDITIONS: ItemCondition[] = ['Brand New', 'Like New', 'Good', 'Used'];
const STATUSES: BookListingStatus[] = ['Available', 'Reserved', 'Sold', 'Exchanged'];

export const BookExchangePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [books, setBooks] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | BookListingType>('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookListing | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [subjectDepartment, setSubjectDepartment] = useState('Computer Science & Engineering');
  const [listingType, setListingType] = useState<BookListingType>('Sale');
  const [price, setPrice] = useState('');
  const [exchangeFor, setExchangeFor] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [description, setDescription] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [isContactPublic, setIsContactPublic] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inquiry, Delete, Report
  const [contactBook, setContactBook] = useState<BookListing | null>(null);
  const [inquiryText, setInquiryText] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookListing | null>(null);
  const [reportTarget, setReportTarget] = useState<BookListing | null>(null);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await getBookListings(80);
      setBooks(data);
    } catch (e) {
      console.error('Failed to load book listings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const openCreateModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setIsbn('');
    setSubjectDepartment(currentUser?.department || 'Computer Science & Engineering');
    setListingType('Sale');
    setPrice('');
    setExchangeFor('');
    setCondition('Good');
    setDescription('');
    setSellerPhone(currentUser?.phone || '');
    setIsContactPublic(false);
    setImageUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (book: BookListing) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setIsbn(book.isbn || '');
    setSubjectDepartment(book.subjectDepartment);
    setListingType(book.listingType);
    setPrice(book.price ? String(book.price) : '');
    setExchangeFor(book.exchangeFor || '');
    setCondition(book.condition);
    setDescription(book.description);
    setSellerPhone(book.sellerPhone || '');
    setIsContactPublic(book.isContactPublic);
    setImageUrl(book.imageUrl || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/*'],
    });
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid image.');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadFile(file, `marketplace/books_${Date.now()}_${file.name}`);
      setImageUrl(url);
    } catch {
      setFormError('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    if (!title.trim() || !author.trim() || !subjectDepartment.trim()) {
      setFormError('Title, author, and department/subject are required.');
      return;
    }
    if (listingType === 'Sale' && (!price || Number(price) < 0)) {
      setFormError('Please specify a valid sale price.');
      return;
    }
    if (listingType === 'Exchange' && !exchangeFor.trim()) {
      setFormError('Please describe which book(s) you want to exchange for.');
      return;
    }
    if (imageUrl.trim() && !isSafeUrl(imageUrl.trim())) {
      setFormError('Please enter a valid http(s) image URL.');
      return;
    }

    const safeImg = imageUrl.trim() ? sanitizeUrl(imageUrl.trim()) : undefined;

    if (editingBook) {
      const updated = await updateBookListing(editingBook.id, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        subjectDepartment: subjectDepartment.trim(),
        listingType,
        price: listingType === 'Sale' ? Number(price) : undefined,
        exchangeFor: listingType === 'Exchange' ? exchangeFor.trim() : undefined,
        condition,
        description: description.trim(),
        sellerPhone: sellerPhone.trim() || undefined,
        isContactPublic,
        imageUrl: safeImg,
      });
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } else {
      const created = await createBookListing({
        sellerId: currentUser.uid,
        sellerName: currentUser.fullName,
        sellerDepartment: currentUser.department,
        sellerEmail: currentUser.email,
        sellerPhone: sellerPhone.trim() || undefined,
        isContactPublic,
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || undefined,
        subjectDepartment: subjectDepartment.trim(),
        listingType,
        price: listingType === 'Sale' ? Number(price) : undefined,
        exchangeFor: listingType === 'Exchange' ? exchangeFor.trim() : undefined,
        condition,
        description: description.trim(),
        imageUrl: safeImg,
      });
      setBooks((prev) => [created, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = async (book: BookListing, status: BookListingStatus) => {
    const updated = await updateBookListing(book.id, { status });
    setBooks((prev) => prev.map((b) => (b.id === book.id ? updated : b)));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteBookListing(deleteTarget.id);
    setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !contactBook || !inquiryText.trim()) return;
    try {
      setSendingInquiry(true);
      const convId = await sendSellerInquiry({
        buyer: currentUser,
        sellerId: contactBook.sellerId,
        sellerName: contactBook.sellerName,
        listingTitle: contactBook.title,
        listingType: 'book',
        messageText: inquiryText.trim(),
      });
      setContactBook(null);
      setInquiryText('');
      navigate(`/messages?conv=${encodeURIComponent(convId)}`);
    } finally {
      setSendingInquiry(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus book exchange..." />;
  }

  const departments = ['All', ...Array.from(new Set(books.map((b) => b.subjectDepartment)))];

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn || '').toLowerCase().includes(q) ||
      b.subjectDepartment.toLowerCase().includes(q);
    const matchesDept = departmentFilter === 'All' || b.subjectDepartment === departmentFilter;
    const matchesType = typeFilter === 'All' || b.listingType === typeFilter;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookCopy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>University Book Exchange</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Trade or buy textbooks by title, author, and department with verified students
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>General Marketplace</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>List a Book</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by book title, author (e.g. Cormen), ISBN, or subject..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Departments / Subjects' : d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['All', 'Sale', 'Exchange'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                typeFilter === t
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {t === 'All' ? 'All Listings' : t === 'Sale' ? 'For Sale' : 'For Exchange'}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookCopy}
          title="No textbooks found"
          description="No listed books match your search criteria."
          action={{ label: 'List Your Textbook', onClick: openCreateModal }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((book) => {
            const isOwner = currentUser?.uid === book.sellerId;
            const isAdmin = currentUser?.role === 'admin';
            const isClosed = book.status === 'Sold' || book.status === 'Exchanged';

            return (
              <div
                key={book.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  {book.imageUrl && isSafeUrl(book.imageUrl) ? (
                    <img
                      src={sanitizeUrl(book.imageUrl)}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <BookOpen className="w-8 h-8 opacity-40" />
                      <span className="text-[11px]">Textbook Listing</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge
                      variant={book.listingType === 'Exchange' ? 'purple' : 'primary'}
                      size="sm"
                    >
                      {book.listingType === 'Exchange' ? 'Exchange' : `$${book.price}`}
                    </Badge>
                    <Badge
                      variant={
                        book.status === 'Available'
                          ? 'success'
                          : book.status === 'Reserved'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {book.status}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <Badge variant="info" size="sm">
                      {book.condition}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {book.subjectDepartment}
                    </p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      by {book.author}
                    </p>
                    {book.listingType === 'Exchange' && book.exchangeFor && (
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 text-[11px] text-purple-800 dark:text-purple-200 flex items-start gap-1.5 mt-2">
                        <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>Seeking:</strong> {book.exchangeFor}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
                      {book.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        to={`/students/${book.sellerId}`}
                        className="font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600"
                      >
                        Owner: {book.sellerName}
                      </Link>
                      {book.isbn && (
                        <span className="text-[10px] font-mono text-slate-400">
                          ISBN: {book.isbn}
                        </span>
                      )}
                    </div>

                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={book.status}
                          onChange={(e) =>
                            handleStatusChange(book, e.target.value as BookListingStatus)
                          }
                          className="flex-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(book)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setContactBook(book);
                            setInquiryText(
                              book.listingType === 'Exchange'
                                ? `Hi ${book.sellerName}, I'd like to propose an exchange for "${book.title}".`
                                : `Hi ${book.sellerName}, is "${book.title}" still available?`
                            );
                          }}
                          disabled={isClosed}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>
                            {isClosed
                              ? book.status
                              : book.listingType === 'Exchange'
                              ? 'Propose Exchange'
                              : 'Contact Seller'}
                          </span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(book)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setReportTarget(book)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600"
                          title="Report book listing"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Book Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? 'Edit Book Listing' : 'List a Textbook for Sale or Exchange'}
        description="Connect directly with students taking the same course next semester"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveBook} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {(['Sale', 'Exchange'] as BookListingType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setListingType(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  listingType === t
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t === 'Sale' ? 'List for Sale' : 'List for Exchange'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Book Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Algorithms (CLRS)"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Author(s)
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Cormen, Leiserson, Rivest"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department / Subject
              </label>
              <input
                type="text"
                required
                value={subjectDepartment}
                onChange={(e) => setSubjectDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ISBN (Optional)
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-0262046305"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {listingType === 'Sale' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Asking Price (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="35"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Book(s) Wanted in Exchange
              </label>
              <input
                type="text"
                required
                value={exchangeFor}
                onChange={(e) => setExchangeFor(e.target.value)}
                placeholder="e.g. Operating System Concepts or Computer Networking"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Edition Details
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Edition, highlighting/notes status, pickup location..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Cover Photo (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste https:// cover URL"
                className="flex-1 w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isContactPublic}
                onChange={(e) => setIsContactPublic(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span>
                Display my email/phone publicly (Otherwise students message you via CampusMate Chat)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              {editingBook ? 'Save Changes' : 'Publish Book Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contact Owner Modal */}
      <Modal
        isOpen={Boolean(contactBook)}
        onClose={() => setContactBook(null)}
        title="Contact Book Owner"
        description={contactBook ? `${contactBook.title} by ${contactBook.author}` : ''}
        maxWidth="md"
      >
        {contactBook && (
          <form onSubmit={handleSendInquiry} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Owner: {contactBook.sellerName}
              </p>
              {contactBook.isContactPublic ? (
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contactBook.sellerEmail}</span>
                  </p>
                  {contactBook.sellerPhone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contactBook.sellerPhone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Direct contact info is hidden for privacy. Send a message below to connect securely.
                  </span>
                </p>
              )}
            </div>

            <textarea
              rows={3}
              required
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setContactBook(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingInquiry}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {sendingInquiry ? 'Sending...' : 'Send & Open Chat'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Book Listing"
        message="Remove this textbook listing from CampusMate Book Exchange?"
      />

      {currentUser && reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          currentUser={currentUser}
          targetType="book"
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          targetOwnerId={reportTarget.sellerId}
        />
      )}
    </div>
  );
};
