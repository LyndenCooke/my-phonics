import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Sparkles,
    Shuffle,
    BookOpen,
    User,
    Users,
    MapPin,
    Heart,
    Palette,
    Check
} from 'lucide-react';

// Level colours matching the books
const LEVEL_CONFIG = {
    1: { colour: '#E84B8A', name: 'Starting Stories', desc: 'First sounds and simple CVC words' },
    2: { colour: '#F59E0B', name: 'Longer Sounds', desc: 'Digraphs like sh, ch, th, ee, oo' },
    3: { colour: '#22C55E', name: 'New Spellings', desc: 'Split digraphs and consonant clusters' },
    4: { colour: '#3B82F6', name: 'Building Fluency', desc: 'More complex vowel sounds' },
    5: { colour: '#8B5CF6', name: 'Reading Together', desc: 'Longer words and sentences' },
    6: { colour: '#14B8A6', name: 'Reading Champion', desc: 'Suffixes and advanced patterns' }
};

const STORY_THEMES = [
    { id: 'adventure', label: 'An exciting adventure', emoji: '🗺️' },
    { id: 'lost_thing', label: 'Finding something lost', emoji: '🔍' },
    { id: 'new_friend', label: 'Making a new friend', emoji: '🤝' },
    { id: 'big_day', label: 'A special day', emoji: '🎉' },
    { id: 'helper', label: 'Helping someone', emoji: '💝' },
    { id: 'discovery', label: 'Discovering something new', emoji: '✨' },
    { id: 'pet_story', label: 'A story with animals', emoji: '🐾' },
    { id: 'sport_game', label: 'Playing a game or sport', emoji: '⚽' },
    { id: 'weather_day', label: 'A fun day outdoors', emoji: '☀️' },
    { id: 'family_day', label: 'Time with family', emoji: '👨‍👩‍👧' }
];

const RANDOM_NAMES = ['Alex', 'Sam', 'Charlie', 'Jamie', 'Robin', 'Taylor', 'Jordan', 'Casey'];
const RANDOM_FRIENDS = ['Max', 'Lily', 'Oscar', 'Ruby', 'Teddy', 'Rosie', 'Archie', 'Poppy'];
const RANDOM_PLACES = ['the park', 'the beach', 'the woods', 'the garden', 'school', 'grandma\'s house', 'the library', 'the farm'];
const RANDOM_INTERESTS = ['dinosaurs', 'space', 'animals', 'football', 'dancing', 'painting', 'building', 'cooking', 'music', 'nature'];

