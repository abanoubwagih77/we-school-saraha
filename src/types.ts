export interface StudentMessage {
  id: string;
  referenceCode: string;
  content: string;
  senderType?: 'student' | 'staff';
  classroom?: string; // A1..A6, B1..B6, C1..C6, or ''
  staffRole?: string; // e.g. مهندس تخصص, معلم مواد, إداري
  category: string;
  urgency: 'عادي' | 'عاجل';
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  adminNotes?: string;
  adminReply?: string;
  adminRepliedAt?: string | null;
  starred?: boolean;
}

export interface TrackedMessage {
  found: boolean;
  referenceCode: string;
  senderType?: 'student' | 'staff';
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  statusLabel: string;
  classroom?: string;
  staffRole?: string;
  category: string;
  urgency: 'عادي' | 'عاجل';
  content: string;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
}

export interface SystemSettings {
  schoolName: string;
  branchName: string;
  schoolSubtitle: string;
  announcement: string;
  staffAnnouncement?: string;
  allowSubmissions: boolean;
  classes: string[];
}

export interface AdminStats {
  total: number;
  unread: number;
  read: number;
  urgent: number;
  inProgress: number;
  resolved: number;
  studentCount?: number;
  staffCount?: number;
  byClass: Record<string, number>;
  byCategory: Record<string, number>;
}
