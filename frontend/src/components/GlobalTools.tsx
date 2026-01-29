'use client';

import React, { useState, useEffect } from 'react';
import FrenlyWidget from "@/components/FrenlyAI/FrenlyWidget";
import { SearchPalette } from "@/components/Search/SearchPalette";
import TelemetrySync from "@/app/components/TelemetrySync";
import { InvestigationPanel } from "@/components/InvestigationPanel";
import { useProject } from '@/store/useProject';
import { forensicBus } from '@/lib/ForensicEventBus';

export default function GlobalTools() {
  const { activeProjectId } = useProject();

  useEffect(() => {
    // Other global listeners can go here
  }, []);

  return (
    <>
      <FrenlyWidget />
      <TelemetrySync />
      <InvestigationPanel />
    </>
  );
}
