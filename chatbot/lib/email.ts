import nodemailer from 'nodemailer';


console.log('Email config:', {
  user: process.env.EMAIL_USER ? 'loaded' : 'missing',
  pass: process.env.EMAIL_PASS ? 'loaded' : 'missing',
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ''), 
  },
});

export async function sendOTP(email: string, otp: string, purpose: 'reset' | 'register') {
  const subjects = {
    reset: 'Password Reset OTP',
    register: 'Email Verification OTP',
  };
  const subject = subjects[purpose];

  try {
    const info = await transporter.sendMail({
      from: `"Chatbot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="font-size: 16px; color: #555;">Your OTP code is:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #777;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
