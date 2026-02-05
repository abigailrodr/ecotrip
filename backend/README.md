# EcoTrip Backend API

Sustainable travel planning platform backend built with Node.js, Express, and PostgreSQL.

## Features

- 🔐 JWT-based authentication
- 🤖 AI-powered itinerary generation (OpenAI GPT-4)
- 🌍 Location and route data (Google Places API)
- 🌱 Carbon emissions calculation (DEFRA factors)
- 📊 Dashboard statistics and analytics
- 👨‍💼 Admin management panel
- 🗄️ PostgreSQL database with migrations

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- OpenAI API key
- Google Places API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secure string (min 32 chars)
- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_PLACES_API_KEY` - Your Google Places API key

### 3. Set Up PostgreSQL Database

Create the database:

```bash
psql -U postgres
CREATE DATABASE ecotrip;
\q
```

Run migrations to create tables:

```bash
npm run migrate
```

Seed emission factors data:

```bash
npm run seed
```

### 4. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Trips
- `POST /api/trips/generate` - Generate AI itinerary
- `GET /api/trips` - List user's trips
- `GET /api/trips/:id` - Get trip details
- `DELETE /api/trips/:id` - Delete trip

### Statistics
- `GET /api/stats/dashboard` - Get dashboard stats

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/emission-factors` - List emission factors
- `POST /api/admin/emission-factors` - Create emission factor
- `PUT /api/admin/emission-factors/:id` - Update emission factor
- `DELETE /api/admin/emission-factors/:id` - Delete emission factor
- `GET /api/admin/audit-logs` - View audit logs

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── services/       # Business logic
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   ├── db/             # Database migrations and seeds
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Creating First Admin User

After seeding the database, you can create an admin user manually or modify the seed script. To manually create an admin:

```sql
-- Connect to database
psql -U your_user -d ecotrip

-- Update a user to admin role
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 24-hour expiration
- Rate limiting: 100 requests per 15 minutes
- CORS restricted to frontend origin
- Helmet.js security headers
- SQL injection prevention via parameterized queries

## License

MIT
