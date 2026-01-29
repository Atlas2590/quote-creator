import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  data: { type: Buffer, required: true },
  mimetype: { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.data; // Don't send binary data in JSON
      return ret;
    }
  }
});

export default mongoose.model('Template', templateSchema);
