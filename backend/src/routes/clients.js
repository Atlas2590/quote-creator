import express from 'express';
import Client from '../models/Client.js';
import Quote from '../models/Quote.js';

const router = express.Router();

// GET all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ company_name: 1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET client quotes count
router.get('/:id/quotes-count', async (req, res) => {
  try {
    const count = await Quote.countDocuments({ client_id: req.params.id });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create client
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    // Check if client has quotes
    const quotesCount = await Quote.countDocuments({ client_id: req.params.id });
    if (quotesCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with existing quotes' 
      });
    }
    
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
