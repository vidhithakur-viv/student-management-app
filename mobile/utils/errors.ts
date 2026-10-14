import axios from 'axios';

import { API_URL } from '@/services/api';

/** Turn any thrown value into a message that is safe to show to the user. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  if (!error.response) {
    if (!API_URL) {
      return 'API URL is not configured. Set EXPO_PUBLIC_API_URL in mobile/.env and restart Expo.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'The server took too long to respond. Please try again.';
    }
    return 'Cannot reach the server. Check your internet/Wi-Fi connection and that the backend is running.';
  }

  const { status, data } = error.response;
  const detail = typeof data?.detail === 'string' ? data.detail : undefined;

  switch (status) {
    case 401:
      return detail ?? 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return detail ?? 'Not found.';
    case 409:
      return detail ?? 'This record already exists.';
    case 422:
      return detail ?? 'Some of the information entered is invalid.';
    case 503:
      return 'The database is unavailable right now. Please try again shortly.';
    default:
      return status >= 500 ? 'The server had a problem. Please try again later.' : detail ?? fallback;
  }
}

export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
