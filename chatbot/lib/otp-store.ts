import fs from 'fs';
import path from 'path';

interface OTPData {
  otp: string;
  expiresAt: number;
  purpose: 'reset' | 'register';
}

interface OTPStore {
  [key: string]: OTPData;
}

// Use a file to persist OTPs across serverless function invocations
const OTP_FILE = path.join(process.cwd(), '.otp-store.json');

function readStore(): OTPStore {
  try {
    if (fs.existsSync(OTP_FILE)) {
      const data = fs.readFileSync(OTP_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading OTP store:', error);
  }
  return {};
}

function writeStore(store: OTPStore): void {
  try {
    fs.writeFileSync(OTP_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Error writing OTP store:', error);
  }
}

// Helper to create consistent key
function getKey(email: string, purpose: 'reset' | 'register'): string {
  return `${email.toLowerCase().trim()}:${purpose}`;
}

// Clean expired OTPs
function cleanExpired(store: OTPStore): OTPStore {
  const now = Date.now();
  const cleaned: OTPStore = {};
  for (const [key, data] of Object.entries(store)) {
    if (now <= data.expiresAt) {
      cleaned[key] = data;
    }
  }
  return cleaned;
}

// Save OTP for 10 min
export function saveOTP(email: string, otp: string, purpose: 'reset' | 'register') {
  const key = getKey(email, purpose);
  const normalizedOTP = String(otp).trim();
  
  console.log('=== SAVING OTP ===');
  console.log('Key:', key);
  console.log('OTP:', normalizedOTP);
  
  const store = cleanExpired(readStore());
  store[key] = {
    otp: normalizedOTP,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    purpose,
  };
  writeStore(store);
  
  console.log('OTP saved successfully');
}

// Verify OTP is correct or not
export function verifyOTP(email: string, otp: string, purpose: 'reset' | 'register'): boolean {
  const key = getKey(email, purpose);
  const normalizedOTP = String(otp).trim();
  
  console.log('=== VERIFYING OTP ===');
  console.log('Key:', key);
  console.log('Provided OTP:', `"${normalizedOTP}"`);
  
  const store = readStore();
  const data = store[key];
  
  console.log('Stored data:', data);
  
  if (!data) {
    console.log('No OTP found for this key');
    return false;
  }
  
  if (data.purpose !== purpose) {
    console.log('Purpose mismatch');
    return false;
  }
  
  if (Date.now() > data.expiresAt) {
    console.log('OTP expired');
    delete store[key];
    writeStore(store);
    return false;
  }
  
  const storedOTP = String(data.otp).trim();
  console.log('Stored OTP:', `"${storedOTP}"`);
  console.log('Match:', storedOTP === normalizedOTP);
  
  if (storedOTP !== normalizedOTP) {
    console.log('OTP does not match');
    return false;
  }

  // OTP is valid - delete it so it can't be reused
  delete store[key];
  writeStore(store);
  console.log('OTP verified and deleted');
  return true;
}

export function hasValidOTP(email: string, purpose: 'reset' | 'register'): boolean {
  const key = getKey(email, purpose);
  const store = readStore();
  const data = store[key];
  const isValid = data ? Date.now() <= data.expiresAt : false;
  console.log('hasValidOTP:', key, isValid);
  return isValid;
}
