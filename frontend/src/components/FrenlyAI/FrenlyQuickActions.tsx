'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { QuickAction, executeFrenlyAction } from './context/FrenlyContextEngine';

interface FrenlyQuickActionsProps {
  actions: QuickAction[];
}

export default function FrenlyQuickActions({ actions }: FrenlyQuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-1 bg-indigo-500 rounded-full" />
        <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
          Quick Actions
        </span>
      </div>

      <div className="space-y-2">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => executeFrenlyAction(action)}
            className="w-full group relative overflow-hidden bg-slate-900/50 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/40 rounded-xl p-3 transition-all duration-200 flex items-center gap-3"
          >
            {/* Icon */}
            <div className="text-2xl flex-shrink-0">
              {action.icon}
            </div>

            {/* Label */}
            <span className="flex-1 text-left text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              {action.label}
            </span>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />

            {/* Hover Highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
