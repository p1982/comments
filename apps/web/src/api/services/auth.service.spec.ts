import type { AxiosResponse } from 'axios';

import { authEndpoint, ENDPOINTS } from '@comments/shared';

import axiosInstance from '../axios/axios-instance';
import authService from './auth.service';

describe('authService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts sign-in credentials to the auth endpoint', async () => {
    const response = { data: { status: 'success' } } as AxiosResponse;
    const post = jest.spyOn(axiosInstance, 'post').mockResolvedValue(response);
    const body = { email: 'auth@example.com', password: 'password123' };

    await expect(authService.signIn(body)).resolves.toBe(response);
    expect(post).toHaveBeenCalledWith(authEndpoint(ENDPOINTS.SIGNIN), body, undefined);
  });

  it('posts sign-up payload to the auth endpoint', async () => {
    const response = { data: { status: 'success' } } as AxiosResponse;
    const post = jest.spyOn(axiosInstance, 'post').mockResolvedValue(response);
    const body = {
      fullName: 'Ann',
      email: 'auth@example.com',
      password: 'password123',
      homepage: 'https://ann.example',
    };

    await expect(authService.signUp(body)).resolves.toBe(response);
    expect(post).toHaveBeenCalledWith(authEndpoint(ENDPOINTS.SIGNUP), body, undefined);
  });
});
