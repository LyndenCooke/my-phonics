import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import AssessmentQuiz from '../components/AssessmentQuiz';

export default function AssessmentPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [childName, setChildName] = useState('');
    const [started, setStarted] = useState(false);
    const initialLevel = searchParams.get('level') ? parseInt(searchParams.get('level')) : null;

    const handleComplete = (level) => {
        // Navigate to create flow with the assessed level
        navigate('/create', {
            state: {
                childName,
                level,
                fromAssessment: true
            }
        });
    };

    const handleBack = () => {
        if (started) {
            setStarted(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-amber-50/30 relative overflow-hidden font-sans">
            {/* Background gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-50/50 to-transparent pointer-events-none" />
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-200/30 blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="absolute top-0 left-0 w-full p-6 z-20">
                <div className="max-w-6xl mx-auto flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                        <BookOpen size={20} />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-slate-800">
                        MyPhonicsBooks
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-32 pb-20 px-4 min-h-screen flex flex-col justify-center">
                {!started ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-8 rounded-3xl max-w-lg w-full mx-auto"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
                                <span className="text-3xl">🎯</span>
                            </div>
                            <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">
                                Reading Level Assessment
                            </h1>
                            <p className="text-slate-600">
                                A quick 2-minute quiz to find the perfect reading level for your child.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                                <span className="text-xl">✓</span>
                                <div>
                                    <p className="font-medium text-slate-800">No pressure</p>
                                    <p className="text-sm text-slate-600">Fun, game-like questions your child will enjoy</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                                <span className="text-xl">📊</span>
                                <div>
                                    <p className="font-medium text-slate-800">Instant results</p>
                                    <p className="text-sm text-slate-600">Get a personalised book recommendation</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                                <span className="text-xl">🎓</span>
                                <div>
                                    <p className="font-medium text-slate-800">Based on phonics research</p>
                                    <p className="text-sm text-slate-600">Aligned with UK phonics curriculum</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Child's first name
                            </label>
                            <input
                                type="text"
                                value={childName}
                                onChange={(e) => setChildName(e.target.value)}
                                placeholder="e.g. Emma"
                                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setStarted(true)}
                            disabled={!childName.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                childName.trim()
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Start Assessment
                            <ArrowRight size={20} />
                        </motion.button>

                        <p className="text-center text-sm text-slate-500 mt-4">
                            Takes about 2 minutes. You'll help your child answer the questions.
                        </p>
                    </motion.div>
                ) : (
                    <AssessmentQuiz
                        childName={childName}
                        onComplete={handleComplete}
                        onBack={handleBack}
                        initialLevel={initialLevel}
                    />
                )}
            </main>
        </div>
    );
}
