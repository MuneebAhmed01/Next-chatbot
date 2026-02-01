# OpenRouter API Integration Setup

## Overview
This integration allows your chatbot to use OpenRouter API for AI responses with multiple model support.

## Setup Instructions

### 1. Get OpenRouter API Key
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up and create an account
3. Navigate to API Keys section
4. Copy your API key (starts with `sk-or-v1-`)

### 2. Configure Environment Variables
Create a `.env` file in the `chatbot-api` directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:

```env
# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here

# Other existing variables...
MONGODB_URI=mongodb://localhost:27017/next-chatbot
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
PORT=4000
```

### 3. Test the Integration
Run the test script to verify everything works:

```bash
cd chatbot-api
node test-openrouter.js
```

This will test multiple models to ensure the API key works correctly.

### 4. Start the Server
```bash
npm run start:dev
```

## API Endpoints

### Send Message
```bash
POST http://localhost:4000/chat/send
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "model": "openai/gpt-3.5-turbo",
  "chatId": "optional-chat-id",
  "userId": "optional-user-id"
}
```

### Get Available Models
```bash
GET http://localhost:4000/chat/models
```

## Supported Models
The integration supports all OpenRouter models, including:

- `openai/gpt-3.5-turbo`
- `openai/gpt-4`
- `anthropic/claude-3-haiku`
- `anthropic/claude-3-sonnet`
- `anthropic/claude-3-opus`
- `google/gemini-pro`
- `meta-llama/llama-3-8b-instruct`
- `meta-llama/llama-3-70b-instruct`
- And many more...

## Error Handling
The API includes comprehensive error handling for:
- Invalid API keys
- Rate limiting
- Insufficient credits
- Service unavailability
- Network timeouts

## Frontend Integration
Update your frontend to use the new API:

```javascript
const response = await fetch('http://localhost:4000/chat/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: userInput,
    model: selectedModel, // e.g., 'openai/gpt-3.5-turbo'
    chatId: currentChatId
  })
});

const data = await response.json();
if (data.success) {
  // Handle successful response
  console.log(data.data.message);
} else {
  // Handle error
  console.error(data.message);
}
```

## Troubleshooting

### "Sorry, there was an error processing your message"
This error occurs when:
1. OpenRouter API key is not set or invalid
2. Insufficient credits in OpenRouter account
3. Network connectivity issues
4. Model is unavailable

**Solutions:**
- Verify your API key in `.env`
- Check your OpenRouter account balance
- Test with the provided test script
- Check server logs for detailed error messages

### Common Issues
- **401 Unauthorized**: Invalid API key
- **402 Payment Required**: Insufficient credits
- **429 Too Many Requests**: Rate limit exceeded
- **500 Server Error**: OpenRouter service issues

## Features
- ✅ Multiple model support
- ✅ Comprehensive error handling
- ✅ Usage tracking
- ✅ Timeout protection
- ✅ Configurable temperature and max tokens
- ✅ Message logging
- ✅ Available models endpoint

## Next Steps
1. Implement proper database storage for messages
2. Add conversation history support
3. Implement user-specific chat sessions
4. Add rate limiting per user
5. Add streaming responses support
