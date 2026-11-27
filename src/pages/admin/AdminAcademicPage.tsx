import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getRoutines,
  createRoutine,
  deleteRoutine,
  getExams,
  createExam,
  deleteExam,
} from '../../services/academicService';
import { ClassRoutine, ExamSchedule, DayOfWeek } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AdminAcademicPage: React.FC = () => {
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'routine' | 'exams'>('routine');

  // Routine Modal
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [department] = useState('Computer Science & Engineering');

  // Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examCourseCode, setExamCourseCode] = useState('');
  const [examCourseName, setExamCourseName] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examStart, setExamStart] = useState('09:30 AM');
  const [examEnd, setExamEnd] = useState('12:30 PM');
  const [examRoom, setExamRoom] = useState('');
  const [examInstructor, setExamInstructor] = useState('');
  const [examType, setExamType] = useState<'Midterm' | 'Final' | 'Quiz' | 'Lab Exam'>('Midterm');

  // Delete State
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, e] = await Promise.all([getRoutines(), getExams()]);
      setRoutines(r);
      setExams(e);
    } catch (err) {
      console.error('Failed to load academic schedules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    await createRoutine({
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      instructorName: instructorName.trim(),
      roomNumber: roomNumber.trim(),
      dayOfWeek,
      startTime,
      endTime,
      department,
      batch: 'Batch 2023',
    });

    setIsRoutineModalOpen(false);
    await loadData();
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCourseCode.trim() || !examCourseName.trim()) return;

    await createExam({
      courseCode: examCourseCode.trim().toUpperCase(),
      courseName: examCourseName.trim(),
      examDate,
      startTime: examStart,
      endTime: examEnd,
      roomNumber: examRoom.trim(),
      instructor: examInstructor.trim(),
      examType,
      department: 'Computer Science & Engineering',
    });

    setIsExamModalOpen(false);
    await loadData();
  };

  const confirmDeleteRoutine = async () => {
    if (!deleteRoutineId) return;
    await deleteRoutine(deleteRoutineId);
    setDeleteRoutineId(null);
    await loadData();
  };

  const confirmDeleteExam = async () => {
    if (!deleteExamId) return;
    await deleteExam(deleteExamId);
    setDeleteExamId(null);
    await loadData();
  };

  if (loading) {
    return <LoadingSpinner label="Loading academic schedule manager..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">Academic Schedule Administration</h1>
          <p className="jstu-secondary">
            Configure weekly departmental class timetables and semester examination seatings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'routine' ? (
            <button
              onClick={() => setIsRoutineModalOpen(true)}
              className="jstu-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Slot</span>
            </button>
          ) : (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="jstu-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Examination</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('routine')}
          className={`pb-3.5 text-[15px] font-semibold transition-colors relative flex items-center gap-2.5 ${
            activeTab === 'routine'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Weekly Class Routine</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold tabular-nums">
            {routines.length}
          </span>
          {activeTab === 'routine' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3.5 text-[15px] font-semibold transition-colors relative flex items-center gap-2.5 ${
            activeTab === 'exams'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Examinations Schedule</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold tabular-nums">
            {exams.length}
          </span>
          {activeTab === 'exams' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Routine Tab Table */}
      {activeTab === 'routine' && (
        <div className="jstu-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="jstu-table-th">Course</th>
                  <th className="jstu-table-th">Day</th>
                  <th className="jstu-table-th">Time Slot</th>
                  <th className="jstu-table-th">Room Venue</th>
                  <th className="jstu-table-th">Instructor</th>
                  <th className="jstu-table-th text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {routines.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="jstu-table-td">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-2.5">
                        {r.courseCode}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.courseName}
                      </span>
                    </td>
                    <td className="jstu-table-td font-semibold">{r.dayOfWeek}</td>
                    <td className="jstu-table-td font-mono tabular-nums whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="jstu-table-td font-medium">{r.roomNumber}</td>
                    <td className="jstu-table-td">{r.instructorName}</td>
                    <td className="jstu-table-td text-right">
                      <button
                        onClick={() => setDeleteRoutineId(r.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Delete class slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Exams Tab Table */}
      {activeTab === 'exams' && (
        <div className="jstu-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="jstu-table-th">Examination Course</th>
                  <th className="jstu-table-th">Date &amp; Time</th>
                  <th className="jstu-table-th">Venue Room</th>
                  <th className="jstu-table-th">Exam Type</th>
                  <th className="jstu-table-th">Invigilator</th>
                  <th className="jstu-table-th text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {exams.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="jstu-table-td">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 mr-2.5">
                        {e.courseCode}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {e.courseName}
                      </span>
                    </td>
                    <td className="jstu-table-td">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {new Date(e.examDate).toLocaleDateString()}
                      </p>
                      <p className="jstu-meta font-mono tabular-nums">
                        {e.startTime} - {e.endTime}
                      </p>
                    </td>
                    <td className="jstu-table-td font-medium">{e.roomNumber}</td>
                    <td className="jstu-table-td">
                      <Badge variant="purple" size="sm">
                        {e.examType}
                      </Badge>
                    </td>
                    <td className="jstu-table-td">{e.instructor}</td>
                    <td className="jstu-table-td text-right">
                      <button
                        onClick={() => setDeleteExamId(e.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Delete examination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routine Modal */}
      <Modal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        title="Schedule Academic Class Slot"
        description="Add a class lecture or laboratory session to the student routine"
      >
        <form onSubmit={handleRoutineSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              <label className="jstu-label">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="jstu-select"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">Course Title</label>
            <input
              type="text"
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Distributed Operating Systems"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Instructor Name</label>
              <input
                type="text"
                required
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Dr. Samuel Vance"
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Room Venue</label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Lecture Hall C-302"
                className="jstu-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Start Time</label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00 AM"
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">End Time</label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="10:30 AM"
                className="jstu-input font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoutineModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="jstu-btn-primary">
              Add Class Slot
            </button>
          </div>
        </form>
      </Modal>

      {/* Exam Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Schedule Examination"
        description="Add a midterm, final, or quiz date for campus departments"
      >
        <form onSubmit={handleExamSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Course Code</label>
              <input
                type="text"
                required
                value={examCourseCode}
                onChange={(e) => setExamCourseCode(e.target.value)}
                placeholder="CSE 305"
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">Examination Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="jstu-select"
              >
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
                <option value="Lab Exam">Lab Exam</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
          </div>

          <div>
            <label className="jstu-label">Course Title</label>
            <input
              type="text"
              required
              value={examCourseName}
              onChange={(e) => setExamCourseName(e.target.value)}
              placeholder="Database Management Systems"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="jstu-label">Exam Date</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">Start Time</label>
              <input
                type="text"
                required
                value={examStart}
                onChange={(e) => setExamStart(e.target.value)}
                placeholder="09:30 AM"
                className="jstu-input font-mono"
              />
            </div>
            <div>
              <label className="jstu-label">End Time</label>
              <input
                type="text"
                required
                value={examEnd}
                onChange={(e) => setExamEnd(e.target.value)}
                placeholder="12:30 PM"
                className="jstu-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="jstu-label">Venue Room</label>
              <input
                type="text"
                required
                value={examRoom}
                onChange={(e) => setExamRoom(e.target.value)}
                placeholder="Main Hall B"
                className="jstu-input"
              />
            </div>
            <div>
              <label className="jstu-label">Lead Invigilator</label>
              <input
                type="text"
                required
                value={examInstructor}
                onChange={(e) => setExamInstructor(e.target.value)}
                placeholder="Dr. Rebecca Stone"
                className="jstu-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="jstu-btn-primary">
              Add Examination
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteRoutineId)}
        onClose={() => setDeleteRoutineId(null)}
        onConfirm={confirmDeleteRoutine}
        title="Remove Routine Class"
        message="Are you sure you want to remove this class slot from the department schedule?"
      />

      <ConfirmationModal
        isOpen={Boolean(deleteExamId)}
        onClose={() => setDeleteExamId(null)}
        onConfirm={confirmDeleteExam}
        title="Remove Examination"
        message="Are you sure you want to cancel and remove this examination from the schedule?"
      />
    </div>
  );
};
