'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Shield, 
  FileUp, 
  Activity, 
  Zap, 
  Mail, 
  Phone,
  ArrowRight,
  Fingerprint,
  Database,
  Eye,
  AlertTriangle
} from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { authenticatedFetch } from '../../../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageFeatureCard from '../../components/PageFeatureCard';

interface CommMessage {
  id: string;
  sender: string;
  receiver: string;
  message_text: string;
  message_timestamp: string;
  sentiment?: string;
  intent_tags?: string[];
  status: 'PENDING' | 'ANALYZED';
}

export default function CommForensicsPage() {
  const { activeProjectId } = useProject();
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeProjectId) return;
    const fetchMessages = async () => {
        try {
            const res = await authenticatedFetch(`/api/v1/comm-forensics/${activeProjectId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (e) { console.warn("Comm-Forensics node offline"); }
        finally { setLoading(false); }
    };
    fetchMessages();
  }, [activeProjectId]);

  return (
    <ForensicPageLayout
      title="Communication Forensics"
      subtitle="Intent Discovery & Message Analysis"
      icon={MessageSquare}
      headerActions={
        <Button className="h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
            <FileUp className="w-3 h-3" /> Ingest Message Archive
        </Button>
      }
    >
      <div className="p-10 space-y-10 h-full overflow-y-auto custom-scrollbar">
        <PageFeatureCard 
            phase={7}
            title="Communication Forensic Sweep"
            description="The system's 'Intent Discovery' layer. It ingests WhatsApp, Signal, and Email exports to perform sentiment and intent analysis, uncovering the 'Mens Rea' behind siphoning patterns."
            features={[
                "Sentiment analysis for kickback & bribe signatures",
                "Automated message-to-transaction chronological mapping",
                "UBO relationship discovery via entity co-occurrence",
                "Cryptographically secure message storage & indexing"
            ]}
            howItWorks="By analyzing exported message logs alongside project transactions, the AI identifies conversations about shadow payments or shell account setups that occur right before funds are moved."
        />

        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Intelligence Dashboard</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <CommStat icon={Mail} label="Ingested Comms" value={messages.length.toString()} color="indigo" />
                    <CommStat icon={Zap} label="Suspicious Intent" value="12" color="rose" />
                    <CommStat icon={Shield} label="Verified Chains" value="8" color="emerald" />
                </div>
            </div>

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search intent or entity co-occurrence..."
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-[11px] font-bold outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>

                <div className="space-y-4">
                    {messages.length > 0 ? messages.map((m, i) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={m.id}
                            className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:bg-slate-900 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                                        <Fingerprint size={16} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white uppercase tracking-tight">{m.sender} → {m.receiver || 'Group'}</div>
                                        <div className="text-[9px] font-mono text-slate-500 uppercase">{new Date(m.message_timestamp).toLocaleString()}</div>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${m.status === 'ANALYZED' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-slate-500 border-white/5'}`}>
                                    {m.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic">&quot;{m.message_text}&quot;</p>
                            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {m.intent_tags?.map(t => (
                                        <span key={t} className="px-2 py-1 bg-indigo-600/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase rounded">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white flex items-center gap-2">
                                    Link to TX <ArrowRight size={10} />
                                </Button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">No Message Records Ingested</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </ForensicPageLayout>
  );
}

function CommStat({ icon: Icon, label, value, color }: any) {
    const colors = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };
    return (
        <Card className={`p-6 rounded-3xl border ${colors[color as keyof typeof colors]} flex items-center gap-6`}>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Icon size={20} />
            </div>
            <div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">{label}</div>
                <div className="text-2xl font-black text-white italic tracking-tighter">{value}</div>
            </div>
        </Card>
    );
}
