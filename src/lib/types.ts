export type Language = 'en' | 'bn';

export type VideoPrivacy = 'public' | 'unlisted' | 'private';

export type QueueItemStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export type StorageType = 'vercel-blob' | 'local';

export interface ShortQueueItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: VideoPrivacy;
  fileName: string;
  fileSize: number;
  mimeType: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  blobUrl: string;
  blobPathname?: string;
  storageType: StorageType;
  order: number;
  status: QueueItemStatus;
  createdAt: string;
  uploadedAt?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  errorMessage?: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  dailyTime: string; // HH:mm 24-hour format, e.g. "10:00"
  timezone: string; // IANA timezone, e.g. "Asia/Dhaka"
  defaultPrivacy: VideoPrivacy;
  deleteBlobAfterUpload: boolean;
  lastCronRunAt?: string;
  lastCronResult?: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
}

export interface YouTubeAuthState {
  connected: boolean;
  channelId?: string;
  channelTitle?: string;
  channelThumbnail?: string;
  connectedAt?: string;
  tokens?: OAuthTokens;
}

export interface AppDatabaseState {
  queue: ShortQueueItem[];
  schedule: ScheduleConfig;
  auth: YouTubeAuthState;
}

export interface EnvStatus {
  hasGoogleClientId: boolean;
  hasGoogleClientSecret: boolean;
  hasBlobToken: boolean;
  hasCronSecret: boolean;
}

export interface PublicAppState {
  queue: ShortQueueItem[];
  schedule: ScheduleConfig;
  auth: Omit<YouTubeAuthState, 'tokens'>;
  storageMode: StorageType;
  envStatus: EnvStatus;
}
