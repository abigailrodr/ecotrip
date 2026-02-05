// ============================================
// TripView.js - Individual Trip Detail Page
// Shows the full itinerary, map, and expense tracking
// Features: Day-by-day activities, interactive map, expense tracker, PDF export
// ============================================

// Import React hooks
import { useState, useEffect } from "react";

// Routing hooks
import { useParams, Link } from "react-router-dom";

// HTTP client
import axios from "axios";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Icons for UI elements
import { 
  MapPin, Calendar, DollarSign, Leaf, Cloud, Clock, 
  ChevronLeft, Plus, Trash2, Download, TreePine,
  Plane, Building, ShoppingBag, Utensils, Camera,
  Mountain, Music, Bike
} from "lucide-react";

// Toast notifications
import { toast } from "sonner";

// Leaflet map components for interactive map
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Auth hook and API
import { useAuth, API } from "@/App";

// jsPDF library for generating PDF exports
import jsPDF from "jspdf";

// ============================================
// Fix Leaflet marker icons
// This is needed because Leaflet's default markers don't work well with webpack
// ============================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

// Map activity types to icons
const ACTIVITY_ICONS = {
  museum: Building,
  restaurant: Utensils,
  hiking: Mountain,
  tour: Camera,
  shopping: ShoppingBag,
  adventure_sport: Bike,
  spa: TreePine,
  swimming: Plane,
  default: MapPin  // Fallback icon
};

// Expense category options
const EXPENSE_CATEGORIES = [
  { id: "transport", label: "Transport" },
  { id: "accommodation", label: "Accommodation" },
  { id: "food", label: "Food & Dining" },
  { id: "activities", label: "Activities" },
  { id: "shopping", label: "Shopping" },
  { id: "other", label: "Other" }
];

