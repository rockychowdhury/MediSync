import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Brand Info (Spans 4 columns on desktop) */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="flex items-center space-x-3 group w-max">
              <div className="relative w-10 h-10 overflow-hidden flex items-center justify-center grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                <Image 
                  src="/logo.png" 
                  alt="MediSync Logo" 
                  width={36} 
                  height={36} 
                  className="object-contain"
                />
              </div>
              <span className="font-heading font-extrabold text-2xl text-foreground/80 tracking-tight group-hover:text-primary transition-colors">
                MediSync
              </span>
            </Link>
            <p className="text-[15px] text-muted-foreground w-full max-w-sm leading-relaxed">
              Bringing intelligent scheduling, seamless patient flow, and powerful provider management together in one unified healthcare operations platform.
            </p>
          </div>

          {/* Spacer for layout */}
          <div className="hidden md:block md:col-span-2"></div>

          {/* Links Grid (Spans 6 columns) */}
          <div className="md:col-span-6 grid grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground text-sm tracking-widest uppercase">Platform</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Smart Scheduling</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Queue Management</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Patient Portal</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground text-sm tracking-widest uppercase">Company</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Contact Support</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-foreground text-sm tracking-widest uppercase">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">HIPAA Status</Link></li>
                <li><Link href="#" className="text-[15px] text-muted-foreground hover:text-primary transition-colors">Security Overview</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="bg-border/60 my-8" />

        {/* Bottom copyright line */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} MediSync Inc. All rights reserved.
          </p>
          <div className="flex space-x-5 mt-4 md:mt-0">
            {/* Social SVGs identical to previous design but optimized */}
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <span className="sr-only">Twitter</span>
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <span className="sr-only">GitHub</span>
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
