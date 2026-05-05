"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";

import { useScroll, useSpring } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as any
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [url, setUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShorten = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<any>("/public/shorten", { long_url: url });
      if (response.data) {
        setShortenedUrl(response.data.short_url);
      } else {
        setError(response.error || "Failed to shorten URL");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(shortenedUrl);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto space-y-32 overflow-x-hidden">
      <motion.div
        className="fixed top-16 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />
      {/* Hero Section with Ambient Background */}
      <section className="text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] -z-10 rounded-full opacity-50" />
        
        <motion.div 
          {...fadeInUp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 border border-white/10"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-white tracking-widest uppercase">Kinetic Ether Design System v2</span>
        </motion.div>
        
        <motion.h1 
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.1 }}
          className="font-headline font-extrabold text-5xl md:text-8xl text-white mb-6 leading-tight tracking-tight max-w-5xl mx-auto"
        >
          Transform Your Links Into <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Atmospheric Data</span>
        </motion.h1>
        
        <motion.p 
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.2 }}
          className="font-body text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          A precision-engineered URL management platform with editorial high-tech aesthetics. Secure, fast, and globally distributed.
        </motion.p>
        
        <motion.div 
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <Link href="/register">
            <ClayButton variant="blue" className="px-10 h-14 text-lg">
              Launch Dashboard
              <span className="material-symbols-outlined ml-2">rocket_launch</span>
            </ClayButton>
          </Link>
          <Link href="/login">
            <ClayButton variant="glass" className="px-10 h-14 text-lg">
              Sign In
            </ClayButton>
          </Link>
        </motion.div>
      </section>

      {/* Kinetic Bento Grid */}
      <motion.section 
        variants={stagger}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-6 grid-rows-2 gap-6 min-h-[800px]"
      >
        {/* Analytics Bento - 4x1 */}
        <motion.div variants={fadeInUp} className="md:col-span-4 md:row-span-1">
          <GlassCard className="relative h-full overflow-hidden group border-white/5">
            <div className="relative z-10 p-4">
              <h3 className="font-headline font-bold text-3xl text-white mb-4">Neural Analytics</h3>
              <p className="text-slate-400 max-w-md">Real-time click tracking across 190+ countries with millisecond resolution and AI-driven growth insights.</p>
            </div>
            
            <div className="absolute bottom-0 right-0 w-3/5 h-[80%] opacity-80 group-hover:scale-105 transition-transform duration-1000">
              <Image 
                src="/assets/analytics_bento.png" 
                alt="Neural Analytics Dashboard" 
                fill
                className="object-contain object-right-bottom drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                loading="lazy"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Global Edge Bento - 2x1 */}
        <motion.div variants={fadeInUp} className="md:col-span-2 md:row-span-1">
          <GlassCard className="h-full flex flex-col justify-center items-center text-center p-8 border-white/5">
            <div className="relative w-full h-40 mb-6">
              <Image 
                src="/assets/global_edge.png" 
                alt="Global Edge Infrastructure" 
                fill
                className="object-contain animate-float"
                loading="lazy"
              />
            </div>
            <h3 className="font-headline font-bold text-2xl text-white mb-2">Global Edge</h3>
            <p className="text-slate-400 text-sm">Links resolve at the absolute edge. <span className="text-primary font-bold">18ms average latency</span> worldwide.</p>
          </GlassCard>
        </motion.div>

        {/* Security Bento - 3x1 */}
        <motion.div variants={fadeInUp} className="md:col-span-3 md:row-span-1">
          <GlassCard className="h-full flex items-center p-8 gap-8 border-white/5">
            <div className="flex-1">
              <span className="material-symbols-outlined text-secondary text-4xl mb-4">verified_user</span>
              <h3 className="font-headline font-bold text-2xl text-white mb-2">Vault-Grade Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Automatic malware scanning via Google Safe Browsing & VirusTotal on every single link.</p>
            </div>
            <div className="w-32 h-32 relative">
              <Image 
                src="/assets/security_shield.png" 
                alt="Vault-Grade Security" 
                fill
                className="object-contain"
                loading="lazy"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Custom Domain Bento - 3x1 */}
        <motion.div variants={fadeInUp} className="md:col-span-3 md:row-span-1">
          <GlassCard className="h-full flex flex-col justify-between p-8 border-white/5 group">
            <div>
              <h3 className="font-headline font-bold text-2xl text-white mb-2">Custom Domains</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Your brand, our engine. Connect unlimited custom domains and boost click rates by 40%.</p>
            </div>
            <div className="flex flex-col gap-3 mt-6">
              {['go.stripe.com/docs', 'link.airbnb.com/stay'].map((d, i) => (
                <div key={i} className="bg-white/5 border border-white/5 px-4 py-3 rounded-lg text-sm text-slate-300 font-mono tracking-tighter group-hover:border-primary/30 transition-colors">
                  {d}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* Try It Now - Interactive Section */}
      <motion.section 
        {...fadeInUp}
        className="relative py-24 px-8 rounded-[40px] overflow-hidden glass-card border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10 -z-10" />
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-headline font-extrabold text-5xl text-white mb-6">Ether Shortener</h2>
          <p className="text-slate-400 text-xl font-body">Experience the kinetic speed of our public API. 10 links/hour for guests.</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-3xl shadow-2xl">
            <div className="flex-1 flex items-center px-6">
              <span className="material-symbols-outlined text-slate-500 mr-4">link</span>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your atmospheric long URL here..." 
                className="bg-transparent border-none focus:ring-0 text-white w-full py-6 font-body text-xl placeholder-slate-600"
              />
            </div>
            <ClayButton 
              variant="blue" 
              className="px-12 h-auto py-6 rounded-2xl text-xl font-bold font-headline"
              onClick={handleShorten}
              disabled={isLoading || !url}
            >
              {isLoading ? "Compressing..." : "Shorten Now"}
            </ClayButton>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2 justify-center"
              >
                <span className="material-symbols-outlined">error</span>
                {error}
              </motion.div>
            )}

            {shortenedUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 rounded-3xl bg-secondary/10 border border-secondary/20 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="text-left w-full overflow-hidden">
                  <p className="text-xs text-secondary font-bold uppercase tracking-widest mb-2">Your Shortened Ether-link</p>
                  <p className="text-3xl font-headline font-black text-white truncate">{shortenedUrl}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <ClayButton variant="glass" className="flex-1 md:flex-none py-4 px-8" onClick={copyToClipboard}>
                    Copy Link
                  </ClayButton>
                  <Link href={shortenedUrl} target="_blank" className="flex-1 md:flex-none">
                    <ClayButton variant="blue" className="w-full py-4 px-8">
                       Visit
                    </ClayButton>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Social Proof */}
      <motion.section 
        {...fadeInUp}
        className="text-center pt-20"
      >
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] mb-16 font-inter">Propelling the worlds fastest teams</p>
        <div className="flex flex-wrap justify-center items-center gap-16 opacity-40 grayscale contrast-200">
          {["VORTEX", "SPHERE", "EQUINOX", "AETHER", "LUMINA"].map((brand) => (
            <div key={brand} className="font-headline font-black text-3xl text-white tracking-widest">{brand}</div>
          ))}
        </div>
      </motion.section>

      {/* Footer Branding */}
      <footer className="text-center border-t border-white/5 pt-20">
        <p className="text-slate-600 text-sm font-body">© 2026 ShortLink Kinetic Edition. All atmospheric rights reserved.</p>
      </footer>
    </div>
  );
}

