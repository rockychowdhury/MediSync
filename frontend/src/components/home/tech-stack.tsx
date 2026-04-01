"use client";

import { motion } from "framer-motion";
import { Layers, Database, Server, Smartphone, LayoutTemplate, Network, Activity, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export function TechStack() {
  const stack = [
    {
      category: "Frontend",
      icon: <LayoutTemplate className="w-5 h-5" />,
      technologies: [
        { name: "React.js / Next.js", desc: "Modern component-based UI" },
        { name: "Tailwind CSS", desc: "Utility-first styling" },
        { name: "Recharts", desc: "Data visualization" },
        { name: "Zustand", desc: "State management" },
      ],
      color: "blue"
    },
    {
      category: "Backend",
      icon: <Server className="w-5 h-5" />,
      technologies: [
        { name: "Node.js + Express", desc: "RESTful API server" },
        { name: "PostgreSQL", desc: "Relational database" },
        { name: "Prisma ORM", desc: "Type-safe DB access" },
        { name: "JWT", desc: "Auth & security" },
      ],
      color: "green"
    },
    {
      category: "DevOps & Tools",
      icon: <Layers className="w-5 h-5" />,
      technologies: [
        { name: "Git & GitHub", desc: "Version control" },
        { name: "Vercel / Railway", desc: "Hosting infrastructure" },
        { name: "Figma", desc: "UI/UX design" },
        { name: "Postman", desc: "API testing" },
      ],
      color: "purple"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100" id="technology">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Built With Modern Technologies
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Full-stack implementation using industry-standard tools and frameworks ensuring scalability and performance.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stack.map((group, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col h-full"
            >
              <Card className="flex flex-col h-full border-none shadow-lg hover:shadow-xl transition-shadow bg-white overflow-hidden group">
                <div className={`h-2 bg-${group.color}-500 w-full transform origin-left transition-transform group-hover:scale-x-110`} />
                <CardContent className="p-8 pb-10 flex-1">
                  <div className={`w-12 h-12 rounded-xl bg-${group.color}-50 text-${group.color}-600 flex items-center justify-center mb-6`}>
                    {group.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-6">
                    {group.category}
                  </CardTitle>
                  <ul className="space-y-6">
                    {group.technologies.map((tech, jdx) => (
                      <li key={jdx} className="flex flex-col">
                        <span className="text-slate-900 font-semibold text-lg">{tech.name}</span>
                        <span className="text-slate-500 text-sm mt-1">{tech.desc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
