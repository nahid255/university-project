import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Tag,
  ShieldCheck,
  FileQuestion,
  HelpCircle,
  Eye,
  CheckCircle,
  Clock,
  Camera,
  Image as ImageIcon,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getLostFoundItems,
  createLostFoundItem,
} from '../../services/lostFoundService';
import { uploadFile, validateFile } from '../../services/storage';
import {
  LostFoundItem,
  LostFoundCategory,
  LostFoundType,
  LostFoundStatus,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CATEGORIES: ('All' | LostFoundCategory)[] = [
  'All',
  'Electronics',
  'Documents',
  'Books',
  'Accessories',
  'Bags',
  'Clothing',
  'Keys',
  'Other',
];

export const LostFoundPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'lost' or 'found'
  const [activeTab, setActiveTab] = useState<LostFoundType>('lost');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for reporting
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<LostFoundType>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LostFoundCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contactName, setContactName] = useState(currentUser?.fullName || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [isContactPublic, setIsContactPublic] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getLostFoundItems();
      setItems(data);
    } catch (e) {
      console.error('Failed to load lost and found items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openReportModal = (type: LostFoundType) => {
    setReportType(type);
    setTitle('');
    setCategory('Electronics');
    setDescription('');
    setLocation('');
    setDate(new Date().toISOString().split('T')[0]);
    setContactName(currentUser?.fullName || '');
    setContactEmail(currentUser?.email || '');
    setContactPhone(currentUser?.phone || '');
    setIsContactPublic(false);
    setImageUrl('');
    setUploadError(null);
    setIsReportModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/*'],
    });

    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setIsUploading(true);
      const path = `lost-found/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path);
      setImageUrl(url);
    } catch (err) {
      setUploadError('Failed to process image. You can also paste an image URL directly.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !location.trim()) return;

    if (imageUrl.trim() && !isSafeUrl(imageUrl.trim())) {
      setUploadError('Please enter a valid http(s) image URL.');
      return;
    }

    try {
      await createLostFoundItem({
        type: reportType,
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        date,
        contactName: contactName.trim() || currentUser.fullName,
        contactEmail: contactEmail.trim() || currentUser.email,
        contactPhone: contactPhone.trim(),
        isContactPublic,
        imageUrl: imageUrl.trim() ? sanitizeUrl(imageUrl.trim()) : undefined,
        reporterId: currentUser.uid,
        reporterName: currentUser.fullName,
        reporterStudentId: currentUser.studentId,
      });

      setIsReportModalOpen(false);
      await loadItems();
    } catch (err) {
      console.error('Failed to submit item', err);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading lost and found directory..." />;
  }

  // Filter items
  const filtered = items.filter((item) => {
    if (item.type !== activeTab) return false;

    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-rose-500" />
            <span>Campus Lost & Found</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Community recovery board to locate misplaced belongings and return found possessions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openReportModal('lost')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Lost Item</span>
          </button>
          <button
            onClick={() => openReportModal('found')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Found Item</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: Lost Items vs Found Items */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('lost')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'lost'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Lost Items</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold">
            {items.filter((i) => i.type === 'lost').length}
          </span>
          {activeTab === 'lost' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('found')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'found'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Found Items</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold">
            {items.filter((i) => i.type === 'found').length}
          </span>
          {activeTab === 'found' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'lost' ? 'lost' : 'found'} items by name, details, or location...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="claimed">Claimed</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? activeTab === 'lost'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={activeTab === 'lost' ? FileQuestion : HelpCircle}
          title={`No ${activeTab} items found`}
          description={`No recorded ${activeTab} belongings match your search filter.`}
          action={{
            label: activeTab === 'lost' ? 'Report Lost Item' : 'Report Found Item',
            onClick: () => openReportModal(activeTab),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const isClaimed = item.status === 'claimed' || item.status === 'resolved';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between group"
              >
                {/* Photo Thumbnail */}
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
                      <span className="text-[11px]">No Photo Attached</span>
                    </div>
                  )}

                  {/* Status Badge Over Image */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge
                      variant={item.type === 'lost' ? 'danger' : 'success'}
                      size="sm"
                      className="font-bold uppercase tracking-wider backdrop-blur-md"
                    >
                      {item.type}
                    </Badge>
                    <Badge
                      variant={isClaimed ? 'purple' : 'neutral'}
                      size="sm"
                      className="capitalize"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <Badge variant="info" size="sm">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </span>

                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.reporterName}
                      </span>
                    </div>
                  </div>

                  {/* Action Link to Details */}
                  <Link
                    to={`/lost-found/${item.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-slate-200 dark:hover:text-white text-xs font-bold transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Item Details & Claims</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Item Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={reportType === 'lost' ? 'Report Lost Belonging' : 'Report Found Belonging'}
        description="Submit accurate details to assist campus recovery"
        maxWidth="xl"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-2">
            <button
              type="button"
              onClick={() => setReportType('lost')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportType === 'lost'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              I Lost An Item
            </button>
            <button
              type="button"
              onClick={() => setReportType('found')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportType === 'found'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              I Found An Item
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Item Name / Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blue Dell XPS 15 Laptop in Black Sleeve"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date {reportType === 'lost' ? 'Lost' : 'Found'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Location on Campus
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Library 2nd floor, Table #12"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description & Distinguishing Marks
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify color, brand, stickers, keyrings, unique scratches, or identifying traits..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photo Upload / URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Item Photograph (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{isUploading ? 'Processing...' : 'Upload Image (Max 5MB)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <span className="text-xs text-slate-400">or image URL:</span>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {uploadError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400">{uploadError}</p>
            )}
            {imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={imageUrl} alt="Item preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Contact & Privacy Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact Information & Privacy Controls</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="contactPublic"
                type="checkbox"
                checked={isContactPublic}
                onChange={(e) => setIsContactPublic(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <label
                htmlFor="contactPublic"
                className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none"
              >
                Display my contact details publicly on this listing (Otherwise, claimants will contact you through moderated portal claim requests)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs ${
                reportType === 'lost'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Post {reportType === 'lost' ? 'Lost' : 'Found'} Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
