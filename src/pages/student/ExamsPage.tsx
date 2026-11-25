import React, { useEffect, useState } from 'react';
import { FileCheck2, Calendar, Clock, MapPin, Search, Filter, AlertCircle } from 'lucide-react';
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Examination Schedule</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Midterm & Final Examination Dates & Hall Allocations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-3.5 py-2 rounded-2xl border border-purple-200 dark:border-purple-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Please carry your valid University ID Card to all examination halls</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course code, title, or exam hall..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
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
                className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {exam.courseCode}
                    </span>
                    <Badge variant="purple" size="sm">
                      {exam.examType}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {exam.courseName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Invigilator: <span className="font-medium text-slate-700 dark:text-slate-300">{exam.instructor}</span>
                    </p>
                  </div>

                  {/* Countdown Badge */}
                  <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Countdown:</span>
                    <span
                      className={`font-extrabold ${
                        daysLeft <= 3
                          ? 'text-rose-600 dark:text-rose-400'
                          : daysLeft <= 7
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {daysLeft < 0
                        ? 'Completed'
                        : daysLeft === 0
                        ? 'Today!'
                        : `${daysLeft} days remaining`}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>
                      {new Date(exam.examDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
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
