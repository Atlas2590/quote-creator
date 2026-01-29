import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Quote, QuoteItem, QuoteStatus } from '@/types/database';

export function useQuotes() {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      return api.quotes.getAll() as Promise<Quote[]>;
    },
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      if (!id) return null;
      return api.quotes.getById(id) as Promise<Quote | null>;
    },
    enabled: !!id,
  });
}

export function useQuoteItems(quoteId: string | undefined) {
  return useQuery({
    queryKey: ['quote-items', quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      return api.quotes.getItems(quoteId) as Promise<QuoteItem[]>;
    },
    enabled: !!quoteId,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quote: { client_id: string; quote_date?: string; validity_days?: number; notes?: string }) => {
      return api.quotes.create(quote) as Promise<Quote>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quote> & { id: string }) => {
      return api.quotes.update(id, updates) as Promise<Quote>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', variables.id] });
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      return api.quotes.updateStatus(id, status) as Promise<Quote>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return api.quotes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useCreateQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<QuoteItem, 'id' | 'created_at'>) => {
      return api.quotes.addItem(item.quote_id, item) as Promise<QuoteItem>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-items', variables.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quote_id, ...updates }: Partial<QuoteItem> & { id: string; quote_id: string }) => {
      return api.quotes.updateItem(quote_id, id, updates) as Promise<QuoteItem>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-items', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useDeleteQuoteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quote_id }: { id: string; quote_id: string }) => {
      await api.quotes.deleteItem(quote_id, id);
      return { quote_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-items', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
