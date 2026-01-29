import { getSession, signOut } from "next-auth/react";
import { API_URL } from "./constants";

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  const accessToken = session?.accessToken;

  const headers: Record<string, string> = {
    ...Object.fromEntries(Object.entries(options.headers || {}) as [string, string][]),
    "Authorization": accessToken ? `Bearer ${accessToken}` : "",
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized - potentially redirect to login or clear session
    signOut();
  }

  return response;
}
