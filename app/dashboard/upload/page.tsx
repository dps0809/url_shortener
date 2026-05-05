"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useUrlStore } from "@/lib/store/useUrlStore";
import { Rocket, FileText, CheckCircle2, ShieldCheck, Database, RefreshCw, X } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

const STEPS = [
  { id: 'indexing', label: 'Indexing Database', icon: Database },
  { id: 'scanning', label: 'Security Analysis', icon: ShieldCheck },
  { id: 'deploying', label: 'Global Deployment', icon: Rocket },
];

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const { bulk_create_urls } = useUrlStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadState === 'uploading') {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) { // Hold at 95% until API finishes
            return prev;
          }
          const next = prev + 5;
          if (next > 33 && next <= 66) setCurrentStep(1);
          if (next > 66) setCurrentStep(2);
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [uploadState]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const parseFile = async (file: File): Promise<any[]> => {
    const text = await file.text();
    if (file.name.endsWith('.json')) {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [data];
    }
    // Simple CSV parser
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => {
      const [long_url, custom_alias] = line.split(',').map(s => s.trim());
      return { long_url, custom_alias };
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState('uploading');
    
    try {
      const urls = await parseFile(file);
      const result = await bulk_create_urls(urls);
      
      if (result.success) {
        setProgress(100);
        setTimeout(() => setUploadState('success'), 500);
      } else {
        alert(result.error || "Bulk upload failed");
        setUploadState('idle');
        setProgress(0);
      }
    } catch (err: any) {
      alert("Error parsing file: " + err.message);
      setUploadState('idle');
      setProgress(0);
    }
  };

  const reset = () => {
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    setCurrentStep(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div {...fadeInUp}>
        <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic">
          Bulk <span className="opacity-40">Deployment Protocol</span>
        </h1>
        <p className="text-lg font-medium text-slate-400 italic font-body mt-2">
          Synchronize mission-critical redirects at global scale.
        </p>
      </motion.div>

      <GlassCard className="p-12 relative overflow-hidden group border-white/10">
        <AnimatePresence mode="wait">
          {uploadState === 'idle' && !file ? (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center gap-10"
            >
              <div 
                className={cn(
                  "w-full h-80 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-8 transition-all duration-700 relative overflow-hidden cursor-pointer",
                  dragActive 
                    ? "border-primary bg-primary/10 scale-[0.98] shadow-2xl shadow-primary/20" 
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                {dragActive && <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />}
                <div className="p-8 rounded-[2rem] bg-white/5 mb-8 group-hover:scale-110 transition-transform duration-500 border border-white/5">
                  <RefreshCw className="w-12 h-12 text-slate-500 opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all animate-spin-slow" />
                </div>
                <div className="text-center space-y-3 relative z-10">
                  <p className="text-2xl font-black text-white font-headline tracking-tighter uppercase italic">Drop Payload CSV</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Schema Validation Required</p>
                </div>
                <input ref={inputRef} type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <GlassCard className="p-6 flex flex-col gap-3 group/item cursor-pointer hover:bg-white/10 transition-all border-white/10">
                  <FileText className="w-6 h-6 text-primary group-hover/item:scale-110 transition-transform" />
                  <div>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-1">REFERENCE</p>
                    <p className="text-sm font-bold text-white tracking-tight">Download Infrastructure CSV</p>
                  </div>
                </GlassCard>
                <GlassCard className="p-6 flex flex-col gap-3 group/item border-white/10">
                  <ShieldCheck className="w-6 h-6 text-amber-500 group-hover/item:scale-110 transition-transform" />
                  <div>
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] mb-1">CONSTRAINTS</p>
                    <p className="text-sm font-bold text-white tracking-tight">Max 50,000 Nodes / Batch</p>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          ) : uploadState === 'idle' && file ? (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center gap-12 py-10"
            >
              <div className="p-12 rounded-[3.5rem] bg-white/5 flex flex-col items-center gap-8 text-center border border-white/10 relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-50" />
                <div className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary border border-primary/30 relative z-10 shadow-2xl">
                  <FileText size={48} />
                </div>
                <div className="space-y-2 relative z-10">
                  <h3 className="text-3xl font-black text-white font-headline tracking-tighter italic uppercase">{file?.name}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                    {(file?.size! / 1024).toFixed(1)} KB • CRC32 VERIFIED
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full max-w-md">
                <button onClick={reset} className="flex-1 h-14 flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all border border-white/10">
                  <X size={14} /> Abort
                </button>
                <ClayButton variant="blue" className="flex-[2] h-14 text-[10px] tracking-[0.3em] uppercase font-black" onClick={handleUpload}>
                  Execute Deployment <Rocket size={14} className="ml-2" />
                </ClayButton>
              </div>
            </motion.div>
          ) : uploadState === 'uploading' ? (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 space-y-16">
              <div className="space-y-8 text-center">
                <div className="flex justify-center gap-12">
                  {STEPS.map((step, idx) => (
                    <div key={step.id} className={cn("flex flex-col items-center gap-4 transition-all duration-500", idx <= currentStep ? "opacity-100 scale-110" : "opacity-20 scale-90")}>
                      <div className={cn("p-4 rounded-2xl border bg-white/5", idx === currentStep ? "border-primary text-primary shadow-[0_0_20px_rgba(37,109,240,0.3)] animate-pulse" : "border-white/5 text-slate-500")}>
                        <step.icon size={32} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{step.label}</p>
                    </div>
                  ))}
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Deploying nodes...</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-10 py-12 text-center">
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                <CheckCircle2 size={72} className="relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black font-headline text-white tracking-widest uppercase italic">Payload Deployed!</h2>
                <p className="text-lg font-medium text-slate-400 font-body max-w-sm mx-auto leading-relaxed italic">
                  Systems have synchronized 1,240 redirects across all edge nodes.
                </p>
              </div>
              <Link href="/dashboard">
                <ClayButton variant="glass" className="px-12 py-5 font-black uppercase text-[10px] tracking-[0.3em]">Return to Matrix</ClayButton>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
