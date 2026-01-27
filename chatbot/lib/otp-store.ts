interface OTPData {
  otp: string;
  expiresAt: number;
  purpose: 'reset' | 'register';
}

const otpStore = new Map<string, OTPData>();

// clean old otp after 5 minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of otpStore.entries()) {
      if (now > data.expiresAt) {
        otpStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
// sav it for 10 min
export function saveOTP(email: string, otp: string, purpose: 'reset' | 'register') {
  otpStore.set(`${email}:${purpose}`, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, 
    purpose,
  });
}
// verify otp is corr or not
export function verifyOTP(email: string, otp: string, purpose: 'reset' | 'register'): boolean {
  const key = `${email}:${purpose}`;
  const data = otpStore.get(key);

  if (!data) return false;
  if (data.purpose !== purpose) return false;
  if (Date.now() > data.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  if (data.otp !== otp) return false;

  otpStore.delete(key);
  return true;
}

export function hasValidOTP(email: string, purpose: 'reset' | 'register'): boolean {
  const data = otpStore.get(`${email}:${purpose}`);
  return data ? Date.now() <= data.expiresAt : false;
}
