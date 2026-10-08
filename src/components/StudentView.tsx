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
  HeartHandshake,
  ChevronDown,
  Search,
  MessageSquare,
  Calendar,
  Building,
  School,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle
} from 'lucide-react';
import { SystemSettings, TrackedMessage } from '../types';
import { submitStudentMessage, trackStudentMessage } from '../services/api';

interface StudentViewProps {
  settings: SystemSettings | null;
}

const CATEGORIES = [
  { id: 'شكوى من معلم أو مادة', label: '👨‍🏫 شكوى من معلم أو مادة دراسية', desc: 'في مدرس مزعلك أو خايف تتكلم معاه' },
  { id: 'اقتراح لتطوير المدرسة', label: '💡 اقتراح أو فكرة لتطوير المدرسة', desc: 'نفسك في حاجة تتغير أو نشاط يتعمل' },
  { id: 'تنمر أو مشكلة مع زميل', label: '🤝 تنمر أو خلاف مع زميل', desc: 'مشكلة تواجهك في الفصل أو مع أحد الطلاب' },
  { id: 'طلب دعم ومساعدة خاصة', label: '❤️ طلب دعم نفسي أو مساعدة خاصة', desc: 'متضايق أو محتاج حد من الإدارة يسمعك ويسندك' },
  { id: 'عام / أخرى', label: '📝 موضوع آخر / رسالة عامة', desc: 'أي حاجة تانية حابب تشاركها مع الإدارة' },
];

