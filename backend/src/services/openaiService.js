import OpenAI from 'openai';
import config from '../config/env.js';
import { differenceInDays } from 'date-fns';

/**
 * OpenAI Service for AI-powered itinerary generation
 */
class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.apiKeys.openai,
    });
  }

  /**
   * Generate an AI-powered travel itinerary
   * @param {Object} tripData - Trip planning data
   * @returns {Promise<Object>} Generated itinerary
   */
  async generateItinerary(tripData) {
    const {
      destination,
      start_date,
      end_date,
      budget,
      interests,
      travel_style,
      accommodation_preference,
      transport_preference,
    } = tripData;

    // Calculate number of days
    const numDays = differenceInDays(new Date(end_date), new Date(start_date)) + 1;

    // Build the prompt
    const prompt = this.buildPrompt({
      destination,
      numDays,
      budget,
      interests,
      travel_style,
      accommodation_preference,
      transport_preference,
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sustainable travel planner. You create detailed, eco-friendly itineraries that minimize carbon footprint while maximizing traveler experiences. Always prioritize sustainable options like public transport, local experiences, and eco-friendly accommodations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      const itinerary = JSON.parse(content);

      // Validate and enhance the itinerary
      return this.validateAndEnhanceItinerary(itinerary, tripData);
    } catch (error) {
      console.error('OpenAI API error:', error);
      console.warn('⚠️  Falling back to DEMO MODE - using sample itinerary');
      
      // DEMO MODE: Return sample itinerary when OpenAI fails
      return this.generateDemoItinerary(tripData);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  buildPrompt(data) {
    const { destination, numDays, budget, interests, travel_style, accommodation_preference, transport_preference } = data;

    const travelStyleDescriptions = {
      budget: 'budget-friendly with free or low-cost activities',
      balanced: 'balanced mix of budget and premium experiences',
      luxury: 'comfortable and premium experiences',
    };

    const interestDescriptions = {
      culture: 'cultural sites and historical landmarks',
      nature: 'natural scenery and outdoor activities',
      food: 'local cuisine and dining experiences',
      photography: 'photogenic locations and scenic spots',
      music: 'live music venues and cultural performances',
      relaxation: 'relaxing and wellness activities',
      adventure: 'adventure sports and thrilling activities',
      shopping: 'shopping districts and local markets',
      beaches: 'beaches and water activities',
      museums: 'museums, galleries, and art',
    };

    const selectedInterests = interests
      .map(i => interestDescriptions[i] || i)
      .join(', ');

    return `Create a detailed ${numDays}-day sustainable travel itinerary for ${destination}.

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${numDays} days
- Budget: £${budget} (total for the entire trip)
- Travel Style: ${travelStyleDescriptions[travel_style] || travel_style}
- Interests: ${selectedInterests}
- Preferred Accommodation: ${accommodation_preference}
- Preferred Transport: ${transport_preference}

REQUIREMENTS:
1. Create a day-by-day itinerary with 3-5 activities per day
2. Prioritize eco-friendly and sustainable options (public transport, walking, cycling, local experiences)
3. Include specific activity names, locations, and approximate costs
4. Provide realistic time allocations for each activity
5. Consider travel time between activities
6. Stay within the budget while maximizing value
7. Include a mix of activities based on the traveler's interests
8. Suggest local, authentic experiences over tourist traps
9. Include meal recommendations (breakfast, lunch, dinner)
10. Add sustainability tips and carbon-friendly alternatives

RETURN FORMAT (JSON):
{
  "summary": "Brief 2-3 sentence overview of the trip",
  "sustainability_score": 85,
  "estimated_total_cost": 950,
  "days": [
    {
      "day": 1,
      "date": "2026-06-01",
      "theme": "Arrival and City Exploration",
      "activities": [
        {
          "id": "1-1",
          "time": "09:00",
          "title": "Activity name",
          "location": "Specific address or landmark",
          "duration_hours": 2,
          "estimated_cost": 15,
          "carbon_kg": 2.0,
          "type": "museum",
          "description": "Brief description of the activity",
          "transport_mode": "walking",
          "eco_alternative": "Eco-friendly aspect or tip"
        }
      ],
      "meals": {
        "breakfast": "Recommended breakfast spot",
        "lunch": "Recommended lunch spot",
        "dinner": "Recommended dinner spot"
      },
      "daily_cost": 120
    }
  ],
  "packing_tips": ["Essential item 1", "Essential item 2"],
  "eco_tips": ["Sustainability tip 1", "Sustainability tip 2"],
  "local_customs": ["Cultural tip 1", "Cultural tip 2"]
}

ACTIVITY TYPES:
Use these for the "type" field: museum, restaurant, outdoor_activity, shopping, tour, entertainment_venue, cafe, hiking, cultural_site, beach, adventure_sport, spa_wellness

TRANSPORT MODES:
Use these for "transport_mode": walking, bicycle, train, bus, car, taxi (prefer walking, bicycle, train, bus for sustainability)

Generate the itinerary now:`;
  }

  /**
   * Validate and enhance the generated itinerary
   */
  validateAndEnhanceItinerary(itinerary, tripData) {
    // Ensure all required fields are present
    if (!itinerary.days || !Array.isArray(itinerary.days)) {
      throw new Error('Invalid itinerary structure');
    }

    // Add dates to each day if not present
    const startDate = new Date(tripData.start_date);
    itinerary.days = itinerary.days.map((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);

      return {
        ...day,
        day: day.day || index + 1, // Frontend expects 'day'
        date: dayDate.toISOString().split('T')[0],
        activities: (day.activities || []).map((activity, actIndex) => ({
          id: activity.id || `${index + 1}-${actIndex + 1}`,
          time: activity.time || '09:00',
          title: activity.title || activity.name || 'Unnamed Activity', // Frontend expects 'title'
          location: activity.location || '',
          duration_hours: activity.duration_hours || 2,
          estimated_cost: activity.estimated_cost || activity.cost || 0, // Frontend expects 'estimated_cost'
          carbon_kg: activity.carbon_kg || 1.5, // Frontend expects 'carbon_kg'
          type: activity.type || activity.category || 'tour', // Frontend expects 'type'
          description: activity.description || '',
          transport_mode: activity.transport_mode || 'walking',
          eco_alternative: activity.eco_alternative || activity.sustainability_tip || '', // Frontend expects 'eco_alternative'
        })),
      };
    });

    // Calculate total cost if not present
    if (!itinerary.estimated_total_cost) {
      itinerary.estimated_total_cost = itinerary.days.reduce((sum, day) => {
        return sum + (day.daily_cost || 0);
      }, 0);
    }

    // Ensure sustainability score is present
    if (!itinerary.sustainability_score) {
      itinerary.sustainability_score = 75; // Default value
    }

    return itinerary;
  }

  /**
   * Generate eco-friendly alternatives for a specific activity
   */
  async generateEcoAlternatives(activity) {
    const prompt = `Suggest 2-3 more sustainable alternatives to this activity:
    
Activity: ${activity.name}
Location: ${activity.location}
Current transport: ${activity.transport_mode}

Provide alternatives that:
1. Reduce carbon emissions
2. Support local communities
3. Are more environmentally friendly

Return as JSON array:
[
  {
    "name": "Alternative name",
    "description": "Why it's more sustainable",
    "carbon_savings": "Estimated carbon savings",
    "transport_mode": "Suggested transport"
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a sustainable travel expert specializing in eco-friendly alternatives.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      const alternatives = JSON.parse(content);
      return alternatives.alternatives || [];
    } catch (error) {
      console.error('Error generating eco alternatives:', error);
      return [];
    }
  }

  /**
   * Generate demo itinerary (fallback when OpenAI is unavailable)
   */
  generateDemoItinerary(tripData) {
    const { destination, start_date, end_date, budget } = tripData;
    
    // Calculate number of days
    const numDays = differenceInDays(new Date(end_date), new Date(start_date)) + 1;
    
    console.log('🎭 DEMO MODE: Generating sample itinerary');
    
    const demoItinerary = {
      summary: `An eco-friendly ${numDays}-day adventure in ${destination} with sustainable transportation, local experiences, and carbon-conscious activities. This is a DEMO itinerary showing the platform's capabilities.`,
      sustainability_score: 85,
      estimated_total_cost: Math.min(tripData.budget * 0.9, tripData.budget - 100),
      days: [],
      packing_tips: [
        'Reusable water bottle',
        'Eco-friendly toiletries',
        'Comfortable walking shoes',
        'Light, layered clothing',
        'Reusable shopping bag'
      ],
      eco_tips: [
        'Use public transportation whenever possible',
        'Support local businesses and artisans',
        'Choose restaurants with locally-sourced ingredients',
        'Avoid single-use plastics',
        'Walk or cycle for short distances'
      ],
      local_customs: [
        'Respect local customs and traditions',
        'Learn a few basic phrases in the local language',
        'Dress appropriately for cultural sites',
        'Ask permission before taking photos of people'
      ]
    };

    // Generate days
    for (let day = 1; day <= numDays; day++) {
      const dayDate = new Date(start_date);
      dayDate.setDate(dayDate.getDate() + (day - 1));
      
      const dailyBudget = Math.round(budget / numDays * 0.8);
      
      demoItinerary.days.push({
        day: day, // Frontend expects 'day' not 'day_number'
        date: dayDate.toISOString().split('T')[0],
        theme: day === 1 ? 'Arrival & Exploration' : day === numDays ? 'Final Day & Departure' : `Discover ${destination}`,
        activities: [
          {
            id: `${day}-1`,
            time: '09:00',
            title: `Morning Exploration of ${destination}`, // Frontend expects 'title' not 'name'
            location: `Central ${destination}`,
            duration_hours: 2,
            estimated_cost: 0, // Frontend expects 'estimated_cost' not 'cost'
            carbon_kg: 0.5, // Frontend expects 'carbon_kg'
            type: 'outdoor_activity', // Frontend expects 'type' not 'category'
            description: 'Start your day with a walking tour of the city center',
            transport_mode: 'walking',
            eco_alternative: 'Walking is the most eco-friendly way to explore' // Frontend expects 'eco_alternative'
          },
          {
            id: `${day}-2`,
            time: '11:30',
            title: 'Local Museum Visit',
            location: 'City Museum',
            duration_hours: 2,
            estimated_cost: 15,
            carbon_kg: 2.0,
            type: 'museum',
            description: 'Explore local history and culture',
            transport_mode: 'walking',
            eco_alternative: 'Support local cultural institutions'
          },
          {
            id: `${day}-3`,
            time: '13:30',
            title: 'Lunch at Local Restaurant',
            location: 'Local Cuisine Restaurant',
            duration_hours: 1.5,
            estimated_cost: 25,
            carbon_kg: 3.5,
            type: 'restaurant',
            description: 'Try authentic local dishes made with seasonal ingredients',
            transport_mode: 'walking',
            eco_alternative: 'Choose restaurants using locally-sourced ingredients'
          },
          {
            id: `${day}-4`,
            time: '15:30',
            title: 'Afternoon Cultural Experience',
            location: 'Historic District',
            duration_hours: 2,
            estimated_cost: 10,
            carbon_kg: 1.5,
            type: 'tour',
            description: 'Guided walking tour of historic landmarks',
            transport_mode: 'walking',
            eco_alternative: 'Walking tours have zero carbon footprint'
          },
          {
            id: `${day}-5`,
            time: '18:00',
            title: 'Evening Leisure',
            location: 'City Park',
            duration_hours: 1,
            estimated_cost: 0,
            carbon_kg: 0,
            type: 'outdoor_activity',
            description: 'Relax in a local park and enjoy the atmosphere',
            transport_mode: 'walking',
            eco_alternative: 'Public parks are free and eco-friendly'
          }
        ],
        meals: {
          breakfast: 'Hotel breakfast or local bakery',
          lunch: 'Local restaurant with seasonal menu',
          dinner: 'Traditional local cuisine'
        },
        daily_cost: dailyBudget
      });
    }

    return this.validateAndEnhanceItinerary(demoItinerary, tripData);
  }
}

// Export singleton instance
export default new OpenAIService();
