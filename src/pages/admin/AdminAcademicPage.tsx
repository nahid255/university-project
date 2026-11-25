import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  FileCheck2,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  User,
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
  const [department, setDepartment] = useState('Computer Science & Engineering');

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Academic Schedule Administration</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure weekly departmental class timetables and semester examination seatings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'routine' ? (
            <button
              onClick={() => setIsRoutineModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Slot</span>
            </button>
          ) : (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
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
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'routine'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Weekly Class Routine</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold">
            {routines.length}
          </span>
          {activeTab === 'routine' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'exams'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Examinations Schedule</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold">
            {exams.length}
          </span>
          {activeTab === 'exams' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Routine Tab Table */}
      {activeTab === 'routine' && (
        <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Course</th>
                  <th className="py-3.5 px-4">Day</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Room Venue</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {routines.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-2">
                        {r.courseCode}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.courseName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {r.dayOfWeek}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {r.startTime} - {r.endTime}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {r.roomNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {r.instructorName}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteRoutineId(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Examination Course</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue Room</th>
                  <th className="py-3.5 px-4">Exam Type</th>
                  <th className="py-3.5 px-4">Invigilator</th>
                  <th className="py-3.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 mr-2">
                        {e.courseCode}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {e.courseName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(e.examDate).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {e.startTime} - {e.endTime}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {e.roomNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="purple" size="sm">
                        {e.examType}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {e.instructor}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteExamId(e.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course Title
            </label>
            <input
              type="text"
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Distributed Operating Systems"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instructor Name
              </label>
              <input
                type="text"
                required
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Dr. Samuel Vance"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Room Venue
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Lecture Hall C-302"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
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
                placeholder="10:30 AM"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoutineModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                required
                value={examCourseCode}
                onChange={(e) => setExamCourseCode(e.target.value)}
                placeholder="CSE 305"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Examination Type
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              >
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
                <option value="Lab Exam">Lab Exam</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Course Title
            </label>
            <input
              type="text"
              required
              value={examCourseName}
              onChange={(e) => setExamCourseName(e.target.value)}
              placeholder="Database Management Systems"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Exam Date
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time
              </label>
              <input
                type="text"
                required
                value={examStart}
                onChange={(e) => setExamStart(e.target.value)}
                placeholder="09:30 AM"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time
              </label>
              <input
                type="text"
                required
                value={examEnd}
                onChange={(e) => setExamEnd(e.target.value)}
                placeholder="12:30 PM"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Venue Room
              </label>
              <input
                type="text"
                required
                value={examRoom}
                onChange={(e) => setExamRoom(e.target.value)}
                placeholder="Main Hall B"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lead Invigilator
              </label>
              <input
                type="text"
                required
                value={examInstructor}
                onChange={(e) => setExamInstructor(e.target.value)}
                placeholder="Dr. Rebecca Stone"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
            >
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
