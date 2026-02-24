import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { getAudioUrl } from '@/constants/reciters';

interface AudioState {
  currentAyah: number | null;
  isPlaying: boolean;
  isLoading: boolean;
}

interface UseQuranAudioOptions {
  surahNumber: number;
  totalVerses: number;
  reciterFolder: string;
  autoPlayNext: boolean;
}

export function useQuranAudio(options: UseQuranAudioOptions) {
  const [state, setState] = useState<AudioState>({
    currentAyah: null,
    isPlaying: false,
    isLoading: false,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const playIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    isMountedRef.current = true;

    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      }).catch((e) => console.log('[Audio] Mode setup error:', e));
    }

    return () => {
      isMountedRef.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.log('[Audio] Cleanup error:', e);
      }
      soundRef.current = null;
    }
  }, []);

  const playAyah = useCallback(async (ayahNumber: number) => {
    const thisPlayId = ++playIdRef.current;
    console.log(`[Audio] Play request: surah ${optionsRef.current.surahNumber}, ayah ${ayahNumber}`);

    await cleanup();

    if (thisPlayId !== playIdRef.current || !isMountedRef.current) return;

    setState({
      currentAyah: ayahNumber,
      isPlaying: false,
      isLoading: true,
    });

    try {
      const url = getAudioUrl(
        optionsRef.current.reciterFolder,
        optionsRef.current.surahNumber,
        ayahNumber,
      );
      console.log(`[Audio] Loading: ${url}`);

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );

      if (thisPlayId !== playIdRef.current || !isMountedRef.current) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!isMountedRef.current) return;
        if (status.isLoaded && status.didJustFinish) {
          console.log(`[Audio] Ayah ${ayahNumber} finished`);
          soundRef.current = null;

          if (
            optionsRef.current.autoPlayNext &&
            ayahNumber < optionsRef.current.totalVerses
          ) {
            playAyah(ayahNumber + 1);
          } else {
            if (isMountedRef.current) {
              setState({ currentAyah: null, isPlaying: false, isLoading: false });
            }
          }
        }
      });

      if (isMountedRef.current && thisPlayId === playIdRef.current) {
        setState({
          currentAyah: ayahNumber,
          isPlaying: true,
          isLoading: false,
        });
        console.log(`[Audio] Now playing ayah ${ayahNumber}`);
      }
    } catch (e) {
      console.log('[Audio] Play error:', e);
      if (isMountedRef.current && thisPlayId === playIdRef.current) {
        setState({ currentAyah: null, isPlaying: false, isLoading: false });
      }
    }
  }, [cleanup]);

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          if (isMountedRef.current) {
            setState((prev) => ({ ...prev, isPlaying: false }));
          }
        } else {
          await soundRef.current.playAsync();
          if (isMountedRef.current) {
            setState((prev) => ({ ...prev, isPlaying: true }));
          }
        }
      }
    } catch (e) {
      console.log('[Audio] Toggle error:', e);
    }
  }, []);

  const stop = useCallback(async () => {
    playIdRef.current++;
    await cleanup();
    if (isMountedRef.current) {
      setState({ currentAyah: null, isPlaying: false, isLoading: false });
    }
  }, [cleanup]);

  const handleAyahPress = useCallback(async (ayahNumber: number) => {
    const current = stateRef.current;
    if (current.currentAyah === ayahNumber && !current.isLoading) {
      await togglePlayback();
    } else {
      await playAyah(ayahNumber);
    }
  }, [togglePlayback, playAyah]);

  return {
    ...state,
    playAyah,
    togglePlayback,
    stop,
    handleAyahPress,
  };
}
