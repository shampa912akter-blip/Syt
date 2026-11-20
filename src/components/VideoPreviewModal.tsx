'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Translations } from '@/lib/i18n';
import { formatDuration, formatFileSize } from '@/lib/schedule';
import { ShortQueueItem } from '@/lib/types';

interface VideoPreviewModalProps {
  item: ShortQueueItem | null;
  t: Translations;
  onClose: () => void;
}

export function VideoPreviewModal({ item, t, onClose }: VideoPreviewModalProps) {
  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-slate-500 tabular-nums">
              <span>{formatDuration(item.durationSeconds)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(item.fileSize)}</span>
              <span aria-hidden="true">·</span>
              <span>{item.privacyStatus}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeModal}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-center bg-slate-950 p-4">
          <video
            src={item.blobUrl}
            controls
            autoPlay
            playsInline
            className="aspect-[9/16] max-h-[65vh] w-auto rounded-lg bg-black object-contain"
          />
        </div>

        {item.tags.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-600">
            {item.tags.map((tag) => `#${tag}`).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
