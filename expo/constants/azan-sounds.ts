export interface AzanSound {
  id: string;
  name: string;
  reciter: string;
  url: string;
  duration: string;
}

export const AZAN_SOUNDS: AzanSound[] = [
  {
    id: 'classic',
    name: 'Classic Adhan',
    reciter: 'Public Domain',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Beautiful_adhan.ogg',
    duration: '2:34',
  },
  {
    id: 'traditional',
    name: 'Traditional Adhan',
    reciter: 'CC BY-SA 4.0',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Azan.ogg',
    duration: '3:03',
  },
];

export const DEFAULT_AZAN_SOUND_ID = 'classic';

export function getAzanSound(id: string): AzanSound {
  return AZAN_SOUNDS.find((s) => s.id === id) || AZAN_SOUNDS[0];
}
