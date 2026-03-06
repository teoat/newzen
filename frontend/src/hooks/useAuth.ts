import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { Permission, hasPermission as checkPermission } from '../lib/rbac';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (isSignedIn) {
        const t = await getToken();
        setToken(t);
      }
    };
    fetchToken();
  }, [isSignedIn, getToken]);

  const hasRole = (role: string | string[]) => {
      // Mapping Clerk metadata to our "role" concept
      // We assume user.publicMetadata.role or default to "ANALYST"
      const userRole = (user?.publicMetadata?.role as string) || "ANALYST";
      
      if (!userRole) return false;
      
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return userRole === role;
  };

  const hasPermission = (permission: Permission) => {
    const userRole = (user?.publicMetadata?.role as string) || "ANALYST";
    return checkPermission(userRole, permission);
  };

  return {
    user: user ? {
        ...user,
        role: (user.publicMetadata?.role as string) || "ANALYST"
    } : null,
    token, // Note: This is async in Clerk
    status: isSignedIn ? 'authenticated' : (isUserLoaded ? 'unauthenticated' : 'loading'),
    isAuthenticated: isSignedIn,
    isLoading: !isUserLoaded || !isAuthLoaded,
    hasRole,
    hasPermission,
    role: (user?.publicMetadata?.role as string) || "ANALYST",
  };
}
