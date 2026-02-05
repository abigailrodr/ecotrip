// ============================================
// TripPlanner.js - Multi-Step Trip Planning Wizard
// Guides users through creating a new trip with:
// 1. Destination selection
// 2. Date and budget selection
// 3. Interest selection
// 4. Travel preferences (style, accommodation, transport)
// ============================================

// Import React hooks
import { useState } from "react";

// Navigation
import { useNavigate } from "react-router-dom";

// HTTP client
import axios from "axios";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

// Icons
import { 
  MapPin, CalendarIcon, DollarSign, Sparkles, 
  ChevronLeft, ChevronRight, Loader2, TreePine,
  Mountain, Utensils, Camera, Music, Book, Heart,
  Bike, ShoppingBag, Building, Waves, Train, Car, Leaf
} from "lucide-react";

// Toast notifications
import { toast } from "sonner";

// Date formatting utility
import { format } from "date-fns";

// Utility for conditional class names
import { cn } from "@/lib/utils";

// Auth hook and API
import { useAuth, API } from "@/App";

// ============================================
// Configuration Arrays
// These define the options available to users
// ============================================

// Available interests users can select
const INTERESTS = [
  { id: "culture", label: "Culture & History", icon: Building },
  { id: "nature", label: "Nature & Outdoors", icon: Mountain },
  { id: "food", label: "Food & Dining", icon: Utensils },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "music", label: "Music & Nightlife", icon: Music },
  { id: "relaxation", label: "Relaxation & Wellness", icon: Heart },
  { id: "adventure", label: "Adventure Sports", icon: Bike },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "beaches", label: "Beaches & Water", icon: Waves },
  { id: "museums", label: "Museums & Art", icon: Book }
];

// Travel style options
const TRAVEL_STYLES = [
  { id: "budget", label: "Budget-Friendly", desc: "Maximize experiences, minimize costs" },
  { id: "balanced", label: "Balanced", desc: "Mix of comfort and adventure" },
  { id: "luxury", label: "Comfort-First", desc: "Premium experiences and accommodations" }
];

// Accommodation options with carbon footprint data
const ACCOMMODATIONS = [
  { id: "hostel", label: "Hostel", carbon: 8.5 },
  { id: "hotel_budget", label: "Budget Hotel", carbon: 15.2 },
  { id: "hotel_standard", label: "Standard Hotel", carbon: 20.9 },
  { id: "eco_lodge", label: "Eco Lodge", carbon: 5.2, eco: true },  // Eco-friendly option
  { id: "airbnb", label: "Airbnb", carbon: 12.5 }
];

// Transport options
const TRANSPORTS = [
  { id: "train", label: "Train", icon: Train, carbon: "Low", eco: true },
  { id: "bus", label: "Bus", icon: Car, carbon: "Low", eco: true },
  { id: "car", label: "Car", icon: Car, carbon: "Medium" },
  { id: "mixed", label: "Mixed", icon: MapPin, carbon: "Varies" }
];

