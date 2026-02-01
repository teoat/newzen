import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, AlertCircle, CheckCircle2, Sigma } from 'lucide-react';

interface LogicStage {
  label: string;
  value: string | number;
  description: string;
  status: 'normal' | 'anomaly' | 'success';
  formula?: string;
}

interface ForensicLogicPathProps {
  stages: LogicStage[];
  title?: string;
}

const ForensicLogicPath: React.FC<ForensicLogicPathProps> = ({ 
  stages, 
  title = "Calculation Lineage Verification" 
}) => {
  return (
    <div className="bg-slate-950 border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Calculator className="w-32 h-32 text-indigo-500" />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
        <p className="text-slate-500 text-[10px] font-mono tracking-[0.3em] uppercase mt-1">Mathematical Provenance & Audit Trail Verification</p>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {stages.map((stage, index) => (
          <React.Fragment key={index}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-64"
            >
              <div className={`p-6 rounded-2xl border ${
                stage.status === 'anomaly' ? 'bg-rose-500/10 border-rose-500/20' :
                stage.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                'bg-slate-900 border-white/5'
              } relative group hover:border-indigo-500/40 transition-all`}>
                
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stage.label}</span>
                  {stage.status === 'anomaly' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                  {stage.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>

                <div className={`text-2xl font-black mb-2 ${
                  stage.status === 'anomaly' ? 'text-rose-400' :
                  stage.status === 'success' ? 'text-emerald-400' :
                  'text-white'
                }`}>
                  {stage.value}
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  {stage.description}
                </div>

                {stage.formula && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                    <Sigma className="w-3 h-3 text-indigo-400" />
                    <span className="text-[9px] font-mono text-indigo-400/70">{stage.formula}</span>
                  </div>
                )}

                <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-all font-mono text-[8px] text-white/20">
                  STEP_{index + 1}
                </div>
              </div>
            </motion.div>

            {index < stages.length - 1 && (
              <div className="flex-shrink-0">
                <ArrowRight className="w-6 h-6 text-slate-800" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center">
              <span className="text-[8px] font-black text-white">{i}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">3 Logic Gates Passed Certification</span>
      </div>
    </div>
  );
};

export default ForensicLogicPath;