export default function TripView() {
  // Get tripId from URL parameters (e.g., /trip/123)
  const { tripId } = useParams();
  const { token } = useAuth();
  
  // State for trip data
  const [trip, setTrip] = useState(null);
  
  // State for expense list
  const [expenses, setExpenses] = useState([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Dialog state for adding expenses
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  
  // Form state for new expense
  const [newExpense, setNewExpense] = useState({
    category: "food",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0]  // Today's date
  });

  // Fetch trip and expenses when component mounts
  useEffect(() => {
    fetchTrip();
    fetchExpenses();
  }, [tripId]);

  // Fetch trip details from API
  const fetchTrip = async () => {
    try {
      const response = await axios.get(`${API}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(response.data);
    } catch (error) {
      toast.error("Failed to load trip");
    }
    setLoading(false);
  };

  // Fetch expenses for this trip
  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to load expenses");
    }
  };

  // Handle adding a new expense
  const handleAddExpense = async () => {
    // Validate required fields
    if (!newExpense.description || !newExpense.amount) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/expenses`,
        {
          trip_id: tripId,
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          date: newExpense.date
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Add new expense to the beginning of the list
      setExpenses([response.data, ...expenses]);
      // Reset form
      setNewExpense({ category: "food", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
      setExpenseDialogOpen(false);
      toast.success("Expense added");
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      await axios.delete(`${API}/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove expense from local state
      setExpenses(expenses.filter(e => e.id !== expenseId));
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  // Export trip itinerary to PDF
  const exportPDF = () => {
    if (!trip) return;

    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(46, 92, 85);  // Primary color
    doc.text(`EcoTrip: ${trip.destination}`, 20, 25);
    
    // Trip info summary
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${trip.start_date} - ${trip.end_date}`, 20, 35);
    doc.text(`Budget: £${trip.budget} | Total Cost: £${trip.total_cost}`, 20, 42);
    doc.text(`Carbon Footprint: ${trip.total_carbon_kg} kg CO2 | Green Score: ${trip.green_score}/100`, 20, 49);
    
    // Divider line
    doc.setDrawColor(209, 217, 212);
    doc.line(20, 55, pageWidth - 20, 55);
    
    let yPos = 65;  // Track vertical position
    
    // Itinerary - loop through each day
    trip.itinerary.forEach((day) => {
      // Add new page if near bottom
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Day header
      doc.setFontSize(14);
      doc.setTextColor(46, 92, 85);
      doc.text(`Day ${day.day} - ${day.date}`, 20, yPos);
      yPos += 8;
      
      // Activities for this day
      day.activities.forEach((activity) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Activity details
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`${activity.time} - ${activity.title}`, 25, yPos);
        yPos += 5;
        doc.setTextColor(100);
        doc.text(`${activity.location} | £${activity.estimated_cost} | ${activity.carbon_kg}kg CO2`, 30, yPos);
        yPos += 7;
      });
      
      yPos += 5;  // Space between days
    });
    
    // Save the PDF with destination name
    doc.save(`EcoTrip-${trip.destination.replace(/\s+/g, '-')}.pdf`);
    toast.success("PDF exported!");
  };

  // Calculate center point for map based on all activity locations
  const getMapCenter = () => {
    // Get all coordinates from activities
    const coords = trip.itinerary
      .flatMap(day => day.activities)
      .filter(a => a.lat && a.lng)  // Only include activities with coordinates
      .map(a => [a.lat, a.lng]);
    
    // Default to Paris if no coordinates
    if (coords.length === 0) return [48.8566, 2.3522];
    
    // Calculate average lat/lng
    const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const avgLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
    return [avgLat, avgLng];
  };

  // Get markers for the map
  const getMarkers = () => {
    return trip.itinerary
      .flatMap((day, dayIndex) => 
        day.activities
          .filter(a => a.lat && a.lng)
          .map((a, actIndex) => ({
            ...a,
            day: day.day,
            position: [a.lat, a.lng],
            key: `${dayIndex}-${actIndex}`  // Unique key for React
          }))
      );
  };

  // Get color class based on Green Score
  const getGreenScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Show loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Show error state if trip not found
  if (!trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p>Trip not found</p>
        <Link to="/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="trip-view-page">
      {/* ============================================
          Header Section - Trip title and actions
          ============================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            {/* Trip destination as title */}
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {trip.destination}
            </h1>
            {/* Trip metadata */}
            <div className="flex items-center gap-4 text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {trip.start_date} - {trip.end_date}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                £{trip.total_cost} / £{trip.budget}
              </span>
            </div>
          </div>
        </div>
        {/* Export PDF button */}
        <Button onClick={exportPDF} className="rounded-full gap-2" data-testid="export-pdf-btn">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* ============================================
          Stats Cards - Key trip metrics
          ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Carbon */}
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carbon</p>
              <p className="text-lg font-bold">{trip.total_carbon_kg} kg</p>
            </div>
          </CardContent>
        </Card>

        {/* Green Score */}
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Leaf className={`w-5 h-5 ${getGreenScoreColor(trip.green_score)}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Green Score</p>
              <p className={`text-lg font-bold ${getGreenScoreColor(trip.green_score)}`}>{trip.green_score}/100</p>
            </div>
          </CardContent>
        </Card>

        {/* Transport Carbon */}
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transport CO₂</p>
              <p className="text-lg font-bold">{trip.transport_carbon} kg</p>
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Carbon */}
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lodging CO₂</p>
              <p className="text-lg font-bold">{trip.accommodation_carbon} kg</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          Tabs - Itinerary, Map, Expenses
          ============================================ */}
      <Tabs defaultValue="itinerary" className="space-y-6">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-1">
          <TabsTrigger value="itinerary" data-testid="itinerary-tab">Itinerary</TabsTrigger>
          <TabsTrigger value="map" data-testid="map-tab">Map</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="expenses-tab">Expenses</TabsTrigger>
        </TabsList>

        {/* ============================================
            Itinerary Tab - Day by day activities
            ============================================ */}
        <TabsContent value="itinerary" className="space-y-6">
          {trip.itinerary.map((day) => (
            <Card key={day.day} className="border-border/50 shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif flex items-center gap-2">
                    {/* Day number badge */}
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {day.day}
                    </span>
                    Day {day.day}
                  </CardTitle>
                  {/* Day totals */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>£{day.total_cost}</span>
                    <span>{day.total_carbon} kg CO₂</span>
                  </div>
                </div>
                <p className="text-muted-foreground">{day.date}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Activity cards */}
                  {day.activities.map((activity, index) => {
                    // Get appropriate icon for activity type
                    const Icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
                    return (
                      <div 
                        key={activity.id || index} 
                        className="flex gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        {/* Activity icon */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        {/* Activity details */}
                        <div className="flex-grow">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              {/* Time and title */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{activity.time}</span>
                                <h4 className="font-semibold text-foreground">{activity.title}</h4>
                              </div>
                              {/* Description */}
                              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                              {/* Location and duration */}
                              <div className="flex items-center gap-3 mt-2 text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {activity.location}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {activity.duration_hours}h
                                </span>
                              </div>
                            </div>
                            {/* Cost and carbon */}
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold">£{activity.estimated_cost}</p>
                              <p className="text-sm text-muted-foreground">{activity.carbon_kg} kg CO₂</p>
                            </div>
                          </div>
                          {/* Eco alternative tip if available */}
                          {activity.eco_alternative && (
                            <div className="mt-3 p-2 rounded-lg bg-green-50 border border-green-200">
                              <p className="text-sm text-green-700 flex items-center gap-1">
                                <Leaf className="w-3 h-3" />
                                <span className="font-medium">Eco tip:</span> {activity.eco_alternative}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ============================================
            Map Tab - Interactive Leaflet map
            ============================================ */}
        <TabsContent value="map">
          <Card className="border-border/50 shadow-card overflow-hidden">
            <div className="map-container h-[500px]">
              <MapContainer 
                center={getMapCenter()} 
                zoom={13} 
                style={{ height: "100%", width: "100%" }}
              >
                {/* OpenStreetMap tile layer */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Markers for each activity */}
                {getMarkers().map((marker) => (
                  <Marker key={marker.key} position={marker.position}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">{marker.title}</p>
                        <p className="text-sm text-muted-foreground">Day {marker.day} - {marker.time}</p>
                        <p className="text-sm">{marker.location}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>
        </TabsContent>

        {/* ============================================
            Expenses Tab - Track trip spending
            ============================================ */}
        <TabsContent value="expenses">
          <Card className="border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif">Expense Tracker</CardTitle>
                <p className="text-muted-foreground">Total: £{totalExpenses.toFixed(2)}</p>
              </div>
              {/* Add expense dialog */}
              <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2" data-testid="add-expense-btn">
                    <Plus className="w-4 h-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* Category select */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newExpense.category} 
                        onValueChange={(v) => setNewExpense({...newExpense, category: v})}
                      >
                        <SelectTrigger data-testid="expense-category-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Description input */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input 
                        placeholder="What did you spend on?"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        data-testid="expense-description-input"
                      />
                    </div>
                    {/* Amount and date inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount (£)</Label>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                          data-testid="expense-amount-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input 
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                          data-testid="expense-date-input"
                        />
                      </div>
                    </div>
                    {/* Save button */}
                    <Button 
                      onClick={handleAddExpense} 
                      className="w-full rounded-full"
                      data-testid="save-expense-btn"
                    >
                      Save Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Empty state or expense list */}
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No expenses recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div 
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                    >
                      {/* Expense info */}
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={`expense-${expense.category}`}>
                          {expense.category}
                        </Badge>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">{expense.date}</p>
                        </div>
                      </div>
                      {/* Amount and delete */}
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">£{expense.amount.toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-muted-foreground hover:text-destructive"
                          data-testid={`delete-expense-${expense.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