export default function TripPlanner() {
  // Get auth token for API calls
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // Current step in the wizard (1-4)
  const [step, setStep] = useState(1);
  
  // Loading state for form submission
  const [loading, setLoading] = useState(false);
  
  // Form state object - contains all trip planning data
  const [form, setForm] = useState({
    destination: "",
    startDate: null,
    endDate: null,
    budget: 1000,              // Default budget
    interests: [],             // Array of selected interest IDs
    travelStyle: "balanced",   // Default travel style
    accommodation: "hotel_standard",
    transport: "mixed"
  });

  // Total number of steps in the wizard
  const totalSteps = 4;

  // Generic function to update any form field
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Toggle interest selection (add/remove from array)
  const toggleInterest = (id) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)  // Remove if already selected
        : [...prev.interests, id]                // Add if not selected
    }));
  };

  // Validation function - determines if user can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 1: return form.destination.trim().length > 0;  // Need destination
      case 2: return form.startDate && form.endDate;      // Need both dates
      case 3: return form.interests.length > 0;           // Need at least one interest
      case 4: return true;                                 // Preferences are optional
      default: return false;
    }
  };

  // Handle final form submission - generates the itinerary
  const handleGenerate = async () => {
    // Final validation
    if (form.interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    setLoading(true);
    try {
      // Send trip data to API for AI generation
      const response = await axios.post(
        `${API}/trips/generate`,
        {
          destination: form.destination,
          start_date: format(form.startDate, "yyyy-MM-dd"),
          end_date: format(form.endDate, "yyyy-MM-dd"),
          budget: form.budget,
          interests: form.interests,
          travel_style: form.travelStyle,
          accommodation_preference: form.accommodation,
          transport_preference: form.transport
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Itinerary generated!");
      // Navigate to the new trip's detail page
      navigate(`/trip/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate itinerary");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-secondary/30 to-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* ============================================
            Progress Indicator
            Shows which step user is on
            ============================================ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {/* Render step indicators */}
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                {/* Step circle */}
                <div className={cn(
                  "step-indicator",
                  s === step ? "active" : s < step ? "completed" : "pending"
                )}>
                  {s < step ? "✓" : s}  {/* Checkmark for completed steps */}
                </div>
                {/* Connector line between steps (not after last step) */}
                {s < 4 && (
                  <div className={cn(
                    "hidden sm:block w-16 md:w-24 h-1 mx-2 rounded-full",
                    s < step ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* ============================================
            Step 1: Destination Input
            ============================================ */}
        {step === 1 && (
          <Card className="border-border/50 shadow-soft animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Where would you like to go?</CardTitle>
              <CardDescription>Enter your dream destination</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-w-md mx-auto">
                <Input
                  placeholder="e.g., Paris, France"
                  value={form.destination}
                  onChange={(e) => updateForm("destination", e.target.value)}
                  className="text-center text-lg h-14"
                  data-testid="destination-input"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================
            Step 2: Dates and Budget Selection
            ============================================ */}
        {step === 2 && (
          <Card className="border-border/50 shadow-soft animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">When are you traveling?</CardTitle>
              <CardDescription>Select your dates and budget</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Date Pickers - Start and End Date */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Start Date Picker */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12",
                          !form.startDate && "text-muted-foreground"
                        )}
                        data-testid="start-date-btn"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.startDate ? format(form.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.startDate}
                        onSelect={(date) => updateForm("startDate", date)}
                        disabled={(date) => date < new Date()}  // Can't select past dates
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date Picker */}
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12",
                          !form.endDate && "text-muted-foreground"
                        )}
                        data-testid="end-date-btn"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.endDate ? format(form.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.endDate}
                        onSelect={(date) => updateForm("endDate", date)}
                        disabled={(date) => date < (form.startDate || new Date())}  // Must be after start
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Budget Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Budget</Label>
                  <span className="text-2xl font-bold text-primary">£{form.budget}</span>
                </div>
                <Slider
                  value={[form.budget]}
                  onValueChange={([val]) => updateForm("budget", val)}
                  min={100}
                  max={10000}
                  step={100}
                  className="py-4"
                  data-testid="budget-slider"
                />
                {/* Min/Max labels */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>£100</span>
                  <span>£10,000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================
            Step 3: Interest Selection
            ============================================ */}
        {step === 3 && (
          <Card className="border-border/50 shadow-soft animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">What interests you?</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Grid of selectable interest tags */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      "interest-tag flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      form.interests.includes(interest.id) ? "selected" : ""
                    )}
                    data-testid={`interest-${interest.id}`}
                  >
                    <interest.icon className="w-6 h-6" />
                    <span className="text-sm font-medium text-center">{interest.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================
            Step 4: Travel Preferences
            ============================================ */}
        {step === 4 && (
          <Card className="border-border/50 shadow-soft animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TreePine className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Customize your trip</CardTitle>
              <CardDescription>Choose your travel style and preferences</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Travel Style Selection */}
              <div className="space-y-3">
                <Label>Travel Style</Label>
                <div className="grid gap-3">
                  {TRAVEL_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateForm("travelStyle", style.id)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        form.travelStyle === style.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/30"
                      )}
                      data-testid={`style-${style.id}`}
                    >
                      {/* Radio button indicator */}
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5",
                        form.travelStyle === style.id 
                          ? "border-primary bg-primary" 
                          : "border-muted-foreground"
                      )}>
                        {form.travelStyle === style.id && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{style.label}</p>
                        <p className="text-sm text-muted-foreground">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accommodation Selection */}
              <div className="space-y-3">
                <Label>Accommodation Preference</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ACCOMMODATIONS.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => updateForm("accommodation", acc.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-center relative",
                        form.accommodation === acc.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/30"
                      )}
                      data-testid={`accommodation-${acc.id}`}
                    >
                      {/* Eco badge for eco-friendly options */}
                      {acc.eco && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Leaf className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <p className="font-medium text-sm">{acc.label}</p>
                      <p className="text-xs text-muted-foreground">{acc.carbon} kg/night</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transport Selection */}
              <div className="space-y-3">
                <Label>Primary Transport</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TRANSPORTS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateForm("transport", t.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-center relative",
                        form.transport === t.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/30"
                      )}
                      data-testid={`transport-${t.id}`}
                    >
                      {/* Eco badge */}
                      {t.eco && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Leaf className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <t.icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.carbon}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================
            Navigation Buttons
            Back and Next/Generate buttons
            ============================================ */}
        <div className="flex justify-between mt-8">
          {/* Back button - disabled on first step */}
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="rounded-full px-6"
            data-testid="prev-step-btn"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Next/Generate button */}
          {step < totalSteps ? (
            // Next button for steps 1-3
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="rounded-full px-6"
              data-testid="next-step-btn"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            // Generate button on final step
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-full px-8"
              data-testid="generate-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Itinerary
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
