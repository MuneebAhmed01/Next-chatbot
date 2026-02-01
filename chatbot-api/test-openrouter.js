// Test script to verify OpenRouter integration
// Run with: node test-openrouter.js

const fetch = require('node-fetch');

async function testOpenRouterIntegration() {
  console.log('Testing OpenRouter API integration...\n');

  // Check if API key is set
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables');
    console.log('Please set your OpenRouter API key in your .env file');
    return;
  }

  console.log('✅ API key found');

  // Test different models
  const models = [
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3-haiku',
    'google/gemini-pro',
    'meta-llama/llama-3-8b-instruct'
  ];

  for (const model of models) {
    console.log(`\n🧪 Testing model: ${model}`);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Next-Chatbot-Test',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant.'
            },
            {
              role: 'user',
              content: 'Hello! Please respond with a short greeting.'
            }
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Error with ${model}: ${response.status} - ${errorData.error?.message || response.statusText}`);
        continue;
      }

      const data = await response.json();
      const message = data.choices[0]?.message?.content;
      
      if (message) {
        console.log(`✅ ${model}: "${message.trim()}"`);
        console.log(`   Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
      } else {
        console.log(`❌ ${model}: No response received`);
      }

    } catch (error) {
      console.error(`❌ Error with ${model}: ${error.message}`);
    }
  }

  console.log('\n🎉 OpenRouter integration test completed!');
  console.log('\nTo use the API:');
  console.log('1. Make sure your OPENROUTER_API_KEY is set in .env');
  console.log('2. Start the NestJS server: npm run start:dev');
  console.log('3. Send POST requests to http://localhost:4000/chat/send');
  console.log('   with body: { "message": "Hello", "model": "openai/gpt-3.5-turbo" }');
}

// Load environment variables
require('dotenv').config();

testOpenRouterIntegration().catch(console.error);
