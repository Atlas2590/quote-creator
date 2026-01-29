import express from 'express';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import Quote from '../models/Quote.js';
import Template from '../models/Template.js';

const router = express.Router();

// POST export quote to DOCX
router.post('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('client_id');
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Get template
    const template = await Template.findOne({ name: 'preventivo_template' });
    if (!template) {
      return res.status(404).json({ 
        error: 'Template not found. Please upload preventivo_template.docx' 
      });
    }

    // Load template
    const zip = new PizZip(template.data);
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
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    const client = quote.client_id;

    // Prepare items data
    const itemsData = quote.items.map((item, index) => ({
      n: index + 1,
      descrizione: item.description,
      quantita: item.quantity,
      prezzo_unitario: formatCurrency(item.unit_price),
      totale_riga: formatCurrency(item.quantity * item.unit_price)
    }));

    // Prepare template data
    const templateData = {
      numero_preventivo: quote.quote_number,
      data_preventivo: formattedDate,
      validita_giorni: quote.validity_days || 30,
      ragione_sociale: client?.company_name || '',
      indirizzo: client?.address || '',
      cap: client?.postal_code || '',
      citta: client?.city || '',
      provincia: client?.province || '',
      paese: client?.country || 'Italia',
      partita_iva: client?.vat_number || '',
      codice_fiscale: client?.fiscal_code || '',
      email: client?.email || '',
      telefono: client?.phone || '',
      referente: client?.contact_person || '',
      articoli: itemsData,
      totale: formatCurrency(quote.total_amount || 0),
      note: quote.notes || ''
    };

    // Render document
    doc.render(templateData);

    // Generate output buffer
    const outputBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const filename = `Preventivo_${quote.quote_number}_${client?.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}.docx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': outputBuffer.length
    });

    res.send(outputBuffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

export default router;
