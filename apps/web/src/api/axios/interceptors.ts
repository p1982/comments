import { ENDPOINTS } from '@comments/shared';
import axios, { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { API_CONFIG } from './config';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_SKIP_REFRESH = [ENDPOINTS.SIGNIN, ENDPOINTS.REFRESH] as const;

const toError = (reason: unknown): Error =>
  reason instanceof Error ? reason : new Error(String(reason));

export const setupInterceptors = (instance: AxiosInstance): void => {
  let refreshPromise: Promise<void> | null = null;

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
    (error: unknown) => Promise.reject(toError(error)),
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!isAxiosError(error)) {
        return await Promise.reject(toError(error));
      }

      const originalRequest = error.config as RetryableRequestConfig | undefined;

      const shouldSkipRefresh =
        error.response?.status !== 401 ||
        !originalRequest ||
        (originalRequest._retry ?? false) ||
        AUTH_SKIP_REFRESH.some((path) => originalRequest.url?.includes(path));

      if (shouldSkipRefresh) {
        return await Promise.reject(toError(error));
      }

      originalRequest._retry = true;

      try {
        refreshPromise ??= axios
          .post(`${API_CONFIG.baseURL ?? ''}${ENDPOINTS.REFRESH}`, {}, { withCredentials: true })
          .then(() => undefined)
          .finally(() => {
            refreshPromise = null;
          });

        await refreshPromise;
        return await instance(originalRequest);
      } catch (refreshError) {
        return await Promise.reject(toError(refreshError));
      }
    },
  );
};
