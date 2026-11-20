'use client';

import React, { useEffect, useState } from 'react';
import { Clock, PlayCircle, Copy, Check, Loader2 } from 'lucide-react';
import { Translations } from '@/lib/i18n';
import {
  TIMEZONE_OPTIONS,
  getUtcCronExpression,
} from '@/lib/schedule';
import { Language, ScheduleConfig, VideoPrivacy } from '@/lib/types';

interface ScheduleSidebarProps {
  schedule: ScheduleConfig;
  t: Translations;
  lang: Language;
  isConnected: boolean;
  hasPending: boolean;
  isRunningCron: boolean;
  callbackUri: string;
  onSaveSchedule: (patch: Partial<ScheduleConfig>) => Promise<void>;
  onRunCronNow: () => Promise<void>;
}

export function ScheduleSidebar({
  schedule,
  t,
  lang,
  isConnected,
  hasPending,
  isRunningCron,
  callbackUri,
  onSaveSchedule,
  onRunCronNow,
}: ScheduleSidebarProps) {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [dailyTime, setDailyTime] = useState(schedule.dailyTime);
  const [timezone, setTimezone] = useState(schedule.timezone);
  const [defaultPrivacy, setDefaultPrivacy] = useState<VideoPrivacy>(
    schedule.defaultPrivacy
  );
  const [deleteBlobAfterUpload, setDeleteBlobAfterUpload] = useState(
    schedule.deleteBlobAfterUpload
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  useEffect(() => {
    setEnabled(schedule.enabled);
    setDailyTime(schedule.dailyTime);
    setTimezone(schedule.timezone);
    setDefaultPrivacy(schedule.defaultPrivacy);
    setDeleteBlobAfterUpload(schedule.deleteBlobAfterUpload);
  }, [schedule]);

  const utcCron = getUtcCronExpression(dailyTime, timezone);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSchedule({
        enabled,
        dailyTime,
        timezone,
        defaultPrivacy,
        deleteBlobAfterUpload,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUri = async () => {
    if (!callbackUri) return;
    try {
      await navigator.clipboard.writeText(callbackUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <aside id="schedule-section" className="space-y-6">
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.scheduleSectionTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t.scheduleSectionDesc}
            </p>
          </div>
          <Clock className="h-5 w-5 shrink-0 text-slate-400" />
        </div>

        <div className="mt-5 space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
            <span className="text-sm font-medium text-slate-800">
              {t.enableAutoUpload}
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-rose-600"
            />
          </label>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              {t.dailyTimeLabel}
            </label>
            <input
              type="time"
              value={dailyTime}
              onChange={(e) => setDailyTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              {t.timezoneLabel}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {lang === 'bn' ? tz.labelBn : tz.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              {t.defaultPrivacyLabel}
            </label>
            <select
              value={defaultPrivacy}
              onChange={(e) =>
                setDefaultPrivacy(e.target.value as VideoPrivacy)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="public">{t.privacyPublic}</option>
              <option value="unlisted">{t.privacyUnlisted}</option>
              <option value="private">{t.privacyPrivate}</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={deleteBlobAfterUpload}
              onChange={(e) => setDeleteBlobAfterUpload(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-rose-600"
            />
            <span>{t.deleteBlobLabel}</span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? t.savingSchedule : t.saveScheduleBtn}
          </button>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              {t.cronExpressionLabel}
            </span>
            <code className="font-mono font-semibold text-slate-900 tabular-nums">
              {utcCron}
            </code>
          </div>
          <p className="mt-1 text-xs text-slate-500">{t.cronHelperText}</p>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => void onRunCronNow()}
            disabled={!isConnected || !hasPending || isRunningCron}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isRunningCron ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.runningCronNow}</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                <span>{t.runCronNowBtn}</span>
              </>
            )}
          </button>

          <div className="mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {t.lastRunLabel}:{' '}
            </span>
            <span>
              {schedule.lastCronResult ? schedule.lastCronResult : t.neverRun}
            </span>
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800">
            {t.callbackUrlLabel}
          </span>
          <button
            type="button"
            onClick={() => void handleCopyUri()}
            className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
          >
            {copiedUri ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{t.copyUrl}</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-2 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
          {callbackUri || '/api/auth/callback'}
        </p>
      </div>
    </aside>
  );
}
