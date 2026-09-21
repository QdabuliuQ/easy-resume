import { NextRequest, NextResponse } from 'next/server';
import { getPublicShareResume } from '@/lib/shareResume';

export const dynamic = 'force-dynamic';

/** GET /api/resume/share/[token] — 访客只读拉取 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const result = await getPublicShareResume(params.token);
  return NextResponse.json(result.ok ? result.response : result, {
    status: result.ok ? 200 : result.status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
