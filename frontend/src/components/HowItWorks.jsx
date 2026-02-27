import React from 'react';
import { motion } from 'framer-motion';
import { UserRound, Wand2, Printer } from 'lucide-react';

const STEPS = [
  {
    icon: <UserRound size={28} />,
    title: 'Tell us about your child',
    desc: 'Their name, reading level, and what they love.',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
  },
  {
    icon: <Wand2 size={28} />,
    title: 'We create their book',
    desc: 'Every word checked against their phonics level.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: <Printer size={28} />,
    title: 'Print at home',
    desc: 'A5 book on A4 paper. Fold, staple, read!',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 relative">
      {/* Subtle colourful background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/30 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            From your child's name to a real book in their hands &mdash; in minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`text-center ${step.bg} rounded-2xl p-6 border border-white/50`}
            >
              {/* Step number + icon */}
              <div className="relative inline-flex mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg`}>
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
