import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { investigationId, evidenceIds, format, includeMetadata } = body;

    if (!investigationId || !evidenceIds || evidenceIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: investigationId and evidenceIds are required' },
        { status: 400 }
      );
    }

    if (!['zip', 'individual', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported: zip, individual, json' },
        { status: 400 }
      );
    }

    if (format === 'json') {
      const metadata = {
        investigationId,
        exportedAt: new Date().toISOString(),
        evidenceIds,
        totalItems: evidenceIds.length,
      };

      return new NextResponse(JSON.stringify(metadata, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="evidence-metadata-${investigationId}.json"`,
        },
      });
    }

    return new NextResponse(JSON.stringify({
      message: 'Export initiated',
      investigationId,
      format,
      totalItems: evidenceIds.length,
      includeMetadata,
      downloadUrl: `/api/export/batch/download?ids=${evidenceIds.join(',')}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Batch export error:', error);
    return NextResponse.json(
      { error: 'Failed to process export request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',') || [];

  return new NextResponse(JSON.stringify({
    message: 'Download endpoint',
    ids,
    totalFiles: ids.length,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
