import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Tag', tagSchema);