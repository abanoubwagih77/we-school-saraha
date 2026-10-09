import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Bell,
  LogOut,
  LayoutDashboard,
  Send,
  Briefcase,
  GraduationCap,
  Menu,
  X,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { SystemSettings } from '../types';

interface HeaderProps {
  settings: SystemSettings | null;
  isAdmin: boolean;
  viewMode: 'student' | 'admin' | 'staff';
  setViewMode: (mode: 'student' | 'admin' | 'staff') => void;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fullSchoolName = settings?.schoolName || 'مدرسة WE للتكنولوجيا التطبيقية';
  const fullBranchName = settings?.branchName || 'فرع طوخ - محافظة القليوبية';

  const handleSelectView = (mode: 'student' | 'admin' | 'staff') => {
    setViewMode(mode);
    setIsMobileMenuOpen(false);
  };

  const handleOpenLoginModal = () => {
    onOpenLogin();
    setIsMobileMenuOpen(false);
  };

  const handleMobileLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-xl sticky top-0 z-50 border-b border-purple-800/50 backdrop-blur-md bg-opacity-95 select-none transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Right: Logo & School Branding */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
            {/* WE Logo badge */}
            <div 
              onClick={() => handleSelectView('student')}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-950/60 border border-purple-400/30 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
              title="العودة للصفحة الرئيسية"
            >
              <span className="text-base sm:text-xl font-black tracking-tighter text-white drop-shadow">we</span>
            </div>

