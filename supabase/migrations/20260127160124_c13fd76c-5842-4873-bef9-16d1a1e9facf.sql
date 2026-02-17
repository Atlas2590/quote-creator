-- Enum per gli stati dei preventivi
CREATE TYPE public.quote_status AS ENUM (
  'bozza',
  'da_controllare', 
  'da_confermare',
  'inviato',
  'accettato',
  'rifiutato',
  'annullato'
);

-- Tabella clienti
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella preventivi
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number SERIAL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  validity_days INTEGER DEFAULT 5,
  status quote_status NOT NULL DEFAULT 'bozza',
  notes TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella righe preventivo
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger per clients
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger per quotes
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Funzione per aggiornare il totale del preventivo
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

-- Trigger per aggiornare totale
CREATE TRIGGER update_quote_total_on_items
AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION public.update_quote_total();

-- RLS policies (pubbliche per ora, poi aggiungeremo auth)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Policy per accesso pubblico (temporaneo - poi aggiungeremo auth)
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quote_items" ON public.quote_items FOR ALL USING (true) WITH CHECK (true);