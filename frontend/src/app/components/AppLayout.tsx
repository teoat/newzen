'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopNav from '../../components/TopNav';
import SidebarConditional from './SidebarConditional';
import GlobalTools from '../../components/GlobalTools';
import SentryErrorBoundary from '../../components/SentryErrorBoundary';
import MissionHUD from './MissionHUD';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.includes('/login') || pathname?.includes('/signup');

    if (isAuthPage) {
        return (
            <main className="min-h-screen relative overflow-hidden">
                <SentryErrorBoundary>
                    {children}
                </SentryErrorBoundary>
            </main>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <MissionHUD />
            <div className="flex flex-1 pt-20 overflow-hidden">
                <SidebarConditional />
                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <SentryErrorBoundary>
                        {children}
                    </SentryErrorBoundary>
                </main>
            </div>
            <GlobalTools />
        </div>
    );
}
