export interface AuthStatusResponse {
  status: string;
}

export interface AuthSignInRequest {
  email: string;
  password: string;
}

export interface AuthSignUpRequest {
  fullName: string;
  email: string;
  password: string;
  homepage?: string;
}
