'use client';

import React from 'react';

export function MockClerkProvider({ children }: { children: React.ReactNode }) {
  // Simple mock that provides just enough context for Clerk hooks
  return (
    <div data-testid="mock-clerk-provider">
      {children}
    </div>
  );
}

// Mock the hooks that Clerk provides
export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'user_2N9yJ5p7x9Y8Z0A1B2C3D4E5',
    fullName: 'Test Investigator',
    primaryEmailAddress: { emailAddress: 'test@zenith.ai' },
    imageUrl: 'https://images.clerk.dev/static/default-user-image.png',
  },
});

export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_2N9yJ5p7x9Y8Z0A1B2C3D4E5',
  sessionId: 'sess_123',
  getToken: async () => 'mock-access-token',
  signOut: async () => console.log('Mock Sign Out'),
});

export const useSession = () => ({
  isLoaded: true,
  isSignedIn: true,
  session: { id: 'sess_123', getToken: async () => 'mock-access-token' },
});
