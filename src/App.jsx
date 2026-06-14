import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { getSupabaseConfigError, isSupabaseConfigured } from '@/lib/supabase';
import { isDemoMode } from '@/lib/demoMode';
import ConfigError from '@/components/ConfigError';
import { RequireAuth, RedirectIfAuth, RequireOnboardingComplete } from '@/components/AuthRoutes';
import AppShell from './components/layout/AppShell';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import ScannerHub from './pages/ScannerHub';
import FoodScanner from './pages/FoodScanner';
import SkincareScanner from './pages/SkincareScanner';
import SupplementScanner from './pages/SupplementScanner';
import WaterTracker from './pages/WaterTracker';
import SupplementTracker from './pages/SupplementTracker';
import MealPlanner from './pages/MealPlanner';
import ShoppingList from './pages/ShoppingList';
import HealthRisk from './pages/HealthRisk';
import Settings from './pages/Settings';
import FaceScanner from './pages/FaceScanner';
import BodyScanner from './pages/BodyScanner';
import Exercise from './pages/Exercise';
import ExerciseFormScanner from './pages/ExerciseFormScanner';
import SleepTracker from './pages/SleepTracker';
import Tips from './pages/Tips.jsx';

function AppShellRoutes() {
  return (
    <Route element={<AppShell />}>
      <Route path="/" element={<Home />} />
      <Route path="/scanner" element={<ScannerHub />} />
      <Route path="/water" element={<WaterTracker />} />
      <Route path="/supplements" element={<SupplementTracker />} />
      <Route path="/meal-planner" element={<MealPlanner />} />
      <Route path="/shopping" element={<ShoppingList />} />
      <Route path="/health-risk" element={<HealthRisk />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/exercise" element={<Exercise />} />
      <Route path="/sleep" element={<SleepTracker />} />
      <Route path="/tips" element={<Tips />} />
    </Route>
  );
}

function ScannerRoutes() {
  return (
    <>
      <Route path="/food-scanner" element={<FoodScanner />} />
      <Route path="/skincare-scanner" element={<SkincareScanner />} />
      <Route path="/supplement-scanner" element={<SupplementScanner />} />
      <Route path="/face-scanner" element={<FaceScanner />} />
      <Route path="/body-scanner" element={<BodyScanner />} />
      <Route path="/exercise-form-scanner" element={<ExerciseFormScanner />} />
    </>
  );
}

function DemoRoutes() {
  return (
    <Routes>
      {AppShellRoutes()}
      {ScannerRoutes()}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function AuthRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<Auth />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<RequireOnboardingComplete />}>
          {AppShellRoutes()}
          {ScannerRoutes()}
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function AppRoutes() {
  return isDemoMode ? <DemoRoutes /> : <AuthRoutes />;
}

function App() {
  if (!isDemoMode && !isSupabaseConfigured) {
    return <ConfigError message={getSupabaseConfigError()} />;
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
