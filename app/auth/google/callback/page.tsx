"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { motion } from 'framer-motion';

function GoogleCallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const set_user = useAuthStore((state) => state.set_user);
  const set_token = useAuthStore((state) => state.set_token);
  const hasFetched = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('No authorization code found');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const exchangeCode = async () => {
      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok) {
          set_user(data.user);
          set_token(data.token);
          router.push('/dashboard');
        } else {
          setError(data.error || 'Google login failed');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during Google login');
      }
    };

    exchangeCode();
  }, [searchParams, router, set_user, set_token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Login Failed</h1>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-6 px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl text-white font-medium">Completing Google Login...</h2>
        <p className="text-slate-400 mt-2">Please wait while we redirect you.</p>
      </motion.div>
    </div>
  );
}

export default function GoogleCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
