import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface Url {
  url_id: string;
  long_url: string;
  short_code: string;
  created_at: string;
  status: 'active' | 'scanning' | 'malicious' | 'inactive';
  is_password_protected: boolean;
  qr_code_ready: boolean;
  click_count: number;
}

interface Analytics {
  total_clicks: number;
  unique_visitors: number;
  browser_distribution: Record<string, number>;
  country_distribution: Record<string, number>;
}

interface UrlState {
  urls: Url[];
  selected_url: Url | null;
  analytics: Analytics | null;
  is_loading: boolean;
  error: string | null;
}

interface UrlActions {
  fetch_urls: () => Promise<void>;
  create_url: (data: any) => Promise<{ success: boolean; url_id?: string; error?: string }>;
  fetch_url_analytics: (url_id: string) => Promise<void>;
  fetch_url_details: (url_id: string) => Promise<void>;
  bulk_create_urls: (urls: { long_url: string; custom_alias?: string }[]) => Promise<{ success: boolean; data?: any; error?: string }>;
  delete_url: (url_id: string) => Promise<boolean>;
}

export const useUrlStore = create<UrlState & UrlActions>()(
  subscribeWithSelector((set, get) => ({
    urls: [],
    selected_url: null,
    analytics: null,
    is_loading: false,
    error: null,

    fetch_urls: async () => {
      set({ is_loading: true, error: null });
      const response = await apiClient.get<{ links: Url[]; pagination: any }>('/urls');
      
      if (response.data) {
        set({ urls: response.data.links || [] });
      } else {
        set({ error: response.error });
      }
      set({ is_loading: false });
    },

    create_url: async (data) => {
      set({ is_loading: true, error: null });
      const response = await apiClient.post<Url>('/urls', data);
      
      if (response.data) {
        set((state) => ({ 
          urls: [response.data as Url, ...state.urls],
          is_loading: false 
        }));
        return { success: true, url_id: response.data.url_id };
      }
      
      set({ is_loading: false, error: response.error });
      return { success: false, error: response.error };
    },

    fetch_url_analytics: async (url_id: string) => {
      set({ is_loading: true, error: null });
      const response = await apiClient.get<Analytics>(`/urls/${url_id}/analytics`);
      
      if (response.data) {
        set({ analytics: response.data });
      } else {
        set({ error: response.error });
      }
      set({ is_loading: false });
    },

    fetch_url_details: async (url_id: string) => {
      set({ is_loading: true, error: null });
      const response = await apiClient.get<Url>(`/urls/${url_id}`);
      
      if (response.data) {
        set({ selected_url: response.data });
      } else {
        set({ error: response.error });
      }
      set({ is_loading: false });
    },

    bulk_create_urls: async (urls) => {
      set({ is_loading: true, error: null });
      const response = await apiClient.post<{ results: any[]; errors: any[] }>('/urls/bulk', { urls });
      
      if (response.data) {
        set({ is_loading: false });
        get().fetch_urls(); // Refresh the list
        return { success: true, data: response.data };
      }
      
      set({ is_loading: false, error: response.error });
      return { success: false, error: response.error };
    },

    delete_url: async (url_id: string) => {
      const response = await apiClient.delete(`/urls/${url_id}`);
      if (response.status === 204 || response.status === 200) {
        set((state) => ({
          urls: state.urls.filter((u) => u.url_id !== url_id),
          selected_url: state.selected_url?.url_id === url_id ? null : state.selected_url
        }));
        return true;
      }
      return false;
    },
  }))
);
