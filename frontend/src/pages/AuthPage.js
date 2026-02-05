// ============================================
// AuthPage.js - Login and Registration Page
// Handles user authentication with tabbed interface
// Users can sign in or create a new account here
// ============================================

// Import useState hook for managing form state
import { useState } from "react";

// Navigation hooks for redirecting after login
import { useNavigate, Navigate } from "react-router-dom";

// Import UI components from our component library
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons for form inputs and visual elements
import { Leaf, Mail, Lock, User, Loader2 } from "lucide-react";

// Toast notifications for feedback
import { toast } from "sonner";

// Custom auth hook for login/register functions
import { useAuth } from "@/App";

export default function AuthPage() {
  // Destructure auth functions and user state
  const { user, login, register } = useAuth();
  
  // Hook for programmatic navigation
  const navigate = useNavigate();
  
  // Loading state for submit buttons
  const [loading, setLoading] = useState(false);
  
  // Form state for login - stores email and password
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  
  // Form state for registration - includes name and confirm password
  const [registerForm, setRegisterForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });

  // If user is already logged in, redirect to dashboard
  // This prevents logged-in users from seeing the auth page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();  // Prevent page refresh
    
    // Basic validation - check if fields are filled
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      // Call login function from auth context
      await login(loginForm.email, loginForm.password);
      toast.success("Welcome back!");
      navigate("/dashboard");  // Redirect to dashboard
    } catch (error) {
      // Show error message from API or generic message
      toast.error(error.response?.data?.detail || "Invalid credentials");
    }
    setLoading(false);
  };

  // Handle registration form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate all required fields are filled
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    // Check if passwords match
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Enforce minimum password length
    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      // Call register function from auth context
      await register(registerForm.name, registerForm.email, registerForm.password);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  return (
    // Main container with gradient background
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-secondary/50 to-background">
      <div className="w-full max-w-md">
        {/* ============================================
            Logo Section - Brand identity at top
            ============================================ */}
        <div className="text-center mb-8">
          {/* Logo circle with leaf icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">EcoTrip</h1>
          <p className="text-muted-foreground mt-2">Plan sustainable journeys</p>
        </div>

        {/* ============================================
            Auth Card with Tabs
            ============================================ */}
        <Card className="border-border/50 shadow-soft">
          {/* Tabs component for switching between login/register */}
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4">
              {/* Tab buttons - grid layout for equal width */}
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* ============================================
                  Login Form Tab
                  ============================================ */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      {/* Icon inside input field */}
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"  /* Padding for icon */
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>
                  
                  {/* Password field */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>

                  {/* Submit button with loading state */}
                  <Button 
                    type="submit" 
                    className="w-full rounded-full py-6 mt-6" 
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? (
                      <>
                        {/* Spinning loader icon */}
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ============================================
                  Register Form Tab
                  ============================================ */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your name"
                        className="pl-10"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        data-testid="register-name-input"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        data-testid="register-email-input"
                      />
                    </div>
                  </div>
                  
                  {/* Password field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        data-testid="register-password-input"
                      />
                    </div>
                    {/* Password requirements message */}
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p className="font-medium">Password requirements:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Minimum 8 characters</li>
                        <li>At least 1 uppercase letter</li>
                        <li>At least 1 lowercase letter</li>
                        <li>At least 1 number</li>
                      </ul>
                    </div>
                  </div>

                  {/* Confirm password field */}
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        data-testid="register-confirm-input"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full rounded-full py-6 mt-6" 
                    disabled={loading}
                    data-testid="register-submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing up, you agree to travel more sustainably
        </p>
      </div>
    </div>
  );
}
