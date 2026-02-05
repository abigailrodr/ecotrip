-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  interests JSONB NOT NULL DEFAULT '[]',
  travel_style VARCHAR(50),
  accommodation_preference VARCHAR(50),
  transport_preference VARCHAR(50),
  itinerary JSONB,
  total_carbon_kg DECIMAL(10, 2) DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  green_score INTEGER DEFAULT 0 CHECK (green_score >= 0 AND green_score <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_trips_destination ON trips(destination);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
