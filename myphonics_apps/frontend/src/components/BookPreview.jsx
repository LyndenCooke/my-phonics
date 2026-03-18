import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, BookOpen, Star, Heart } from 'lucide-react';

// Level colours matching the books
const LEVEL_CONFIG = {
    1: { colour: '#E84B8A', name: 'Starting Stories', fontClass: 'text-3xl' },
    2: { colour: '#F59E0B', name: 'Longer Sounds', fontClass: 'text-2xl' },
    3: { colour: '#22C55E', name: 'New Spellings', fontClass: 'text-xl' },
    4: { colour: '#3B82F6', name: 'Building Fluency', fontClass: 'text-lg' },
    5: { colour: '#8B5CF6', name: 'Reading Together', fontClass: 'text-base' },
    6: { colour: '#14B8A6', name: 'Reading Champion', fontClass: 'text-base' }
};

// Story theme titles and sample text
const THEME_DATA = {
    adventure: {
        title: 'The Adventure',
        pages: [
            { text: '[NAME] woke up. It was a sunny day. "I want to go on an adventure," said [NAME].', illustration: 'Child looking out window excitedly' },
            { text: '[NAME] put on a coat and went outside. [FRIEND] was there. "Can I come too?" said [FRIEND].', illustration: 'Two children meeting outside' }
        ]
    },
    lost_thing: {
        title: 'The Lost Thing',
        pages: [
            { text: '[NAME] looked around the room. "Where is my [THING]?" said [NAME]. It was not on the bed.', illustration: 'Child searching room' },
            { text: '[NAME] looked under the bed. Not there! [NAME] looked in the box. Not there!', illustration: 'Child looking under furniture' }
        ]
    },
    new_friend: {
        title: 'A New Friend',
        pages: [
            { text: '[NAME] went to the park. There was someone new there. "Hello," said [NAME].', illustration: 'Child at park seeing new person' },
            { text: '"I am [FRIEND]," said the new child. "Do you want to play?" [NAME] said yes.', illustration: 'Two children introducing themselves' }
        ]
    },
    big_day: {
        title: 'The Big Day',
        pages: [
            { text: 'Today was a big day for [NAME]. [NAME] jumped out of bed. "I cannot wait!" said [NAME].', illustration: 'Child jumping out of bed excitedly' },
            { text: '[NAME] got dressed fast. "Slow down," said Mum. But [NAME] was too excited.', illustration: 'Child getting dressed quickly' }
        ]
    },
    helper: {
        title: 'The Helper',
        pages: [
            { text: '[NAME] saw that Mum was busy. "Can I help?" said [NAME]. Mum smiled.', illustration: 'Child offering to help parent' },
            { text: '"Yes, you can help me," said Mum. [NAME] picked up the things on the floor.', illustration: 'Child helping tidy up' }
        ]
    },
    discovery: {
        title: 'The Discovery',
        pages: [
            { text: '[NAME] was digging in the garden. The spade hit something hard. "What is this?" said [NAME].', illustration: 'Child digging in garden' },
            { text: '[NAME] brushed off the dirt. It was something special. [NAME] ran to show [FRIEND].', illustration: 'Child discovering something' }
        ]
    },
    pet_story: {
        title: 'My Pet',
        pages: [
            { text: '[NAME] had a pet. It was soft and fluffy. [NAME] loved the pet a lot.', illustration: 'Child with pet' },
            { text: 'One day, the pet was not well. "Oh no," said [NAME]. "I will look after you."', illustration: 'Child caring for pet' }
        ]
    },
    sport_game: {
        title: 'The Big Game',
        pages: [
            { text: 'Today was the big game. [NAME] put on the kit. "I am ready," said [NAME].', illustration: 'Child in sports kit' },
            { text: '[NAME] ran onto the pitch. [FRIEND] was there too. "Let us win!" said [FRIEND].', illustration: 'Children on sports field' }
        ]
    },
    weather_day: {
        title: 'A Sunny Day',
        pages: [
            { text: 'The sun was out. [NAME] went to play outside. The grass was warm.', illustration: 'Child outside on sunny day' },
            { text: '[NAME] ran and jumped. A bug flew past. "Hello, bug!" said [NAME].', illustration: 'Child playing in sunshine' }
        ]
    },
    family_day: {
        title: 'Family Fun',
        pages: [
            { text: 'Today, [NAME] was with the family. "What shall we do?" said Dad.', illustration: 'Family together' },
            { text: '"Let us go to the park!" said [NAME]. Everyone said yes.', illustration: 'Family heading to park' }
        ]
    }
};

