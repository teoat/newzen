import { motion } from 'framer-motion';

const hologramPulse = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.02, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

export function ProjectDashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            {...hologramPulse}
            className="h-32 bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-6"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          {...hologramPulse}
          className="lg:col-span-2 h-[450px] bg-slate-900/40 border border-indigo-500/20 rounded-[2.5rem]"
        />
        <motion.div
          {...hologramPulse}
          className="h-[450px] bg-slate-900/40 border border-indigo-500/20 rounded-[2.5rem]"
        />
      </div>
    </div>
  );
}

export function SCurveSkeleton() {
  return (
    <div className="h-[320px] w-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export function BudgetVarianceSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-slate-800/50 rounded-xl" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-slate-900/50 rounded-xl border border-white/5" />
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SCurveSkeleton />
        <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border border-white/5">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-slate-700/50 rounded" />
            <div className="h-24 bg-slate-800/50 rounded-2xl" />
            <div className="h-24 bg-slate-800/50 rounded-2xl" />
          </div>
        </div>
      </div>
      <BudgetVarianceSkeleton />
    </div>
  );
}
