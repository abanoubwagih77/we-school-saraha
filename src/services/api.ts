import { StudentMessage, SystemSettings, AdminStats, TrackedMessage } from '../types';

const API_BASE = '/api';

// Admin token handling in localStorage
const TOKEN_KEY = 'we_school_admin_token';

async function parseJsonSafe(res: Response, defaultErrorMessage = 'حدث خطأ أثناء معالجة الطلب'): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('الرابط غير موجود (404) - يرجى التأكد من تشغيل الخادم بشكل صحيح');
      }
      if (res.status >= 500) {
        throw new Error('حدث خطأ في الخادم (500) - يرجى المحاولة مرة أخرى أو مراجعة الاتصال');
      }
      throw new Error(`خطأ في استجابة الخادم (${res.status})`);
    }
    throw new Error('استجابة غير صالحة من السيرفر');
  }

  if (!res.ok) {
    if (res.status === 401) {
      removeAdminToken();
    }
    throw new Error(data?.error || defaultErrorMessage);
  }

  return data;
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// 1. Get Public Settings
export async function fetchSettings(): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  return parseJsonSafe(res, 'فشل جلب إعدادات المدرسة');
}

// 2. Submit Message from Student
export async function submitStudentMessage(data: {
  content: string;
  classroom?: string;
  category?: string;
  urgency?: 'عادي' | 'عاجل';
}): Promise<{
  success: boolean;
  messageId: string;
  referenceCode: string;
  createdAt: string;
}> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return parseJsonSafe(res, 'حدث خطأ أثناء إرسال الرسالة');
}

// 3. Track a message using Reference Code (Student Feedback Search)
export async function trackStudentMessage(code: string): Promise<TrackedMessage> {
  const encoded = encodeURIComponent(code.trim());
  const res = await fetch(`${API_BASE}/messages/track/${encoded}`);
  return parseJsonSafe(res, 'لم يتم العثور على الرسالة بهذا الكود');
}

// 3. Admin Login
export async function adminLogin(
  username: string,
  password: string
): Promise<{ token: string; admin: { username: string; role: string } }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const body = await parseJsonSafe(res, 'بيانات الدخول غير صحيحة');
  setAdminToken(body.token);
  return body;
}

// 4. Verify Admin Token
export async function verifyAdmin(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 5. Admin Logout
export async function adminLogout(): Promise<void> {
  const token = getAdminToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  }
  removeAdminToken();
}

// 6. Fetch Admin Messages with filters
export async function fetchAdminMessages(filters?: {
  classroom?: string;
  category?: string;
  status?: string;
  isRead?: string;
  urgency?: string;
  search?: string;
  senderType?: string;
}): Promise<{ messages: StudentMessage[]; total: number; unreadTotal: number }> {
  const token = getAdminToken();
  if (!token) throw new Error('غير مصرح');

  const params = new URLSearchParams();
  if (filters?.senderType && filters.senderType !== 'all') params.append('senderType', filters.senderType);
  if (filters?.classroom) params.append('classroom', filters.classroom);
  if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.isRead !== undefined && filters.isRead !== '') params.append('isRead', filters.isRead);
  if (filters?.urgency && filters.urgency !== 'all') params.append('urgency', filters.urgency);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/admin/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseJsonSafe(res, 'فشل جلب الرسائل');
}

// 7. Toggle Message Read Status
export async function updateMessageRead(
  id: string,
  isRead: boolean
): Promise<{ success: boolean; message: StudentMessage; unreadTotal: number }> {
  const token = getAdminToken();
  if (!token) throw new Error('غير مصرح');

  const res = await fetch(`${API_BASE}/admin/messages/${id}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isRead }),
  });

  return parseJsonSafe(res, 'فشل تحديث حالة القراءة');
}

// 8. Update Message Status / Notes / Admin Reply / Star
export async function updateMessageStatus(
  id: string,
  payload: {
    status?: 'new' | 'in_progress' | 'resolved' | 'archived';
    adminNotes?: string;
    adminReply?: string;
    starred?: boolean;
  }
): Promise<{ success: boolean; message: StudentMessage }> {
  const token = getAdminToken();
  if (!token) throw new Error('غير مصرح');

  const res = await fetch(`${API_BASE}/admin/messages/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseJsonSafe(res, 'فشل تحديث تفاصيل الرسالة');
}

// 9. Delete Message
export async function deleteMessage(id: string): Promise<{ success: boolean; unreadTotal: number }> {
  const token = getAdminToken();
  if (!token) throw new Error('غير مصرح');

  const res = await fetch(`${API_BASE}/admin/messages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseJsonSafe(res, 'فشل حذف الرسالة');
}

// 10. Fetch Admin Stats
export async function fetchAdminStats(): Promise<AdminStats> {
  const token = getAdminToken();
  if (!token) throw new Error('غير مصرح');

  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseJsonSafe(res, 'فشل جلب الإحصائيات');
}

// 11. Update Admin Settings
export async function updateAdminSettings(payload: {
  schoolName?: string;
  branchName?: string;
  schoolSubtitle?: string;
  announcement?: string;
  allowSubmissions?: boolean;
  newUsername?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<any> {
  const token = getAdminToken();
  if (!token) throw new Error('غير مصرح');

  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseJsonSafe(res, 'فشل تحديث الإعدادات');
}
