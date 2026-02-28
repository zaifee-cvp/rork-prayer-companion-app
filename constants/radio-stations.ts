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
    streamUrl: 'https://backup.qurango.net/radio/mishary_alafasi',
    fallbackUrls: [
      'https://Qurango.net/radio/mishary',
    ],
    category: 'general',
  },
  {
    id: 'ajamy',
    name: 'Ahmad Al-Ajmy',
    nameArabic: 'إذاعة أحمد العجمي',
    streamUrl: 'https://backup.qurango.net/radio/ahmad_alajmy',
    fallbackUrls: [
      'https://Qurango.net/radio/ajamy',
    ],
    category: 'general',
  },
  {
    id: 'shuraim',
    name: 'Saud Al-Shuraim',
    nameArabic: 'إذاعة سعود الشريم',
    streamUrl: 'https://backup.qurango.net/radio/saud_alshuraim',
    fallbackUrls: [
      'https://Qurango.net/radio/shuraim',
    ],
    category: 'general',
  },
  {
    id: 'maher',
    name: 'Maher Al-Muaiqly',
    nameArabic: 'إذاعة ماهر المعيقلي',
    streamUrl: 'https://backup.qurango.net/radio/maher_almuaiqly',
    fallbackUrls: [
      'https://Qurango.net/radio/maher',
    ],
    category: 'general',
  },
  {
    id: 'saad',
    name: 'Saad Al-Ghamdi',
    nameArabic: 'إذاعة سعد الغامدي',
    streamUrl: 'https://backup.qurango.net/radio/saad_alghamdi',
    fallbackUrls: [],
    category: 'general',
  },
  {
    id: 'idrees',
    name: 'Idrees Abkar',
    nameArabic: 'إذاعة إدريس أبكر',
    streamUrl: 'https://backup.qurango.net/radio/idrees_abkr',
    fallbackUrls: [],
    category: 'general',
  },
  {
    id: 'khalifa',
    name: 'Khalifa Al-Tunaiji',
    nameArabic: 'إذاعة خليفة الطنيجي',
    streamUrl: 'https://backup.qurango.net/radio/khalifa_altunaiji',
    fallbackUrls: [],
    category: 'general',
  },
];
