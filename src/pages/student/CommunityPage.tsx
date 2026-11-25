import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Heart,
  MessageCircle,
  Flag,
  Edit3,
  Trash2,
  Camera,
  Send,
  CornerDownRight,
  Clock,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  getComments,
  addComment,
  deleteComment,
  getUserLikedPostIds,
  togglePostLike,
} from '../../services/communityService';
import { uploadFile, validateFile } from '../../services/storage';
import { CommunityPost, PostComment, CommunityCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReportModal } from '../../components/common/ReportModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { isSafeUrl, sanitizeUrl } from '../../utils/url';

const CATEGORIES: ('All' | CommunityCategory)[] = [
  'All',
  'General Discussion',
  'Academic Help',
  'Programming',
  'University Life',
  'Questions',
  'Announcements',
];

const PAGE_SIZE = 6;

export const CommunityPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Composer / Edit Modal
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CommunityCategory>('General Discussion');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments Drawer/Modal
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);

  // Delete & Report Modals
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
    title: string;
    ownerId: string;
  } | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [fetchedPosts, liked] = await Promise.all([
        getPosts({ limitCount: 60 }),
        getUserLikedPostIds(currentUser.uid),
      ]);
      setPosts(fetchedPosts);
      setLikedPostIds(liked);
    } catch (e) {
      console.error('Failed to load community posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setCategory('General Discussion');
    setImageUrl('');
    setFormError(null);
    setIsComposerOpen(true);
  };

  const openEditModal = (post: CommunityPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category);
    setImageUrl(post.imageUrl || '');
    setFormError(null);
    setIsComposerOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);

    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/*'],
    });
    if (!validation.valid) {
      setFormError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadFile(file, `community/${Date.now()}_${file.name}`);
      setImageUrl(url);
    } catch {
      setFormError('Failed to upload image. You can also paste an image URL.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    if (!title.trim() || !content.trim()) {
      setFormError('Title and post content are required.');
      return;
    }
    if (imageUrl.trim() && !isSafeUrl(imageUrl.trim())) {
      setFormError('Please enter a valid http(s) image URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      const safeImage = imageUrl.trim() ? sanitizeUrl(imageUrl.trim()) : undefined;
      if (editingPost) {
        const updated = await updatePost(editingPost.id, {
          title: title.trim(),
          content: content.trim(),
          category,
          imageUrl: safeImage,
        });
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await createPost({
          author: currentUser,
          title: title.trim(),
          content: content.trim(),
          category,
          imageUrl: safeImage,
        });
        setPosts((prev) => [created, ...prev]);
      }
      setIsComposerOpen(false);
    } catch (err) {
      console.error('Failed to save post:', err);
      setFormError('Unable to save post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (post: CommunityPost) => {
    if (!currentUser) return;
    try {
      const result = await togglePostLike(post, currentUser);
      setLikedPostIds((prev) =>
        result.liked ? [...prev, post.id] : prev.filter((id) => id !== post.id)
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likesCount: result.likesCount } : p))
      );
    } catch (e) {
      console.error('Like failed:', e);
    }
  };

  const handleOpenComments = async (post: CommunityPost) => {
    setActivePost(post);
    setReplyTo(null);
    setCommentText('');
    setLoadingComments(true);
    try {
      const list = await getComments(post.id);
      setComments(list);
    } catch (e) {
      console.error('Failed to load comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activePost || !commentText.trim()) return;

    try {
      const created = await addComment({
        post: activePost,
        author: currentUser,
        content: commentText.trim(),
        parentCommentId: replyTo ? replyTo.id : null,
      });
      setComments((prev) => [...prev, created]);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activePost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );
      setActivePost((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
      );
      setCommentText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activePost) return;
    await deleteComment(activePost.id, commentId);
    const remaining = comments.filter(
      (c) => c.id !== commentId && c.parentCommentId !== commentId
    );
    setComments(remaining);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === activePost.id ? { ...p, commentsCount: remaining.length } : p
      )
    );
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    await deletePost(postToDelete.id);
    setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
    setPostToDelete(null);
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus community feed..." />;
  }

  const filtered = posts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      (p.authorDepartment || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const visiblePosts = filtered.slice(0, visibleCount);
  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Student Community</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Discuss coursework, ask programming questions, share campus life, and connect with peers
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search discussions, programming help, or student authors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-[#111C32] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-[#111C32] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Feed */}
      {visiblePosts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No discussions found"
          description="Start a conversation or try another category filter."
          action={{ label: 'Write First Post', onClick: openCreateModal }}
        />
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const isLiked = likedPostIds.includes(post.id);
            const isOwner = currentUser?.uid === post.authorId;
            const isAdmin = currentUser?.role === 'admin';

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-[#111C32] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                {/* Author Header */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/students/${post.authorId}`}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={sanitizeUrl(
                        post.authorAvatar,
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          post.authorName
                        )}`
                      )}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.authorName}
                        </span>
                        {post.authorRole === 'admin' && (
                          <Badge variant="purple" size="sm">
                            <ShieldCheck className="w-3 h-3 mr-0.5 inline" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span>{post.authorDepartment || 'Campus Member'}</span>
                        <span>&bull;</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="primary" size="sm">
                      {post.category}
                    </Badge>
                    {isOwner && (
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit post"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => setPostToDelete(post)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {!isOwner && (
                      <button
                        onClick={() =>
                          setReportTarget({
                            type: 'post',
                            id: post.id,
                            title: post.title,
                            ownerId: post.authorId,
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title="Report post"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-2.5">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                  {post.imageUrl && isSafeUrl(post.imageUrl) && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800 max-h-96 bg-slate-100 dark:bg-slate-900">
                      <img
                        src={sanitizeUrl(post.imageUrl)}
                        alt={post.title}
                        className="w-full h-full max-h-96 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        isLiked
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      onClick={() => handleOpenComments(post)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>

                  <Link
                    to={`/students/${post.authorId}`}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Author Profile
                  </Link>
                </div>
              </article>
            );
          })}

          {visibleCount < filtered.length && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors shadow-xs"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Load More Posts ({filtered.length - visibleCount} remaining)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Post Modal */}
      <Modal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        title={editingPost ? 'Edit Community Post' : 'Create Community Post'}
        description="Share insights, ask questions, or start a campus discussion"
        maxWidth="lg"
      >
        <form onSubmit={handlePostSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tips for preparing CSE 301 Dynamic Programming midterm"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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
              Content
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, code snippets, or campus question..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Attach Image (Optional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste https:// image URL"
                className="flex-1 w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {imageUrl && isSafeUrl(imageUrl) && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={sanitizeUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingPost ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Comments & Replies Modal */}
      <Modal
        isOpen={Boolean(activePost)}
        onClose={() => setActivePost(null)}
        title={activePost ? activePost.title : 'Discussion'}
        description={activePost ? `Posted by ${activePost.authorName} in ${activePost.category}` : ''}
        maxWidth="lg"
      >
        {activePost && (
          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {loadingComments ? (
                <LoadingSpinner label="Loading comments..." />
              ) : topLevelComments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No comments yet. Be the first to reply!
                </p>
              ) : (
                topLevelComments.map((cmt) => {
                  const replies = comments.filter((r) => r.parentCommentId === cmt.id);
                  const canDeleteCmt =
                    currentUser?.uid === cmt.authorId || currentUser?.role === 'admin';

                  return (
                    <div key={cmt.id} className="space-y-2">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/students/${cmt.authorId}`}
                            onClick={() => setActivePost(null)}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600"
                          >
                            {cmt.authorName}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                              {new Date(cmt.createdAt).toLocaleDateString()}
                            </span>
                            {canDeleteCmt && (
                              <button
                                onClick={() => handleDeleteComment(cmt.id)}
                                className="text-slate-400 hover:text-rose-600"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {currentUser?.uid !== cmt.authorId && (
                              <button
                                onClick={() =>
                                  setReportTarget({
                                    type: 'comment',
                                    id: cmt.id,
                                    title: cmt.content.slice(0, 60),
                                    ownerId: cmt.authorId,
                                  })
                                }
                                className="text-slate-400 hover:text-amber-600"
                                title="Report comment"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {cmt.content}
                        </p>
                        <button
                          onClick={() => setReplyTo(cmt)}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Reply
                        </button>
                      </div>

                      {replies.length > 0 && (
                        <div className="pl-6 space-y-2">
                          {replies.map((rep) => {
                            const canDeleteRep =
                              currentUser?.uid === rep.authorId || currentUser?.role === 'admin';
                            return (
                              <div
                                key={rep.id}
                                className="p-3 rounded-xl bg-blue-50/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                                    <CornerDownRight className="w-3 h-3 text-blue-500" />
                                    {rep.authorName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(rep.createdAt).toLocaleDateString()}
                                    </span>
                                    {canDeleteRep && (
                                      <button
                                        onClick={() => handleDeleteComment(rep.id)}
                                        className="text-slate-400 hover:text-rose-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                  {rep.content}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {replyTo && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300">
                  <span>Replying to {replyTo.authorName}</span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="font-bold hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyTo ? 'Write your reply...' : 'Add a helpful comment...'}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Delete Post Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDeletePost}
        title="Delete Community Post"
        message="Are you sure you want to permanently remove this post from the student community?"
      />

      {/* Report Modal */}
      {currentUser && reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          currentUser={currentUser}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          targetOwnerId={reportTarget.ownerId}
        />
      )}
    </div>
  );
};
