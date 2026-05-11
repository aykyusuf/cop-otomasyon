CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) DEFAULT 'collector' CHECK (role IN ('admin', 'collector', 'viewer')),
  total_collections INT DEFAULT 0,
  total_points INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
