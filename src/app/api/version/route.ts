import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const p = path.join(process.cwd(), '.next', 'BUILD_ID');
  let buildId = 'unknown';
  if (existsSync(p)) {
    buildId = readFileSync(p, 'utf8').trim() || 'unknown';
  }
  return Response.json(
    { buildId },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
