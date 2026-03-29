import { useState, useCallback } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

// All sounds are MP3 files in /sounds/
// Split digraphs use underscore in filenames: a-e -> a_e
function getSoundUrl(grapheme: string): string {
  const key = grapheme.replace(/-/g, '_');
  return `/sounds/${key}.mp3`;
}

interface PhonemePlayerProps {
  grapheme: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PhonemePlayer({
  grapheme,
  className = '',
  size = 'md',
}: PhonemePlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const playPhoneme = useCallback(async () => {
    const normalizedGrapheme = grapheme.toLowerCase().trim();
    const audioUrl = getSoundUrl(normalizedGrapheme);

    setIsLoading(true);

    try {
      const audio = new Audio(audioUrl);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setIsPlaying(false);
          resolve();
        };
        audio.onerror = () => {
          reject(new Error(`Sound file not found: ${audioUrl}`));
        };
        audio.oncanplaythrough = () => {
          setIsPlaying(true);
          setIsLoading(false);
          audio.play().catch(reject);
        };
        audio.load();
      });
    } catch (err) {
      console.error('Failed to play phoneme:', err);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [grapheme]);

  return (
    <button
      onClick={playPhoneme}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        bg-gradient-to-br from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 shadow-lg shadow-pink-200
        active:scale-95
        transition-all duration-200
        disabled:opacity-70
        ${isPlaying ? 'ring-4 ring-pink-300 animate-pulse' : ''}
        ${className}
      `}
      title={`Play "${grapheme}" sound`}
      aria-label={`Play sound for grapheme ${grapheme}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
      ) : (
        <Volume2 className={`${iconSizes[size]} text-white`} />
      )}
    </button>
  );
}

export default PhonemePlayer;
