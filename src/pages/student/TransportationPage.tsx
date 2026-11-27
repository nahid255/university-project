import React, { useEffect, useMemo, useState } from 'react';
import {
  Bus,
  Search,
  MapPin,
  Clock,
  Calendar,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTransportationRoutes } from '../../services/transportationService';
import { TransportationRoute, RouteStatus } from '../../types';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

const OPERATING_DAYS = [
  'All Days',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const TransportationPage: React.FC = () => {
  const { isFirebase } = useAuth();
  const [routes, setRoutes] = useState<TransportationRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RouteStatus>('All');
  const [dayFilter, setDayFilter] = useState<string>('All Days');
  const [selectedRoute, setSelectedRoute] = useState<TransportationRoute | null>(null);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTransportationRoutes({ publishedOnly: true });
        setRoutes(data);
      } catch (err) {
        console.error('Failed to load transportation routes:', err);
        setError('Unable to load campus transportation schedules right now.');
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, []);

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return routes.filter((route) => {
      const matchesStatus = statusFilter === 'All' || route.status === statusFilter;
      const matchesDay =
        dayFilter === 'All Days' || route.operatingDays.includes(dayFilter);
      const matchesSearch =
        !q ||
        route.routeName.toLowerCase().includes(q) ||
        route.busNumber.toLowerCase().includes(q) ||
        route.startingPoint.toLowerCase().includes(q) ||
        route.destination.toLowerCase().includes(q) ||
        route.stops.some((s) => s.name.toLowerCase().includes(q));
      return matchesStatus && matchesDay && matchesSearch;
    });
  }, [routes, searchQuery, statusFilter, dayFilter]);

  const renderStatusBadge = (status: RouteStatus) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[13px] font-semibold shrink-0">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active</span>
        </span>
      );
    }
    if (status === 'Suspended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[13px] font-semibold shrink-0">
          <AlertTriangle className="w-4 h-4" />
          <span>Suspended</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[13px] font-semibold shrink-0">
        <PauseCircle className="w-4 h-4" />
        <span>Inactive</span>
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus transportation routes..." fullPage={false} />;
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <section className="jstu-surface p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Bus className="w-4 h-4" />
            <span>JSTU Campus Transit Directory</span>
          </div>
          <h1 className="jstu-page-title">
            University Bus Routes &amp; Schedules
          </h1>
          <p className="jstu-secondary max-w-2xl">
            Browse official published bus routes, ordered pickup stops, departure times, and service availability notices.
          </p>
        </div>

        {!isFirebase && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-sm font-medium text-blue-700 dark:text-blue-300 self-start md:self-center shrink-0">
            <Info className="w-4 h-4" />
            <span>Preview Schedules</span>
          </div>
        )}
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[15px] text-rose-700 dark:text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="jstu-surface p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by route name, bus number, location, or stop..."
            aria-label="Search transportation routes"
            className="jstu-input pl-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | RouteStatus)}
            aria-label="Filter by route status"
            className="jstu-select"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            aria-label="Filter by operating day"
            className="jstu-select"
          >
            {OPERATING_DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Route Cards */}
      {filteredRoutes.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No matching transportation routes"
          description={
            routes.length === 0
              ? 'University Administration has not published any bus routes yet.'
              : 'Try adjusting your search keywords, operating day, or status filter.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRoutes.map((route) => (
            <article
              key={route.id}
              className={`jstu-surface p-6 transition-colors flex flex-col justify-between gap-5 ${
                route.status === 'Suspended'
                  ? 'border-rose-300 dark:border-rose-800/70'
                  : 'hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-block font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {route.busNumber}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white leading-snug">
                      {route.routeName}
                    </h2>
                  </div>
                  {renderStatusBadge(route.status)}
                </div>

                {route.status !== 'Active' && (
                  <div
                    className={`p-3.5 rounded-xl border text-sm flex items-start gap-2.5 leading-relaxed ${
                      route.status === 'Suspended'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        {route.status === 'Suspended'
                          ? 'Service Temporarily Suspended'
                          : 'Route Currently Inactive'}
                      </p>
                      {route.statusNote && <p className="mt-0.5">{route.statusNote}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 jstu-inset">
                  <div className="space-y-1">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold">Route Corridor</p>
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{route.startingPoint}</span>
                      <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{route.destination}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold">Schedule Window</p>
                    <p className="font-mono text-[15px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>
                        {route.departureTime} &ndash; {route.arrivalTime}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="tabular-nums">Ordered Stops ({route.stops.length})</span>
                  </p>
                  <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {route.stops.map((s) => s.name).join(' → ')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{route.operatingDays.join(', ')}</span>
                  </span>
                  {route.driverName && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Driver: {route.driverName}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                  Updated {new Date(route.updatedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRoute(route)}
                  className="jstu-btn-primary"
                >
                  <span>View Route Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Route Details Modal */}
      {selectedRoute && (
        <Modal
          isOpen={Boolean(selectedRoute)}
          onClose={() => setSelectedRoute(null)}
          title={selectedRoute.routeName}
          description={`Bus ${selectedRoute.busNumber} · ${selectedRoute.startingPoint} to ${selectedRoute.destination}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-[15px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {renderStatusBadge(selectedRoute.status)}
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {selectedRoute.departureTime} &ndash; {selectedRoute.arrivalTime}
              </span>
            </div>

            {selectedRoute.status !== 'Active' && selectedRoute.statusNote && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 leading-relaxed">
                <p className="font-semibold">Service Notice:</p>
                <p className="mt-1 text-sm">{selectedRoute.statusNote}</p>
              </div>
            )}

            <div className="p-4 jstu-inset space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Operating Days</span>
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                {selectedRoute.operatingDays.join(' · ')}
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Stop-by-Stop Route Sequence</span>
              </p>
              <ol className="space-y-2.5">
                {selectedRoute.stops.map((stop, idx) => (
                  <li
                    key={`${stop.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-semibold text-sm flex items-center justify-center shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {stop.name}
                      </span>
                    </div>
                    {stop.scheduledTime && (
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-300 shrink-0 tabular-nums">
                        {stop.scheduledTime}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {(selectedRoute.driverName || selectedRoute.driverContact) && (
              <div className="p-4 jstu-inset flex flex-wrap items-center justify-between gap-3">
                {selectedRoute.driverName && (
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>
                      <strong>Assigned Driver:</strong> {selectedRoute.driverName}
                    </span>
                  </div>
                )}
                {selectedRoute.driverContact && (
                  <div className="flex items-center gap-2 font-mono text-slate-800 dark:text-slate-200">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedRoute.driverContact}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRoute(null)}
                className="jstu-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
