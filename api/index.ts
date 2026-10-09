import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';

const app = express();
app.use(express.json());

// Firebase Configuration directly initialized
const firebaseConfig = {
  projectId: "premium-spanner-l14dk",
  appId: "1:428567393559:web:f853ec988cf03ef32eb352",
  apiKey: "AIzaSyB0Z5MvHSy1mNa7fGa73MXAXWSgrTEqfxA",
  authDomain: "premium-spanner-l14dk.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-we-eac55d97-94e6-4152-8fcb-3aedf2e7944d",
  storageBucket: "premium-spanner-l14dk.firebasestorage.app",
  messagingSenderId: "428567393559"
};

let db: Firestore | null = null;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.error('Firebase initialization error in api/index:', err);
}

export interface MessageRecord {
  id: string;
  referenceCode: string;
  content: string;
  senderType: 'student' | 'staff'; // Distinction between student and teacher/engineer
  classroom?: string; // For students: A1..C6
  staffRole?: string; // For staff: مهندس تخصص, معلم مواد, إداري
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

export interface SystemSettings {
  schoolName: string;
  branchName: string;
  schoolSubtitle: string;
  announcement: string;
  staffAnnouncement?: string;
  allowSubmissions: boolean;
  adminUsername: string;
  adminPasswordHash: string;
  secretKey: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  schoolName: 'مدرسة WE للتكنولوجيا التطبيقية',
  branchName: 'فرع طوخ - محافظة القليوبية',
  schoolSubtitle: 'الصندوق السري المباشر لشكاوى ومقترحات ومشاعر الطلاب والزملاء',
  announcement: 'أهلاً بكم في صندوق الصراحة الخاص بمدرستنا. نؤكد لكم أن هذا الصندوق مجهول المصدر 100% ولا يسجل أي بيانات شخصية، والهدف منه الاطمئنان على أبنائنا وحل أي مشكلة تواجههم.',
  staffAnnouncement: 'الزملاء الأعزاء معلمو ومهندسو المدرسة، هذا الصندوق سري ومباشر تماماً للتواصل مع إدارة المدرسة وإبداء أي مقترحات أو شكاوى أو صعوبات في بيئة العمل بحرية تامة.',
  allowSubmissions: true,
  adminUsername: 'admin',
  adminPasswordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
  secretKey: crypto.randomBytes(32).toString('hex')
};

// In-memory fallback
let memoryMessages: MessageRecord[] = [];
let memorySettings: SystemSettings = { ...DEFAULT_SETTINGS };

// Fetch all messages from Firestore
async function getAllMessages(): Promise<MessageRecord[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'messages'));
      const messages: MessageRecord[] = [];
      snap.forEach((d) => {
        messages.push(d.data() as MessageRecord);
      });
      messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      memoryMessages = messages;
      return messages;
    } catch (err) {
      console.error('Firestore getDocs error:', err);
    }
  }
  return memoryMessages;
}

// Save single message to Firestore
async function saveMessage(msg: MessageRecord): Promise<void> {
  if (db) {
    try {
      await setDoc(doc(db, 'messages', msg.id), msg);
    } catch (err) {
      console.error('Firestore setDoc error:', err);
    }
  }
  memoryMessages = memoryMessages.filter((m) => m.id !== msg.id);
  memoryMessages.unshift(msg);
}

// Delete message from Firestore
async function deleteMessageById(id: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error('Firestore deleteDoc error:', err);
    }
  }
  memoryMessages = memoryMessages.filter((m) => m.id !== id);
}

// Load System Settings from Firestore
async function getSettings(): Promise<SystemSettings> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'config'));
      if (snap.exists()) {
        memorySettings = { ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettings;
        return memorySettings;
      } else {
        await setDoc(doc(db, 'settings', 'config'), DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (err) {
      console.error('Firestore getDoc settings error:', err);
    }
  }
  return memorySettings;
}

// Save System Settings to Firestore
async function saveSettings(settings: SystemSettings): Promise<void> {
  if (db) {
    try {
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (err) {
      console.error('Firestore save settings error:', err);
    }
  }
  memorySettings = settings;
}

// Active admin sessions
const activeSessions = new Set<string>();

function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح لك بالدخول، يرجى تسجيل الدخول كإدارة.' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeSessions.has(token)) {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.' });
  }
  next();
}

