import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Type } from 'lucide-react';

const SIGNALS = [
  {
    icon: <BookOpen size={20} />,
    text: 'Based on Letters and Sounds',
    color: 'text-pink-500',
  },
  {
    icon: <CheckCircle2 size={20} />,
    text: 'UK phonics curriculum',
    color: 'text-emerald-500',
  },
  {
    icon: <Type size={20} />,
    text: 'Andika literacy font',
    color: 'text-amber-500',
  },
];

export default function TrustBar() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-10 px-4 border-y border-pink-100/50 bg-white/50"
    >
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-4">
        {SIGNALS.map((signal, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-slate-500 text-sm font-medium"
          >
            <span className={signal.color}>{signal.icon}</span>
            {signal.text}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
