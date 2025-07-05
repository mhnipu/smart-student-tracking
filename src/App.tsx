import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth, isSupabaseConfigured } from '@/components/providers/auth-provider'
import { Toaster } from 'sonner'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import { AlertCircle, DatabaseIcon, ExternalLink } from 'lucide-react'
import { DirectLogin } from '@/components/dashboard/direct-login'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GlobalFloatingTimer } from '@/components/dashboard/global-floating-timer'
import { ThemeProvider } from '@/components/providers/theme-provider'

// Supabase Configuration Error Component
const SupabaseConfigError = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-red-100 overflow-hidden">
        <div className="bg-red-500 p-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            Supabase Configuration Error
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-gray-800 space-y-4">
            <p className="font-medium">
              The application cannot connect to Supabase because the environment variables are missing or invalid.
            </p>
            
            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <h3 className="font-semibold mb-2 flex items-center text-red-800">
                <DatabaseIcon className="h-4 w-4 mr-2" />
                Required Setup:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-red-800">
                <li>Create a <strong>.env</strong> file in the project root</li>
                <li>Add the following variables:
                  <pre className="bg-white p-2 rounded mt-1 text-red-600 overflow-auto">
                    VITE_SUPABASE_URL=your_project_url_here<br/>
                    VITE_SUPABASE_ANON_KEY=your_anon_key_here
                  </pre>
                </li>
                <li>Get your Supabase URL and key from your Supabase project dashboard</li>
                <li>Restart the development server after saving the .env file</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-semibold mb-2 flex items-center text-blue-800">
                <ExternalLink className="h-4 w-4 mr-2" />
                Setup Instructions:
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Follow the complete setup guide in:
              </p>
              <div className="flex space-x-3">
                <a 
                  href="SUPABASE_SETUP.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md inline-flex items-center hover:bg-blue-700"
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  View Setup Guide
                </a>
                <a 
                  href="https://app.supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm bg-gray-600 text-white px-3 py-1.5 rounded-md inline-flex items-center hover:bg-gray-700"
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Go to Supabase
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Protected route component that handles authentication state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, configError } = useAuth();
  const location = useLocation();

  // Check for Supabase configuration error
  if (configError) {
    return <SupabaseConfigError />;
  }

  // Show minimal loading indicator while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public route that redirects to dashboard if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, configError } = useAuth();
  
  // Check for Supabase configuration error
  if (configError) {
    return <SupabaseConfigError />;
  }
  
  // Show minimal loading indicator while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  // First check if Supabase is configured
  const supabaseConfigured = isSupabaseConfigured();
  
  // Test Edge Function availability
  useEffect(() => {
    const checkEdgeFunction = async () => {
      try {
        await supabase.functions.invoke('generate-insights', {
          body: { test: true }
        });
        console.log('Edge Functions are available');
      } catch (error) {
        console.warn('Edge Functions might not be deployed:', error);
      }
    };
    
    if (supabaseConfigured) {
      checkEdgeFunction();
    }
  }, [supabaseConfigured]);
  
  if (!supabaseConfigured) {
    return (
      <>
        <SupabaseConfigError />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Global floating timer that persists across all routes */}
        <GlobalFloatingTimer />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/direct-login" element={<DirectLogin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App