import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import {
  Play,
  Pause,
  Radio,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

const STATION = {
  name: 'Quran Radio',
  reciter: 'Saad Al-Ghamdi',
  streamUrl: 'https://backup.qurango.net/radio/tarateel',
  description: '24/7 Quran Recitation',
};

export default function RadioScreen() {
  const { theme, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.5)).current;
  const waveAnim3 = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();

      const wave1 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(waveAnim1, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      const wave2 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      const wave3 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(waveAnim3, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      );
      wave1.start();
      wave2.start();
      wave3.start();

      return () => {
        pulse.stop();
        wave1.stop();
        wave2.stop();
        wave3.stop();
        pulseAnim.setValue(1);
        waveAnim1.setValue(0.3);
        waveAnim2.setValue(0.5);
        waveAnim3.setValue(0.4);
      };
    } else {
      pulseAnim.setValue(1);
      waveAnim1.setValue(0.3);
      waveAnim2.setValue(0.5);
      waveAnim3.setValue(0.4);
    }
  }, [isPlaying]);

  const startStream = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[Radio] Starting stream...');

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: STATION.streamUrl },
        { shouldPlay: true, volume: 1.0 },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying) {
              setIsPlaying(true);
              setIsLoading(false);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
          if (!status.isLoaded && 'error' in status && status.error) {
            console.log('[Radio] Playback error:', status.error);
            setError('Stream connection lost. Tap play to reconnect.');
            setIsPlaying(false);
            setIsLoading(false);
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoading(false);
      console.log('[Radio] Stream started successfully');
    } catch (err) {
      console.log('[Radio] Error starting stream:', err);
      setError('Could not connect to radio. Please try again.');
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, []);

  const stopStream = useCallback(async () => {
    try {
      console.log('[Radio] Stopping stream...');
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    } catch (err) {
      console.log('[Radio] Error stopping stream:', err);
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(async () => {
    if (soundRef.current) {
      const newMuted = !isMuted;
      await soundRef.current.setVolumeAsync(newMuted ? 0 : 1);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const handlePlayPause = useCallback(() => {
    if (isLoading) return;
    if (isPlaying) {
      stopStream();
    } else {
      startStream();
    }
  }, [isPlaying, isLoading, startStream, stopStream]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().then(() => {
          soundRef.current?.unloadAsync();
        }).catch(() => {});
      }
    };
  }, []);

  const waveBarHeight1 = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [8, 28] });
  const waveBarHeight2 = waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [8, 36] });
  const waveBarHeight3 = waveAnim3.interpolate({ inputRange: [0, 1], outputRange: [8, 22] });

  return (
    <Animated.View style={[styles.root, { backgroundColor: theme.background, opacity: fadeAnim }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="radio-close">
          <X size={22} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quran Radio</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.visualizer}>
          <Animated.View style={[styles.radioIconContainer, {
            backgroundColor: isDark ? 'rgba(107,158,145,0.12)' : 'rgba(107,158,145,0.08)',
            transform: [{ scale: pulseAnim }],
          }]}>
            <View style={[styles.radioIconInner, {
              backgroundColor: isDark ? 'rgba(107,158,145,0.2)' : 'rgba(107,158,145,0.14)',
            }]}>
              <Radio size={40} color={Colors.primary} strokeWidth={1.5} />
            </View>
          </Animated.View>

          {isPlaying && (
            <View style={styles.waveContainer}>
              <Animated.View style={[styles.waveBar, { height: waveBarHeight1, backgroundColor: Colors.primary, opacity: 0.6 }]} />
              <Animated.View style={[styles.waveBar, { height: waveBarHeight2, backgroundColor: Colors.primary, opacity: 0.8 }]} />
              <Animated.View style={[styles.waveBar, { height: waveBarHeight3, backgroundColor: Colors.primary, opacity: 0.5 }]} />
              <Animated.View style={[styles.waveBar, { height: waveBarHeight1, backgroundColor: Colors.primary, opacity: 0.7 }]} />
              <Animated.View style={[styles.waveBar, { height: waveBarHeight2, backgroundColor: Colors.primary, opacity: 0.4 }]} />
            </View>
          )}
        </View>

        <View style={styles.stationInfo}>
          <Text style={[styles.stationName, { color: theme.text }]}>{STATION.name}</Text>
          <Text style={[styles.reciterName, { color: Colors.primary }]}>{STATION.reciter}</Text>
          <Text style={[styles.stationDesc, { color: theme.textTertiary }]}>{STATION.description}</Text>

          {isPlaying && (
            <View style={[styles.liveBadge, { backgroundColor: isDark ? 'rgba(107,158,145,0.15)' : 'rgba(107,158,145,0.1)' }]}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveText, { color: Colors.primary }]}>LIVE</Text>
            </View>
          )}
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(212,87,78,0.1)' : 'rgba(212,87,78,0.06)' }]}>
            <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={toggleMute}
            style={[styles.secondaryBtn, { backgroundColor: theme.surface }]}
            disabled={!isPlaying}
            activeOpacity={0.7}
          >
            {isMuted ? (
              <VolumeX size={20} color={isPlaying ? theme.textSecondary : theme.textTertiary} strokeWidth={1.8} />
            ) : (
              <Volume2 size={20} color={isPlaying ? theme.textSecondary : theme.textTertiary} strokeWidth={1.8} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.playBtn, { backgroundColor: Colors.primary }]}
            activeOpacity={0.8}
            testID="radio-play"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isPlaying ? (
              <Pause size={32} color="#fff" strokeWidth={2} fill="#fff" />
            ) : (
              <Play size={32} color="#fff" strokeWidth={2} fill="#fff" />
            )}
          </TouchableOpacity>

          <View style={{ width: 48 }} />
        </View>

        <Text style={[styles.freeLabel, { color: theme.textTertiary }]}>
          Free · No ads
        </Text>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  visualizer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  radioIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioIconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
    marginTop: 24,
    height: 40,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  stationInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stationName: {
    fontFamily: fontFamily.system,
    fontSize: 26,
    fontWeight: fw.bold,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  reciterName: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.medium,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  stationDesc: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.semibold,
    letterSpacing: 1,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
  },
  controls: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  freeLabel: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    letterSpacing: 0.3,
  },
});
