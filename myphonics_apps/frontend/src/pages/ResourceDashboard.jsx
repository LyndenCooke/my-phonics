import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Layers } from 'lucide-react';
import LevelNavigation from '../components/dashboard/LevelNavigation';
import ResourceGrid from '../components/dashboard/ResourceGrid';

// Mock data representing the real structure of resources
// We mix available and missing to show the contrast in the premium UI.
const mockResources = [
    // Books (Available)
    { id: 'b1', type: 'book', title: 'The Lost Doll', subtitle: 'Target: s, a, t, p', level: 1, available: true },
    { id: 'b2', type: 'book', title: 'A Cat on the Mat', subtitle: 'Target: i, n, m, d', level: 1, available: true },
    { id: 'b3', type: 'book', title: 'The Red Hen', subtitle: 'Target: e, o, r', level: 2, available: true },
    { id: 'b4', type: 'book', title: 'A Big Ship', subtitle: 'Target: sh, ch, th', level: 3, available: true },

    // Wordmats (Some available, some missing)
    { id: 'w1', type: 'wordmat', title: 'Set 1 Sounds Mat', subtitle: 'Phase 2: s,a,t,p,i,n...', level: 1, available: true },
    { id: 'w2', type: 'wordmat', title: 'Set 2 Sounds Mat', subtitle: 'Phase 3 / Digraphs', level: 2, available: true },
    { id: 'w3', type: 'wordmat', title: 'Set 3 Sounds Mat', subtitle: 'Phase 5 alternatives', level: 3, available: false },

    // Videos (Mostly missing / coming soon)
    { id: 'v1', type: 'video', title: 'How to Teach Set 1', subtitle: 'Teacher guide for parents', level: 1, available: true },
    { id: 'v2', type: 'video', title: 'Blending Practice L2', subtitle: 'Interactive blending video', level: 2, available: false },
    { id: 'v3', type: 'video', title: 'Fred Talk L3', subtitle: 'Segmenting and spelling', level: 3, available: false },

    // Level 4, 5, 6 (Mostly missing placeholder to show the professional missing state)
    { id: 'b5', type: 'book', title: 'The Dark Woods', subtitle: 'Target: oo, ar, or', level: 4, available: false },
    { id: 'w4', type: 'wordmat', title: 'Set 4 Sounds Mat', subtitle: 'Complex graphemes', level: 4, available: false },
    { id: 'b6', type: 'book', title: 'Space Adventure', subtitle: 'Target: a-e, i-e', level: 5, available: false },
    { id: 'v5', type: 'video', title: 'Advanced Blending', subtitle: 'Multi-syllable focus', level: 5, available: false },
    { id: 'b7', type: 'book', title: 'The Time Machine', subtitle: 'Target: tion, tious', level: 6, available: false },
    { id: 'w6', type: 'wordmat', title: 'Complete Phonics Map', subtitle: 'All sets overview', level: 6, available: false },
];

export default function ResourceDashboard() {
    const [currentLevel, setCurrentLevel] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const displayedResources = currentLevel === 'all'
        ? mockResources
        : mockResources.filter(r => r.level === currentLevel);

    return (
        <div className="min-h-screen bg-[#F4F1EB] relative overflow-hidden font-sans text-[#1C1B1A]">
            {/* Avant-Garde / Glassmorphism Background Architecture */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(28,27,26,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(28,27,26,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>
                <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-[#A84B2B]/5 rounded-full blur-[140px] translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-amber-500/5 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4"></div>
            </div>

            {/* Floating Header */}
            <header className="fixed top-0 left-0 w-full p-6 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1C1B1A] rounded-xl flex items-center justify-center text-[#F4F1EB] shadow-lg">
                                <BookOpen size={20} strokeWidth={1.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-lg tracking-tight leading-none mb-1">
                                    MyPhonicsBooks
                                </span>
                                <span className="font-mono text-[10px] tracking-widest uppercase text-[#827C75]">
                  // Resource Nexus
                                </span>
                            </div>
                        </div>

                        <a href="/" className="px-5 py-2.5 rounded-xl font-sans text-sm font-semibold bg-[#1C1B1A] text-white hover:bg-[#A84B2B] transition-colors shadow-md">
                            Back to Home
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 pt-40 pb-24 px-6 max-w-7xl mx-auto min-h-screen flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-16 max-w-3xl"
                >
                    <div className="font-mono text-sm tracking-[0.2em] uppercase text-[#A84B2B] mb-6 flex items-center gap-3">
                        <span className="w-12 h-px bg-[#A84B2B]"></span>
                        Orchestrating Phonics
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-[#1C1B1A] mb-6 leading-[1.1]">
                        The Master <br className="hidden md:block" />
                        <span className="text-[#827C75] font-light italic">Resource Archive</span>
                    </h1>
                    <p className="text-xl text-[#827C75] font-sans font-light leading-relaxed max-w-2xl">
                        Access every synchronized component of the MyPhonics ecosystem. Books, wordmats, and training videos aligned instantly to developmental levels.
                    </p>
                </motion.div>

                {/* Dashboard Content */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex flex-col"
                >
                    {/* Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                        <LevelNavigation currentLevel={currentLevel} onSelectLevel={setCurrentLevel} />

                        <div className="flex bg-white/60 p-1.5 rounded-xl backdrop-blur-md border border-white/40 shadow-sm self-start lg:self-auto">
                            {['all', 'book', 'wordmat', 'video'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-4 py-2 rounded-lg font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-300
                    ${typeFilter === type
                                            ? 'bg-[#1C1B1A] text-white shadow-md'
                                            : 'bg-transparent text-[#827C75] hover:text-[#1C1B1A]'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <ResourceGrid resources={displayedResources} typeFilter={typeFilter} />
                </motion.div>
            </main>
        </div>
    );
}
