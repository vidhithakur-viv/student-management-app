export type Role = 'admin' | 'faculty';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
