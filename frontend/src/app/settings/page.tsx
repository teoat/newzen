'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  User,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import ForensicPageLayout from '../components/ForensicPageLayout';

export default function SettingsHubPage() {
    return (
        <ForensicPageLayout
            title="System Configuration"
            subtitle="Global Parameters & Operational Controls"
            icon={User}
        >
            <div className="max-w-6xl mx-auto p-10 font-sans text-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* User Profile / Security - Clerk Managed */}
                    <section className="h-full p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[50px] -mr-16 -mt-16 transition-opacity opacity-50" />
                        
                        <div className="relative space-y-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit text-indigo-400">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-white italic tracking-tight">Profile & Security</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Manage your investigator profile, password, and security settings through Clerk.
                            </p>
                            
                            <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-white/5">
                                <UserButton
                                    appearance={{
                                        elements: {
                                            formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl',
                                            card: 'bg-transparent shadow-none w-full',
                                            headerTitle: 'text-white font-black',
                                            headerSubtitle: 'text-slate-400 text-xs',
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Intelligence Module */}
                    <Link href="/settings/intelligence" className="group">
                        <section className="h-full p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-cyan-500/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 blur-[50px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                            
                            <div className="relative space-y-4">
                                <h3 className="text-xl font-black text-white italic tracking-tight group-hover:text-cyan-300 transition-colors">Intelligence Matrix</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                    LLM Orchestration, API Key Balancing, and Neural Model Config.
                                </p>
                                <div className="text-[11px] font-black text-cyan-500 uppercase tracking-widest mt-4">
                                    Configure Settings →
                                </div>
                            </div>
                        </section>
                    </Link>

                    {/* Agent Authority Module */}
                    <Link href="/admin/users" className="group">
                        <section className="h-full p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-emerald-500/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-[50px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                            
                            <div className="relative space-y-4">
                                <h3 className="text-xl font-black text-white italic tracking-tight group-hover:text-emerald-300 transition-colors">Agent Authority</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                    Role Access, Clearance Levels, and User Management.
                                </p>
                                <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-4">
                                    Manage Agents →
                                </div>
                            </div>
                        </section>
                    </Link>

                    {/* Data Hospital Module */}
                    <Link href="/admin/data-hospital" className="group">
                        <section className="h-full p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 hover:border-rose-500/30 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 blur-[50px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
                            
                            <div className="relative space-y-4">
                                <h3 className="text-xl font-black text-white italic tracking-tight group-hover:text-rose-300 transition-colors">Data Hospital</h3>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                    Quarantine Zone, Ingestion Errors, and Recovery Protocols.
                                </p>
                                <div className="text-[11px] font-black text-rose-500 uppercase tracking-widest mt-4">
                                    Access Ward →
                                </div>
                            </div>
                        </section>
                    </Link>

                </div>
            </div>
        </ForensicPageLayout>
    );
}
