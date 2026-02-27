import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import BookForm from './components/BookForm';
import LevelSelector from './components/LevelSelector';
import StoryPicker from './components/StoryPicker';
import BookPreview from './components/BookPreview';
import PricingCards from './components/PricingCards';
import DownloadPage from './components/DownloadPage';
import FreeBookForm from './components/FreeBookForm';
import ThankYouPage from './components/ThankYouPage';

function Flow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    childName: '',
    age: '',
    friendName: '',
    location: '',
    interests: [],
    level: null,
    template: null,
  });

  const updateData = (newData) => setData(prev => ({ ...prev, ...newData }));
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-amber-50/30 relative overflow-hidden font-sans">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-200/30 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <BookOpen size={20} aria-label="MyPhonicsBooks Logo" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-800">
            MyPhonicsBooks
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20 px-4 min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && <BookForm key="step1" data={data} onChange={updateData} onNext={nextStep} />}
          {step === 2 && <LevelSelector key="step2" data={data} onChange={updateData} onNext={nextStep} onBack={prevStep} />}
          {step === 3 && <StoryPicker key="step3" data={data} onChange={updateData} onNext={nextStep} onBack={prevStep} />}
          {step === 4 && <BookPreview key="step4" data={data} onNext={nextStep} onBack={prevStep} />}
          {step === 5 && <PricingCards key="step5" data={data} onBack={prevStep} />}
        </AnimatePresence>

        {/* Step Indicator */}
        <div className="mt-12 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-pink-500' : step > i ? 'w-2 bg-pink-300' : 'w-2 bg-slate-200'}`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<Flow />} />
        <Route path="/free-book" element={<FreeBookForm />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/download" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  );
}
