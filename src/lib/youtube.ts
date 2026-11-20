import { google } from 'googleapis';
import fs from 'fs';
import { Readable } from 'stream';
import {
  deleteVideoFile,
  getLocalVideoFilePath,
  readDatabaseState,
  writeDatabaseState,
} from './storage';
import { ShortQueueItem, VideoPrivacy } from './types';

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

export function getEffectiveBaseUrl(): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export function isAllowedRedirectUri(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    if (!parsed.pathname.endsWith('/api/auth/callback')) return false;
    const host = parsed.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.run.app') ||
      host.endsWith('.vercel.app')
    ) {
      return true;
    }
    if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
      const appUrl = new URL(process.env.APP_URL);
      return appUrl.origin === parsed.origin;
    }
    return false;
  } catch {
    return false;
  }
}

export function createOAuth2Client(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function buildGoogleAuthUrl(redirectUri: string, statePayload: string): string {
  const oauth2Client = createOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: YOUTUBE_SCOPES,
    state: statePayload,
  });
}

export async function exchangeCodeForYouTubeAuth(code: string, redirectUri: string) {
  const oauth2Client = createOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const channelRes = await youtube.channels.list({
    part: ['snippet'],
    mine: true,
  });

  const channel = channelRes.data.items?.[0];
  const channelId = channel?.id || undefined;
  const channelTitle = channel?.snippet?.title || 'YouTube Channel';
  const channelThumbnail =
    channel?.snippet?.thumbnails?.default?.url ||
    channel?.snippet?.thumbnails?.medium?.url ||
    undefined;

  const dbState = await readDatabaseState();
  dbState.auth = {
    connected: true,
    channelId,
    channelTitle,
    channelThumbnail,
    connectedAt: new Date().toISOString(),
    tokens: {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || dbState.auth.tokens?.refresh_token,
      expiry_date: tokens.expiry_date || undefined,
      scope: tokens.scope || undefined,
      token_type: tokens.token_type || undefined,
    },
  };
  await writeDatabaseState(dbState);

  return {
    channelId,
    channelTitle,
    channelThumbnail,
  };
}

async function getVideoReadableStream(item: ShortQueueItem): Promise<Readable> {
  if (item.storageType === 'local' && item.blobPathname) {
    const filePath = getLocalVideoFilePath(item.blobPathname);
    return fs.createReadStream(filePath);
  }

  const response = await fetch(item.blobUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download video from Blob storage (${response.status})`);
  }
  // Convert Web ReadableStream to Node.js Readable
  return Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream);
}

export async function uploadShortToYouTube(
  item: ShortQueueItem,
  fallbackPrivacy: VideoPrivacy,
  deleteBlobAfterUpload: boolean
): Promise<{ youtubeVideoId: string; youtubeUrl: string }> {
  const dbState = await readDatabaseState();
  if (!dbState.auth.connected || !dbState.auth.tokens) {
    throw new Error('YouTube account is not connected. Please authorize with Google/YouTube first.');
  }

  const redirectUri = `${getEffectiveBaseUrl()}/api/auth/callback`;
  const oauth2Client = createOAuth2Client(redirectUri);
  oauth2Client.setCredentials(dbState.auth.tokens);

  // Persist refreshed tokens automatically if Google issues a new access token
  oauth2Client.on('tokens', async (newTokens) => {
    try {
      const latest = await readDatabaseState();
      if (latest.auth.tokens) {
        latest.auth.tokens = {
          ...latest.auth.tokens,
          access_token: newTokens.access_token || latest.auth.tokens.access_token,
          refresh_token: newTokens.refresh_token || latest.auth.tokens.refresh_token,
          expiry_date: newTokens.expiry_date || latest.auth.tokens.expiry_date,
        };
        await writeDatabaseState(latest);
      }
    } catch (err) {
      console.error('Failed to persist refreshed OAuth tokens:', err);
    }
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const mediaStream = await getVideoReadableStream(item);

  const rawDesc = (item.description || '').trim();
  const hasShortsTag = /#shorts\b/i.test(item.title) || /#shorts\b/i.test(rawDesc);
  const finalDescription = hasShortsTag
    ? rawDesc
    : rawDesc
    ? `${rawDesc}\n\n#Shorts`
    : '#Shorts';

  const finalTags = Array.from(
    new Set([...(item.tags || []), 'Shorts'].map((t) => t.trim()).filter(Boolean))
  );

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: item.title.slice(0, 100),
        description: finalDescription.slice(0, 5000),
        tags: finalTags.slice(0, 30),
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: item.privacyStatus || fallbackPrivacy || 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: item.mimeType || 'video/mp4',
      body: mediaStream,
    },
  });

  const youtubeVideoId = response.data.id;
  if (!youtubeVideoId) {
    throw new Error('YouTube API did not return a video ID.');
  }

  const youtubeUrl = `https://youtube.com/shorts/${youtubeVideoId}`;

  if (deleteBlobAfterUpload) {
    await deleteVideoFile(item);
  }

  return { youtubeVideoId, youtubeUrl };
}
