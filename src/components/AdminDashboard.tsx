import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Share2,
  FileSpreadsheet,
  Settings,
  Eye,
  EyeOff,
  Star,
  ChevronRight,
  School,
  Sparkles,
  Inbox,
  Check,
  Building2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { StudentMessage, SystemSettings, AdminStats } from '../types';
import {
  fetchAdminMessages,
  fetchAdminStats,
  updateMessageRead,
  updateMessageStatus
} from '../services/api';
import { MessageDetailModal } from './MessageDetailModal';
import { AdminSettingsModal } from './AdminSettingsModal';

interface AdminDashboardProps {
  settings: SystemSettings | null;
  onRefreshSettings: () => void;
  onOpenStudentView: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  onRefreshSettings,
  onOpenStudentView,
}) => {
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read' | 'in_progress' | 'resolved' | 'urgent' | 'starred'>('all');
  const [senderTypeFilter, setSenderTypeFilter] = useState<'all' | 'student' | 'staff'>('all');
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedMessage, setSelectedMessage] = useState<StudentMessage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Share link copy
  const [copiedLink, setCopiedLink] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let isReadFilter = '';
      let statusFilter = 'all';
      let urgencyFilter = 'all';

      if (activeTab === 'unread') isReadFilter = 'false';
      if (activeTab === 'read') isReadFilter = 'true';
      if (activeTab === 'in_progress') statusFilter = 'in_progress';
      if (activeTab === 'resolved') statusFilter = 'resolved';
      if (activeTab === 'urgent') urgencyFilter = 'عاجل';

      const [msgData, statsData] = await Promise.all([
        fetchAdminMessages({
          senderType: senderTypeFilter !== 'all' ? senderTypeFilter : undefined,
          classroom: classroomFilter !== 'all' ? classroomFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter,
          isRead: isReadFilter,
          urgency: urgencyFilter,
          search: searchQuery,
        }),
        fetchAdminStats(),
      ]);

      let finalMessages = msgData.messages;
      if (activeTab === 'starred') {
        finalMessages = finalMessages.filter((m) => !!m.starred);
      }

      setMessages(finalMessages);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات الرسائل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto refresh every 45 seconds to detect new incoming responses
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, [activeTab, senderTypeFilter, classroomFilter, categoryFilter, searchQuery]);

  // Open message details & mark as read if it was unread
  const handleOpenMessage = async (msg: StudentMessage) => {
    setSelectedMessage(msg);
    setIsDetailModalOpen(true);

    if (!msg.isRead) {
      try {
        const res = await updateMessageRead(msg.id, true);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? res.message : m))
        );
        setSelectedMessage(res.message);
        // refresh stats
        fetchAdminStats().then(setStats).catch(() => {});
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Toggle Read inline
  const handleToggleRead = async (e: React.MouseEvent, msg: StudentMessage) => {
    e.stopPropagation();
    try {
      const res = await updateMessageRead(msg.id, !msg.isRead);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? res.message : m))
      );
      fetchAdminStats().then(setStats).catch(() => {});
    } catch (err) {
      alert('فشل تحديث حالة الرسالة');
    }
  };

  // Toggle Star inline
  const handleToggleStar = async (e: React.MouseEvent, msg: StudentMessage) => {
    e.stopPropagation();
    try {
      const res = await updateMessageStatus(msg.id, { starred: !msg.starred });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? res.message : m))
      );
    } catch (err) {
      alert('فشل تحديث النجمة');
    }
  };

  // Copy shareable link
  const handleCopyShareLink = () => {
    const link = window.location.origin;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (messages.length === 0) {
      alert('لا توجد رسائل لتصديرها حالياً.');
      return;
    }

    const headers = ['الكود المرجعي', 'الفصل', 'التصنيف', 'درجة الأهمية', 'حالة القراءة', 'حالة المتابعة', 'تاريخ الإرسال', 'نص الرسالة', 'رد الإدارة على الطالب', 'ملاحظات الإدارة'];
    const rows = messages.map((m) => [
      `"${m.referenceCode}"`,
      `"${m.classroom || 'غير محدد'}"`,
      `"${m.category || ''}"`,
      `"${m.urgency}"`,
      `"${m.isRead ? 'مقروءة' : 'غير مقروءة'}"`,
      `"${m.status}"`,
      `"${new Date(m.createdAt).toLocaleString('ar-EG')}"`,
      `"${m.content.replace(/"/g, '""')}"`,
      `"${(m.adminReply || '').replace(/"/g, '""')}"`,
      `"${(m.adminNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WE_Toukh_Saraha_Messages_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const unreadTotal = stats?.unread ?? 0;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-100/70 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Alert Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                لوحة إدارة صندوق الصراحة والشكاوى
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {settings?.schoolName || 'مدرسة WE للتكنولوجيا التطبيقية'} — {settings?.branchName || 'فرع طوخ القليوبية'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'تم نسخ الرابط للطلبة!' : 'نسخ رابط الطلاب'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="تصدير الشكاوى إلى ملف Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">تصدير Excel/CSV</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              title="إعدادات النظام وكلمة المرور"
            >
              <Settings className="w-4 h-4 text-purple-700" />
              <span className="hidden sm:inline">الإعدادات</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white shadow-sm transition-colors"
              title="تحديث فوري"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Unread Alert Notification Banner (As requested by the user!) */}
        {unreadTotal > 0 ? (
          <div className="bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 rounded-3xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-bounce">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  تنبيه هام للإدارة: لديك {unreadTotal} رسالة جديدة غير مقروءة!
                </h3>
                <p className="text-xs sm:text-sm text-white/90">
                  قام الطلاب بإرسال رسائل وشكاوى جديدة لم تطلع عليها الإدارة بعد. انقر لعرضها فوراً.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('unread')}
              className="px-4 py-2 rounded-xl bg-white text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-bold shadow-sm transition-all self-stretch sm:self-auto text-center"
            >
              عرض الرسائل غير المقروءة الآن
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 px-5 text-emerald-800 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>رائع! تم الاطلاع على كافة الرسائل الواردة، ولا توجد أي رسائل جديدة معلقة.</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              الصندوق محدث
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 block mb-1">إجمالي الرسائل:</span>
            <div className="text-2xl font-black text-slate-900">{stats?.total ?? 0}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">منذ تدشين الصندوق</span>
          </div>

          <div
            onClick={() => setActiveTab('unread')}
            className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm cursor-pointer hover:border-rose-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 block mb-1">غير مقروءة:</span>
              {(stats?.unread ?? 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-black text-rose-600">{stats?.unread ?? 0}</div>
            <span className="text-[11px] text-rose-500/80 mt-0.5 block">تحتاج للمطالعة</span>
          </div>

          <div
            onClick={() => setActiveTab('in_progress')}
            className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
          >
            <span className="text-xs font-semibold text-amber-600 block mb-1">قيد المتابعة:</span>
            <div className="text-2xl font-black text-amber-600">{stats?.inProgress ?? 0}</div>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block">إجراءات جارية</span>
          </div>

          <div
            onClick={() => setActiveTab('resolved')}
            className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-400 transition-colors"
          >
            <span className="text-xs font-semibold text-emerald-600 block mb-1">تم حل المشكلة:</span>
            <div className="text-2xl font-black text-emerald-600">{stats?.resolved ?? 0}</div>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">انتهت متابعتها</span>
          </div>

          <div
            onClick={() => setActiveTab('urgent')}
            className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm cursor-pointer hover:border-purple-400 transition-colors col-span-2 sm:col-span-1"
          >
            <span className="text-xs font-semibold text-purple-700 block mb-1">رسائل عاجلة:</span>
            <div className="text-2xl font-black text-purple-700">{stats?.urgent ?? 0}</div>
            <span className="text-[11px] text-purple-600/80 mt-0.5 block">أولوية قصوى</span>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
          
          {/* Sender Type Toggle (Students vs Staff vs All) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-full sm:w-max">
            <button
              type="button"
              onClick={() => setSenderTypeFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                senderTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع الوارد ({stats?.total ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setSenderTypeFilter('student')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                senderTypeFilter === 'student'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              🎓 رسائل الطلاب ({stats?.studentCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setSenderTypeFilter('staff')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                senderTypeFilter === 'staff'
                  ? 'bg-indigo-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-900'
              }`}
            >
              👔 رسائل المعلمين والمهندسين ({stats?.staffCount ?? 0})
            </button>
          </div>

          {/* Status Tabs - Fully visible without horizontal scroll on mobile */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 mb-2 sm:hidden">
              تصفية الرسائل حسب الحالة:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { id: 'all', label: 'الكل', count: stats?.total ?? 0 },
                { id: 'unread', label: 'غير مقروءة 🔴', count: stats?.unread ?? 0, highlight: true },
                { id: 'read', label: 'مقروءة', count: stats?.read ?? 0 },
                { id: 'in_progress', label: 'قيد المتابعة ⏳', count: stats?.inProgress ?? 0 },
                { id: 'resolved', label: 'تم الحل ✅', count: stats?.resolved ?? 0 },
                { id: 'urgent', label: 'عاجل ⚠️', count: stats?.urgent ?? 0 },
                { id: 'starred', label: 'المميزة ⭐' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? tab.highlight
                        ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                        : 'bg-purple-900 text-white shadow-sm ring-1 ring-purple-600'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeTab === tab.id
                          ? 'bg-white/25 text-white font-black'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters: Classroom, Category, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في نص الرسالة أو الكود المرجعي..."
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {/* Classroom Filter (18 classes: A1-A6, B1-B6, C1-C6) */}
            <div className="sm:col-span-4">
              <select
                value={classroomFilter}
                onChange={(e) => setClassroomFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:border-purple-600"
              >
                <option value="all">كل الفصول الدراسية (18 فصل)</option>
                <option value="none">بدون تحديد فصل (مجهول)</option>
                <optgroup label="الصف الأول (A)">
                  <option value="A1">فصل A1</option>
                  <option value="A2">فصل A2</option>
                  <option value="A3">فصل A3</option>
                  <option value="A4">فصل A4</option>
                  <option value="A5">فصل A5</option>
                  <option value="A6">فصل A6</option>
                </optgroup>
                <optgroup label="الصف الثاني (B)">
                  <option value="B1">فصل B1</option>
                  <option value="B2">فصل B2</option>
                  <option value="B3">فصل B3</option>
                  <option value="B4">فصل B4</option>
                  <option value="B5">فصل B5</option>
                  <option value="B6">فصل B6</option>
                </optgroup>
                <optgroup label="الصف الثالث (C)">
                  <option value="C1">فصل C1</option>
                  <option value="C2">فصل C2</option>
                  <option value="C3">فصل C3</option>
                  <option value="C4">فصل C4</option>
                  <option value="C5">فصل C5</option>
                  <option value="C6">فصل C6</option>
                </optgroup>
              </select>
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:border-purple-600"
              >
                <option value="all">كل التصنيفات والموضوعات</option>
                <option value="شكوى من معلم أو مادة">شكوى من معلم أو مادة</option>
                <option value="اقتراح لتطوير المدرسة">اقتراح لتطوير المدرسة</option>
                <option value="تنمر أو مشكلة مع زميل">تنمر أو مشكلة مع زميل</option>
                <option value="طلب دعم ومساعدة خاصة">طلب دعم ومساعدة خاصة</option>
                <option value="عام / أخرى">عام / أخرى</option>
              </select>
            </div>

          </div>

        </div>

        {/* Messages List Area */}
        {loading && messages.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-800 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-semibold">جارٍ تحميل الرسائل من الصندوق...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Empty state - Zero static data */
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              الصندوق جاهز وفارغ حالياً
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              لم يتم إرسال أي رسائل بعد، أو لا توجد رسائل تطابق الفلاتر المختارة. شارك رابط الموقع مع طلاب مدرسة WE للتكنولوجيا التطبيقية بطوخ لتلقي الرسائل فوراً.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'تم نسخ رابط الصندوق!' : 'نسخ رابط الموقع للطلاب'}</span>
              </button>

              <button
                onClick={onOpenStudentView}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>تجربة إرسال رسالة تجريبية</span>
              </button>
            </div>
          </div>
        ) : (
          /* Messages Cards List */
          <div className="space-y-3">
            {messages.map((msg) => {
              const isUnread = !msg.isRead;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`group rounded-2xl p-4 sm:p-5 transition-all cursor-pointer border relative ${
                    isUnread
                      ? 'bg-white border-purple-300 ring-2 ring-purple-500/20 shadow-md hover:border-purple-500'
                      : 'bg-white/90 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
                  }`}
                >
                  {/* Indicator strip for unread */}
                  {isUnread && (
                    <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-rose-500 rounded-l-full" />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    
                    {/* Top tags */}
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Read status pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isUnread
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isUnread ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>جديدة لم تُفتح</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-slate-500" />
                            <span>تم الاطلاع عليها</span>
                          </>
                        )}
                      </span>

                      {/* Reference code */}
                      <span className="font-mono text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-lg">
                        {msg.referenceCode}
                      </span>

                      {/* Classroom */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {msg.classroom ? `فصل ${msg.classroom}` : 'بدون ذكر فصل'}
                      </span>

                      {/* Category */}
                      <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg truncate max-w-[170px]">
                        {msg.category || 'عام'}
                      </span>

                      {/* Urgency */}
                      {msg.urgency === 'عاجل' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>عاجل ومهم</span>
                        </span>
                      )}

                      {/* Status */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                          msg.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : msg.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : msg.status === 'archived'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {msg.status === 'in_progress'
                          ? 'قيد المتابعة'
                          : msg.status === 'resolved'
                          ? 'تم حل المشكلة'
                          : msg.status === 'archived'
                          ? 'أرشيف'
                          : 'جديد'}
                      </span>

                      {/* Admin Reply Sent Badge */}
                      {msg.adminReply && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>تم الرد على الطالب 💬</span>
                        </span>
                      )}
                    </div>

                    {/* Right side actions & time */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>

                      <button
                        onClick={(e) => handleToggleStar(e, msg)}
                        className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
                          msg.starred ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={msg.starred ? 'إزالة النجمة' : 'تمييز بنجمة'}
                      >
                        <Star className={`w-4 h-4 ${msg.starred ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => handleToggleRead(e, msg)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title={msg.isRead ? 'تحديد كـ غير مقروءة' : 'تحديد كـ مقروءة'}
                      >
                        {msg.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                      </button>
                    </div>

                  </div>

                  {/* Message Content preview */}
                  <div className="text-slate-800 text-sm sm:text-base leading-relaxed line-clamp-2 select-text group-hover:text-purple-950 font-normal">
                    {msg.content}
                  </div>

                  {/* Admin reply to student preview if present */}
                  {msg.adminReply && (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                      <span className="font-bold text-emerald-900 flex-shrink-0">رد الإدارة للطالب:</span>
                      <span className="truncate">{msg.adminReply}</span>
                    </div>
                  )}

                  {/* Internal admin notes preview if present */}
                  {msg.adminNotes && (
                    <div className="mt-1.5 p-2 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 flex items-center gap-2">
                      <span className="font-bold text-purple-950 flex-shrink-0">ملاحظة سرية:</span>
                      <span className="truncate">{msg.adminNotes}</span>
                    </div>
                  )}

                  {/* Click to view detail hint */}
                  <div className="mt-2 text-right">
                    <span className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-0.5">
                      <span>فتح الرسالة بالكامل واتخاذ إجراء</span>
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Detail Modal */}
      <MessageDetailModal
        message={selectedMessage}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onMessageUpdated={(updated) => {
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          fetchAdminStats().then(setStats).catch(() => {});
        }}
        onMessageDeleted={(id) => {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          fetchAdminStats().then(setStats).catch(() => {});
        }}
      />

      {/* Settings Modal */}
      <AdminSettingsModal
        settings={settings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSaved={(newSet) => {
          onRefreshSettings();
        }}
      />

    </div>
  );
};
