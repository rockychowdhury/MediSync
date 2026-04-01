"use client";

import { motion } from "framer-motion";
import { Brain, LineChart, BellRing, Zap, Shield, HeartHandshake, ArrowUpRight, Search } from "lucide-react";

export function SystemCapabilities() {
  const capabilities = [
    {
      title: "Intelligent Scheduling",
      icon: <Brain className="w-5 h-5 text-blue-500" />,
      items: ["Conflict detection algorithm", "Time slot optimization", "Recurring appointment support", "Buffer time management"]
    },
    {
      title: "Real-Time Analytics",
      icon: <LineChart className="w-5 h-5 text-indigo-500" />,
      items: ["Live dashboard updates", "Provider utilization tracking", "No-show rate analysis", "Performance trend visualization"]
    },
    {
      title: "Automated Notifications",
      icon: <BellRing className="w-5 h-5 text-teal-500" />,
      items: ["Email confirmation system", "Appointment reminders (24h, 2h)", "Queue status updates", "Cancellation notifications"]
    },
    {
      title: "Performance Optimized",
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      items: ["Sub-2-second page loads", "Optimistic UI updates", "Efficient database queries", "Responsive design (mobile-first)"]
    },
    {
      title: "Security First",
      icon: <Shield className="w-5 h-5 text-red-500" />,
      items: ["Secure authentication (JWT)", "Password hashing (bcrypt)", "Role-based access control", "SQL injection prevention"]
    },
    {
      title: "User Experience",
      icon: <HeartHandshake className="w-5 h-5 text-pink-500" />,
      items: ["Intuitive workflows", "Consistent design system", "Accessibility compliant", "Error handling & validation"]
    },
    {
      title: "Scalability Ready",
      icon: <ArrowUpRight className="w-5 h-5 text-emerald-500" />,
      items: ["Modular architecture", "Database optimization", "API rate limiting", "Horizontal scaling support"]
    },
    {
      title: "Activity Auditing",
      icon: <Search className="w-5 h-5 text-violet-500" />,
      items: ["Comprehensive logging", "User action tracking", "System event monitoring", "Compliance-ready trails"]
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100" id="capabilities">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Enterprise-Grade Capabilities
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Built to handle the demands of medium to large-scale healthcare facilities.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {capabilities.map((cap, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  {cap.icon}
                </div>
                <h3 className="font-bold text-slate-900">{cap.title}</h3>
              </div>
              <ul className="space-y-2">
                {cap.items.map((item, jdx) => (
                  <li key={jdx} className="text-sm text-slate-600 flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 mr-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
