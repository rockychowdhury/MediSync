"use client";

import { motion } from "framer-motion";
import { Zap, Mail, Target, LineChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SolutionOverview() {
  const solutions = [
    {
      title: "Smart Conflict Detection",
      description: "Real-time availability checking prevents double-bookings and suggests alternative time slots automatically.",
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      color: "blue"
    },
    {
      title: "Automated Notifications",
      description: "Email reminders sent 24 hours and 2 hours before appointments, reducing no-show rates by up to 40%.",
      icon: <Mail className="w-6 h-6 text-teal-500" />,
      color: "teal"
    },
    {
      title: "Intelligent Queue System",
      description: "Priority-based waitlist with automatic provider assignment when slots become available.",
      icon: <Target className="w-6 h-6 text-purple-500" />,
      color: "purple"
    },
    {
      title: "Actionable Analytics",
      description: "Real-time dashboards showing provider utilization, completion rates, and operational metrics.",
      icon: <LineChart className="w-6 h-6 text-green-500" />,
      color: "green"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative" id="solution">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How MediSync Solves These Problems
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            An intelligent appointment management system built with modern technologies to streamline your entire workflow.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {solutions.map((solution, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-${solution.color}-50 flex items-center justify-center mb-4`}>
                    {solution.icon}
                  </div>
                  <CardTitle className="text-xl text-slate-900">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600 mt-2">
                    {solution.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
