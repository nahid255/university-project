import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  Tag,
  MessageSquare,
  Flag,
  Edit3,
  Trash2,
  Camera,
  Lock,
  Mail,
  Phone,
  BookCopy,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMarketplaceListings,
  createMarketplaceListing,
  updateMarketplaceListing,
  deleteMarketplaceListing,
  sendSellerInquiry,
} from '../../services/marketplaceService';
import { uploadFile, validateFile } from '../../services/storage';
import {
  MarketplaceListing,
  MarketplaceCategory,
  ItemCondition,
  ListingStatus,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReportModal } from '../../components/common/ReportModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CATEGORIES: ('All' | MarketplaceCategory)[] = [
  'All',
  'Books',
  'Electronics',
  'Calculators',
  'Stationery',
  'Accessories',
  'Furniture',
  'Other',
];

const CONDITIONS: ItemCondition[] = ['Brand New', 'Like New', 'Good', 'Used'];
const STATUSES: ListingStatus[] = ['Available', 'Reserved', 'Sold'];

export const MarketplacePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceListing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<MarketplaceCategory>('Electronics');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [sellerPhone, setSellerPhone] = useState('');
  const [isContactPublic, setIsContactPublic] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Inquiry Modal
  const [contactListing, setContactListing] = useState<MarketplaceListing | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  // Delete & Report
  const [deleteTarget, setDeleteTarget] = useState<MarketplaceListing | null>(null);
  const [reportTarget, setReportTarget] = useState<MarketplaceListing | null>(null);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await getMarketplaceListings(80);
      setListings(data);
    } catch (e) {
      console.error('Failed to load marketplace:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('Electronics');
    setCondition('Good');
    setSellerPhone(currentUser?.phone || '');
    setIsContactPublic(false);
    setImageUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MarketplaceListing) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(String(item.price));
    setCategory(item.category);
    setCondition(item.condition);
    setSellerPhone(item.sellerPhone || '');
    setIsContactPublic(item.isContactPublic);
    setImageUrl(item.imageUrl || '');
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
      const url = await uploadFile(file, `marketplace/${Date.now()}_${file.name}`);
      setImageUrl(url);
    } catch {
      setFormError('Failed to upload image. You may paste an image URL instead.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    const parsedPrice = Number(price);
    if (!title.trim() || !description.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Please provide a valid title, description, and price.');
      return;
    }
    if (imageUrl.trim() && !isSafeUrl(imageUrl.trim())) {
      setFormError('Please enter a valid http(s) image URL.');
      return;
    }

    const safeImg = imageUrl.trim() ? sanitizeUrl(imageUrl.trim()) : undefined;

    if (editingItem) {
      const updated = await updateMarketplaceListing(editingItem.id, {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category,
        condition,
        sellerPhone: sellerPhone.trim() || undefined,
        isContactPublic,
        imageUrl: safeImg,
      });
      setListings((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const created = await createMarketplaceListing({
        sellerId: currentUser.uid,
        sellerName: currentUser.fullName,
        sellerDepartment: currentUser.department,
        sellerEmail: currentUser.email,
        sellerPhone: sellerPhone.trim() || undefined,
        isContactPublic,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category,
        condition,
        imageUrl: safeImg,
      });
      setListings((prev) => [created, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = async (item: MarketplaceListing, newStatus: ListingStatus) => {
    const updated = await updateMarketplaceListing(item.id, { status: newStatus });
    setListings((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMarketplaceListing(deleteTarget.id);
    setListings((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !contactListing || !inquiryMessage.trim()) return;
    try {
      setSendingInquiry(true);
      const convId = await sendSellerInquiry({
        buyer: currentUser,
        sellerId: contactListing.sellerId,
        sellerName: contactListing.sellerName,
        listingTitle: contactListing.title,
        listingType: 'marketplace',
        messageText: inquiryMessage.trim(),
      });
      setContactListing(null);
      setInquiryMessage('');
      navigate(`/messages?conv=${encodeURIComponent(convId)}`);
    } catch (err) {
      console.error('Failed to send seller inquiry:', err);
    } finally {
      setSendingInquiry(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading student marketplace..." />;
  }

  const filtered = listings.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.sellerName.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesCond = conditionFilter === 'All' || item.condition === conditionFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCat && matchesCond && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Student Marketplace</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Buy and sell campus gear, electronics, calculators, and dorm essentials safely on campus
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/books"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            <BookCopy className="w-4 h-4" />
            <span>Book Exchange</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Listing</span>
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
              placeholder="Search laptops, scientific calculators, desk lamps, or seller..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            >
              <option value="All">All Conditions</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No marketplace listings found"
          description="Try adjusting your filters or list an item you no longer need."
          action={{ label: 'Post an Item', onClick: openCreateModal }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const isOwner = currentUser?.uid === item.sellerId;
            const isAdmin = currentUser?.role === 'admin';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between group"
              >
                <div className="relative h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  {item.imageUrl && isSafeUrl(item.imageUrl) ? (
                    <img
                      src={sanitizeUrl(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[11px]">No Photo</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge
                      variant={
                        item.status === 'Available'
                          ? 'success'
                          : item.status === 'Reserved'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {item.condition}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-slate-900/85 text-white text-sm font-black backdrop-blur-xs">
                    ${item.price}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        to={`/students/${item.sellerId}`}
                        className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600"
                      >
                        Seller: {item.sellerName}
                      </Link>
                      {item.sellerDepartment && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {item.sellerDepartment}
                        </span>
                      )}
                    </div>

                    {isOwner ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item, e.target.value as ListingStatus)
                          }
                          className="flex-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              Status: {s}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                          title="Edit listing"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setContactListing(item);
                            setInquiryMessage(
                              `Hi ${item.sellerName}, is "${item.title}" still available?`
                            );
                          }}
                          disabled={item.status === 'Sold'}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{item.status === 'Sold' ? 'Sold' : 'Contact Seller'}</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Remove listing (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setReportTarget(item)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600"
                          title="Report listing"
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

      {/* Create / Edit Listing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Marketplace Listing' : 'Create Marketplace Listing'}
        description="List personal academic or campus items for fellow students"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveListing} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio fx-991EX ClassWiz Scientific Calculator"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Price (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include age, accessories included, meetup location preference on campus..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Product Image (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
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
                placeholder="Or paste https:// image URL"
                className="flex-1 w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Seller Contact Privacy</span>
            </h4>
            <input
              type="text"
              value={sellerPhone}
              onChange={(e) => setSellerPhone(e.target.value)}
              placeholder="Optional phone number (only shown if public toggle is checked)"
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isContactPublic}
                onChange={(e) => setIsContactPublic(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>
                Display my email/phone publicly (Otherwise buyers contact you via CampusMate Messaging)
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {editingItem ? 'Save Changes' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contact Seller Modal */}
      <Modal
        isOpen={Boolean(contactListing)}
        onClose={() => setContactListing(null)}
        title="Contact Seller"
        description={
          contactListing ? `Inquire about "${contactListing.title}" ($${contactListing.price})` : ''
        }
        maxWidth="md"
      >
        {contactListing && (
          <form onSubmit={handleSendInquiry} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {contactListing.sellerName}
                </span>
                <Badge variant="neutral" size="sm">
                  {contactListing.sellerDepartment || 'Student'}
                </Badge>
              </div>
              {contactListing.isContactPublic ? (
                <div className="space-y-1 text-slate-600 dark:text-slate-300 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contactListing.sellerEmail}</span>
                  </p>
                  {contactListing.sellerPhone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contactListing.sellerPhone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    Seller keeps direct phone/email private. Sending an inquiry opens a secure 1-to-1 CampusMate chat.
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Message
              </label>
              <textarea
                rows={3}
                required
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setContactListing(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingInquiry}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {sendingInquiry ? 'Sending...' : 'Send Message & Open Chat'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Marketplace Listing"
        message="Are you sure you want to remove this listing from the student marketplace?"
      />

      {currentUser && reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          currentUser={currentUser}
          targetType="marketplace"
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          targetOwnerId={reportTarget.sellerId}
        />
      )}
    </div>
  );
};
