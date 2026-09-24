import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const BOOKS = [
  { level: 1, sub: '1.1', title: 'Tap! Tap! Tap!', culture: 'UK' },
  { level: 1, sub: '1.2', title: 'The Mud on the Dog', culture: 'UK' },
  { level: 1, sub: '1.3', title: 'The Fish in the Tank', culture: 'UK' },
  { level: 1, sub: '1.4', title: 'The Red Socks', culture: 'UK' },
  { level: 1, sub: '1.5', title: 'Run, Pup, Run!', culture: 'UK' },
  { level: 1, sub: '1.6', title: 'Fox Fell Off!', culture: 'UK' },
  { level: 1, sub: '1.7', title: 'The Jam Jug', culture: 'Middle East' },
  { level: 1, sub: '1.8', title: 'The Yak and the Box', culture: 'Nepal' },
  { level: 1, sub: '1.9', title: 'Chop, Chop, Chop!', culture: 'Pakistan' },
  { level: 1, sub: '1.10', title: 'Buzz and Sing!', culture: 'Trinidad' },
  { level: 2, sub: '2.1', title: 'The Night Light', culture: 'Japan' },
  { level: 2, sub: '2.2', title: 'Hot Food, Cool Moon', culture: 'England' },
  { level: 2, sub: '2.3', title: 'Morning on the Farm', culture: 'Kenya' },
  { level: 2, sub: '2.4', title: 'The Fair in the Air', culture: 'UK' },
  { level: 2, sub: '2.5', title: 'Round and Round', culture: 'Iceland' },
  { level: 3, sub: '3.1', title: 'The Big Bike Race', culture: 'France' },
  { level: 3, sub: '3.2', title: 'Lost at the Night Market', culture: 'Thailand' },
  { level: 3, sub: '3.3', title: 'Reach for the Treat!', culture: 'Ghana' },
  { level: 3, sub: '3.4', title: 'Draw It Again', culture: 'South Korea' },
  { level: 3, sub: '3.5', title: 'The Boat with the Red Sail', culture: 'Trinidad' },
  { level: 4, sub: '4.1', title: 'The Purple Purse', culture: 'Turkey' },
  { level: 4, sub: '4.2', title: 'The Brown Owl', culture: 'UK Woodland' },
  { level: 4, sub: '4.3', title: 'The New Glue', culture: 'Mexico' },
  { level: 4, sub: '4.4', title: 'How Now?', culture: 'England' },
  { level: 5, sub: '5.1', title: 'Before the Shore', culture: 'London Jewish' },
  { level: 5, sub: '5.2', title: 'Near the Door', culture: 'Sweden' },
  { level: 5, sub: '5.3', title: 'Sure She Can!', culture: 'India' },
  { level: 5, sub: '5.4', title: 'A Place for Me', culture: 'Brazil' },
  { level: 6, sub: '6.1', title: 'The Marvellous Neighbourhood', culture: 'Egypt' },
  { level: 6, sub: '6.2', title: 'You Are Remarkable', culture: 'China' },
  { level: 6, sub: '6.3', title: 'It Looks Suspicious!', culture: 'Italy' },
  { level: 6, sub: '6.4', title: 'The Incredible Bush Walk', culture: 'Australia' },
];

/** Culture label → i18n key (misc:showcase.cultures.*). */
const CULTURE_KEYS: Record<string, string> = {
  'UK': 'uk', 'Middle East': 'middleEast', 'Nepal': 'nepal', 'Pakistan': 'pakistan',
  'Trinidad': 'trinidad', 'Japan': 'japan', 'England': 'england', 'Kenya': 'kenya',
  'Iceland': 'iceland', 'France': 'france', 'Thailand': 'thailand', 'Ghana': 'ghana',
  'South Korea': 'southKorea', 'Turkey': 'turkey', 'UK Woodland': 'ukWoodland',
  'Mexico': 'mexico', 'London Jewish': 'londonJewish', 'Sweden': 'sweden', 'India': 'india',
  'Brazil': 'brazil', 'Egypt': 'egypt', 'China': 'china', 'Italy': 'italy', 'Australia': 'australia',
};

