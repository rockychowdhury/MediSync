"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Calendar, Users, BarChart3, Bell } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" />
      
      {/* Abstract Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100/40 rounded-full blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-teal-50/40 rounded-full blur-3xl opacity-60 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-6">
              v1.0 Now Live
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Smart Healthcare Scheduling <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Made Simple</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A full-stack appointment management system that helps clinics optimize provider schedules, reduce no-shows, and streamline patient care through intelligent queue management.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 px-8 text-base">
              View Live Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-200 hover:bg-slate-50 rounded-full h-14 px-8 text-base shadow-sm">
              <Play className="mr-2 w-5 h-5 text-slate-700" />
              Watch Demo Video
            </Button>
          </motion.div>

          {/* Key Stats Card */}
          <motion.div 
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-4xl mx-auto w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex flex-col items-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Smart Scheduling</p>
            </div>
            <div className="flex flex-col items-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mb-3 text-teal-600">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Queue Management</p>
            </div>
            <div className="flex flex-col items-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-3 text-purple-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Real-time Analytics</p>
            </div>
            <div className="flex flex-col items-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-3 text-amber-600">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Automated Alerts</p>
            </div>
          </motion.div>
        </div>

        {/* Hero Image Mockup */}
        <motion.div 
          className="mt-20 mx-auto max-w-5xl relative group"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xl relative z-10">
            {/* Browser top bar mock */}
            <div className="bg-slate-100 h-10 border-b border-slate-200 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="ml-4 flex-1 flex justify-center">
                <div className="w-64 h-6 bg-white rounded flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  medisync.app/dashboard
                </div>
              </div>
            </div>
            <div className="aspect-[16/9] w-full bg-slate-100 relative">
              <Image 
                src="/images/screenshots/hero-mockup.svg" 
                alt="MediSync Dashboard" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
