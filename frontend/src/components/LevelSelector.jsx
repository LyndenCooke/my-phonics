import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

const LEVELS = [
    { id: 1, label: 'Level 1', desc: 'Just starting to sound out letters', color: 'bg-red-100 text-red-700 border-red-200 hover:border-red-400' },
    { id: 2, label: 'Level 2', desc: 'Knows letter sounds, reading simple words', color: 'bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-400' },
    { id: 3, label: 'Level 3', desc: 'Reading short sentences with some longer sounds', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:border-yellow-400' },
    { id: 4, label: 'Level 4', desc: 'Reading sentences with blended sounds', color: 'bg-green-100 text-green-700 border-green-200 hover:border-green-400' },
    { id: 5, label: 'Level 5', desc: 'Reading longer sentences and simple stories', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-400' },
    { id: 6, label: 'Level 6', desc: 'Reading independently with expression', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-400' },
];

export default function LevelSelector({ data, onChange, onNext, onBack }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                    Select Reading Level
                </h2>
                <p className="text-slate-600">
                    Match the book exactly to {data.childName || 'your child'}'s reading ability.
                </p>
            </div>

            <div className="space-y-3 mb-8">
                {LEVELS.map((level) => {
                    const isSelected = data.level === level.id;
                    return (
                        <motion.button
                            key={level.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onChange({ level: level.id })}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${isSelected ? level.color.replace('hover:border', 'border').replace('100', '200') + ' shadow-md scale-[1.02]'
                                : 'bg-white border-slate-100 hover:border-slate-300 opacity-80 hover:opacity-100'
                                }`}
                        >
                            <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/50' : 'bg-slate-100 text-slate-500'}`}>
                                <BookOpen size={24} className={isSelected ? 'text-inherit' : ''} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{level.label}</h3>
                                <p className="opacity-90">{level.desc}</p>
                            </div>
                        </motion.button>
                    )
                })}
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={onNext}
                    disabled={!data.level}
                    className={`group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium overflow-hidden transition-all ${data.level
                            ? 'bg-slate-900 text-white shadow-lg hover:shadow-xl cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {data.level && (
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        Next Step
                        <ArrowRight size={18} className={data.level ? "group-hover:translate-x-1 transition-transform" : ""} />
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}
