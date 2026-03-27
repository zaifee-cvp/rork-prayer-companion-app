import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { getAzanSound } from '@/constants/azan-sounds';

let currentSound: Audio.Sound | null = null;
let isPlaying = false;

export async function playAzan(soundId: string): Promise<void> {
  console.log('[Azan] Playing azan:', soundId);

  try {
    await stopAzan();

    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    }

    const azanSound = getAzanSound(soundId);
    console.log('[Azan] Loading sound from:', azanSound.url);

    const { sound } = await Audio.Sound.createAsync(
      { uri: azanSound.url },
      { shouldPlay: true, volume: 1.0 },
    );

    currentSound = sound;
    isPlaying = true;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        console.log('[Azan] Playback finished');
        isPlaying = false;
        sound.unloadAsync().catch(() => {});
        currentSound = null;
      }
    });

    console.log('[Azan] Playback started successfully');
  } catch (error) {
    console.log('[Azan] Error playing azan:', error);
    isPlaying = false;
    currentSound = null;
    throw error;
  }
}

export async function stopAzan(): Promise<void> {
  if (currentSound) {
    try {
      console.log('[Azan] Stopping current playback');
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (e) {
      console.log('[Azan] Error stopping azan:', e);
    }
    currentSound = null;
    isPlaying = false;
  }
}

export function isAzanPlaying(): boolean {
  return isPlaying;
}
