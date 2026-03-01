import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { X, Play, Pause, Radio, AlertCircle, Waves } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

const STREAM_URL = 'https://Qurango.net/radio/tarateel';

type PlayerState = 'idle' | 'loading' | 'playing' | 'error';

export default function RadioScreen() {
  const { theme, isDark } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const soundRef = useRef<Audio.Sound | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.3)).current;
  const wave3 = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (playerState === 'playing') {
      const createWaveAnimation = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 600 + delay, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 600 + delay, useNativeDriver: true }),
          ])
        );
      const a1 = createWaveAnimation(wave1, 0);
      const a2 = createWaveAnimation(wave2, 200);
      const a3 = createWaveAnimation(wave3, 100);
      a1.start();
      a2.start();
      a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    } else {
      wave1.setValue(0.3);
      wave2.setValue(0.3);
      wave3.setValue(0.3);
    }
  }, [playerState]);

  useEffect(() => {
    if (playerState === 'loading') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [playerState]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        console.log('[Radio] Cleaning up sound on unmount');
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlay = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (playerState === 'playing') {
      console.log('[Radio] Pausing stream');
      try {
        await soundRef.current?.pauseAsync();
        setPlayerState('idle');
      } catch (e) {
        console.log('[Radio] Pause error:', e);
      }
      return;
    }

    setPlayerState('loading');
    setErrorMessage('');

    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      if (soundRef.current) {
        console.log('[Radio] Unloading previous sound');
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      console.log('[Radio] Loading stream:', STREAM_URL);
      const { sound } = await Audio.Sound.createAsync(
        { uri: STREAM_URL },
        { shouldPlay: true, isLooping: false },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying) {
              setPlayerState('playing');
            } else if (status.didJustFinish) {
              setPlayerState('idle');
            }
          } else if (status.error) {
            console.log('[Radio] Playback error:', status.error);
            setPlayerState('error');
            setErrorMessage('Stream interrupted. Please try again.');
          }
        }
      );
      soundRef.current = sound;
      console.log('[Radio] Stream started successfully');
      setPlayerState('playing');
    } catch (e: any) {
      console.log('[Radio] Failed to load stream:', e);
      setPlayerState('error');
      setErrorMessage('Stream unavailable, please try again.');
    }
  }, [playerState]);

  const accentColor = isDark ? '#7BAFA2' : Colors.primary;
  const isPlaying = playerState === 'playing';
  const isLoading = playerState === 'loading';
  const isError = playerState === 'error';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
            <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
              <X size={18} color={theme.textSecondary} strokeWidth={1.8} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Live Radio</Text>
          <View style={styles.closeBg} />
        </View>

        <View style={styles.content}>
          <View style={[styles.liveChip, { backgroundColor: isPlaying ? 'rgba(220,60,60,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') }]}>
            <View style={[styles.liveDot, { backgroundColor: isPlaying ? '#DC3C3C' : theme.textTertiary }]} />
            <Text style={[styles.liveText, { color: isPlaying ? '#DC3C3C' : theme.textTertiary }]}>
              {isPlaying ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>

          <View style={styles.visualizer}>
            <Animated.View style={[styles.radioIconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.radioCircleOuter, { borderColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.06)' }]}>
                <View style={[styles.radioCircleMiddle, { borderColor: isDark ? 'rgba(107,158,145,0.12)' : 'rgba(107,158,145,0.08)' }]}>
                  <View style={[styles.radioCircleInner, { backgroundColor: isDark ? 'rgba(107,158,145,0.06)' : 'rgba(107,158,145,0.04)' }]}>
                    <Radio size={40} color={accentColor} strokeWidth={1.5} />
                  </View>
                </View>
              </View>
            </Animated.View>

            {isPlaying && (
              <View style={styles.waveContainer}>
                {[wave1, wave2, wave3, wave2, wave1].map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        backgroundColor: accentColor,
                        transform: [{ scaleY: anim }],
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Live Quran Radio
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Quran Recitation · 24/7 Broadcast
          </Text>

          <View style={[styles.sourceChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
            <Waves size={13} color={theme.textTertiary} strokeWidth={1.8} />
            <Text style={[styles.sourceText, { color: theme.textTertiary }]}>
              Source: Official public Quran radio stream
            </Text>
          </View>

          {isError && (
            <View style={[styles.errorCard, { backgroundColor: isDark ? 'rgba(212,87,78,0.1)' : 'rgba(212,87,78,0.06)' }]}>
              <AlertCircle size={18} color={Colors.danger} strokeWidth={1.8} />
              <Text style={[styles.errorText, { color: Colors.danger }]}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.playButton,
              {
                backgroundColor: isPlaying ? theme.surfaceSecondary : accentColor,
              },
            ]}
            onPress={handlePlay}
            activeOpacity={0.8}
            disabled={isLoading}
            testID="radio-play"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isDark ? '#fff' : accentColor} />
            ) : isPlaying ? (
              <Pause size={24} color={accentColor} strokeWidth={2} />
            ) : (
              <Play size={24} color="#fff" strokeWidth={2} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <Text style={[styles.playLabel, { color: theme.textTertiary }]}>
            {isLoading ? 'Connecting...' : isPlaying ? 'Tap to pause' : 'Tap to play'}
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.disclaimerCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
            <Text style={[styles.disclaimerText, { color: theme.textTertiary }]}>
              This is a live public broadcast stream. All rights belong to the original broadcaster. No audio is downloaded, cached, or recorded.
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.medium },
  closeBg: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  liveChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 32,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.semibold, letterSpacing: 1.2 },
  visualizer: { alignItems: 'center', marginBottom: 32 },
  radioIconContainer: { marginBottom: 20 },
  radioCircleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleMiddle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    height: 32,
  },
  waveBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
  },
  title: { fontFamily: fontFamily.system, fontSize: 26, fontWeight: fw.bold, letterSpacing: -0.3, textAlign: 'center' as const, marginBottom: 6 },
  subtitle: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, textAlign: 'center' as const, marginBottom: 20 },
  sourceChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 32,
  },
  sourceText: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular },
  errorCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium, flex: 1 },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  playLabel: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular },
  footer: { paddingHorizontal: 24 },
  disclaimerCard: {
    borderRadius: 12,
    padding: 14,
  },
  disclaimerText: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.regular, lineHeight: 16, textAlign: 'center' as const },
});
