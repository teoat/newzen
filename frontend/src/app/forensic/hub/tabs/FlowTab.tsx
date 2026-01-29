'use client';

import React, { useEffect } from 'react';
import FlowWorkspace from '@/app/forensic/components/FlowWorkspace';
import { useHubStore } from '@/store/useHubStore';

export default function FlowTab() {
  const { selectedMilestone } = useHubStore();

  useEffect(() => {
    if (selectedMilestone) {
      console.log('Flow: Focusing on milestone', selectedMilestone);
      // The FlowWorkspace will handle highlighting this milestone
    }
  }, [selectedMilestone]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
       <FlowWorkspace />
    </div>
  );
}
