import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import BookPreview from './components/BookPreview';
import PricingCards from './components/PricingCards';
import DownloadPage from './components/DownloadPage';
import FreeBookForm from './components/FreeBookForm';
import ThankYouPage from './components/ThankYouPage';
import ResourceDashboard from './pages/ResourceDashboard';
import AssessmentPage from './pages/AssessmentPage';
import AssessmentQuiz from './components/AssessmentQuiz';
import CreateBookFlow from './components/CreateBookFlow';

function CreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAssessment, setShowAssessment] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [bookData, setBookData] = useState(location.state || {});

  const handleFlowComplete = (data) => {
    setBookData(data);
    setShowPreview(true);
  };

  const handleAssessmentComplete = (level) => {
    setBookData(prev => ({ ...prev, level }));
    setShowAssessment(false);
  };

  const handlePreviewNext = () => {
    setShowPricing(true);
  };

  const handlePreviewBack = () => {
    setShowPreview(false);
  };

  const handlePricingBack = () => {
    setShowPricing(false);
  };

  return (
    <div className="min-h-screen bg-amber-50/30 relative overflow-hidden font-sans">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-pink-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-200/30 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <BookOpen size={20} aria-label="MyPhonicsBooks Logo" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-800">
              MyPhonicsBooks
            </span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20 px-4 min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {showAssessment ? (
            <AssessmentQuiz
              key="assessment"
              childName={bookData.childName || ''}
              onComplete={handleAssessmentComplete}
              onBack={() => setShowAssessment(false)}
            />
          ) : showPricing ? (
            <PricingCards
              key="pricing"
              data={bookData}
              onBack={handlePricingBack}
            />
          ) : showPreview ? (
            <BookPreview
              key="preview"
              data={bookData}
              onNext={handlePreviewNext}
              onBack={handlePreviewBack}
            />
          ) : (
            <CreateBookFlow
              key="create"
              initialData={bookData}
              onComplete={handleFlowComplete}
              onStartAssessment={() => setShowAssessment(true)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/free-book" element={<FreeBookForm />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/dashboard" element={<ResourceDashboard />} />
        <Route path="/assessment" element={<AssessmentPage />} />
      </Routes>
    </BrowserRouter>
  );
}
