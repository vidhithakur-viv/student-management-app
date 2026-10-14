import { api } from '@/services/api';
import { LoginRequest, LoginResponse, User } from '@/types/auth';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },
  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
