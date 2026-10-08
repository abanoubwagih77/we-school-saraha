import React from 'react';
import { ShieldCheck, Lock, Bell, LogOut, LayoutDashboard, Send } from 'lucide-react';
import { SystemSettings } from '../types';

interface HeaderProps {
  settings: SystemSettings | null;
  isAdmin: boolean;
  viewMode: 'student' | 'admin';
  setViewMode: (mode: 'student' | 'admin') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isAdmin,
  viewMode,
  setViewMode,
  onOpenLogin,
  onLogout,
  unreadCount,
}) => {
  const fullSchoolName = settings?.schoolName || 'مدرسة WE للتكنولوجيا التطبيقية';
  const fullBranchName = settings?.branchName || 'فرع طوخ - محافظة القليوبية';

  return (
    <header className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-md sticky top-0 z-40 border-b border-purple-800/40 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[66px] sm:h-20 py-2 sm:py-0 gap-2 sm:gap-4">
          
          {/* Logo & School Name with Hover expansion */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-900/50 border border-purple-400/30 flex-shrink-0">
              <span className="text-base sm:text-xl font-black tracking-tighter text-white">we</span>
            </div>

            {/* Interactive Title with Full visibility and Tooltip on Hover */}
            <div
              className="relative group cursor-pointer min-w-0"
              title={`${fullSchoolName} - ${fullBranchName}`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-xs xs:text-sm sm:text-base md:text-lg font-black tracking-tight text-white leading-tight">
                  {fullSchoolName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-purple-800/90 text-purple-200 border border-purple-500/40 flex-shrink-0">
                  {fullBranchName}
                </span>
              </div>
              
              <p className="text-[10px] sm:text-xs text-purple-200/90 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>صندوق الصراحة والتواصل المدرسي السري والآمن 100%</span>
              </p>

              {/* Floating Tooltip Card on Hover */}
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50 bg-slate-950/95 text-white text-xs p-3.5 rounded-2xl shadow-2xl border border-purple-500/40 backdrop-blur w-max max-w-sm pointer-events-none animate-in fade-in duration-200">
                <div className="font-extrabold text-sm text-purple-200">
                  {fullSchoolName}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {fullBranchName}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>منظومة صراحة الطلابية الرسمية والسرية بالكامل</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'student' : 'admin')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    viewMode === 'admin'
                      ? 'bg-purple-800/60 hover:bg-purple-700/60 text-purple-100 border border-purple-600/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  }`}
                  title={viewMode === 'admin' ? 'معاينة صفحة الطلاب' : 'العودة للوحة التحكم'}
                >
                  {viewMode === 'admin' ? (
                    <>
                      <Send className="w-3.5 h-3.5 text-purple-300" />
                      <span className="hidden md:inline">صفحة الطلاب</span>
                      <span className="md:hidden">الطلاب</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">لوحة التحكم</span>
                      <span className="md:hidden">اللوحة</span>
                    </>
                  )}
                </button>

                {viewMode === 'student' && unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                    <Bell className="w-3 h-3" />
                    <span>{unreadCount}</span>
                  </span>
                )}

                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-medium bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/40 transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-purple-800/60 hover:bg-purple-700/70 text-purple-100 border border-purple-500/50 shadow-sm transition-all duration-200"
              >
                <Lock className="w-3.5 h-3.5 text-purple-300" />
                <span>دخول الإدارة</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