// ----------------- Public Endpoints -----------------

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'WE School Saraha API' });
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Get Public Settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    res.json({
      schoolName: settings.schoolName,
      branchName: settings.branchName,
      schoolSubtitle: settings.schoolSubtitle,
      announcement: settings.announcement,
      staffAnnouncement: settings.staffAnnouncement || DEFAULT_SETTINGS.staffAnnouncement,
      allowSubmissions: settings.allowSubmissions,
      classes: [
        'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
        'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
        'C1', 'C2', 'C3', 'C4', 'C5', 'C6'
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'فشل جلب الإعدادات' });
  }
});

// 2. Submit Message (Student OR Teacher/Engineer)
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    if (!settings.allowSubmissions) {
      return res.status(403).json({ error: 'صندوق الاستقبال متوقف مؤقتاً بأمر إدارة المدرسة.' });
    }

    const { content, classroom, staffRole, category, urgency, senderType } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 5) {
      return res.status(400).json({ error: 'الرجاء كتابة نص الرسالة (5 أحرف على الأقل).' });
    }

    if (content.trim().length > 3500) {
      return res.status(400).json({ error: 'النص طويل جداً، الحد الأقصى 3500 حرف.' });
    }

    const isStaff = senderType === 'staff';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    let referenceCode = '';
    if (isStaff) {
      referenceCode = `WE-STAFF-${randomSuffix}`;
    } else {
      referenceCode = classroom ? `WE-${classroom}-${randomSuffix}` : `WE-${randomSuffix}`;
    }

    const newMessage: MessageRecord = {
      id: crypto.randomUUID(),
      referenceCode,
      senderType: isStaff ? 'staff' : 'student',
      classroom: isStaff ? '' : (classroom || ''),
      staffRole: isStaff ? (staffRole || 'غير محدد') : '',
      content: content.trim(),
      category: category && typeof category === 'string' ? category.slice(0, 70) : 'عام',
      urgency: urgency === 'عاجل' ? 'عاجل' : 'عادي',
      createdAt: new Date().toISOString(),
      isRead: false,
      readAt: null,
      status: 'new',
      adminNotes: '',
      adminReply: '',
      adminRepliedAt: null,
      starred: false
    };

    await saveMessage(newMessage);

    res.status(201).json({
      success: true,
      messageId: newMessage.id,
      referenceCode: newMessage.referenceCode,
      createdAt: newMessage.createdAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء حفظ الرسالة' });
  }
});

