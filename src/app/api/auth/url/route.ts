import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthUrl,
  getEffectiveBaseUrl,
  isAllowedRedirectUri,
} from '@/lib/youtube';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        {
          error:
            'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.',
        },
        { status: 400 }
      );
    }

    const requestedRedirect = req.nextUrl.searchParams.get('redirect_uri');
    const fallbackRedirect = `${getEffectiveBaseUrl()}/api/auth/callback`;
    const redirectUri =
      requestedRedirect && isAllowedRedirectUri(requestedRedirect)
        ? requestedRedirect
        : fallbackRedirect;

    const statePayload = Buffer.from(
      JSON.stringify({ redirectUri, ts: Date.now() }),
      'utf-8'
    ).toString('base64url');

    const url = buildGoogleAuthUrl(redirectUri, statePayload);
    return NextResponse.json({ url, redirectUri });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build OAuth URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
