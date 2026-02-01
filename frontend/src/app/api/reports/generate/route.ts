import { NextRequest, NextResponse } from 'next/server';
import { generateInvestigationReport, getReportFilename } from '../../../../lib/reportGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { investigation, executiveSummary, evidenceItems, statistics } = body;

    if (!investigation || !investigation.id) {
      return NextResponse.json({ error: 'Invalid investigation data' }, { status: 400 });
    }

    const reportData = {
      investigation,
      executiveSummary: executiveSummary || `Investigation report for ${investigation.title}`,
      evidenceItems: evidenceItems || [],
      statistics: statistics || {
        totalEvidence: investigation.context.evidenceIds?.length || 0,
        admittedEvidence: investigation.context.evidence_items?.filter((e: { verdict: string }) => e.verdict === 'ADMITTED').length || 0,
        rejectedEvidence: investigation.context.evidence_items?.filter((e: { verdict: string }) => e.verdict === 'REJECTED').length || 0,
        totalTransactions: investigation.context.transactionIds?.length || 0,
        riskScore: investigation.riskScore || 0,
      },
    };

    const pdfBuffer = await generateInvestigationReport(reportData);
    const filename = getReportFilename(investigation.id);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
