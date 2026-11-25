import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  increment,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  CommunityPost,
  PostComment,
  PostLike,
  CommunityCategory,
  UserProfile,
} from '../types';
import { INITIAL_POSTS, INITIAL_COMMENTS, INITIAL_POST_LIKES } from '../data/initialDataV2';
import { createNotification } from './notificationService';

const POSTS_KEY = 'campusmate_posts_v2';
const COMMENTS_KEY = 'campusmate_comments_v2';
const LIKES_KEY = 'campusmate_post_likes_v2';

const getStoredPosts = (): CommunityPost[] => {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_POSTS;
  }
};

const getStoredComments = (): PostComment[] => {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (!raw) {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(INITIAL_COMMENTS));
      return INITIAL_COMMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMMENTS;
  }
};

const getStoredLikes = (): PostLike[] => {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    if (!raw) {
      localStorage.setItem(LIKES_KEY, JSON.stringify(INITIAL_POST_LIKES));
      return INITIAL_POST_LIKES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_POST_LIKES;
  }
};

export const getPosts = async (options?: {
  includeHidden?: boolean;
  limitCount?: number;
}): Promise<CommunityPost[]> => {
  const limitCount = options?.limitCount || 50;
  const includeHidden = options?.includeHidden || false;

  if (isFirebaseConfigured() && db) {
    try {
      const q = includeHidden
        ? query(collection(db, 'posts'), limit(limitCount))
        : query(collection(db, 'posts'), where('status', '==', 'active'), limit(limitCount));
      const snap = await getDocs(q);
      const list: CommunityPost[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as CommunityPost));
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching community posts from Firestore:', e);
    }
  }

  const all = getStoredPosts();
  return all
    .filter((p) => (includeHidden ? p.status !== 'removed' : p.status === 'active'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
};

export const createPost = async (params: {
  author: UserProfile;
  title: string;
  content: string;
  category: CommunityCategory;
  imageUrl?: string;
}): Promise<CommunityPost> => {
  const now = new Date().toISOString();
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newPost: CommunityPost = {
    id,
    authorId: params.author.uid,
    authorName: params.author.fullName,
    authorAvatar: params.author.avatarUrl,
    authorDepartment: params.author.department,
    authorRole: params.author.role,
    title: params.title.trim(),
    content: params.content.trim(),
    category: params.category,
    imageUrl: params.imageUrl?.trim() || undefined,
    likesCount: 0,
    commentsCount: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'posts', id), newPost);
    return newPost;
  }

  const all = getStoredPosts();
  all.unshift(newPost);
  localStorage.setItem(POSTS_KEY, JSON.stringify(all));
  return newPost;
};

export const updatePost = async (
  postId: string,
  updates: Partial<Pick<CommunityPost, 'title' | 'content' | 'category' | 'imageUrl' | 'status'>>
): Promise<CommunityPost> => {
  const now = new Date().toISOString();
  if (isFirebaseConfigured() && db) {
    await updateDoc(doc(db, 'posts', postId), {
      ...updates,
      updatedAt: now,
    } as Record<string, unknown>);
    const all = await getPosts({ includeHidden: true });
    const found = all.find((p) => p.id === postId);
    if (found) return found;
  }

  const all = getStoredPosts();
  const idx = all.findIndex((p) => p.id === postId);
  if (idx === -1) throw new Error('Post not found.');

  all[idx] = { ...all[idx], ...updates, updatedAt: now };
  localStorage.setItem(POSTS_KEY, JSON.stringify(all));
  return all[idx];
};

export const deletePost = async (postId: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'posts', postId));
    return;
  }

  const all = getStoredPosts().filter((p) => p.id !== postId);
  localStorage.setItem(POSTS_KEY, JSON.stringify(all));
};

