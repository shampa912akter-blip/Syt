import { NextRequest, NextResponse } from 'next/server';
import {
  readDatabaseState,
  toPublicAppState,
  writeDatabaseState,
} from '@/lib/storage';
import { ScheduleConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ScheduleConfig>;
    const state = await readDatabaseState();

    state.schedule = {
      ...state.schedule,
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      ...(typeof body.dailyTime === 'string' && /^\d{2}:\d{2}$/.test(body.dailyTime)
        ? { dailyTime: body.dailyTime }
        : {}),
      ...(typeof body.timezone === 'string' && body.timezone.trim()
        ? { timezone: body.timezone.trim() }
        : {}),
      ...(body.defaultPrivacy &&
      ['public', 'unlisted', 'private'].includes(body.defaultPrivacy)
        ? { defaultPrivacy: body.defaultPrivacy }
        : {}),
      ...(typeof body.deleteBlobAfterUpload === 'boolean'
        ? { deleteBlobAfterUpload: body.deleteBlobAfterUpload }
        : {}),
    };

    const saved = await writeDatabaseState(state);
    return NextResponse.json(toPublicAppState(saved));
  } catch (error) {
    console.error('PATCH /api/schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule configuration' },
      { status: 500 }
    );
  }
}
