export interface RadioStation {
  id: string;
  name: string;
  nameArabic: string;
  streamUrl: string;
  fallbackUrls?: string[];
  category: 'reciter' | 'general';
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
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    nameArabic: 'مشاري العفاسي',
    streamUrl: 'https://backup.qurango.net/radio/mishary_alafasy',
    category: 'reciter',
  },
  {
    id: 'sudais',
    name: 'Abdur-Rahman As-Sudais',
    nameArabic: 'عبدالرحمن السديس',
    streamUrl: 'https://backup.qurango.net/radio/abdurrahman_alsudaes',
    category: 'reciter',
  },
  {
    id: 'shatri',
    name: 'Abu Bakr Al-Shatri',
    nameArabic: 'أبو بكر الشاطري',
    streamUrl: 'https://backup.qurango.net/radio/shaik_abu_bakr_al_shatri',
    category: 'reciter',
  },
  {
    id: 'ajmy',
    name: 'Ahmad Al-Ajmy',
    nameArabic: 'أحمد العجمي',
    streamUrl: 'https://backup.qurango.net/radio/ahmad_alajmy',
    category: 'reciter',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdul Samad',
    nameArabic: 'عبد الباسط عبد الصمد',
    streamUrl: 'https://backup.qurango.net/radio/abdulbasit',
    category: 'reciter',
  },
  {
    id: 'idrees',
    name: 'Idrees Abkar',
    nameArabic: 'إدريس أبكر',
    streamUrl: 'https://backup.qurango.net/radio/idrees_abkr',
    category: 'reciter',
  },
  {
    id: 'maher',
    name: 'Maher Al-Muaiqly',
    nameArabic: 'ماهر المعيقلي',
    streamUrl: 'https://backup.qurango.net/radio/maher_almuaiqly',
    category: 'reciter',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameArabic: 'محمود خليل الحصري',
    streamUrl: 'https://backup.qurango.net/radio/husary',
    category: 'reciter',
  },
  {
    id: 'minshawi',
    name: 'Muhammad Siddiq Al-Minshawi',
    nameArabic: 'محمد صديق المنشاوي',
    streamUrl: 'https://backup.qurango.net/radio/minshawi',
    category: 'reciter',
  },
];
