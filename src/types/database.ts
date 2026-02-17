export type QuoteStatus = 
  | 'bozza'
  | 'da_controllare'
  | 'da_confermare'
  | 'inviato'
  | 'accettato'
  | 'rifiutato'
  | 'annullato';

export interface Client {
  id: string;
  company_name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string | null;
  country: string | null;
  vat_number: string | null;
  fiscal_code: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  quote_number: number;
  client_id: string;
  quote_date: string;
  validity_days: number | null;
  status: QuoteStatus;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  item_notes: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
  created_at: string;
}

export const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bgClass: string }> = {
  bozza: { label: 'Bozza', color: 'status-draft', bgClass: 'bg-muted text-muted-foreground' },
  da_controllare: { label: 'Da Controllare', color: 'status-review', bgClass: 'bg-amber-100 text-amber-700' },
  da_confermare: { label: 'Da Confermare', color: 'status-pending', bgClass: 'bg-purple-100 text-purple-700' },
  inviato: { label: 'Inviato', color: 'status-sent', bgClass: 'bg-blue-100 text-blue-700' },
  accettato: { label: 'Accettato', color: 'status-accepted', bgClass: 'bg-green-100 text-green-700' },
  rifiutato: { label: 'Rifiutato', color: 'status-rejected', bgClass: 'bg-red-100 text-red-700' },
  annullato: { label: 'Annullato', color: 'status-cancelled', bgClass: 'bg-gray-100 text-gray-500' },
};
