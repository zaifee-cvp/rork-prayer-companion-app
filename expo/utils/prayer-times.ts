export interface CalculationMethod {
  name: string;
  params: { fajr: number; isha: number; ishaMinutes?: number; maghrib?: number };
}

export const CALCULATION_METHODS: Record<string, CalculationMethod> = {
  MWL: { name: 'Muslim World League', params: { fajr: 18, isha: 17 } },
  ISNA: { name: 'Islamic Society of North America', params: { fajr: 15, isha: 15 } },
  Egypt: { name: 'Egyptian General Authority', params: { fajr: 19.5, isha: 17.5 } },
  Makkah: { name: 'Umm al-Qura, Makkah', params: { fajr: 18.5, isha: 0, ishaMinutes: 90 } },
  Karachi: { name: 'University of Islamic Sciences, Karachi', params: { fajr: 18, isha: 18 } },
  Tehran: { name: 'Institute of Geophysics, Tehran', params: { fajr: 17.7, isha: 14, maghrib: 4.5 } },
  JAKIM: { name: 'JAKIM, Malaysia', params: { fajr: 20, isha: 18 } },
  Singapore: { name: 'MUIS, Singapore', params: { fajr: 20, isha: 18 } },
  Turkey: { name: 'Diyanet, Turkey', params: { fajr: 18, isha: 17 } },
  France: { name: 'UOIF, France', params: { fajr: 12, isha: 12 } },
};

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function sin(d: number) { return Math.sin(d * DEG); }
function cos(d: number) { return Math.cos(d * DEG); }
function tan(d: number) { return Math.tan(d * DEG); }
function asin(x: number) { return Math.asin(x) * RAD; }
function acos(x: number) { return Math.acos(Math.max(-1, Math.min(1, x))) * RAD; }
function atan2(y: number, x: number) { return Math.atan2(y, x) * RAD; }
function acot(x: number) { return Math.atan(1 / x) * RAD; }

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * sin(g) + 0.020 * sin(2 * g)) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
  const d = asin(sin(e) * sin(L));
  const EqT = q / 15 - fixHour(RA);
  return { declination: d, equationOfTime: EqT };
}

function fixHour(a: number): number {
  a = a - 24 * Math.floor(a / 24);
  return a < 0 ? a + 24 : a;
}

function hourAngle(lat: number, decl: number, angle: number): number {
  return acos((-sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl))) / 15;
}

function asrTime(factor: number, lat: number, decl: number): number {
  const a = acot(factor + tan(Math.abs(lat - decl)));
  return acos((sin(a) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl))) / 15;
}

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  timezoneOffset: number,
  methodKey: string,
  madhab: 'hanafi' | 'shafi',
  adjustments: Record<string, number> = {},
  highLatRule: 'middle' | 'seventh' | 'angle' = 'middle',
): PrayerTimesResult {
  const method = CALCULATION_METHODS[methodKey] || CALCULATION_METHODS['MWL'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = julianDate(year, month, day);
  const { declination, equationOfTime } = sunPosition(jd);

  const transit = 12 + timezoneOffset - lng / 15 - equationOfTime;

  const dhuhr = transit + (adjustments['dhuhr'] || 0) / 60;
  const sunrise = transit - hourAngle(lat, declination, 0.833) + (adjustments['sunrise'] || 0) / 60;
  const maghrib = transit + hourAngle(lat, declination, method.params.maghrib ?? 0.833) + (adjustments['maghrib'] || 0) / 60;

  let fajr = transit - hourAngle(lat, declination, method.params.fajr) + (adjustments['fajr'] || 0) / 60;
  let isha: number;

  if (method.params.ishaMinutes) {
    isha = maghrib + method.params.ishaMinutes / 60 + (adjustments['isha'] || 0) / 60;
  } else {
    isha = transit + hourAngle(lat, declination, method.params.isha) + (adjustments['isha'] || 0) / 60;
  }

  const asrFactor = madhab === 'hanafi' ? 2 : 1;
  const asr = transit + asrTime(asrFactor, lat, declination) + (adjustments['asr'] || 0) / 60;

  if (lat > 48 || lat < -48) {
    const nightPortion = getNightPortion(highLatRule, method.params.fajr);
    const nightTime = 24 - (maghrib - sunrise);

    if (isNaN(fajr) || fajr > sunrise) {
      fajr = sunrise - nightPortion * nightTime;
    }
    if (isNaN(isha) || isha < maghrib) {
      const ishaPortion = method.params.ishaMinutes
        ? 0.5
        : getNightPortion(highLatRule, method.params.isha);
      isha = maghrib + ishaPortion * nightTime;
    }
  }

  const toDate = (hours: number): Date => {
    const h = fixHour(hours);
    const totalMinutes = Math.round(h * 60);
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setMinutes(totalMinutes);
    return result;
  };

  return {
    fajr: toDate(fajr),
    sunrise: toDate(sunrise),
    dhuhr: toDate(dhuhr),
    asr: toDate(asr),
    maghrib: toDate(maghrib),
    isha: toDate(isha),
  };
}

function getNightPortion(rule: string, angle: number): number {
  switch (rule) {
    case 'seventh': return 1 / 7;
    case 'angle': return angle / 60;
    default: return 0.5;
  }
}

export function getTimezoneOffsetHours(timezone?: string): number {
  if (!timezone) {
    return -new Date().getTimezoneOffset() / 60;
  }
  try {
    const now = new Date();
    const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = now.toLocaleString('en-US', { timeZone: timezone });
    const utcDate = new Date(utcStr);
    const tzDate = new Date(tzStr);
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return -new Date().getTimezoneOffset() / 60;
  }
}

export function formatTime(date: Date, use24h: boolean = false): string {
  if (use24h) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${period}`;
}

export function getNextPrayer(times: PrayerTimesResult, now: Date): { name: PrayerName; time: Date } | null {
  const prayers: { name: PrayerName; time: Date }[] = [
    { name: 'fajr', time: times.fajr },
    { name: 'sunrise', time: times.sunrise },
    { name: 'dhuhr', time: times.dhuhr },
    { name: 'asr', time: times.asr },
    { name: 'maghrib', time: times.maghrib },
    { name: 'isha', time: times.isha },
  ];

  for (const prayer of prayers) {
    if (prayer.time > now) return prayer;
  }
  return null;
}

export function getTimeUntil(target: Date, now: Date): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}

export const PRAYER_DISPLAY_NAMES: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};
