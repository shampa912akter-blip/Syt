'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Youtube,
  HardDrive,
  AlertCircle,
  CheckCircle2,
  LogOut,
  X,
} from 'lucide-react';
import { translations } from '@/lib/i18n';
import {
  formatScheduledDateTime,
  getScheduledDateForQueueIndex,
} from '@/lib/schedule';
import {
  Language,
  PublicAppState,
  ScheduleConfig,
  ShortQueueItem,
  VideoPrivacy,
} from '@/lib/types';
import { TopBar } from './TopBar';
import { UploadPanel } from './UploadPanel';
import { QueueList } from './QueueList';
import { ScheduleSidebar } from './ScheduleSidebar';
import { HistoryTable } from './HistoryTable';
import { VideoPreviewModal } from './VideoPreviewModal';

export function ShortsSchedulerDashboard() {
  const [lang, setLang] = useState<Language>('en');
  const [appState, setAppState] = useState<PublicAppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [previewItem, setPreviewItem] = useState<ShortQueueItem | null>(null);
  const [callbackUri, setCallbackUri] = useState('/api/auth/callback');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load scheduler state');
      const data = (await res.json()) as PublicAppState;
      setAppState(data);
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : 'Unable to connect to server'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCallbackUri(`${window.location.origin}/api/auth/callback`);
      const savedLang = window.localStorage.getItem('shortsflow_lang');
      if (savedLang === 'bn' || savedLang === 'en') {
        setLang(savedLang);
      }
    }
    void fetchState();
  }, [fetchState]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (
        !origin.endsWith('.run.app') &&
        !origin.endsWith('.vercel.app') &&
        !origin.includes('localhost') &&
        origin !== window.location.origin
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setBannerError(null);
        setBannerSuccess(
          lang === 'bn'
            ? 'ইউটিউব চ্যানেল সফলভাবে সংযুক্ত হয়েছে।'
            : 'YouTube channel connected successfully.'
        );
        void fetchState();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setBannerError(event.data?.error || 'YouTube OAuth failed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchState, lang]);

  const handleLanguageChange = (nextLang: Language) => {
    setLang(nextLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('shortsflow_lang', nextLang);
    }
  };

  const handleConnectYouTube = async () => {
    setBannerError(null);
    setBannerSuccess(null);

    try {
      const redirectUri = `${window.location.origin}/api/auth/callback`;
      const res = await fetch(
        `/api/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.missingOAuthWarning);
      }

      const authWindow = window.open(
        data.url,
        'youtube_oauth',
        'width=600,height=700'
      );
      if (!authWindow) {
        setBannerError(t.oauthPopupBlocked);
      }
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : t.missingOAuthWarning
      );
    }
  };

  const handleDisconnect = async () => {
    const res = await fetch('/api/auth/disconnect', { method: 'POST' });
    if (res.ok) {
      const next = (await res.json()) as PublicAppState;
      setAppState(next);
    }
  };

  const handleReorder = async (orderedIds: string[]) => {
    if (!appState) return;
    // Optimistic reorder
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => orderMap.set(id, idx + 1));
    setAppState({
      ...appState,
      queue: appState.queue.map((item) =>
        item.status === 'pending' && orderMap.has(item.id)
          ? { ...item, order: orderMap.get(item.id)! }
          : item
      ),
    });

    const res = await fetch('/api/queue/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
    if (res.ok) {
      const next = (await res.json()) as PublicAppState;
      setAppState(next);
    }
  };

  const handleUpdateItem = async (
    id: string,
    patch: {
      title: string;
      description: string;
      tags: string[];
      privacyStatus: VideoPrivacy;
    }
  ) => {
    const res = await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) {
      const next = (await res.json()) as PublicAppState;
      setAppState(next);
    }
  };

  const handleRequeueItem = async (id: string) => {
    const res = await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, requeue: true }),
    });
    if (res.ok) {
      const next = (await res.json()) as PublicAppState;
      setAppState(next);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/queue?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const next = (await res.json()) as PublicAppState;
      setAppState(next);
    }
  };

  const handleSaveSchedule = async (patch: Partial<ScheduleConfig>) => {
    setBannerError(null);
    const res = await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const next = (await res.json()) as PublicAppState;
      setAppState(next);
      setBannerSuccess(
        lang === 'bn'
          ? 'দৈনিক সময়সূচি সংরক্ষিত হয়েছে।'
          : 'Daily schedule saved.'
      );
    }
  };

  const handleRunCronNow = async () => {
    setBannerError(null);
    setBannerSuccess(null);
    setIsRunningCron(true);
    try {
      const res = await fetch('/api/cron/upload', { method: 'POST' });
      const data = await res.json();
      if (data.state) {
        setAppState(data.state as PublicAppState);
      }
      if (!res.ok) {
        throw new Error(data.error || 'Scheduled upload failed');
      }
      if (data.uploaded) {
        setBannerSuccess(
          lang === 'bn'
            ? `শর্টস ইউটিউবে আপলোড হয়েছে: ${data.youtubeUrl}`
            : `Short published to YouTube: ${data.youtubeUrl}`
        );
      } else if (data.reason) {
        setBannerError(data.reason);
      }
    } catch (err) {
      setBannerError(
        err instanceof Error ? err.message : 'Failed to upload Short'
      );
    } finally {
      setIsRunningCron(false);
    }
  };

  const pendingCount = useMemo(
    () =>
      (appState?.queue || []).filter((item) => item.status === 'pending').length,
    [appState]
  );

  const uploadedCount = useMemo(
    () =>
      (appState?.queue || []).filter((item) => item.status === 'uploaded')
        .length,
    [appState]
  );

  const nextRunText = useMemo(() => {
    if (!appState || pendingCount === 0) return '—';
    const nextDate = getScheduledDateForQueueIndex(
      0,
      appState.schedule.dailyTime,
      appState.schedule.timezone
    );
    return formatScheduledDateTime(
      nextDate,
      appState.schedule.timezone,
      lang
    );
  }, [appState, pendingCount, lang]);

  return (
    <div id="top" className="min-h-screen bg-slate-50">
      <TopBar
        t={t}
        isConnected={Boolean(appState?.auth.connected)}
        isUploadingNext={isRunningCron}
        hasPending={pendingCount > 0}
        onConnectYouTube={() => void handleConnectYouTube()}
        onRunCronNow={() => void handleRunCronNow()}
      />

      <main className="mx-auto max-w-[1360px] space-y-6 px-6 py-8">
        {/* Workspace Toolbar & Bilingual Switcher */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl [text-wrap:balance]">
              {t.workspaceTitle}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {t.workspaceSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              {t.languageLabel}
            </span>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`min-h-[34px] shrink-0 whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  lang === 'en'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('bn')}
                className={`min-h-[34px] shrink-0 whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  lang === 'bn'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {bannerError && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{bannerError}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerError(null)}
              className="text-rose-600 hover:text-rose-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {bannerSuccess && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{bannerSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Channel Connection & Storage Status Strip */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3.5">
            {appState?.auth.connected && appState.auth.channelThumbnail ? (
              <img
                src={appState.auth.channelThumbnail}
                alt={appState.auth.channelTitle || 'YouTube Channel'}
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-rose-600">
                <Youtube className="h-5 w-5" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {appState?.auth.connected
                    ? appState.auth.channelTitle || t.channelConnected
                    : t.channelDisconnected}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>
                    {appState?.storageMode === 'vercel-blob'
                      ? t.storageModeBlob
                      : t.storageModeLocal}
                  </span>
                </span>
              </div>
              {!appState?.auth.connected && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {appState?.envStatus.hasGoogleClientId &&
                  appState?.envStatus.hasGoogleClientSecret
                    ? t.channelConnectHint
                    : t.missingOAuthWarning}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {appState?.auth.connected ? (
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{t.disconnect}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleConnectYouTube()}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Youtube className="h-4 w-4 text-rose-400" />
                <span>{t.connectYouTube}</span>
              </button>
            )}
          </div>
        </section>

        {/* 4-Column KPI Row */}
        {loading || !appState ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-xs font-medium text-slate-500">
                {t.kpiPending}
              </div>
              <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {String(pendingCount).padStart(2, '0')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-xs font-medium text-slate-500">
                {t.kpiUploaded}
              </div>
              <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {String(uploadedCount).padStart(2, '0')}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-xs font-medium text-slate-500">
                {t.kpiDailyTime}
              </div>
              <div className="mt-1.5 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {appState.schedule.dailyTime}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <div className="text-xs font-medium text-slate-500">
                {t.kpiNextRun}
              </div>
              <div className="mt-1.5 truncate font-mono text-base font-semibold text-slate-900 tabular-nums">
                {nextRunText}
              </div>
            </div>
          </div>
        )}

        {/* Main 2-Column Workspace Grid */}
        {appState && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <div className="min-w-0 space-y-6">
                <UploadPanel
                  t={t}
                  defaultPrivacy={appState.schedule.defaultPrivacy}
                  fileInputRef={fileInputRef}
                  onUploadComplete={(nextState) => {
                    setAppState(nextState);
                    setBannerSuccess(
                      lang === 'bn'
                        ? 'ভিডিওগুলো কিউতে যুক্ত হয়েছে।'
                        : 'Videos added to your Shorts queue.'
                    );
                  }}
                  onError={(msg) => setBannerError(msg)}
                />

                <QueueList
                  items={appState.queue}
                  schedule={appState.schedule}
                  t={t}
                  lang={lang}
                  onReorder={handleReorder}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onPreviewItem={(item) => setPreviewItem(item)}
                  onFocusUpload={() => fileInputRef.current?.click()}
                />
              </div>

              <ScheduleSidebar
                schedule={appState.schedule}
                t={t}
                lang={lang}
                isConnected={appState.auth.connected}
                hasPending={pendingCount > 0}
                isRunningCron={isRunningCron}
                callbackUri={callbackUri}
                onSaveSchedule={handleSaveSchedule}
                onRunCronNow={handleRunCronNow}
              />
            </div>

            <HistoryTable
              items={appState.queue}
              t={t}
              lang={lang}
              timezone={appState.schedule.timezone}
              onRequeue={handleRequeueItem}
            />
          </>
        )}
      </main>

      <VideoPreviewModal
        item={previewItem}
        t={t}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
