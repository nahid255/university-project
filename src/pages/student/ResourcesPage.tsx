import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Download,
  FileText,
  User,
  Eye,
  UploadCloud,
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

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="jstu-page-title flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Study Resource Sharing</span>
          </h1>
          <p className="jstu-secondary mt-1.5">
            Peer-shared lecture notes, past exam solutions, lab manuals, and revision guides
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="jstu-btn-primary bg-indigo-600 hover:bg-indigo-700 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search study guides, course codes (e.g. CSE 301, MAT 202), or keywords..."
            className="jstu-input pl-11"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
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
          description="Be the first student to upload study notes for this subject."
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
              className="jstu-surface p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70">
                    {res.courseCode}
                  </span>
                  <Badge variant="purple" size="sm">
                    {res.category}
                  </Badge>
                </div>

                <div>
                  <Link to={`/resources/${res.id}`} className="block group">
                    <h2 className="jstu-card-title group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {res.title}
                    </h2>
                  </Link>
                  <p className="text-[15px] text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="p-3.5 jstu-inset flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {res.fileName}
                    </span>
                  </div>
                  <span className="text-[13px] text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                    {res.fileSize}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{res.uploadedByName}</span>
                  </span>
                  <span>{new Date(res.uploadedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleDownload(res)}
                    className="flex-1 jstu-btn-primary bg-indigo-600 hover:bg-indigo-700 tabular-nums"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download ({res.downloadsCount})</span>
                  </button>

                  <Link
                    to={`/resources/${res.id}`}
                    className="jstu-btn-secondary px-3.5"
                    title="View details"
                    aria-label="View resource details"
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
        <form onSubmit={handleUploadSubmit} className="space-y-5">
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300 font-medium">
              {uploadError}
            </div>
          )}

          <div>
            <label className="jstu-label">Resource Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Operating Systems Concurrency & Deadlocks Exam Notes"
              className="jstu-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="jstu-label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="jstu-select"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div>
            <label className="jstu-label">Description &amp; Topics Covered</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what chapters, topics, formulas, or practice questions are included..."
              className="jstu-textarea"
            />
          </div>

          <div className="space-y-2.5">
            <label className="jstu-label">
              Select Document File (PDF, DOCX, PPTX &ndash; Max 25MB)
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="jstu-btn-secondary cursor-pointer shrink-0">
                <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{selectedFile ? selectedFile.name : 'Choose File'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-sm text-slate-500 dark:text-slate-400 text-center">or URL:</span>

              <input
                type="url"
                value={fileUrlInput}
                onChange={(e) => setFileUrlInput(e.target.value)}
                placeholder="https://example.com/notes.pdf"
                className="jstu-input flex-1"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Ready for upload: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="jstu-btn-primary bg-indigo-600 hover:bg-indigo-700"
            >
              {isUploading ? 'Uploading Material...' : 'Publish Study Material'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
