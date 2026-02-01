import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  model: {
    type: String,
    default: 'openai/gpt-3.5-turbo'
  }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
