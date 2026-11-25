import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../../services/academicService';
import { Assignment, AssignmentPriority, AssignmentStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AssignmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'title'>('deadline');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<AssignmentPriority>('medium');
  const [status, setStatus] = useState<AssignmentStatus>('pending');

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadAssignments = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await getAssignments(currentUser.uid);
      setAssignments(data);
    } catch (e) {
      console.error('Failed to load assignments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [currentUser]);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCourseCode('CSE 301');
    setCourseName('Algorithms & Complexity');
    setDeadline('');
    setPriority('medium');
    setStatus('pending');
    setIsModalOpen(true);
  };

  const openEditModal = (asg: Assignment) => {
    setEditingId(asg.id);
    setTitle(asg.title);
    setDescription(asg.description);
    setCourseCode(asg.courseCode);
    setCourseName(asg.courseName);
    setDeadline(asg.deadline);
    setPriority(asg.priority);
    setStatus(asg.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !deadline) return;

    if (editingId) {
      await updateAssignment(editingId, {
        title: title.trim(),
        description: description.trim(),
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        deadline,
        priority,
        status,
      });
    } else {
      await createAssignment({
        userId: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        deadline,
        priority,
        status,
      });
    }

    setIsModalOpen(false);
    await loadAssignments();
  };

  const handleToggleCompleted = async (asg: Assignment) => {
    const newStatus: AssignmentStatus = asg.status === 'completed' ? 'in_progress' : 'completed';
    await updateAssignment(asg.id, { status: newStatus });
    await loadAssignments();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteAssignment(deleteTargetId);
    setDeleteTargetId(null);
    await loadAssignments();
  };

  // Filter & Sort
  const filtered = assignments.filter((asg) => {
    const matchesSearch =
      asg.title.toLowerCase().includes(search.toLowerCase()) ||
      asg.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      asg.courseName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || asg.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || asg.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === 'priority') {
      const pWeights = { high: 3, medium: 2, low: 1 };
      return pWeights[b.priority] - pWeights[a.priority];
    }
    return a.title.localeCompare(b.title);
  });

  if (loading) {
    return <LoadingSpinner label="Loading assignments tracker..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-500" />
            <span>Assignment Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track coursework deliverables, project milestones, and assignment deadlines
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by name or course code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'title')}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No assignments found"
          description="You don't have any assignments matching this criteria. Create one using the button above!"
          action={{
            label: 'Add Assignment',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((asg) => {
            const isCompleted = asg.status === 'completed';
            const isOverdue = asg.status === 'overdue';
            const deadlineDate = new Date(asg.deadline);

            return (
              <div
                key={asg.id}
                className={`p-5 rounded-3xl bg-white dark:bg-[#111C32] border transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-emerald-200/80 dark:border-emerald-900/40 opacity-80'
                    : isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleCompleted(asg)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                    }`}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {asg.courseCode}
                      </span>
                      <h3
                        className={`text-sm font-bold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {asg.title}
                      </h3>
                      <Badge
                        variant={
                          asg.priority === 'high'
                            ? 'danger'
                            : asg.priority === 'medium'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {asg.priority.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={
                          isCompleted
                            ? 'success'
                            : isOverdue
                            ? 'danger'
                            : asg.status === 'in_progress'
                            ? 'primary'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {asg.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {asg.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-400 pt-1">
                      <span>{asg.courseName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right space-y-0.5">
                    <div
                      className={`text-xs font-bold flex items-center md:justify-end gap-1.5 ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {deadlineDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {deadlineDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {isOverdue ? 'Overdue Deadline' : 'Due date'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(asg)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit assignment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(asg.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Assignment' : 'Add New Assignment'}
        description="Fill in assignment details and deadline"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Paper Review"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="CSE 301"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Name
              </label>
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Algorithms & Complexity"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assignment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deadline Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide assignment objectives, submission link, and notes..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs"
            >
              {editingId ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
      />
    </div>
  );
};
