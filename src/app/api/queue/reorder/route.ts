import { NextRequest, NextResponse } from 'next/server';
import {
  readDatabaseState,
  toPublicAppState,
  writeDatabaseState,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { orderedIds?: string[] };
    if (!Array.isArray(body.orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    const state = await readDatabaseState();
    const orderMap = new Map<string, number>();
    body.orderedIds.forEach((id, idx) => {
      orderMap.set(id, idx + 1);
    });

    let fallbackOrder = body.orderedIds.length + 1;
    state.queue = state.queue.map((item) => {
      if (item.status !== 'pending') return item;
      const assigned = orderMap.get(item.id);
      if (assigned !== undefined) {
        return { ...item, order: assigned };
      }
      return { ...item, order: fallbackOrder++ };
    });

    const saved = await writeDatabaseState(state);
    return NextResponse.json(toPublicAppState(saved));
  } catch (error) {
    console.error('POST /api/queue/reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder queue' },
      { status: 500 }
    );
  }
}
