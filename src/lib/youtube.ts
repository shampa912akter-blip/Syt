import fs from 'fs/promises';
import {
  deleteVideoFile,
  getLocalVideoFilePath,
  readDatabaseState,
  writeDatabaseState,
} from './storage';
import { AppDatabaseState, ShortQueueItem, VideoPrivacy } from './types';

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

function getClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables'
    );
  }
  return { clientId, clientSecret };
}

export function buildGoogleAuthUrl(
  redirectUri: string,
  statePayload: string
): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: statePayload,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCodeForYouTubeAuth(
  code: string,
  redirectUri: string
) {
  const { clientId, clientSecret } = getClientCredentials();

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(
      tokenData.error_description ||
        tokenData.error ||
        'Failed to exchange authorization code'
    );
  }

  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }
  );

  let channelId: string | undefined;
  let channelTitle = 'YouTube Channel';
  let channelThumbnail: string | undefined;

  if (channelRes.ok) {
    const channelData = (await channelRes.json()) as {
      items?: Array<{
        id?: string;
        snippet?: {
          title?: string;
          thumbnails?: {
            default?: { url?: string };
            medium?: { url?: string };
          };
        };
      }>;
    };
    const channel = channelData.items?.[0];
    channelId = channel?.id;
    channelTitle = channel?.snippet?.title || channelTitle;
    channelThumbnail =
      channel?.snippet?.thumbnails?.default?.url ||
      channel?.snippet?.thumbnails?.medium?.url;
  }

  const expiryDate = tokenData.expires_in
    ? Date.now() + tokenData.expires_in * 1000
    : undefined;

  const dbState = await readDatabaseState();
  dbState.auth = {
    connected: true,
    channelId,
    channelTitle,
    channelThumbnail,
    connectedAt: new Date().toISOString(),
    tokens: {
      access_token: tokenData.access_token,
      refresh_token:
        tokenData.refresh_token || dbState.auth.tokens?.refresh_token,
      expiry_date: expiryDate,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
    },
  };
  await writeDatabaseState(dbState);

  return {
    channelId,
    channelTitle,
    channelThumbnail,
  };
}

async function getValidAccessToken(dbState: AppDatabaseState): Promise<string> {
  const tokens = dbState.auth.tokens;
  if (!tokens?.access_token && !tokens?.refresh_token) {
    throw new Error('YouTube OAuth tokens are missing. Please reconnect.');
  }

  const needsRefresh =
    !tokens.access_token ||
    (tokens.expiry_date !== undefined && Date.now() > tokens.expiry_date - 60_000);

  if (!needsRefresh && tokens.access_token) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    if (tokens.access_token) return tokens.access_token;
    throw new Error('OAuth refresh token missing. Please reconnect YouTube.');
  }

  const { clientId, clientSecret } = getClientCredentials();
  const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const refreshData = (await refreshRes.json()) as GoogleTokenResponse;
  if (!refreshRes.ok || !refreshData.access_token) {
    throw new Error(
      refreshData.error_description ||
        refreshData.error ||
        'Failed to refresh YouTube access token'
    );
  }

  dbState.auth.tokens = {
    ...tokens,
    access_token: refreshData.access_token,
    expiry_date: refreshData.expires_in
      ? Date.now() + refreshData.expires_in * 1000
      : undefined,
  };
  await writeDatabaseState(dbState);

  return refreshData.access_token;
}

async function loadVideoBuffer(item: ShortQueueItem): Promise<Buffer> {
  if (item.storageType === 'local' && item.blobPathname) {
    const filePath = getLocalVideoFilePath(item.blobPathname);
    return fs.readFile(filePath);
  }

  const response = await fetch(item.blobUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download video from Blob storage (${response.status})`
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function uploadShortToYouTube(
  item: ShortQueueItem,
  fallbackPrivacy: VideoPrivacy,
  deleteBlobAfterUpload: boolean
): Promise<{ youtubeVideoId: string; youtubeUrl: string }> {
  const dbState = await readDatabaseState();
  if (!dbState.auth.connected || !dbState.auth.tokens) {
    throw new Error(
      'YouTube account is not connected. Please authorize with Google/YouTube first.'
    );
  }

  const accessToken = await getValidAccessToken(dbState);
  const videoBuffer = await loadVideoBuffer(item);
  const mimeType = item.mimeType || 'video/mp4';

  const rawDesc = (item.description || '').trim();
  const hasShortsTag =
    /#shorts\b/i.test(item.title) || /#shorts\b/i.test(rawDesc);
  const finalDescription = hasShortsTag
    ? rawDesc
    : rawDesc
    ? `${rawDesc}\n\n#Shorts`
    : '#Shorts';

  const finalTags = Array.from(
    new Set(
      [...(item.tags || []), 'Shorts'].map((t) => t.trim()).filter(Boolean)
    )
  );

  // Step 1: Initiate YouTube Data API v3 Resumable Upload session
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(videoBuffer.byteLength),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify({
        snippet: {
          title: item.title.slice(0, 100),
          description: finalDescription.slice(0, 5000),
          tags: finalTags.slice(0, 30),
          categoryId: '22',
        },
        status: {
          privacyStatus: item.privacyStatus || fallbackPrivacy || 'public',
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`YouTube upload init failed (${initRes.status}): ${errText}`);
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) {
    throw new Error('YouTube API did not return resumable upload location.');
  }

  // Step 2: Upload the video binary payload
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(videoBuffer.byteLength),
      'Content-Type': mimeType,
    },
    body: new Uint8Array(videoBuffer),
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(
      `YouTube video upload failed (${uploadRes.status}): ${errText}`
    );
  }

  const uploadedData = (await uploadRes.json()) as { id?: string };
  const youtubeVideoId = uploadedData.id;
  if (!youtubeVideoId) {
    throw new Error('YouTube API did not return a video ID.');
  }

  const youtubeUrl = `https://youtube.com/shorts/${youtubeVideoId}`;

  if (deleteBlobAfterUpload) {
    await deleteVideoFile(item);
  }

  return { youtubeVideoId, youtubeUrl };
}
