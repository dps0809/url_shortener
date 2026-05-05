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
                <span className="material-symbols-outlined text-primary text-3xl">verified</span>
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
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Or login with</p>
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
    </div>
  );
}
