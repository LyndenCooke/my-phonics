import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Map, Search, UserPlus, Calendar, HeartHandshake, Compass, PawPrint, Trophy, CloudSun, Users } from 'lucide-react';

const TEMPLATES = [
    { id: '1', name: 'The Adventure', Icon: Map, desc: 'Courage and curiosity in a new place' },
    { id: '2', name: 'The Lost Thing', Icon: Search, desc: 'Finding and returning something special' },
    { id: '3', name: 'The New Friend', Icon: UserPlus, desc: 'Acceptance and making a new friend' },
    { id: '4', name: 'The Big Day', Icon: Calendar, desc: 'Excitement about a special event' },
    { id: '5', name: 'The Helper', Icon: HeartHandshake, desc: 'Solving a problem for someone' },
    { id: '6', name: 'The Discovery', Icon: Compass, desc: 'Finding a secret or hidden place' },
    { id: '7', name: 'The Pet Story', Icon: PawPrint, desc: 'Care and animal companionship' },
    { id: '8', name: 'The Sport/Game', Icon: Trophy, desc: 'Perseverance and teamwork' },
    { id: '9', name: 'The Weather Day', Icon: CloudSun, desc: 'Adaptability and fun outside' },
    { id: '10', name: 'The Family Day', Icon: Users, desc: 'Belonging and togetherness' },
];

export default function StoryPicker({ data, onChange, onNext, onBack }) {
    const isSurprise = data.template === 'surprise';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-8 rounded-3xl max-w-4xl w-full mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                    Choose a Story Topic
                </h2>
                <p className="text-slate-600">
                    Pick a template or let us choose the best fit for {data.childName || 'your child'}'s interests.
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onChange({ template: 'surprise' })}
                className={`w-full mb-8 p-6 rounded-2xl border-2 transition-all flex items-center justify-center gap-4 ${isSurprise
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-brand-400 shadow-md'
                    : 'bg-white border-slate-200 hover:border-brand-300'
                    }`}
            >
                <div className={`p-4 rounded-full ${isSurprise ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Sparkles size={32} />
                </div>
                <div className="text-left">
                    <h3 className={`text-2xl font-bold ${isSurprise ? 'text-brand-900' : 'text-slate-700'}`}>Surprise Me!</h3>
                    <p className={isSurprise ? 'text-brand-700' : 'text-slate-500'}>
                        We'll select the perfect story based on the interests you chose.
                    </p>
                </div>
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {TEMPLATES.map((template) => {
                    const isSelected = data.template === template.id;
                    return (
                        <button
                            key={template.id}
                            onClick={() => onChange({ template: template.id })}
                            className={`p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all duration-300 ${isSelected
                                ? 'border-brand-500 bg-brand-50 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-brand-200 hover:shadow-sm hover:-translate-y-0.5'
                                }`}
                        >
                            <div className={`p-2 rounded-lg shadow-sm border ${isSelected ? 'border-brand-200 bg-white text-brand-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                                <template.Icon size={24} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{template.name}</h4>
                                <p className="text-sm text-slate-500">{template.desc}</p>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
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
                    disabled={!data.template}
                    className={`group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium overflow-hidden transition-all ${data.template
                        ? 'bg-slate-900 text-white shadow-lg hover:shadow-xl cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    {data.template && (
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        Preview Details
                        <ArrowRight size={18} className={data.template ? "group-hover:translate-x-1 transition-transform" : ""} />
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
}
