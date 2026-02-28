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
    streamUrl: 'https://backup.qurango.net/radio/tarateel',
    fallbackUrls: [
      'https://Qurango.com/radio/tarateel',
      'https://backup.qurango.com/radio/tarateel',
    ],
    category: 'general',
  },
];
