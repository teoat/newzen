import { NextRequest, NextResponse } from 'next/server';
import type { UpdateScheduledReportRequest } from '../../../../../lib/scheduler';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = scheduledReports.get(id);

  if (!report) {
    return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
  }

  return NextResponse.json(report);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = scheduledReports.get(id);

    if (!existing) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }

    const body: UpdateScheduledReportRequest = await request.json();

    const updated = {
      ...existing,
      name: body.name ?? existing.name,
      cronExpression: body.cronExpression ?? existing.cronExpression,
      frequency: body.cronExpression ? parseCronFrequency(body.cronExpression) : existing.frequency,
      enabled: body.enabled ?? existing.enabled,
      emailRecipients: body.emailRecipients ?? existing.emailRecipients,
      includePdf: body.includePdf ?? existing.includePdf,
      includeJson: body.includeJson ?? existing.includeJson,
      nextRunAt: body.cronExpression ? calculateNextRun(body.cronExpression) : existing.nextRunAt,
      updatedAt: new Date().toISOString(),
    };

    scheduledReports.set(id, updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduled report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = scheduledReports.delete(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
