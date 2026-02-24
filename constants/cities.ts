export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

const cities: City[] = [
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, timezone: 'Asia/Riyadh' },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.4672, lng: 39.6112, timezone: 'Asia/Riyadh' },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, timezone: 'Asia/Riyadh' },
  { name: 'Jeddah', country: 'Saudi Arabia', lat: 21.5433, lng: 39.1728, timezone: 'Asia/Riyadh' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773, timezone: 'Asia/Dubai' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul' },
  { name: 'Ankara', country: 'Turkey', lat: 39.9334, lng: 32.8597, timezone: 'Europe/Istanbul' },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, timezone: 'Asia/Jakarta' },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479, timezone: 'Asia/Karachi' },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, timezone: 'Asia/Karachi' },
  { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587, timezone: 'Asia/Karachi' },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, timezone: 'Asia/Dhaka' },
  { name: 'Amman', country: 'Jordan', lat: 31.9454, lng: 35.9284, timezone: 'Asia/Amman' },
  { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lng: 44.3661, timezone: 'Asia/Baghdad' },
  { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.389, timezone: 'Asia/Tehran' },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.531, timezone: 'Asia/Qatar' },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lng: 47.9774, timezone: 'Asia/Kuwait' },
  { name: 'Muscat', country: 'Oman', lat: 23.5880, lng: 58.3829, timezone: 'Asia/Muscat' },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898, timezone: 'Africa/Casablanca' },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815, timezone: 'Africa/Tunis' },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405, timezone: 'Europe/Berlin' },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, timezone: 'America/New_York' },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
  { name: 'Beirut', country: 'Lebanon', lat: 33.8938, lng: 35.5018, timezone: 'Asia/Beirut' },
  { name: 'Damascus', country: 'Syria', lat: 33.5138, lng: 36.2765, timezone: 'Asia/Damascus' },
  { name: 'Rabat', country: 'Morocco', lat: 34.0209, lng: -6.8416, timezone: 'Africa/Casablanca' },
  { name: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588, timezone: 'Africa/Algiers' },
  { name: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913, timezone: 'Africa/Tripoli' },
  { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lng: 32.5599, timezone: 'Africa/Khartoum' },
  { name: 'Mogadishu', country: 'Somalia', lat: 2.0469, lng: 45.3182, timezone: 'Africa/Mogadishu' },
  { name: 'Sarajevo', country: 'Bosnia', lat: 43.8563, lng: 18.4131, timezone: 'Europe/Sarajevo' },
];

export default cities;
