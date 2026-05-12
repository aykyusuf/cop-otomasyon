CREATE TABLE collection_routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  total_distance FLOAT,
  total_bins INT,
  estimated_duration_min INT,
  algorithm VARCHAR(30) DEFAULT 'nearest_neighbor_2opt',
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE route_stops (
  id SERIAL PRIMARY KEY,
  route_id INT NOT NULL REFERENCES collection_routes(id) ON DELETE CASCADE,
  bin_id INT NOT NULL REFERENCES waste_bins(id) ON DELETE CASCADE,
  stop_order INT NOT NULL,
  fill_at_arrival FLOAT,
  arrived_at TIMESTAMP,
  collected_at TIMESTAMP,
  UNIQUE (route_id, stop_order)
);

CREATE INDEX idx_route_stops_route_id ON route_stops(route_id);
