'use client';

import React, { useRef, useState } from 'react';
import { Upload, Film, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Translations } from '@/lib/i18n';
import { formatDuration, formatFileSize } from '@/lib/schedule';
import { PublicAppState, VideoPrivacy } from '@/lib/types';

interface StagedVideo {
  localId: string;
  file: File;
  title: string;
  description: string;
  tags: string;
  privacyStatus: VideoPrivacy;
  durationSeconds?: number;
  width?: number;
  height?: number;
  previewObjectUrl: string;
}

interface UploadPanelProps {
  t: Translations;
  defaultPrivacy: VideoPrivacy;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadComplete: (nextState: PublicAppState) => void;
  onError: (msg: string) => void;
}

async function probeVideoMetadata(
  file: File
): Promise<{ durationSeconds?: number; width?: number; height?: number; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };

    video.onloadedmetadata = () => {
      const durationSeconds = Number.isFinite(video.duration)
        ? Math.round(video.duration)
        : undefined;
      const width = video.videoWidth || undefined;
      const height = video.videoHeight || undefined;
      cleanup();
      resolve({ durationSeconds, width, height, objectUrl });
    };

    video.onerror = () => {
      cleanup();
      resolve({ objectUrl });
    };

    video.src = objectUrl;
  });
}

export function UploadPanel({
  t,
  defaultPrivacy,
  fileInputRef,
  onUploadComplete,
  onError,
}: UploadPanelProps) {
  const [staged, setStaged] = useState<StagedVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);
  const dropCounterRef = useRef(0);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter(
      (f) =>
        f.type.startsWith('video/') ||
        /\.(mp4|mov|webm|m4v)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      onError('Please select valid video files (.mp4, .mov, .webm).');
      return;
    }

    const newEntries = await Promise.all(
      validFiles.map(async (file) => {
        const meta = await probeVideoMetadata(file);
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .trim();

        return {
          localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          title: cleanName || 'New YouTube Short',
          description: '',
          tags: 'shorts, youtube',
          privacyStatus: defaultPrivacy,
          durationSeconds: meta.durationSeconds,
          width: meta.width,
          height: meta.height,
          previewObjectUrl: meta.objectUrl,
        } satisfies StagedVideo;
      })
    );

    setStaged((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateStagedItem = (
    localId: string,
    patch: Partial<Omit<StagedVideo, 'localId' | 'file' | 'previewObjectUrl'>>
  ) => {
    setStaged((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  };

  const removeStagedItem = (localId: string) => {
    setStaged((prev) => {
      const target = prev.find((i) => i.localId === localId);
      if (target) URL.revokeObjectURL(target.previewObjectUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  };

  const clearAllStaged = () => {
    staged.forEach((item) => URL.revokeObjectURL(item.previewObjectUrl));
    setStaged([]);
  };

  const handleUploadAll = async () => {
    if (staged.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadIndex(0);

    let latestState: PublicAppState | null = null;
    const remaining: StagedVideo[] = [];

    for (let i = 0; i < staged.length; i++) {
      const item = staged[i];
      setUploadIndex(i + 1);

      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('title', item.title.trim() || item.file.name);
      formData.append('description', item.description.trim());
      formData.append('tags', item.tags);
      formData.append('privacyStatus', item.privacyStatus);
      if (item.durationSeconds) {
        formData.append('durationSeconds', String(item.durationSeconds));
      }
      if (item.width) formData.append('width', String(item.width));
      if (item.height) formData.append('height', String(item.height));

      try {
        const res = await fetch('/api/videos/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Upload failed for ${item.file.name}`);
        }
        latestState = data.state as PublicAppState;
        URL.revokeObjectURL(item.previewObjectUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        onError(message);
        remaining.push(item);
      }
    }

    setStaged(remaining);
    setIsUploading(false);
    setUploadIndex(0);

    if (latestState) {
      onUploadComplete(latestState);
    }
  };

  return (
    <section
      id="upload-section"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t.uploadSectionTitle}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">{t.uploadSectionDesc}</p>
        </div>
        <span className="text-xs text-slate-500">{t.shortsTip}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        multiple
        className="hidden"
        onChange={(e) => void addFiles(e.target.files)}
      />

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dropCounterRef.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dropCounterRef.current -= 1;
          if (dropCounterRef.current <= 0) {
            dropCounterRef.current = 0;
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          dropCounterRef.current = 0;
          setIsDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors ${
          isDragging
            ? 'border-rose-500 bg-rose-50/50'
            : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
        }`}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-900">{t.dropzoneTitle}</p>
        <p className="mt-1 text-xs text-slate-500">{t.dropzoneHint}</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          <Film className="h-4 w-4 text-slate-500" />
          <span>{t.browseFiles}</span>
        </button>
      </div>

      {staged.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
              {staged.length} {t.stagedFilesCount}
            </span>
            <button
              type="button"
              onClick={clearAllStaged}
              disabled={isUploading}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              {t.clearStaged}
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {staged.map((item) => {
              const isHorizontal =
                item.width && item.height && item.width > item.height;
              const isTooLong =
                item.durationSeconds && item.durationSeconds > 60;

              return (
                <div
                  key={item.localId}
                  className="grid grid-cols-1 gap-4 py-4 md:grid-cols-[80px_1fr]"
                >
                  <div className="relative flex aspect-[9/16] w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                    <video
                      src={item.previewObjectUrl}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {item.file.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500 tabular-nums">
                          <span>{formatFileSize(item.file.size)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDuration(item.durationSeconds)}</span>
                          {item.width && item.height && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                {item.width}×{item.height}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStagedItem(item.localId)}
                        disabled={isUploading}
                        aria-label={t.removeStaged}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {(isHorizontal || isTooLong) && (
                      <div className="flex flex-col gap-1 text-xs text-amber-700">
                        {isHorizontal && (
                          <span className="inline-flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>{t.aspectRatioWarning}</span>
                          </span>
                        )}
                        {isTooLong && (
                          <span className="inline-flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>{t.durationWarning}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                          {t.videoTitleLabel}
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            updateStagedItem(item.localId, {
                              title: e.target.value,
                            })
                          }
                          placeholder={t.videoTitlePlaceholder}
                          disabled={isUploading}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                          {t.videoTagsLabel}
                        </label>
                        <input
                          type="text"
                          value={item.tags}
                          onChange={(e) =>
                            updateStagedItem(item.localId, {
                              tags: e.target.value,
                            })
                          }
                          placeholder={t.videoTagsPlaceholder}
                          disabled={isUploading}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                          {t.videoDescLabel}
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateStagedItem(item.localId, {
                              description: e.target.value,
                            })
                          }
                          placeholder={t.videoDescPlaceholder}
                          disabled={isUploading}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">
                          {t.privacyLabel}
                        </label>
                        <select
                          value={item.privacyStatus}
                          onChange={(e) =>
                            updateStagedItem(item.localId, {
                              privacyStatus: e.target.value as VideoPrivacy,
                            })
                          }
                          disabled={isUploading}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="public">{t.privacyPublic}</option>
                          <option value="unlisted">{t.privacyUnlisted}</option>
                          <option value="private">{t.privacyPrivate}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleUploadAll}
              disabled={isUploading}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="tabular-nums">
                    {t.uploadingProgress} ({uploadIndex}/{staged.length})
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>{t.uploadAllBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
