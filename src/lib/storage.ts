import { put, del, list } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import {
  AppDatabaseState,
  EnvStatus,
  PublicAppState,
  ShortQueueItem,
  StorageType,
} from './types';

const STATE_BLOB_PATH = 'shorts-scheduler/state.json';
const LOCAL_DIR = path.join(process.cwd(), '.local-storage');
const LOCAL_VIDEOS_DIR = path.join(LOCAL_DIR, 'videos');
const LOCAL_STATE_FILE = path.join(LOCAL_DIR, 'state.json');

export function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.trim());
}

export function getStorageMode(): StorageType {
  return hasBlobToken() ? 'vercel-blob' : 'local';
}

export function getEnvStatus(): EnvStatus {
  return {
    hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
    hasGoogleClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
    hasBlobToken: hasBlobToken(),
    hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
  };
}

export function createDefaultState(): AppDatabaseState {
  return {
    queue: [],
    schedule: {
      enabled: true,
      dailyTime: '10:00',
      timezone: 'Asia/Dhaka',
      defaultPrivacy: 'public',
      deleteBlobAfterUpload: true,
    },
    auth: {
      connected: false,
    },
  };
}

function normalizeQueueOrders(queue: ShortQueueItem[]): ShortQueueItem[] {
  const pending = queue
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.order - b.order)
    .map((item, idx) => ({ ...item, order: idx + 1 }));

  const nonPending = queue.filter((item) => item.status !== 'pending');
  return [...pending, ...nonPending];
}

export async function readDatabaseState(): Promise<AppDatabaseState> {
  if (hasBlobToken()) {
    try {
      const { blobs } = await list({ prefix: STATE_BLOB_PATH, limit: 5 });
      const exact = blobs.find((b) => b.pathname === STATE_BLOB_PATH) || blobs[0];
      if (!exact) {
        return createDefaultState();
      }
      const res = await fetch(`${exact.url}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        return createDefaultState();
      }
      const parsed = (await res.json()) as Partial<AppDatabaseState>;
      const defaults = createDefaultState();
      return {
        queue: normalizeQueueOrders(parsed.queue || []),
        schedule: { ...defaults.schedule, ...(parsed.schedule || {}) },
        auth: { ...defaults.auth, ...(parsed.auth || {}) },
      };
    } catch (error) {
      console.error('Failed to read state from Vercel Blob:', error);
      return createDefaultState();
    }
  }

  // Local preview disk storage fallback
  try {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    const raw = await fs.readFile(LOCAL_STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppDatabaseState>;
    const defaults = createDefaultState();
    return {
      queue: normalizeQueueOrders(parsed.queue || []),
      schedule: { ...defaults.schedule, ...(parsed.schedule || {}) },
      auth: { ...defaults.auth, ...(parsed.auth || {}) },
    };
  } catch {
    return createDefaultState();
  }
}

export async function writeDatabaseState(state: AppDatabaseState): Promise<AppDatabaseState> {
  const normalized: AppDatabaseState = {
    ...state,
    queue: normalizeQueueOrders(state.queue),
  };

  if (hasBlobToken()) {
    await put(STATE_BLOB_PATH, JSON.stringify(normalized, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return normalized;
  }

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(LOCAL_STATE_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

export async function saveVideoFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<{ url: string; pathname: string; storageType: StorageType }> {
  const safeBase = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}-${safeBase}`;

  if (hasBlobToken()) {
    const pathname = `shorts-videos/${uniqueName}`;
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: contentType || 'video/mp4',
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      storageType: 'vercel-blob',
    };
  }

  await fs.mkdir(LOCAL_VIDEOS_DIR, { recursive: true });
  const filePath = path.join(LOCAL_VIDEOS_DIR, uniqueName);
  await fs.writeFile(filePath, buffer);
  return {
    url: `/api/videos/local/${encodeURIComponent(uniqueName)}`,
    pathname: uniqueName,
    storageType: 'local',
  };
}

export async function deleteVideoFile(item: Pick<ShortQueueItem, 'blobUrl' | 'blobPathname' | 'storageType'>): Promise<void> {
  try {
    if (item.storageType === 'vercel-blob' && hasBlobToken() && item.blobUrl) {
      await del(item.blobUrl);
      return;
    }
    if (item.storageType === 'local' && item.blobPathname) {
      const safeName = path.basename(item.blobPathname);
      const localPath = path.join(LOCAL_VIDEOS_DIR, safeName);
      await fs.unlink(localPath).catch(() => {});
    }
  } catch (error) {
    console.error('Failed to delete temporary video file:', error);
  }
}

export function getLocalVideoFilePath(filename: string): string {
  const safeName = path.basename(filename);
  return path.join(LOCAL_VIDEOS_DIR, safeName);
}

export function toPublicAppState(state: AppDatabaseState): PublicAppState {
  const { tokens: _removedTokens, ...safeAuth } = state.auth;
  return {
    queue: state.queue,
    schedule: state.schedule,
    auth: safeAuth,
    storageMode: getStorageMode(),
    envStatus: getEnvStatus(),
  };
}
