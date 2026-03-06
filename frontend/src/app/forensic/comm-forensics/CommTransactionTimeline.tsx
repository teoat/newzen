import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Link2, CheckCircle, XCircle, Clock,
  AlertTriangle, Search, Filter, Calendar, Activity
} from 'lucide-react';
import {
  commForensicsService,
  CommunicationTransactionLink,
  MessageIntent
} from '../../../services/CommForensicsService';
import { useAuth } from '../../../hooks/useAuth';

interface CommTransactionTimelineProps {
  projectId: string;
}

export default function CommTransactionTimeline({ projectId }: CommTransactionTimelineProps) {
  const { user } = useAuth();
  const [links, setLinks] = useState<CommunicationTransactionLink[]>([]);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState(0.5);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [linksData, timeline] = await Promise.all([
        commForensicsService.getLinks(projectId, { min_confidence: confidenceFilter }),
        commForensicsService.getTimelineView(projectId, {
          search: searchTerm,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        })
      ]);
      setLinks(linksData);
      setTimelineData(timeline);
    } catch (error) {
      console.error('Failed to load timeline data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, confidenceFilter, searchTerm, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleVerifyLink = async (linkId: string, verified: boolean) => {
    try {
      await commForensicsService.verifyLink(linkId, verified, user?.id || '');
      await loadData();
    } catch (error) {
      console.error('Failed to verify link:', error);
    }
  };

  const getIntentColor = (intent: MessageIntent) => {
    switch (intent) {
      case MessageIntent.FINANCIAL_TRANSFER:
      case MessageIntent.PAYMENT_CONFIRMATION:
        return 'text-blue-400 bg-blue-500/20';
      case MessageIntent.BRIBERY:
      case MessageIntent.THREAT:
        return 'text-red-400 bg-red-500/20';
      case MessageIntent.COLLUSION:
      case MessageIntent.COORDINATION:
        return 'text-orange-400 bg-orange-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header & Advanced Filters */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600/20 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Communication Forensics</h2>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Intent-Signal Fusion Analysis</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-[2rem] backdrop-blur-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-white/5 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-300 focus:outline-none"
            />
            <span className="text-slate-700 font-bold">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-300 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 px-4 py-3 bg-black/40 border border-white/5 rounded-xl">
            <Activity className="w-4 h-4 text-slate-500" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                <span>Confidence Threshold</span>
                <span className="text-indigo-400">{(confidenceFilter * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setStartDate('');
              setEndDate('');
              setConfidenceFilter(0.5);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
          >
            <Filter className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Links</p>
              <p className="text-2xl font-black text-white">{links.length}</p>
            </div>
            <Link2 className="w-8 h-8 text-indigo-500 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">High Confidence</p>
              <p className="text-2xl font-black text-emerald-400">
                {links.filter(l => l.confidence_score >= 0.8).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-yellow-400">
                {links.filter(l => l.verification_status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Verified</p>
              <p className="text-2xl font-black text-blue-400">
                {links.filter(l => l.verification_status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-lg font-black text-white">Communication-Transaction Links</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 text-left">Confidence</th>
                <th className="px-4 py-3 text-left">Link Type</th>
                <th className="px-4 py-3 text-left">Time Delta</th>
                <th className="px-4 py-3 text-left">Matching Criteria</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-mono font-bold ${getConfidenceColor(link.confidence_score)}`}>
                        {(link.confidence_score * 100).toFixed(0)}%
                      </div>
                      {link.confidence_score >= 0.8 && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300 font-mono">
                      {link.link_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-3 h-3" />
                      {link.time_delta_minutes} min
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {link.matching_entities.length > 0 && (
                        <div className="text-xs text-blue-400">
                          Entities: {link.matching_entities.slice(0, 2).join(', ')}
                          {link.matching_entities.length > 2 && ` +${link.matching_entities.length - 2}`}
                        </div>
                      )}
                      {link.matching_amounts.length > 0 && (
                        <div className="text-xs text-emerald-400">
                          Amounts: {link.matching_amounts.length}
                        </div>
                      )}
                      {link.matching_keywords.length > 0 && (
                        <div className="text-xs text-slate-400">
                          Keywords: {link.matching_keywords.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      link.verification_status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                      link.verification_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {link.verification_status.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3">
                    {link.verification_status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyLink(link.id, true)}
                          className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded transition-colors"
                          title="Verify Link"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVerifyLink(link.id, false)}
                          className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                          title="Reject Link"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
