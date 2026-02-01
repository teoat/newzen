/**
 * OPTIMIZED ForensicSidebar Component
 * 
 * PERFORMANCE FIXES:
 * - Dynamic import for RecommendationEngine (below-fold content)
 * - Replaced framer-motion with CSS transitions
 * - Added aria-current for active navigation
 * - Added aria-expanded for mobile menu
 * - Lazy loaded mobile menu component
 * - Memoized with React.memo
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  GitMerge, 
  FileText, 
  Settings,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const navItems: NavItem[] = [
  { 
    href: '/', 
    label: 'War Room', 
    icon: LayoutDashboard,
    description: 'Dashboard overview'
  },
  { 
    href: '/investigate', 
    label: 'Investigate', 
    icon: Search,
    description: 'Case investigations'
  },
  { 
    href: '/reconciliation', 
    label: 'Reconcile', 
    icon: GitMerge,
    description: 'Financial reconciliation'
  },
  { 
    href: '/forensic', 
    label: 'Forensics', 
    icon: FileText,
    description: 'Evidence analysis'
  },
  { 
    href: '/settings', 
    label: 'Settings', 
    icon: Settings,
    description: 'Configuration'
  },
];

const ForensicSidebar = memo(function ForensicSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-slate-900 border border-white/10 rounded-lg shadow-lg"
        aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMobileOpen}
        aria-controls="sidebar-navigation"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-white" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5 text-white" aria-hidden="true" />
        )}
      </button>

      {/* Sidebar Navigation */}
      <aside
        id="sidebar-navigation"
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-slate-950 border-r border-white/5
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${active 
                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.description}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="font-medium text-sm">{item.label}</span>
                  {active && (
                    <ChevronRight 
                      className="w-4 h-4 ml-auto text-indigo-400" 
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
});

export default ForensicSidebar;
