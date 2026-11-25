import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, User, BookOpen, Layers } from 'lucide-react';
import { getRoutines } from '../../services/academicService';
import { ClassRoutine, DayOfWeek } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RoutinePage: React.FC = () => {
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    const fetchRoutines = async () => {
      try {
        setLoading(true);
        const data = await getRoutines();
        setRoutines(data);
      } catch (e) {
        console.error('Failed to fetch class routines', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutines();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading class schedule..." />;
  }

  const dayClasses = routines.filter((r) => r.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Academic Class Routine</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department of Computer Science & Engineering &bull; Fall Semester 2026
          </p>
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-300/40 dark:border-slate-700">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Weekly Grid
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DAYS.map((day) => {
          const count = routines.filter((r) => r.dayOfWeek === day).length;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                if (viewMode === 'week') setViewMode('day');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-[#111C32] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{day}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content View */}
      {viewMode === 'day' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {selectedDay} Schedule ({dayClasses.length} lectures)
            </h2>
            <span className="text-xs text-slate-400">Regular Semester Routine</span>
          </div>

          {dayClasses.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={`No classes on ${selectedDay}`}
              description="No formal lectures or laboratory sessions are scheduled for this day of the week."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayClasses.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {item.courseCode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {item.batch || 'Batch 2023'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {item.courseName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.instructorName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.startTime} - {item.endTime}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{item.roomNumber}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Full Weekly Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS.map((day) => {
            const list = routines.filter((r) => r.dayOfWeek === day);
            return (
              <div
                key={day}
                className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {day}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {list.length} slots
                  </span>
                </div>

                {list.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center italic">
                    Free day
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {list.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1 font-bold">
                          <span className="text-blue-600 dark:text-blue-400 font-mono">
                            {c.courseCode}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {c.roomNumber}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {c.courseName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {c.startTime} - {c.endTime}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
