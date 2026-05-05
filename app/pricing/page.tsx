"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

const tiers = [
  {
    name: "Standard",
    price: "$0",
    description: "Essential link intelligence for individuals.",
    features: ["1,000 links / month", "Basic Traffic Analytics", "Standard Redirects", "Global CDN"],
    buttonText: "Get Started",
    variant: "glass"
  },
  {
    name: "Professional",
    price: "$29",
    description: "The mission-critical standard for power users.",
    features: ["Unlimited links", "Real-time Traffic Matrix", "Custom Branded Domains", "Bulk Upload Protocol", "Priority Support"],
    buttonText: "Upgrade Pro",
    variant: "blue",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Distributed infrastructure for absolute scale.",
    features: ["SSO & IAM Integration", "Dedicated API Environment", "Custom SLA & Uptime Guarantee", "24/7 Security Operations", "Audit Intelligence"],
    buttonText: "Contact Sales",
    variant: "glass"
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Section */}
        <motion.div {...fadeInUp} className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black font-headline text-white tracking-tighter uppercase italic leading-none">
            Scale Your <span className="opacity-40">Intelligence</span>
          </h1>
          <p className="text-lg font-medium text-slate-400 font-body max-w-2xl mx-auto italic">
            Select the infrastructure tier for your mission-critical link redirects.
          </p>
        </motion.div>

        {/* Pricing Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, idx) => (
            <motion.div 
              key={tier.name} 
              {...fadeInUp} 
              transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any}
            >
              <GlassCard className={`h-full flex flex-col p-10 border-white/10 group hover:border-primary/30 transition-all duration-500 relative ${tier.popular ? 'shadow-[0_0_80px_rgba(37,109,240,0.1)]' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    Most Strategic
                  </div>
                )}

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black font-headline text-white tracking-tight uppercase italic">{tier.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white italic font-headline">{tier.price}</span>
                      {tier.price !== "Custom" && <span className="text-slate-500 text-sm font-bold">/mo</span>}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed font-body italic mb-8">
                    {tier.description}
                  </p>

                  <div className="space-y-4">
                    {tier.features.map(feature => (
                      <div key={feature} className="flex items-center gap-3 group/feat">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover/feat:bg-primary/20 group-hover/feat:border-primary/30 transition-all">
                          <span className="material-symbols-outlined text-sm text-slate-500 group-hover/feat:text-primary transition-colors">check</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-300 font-body tracking-tight group-hover/feat:text-white transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12">
                  <ClayButton 
                    variant={tier.variant as any} 
                    className="w-full py-5 text-xs tracking-widest uppercase font-black"
                  >
                    {tier.buttonText}
                  </ClayButton>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Trust HUD */}
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex flex-wrap items-center justify-center gap-12 grayscale opacity-30">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] w-full text-center md:w-auto mb-4 md:mb-0">TRUSTED BY TEAMS AT</p>
              <div className="text-xl font-black text-white italic uppercase font-headline">SYSTEM.IO</div>
              <div className="text-xl font-black text-white italic uppercase font-headline">NEXUS.CORP</div>
              <div className="text-xl font-black text-white italic uppercase font-headline">DEEP.LINK</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
