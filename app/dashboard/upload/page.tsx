"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { GlassInput } from "@/components/GlassInput";
import { ClayButton } from "@/components/ClayButton";
import { useUrlStore } from "@/lib/store/useUrlStore";
import { Link2, QrCode, CheckCircle2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function UploadPage() {
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  
  const { create_url } = useUrlStore();

  const handleGenerate = async () => {
    if (!longUrl) {
      setError("Destination URL is required");
      return;
    }
    
    setLoading(true);
    setError("");
    
    const result = await create_url({ long_url: longUrl, custom_alias: customAlias || undefined });
    
    if (result.success && result.url) {
      setSuccessData(result.url);
    } else {
      setError(result.error || "Failed to generate link");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (successData) {
      const fullUrl = `${window.location.origin}/${successData.short_code}`;
      navigator.clipboard.writeText(fullUrl);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div {...fadeInUp}>
        <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic">
          Generate <span className="opacity-40">Link</span>
        </h1>
        <p className="text-lg font-medium text-slate-400 italic font-body mt-2">
          Create a new trackable short link with QR code.
        </p>
      </motion.div>

      <GlassCard className="p-10 relative overflow-hidden group border-white/10">
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold uppercase tracking-widest text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Destination Vector (Long URL)</label>
                <GlassInput 
                  placeholder="https://example.com/very-long-destination"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  icon="link"
                  disabled={loading}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Custom Alias (Optional)</label>
                <GlassInput 
                  placeholder="my-custom-brand"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  icon="edit"
                  disabled={loading}
                />
              </div>

              <div className="pt-6">
                <ClayButton 
                  variant="blue" 
                  className="w-full py-5 text-[12px] tracking-[0.3em] uppercase font-black flex items-center justify-center gap-3" 
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <Link2 size={18} />
                  )}
                  {loading ? "Generating..." : "Generate Short Link"}
                </ClayButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-10 py-6"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={48} />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black font-headline text-white tracking-widest uppercase italic">Link Active</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Status: Operational
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 p-8 rounded-3xl border border-white/5 w-full max-w-2xl">
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/${successData.short_code}`)}&margin=10`}
                    alt="QR Code"
                    className="w-[150px] h-[150px]"
                  />
                </div>
                
                <div className="flex flex-col items-start text-left gap-4 flex-1 w-full">
                  <div className="w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Short Link</p>
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-bold text-primary font-headline tracking-tighter truncate max-w-[200px] md:max-w-[300px]">
                        {window.location.origin}/{successData.short_code}
                      </div>
                      <button onClick={handleCopy} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Destination</p>
                    <div className="text-sm text-slate-400 truncate max-w-[250px] md:max-w-[350px] italic">
                      {successData.long_url}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2 w-full">
                    <a href={`${window.location.origin}/${successData.short_code}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <ClayButton variant="glass" className="w-full py-3 text-[10px] font-black tracking-widest uppercase flex justify-center gap-2">
                        <ExternalLink size={14} /> Test Link
                      </ClayButton>
                    </a>
                    <button onClick={() => { setSuccessData(null); setLongUrl(""); setCustomAlias(""); }} className="flex-1">
                      <ClayButton variant="glass" className="w-full py-3 text-[10px] font-black tracking-widest uppercase">
                        Create Another
                      </ClayButton>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
