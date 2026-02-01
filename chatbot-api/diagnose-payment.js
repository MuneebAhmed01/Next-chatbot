#!/usr/bin/env node

// Payment System Diagnostic Script
// Run with: node diagnose-payment.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';

async function testPaymentEndpoint(endpoint, method = 'POST', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    if (body) console.log(`📤 Body:`, JSON.stringify(body, null, 2));

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Response:`, JSON.stringify(data, null, 2));

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function diagnosePaymentIssues() {
  console.log('🔍 Payment System Diagnostic');
  console.log('============================');

  // Check if server is running
  console.log('\n📡 Testing server connectivity...');
  const healthCheck = await testPaymentEndpoint('/payment/credits/test-user', 'GET');
  if (!healthCheck.success && healthCheck.status !== 404) {
    console.log('❌ Server is not running. Please start it with: npm run start:dev');
    return;
  }

  // Test 1: Create checkout session with valid data
  console.log('\n💳 Testing checkout session creation...');
  const checkoutTest = await testPaymentEndpoint('/payment/create-checkout-session', 'POST', {
    userId: 'test-user-id',
    email: 'test@example.com'
  });

  if (checkoutTest.success && checkoutTest.data.url) {
    console.log('✅ Checkout session created successfully');
    console.log(`🔗 Checkout URL: ${checkoutTest.data.url}`);
  } else {
    console.log('❌ Checkout session creation failed');
    
    // Common issues and solutions
    console.log('\n🔧 Common Issues & Solutions:');
    
    if (checkoutTest.data?.message?.includes('User not found')) {
      console.log('❌ Issue: User not found in database');
      console.log('💡 Solution: Create a user first or check userId');
    }
    
    if (checkoutTest.data?.message?.includes('Stripe')) {
      console.log('❌ Issue: Stripe configuration problem');
      console.log('💡 Solution: Check STRIPE_SECRET_KEY in .env');
    }
    
    if (checkoutTest.status === 500) {
      console.log('❌ Issue: Server internal error');
      console.log('💡 Solution: Check server logs for details');
    }
  }

  // Test 2: Check user credits
  console.log('\n💰 Testing credit check...');
  const creditsTest = await testPaymentEndpoint('/payment/credits/test-user-id', 'GET');

  if (creditsTest.success) {
    console.log(`✅ User has ${creditsTest.data.credits} credits`);
  } else {
    console.log('❌ Failed to check user credits');
  }

  // Test 3: Check if user has credits
  console.log('\n🔍 Testing has-credits endpoint...');
  const hasCreditsTest = await testPaymentEndpoint('/payment/has-credits/test-user-id', 'GET');

  if (hasCreditsTest.success) {
    console.log(`✅ User has credits: ${hasCreditsTest.data.hasCredits}`);
  } else {
    console.log('❌ Failed to check if user has credits');
  }

  console.log('\n🔧 Environment Variables Check:');
  console.log('=============================');
  
  // Check required environment variables
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'FRONTEND_URL',
    'MONGODB_URI'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      if (varName === 'STRIPE_SECRET_KEY') {
        const masked = value.substring(0, 7) + '...' + value.substring(value.length - 4);
        console.log(`✅ ${varName}: ${masked}`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  }

  console.log('\n📋 Troubleshooting Steps:');
  console.log('========================');
  console.log('1. Ensure Stripe secret key starts with "sk_test_" or "sk_live_"');
  console.log('2. Check that MongoDB is running and accessible');
  console.log('3. Verify user exists in database before creating checkout');
  console.log('4. Check server logs for detailed error messages');
  console.log('5. Ensure frontend URL is correctly configured');

  console.log('\n🧪 Test User Creation:');
  console.log('=====================');
  console.log('If user doesn\'t exist, create one first:');
  console.log('POST /auth/register');
  console.log('{ "email": "test@example.com", "password": "password123", "name": "Test User" }');

  console.log('\n🎯 Manual Testing:');
  console.log('================');
  console.log('You can test Stripe checkout manually:');
  console.log('1. Create a user account');
  console.log('2. Call POST /payment/create-checkout-session');
  console.log('3. Use the returned URL to test payment flow');
}

// Check environment
if (!process.env.STRIPE_SECRET_KEY) {
  console.log('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.log('Please set it in your .env file');
}

if (!process.env.FRONTEND_URL) {
  console.log('⚠️ FRONTEND_URL not set, using default: http://localhost:3000');
}

diagnosePaymentIssues().catch(console.error);
