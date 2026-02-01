
'use client';

import { usePathname } from 'next/navigation';
import ForensicSidebar from './ForensicSidebar';

export default function SidebarConditional() {
  const pathname = usePathname();
  
  // Hide sidebar on the landing page (dashboard)
  if (pathname === '/') {
    return null;
  }
  
  return <ForensicSidebar />;
}
