import { NextResponse } from 'next/server';
import {
  readDatabaseState,
  toPublicAppState,
  writeDatabaseState,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const state = await readDatabaseState();
    state.auth = { connected: false };
    const saved = await writeDatabaseState(state);

    const response = NextResponse.json(toPublicAppState(saved));
    response.cookies.delete('shortsflow_yt_connected');
    return response;
  } catch (error) {
    console.error('POST /api/auth/disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect YouTube account' },
      { status: 500 }
    );
  }
}