// Sample focus sounds and tricky words by level
const LEVEL_PHONICS = {
    1: { sounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'], tricky: ['the', 'I', 'to', 'no', 'go'] },
    2: { sounds: ['ay', 'ee', 'igh', 'ow', 'oo', 'ar'], tricky: ['he', 'she', 'we', 'me', 'be', 'my'] },
    3: { sounds: ['a-e', 'i-e', 'o-e', 'u-e', 'e-e'], tricky: ['all', 'some', 'what', 'they'] },
    4: { sounds: ['are', 'ur', 'er', 'ow', 'ew', 'ue'], tricky: ['where', 'were', 'who', 'any'] },
    5: { sounds: ['ore', 'oor', 'ire', 'ear', 'ure', 'tion'], tricky: ['could', 'would', 'through'] },
    6: { sounds: ['ous', 'cious', 'tious', 'able', 'ible'], tricky: ['should', 'bought', 'thought'] }
};

function BookPage({ children, pageNumber, isLeft, levelColour }) {
    return (
        <div
            className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${isLeft ? 'rounded-r-none' : 'rounded-l-none'}`}
            style={{
                width: '100%',
                aspectRatio: '148 / 210', // A5 ratio
                fontFamily: "'Andika', 'Comic Sans MS', sans-serif"
            }}
        >
            {/* Page content */}
            <div className="absolute inset-0 p-4 flex flex-col">
                {children}
            </div>

            {/* Page number */}
            {pageNumber && (
                <div
                    className="absolute bottom-2 text-xs font-medium"
                    style={{
                        [isLeft ? 'left' : 'right']: '12px',
                        color: levelColour
                    }}
                >
                    {pageNumber}
                </div>
            )}

            {/* Page edge shadow */}
            <div
                className={`absolute top-0 bottom-0 w-4 ${isLeft ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-slate-200/50 to-transparent`}
            />
        </div>
    );
}

function CoverPage({ childName, level, theme, levelColour }) {
    const themeData = THEME_DATA[theme] || THEME_DATA.adventure;
    const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

    return (
        <div
            className="relative rounded-lg shadow-2xl overflow-hidden"
            style={{
                width: '100%',
                aspectRatio: '148 / 210',
                background: `linear-gradient(135deg, ${levelColour}, ${levelColour}dd)`,
                fontFamily: "'Andika', 'Comic Sans MS', sans-serif"
            }}
        >
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute bottom-8 left-4 w-12 h-12 rounded-full bg-white/10" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                {/* Level badge */}
                <div className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                    Level {level}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-md">
                    {themeData.title}
                </h1>

                {/* Child's name */}
                <div className="bg-white/20 px-4 py-2 rounded-xl mb-4">
                    <p className="text-lg font-medium">
                        Starring: <span className="font-bold">{childName}</span>
                    </p>
                </div>

                {/* Illustration placeholder */}
                <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen size={40} className="text-white/70" />
                </div>

                {/* Focus sounds */}
                <p className="text-xs text-white/80 mt-auto">
                    Focus sounds: {LEVEL_PHONICS[level]?.sounds.slice(0, 4).join(', ')}
                </p>
            </div>

            {/* MyPhonicsBooks branding */}
            <div className="absolute bottom-3 left-0 right-0 text-center">
                <p className="text-[10px] text-white/60 font-medium tracking-wide">
                    MyPhonicsBooks
                </p>
            </div>
        </div>
    );
}

function GuideForGrownUpsPage({ levelColour }) {
    return (
        <BookPage pageNumber={2} isLeft={true} levelColour={levelColour}>
            <h2 className="text-sm font-bold mb-3" style={{ color: levelColour }}>
                Guide for Grown-Ups
            </h2>

            <div className="space-y-3 text-[10px] text-slate-700 leading-relaxed">
                <div>
                    <p className="font-bold text-slate-800 mb-1">Before Reading</p>
                    <p>Look at the cover together. Talk about what might happen in the story.</p>
                </div>

                <div>
                    <p className="font-bold text-slate-800 mb-1">During Reading</p>
                    <p>Point to each word as you read. Let your child try to sound out words they know.</p>
                </div>

                <div>
                    <p className="font-bold text-slate-800 mb-1">After Reading</p>
                    <p>Ask questions about the story. What was their favourite part?</p>
                </div>

                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <p className="font-bold text-amber-800 flex items-center gap-1">
                        <Star size={12} /> Top Tip
                    </p>
                    <p className="text-amber-700">Keep it fun! Short reading sessions work best.</p>
                </div>
            </div>
        </BookPage>
    );
}

function ReferencePage({ level, levelColour }) {
    const phonics = LEVEL_PHONICS[level] || LEVEL_PHONICS[1];

    return (
        <BookPage pageNumber={3} isLeft={false} levelColour={levelColour}>
            <h2 className="text-sm font-bold mb-2" style={{ color: levelColour }}>
                Sounds in This Book
            </h2>

            {/* Sound cards */}
            <div className="grid grid-cols-4 gap-1 mb-3">
                {phonics.sounds.map((sound, i) => (
                    <div
                        key={i}
                        className="aspect-square rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: levelColour }}
                    >
                        {sound}
                    </div>
                ))}
            </div>

            {/* Tricky words */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                <p className="text-[10px] font-bold text-red-700 mb-1">Tricky Words</p>
                <div className="flex flex-wrap gap-1">
                    {phonics.tricky.map((word, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium"
                        >
                            {word}
                        </span>
                    ))}
                </div>
            </div>

            {/* Story words preview */}
            <div>
                <p className="text-[10px] font-bold text-slate-700 mb-1">Story Words</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                    This story uses simple words that your child can sound out using the sounds above.
                </p>
            </div>
        </BookPage>
    );
}

function StoryPage({ text, pageNumber, isLeft, childName, friendName, levelColour, level }) {
    const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

    // Replace placeholders
    const displayText = text
        .replace(/\[NAME\]/g, childName || 'Alex')
        .replace(/\[FRIEND\]/g, friendName || 'Sam')
        .replace(/\[THING\]/g, 'toy')
        .replace(/\[LOCATION\]/g, 'the park');

    return (
        <BookPage pageNumber={pageNumber} isLeft={isLeft} levelColour={levelColour}>
            {/* Illustration placeholder */}
            <div
                className="flex-1 rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${levelColour}15` }}
            >
                <div className="text-center text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-1" style={{ color: levelColour }} />
                    <p className="text-[10px]">Illustration</p>
                </div>
            </div>

            {/* Story text */}
            <div className={`${levelConfig.fontClass} text-slate-800 leading-relaxed`} style={{ fontFamily: "'Andika', sans-serif" }}>
                {displayText}
            </div>
        </BookPage>
    );
}

