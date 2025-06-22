import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

export function DirectLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle direct login with hardcoded credentials
  const handleDirectLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create Supabase client with the correct URL and key
      const supabaseClient = createClient(
        'https://ptvsztehdxfiesebjk.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi'
      );
      
      // Try to sign in with demo account
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'password123',
      });

      if (error) {
        // If login fails, create the account
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
          email: 'demo@example.com',
          password: 'password123',
          options: {
            data: {
              name: 'Demo User',
            },
          },
        });

        if (signUpError) {
          toast.error("Could not create demo account. Please check Supabase connection.");
          setError("Failed to create demo account. Please try again.");
          setIsLoading(false);
        } else {
          // Try login again after signup
          const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
            email: 'demo@example.com',
            password: 'password123',
          });

          if (retryError) {
            toast.error("Demo login failed after account creation.");
            setError("Login failed after account creation. Please try again.");
            setIsLoading(false);
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
      console.error("Login error:", err);
      toast.error("Login attempt failed");
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Auto-attempt login on component mount
  useEffect(() => {
    handleDirectLogin();
  }, []);

  // Handle manual redirect
  const handleManualRedirect = () => {
    window.location.href = "/dashboard";
  };

  // Handle iframe load error
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    handleDirectLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border-0 p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Quick Login</h1>
        
        {error ? (
          <>
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={handleRetry}
              className="mb-4 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-600">
              {isLoading ? "Logging you in automatically..." : "Login successful! Redirecting..."}
            </p>
            
            <div className="flex justify-center mb-6">
              {isLoading && (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              )}
            </div>
          </>
        )}
        
        <p className="text-sm text-gray-500 mb-4">
          Using demo account: demo@example.com
        </p>
        
        <Button 
          onClick={handleManualRedirect}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Go to Dashboard Directly
        </Button>
        
        <p className="text-xs text-gray-400 mt-4">
          If automatic login doesn't work, use the button above to go directly to the dashboard.
        </p>
      </div>
    </div>
  );
} 