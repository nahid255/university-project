import React, { useEffect, useState } from 'react';
import {
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">Campus Events Management</h1>
          <p className="jstu-secondary">
            Create, publish, or cancel official events and manage student capacities and waitlists.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[15px] font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="jstu-surface p-10 text-center jstu-secondary">
            No campus events created yet.
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="jstu-surface p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
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
                  <span className="jstu-meta tabular-nums">
                    {ev.date} &middot; {ev.startTime} &ndash; {ev.endTime}
                  </span>
                </div>
                <h3 className="jstu-card-title">{ev.title}</h3>
                <p className="jstu-secondary tabular-nums">
                  {ev.location} &middot; Organizer: {ev.organizer} &middot;{' '}
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {ev.registeredCount}/{ev.capacity}
                  </strong>{' '}
                  registered ({ev.waitlistCount} waitlisted)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => openRegistrations(ev)}
                  className="jstu-btn-secondary"
                >
                  <Users className="w-4 h-4" />
                  <span>Registrations</span>
                </button>

                {ev.status !== 'published' && (
                  <button
                    onClick={async () => {
                      await updateEvent(ev.id, { status: 'published' });
                      await loadEvents();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                )}

                {ev.status === 'published' && (
                  <button
                    onClick={async () => {
                      await updateEvent(ev.id, { status: 'cancelled' });
                      await loadEvents();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-300 text-[15px] font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}

                <button
                  onClick={() => openEditModal(ev)}
                  className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Edit event"
                  aria-label={`Edit ${ev.title}`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(ev)}
                  className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete event"
                  aria-label={`Delete ${ev.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
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
            <p className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
              {formError}
            </p>
          )}

          <div>
            <label className="jstu-label">Event Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="jstu-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="jstu-select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="jstu-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="jstu-select"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="jstu-label">Seat Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="jstu-input font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="jstu-label">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="jstu-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="jstu-label">Start Time</label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">End Time</label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="jstu-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Venue / Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Organizer</label>
              <input
                type="text"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="jstu-input"
              />
            </div>
          </div>

          <div>
            <label className="jstu-label">Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="jstu-textarea"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="jstu-btn-secondary cursor-pointer shrink-0">
              <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
              className="jstu-input flex-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[15px] font-semibold transition-colors"
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
        <div className="max-h-96 overflow-y-auto space-y-2.5">
          {registrations.length === 0 ? (
            <p className="jstu-secondary text-center py-8">
              No registrations recorded yet.
            </p>
          ) : (
            registrations.map((reg) => (
              <div
                key={reg.id}
                className="jstu-inset p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {reg.userName} <span className="font-mono text-sm">({reg.studentId})</span>
                  </p>
                  <p className="jstu-meta truncate">{reg.userEmail}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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
                      className="text-sm font-semibold text-rose-600 dark:text-rose-400 hover:underline"
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
