'use client';

import React, { useState, useEffect } from 'react';
import FrenlyPolicewomanWidget from "../components/FrenlyAI/FrenlyPolicewomanWidget";

import TelemetrySync from "../app/components/TelemetrySync";
import { InvestigationPanel } from "../components/InvestigationPanel";
import EventBusDebugger from "./Forensic/EventBusDebugger";
import { useProject } from '../store/useProject';
import { forensicBus } from '../lib/ForensicEventBus';

import { ForensicCopilot } from "./AI/ForensicCopilot";

export default function GlobalTools() {
  const { activeProjectId } = useProject();

  useEffect(() => {
    // Other global listeners can go here
  }, []);

  return (
    <>
      <FrenlyPolicewomanWidget />
      <ForensicCopilot />
      <TelemetrySync />
      <InvestigationPanel />
      <EventBusDebugger />
    </>
  );
}
