import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ForceLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleForceLogin = async () => {
    setIsLoading(true);
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
          setIsLoading(false);
        } else {
          // Try login again after signup
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: "demo@example.com",
            password: "password123",
          });

          if (retryError) {
            toast.error("Demo login failed after account creation.");
            setIsLoading(false);
          } else {
            toast.success("Demo account created and logged in!");
            console.log("Force login successful, forcing hard redirect");
            
            // Force a hard redirect to dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
          }
        }
      } else {
        // Login successful
        toast.success("Demo login successful!");
        console.log("Force login successful, forcing hard redirect");
        
        // Force a hard redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (err) {
      console.error("Force login error:", err);
      toast.error("Login attempt failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleForceLogin}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Fixing...
          </>
        ) : (
          "Fix Login"
        )}
      </Button>
    </div>
  );
} 