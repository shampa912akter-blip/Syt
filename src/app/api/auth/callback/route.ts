import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForYouTubeAuth,
  getEffectiveBaseUrl,
  isAllowedRedirectUri,
} from '@/lib/youtube';

export const dynamic = 'force-dynamic';

function renderPopupCloseHtml(payload: Record<string, unknown>, message: string) {
  const serialized = JSON.stringify(payload).replace(/</g, '\\u003c');
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>YouTube Authorization</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
      .card { max-width: 380px; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center; }
      p { font-size: 14px; color: #475569; margin: 8px 0 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <strong>${message}</strong>
      <p>This window will close automatically.</p>
    </div>
    <script>
      (function() {
        var payload = ${serialized};
        if (window.opener) {
          window.opener.postMessage(payload, '*');
          setTimeout(function() { window.close(); }, 300);
        } else {
          window.location.href = '/';
        }
      })();
    </script>
  </body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const oauthError = req.nextUrl.searchParams.get('error');
  const stateParam = req.nextUrl.searchParams.get('state');

  if (oauthError) {
    return renderPopupCloseHtml(
      { type: 'OAUTH_AUTH_ERROR', error: oauthError },
      'Authorization cancelled'
    );
  }

  if (!code) {
    return renderPopupCloseHtml(
      { type: 'OAUTH_AUTH_ERROR', error: 'Missing authorization code' },
      'Authorization failed'
    );
  }

  let redirectUri = `${getEffectiveBaseUrl()}/api/auth/callback`;
  if (stateParam) {
    try {
      const parsed = JSON.parse(
        Buffer.from(stateParam, 'base64url').toString('utf-8')
      ) as { redirectUri?: string };
      if (parsed.redirectUri && isAllowedRedirectUri(parsed.redirectUri)) {
        redirectUri = parsed.redirectUri;
      }
    } catch {
      // Keep default redirectUri
    }
  }

  try {
    const channel = await exchangeCodeForYouTubeAuth(code, redirectUri);
    const response = renderPopupCloseHtml(
      { type: 'OAUTH_AUTH_SUCCESS', channel },
      'YouTube connected successfully'
    );

    const isHttps = redirectUri.startsWith('https://');
    response.cookies.set('shortsflow_yt_connected', '1', {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Token exchange failed';
    console.error('OAuth callback error:', error);
    return renderPopupCloseHtml(
      { type: 'OAUTH_AUTH_ERROR', error: msg },
      'Failed to connect YouTube'
    );
  }
}
