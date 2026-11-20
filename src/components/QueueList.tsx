'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Play,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Translations } from '@/lib/i18n';
import {
  formatDuration,
  formatFileSize,
  formatScheduledDateTime,
  getScheduledDateForQueueIndex,
} from '@/lib/schedule';
import {
  Language,
  ScheduleConfig,
  ShortQueueItem,
  VideoPrivacy,
} from '@/lib/types';

interface QueueListProps {
  items: ShortQueueItem[];
  schedule: ScheduleConfig;
  t: Translations;
  lang: Language;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onUpdateItem: (
    id: string,
    patch: {
      title: string;
      description: string;
      tags: string[];
      privacyStatus: VideoPrivacy;
    }
  ) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onPreviewItem: (item: ShortQueueItem) => void;
  onFocusUpload: () => void;
}

export function QueueList({
  items,
  schedule,
  t,
  lang,
  onReorder,
  onUpdateItem,
  onDeleteItem,
  onPreviewItem,
  onFocusUpload,
}: QueueListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<VideoPrivacy>('public');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingItems = [...items]
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.order - b.order);

  const moveByIndex = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pendingItems.length || fromIndex === toIndex) {
      return;
    }
    const next = [...pendingItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    await onReorder(next.map((item) => item.id));
  };

  const handleDropOnRow = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const fromIndex = pendingItems.findIndex((i) => i.id === draggedId);
    const toIndex = pendingItems.findIndex((i) => i.id === targetId);
    setDraggedId(null);
    setDragOverId(null);
    await moveByIndex(fromIndex, toIndex);
  };

  const startEdit = (item: ShortQueueItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description || '');
    setEditTags(item.tags.join(', '));
    setEditPrivacy(item.privacyStatus);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    setBusyId(id);
    try {
      await onUpdateItem(id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        tags: editTags
          .split(',')
          .map((tag) => tag.trim().replace(/^#/, ''))
          .filter(Boolean),
        privacyStatus: editPrivacy,
      });
      setEditingId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await onDeleteItem(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      id="queue-section"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t.queueSectionTitle}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">{t.queueSectionDesc}</p>
        </div>
        {pendingItems.length > 0 && (
          <span className="text-xs text-slate-500">{t.dragHint}</span>
        )}
      </div>

      {pendingItems.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-800">
            {t.emptyQueueTitle}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {t.emptyQueueDesc}
          </p>
          <button
            type="button"
            onClick={onFocusUpload}
            className="mt-4 inline-flex min-h-[40px] items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
          >
            {t.emptyQueueAction}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {pendingItems.map((item, idx) => {
            const scheduledDate = getScheduledDateForQueueIndex(
              idx,
              schedule.dailyTime,
              schedule.timezone
            );
            const formattedSchedule = formatScheduledDateTime(
              scheduledDate,
              schedule.timezone,
              lang
            );
            const isEditing = editingId === item.id;
            const isDraggingThis = draggedId === item.id;
            const isDragTarget = dragOverId === item.id && draggedId !== item.id;

            return (
              <div
                key={item.id}
                draggable={!isEditing}
                onDragStart={() => setDraggedId(item.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== item.id) setDragOverId(item.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === item.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleDropOnRow(item.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                className={`flex flex-col gap-4 px-5 py-4 transition-colors sm:flex-row sm:items-center ${
                  isDraggingThis ? 'bg-slate-50 opacity-60' : ''
                } ${isDragTarget ? 'bg-rose-50/60' : 'hover:bg-slate-50/70'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-6 cursor-grab items-center justify-center text-slate-400 hover:text-slate-700 active:cursor-grabbing"
                    title={t.dragHint}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <span
                    className={`w-7 font-mono text-sm font-semibold tabular-nums ${
                      idx === 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <button
                    type="button"
                    onClick={() => onPreviewItem(item)}
                    aria-label={t.previewVideo}
                    className="group relative flex h-16 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-950"
                  >
                    <video
                      src={item.blobUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
                    />
                    <Play className="absolute h-4 w-4 text-white drop-shadow" />
                  </button>
                </div>

                {isEditing ? (
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder={t.videoTitlePlaceholder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder={t.videoTagsPlaceholder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_140px]">
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder={t.videoDescPlaceholder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
                      />
                      <select
                        value={editPrivacy}
                        onChange={(e) =>
                          setEditPrivacy(e.target.value as VideoPrivacy)
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
                      >
                        <option value="public">{t.privacyPublic}</option>
                        <option value="unlisted">{t.privacyUnlisted}</option>
                        <option value="private">{t.privacyPrivate}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(item.id)}
                        disabled={busyId === item.id}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{t.saveChanges}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>{t.cancel}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <span className="shrink-0 font-mono text-xs text-slate-600 tabular-nums">
                        {t.scheduledFor}: {formattedSchedule}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">
                        {formatDuration(item.durationSeconds)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatFileSize(item.fileSize)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.privacyStatus}</span>
                      {item.tags.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">
                            {item.tags.map((tag) => `#${tag}`).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void moveByIndex(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label={t.moveUp}
                      title={t.moveUp}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveByIndex(idx, idx + 1)}
                      disabled={idx === pendingItems.length - 1}
                      aria-label={t.moveDown}
                      title={t.moveDown}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      aria-label={t.editMetadata}
                      title={t.editMetadata}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={busyId === item.id}
                      aria-label={t.deleteVideo}
                      title={t.deleteVideo}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
