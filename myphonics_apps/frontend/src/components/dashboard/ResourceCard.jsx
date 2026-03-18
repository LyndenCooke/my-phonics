import React from 'react';
import { BookOpen, Video, FileText, Lock } from 'lucide-react';

export default function ResourceCard({ type, title, subtitle, level, available }) {
    const getIcon = () => {
        switch (type) {
            case 'book': return <BookOpen size={24} strokeWidth={1.5} />;
            case 'video': return <Video size={24} strokeWidth={1.5} />;
            case 'wordmat': return <FileText size={24} strokeWidth={1.5} />;
            default: return <FileText size={24} strokeWidth={1.5} />;
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'book': return 'Phonics Book';
            case 'video': return 'Training Video';
            case 'wordmat': return 'Word Mat';
            default: return 'Resource';
        }
    };

    const getLevelColor = () => {
        switch (level) {
            case 1: return 'text-level-1 bg-level-1/10 border-level-1/20';
            case 2: return 'text-level-2 bg-level-2/10 border-level-2/20';
            case 3: return 'text-level-3 bg-level-3/10 border-level-3/20';
            case 4: return 'text-level-4 bg-level-4/10 border-level-4/20';
            case 5: return 'text-level-5 bg-level-5/10 border-level-5/20';
            case 6: return 'text-level-6 bg-level-6/10 border-level-6/20';
            default: return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    const levelColorClass = getLevelColor();

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-500
        ${available
                    ? 'bg-white/70 backdrop-blur-md border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer'
                    : 'bg-slate-50/40 border-slate-200/50 grayscale-[0.8] opacity-70 cursor-not-allowed'
                }`}
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${available ? levelColorClass : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                        {getIcon()}
                    </div>
                    {available ? (
                        <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400 font-semibold bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                            Available
                        </span>
                    ) : (
                        <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400 font-semibold bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                            <Lock size={10} /> Missing
                        </span>
                    )}
                </div>

                <div>
                    <p className="font-mono text-xs text-slate-500 mb-2 uppercase tracking-wider">{getTypeLabel()} // L{level}</p>
                    <h3 className={`font-display text-lg font-bold leading-tight mb-2 ${available ? 'text-slate-900' : 'text-slate-600'}`}>
                        {title}
                    </h3>
                    <p className="text-sm font-sans text-slate-500 line-clamp-2">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Decorative corner brackets */}
            {available && (
                <>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
            )}

            {available && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}
        </div>
    );
}
