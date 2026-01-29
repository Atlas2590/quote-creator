import express from 'express';
import multer from 'multer';
import Template from '../models/Template.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET list templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload template
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const name = req.body.name || req.file.originalname.replace(/\.[^/.]+$/, '');
    
    // Upsert template
    const template = await Template.findOneAndUpdate(
      { name },
      {
        name,
        filename: req.file.originalname,
        data: req.file.buffer,
        mimetype: req.file.mimetype
      },
      { upsert: true, new: true }
    );

    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET download template
router.get('/:name/download', async (req, res) => {
  try {
    const template = await Template.findOne({ name: req.params.name });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.set({
      'Content-Type': template.mimetype,
      'Content-Disposition': `attachment; filename="${template.filename}"`,
      'Content-Length': template.data.length
    });

    res.send(template.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE template
router.delete('/:name', async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({ name: req.params.name });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
