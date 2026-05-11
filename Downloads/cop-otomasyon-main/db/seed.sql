-- Kampus Atik Kutulari Seed Verisi
-- 6 Bolge: Muhendislik, Fen, Edebiyat, Yemekhane, Kutuphane, Spor
-- Koordinatlar: CRS.Simple piksel sistemi (0-1000 x, 0-700 y)

-- Muhendislik Fakultesi (sol ust)
INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, current_fill_percent) VALUES
('MUH-01', 150, 120, 'general', 'muhendislik', 12),
('MUH-02', 180, 100, 'recyclable', 'muhendislik', 35),
('MUH-03', 130, 160, 'organic', 'muhendislik', 58),
('MUH-04', 200, 140, 'general', 'muhendislik', 22),
('MUH-05', 160, 180, 'hazardous', 'muhendislik', 7);

-- Fen Fakultesi (sag ust)
INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, current_fill_percent) VALUES
('FEN-01', 150, 550, 'general', 'fen', 45),
('FEN-02', 120, 600, 'recyclable', 'fen', 67),
('FEN-03', 180, 580, 'organic', 'fen', 15),
('FEN-04', 140, 520, 'general', 'fen', 82),
('FEN-05', 170, 640, 'hazardous', 'fen', 30);

-- Edebiyat Fakultesi (orta sol)
INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, current_fill_percent) VALUES
('EDB-01', 350, 150, 'general', 'edebiyat', 55),
('EDB-02', 380, 120, 'recyclable', 'edebiyat', 20),
('EDB-03', 320, 180, 'organic', 'edebiyat', 73),
('EDB-04', 370, 200, 'general', 'edebiyat', 40);

-- Yemekhane (orta)
INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, current_fill_percent) VALUES
('YMK-01', 350, 450, 'organic', 'yemekhane', 88),
('YMK-02', 330, 480, 'general', 'yemekhane', 65),
('YMK-03', 370, 420, 'recyclable', 'yemekhane', 50),
('YMK-04', 360, 500, 'organic', 'yemekhane', 92),
('YMK-05', 340, 440, 'general', 'yemekhane', 71);

-- Kutuphane (alt sol)
INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, current_fill_percent) VALUES
('KTP-01', 530, 200, 'general', 'kutuphane', 18),
('KTP-02', 560, 170, 'recyclable', 'kutuphane', 42),
('KTP-03', 510, 230, 'organic', 'kutuphane', 10),
('KTP-04', 550, 250, 'recyclable', 'kutuphane', 33);

-- Spor Tesisleri (alt sag)
INSERT INTO waste_bins (name, latitude, longitude, waste_type, zone, current_fill_percent) VALUES
('SPR-01', 550, 600, 'general', 'spor', 60),
('SPR-02', 580, 560, 'recyclable', 'spor', 25),
('SPR-03', 520, 630, 'organic', 'spor', 48),
('SPR-04', 570, 650, 'general', 'spor', 38);

-- Kullanicilar
INSERT INTO users (name, role, total_collections, total_points) VALUES
('Ahmet Yilmaz', 'admin', 0, 0),
('Ayse Demir', 'collector', 45, 1350),
('Mehmet Kaya', 'collector', 32, 960);
