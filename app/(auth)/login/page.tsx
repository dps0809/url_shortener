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
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Or connect with</p>
            <div className="flex gap-4 mt-4">
              <button className="flex-1 glass-card bg-white/5 py-3 flex items-center justify-center hover:bg-white/10 transition-all">
                <img src="https://lh3.googleusercontent.com/COxitq999s9re7fO866XpPOfA29YFasWvABAsTfG5PseS-9zC1mOjp9rF8t-69C1z_2XfH9fAETP24S2XfH9fAETP" className="w-5 h-5 grayscale opacity-60" alt="Google" />
              </button>
              <button className="flex-1 glass-card bg-white/5 py-3 flex items-center justify-center hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-slate-400">fingerprint</span>
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
                <span className="material-symbols-outlined text-primary text-3xl">protected_policy</span>
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
