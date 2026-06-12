import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { getSupabaseConfigError, isSupabaseConfigured } from '@/lib/supabase';
import ConfigError from '@/components/ConfigError';
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

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RedirectIfAuth() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<Auth />} />
      </Route>

      <Route element={<RequireAuth />}>
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
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/food-scanner" element={<FoodScanner />} />
        <Route path="/skincare-scanner" element={<SkincareScanner />} />
        <Route path="/supplement-scanner" element={<SupplementScanner />} />
        <Route path="/face-scanner" element={<FaceScanner />} />
        <Route path="/body-scanner" element={<BodyScanner />} />
        <Route path="/exercise-form-scanner" element={<ExerciseFormScanner />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  if (!isSupabaseConfigured) {
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
