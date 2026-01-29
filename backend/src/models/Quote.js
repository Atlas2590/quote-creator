import mongoose from 'mongoose';
import Counter from './Counter.js';

const quoteItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, default: 0 },
  sort_order: { type: Number, default: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const quoteSchema = new mongoose.Schema({
  quote_number: { type: Number, unique: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  quote_date: { type: Date, default: Date.now },
  validity_days: { type: Number, default: 30 },
  status: { 
    type: String, 
    enum: ['bozza', 'da_controllare', 'da_confermare', 'inviato', 'accettato', 'rifiutato', 'annullato'],
    default: 'bozza'
  },
  notes: String,
  total_amount: { type: Number, default: 0 },
  items: [quoteItemSchema],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.client_id = ret.client_id?.toString();
      // Format date as YYYY-MM-DD
      if (ret.quote_date) {
        ret.quote_date = ret.quote_date.toISOString().split('T')[0];
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Auto-increment quote_number
quoteSchema.pre('save', async function(next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'quote_number' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.quote_number = counter.seq;
  }
  
  // Calculate total_amount from items
  this.total_amount = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
  
  next();
});

// Recalculate total on item changes
quoteSchema.methods.recalculateTotal = function() {
  this.total_amount = this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
};

export default mongoose.model('Quote', quoteSchema);
