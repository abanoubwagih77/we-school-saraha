import React, { useState } from 'react';
import { X, Settings, ShieldCheck, KeyRound, BellRing, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SystemSettings } from '../types';
import { updateAdminSettings } from '../services/api';

interface AdminSettingsModalProps {
  settings: SystemSettings | null;
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (updatedSettings: SystemSettings) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  if (!isOpen) return null;

  const [schoolName, setSchoolName] = useState(settings?.schoolName || 'مدرسة WE للتكنولوجيا التطبيقية');
  const [branchName, setBranchName] = useState(settings?.branchName || 'فرع طوخ - محافظة القليوبية');
  const [schoolSubtitle, setSchoolSubtitle] = useState(settings?.schoolSubtitle || '');
  const [announcement, setAnnouncement] = useState(settings?.announcement || '');
  const [allowSubmissions, setAllowSubmissions] = useState(settings?.allowSubmissions ?? true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await updateAdminSettings({
        schoolName,
        branchName,
        schoolSubtitle,
        announcement,
        allowSubmissions,
        newUsername: newUsername.trim() || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setSuccess('تم حفظ الإعدادات وتحديث بيانات النظام بنجاح!');
      onSettingsSaved(res.settings);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-purple-100 relative my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 text-purple-900 rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">إعدادات النظام والمدرسة</h3>
            <p className="text-xs text-slate-500">تخصيص الصندوق والإعلانات وكلمة مرور الإدارة</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* General School Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
              بيانات المدرسة والفرع:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">اسم المدرسة:</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">الفرع / المحافظة:</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Student Announcement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رسالة / تنويه الإدارة المعروض للطلاب أعلى الصفحة:
            </label>
            <textarea
              rows={3}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="اكتب رسالة للطلاب تطمئنهم فيها أو تبلغهم بمتابعة رسائلهم..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {/* Submissions Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">حالة استقبال الرسائل من الطلاب:</span>
              <span className="text-[11px] text-slate-500">
                {allowSubmissions ? 'الصندوق مفتوح ويستقبل الرسائل' : 'الصندوق مغلق مؤقتاً'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAllowSubmissions(!allowSubmissions)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                allowSubmissions
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {allowSubmissions ? 'مفتوح للطلاب' : 'مغلق مؤقتاً'}
            </button>
          </div>

          {/* Admin Credentials change */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-700" />
              <span>تغيير كلمة مرور الإدارة (اختياري)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">كلمة المرور الحالية:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="إذا أردت تغيير كلمة السر"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>جارٍ الحفظ...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
