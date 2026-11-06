-- Region boundaries, coordinates, and operational constraints for admin map management

ALTER TABLE regions
    ADD COLUMN IF NOT EXISTS center_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS center_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS radius_km DOUBLE PRECISION DEFAULT 45.0,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_jobs BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS allow_workers BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS min_salary_rate BIGINT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Initial geographic center coordinates and default bounding radius (km)
UPDATE regions SET center_lat = 41.2810, center_lng = 69.2647, radius_km = 25.0 WHERE name = 'Toshkent shahri';
UPDATE regions SET center_lat = 41.2414, center_lng = 69.9547, radius_km = 65.0 WHERE name = 'Toshkent viloyati';
UPDATE regions SET center_lat = 39.9496, center_lng = 66.3267, radius_km = 60.0 WHERE name = 'Samarqand viloyati';
UPDATE regions SET center_lat = 40.7308, center_lng = 72.3217, radius_km = 40.0 WHERE name = 'Andijon viloyati';
UPDATE regions SET center_lat = 40.3259, center_lng = 71.2824, radius_km = 50.0 WHERE name = 'Farg''ona viloyati';
UPDATE regions SET center_lat = 41.0810, center_lng = 71.2988, radius_km = 45.0 WHERE name = 'Namangan viloyati';
UPDATE regions SET center_lat = 40.2101, center_lng = 63.7637, radius_km = 80.0 WHERE name = 'Buxoro viloyati';
UPDATE regions SET center_lat = 41.2733, center_lng = 61.2492, radius_km = 55.0 WHERE name = 'Xorazm viloyati';
UPDATE regions SET center_lat = 38.7610, center_lng = 66.0358, radius_km = 75.0 WHERE name = 'Qashqadaryo viloyati';
UPDATE regions SET center_lat = 38.1086, center_lng = 67.4632, radius_km = 70.0 WHERE name = 'Surxondaryo viloyati';
UPDATE regions SET center_lat = 40.3560, center_lng = 67.8337, radius_km = 60.0 WHERE name = 'Jizzax viloyati';
UPDATE regions SET center_lat = 40.5986, center_lng = 68.6314, radius_km = 45.0 WHERE name = 'Sirdaryo viloyati';
UPDATE regions SET center_lat = 41.5994, center_lng = 64.2370, radius_km = 120.0 WHERE name = 'Navoiy viloyati';
UPDATE regions SET center_lat = 43.2856, center_lng = 59.2410, radius_km = 160.0 WHERE name = 'Qoraqalpog''iston Respublikasi';