            {/* School Name & Branch */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 
                  onClick={() => handleSelectView('student')}
                  className="text-xs xs:text-sm sm:text-base md:text-lg font-black tracking-tight text-white leading-tight truncate cursor-pointer hover:text-purple-200 transition-colors"
                  title={`${fullSchoolName} - ${fullBranchName}`}
                >
                  {fullSchoolName}
                </h1>
                
                {/* Branch pill: Compact on mobile, full on desktop */}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-800/90 text-purple-200 border border-purple-500/40 flex-shrink-0 whitespace-nowrap shadow-sm">
                  {fullBranchName}
                </span>
                <span className="sm:hidden inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-800/90 text-purple-200 border border-purple-500/40 flex-shrink-0 whitespace-nowrap">
                  طوخ
                </span>
              </div>
              
              {/* Sub-tag: Short single line on mobile, full description on desktop */}
              <div className="mt-0.5">
                <p className="sm:hidden text-[10px] text-purple-200/80 flex items-center gap-1 leading-none">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">
                    {viewMode === 'staff' ? 'بوابة المعلمين والمهندسين 👔' : 'صندوق الصراحة السري المشفر 100%'}
                  </span>
                </p>
                <p className="hidden sm:flex text-xs text-purple-200/90 items-center gap-1 leading-normal">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>
                    {viewMode === 'staff'
                      ? 'بوابة المعلمين والمهندسين السرية والمباشرة 👔'
                      : 'صندوق الصراحة والتواصل المدرسي السري والآمن 100%'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Left: Navigation Actions */}
          
          {/* Desktop & Tablet Navigation (hidden on mobile < md) */}
          <div className="hidden md:flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'student' : 'admin')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm ${
                    viewMode === 'admin'
                      ? 'bg-purple-800/80 hover:bg-purple-700 text-purple-100 border border-purple-600/50'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                  }`}
                  title={viewMode === 'admin' ? 'معاينة الموقع كطالب' : 'العودة للوحة تحكم الإدارة'}
                >
                  {viewMode === 'admin' ? (
                    <>
                      <Send className="w-4 h-4 text-purple-300" />
                      <span>معاينة الموقع كطالب</span>
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>لوحة التحكم</span>
                    </>
                  )}
                </button>

                {viewMode !== 'admin' && unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse shadow">
                    <Bell className="w-3.5 h-3.5" />
                    <span>{unreadCount} جديدة</span>
                  </span>
                )}

                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800/50 transition-colors shadow-sm"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Teachers & Engineers Portal Button */}
                {viewMode === 'staff' ? (
                  <button
                    onClick={() => setViewMode('student')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-800/90 hover:bg-purple-700 text-purple-100 border border-purple-500/50 shadow-sm transition-all"
                    title="العودة لصندوق صراحة الطلاب"
                  >
                    <GraduationCap className="w-4 h-4 text-purple-300" />
                    <span>صندوق صراحة الطلاب 🎓</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setViewMode('staff')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-400/50 shadow-md shadow-indigo-950/40 transition-all hover:scale-[1.02]"
                    title="صندوق المعلمين والمهندسين"
                  >
                    <Briefcase className="w-4 h-4 text-indigo-300" />
                    <span>صندوق المعلمين والمهندسين 👔</span>
                  </button>
                )}

                {/* Admin Login Button */}
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-600/40 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-300" />
                  <span>دخول الإدارة</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile & Small Screens Action Group (visible only on < md) */}
          <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'student' : 'admin')}
                  className={`p-2 rounded-xl text-xs font-bold transition-all relative ${
                    viewMode === 'admin'
                      ? 'bg-purple-800/90 text-purple-200 border border-purple-600/50'
                      : 'bg-emerald-600 text-white shadow'
                  }`}
                  title={viewMode === 'admin' ? 'الموقع' : 'اللوحة'}
                >
                  {viewMode === 'admin' ? <Send className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                  {unreadCount > 0 && viewMode !== 'admin' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                  )}
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-red-950/70 text-red-300 border border-red-800/50"
                  title="تسجيل خروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {/* Fast mobile toggle pill button */}
                {viewMode === 'staff' ? (
                  <button
                    onClick={() => setViewMode('student')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-purple-800/90 hover:bg-purple-700 text-purple-100 border border-purple-400/50 shadow-sm active:scale-95 transition-all"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
                    <span>الطلاب 🎓</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setViewMode('staff')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-400/50 shadow-sm active:scale-95 transition-all"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-300" />
                    <span>الستاف 👔</span>
                  </button>
                )}

                {/* Mobile Admin Login button */}
                <button
                  onClick={onOpenLogin}
                  className="p-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-600/40 shadow-sm active:scale-95 transition-all"
                  title="دخول الإدارة"
                >
                  <Lock className="w-4 h-4 text-purple-300" />
                </button>
              </>
            )}

            {/* Mobile Hamburger / Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-purple-950/90 hover:bg-purple-800 text-purple-100 border border-purple-700/60 shadow-sm active:scale-95 transition-all focus:outline-none"
              aria-label="القائمة الرئيسية"
              title="القائمة الرئيسية"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-purple-200" />
              ) : (
                <Menu className="w-4 h-4 text-purple-200" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-purple-800/60 bg-gradient-to-b from-purple-950/98 via-indigo-950/98 to-slate-950/98 backdrop-blur-xl px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          
          {/* Active Status Header */}
          <div className="flex items-center justify-between pb-2 border-b border-purple-800/40 text-xs">
            <span className="text-purple-300 font-semibold">بوابات التواصل والمتابعة:</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              مشفر وسري 100%
            </span>
          </div>

          {/* Portal Navigation Cards */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            
            {/* 1. Student Portal Card */}
            <button
              onClick={() => handleSelectView('student')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-right transition-all border ${
                viewMode === 'student'
                  ? 'bg-purple-900/70 border-purple-400/60 text-white shadow-md'
                  : 'bg-purple-950/40 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                  viewMode === 'student' ? 'bg-purple-600 text-white' : 'bg-purple-900/60 text-purple-300'
                }`}>
                  🎓
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>صندوق صراحة الطلاب</span>
                    {viewMode === 'student' && (
                      <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.2 rounded-full font-semibold">
                        النشط حالياً
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-purple-300/80 mt-0.5">
                    إرسال الشكاوى والمقترحات والرسائل المجهولة ومتابعتها
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-purple-400" />
            </button>

            {/* 2. Teachers & Engineers Portal Card */}
            <button
              onClick={() => handleSelectView('staff')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-right transition-all border ${
                viewMode === 'staff'
                  ? 'bg-indigo-900/70 border-indigo-400/60 text-white shadow-md'
                  : 'bg-purple-950/40 border-purple-800/40 text-purple-200 hover:bg-purple-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                  viewMode === 'staff' ? 'bg-indigo-600 text-white' : 'bg-indigo-950/80 text-indigo-300'
                }`}>
                  👔
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>بوابة المعلمين والمهندسين</span>
                    {viewMode === 'staff' && (
                      <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full font-semibold">
                        النشط حالياً
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-purple-300/80 mt-0.5">
                    قناة سرية ومباشرة للكوادر التعليمية والهندسية مع الإدارة
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-indigo-400" />
            </button>

            {/* 3. Admin Login or Dashboard Card */}
            {isAdmin ? (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-700/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>أنت مسجل كمسؤول إدارة</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {unreadCount > 0 ? `يوجد ${unreadCount} رسائل جديدة غير مقروءة` : 'لا توجد رسائل جديدة'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectView('admin')}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold"
                  >
                    لوحة الإدارة
                  </button>
                  <button
                    onClick={handleMobileLogout}
                    className="p-1.5 rounded-xl bg-red-950 text-red-300 border border-red-800 text-xs"
                    title="خروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenLoginModal}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-right bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/40 text-purple-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-900/60 text-purple-300 flex items-center justify-center font-bold text-base">
                    🔒
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">دخول إدارة المدرسة</div>
                    <div className="text-[11px] text-purple-300/80 mt-0.5">
                      تسجيل دخول المديرين والمشرفين للرد على الرسائل والتحكم
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-purple-400" />
              </button>
            )}

          </div>

          {/* School Info Footer */}
          <div className="pt-2 border-t border-purple-800/40 flex items-center justify-between text-[11px] text-purple-300/70">
            <span>{fullSchoolName} - {fullBranchName}</span>
            <span className="text-[10px] text-emerald-400 font-bold">حماية مشفرة</span>
          </div>

        </div>
      )}
    </header>
  );
};
