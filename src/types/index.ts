export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  studentId: string;
  department: string;
  batch: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ClassRoutine {
  id: string;
  courseCode: string;
  courseName: string;
  instructorName: string;
  roomNumber: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00 AM"
  endTime: string;   // "10:30 AM"
  department: string;
  batch?: string;
  color?: string;
}

export interface ExamSchedule {
  id: string;
  courseCode: string;
  courseName: string;
  examDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  roomNumber: string;
  instructor: string;
  examType: 'Midterm' | 'Final' | 'Quiz' | 'Lab Exam';
  department: string;
}

export type AssignmentPriority = 'low' | 'medium' | 'high';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  description: string;
  courseCode: string;
  courseName: string;
  deadline: string; // ISO date-time string
  priority: AssignmentPriority;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export type NoticeCategory =
  | 'Academic'
  | 'Examination'
  | 'Admission'
  | 'Events'
  | 'Scholarships'
  | 'General'
  | 'Emergency';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  publishedAt: string;
  isPinned: boolean;
  status: 'draft' | 'published';
  authorName: string;
  authorId: string;
  department?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export type LostFoundCategory =
  | 'Electronics'
  | 'Documents'
  | 'Books'
  | 'Accessories'
  | 'Bags'
  | 'Clothing'
  | 'Keys'
  | 'Other';

export type LostFoundType = 'lost' | 'found';
export type LostFoundStatus = 'active' | 'claimed' | 'resolved' | 'closed';

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  title: string;
  category: LostFoundCategory;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  isContactPublic: boolean;
  imageUrl?: string;
  status: LostFoundStatus;
  reporterId: string;
  reporterName: string;
  reporterStudentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemReporterId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  proofDetails: string;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export type ResourceCategory =
  | 'Programming'
  | 'Computer Science'
  | 'Mathematics'
  | 'Engineering'
  | 'Physics'
  | 'Chemistry'
  | 'General Study';

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  courseCode: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  downloadsCount: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'academic' | 'notice' | 'lost_found' | 'resource' | 'profile' | 'admin';
}

export interface AdminStats {
  totalStudents: number;
  totalPublishedNotices: number;
  totalAssignments: number;
  totalLostFoundPosts: number;
  totalStudyResources: number;
  pendingClaimRequests: number;
  // V2 extensions
  totalCommunityPosts?: number;
  activeMarketplaceListings?: number;
  activeBookListings?: number;
  upcomingEventsCount?: number;
  totalClubs?: number;
  pendingReportsCount?: number;
}

// ==================== V2.0 DOMAIN TYPES ====================

// 1. Student Community
export type CommunityCategory =
  | 'General Discussion'
  | 'Academic Help'
  | 'Programming'
  | 'University Life'
  | 'Questions'
  | 'Announcements';

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorDepartment?: string;
  authorRole?: UserRole;
  title: string;
  content: string;
  category: CommunityCategory;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  status: 'active' | 'hidden' | 'removed';
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostLike {
  id: string; // `${postId}_${userId}`
  postId: string;
  userId: string;
  createdAt: string;
}

// 2. Marketplace & Book Exchange
export type MarketplaceCategory =
  | 'Books'
  | 'Electronics'
  | 'Calculators'
  | 'Stationery'
  | 'Accessories'
  | 'Furniture'
  | 'Other';

export type ItemCondition = 'Brand New' | 'Like New' | 'Good' | 'Used';
export type ListingStatus = 'Available' | 'Reserved' | 'Sold';

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerDepartment?: string;
  sellerEmail: string;
  sellerPhone?: string;
  isContactPublic: boolean;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition: ItemCondition;
  status: ListingStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookListingType = 'Sale' | 'Exchange';
export type BookListingStatus = 'Available' | 'Reserved' | 'Sold' | 'Exchanged';

export interface BookListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerDepartment?: string;
  sellerEmail: string;
  sellerPhone?: string;
  isContactPublic: boolean;
  title: string;
  author: string;
  isbn?: string;
  subjectDepartment: string;
  listingType: BookListingType;
  price?: number;
  exchangeFor?: string;
  condition: ItemCondition;
  description: string;
  status: BookListingStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Campus Events
export type EventCategory =
  | 'Workshops'
  | 'Seminars'
  | 'Competitions'
  | 'Cultural Events'
  | 'Sports'
  | 'Career Events'
  | 'Other';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  status: EventStatus;
  imageUrl?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled';

export interface EventRegistration {
  id: string; // `${eventId}_${userId}`
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId: string;
  status: RegistrationStatus;
  registeredAt: string;
  updatedAt: string;
}

// 4. Student Clubs
export type ClubCategory =
  | 'Technology'
  | 'Academic'
  | 'Cultural'
  | 'Sports'
  | 'Social Impact'
  | 'Arts & Media'
  | 'Other';

export interface ClubAnnouncement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: ClubCategory;
  logoUrl?: string;
  presidentName: string;
  managerIds: string[];
  activities: string[];
  announcements: ClubAnnouncement[];
  memberCount: number;
  isVerifiedOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MembershipStatus = 'pending' | 'approved' | 'rejected';

export interface ClubMembership {
  id: string; // `${clubId}_${userId}`
  clubId: string;
  clubName: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentId: string;
  department: string;
  reason: string;
  role: 'member' | 'manager';
  status: MembershipStatus;
  requestedAt: string;
  reviewedAt?: string;
}

// 5. Notification Center
export type NotificationType =
  | 'notice'
  | 'assignment'
  | 'comment'
  | 'post_interaction'
  | 'claim_update'
  | 'marketplace_inquiry'
  | 'event_registration'
  | 'club_membership';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

// 6. Student Messaging & Blocking
export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  unreadCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface BlockedUser {
  id: string; // `${blockerId}_${blockedId}`
  blockerId: string;
  blockedId: string;
  blockedName: string;
  createdAt: string;
}

// 7. Content & Abuse Reports
export type ReportTargetType =
  | 'post'
  | 'comment'
  | 'marketplace'
  | 'book'
  | 'message'
  | 'user'
  | 'lost_found';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetOwnerId?: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: ReportStatus;
  actionTaken?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

