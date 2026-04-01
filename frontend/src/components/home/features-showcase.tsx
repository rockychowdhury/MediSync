"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function FeaturesShowcase() {
  const features = [
    {
      title: "Complete Appointment Lifecycle Management",
      subtitle: "Real-Time Appointment Management",
      description: "Create, edit, and track appointments from booking to completion. Advanced filtering by date, provider, status, and service type. Quick actions for check-in, cancellation, and rescheduling.",
      highlights: ["Real-time conflict detection", "Drag-and-drop rescheduling", "Status workflow management", "Patient history tracking"],
      image: "/images/screenshots/feature-mockup.svg",
      imageAlt: "Appointments Dashboard",
      reversed: false
    },
    {
      title: "Optimize Provider Utilization",
      subtitle: "Provider & Resource Management",
      description: "Monitor provider workload in real-time with visual capacity indicators. Manage availability, set working hours, and track performance metrics for each provider.",
      highlights: ["Daily capacity management", "Availability status controls", "Workload balancing algorithms", "Color-coded capacity indicators"],
      image: "/images/screenshots/feature-mockup.svg",
      imageAlt: "Provider Dashboard",
      reversed: true
    },
    {
      title: "Smart Waitlist Processing",
      subtitle: "Intelligent Queue Management",
      description: "Automatic queue ordering by priority and waiting time. One-click provider assignment when slots become available. Real-time queue position updates for better patient experience.",
      highlights: ["Priority-based queue ordering", "Auto-assignment from queue", "Estimated wait time calculation", "Queue analytics and insights"],
      image: "/images/screenshots/feature-mockup.svg",
      imageAlt: "Queue Interface",
      reversed: false
    },
    {
      title: "Data-Driven Decision Making",
      subtitle: "Analytics & Reporting",
      description: "Comprehensive analytics dashboard with real-time metrics. Track appointment completion rates, no-show trends, and provider performance. Export reports in multiple formats.",
      highlights: ["Real-time KPI tracking", "Interactive charts", "Exportable reports (PDF/CSV)", "Date range filtering"],
      image: "/images/screenshots/feature-mockup.svg",
      imageAlt: "Analytics Dashboard",
      reversed: true
    },
    {
      title: "Secure Multi-Role System",
      subtitle: "Role-Based Access Control",
      description: "Three distinct user roles (Admin, Receptionist, Provider) with granular permissions. Secure authentication with session management and password reset functionality.",
      highlights: ["JWT-based authentication", "Role-based routing protection", "Secure password hashing", "Session timeout management"],
      image: "/images/screenshots/feature-mockup.svg",
      imageAlt: "RBAC System",
      reversed: false
    }
  ];

  return (
    <section className="py-24 bg-white" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Powerful Features, <br className="hidden md:block"/> Intuitive Design
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-blue-600 mx-auto mt-6 rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>

        <div className="flex flex-col gap-24 lg:gap-32">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col gap-12 items-center ${
                feature.reversed ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              {/* Content Side */}
              <motion.div 
                className="flex-1 lg:w-1/2 space-y-6"
                initial={{ opacity: 0, x: feature.reversed ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide uppercase mb-2">
                  {feature.subtitle}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-4 pt-4">
                  {feature.highlights.map((highlight, jdx) => (
                    <li key={jdx} className="flex items-start">
                      <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-lg font-medium">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Image Side */}
              <motion.div 
                className="flex-1 lg:w-1/2 w-full"
                initial={{ opacity: 0, x: feature.reversed ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100 group">
                  <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-transparent transition duration-500 z-10 pointer-events-none" />
                  <div className="aspect-[4/3] w-full relative">
                    <Image 
                      src={feature.image} 
                      alt={feature.imageAlt}
                      fill
                      className="object-cover transform group-hover:scale-105 transition duration-700"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