const LEVEL_COLOURS: Record<number, string> = {
  1: '#E84B8A', 2: '#F59E0B', 3: '#22C55E',
  4: '#3B82F6', 5: '#8B5CF6', 6: '#14B8A6',
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Starting Stories', 2: 'Longer Sounds', 3: 'New Spellings',
  4: 'Building Fluency', 5: 'Reading Together', 6: 'Reading Champion',
};

export default function Showcase() {
  const { t, i18n } = useTranslation('misc');
  useEffect(() => { document.title = t('showcase.docTitle'); }, [t, i18n.language]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-violet-800 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 dir="ltr" className="text-4xl font-bold mb-3">MyPhonicsBooks</h1>
          <p className="text-xl text-indigo-200 mb-2">{t('showcase.subtitle')}</p>
          <p className="text-indigo-300">{t('showcase.tagline')}</p>
        </div>
      </header>

      {/* Brand summary */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4">{t('showcase.overview')}</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700">
            <div>
              <p className="mb-2"><strong>{t('showcase.labels.mission')}</strong> {t('showcase.values.mission')}</p>
              <p className="mb-2"><strong>{t('showcase.labels.tagline')}</strong> <em>{t('showcase.values.tagline')}</em></p>
              <p className="mb-2"><strong>{t('showcase.labels.voice')}</strong> {t('showcase.values.voice')}</p>
              <p className="mb-2"><strong>{t('showcase.labels.target')}</strong> {t('showcase.values.target')}</p>
            </div>
            <div>
              <p className="mb-2"><strong>{t('showcase.labels.artStyle')}</strong> {t('showcase.values.artStyle')}</p>
              <p className="mb-2"><strong>{t('showcase.labels.curriculum')}</strong> {t('showcase.values.curriculum')}</p>
              <p className="mb-2"><strong>{t('showcase.labels.fonts')}</strong> {t('showcase.values.fonts')}</p>
              <p className="mb-2"><strong>{t('showcase.labels.differentiator')}</strong> {t('showcase.values.differentiator')}</p>
            </div>
          </div>

          {/* Level colours */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-600 mb-2">{t('showcase.levelColours')}</p>
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5,6].map(l => (
                <div key={l} className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: LEVEL_COLOURS[l] }}>
                  <span dir="ltr" lang="en">L{l} — {LEVEL_NAMES[l]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Books grid by level */}
        <h2 className="text-2xl font-bold text-indigo-900 mb-6">{t('showcase.allBooks')}</h2>

        {[1,2,3,4,5,6].map(level => (
          <div key={level} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LEVEL_COLOURS[level] }} />
              <h3 className="text-lg font-bold text-slate-800">
                {t('showcase.level', { level })} — <span lang="en">{LEVEL_NAMES[level]}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {BOOKS.filter(b => b.level === level).map(book => {
                const key = book.sub.replace('.', '_');
                const coverUrl = `/illustrations/${key}/cover.png`;
                const pdfUrl = `/book-pdfs/${key}.pdf`;
                return (
                  <div key={book.sub} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[3/4] relative" style={{ backgroundColor: LEVEL_COLOURS[level] + '20' }}>
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute top-2 start-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-800 shadow-sm">
                        L{book.sub}
                      </span>
                    </div>
                    <div className="p-3">
                      <p dir="ltr" lang="en" className="text-xs font-bold text-slate-800 truncate text-start">{book.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {CULTURE_KEYS[book.culture]
                          ? t(`showcase.cultures.${CULTURE_KEYS[book.culture]}`, { defaultValue: book.culture })
                          : book.culture}
                      </p>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-center text-[10px] font-semibold py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: LEVEL_COLOURS[level] }}
                      >
                        {t('showcase.viewPdf')}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Interactive reader link */}
        <div className="bg-indigo-50 rounded-2xl p-8 text-center mt-10">
          <h3 className="text-xl font-bold text-indigo-900 mb-2">{t('showcase.readerTitle')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('showcase.readerBody')}</p>
          <a href="/library" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
            {t('showcase.openLibrary')}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>{t('showcase.footer')}</p>
      </footer>
    </div>
  );
}
