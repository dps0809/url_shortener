import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  username?: string;
  name?: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  is_authenticated: boolean;
  is_loading: boolean;
}

interface AuthActions {
  set_user: (user: User | null) => void;
  set_token: (token: string | null) => void;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; username: string; email: string; password: string; phone: string }) => Promise<{ success: boolean; error?: string }>;
  verify_otp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetch_me: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
    is_authenticated: false,
    is_loading: true,

    set_user: (user) => set({ user, is_authenticated: !!user }),
    set_token: (token) => {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
      set({ token, is_authenticated: !!token });
    },

    login: async (credentials) => {
      set({ is_loading: true });
      const response = await apiClient.post<{ user: User; token: string }>('/auth/login', credentials);
      
      if (response.data) {
        get().set_token(response.data.token);
        get().set_user(response.data.user);
        set({ is_loading: false });
        return { success: true };
      }
      
      set({ is_loading: false });
      return { success: false, error: response.error };
    },
    
    register: async (data) => {
      set({ is_loading: true });
      const response = await apiClient.post<{ user: User; token: string }>('/auth/register', data);
      
      if (response.data) {
        get().set_token(response.data.token);
        get().set_user(response.data.user);
        set({ is_loading: false });
        return { success: true };
      }
      
      set({ is_loading: false });
      return { success: false, error: response.error };
    },

    verify_otp: async (email, otp) => {
      set({ is_loading: true });
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      
      if (response.data) {
        set({ is_loading: false });
        return { success: true };
      }
      
      set({ is_loading: false });
      return { success: false, error: response.error };
    },

    logout: () => {
      get().set_token(null);
      get().set_user(null);
    },

    fetch_me: async () => {
      const { token } = get();
      if (!token) {
        set({ is_loading: false });
        return;
      }

      const response = await apiClient.get<User>('/auth/me');
      if (response.data) {
        set({ user: response.data, is_authenticated: true });
      } else {
        get().logout();
      }
      set({ is_loading: false });
    },
  }))
);
