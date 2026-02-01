'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Mail, FileText, Trash2, Edit2, Play, Pause, X, Check } from 'lucide-react';
import type { ScheduledReport } from '../lib/scheduler';

interface ScheduledReportsManagerProps {
  investigationId?: string;
}

const defaultReports: ScheduledReport[] = [
  {
    id: 'SCH-001',
    name: 'Weekly Progress Report',
    investigationId: 'INV-001',
    investigationTitle: 'Case Investigation #1',
    cronExpression: '0 0 * * 0',
    frequency: 'Weekly (Sunday)',
    nextRunAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    lastRunAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    enabled: true,
    emailRecipients: ['team@example.com'],
    includePdf: true,
    includeJson: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SCH-002',
    name: 'Daily Summary',
    investigationId: 'INV-001',
    investigationTitle: 'Case Investigation #1',
    cronExpression: '0 9 * * *',
    frequency: 'Daily',
    nextRunAt: new Date(Date.now() + 86400000).toISOString(),
    enabled: true,
    emailRecipients: ['manager@example.com'],
    includePdf: true,
    includeJson: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function ScheduledReportsManager({ investigationId }: ScheduledReportsManagerProps) {
  const [reports, setReports] = useState<ScheduledReport[]>(defaultReports);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredReports = investigationId
    ? reports.filter((r) => r.investigationId === investigationId)
    : reports;

  const handleToggle = async (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r
      )
    );
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Scheduled Reports</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      <div className="p-6">
        {filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className={`p-4 rounded-lg border transition-all ${
                  report.enabled
                    ? 'bg-slate-800/30 border-white/10'
                    : 'bg-slate-900/30 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-white">{report.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          report.enabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {report.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{report.investigationTitle}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {report.emailRecipients.length} recipient(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        PDF {report.includePdf ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(report.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        report.enabled
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-slate-500 hover:bg-slate-700'
                      }`}
                      title={report.enabled ? 'Pause' : 'Enable'}
                    >
                      {report.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingReport(report)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-500">
                  Next run: {new Date(report.nextRunAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No scheduled reports</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Create your first schedule
            </button>
          </div>
        )}
      </div>

      {(showCreateModal || editingReport) && (
        <ScheduleModal
          report={editingReport}
          onClose={() => {
            setShowCreateModal(false);
            setEditingReport(null);
          }}
          onSave={(report) => {
            if (editingReport) {
              setReports((prev) =>
                prev.map((r) => (r.id === editingReport.id ? { ...r, ...report } : r))
              );
            } else {
              setReports((prev) => [
                ...prev,
                {
                  name: report.name || 'Untitled Report',
                  investigationId: report.investigationId || investigationId || 'unknown',
                  investigationTitle: report.investigationTitle || 'Investigation Report',
                  cronExpression: report.cronExpression || '0 9 * * *',
                  frequency: report.frequency || 'Daily',
                  nextRunAt: report.nextRunAt || new Date(Date.now() + 86400000).toISOString(),
                  enabled: report.enabled ?? true,
                  emailRecipients: report.emailRecipients || [],
                  includePdf: report.includePdf ?? true,
                  includeJson: report.includeJson ?? false,
                  ...report,
                  id: `SCH-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ]);
            }
            setShowCreateModal(false);
            setEditingReport(null);
          }}
        />
      )}
    </div>
  );
}

interface ScheduleModalProps {
  report?: ScheduledReport | null;
  onClose: () => void;
  onSave: (report: Partial<ScheduledReport>) => void;
}

function ScheduleModal({ report, onClose, onSave }: ScheduleModalProps) {
  const [name, setName] = useState(report?.name || '');
  const [cronExpression, setCronExpression] = useState(report?.cronExpression || '0 9 * * *');
  const [emailRecipients, setEmailRecipients] = useState(report?.emailRecipients.join(', ') || '');
  const [includePdf, setIncludePdf] = useState(report?.includePdf ?? true);
  const [includeJson, setIncludeJson] = useState(report?.includeJson ?? false);
  const [enabled, setEnabled] = useState(report?.enabled ?? true);

  const frequencyPresets = [
    { label: 'Hourly', value: '0 * * * *' },
    { label: 'Daily at 9am', value: '0 9 * * *' },
    { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
    { label: 'Monthly', value: '0 0 1 * *' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      cronExpression,
      emailRecipients: emailRecipients.split(',').map((e) => e.trim()).filter(Boolean),
      includePdf,
      includeJson,
      enabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">
            {report ? 'Edit Schedule' : 'New Report Schedule'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Schedule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Weekly Progress Report"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Frequency</label>
            <select
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              {frequencyPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom cron...</option>
            </select>
            {cronExpression === 'custom' && (
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full mt-2 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="* * * * *"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Recipients
            </label>
            <input
              type="text"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="mt-1 text-xs text-slate-500">Separate emails with commas</p>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePdf}
                onChange={(e) => setIncludePdf(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-slate-800 text-indigo-500"
              />
              <span className="text-sm text-slate-300">Include PDF</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeJson}
                onChange={(e) => setIncludeJson(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-slate-800 text-indigo-500"
              />
              <span className="text-sm text-slate-300">Include JSON</span>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
            >
              <Check className="w-4 h-4" />
              {report ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
