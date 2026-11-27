import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'title'>('deadline');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<AssignmentPriority>('medium');
  const [status, setStatus] = useState<AssignmentStatus>('pending');

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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="jstu-page-title flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-amber-500 shrink-0" />
            <span>Assignment Tracker</span>
          </h1>
          <p className="jstu-secondary mt-1.5">
            Track coursework deliverables, project milestones, and submission deadlines
          </p>
        </div>

        <button onClick={openCreateModal} className="jstu-btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="jstu-surface p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignments by name or course code..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="jstu-select"
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
            className="jstu-select"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'title')}
            className="jstu-select"
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
          description="You don't have any assignments matching this criteria. Create one using the button above."
          action={{
            label: 'Add Assignment',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="space-y-3.5">
          {filtered.map((asg) => {
            const isCompleted = asg.status === 'completed';
            const isOverdue = asg.status === 'overdue';
            const deadlineDate = new Date(asg.deadline);

            return (
              <div
                key={asg.id}
                className={`jstu-surface p-5 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-emerald-200/80 dark:border-emerald-900/40 opacity-85'
                    : isOverdue
                    ? 'border-rose-300 dark:border-rose-800/70'
                    : 'hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleCompleted(asg)}
                    className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent'
                    }`}
                    title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                    aria-label={isCompleted ? 'Mark assignment incomplete' : 'Mark assignment completed'}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </button>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70">
                        {asg.courseCode}
                      </span>
                      <h2
                        className={`text-lg font-semibold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-950 dark:text-white'
                        }`}
                      >
                        {asg.title}
                      </h2>
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
                        {asg.priority} priority
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

                    <p className="text-[15px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {asg.description}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {asg.courseName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3.5 md:pt-0 border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="text-left md:text-right space-y-0.5">
                    <div
                      className={`text-[15px] font-semibold flex items-center md:justify-end gap-1.5 tabular-nums ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Clock className="w-4 h-4 shrink-0" />
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
                    <span className="text-[13px] text-slate-500 dark:text-slate-400 block">
                      {isOverdue ? 'Overdue Deadline' : 'Due date'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(asg)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit assignment"
                      aria-label="Edit assignment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(asg.id)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete assignment"
                      aria-label="Delete assignment"
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

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Assignment' : 'Add New Assignment'}
        description="Fill in assignment details and deadline"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="jstu-label">Assignment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Paper Review"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="jstu-label">Course Code</label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="CSE 301"
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">Course Name</label>
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Algorithms & Complexity"
                className="jstu-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="jstu-label">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                className="jstu-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div>
              <label className="jstu-label">Assignment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="jstu-select"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">Deadline Date &amp; Time</label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">Instructions &amp; Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide assignment objectives, submission link, and notes..."
              className="jstu-textarea"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="jstu-btn-primary">
              {editingId ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </Modal>

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
