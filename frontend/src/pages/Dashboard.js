// ============================================
// Dashboard.js - User's Main Dashboard
// Shows trip overview, stats, and carbon breakdown
// This is the home page for logged-in users
// ============================================

// Import React hooks
import { useState, useEffect } from "react";

// Navigation components
import { Link, useNavigate } from "react-router-dom";

// Axios for API calls
import axios from "axios";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";  // Loading placeholders

// Icons for various UI elements
import { 
  PlusCircle, MapPin, Calendar, DollarSign, Leaf, 
  TrendingUp, TreePine, Plane, Trash2, ChevronRight,
  Cloud
} from "lucide-react";

// Toast for notifications
import { toast } from "sonner";

// Auth hook and API URL
import { useAuth, API } from "@/App";

export default function Dashboard() {
  // Get current user and auth token
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard statistics
  const [stats, setStats] = useState(null);
  
  // State for user's trips list
  const [trips, setTrips] = useState([]);
  
  // Loading state while fetching data
  const [loading, setLoading] = useState(true);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch both stats and trips from API
  const fetchData = async () => {
    try {
      // Promise.all runs both requests simultaneously for better performance
      const [statsRes, tripsRes] = await Promise.all([
        // Get dashboard statistics
        axios.get(`${API}/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Get user's trips
        axios.get(`${API}/trips`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStats(statsRes.data);
      setTrips(tripsRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    }
    setLoading(false);
  };

  // Handle trip deletion
  const handleDeleteTrip = async (tripId, e) => {
    e.preventDefault();      // Prevent navigation (card is a link)
    e.stopPropagation();     // Stop event bubbling
    
    // Confirm before deleting
    if (!window.confirm("Delete this trip?")) return;
    
    try {
      await axios.delete(`${API}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove trip from local state (optimistic update)
      setTrips(trips.filter(t => t.id !== tripId));
      toast.success("Trip deleted");
      fetchData();  // Refresh stats
    } catch (error) {
      toast.error("Failed to delete trip");
    }
  };

  // Helper function to determine Green Score color
  // Green = good (70+), Yellow = moderate (40-69), Red = needs improvement (<40)
  const getGreenScoreColor = (score) => {
    if (score >= 70) return "text-green-600 bg-green-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Show skeleton loading state while data is being fetched
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-4 gap-4">
            {/* Render 4 skeleton cards for stats */}
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard-page">
      {/* ============================================
          Welcome Header Section
          ============================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          {/* Greeting with user's first name */}
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Plan your next sustainable adventure
          </p>
        </div>
        {/* Button to create new trip */}
        <Link to="/plan">
          <Button className="rounded-full gap-2" data-testid="new-trip-btn">
            <PlusCircle className="w-5 h-5" />
            Plan New Trip
          </Button>
        </Link>
      </div>

      {/* ============================================
          Stats Cards Grid - Shows key metrics
          ============================================ */}
      <div className="dashboard-grid mb-8">
        {/* Total Trips Card */}
        <Card className="stat-card-large border-border/50 shadow-card card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-3xl font-bold text-foreground">{stats?.total_trips || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Carbon Card */}
        <Card className="stat-card-large border-border/50 shadow-card card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Carbon</p>
                <p className="text-3xl font-bold text-foreground">{stats?.total_carbon_kg || 0} kg</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Spent Card */}
        <Card className="stat-card-large border-border/50 shadow-card card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold text-foreground">£{stats?.total_spent || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Green Score Card */}
        <Card className="stat-card-large border-border/50 shadow-card card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Green Score</p>
                <p className="text-3xl font-bold text-foreground">{stats?.avg_green_score || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          Carbon Breakdown Section
          Only shown if user has trips with carbon data
          ============================================ */}
      {stats?.carbon_breakdown && stats.total_carbon_kg > 0 && (
        <Card className="mb-8 border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <TreePine className="w-5 h-5 text-primary" />
              Carbon Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Map over carbon categories with progress bars */}
              {[
                { label: "Transport", value: stats.carbon_breakdown.transport, color: "bg-blue-500", icon: Plane },
                { label: "Accommodation", value: stats.carbon_breakdown.accommodation, color: "bg-purple-500", icon: MapPin },
                { label: "Activities", value: stats.carbon_breakdown.activities, color: "bg-green-500", icon: TrendingUp }
              ].map((item) => {
                // Calculate percentage for progress bar width
                const percentage = stats.total_carbon_kg > 0 
                  ? (item.value / stats.total_carbon_kg) * 100 
                  : 0;
                return (
                  <div key={item.label} className="space-y-2">
                    {/* Label row with icon and values */}
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">{item.value} kg ({percentage.toFixed(1)}%)</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          Trips List Section
          ============================================ */}
      <Card className="border-border/50 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif">Your Trips</CardTitle>
          {/* Link to analytics if user has trips */}
          {trips.length > 0 && (
            <Link to="/analytics" className="text-sm text-primary hover:underline">
              View Analytics
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {/* Empty state - shown when user has no trips */}
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-6">Start planning your first sustainable adventure</p>
              <Link to="/plan">
                <Button className="rounded-full" data-testid="empty-state-plan-btn">
                  Plan Your First Trip
                </Button>
              </Link>
            </div>
          ) : (
            // Trips list - each trip is a clickable card
            <div className="space-y-4">
              {trips.map((trip) => (
                <Link 
                  key={trip.id} 
                  to={`/trip/${trip.id}`}
                  className="block"
                  data-testid={`trip-card-${trip.id}`}
                >
                  {/* Trip card with hover effects */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-secondary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      {/* Trip icon */}
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        {/* Trip destination name */}
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {trip.destination}
                        </h3>
                        {/* Trip metadata (date, cost, carbon) */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(trip.start_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            £{trip.total_cost}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cloud className="w-3 h-3" />
                            {trip.total_carbon_kg} kg CO₂
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Green score badge and actions */}
                    <div className="flex items-center gap-3">
                      {/* Green Score badge with dynamic color */}
                      <Badge className={`${getGreenScoreColor(trip.green_score)} border-0`}>
                        <Leaf className="w-3 h-3 mr-1" />
                        {trip.green_score}
                      </Badge>
                      {/* Delete button */}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        className="text-muted-foreground hover:text-destructive"
                        data-testid={`delete-trip-${trip.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {/* Arrow indicating clickable */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
