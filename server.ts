import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

app.use(express.json());

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------- Firebase Initialization -----------------
let db: Firestore | null = null;
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log('Firebase Firestore initialized successfully with database:', firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error('Error connecting to Firebase Firestore:', err);
  }
}

export interface StudentMessage {
  id: string;
  referenceCode: string; // e.g. WE-A1-4829 or WE-7291
  content: string;
  classroom: string; // A1..A6, B1..B6, C1..C6, or ''
  category: string;
  urgency: 'عادي' | 'عاجل';
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  adminNotes?: string;
  adminReply?: string; // رد الإدارة الموجه للطالب
  adminRepliedAt?: string | null;
  starred?: boolean;
}

export interface SystemSettings {
  schoolName: string;
  branchName: string;
  schoolSubtitle: string;
  announcement: string;
  allowSubmissions: boolean;
  adminUsername: string;
  adminPasswordHash: string; // sha256
  secretKey: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  schoolName: 'مدرسة WE للتكنولوجيا التطبيقية',
  branchName: 'فرع طوخ - محافظة القليوبية',
  schoolSubtitle: 'الصندوق السري المباشر لشكاوى ومقترحات ومشاعر الطلاب (صراحة المدرسة)',
  announcement: 'أهلاً بكم في صندوق الصراحة الخاص بمدرستنا. نؤكد لكم أن هذا الصندوق مجهول المصدر 100% ولا يسجل أي بيانات شخصية، والهدف منه الاطمئنان على أبنائنا الطلاب وحل أي مشكلة تواجههم.',
  allowSubmissions: true,
  adminUsername: 'admin',
  adminPasswordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
  secretKey: crypto.randomBytes(32).toString('hex')
};

// ----------------- Data Layer (Cloud Firestore + Local Mirror) -----------------

function readLocalMessages(): StudentMessage[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) return [];
    return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeLocalMessages(msgs: StudentMessage[]): void {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error caching messages locally:', e);
  }
}

function readLocalSettings(): SystemSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeLocalSettings(settings: SystemSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error caching settings locally:', e);
  }
}

// Fetch all messages from Firestore Cloud Database
async function getAllMessages(): Promise<StudentMessage[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'messages'));
      const messages: StudentMessage[] = [];
      snap.forEach((d) => {
        messages.push(d.data() as StudentMessage);
      });
      // Sort newest first
      messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      writeLocalMessages(messages);
      return messages;
    } catch (err) {
      console.error('Firestore getDocs error, falling back to local mirror:', err);
    }
  }
  return readLocalMessages();
}

// Save single message to Firestore Cloud Database
async function saveMessage(msg: StudentMessage): Promise<void> {
  if (db) {
    try {
      await setDoc(doc(db, 'messages', msg.id), msg);
    } catch (err) {
      console.error('Firestore setDoc message error:', err);
    }
  }
  const local = readLocalMessages().filter((m) => m.id !== msg.id);
  local.unshift(msg);
  writeLocalMessages(local);
}

// Delete message from Firestore Cloud Database
async function deleteMessageById(id: string): Promise<void> {
  if (db) {
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (err) {
      console.error('Firestore deleteDoc message error:', err);
    }
  }
  const local = readLocalMessages().filter((m) => m.id !== id);
  writeLocalMessages(local);
}

// Load System Settings from Firestore Cloud Database
async function getSettings(): Promise<SystemSettings> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'config'));
      if (snap.exists()) {
        const cloudSettings = { ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettings;
        writeLocalSettings(cloudSettings);
        return cloudSettings;
      } else {
        // Initialize Firestore with default settings
        const initial = readLocalSettings();
        await setDoc(doc(db, 'settings', 'config'), initial);
        return initial;
      }
    } catch (err) {
      console.error('Firestore getDoc settings error, falling back to local mirror:', err);
    }
  }
  return readLocalSettings();
}

// Save System Settings to Firestore Cloud Database
async function saveSettings(settings: SystemSettings): Promise<void> {
  if (db) {
    try {
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (err) {
      console.error('Firestore save settings error:', err);
    }
  }
  writeLocalSettings(settings);
}

// Initial Sync from Local to Firestore (Migrate existing data to Cloud)
async function syncLocalToFirestore() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'messages'));
    if (snap.empty) {
      const localMsgs = readLocalMessages();
      for (const m of localMsgs) {
        await setDoc(doc(db, 'messages', m.id), m);
      }
      if (localMsgs.length > 0) {
        console.log(`Migrated ${localMsgs.length} local messages to Cloud Firestore.`);
      }
    }
  } catch (err) {
    console.error('Initial migration error:', err);
  }
}
syncLocalToFirestore();

// Simple token auth helper
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

// ----------------- Public APIs -----------------

// 1. Get Public School Settings and Announcement
app.get('/api/settings', async (req: Request, res: Response) => {
  const settings = await getSettings();
  res.json({
    schoolName: settings.schoolName,
    branchName: settings.branchName,
    schoolSubtitle: settings.schoolSubtitle,
    announcement: settings.announcement,
    allowSubmissions: settings.allowSubmissions,
    classes: [
      'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
      'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
      'C1', 'C2', 'C3', 'C4', 'C5', 'C6'
    ]
  });
});

