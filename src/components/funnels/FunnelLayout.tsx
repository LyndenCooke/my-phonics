import { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

interface FunnelLayoutProps {
  children: ReactNode;
}

export default function FunnelLayout({ children }: FunnelLayoutProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-200/20 blur-[120px] pointer-events-none" />

      {/* Minimal header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[hsl(var(--primary))] to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            MyPhonicsBooks
          </span>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-20">
        {children}
      </main>
    </div>
  );
}
