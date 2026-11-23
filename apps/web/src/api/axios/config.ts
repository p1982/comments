import type { AxiosRequestConfig } from 'axios';

const apiVersion = process.env['API_VERSION'] ?? '1';
const baseURL = process.env['NEXT_PUBLIC_API_URL'] ?? `http://localhost:3001/api/${apiVersion}`;

export const API_CONFIG: AxiosRequestConfig = {
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};
