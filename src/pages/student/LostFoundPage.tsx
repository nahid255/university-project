import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  FileQuestion,
  HelpCircle,
  Eye,
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

  const [activeTab, setActiveTab] = useState<LostFoundType>('lost');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    } catch {
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
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="jstu-page-title flex items-center gap-3">
            <Search className="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Campus Lost &amp; Found</span>
          </h1>
          <p className="jstu-secondary mt-1.5">
            Community recovery board to locate misplaced belongings and return found possessions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openReportModal('lost')}
            className="jstu-btn-danger"
          >
            <Plus className="w-4 h-4" />
            <span>Report Lost Item</span>
          </button>
          <button
            onClick={() => openReportModal('found')}
            className="jstu-btn-primary bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Report Found Item</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('lost')}
          className={`pb-3.5 text-base font-semibold transition-colors relative flex items-center gap-2.5 ${
            activeTab === 'lost'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Lost Items</span>
          <span className="px-2.5 py-0.5 rounded-md text-sm bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold tabular-nums">
            {items.filter((i) => i.type === 'lost').length}
          </span>
          {activeTab === 'lost' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('found')}
          className={`pb-3.5 text-base font-semibold transition-colors relative flex items-center gap-2.5 ${
            activeTab === 'found'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Found Items</span>
          <span className="px-2.5 py-0.5 rounded-md text-sm bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
            {items.filter((i) => i.type === 'found').length}
          </span>
          {activeTab === 'found' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'lost' ? 'lost' : 'found'} items by name, details, or location...`}
              className="jstu-input pl-11"
            />
          </div>

          <div className="sm:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="jstu-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="claimed">Claimed</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 border ${
                  isSelected
                    ? activeTab === 'lost'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
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
                className="jstu-surface overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col justify-between group"
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
                      <ImageIcon className="w-9 h-9 opacity-40" />
                      <span className="text-sm">No Photo Attached</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge
                      variant={item.type === 'lost' ? 'danger' : 'success'}
                      size="sm"
                      className="uppercase tracking-wider backdrop-blur-md"
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

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="jstu-card-title line-clamp-1">
                      {item.title}
                    </h2>
                    <p className="text-[15px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    <div className="flex items-center justify-between tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </span>

                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {item.reporterName}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/lost-found/${item.id}`}
                    className="jstu-btn-secondary w-full hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Item Details &amp; Claims</span>
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
        <form onSubmit={handleReportSubmit} className="space-y-5">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5">
            <button
              type="button"
              onClick={() => setReportType('lost')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                reportType === 'lost'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              I Lost An Item
            </button>
            <button
              type="button"
              onClick={() => setReportType('found')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                reportType === 'found'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              I Found An Item
            </button>
          </div>

          <div>
            <label className="jstu-label">Item Name / Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blue Dell XPS 15 Laptop in Black Sleeve"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="jstu-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LostFoundCategory)}
                className="jstu-select"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="jstu-label">
                Date {reportType === 'lost' ? 'Lost' : 'Found'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="jstu-input"
              />
            </div>
          </div>

          <div>
            <label className="jstu-label">Location on Campus</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Library 2nd floor, Table #12"
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">Detailed Description &amp; Distinguishing Marks</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify color, brand, stickers, keyrings, scratches, or identifying traits..."
              className="jstu-textarea"
            />
          </div>

          <div className="space-y-2.5">
            <label className="jstu-label">Item Photograph (Optional)</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="jstu-btn-secondary cursor-pointer shrink-0">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{isUploading ? 'Processing...' : 'Upload Image (Max 5MB)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <span className="text-sm text-slate-500 dark:text-slate-400 text-center">or URL:</span>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/item-photo.jpg"
                className="jstu-input flex-1"
              />
            </div>
            {uploadError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{uploadError}</p>
            )}
            {imageUrl && (
              <div className="mt-2 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={imageUrl} alt="Item preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="p-4 jstu-inset space-y-4">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Contact Information &amp; Privacy Controls</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="jstu-label">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="jstu-input"
                />
              </div>

              <div>
                <label className="jstu-label">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="jstu-input"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="contactPublic"
                type="checkbox"
                checked={isContactPublic}
                onChange={(e) => setIsContactPublic(e.target.checked)}
                className="w-4 h-4 mt-1 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <label
                htmlFor="contactPublic"
                className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none leading-relaxed"
              >
                Display my contact details publicly on this listing (Otherwise, claimants will contact you through moderated portal claim requests)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={
                reportType === 'lost'
                  ? 'jstu-btn-danger'
                  : 'jstu-btn-primary bg-emerald-600 hover:bg-emerald-700'
              }
            >
              Post {reportType === 'lost' ? 'Lost' : 'Found'} Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
