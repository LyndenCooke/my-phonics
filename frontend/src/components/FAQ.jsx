import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const QUESTIONS = [
  {
    q: 'How do I know which level is right for my child?',
    a: 'Each level matches a stage in the UK phonics curriculum. Level 1 is for children just learning their first letter sounds (s, a, t, p, i, n...), and Level 6 is for confident readers tackling longer words. If you\'re unsure, start one level lower — it\'s better for a child to feel successful than to struggle.',
  },
  {
    q: 'What does "every word is phonics-verified" mean?',
    a: 'It means every word in the story is either decodable (your child can sound it out using only the letter sounds they\'ve been taught at that level) or a listed tricky word (common words like "the" and "said" that children learn to recognise by sight). No word appears that your child hasn\'t been prepared for.',
  },
  {
    q: 'How do I print and fold the book?',
    a: 'The PDF is designed for standard A4 paper. Print double-sided (flip on short edge), fold each sheet in half, stack them together, and staple along the spine. You get a proper A5 book — 16 pages, just like a real one. We include a print guide with every download.',
  },
  {
    q: 'Is this the same as Read Write Inc or Oxford Reading Tree?',
    a: 'No — MyPhonicsBooks is an independent product. Our phonics progression is based on Letters and Sounds, the Department for Education\'s public-domain phonics programme. We use our own level system (1-6), our own terminology, and our own story templates. We are not affiliated with any commercial phonics scheme.',
  },
];

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full text-left py-5 flex items-center justify-between gap-4 group"
      >
        <span className="font-semibold text-slate-900 group-hover:text-pink-600 transition-colors">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown size={20} />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-slate-600 pb-5 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-6 sm:p-8"
        >
          {QUESTIONS.map((item, i) => (
            <AccordionItem
              key={i}
              question={item.q}
              answer={item.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
