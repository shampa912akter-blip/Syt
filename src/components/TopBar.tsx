'use client';

import React from 'react';
import { Translations } from '@/lib/i18n';

interface TopBarProps {
  t: Translations;
  isConnected: boolean;
  isUploadingNext: boolean;
  hasPending: boolean;
  onConnectYouTube: () => void;
  onRunCronNow: () => void;
}

export function TopBar({
  t,
  isConnected,
  isUploadingNext,
  hasPending,
  onConnectYouTube,
  onRunCronNow,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#top"
          className="shrink-0 whitespace-nowrap text-lg font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
        >
          {t.brand}
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"
        >
          <a
            href="#upload-section"
            className="shrink-0 whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            {t.navUpload}
          </a>
          <a
            href="#queue-section"
            className="shrink-0 whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            {t.navQueue}
          </a>
          <a
            href="#schedule-section"
            className="shrink-0 whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            {t.navSchedule}
          </a>
          <a
            href="#history-section"
            className="shrink-0 whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            {t.navHistory}
          </a>
        </nav>

        <div className="shrink-0">
          {isConnected ? (
            <button
              type="button"
              onClick={onRunCronNow}
              disabled={isUploadingNext || !hasPending}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              {isUploadingNext ? t.runningCronNow : t.uploadNextNow}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectYouTube}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              {t.connectYouTube}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
