import React, { useState } from 'react';
import {
  X,
  Clock,
  Tag,
  AlertTriangle,
  Building,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  Printer,
  Trash2,
  Bookmark,
  Star,
  Check,
  Calendar
} from 'lucide-react';
import { StudentMessage } from '../types';
import { updateMessageRead, updateMessageStatus, deleteMessage } from '../services/api';

interface MessageDetailModalProps {
  message: StudentMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageUpdated: (updated: StudentMessage) => void;
  onMessageDeleted: (id: string) => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  isOpen,
  onClose,
  onMessageUpdated,
  onMessageDeleted,
}) => {
  if (!isOpen || !message) return null;

  const [notes, setNotes] = useState(message.adminNotes || '');
  const [reply, setReply] = useState(message.adminReply || '');
  const [status, setStatus] = useState(message.status);
  const [isStarred, setIsStarred] = useState(!!message.starred);
  const [isRead, setIsRead] = useState(message.isRead);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleToggleRead = async () => {
    const newRead = !isRead;
    setIsRead(newRead);
    try {
      const res = await updateMessageRead(message.id, newRead);
      onMessageUpdated(res.message);
    } catch (err) {
      setIsRead(!newRead);
    }
  };

  const handleToggleStar = async () => {
    const newStar = !isStarred;
    setIsStarred(newStar);
    try {
      const res = await updateMessageStatus(message.id, { starred: newStar });
      onMessageUpdated(res.message);
    } catch {
      setIsStarred(!newStar);
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const res = await updateMessageStatus(message.id, {
        status,
        adminNotes: notes,
        adminReply: reply,
        starred: isStarred,
      });
      onMessageUpdated(res.message);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage(message.id);
      onMessageDeleted(message.id);
      onClose();
    } catch {
      alert('حدث خطأ أثناء حذف الرسالة');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-purple-100 relative my-6 max-h-[92vh] flex flex-col">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-purple-100 text-purple-900 px-3 py-1 rounded-xl">
              {message.referenceCode}
            </span>
            <button
              onClick={handleToggleStar}
              className={`p-1.5 rounded-lg transition-colors ${
                isStarred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'
              }`}
              title={isStarred ? 'إزالة النجمة' : 'تمييز بنجمة'}
            >
              <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
            </button>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                isRead
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              }`}
            >
              {isRead ? 'تمت القراءة' : '🔴 جديدة لم تُفتح'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="طباعة تقرير بالشكوى"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">الفصل الدراسي:</span>
              <span className="font-bold text-slate-800 text-sm">
                {message.classroom ? `فصل ${message.classroom}` : 'غير محدد (مجهول)'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">التصنيف:</span>
              <span className="font-bold text-slate-800 text-xs truncate block" title={message.category}>
                {message.category || 'عام'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">درجة الأهمية:</span>
              <span className={`font-bold text-xs ${message.urgency === 'عاجل' ? 'text-rose-600' : 'text-slate-700'}`}>
                {message.urgency === 'عاجل' ? '⚠️ عاجل ومهم' : '🟢 عادي'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">تاريخ الإرسال:</span>
              <span className="font-semibold text-slate-700 text-[11px] block truncate">
                {formatDate(message.createdAt)}
              </span>
            </div>
          </div>

          {/* Student Content Box */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              نص رسالة الطالب:
            </label>
            <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5 text-slate-900 text-base leading-relaxed whitespace-pre-wrap select-text selection:bg-purple-200">
              {message.content}
            </div>
          </div>

          {/* Admin Management Section */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-purple-700" />
              <span>إجراءات الإدارة والمتابعة</span>
            </h4>

            {/* Status Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'new', label: 'جديد', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                { id: 'in_progress', label: 'قيد المتابعة', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                { id: 'resolved', label: 'تم حل المشكلة', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                { id: 'archived', label: 'أرشيف', color: 'bg-slate-200 text-slate-800 border-slate-300' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    status === st.id
                      ? `${st.color} shadow-sm ring-2 ring-purple-600`
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Read / Unread toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600">حالة فتح الرسالة:</span>
              <button
                type="button"
                onClick={handleToggleRead}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              >
                {isRead ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>تحديد كـ "غير مقروءة" للمراجعة لاحقاً</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تحديد كـ "تمت القراءة"</span>
                  </>
                )}
              </button>
            </div>

            {/* Admin Reply To Student (Public Feedback) */}
            <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="text-base">💬</span>
                  <span>الرد والفيدباك الموجه للطالب (سيظهر له عند البحث بالكود):</span>
                </label>
                {message.adminRepliedAt && (
                  <span className="text-[10px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md font-medium">
                    آخر رد: {new Date(message.adminRepliedAt).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                هذا الرد سيظهر للطالب عندما يدخل كوده المرجعي في خانة البحث بالموقع ليعرف رد الإدارة والإجراء المتخذ.
              </p>

              {/* Quick Reply Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">نماذج ردود سريعة جاهزة (اضغط لاختيارها):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'تم التواصل مع المدرس وحل المشكلة ودياً وتم التنبيه عليه مع الحفاظ التام على خصوصيتك.',
                    'تم فتح الشكوى والاطلاع عليها باهتمام، وجارٍ متابعة الموضوع والتحقيق فيه باهتمام وسرية.',
                    'تم فحص الموضوع واتخاذ الإجراء الفوري اللازم بالمدرسة.',
                    'شكراً لك على هذا المقترح القيم، تم رفعه للإدارة وسنعمل على تنفيذه قريباً.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReply(preset)}
                      className="text-[11px] text-right py-1 px-2.5 rounded-lg bg-white border border-purple-200 text-purple-900 hover:bg-purple-100/70 hover:border-purple-300 transition-colors line-clamp-1 max-w-full"
                    >
                      ⚡ {preset}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="اكتب رد الإدارة على الطالب هنا (مثلاً: تم فتح الرسالة وجارٍ العمل على حلها، أو تم التواصل مع المدرس الفلاني وحل المشكلة ودياً)..."
                className="w-full p-3 rounded-xl border border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 text-xs sm:text-sm bg-white text-slate-900"
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات الإدارة الداخلية والإجراء المتخذ (سرية للإدارة فقط):
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اكتب ما تم بخصوص هذه الشكوى، مثلاً: تم التحدث مع المعلم، تم فحص المعمل، تم استدعاء مشرف الدور..."
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-xs sm:text-sm bg-white"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-bold">تأكيد الحذف؟</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  نعم، احذف
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="حذف الرسالة"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">حذف</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>تم الحفظ!</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
