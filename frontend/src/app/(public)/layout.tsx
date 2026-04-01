import React from "react";
import Link from "next/link";
import MediSyncLogo from "@/components/common/MediSyncLogo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white text-foreground font-sans">
      
      {/* Left Panel - 50% Width - Form Area */}
      {/* Centered along both X and Y axis for a focused user experience */}
      <div className="w-full lg:w-1/2 flex flex-col pt-8 pb-12 px-6 sm:px-12 xl:px-24 overflow-y-auto relative z-10">
        
        {/* Absolute logo at top-left to not disrupt vertical centering of form */}
        <div className="absolute top-8 left-8 sm:left-12 xl:left-24">
          <Link href="/" className="flex items-center space-x-3 group w-max">
            <div className="relative w-10 h-10 overflow-hidden flex items-center justify-center text-blue-600">
              <MediSyncLogo size={36} />
            </div>
            <span className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              MediSync
            </span>
          </Link>
        </div>
        
        {/* Intentionally completely center items for the left panel */}
        <div className="flex-1 flex flex-col w-full max-w-[440px] mx-auto justify-center mt-16 lg:mt-0">
          {children}
        </div>
        
        {/* Absolute footer links */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-xs font-medium text-slate-400 flex justify-center space-x-6">
          <span>© {new Date().getFullYear()} MediSync</span>
          <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
        </div>
      </div>

      {/* Right Panel - 50% Width - Project Showcase (Animated Design) */}
      <div className="hidden lg:flex flex-col lg:w-1/2 relative justify-center bg-[#07132B] overflow-hidden">
        
        {/* Animated Background Canvas Replacement */}
        <div className="absolute inset-0 z-0">
          {/* Base gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E4A9E] via-[#07132B] to-[#2B76C2] opacity-80 mix-blend-multiply"></div>
          
          {/* Animated Glow Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#40A8C4] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#5CC8C1] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
          
          {/* CSS Grid Pattern overlay overlay */}
          <svg className="absolute w-full h-full opacity-[0.15] mix-blend-overlay" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" className="text-white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />
          </svg>

          {/* Diagonal scanlines */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNIDEgM0wgMyAxIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-50 z-10 pointer-events-none mix-blend-overlay"></div>
        </div>

        {/* Content Area - Elevated above background */}
        <div className="relative z-20 px-16 xl:px-24">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5CC8C1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5CC8C1]"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide text-[#9DE4D0] uppercase">v2.0 Beta Live</span>
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-heading font-extrabold text-white mb-6 leading-[1.15] tracking-tight">
            The intelligent <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5CC8C1] to-[#6BCB77]">healthcare operating</span> <br/>
            system.
          </h1>
          
          <p className="text-lg xl:text-xl text-white/70 max-w-lg leading-relaxed font-medium mb-12">
            Automate scheduling, eliminate wait times, and centralize provider management through a unified real-time dashboard.
          </p>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-white/10">
            <div>
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-white/50 font-medium tracking-wide">SYSTEM UPTIME</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">~40%</div>
              <div className="text-sm text-white/50 font-medium tracking-wide">LESS NO-SHOWS</div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
