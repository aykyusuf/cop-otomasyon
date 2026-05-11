CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  bin_id INT NOT NULL REFERENCES waste_bins(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('high_fill', 'overflow', 'high_temp', 'low_battery', 'offline')),
  message TEXT,
  severity VARCHAR(10) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_bin_id ON alerts(bin_id);
CREATE INDEX idx_alerts_unresolved ON alerts(is_resolved, created_at DESC) WHERE is_resolved = FALSE;
