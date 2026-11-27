import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="jstu-page-title flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Academic Class Routine</span>
          </h1>
          <p className="jstu-secondary mt-1.5">
            Department of Computer Science &amp; Engineering &middot; Fall Semester 2026
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800/80 p-1.5 border border-slate-300/60 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Weekly Grid
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[15px] font-semibold transition-colors shrink-0 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span>{day}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[13px] tabular-nums ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="jstu-section-title">
              {selectedDay} Schedule <span className="text-slate-500 dark:text-slate-400 font-normal tabular-nums">({dayClasses.length} lectures)</span>
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
              Regular Semester Routine
            </span>
          </div>

          {dayClasses.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={`No classes on ${selectedDay}`}
              description="No formal lectures or laboratory sessions are scheduled for this day of the week."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dayClasses.map((item) => (
                <div
                  key={item.id}
                  className="jstu-surface p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/70">
                        {item.courseCode}
                      </span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {item.batch || 'Batch 2023'}
                      </span>
                    </div>

                    <div>
                      <h3 className="jstu-card-title">
                        {item.courseName}
                      </h3>
                      <p className="text-[15px] text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{item.instructorName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-[15px] font-medium">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{item.startTime} - {item.endTime}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{item.roomNumber}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS.map((day) => {
            const list = routines.filter((r) => r.dayOfWeek === day);
            return (
              <div key={day} className="jstu-surface p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                    {day}
                  </h3>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {list.length} slots
                  </span>
                </div>

                {list.length === 0 ? (
                  <p className="text-[15px] text-slate-500 dark:text-slate-400 py-6 text-center">
                    Free day
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {list.map((c) => (
                      <div key={c.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                          <span className="text-blue-600 dark:text-blue-400 font-mono">
                            {c.courseCode}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {c.roomNumber}
                          </span>
                        </div>
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {c.courseName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
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
