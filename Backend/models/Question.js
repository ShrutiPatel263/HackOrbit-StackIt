import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 20
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  voteScore: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  },
  hasAcceptedAnswer: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
questionSchema.index({ author: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ voteScore: -1 });
questionSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Question', questionSchema);