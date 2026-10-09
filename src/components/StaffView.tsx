import React, { useState } from 'react';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  HelpCircle,
  Clock,
  Briefcase,
  Search,
  MessageSquare,
  ChevronDown,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { SystemSettings, TrackedMessage } from '../types';
import { submitStudentMessage, trackStudentMessage } from '../services/api';

interface StaffViewProps {
  settings: SystemSettings | null;
  onBackToStudent: () => void;
}

const STAFF_ROLES = [
  { id: 'مهندس / مدرب تخصص عملي', label: '🛠️ مهندس / مدرب تخصص عملي', desc: 'اتصالات، شبكات، حاسبات، تكنولوجيا' },
  { id: 'معلم مواد أكاديمية وثقافية', label: '📚 معلم مواد أكاديمية وثقافية', desc: 'لغات، رياضيات، علوم، مواد عامة' },
  { id: 'إداري / شؤون طلاب ومعامل', label: '💼 كادر إداري / شؤون طلاب ومعامل', desc: 'إشراف، شؤون عاملين، معامل' },
  { id: 'غير محدد', label: '🔒 أفضل عدم التحديد (سري)', desc: 'لضمان السرية والراحة التامة' },
];

const STAFF_CATEGORIES = [
  { id: 'مقترح لتطوير بيئة العمل أو المناهج', label: '💡 مقترح لتطوير بيئة العمل أو التدريب', desc: 'أفكار لتطوير أساليب التدريس أو الورش' },
  { id: 'احتياجات المعامل والتدريب العملي', label: '⚙️ احتياجات المعامل وأدوات التخصص', desc: 'أجهزة، تجهيزات، برمجيات، خامات' },
  { id: 'صعوبات في الجدول أو المهام الوظيفية', label: '📅 ملاحظات على الجدول وتوزيع المهام', desc: 'تنسيق الحصص، الإشراف، الأعباء' },
  { id: 'شكوى إدارية أو زمالة', label: '🤝 شكوى إدارية أو موقف بحاجة للتدخل', desc: 'موقف يحتاج لحل ودي وعادل من الإدارة' },
  { id: 'رسالة خاصة لمدير المدرسة', label: '✉️ رسالة خاصة ومباشرة لإدارة المدرسة', desc: 'أمر شخصي أو موضوع هام خاص' },
  { id: 'عام / أخرى', label: '📝 موضوع آخر', desc: 'أي أمر آخر تود مشاركته' },
];

