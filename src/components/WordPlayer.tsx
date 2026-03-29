import { useState, useCallback } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

function getWordUrl(word: string): string {
  const key = word.toLowerCase().replace(/\s+/g, '_');
  return `/sounds/words/${key}.mp3`;
}

interface WordPlayerProps {
  word: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WordPlayer({ word, className = '', size = 'md' }: WordPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  const playWord = useCallback(async () => {
    const audioUrl = getWordUrl(word);
    setIsLoading(true);
    try {
      const audio = new Audio(audioUrl);
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => { setIsPlaying(false); resolve(); };
        audio.onerror = () => { reject(new Error(`Sound not found: ${audioUrl}`)); };
        audio.oncanplaythrough = () => { setIsPlaying(true); setIsLoading(false); audio.play().catch(reject); };
        audio.load();
      });
    } catch (err) {
      console.error('Failed to play word:', err);
      setIsPlaying(false);
    } finally { setIsLoading(false); }
  }, [word]);

  return (
    <button
      onClick={playWord}
      disabled={isLoading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all duration-200 disabled:opacity-70 ${isPlaying ? 'ring-4 ring-blue-300 animate-pulse' : ''} ${className}`}
      title={`Play "${word}"`}
      aria-label={`Play word ${word}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
      ) : (
        <Volume2 className={`${iconSizes[size]} text-white`} />
      )}
    </button>
  );
}

export default WordPlayer;
