import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { Session } from 'next-auth';
import { vi } from 'vitest';

// Create a simple wrapper without query client
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null;
}

const AllTheProviders = ({ children, session }: { children: React.ReactNode; session?: Session | null }) => {
  return (
    <div className="dark">{children}</div>
  );
};

export const renderWithProviders = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { session, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AllTheProviders session={session}>{children}</AllTheProviders>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions } as RenderOptions),
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Mock data generators
export const mockProject = (overrides = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
  name: 'Test Project',
  description: 'Test Description',
  contract_value: 1000000,
  realized_spend: 500000,
  status: 'ACTIVE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockInvestigation = (overrides = {}) => ({
  id: 'investigation-1',
  title: 'Test Investigation',
  project_id: 'project-1',
  status: 'IN_PROGRESS' as const,
  phase: 'GATHERING_EVIDENCE' as const,
  progress: 25,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const mockAlert = (overrides = {}) => ({
  id: 'alert-1',
  severity: 'HIGH' as const,
  message: 'Test Alert',
  timestamp: new Date().toISOString(),
  type: 'TEST',
  ...overrides,
});

export const mockStats = (overrides = {}) => ({
  risk_index: 45,
  total_leakage_identified: 500000000,
  active_investigations: 3,
  pending_alerts: 5,
  hotspots: [
    { lat: -6.2088, lng: 106.8456, intensity: 0.8 },
    { lat: -6.1751, lng: 106.8650, intensity: 0.6 },
  ],
  ...overrides,
});

export const mockSession = (overrides = {}) => ({
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ANALYST' as const,
  },
  expires: new Date(Date.now() + 3600000).toISOString(),
  ...overrides,
});

// Wait for async operations
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

interface MockWebSocketCallbacks {
  [event: string]: ((data: unknown) => void)[];
}

interface MockWebSocket {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  on: (event: string, callback: (data: unknown) => void) => void;
  emit: (event: string, data: unknown) => void;
}

// Mock WebSocket for testing
export const createMockWebSocket = (): MockWebSocket => {
  const callbacks: MockWebSocketCallbacks = {};

  const ws: MockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    on: (event: string, callback: (data: unknown) => void) => {
      if (!callbacks[event]) callbacks[event] = [];
      callbacks[event].push(callback);
    },
    emit: (event: string, data: unknown) => {
      if (callbacks[event]) {
        callbacks[event].forEach(cb => cb(data));
      }
    },
  };

  return ws;
};
