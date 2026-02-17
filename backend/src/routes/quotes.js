import express from 'express';
import Quote from '../models/Quote.js';

const router = express.Router();

// GET all quotes with client populated
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find()
      .populate('client_id')
      .sort({ quote_number: -1 });
    
    // Transform to match frontend expectations
    const transformed = quotes.map(q => {
      const obj = q.toJSON();
      obj.client = obj.client_id ? { ...q.client_id.toJSON() } : null;
      delete obj.client_id;
      return obj;
    });
    
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single quote with client
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('client_id');
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const obj = quote.toJSON();
    obj.client = obj.client_id ? { ...quote.client_id.toJSON() } : null;
    obj.client_id = quote.client_id?._id?.toString();
    
    res.json(obj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET quote items
router.get('/:id/items', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const items = quote.items.map(item => ({
      ...item.toJSON(),
      quote_id: req.params.id
    }));
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create quote
router.post('/', async (req, res) => {
  try {
    const quote = new Quote({
      client_id: req.body.client_id,
      quote_date: req.body.quote_date || new Date(),
      validity_days: req.body.validity_days || 5,
      notes: req.body.notes,
      items: []
    });
    await quote.save();
    
    const populated = await Quote.findById(quote._id).populate('client_id');
    const obj = populated.toJSON();
    obj.client = obj.client_id ? { ...populated.client_id.toJSON() } : null;
    
    res.status(201).json(obj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update quote
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.items; // Items are managed separately
    delete updateData.client; // Don't update populated field
    
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('client_id');
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const obj = quote.toJSON();
    obj.client = obj.client_id ? { ...quote.client_id.toJSON() } : null;
    
    res.json(obj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH update quote status
router.patch('/:id/status', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('client_id');
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const obj = quote.toJSON();
    obj.client = obj.client_id ? { ...quote.client_id.toJSON() } : null;
    
    res.json(obj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE quote
router.delete('/:id', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add item to quote
router.post('/:id/items', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    quote.items.push({
      description: req.body.description,
      item_notes: req.body.item_notes || '',
      quantity: req.body.quantity || 1,
      unit_price: req.body.unit_price || 0,
      sort_order: req.body.sort_order || quote.items.length
    });
    
    quote.recalculateTotal();
    await quote.save();
    
    const newItem = quote.items[quote.items.length - 1];
    res.status(201).json({
      ...newItem.toJSON(),
      quote_id: req.params.id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update item
router.put('/:quoteId/items/:itemId', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const item = quote.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    Object.assign(item, {
      description: req.body.description ?? item.description,
      item_notes: req.body.item_notes ?? item.item_notes,
      quantity: req.body.quantity ?? item.quantity,
      unit_price: req.body.unit_price ?? item.unit_price,
      sort_order: req.body.sort_order ?? item.sort_order
    });
    
    quote.recalculateTotal();
    await quote.save();
    
    res.json({
      ...item.toJSON(),
      quote_id: req.params.quoteId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE item
router.delete('/:quoteId/items/:itemId', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    quote.items.pull(req.params.itemId);
    quote.recalculateTotal();
    await quote.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
