import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { BaselineMetrics, SimulationResult } from '../../schemas/forensic';
import { ForensicScenarioEngine } from '../../services/ForensicScenarioEngine';

interface ScenarioComparisonViewProps {
  baseline: BaselineMetrics;
  simulated: SimulationResult;
}

export const ScenarioComparisonView: React.FC<ScenarioComparisonViewProps> = ({
  baseline,
  simulated
}) => {
  const delta = simulated.delta;

  const MetricCard = ({ 
    label, 
    baseValue, 
    simValue, 
    deltaValue, 
    isPercentage = true,
    inverse = false // true if increase is GOOD
  }: { 
    label: string; 
    baseValue: number; 
    simValue: number; 
    deltaValue: number;
    isPercentage?: boolean;
    inverse?: boolean;
  }) => {
    const isImproved = inverse ? deltaValue > 0 : deltaValue < 0;
    const TrendIcon = isImproved ? TrendingDown : TrendingUp;
    
    return (
      <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          {isPercentage ? <ActivityIcon className="w-12 h-12" /> : <DollarSign className="w-12 h-12" />}
        </div>
        
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">{label}</h4>
        
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-bold uppercase">Baseline</div>
            <div className="text-xl font-black text-white">
              {isPercentage ? `${(baseValue * 100).toFixed(2)}%` : ForensicScenarioEngine.formatCurrency(baseValue)}
            </div>
          </div>
          
          <ArrowRight className="w-4 h-4 text-slate-700 mb-2" />
          
          <div className="space-y-1 text-right">
            <div className="text-xs text-indigo-400 font-bold uppercase">Simulated</div>
            <div className="text-xl font-black text-indigo-400">
              {isPercentage ? `${(simValue * 100).toFixed(2)}%` : ForensicScenarioEngine.formatCurrency(simValue)}
            </div>
          </div>
        </div>

        <div className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${
          isImproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {deltaValue !== 0 && <TrendIcon className="w-3 h-3" />}
          {ForensicScenarioEngine.formatPercentageChange(deltaValue)}
        </div>
      </div>
    );
  };

  const ActivityIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Leakage Probability"
          baseValue={baseline.leakage_probability}
          simValue={delta.simulated_leakage}
          deltaValue={delta.leakage_delta}
        />
        <MetricCard 
          label="Risk Exposure Score"
          baseValue={baseline.risk_score}
          simValue={delta.simulated_risk_score}
          deltaValue={delta.risk_delta}
        />
        <MetricCard 
          label="Simulated Recovery"
          baseValue={0}
          simValue={delta.financial_impact}
          deltaValue={delta.financial_impact / (baseline.leakage_amount || 1)}
          isPercentage={false}
          inverse={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delta Visualization */}
        <div className="glass-tactical p-8 rounded-[2.5rem] border-indigo-500/10">
          <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" /> Impact Vector Breakdown
          </h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                <span className="text-slate-500">Exclusion Impact</span>
                <span className="text-white">{delta.excluded_transactions_count} Transactions</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                <span className="text-slate-500">Topology Simplification</span>
                <span className="text-white">{delta.merged_entities_count} Entity Merges</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '40%' }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Summary */}
        <div className={`p-8 rounded-[2.5rem] border ${
          simulated.summary.impact_level === 'HIGH' 
            ? 'bg-rose-500/5 border-rose-500/10' 
            : 'bg-emerald-500/5 border-emerald-500/10'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              simulated.summary.impact_level === 'HIGH' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className={`text-xl font-black italic uppercase tracking-tighter ${
                simulated.summary.impact_level === 'HIGH' ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                {simulated.summary.impact_level} Impact Adjudication
              </h4>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Automated Forensic Verdict
              </p>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-white/10 pl-4">
            This scenario demonstrates a {simulated.summary.leakage_change} change in leakage probability 
            and a {simulated.summary.risk_change} shift in overall risk exposure. 
            The projected financial recovery is estimated at {simulated.summary.financial_impact}.
          </p>
        </div>
      </div>
    </div>
  );
};
