// ============================================
// Analytics.js - Data Visualization Dashboard
// Shows charts and graphs of user's travel data
// Features: Pie chart, bar chart, line chart, eco tips
// Uses Recharts library for beautiful responsive charts
// ============================================

// Import React hooks
import { useState, useEffect } from "react";

// Navigation
import { Link } from "react-router-dom";

// HTTP client
import axios from "axios";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Recharts components for data visualization
// These create interactive, responsive charts
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from "recharts";

// Icons
import { 
  Leaf, Cloud, DollarSign, MapPin, TrendingUp, 
  TreePine, Plane, Building, Sparkles
} from "lucide-react";

// Toast notifications
import { toast } from "sonner";

// Auth hook and API
import { useAuth, API } from "@/App";

// Color palette for charts - matches our brand colors
const COLORS = ["#2E5C55", "#D97C56", "#5C7068", "#7BA17F", "#C9A86A"];

export default function Analytics() {
  // Get auth token
  const { token } = useAuth();
  
  // State for dashboard statistics
  const [stats, setStats] = useState(null);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch stats when component mounts
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch analytics data from API
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    }
    setLoading(false);
  };

  // Show loading skeleton while fetching data
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Prepare data for carbon breakdown pie chart
  // Transform API data into format Recharts expects
  const carbonBreakdown = stats?.carbon_breakdown ? [
    { name: "Transport", value: stats.carbon_breakdown.transport, color: "#3B82F6" },
    { name: "Accommodation", value: stats.carbon_breakdown.accommodation, color: "#8B5CF6" },
    { name: "Activities", value: stats.carbon_breakdown.activities, color: "#10B981" }
  ] : [];

  // Prepare data for trip comparison bar chart
  // Takes recent trips and extracts key metrics
  const tripData = stats?.recent_trips?.map((trip, index) => ({
    name: trip.destination.split(',')[0].substring(0, 10),  // Truncate long names
    carbon: trip.total_carbon_kg,
    cost: trip.total_cost,
    score: trip.green_score
  })) || [];

  // Check if user has any data to display
  const hasData = stats?.total_trips > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="analytics-page">
      {/* ============================================
          Header Section
          ============================================ */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your travel sustainability metrics
        </p>
      </div>

      {/* ============================================
          Empty State - Shown when user has no trips
          ============================================ */}
      {!hasData ? (
        <Card className="border-border/50 shadow-card">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
              No trips yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Plan your first sustainable trip to start tracking your environmental impact
            </p>
            <Link to="/plan">
              <button className="bg-primary text-primary-foreground rounded-full px-8 py-3 font-medium hover:bg-primary/90 transition-colors">
                Plan Your First Trip
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ============================================
              Summary Cards - Key metrics at a glance
              ============================================ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Trips Card */}
            <Card className="border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trips</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total_trips}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Carbon Card */}
            <Card className="border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Carbon</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total_carbon_kg} kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Spent Card */}
            <Card className="border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">£{stats.total_spent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Green Score Card */}
            <Card className="border-border/50 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Green Score</p>
                    <p className="text-2xl font-bold text-green-600">{stats.avg_green_score}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================
              Charts Section - Data visualizations
              ============================================ */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Carbon Breakdown Pie Chart */}
            <Card className="border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-primary" />
                  Carbon Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {/* ResponsiveContainer makes chart resize with its parent */}
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {/* Donut chart (innerRadius creates the hole) */}
                      <Pie
                        data={carbonBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}kg`}
                      >
                        {/* Color each slice */}
                        {carbonBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      {/* Custom styled tooltip */}
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Category breakdown cards below chart */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { icon: Plane, label: "Transport", value: stats.carbon_breakdown.transport, color: "text-blue-600" },
                    { icon: Building, label: "Accommodation", value: stats.carbon_breakdown.accommodation, color: "text-purple-600" },
                    { icon: TrendingUp, label: "Activities", value: stats.carbon_breakdown.activities, color: "text-green-600" }
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-secondary/30">
                      <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-semibold">{item.value} kg</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trip Comparison Bar Chart */}
            <Card className="border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Trip Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tripData}>
                      {/* X axis - trip names */}
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      {/* Y axis - values */}
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                        }}
                      />
                      <Legend />
                      {/* Two bar series - carbon and cost */}
                      <Bar dataKey="carbon" name="Carbon (kg)" fill="#2E5C55" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Cost (£)" fill="#D97C56" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================
              Green Score Trend Line Chart
              Only shown if user has multiple trips
              ============================================ */}
          {tripData.length > 1 && (
            <Card className="border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  Green Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tripData}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      {/* Y axis from 0-100 for score */}
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                        }}
                      />
                      {/* Line with dots at each data point */}
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        name="Green Score"
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}  // Larger dot on hover
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ============================================
              Eco Tips Section
              Actionable advice for improving Green Score
              ============================================ */}
          <Card className="border-border/50 shadow-card mt-6">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Tips to Improve Your Green Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Tip cards */}
                {[
                  { tip: "Choose trains over short-haul flights to reduce transport emissions by up to 80%", icon: Plane },
                  { tip: "Stay at eco-certified accommodations that use renewable energy", icon: Building },
                  { tip: "Opt for walking tours and bike rentals for zero-emission activities", icon: TrendingUp }
                ].map((item, index) => (
                  <div key={index} className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <item.icon className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm text-green-800">{item.tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
