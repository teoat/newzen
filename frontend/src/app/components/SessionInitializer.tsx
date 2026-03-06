'use client';

import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { setForensicSessionSecret } from '@/lib/crypto';
import AuthService from '@/services/AuthService';

export default function SessionInitializer() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const initialize = async () => {
      if (isLoaded) {
        if (user) {
          // Stable secret based on Clerk User ID
          setForensicSessionSecret(user.id);
        } else if (AuthService.isAuthenticated()) {
          // Fallback for manual auth - use the token itself or a stable part of it
          const token = AuthService.getToken();
          if (token) setForensicSessionSecret(token.substring(0, 32));
        }
      }
    };
    initialize();
  }, [user, isLoaded, getToken]);

  return null;
}
