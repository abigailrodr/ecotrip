-- Create expenses table (for future FR8 implementation)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('transport', 'accommodation', 'food', 'activities', 'shopping', 'other')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
