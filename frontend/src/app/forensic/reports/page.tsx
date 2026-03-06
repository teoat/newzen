'use client';

import { ScheduledReportsManager } from '../../../components/ScheduledReportsManager';
import { CalendarDays } from 'lucide-react';

export default function ReportsPage() {

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Report Automation</h1>
          </div>
          <p className="text-slate-400">
            Schedule automated forensic reports to be generated and delivered via email.
          </p>
        </header>

        <ScheduledReportsManager />
      </div>
    </div>
  );
}