export const StudentView: React.FC<StudentViewProps> = ({ settings }) => {
  // Tabs: submit new message vs track existing message
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit form state
  const [content, setContent] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(''); // empty means undisclosed
  const [selectedCategory, setSelectedCategory] = useState<string>('شكوى من معلم أو مادة');
  const [urgency, setUrgency] = useState<'عادي' | 'عاجل'>('عادي');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Success state
  const [submissionResult, setSubmissionResult] = useState<{
    referenceCode: string;
    createdAt: string;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  // Tracking state
  const [trackingCode, setTrackingCode] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedMessage, setTrackedMessage] = useState<TrackedMessage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (content.trim().length < 5) {
      setErrorMessage('من فضلك اكتب رسالتك بالتفصيل (5 أحرف على الأقل) حتى تتمكن الإدارة من فهمها.');
      return;
    }

    if (content.trim().length > 3000) {
      setErrorMessage('نص الرسالة طويل جداً، الحد الأقصى هو 3000 حرف.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitStudentMessage({
        content: content.trim(),
        classroom: selectedClass || undefined,
        category: selectedCategory,
        urgency,
      });

      setSubmissionResult({
        referenceCode: res.referenceCode,
        createdAt: res.createdAt,
      });
      setContent('');
      setSelectedClass('');
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

  const handleReset = () => {
    setSubmissionResult(null);
    setErrorMessage(null);
    setContent('');
  };

  // Perform tracking search
  const handleTrack = async (codeToQuery?: string) => {
    const code = (codeToQuery || trackingCode).trim();
    if (!code) {
      setTrackError('يرجى إدخال كود المتابعة أولاً.');
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

  // Jump to tracking from success card
  const handleJumpToTrack = (code: string) => {
    setTrackingCode(code);
    setActiveTab('track');
    handleTrack(code);
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
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 via-purple-50/25 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Trust Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>مساحتك الآمنة للتعبير بحرية</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                صندوق صراحة المدرسي 💬
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                متضايق من مدرس؟ خايف تروح للمدير؟ عندك فكرة أو مشكلة في المدرسة؟ اكتب كل اللي في قلبك بكل أمان وسرية، وتابع رد الإدارة والحل بكودك المرجعي.
              </p>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-800 self-stretch sm:self-auto flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-bold">سري ومجهول 100%</div>
                <div className="text-emerald-700/90">لا نسجل أي اسم أو إيميل أو IP</div>
              </div>
            </div>
          </div>

          {/* School Announcement if present */}
          {settings?.announcement && (
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/70 text-slate-800 text-xs sm:text-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-950 block mb-0.5">تنويه من إدارة المدرسة:</span>
                <p className="text-slate-700 leading-relaxed">{settings.announcement}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher: Send New vs Track Existing */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-purple-100 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-900 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>إرسال رسالة أو شكوى سرية جديدة ✍️</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'track'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-900 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>متابعة حالة الشكوى ورد الإدارة 🔍</span>
          </button>
        </div>

        {/* ================= TAB 1: SUBMISSION FLOW ================= */}
        {activeTab === 'submit' && (
          <>
            {submissionResult ? (
              /* Success State */
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-emerald-100 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  وصلت رسالتك بأمان تام! 🎉
                </h3>
                <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed">
                  تم تسليم رسالتك إلى إدارة مدرسة WE للتكنولوجيا التطبيقية بطوخ بنجاح وسرية تامة دون تسجيل أي بيانات عنك.
                </p>

                {/* Reference Code Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 max-w-md mx-auto mb-8 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">كود المتابعة والبحث الخاص بك:</span>
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      كود مجهول الهوية
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                    <span className="font-mono text-lg font-bold text-slate-800 tracking-wider">
                      {submissionResult.referenceCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الكود</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    💡 <strong>احتفظ بهذا الكود!</strong> يمكنك استخدامه في أي وقت من خانة «متابعة الشكوى» لمعرفة هل فتحت الإدارة رسالتك وما الرد والفيدباك الذي تم اتخاذه.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleJumpToTrack(submissionResult.referenceCode)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md"
                  >
                    <Search className="w-4 h-4" />
                    <span>متابعة حالة هذه الرسالة الآن</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
                  >
                    <Send className="w-4 h-4 text-purple-700" />
                    <span>إرسال رسالة أو شكوى أخرى</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-purple-100/60 space-y-6">
                
                {/* Error banner */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                {/* 1. Category Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    1. موضوع الرسالة أو التصنيف (اختياري)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`text-right p-3 rounded-2xl border transition-all text-xs sm:text-sm flex flex-col justify-between ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold shadow-sm ring-1 ring-purple-600'
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

                {/* 2. Class Selector (18 classes: A1-A6, B1-B6, C1-C6) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-800">
                      2. الفصل الدراسي الخاص بك (اختياري تماماً)
                    </label>
                    <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-medium">
                      {selectedClass ? `فصل: ${selectedClass}` : 'غير محدد (مجهول)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    إذا كانت الشكوى أو الطلب يخص فصلك اذكر فصلك، وإذا كنت تفضل عدم ذكر الفصل اترك الخيار كما هو.
                  </p>

                  {/* Grouped classes */}
                  <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                    {/* Default no-class option */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-700">تريد إخفاء الفصل؟</span>
                      <button
                        type="button"
                        onClick={() => setSelectedClass('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedClass === ''
                            ? 'bg-purple-700 text-white shadow'
                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        أفضل عدم ذكر الفصل 🔒
                      </button>
                    </div>

                    {/* Grade A */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 mb-1.5">الصف الأول (A) — 6 فصول:</div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {['A1', 'A2', 'A3', 'A4', 'A5', 'A6'].map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setSelectedClass(cls)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                              selectedClass === cls
                                ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-400'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grade B */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 mb-1.5">الصف الثاني (B) — 6 فصول:</div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setSelectedClass(cls)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                              selectedClass === cls
                                ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-400'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grade C */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 mb-1.5">الصف الثالث (C) — 6 فصول:</div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setSelectedClass(cls)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                              selectedClass === cls
                                ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-400'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/50'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Main Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="message-content" className="block text-sm font-bold text-slate-800">
                      3. ماذا تريد أن تقول للإدارة؟ (اكتب بحرية تامة) <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-xs ${content.length > 2800 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                      {content.length} / 3000 حرف
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      id="message-content"
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="اكتب رسالتك بكل صراحة... مثلاً: موقف مضايقك مع مدرس، حاجة خايف تقولها في وش المدرس أو للمدير، فكرة لتطوير المعامل، مشكلة بتواجهك مع زمايلك، أو أي شكوى تريد من الإدارة حلها دون معرفة هويتك..."
                      className="w-full p-4 rounded-2xl border border-slate-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-slate-800 placeholder-slate-400 text-sm sm:text-base leading-relaxed transition-all resize-y min-h-[140px]"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>رسالتك مشفرة ومحمية، لن يعرف أي شخص من صاحب هذه الرسالة نهائياً.</span>
                  </div>
                </div>

                {/* 4. Urgency Selector */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    درجة الأهمية أو الاستعجال:
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setUrgency('عادي')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                        urgency === 'عادي'
                          ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-sm font-bold'
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
                          ? 'bg-rose-50 border-rose-600 text-rose-900 shadow-sm font-bold ring-1 ring-rose-500'
                          : 'border-slate-200 text-slate-600 hover:bg-rose-50/50'
                      }`}
                    >
                      ⚠️ عاجل ومهم جداً
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || content.trim().length < 5}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
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

        {/* ================= TAB 2: TRACKING & FEEDBACK SEARCH ================= */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-purple-100">
              <div className="text-center max-w-lg mx-auto mb-6">
                <div className="w-12 h-12 bg-purple-100 text-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  تتبع حالة الشكوى ورد الإدارة
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  أدخل كود المتابعة الذي حصلت عليه عند إرسال رسالتك لمعرفة هل تم فتحها وما هو الإجراء أو الرد الذي اتخذته الإدارة.
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
                    placeholder="مثال: WE-B2-8067 أو WE-4821"
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 text-center sm:text-right font-mono text-base uppercase text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isTracking || !trackingCode.trim()}
                    className="px-6 py-3 rounded-2xl bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isTracking ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
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

            {/* Tracking Result Card */}
            {trackedMessage && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-purple-100 space-y-6 animate-in fade-in duration-300">
                
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">كود الشكوى المرجعي:</span>
                    <span className="font-mono text-xl font-black text-purple-900 tracking-wider">
                      {trackedMessage.referenceCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                        trackedMessage.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : trackedMessage.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : trackedMessage.isRead
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {trackedMessage.status === 'resolved' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{trackedMessage.statusLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Status Timeline / Steps */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-4">مسار متابعة الشكوى:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    
                    {/* Step 1: Received */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                        ✓
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">تم الاستلام بنجاح</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{formatDate(trackedMessage.createdAt)}</span>
                      </div>
                    </div>

                    {/* Step 2: Opened / Read */}
                    <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                      trackedMessage.isRead
                        ? 'bg-white border-purple-200'
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                        trackedMessage.isRead
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {trackedMessage.isRead ? '✓' : '2'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {trackedMessage.isRead ? 'تم فتحها وقراءتها' : 'في انتظار فتح الإدارة'}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {trackedMessage.readAt ? formatDate(trackedMessage.readAt) : 'بمجرد دخول الإدارة'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Action / Resolution */}
                    <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                      trackedMessage.status === 'resolved'
                        ? 'bg-emerald-50 border-emerald-300'
                        : trackedMessage.status === 'in_progress'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                        trackedMessage.status === 'resolved'
                          ? 'bg-emerald-600 text-white'
                          : trackedMessage.status === 'in_progress'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {trackedMessage.status === 'resolved' ? '✓' : '3'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {trackedMessage.status === 'resolved'
                            ? 'تم اتخاذ الإجراء والحل'
                            : trackedMessage.status === 'in_progress'
                            ? 'جارٍ المتابعة والحل'
                            : 'الإجراء والرد'}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {trackedMessage.status === 'resolved'
                            ? 'تم إنهاء المتابعة بنجاح'
                            : trackedMessage.status === 'in_progress'
                            ? 'الإدارة تعمل على المشكلة'
                            : 'سيظهر فور اتخاذ الإجراء'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Official Admin Feedback Box (Requested Feature!) */}
                <div className="rounded-2xl p-5 border shadow-sm relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center font-bold text-xs">
                        we
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-purple-950">
                          رد إدارة مدرسة WE للتكنولوجيا التطبيقية (فرع طوخ):
                        </h4>
                        <span className="text-[10px] text-purple-700/80">
                          رد رسمي صادر من إدارة المدرسة الموقرة
                        </span>
                      </div>
                    </div>

                    {trackedMessage.adminRepliedAt && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-purple-100">
                        {formatDate(trackedMessage.adminRepliedAt)}
                      </span>
                    )}
                  </div>

                  {trackedMessage.adminReply ? (
                    <div className="bg-white rounded-xl p-4 border border-purple-100 text-slate-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium shadow-inner">
                      {trackedMessage.adminReply}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/70 border border-purple-100 text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
                      ⏳ <strong>الرسالة قيد المتابعة حالياً:</strong> لم تقم الإدارة بإدراج رد كتابي نهائي بعد. بمجرد انتهاء التحقيق والتواصل سيظهر رد الإدارة بالتفصيل في هذا المربع.
                    </div>
                  )}
                </div>

                {/* Original Message Preview */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    نص الرسالة التي أرسلتها (للتأكد):
                  </label>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {trackedMessage.content}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Informative FAQ / Safety Guarantee */}
        <div className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-200 text-slate-700 text-sm">
          <button
            type="button"
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between text-right font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-700" />
              <span>لماذا تم إنشاء هذا الصندوق؟ وكيف نضمن سريتك؟</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFaq ? 'rotate-180' : ''}`} />
          </button>

          {showFaq && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>الهدف الرئيسي:</strong> إدارة مدرسة WE للتكنولوجيا التطبيقية بطوخ تضع راحة وكرامة وأمان كل طالب في المقام الأول. نريد كسر أي حاجز خوف أو قلق بين الطالب والمدرسة.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>ضمان السرية:</strong> لا يتم حفظ أي بصمة جهاز، ولا عنوان IP، ولا يتطلب الموقع أي تسجيل دخول بالاسم أو البريد، ولن يعرف أي مدرس أو زميل من كتب الرسالة.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>كيف تتعامل الإدارة مع الرسائل؟</strong> تتابع الإدارة الرسائل يومياً وتقوم بتصنيفها والتحقيق العادل في أي مشكلة واتخاذ القرارات السليمة دون التسبب في أي ضرر لأي طالب، مع كتابة الفيدباك والرد ليتمكن الطالب من قراءته بكوده المرجعي.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
