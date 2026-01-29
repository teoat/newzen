'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type AvatarState = 'idle' | 'thinking' | 'success' | 'alert' | 'error';

interface FrenlyAvatarProps {
  state?: AvatarState;
  size?: number;
  className?: string;
}

export default function FrenlyAvatar({ 
  state = 'idle', 
  size = 120,
  className = ''
}: FrenlyAvatarProps) {
  
  // Animation variants for different states
  const getBadgePulseSpeed = () => {
    switch (state) {
      case 'thinking': return 0.8;
      case 'alert': return 0.5;
      case 'error': return 1.5;
      default: return 2;
    }
  };

  const getDataStreamOpacity = () => {
    return state === 'thinking' ? 0.6 : 0.2;
  };

  return (
    <motion.div
      className={`frenly-avatar ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        width={size}
        height={size * 1.5}
        viewBox="0 0 120 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Police Cap */}
        <path
          d="M30 40 L90 40 Q100 40 100 50 L100 60 Q100 70 90 70 L30 70 Q20 70 20 60 L20 50 Q20 40 30 40Z"
          fill="#1e293b"
          stroke="#6366f1"
          strokeWidth="1"
        />
        
        {/* Cap Brim */}
        <ellipse
          cx="60"
          cy="70"
          rx="45"
          ry="8"
          fill="#0f172a"
          stroke="#6366f1"
          strokeWidth="1"
        />

        {/* Holographic Badge (animated) */}
        <motion.g
          animate={{
            opacity: [1, 0.6, 1],
          }}
          transition={{
            duration: getBadgePulseSpeed(),
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <path
            d="M55 50 L60 45 L65 50 L65 60 L60 65 L55 60 Z"
            fill="#6366f1"
            stroke="#ffffff"
            strokeWidth="0.5"
          />
          <circle cx="60" cy="55" r="3" fill="#ffffff" opacity="0.8" />
        </motion.g>

        {/* Face - Minimalist Line Art */}
        <ellipse
          cx="60"
          cy="95"
          rx="28"
          ry="32"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
        />

        {/* Eyes */}
        <motion.g
          animate={state === 'thinking' ? {
            scaleY: [1, 0.3, 1],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          <circle cx="52" cy="92" r="2.5" fill="#ffffff" />
          <circle cx="68" cy="92" r="2.5" fill="#ffffff" />
        </motion.g>

        {/* Mouth - Changes based on state */}
        {state === 'success' && (
          <path
            d="M50 105 Q60 110 70 105"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {state === 'alert' && (
          <line
            x1="50"
            y1="105"
            x2="70"
            y2="105"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        {state === 'error' && (
          <path
            d="M50 110 Q60 105 70 110"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {state === 'idle' && (
          <path
            d="M50 105 Q60 107 70 105"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Uniform - Detective Coat */}
        <path
          d="M40 120 L40 175 L50 175 L50 165 L70 165 L70 175 L80 175 L80 120 Q80 115 75 115 L45 115 Q40 115 40 120Z"
          fill="#1e40af"
          stroke="#6366f1"
          strokeWidth="1.5"
        />

        {/* Collar */}
        <path
          d="M45 115 L35 125 M75 115 L85 125"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Chest Badge */}
        <motion.rect
          x="52"
          y="130"
          width="16"
          height="12"
          rx="2"
          fill="#6366f1"
          stroke="#ffffff"
          strokeWidth="0.5"
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: getBadgePulseSpeed(),
            repeat: Infinity
          }}
        />

        {/* Shoulder Epaulettes */}
        <rect x="38" y="118" width="10" height="4" rx="1" fill="#6366f1" opacity="0.6" />
        <rect x="72" y="118" width="10" height="4" rx="1" fill="#6366f1" opacity="0.6" />

        {/* Arms */}
        <path
          d="M40 130 L25 145 L25 155 L30 155 L35 140"
          fill="#1e40af"
          stroke="#6366f1"
          strokeWidth="1"
        />
        <path
          d="M80 130 L95 145 L95 155 L90 155 L85 140"
          fill="#1e40af"
          stroke="#6366f1"
          strokeWidth="1"
        />

        {/* Hands - Gesture based on state */}
        {state === 'success' && (
          <motion.g
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Thumbs up */}
            <path
              d="M22 150 L22 160 L28 160 L28 155 L30 155 L30 145 L28 145 Z"
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
          </motion.g>
        )}
        {state === 'alert' && (
          <motion.g
            animate={{
              x: [0, -2, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity
            }}
          >
            {/* Caution hand */}
            <circle cx="24" cy="153" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.5" />
          </motion.g>
        )}

        {/* Data Streams (visible when thinking) */}
        <motion.g
          opacity={getDataStreamOpacity()}
          animate={state === 'thinking' ? {
            y: [0, -5, 0],
            opacity: [0.2, 0.6, 0.2]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <line x1="40" y1="140" x2="38" y2="175" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
          <line x1="60" y1="140" x2="60" y2="175" stroke="#6366f1" strokeWidth="1" opacity="0.6" />
          <line x1="80" y1="140" x2="82" y2="175" stroke="#6366f1" strokeWidth="1" opacity="0.4" />
          
          {/* Data particles */}
          <circle cx="40" cy="160" r="1" fill="#6366f1" />
          <circle cx="60" cy="155" r="1.5" fill="#6366f1" />
          <circle cx="80" cy="165" r="1" fill="#6366f1" />
        </motion.g>

        {/* Success Sparkles */}
        {state === 'success' && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
          >
            <path d="M90 80 L92 85 L97 87 L92 89 L90 94 L88 89 L83 87 L88 85 Z" fill="#10b981" />
            <path d="M105 100 L106 103 L109 104 L106 105 L105 108 L104 105 L101 104 L104 103 Z" fill="#10b981" opacity="0.8" />
          </motion.g>
        )}

        {/* Alert Triangle */}
        {state === 'alert' && (
          <motion.g
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          >
            <path
              d="M105 90 L110 100 L100 100 Z"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            <line x1="105" y1="94" x2="105" y2="97" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="105" cy="99" r="0.5" fill="#f59e0b" />
          </motion.g>
        )}
      </svg>

      {/* Status Indicator Dot */}
      <div className="flex items-center justify-center mt-2 gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            state === 'thinking' ? 'bg-blue-500 animate-pulse' :
            state === 'success' ? 'bg-green-500' :
            state === 'alert' ? 'bg-yellow-500 animate-pulse' :
            state === 'error' ? 'bg-red-500 animate-pulse' :
            'bg-indigo-500'
          }`}
          style={{
            boxShadow: `0 0 8px ${
              state === 'thinking' ? '#3b82f6' :
              state === 'success' ? '#10b981' :
              state === 'alert' ? '#f59e0b' :
              state === 'error' ? '#ef4444' :
              '#6366f1'
            }`
          }}
        />
        <span className="text-[9px] font-mono uppercase text-slate-500">
          {state === 'thinking' ? 'Analyzing...' :
           state === 'success' ? 'Success!' :
           state === 'alert' ? 'Alert' :
           state === 'error' ? 'Error' :
           'Ready'}
        </span>
      </div>
    </motion.div>
  );
}
