# EcoTrip API Documentation

Base URL: `http://localhost:8000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Get Current User
**GET** `/auth/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2026-02-04T10:30:00.000Z"
}
```

---

### Update Profile
**PUT** `/auth/profile`

Update user's name or email.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "role": "user"
  }
}
```

---

### Change Password
**PUT** `/auth/password`

Change user's password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Trip Endpoints

### Generate Trip Itinerary
**POST** `/trips/generate`

Generate an AI-powered sustainable travel itinerary.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "destination": "Paris, France",
  "start_date": "2026-06-01",
  "end_date": "2026-06-07",
  "budget": 2000,
  "interests": ["culture", "food", "museums"],
  "travel_style": "balanced",
  "accommodation_preference": "hotel_standard",
  "transport_preference": "mixed"
}
```

**Valid Values:**
- `travel_style`: "budget", "balanced", "luxury"
- `accommodation_preference`: "hostel", "hotel_budget", "hotel_standard", "eco_lodge", "airbnb"
- `transport_preference`: "train", "bus", "car", "mixed"
- `interests`: Array of strings (e.g., "culture", "nature", "food", "photography", "museums", etc.)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Trip generated successfully",
  "id": 1,
  "destination": "Paris, France",
  "start_date": "2026-06-01",
  "end_date": "2026-06-07",
  "budget": 2000,
  "total_carbon_kg": 145.5,
  "total_cost": 1850,
  "green_score": 72,
  "itinerary": {
    "summary": "A balanced 7-day trip to Paris...",
    "days": [...],
    "eco_tips": [...]
  },
  "carbon_breakdown": {
    "transport": 45.2,
    "accommodation": 83.5,
    "activities": 16.8
  }
}
```

---

### List User's Trips
**GET** `/trips`

Get all trips for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of trips to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "destination": "Paris, France",
    "start_date": "2026-06-01",
    "end_date": "2026-06-07",
    "budget": 2000,
    "total_carbon_kg": 145.5,
    "total_cost": 1850,
    "green_score": 72,
    "created_at": "2026-02-04T10:30:00.000Z"
  }
]
```

---

### Get Trip Details
**GET** `/trips/:id`

Get full details of a specific trip.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "destination": "Paris, France",
  "start_date": "2026-06-01",
  "end_date": "2026-06-07",
  "budget": 2000,
  "interests": ["culture", "food", "museums"],
  "travel_style": "balanced",
  "accommodation_preference": "hotel_standard",
  "transport_preference": "mixed",
  "itinerary": {
    "summary": "...",
    "days": [
      {
        "day_number": 1,
        "date": "2026-06-01",
        "theme": "Arrival and City Exploration",
        "activities": [
          {
            "time": "09:00",
            "name": "Louvre Museum",
            "location": "Rue de Rivoli, 75001 Paris",
            "duration_hours": 3,
            "cost": 17,
            "category": "museum",
            "description": "...",
            "transport_mode": "metro",
            "transport_distance_km": 2.5,
            "sustainability_tip": "..."
          }
        ],
        "meals": {
          "breakfast": "...",
          "lunch": "...",
          "dinner": "..."
        },
        "daily_cost": 120
      }
    ],
    "packing_tips": [...],
    "eco_tips": [...],
    "local_customs": [...]
  },
  "total_carbon_kg": 145.5,
  "total_cost": 1850,
  "green_score": 72,
  "created_at": "2026-02-04T10:30:00.000Z"
}
```

---

### Delete Trip
**DELETE** `/trips/:id`

Delete a trip.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Trip deleted successfully"
}
```

---

## Statistics Endpoints

### Get Dashboard Stats
**GET** `/stats/dashboard`

Get aggregate statistics for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "total_trips": 5,
  "total_carbon_kg": 728.5,
  "total_spent": 9250,
  "avg_green_score": 68,
  "carbon_breakdown": {
    "transport": 226.0,
    "accommodation": 417.5,
    "activities": 85.0
  }
}
```

---

## Admin Endpoints

All admin endpoints require admin role.

### List All Users
**GET** `/admin/users`

Get all users with pagination and search.

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `limit` (optional): Number of users (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search by name or email

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### Update User
**PUT** `/admin/users/:id`

Update a user's status or role.

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "is_active": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "user",
    "is_active": false
  }
}
```

---

### Delete User
**DELETE** `/admin/users/:id`

Permanently delete a user account.

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### List Emission Factors
**GET** `/admin/emission-factors`

Get all emission factors.

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `category` (optional): Filter by category (transport/accommodation/activity)
- `is_active` (optional): Filter by active status
- `limit` (optional): Number of factors (default: 100)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "factors": [
    {
      "id": 1,
      "category": "transport",
      "sub_category": "car_average",
      "factor_kg_per_unit": 0.171,
      "unit": "km",
      "source": "DEFRA 2023",
      "description": "Average car (all fuels)",
      "is_active": true
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

---

### Create Emission Factor
**POST** `/admin/emission-factors`

Create a new emission factor.

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "category": "transport",
  "sub_category": "electric_scooter",
  "factor_kg_per_unit": 0.015,
  "unit": "km",
  "source": "Custom 2026",
  "description": "Electric scooter rental"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Emission factor created successfully",
  "factor": { ... }
}
```

---

### Update Emission Factor
**PUT** `/admin/emission-factors/:id`

Update an existing emission factor.

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "factor_kg_per_unit": 0.180,
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Emission factor updated successfully",
  "factor": { ... }
}
```

---

### Delete Emission Factor
**DELETE** `/admin/emission-factors/:id`

Delete an emission factor.

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Emission factor deleted successfully"
}
```

---

### View Audit Logs
**GET** `/admin/audit-logs`

View admin action audit logs.

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `admin_user_id` (optional): Filter by admin user
- `action` (optional): Filter by action type
- `target_resource` (optional): Filter by resource
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date
- `limit` (optional): Number of logs (default: 50)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": 1,
      "admin_user_id": 1,
      "admin_name": "Admin User",
      "admin_email": "admin@ecotrip.com",
      "action": "UPDATE_USER",
      "target_resource": "users",
      "target_id": 5,
      "details": { ... },
      "ip_address": "192.168.1.1",
      "created_at": "2026-02-04T12:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

---

## Error Responses

All endpoints may return error responses in this format:

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Password must be at least 8 characters long"
  ]
}
```

**401 Unauthorized** - Authentication required
```json
{
  "success": false,
  "message": "No token provided. Please authenticate."
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "message": "Admin access required."
}
```

**404 Not Found** - Resource not found
```json
{
  "success": false,
  "message": "Trip not found"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

**500 Internal Server Error** - Server error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 failed attempts per 15 minutes
- **Trip Generation**: 10 requests per hour (expensive operation)

---

## Notes

- All dates should be in ISO 8601 format: `YYYY-MM-DD`
- JWT tokens expire after 24 hours
- Carbon emissions are calculated in kg CO₂
- Green Score ranges from 0-100 (higher is better)
- All monetary values are in USD
