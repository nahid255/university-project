import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Conversation, ChatMessage, UserProfile } from '../types';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES } from '../data/initialDataV2';
import { getBlockedUsers, isUserBlockedBy } from './reportService';

const CONVERSATIONS_KEY = 'campusmate_conversations_v2';
const MESSAGES_KEY = 'campusmate_messages_v2';

const getStoredConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONVERSATIONS;
  }
};

const getStoredMessages = (): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MESSAGES;
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        limit(40)
      );
      const snap = await getDocs(q);
      const list: Conversation[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Conversation));
      return list.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching conversations from Firestore:', e);
    }
  }

  return getStoredConversations()
    .filter((c) => c.participants.includes(userId))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const getOrCreateConversation = async (
  currentUser: UserProfile,
  targetUser: Pick<UserProfile, 'uid' | 'fullName' | 'avatarUrl'>
): Promise<Conversation> => {
  if (currentUser.uid === targetUser.uid) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  const participants = [currentUser.uid, targetUser.uid].sort();
  const deterministicId = `conv_${participants[0]}_${participants[1]}`;

  const existingList = await getUserConversations(currentUser.uid);
  const existing = existingList.find(
    (c) =>
      c.id === deterministicId ||
      (c.participants.includes(currentUser.uid) && c.participants.includes(targetUser.uid))
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const newConv: Conversation = {
    id: deterministicId,
    participants,
    participantNames: {
      [currentUser.uid]: currentUser.fullName,
      [targetUser.uid]: targetUser.fullName,
    },
    participantAvatars: {
      [currentUser.uid]: currentUser.avatarUrl || '',
      [targetUser.uid]: targetUser.avatarUrl || '',
    },
    lastMessage: 'Conversation started',
    lastMessageAt: now,
    lastSenderId: currentUser.uid,
    unreadCounts: {
      [currentUser.uid]: 0,
      [targetUser.uid]: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'conversations', deterministicId), newConv);
    return newConv;
  }

  const all = getStoredConversations();
  all.unshift(newConv);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
  return newConv;
};

export const getConversationMessages = async (
  conversationId: string,
  limitCount: number = 60
): Promise<ChatMessage[]> => {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const list: ChatMessage[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as ChatMessage));
      return list.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (e) {
      console.warn('Error fetching messages from Firestore:', e);
    }
  }

  return getStoredMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-limitCount);
};

export const sendMessage = async (
  conversation: Conversation,
  sender: UserProfile,
  content: string
): Promise<ChatMessage> => {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (!conversation.participants.includes(sender.uid)) {
    throw new Error('Unauthorized: You are not a participant of this conversation.');
  }

  const otherUserId = conversation.participants.find((id) => id !== sender.uid);
  if (otherUserId) {
    const blockedByMe = await getBlockedUsers(sender.uid);
    if (blockedByMe.some((b) => b.blockedId === otherUserId)) {
      throw new Error('You have blocked this student. Unblock them to send messages.');
    }
    const blockedByOther = await isUserBlockedBy(otherUserId, sender.uid);
    if (blockedByOther) {
      throw new Error('You cannot send messages to this recipient.');
    }
  }

  const now = new Date().toISOString();
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const msg: ChatMessage = {
    id,
    conversationId: conversation.id,
    senderId: sender.uid,
    senderName: sender.fullName,
    content: trimmed,
    createdAt: now,
    readBy: [sender.uid],
  };

  const updatedUnread = { ...conversation.unreadCounts };
  if (otherUserId) {
    updatedUnread[otherUserId] = (updatedUnread[otherUserId] || 0) + 1;
  }

  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, 'messages', id), msg);
    await updateDoc(doc(db, 'conversations', conversation.id), {
      lastMessage: trimmed.slice(0, 120),
      lastMessageAt: now,
      lastSenderId: sender.uid,
      unreadCounts: updatedUnread,
      updatedAt: now,
    });
    return msg;
  }

  const msgs = getStoredMessages();
  msgs.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));

  const convs = getStoredConversations();
  const idx = convs.findIndex((c) => c.id === conversation.id);
  if (idx !== -1) {
    convs[idx] = {
      ...convs[idx],
      lastMessage: trimmed.slice(0, 120),
      lastMessageAt: now,
      lastSenderId: sender.uid,
      unreadCounts: updatedUnread,
      updatedAt: now,
    };
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }

  return msg;
};

export const markConversationRead = async (
  conversation: Conversation,
  userId: string
): Promise<void> => {
  if (!conversation.unreadCounts?.[userId]) return;
  const updatedUnread = { ...conversation.unreadCounts, [userId]: 0 };

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        unreadCounts: updatedUnread,
      });
    } catch (e) {
      console.warn('Failed to mark conversation read in Firestore:', e);
    }
    return;
  }

  const convs = getStoredConversations();
  const idx = convs.findIndex((c) => c.id === conversation.id);
  if (idx !== -1) {
    convs[idx] = { ...convs[idx], unreadCounts: updatedUnread };
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }
};
