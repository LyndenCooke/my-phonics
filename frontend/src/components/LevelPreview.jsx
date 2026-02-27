import React from 'react';
import { motion } from 'framer-motion';

const LEVELS = [
  { id: 1, name: 'First Sounds', desc: 's, a, t, p, i, n...', color: '#E84B8A' },
  { id: 2, name: 'New Sounds', desc: 'sh, ch, th, ng', color: '#F59E0B' },
  { id: 3, name: 'Longer Sounds', desc: 'ee, oo, ai, igh', color: '#22C55E' },
  { id: 4, name: 'Blending', desc: 'fr, st, mp clusters', color: '#3B82F6' },
  { id: 5, name: 'Split Sounds', desc: 'a-e, i-e, o-e', color: '#8B5CF6' },
  { id: 6, name: 'Reading to Learn', desc: 'prefixes & suffixes', color: '#14B8A6' },
];

export default function LevelPreview() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-amber-50/30 to-pink-50/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
            6 levels that grow with your child
          </h2>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            Each level uses only the sounds your child has been taught &mdash; nothing more, nothing less.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {LEVELS.map((level, i) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: level.color }}
              >
                {level.id}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{level.name}</h3>
              <p className="text-xs text-slate-500">{level.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
