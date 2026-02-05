-- Create emission_factors table for storing carbon calculation data
CREATE TABLE IF NOT EXISTS emission_factors (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN ('transport', 'accommodation', 'activity')),
  sub_category VARCHAR(100) NOT NULL,
  factor_kg_per_unit DECIMAL(10, 6) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  source VARCHAR(255) DEFAULT 'DEFRA 2023',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, sub_category)
);

-- Create indexes
CREATE INDEX idx_emission_factors_category ON emission_factors(category);
CREATE INDEX idx_emission_factors_active ON emission_factors(is_active);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_emission_factors_updated_at BEFORE UPDATE ON emission_factors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
