import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, BookOpen, TrendingUp, Target, Award, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      console.log('Checking environment variables...');
      
      // Check if environment variables are set
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
      console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Environment variables not configured. Please check your .env file.');
        setIsChecking(false);
        return;
      }

      // Check for placeholder values
      if (supabaseKey.includes('your-new-anon-key-here') || 
          supabaseKey.includes('your-anon-key') ||
          supabaseUrl.includes('your-project-ref') ||
          supabaseUrl.includes('your_supabase_project_url') ||
          supabaseKey.includes('your_supabase_anon_key')) {
        setError('Please update your .env file with your actual Supabase credentials from the dashboard.');
        setIsChecking(false);
        return;
      }

      console.log('Testing database connection...');
      
      // Test database connection with shorter, more reasonable timeouts
      let dbError = null;
      let connectionSuccessful = false;
      
      // Reduced timeout attempts - more reasonable for web applications
      const attempts = [
        { timeout: 5000, label: 'Quick check' },
        { timeout: 10000, label: 'Extended check' }
      ];

      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        setCurrentAttempt(`${attempt.label} (${attempt.timeout / 1000}s timeout)...`);
        
        try {
          console.log(`${attempt.label} (${attempt.timeout / 1000}s timeout)...`);
          
          // Create a more robust connection test
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), attempt.timeout);
          
          try {
            const { data, error } = await supabase
              .from('subjects')
              .select('count')
              .limit(1)
              .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (error) {
              dbError = error;
              console.error(`${attempt.label} failed:`, error);
              
              // If this is the last attempt, break and handle the error
              if (i === attempts.length - 1) {
                break;
              }
              continue; // Try next attempt
            }

            console.log(`${attempt.label} successful`);
            connectionSuccessful = true;
            break; // Success, exit loop
            
          } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
              throw new Error(`Connection timeout after ${attempt.timeout / 1000} seconds`);
            }
            throw fetchError;
          }
          
        } catch (timeoutError) {
          console.error(`${attempt.label} timed out:`, timeoutError);
          dbError = timeoutError;
          
          // If this is not the last attempt, continue to next attempt
          if (i < attempts.length - 1) {
            console.log(`Trying next attempt with longer timeout...`);
            continue;
          }
          
          // This was the last attempt, so we'll handle the error below
          break;
        }
      }

      setCurrentAttempt('');

      if (!connectionSuccessful && dbError) {
        console.error('All database connection attempts failed:', dbError);
        
        // Provide specific error messages based on the type of error
        if (dbError.message?.includes('Legacy API keys are disabled') || 
            dbError.message?.includes('Invalid API key')) {
          setError('Your Supabase API key is invalid or disabled. Please go to your Supabase Dashboard → Settings → API and copy the current "anon public" key to your .env file.');
        } else if (dbError.message?.includes('relation') && dbError.message?.includes('does not exist')) {
          setError('Database tables not found. Please run all migration files in your Supabase dashboard SQL Editor in the correct order.');
        } else if (dbError.message?.includes('timeout') || dbError.message?.includes('Connection timeout')) {
          setError('Database connection timed out. This usually means your Supabase project is paused, inactive, or there are network connectivity issues. Please check your Supabase project status and internet connection.');
        } else if (dbError.message?.includes('Failed to fetch') || dbError.message?.includes('NetworkError')) {
          setError('Network error connecting to Supabase. Please check your internet connection and ensure your Supabase project URL is correct.');
        } else if (dbError.message?.includes('AbortError') || dbError.name === 'AbortError') {
          setError('Connection was aborted due to timeout. Please check your Supabase project status and network connection.');
        } else {
          setError(`Database connection failed: ${dbError.message || 'Unknown error'}`);
        }
        setIsChecking(false);
        return;
      }

      console.log('Database connection successful');
      
      // Quick auth check with shorter timeout - don't let this block the flow
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 seconds
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        clearTimeout(timeoutId);
        
        if (authError && authError.message !== 'Auth session missing!') {
          console.error('Auth check failed:', authError);
        }
        
        if (user) {
          console.log('User found, redirecting to dashboard');
          navigate("/dashboard");
        } else {
          console.log('No user found, redirecting to login');
          navigate("/login");
        }
      } catch (authError) {
        console.log('Auth check failed or timed out, proceeding to login page');
        // Don't treat auth issues as fatal - just proceed to login
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during setup check:", error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Connection timeout')) {
          setError('Database connection timed out. This usually indicates that your Supabase project is paused, inactive, or there are network connectivity issues. Please check your Supabase project status in the dashboard and ensure your internet connection is stable.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('Unable to connect to Supabase. Please check your internet connection and verify that your VITE_SUPABASE_URL in the .env file is correct.');
        } else if (error.message.includes('AbortError') || error.name === 'AbortError') {
          setError('Connection was aborted due to timeout. Please check your Supabase project status and network connection.');
        } else {
          setError(`Setup check failed: ${error.message}`);
        }
      } else {
        setError('An unexpected error occurred during setup. Please check your Supabase configuration and try again.');
      }
    } finally {
      setIsChecking(false);
      setCurrentAttempt('');
    }
  };

  const handleDirectAccess = async () => {
    setLoading(true);
    try {
      // Try to sign in with demo account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "demo@example.com",
        password: "password123",
      });

      if (error) {
        // If login fails, create the account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: "demo@example.com",
          password: "password123",
          options: {
            data: {
              name: "Demo User",
            },
          },
        });

        if (signUpError) {
          toast.error("Could not create demo account. Please check Supabase connection.");
        } else {
          // Try login again after signup
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: "demo@example.com",
            password: "password123",
          });

          if (retryError) {
            toast.error("Demo login failed after account creation.");
          } else {
            toast.success("Demo account created and logged in!");
            window.location.href = "/dashboard";
          }
        }
      } else {
        // Login successful
        toast.success("Login successful!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error("Login attempt failed");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-lg mx-auto">
          <div className="text-red-600 text-6xl">🔑</div>
          <h1 className="text-2xl font-bold text-red-900">Setup Issue</h1>
          <p className="text-red-700">{error}</p>
          
          <div className="bg-white p-4 rounded-lg border border-red-200 text-left">
            <h3 className="font-semibold text-red-900 mb-2">Common Solutions:</h3>
            <ol className="text-sm text-red-700 space-y-2 list-decimal list-inside">
              <li><strong>Check Supabase Project Status:</strong> Go to your Supabase Dashboard and ensure your project is active (not paused)</li>
              <li><strong>Verify Environment Variables:</strong> Check your .env file contains correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
              <li><strong>Update API Key:</strong> Go to Settings → API in your Supabase Dashboard and copy the current "anon public" key</li>
              <li><strong>Run Database Migrations:</strong> Execute all SQL migration files in your Supabase SQL Editor</li>
              <li><strong>Check Internet Connection:</strong> Ensure you have a stable internet connection</li>
              <li><strong>Restart Development Server:</strong> Stop and restart your dev server after making changes</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry After Fixing
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
              Skip Setup Check
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
            <strong>Need Help?</strong> Check the browser console (F12) for detailed error messages, 
            or refer to SETUP_INSTRUCTIONS.md for complete setup guidance.
          </div>
        </div>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Checking setup...</p>
          {currentAttempt && (
            <p className="text-sm text-blue-600 font-medium">{currentAttempt}</p>
          )}
          <p className="text-sm text-gray-500">Testing database connection (this may take up to 15 seconds)</p>
          <div className="text-xs text-gray-400 max-w-md mx-auto">
            If this takes too long, your Supabase project might be paused or there could be network issues
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-xl p-2">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SmartStudent</h1>
          </div>
          <div className="flex space-x-2">
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Track Your Academic Performance with Smart Insights
            </h1>
            <p className="text-xl text-gray-600">
              Monitor your grades, analyze performance trends, and get personalized suggestions to improve your academic results.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Create Account
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleDirectAccess}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accessing...
                  </>
                ) : (
                  <>
                    Quick Dashboard Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Performance Overview</h2>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Demo</Badge>
              </div>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-16 w-16 text-blue-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Average Score</div>
                      <div className="text-xl font-bold">87%</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center space-x-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Subjects</div>
                      <div className="text-xl font-bold">5</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-6 space-y-4">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Performance Analytics</h3>
              <p className="text-gray-600">Visualize your academic performance with interactive charts and detailed analytics.</p>
            </div>
            <div className="bg-green-50 rounded-xl p-6 space-y-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">Goal Setting</h3>
              <p className="text-gray-600">Set academic goals and track your progress with personalized dashboards.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 space-y-4">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold">Smart Suggestions</h3>
              <p className="text-gray-600">Get AI-powered suggestions to improve your performance in specific subjects.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Configuration Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                  View Setup Instructions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}