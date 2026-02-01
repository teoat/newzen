import { NextRequest, NextResponse } from 'next/server';
import { collectMetrics, getContentType } from '../../../lib/prometheus';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const metrics = await collectMetrics();

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      'Content-Type': getContentType(),
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