// Comments & Replies
export const getComments = async (postId: string): Promise<PostComment[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'comments'), where('postId', '==', postId), limit(100));
      const snap = await getDocs(q);
      const list: PostComment[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as PostComment));
      return list.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching comments from Firestore:', e);
    }
  }

  return getStoredComments()
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const addComment = async (params: {
  post: CommunityPost;
  author: UserProfile;
  content: string;
  parentCommentId?: string | null;
}): Promise<PostComment> => {
  const now = new Date().toISOString();
  const id = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newComment: PostComment = {
    id,
    postId: params.post.id,
    parentCommentId: params.parentCommentId || null,
    authorId: params.author.uid,
    authorName: params.author.fullName,
    authorAvatar: params.author.avatarUrl,
    content: params.content.trim(),
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'comments', id), newComment);
    await updateDoc(doc(db, 'posts', params.post.id), {
      commentsCount: increment(1),
    });
  } else {
    const comments = getStoredComments();
    comments.push(newComment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));

    const posts = getStoredPosts();
    const idx = posts.findIndex((p) => p.id === params.post.id);
    if (idx !== -1) {
      posts[idx].commentsCount = (posts[idx].commentsCount || 0) + 1;
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    }
  }

  // Notify post author if commenter is someone else
  if (params.post.authorId !== params.author.uid) {
    await createNotification({
      userId: params.post.authorId,
      type: 'comment',
      title: params.parentCommentId ? 'New Reply in Discussion' : 'New Comment on Your Post',
      message: `${params.author.fullName} commented on "${params.post.title}"`,
      link: '/community',
    });
  }

  return newComment;
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  if (isFirebaseConfigured() && db) {
    await deleteDoc(doc(db, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), {
      commentsCount: increment(-1),
    });
    return;
  }

  const comments = getStoredComments().filter(
    (c) => c.id !== commentId && c.parentCommentId !== commentId
  );
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));

  const posts = getStoredPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx !== -1) {
    posts[idx].commentsCount = Math.max(
      0,
      comments.filter((c) => c.postId === postId).length
    );
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
};

// Likes
export const getUserLikedPostIds = async (userId: string): Promise<string[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'postLikes'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const ids: string[] = [];
      snap.forEach((d) => {
        const data = d.data() as PostLike;
        if (data.postId) ids.push(data.postId);
      });
      return ids;
    } catch (e) {
      console.warn('Error fetching user likes from Firestore:', e);
    }
  }

  return getStoredLikes()
    .filter((l) => l.userId === userId)
    .map((l) => l.postId);
};

export const togglePostLike = async (
  post: CommunityPost,
  user: UserProfile
): Promise<{ liked: boolean; likesCount: number }> => {
  const likeId = `${post.id}_${user.uid}`;
  const likedIds = await getUserLikedPostIds(user.uid);
  const alreadyLiked = likedIds.includes(post.id);

  if (isFirebaseConfigured() && db) {
    if (alreadyLiked) {
      await deleteDoc(doc(db, 'postLikes', likeId));
      await updateDoc(doc(db, 'posts', post.id), { likesCount: increment(-1) });
      return { liked: false, likesCount: Math.max(0, post.likesCount - 1) };
    } else {
      const likeDoc: PostLike = {
        id: likeId,
        postId: post.id,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'postLikes', likeId), likeDoc);
      await updateDoc(doc(db, 'posts', post.id), { likesCount: increment(1) });

      if (post.authorId !== user.uid) {
        await createNotification({
          userId: post.authorId,
          type: 'post_interaction',
          title: 'Post Liked',
          message: `${user.fullName} liked your post "${post.title}"`,
          link: '/community',
        });
      }
      return { liked: true, likesCount: post.likesCount + 1 };
    }
  }

  let likes = getStoredLikes();
  const posts = getStoredPosts();
  const pIdx = posts.findIndex((p) => p.id === post.id);
  let newCount = post.likesCount;

  if (alreadyLiked) {
    likes = likes.filter((l) => l.id !== likeId);
    newCount = Math.max(0, post.likesCount - 1);
  } else {
    likes.push({
      id: likeId,
      postId: post.id,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
    newCount = post.likesCount + 1;

    if (post.authorId !== user.uid) {
      await createNotification({
        userId: post.authorId,
        type: 'post_interaction',
        title: 'Post Liked',
        message: `${user.fullName} liked your post "${post.title}"`,
        link: '/community',
      });
    }
  }

  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  if (pIdx !== -1) {
    posts[pIdx].likesCount = newCount;
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }

  return { liked: !alreadyLiked, likesCount: newCount };
};
