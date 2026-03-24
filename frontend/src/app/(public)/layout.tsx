import React from "react";
import Link from "next/link";
import MediSyncLogo from "@/components/common/MediSyncLogo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left side panel (hidden on very small screens) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Decorative background overlay elements */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          {/* Subtle pattern or abstract shapes can go here */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute top-0 right-0 w-full h-full"
          >
            <path opacity="0.5" d="M0,0 L100,0 L100,100 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center space-x-3">
          <MediSyncLogo size={48} className="drop-shadow-sm" />
          <span className="text-3xl font-heading font-bold tracking-tight">
            MediSync
          </span>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-heading font-bold mb-6">
            Streamline Your Healthcare Operations
          </h1>
          <p className="text-lg text-white/90">
            Intelligent scheduling, seamless patient flow, and powerful provider
            management for modern clinics. Join thousands of professionals
            optimizing care delivery every day.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          © {new Date().getFullYear()} MediSync Inc. All rights reserved.
        </div>
      </div>

      {/* Right side form container */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center pb-8 items-center space-x-2">
          <MediSyncLogo size={36} className="filter drop-shadow-md" />
          <span className="text-2xl font-heading font-bold text-primary">
            MediSync
          </span>
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
