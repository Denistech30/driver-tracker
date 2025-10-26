import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!auth) {
      setError('Authentication service not available');
      setLoading(false);
      return;
    }
    
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  async function handleForgot() {
    if (!email) {
      setError('Enter your email to reset password');
      return;
    }
    
    if (!auth) {
      setError('Authentication service not available');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #2B6CB0, #4A90E2, #1E4A78)' }}>
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Xpense</h1>
            <p className="text-sm text-gray-600 mt-1">Track your driving finances securely</p>
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode==='signin' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode==='signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className={`mb-4 text-sm ${error.includes('sent') ? 'text-emerald-600' : 'text-rose-600'}`}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 pr-10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-900"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white font-medium py-2.5 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-60"
            >
              {loading ? 'Please wait…' : (mode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button onClick={handleForgot} className="text-indigo-600 hover:text-indigo-700">Forgot password?</button>
            <button onClick={() => setMode(mode==='signin' ? 'signup' : 'signin')} className="text-gray-600 hover:text-gray-900">
              {mode==='signin' ? 'Create an account' : 'Have an account? Sign in'}
            </button>
          </div>

          {/* Debug Section - Remove after fixing */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold mb-2">🔍 Debug Info (Remove after fixing)</h3>
            <div className="space-y-1">
              <div>API_KEY: {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ SET' : '❌ NOT SET'}</div>
              <div>AUTH_DOMAIN: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ SET' : '❌ NOT SET'}</div>
              <div>PROJECT_ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ SET' : '❌ NOT SET'}</div>
              <div>STORAGE_BUCKET: {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ SET' : '❌ NOT SET'}</div>
              <div>MESSAGING_SENDER_ID: {import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ SET' : '❌ NOT SET'}</div>
              <div>APP_ID: {import.meta.env.VITE_FIREBASE_APP_ID ? '✅ SET' : '❌ NOT SET'}</div>
              <div>MEASUREMENT_ID: {import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? '✅ SET' : '❌ NOT SET'}</div>
              <div className="mt-2 pt-2 border-t">
                <div>Auth Available: {auth ? '✅ YES' : '❌ NO'}</div>
                <div>Error: {error || 'None'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
