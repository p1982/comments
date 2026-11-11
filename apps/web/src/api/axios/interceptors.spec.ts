import { ENDPOINTS } from '@comments/shared';
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { API_CONFIG } from './config';
import { setupInterceptors } from './interceptors';

const responseHandlers = (instance: ReturnType<typeof axios.create>) => {
  const manager = instance.interceptors.response as unknown as {
    handlers: Array<{
      fulfilled: (value: AxiosResponse) => AxiosResponse;
      rejected: (error: unknown) => Promise<unknown>;
    }>;
  };
  const handler = manager.handlers[0];
  if (!handler) {
    throw new Error('response interceptor was not registered');
  }
  return handler;
};

const requestHandlers = (instance: ReturnType<typeof axios.create>) => {
  const manager = instance.interceptors.request as unknown as {
    handlers: Array<{
      fulfilled: (value: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
      rejected: (error: unknown) => Promise<unknown>;
    }>;
  };
  const handler = manager.handlers[0];
  if (!handler) {
    throw new Error('request interceptor was not registered');
  }
  return handler;
};

describe('axios interceptors', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes a request through and wraps a request failure', async () => {
    const instance = axios.create();
    setupInterceptors(instance);
    const handlers = requestHandlers(instance);
    const config = { url: '/comments' } as InternalAxiosRequestConfig;

    expect(handlers.fulfilled(config)).toBe(config);
    await expect(handlers.rejected('boom')).rejects.toThrow('boom');
  });

  it('rejects errors that are not 401 responses', async () => {
    const instance = axios.create();
    setupInterceptors(instance);
    const handlers = responseHandlers(instance);
    const response = { data: { ok: true } } as AxiosResponse;

    expect(handlers.fulfilled(response)).toBe(response);
    await expect(handlers.rejected(new Error('network'))).rejects.toThrow('network');

    const forbidden = new AxiosError('forbidden');
    forbidden.response = { status: 403 } as AxiosResponse;
    forbidden.config = { url: '/comments' } as InternalAxiosRequestConfig;
    await expect(handlers.rejected(forbidden)).rejects.toThrow('forbidden');

    const noResponse = new AxiosError('no response');
    await expect(handlers.rejected(noResponse)).rejects.toThrow('no response');
  });

  it('does not refresh a sign-in or an already retried request', async () => {
    const instance = axios.create();
    setupInterceptors(instance);
    const handlers = responseHandlers(instance);
    const signin = new AxiosError('unauthorized');
    signin.response = { status: 401 } as AxiosResponse;
    signin.config = { url: '/auth/signin' } as InternalAxiosRequestConfig;
    const retried = new AxiosError('unauthorized');
    retried.response = { status: 401 } as AxiosResponse;
    retried.config = { url: '/comments', _retry: true } as InternalAxiosRequestConfig;
    const refresh = new AxiosError('unauthorized');
    refresh.response = { status: 401 } as AxiosResponse;
    refresh.config = { url: ENDPOINTS.REFRESH } as InternalAxiosRequestConfig;

    const missingConfig = new AxiosError('unauthorized');
    missingConfig.response = { status: 401 } as AxiosResponse;

    await expect(handlers.rejected(signin)).rejects.toThrow('unauthorized');
    await expect(handlers.rejected(retried)).rejects.toThrow('unauthorized');
    await expect(handlers.rejected(refresh)).rejects.toThrow('unauthorized');
    await expect(handlers.rejected(missingConfig)).rejects.toThrow('unauthorized');
  });

  it('refreshes a 401 whose request url is missing', async () => {
    const instance = axios.create();
    setupInterceptors(instance);
    const handlers = responseHandlers(instance);
    const missingUrl = new AxiosError('unauthorized');
    missingUrl.response = { status: 401 } as AxiosResponse;
    missingUrl.config = {} as InternalAxiosRequestConfig;
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));

    await expect(handlers.rejected(missingUrl)).rejects.toThrow('refresh failed');
  });

  it('refreshes once and retries the original request', async () => {
    const request = jest
      .spyOn(axios.Axios.prototype, 'request')
      .mockResolvedValue({ data: { ok: true } });
    const instance = axios.create({ baseURL: 'http://localhost:3001/api/v1' });
    setupInterceptors(instance);
    const handlers = responseHandlers(instance);
    const config = { url: '/comments' } as InternalAxiosRequestConfig;
    const error = new AxiosError('unauthorized');
    error.response = { status: 401 } as AxiosResponse;
    error.config = config;
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await expect(handlers.rejected(error)).resolves.toEqual({ data: { ok: true } });
    expect(post).toHaveBeenCalledWith(
      `${API_CONFIG.baseURL ?? ''}${ENDPOINTS.REFRESH}`,
      {},
      { withCredentials: true },
    );
    expect(request).toHaveBeenCalled();
    expect(config).toMatchObject({ _retry: true });
  });

  it('reuses one refresh while another 401 is already in flight', async () => {
    jest.spyOn(axios.Axios.prototype, 'request').mockResolvedValue({ data: { ok: true } });
    const instance = axios.create();
    setupInterceptors(instance);
    const handlers = responseHandlers(instance);
    let release: (value: unknown) => void = () => undefined;
    const post = jest.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const previousBaseUrl = API_CONFIG.baseURL;
    API_CONFIG.baseURL = undefined;

    try {
      const firstConfig = { url: '/comments' } as InternalAxiosRequestConfig;
      const secondConfig = { url: '/users' } as InternalAxiosRequestConfig;
      const first = new AxiosError('unauthorized');
      first.response = { status: 401 } as AxiosResponse;
      first.config = firstConfig;
      const second = new AxiosError('unauthorized');
      second.response = { status: 401 } as AxiosResponse;
      second.config = secondConfig;

      const pending = Promise.all([handlers.rejected(first), handlers.rejected(second)]);
      release({ data: {} });
      await expect(pending).resolves.toEqual([{ data: { ok: true } }, { data: { ok: true } }]);
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith(ENDPOINTS.REFRESH, {}, { withCredentials: true });
    } finally {
      API_CONFIG.baseURL = previousBaseUrl;
    }
  });

  it('rejects when the refresh call fails', async () => {
    const instance = axios.create();
    setupInterceptors(instance);
    const handlers = responseHandlers(instance);
    const error = new AxiosError('unauthorized');
    error.response = { status: 401 } as AxiosResponse;
    error.config = { url: '/comments' } as InternalAxiosRequestConfig;
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));

    await expect(handlers.rejected(error)).rejects.toThrow('refresh failed');
  });
});
