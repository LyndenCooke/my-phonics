import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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

// Lazy-loaded funnel pages
const LinkTree = lazy(() => import("./pages/funnels/LinkTree"));
const WrongBooks = lazy(() => import("./pages/funnels/WrongBooks"));
const FreeAssessment = lazy(() => import("./pages/funnels/FreeAssessment"));
const ThreeMinuteCheck = lazy(() => import("./pages/funnels/ThreeMinuteCheck"));
const TheGap = lazy(() => import("./pages/funnels/TheGap"));

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
 * Web: always shows the marketing LandingPage, regardless of auth state.
 *      The user must click "Learning Hub" (or similar) to enter /library.
 *      This preserves the landing page for ad traffic / SEO — it does NOT
 *      auto-route signed-in users into the app.
 *
 * Native app (Capacitor): skips the landing page and goes straight to /library.
 *      The landing page is a marketing funnel for web visitors only.
 */
function ConditionalHome() {
  const isNative =
    typeof window !== "undefined" &&
    Boolean((window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  if (isNative) return <Navigate to="/library" replace />;
  return <LandingPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<ConditionalHome />} />
            <Route path="/library" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/assess" element={<Assessment />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
