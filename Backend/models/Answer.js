import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  voteScore: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
answerSchema.index({ question: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ isAccepted: 1 });
answerSchema.index({ voteScore: -1 });

export default mongoose.model('Answer', answerSchema);