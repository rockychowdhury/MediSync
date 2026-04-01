"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Monitor, Database, Server, Component, FileCode2, Zap } from "lucide-react";

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  isVisible: boolean;
}

function AnimatedCounter({ end, duration = 2000, suffix = "", isVisible }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number | null = null;
    const updateCounter = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  }, [end, duration, isVisible]);

  return <span>{count}{suffix}</span>;
}

export function ProjectMetrics() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const metrics = [
    { value: 30, suffix: "+", label: "Pages & Routes", desc: "Public & private role-based routing", icon: <Monitor className="w-6 h-6" />, color: "text-blue-500" },
    { value: 7, suffix: "", label: "Database Tables", desc: "Normalized relational schema", icon: <Database className="w-6 h-6" />, color: "text-teal-500" },
    { value: 50, suffix: "+", label: "API Endpoints", desc: "RESTful architecture operations", icon: <Server className="w-6 h-6" />, color: "text-purple-500" },
    { value: 10, suffix: "k+", label: "Lines of Code", desc: "Comprehensive full-stack codebase", icon: <FileCode2 className="w-6 h-6" />, color: "text-amber-500" },
    { value: 3, suffix: "", label: "User Roles", desc: "Admin, Receptionist, & Provider", icon: <Component className="w-6 h-6" />, color: "text-pink-500" },
    { value: 100, suffix: "%", label: "Responsive", desc: "Seamless cross-device experience", icon: <Zap className="w-6 h-6" />, color: "text-emerald-500" }
  ];

  return (
    <section className="py-24 bg-blue-900 text-white relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Project by the Numbers
          </motion.h2>
          <motion.p 
            className="text-blue-200 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Quantifying the technical depth and comprehensive nature of the MediSync platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {metrics.map((metric, idx) => (
            <motion.div
              key={idx}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-white/10 ${metric.color}`}>
                  {metric.icon}
                </div>
                <div className="text-4xl font-black tabular-nums tracking-tighter">
                  <AnimatedCounter end={metric.value} suffix={metric.suffix} isVisible={isVisible} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{metric.label}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{metric.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
