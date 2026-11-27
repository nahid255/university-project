import React, { useEffect, useState } from 'react';
import { FileCheck2, Calendar, Clock, MapPin, Search, AlertCircle } from 'lucide-react';
import { getExams } from '../../services/academicService';
import { ExamSchedule } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const data = await getExams();
        setExams(data);
      } catch (e) {
        console.error('Failed to fetch exams', e);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading examination schedule..." />;
  }

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || exam.examType === selectedType;

    return matchesSearch && matchesType;
  });

  const getDaysRemaining = (examDateStr: string) => {
    const examDate = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="jstu-page-title flex items-center gap-3">
            <FileCheck2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Examination Schedule</span>
          </h1>
          <p className="jstu-secondary mt-1.5">
            Official Midterm &amp; Final Examination Dates and Hall Allocations
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-sm bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 px-4 py-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/70">
          <AlertCircle className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>Carry your valid JSTU University ID Card to all examination halls</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="jstu-surface p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course code, title, or exam hall..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="jstu-select"
          >
            <option value="all">All Exam Types</option>
            <option value="Midterm">Midterm</option>
            <option value="Final">Final</option>
            <option value="Lab Exam">Lab Exam</option>
            <option value="Quiz">Quiz</option>
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No examinations match your filter"
          description="Try broadening your search query or selecting a different examination category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const daysLeft = getDaysRemaining(exam.examDate);

            return (
              <div
                key={exam.id}
                className="jstu-surface p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70">
                      {exam.courseCode}
                    </span>
                    <Badge variant="purple" size="sm">
                      {exam.examType}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="jstu-card-title">
                      {exam.courseName}
                    </h2>
                    <p className="text-[15px] text-slate-600 dark:text-slate-400 mt-1.5">
                      Invigilator:{' '}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {exam.instructor}
                      </span>
                    </p>
                  </div>

                  <div className="py-2.5 px-3.5 rounded-xl jstu-inset flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Countdown</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        daysLeft <= 3
                          ? 'text-rose-600 dark:text-rose-400'
                          : daysLeft <= 7
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {daysLeft < 0
                        ? 'Completed'
                        : daysLeft === 0
                        ? 'Today'
                        : `${daysLeft} days remaining`}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2 text-[15px]">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold tabular-nums">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>
                      {new Date(exam.examDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{exam.roomNumber}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
