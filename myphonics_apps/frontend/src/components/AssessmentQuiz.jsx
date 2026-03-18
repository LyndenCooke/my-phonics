import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown, Volume2, Star, Sparkles, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Phonics sound pronunciations for speech synthesis
// Maps graphemes to phonetic strings the speech engine can pronounce as sounds (not letter names)
const PHONICS_SOUNDS = {
    // Level 1 single letters — pure sounds
    's': 'sss',
    'a': 'aah',
    't': 'tuh',
    'p': 'puh',
    'i': 'ih',
    'n': 'nnn',
    'm': 'mmm',
    'd': 'duh',
    'g': 'guh',
    'o': 'oh',
    'c': 'kuh',
    'k': 'kuh',
    'e': 'eh',
    'u': 'uh',
    'r': 'rrr',
    'h': 'huh',
    'b': 'buh',
    'f': 'fff',
    'l': 'lll',

    // Level 2 single letters
    'j': 'juh',
    'v': 'vvv',
    'w': 'wuh',
    'x': 'ks',
    'y': 'yuh',
    'z': 'zzz',

    // Level 2 digraphs / doubles
    'qu': 'kwuh',
    'sh': 'shh',
    'th': 'thh',
    'ch': 'chuh',
    'ng': 'ng',
    'nk': 'nk',
    'ff': 'fff',
    'll': 'lll',
    'ss': 'sss',
    'ck': 'kuh',

    // Level 3 vowel digraphs / trigraphs
    'ai': 'ay',
    'ee': 'ee',
    'igh': 'eye',
    'oa': 'oh',
    'oo': 'oo',
    'ar': 'ar',
    'or': 'or',
    'ur': 'er',
    'ow': 'ow',
    'oi': 'oy',
    'ear': 'eer',
    'air': 'air',
    'ure': 'oor',
    'er': 'er',

    // Level 5 split digraphs and extras
    'a-e': 'ay',
    'i-e': 'eye',
    'o-e': 'oh',
    'u-e': 'yoo',
    'ay': 'ay',
    'ou': 'ow',
    'ie': 'eye',
    'ea': 'ee',
    'oy': 'oy',
    'ir': 'er',
    'ue': 'yoo',
    'aw': 'or',
    'ew': 'yoo',
};

// Level colours matching the book colours
const LEVEL_CONFIG = {
    1: { colour: '#E84B8A', bgClass: 'bg-[#E84B8A]', gradientClass: 'from-[#E84B8A] to-[#D63B7A]', name: 'Starting Stories' },
    2: { colour: '#F59E0B', bgClass: 'bg-[#F59E0B]', gradientClass: 'from-[#F59E0B] to-[#D97706]', name: 'Longer Sounds' },
    3: { colour: '#22C55E', bgClass: 'bg-[#22C55E]', gradientClass: 'from-[#22C55E] to-[#16A34A]', name: 'New Spellings' },
    4: { colour: '#3B82F6', bgClass: 'bg-[#3B82F6]', gradientClass: 'from-[#3B82F6] to-[#2563EB]', name: 'Building Fluency' },
    5: { colour: '#8B5CF6', bgClass: 'bg-[#8B5CF6]', gradientClass: 'from-[#8B5CF6] to-[#7C3AED]', name: 'Reading Together' },
    6: { colour: '#14B8A6', bgClass: 'bg-[#14B8A6]', gradientClass: 'from-[#14B8A6] to-[#0D9488]', name: 'Reading Champion' }
};

const STAGE_INFO = {
    sound: {
        title: 'Sound Recognition',
        instruction: 'Ask your child to say this sound',
        icon: '🔤',
        label: 'Sound'
    },
    word: {
        title: 'Word Reading',
        instruction: 'Ask your child to read this word',
        icon: '📖',
        label: 'Word'
    },
    nonsense: {
        title: 'Alien Words',
        instruction: 'Ask your child to sound out this made-up word',
        icon: '👽',
        label: 'Alien Word'
    },
    tricky: {
        title: 'Tricky Words',
        instruction: 'Ask your child to read this tricky word (it cannot be sounded out)',
        icon: '⚠️',
        label: 'Tricky Word'
    }
};