// 2. Submit a student message (Completely Anonymous -> Cloud Firestore)
app.post('/api/messages', async (req: Request, res: Response) => {
  const settings = await getSettings();
  if (!settings.allowSubmissions) {
    return res.status(403).json({ error: 'صندوق الاستقبال متوقف مؤقتاً بأمر إدارة المدرسة.' });
  }

  const { content, classroom, category, urgency } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    return res.status(400).json({ error: 'الرجاء كتابة نص الرسالة (5 أحرف على الأقل).' });
  }

  if (content.trim().length > 3000) {
    return res.status(400).json({ error: 'النص طويل جداً، الحد الأقصى 3000 حرف.' });
  }

  const validClasses = [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
    'C1', 'C2', 'C3', 'C4', 'C5', 'C6'
  ];

  const selectedClass = validClasses.includes(classroom) ? classroom : '';
  const selectedCategory = category && typeof category === 'string' ? category.slice(0, 50) : 'عام / أخرى';
  const selectedUrgency = urgency === 'عاجل' ? 'عاجل' : 'عادي';

  // Generate Reference Code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referenceCode = selectedClass ? `WE-${selectedClass}-${randomSuffix}` : `WE-${randomSuffix}`;

  const newMessage: StudentMessage = {
    id: crypto.randomUUID(),
    referenceCode,
    content: content.trim(),
    classroom: selectedClass,
    category: selectedCategory,
    urgency: selectedUrgency,
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
});

// 3. Track a message using Reference Code (Public for Students from Cloud Firestore)
app.get('/api/messages/track/:code', async (req: Request, res: Response) => {
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
      error: 'لم يتم العثور على أي رسالة بهذا الكود. يرجى التأكد من كتابة الكود بشكل صحيح (مثال: WE-B1-4821).'
    });
  }

  let statusLabel = 'تم استلام الرسالة، وجارٍ توجيهها لإدارة المدرسة';
  if (found.status === 'resolved') {
    statusLabel = 'تم حل المشكلة واتخاذ الإجراء اللازم بنجاح ✅';
  } else if (found.status === 'in_progress') {
    statusLabel = 'تم الاطلاع على الرسالة، وجارٍ العمل والمتابعة لحلها ⏳';
  } else if (found.status === 'archived') {
    statusLabel = 'تمت معالجة الموضوع وأرشفته';
  } else if (found.isRead) {
    statusLabel = 'تم فتح الرسالة وقراءتها من قبل إدارة المدرسة 👁️';
  }

  res.json({
    found: true,
    referenceCode: found.referenceCode,
    createdAt: found.createdAt,
    isRead: found.isRead,
    readAt: found.readAt,
    status: found.status,
    statusLabel,
    classroom: found.classroom,
    category: found.category,
    urgency: found.urgency,
    content: found.content,
    adminReply: found.adminReply || null,
    adminRepliedAt: found.adminRepliedAt || null
  });
});

// ----------------- Admin Auth -----------------

// Admin Login
app.post('/api/admin/login', async (req: Request, res: Response) => {
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
});

// Admin Logout
app.post('/api/admin/logout', authenticateAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// Check Admin Status
app.get('/api/admin/verify', authenticateAdmin, async (req: Request, res: Response) => {
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

// Get Messages (from Cloud Firestore)
app.get('/api/admin/messages', authenticateAdmin, async (req: Request, res: Response) => {
  const messages = await getAllMessages();
  const { classroom, category, status, isRead, urgency, search } = req.query;

  let filtered = [...messages];

  if (classroom && typeof classroom === 'string') {
    if (classroom === 'none') {
      filtered = filtered.filter((m) => !m.classroom);
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
});

// Mark message as read / unread (sync to Cloud Firestore)
app.patch('/api/admin/messages/:id/read', authenticateAdmin, async (req: Request, res: Response) => {
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
});

// Update message status, admin notes, adminReply, or starred (sync to Cloud Firestore)
app.patch('/api/admin/messages/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
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
});

// Delete message (from Cloud Firestore)
app.delete('/api/admin/messages/:id', authenticateAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const messages = await getAllMessages();
  const existing = messages.find((m) => m.id === id);

  if (!existing) {
    return res.status(404).json({ error: 'الرسالة غير موجودة.' });
  }

  await deleteMessageById(id);
  const remaining = await getAllMessages();
  res.json({ success: true, unreadTotal: remaining.filter((m) => !m.isRead).length });
});

// Admin Statistics & Analytics
app.get('/api/admin/stats', authenticateAdmin, async (req: Request, res: Response) => {
  const messages = await getAllMessages();

  const total = messages.length;
  const unread = messages.filter((m) => !m.isRead).length;
  const read = total - unread;
  const urgent = messages.filter((m) => m.urgency === 'عاجل').length;
  const inProgress = messages.filter((m) => m.status === 'in_progress').length;
  const resolved = messages.filter((m) => m.status === 'resolved').length;

  const byClass: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const m of messages) {
    const cls = m.classroom || 'بدون تحديد فصل';
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
    byClass,
    byCategory
  });
});

// Update System Settings / Password (sync to Cloud Firestore)
app.post('/api/admin/settings', authenticateAdmin, async (req: Request, res: Response) => {
  const {
    schoolName,
    branchName,
    schoolSubtitle,
    announcement,
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
      allowSubmissions: settings.allowSubmissions,
      adminUsername: settings.adminUsername
    }
  });
});

// ----------------- Vite Integration & Server Startup -----------------

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} with Cloud Firestore persistence enabled`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
