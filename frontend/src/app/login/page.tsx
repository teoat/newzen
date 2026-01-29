'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Radio, Zap, TrendingUp, AlertTriangle, Loader2, Quote, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Suffix Strategy: password|mfaCode
      const finalPassword = mfaCode ? `${password}|${mfaCode.replace(/\s/g, '')}` : password;

      const result = await signIn('credentials', {
        username,
        password: finalPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("AUTHENTICATION FAILED: Invalid credentials or MFA security code.");
      } else {
        router.push('/');
      }
    } catch {
      setError("SYSTEM ERROR: High-voltage uplink failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen depth-layer-0" />;

  const FeatureItem = ({ icon: Icon, title, desc }: { icon: React.ComponentType<{ size?: number }>, title: string, desc: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl tactical-card depth-layer-1 depth-border-subtle group hover:bg-white/5 transition-colors">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Icon size={20} />
        </div>
        <div>
            <h3 className="text-white font-bold text-sm tracking-wide">{title}</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
  );

  const Testimonial = ({ quote, author, org }: { quote: string, author: string, org: string }) => (
    <div className="mt-8 p-6 rounded-2xl tactical-card depth-layer-2 depth-border-subtle backdrop-blur-md relative overflow-hidden group">
        <Quote className="absolute top-4 left-4 w-6 h-6 text-indigo-500/20" />
        <p className="text-indigo-100 text-sm italic relative z-10 pl-2 opacity-90 leading-relaxed">&quot;{quote}&quot;</p>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-indigo-500/20">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div>
                <div className="text-white text-xs font-bold">{author}</div>
                <div className="text-indigo-400 text-[10px] uppercase tracking-wider">{org}</div>
            </div>
        </div>
    </div>
  );

  const Stat = ({ value, label }: { value: string, label: string }) => (
    <div className="flex flex-col">
        <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen depth-layer-0 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      
      {/* Left Column: Premium Branding & Features */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 depth-layer-0 overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 z-0" />
         <div className="absolute -left-20 top-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse z-0" />
         
         <div className="relative z-10">
             <div className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Radio className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Zenith Forensic</h1>
                    <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-[0.3em]">Platform v5.0 // Supernova</p>
                </div>
             </div>

             <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
                 Enterprise-Grade <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Financial Intelligence</span>
             </h2>
             <p className="text-slate-400 text-lg mb-12 max-w-md leading-relaxed">
                 Uncover fraud, trace assets, and generate legal dossiers with military-grade precision.
             </p>

             <div className="space-y-4 max-w-md">
                 <FeatureItem icon={Shield} title="Bank-Level Security" desc="AES-256 encryption for all evidence files and immutable audit logs." />
                 <FeatureItem icon={TrendingUp} title="Real-Time Analytics" desc="Instant detection of financial variance and anomaly patterns across nodes." />
                 <FeatureItem icon={Zap} title="AI-Powered Insights" desc="Automated heuristic scanning for rapid fraud identification and link analysis." />
             </div>

             <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                 <Stat value="Rp 5.2T+" label="Asset Value Seized" />
                 <Stat value="1,240+" label="Active Cases" />
             </div>

             <Testimonial 
                quote="Zenith's automated flow tracing reduced our investigation time by 85%. It's an absolute game-changer for AML compliance." 
                author="Director of Forensics" 
                org="BRI Special Crimes Unit" 
             />
         </div>

         <div className="relative z-10 text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-12 flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
             <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                 <span>System Status: <span className="text-emerald-500">OPERATIONAL</span></span>
             </div>
             <span>Node: JAKARTA_PRIME</span>
         </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-16 depth-layer-0 relative">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <div className="mb-10 lg:hidden text-center">
                 <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-4">
                    <Radio className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Zenith Forensic</h1>
            </div>

            <div className="flex items-center gap-2 mb-8">
                <Lock className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold text-white tracking-wide">Investigator Access</h2>
            </div>
          
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Investigator ID</label>
                <div className="relative group">
                  <input 
                    id="username"
                    name="username"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full depth-layer-1 depth-border-medium rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono placeholder:text-slate-600"
                    placeholder="agent.id@zenith.ai"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Passkey</label>
                    <a href="#" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">Forgot Key?</a>
                 </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full depth-layer-1 depth-border-medium rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 p-2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* MFA Code Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">MFA Security Code (Optional)</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full depth-layer-1 depth-border-medium rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono placeholder:text-slate-600 tracking-[0.5em]"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <Shield className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950" 
                  />
                  <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer select-none">Keep session active for 24 hours</label>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-rose-400 text-xs font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-900/40 uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock size={14} className="mr-2" />
                    Access Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                        Request Government Access →
                    </Link>
                </p>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-900 text-center">
               <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                   Restricted Government System
               </p>
               <p className="text-[9px] text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">
                   Unauthorized access is a federal offense under the Computer Fraud and Abuse Act (CFAA). All activity is logged and monitored.
               </p>
            </div>
          </motion.div>
      </div>
    </div>
  );
}
