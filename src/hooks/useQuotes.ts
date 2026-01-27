import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Quote, QuoteItem, QuoteStatus } from '@/types/database';

export function useQuotes() {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*)
        `)
        .order('quote_number', { ascending: false });
      
      if (error) throw error;
      return data as Quote[];
    },
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Quote | null;
    },
    enabled: !!id,
  });
}

export function useQuoteItems(quoteId: string | undefined) {
  return useQuery({
    queryKey: ['quote-items', quoteId],
    queryFn: async () => {
      if (!quoteId) return [];
      const { data, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order');
      
      if (error) throw error;
      return data as QuoteItem[];
    },
    enabled: !!quoteId,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quote: { client_id: string; quote_date?: string; validity_days?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('quotes')
        .insert(quote)
        .select()
        .single();
      
      if (error) throw error;
      return data as Quote;
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
      const { data, error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Quote;
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
      const { data, error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Quote;
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
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('quote_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data as QuoteItem;
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
      const { data, error } = await supabase
        .from('quote_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, quote_id } as QuoteItem;
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
      const { error } = await supabase
        .from('quote_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { quote_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-items', data.quote_id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
