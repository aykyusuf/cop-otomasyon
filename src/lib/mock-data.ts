import { WasteBin } from "@/types";

export const MOCK_BINS: WasteBin[] = [
  // Mühendislik Fakültesi
  { id: 1, name: 'MUH-01', latitude: 150, longitude: 120, waste_type: 'general', zone: 'muhendislik', current_fill_percent: 12, temperature: 22, battery_level: 80, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 2, name: 'MUH-02', latitude: 180, longitude: 100, waste_type: 'recyclable', zone: 'muhendislik', current_fill_percent: 35, temperature: 23, battery_level: 85, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 3, name: 'MUH-03', latitude: 130, longitude: 160, waste_type: 'organic', zone: 'muhendislik', current_fill_percent: 58, temperature: 24, battery_level: 90, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 4, name: 'MUH-04', latitude: 200, longitude: 140, waste_type: 'general', zone: 'muhendislik', current_fill_percent: 22, temperature: 21, battery_level: 70, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 5, name: 'MUH-05', latitude: 160, longitude: 180, waste_type: 'hazardous', zone: 'muhendislik', current_fill_percent: 7, temperature: 20, battery_level: 95, status: 'normal', created_at: new Date(), updated_at: new Date() },

  // Fen Fakültesi
  { id: 6, name: 'FEN-01', latitude: 150, longitude: 550, waste_type: 'general', zone: 'fen', current_fill_percent: 45, temperature: 22, battery_level: 88, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 7, name: 'FEN-02', latitude: 120, longitude: 600, waste_type: 'recyclable', zone: 'fen', current_fill_percent: 67, temperature: 23, battery_level: 75, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 8, name: 'FEN-03', latitude: 180, longitude: 580, waste_type: 'organic', zone: 'fen', current_fill_percent: 15, temperature: 21, battery_level: 92, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 9, name: 'FEN-04', latitude: 140, longitude: 520, waste_type: 'general', zone: 'fen', current_fill_percent: 82, temperature: 24, battery_level: 60, status: 'critical', created_at: new Date(), updated_at: new Date() },
  { id: 10, name: 'FEN-05', latitude: 170, longitude: 640, waste_type: 'hazardous', zone: 'fen', current_fill_percent: 30, temperature: 22, battery_level: 80, status: 'normal', created_at: new Date(), updated_at: new Date() },

  // Edebiyat Fakültesi
  { id: 11, name: 'EDB-01', latitude: 350, longitude: 150, waste_type: 'general', zone: 'edebiyat', current_fill_percent: 55, temperature: 23, battery_level: 85, status: 'warning', created_at: new Date(), updated_at: new Date() },
  { id: 12, name: 'EDB-02', latitude: 380, longitude: 120, waste_type: 'recyclable', zone: 'edebiyat', current_fill_percent: 20, temperature: 22, battery_level: 90, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 13, name: 'EDB-03', latitude: 320, longitude: 180, waste_type: 'organic', zone: 'edebiyat', current_fill_percent: 73, temperature: 25, battery_level: 70, status: 'warning', created_at: new Date(), updated_at: new Date() },
  { id: 14, name: 'EDB-04', latitude: 370, longitude: 200, waste_type: 'general', zone: 'edebiyat', current_fill_percent: 40, temperature: 21, battery_level: 88, status: 'normal', created_at: new Date(), updated_at: new Date() },

  // Yemekhane
  { id: 15, name: 'YMK-01', latitude: 350, longitude: 450, waste_type: 'organic', zone: 'yemekhane', current_fill_percent: 88, temperature: 26, battery_level: 50, status: 'critical', created_at: new Date(), updated_at: new Date() },
  { id: 16, name: 'YMK-02', latitude: 330, longitude: 480, waste_type: 'general', zone: 'yemekhane', current_fill_percent: 65, temperature: 25, battery_level: 65, status: 'warning', created_at: new Date(), updated_at: new Date() },
  { id: 17, name: 'YMK-03', latitude: 370, longitude: 420, waste_type: 'recyclable', zone: 'yemekhane', current_fill_percent: 50, temperature: 24, battery_level: 70, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 18, name: 'YMK-04', latitude: 360, longitude: 500, waste_type: 'organic', zone: 'yemekhane', current_fill_percent: 92, temperature: 27, battery_level: 20, status: 'critical', created_at: new Date(), updated_at: new Date() },
  { id: 19, name: 'YMK-05', latitude: 340, longitude: 440, waste_type: 'general', zone: 'yemekhane', current_fill_percent: 71, temperature: 22, battery_level: 85, status: 'warning', created_at: new Date(), updated_at: new Date() },

  // Kütüphane
  { id: 20, name: 'KTP-01', latitude: 530, longitude: 200, waste_type: 'general', zone: 'kutuphane', current_fill_percent: 18, temperature: 21, battery_level: 95, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 21, name: 'KTP-02', latitude: 560, longitude: 170, waste_type: 'recyclable', zone: 'kutuphane', current_fill_percent: 42, temperature: 22, battery_level: 88, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 22, name: 'KTP-03', latitude: 510, longitude: 230, waste_type: 'organic', zone: 'kutuphane', current_fill_percent: 10, temperature: 20, battery_level: 98, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 23, name: 'KTP-04', latitude: 550, longitude: 250, waste_type: 'recyclable', zone: 'kutuphane', current_fill_percent: 33, temperature: 23, battery_level: 90, status: 'normal', created_at: new Date(), updated_at: new Date() },

  // Spor Tesisleri
  { id: 24, name: 'SPR-01', latitude: 550, longitude: 600, waste_type: 'general', zone: 'spor', current_fill_percent: 60, temperature: 24, battery_level: 75, status: 'warning', created_at: new Date(), updated_at: new Date() },
  { id: 25, name: 'SPR-02', latitude: 580, longitude: 560, waste_type: 'recyclable', zone: 'spor', current_fill_percent: 25, temperature: 22, battery_level: 85, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 26, name: 'SPR-03', latitude: 520, longitude: 630, waste_type: 'organic', zone: 'spor', current_fill_percent: 48, temperature: 23, battery_level: 80, status: 'normal', created_at: new Date(), updated_at: new Date() },
  { id: 27, name: 'SPR-04', latitude: 570, longitude: 650, waste_type: 'general', zone: 'spor', current_fill_percent: 38, temperature: 21, battery_level: 92, status: 'normal', created_at: new Date(), updated_at: new Date() }
];
