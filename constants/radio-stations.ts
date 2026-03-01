export interface RadioStation {
  id: string;
  name: string;
  nameArabic: string;
  streamUrl: string;
  fallbackUrls?: string[];
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
  },
  {
    id: 'quran-radio',
    name: 'Quran Radio',
    nameArabic: 'إذاعة القرآن الكريم',
    streamUrl: 'https://backup.qurango.net/radio/quran_radio',
    fallbackUrls: [
      'https://Qurango.com/radio/quran_radio',
    ],
  },
  {
    id: 'haramain',
    name: 'Al-Haramain Radio',
    nameArabic: 'إذاعة الحرمين الشريفين',
    streamUrl: 'https://backup.qurango.net/radio/haramain',
    fallbackUrls: [
      'https://Qurango.com/radio/haramain',
    ],
  },
  {
    id: 'riyadh',
    name: 'Riyadh Quran Radio',
    nameArabic: 'إذاعة الرياض',
    streamUrl: 'https://backup.qurango.net/radio/riyadh',
    fallbackUrls: [
      'https://Qurango.com/radio/riyadh',
    ],
  },
  {
    id: 'jeddah',
    name: 'Jeddah Quran Radio',
    nameArabic: 'إذاعة جدة',
    streamUrl: 'https://backup.qurango.net/radio/jeddah',
    fallbackUrls: [
      'https://Qurango.com/radio/jeddah',
    ],
  },
];
