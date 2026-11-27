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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">Student Community</h1>
          <p className="jstu-secondary">
            Discuss coursework, ask programming questions, share campus life, and connect with peers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="jstu-btn-primary self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search discussions, programming help, or student authors..."
            className="jstu-input pl-11"
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
                className={`min-h-[38px] px-4 py-2 rounded-xl text-sm font-semibold shrink-0 border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
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
        <div className="space-y-5">
          {visiblePosts.map((post) => {
            const isLiked = likedPostIds.includes(post.id);
            const isOwner = currentUser?.uid === post.authorId;
            const isAdmin = currentUser?.role === 'admin';

            return (
              <article key={post.id} className="jstu-surface p-5 sm:p-6 space-y-4">
                {/* Author Header */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/students/${post.authorId}`}
                    className="flex items-center gap-3.5 group min-w-0"
                  >
                    <img
                      src={sanitizeUrl(
                        post.authorAvatar,
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          post.authorName
                        )}`
                      )}
                      alt={post.authorName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {post.authorName}
                        </span>
                        {post.authorRole === 'admin' && (
                          <Badge variant="purple" size="sm">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Admin</span>
                          </Badge>
                        )}
                      </div>
                      <p className="jstu-meta tabular-nums truncate">
                        {post.authorDepartment || 'Campus Member'} &middot;{' '}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="primary" size="sm">
                      {post.category}
                    </Badge>
                    {isOwner && (
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit post"
                        aria-label="Edit post"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => setPostToDelete(post)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete post"
                        aria-label="Delete post"
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
                        className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title="Report post"
                        aria-label="Report post"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3">
                  <h2 className="jstu-section-title">{post.title}</h2>
                  <p className="jstu-body whitespace-pre-line">{post.content}</p>
                  {post.imageUrl && isSafeUrl(post.imageUrl) && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 bg-slate-100 dark:bg-slate-900">
                      <img
                        src={sanitizeUrl(post.imageUrl)}
                        alt={post.title}
                        className="w-full h-full max-h-96 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-2 min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors tabular-nums ${
                        isLiked
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                      <span>{post.likesCount}</span>
                    </button>

                    <button
                      onClick={() => handleOpenComments(post)}
                      className="inline-flex items-center gap-2 min-h-[38px] px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors tabular-nums"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>

                  <Link
                    to={`/students/${post.authorId}`}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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
                className="jstu-btn-secondary tabular-nums"
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
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-sm font-medium text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="jstu-label">Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tips for preparing CSE 301 Dynamic Programming midterm"
              className="jstu-input"
            />
          </div>

          <div>
            <label className="jstu-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CommunityCategory)}
              className="jstu-select font-medium"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="jstu-label">Content</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, code snippets, or campus question..."
              className="jstu-textarea"
            />
          </div>

          <div className="space-y-2">
            <label className="jstu-label">Attach Image (Optional)</label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="jstu-btn-secondary w-full sm:w-auto cursor-pointer shrink-0">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                className="jstu-input flex-1"
              />
            </div>
            {imageUrl && isSafeUrl(imageUrl) && (
              <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={sanitizeUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="jstu-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="jstu-btn-primary"
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
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {loadingComments ? (
                <LoadingSpinner label="Loading comments..." />
              ) : topLevelComments.length === 0 ? (
                <p className="jstu-secondary text-center py-8">
                  No comments yet. Be the first to reply.
                </p>
              ) : (
                topLevelComments.map((cmt) => {
                  const replies = comments.filter((r) => r.parentCommentId === cmt.id);
                  const canDeleteCmt =
                    currentUser?.uid === cmt.authorId || currentUser?.role === 'admin';

                  return (
                    <div key={cmt.id} className="space-y-2.5">
                      <div className="jstu-inset p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/students/${cmt.authorId}`}
                            onClick={() => setActivePost(null)}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {cmt.authorName}
                          </Link>
                          <div className="flex items-center gap-2.5">
                            <span className="jstu-meta tabular-nums">
                              {new Date(cmt.createdAt).toLocaleDateString()}
                            </span>
                            {canDeleteCmt && (
                              <button
                                onClick={() => handleDeleteComment(cmt.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete comment"
                                aria-label="Delete comment"
                              >
                                <Trash2 className="w-4 h-4" />
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
                                className="p-1 text-slate-400 hover:text-amber-600"
                                title="Report comment"
                                aria-label="Report comment"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="jstu-secondary">{cmt.content}</p>
                        <button
                          onClick={() => setReplyTo(cmt)}
                          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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
                                className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
                                    {rep.authorName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="jstu-meta tabular-nums">
                                      {new Date(rep.createdAt).toLocaleDateString()}
                                    </span>
                                    {canDeleteRep && (
                                      <button
                                        onClick={() => handleDeleteComment(rep.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600"
                                        aria-label="Delete reply"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="jstu-secondary">{rep.content}</p>
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

            <form
              onSubmit={handleAddComment}
              className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              {replyTo && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-sm text-blue-700 dark:text-blue-300">
                  <span>Replying to {replyTo.authorName}</span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="font-semibold hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyTo ? 'Write your reply...' : 'Add a helpful comment...'}
                  className="jstu-input flex-1"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="jstu-btn-primary shrink-0"
                >
                  <Send className="w-4 h-4" />
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
