CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  bin_id INT NOT NULL REFERENCES waste_bins(id) ON DELETE CASCADE,
  fill_percent FLOAT NOT NULL,
  temperature FLOAT,
  battery_level FLOAT,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_bin_id ON sensor_readings(bin_id);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);
CREATE INDEX idx_sensor_readings_bin_time ON sensor_readings(bin_id, recorded_at DESC);
