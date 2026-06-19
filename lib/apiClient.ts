import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Helper function to retrieve the Firebase ID token.
 * We pass `true` to `getIdToken` occasionally to force refresh if needed,
 * but generally passing nothing allows the Firebase SDK to auto-refresh it
 * when it is within 5 minutes of expiring.
 * Here we use false for standard caching, or you can force it when encountering a 401.
 */
const getAuthToken = async (): Promise<string | null> => {
  if (!auth?.currentUser) {
    return null;
  }
  try {
    // `false` means it will use the cached token unless it's expired or close to expiring.
    // If you need to force a refresh (e.g., after custom claims update), pass `true`.
    return await auth.currentUser.getIdToken(false);
  } catch (error) {
    console.error('Failed to get Firebase token:', error);
    return null;
  }
};

/**
 * Generic API client wrapper around the native `fetch` API.
 * Automatically attaches the Firebase ID token to the Authorization header.
 */
export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Optional: Log a warning if no token is found for an API call
    console.warn('apiClient: No Firebase user found, sending request without Bearer token.');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle auto-refresh or logout on 401 Unauthorized globally if desired
  if (response.status === 401) {
    console.error('apiClient: 401 Unauthorized - Token may be invalid or expired.');
    
    // Optional: Attempt a forced token refresh and retry here
    /*
    const refreshedToken = await auth?.currentUser?.getIdToken(true);
    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`);
      return fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    }
    */
  }

  // Parse JSON automatically
  let data;
  try {
    // clone the response before reading the body, so we can return the raw response if needed
    const text = await response.clone().text();
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `API request failed with status ${response.status}`);
  }

  return data;
};
