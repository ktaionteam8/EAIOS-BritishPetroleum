-- Refiner AI — Seed Data: Refineries
-- 40 global sites across 6 continents

INSERT INTO refiner_ai_refineries (name, location, country, lat, lng, status, asset_count, critical_alerts) VALUES
  ('Ruwais Refinery',         'Ruwais, Abu Dhabi',    'UAE',          24.11, 52.73, 'critical', 312, 4),
  ('Houston Refinery',        'Houston, Texas',        'USA',          29.76, -95.37,'warning',  284, 2),
  ('Ras Tanura Refinery',     'Ras Tanura',            'Saudi Arabia', 26.65, 50.16, 'warning',  198, 1),
  ('Jamnagar Refinery',       'Jamnagar, Gujarat',     'India',        22.47, 70.06, 'healthy',  421, 0),
  ('Rotterdam Refinery',      'Rotterdam',             'Netherlands',  51.90, 4.48,  'healthy',  176, 0),
  ('Whiting Refinery',        'Whiting, Indiana',      'USA',          41.68, -87.49,'healthy',  203, 0),
  ('Pulau Bukom Refinery',    'Pulau Bukom',           'Singapore',    1.22,  103.77,'healthy',  189, 0),
  ('Mongstad Refinery',       'Mongstad',              'Norway',       60.81, 5.04,  'healthy',  145, 0),
  ('Kwinana Refinery',        'Kwinana, WA',           'Australia',   -32.24, 115.79,'healthy',  112, 0),
  ('Cherry Point Refinery',   'Cherry Point, WA',      'USA',          48.86, -122.75,'healthy', 167, 0);