export default function AssessmentQuiz({ childName, onComplete, onBack, initialLevel = null }) {
    const [phase, setPhase] = useState(initialLevel ? 'quiz' : 'choose-level'); // 'choose-level' | 'quiz' | 'complete'
    const [startingLevel, setStartingLevel] = useState(initialLevel || 1);
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [progress, setProgress] = useState(null);
    const [resultLevel, setResultLevel] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [questionCount, setQuestionCount] = useState(0);

    const startAssessment = async (level) => {
        setIsLoading(true);
        setError(null);
        setQuestionCount(0);

        try {
            const response = await fetch(`${API_BASE}/api/assessment/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    child_name: childName,
                    starting_level: level
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start assessment');
            }

            const data = await response.json();
            setSessionId(data.session_id);
            setCurrentQuestion(data.current_question);
            setProgress(data.progress);
            setPhase('quiz');

            if (data.is_complete && data.result_level) {
                setResultLevel(data.result_level);
                setPhase('complete');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const submitAnswer = async (correct) => {
        if (!sessionId || !currentQuestion) return;

        setIsLoading(true);
        setQuestionCount(prev => prev + 1);

        try {
            const response = await fetch(`${API_BASE}/api/assessment/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    question_id: currentQuestion.id,
                    correct
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            const data = await response.json();
            setCurrentQuestion(data.current_question);
            setProgress(data.progress);

            if (data.is_complete && data.result_level) {
                setResultLevel(data.result_level);
                setPhase('complete');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Level selection phase
    if (phase === 'choose-level') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                        Where shall we start?
                    </h2>
                    <p className="text-slate-600">
                        Choose the level that best matches {childName}'s current reading.
                        <br />
                        <span className="text-sm text-slate-500">Not sure? Start with Level 1 - we'll find the right level together.</span>
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                    {[1, 2, 3, 4, 5, 6].map(level => {
                        const config = LEVEL_CONFIG[level];
                        const isSelected = startingLevel === level;
                        return (
                            <motion.button
                                key={level}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setStartingLevel(level)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                    ? 'border-slate-800 shadow-lg'
                                    : 'border-slate-100 hover:border-slate-200'
                                    }`}
                                style={isSelected ? { backgroundColor: config.colour + '15' } : {}}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: config.colour }}
                                >
                                    {level}
                                </div>
                                <p className="font-medium text-slate-800 text-sm">{config.name}</p>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onBack}
                        className="px-6 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                        <ArrowLeft size={18} className="inline mr-2" />
                        Back
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startAssessment(startingLevel)}
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Starting...' : 'Start Assessment'}
                        <ArrowRight size={18} className="inline ml-2" />
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // Error state
    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto text-center"
            >
                <div className="text-red-500 mb-4">
                    <AlertTriangle size={48} className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => startAssessment(startingLevel)}
                    className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors"
                >
                    Try Again
                </button>
            </motion.div>
        );
    }

    // Complete state
    if (phase === 'complete' && resultLevel) {
        const levelConfig = LEVEL_CONFIG[resultLevel];
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mb-6"
                >
                    <div
                        className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: levelConfig.colour }}
                    >
                        <Sparkles size={40} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                        All done!
                    </h2>
                    <p className="text-lg text-slate-600 mb-6">
                        {childName} is ready for{' '}
                        <span className="font-bold" style={{ color: levelConfig.colour }}>
                            Level {resultLevel}: {levelConfig.name}
                        </span>
                    </p>

                    <div
                        className="rounded-2xl p-6 mb-8"
                        style={{ backgroundColor: levelConfig.colour + '15' }}
                    >
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Star className="text-amber-500" size={24} />
                            <span className="font-bold text-slate-800">Well done, {childName}!</span>
                            <Star className="text-amber-500" size={24} />
                        </div>
                        <p className="text-slate-600 text-sm">
                            {questionCount} questions completed
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                setPhase('choose-level');
                                setResultLevel(null);
                                setSessionId(null);
                            }}
                            className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:border-slate-300 transition-colors"
                        >
                            Try Again
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onComplete?.(resultLevel)}
                            className="px-8 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                            style={{ background: `linear-gradient(to right, ${levelConfig.colour}, ${levelConfig.colour}dd)` }}
                        >
                            Choose a Book
                            <ArrowRight size={18} className="inline ml-2" />
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    // Loading state
    if (isLoading && !currentQuestion) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto text-center"
            >
                <div className="animate-pulse">
                    <div className="w-16 h-16 bg-pink-200 rounded-full mx-auto mb-4" />
                    <div className="h-6 bg-slate-200 rounded w-48 mx-auto mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-64 mx-auto" />
                </div>
                <p className="mt-6 text-slate-600">Getting ready for {childName}...</p>
            </motion.div>
        );
    }

    // Quiz state
    const currentLevel = progress?.current_level || startingLevel;
    const levelConfig = LEVEL_CONFIG[currentLevel];
    const stageInfo = STAGE_INFO[currentQuestion?.stage] || STAGE_INFO.sound;
    const isTrickyWord = currentQuestion?.stage === 'tricky';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto"
        >
            {/* Header with level indicator */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: levelConfig.colour }}
                    >
                        {currentLevel}
                    </div>
                    <div>
                        <p className="font-medium text-slate-800">{levelConfig.name}</p>
                        <p className="text-sm text-slate-500">{stageInfo.title}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500">Question</p>
                    <p className="font-bold text-slate-800">{questionCount + 1}</p>
                </div>
            </div>

            {/* Progress dots - no success/failure indication */}
            <div className="flex gap-1 mb-6 justify-center">
                {[1, 2, 3, 4, 5, 6].map(level => (
                    <div
                        key={level}
                        className={`w-8 h-2 rounded-full transition-all ${level < currentLevel
                            ? ''
                            : level === currentLevel
                                ? 'ring-2 ring-offset-1'
                                : 'bg-slate-100'
                            }`}
                        style={{
                            backgroundColor: level <= currentLevel ? LEVEL_CONFIG[level].colour : undefined,
                            ringColor: level === currentLevel ? LEVEL_CONFIG[level].colour : undefined
                        }}
                    />
                ))}
            </div>

            {/* Instruction */}
            <p className="text-center text-slate-600 mb-4">
                {stageInfo.instruction}
            </p>

            {/* Question card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion?.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    {/* Tricky word warning */}
                    {isTrickyWord && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-700">
                            <AlertTriangle size={18} />
                            <span className="text-sm font-medium">
                                This is a tricky word - it cannot be sounded out phonetically
                            </span>
                        </div>
                    )}

                    {/* Word/Sound display */}
                    <div
                        className={`rounded-2xl p-8 text-center mb-6 shadow-lg ${isTrickyWord ? 'bg-red-500' : ''}`}
                        style={!isTrickyWord ? {
                            background: `linear-gradient(135deg, ${levelConfig.colour}, ${levelConfig.colour}cc)`
                        } : {}}
                    >
                        <p className="text-white/80 text-xs uppercase tracking-wider mb-3 font-medium">
                            {stageInfo.label}
                        </p>
                        <p className="text-5xl md:text-6xl font-display font-bold text-white tracking-wide">
                            {currentQuestion?.prompt}
                        </p>

                        {/* Audio button */}
                        <button
                            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white/90 hover:bg-white/30 transition-colors"
                            onClick={() => {
                                if ('speechSynthesis' in window) {
                                    speechSynthesis.cancel(); // Stop any currently playing speech
                                    const prompt = currentQuestion?.prompt?.toLowerCase();
                                    const isSound = currentQuestion?.stage === 'sound';

                                    // For sounds, use the phonics pronunciation map
                                    // For words, speak the word directly
                                    const textToSpeak = isSound
                                        ? (PHONICS_SOUNDS[prompt] || prompt)
                                        : currentQuestion?.prompt;

                                    const utterance = new SpeechSynthesisUtterance(textToSpeak);
                                    utterance.rate = isSound ? 0.5 : 0.7; // Even slower for individual sounds
                                    utterance.pitch = 1.0;
                                    utterance.lang = 'en-GB'; // British English
                                    speechSynthesis.speak(utterance);
                                }
                            }}
                        >
                            <Volume2 size={18} />
                            <span className="text-sm">Hear it</span>
                        </button>
                    </div>

                    {/* Answer buttons - neutral language */}
                    <div className="flex gap-4 justify-center">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => submitAnswer(false)}
                            disabled={isLoading}
                            className="flex-1 max-w-[180px] py-4 px-6 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ThumbsDown className="mx-auto mb-1 text-slate-400" size={24} />
                            Still learning
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => submitAnswer(true)}
                            disabled={isLoading}
                            className="flex-1 max-w-[180px] py-4 px-6 bg-white border-2 text-slate-700 rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderColor: levelConfig.colour }}
                        >
                            <ThumbsUp className="mx-auto mb-1" style={{ color: levelConfig.colour }} size={24} />
                            Got it!
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Back button */}
            <div className="mt-8 text-center">
                <button
                    onClick={() => {
                        setPhase('choose-level');
                        setSessionId(null);
                        setCurrentQuestion(null);
                    }}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                    <ArrowLeft size={18} />
                    Change starting level
                </button>
            </div>
        </motion.div>
    );
}
