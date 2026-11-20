import { NextRequest, NextResponse } from 'next/server';
import {
  readDatabaseState,
  toPublicAppState,
  writeDatabaseState,
} from '@/lib/storage';
import { uploadShortToYouTube } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

async function executeScheduledUpload(force: boolean) {
  const state = await readDatabaseState();

  if (!force && !state.schedule.enabled) {
    return NextResponse.json({
      skipped: true,
      reason: 'Auto-upload schedule is paused.',
      state: toPublicAppState(state),
    });
  }

  const nextItem = state.queue
    .filter((item) => item.status === 'pending')
    .sort((a, b) => a.order - b.order)[0];

  if (!nextItem) {
    state.schedule.lastCronRunAt = new Date().toISOString();
    state.schedule.lastCronResult = 'No pending videos in queue';
    const saved = await writeDatabaseState(state);
    return NextResponse.json({
      skipped: true,
      reason: 'No pending videos in queue.',
      state: toPublicAppState(saved),
    });
  }

  if (!state.auth.connected || !state.auth.tokens) {
    const errMsg = 'YouTube account is not connected.';
    state.schedule.lastCronRunAt = new Date().toISOString();
    state.schedule.lastCronResult = errMsg;
    await writeDatabaseState(state);
    return NextResponse.json(
      { error: errMsg, state: toPublicAppState(state) },
      { status: 400 }
    );
  }

  // Mark uploading
  nextItem.status = 'uploading';
  await writeDatabaseState(state);

  try {
    const { youtubeVideoId, youtubeUrl } = await uploadShortToYouTube(
      nextItem,
      state.schedule.defaultPrivacy,
      state.schedule.deleteBlobAfterUpload
    );

    const latestState = await readDatabaseState();
    const target = latestState.queue.find((q) => q.id === nextItem.id);
    if (target) {
      target.status = 'uploaded';
      target.uploadedAt = new Date().toISOString();
      target.youtubeVideoId = youtubeVideoId;
      target.youtubeUrl = youtubeUrl;
      target.errorMessage = undefined;
    }
    latestState.schedule.lastCronRunAt = new Date().toISOString();
    latestState.schedule.lastCronResult = `Uploaded "${nextItem.title}" (${youtubeVideoId})`;
    const saved = await writeDatabaseState(latestState);

    return NextResponse.json({
      uploaded: true,
      youtubeVideoId,
      youtubeUrl,
      state: toPublicAppState(saved),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'YouTube upload failed';
    const latestState = await readDatabaseState();
    const target = latestState.queue.find((q) => q.id === nextItem.id);
    if (target) {
      target.status = 'failed';
      target.errorMessage = message;
    }
    latestState.schedule.lastCronRunAt = new Date().toISOString();
    latestState.schedule.lastCronResult = `Failed: ${message}`;
    const saved = await writeDatabaseState(latestState);

    return NextResponse.json(
      { error: message, state: toPublicAppState(saved) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const force = req.nextUrl.searchParams.get('force') === 'true';

  if (cronSecret && !force) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }
  }

  return executeScheduledUpload(force);
}

export async function POST() {
  return executeScheduledUpload(true);
}
