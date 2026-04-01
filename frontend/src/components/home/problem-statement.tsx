"use client";

import { motion } from "framer-motion";
import { CopyX, TrendingDown, Clock, Activity } from "lucide-react";

const problems = [
  {
    icon: <CopyX className="w-6 h-6 text-red-500" />,
    title: "Double-Booking Disasters",
    description: "Manual scheduling leads to appointment conflicts and no real-time availability tracking, resulting in patient dissatisfaction.",
    bgColor: "bg-red-50"
  },
  {
    icon: <TrendingDown className="w-6 h-6 text-orange-500" />,
    title: "No-Show Epidemic",
    description: "Up to 30% of appointments result in no-shows due to lack of automated reminders, causing lost revenue and underutilized resources.",
    bgColor: "bg-orange-50"
  },
  {
    icon: <Clock className="w-6 h-6 text-amber-500" />,
    title: "Queue Management Chaos",
    description: "Walk-ins and cancellations create unpredictable queues. Staff are often overwhelmed trying to manage waitlists manually.",
    bgColor: "bg-amber-50"
  },
  {
    icon: <Activity className="w-6 h-6 text-rose-500" />,
    title: "Limited Visibility",
    description: "No insights into provider utilization, preventing optimization of scheduling patterns and missing data for informed decisions.",
    bgColor: "bg-rose-50"
  }
];

export function ProblemStatement() {
  return (
    <section className="py-24 bg-white" id="problem">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            The Healthcare Scheduling Challenge
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Traditional appointment management creates bottlenecks and inefficiencies that affect both patient care and clinic operations.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, idx) => (
            <motion.div 
              key={idx}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * (idx + 1) }}
            >
              <div className={`w-14 h-14 rounded-xl ${problem.bgColor} flex items-center justify-center mb-6`}>
                {problem.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{problem.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
