import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  readDatabaseState,
  saveVideoFile,
  toPublicAppState,
  writeDatabaseState,
} from '@/lib/storage';
import { ShortQueueItem, VideoPrivacy } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing video file in form data' },
        { status: 400 }
      );
    }

    const titleRaw = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const tagsRaw = String(formData.get('tags') || '');
    const privacyRaw = String(formData.get('privacyStatus') || 'public') as VideoPrivacy;
    const durationRaw = Number(formData.get('durationSeconds') || 0);
    const widthRaw = Number(formData.get('width') || 0);
    const heightRaw = Number(formData.get('height') || 0);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const savedFile = await saveVideoFile(
      buffer,
      file.name || 'short.mp4',
      file.type || 'video/mp4'
    );

    const state = await readDatabaseState();
    const maxOrder = state.queue
      .filter((item) => item.status === 'pending')
      .reduce((max, item) => Math.max(max, item.order), 0);

    const fallbackTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const validPrivacy: VideoPrivacy = ['public', 'unlisted', 'private'].includes(privacyRaw)
      ? privacyRaw
      : state.schedule.defaultPrivacy;

    const newItem: ShortQueueItem = {
      id: crypto.randomUUID(),
      title: titleRaw || fallbackTitle || 'Untitled Short',
      description,
      tags: tags.length > 0 ? tags : ['Shorts'],
      privacyStatus: validPrivacy,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'video/mp4',
      durationSeconds: durationRaw > 0 ? durationRaw : undefined,
      width: widthRaw > 0 ? widthRaw : undefined,
      height: heightRaw > 0 ? heightRaw : undefined,
      blobUrl: savedFile.url,
      blobPathname: savedFile.pathname,
      storageType: savedFile.storageType,
      order: maxOrder + 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    state.queue.push(newItem);
    const updated = await writeDatabaseState(state);

    return NextResponse.json({
      item: newItem,
      state: toPublicAppState(updated),
    });
  } catch (error) {
    console.error('POST /api/videos/upload error:', error);
    const message = error instanceof Error ? error.message : 'Video upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
