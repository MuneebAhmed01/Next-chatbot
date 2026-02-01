#!/usr/bin/env node

// Fix Payment Test Script
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./dist/models/user.model').default;

async function fixPaymentTest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/next-chatbot');
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'paymenttest@example.com' });
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Found test user:');
    console.log('   ID:', user._id.toString());
    console.log('   Email:', user.email);
    console.log('   Credits:', user.credits);

    // Test payment with correct user ID
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:4000/payment/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user._id.toString(),
        email: user.email
      })
    });

    const result = await response.json();
    
    console.log('\n🧪 Payment Test Result:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.url) {
      console.log('\n🎉 PAYMENT WORKING!');
      console.log('Checkout URL:', result.url);
    } else {
      console.log('\n❌ Payment failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixPaymentTest();
