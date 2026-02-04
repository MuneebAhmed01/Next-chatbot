'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateForm, getFieldError } from '../../lib/validation/client-validation';
import { registerSchema, otpSchema, type RegisterFormData, type OtpFormData } from '../../lib/validation/schemas';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const sendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const formData: RegisterFormData = { name, email, password };
    const validation = validateForm(registerSchema, formData);
    
    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register', name, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const formData: OtpFormData = { otp };
    const validation = validateForm(otpSchema, formData);
    
    if (!validation.success) {
      setFieldErrors(validation.errors || {});
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, otp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Registration failed');
        if (data.error?.includes('expired')) {
          setOtp('');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    setError('');
    await sendOTP();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Create account</h2>
          <p className="mt-2 text-center text-gray-600">
            {step === 1 ? 'Enter your details to register' : 'Verify your email with OTP'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={sendOTP} className="space-y-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                getFieldError(fieldErrors, 'name') 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              }`}
            />
            {getFieldError(fieldErrors, 'name') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(fieldErrors, 'name')}</p>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                getFieldError(fieldErrors, 'email') 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              }`}
            />
            {getFieldError(fieldErrors, 'email') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(fieldErrors, 'email')}</p>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                getFieldError(fieldErrors, 'password') 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              }`}
            />
            {getFieldError(fieldErrors, 'password') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(fieldErrors, 'password')}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div className="text-center text-sm text-gray-900">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </div>
          </form>
        ) : (
          <form onSubmit={verifyAndRegister} className="space-y-6">
            <div className="text-center text-sm text-gray-600 mb-4">
              OTP sent to <strong>{email}</strong>
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setOtp(val);
                setError('');
              }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest ${
                getFieldError(fieldErrors, 'otp') 
                  ? 'border-red-500' 
                  : 'border-gray-300'
              }`}
            />
            {getFieldError(fieldErrors, 'otp') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(fieldErrors, 'otp')}</p>
            )}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                Resend OTP
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  className="text-sm text-gray-900 hover:text-gray-700"
                >
                  ←- Change email
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
