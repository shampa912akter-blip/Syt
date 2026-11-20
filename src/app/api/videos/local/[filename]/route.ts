import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import fsp from 'fs/promises';
import { getLocalVideoFilePath } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

export async function GET(
  req: NextRequest,
  context: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(context.params.filename);
    const filePath = getLocalVideoFilePath(filename);
    const stat = await fsp.stat(filePath).catch(() => null);

    if (!stat) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const totalSize = stat.size;
    const contentType = getMimeType(filename);
    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
      const start = match ? Number.parseInt(match[1], 10) : 0;
      const end = match && match[2] ? Number.parseInt(match[2], 10) : totalSize - 1;
      const clampedEnd = Math.min(end, totalSize - 1);
      const chunkSize = clampedEnd - start + 1;

      const nodeStream = fs.createReadStream(filePath, { start, end: clampedEnd });
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on('data', (chunk) => controller.enqueue(chunk));
          nodeStream.on('end', () => controller.close());
          nodeStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${clampedEnd}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
        },
      });
    }

    const nodeStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(totalSize),
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('GET /api/videos/local error:', error);
    return NextResponse.json({ error: 'Failed to stream local video' }, { status: 500 });
  }
}
