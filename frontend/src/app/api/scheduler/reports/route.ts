import { NextRequest, NextResponse } from 'next/server';
import type { CreateScheduledReportRequest, UpdateScheduledReportRequest } from '../../../../lib/scheduler';

const scheduledReports = new Map<string, {
  id: string;
  name: string;
  investigationId: string;
  investigationTitle: string;
  cronExpression: string;
  frequency: string;
  nextRunAt: string;
  lastRunAt?: string;
  enabled: boolean;
  emailRecipients: string[];
  includePdf: boolean;
  includeJson: boolean;
  createdAt: string;
  updatedAt: string;
}>();

function generateId(): string {
  return `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseCronFrequency(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length === 5) {
    const [minute, hour, day, month, dow] = parts;
    const allWildcards = (p: string) => p === '*';
    if (allWildcards(minute) && allWildcards(hour) && allWildcards(day) && allWildcards(month) && allWildcards(dow)) {
      return 'Every minute';
    }
    if (minute === '0' && allWildcards(hour) && allWildcards(day) && allWildcards(month) && allWildcards(dow)) {
      return 'Hourly';
    }
    if (minute === '0' && hour === '0' && allWildcards(day) && allWildcards(month) && allWildcards(dow)) {
      return 'Daily';
    }
    if (minute === '0' && hour === '0' && allWildcards(day) && allWildcards(month) && dow === '0') {
      return 'Weekly (Sunday)';
    }
    if (minute === '0' && hour === '0' && day === '1' && allWildcards(month) && allWildcards(dow)) {
      return 'Monthly';
    }
  }
  return `Custom (${cron})`;
}

function calculateNextRun(cron: string): string {
  const next = new Date();
  next.setMinutes(next.getMinutes() + 60);
  return next.toISOString();
}

export async function GET() {
  const reports = Array.from(scheduledReports.values()).sort(
    (a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime()
  );

  return NextResponse.json({
    reports,
    total: reports.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateScheduledReportRequest = await request.json();

    if (!body.name || !body.investigationId || !body.cronExpression) {
      return NextResponse.json(
        { error: 'Missing required fields: name, investigationId, cronExpression' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    const report = {
      id,
      name: body.name,
      investigationId: body.investigationId,
      investigationTitle: `Investigation ${body.investigationId}`,
      cronExpression: body.cronExpression,
      frequency: parseCronFrequency(body.cronExpression),
      nextRunAt: calculateNextRun(body.cronExpression),
      enabled: true,
      emailRecipients: body.emailRecipients || [],
      includePdf: body.includePdf ?? true,
      includeJson: body.includeJson ?? false,
      createdAt: now,
      updatedAt: now,
    };

    scheduledReports.set(id, report);

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    );
  }
}
