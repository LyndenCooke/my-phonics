import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { generateBookPreview } from '../utils/api';

export default function BookPreview({ data, onNext, onBack }) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateBookPreview(data);
            setPreview(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-3xl max-w-2xl w-full mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
                    Your Book is Ready to Generate
                </h2>
                <p className="text-slate-600">
                    Review the details before we create your personalised phonics adventure.
                </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
                <ul className="space-y-4">
                    <li className="flex justify-between items-center pb-4 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Child's Name</span>
                        <span className="font-bold text-slate-800">{data.childName}</span>
                    </li>
                    <li className="flex justify-between items-center pb-4 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Reading Level</span>
                        <span className="font-bold text-slate-800 bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm">Level {data.level}</span>
                    </li>
                    {data.interests?.length > 0 && (
                        <li className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-slate-500 font-medium">Interests</span>
                            <span className="font-medium text-slate-800 capitalize">{data.interests.join(', ')}</span>
                        </li>
                    )}
                    <li className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Story Theme</span>
                        <span className="font-medium text-slate-800">
                            {data.template === 'surprise' ? 'Surprise me!' : `Template #${data.template}`}
                        </span>
                    </li>
                </ul>
            </div>

            {preview ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-brand-50 border border-brand-200 rounded-2xl p-6 text-center mb-8"
                >
                    <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">"{preview.bookTitle}"</h3>
                    <p className="text-brand-600 font-medium mb-4">Preview generated successfully!</p>
                </motion.div>
            ) : (
                <div className="flex justify-center mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors w-full justify-center text-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {loading ? 'Generating Preview...' : 'Generate Preview'}
                    </motion.button>
                </div>
            )}

            <div className="flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Edit Details
                </button>

                {preview && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => onNext({ taskId: preview.taskId })}
                        className="group relative flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all w-full md:w-auto text-lg"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="relative z-10 flex items-center gap-2">
                            Continue to Checkout
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
