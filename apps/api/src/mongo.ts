import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const taskSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 }, // Use UUID as _id
  id: { type: String, unique: true }, // copy of _id for easier syncing/reference if needed, or just map _id
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false
});

// Map _id to id virtual if needed, but PowerSync usually works with 'id'.
// We will store 'id' explicitly or use _id as id.
// Let's use `id` field explicitly and _id as same string.
taskSchema.pre('save', function(next) {
  if (!this.id) this.id = this._id;
  this.updatedAt = new Date();
  next();
});

export const Task = mongoose.model('Task', taskSchema);

export const connectMongo = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/demo';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Mongo connection error:', err);
    process.exit(1);
  }
};
