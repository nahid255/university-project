import React, { useEffect, useState } from 'react';
import {
  CalendarHeart,
  Plus,
  Edit3,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  cancelEventRegistration,
} from '../../services/eventService';
import { uploadFile, validateFile } from '../../services/storage';
import {
  CampusEvent,
  EventCategory,
  EventStatus,
  EventRegistration,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';
import { logActivity } from '../../services/adminService';

const CATEGORIES: EventCategory[] = [
  'Workshops',
  'Seminars',
  'Competitions',
  'Cultural Events',
  'Sports',
  'Career Events',
  'Other',
];

export const AdminEventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CampusEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshops');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('02:00 PM');
  const [endTime, setEndTime] = useState('04:30 PM');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [status, setStatus] = useState<EventStatus>('published');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Registrations Modal
  const [regsEvent, setRegsEvent] = useState<CampusEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<CampusEvent | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const list = await getEvents(true);
      setEvents(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setCategory('Workshops');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('02:00 PM');
    setEndTime('04:30 PM');
    setLocation('');
    setOrganizer('Office of Student Affairs');
    setCapacity('50');
    setStatus('published');
    setImageUrl('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ev: CampusEvent) => {
    setEditing(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setCategory(ev.category);
    setDate(ev.date);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setLocation(ev.location);
    setOrganizer(ev.organizer);
    setCapacity(String(ev.capacity));
    setStatus(ev.status);
    setImageUrl(ev.imageUrl || '');
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
      setFormError(validation.error || 'Invalid image file.');
      return;
    }
    try {
      setIsUploading(true);
      const url = await uploadFile(file, `events/${Date.now()}_${file.name}`);
      setImageUrl(url);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);
    const cap = Math.max(1, Number(capacity) || 50);

    if (imageUrl.trim() && !isSafeUrl(imageUrl.trim())) {
      setFormError('Please enter a valid http(s) image URL.');
      return;
    }
    const safeImg = imageUrl.trim() ? sanitizeUrl(imageUrl.trim()) : undefined;

    if (editing) {
      await updateEvent(editing.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim(),
        organizer: organizer.trim(),
        capacity: cap,
        status,
        imageUrl: safeImg,
      });
      logActivity({
        userId: currentUser.uid,
        userName: currentUser.fullName,
        action: 'Updated campus event',
        target: title.trim(),
        type: 'admin',
      });
    } else {
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        location: location.trim(),
        organizer: organizer.trim(),
        capacity: cap,
        status,
        imageUrl: safeImg,
        createdById: currentUser.uid,
      });
      logActivity({
        userId: currentUser.uid,
        userName: currentUser.fullName,
        action: 'Created campus event',
        target: title.trim(),
        type: 'admin',
      });
    }
    setIsModalOpen(false);
    await loadEvents();
  };

  const openRegistrations = async (ev: CampusEvent) => {
    setRegsEvent(ev);
    const regs = await getEventRegistrations(ev.id);
    setRegistrations(regs);
  };

  const handleCancelParticipant = async (reg: EventRegistration) => {
    if (!regsEvent) return;
    await cancelEventRegistration(regsEvent, reg.userId);
    await loadEvents();
    const updated = await getEventRegistrations(regsEvent.id);
    setRegistrations(updated);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;
    await deleteEvent(deleteTarget.id);
    logActivity({
      userId: currentUser.uid,
      userName: currentUser.fullName,
      action: 'Deleted campus event',
      target: deleteTarget.title,
      type: 'admin',
    });
    setDeleteTarget(null);
    await loadEvents();
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus events manager..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarHeart className="w-6 h-6 text-purple-600" />
            <span>Campus Events Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, publish, cancel events, and manage student capacities &amp; waitlists
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      <div className="space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    ev.status === 'published'
                      ? 'success'
                      : ev.status === 'cancelled'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {ev.status.toUpperCase()}
                </Badge>
                <Badge variant="purple" size="sm">
                  {ev.category}
                </Badge>
                <span className="text-[11px] text-slate-400">
                  {ev.date} &bull; {ev.startTime} - {ev.endTime}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {ev.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ev.location} &bull; Organizer: {ev.organizer} &bull;{' '}
                <strong>
                  {ev.registeredCount}/{ev.capacity}
                </strong>{' '}
                registered ({ev.waitlistCount} waitlisted)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => openRegistrations(ev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Registrations</span>
              </button>

              {ev.status !== 'published' && (
                <button
                  onClick={async () => {
                    await updateEvent(ev.id, { status: 'published' });
                    await loadEvents();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              )}

              {ev.status === 'published' && (
                <button
                  onClick={async () => {
                    await updateEvent(ev.id, { status: 'cancelled' });
                    await loadEvents();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-xs font-bold"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                onClick={() => openEditModal(ev)}
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600"
                title="Edit event"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeleteTarget(ev)}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Delete event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Edit Campus Event' : 'Create Campus Event'}
        description="Configure event schedule, venue, capacity, and publication status"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <p className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</p>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seat Capacity
              </label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Venue / Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Organizer
              </label>
              <input
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
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
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700">
              <Camera className="w-4 h-4 text-purple-600" />
              <span>{isUploading ? 'Uploading...' : 'Banner Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or paste https:// banner URL"
              className="flex-1 w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white"
            >
              {editing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Registrations Modal */}
      <Modal
        isOpen={Boolean(regsEvent)}
        onClose={() => setRegsEvent(null)}
        title={regsEvent ? `Registrations: ${regsEvent.title}` : ''}
        description="View confirmed attendees and waitlisted students"
        maxWidth="lg"
      >
        <div className="max-h-80 overflow-y-auto space-y-2">
          {registrations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No registrations recorded yet.
            </p>
          ) : (
            registrations.map((reg) => (
              <div
                key={reg.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {reg.userName} ({reg.studentId})
                  </p>
                  <p className="text-[11px] text-slate-400">{reg.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      reg.status === 'registered'
                        ? 'success'
                        : reg.status === 'waitlisted'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {reg.status}
                  </Badge>
                  {reg.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelParticipant(reg)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message={`Delete "${deleteTarget?.title}" permanently?`}
      />
    </div>
  );
};
