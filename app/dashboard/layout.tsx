"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { is_authenticated, is_loading, fetch_me } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetch_me();
  }, [fetch_me]);

  useEffect(() => {
    if (!is_loading && !is_authenticated) {
      router.push("/login");
    }
  }, [is_authenticated, is_loading, router]);

  if (is_loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!is_authenticated) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <div className="md:ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="pt-24 px-4 md:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
