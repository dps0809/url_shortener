"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { GlassInput } from "@/components/GlassInput";
import { ClayButton } from "@/components/ClayButton";
import { useUrlStore } from "@/lib/store/useUrlStore";
import { useEffect, useState } from "react";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function LinksPage() {
  const [search, setSearch] = useState("");
  const { urls, fetch_urls, is_loading } = useUrlStore();

  useEffect(() => {
    fetch_urls();
  }, [fetch_urls]);

  const filteredLinks = urls.filter(l => 
    l.short_code.toLowerCase().includes(search.toLowerCase()) || 
    l.long_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div {...fadeInUp}>
          <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic">
            Link <span className="opacity-40">Ecosystem</span>
          </h1>
          <p className="text-lg font-medium text-slate-400 font-body mt-1">
            Manage your mission-critical link redirects and analytics.
          </p>
        </motion.div>
        
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-80">
            <GlassInput
              placeholder="Search links or destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon="search"
            />
          </div>
          <Link href="/dashboard/upload">
            <ClayButton variant="blue" className="px-6 py-4 rounded-xl text-xs tracking-widest uppercase font-black">
              <span className="material-symbols-outlined mr-2">add</span>
              Deploy New
            </ClayButton>
          </Link>
        </motion.div>
      </div>

      {/* Main Links Container */}
      <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
        <GlassCard className="p-0 overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity (ID)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Destination Vector</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Clicks</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-body">
                {is_loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-500 uppercase text-[10px] tracking-widest animate-pulse font-black italic">
                      Interrogating Distributed Link Registry...
                    </td>
                  </tr>
                ) : filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-500 uppercase text-[10px] tracking-widest font-black italic">
                      No matching vectors found.
                    </td>
                  </tr>
                ) : filteredLinks.map((link) => (
                  <tr key={link.url_id} className="group hover:bg-white/5 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-primary font-bold group-hover:text-blue-400 transition-colors cursor-pointer text-lg tracking-tighter">/{link.short_code}</span>
                        <span className="text-[10px] text-slate-500 font-inter uppercase tracking-widest mt-1 opacity-60">
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-[250px] truncate text-slate-400 font-inter group-hover:text-slate-300 transition-colors italic opacity-70">
                        {link.long_url}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-slate-500">visibility</span>
                        <span className="font-bold text-white font-headline">{link.click_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                        link.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${link.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        {link.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/links/${link.url_id}`}>
                          <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 transition-all hover:text-primary">
                            <span className="material-symbols-outlined text-xl">insights</span>
                          </button>
                        </Link>
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-white/5 transition-all">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
