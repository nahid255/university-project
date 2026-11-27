import React, { useEffect, useMemo, useState } from 'react';
import {
  Bus,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getTransportationRoutes,
  createTransportationRoute,
  updateTransportationRoute,
  togglePublishTransportationRoute,
  updateTransportationStatus,
  deleteTransportationRoute,
} from '../../services/transportationService';
import { TransportationRoute, RouteStatus, RouteStop } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const AdminTransportationPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [routes, setRoutes] = useState<TransportationRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RouteStatus>('All');
  const [publishFilter, setPublishFilter] = useState<'All' | 'Published' | 'Unpublished'>('All');

  // Create / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportationRoute | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [routeName, setRouteName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('07:30 AM');
  const [arrivalTime, setArrivalTime] = useState('08:30 AM');
  const [operatingDays, setOperatingDays] = useState<string[]>([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
  ]);
  const [stops, setStops] = useState<RouteStop[]>([{ name: '', scheduledTime: '' }]);
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [status, setStatus] = useState<RouteStatus>('Active');
  const [statusNote, setStatusNote] = useState('');
  const [published, setPublished] = useState(true);

  // Suspend Modal State
  const [suspendTarget, setSuspendTarget] = useState<TransportationRoute | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<TransportationRoute | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransportationRoutes({ publishedOnly: false });
      setRoutes(data);
    } catch (err) {
      console.error('Failed to load transportation routes:', err);
      setError('Could not load transportation routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const resetForm = () => {
    setEditingRoute(null);
    setFormError(null);
    setRouteName('');
    setBusNumber('');
    setStartingPoint('');
    setDestination('');
    setDepartureTime('07:30 AM');
    setArrivalTime('08:30 AM');
    setOperatingDays(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']);
    setStops([
      { name: '', scheduledTime: '' },
      { name: '', scheduledTime: '' },
    ]);
    setDriverName('');
    setDriverContact('');
    setStatus('Active');
    setStatusNote('');
    setPublished(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (route: TransportationRoute) => {
    setEditingRoute(route);
    setFormError(null);
    setRouteName(route.routeName);
    setBusNumber(route.busNumber);
    setStartingPoint(route.startingPoint);
    setDestination(route.destination);
    setDepartureTime(route.departureTime);
    setArrivalTime(route.arrivalTime);
    setOperatingDays([...route.operatingDays]);
    setStops(
      route.stops.length > 0
        ? route.stops.map((s) => ({ ...s }))
        : [{ name: '', scheduledTime: '' }]
    );
    setDriverName(route.driverName || '');
    setDriverContact(route.driverContact || '');
    setStatus(route.status);
    setStatusNote(route.statusNote || '');
    setPublished(route.published);
    setIsFormOpen(true);
  };

  const toggleDay = (day: string) => {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleStopChange = (index: number, field: keyof RouteStop, value: string) => {
    setStops((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: value } : s))
    );
  };

  const addStopRow = () => {
    setStops((prev) => [...prev, { name: '', scheduledTime: '' }]);
  };

  const removeStopRow = (index: number) => {
    setStops((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= stops.length) return;
    const copy = [...stops];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setStops(copy);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    const cleanedStops = stops
      .map((s) => ({
        name: s.name.trim(),
        ...(s.scheduledTime?.trim() ? { scheduledTime: s.scheduledTime.trim() } : {}),
      }))
      .filter((s) => s.name.length > 0);

    if (!routeName.trim() || !busNumber.trim() || !startingPoint.trim() || !destination.trim()) {
      setFormError('Route name, bus number, starting point, and destination are required.');
      return;
    }
    if (!departureTime.trim() || !arrivalTime.trim()) {
      setFormError('Departure time and arrival time are required.');
      return;
    }
    if (operatingDays.length === 0) {
      setFormError('Select at least one operating day.');
      return;
    }
    if (cleanedStops.length === 0) {
      setFormError('Please enter at least one route stop.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingRoute) {
        await updateTransportationRoute(
          editingRoute.id,
          {
            routeName: routeName.trim(),
            busNumber: busNumber.trim(),
            startingPoint: startingPoint.trim(),
            destination: destination.trim(),
            departureTime: departureTime.trim(),
            arrivalTime: arrivalTime.trim(),
            operatingDays,
            stops: cleanedStops,
            driverName: driverName.trim() || undefined,
            driverContact: driverContact.trim() || undefined,
            status,
            statusNote: statusNote.trim() || undefined,
            published,
          },
          currentUser
        );
        showSuccess(`Updated "${routeName.trim()}" successfully.`);
      } else {
        await createTransportationRoute(
          {
            routeName: routeName.trim(),
            busNumber: busNumber.trim(),
            startingPoint: startingPoint.trim(),
            destination: destination.trim(),
            departureTime: departureTime.trim(),
            arrivalTime: arrivalTime.trim(),
            operatingDays,
            stops: cleanedStops,
            driverName: driverName.trim() || undefined,
            driverContact: driverContact.trim() || undefined,
            status,
            statusNote: statusNote.trim() || undefined,
            published,
          },
          currentUser
        );
        showSuccess(`Created "${routeName.trim()}" successfully.`);
      }
      setIsFormOpen(false);
      await loadRoutes();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to save transportation route.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (route: TransportationRoute) => {
    if (!currentUser) return;
    try {
      await togglePublishTransportationRoute(route.id, !route.published, currentUser);
      showSuccess(
        !route.published
          ? `Published "${route.routeName}" to students.`
          : `Unpublished "${route.routeName}".`
      );
      await loadRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update publish status.');
    }
  };

  const handleActivateRoute = async (route: TransportationRoute) => {
    if (!currentUser) return;
    try {
      await updateTransportationStatus(route.id, 'Active', currentUser, '');
      showSuccess(`Route "${route.routeName}" marked Active.`);
      await loadRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate route.');
    }
  };

  const handleConfirmSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !suspendTarget) return;
    try {
      await updateTransportationStatus(
        suspendTarget.id,
        'Suspended',
        currentUser,
        suspendReason.trim() || 'Temporarily suspended by University Administration.'
      );
      showSuccess(`Suspended "${suspendTarget.routeName}".`);
      setSuspendTarget(null);
      setSuspendReason('');
      await loadRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend route.');
    }
  };

  const handleDeleteRoute = async () => {
    if (!currentUser || !deleteTarget) return;
    try {
      await deleteTransportationRoute(deleteTarget.id, currentUser);
      showSuccess(`Deleted route "${deleteTarget.routeName}".`);
      setDeleteTarget(null);
      await loadRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete route.');
    }
  };

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return routes.filter((r) => {
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesPub =
        publishFilter === 'All' ||
        (publishFilter === 'Published' ? r.published : !r.published);
      const matchesSearch =
        !q ||
        r.routeName.toLowerCase().includes(q) ||
        r.busNumber.toLowerCase().includes(q) ||
        r.startingPoint.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.stops.some((s) => s.name.toLowerCase().includes(q));
      return matchesStatus && matchesPub && matchesSearch;
    });
  }, [routes, searchQuery, statusFilter, publishFilter]);

  if (loading) {
    return <LoadingSpinner label="Loading transportation management console..." />;
  }

  const publishedCount = routes.filter((r) => r.published).length;
  const activeCount = routes.filter((r) => r.status === 'Active').length;
  const suspendedCount = routes.filter((r) => r.status === 'Suspended').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">University Transportation Management</h1>
          <p className="jstu-secondary">
            Create, schedule, publish, or suspend JSTU Campus bus routes and stop sequences.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="jstu-btn-primary self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bus Route</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Total Routes</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {routes.length}
          </p>
        </div>
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Published</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1.5">
            {publishedCount}
          </p>
        </div>
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Active Service</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5">
            {activeCount}
          </p>
        </div>
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Suspended</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1.5">
            {suspendedCount}
          </p>
        </div>
      </div>

      {/* Feedback Banners */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="jstu-surface p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by route name, bus number, origin, destination, or stop..."
            className="jstu-input pl-11"
          />
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | RouteStatus)}
            className="jstu-select md:w-40"
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={publishFilter}
            onChange={(e) =>
              setPublishFilter(e.target.value as 'All' | 'Published' | 'Unpublished')
            }
            className="jstu-select md:w-44"
            aria-label="Filter by visibility"
          >
            <option value="All">All Visibility</option>
            <option value="Published">Published</option>
            <option value="Unpublished">Unpublished</option>
          </select>
        </div>
      </div>

      {/* Routes List */}
      {filteredRoutes.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No transportation routes found"
          description="Create a new bus route or clear your current filters."
          action={{
            label: 'Add First Route',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredRoutes.map((route) => (
            <div key={route.id} className="jstu-surface p-5 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                      {route.busNumber}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span
                      className={`font-semibold inline-flex items-center gap-1.5 ${
                        route.status === 'Active'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : route.status === 'Suspended'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {route.status === 'Active' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : route.status === 'Suspended' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                      <span>{route.status}</span>
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span
                      className={`font-semibold ${
                        route.published
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {route.published ? 'Published to Students' : 'Unpublished Draft'}
                    </span>
                  </div>

                  <h2 className="jstu-section-title">{route.routeName}</h2>

                  <p className="jstu-secondary tabular-nums">
                    {route.startingPoint} &rarr; {route.destination} &middot;{' '}
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {route.departureTime} &ndash; {route.arrivalTime}
                    </span>{' '}
                    &middot; {route.operatingDays.join(', ')}
                  </p>
                </div>

                {/* Admin Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(route)}
                    className={`jstu-btn-secondary min-h-[38px] px-3.5 py-2 text-sm cursor-pointer ${
                      !route.published
                        ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : ''
                    }`}
                  >
                    {route.published ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>

                  {route.status === 'Suspended' ? (
                    <button
                      type="button"
                      onClick={() => handleActivateRoute(route)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resume Service</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendTarget(route);
                        setSuspendReason(route.statusNote || '');
                      }}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Suspend</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(route)}
                    className="jstu-btn-secondary min-h-[38px] px-3.5 py-2 text-sm cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(route)}
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    Stops ({route.stops.length}):
                  </strong>{' '}
                  {route.stops.map((s) => s.name).join(' → ')}
                </span>
                {route.driverName && (
                  <span className="jstu-meta">
                    Driver: {route.driverName}
                    {route.driverContact ? ` (${route.driverContact})` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Route Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRoute ? 'Edit Bus Route' : 'Create University Bus Route'}
        description="Configure route details, ordered stops, schedule, driver info, and publication visibility."
        maxWidth="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300 font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="jstu-label">Route Name *</label>
              <input
                type="text"
                required
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. Route 01: Main Campus – City Central Express"
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Bus Number / Name *</label>
              <input
                type="text"
                required
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                placeholder="e.g. JSTU-BUS-101"
                className="jstu-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Starting Location *</label>
              <input
                type="text"
                required
                value={startingPoint}
                onChange={(e) => setStartingPoint(e.target.value)}
                placeholder="e.g. JSTU Central Transport Terminal"
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Destination *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. City Central Railway Hub"
                className="jstu-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="jstu-label">Departure Time *</label>
              <input
                type="text"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="07:30 AM"
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">Arrival Time *</label>
              <input
                type="text"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="08:25 AM"
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">Route Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RouteStatus)}
                className="jstu-select"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Operating Days */}
          <div>
            <label className="jstu-label">Operating Days *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const selected = operatingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordered Stops Builder */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="jstu-label mb-0">Ordered Route Stops *</label>
              <button
                type="button"
                onClick={addStopRow}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stop</span>
              </button>
            </div>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-7 text-center font-mono text-sm font-bold text-slate-500 shrink-0 tabular-nums">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={stop.name}
                    onChange={(e) => handleStopChange(idx, 'name', e.target.value)}
                    placeholder={`Stop ${idx + 1} name`}
                    className="jstu-input flex-1"
                  />
                  <input
                    type="text"
                    value={stop.scheduledTime || ''}
                    onChange={(e) => handleStopChange(idx, 'scheduledTime', e.target.value)}
                    placeholder="Time (opt)"
                    className="jstu-input w-28 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => moveStop(idx, -1)}
                    disabled={idx === 0}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                    aria-label="Move stop up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(idx, 1)}
                    disabled={idx === stops.length - 1}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                    aria-label="Move stop down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStopRow(idx)}
                    disabled={stops.length <= 1}
                    className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 cursor-pointer"
                    title="Remove stop"
                    aria-label="Remove stop"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Details & Status Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Driver Name (Optional)</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Tariqul Islam"
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Driver Contact (Optional)</label>
              <input
                type="text"
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                placeholder="e.g. +880 1711-000101"
                className="jstu-input"
              />
            </div>
          </div>

          {status !== 'Active' && (
            <div>
              <label className="jstu-label">Service Status Notice (Shown to Students)</label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Reason for suspension or inactive status..."
                className="jstu-input"
              />
            </div>
          )}

          <label className="jstu-inset flex items-center gap-3 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Publish immediately so students can view this route
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="jstu-btn-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="jstu-btn-primary cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : editingRoute
                ? 'Save Route Changes'
                : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Suspend Route Modal */}
      <Modal
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        title="Suspend Bus Route"
        description={
          suspendTarget
            ? `Temporarily suspend "${suspendTarget.routeName}" (${suspendTarget.busNumber})`
            : ''
        }
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmSuspend} className="space-y-4">
          <div>
            <label className="jstu-label">Suspension Notice for Students</label>
            <textarea
              rows={3}
              required
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Temporarily suspended due to road repair along City Terminal corridor."
              className="jstu-textarea"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSuspendTarget(null)}
              className="jstu-btn-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[15px] font-semibold cursor-pointer"
            >
              Confirm Suspension
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Route ConfirmationModal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRoute}
        title="Delete Transportation Route"
        message={`Are you sure you want to permanently remove "${deleteTarget?.routeName || ''}" (${deleteTarget?.busNumber || ''})? Students will no longer see this route.`}
        confirmText="Delete Route"
        isDanger
      />
    </div>
  );
};
