import { NextResponse } from 'next/server';
import { readDatabaseState, toPublicAppState } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await readDatabaseState();
    return NextResponse.json(toPublicAppState(state));
  } catch (error) {
    console.error('GET /api/state error:', error);
    return NextResponse.json(
      { error: 'Failed to load scheduler state' },
      { status: 500 }
    );
  }
}
