import React, { useEffect, useState } from 'react';
import {
  CalendarHeart,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarHeart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Campus Events</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Discover workshops, hackathons, career fairs, and seminars across the university
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-bold relative transition-colors ${
            activeTab === 'all'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span>Upcoming Events ({events.length})</span>
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-3 text-sm font-bold relative transition-colors ${
            activeTab === 'mine'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span>My Registrations ({myActiveEventIds.size})</span>
          {activeTab === 'mine' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Search & Category Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, organizer, or campus venue..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ev) => {
            const myReg = getMyRegistration(ev.id);
            const isFull = ev.registeredCount >= ev.capacity;
            const pct = ev.capacity > 0 ? Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100)) : 100;

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
              >
                <div className="relative h-44 bg-gradient-to-br from-purple-700 to-indigo-800 overflow-hidden">
                  {ev.imageUrl && isSafeUrl(ev.imageUrl) && (
                    <img
                      src={sanitizeUrl(ev.imageUrl)}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
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
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {ev.description}
                    </p>

                    <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{new Date(ev.date).toLocaleDateString()}</span>
                        <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0 ml-1" />
                        <span>{ev.startTime}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Organized by <strong className="text-slate-600 dark:text-slate-300">{ev.organizer}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {ev.registeredCount} / {ev.capacity} Seats
                      </span>
                      {ev.waitlistCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {ev.waitlistCount} waitlisted
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-amber-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {myReg ? (
                        <button
                          onClick={() => handleCancel(ev)}
                          disabled={processingId === ev.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel {myReg.status === 'waitlisted' ? 'Waitlist' : 'Seat'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(ev)}
                          disabled={processingId === ev.id}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-white text-xs font-bold transition-colors ${
                            isFull
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isFull ? 'Join Waitlist' : 'Register Now'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="View event details"
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
              <div className="h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={sanitizeUrl(selectedEvent.imageUrl)}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>
                  {new Date(selectedEvent.date).toLocaleDateString()} ({selectedEvent.startTime} -{' '}
                  {selectedEvent.endTime})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span>{selectedEvent.location}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Users className="w-4 h-4 text-purple-500" />
                <span>
                  {selectedEvent.registeredCount} / {selectedEvent.capacity} seats filled (
                  {selectedEvent.waitlistCount} waitlisted)
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedEvent.description}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              {getMyRegistration(selectedEvent.id) ? (
                <button
                  onClick={() => handleCancel(selectedEvent)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Cancel Registration
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(selectedEvent)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
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
