import React, { useEffect, useState } from 'react';
import {
  CalendarHeart,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getEvents,
  getUserRegistrations,
  registerForEvent,
  cancelEventRegistration,
} from '../../services/eventService';
import { CampusEvent, EventRegistration, EventCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Workshops',
  'Seminars',
  'Competitions',
  'Cultural Events',
  'Sports',
  'Career Events',
  'Other',
];

export const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [evList, myRegs] = await Promise.all([
        getEvents(false),
        getUserRegistrations(currentUser.uid),
      ]);
      setEvents(evList);
      setRegistrations(myRegs);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const getMyRegistration = (eventId: string) =>
    registrations.find((r) => r.eventId === eventId && r.status !== 'cancelled');

  const handleRegister = async (ev: CampusEvent) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      setProcessingId(ev.id);
      await registerForEvent(ev, currentUser);
      await loadData();
      if (selectedEvent?.id === ev.id) {
        const refreshed = (await getEvents(false)).find((item) => item.id === ev.id) || null;
        setSelectedEvent(refreshed);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (ev: CampusEvent) => {
    if (!currentUser) return;
    setActionError(null);
    try {
      setProcessingId(ev.id);
      await cancelEventRegistration(ev, currentUser.uid);
      await loadData();
      if (selectedEvent?.id === ev.id) {
        const refreshed = (await getEvents(false)).find((item) => item.id === ev.id) || null;
        setSelectedEvent(refreshed);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus events..." />;
  }

  const myActiveEventIds = new Set(
    registrations.filter((r) => r.status !== 'cancelled').map((r) => r.eventId)
  );

  const filtered = events.filter((ev) => {
    if (activeTab === 'mine' && !myActiveEventIds.has(ev.id)) return false;
    const matchesCat = categoryFilter === 'All' || ev.category === categoryFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q) ||
      ev.organizer.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="jstu-page-title">Campus Events</h1>
        <p className="jstu-secondary">
          Discover workshops, hackathons, career fairs, and seminars across JSTU Campus.
        </p>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm font-medium text-rose-700 dark:text-rose-300 flex items-center justify-between gap-4">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-semibold hover:underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3.5 text-[15px] font-semibold relative transition-colors tabular-nums ${
            activeTab === 'all'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Upcoming Events ({events.length})</span>
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-3.5 text-[15px] font-semibold relative transition-colors tabular-nums ${
            activeTab === 'mine'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>My Registrations ({myActiveEventIds.size})</span>
          {activeTab === 'mine' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, organizer, or campus venue..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[38px] px-4 py-2 rounded-xl text-sm font-semibold shrink-0 border transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarHeart}
          title={activeTab === 'mine' ? 'No registered events yet' : 'No matching events'}
          description={
            activeTab === 'mine'
              ? 'Browse upcoming workshops and seminars to reserve your spot.'
              : 'No published events match your selected filters.'
          }
          action={
            activeTab === 'mine'
              ? { label: 'Browse All Events', onClick: () => setActiveTab('all') }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ev) => {
            const myReg = getMyRegistration(ev.id);
            const isFull = ev.registeredCount >= ev.capacity;
            const pct =
              ev.capacity > 0
                ? Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100))
                : 100;

            return (
              <div
                key={ev.id}
                className="jstu-surface overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col justify-between"
              >
                <div className="relative h-44 bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
                  {ev.imageUrl && isSafeUrl(ev.imageUrl) ? (
                    <img
                      src={sanitizeUrl(ev.imageUrl)}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <CalendarHeart className="w-9 h-9 opacity-40" />
                      <span className="jstu-meta">{ev.category}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge variant="purple" size="sm">
                      {ev.category}
                    </Badge>
                    {myReg && (
                      <Badge
                        variant={myReg.status === 'registered' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {myReg.status === 'registered' ? 'Registered' : 'Waitlisted'}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h3 className="jstu-card-title line-clamp-2">{ev.title}</h3>
                    <p className="jstu-secondary line-clamp-2">{ev.description}</p>

                    <div className="space-y-1.5 pt-2 text-sm text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-2 tabular-nums">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{new Date(ev.date).toLocaleDateString()}</span>
                        <span aria-hidden="true">&middot;</span>
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{ev.startTime}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </p>
                      <p className="jstu-meta">
                        Organized by{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {ev.organizer}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between text-sm tabular-nums">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        {ev.registeredCount} / {ev.capacity} Seats
                      </span>
                      {ev.waitlistCount > 0 && (
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">
                          {ev.waitlistCount} waitlisted
                        </span>
                      )}
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {myReg ? (
                        <button
                          onClick={() => handleCancel(ev)}
                          disabled={processingId === ev.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[15px] font-semibold transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel {myReg.status === 'waitlisted' ? 'Waitlist' : 'Seat'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(ev)}
                          disabled={processingId === ev.id}
                          className={`flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2.5 rounded-xl text-white text-[15px] font-semibold transition-colors ${
                            isFull
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isFull ? 'Join Waitlist' : 'Register Now'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="View event details"
                        aria-label="View event details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || ''}
        description={selectedEvent ? `${selectedEvent.category} • ${selectedEvent.organizer}` : ''}
        maxWidth="lg"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {selectedEvent.imageUrl && isSafeUrl(selectedEvent.imageUrl) && (
              <div className="h-52 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <img
                  src={sanitizeUrl(selectedEvent.imageUrl)}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="jstu-inset grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 text-sm">
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 tabular-nums">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {new Date(selectedEvent.date).toLocaleDateString()} ({selectedEvent.startTime} -{' '}
                  {selectedEvent.endTime})
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{selectedEvent.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 tabular-nums sm:col-span-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {selectedEvent.registeredCount} / {selectedEvent.capacity} seats filled (
                  {selectedEvent.waitlistCount} waitlisted)
                </span>
              </div>
            </div>

            <p className="jstu-body whitespace-pre-line">{selectedEvent.description}</p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setSelectedEvent(null)} className="jstu-btn-secondary">
                Close
              </button>
              {getMyRegistration(selectedEvent.id) ? (
                <button
                  onClick={() => handleCancel(selectedEvent)}
                  className="jstu-btn-danger"
                >
                  Cancel Registration
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(selectedEvent)}
                  className="jstu-btn-primary"
                >
                  {selectedEvent.registeredCount >= selectedEvent.capacity
                    ? 'Join Waitlist'
                    : 'Confirm Registration'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
