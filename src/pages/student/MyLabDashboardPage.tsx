import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Search,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Binary,
  Network,
  BrainCircuit,
  Cpu,
  Layers,
  GitBranch,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserLabProgress } from '../../services/labService';
import {
  LAB_CATEGORIES,
  LAB_EXPERIMENTS,
  getInteractiveExperiments,
} from '../../mylab/registry';
import {
  LabCategoryId,
  LabDifficulty,
  LabExperimentDefinition,
  LabExperimentProgress,
  LabStatus,
} from '../../types/mylab';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const CATEGORY_ICONS: Record<LabCategoryId, React.ElementType> = {
  algorithm: Binary,
  'data-structure': Layers,
  graph: Network,
  'machine-learning': BrainCircuit,
  'digital-logic': GitBranch,
  'computer-architecture': Cpu,
};

export const MyLabDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressList, setProgressList] = useState<LabExperimentProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LabCategoryId | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<LabDifficulty | 'all'>('all');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const data = await getUserLabProgress(currentUser.uid);
        setProgressList(data);
      } catch (err) {
        console.error('Failed to load My Lab progress:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const progressMap = useMemo(() => {
    const map = new Map<string, LabExperimentProgress>();
    progressList.forEach((p) => map.set(p.experimentId, p));
    return map;
  }, [progressList]);

  const interactiveExperiments = useMemo(() => getInteractiveExperiments(), []);

  const getStatusForExperiment = (expId: string): LabStatus =>
    progressMap.get(expId)?.status || 'not_started';

  const completedExperiments = useMemo(
    () => interactiveExperiments.filter((e) => getStatusForExperiment(e.id) === 'completed'),
    [interactiveExperiments, progressMap]
  );

  const recentlyOpenedExperiments = useMemo(() => {
    const orderedIds = progressList.map((p) => p.experimentId);
    return orderedIds
      .map((id) => interactiveExperiments.find((e) => e.id === id))
      .filter((e): e is LabExperimentDefinition => Boolean(e))
      .slice(0, 3);
  }, [progressList, interactiveExperiments]);

  const inProgressCount = useMemo(
    () => interactiveExperiments.filter((e) => getStatusForExperiment(e.id) === 'in_progress').length,
    [interactiveExperiments, progressMap]
  );

  const totalChallengesSolved = useMemo(
    () => progressList.reduce((sum, p) => sum + (p.challengesSolved?.length || 0), 0),
    [progressList]
  );

  const completionPercent =
    interactiveExperiments.length > 0
      ? Math.round((completedExperiments.length / interactiveExperiments.length) * 100)
      : 0;

  const filteredExperiments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return interactiveExperiments.filter((exp) => {
      const matchesCat = selectedCategory === 'all' || exp.categoryId === selectedCategory;
      const matchesDiff =
        selectedDifficulty === 'all' || exp.difficulty === selectedDifficulty;
      const matchesSearch =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        exp.subject.toLowerCase().includes(q) ||
        exp.shortDescription.toLowerCase().includes(q);
      return matchesCat && matchesDiff && matchesSearch;
    });
  }, [interactiveExperiments, searchQuery, selectedCategory, selectedDifficulty]);

  const featuredExperiments = useMemo(
    () => interactiveExperiments.filter((e) => e.featured),
    [interactiveExperiments]
  );

  const resumeCandidate =
    recentlyOpenedExperiments.find((e) => getStatusForExperiment(e.id) === 'in_progress') ||
    recentlyOpenedExperiments[0] ||
    interactiveExperiments[0];

  const visibleRoadmapCategories = useMemo(
    () =>
      selectedCategory === 'all'
        ? LAB_CATEGORIES
        : LAB_CATEGORIES.filter((c) => c.id === selectedCategory),
    [selectedCategory]
  );

  if (loading) {
    return <LoadingSpinner label="Loading My Lab workspace..." fullPage={false} />;
  }

  const renderStatusLabel = (status: LabStatus) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed</span>
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <Clock className="w-4 h-4" />
          <span>In Progress</span>
        </span>
      );
    }
    return <span className="text-sm text-slate-500 dark:text-slate-400">Not Started</span>;
  };

  const renderExperimentCard = (exp: LabExperimentDefinition) => {
    const status = getStatusForExperiment(exp.id);
    const prog = progressMap.get(exp.id);
    const solvedCount = prog?.challengesSolved?.length || 0;

    return (
      <article
        key={exp.id}
        className="jstu-surface p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      >
        <div className="space-y-2.5">
          <p className="jstu-meta font-medium tabular-nums">
            {exp.subject} &middot; {exp.difficulty} &middot; {exp.estimatedMinutes} min
          </p>

          <h3 className="jstu-card-title">{exp.title}</h3>

          <p className="jstu-secondary">{exp.shortDescription}</p>
        </div>

        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div>{renderStatusLabel(status)}</div>
            {exp.challenges.length > 0 && (
              <p className="jstu-meta font-mono tabular-nums">
                {solvedCount}/{exp.challenges.length} challenges solved
              </p>
            )}
          </div>

          <Link to={`/mylab/${exp.id}`} className="jstu-btn-primary shrink-0">
            <Play className="w-4 h-4" />
            <span>
              {status === 'completed'
                ? 'Review Lab'
                : status === 'in_progress'
                ? 'Continue'
                : 'Start Experiment'}
            </span>
          </Link>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-8">
      {/* Workbench Header */}
      <section className="jstu-surface p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              <FlaskConical className="w-4 h-4" />
              <span>JSTU Campus Virtual CS Laboratory &middot; Learn by Doing</span>
            </div>
            <h1 className="jstu-page-title">My Lab Interactive Workbench</h1>
            <p className="jstu-body">
              Experiment with real algorithms in your browser. Edit inputs, trace comparisons and swaps step by step, inspect pseudocode, and verify concepts with hands-on challenges.
            </p>
          </div>

          {resumeCandidate && (
            <Link to={`/mylab/${resumeCandidate.id}`} className="jstu-btn-primary shrink-0 self-start lg:self-center">
              <Play className="w-4 h-4" />
              <span>
                {recentlyOpenedExperiments.length > 0
                  ? `Resume: ${resumeCandidate.title}`
                  : `Launch: ${resumeCandidate.title}`}
              </span>
            </Link>
          )}
        </div>

        {/* Progress Bar */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Algorithm Lab Track Progress
            </span>
            <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
              {completedExperiments.length} / {interactiveExperiments.length} completed ({completionPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${completionPercent}%` }}
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
            />
          </div>
        </div>
      </section>

      {/* Progress Summary KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Interactive Labs</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {interactiveExperiments.length}
          </p>
          <p className="jstu-meta mt-1">Algorithm Lab active</p>
        </div>
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Completed Labs</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5">
            {completedExperiments.length}
          </p>
          <p className="jstu-meta mt-1">Verified milestones</p>
        </div>
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">In Progress</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1.5">
            {inProgressCount}
          </p>
          <p className="jstu-meta mt-1">Saved &amp; resumable</p>
        </div>
        <div className="jstu-surface p-5">
          <p className="jstu-meta font-medium">Challenges Solved</p>
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {totalChallengesSolved}
          </p>
          <p className="jstu-meta mt-1">Across all labs</p>
        </div>
      </section>

      {/* Recently Opened & Completed Quick Access */}
      {(recentlyOpenedExperiments.length > 0 || completedExperiments.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {recentlyOpenedExperiments.length > 0 && (
            <div className="jstu-surface p-5 sm:p-6 space-y-3">
              <h2 className="jstu-section-title">Recently Opened Experiments</h2>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {recentlyOpenedExperiments.map((exp) => {
                  const p = progressMap.get(exp.id);
                  return (
                    <Link
                      key={exp.id}
                      to={`/mylab/${exp.id}`}
                      className="py-3.5 flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {exp.title}
                        </p>
                        <p className="jstu-meta tabular-nums">
                          {p?.lastOpenedAt
                            ? `Opened ${new Date(p.lastOpenedAt).toLocaleDateString()}`
                            : exp.subject}{' '}
                          &middot; {p?.status === 'completed' ? 'Completed' : 'In Progress'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="jstu-surface p-5 sm:p-6 space-y-3">
            <h2 className="jstu-section-title">Completed Experiments</h2>
            {completedExperiments.length === 0 ? (
              <p className="jstu-secondary py-3">
                You haven&apos;t marked any lab completed yet. Run a simulation and mark it complete once you finish exploring its steps and challenges.
              </p>
            ) : (
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {completedExperiments.map((exp) => (
                  <Link
                    key={exp.id}
                    to={`/mylab/${exp.id}`}
                    className="py-3.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 truncate">
                        {exp.title}
                      </p>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        Completed &middot; {exp.subject}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search, Difficulty & Category Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiments by title, subject, or concept..."
              aria-label="Search My Lab experiments"
              className="jstu-input pl-11"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {(['all', 'Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {diff === 'all' ? 'All Levels' : diff}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Lab Categories Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-300'
            }`}
          >
            All Categories ({LAB_EXPERIMENTS.length})
          </button>

          {LAB_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const activeCount = interactiveExperiments.filter(
              (e) => e.categoryId === cat.id
            ).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{cat.title}</span>
                {activeCount > 0 && (
                  <span className="font-mono tabular-nums opacity-80">({activeCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Experiments */}
      {selectedCategory === 'all' &&
        selectedDifficulty === 'all' &&
        !searchQuery.trim() && (
          <section className="space-y-4">
            <div>
              <h2 className="jstu-section-title">Featured Experiments</h2>
              <p className="jstu-secondary mt-0.5">
                Start here for core sorting and logarithmic search mechanics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featuredExperiments.map((exp) => renderExperimentCard(exp))}
            </div>
          </section>
        )}

      {/* Filtered Interactive Experiment Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="jstu-section-title">
              {selectedCategory === 'all'
                ? 'All Interactive Experiments'
                : LAB_CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'Experiments'}
            </h2>
            <p className="jstu-secondary mt-0.5 tabular-nums">
              {filteredExperiments.length} interactive simulation
              {filteredExperiments.length === 1 ? '' : 's'} matching your filters
            </p>
          </div>
          {(selectedCategory !== 'all' ||
            selectedDifficulty !== 'all' ||
            searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {filteredExperiments.length === 0 ? (
          <div className="jstu-surface p-8 text-center space-y-3.5">
            <p className="jstu-card-title">
              {selectedCategory !== 'all' && selectedCategory !== 'algorithm'
                ? `${
                    LAB_CATEGORIES.find((c) => c.id === selectedCategory)?.title
                  } is scheduled for the next My Lab expansion`
                : 'No interactive experiments match your current search'}
            </p>
            <p className="jstu-secondary max-w-lg mx-auto">
              {selectedCategory !== 'all' && selectedCategory !== 'algorithm'
                ? 'Phase 1 prioritizes the Algorithm Lab with five complete interactive simulations (Bubble Sort, Selection Sort, Insertion Sort, Linear Search, and Binary Search). You can review planned modules below or jump straight into the Algorithm Lab.'
                : 'Try clearing your search keyword or difficulty filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('algorithm');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
              className="jstu-btn-primary"
            >
              <span>Open Algorithm Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExperiments.map((exp) => renderExperimentCard(exp))}
          </div>
        )}
      </section>

      {/* Extensible 6-Category CS Lab Curriculum Roadmap */}
      <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="jstu-section-title">Lab Categories &amp; Curriculum Architecture</h2>
          <p className="jstu-secondary mt-0.5">
            Structured across six Computer Science tracks. Algorithm Lab Phase 1 simulations are live now; additional modules are queued for upcoming phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleRoadmapCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const liveCount = interactiveExperiments.filter(
              (e) => e.categoryId === cat.id
            ).length;

            return (
              <div key={cat.id} className="jstu-surface p-5 sm:p-6 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="jstu-card-title">{cat.title}</h3>
                      <p className="jstu-meta">{cat.subject}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 tabular-nums ${
                      liveCount > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {liveCount > 0 ? `${liveCount} Live` : 'Upcoming Phase'}
                  </span>
                </div>

                <p className="jstu-secondary">{cat.description}</p>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
                  <p className="jstu-meta font-semibold">Upcoming Topics:</p>
                  <p className="jstu-secondary">{cat.plannedTopics.join(' · ')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
