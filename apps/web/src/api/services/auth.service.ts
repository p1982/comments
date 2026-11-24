import type { AxiosResponse } from 'axios';

import {
  authEndpoint,
  ENDPOINTS,
  type AuthSignInRequest,
  type AuthSignUpRequest,
  type AuthStatusResponse,
} from '@comments/shared';

import axiosInstance from '../axios/axios-instance';
import AbstractApiServices from './abstract.service';

class AuthService extends AbstractApiServices {
  constructor() {
    super(axiosInstance);
  }

  signIn(body: AuthSignInRequest): Promise<AxiosResponse<AuthStatusResponse>> {
    return this.post(authEndpoint(ENDPOINTS.SIGNIN), body);
  }

  signUp(body: AuthSignUpRequest): Promise<AxiosResponse<AuthStatusResponse>> {
    return this.post(authEndpoint(ENDPOINTS.SIGNUP), body);
  }

  refresh(): Promise<AxiosResponse<AuthStatusResponse>> {
    return this.post(authEndpoint(ENDPOINTS.REFRESH), {});
  }
}

export default new AuthService();
