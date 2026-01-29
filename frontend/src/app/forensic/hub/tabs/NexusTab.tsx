'use client';

import React, { useEffect } from 'react';
import NexusWorkspace from '@/app/forensic/components/NexusWorkspace';
import { useHubStore } from '@/store/useHubStore';

export default function NexusTab() {
  const { selectedEntity } = useHubStore();

  useEffect(() => {
    if (selectedEntity) {
      console.log('Nexus: Focusing on entity', selectedEntity);
      // The NexusGraphPage will handle highlighting this entity
    }
  }, [selectedEntity]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
       <NexusWorkspace />
    </div>
  );
}
