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
      <div className="text-center py-14 space-y-4">
        <h2 className="jstu-section-title">Student Profile Not Found</h2>
        <Link to="/community" className="jstu-btn-primary">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community</span>
        </Link>
      </div>
    );
  }

  const isSelf = currentUser?.uid === profile.uid;

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      <Link
        to="/community"
        className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community</span>
      </Link>

      <div className="jstu-surface p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <img
              src={sanitizeUrl(
                profile.avatarUrl,
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  profile.fullName
                )}`
              )}
              alt={profile.fullName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/20"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="jstu-page-title">
                  {profile.fullName}
                </h1>
                <Badge variant={profile.role === 'admin' ? 'purple' : 'primary'} size="sm">
                  {profile.role === 'admin' ? 'Campus Admin' : 'Student'}
                </Badge>
              </div>
              <p className="text-[15px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{profile.department}</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>
                  <span className="font-mono">{profile.studentId}</span> &middot; {profile.batch}
                </span>
              </p>
            </div>
          </div>

          {!isSelf && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => navigate(`/messages?to=${encodeURIComponent(profile.uid)}`)}
                className="jstu-btn-primary"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </button>

              <button
                onClick={handleToggleBlock}
                className={`jstu-btn-secondary ${
                  isBlocked
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                {isBlocked ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                <span>{isBlocked ? 'Unblock' : 'Block'}</span>
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600"
                title="Report user"
                aria-label="Report user"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="jstu-body pt-5 border-t border-slate-200/80 dark:border-slate-800">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Activity Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="jstu-surface p-6 space-y-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Community Posts ({posts.length})
          </h2>
          {posts.length === 0 ? (
            <p className="text-[15px] text-slate-500 dark:text-slate-400">No community posts yet.</p>
          ) : (
            <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {posts.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to="/community"
                  className="block py-2.5 text-[15px] font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="jstu-surface p-6 space-y-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" /> Marketplace ({marketplace.length})
          </h2>
          {marketplace.length === 0 ? (
            <p className="text-[15px] text-slate-500 dark:text-slate-400">No marketplace listings.</p>
          ) : (
            <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {marketplace.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  to="/marketplace"
                  className="block py-2.5 text-[15px] font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate tabular-nums"
                >
                  {m.title} (${m.price})
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="jstu-surface p-6 space-y-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <BookCopy className="w-4 h-4 text-emerald-600" /> Book Exchange ({books.length})
          </h2>
          {books.length === 0 ? (
            <p className="text-[15px] text-slate-500 dark:text-slate-400">No book listings.</p>
          ) : (
            <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {books.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  to="/books"
                  className="block py-2.5 text-[15px] font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate"
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
