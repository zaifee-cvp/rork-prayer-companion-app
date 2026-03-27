export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  monthNameAr: string;
}

const HIJRI_MONTHS = [
  { en: 'Muharram', ar: 'محرم' },
  { en: 'Safar', ar: 'صفر' },
  { en: "Rabi' al-Awwal", ar: 'ربيع الأول' },
  { en: "Rabi' al-Thani", ar: 'ربيع الثاني' },
  { en: 'Jumada al-Ula', ar: 'جمادى الأولى' },
  { en: 'Jumada al-Thani', ar: 'جمادى الثانية' },
  { en: 'Rajab', ar: 'رجب' },
  { en: "Sha'ban", ar: 'شعبان' },
  { en: 'Ramadan', ar: 'رمضان' },
  { en: 'Shawwal', ar: 'شوال' },
  { en: "Dhul Qi'dah", ar: 'ذو القعدة' },
  { en: 'Dhul Hijjah', ar: 'ذو الحجة' },
];

export function gregorianToHijri(date: Date): HijriDate {
  const gd = date.getDate();
  const gm = date.getMonth();
  const gy = date.getFullYear();

  let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 13) / 12))) / 4)
    + Math.floor((367 * (gm - 1 - 12 * Math.floor((gm - 13) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 13) / 12)) / 100)) / 4)
    + gd - 32075;

  jd = jd - 1948440 + 10632;
  const n = Math.floor((jd - 1) / 10631);
  jd = jd - 10631 * n + 354;

  const j = Math.floor((10985 - jd) / 5316)
    * Math.floor((50 * jd) / 17719)
    + Math.floor(jd / 5670) * Math.floor((43 * jd) / 15238);

  jd = jd - Math.floor((30 - j) / 15)
    * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43)
    + 29;

  const hm = Math.floor((24 * jd) / 709);
  const hd = jd - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  const monthIdx = Math.max(0, Math.min(11, hm - 1));

  return {
    year: hy,
    month: hm,
    day: hd,
    monthName: HIJRI_MONTHS[monthIdx].en,
    monthNameAr: HIJRI_MONTHS[monthIdx].ar,
  };
}

export function formatHijriDate(hijri: HijriDate): string {
  return `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
}

export function getHijriMonthName(month: number): { en: string; ar: string } {
  return HIJRI_MONTHS[Math.max(0, Math.min(11, month - 1))];
}
