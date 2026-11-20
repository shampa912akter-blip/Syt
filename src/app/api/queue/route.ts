import { NextRequest, NextResponse } from 'next/server';
import {
  deleteVideoFile,
  readDatabaseState,
  toPublicAppState,
  writeDatabaseState,
} from '@/lib/storage';
import { VideoPrivacy } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id?: string;
      title?: string;
      description?: string;
      tags?: string[];
      privacyStatus?: VideoPrivacy;
      requeue?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
    }

    const state = await readDatabaseState();
    const target = state.queue.find((item) => item.id === body.id);
    if (!target) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    if (typeof body.title === 'string' && body.title.trim()) {
      target.title = body.title.trim();
    }
    if (typeof body.description === 'string') {
      target.description = body.description.trim();
    }
    if (Array.isArray(body.tags)) {
      target.tags = body.tags.map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    }
    if (
      body.privacyStatus &&
      ['public', 'unlisted', 'private'].includes(body.privacyStatus)
    ) {
      target.privacyStatus = body.privacyStatus;
    }
    if (body.requeue) {
      const maxOrder = state.queue
        .filter((item) => item.status === 'pending')
        .reduce((max, item) => Math.max(max, item.order), 0);
      target.status = 'pending';
      target.order = maxOrder + 1;
      target.errorMessage = undefined;
    }

    const saved = await writeDatabaseState(state);
    return NextResponse.json(toPublicAppState(saved));
  } catch (error) {
    console.error('PATCH /api/queue error:', error);
    return NextResponse.json({ error: 'Failed to update queue item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing item id' }, { status: 400 });
    }

    const state = await readDatabaseState();
    const target = state.queue.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    await deleteVideoFile(target);
    state.queue = state.queue.filter((item) => item.id !== id);
    const saved = await writeDatabaseState(state);
    return NextResponse.json(toPublicAppState(saved));
  } catch (error) {
    console.error('DELETE /api/queue error:', error);
    return NextResponse.json({ error: 'Failed to delete queue item' }, { status: 500 });
  }
}
