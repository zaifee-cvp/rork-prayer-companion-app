export interface Reciter {
  id: string;
  name: string;
  nameArabic: string;
  folder: string;
}

export const RECITERS: Reciter[] = [
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', nameArabic: 'مشاري راشد العفاسي', folder: 'Alafasy_128kbps' },
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)', nameArabic: 'عبد الباسط عبد الصمد', folder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', nameArabic: 'محمود خليل الحصري', folder: 'Husary_128kbps' },
  { id: 'minshawi', name: 'Al-Minshawi (Murattal)', nameArabic: 'محمد صديق المنشاوي', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'shuraim', name: 'Saud Al-Shuraim', nameArabic: 'سعود الشريم', folder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'sudais', name: 'Abdur-Rahman As-Sudais', nameArabic: 'عبدالرحمن السديس', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
];

export function getReciterById(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

export const RECITER_AUDIO_DISABLED = true;
export const RECITER_AUDIO_MESSAGE = 'Audio temporarily unavailable';

export function getAudioUrl(_reciterFolder: string, _surah: number, _ayah: number): string {
  return '';
}