export default function CreateBookFlow({ onComplete, onStartAssessment, initialData = {} }) {
    const [data, setData] = useState({
        childName: initialData.childName || '',
        friendName: '',
        location: '',
        interests: '',
        level: initialData.level || null,
        theme: null,
        ...initialData
    });

    const [currentSection, setCurrentSection] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const updateData = (updates) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const surpriseMe = (field) => {
        switch (field) {
            case 'childName':
                updateData({ childName: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] });
                break;
            case 'friendName':
                updateData({ friendName: RANDOM_FRIENDS[Math.floor(Math.random() * RANDOM_FRIENDS.length)] });
                break;
            case 'location':
                updateData({ location: RANDOM_PLACES[Math.floor(Math.random() * RANDOM_PLACES.length)] });
                break;
            case 'interests':
                const randomInterests = [];
                const shuffled = [...RANDOM_INTERESTS].sort(() => 0.5 - Math.random());
                randomInterests.push(shuffled[0], shuffled[1]);
                updateData({ interests: randomInterests.join(', ') });
                break;
            case 'theme':
                const randomTheme = STORY_THEMES[Math.floor(Math.random() * STORY_THEMES.length)];
                updateData({ theme: randomTheme.id });
                break;
            case 'level':
                updateData({ level: Math.floor(Math.random() * 6) + 1 });
                break;
            default:
                break;
        }
    };

    const handleSubmit = () => {
        if (!data.childName?.trim()) return;
        if (!data.level) return;

        setIsGenerating(true);
        // Simulate generation delay then complete
        setTimeout(() => {
            onComplete?.(data);
        }, 500);
    };

    const canProceed = data.childName?.trim() && data.level;

    const sections = [
        {
            id: 'child',
            title: "Let's create a book!",
            subtitle: "First, tell us about the star of the story"
        },
        {
            id: 'story',
            title: 'What kind of story?',
            subtitle: 'Choose a theme or let us surprise you'
        },
        {
            id: 'level',
            title: 'Reading level',
            subtitle: 'Match the book to their current ability'
        }
    ];

    return (
        <div className="max-w-2xl w-full mx-auto">
            {/* Progress indicator */}
            <div className="flex gap-2 mb-8 justify-center">
                {sections.map((section, idx) => (
                    <button
                        key={section.id}
                        onClick={() => setCurrentSection(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentSection
                                ? 'w-12 bg-pink-500'
                                : idx < currentSection
                                    ? 'w-8 bg-pink-300'
                                    : 'w-8 bg-slate-200'
                        }`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* Section 1: Child Details */}
                {currentSection === 0 && (
                    <motion.div
                        key="child"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel p-8 rounded-3xl"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
                                <BookOpen size={32} />
                            </div>
                            <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                                {sections[0].title}
                            </h2>
                            <p className="text-slate-600">{sections[0].subtitle}</p>
                        </div>

                        <div className="space-y-6">
                            {/* Child's name - Required */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <User size={16} className="text-pink-500" />
                                        What's your child's name? *
                                    </label>
                                    <button
                                        onClick={() => surpriseMe('childName')}
                                        className="text-xs text-pink-500 hover:text-pink-600 flex items-center gap-1 font-medium"
                                    >
                                        <Shuffle size={12} />
                                        Surprise me
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={data.childName}
                                    onChange={(e) => updateData({ childName: e.target.value })}
                                    className="w-full px-5 py-4 text-lg rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all bg-white"
                                    placeholder="e.g. Emma, Leo, Sophie..."
                                    autoFocus
                                />
                            </div>

                            {/* Friend's name - Optional */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Users size={16} className="text-slate-400" />
                                        Include a friend or sibling? <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <button
                                        onClick={() => surpriseMe('friendName')}
                                        className="text-xs text-slate-400 hover:text-pink-500 flex items-center gap-1 font-medium"
                                    >
                                        <Shuffle size={12} />
                                        Surprise me
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={data.friendName}
                                    onChange={(e) => updateData({ friendName: e.target.value })}
                                    className="w-full px-5 py-4 text-lg rounded-xl border-2 border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all bg-white"
                                    placeholder="Leave blank or add a name..."
                                />
                            </div>

                            {/* Location - Optional */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <MapPin size={16} className="text-slate-400" />
                                        Where does the story happen? <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <button
                                        onClick={() => surpriseMe('location')}
                                        className="text-xs text-slate-400 hover:text-pink-500 flex items-center gap-1 font-medium"
                                    >
                                        <Shuffle size={12} />
                                        Surprise me
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => updateData({ location: e.target.value })}
                                    className="w-full px-5 py-4 text-lg rounded-xl border-2 border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all bg-white"
                                    placeholder="e.g. the park, the beach, school..."
                                />
                            </div>

                            {/* Interests - Optional */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Heart size={16} className="text-slate-400" />
                                        What does {data.childName || 'your child'} love? <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <button
                                        onClick={() => surpriseMe('interests')}
                                        className="text-xs text-slate-400 hover:text-pink-500 flex items-center gap-1 font-medium"
                                    >
                                        <Shuffle size={12} />
                                        Surprise me
                                    </button>
                                </div>
                                <textarea
                                    value={data.interests}
                                    onChange={(e) => updateData({ interests: e.target.value })}
                                    className="w-full px-5 py-4 text-lg rounded-xl border-2 border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all bg-white resize-none"
                                    placeholder="e.g. dinosaurs, space, football, dancing..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setCurrentSection(1)}
                                disabled={!data.childName?.trim()}
                                className={`px-8 py-4 rounded-xl font-medium text-lg flex items-center gap-2 transition-all ${
                                    data.childName?.trim()
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                Next: Story Theme
                                <ArrowRight size={20} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Section 2: Story Theme */}
                {currentSection === 1 && (
                    <motion.div
                        key="story"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel p-8 rounded-3xl"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
                                <Palette size={32} />
                            </div>
                            <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                                {sections[1].title}
                            </h2>
                            <p className="text-slate-600">{sections[1].subtitle}</p>
                        </div>

                        {/* Surprise Me - Big button */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => surpriseMe('theme')}
                            className={`w-full mb-6 p-5 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${
                                data.theme === null
                                    ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 hover:border-amber-400'
                                    : 'border-slate-200 bg-white hover:border-amber-300'
                            }`}
                        >
                            <Sparkles size={24} className="text-amber-500" />
                            <span className="text-lg font-medium text-slate-700">Surprise me with a theme!</span>
                        </motion.button>

                        {/* Theme grid */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {STORY_THEMES.map((theme) => {
                                const isSelected = data.theme === theme.id;
                                return (
                                    <motion.button
                                        key={theme.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => updateData({ theme: theme.id })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            isSelected
                                                ? 'border-pink-500 bg-pink-50 shadow-sm'
                                                : 'border-slate-100 bg-white hover:border-pink-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{theme.emoji}</span>
                                            <span className={`font-medium ${isSelected ? 'text-pink-700' : 'text-slate-700'}`}>
                                                {theme.label}
                                            </span>
                                            {isSelected && (
                                                <Check size={18} className="text-pink-500 ml-auto" />
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setCurrentSection(0)}
                                className="px-6 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                            >
                                Back
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setCurrentSection(2)}
                                className="px-8 py-4 rounded-xl font-medium text-lg flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                                Next: Reading Level
                                <ArrowRight size={20} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Section 3: Reading Level */}
                {currentSection === 2 && (
                    <motion.div
                        key="level"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel p-8 rounded-3xl"
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                                {sections[2].title}
                            </h2>
                            <p className="text-slate-600 mb-4">{sections[2].subtitle}</p>

                            {/* Assessment CTA */}
                            {onStartAssessment && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onStartAssessment}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all"
                                >
                                    <Sparkles size={18} />
                                    Not sure? Take our 2-minute assessment
                                </motion.button>
                            )}
                        </div>

                        {/* Level grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            {[1, 2, 3, 4, 5, 6].map(level => {
                                const config = LEVEL_CONFIG[level];
                                const isSelected = data.level === level;
                                return (
                                    <motion.button
                                        key={level}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => updateData({ level })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            isSelected
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
                                        <p className="text-xs text-slate-500 mt-1">{config.desc}</p>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Surprise Me button for level */}
                        <div className="text-center mb-6">
                            <button
                                onClick={() => surpriseMe('level')}
                                className="text-sm text-slate-400 hover:text-pink-500 flex items-center gap-1 font-medium mx-auto"
                            >
                                <Shuffle size={14} />
                                Pick a random level for me
                            </button>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setCurrentSection(1)}
                                className="px-6 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                            >
                                Back
                            </button>
                            <motion.button
                                whileHover={canProceed ? { scale: 1.02 } : {}}
                                whileTap={canProceed ? { scale: 0.98 } : {}}
                                onClick={handleSubmit}
                                disabled={!canProceed || isGenerating}
                                className={`px-8 py-4 rounded-xl font-medium text-lg flex items-center gap-2 transition-all ${
                                    canProceed && !isGenerating
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create My Book
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summary bar - shows what's been filled */}
            {(data.childName || data.theme || data.level) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100 flex flex-wrap gap-3 justify-center"
                >
                    {data.childName && (
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                            {data.childName}
                        </span>
                    )}
                    {data.theme && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {STORY_THEMES.find(t => t.id === data.theme)?.emoji} {STORY_THEMES.find(t => t.id === data.theme)?.label}
                        </span>
                    )}
                    {data.level && (
                        <span
                            className="px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{ backgroundColor: LEVEL_CONFIG[data.level].colour }}
                        >
                            Level {data.level}
                        </span>
                    )}
                </motion.div>
            )}
        </div>
    );
}
