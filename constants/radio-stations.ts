export interface RadioStation {
  id: string;
  name: string;
  nameArabic: string;
  streamUrl: string;
  fallbackUrls?: string[];
  category: 'general';
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'tarateel',
    name: 'Quran Tarateel',
    nameArabic: 'إذاعة التراتيل',
    streamUrl: 'https://Qurango.net/radio/tarateel',
    fallbackUrls: [
      'https://backup.qurango.net/radio/tarateel',
    ],
    category: 'general',
  },
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    nameArabic: 'إذاعة مشاري العفاسي',
    streamUrl: 'https://Qurango.net/radio/mishary',
    fallbackUrls: [
      'https://backup.qurango.net/radio/mishary',
    ],
    category: 'general',
  },
  {
    id: 'sudais',
    name: 'Abdul Rahman Al-Sudais',
    nameArabic: 'إذاعة عبدالرحمن السديس',
    streamUrl: 'https://Qurango.net/radio/sudais',
    fallbackUrls: [
      'https://backup.qurango.net/radio/sudais',
    ],
    category: 'general',
  },
  {
    id: 'shuraim',
    name: 'Saud Al-Shuraim',
    nameArabic: 'إذاعة سعود الشريم',
    streamUrl: 'https://Qurango.net/radio/shuraim',
    fallbackUrls: [
      'https://backup.qurango.net/radio/shuraim',
    ],
    category: 'general',
  },
  {
    id: 'ajamy',
    name: 'Ahmed Al-Ajamy',
    nameArabic: 'إذاعة أحمد العجمي',
    streamUrl: 'https://Qurango.net/radio/ajamy',
    fallbackUrls: [
      'https://backup.qurango.net/radio/ajamy',
    ],
    category: 'general',
  },
  {
    id: 'maher',
    name: 'Maher Al-Muaiqly',
    nameArabic: 'إذاعة ماهر المعيقلي',
    streamUrl: 'https://Qurango.net/radio/maher',
    fallbackUrls: [
      'https://backup.qurango.net/radio/maher',
    ],
    category: 'general',
  },
];
