/**
 * Nexus Trace Graph Layout Worker
 * Offloads heavy graph layout calculations to a background thread
 */

import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';

interface Node {
  id: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
}

self.onmessage = (event: MessageEvent) => {
  const { nodes, links, iterations = 50 } = event.data;

  const simulation = forceSimulation<Node>(nodes)
    .force('link', forceLink<Node, Link>(links).id((d) => d.id))
    .force('charge', forceManyBody().strength(-100))
    .force('center', forceCenter(0, 0))
    .stop();

  // Run simulation synchronously in the worker
  for (let i = 0; i < iterations; ++i) {
    simulation.tick();
  }

  // Return calculated positions
  self.postMessage({ nodes, links });
};

export {};
