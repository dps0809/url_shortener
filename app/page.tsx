"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClayButton } from "@/components/ClayButton";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

import { useScroll, useSpring } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as any
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



      {/* Footer Branding */}
      <footer className="text-center border-t border-white/5 pt-20">
        <p className="text-slate-600 text-sm font-body">© 2026 ShortLink Kinetic Edition. All atmospheric rights reserved.</p>
      </footer>
    </div>
  );
}

