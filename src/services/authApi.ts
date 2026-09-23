import { apiClient } from './apiClient';
import type { User } from '@/types';

interface BackendAuthResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: User;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  user?: User;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthResult {
  token: string;
  user: User;
  refreshToken?: string;
}

function normalizeAuthResponse(
  response: BackendAuthResponse,
): AuthResult {
  const data = response.data ?? response;

  const token = data.token ?? data.accessToken;
  const user = data.user;
  const refreshToken = data.refreshToken;

  if (!token) {
    throw new Error(
      'Login succeeded but the backend did not return an authentication token.',
    );
  }

  if (!user) {
    throw new Error(
      'Login succeeded but the backend did not return user information.',
    );
  }

  return {
    token,
    user,
    refreshToken,
  };
}

export const authApi = {
  register: async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const response = await apiClient.post<BackendAuthResponse>(
      '/auth/register',
      {
        name,
        email,
        password,
      },
    );

    return normalizeAuthResponse(response);
  },

  login: async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    const response = await apiClient.post<BackendAuthResponse>(
      '/auth/login',
      {
        email,
        password,
      },
    );

    return normalizeAuthResponse(response);
  },

  me: async (signal?: AbortSignal): Promise<User> => {
    const response = await apiClient.get<BackendAuthResponse>('/auth/me', signal);
    const data = response.data ?? response;
    const user = data.user;

    if (!user) {
      throw new Error('The backend did not return user information.');
    }

    return user;
  },
};