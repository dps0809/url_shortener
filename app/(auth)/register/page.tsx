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

const registerSchema = z.object({
  name: z.string().min(2, "Full Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Valid phone number is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        username: data.username,
        phone: data.phone
      });
      if (result.success) {
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback')}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Existing Information Text Area (Left) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:block relative"
      >
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-30 -z-10" />
        <div className="p-12 space-y-12">
          <div className="glass-card animate-float border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                  <path d="M10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.41L10 14.17z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-headline text-xl font-bold">Trusted Network</p>
                <p className="text-slate-400 text-sm">Verified Credentials System</p>
              </div>
            </div>
          </div>

          <div className="pr-12">
            <h3 className="font-headline text-3xl font-bold text-white mb-6">Already have an account?</h3>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed">Log in to continue managing your mission-critical links.</p>
            <Link href="/login">
              <ClayButton variant="glass" className="px-10 border-white/10 hover:bg-white/5">
                Login to Desktop
                <span className="material-symbols-outlined ml-2">person</span>
              </ClayButton>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Main Register Card (Right) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <GlassCard className="p-10 border-white/10 relative overflow-hidden group">
          <div className="mb-8">
            <h2 className="font-headline text-4xl font-extrabold text-white mb-2">Create Account</h2>
            <p className="text-slate-400 font-body">Begin your high-fidelity SaaS journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <GlassInput
              label="Full Name"
              type="text"
              placeholder="John Doe"
              icon="badge"
              {...register("name")}
              error={errors.name?.message}
            />
            <GlassInput
              label="Username"
              type="text"
              placeholder="johndoe"
              icon="alternate_email"
              {...register("username")}
              error={errors.username?.message}
            />
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              icon="mail"
              {...register("email")}
              error={errors.email?.message}
            />
            <GlassInput
              label="Phone Number"
              type="tel"
              placeholder="+1234567890"
              icon="call"
              {...register("phone")}
              error={errors.phone?.message}
            />
            <GlassInput
              label="Password"
              type="password"
              placeholder="••••••••"
              icon="lock"
              {...register("password")}
              error={errors.password?.message}
            />

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" required className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-offset-0 focus:ring-primary/50" />
              <p className="text-xs text-slate-400">
                I agree to the <Link href="#" className="text-primary hover:underline font-bold">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline font-bold">Privacy Policy</Link>
              </p>
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <ClayButton 
              type="submit" 
              variant="blue" 
              className="w-full py-4 text-base tracking-widest uppercase font-black"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
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
    </div>
  );
}

