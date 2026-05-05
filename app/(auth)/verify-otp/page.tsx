"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { GlassInput } from "@/components/GlassInput";
import { ClayButton } from "@/components/ClayButton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { verify_otp } = useAuthStore();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await verify_otp(email, otp);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-10 border-white/10 relative overflow-hidden group">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mx-auto mb-6">
          <span className="material-symbols-outlined text-primary text-4xl">mark_email_read</span>
        </div>
        <h2 className="font-headline text-3xl font-extrabold text-white mb-2">Verify Your Email</h2>
        <p className="text-slate-400 font-body">
          We've sent a 6-digit code to <span className="text-white font-bold">{email}</span>
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassInput
            label="Verification Code"
            type="text"
            placeholder="000000"
            maxLength={6}
            icon="pin"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <ClayButton 
            type="submit" 
            variant="blue" 
            className="w-full py-4 text-base tracking-widest uppercase font-black"
            disabled={loading || otp.length !== 6}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </ClayButton>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Didn't receive the code?{" "}
              <button type="button" className="text-primary hover:underline font-bold">
                Resend OTP
              </button>
            </p>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-primary font-bold text-xl mb-4"
          >
            Verification Successful!
          </motion.div>
          <p className="text-slate-400">Redirecting you to login...</p>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-white/5 text-center">
        <Link href="/register" className="text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
          Back to Registration
        </Link>
      </div>
    </GlassCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
