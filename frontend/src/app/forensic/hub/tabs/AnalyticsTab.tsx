'use client';

import React, { useEffect } from 'react';
import AnalyticsWorkspace from '../../../../app/forensic/components/AnalyticsWorkspace';
import { useHubStore } from '../../../../store/useHubStore';

export default function AnalyticsTab() {
  const { selectedHotspot } = useHubStore();

  useEffect(() => {
    if (selectedHotspot) {
      // Focus logic here
    }
  }, [selectedHotspot]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
       <AnalyticsWorkspace />
    </div>
  );
}
