import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Sparkles, Printer, FileText } from 'lucide-react';

export default function DownloadPage() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Mock processing delay
        const timer = setTimeout(() => {
            setReady(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-400/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-400/20 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-10 rounded-3xl max-w-lg w-full text-center relative z-10"
            >
                <motion.div
                    animate={{ scale: ready ? 1 : [1, 1.1, 1] }}
                    transition={{ repeat: ready ? 0 : Infinity, duration: 2 }}
                    className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-brand-500/30"
                >
                    {ready ? <Download size={40} /> : <Sparkles size={40} />}
                </motion.div>

                <h1 className="text-3xl font-display font-bold text-slate-800 mb-4">
                    {ready ? 'Your Book is Ready!' : 'Generating Your Book...'}
                </h1>

                <p className="text-slate-600 mb-8 text-lg">
                    {ready
                        ? "Your personalised phonics book has been created. Download the PDF and follow the print instructions."
                        : "Our AI is crafting the story and illustrations specifically for your child. Just a moment..."}
                </p>

                {ready && (
                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all"
                        >
                            <FileText size={20} />
                            Download Book PDF
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-white text-slate-800 border-2 border-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:border-slate-300 hover:bg-slate-50 transition-all"
                        >
                            <Printer size={20} />
                            Read Print & Fold Guide
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
