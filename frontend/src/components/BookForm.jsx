import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, MapPin, Users, Heart, ArrowRight, Bird, Rocket, Sparkles, Trophy, Dog, Cake, TreeDeciduous, Car, Music, Palette } from 'lucide-react';

const INTERESTS = [
    { id: 'dinosaurs', label: 'Dinosaurs', Icon: Bird },
    { id: 'space', label: 'Space', Icon: Rocket },
    { id: 'unicorns', label: 'Unicorns', Icon: Sparkles },
    { id: 'football', label: 'Football', Icon: Trophy },
    { id: 'animals', label: 'Animals', Icon: Dog },
    { id: 'baking', label: 'Baking', Icon: Cake },
    { id: 'nature', label: 'Nature', Icon: TreeDeciduous },
    { id: 'vehicles', label: 'Vehicles', Icon: Car },
    { id: 'music', label: 'Music', Icon: Music },
    { id: 'art', label: 'Art', Icon: Palette }
];

export default function BookForm({ data, onChange, onNext }) {
    const [errors, setErrors] = useState({});

    const toggleInterest = (interestId) => {
        const current = data.interests || [];
        if (current.includes(interestId)) {
            onChange({ interests: current.filter(id => id !== interestId) });
        } else if (current.length < 3) {
            onChange({ interests: [...current, interestId] });
        }
    };

    const handleNext = () => {
        if (!data.childName?.trim()) {
            setErrors({ childName: 'Child name is required' });
            return;
        }
        setErrors({});
        onNext();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto"
        >
            <h2 className="text-3xl font-display font-bold text-slate-800 mb-6 text-center">
                Who is this book for?
            </h2>

            <div className="space-y-6">
                {/* Child's Name & Age */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <UserCircle size={16} className="text-brand-500" />
                            Child's First Name *
                        </label>
                        <input
                            type="text"
                            value={data.childName || ''}
                            onChange={(e) => onChange({ childName: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.childName ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-brand-500'} focus:outline-none focus:ring-2 bg-white/50 backdrop-blur-sm transition-all`}
                            placeholder="e.g. Leo"
                        />
                        {errors.childName && <p className="text-red-500 text-xs mt-1">{errors.childName}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <span className="text-brand-500 font-bold">#</span>
                            Age (Optional)
                        </label>
                        <input
                            type="number"
                            value={data.age || ''}
                            onChange={(e) => onChange({ age: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white/50 backdrop-blur-sm transition-all"
                            placeholder="e.g. 5"
                            min="3" max="8"
                        />
                    </div>
                </div>

                {/* Friend & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Users size={16} className="text-brand-500" />
                            Friend or Sibling (Optional)
                        </label>
                        <input
                            type="text"
                            value={data.friendName || ''}
                            onChange={(e) => onChange({ friendName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white/50 backdrop-blur-sm transition-all"
                            placeholder="e.g. Mia"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin size={16} className="text-brand-500" />
                            Location (Optional)
                        </label>
                        <input
                            type="text"
                            value={data.location || ''}
                            onChange={(e) => onChange({ location: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white/50 backdrop-blur-sm transition-all"
                            placeholder="e.g. the park, London"
                        />
                    </div>
                </div>

                {/* Interests */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Heart size={16} className="text-brand-500" />
                            Interests (Select up to 3)
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                            {(data.interests || []).length}/3 selected
                        </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {INTERESTS.map((interest) => {
                            const isSelected = (data.interests || []).includes(interest.id);
                            const isDisabled = !isSelected && (data.interests || []).length >= 3;

                            return (
                                <motion.button
                                    key={interest.id}
                                    whileTap={isDisabled ? {} : { scale: 0.95 }}
                                    onClick={() => toggleInterest(interest.id)}
                                    disabled={isDisabled}
                                    className={`relative p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 overflow-hidden ${isSelected
                                        ? 'bg-brand-50 border-2 border-brand-500 shadow-sm'
                                        : isDisabled
                                            ? 'bg-slate-50 border-2 border-transparent opacity-50 cursor-not-allowed'
                                            : 'bg-white border-2 border-slate-100 hover:border-brand-200 hover:shadow-sm hover:-translate-y-0.5'
                                        }`}
                                >
                                    <interest.Icon size={24} className={isSelected ? 'text-brand-600' : 'text-slate-500'} strokeWidth={1.5} />
                                    <span className={`text-xs font-medium ${isSelected ? 'text-brand-700' : 'text-slate-600'}`}>
                                        {interest.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={handleNext}
                        className="group relative flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative z-10 flex items-center gap-2">
                            Next Step
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
