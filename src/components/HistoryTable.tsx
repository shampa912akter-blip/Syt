'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, ExternalLink, RotateCcw, Loader2 } from 'lucide-react';
import { Translations } from '@/lib/i18n';
import { formatFileSize } from '@/lib/schedule';
import { Language, ShortQueueItem } from '@/lib/types';

interface HistoryTableProps {
  items: ShortQueueItem[];
  t: Translations;
  lang: Language;
  timezone: string;
  onRequeue: (id: string) => Promise<void>;
}

type HistoryFilter = 'all' | 'uploaded' | 'failed';

export function HistoryTable({
  items,
  t,
  lang,
  timezone,
  onRequeue,
}: HistoryTableProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const historyItems = useMemo(() => {
    return items
      .filter((item) => item.status === 'uploaded' || item.status === 'failed' || item.status === 'uploading')
      .filter((item) => {
        if (filter === 'all') return true;
        return item.status === filter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.createdAt).getTime();
        const dateB = new Date(b.uploadedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [items, filter]);

  const formatTimestamp = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone || 'UTC',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return d.toLocaleString(locale);
    }
  };

  const handleRetry = async (id: string) => {
    setBusyId(id);
    try {
      await onRequeue(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      id="history-section"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t.historySectionTitle}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {t.historySectionDesc}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              { key: 'all', label: t.filterAll },
              { key: 'uploaded', label: t.filterUploaded },
              { key: 'failed', label: t.filterFailed },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`min-h-[34px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {historyItems.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">
            {t.emptyHistoryTitle}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {t.emptyHistoryDesc}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-6 py-3">{t.colVideo}</th>
                <th className="px-4 py-3">{t.colStatus}</th>
                <th className="px-4 py-3">{t.colUploadedAt}</th>
                <th className="px-4 py-3">{t.colYouTubeLink}</th>
                <th className="px-6 py-3 text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyItems.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="max-w-xs px-6 py-3">
                    <div className="truncate font-medium text-slate-900">
                      {item.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {formatFileSize(item.fileSize)}
                      {item.tags.length > 0 && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{item.tags.slice(0, 3).map((tag) => `#${tag}`).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {item.status === 'uploaded' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{t.statusUploaded}</span>
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        <span>{t.statusUploading}</span>
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{t.statusFailed}</span>
                        </span>
                        {item.errorMessage && (
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-rose-600" title={item.errorMessage}>
                            {item.errorMessage}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600 tabular-nums">
                    {formatTimestamp(item.uploadedAt || item.createdAt)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {item.youtubeUrl ? (
                      <a
                        href={item.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        <span>{t.openShort}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-3 text-right">
                    {item.status === 'failed' ? (
                      <button
                        type="button"
                        onClick={() => handleRetry(item.id)}
                        disabled={busyId === item.id}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{t.retryUpload}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
