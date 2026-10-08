export interface StudentMessage {
  id: string;
  referenceCode: string;
  content: string;
  classroom: string; // A1..A6, B1..B6, C1..C6, or ''
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
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  statusLabel: string;
  classroom: string;
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
  byClass: Record<string, number>;
  byCategory: Record<string, number>;
}
