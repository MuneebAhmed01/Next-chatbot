#!/usr/bin/env node

// Quick Stripe Configuration Test
require('dotenv').config();

console.log('🔍 Stripe Configuration Test');
console.log('============================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? 
  (process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' + process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)) : 
  '❌ NOT SET');

console.log('Frontend URL:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');

// Test Stripe initialization
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
    
    console.log('\n✅ Stripe initialized successfully');
    
    // Test Stripe API connection
    stripe.accounts.retrieve().then(() => {
      console.log('✅ Stripe API connection successful');
    }).catch(error => {
      console.log('❌ Stripe API connection failed:', error.message);
    });
    
  } catch (error) {
    console.log('❌ Stripe initialization failed:', error.message);
  }
} else {
  console.log('\n❌ Cannot test Stripe - API key not set');
}

// Test payment endpoint
console.log('\n🧪 Testing Payment Endpoint...');
const fetch = require('node-fetch');

async function testPayment() {
  try {
    const response = await fetch('http://localhost:4000/payment/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-123',
        email: 'test@example.com'
      })
    });

    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok && result.url) {
      console.log('✅ Payment endpoint working!');
      console.log(`Checkout URL: ${result.url.substring(0, 50)}...`);
    } else {
      console.log('❌ Payment endpoint failed:');
      console.log('Error:', result.message || 'Unknown error');
      
      // Analyze the error
      if (result.message?.includes('User not found')) {
        console.log('💡 Solution: Create a user first');
      } else if (result.message?.includes('Stripe')) {
        console.log('💡 Solution: Check Stripe configuration');
      } else if (result.message?.includes('configuration')) {
        console.log('💡 Solution: Check environment variables');
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('💡 Solution: Make sure server is running (npm run start:dev)');
  }
}

testPayment();
