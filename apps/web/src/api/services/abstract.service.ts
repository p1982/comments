import type { AxiosInstance, AxiosRequestHeaders, AxiosResponse } from 'axios';

type RequestParams = Record<string, string | number | boolean | undefined>;
type RequestHeaders = AxiosRequestHeaders | Record<string, string>;

abstract class AbstractApiServices {
  protected apiClient: AxiosInstance;
  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }
  protected async get<T>(
    url: string,
    options?: {
      params?: RequestParams;
      headers?: RequestHeaders;
    },
  ): Promise<AxiosResponse<T>> {
    return await this.apiClient.get(url, options);
  }
  protected async post<T>(
    url: string,
    data?: unknown,
    options?: {
      params?: RequestParams;
      headers?: RequestHeaders;
    },
  ): Promise<AxiosResponse<T>> {
    return await this.apiClient.post(url, data, options);
  }
  protected async put<T>(
    url: string,
    data?: unknown,
    options?: {
      params?: RequestParams;
      headers?: RequestHeaders;
    },
  ): Promise<AxiosResponse<T>> {
    return await this.apiClient.put(url, data, options);
  }
  protected async delete<T>(
    url: string,
    options?: {
      params?: RequestParams;
      headers?: RequestHeaders;
    },
  ): Promise<AxiosResponse<T>> {
    return await this.apiClient.delete(url, options);
  }
}

export default AbstractApiServices;
