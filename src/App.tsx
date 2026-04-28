import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { captureRefFromUrl } from "@/lib/referral";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
// Landing is the entry route for ad/SEO traffic — keep it eager so the
// first paint doesn't wait on a chunk.
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

// Everything else is lazy-loaded so the landing page ships the smallest
// possible JS payload.
const Index = lazy(() => import("./pages/Index"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Welcome = lazy(() => import("./pages/Welcome"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Shop = lazy(() => import("./pages/Shop"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));
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

const ChildModeGuard = lazy(() => import("./components/ChildModeGuard"));

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

/**
 * Root route handler.
 *
 * Web (browser tab):       marketing LandingPage. The funnel target.
 * Native (Capacitor app):  /library — landing is a marketing surface, the
 *                          installed app should open straight into the
 *                          product.
 * Installed PWA (iOS/Android Add-to-Home-Screen): /library, same reasoning
 *                          as native. Detected via display-mode media
 *                          query OR navigator.standalone (iOS Safari
 *                          legacy).
 *
 * Anyone with the marketing link in a browser still sees the landing page.
 * Once they install the app to their home screen, every subsequent open
 * skips it.
 */
function ConditionalHome() {
  if (typeof window === "undefined") return <LandingPage />;

  const isNative = Boolean(
    (window as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.()
  );

  // PWA standalone — installed to home screen. Two checks: standard CSS
  // media query (Chrome / Android / desktop PWAs) + navigator.standalone
  // (iOS Safari, predates the spec).
  const isStandalonePwa =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as { standalone?: boolean }).standalone);

  if (isNative || isStandalonePwa) return <Navigate to="/library" replace />;
  return <LandingPage />;
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
  return (
    <AnimatedRoutes>
      <Routes location={location}>
            <Route path="/" element={<ConditionalHome />} />
            <Route path="/library" element={<Index />} />
            <Route path="/welcome" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><Welcome /></ChildModeGuard></Suspense>} />
            <Route path="/assess" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><Assessment /></ChildModeGuard></Suspense>} />
            <Route path="/shop" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><Shop /></ChildModeGuard></Suspense>} />
            <Route path="/payment-success" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><PaymentSuccess /></ChildModeGuard></Suspense>} />
            <Route path="/progress" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><Progress /></ChildModeGuard></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><Profile /></ChildModeGuard></Suspense>} />
            <Route path="/auth" element={<Suspense fallback={<AdminFallback />}><ChildModeGuard><Auth /></ChildModeGuard></Suspense>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/prototype" element={<Suspense fallback={<AdminFallback />}><Prototype /></Suspense>} />
            {/* Funnels (ad landing pages) */}
            <Route path="/links" element={<Suspense fallback={<AdminFallback />}><LinkTree /></Suspense>} />
            <Route path="/f/wrong-books" element={<Suspense fallback={<AdminFallback />}><WrongBooks /></Suspense>} />
            <Route path="/f/free-assessment" element={<Suspense fallback={<AdminFallback />}><FreeAssessment /></Suspense>} />
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
