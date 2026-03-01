export interface AzanSound {
  id: string;
  name: string;
  reciter: string;
  url: string;
  duration: string;
}

export const AZAN_SOUNDS: AzanSound[] = [
  {
    id: 'makkah',
    name: 'Makkah Azan',
    reciter: 'Ali Ahmed Mulla',
    url: 'https://media.sd.ma/assabile/adhan_3435370/20e63600a8d0.mp3',
    duration: '3:30',
  },
  {
    id: 'madinah',
    name: 'Madinah Azan',
    reciter: 'Essam Bukhari',
    url: 'https://media.sd.ma/assabile/adhan_3435370/58543fa26b97.mp3',
    duration: '3:15',
  },
  {
    id: 'alaqsa',
    name: 'Al-Aqsa Azan',
    reciter: 'Al-Aqsa Mosque',
    url: 'https://media.sd.ma/assabile/adhan_3435370/4dda3e52db7e.mp3',
    duration: '3:20',
  },
  {
    id: 'mishary',
    name: 'Mishary Rashid',
    reciter: 'Mishary Rashid Alafasy',
    url: 'https://server8.mp3quran.net/afs/Adhan.mp3',
    duration: '4:00',
  },
];

export const DEFAULT_AZAN_SOUND_ID = 'makkah';

export function getAzanSound(id: string): AzanSound {
  return AZAN_SOUNDS.find((s) => s.id === id) || AZAN_SOUNDS[0];
}
