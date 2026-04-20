import { useState, useCallback, useRef } from 'react';
import { Volume2, Flag, Check, ChevronDown, ChevronUp, ArrowLeft, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ASSESSMENT_ITEMS } from '@/lib/assessmentData';

const LEVEL_COLOURS: Record<number, string> = {
  1: '#E84B8A',
  2: '#F59E0B',
  3: '#22C55E',
  4: '#3B82F6',
  5: '#8B5CF6',
  6: '#14B8A6',
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Starting Stories',
  2: 'Longer Sounds',
  3: 'New Spellings',
  4: 'Building Fluency',
  5: 'Reading Together',
  6: 'Reading Champion',
};

const CATEGORY_LABELS: Record<string, string> = {
  word_reading: 'Real Words',
  alien_words: 'Alien Words',
  tricky_words: 'Tricky Words',
  speedy_reading: 'Speedy Reading',
};

function getSoundKey(grapheme: string): string {
  if (grapheme === 'oo (moon)') return 'oo_moon';
  if (grapheme === 'oo (look)') return 'oo_look';
  if (grapheme === 'ow (blow)') return 'ow';
  if (grapheme === 'ow (cow)') return 'ow_cow';
  return grapheme.replace(/[()]/g, '').replace(/\s+/g, '_');
}

type TabType = 'words' | 'alien' | 'tricky' | 'speedy' | 'sounds' | 'flagged';