// 3. Track Message
router.get('/messages/track/:code', async (req: Request, res: Response) => {
  try {
    const rawCode = (req.params.code || '').trim();
    if (!rawCode) {
      return res.status(400).json({ error: 'من فضلك أدخل كود المتابعة.' });
    }

    const cleanCode = rawCode.replace(/^[#\s]+|[#\s]+$/g, '').toUpperCase();
    const messages = await getAllMessages();

    const found = messages.find(
      (m) =>
        m.referenceCode.toUpperCase() === cleanCode ||
        m.referenceCode.toUpperCase().replace(/-/g, '') === cleanCode.replace(/-/g, '')
    );

    if (!found) {
      return res.status(404).json({
        error: 'لم يتم العثور على أي رسالة بهذا الكود. يرجى التأكد من كتابة الكود بشكل صحيح.'
      });
    }

    let statusLabel = 'تم استلام الرسالة، وجارٍ توجيهها لإدارة المدرسة';
    if (found.status === 'resolved') {
      statusLabel = 'تم حل الموضوع واتخاذ الإجراء اللازم بنجاح ✅';
    } else if (found.status === 'in_progress') {
      statusLabel = 'تم الاطلاع على الرسالة، وجارٍ العمل والمتابعة ⏳';
    } else if (found.status === 'archived') {
      statusLabel = 'تمت معالجة الموضوع وأرشفته';
    } else if (found.isRead) {
      statusLabel = 'تم فتح الرسالة وقراءتها من قبل إدارة المدرسة 👁️';
    }

    res.json({
      found: true,
      referenceCode: found.referenceCode,
      senderType: found.senderType || 'student',
      createdAt: found.createdAt,
      isRead: found.isRead,
      readAt: found.readAt,
      status: found.status,
      statusLabel,
      classroom: found.classroom || '',
      staffRole: found.staffRole || '',
      category: found.category,
      urgency: found.urgency,
      content: found.content,
      adminReply: found.adminReply || null,
      adminRepliedAt: found.adminRepliedAt || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء البحث' });
  }
});

// ----------------- Admin Auth -----------------

// Admin Login
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const settings = await getSettings();

    const inputPasswordHash = crypto.createHash('sha256').update(password || '').digest('hex');

    if (
      username === settings.adminUsername &&
      inputPasswordHash === settings.adminPasswordHash
    ) {
      const token = crypto.randomBytes(24).toString('hex');
      activeSessions.add(token);
      return res.json({
        success: true,
        token,
        admin: {
          username: settings.adminUsername,
          role: 'إدارة المدرسة'
        }
      });
    }

    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء تسجيل الدخول' });
  }
});

// Admin Logout
router.post('/admin/logout', authenticateAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// Verify Admin Status
router.get('/admin/verify', authenticateAdmin, async (req: Request, res: Response) => {
  const settings = await getSettings();
  res.json({
    authenticated: true,
    admin: {
      username: settings.adminUsername,
      role: 'إدارة مدرسة WE للتكنولوجيا التطبيقية'
    }
  });
});

// ----------------- Admin Message Management -----------------

// Get Messages
router.get('/admin/messages', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await getAllMessages();
    const { classroom, category, status, isRead, urgency, search, senderType } = req.query;

    let filtered = [...messages];

    if (senderType && typeof senderType === 'string' && senderType !== 'all') {
      filtered = filtered.filter((m) => m.senderType === senderType);
    }

    if (classroom && typeof classroom === 'string') {
      if (classroom === 'none') {
        filtered = filtered.filter((m) => !m.classroom && m.senderType === 'student');
      } else {
        filtered = filtered.filter((m) => m.classroom === classroom);
      }
    }

    if (category && typeof category === 'string' && category !== 'all') {
      filtered = filtered.filter((m) => m.category === category);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter((m) => m.status === status);
    }

    if (isRead !== undefined && isRead !== '') {
      const boolVal = isRead === 'true';
      filtered = filtered.filter((m) => m.isRead === boolVal);
    }

    if (urgency && typeof urgency === 'string' && urgency !== 'all') {
      filtered = filtered.filter((m) => m.urgency === urgency);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.content.toLowerCase().includes(s) ||
          m.referenceCode.toLowerCase().includes(s) ||
          (m.adminNotes && m.adminNotes.toLowerCase().includes(s)) ||
          (m.adminReply && m.adminReply.toLowerCase().includes(s))
      );
    }

    res.json({
      messages: filtered,
      total: filtered.length,
      unreadTotal: messages.filter((m) => !m.isRead).length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء جلب الرسائل' });
  }
});

// Mark as read/unread
router.patch('/admin/messages/:id/read', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const messages = await getAllMessages();
    const index = messages.findIndex((m) => m.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'الرسالة غير موجودة.' });
    }

    const shouldBeRead = typeof isRead === 'boolean' ? isRead : true;
    messages[index].isRead = shouldBeRead;
    messages[index].readAt = shouldBeRead ? new Date().toISOString() : null;

    await saveMessage(messages[index]);

    res.json({
      success: true,
      message: messages[index],
      unreadTotal: messages.filter((m) => !m.isRead).length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء التحديث' });
  }
});

