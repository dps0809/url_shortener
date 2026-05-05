export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

const API_BASE_URL = '/api';

export const apiClient = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Get token from localStorage (managed by useAuthStore)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const status = response.status;

      // Handle 204 No Content
      if (status === 204) {
        return { status };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          status,
          error: data.error || data.message || `Request failed with status ${status}`,
        };
      }

      return { data: data as T, status };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Network error or server unreachable',
      };
    }
  },

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
