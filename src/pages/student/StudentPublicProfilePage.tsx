import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Flag,
  Ban,
  ShieldCheck,
  GraduationCap,
  Building,
  Users,
  ShoppingBag,
  BookCopy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers } from '../../services/adminService';
import { getPosts } from '../../services/communityService';
import { getMarketplaceListings, getBookListings } from '../../services/marketplaceService';
import { getBlockedUsers, blockUser, unblockUser } from '../../services/reportService';
import { UserProfile, CommunityPost, MarketplaceListing, BookListing } from '../../types';
import { Badge } from '../../components/common/Badge';
import { ReportModal } from '../../components/common/ReportModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { sanitizeUrl } from '../../utils/url';

export const StudentPublicProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceListing[]>([]);
  const [books, setBooks] = useState<BookListing[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid || !currentUser) return;
      try {
        setLoading(true);
        const [users, allPosts, allMkt, allBooks, blocked] = await Promise.all([
          getAllUsers(),
          getPosts({ limitCount: 60 }),
          getMarketplaceListings(60),
          getBookListings(60),
          getBlockedUsers(currentUser.uid),
        ]);
        const target = users.find((u) => u.uid === uid) || null;
        setProfile(target);
        setPosts(allPosts.filter((p) => p.authorId === uid));
        setMarketplace(allMkt.filter((m) => m.sellerId === uid));
        setBooks(allBooks.filter((b) => b.sellerId === uid));
        setIsBlocked(blocked.some((b) => b.blockedId === uid));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [uid, currentUser]);

  const handleToggleBlock = async () => {
    if (!currentUser || !profile) return;
    if (isBlocked) {
      await unblockUser(currentUser.uid, profile.uid);
      setIsBlocked(false);
    } else {
      await blockUser(currentUser.uid, profile.uid, profile.fullName);
      setIsBlocked(true);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading campus profile..." />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Student Profile Not Found
        </h2>
        <Link
          to="/community"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community</span>
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?.uid === profile.uid;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/community"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community</span>
      </Link>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={sanitizeUrl(
                profile.avatarUrl,
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  profile.fullName
                )}`
              )}
              alt={profile.fullName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-500/15"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {profile.fullName}
                </h1>
                <Badge variant={profile.role === 'admin' ? 'purple' : 'primary'} size="sm">
                  {profile.role === 'admin' ? 'Campus Admin' : 'Student'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Building className="w-3.5 h-3.5" />
                <span>{profile.department}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>
                  {profile.studentId} &bull; {profile.batch}
                </span>
              </p>
            </div>
          </div>

          {!isSelf && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/messages?to=${encodeURIComponent(profile.uid)}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>

              <button
                onClick={handleToggleBlock}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  isBlocked
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isBlocked ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                <span>{isBlocked ? 'Unblock' : 'Block'}</span>
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600"
                title="Report user"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Activity Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" /> Community Posts ({posts.length})
          </h3>
          {posts.length === 0 ? (
            <p className="text-xs text-slate-400">No community posts yet.</p>
          ) : (
            <div className="space-y-2">
              {posts.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to="/community"
                  className="block p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/60 text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-500" /> Marketplace ({marketplace.length})
          </h3>
          {marketplace.length === 0 ? (
            <p className="text-xs text-slate-400">No marketplace listings.</p>
          ) : (
            <div className="space-y-2">
              {marketplace.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  to="/marketplace"
                  className="block p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                >
                  {m.title} (${m.price})
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#111C32] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookCopy className="w-4 h-4 text-emerald-500" /> Book Exchange ({books.length})
          </h3>
          {books.length === 0 ? (
            <p className="text-xs text-slate-400">No book listings.</p>
          ) : (
            <div className="space-y-2">
              {books.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  to="/books"
                  className="block p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                >
                  {b.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {currentUser && !isSelf && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          currentUser={currentUser}
          targetType="user"
          targetId={profile.uid}
          targetTitle={`User: ${profile.fullName}`}
          targetOwnerId={profile.uid}
        />
      )}
    </div>
  );
};
