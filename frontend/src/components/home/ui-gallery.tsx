"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function UiGallery() {
  const images = [
    { title: "Dashboard Overview", src: "/images/screenshots/gallery-mockup.svg" },
    { title: "Appointment Calendar", src: "/images/screenshots/gallery-mockup.svg" },
    { title: "Queue Management", src: "/images/screenshots/gallery-mockup.svg" },
    { title: "Analytics & Reports", src: "/images/screenshots/gallery-mockup.svg" },
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Clean, Intuitive User Experience
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Carefully crafted interfaces for every user role, ensuring minimum learning curve and maximum productivity.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-2xl group cursor-pointer">
                <div className="overflow-hidden rounded-xl relative aspect-[16/10] bg-slate-200">
                  <Image 
                    src={img.src} 
                    alt={img.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors duration-300 flex items-center justify-center">
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{img.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
