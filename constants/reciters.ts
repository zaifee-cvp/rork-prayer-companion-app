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

export function getAudioUrl(reciterFolder: string, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${reciterFolder}/${s}${a}.mp3`;
}
