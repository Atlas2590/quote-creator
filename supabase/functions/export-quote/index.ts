import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PizZip from "https://esm.sh/pizzip@3.1.7";
import Docxtemplater from "https://esm.sh/docxtemplater@3.47.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quoteId, format = 'docx' } = await req.json();

    if (!quoteId) {
      return new Response(
        JSON.stringify({ error: 'quoteId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting quote ${quoteId} as ${format}`);

    // Initialize Supabase client with service role for storage access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch quote with client and items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Quote fetch error:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Quote not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch quote items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('sort_order');

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
    }

    // Download template from storage
    const { data: templateData, error: templateError } = await supabase.storage
      .from('templates')
      .download('preventivo_template.docx');

    if (templateError || !templateData) {
      console.error('Template download error:', templateError);
      return new Response(
        JSON.stringify({ 
          error: 'Template not found. Please upload preventivo_template.docx to the templates bucket.',
          details: templateError?.message 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Template downloaded successfully');

    // Convert template to ArrayBuffer
    const templateBuffer = await templateData.arrayBuffer();
    
    // Load template with PizZip
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Format date
    const quoteDate = new Date(quote.quote_date);
    const formattedDate = quoteDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    // Prepare items data
    const itemsData = (items || []).map((item, index) => ({
      n: index + 1,
      descrizione: item.description,
      quantita: item.quantity,
      prezzo_unitario: formatCurrency(Number(item.unit_price)),
      totale_riga: formatCurrency(Number(item.quantity) * Number(item.unit_price))
    }));

    // Prepare template data
    const templateDataObj = {
      // Quote info
      numero_preventivo: quote.quote_number,
      data_preventivo: formattedDate,
      validita_giorni: quote.validity_days || 5,
      
      // Client info
      ragione_sociale: quote.client?.company_name || '',
      indirizzo: quote.client?.address || '',
      cap: quote.client?.postal_code || '',
      citta: quote.client?.city || '',
      provincia: quote.client?.province || '',
      paese: quote.client?.country || 'Italia',
      partita_iva: quote.client?.vat_number || '',
      codice_fiscale: quote.client?.fiscal_code || '',
      email: quote.client?.email || '',
      telefono: quote.client?.phone || '',
      referente: quote.client?.contact_person || '',
      
      // Items
      articoli: itemsData,
      
      // Totals
      totale: formatCurrency(Number(quote.total_amount || 0)),
      
      // Notes
      note: quote.notes || ''
    };

    console.log('Template data prepared:', JSON.stringify(templateDataObj, null, 2));

    // Render document
    doc.render(templateDataObj);

    // Generate output buffer
    const outputBuffer = doc.getZip().generate({
      type: 'arraybuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }) as ArrayBuffer;

    const filename = `Preventivo_${quote.quote_number}_${quote.client?.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}.docx`;

    console.log(`Generated document: ${filename}`);

    return new Response(outputBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Export failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