export default function BookPreview({ data, onNext, onBack }) {
    const [currentSpread, setCurrentSpread] = useState(0); // 0 = cover, 1 = pages 2-3, 2 = pages 4-5

    const level = data.level || 1;
    const levelColour = LEVEL_CONFIG[level]?.colour || '#E84B8A';
    const theme = data.theme || 'adventure';
    const themeData = THEME_DATA[theme] || THEME_DATA.adventure;

    const spreads = [
        { type: 'cover' },
        { type: 'guide-reference' },
        { type: 'story-1-2' }
    ];

    const nextSpread = () => {
        if (currentSpread < spreads.length - 1) {
            setCurrentSpread(currentSpread + 1);
        }
    };

    const prevSpread = () => {
        if (currentSpread > 0) {
            setCurrentSpread(currentSpread - 1);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl w-full mx-auto"
        >
            <div className="text-center mb-6">
                <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                    Preview Your Book
                </h2>
                <p className="text-slate-600">
                    Here's how {data.childName}'s personalised book will look
                </p>
            </div>

            {/* Book container */}
            <div className="relative bg-slate-100 rounded-3xl p-6 md:p-10 shadow-inner mb-6">
                {/* Book spread */}
                <div className="relative max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSpread}
                            initial={{ opacity: 0, rotateY: -10 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentSpread === 0 ? (
                                /* Cover spread */
                                <div className="flex justify-center">
                                    <div className="w-1/2 max-w-[250px]">
                                        <CoverPage
                                            childName={data.childName || 'Your Child'}
                                            level={level}
                                            theme={theme}
                                            levelColour={levelColour}
                                        />
                                    </div>
                                </div>
                            ) : currentSpread === 1 ? (
                                /* Guide & Reference spread */
                                <div className="flex gap-1 justify-center">
                                    <div className="w-1/2 max-w-[250px]">
                                        <GuideForGrownUpsPage levelColour={levelColour} />
                                    </div>
                                    <div className="w-1/2 max-w-[250px]">
                                        <ReferencePage level={level} levelColour={levelColour} />
                                    </div>
                                </div>
                            ) : (
                                /* Story pages 1-2 */
                                <div className="flex gap-1 justify-center">
                                    <div className="w-1/2 max-w-[250px]">
                                        <StoryPage
                                            text={themeData.pages[0]?.text || ''}
                                            pageNumber={4}
                                            isLeft={true}
                                            childName={data.childName}
                                            friendName={data.friendName}
                                            levelColour={levelColour}
                                            level={level}
                                        />
                                    </div>
                                    <div className="w-1/2 max-w-[250px]">
                                        <StoryPage
                                            text={themeData.pages[1]?.text || ''}
                                            pageNumber={5}
                                            isLeft={false}
                                            childName={data.childName}
                                            friendName={data.friendName}
                                            levelColour={levelColour}
                                            level={level}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation arrows */}
                    <button
                        onClick={prevSpread}
                        disabled={currentSpread === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
                            currentSpread === 0
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:scale-110 hover:shadow-xl'
                        }`}
                    >
                        <ChevronLeft size={24} className="text-slate-600" />
                    </button>

                    <button
                        onClick={nextSpread}
                        disabled={currentSpread === spreads.length - 1}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
                            currentSpread === spreads.length - 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:scale-110 hover:shadow-xl'
                        }`}
                    >
                        <ChevronRight size={24} className="text-slate-600" />
                    </button>
                </div>

                {/* Page indicators */}
                <div className="flex justify-center gap-2 mt-6">
                    {spreads.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSpread(idx)}
                            className={`h-2 rounded-full transition-all ${
                                idx === currentSpread
                                    ? 'w-8'
                                    : 'w-2 hover:w-4'
                            }`}
                            style={{
                                backgroundColor: idx === currentSpread ? levelColour : '#cbd5e1'
                            }}
                        />
                    ))}
                </div>

                {/* Spread labels */}
                <p className="text-center text-sm text-slate-500 mt-3">
                    {currentSpread === 0 && 'Front Cover'}
                    {currentSpread === 1 && 'Pages 2-3: Guide & Sounds'}
                    {currentSpread === 2 && 'Pages 4-5: Story Begins'}
                </p>
            </div>

            {/* Info box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 mb-6 border border-amber-200">
                <div className="flex items-start gap-3">
                    <Heart className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-bold text-slate-800 mb-1">Full book includes 16 pages</p>
                        <p className="text-sm text-slate-600">
                            Complete story (8 pages), comprehension questions, writing practice,
                            nonsense word challenge, and a reading certificate.
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="glass-panel p-5 rounded-2xl mb-6">
                <h3 className="font-bold text-slate-800 mb-3">Your Book Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-slate-500">Child's Name</span>
                        <p className="font-medium text-slate-800">{data.childName}</p>
                    </div>
                    <div>
                        <span className="text-slate-500">Reading Level</span>
                        <p className="font-medium" style={{ color: levelColour }}>
                            Level {level}: {LEVEL_CONFIG[level]?.name}
                        </p>
                    </div>
                    <div>
                        <span className="text-slate-500">Story Theme</span>
                        <p className="font-medium text-slate-800">{themeData.title}</p>
                    </div>
                    {data.friendName && (
                        <div>
                            <span className="text-slate-500">Friend</span>
                            <p className="font-medium text-slate-800">{data.friendName}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Edit Details
                </button>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all text-white"
                    style={{ background: `linear-gradient(to right, ${levelColour}, ${levelColour}dd)` }}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Continue to Checkout
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}
