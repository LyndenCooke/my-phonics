import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { captureRefFromUrl } from "@/lib/referral";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import NotFound from "./pages/NotFound";

// All traffic — web, PWA, native — lands directly in the library. The
// marketing landing page stays available at /landing for ad campaigns that
// want to send to it, but is no longer the default at /.
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Learn = lazy(() => import("./pages/Learn"));
const Index = lazy(() => import("./pages/Index"));
const Resources = lazy(() => import("./pages/Resources"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Welcome = lazy(() => import("./pages/Welcome"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Shop = lazy(() => import("./pages/Shop"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Referrals = lazy(() => import("./pages/Referrals"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const DownloadHistory = lazy(() => import("./pages/DownloadHistory"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Prototype = lazy(() => import("./pages/Prototype"));

// Lazy-loaded funnel pages
const LinkTree = lazy(() => import("./pages/funnels/LinkTree"));
const WrongBooks = lazy(() => import("./pages/funnels/WrongBooks"));
const FreeAssessment = lazy(() => import("./pages/funnels/FreeAssessment"));
const ThreeMinuteCheck = lazy(() => import("./pages/funnels/ThreeMinuteCheck"));
const TheGap = lazy(() => import("./pages/funnels/TheGap"));
const FreeBook = lazy(() => import("./pages/funnels/FreeBook"));
const AssessmentFunnel = lazy(() => import("./pages/funnels/AssessmentFunnel"));

// Lazy-loaded admin pages
const AdminGuard = lazy(() => import("./components/admin/AdminGuard"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const CustomerList = lazy(() => import("./pages/admin/CustomerList"));
const CustomerDetail = lazy(() => import("./pages/admin/CustomerDetail"));
const PipelineBoard = lazy(() => import("./pages/admin/PipelineBoard"));
const DealsList = lazy(() => import("./pages/admin/DealsList"));
const TasksList = lazy(() => import("./pages/admin/TasksList"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/AnalyticsDashboard"));

const queryClient = new QueryClient();

function AdminFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const App = () => {
  // Capture ?ref=CODE the first time a visitor lands. Stored in localStorage
  // for 60 days so the credit survives sign-up + Stripe redirect.
  useEffect(() => { captureRefFromUrl(); }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
          <RoutesWithTransition />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

/**
 * Routes wrapped in AnimatePresence so screens slide in/out (native) or
 * cross-fade (web) on every navigation. Has to live inside <BrowserRouter>
 * so useLocation() works.
 */
function RoutesWithTransition() {
  const location = useLocation();
  // Fire a GA4 page_view on every route change. No-op if gtag isn't loaded
  // (ad-blocker / no consent / dev without the tag).
  useGoogleAnalytics();
  // Same for Meta Pixel — SPA navigations need a manual PageView so Meta's
  // optimiser sees in-funnel dropoff, not just one event per session.
  useMetaPixel();
  return (
    <AnimatedRoutes>
      <Routes location={location}>
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="/landing" element={<Suspense fallback={<AdminFallback />}><LandingPage /></Suspense>} />
            <Route path="/learn" element={<Suspense fallback={<AdminFallback />}><Learn /></Suspense>} />
            <Route path="/library" element={<Index />} />
            <Route path="/resources" element={<Suspense fallback={<AdminFallback />}><Resources /></Suspense>} />
            <Route path="/welcome" element={<Suspense fallback={<AdminFallback />}><Welcome /></Suspense>} />
            <Route path="/assess" element={<Suspense fallback={<AdminFallback />}><Assessment /></Suspense>} />
            <Route path="/shop" element={<Suspense fallback={<AdminFallback />}><Shop /></Suspense>} />
            <Route path="/payment-success" element={<Suspense fallback={<AdminFallback />}><PaymentSuccess /></Suspense>} />
            <Route path="/progress" element={<Suspense fallback={<AdminFallback />}><Progress /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<AdminFallback />}><Profile /></Suspense>} />
            <Route path="/profile/messages" element={<Suspense fallback={<AdminFallback />}><Messages /></Suspense>} />
            <Route path="/profile/referrals" element={<Suspense fallback={<AdminFallback />}><Referrals /></Suspense>} />
            <Route path="/profile/parent-dashboard" element={<Suspense fallback={<AdminFallback />}><ParentDashboard /></Suspense>} />
            <Route path="/profile/account" element={<Suspense fallback={<AdminFallback />}><AccountSettings /></Suspense>} />
            <Route path="/profile/downloads" element={<Suspense fallback={<AdminFallback />}><DownloadHistory /></Suspense>} />
            <Route path="/profile/help" element={<Suspense fallback={<AdminFallback />}><HelpSupport /></Suspense>} />
            <Route path="/auth" element={<Suspense fallback={<AdminFallback />}><Auth /></Suspense>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/prototype" element={<Suspense fallback={<AdminFallback />}><Prototype /></Suspense>} />
            {/* Funnels — clean URLs */}
            <Route path="/free-book" element={<Suspense fallback={<AdminFallback />}><FreeBook /></Suspense>} />
            <Route path="/assessment" element={<Suspense fallback={<AdminFallback />}><AssessmentFunnel /></Suspense>} />
            {/* Legacy funnel URLs — keep alive for existing ads/links */}
            <Route path="/links" element={<Suspense fallback={<AdminFallback />}><LinkTree /></Suspense>} />
            <Route path="/f/wrong-books" element={<Suspense fallback={<AdminFallback />}><WrongBooks /></Suspense>} />
            <Route path="/f/free-assessment" element={<Navigate to="/assessment" replace />} />
            <Route path="/f/3-minute-check" element={<Suspense fallback={<AdminFallback />}><ThreeMinuteCheck /></Suspense>} />
            <Route path="/f/the-gap" element={<Suspense fallback={<AdminFallback />}><TheGap /></Suspense>} />
            {/* Admin CRM */}
            <Route element={<Suspense fallback={<AdminFallback />}><AdminGuard /></Suspense>}>
              <Route element={<Suspense fallback={<AdminFallback />}><AdminLayout /></Suspense>}>
                <Route path="/admin" element={<Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense>} />
                <Route path="/admin/customers" element={<Suspense fallback={<AdminFallback />}><CustomerList /></Suspense>} />
                <Route path="/admin/customers/:id" element={<Suspense fallback={<AdminFallback />}><CustomerDetail /></Suspense>} />
                <Route path="/admin/pipeline" element={<Suspense fallback={<AdminFallback />}><PipelineBoard /></Suspense>} />
                <Route path="/admin/deals" element={<Suspense fallback={<AdminFallback />}><DealsList /></Suspense>} />
                <Route path="/admin/tasks" element={<Suspense fallback={<AdminFallback />}><TasksList /></Suspense>} />
                <Route path="/admin/analytics" element={<Suspense fallback={<AdminFallback />}><AnalyticsDashboard /></Suspense>} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatedRoutes>
  );
}

export default App;
