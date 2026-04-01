"use client";

import { motion } from "framer-motion";
import { Copy, Terminal, ExternalLink, GitBranch, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CtaContact() {
  const demoAccount = {
    email: "demo@MediSync.com",
    password: "Demo@123",
    role: "Admin (Full Access)"
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="contact">
      {/* Background decoration */}
      <div className="absolute -left-40 top-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -right-40 bottom-20 w-80 h-80 bg-teal-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-8 items-center justify-between max-w-6xl mx-auto">
          
          {/* Left Column - Content */}
          <motion.div 
            className="flex-1 w-full"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
              Ready to Explore?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Experience the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Healthcare Scheduling</span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              Take MediSync for a spin in our live demo environment, dive into the source code, or reach out to discuss the technical implementation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 text-base shadow-md shadow-blue-500/20">
                <ExternalLink className="mr-2 w-5 h-5" />
                Launch Live Demo
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-slate-200 hover:bg-slate-50 rounded-full px-8 h-14 text-base text-slate-700 shadow-sm">
                <GitBranch className="mr-2 w-5 h-5" />
                View Source Code
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
              <a href="#" className="flex items-center hover:text-blue-600 transition-colors">
                <FileText className="w-4 h-4 mr-2" /> API Documentation
              </a>
              <a href="#" className="flex items-center hover:text-blue-600 transition-colors">
                <ExternalLink className="w-4 h-4 mr-2" /> Technical Presentation
              </a>
            </div>
          </motion.div>

          {/* Right Column - Terminal/Credentials Card */}
          <motion.div 
            className="flex-1 w-full max-w-md lg:ml-auto"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
              {/* Terminal Header */}
              <div className="bg-slate-950 px-4 py-3 flex items-center border-b border-slate-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto flex items-center text-xs text-slate-400 font-medium font-mono">
                  <Terminal className="w-3 h-3 mr-2" /> demo_credentials.env
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-6 font-mono text-sm">
                <div className="text-slate-400 mb-4">// System generated credentials for evaluation</div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 relative group">
                  <button 
                    className="absolute right-3 top-3 p-1.5 text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <span className="text-blue-400 w-24 flex-shrink-0">Email:</span>
                      <span className="text-slate-200 break-all">{demoAccount.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <span className="text-blue-400 w-24 flex-shrink-0">Password:</span>
                      <span className="text-emerald-400 break-all">{demoAccount.password}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-700/50 border-dashed">
                      <span className="text-purple-400 w-24 flex-shrink-0">Role:</span>
                      <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-xs">{demoAccount.role}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <p className="text-slate-400 text-xs mb-3 font-sans">DEVELOPER INFO</p>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex justify-between items-center group cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded transition-colors">
                      <span className="text-blue-400 font-bold">Rocky Chowdhury</span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </li>
                    <li className="flex justify-between items-center group cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded transition-colors">
                      <span>github.com/rockychowdhury</span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
