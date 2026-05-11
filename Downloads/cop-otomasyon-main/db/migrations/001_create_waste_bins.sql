CREATE TABLE waste_bins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  waste_type VARCHAR(50) NOT NULL CHECK (waste_type IN ('general', 'recyclable', 'organic', 'hazardous')),
  capacity_liters INT NOT NULL DEFAULT 120,
  current_fill_percent FLOAT NOT NULL DEFAULT 0,
  temperature FLOAT DEFAULT 22.0,
  battery_level FLOAT DEFAULT 100.0,
  status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical', 'collecting', 'offline')),
  zone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waste_bins_zone ON waste_bins(zone);
CREATE INDEX idx_waste_bins_status ON waste_bins(status);
