import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Ban,
  ShieldCheck,
  Flag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from '../../services/messagingService';
import { getAllUsers } from '../../services/adminService';
import {
  getBlockedUsers,
  blockUser,
  unblockUser,
} from '../../services/reportService';
import { Conversation, ChatMessage, UserProfile, BlockedUser } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ReportModal } from '../../components/common/ReportModal';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sanitizeUrl } from '../../utils/url';

export const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selectConversation = async (conv: Conversation) => {
    if (!currentUser) return;
    setActiveConv(conv);
    setSendError(null);
    const msgs = await getConversationMessages(conv.id, 80);
    setMessages(msgs);
    if ((conv.unreadCounts?.[currentUser.uid] || 0) > 0) {
      await markConversationRead(conv, currentUser.uid);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? { ...c, unreadCounts: { ...c.unreadCounts, [currentUser.uid]: 0 } }
            : c
        )
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const [convs, blocked, users] = await Promise.all([
          getUserConversations(currentUser.uid),
          getBlockedUsers(currentUser.uid),
          getAllUsers(),
        ]);
        setConversations(convs);
        setBlockedUsers(blocked);
        setAllUsers(users.filter((u) => u.uid !== currentUser.uid));

        const targetConvId = searchParams.get('conv');
        const targetUid = searchParams.get('to');

        if (targetUid && targetUid !== currentUser.uid) {
          const targetUser = users.find((u) => u.uid === targetUid);
          if (targetUser) {
            const conv = await getOrCreateConversation(currentUser, targetUser);
            const updatedConvs = convs.some((c) => c.id === conv.id) ? convs : [conv, ...convs];
            setConversations(updatedConvs);
            await selectConversation(conv);
            return;
          }
        }

        const matched = targetConvId
          ? convs.find((c) => c.id === targetConvId) || convs[0]
          : convs[0];
        if (matched) {
          await selectConversation(matched);
        }
      } catch (e) {
        console.error('Failed to load messages:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentUser, searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participants.find((id) => id !== currentUser?.uid) || '';
    return {
      uid: otherId,
      name: conv.participantNames?.[otherId] || 'Student',
      avatar: conv.participantAvatars?.[otherId] || '',
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeConv || !draft.trim()) return;
    setSendError(null);

    try {
      setSending(true);
      const sent = await sendMessage(activeConv, currentUser, draft);
      setMessages((prev) => [...prev, sent]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                lastMessage: sent.content.slice(0, 120),
                lastMessageAt: sent.createdAt,
                lastSenderId: currentUser.uid,
              }
            : c
        )
      );
      setDraft('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStartChatWith = async (target: UserProfile) => {
    if (!currentUser) return;
    const conv = await getOrCreateConversation(currentUser, target);
    setConversations((prev) => (prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]));
    setIsNewChatOpen(false);
    await selectConversation(conv);
  };

  const handleToggleBlock = async (otherUid: string, otherName: string) => {
    if (!currentUser) return;
    const isBlocked = blockedUsers.some((b) => b.blockedId === otherUid);
    if (isBlocked) {
      await unblockUser(currentUser.uid, otherUid);
      setBlockedUsers((prev) => prev.filter((b) => b.blockedId !== otherUid));
    } else {
      const entry = await blockUser(currentUser.uid, otherUid, otherName);
      setBlockedUsers((prev) => [...prev, entry]);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus messaging..." />;
  }

  const activeOther = activeConv ? getOtherParticipant(activeConv) : null;
  const isOtherBlocked = Boolean(
    activeOther && blockedUsers.some((b) => b.blockedId === activeOther.uid)
  );

  const filteredUsers = allUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.studentId.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="jstu-page-title">Student Messages</h1>
          <p className="jstu-secondary">
            Private 1-to-1 conversations with classmates, marketplace sellers, and peers.
          </p>
        </div>

        <button
          onClick={() => setIsNewChatOpen(true)}
          className="jstu-btn-primary self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Split Messaging Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
        {/* Conversation List */}
        <div className="lg:col-span-4 jstu-surface overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 tabular-nums">
              Conversations ({conversations.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800">
            {conversations.length === 0 ? (
              <div className="p-8 text-center jstu-secondary">
                No conversations yet. Click &ldquo;New Conversation&rdquo; to message a student.
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const unread = conv.unreadCounts?.[currentUser?.uid || ''] || 0;
                const isSelected = activeConv?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-4 flex items-center gap-3.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/35'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <img
                      src={sanitizeUrl(
                        other.avatar,
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          other.name
                        )}`
                      )}
                      alt={other.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {other.name}
                        </span>
                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold tabular-nums">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="jstu-meta truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Chat Thread */}
        <div className="lg:col-span-8 jstu-surface flex flex-col overflow-hidden">
          {!activeConv || !activeOther ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose an existing chat thread on the left or start a new 1-to-1 message."
                action={{ label: 'Start New Chat', onClick: () => setIsNewChatOpen(true) }}
              />
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <Link
                  to={`/students/${activeOther.uid}`}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <img
                    src={sanitizeUrl(
                      activeOther.avatar,
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        activeOther.name
                      )}`
                    )}
                    alt={activeOther.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                      {activeOther.name}
                    </h4>
                    <p className="jstu-meta truncate">Private Student Chat &middot; View Profile</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleBlock(activeOther.uid, activeOther.name)}
                    className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      isOtherBlocked
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {isOtherBlocked ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Unblock</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        <span>Block</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600"
                    title="Report abuse in conversation"
                    aria-label="Report conversation"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 max-h-[440px]">
                {messages.length === 0 ? (
                  <p className="jstu-secondary text-center py-10">
                    No messages yet. Say hello to start the conversation!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser?.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] space-y-1 ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                          <p
                            className={`text-xs tabular-nums ${
                              isMe ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                {sendError && (
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                    {sendError}
                  </p>
                )}
                {isOtherBlocked ? (
                  <p className="jstu-secondary text-center py-2">
                    You blocked {activeOther.name}. Unblock to resume messaging.
                  </p>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Message ${activeOther.name}...`}
                      className="jstu-input flex-1"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="jstu-btn-primary shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        title="Start a New Conversation"
        description="Search registered students to open a private 1-to-1 chat"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search student name, ID, or department..."
              className="jstu-input pl-11"
            />
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800">
            {filteredUsers.map((u) => (
              <button
                key={u.uid}
                onClick={() => handleStartChatWith(u)}
                className="w-full text-left py-3 px-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={sanitizeUrl(
                      u.avatarUrl,
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        u.fullName
                      )}`
                    )}
                    alt={u.fullName}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {u.fullName}
                    </p>
                    <p className="jstu-meta truncate">
                      {u.department} &middot; {u.studentId}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                  Message
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {currentUser && activeConv && activeOther && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          currentUser={currentUser}
          targetType="message"
          targetId={activeConv.id}
          targetTitle={`Conversation with ${activeOther.name}`}
          targetOwnerId={activeOther.uid}
        />
      )}
    </div>
  );
};
