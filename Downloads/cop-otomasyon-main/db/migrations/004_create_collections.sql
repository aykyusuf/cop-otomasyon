CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  bin_id INT NOT NULL REFERENCES waste_bins(id) ON DELETE CASCADE,
  route_id INT REFERENCES collection_routes(id) ON DELETE SET NULL,
  fill_at_collection FLOAT NOT NULL,
  collected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collections_bin_id ON collections(bin_id);
CREATE INDEX idx_collections_collected_at ON collections(collected_at DESC);