export default function AudioQA() {
  const navigate = useNavigate();
  const [flagged, setFlagged] = useState<Record<string, string>>({});
  const [played, setPlayed] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('words');
  const [expandedLevel, setExpandedLevel] = useState<number>(1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build data by level and category
  const categories: Record<TabType, string> = {
    words: 'word_reading',
    alien: 'alien_words',
    tricky: 'tricky_words',
    speedy: 'speedy_reading',
    sounds: 'sound_recognition',
    flagged: '',
  };

  const getItems = (level: number, tabType: TabType) => {
    if (tabType === 'flagged') return [];
    const cat = categories[tabType];
    return ASSESSMENT_ITEMS.filter(i => i.level === level && i.category === cat);
  };

  const getItemKey = (item: { level: number; category: string; item: string }) =>
    `${item.level}-${item.category}-${item.item}`;

  const getAudioUrl = (item: { category: string; item: string }) => {
    if (item.category === 'sound_recognition') {
      return `/sounds/${getSoundKey(item.item)}.mp3`;
    }
    return `/sounds/words/${item.item.toLowerCase().replace(/\s+/g, '_')}.mp3`;
  };

  const allItemsForTab = (tabType: TabType) => {
    if (tabType === 'flagged') {
      return ASSESSMENT_ITEMS.filter(i => flagged[getItemKey(i)]);
    }
    const cat = categories[tabType];
    return ASSESSMENT_ITEMS.filter(i => i.category === cat);
  };

  const playItem = useCallback((item: { level: number; category: string; item: string }, allItems?: typeof ASSESSMENT_ITEMS) => {
    const key = getItemKey(item);
    const url = getAudioUrl(item);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPlaying(key);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(null);
      setPlayed(prev => new Set(prev).add(key));

      // Auto-advance to next item
      if (autoAdvance && allItems) {
        const idx = allItems.findIndex(i => getItemKey(i) === key);
        if (idx >= 0 && idx < allItems.length - 1) {
          const next = allItems[idx + 1];
          // If next item is in a different level, expand that level
          if (next.level !== item.level) {
            setExpandedLevel(next.level);
          }
          setTimeout(() => playItem(next, allItems), 400);
        }
      }
    };

    audio.onerror = () => {
      setPlaying(null);
      console.error('Failed to load:', url);
    };

    audio.play().catch(() => setPlaying(null));
  }, [autoAdvance]);

  const toggleFlag = (item: { level: number; category: string; item: string }) => {
    const key = getItemKey(item);
    setFlagged(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = item.item;
      }
      return next;
    });
  };

  const skipToNext = (item: { level: number; category: string; item: string }, allItems: typeof ASSESSMENT_ITEMS) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(null);
    }
    const key = getItemKey(item);
    const idx = allItems.findIndex(i => getItemKey(i) === key);
    if (idx >= 0 && idx < allItems.length - 1) {
      const next = allItems[idx + 1];
      if (next.level !== item.level) {
        setExpandedLevel(next.level);
      }
      setTimeout(() => playItem(next, allItems), 100);
    }
  };

  const flaggedCount = Object.keys(flagged).length;
  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'sounds', label: 'Sounds' },
    { key: 'words', label: 'Words' },
    { key: 'alien', label: 'Alien' },
    { key: 'tricky', label: 'Tricky' },
    { key: 'speedy', label: 'Speedy' },
    { key: 'flagged', label: `Flagged`, count: flaggedCount },
  ];

  const renderItemRow = (item: typeof ASSESSMENT_ITEMS[0], allItems: typeof ASSESSMENT_ITEMS) => {
    const key = getItemKey(item);
    const isPlaying = playing === key;
    const isPlayed = played.has(key);
    const isFlagged = !!flagged[key];

    return (
      <div
        key={key}
        className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
          isPlaying ? 'bg-blue-100 ring-2 ring-blue-400' :
          isFlagged ? 'bg-red-50 ring-1 ring-red-300' :
          isPlayed ? 'bg-green-50' : 'bg-white'
        }`}
      >
        {/* Play button */}
        <button
          onClick={() => playItem(item, allItems)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isPlaying
              ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-200'
              : 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow shadow-blue-100'
          }`}
        >
          <Volume2 className="w-5 h-5 text-white" />
        </button>

        {/* Word text */}
        <span className={`flex-1 text-lg font-semibold font-mono ${isFlagged ? 'text-red-600' : 'text-gray-800'}`}>
          {item.item}
        </span>

        {/* Status icon */}
        {isPlayed && !isFlagged && (
          <Check className="w-5 h-5 text-green-500 shrink-0" />
        )}

        {/* Skip button */}
        {isPlaying && (
          <button
            onClick={() => skipToNext(item, allItems)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 shrink-0"
            title="Skip to next"
          >
            <SkipForward className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Flag button */}
        <button
          onClick={() => toggleFlag(item)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isFlagged
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
              : 'bg-gray-100 hover:bg-red-100 border border-gray-200'
          }`}
          title={isFlagged ? 'Unflag' : 'Flag as wrong'}
        >
          <Flag className={`w-4 h-4 ${isFlagged ? 'text-white fill-white' : 'text-gray-400'}`} />
        </button>
      </div>
    );
  };

  const currentItems = allItemsForTab(tab);
  const levels = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Audio QA Tester</h1>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={() => setAutoAdvance(!autoAdvance)}
                className="rounded border-gray-300"
              />
              Auto-play
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-2 flex gap-1 pb-2 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-blue-500 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  tab === t.key ? 'bg-blue-400 text-white' : 'bg-red-500 text-white'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {tab === 'flagged' ? (
          // Flagged items view
          flaggedCount === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No flagged items yet</p>
              <p className="text-sm mt-1">Tap the flag icon on any word that sounds wrong</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">{flaggedCount} item{flaggedCount !== 1 ? 's' : ''} flagged</p>
              {currentItems.map(item => renderItemRow(item, currentItems))}

              {/* Copy summary */}
              <button
                onClick={() => {
                  const summary = Object.entries(flagged).map(([key, word]) => {
                    const [level, category] = key.split('-');
                    return `L${level} ${category}: "${word}"`;
                  }).join('\n');
                  navigator.clipboard.writeText(summary);
                }}
                className="w-full mt-4 py-3 rounded-xl bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-all"
              >
                Copy Flagged List
              </button>
            </div>
          )
        ) : (
          // Level-grouped view
          levels.map(level => {
            const items = getItems(level, tab);
            if (items.length === 0) return null;
            const isExpanded = expandedLevel === level;
            const levelPlayed = items.filter(i => played.has(getItemKey(i))).length;
            const levelFlagged = items.filter(i => flagged[getItemKey(i)]).length;

            return (
              <div key={level} className="rounded-xl overflow-hidden border shadow-sm bg-white">
                {/* Level header */}
                <button
                  onClick={() => setExpandedLevel(isExpanded ? 0 : level)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: LEVEL_COLOURS[level] }}
                  >
                    {level}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800 text-sm">{LEVEL_NAMES[level]}</div>
                    <div className="text-xs text-gray-400">
                      {items.length} items
                      {levelPlayed > 0 && <span className="text-green-500 ml-2">{levelPlayed} played</span>}
                      {levelFlagged > 0 && <span className="text-red-500 ml-2">{levelFlagged} flagged</span>}
                    </div>
                  </div>

                  {/* Play all button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedLevel(level);
                      playItem(items[0], items);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 shrink-0"
                  >
                    Play All
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1.5 border-t">
                    <div className="pt-2" />
                    {items.map(item => renderItemRow(item, items))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Stats bar */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t p-3 -mx-4 mt-6 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            <span className="text-green-600 font-semibold">{played.size}</span> played
          </span>
          <span className="text-gray-500">
            <span className="text-red-600 font-semibold">{flaggedCount}</span> flagged
          </span>
        </div>
      </div>
    </div>
  );
}
