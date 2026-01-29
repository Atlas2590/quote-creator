import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  address: String,
  city: String,
  postal_code: String,
  province: String,
  country: { type: String, default: 'Italia' },
  vat_number: String,
  fiscal_code: String,
  email: String,
  phone: String,
  contact_person: String,
  notes: String,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
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

export default mongoose.model('Client', clientSchema);
