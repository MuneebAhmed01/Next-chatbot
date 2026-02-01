# 🔧 Payment System Troubleshooting Guide

## ❌ "Failed to start checkout. Please try again." - FIXED

### 🎯 Root Cause Analysis
The error was caused by:
1. **Corrupted Stripe Key**: Hardcoded truncated Stripe key in payment service
2. **Poor Error Handling**: Generic error messages without specific details
3. **Missing Validation**: No validation of Stripe configuration
4. **No Logging**: Insufficient logging for debugging

### ✅ Fixes Applied

#### 1. Fixed Stripe Configuration
```typescript
// Before: Hardcoded broken key
this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51SLls...');

// After: Proper validation and initialization
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    throw new Error('Stripe configuration missing');
}
if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
    throw new Error('Invalid Stripe configuration');
}
this.stripe = new Stripe(stripeKey, { apiVersion: '2025-12-15.clover' });
```

#### 2. Enhanced Error Handling
```typescript
catch (error) {
    if (error.type === 'StripeCardError') {
        throw new BadRequestException('Payment processing error: ' + error.message);
    } else if (error.type === 'StripeRateLimitError') {
        throw new BadRequestException('Payment service temporarily unavailable...');
    }
    // ... specific error types
}
```

#### 3. Added Comprehensive Logging
```typescript
this.logger.log(`Creating checkout session for user: ${userId}`);
this.logger.log(`Created Stripe customer: ${customerId}`);
this.logger.error(`Failed to create Stripe customer: ${error.message}`);
```

## 🚀 Quick Fix Steps

### 1. Check Your Environment Variables
```bash
# Make sure these are set in your .env file
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_key_here
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/next-chatbot
```

### 2. Verify Stripe Key Format
- Must start with `sk_test_` (for testing) or `sk_live_` (for production)
- Should be a complete key, not truncated
- Example: `sk_test_51abcdef123456789...`

### 3. Test the Payment System
```bash
# Run the diagnostic script
node diagnose-payment.js

# Or test manually
curl -X POST http://localhost:4000/payment/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "email": "test@example.com"}'
```

## 🔍 Common Issues & Solutions

### Issue 1: "User not found"
**Cause**: User ID doesn't exist in database
**Solution**: 
```bash
# Create a user first
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
```

### Issue 2: "Stripe configuration missing"
**Cause**: STRIPE_SECRET_KEY not set in .env
**Solution**: Add your Stripe key to .env file

### Issue 3: "Invalid Stripe configuration"
**Cause**: Stripe key format is incorrect
**Solution**: Get a proper key from Stripe dashboard

### Issue 4: "Payment service temporarily unavailable"
**Cause**: Stripe API rate limit or connection issues
**Solution**: Wait and retry, check internet connection

### Issue 5: "Payment authentication failed"
**Cause**: Invalid Stripe API key
**Solution**: Verify your Stripe secret key

## 🧪 Testing Checklist

### Pre-Flight Checks
- [ ] Server is running (`npm run start:dev`)
- [ ] MongoDB is connected
- [ ] STRIPE_SECRET_KEY is set correctly
- [ ] User exists in database

### Test Scenarios
```bash
# 1. Test basic connectivity
curl http://localhost:4000/payment/credits/test-user-id

# 2. Test checkout creation
curl -X POST http://localhost:4000/payment/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"userId": "valid-user-id", "email": "user@example.com"}'

# 3. Test credit check
curl http://localhost:4000/payment/has-credits/valid-user-id

# 4. Test credit deduction
curl -X POST http://localhost:4000/payment/deduct \
  -H "Content-Type: application/json" \
  -d '{"userId": "valid-user-id"}'
```

## 📊 Expected Responses

### Success Response
```json
{
  "url": "https://checkout.stripe.com/pay/..."
}
```

### Error Responses
```json
{
  "success": false,
  "message": "User not found"
}
```

```json
{
  "success": false,
  "message": "Failed to start checkout. Please try again."
}
```

## 🎯 Debugging Steps

1. **Check Server Logs**
   ```bash
   # Look for these log messages
   "Stripe initialized successfully"
   "Creating checkout session for user: ..."
   "Created Stripe customer: ..."
   ```

2. **Verify Environment**
   ```bash
   # Check if variables are loaded
   echo $STRIPE_SECRET_KEY
   echo $FRONTEND_URL
   ```

3. **Test Stripe Directly**
   ```bash
   # Use Stripe CLI to test
   stripe listen --forward-to localhost:4000/payment/webhook
   ```

4. **Check Database**
   ```bash
   # Verify user exists
   # Check if stripeCustomerId is set
   ```

## 🔄 Integration with Frontend

### Frontend Implementation
```javascript
async function purchaseCredits(userId, email) {
  try {
    const response = await fetch('/payment/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email })
    });

    const result = await response.json();
    
    if (result.url) {
      // Redirect to Stripe checkout
      window.location.href = result.url;
    } else {
      alert('Payment failed: ' + result.message);
    }
  } catch (error) {
    alert('Payment error: ' + error.message);
  }
}
```

## ✅ Resolution Summary

The "Failed to start checkout" error has been completely resolved by:

1. ✅ **Fixed Stripe Configuration**: Proper key validation and initialization
2. ✅ **Enhanced Error Handling**: Specific error messages for different failure types
3. ✅ **Added Logging**: Comprehensive logging for debugging
4. ✅ **Improved Validation**: Better input validation and error responses
5. ✅ **Created Diagnostic Tools**: Scripts to help troubleshoot issues

The payment system is now robust and will provide clear error messages for any issues that occur! 🎉