export const StaffView: React.FC<StaffViewProps> = ({ settings, onBackToStudent }) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  const [content, setContent] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('غير محدد');
  const [selectedCategory, setSelectedCategory] = useState<string>('مقترح لتطوير بيئة العمل أو المناهج');
  const [urgency, setUrgency] = useState<'عادي' | 'عاجل'>('عادي');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state
  const [submissionResult, setSubmissionResult] = useState<{
    referenceCode: string;
    createdAt: string;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking state
  const [trackingCode, setTrackingCode] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedMessage, setTrackedMessage] = useState<TrackedMessage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (content.trim().length < 5) {
      setErrorMessage('من فضلك اكتب تفاصيل الرسالة (5 أحرف على الأقل).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitStudentMessage({
        content: content.trim(),
        category: selectedCategory,
        urgency,
        // @ts-ignore
        staffRole: selectedRole !== 'غير محدد' ? selectedRole : undefined,
        // @ts-ignore
        senderType: 'staff'
      });

      setSubmissionResult({
        referenceCode: res.referenceCode,
        createdAt: res.createdAt,
      });
      setContent('');
      setSelectedRole('غير محدد');
      setUrgency('عادي');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (submissionResult?.referenceCode) {
      navigator.clipboard.writeText(submissionResult.referenceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleTrack = async (codeToQuery?: string) => {
    const code = (codeToQuery || trackingCode).trim();
    if (!code) {
      setTrackError('يرجى إدخال كود المتابعة.');
      return;
    }

    setTrackError(null);
    setIsTracking(true);
    try {
      const data = await trackStudentMessage(code);
      setTrackedMessage(data);
    } catch (err: any) {
      setTrackError(err.message || 'لم يتم العثور على أي رسالة بهذا الكود.');
      setTrackedMessage(null);
    } finally {
      setIsTracking(false);
    }
  };

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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToStudent}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 px-3 py-1.5 rounded-xl shadow-sm transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة الطلاب</span>
          </button>
          
          <span className="text-xs font-bold bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full border border-indigo-200">
            بوابة المعلمين والمهندسين 👔
          </span>
        </div>

        {/* Top Dignified Greeting Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-indigo-100 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                <Briefcase className="w-3.5 h-3.5 text-indigo-700" />
                <span>مساحة الزملاء والشركاء الأفاضل</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                صندوق الزملاء المعلمين والمهندسين 👔
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                زملائي الأعزاء معلمي ومهندسي وإداريي مدرسة WE للتكنولوجيا التطبيقية بطوخ؛ أنتم عماد هذا الصرح. هذا الصندوق مخصص لكم للتواصل المباشر والسري 100% مع إدارة المدرسة لإبداء أي مقترح لتطوير بيئة العمل أو التدريب، أو نقل أي صعوبة أو شكوى بكل راحة ودون أي حرج أو تسجيل لأي بيانات شخصية.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-800 self-stretch sm:self-auto flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-bold">سرية تامة 100%</div>
                <div className="text-emerald-700/90">لا نسجل أي اسم أو إيميل أو IP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-indigo-100 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'submit'
                ? 'bg-indigo-950 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-950 hover:bg-slate-50'
            }`}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">إرسال رسالة أو مقترح سري ✍️</span>
            <span className="sm:hidden">إرسال رسالة أو مقترح ✍️</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'track'
                ? 'bg-indigo-950 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-950 hover:bg-slate-50'
            }`}
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">متابعة حالة الرسالة ورد الإدارة 🔍</span>
            <span className="sm:hidden">متابعة حالة الرسالة 🔍</span>
          </button>
        </div>

        {/* ================= TAB 1: SUBMIT FORM ================= */}
        {activeTab === 'submit' && (
          <>
            {submissionResult ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-emerald-100 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  وصلت رسالتكم الكريمة بأمان تام! 🤝
                </h3>
                <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed">
                  تم تسليم رسالتكم إلى إدارة مدرسة WE للتكنولوجيا التطبيقية بسرية تامة دون تسجيل أي بيانات عنكم، وستتم قراءتها ومتابعتها بأعلى درجات الاهتمام والتقدير.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 max-w-md mx-auto mb-8 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">كود المتابعة السري الخاص بكم:</span>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      كود الستاف
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                    <span className="font-mono text-lg font-bold text-slate-800 tracking-wider">
                      {submissionResult.referenceCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 transition-colors"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setTrackingCode(submissionResult.referenceCode);
                      setActiveTab('track');
                      handleTrack(submissionResult.referenceCode);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-sm transition-all shadow-md"
                  >
                    <Search className="w-4 h-4" />
                    <span>متابعة رد الإدارة الآن</span>
                  </button>

                  <button
                    onClick={() => {
                      setSubmissionResult(null);
                      setContent('');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
                  >
                    <Send className="w-4 h-4 text-indigo-700" />
                    <span>إرسال رسالة أخرى</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-indigo-100 space-y-6">
                
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                {/* 1. Staff Role Selector (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-800">
                      1. الصفة أو التخصص في المدرسة (اختياري تماماً)
                    </label>
                    <span className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-medium">
                      {selectedRole === 'غير محدد' ? 'سري (غير محدد)' : selectedRole}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STAFF_ROLES.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id)}
                          className={`text-right p-3 rounded-2xl border transition-all text-xs sm:text-sm flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-600'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          <span className="font-semibold">{role.label}</span>
                          <span className="text-[11px] text-slate-500 font-normal mt-0.5">{role.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Category Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    2. موضوع الرسالة أو التصنيف
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STAFF_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`text-right p-3 rounded-2xl border transition-all text-xs sm:text-sm flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-600'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                          }`}
                        >
                          <span className="font-semibold">{cat.label}</span>
                          <span className="text-[11px] text-slate-500 font-normal mt-0.5">{cat.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Content Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="staff-content" className="block text-sm font-bold text-slate-800">
                      3. تفاصيل الرسالة أو المقترح (بحرية تامة) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">
                      {content.length} / 3500 حرف
                    </span>
                  </div>

                  <textarea
                    id="staff-content"
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="تفضل بكتابة رسالتك أو مقترحك أو الصعوبات التي تواجهها بكل صراحة ومهنية... رسالتك سرية ومحمية تماماً ولن يعرف هويتك أحد."
                    className="w-full p-4 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 text-sm sm:text-base leading-relaxed resize-y min-h-[140px]"
                    required
                  />

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>تصل الرسالة مباشرة لإدارة المدرسة دون أي تسجيل لبيانات هويتك.</span>
                  </div>
                </div>

                {/* 4. Urgency Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    درجة الأهمية:
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setUrgency('عادي')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                        urgency === 'عادي'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🟢 رسالة عادية
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('عاجل')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                        urgency === 'عاجل'
                          ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold shadow-sm ring-1 ring-rose-500'
                          : 'border-slate-200 text-slate-600 hover:bg-rose-50/50'
                      }`}
                    >
                      ⚠️ عاجل ومهم للإدارة
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || content.trim().length < 5}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 hover:from-indigo-950 hover:to-purple-950 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-indigo-950/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>جارٍ الإرسال بسرية تامة...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>إرسال الرسالة إلى إدارة المدرسة الآن</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </>
        )}

        {/* ================= TAB 2: TRACKING ================= */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-indigo-100">
              <div className="text-center max-w-lg mx-auto mb-6">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  متابعة رد الإدارة على رسائل الستاف
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  أدخل كود المتابعة (مثال: WE-STAFF-1234) للاطلاع على رد الإدارة والإجراء المتخذ.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTrack();
                }}
                className="max-w-md mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="مثال: WE-STAFF-1234"
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-center sm:text-right font-mono text-base uppercase text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={isTracking || !trackingCode.trim()}
                    className="px-6 py-3 rounded-2xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>استعلام عن الرد</span>
                  </button>
                </div>

                {trackError && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{trackError}</span>
                  </div>
                )}
              </form>
            </div>

            {trackedMessage && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-100 space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">كود المتابعة المرجعي:</span>
                    <span className="font-mono text-xl font-black text-indigo-950 tracking-wider">
                      {trackedMessage.referenceCode}
                    </span>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {trackedMessage.statusLabel}
                  </span>
                </div>

                {/* Feedback Box */}
                <div className="rounded-2xl p-5 border shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50/40 to-white border-indigo-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-indigo-950">
                      رد وفيدباك إدارة المدرسة الموقرة:
                    </h4>
                    {trackedMessage.adminRepliedAt && (
                      <span className="text-[11px] text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {formatDate(trackedMessage.adminRepliedAt)}
                      </span>
                    )}
                  </div>

                  {trackedMessage.adminReply ? (
                    <div className="bg-white rounded-xl p-4 border border-indigo-100 text-slate-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium shadow-inner">
                      {trackedMessage.adminReply}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/70 border border-indigo-100 text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
                      ⏳ الرسالة قيد المتابعة والاهتمام من إدارة المدرسة، وسيظهر الرد الرسمي هنا فور اعتماده.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    نص الرسالة المرسلة:
                  </label>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {trackedMessage.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
