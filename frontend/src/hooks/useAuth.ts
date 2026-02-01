import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    token: session?.accessToken,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
