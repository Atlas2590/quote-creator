// API client for MongoDB backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Clients
  clients: {
    getAll: () => fetchApi<any[]>('/clients'),
    getById: (id: string) => fetchApi<any>(`/clients/${id}`),
    getQuotesCount: (id: string) => fetchApi<{ count: number }>(`/clients/${id}/quotes-count`),
    create: (data: any) => fetchApi<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`/clients/${id}`, {
      method: 'DELETE',
    }),
  },

  // Quotes
  quotes: {
    getAll: () => fetchApi<any[]>('/quotes'),
    getById: (id: string) => fetchApi<any>(`/quotes/${id}`),
    getItems: (id: string) => fetchApi<any[]>(`/quotes/${id}/items`),
    create: (data: any) => fetchApi<any>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi<any>(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: string) => fetchApi<any>(`/quotes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    delete: (id: string) => fetchApi<void>(`/quotes/${id}`, {
      method: 'DELETE',
    }),
    addItem: (quoteId: string, data: any) => fetchApi<any>(`/quotes/${quoteId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateItem: (quoteId: string, itemId: string, data: any) => fetchApi<any>(`/quotes/${quoteId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    deleteItem: (quoteId: string, itemId: string) => fetchApi<void>(`/quotes/${quoteId}/items/${itemId}`, {
      method: 'DELETE',
    }),
  },

  // Export
  export: {
    quote: async (quoteId: string): Promise<Blob> => {
      const response = await fetch(`${API_BASE_URL}/export/${quoteId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(error.error || 'Export failed');
      }
      
      return response.blob();
    },
  },

  // Templates
  templates: {
    getAll: () => fetchApi<any[]>('/templates'),
    upload: async (file: File, name?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (name) formData.append('name', name);
      
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    delete: (name: string) => fetchApi<void>(`/templates/${name}`, {
      method: 'DELETE',
    }),
  },
};
