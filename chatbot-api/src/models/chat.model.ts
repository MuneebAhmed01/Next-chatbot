import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Chat'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
