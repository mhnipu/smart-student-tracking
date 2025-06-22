import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, Target, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get the intended destination from location state
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please check your email and click the confirmation link before signing in.");
        } else if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please check your credentials and try again.");
        } else {
          toast.error("Authentication failed. Please try again.");
        }
      } else if (data.user) {
        // Manually navigate to dashboard on successful login
        toast.success("Welcome back!");
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const studentId = formData.get("studentId") as string;

    if (!email || !password || !name) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            student_id: studentId,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          toast.error("Sign up failed. Please try again.");
        }
      } else if (data.user) {
        if (data.user.email_confirmed_at) {
          // Email confirmation is disabled - user is immediately confirmed
          toast.success("Account created successfully!");
          navigate("/dashboard");
        } else {
          // Email confirmation is enabled - user needs to confirm email
          toast.success("Account created successfully! Please check your email and click the confirmation link to complete your registration.");
          // Reset the form
          (e.target as HTMLFormElement).reset();
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for demo login
  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "demo@example.com",
        password: "password123",
      });

      if (error) {
        // Create a demo account if login fails
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
          toast.error("Demo login failed. Please try again or use manual login.");
        } else {
          // If sign up succeeds, try logging in again
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: "demo@example.com",
            password: "password123",
          });

          if (retryError) {
            toast.error("Demo login failed. Please try again or use manual login.");
          } else {
            toast.success("Welcome to the demo account!");
            navigate("/dashboard");
          }
        }
      } else if (data.user) {
        toast.success("Welcome to the demo account!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Demo login error:", error);
      toast.error("Demo login failed. Please try again or use manual login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-xl p-3">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">SmartStudent</h1>
            </div>
            <p className="text-xl text-gray-600">
              Track your academic performance and get personalized insights to improve your grades.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="bg-emerald-100 rounded-lg p-3 w-fit">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Track Performance</h3>
              <p className="text-sm text-gray-600">Monitor your grades across all subjects with detailed analytics.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-purple-100 rounded-lg p-3 w-fit">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Set Goals</h3>
              <p className="text-sm text-gray-600">Create improvement plans and track your progress.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-100 rounded-lg p-3 w-fit">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Get Insights</h3>
              <p className="text-sm text-gray-600">Receive personalized suggestions to improve your performance.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-orange-100 rounded-lg p-3 w-fit">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Achieve More</h3>
              <p className="text-sm text-gray-600">Celebrate your achievements and stay motivated.</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <div className="bg-blue-600 rounded-xl p-3 w-fit mx-auto lg:hidden">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome to SmartStudent</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="bg-white"
                        defaultValue="demo@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        className="bg-white"
                        defaultValue="password123"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full"
                      onClick={handleDemoLogin}
                      disabled={isLoading}
                    >
                      Quick Demo Login
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name *</Label>
                      <Input
                        id="signup-name"
                        name="name"
                        placeholder="Enter your full name"
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email *</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password *</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password (min. 6 characters)"
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-studentId">Student ID (Optional)</Label>
                      <Input
                        id="signup-studentId"
                        name="studentId"
                        placeholder="Enter your student ID"
                        className="bg-white"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing up...
                        </>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}