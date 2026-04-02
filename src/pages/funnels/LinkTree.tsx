import { Link } from 'react-router-dom';
import { BookOpen, AlertTriangle, Clock, HelpCircle, Zap } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';

const LINKS = [
  {
    to: '/f/wrong-books?ref=linktree',
    label: 'Are wrong books hurting their confidence?',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-500',
    shadow: 'shadow-red-500/20',
  },
  {
    to: '/f/free-assessment?ref=linktree',
    label: 'Free phonics assessment — find their level',
    icon: HelpCircle,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
  },
  {
    to: '/f/3-minute-check?ref=linktree',
    label: '3-minute level check + free resources',
    icon: Clock,
    gradient: 'from-pink-500 to-rose-500',
    shadow: 'shadow-pink-500/20',
  },
  {
    to: '/f/the-gap?ref=linktree',
    label: 'Books they love that they can actually read',
    icon: Zap,
    gradient: 'from-violet-500 to-purple-500',
    shadow: 'shadow-violet-500/20',
  },
];

export default function LinkTree() {
  useFunnelTracker(); // Capture UTM/ref params on landing
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] relative overflow-hidden flex flex-col items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-amber-200/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo + tagline */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[hsl(var(--primary))] to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <BookOpen size={28} />
          </div>
          <h1 className="font-bold text-2xl text-foreground mb-1">
            MyPhonicsBooks
          </h1>
          <p className="text-sm text-muted-foreground">
            Decodable books matched to their exact level
          </p>
        </div>

        {/* Link buttons */}
        <div className="space-y-3">
          {LINKS.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block w-full py-4 px-5 bg-gradient-to-r ${link.gradient} text-white font-semibold rounded-xl shadow-lg ${link.shadow} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: 'backwards' }}
            >
              <link.icon size={20} className="shrink-0" />
              <span className="text-sm sm:text-base">{link.label}</span>
            </Link>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8 animate-in fade-in duration-500 delay-500">
          Based on Letters and Sounds (UK phonics curriculum)
        </p>
      </div>
    </div>
  );
}
