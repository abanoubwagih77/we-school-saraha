import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-purple-900/40 py-2.5 px-3 text-center select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs leading-none">
        <span className="font-medium text-slate-300">
          مدرسة WE للتكنولوجيا التطبيقية (فرع طوخ)
        </span>
        <span className="text-purple-500/50">•</span>
        <span>
          تصميم وبرمجة: <strong className="text-purple-200 font-bold">م/ أبانوب وجيه</strong>
        </span>
        <span className="text-purple-500/50">•</span>
        <a
          href="tel:01012348828"
          className="text-emerald-400 hover:text-emerald-300 font-mono font-bold transition-colors inline-block"
          dir="ltr"
        >
          01012348828
        </a>
      </div>
    </footer>
  );
};
