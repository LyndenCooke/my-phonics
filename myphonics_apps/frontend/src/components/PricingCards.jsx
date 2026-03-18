import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Layers, Library } from 'lucide-react';
import { createCheckoutSession } from '../utils/api';

const PLANS = [
    {
        id: 'single',
        type: 'Single Book',
        price: '£4.99',
        icon: <Zap size={24} />,
        color: 'from-blue-400 to-blue-600',
        features: ['1 Personalised PDF', 'Any reading level', 'Instant download']
    },
    {
        id: 'pack',
        type: 'Level Pack',
        price: '£29.99',
        popular: true,
        icon: <Layers size={24} />,
        color: 'from-pink-400 to-rose-500',
        features: ['10 Books at exactly your level', 'All 10 story templates', 'Parent Reading Guide PDF']
    },
    {
        id: 'programme',
        type: 'Full Programme',
        price: '£99.99',
        icon: <Library size={24} />,
        color: 'from-purple-400 to-purple-600',
        features: ['All 60 books (Levels 1-6)', 'Grows with your child', 'Parent Reading Guide PDF']
    }
]

export default function PricingCards({ data, onBack }) {
    const [loading, setLoading] = useState(null);

    const handleCheckout = async (planId) => {
        setLoading(planId);
        try {
            const { url } = await createCheckoutSession(planId, data);
            window.location.assign(url);
        } catch (e) {
            console.error(e);
            setLoading(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl w-full mx-auto"
        >
            <div className="text-center mb-12">
                <h2 className="text-4xl font-display font-bold text-slate-800 mb-4">
                    Choose Your Package
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Get {data.childName}'s personalised phonics book instantly as a print-ready PDF.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <motion.div
                        key={plan.id}
                        whileHover={{ y: -5 }}
                        className={`relative rounded-3xl p-8 bg-white border-2 ${plan.popular ? 'border-brand-500 shadow-xl shadow-brand-500/20' : 'border-slate-100 shadow-lg'} flex flex-col`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                MOST POPULAR
                            </div>
                        )}

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} text-white flex items-center justify-center mb-6`}>
                            {plan.icon}
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2">{plan.type}</h3>
                        <div className="text-4xl font-display font-bold text-slate-900 mb-6">{plan.price}</div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-600">
                                    <div className="mt-1 bg-green-100 text-green-600 rounded-full p-0.5">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCheckout(plan.id)}
                            disabled={loading !== null}
                            className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${plan.popular
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-brand-500/30'
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                }`}
                        >
                            {loading === plan.id ? 'Loading...' : 'Select Plan'}
                            <ArrowRight size={18} />
                        </motion.button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={onBack}
                    className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                    Cancel and go back
                </button>
            </div>
        </motion.div>
    );
}
