-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

-- Create roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Create quote_status enum
CREATE TYPE quote_status AS ENUM (
  'bozza',
  'da_controllare', 
  'da_confermare',
  'inviato',
  'accettato',
  'rifiutato',
  'annullato'
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  province TEXT,
  country TEXT DEFAULT 'Italia',
  vat_number TEXT,
  fiscal_code TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quotes sequence
CREATE SEQUENCE IF NOT EXISTS quotes_quote_number_seq;

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number INTEGER NOT NULL DEFAULT nextval('quotes_quote_number_seq'),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status quote_status NOT NULL DEFAULT 'bozza',
  validity_days INTEGER DEFAULT 30,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create update_quote_total function
CREATE OR REPLACE FUNCTION public.update_quote_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.quotes 
    SET total_amount = COALESCE((
      SELECT SUM(quantity * unit_price) 
      FROM public.quote_items 
      WHERE quote_id = OLD.quote_id
    ), 0)
    WHERE id = OLD.quote_id;
    RETURN OLD;
  ELSE
    UPDATE public.quotes 
    SET total_amount = COALESCE((
      SELECT SUM(quantity * unit_price) 
      FROM public.quote_items 
      WHERE quote_id = NEW.quote_id
    ), 0)
    WHERE id = NEW.quote_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.update_quote_total();

-- Enable RLS (permissive for now - no auth)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quote_items" ON public.quote_items FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON public.clients TO anon, authenticated, service_role;
GRANT ALL ON public.quotes TO anon, authenticated, service_role;
GRANT ALL ON public.quote_items TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE quotes_quote_number_seq TO anon, authenticated, service_role;

-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO NOTHING;
