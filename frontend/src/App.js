// ============================================
// App.js - Main Application Entry Point
// This is the root component of our EcoTrip app
// It sets up routing, authentication, and navigation
// ============================================

// Import React hooks for state management and side effects
import { useState, useEffect, createContext, useContext } from "react";

// Import our custom CSS styles
import "@/App.css";

// React Router imports for handling navigation between pages
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";

// Axios is used to make HTTP requests to our backend API
import axios from "axios";

// Sonner is a toast notification library for showing alerts
import { Toaster, toast } from "sonner";

// Lucide React provides beautiful icons we use throughout the app
import { Leaf, Menu, X, User, LogOut, LayoutDashboard, Map, PlusCircle, BarChart3 } from "lucide-react";

// Import our custom UI components (built with shadcn/ui)
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Import all our page components
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import TripPlanner from "@/pages/TripPlanner";
import TripView from "@/pages/TripView";
import Analytics from "@/pages/Analytics";

// Backend URL from environment variables - this connects us to our API
// Vite uses import.meta.env instead of process.env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const API = `${BACKEND_URL}/api`;

// ============================================
// Authentication Context
// This allows us to share auth state across all components
// without having to pass props down through every level
// ============================================
const AuthContext = createContext(null);

// Custom hook to easily access auth state from any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Throw error if used outside of AuthProvider
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// ============================================
// Auth Provider Component
// Wraps our app and provides authentication functionality
// ============================================
const AuthProvider = ({ children }) => {
  // State to store the currently logged in user
  const [user, setUser] = useState(null);
  
  // Get token from localStorage (persists across page refreshes)
  const [token, setToken] = useState(localStorage.getItem("ecotrip_token"));
  
  // Loading state while we verify the token
  const [loading, setLoading] = useState(true);

  // useEffect runs when component mounts or token changes
  // This verifies if the stored token is still valid
  useEffect(() => {
    const verifyToken = async () => {
      // If no token exists, skip verification
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Call the /auth/me endpoint to get user data
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        // If token is invalid, clear it from storage
        localStorage.removeItem("ecotrip_token");
        setToken(null);
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  // Login function - called when user submits login form
  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    // Save token to localStorage for persistence
    localStorage.setItem("ecotrip_token", access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  // Register function - called when user creates new account
  const register = async (name, email, password) => {
    const response = await axios.post(`${API}/auth/register`, { name, email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem("ecotrip_token", access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  // Logout function - clears all auth state
  const logout = () => {
    localStorage.removeItem("ecotrip_token");
    setToken(null);
    setUser(null);
  };

  // Provide auth state and functions to all child components
  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// Protected Route Component
// Wraps routes that require authentication
// Redirects to login page if user is not logged in
// ============================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // User is authenticated, render the protected content
  return children;
};

// ============================================
// Navigation Component
// The header/navbar shown on all pages
// Includes logo, nav links, and user menu
// ============================================
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for mobile menu open/close
  const [mobileOpen, setMobileOpen] = useState(false);

  // Handle user logout
  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  // Navigation items array - makes it easy to add/remove nav links
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: PlusCircle, label: "Plan Trip", path: "/plan" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  return (
    <nav className="sticky top-0 z-50 navbar-blur border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - links to dashboard if logged in, home if not */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground">EcoTrip</span>
          </Link>

          {/* Desktop Navigation Links - only shown if user is logged in */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* User Menu Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Desktop user info and logout */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mobile Menu - uses Sheet component for slide-out drawer */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72">
                    <div className="flex flex-col gap-6 mt-8">
                      {/* User info in mobile menu */}
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {/* Mobile nav links */}
                      {navItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-colors py-2"
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                      {/* Mobile logout button */}
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="mt-4 justify-start gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              // Show "Get Started" button if not logged in
              <Link to="/auth">
                <Button className="rounded-full px-6" data-testid="get-started-btn">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// ============================================
// Main App Component
// Sets up the router and all application routes
// ============================================
function App() {
  return (
    // BrowserRouter enables client-side routing
    <BrowserRouter>
      {/* AuthProvider wraps everything so auth is available everywhere */}
      <AuthProvider>
        <div className="min-h-screen bg-background">
          {/* Toast notifications appear in top-right corner */}
          <Toaster position="top-right" richColors />
          
          {/* Define all our routes */}
          <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path="/" element={<><Navigation /><LandingPage /></>} />
            <Route path="/auth" element={<><Navigation /><AuthPage /></>} />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navigation />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/plan" element={
              <ProtectedRoute>
                <Navigation />
                <TripPlanner />
              </ProtectedRoute>
            } />
            <Route path="/trip/:tripId" element={
              <ProtectedRoute>
                <Navigation />
                <TripView />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Navigation />
                <Analytics />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Export App as the default export
export default App;
