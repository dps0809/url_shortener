"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { GlassInput } from "@/components/GlassInput";
import { ClayButton } from "@/components/ClayButton";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login({ email: data.email, password: data.password });
      if (result.success) {
        router.push("/dashboard");
      } else {
        if (result.error?.includes("verify your OTP")) {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
        } else {
          setError(result.error || "Invalid credentials");
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback')}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Existing Login Card */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <GlassCard className="p-10 border-white/10 relative overflow-hidden group">
          <div className="mb-8">
            <h2 className="font-headline text-4xl font-extrabold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 font-body">Sign in to your professional link dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              icon="mail"
              {...register("email")}
              error={errors.email?.message}
            />
            <GlassInput
              label="Password"
              type="password"
              placeholder="••••••••"
              icon="lock"
              {...register("password")}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-offset-0 focus:ring-primary/50" />
                <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <Link href="#" className="text-xs text-primary hover:underline font-bold">Forgot password?</Link>
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <ClayButton 
              type="submit" 
              variant="blue" 
              className="w-full py-4 text-base tracking-widest uppercase font-black"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login to System"}
            </ClayButton>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Or continue with</p>
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 glass-card bg-white/5 py-3 px-4 flex items-center justify-center gap-3 hover:bg-white/10 transition-all rounded-lg group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Continue with Google</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* 1:1 Dual Content Overlay Card */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="hidden lg:block relative"
      >
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-30 -z-10" />
        <div className="p-12 space-y-12">
          <div className="glass-card animate-float border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="currentColor" opacity="0.2"/>
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.23 9.36-7 10.57-3.77-1.21-7-5.74-7-10.57V6.3l7-3.12z" fill="currentColor"/>
                  <path d="M10 12l-1.5 1.5L10 15l4-4-1.5-1.5L10 12z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-headline text-xl font-bold">Deep Protection</p>
                <p className="text-slate-400 text-sm">256-bit Link Encryption</p>
              </div>
            </div>
          </div>

          <div className="pl-12">
            <h3 className="font-headline text-3xl font-bold text-white mb-6">Don&apos;t have an account?</h3>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed">Join 40,000+ top-tier professionals who trust ShortLink for their mission-critical link optimization needs.</p>
            <Link href="/register">
              <ClayButton variant="glass" className="px-10 border-white/10 hover:bg-white/5">
                Apply for Access
                <span className="material-symbols-outlined ml-2">person_add</span>
              </ClayButton>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

