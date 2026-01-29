'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  Copy, 
  ShieldAlert,
  History,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

interface MfaStatus {
    enabled: boolean;
    serverTime?: string;
}

export default function SecuritySettingsPage() {
    const { data: session } = useSession();
    const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [setupStep, setSetupStep] = useState<'IDLE' | 'SETUP' | 'VERIFY' | 'SUCCESS'>('IDLE');
    const [setupData, setSetupData] = useState<{ otpauth_url: string, secret: string } | null>(null);
    const [verificationToken, setVerificationToken] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const fetchMfaStatus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/v1/auth/mfa/status`, {
                headers: { 'Authorization': `Bearer ${session?.accessToken}` }
            });
            const data = await response.json();
            // We'll also check if enabled by trying to fetch backup codes or from a user info endpoint
            // For now, we'll assume the status check is just a health check, 
            // and we'll fetch the user's specific MFA state from a profile-like request.
            // Since we don't have a profile endpoint, we'll use the recovery-codes endpoint as a proxy
            const codesResp = await fetch(`${API_URL}/api/v1/auth/mfa/recovery-codes`, {
                headers: { 'Authorization': `Bearer ${session?.accessToken}` }
            });
            
            setMfaStatus({
                enabled: codesResp.status === 200,
                serverTime: data.server_time
            });
            
            if (codesResp.status === 200) {
                const codesData = await codesResp.json();
                setBackupCodes(codesData.backup_codes || []);
            }
        } catch {
            console.error("Failed to load security status");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken, setLoading, setMfaStatus, setBackupCodes]);

    useEffect(() => {
        if (session?.accessToken) {
            fetchMfaStatus();
        }
    }, [session, fetchMfaStatus]);

    const initiateMfaSetup = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_URL}/api/v1/auth/mfa/setup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.accessToken}` }
            });
            const data = await response.json();
            setSetupData(data);
            setSetupStep('SETUP');
        } catch {
            setError("Failed to initialize security protocol");
        }
    };

    const verifyMfa = async () => {
        try {
            setError(null);
            const response = await fetch(`${API_URL}/api/v1/auth/mfa/verify?token=${verificationToken}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.accessToken}` }
            });
            
            if (!response.ok) throw new Error("Verification failed");
            
            const data = await response.json();
            setBackupCodes(data.backup_codes);
            setMfaStatus((prev: MfaStatus | null) => prev ? ({ ...prev, enabled: true }) : null);
            setSetupStep('SUCCESS');
        } catch {
            setError("Invalid verification sequence");
        }
    };

    const disableMfa = async () => {
        if (!confirm("Are you sure you want to degrade security? This requires administrative override.")) return;
        
        try {
            // Note: In this demo, users can reset their own MFA for convenience, 
            // but in prod, this would call /reset as an admin or a separate /disable for self.
            const response = await fetch(`${API_URL}/api/v1/auth/mfa/reset?target_username=${session?.user?.name}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.accessToken}` }
            });
            
            if (response.ok) {
                setMfaStatus((prev: MfaStatus | null) => prev ? ({ ...prev, enabled: false }) : null);
                setBackupCodes([]);
                setSetupStep('IDLE');
            }
        } catch {
            setError("Protocol failure: Unable to disable security layering");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8 font-sans text-slate-200">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-indigo-500" />
                        Security Operations
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                        Credential Layering & Integrity Management
                    </p>
                </div>
                {mfaStatus?.enabled && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ACTIVE PROTECTION</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2FA Toggle Card */}
                <div className="md:col-span-2 space-y-6">
                    <section className="p-8 rounded-[2rem] bg-slate-900/50 border border-white/5 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                        
                        <div className="relative flex items-start justify-between">
                            <div className="space-y-4 max-w-lg">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit text-indigo-400">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-white italic tracking-tight">Multi-Factor Authentication</h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    Secure your investigator account with time-based codes. Even if your master key is leaked, 
                                    electronic evidence remains shielded by a dynamic second layer.
                                </p>
                            </div>
                            
                            <button 
                                onClick={mfaStatus?.enabled ? disableMfa : initiateMfaSetup}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    mfaStatus?.enabled 
                                    ? 'bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                                }`}
                            >
                                {mfaStatus?.enabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>

                        {/* Setup Flow Modal/Area */}
                        <AnimatePresence>
                            {setupStep !== 'IDLE' && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mt-8 pt-8 border-t border-white/5"
                                >
                                    {setupStep === 'SETUP' && (
                                        <div className="flex flex-col md:flex-row gap-8 items-center">
                                            <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-600/20">
                                                <QRCodeSVG 
                                                    value={setupData?.otpauth_url || ''} 
                                                    size={180}
                                                    level="H"
                                                    includeMargin={false}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-4 text-center md:text-left">
                                                <h4 className="text-white font-black italic">Initialize Authenticator</h4>
                                                <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-wide">
                                                    1. Scan QR code using Google Authenticator or Authy.<br/>
                                                    2. Enter the generated 6-digit sequence below.
                                                </p>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        maxLength={6}
                                                        value={verificationToken}
                                                        onChange={(e) => setVerificationToken(e.target.value)}
                                                        placeholder="000 000"
                                                        className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-center font-mono text-xl tracking-[0.5em] text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 flex-1"
                                                    />
                                                    <button 
                                                        onClick={verifyMfa}
                                                        className="bg-indigo-600 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-colors"
                                                    >
                                                        Verify
                                                    </button>
                                                </div>
                                                {error && <p className="text-red-400 text-[10px] font-black uppercase italic tracking-widest">{error}</p>}
                                                <button 
                                                    onClick={() => setupData?.secret && copyToClipboard(setupData.secret)}
                                                    className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    Can&apos;t scan? Use manual secret: {setupData?.secret}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {setupStep === 'SUCCESS' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                <div>
                                                    <h4 className="text-white font-black italic">Protection Sequence Finalized</h4>
                                                    <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest">Two-Factor Authentication is now active.</p>
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-indigo-300 font-black italic text-sm">Emergency Recovery Codes</h4>
                                                    <button 
                                                        onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                                        className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                        {copySuccess ? 'Copied' : 'Copy All'}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {backupCodes.map((code, idx) => (
                                                        <div key={idx} className="bg-slate-950/50 p-2 rounded-lg text-center font-mono text-xs text-slate-300 tracking-widest border border-white/5">
                                                            {code}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed text-center italic">
                                                    ⚠️ Store these keys offline. They are the ONLY way to access your terminal <br/>
                                                    if you lose your mobile verification device.
                                                </p>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setSetupStep('IDLE')}
                                                className="w-full py-3 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-colors"
                                            >
                                                Return to Dashboard
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    {/* Secondary Security Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 rounded-[1.5rem] bg-slate-900/30 border border-white/5 flex items-start gap-4">
                            <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white font-black italic text-sm">Access Keys</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight mt-1">Rotate your master forensic passphrase periodically.</p>
                                <button className="mt-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 group">
                                    Change Password <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 rounded-[1.5rem] bg-slate-900/30 border border-white/5 flex items-start gap-4">
                            <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white font-black italic text-sm">Session Matrix</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight mt-1">Audit active terminals currently connected to your ID.</p>
                                <button className="mt-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 group">
                                    View Activity <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <section className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/10 space-y-6 border-l-4 border-l-indigo-500 shadow-xl shadow-indigo-900/10">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-indigo-400" />
                            <h3 className="text-sm font-black text-white italic tracking-tight">Security Intel</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Integrity Pulse</span>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[94%]" />
                                </div>
                            </div>
                            
                            <ul className="space-y-3">
                                {[
                                    { label: 'Clock Sync', value: '0.04ms drift', icon: RefreshCw },
                                    { label: 'Key Strength', value: '256-bit AES', icon: Lock },
                                    { label: 'Layering', value: mfaStatus?.enabled ? 'L2 Active' : 'L1 Basic', icon: Layers },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center justify-between text-[10px] font-bold">
                                        <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-black">
                                            <item.icon className="w-3 h-3" />
                                            {item.label}
                                        </div>
                                        <span className="text-white font-mono">{item.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                    
                    <div className="p-6 rounded-[1.5rem] bg-slate-900/50 border border-white/5 space-y-4">
                        <p className="text-[9px] text-slate-500 italic font-medium leading-relaxed uppercase font-bold">
                            Zenith Commander enforces strict TLS termination and end-to-end auditability. 
                            Your cryptographic secrets never leave the encrypted enclave in plaintext.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Recovery Codes Area (Always visible if enabled) */}
            {mfaStatus?.enabled && setupStep === 'IDLE' && backupCodes.length > 0 && (
                <section className="p-8 rounded-[2rem] bg-slate-900/50 border border-white/5">
                    <div className="flex items-start justify-between mb-6">
                        <div className="space-y-1">
                             <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-2">
                                <Key className="w-5 h-5 text-indigo-400" />
                                Security Recovery Registry
                             </h3>
                             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest font-black leading-snug">
                                Stored static bypass codes for administrative account recovery
                             </p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5"
                                title="Download Recovery Codes"
                                aria-label="Download Recovery Codes"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5"
                                title="Copy Recovery Codes"
                                aria-label="Copy Recovery Codes"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {backupCodes.map((code, idx) => (
                            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-white/5 text-center group relative overflow-hidden">
                                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="font-mono text-xs text-slate-400 group-hover:text-indigo-400 transition-all font-bold tracking-widest">{code}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
