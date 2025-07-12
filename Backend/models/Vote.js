import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['question', 'answer'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  voteType: {
    type: String,
    enum: ['up', 'down'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one vote per user per target
voteSchema.index({ user: 1, targetId: 1 }, { unique: true });
voteSchema.index({ targetId: 1, targetType: 1 });

export default mongoose.model('Vote', voteSchema);