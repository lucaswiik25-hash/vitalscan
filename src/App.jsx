import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppShell from './components/layout/AppShell';
import Home from './pages/Frame32';
import Onboarding from './pages/Onboarding';
import ScannerHub from './pages/ScannerHub';
import FoodScanner from './pages/FoodScanner';
import SkincareScanner from './pages/SkincareScanner';
import SupplementScanner from './pages/SupplementScanner';
import SupplementTracker from './pages/SupplementTracker';
import MealPlanner from './pages/MealPlanner';
import ShoppingList from './pages/ShoppingList';
import HealthRisk from './pages/HealthRisk';
import Settings from './pages/Settings';
import FaceScanner from './pages/FaceScanner';
import BodyScanner from './pages/BodyScanner';
import ExerciseFormScanner from './pages/ExerciseFormScanner';
import Tips from './pages/Tips.jsx';
import Frame3 from './pages/Frame3';
import Frame32 from './pages/Frame32';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/scanner" element={<ScannerHub />} />
        <Route path="/supplements" element={<SupplementTracker />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/shopping" element={<ShoppingList />} />
        <Route path="/health-risk" element={<HealthRisk />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tips" element={<Tips />} />
      </Route>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/food-scanner" element={<FoodScanner />} />
      <Route path="/skincare-scanner" element={<SkincareScanner />} />
      <Route path="/supplement-scanner" element={<SupplementScanner />} />
      <Route path="/face-scanner" element={<FaceScanner />} />
      <Route path="/body-scanner" element={<BodyScanner />} />
      <Route path="/exercise-form-scanner" element={<ExerciseFormScanner />} />
      <Route path="*" element={<PageNotFound />} />
      <Route path="/Frame3" element={<Frame3 />} />
      <Route path="/Frame32" element={<Frame32 />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;