// Update status, notes, admin reply, or star
router.patch('/admin/messages/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, adminReply, starred } = req.body;

    const messages = await getAllMessages();
    const index = messages.findIndex((m) => m.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'الرسالة غير موجودة.' });
    }

    if (status && ['new', 'in_progress', 'resolved', 'archived'].includes(status)) {
      messages[index].status = status;
    }

    if (typeof adminNotes === 'string') {
      messages[index].adminNotes = adminNotes;
    }

    if (typeof adminReply === 'string') {
      messages[index].adminReply = adminReply.trim();
      messages[index].adminRepliedAt = adminReply.trim() ? new Date().toISOString() : null;
    }

    if (typeof starred === 'boolean') {
      messages[index].starred = starred;
    }

    await saveMessage(messages[index]);

    res.json({ success: true, message: messages[index] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء التحديث' });
  }
});

// Delete message
router.delete('/admin/messages/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await getAllMessages();
    const existing = messages.find((m) => m.id === id);

    if (!existing) {
      return res.status(404).json({ error: 'الرسالة غير موجودة.' });
    }

    await deleteMessageById(id);
    const remaining = await getAllMessages();
    res.json({ success: true, unreadTotal: remaining.filter((m) => !m.isRead).length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء الحذف' });
  }
});

// Admin Stats
router.get('/admin/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await getAllMessages();

    const total = messages.length;
    const unread = messages.filter((m) => !m.isRead).length;
    const read = total - unread;
    const urgent = messages.filter((m) => m.urgency === 'عاجل').length;
    const inProgress = messages.filter((m) => m.status === 'in_progress').length;
    const resolved = messages.filter((m) => m.status === 'resolved').length;
    const studentCount = messages.filter((m) => m.senderType !== 'staff').length;
    const staffCount = messages.filter((m) => m.senderType === 'staff').length;

    const byClass: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const m of messages) {
      const cls = m.senderType === 'staff' ? 'المعلمون والمهندسون' : (m.classroom || 'بدون تحديد فصل');
      byClass[cls] = (byClass[cls] || 0) + 1;

      const cat = m.category || 'أخرى';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    res.json({
      total,
      unread,
      read,
      urgent,
      inProgress,
      resolved,
      studentCount,
      staffCount,
      byClass,
      byCategory
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء حساب الإحصائيات' });
  }
});

// Update System Settings
router.post('/admin/settings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      schoolName,
      branchName,
      schoolSubtitle,
      announcement,
      staffAnnouncement,
      allowSubmissions,
      newUsername,
      currentPassword,
      newPassword
    } = req.body;

    const settings = await getSettings();

    if (schoolName) settings.schoolName = schoolName;
    if (branchName) settings.branchName = branchName;
    if (schoolSubtitle) settings.schoolSubtitle = schoolSubtitle;
    if (typeof announcement === 'string') settings.announcement = announcement;
    if (typeof staffAnnouncement === 'string') settings.staffAnnouncement = staffAnnouncement;
    if (typeof allowSubmissions === 'boolean') settings.allowSubmissions = allowSubmissions;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'يجب إدخال كلمة المرور الحالية لتغيير كلمة المرور.' });
      }
      const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
      if (currentHash !== settings.adminPasswordHash) {
        return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.' });
      }
      settings.adminPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    }

    if (newUsername && newUsername.trim().length >= 3) {
      settings.adminUsername = newUsername.trim();
    }

    await saveSettings(settings);

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات في السيرفرات السحابية بنجاح.',
      settings: {
        schoolName: settings.schoolName,
        branchName: settings.branchName,
        schoolSubtitle: settings.schoolSubtitle,
        announcement: settings.announcement,
        staffAnnouncement: settings.staffAnnouncement,
        allowSubmissions: settings.allowSubmissions,
        adminUsername: settings.adminUsername
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'خطأ أثناء حفظ الإعدادات' });
  }
});

// Ensure compatibility across environments:
// If a request was rewritten without /api prefix on serverless hosting, prepend /api
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith('/settings') || req.url.startsWith('/messages') || req.url.startsWith('/admin')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Mount router ONLY on /api so root (/) is served by the frontend SPA
app.use('/api', router);

export default app;
