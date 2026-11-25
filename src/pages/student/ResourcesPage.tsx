import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  FileText,
  FileCode,
  Calendar,
  User,
  Eye,
  CheckCircle,
  UploadCloud,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getResources,
  createResource,
  incrementResourceDownload,
} from '../../services/resourceService';
import { uploadFile, validateFile } from '../../services/storage';
import { StudyResource, ResourceCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CATEGORIES: ('All' | ResourceCategory)[] = [
  'All',
  'Computer Science',
  'Programming',
  'Mathematics',
  'Engineering',
  'Physics',
  'Chemistry',
  'General Study',
];

export const ResourcesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Computer Science');
  const [courseCode, setCourseCode] = useState('CSE 301');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (e) {
      console.error('Failed to load study resources', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const openUploadModal = () => {
    setTitle('');
    setDescription('');
    setCategory('Computer Science');
    setCourseCode('CSE 301');
    setSelectedFile(null);
    setFileUrlInput('');
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateFile(file, {
      maxSizeMB: 25,
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
      ],
    });

    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format or size.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || (!selectedFile && !fileUrlInput.trim())) {
      setUploadError('Please provide a resource title and attach a document.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      let downloadUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      let fileName = 'Academic_Study_Material.pdf';
      let fileSize = '2.5 MB';
      let fileType = 'application/pdf';

      if (selectedFile) {
        fileName = selectedFile.name;
        fileSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
        fileType = selectedFile.type || 'application/pdf';
        const path = `study-resources/${Date.now()}_${selectedFile.name}`;
        downloadUrl = await uploadFile(selectedFile, path);
      } else if (fileUrlInput.trim()) {
        if (!isSafeUrl(fileUrlInput.trim())) {
          setUploadError('Please enter a valid http(s) document URL.');
          setIsUploading(false);
          return;
        }
        downloadUrl = sanitizeUrl(fileUrlInput.trim());
        fileName = `${title.replace(/\s+/g, '_')}_Material.pdf`;
      }

      await createResource({
        title: title.trim(),
        description: description.trim(),
        category,
        courseCode: courseCode.trim().toUpperCase(),
        uploadedById: currentUser.uid,
        uploadedByName: currentUser.fullName,
        fileUrl: downloadUrl,
        fileName,
        fileSize,
        fileType,
      });

      setIsUploadModalOpen(false);
      await loadResources();
    } catch (err) {
      console.error('Resource upload failed', err);
      setUploadError('Failed to complete upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (resource: StudyResource) => {
    await incrementResourceDownload(resource.id);
    setResources((prev) =>
      prev.map((r) =>
        r.id === resource.id ? { ...r, downloadsCount: r.downloadsCount + 1 } : r
      )
    );
    const safeHref = sanitizeUrl(resource.fileUrl);
    if (safeHref !== '#') {
      const link = document.createElement('a');
      link.href = safeHref;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus resource library..." />;
  }

  const filtered = resources.filter((res) => {
    const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
    const matchesSearch =
      res.title.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase()) ||
      res.courseCode.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Study Resource Sharing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Peer-shared lecture notes, past exam solutions, lab manuals, and revision cheat sheets
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search study guides, course codes (e.g. CSE 301, MAT 202), or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources found"
          description="Be the first student to upload study notes for this subject!"
          action={{
            label: 'Upload Resource',
            onClick: openUploadModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {res.courseCode}
                  </span>
                  <Badge variant="purple" size="sm">
                    {res.category}
                  </Badge>
                </div>

                <div>
                  <Link to={`/resources/${res.id}`} className="block group">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {res.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                {/* File Attachment Pill */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]">
                      {res.fileName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {res.fileSize}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{res.uploadedByName}</span>
                  </span>
                  <span>{new Date(res.uploadedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleDownload(res)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ({res.downloadsCount})</span>
                  </button>

                  <Link
                    to={`/resources/${res.id}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Share Study Resource"
        description="Contribute verified notes, cheat sheets, or lab code to help classmates"
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Resource Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems Concurrency & Deadlocks Exam Notes"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description & Topics Covered
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what chapters, topics, formulas, or practice questions are included in this document..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Document File Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Document File (PDF, DOCX, PPTX - Max 25MB)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors border border-slate-200 dark:border-slate-700">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>{selectedFile ? selectedFile.name : 'Choose File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-xs text-slate-400">or document URL:</span>

              <input
                type="url"
                value={fileUrlInput}
                onChange={(e) => setFileUrlInput(e.target.value)}
                placeholder="https://example.com/notes.pdf"
                className="flex-1 w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {selectedFile && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Ready for upload: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {isUploading ? 'Uploading Material...' : 'Publish Study Material'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
