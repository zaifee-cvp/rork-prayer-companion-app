import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  X,
  Radio,
  Play,
  Pause,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

const STREAM_URLS = [
  'https://backup.qurango.net/radio/tarateel',
  'https://Qurango.com/radio/tarateel',
  'https://stream.radiojar.com/0tpy1h0kxtzuv',
];

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function RadioScreen() {
  const { theme, isDark } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const streamIndexRef = useRef(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      stopAndUnload();
    };
  }, []);

  useEffect(() => {
    if (playerState === 'playing') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [playerState]);

  const stopAndUnload = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } catch (e) {
      console.log('[Radio] Error during cleanup:', e);
    }
  }, []);

  const tryStream = useCallback(async (urlIndex: number): Promise<boolean> => {
    if (urlIndex >= STREAM_URLS.length) return false;

    const url = STREAM_URLS[urlIndex];
    console.log(`[Radio] Trying stream ${urlIndex}: ${url}`);

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: false },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying) {
              setPlayerState('playing');
            } else if (status.isBuffering) {
              setPlayerState('loading');
            }
          } else if (status.error) {
            console.log('[Radio] Playback error:', status.error);
          }
        },
      );

      soundRef.current = sound;
      streamIndexRef.current = urlIndex;
      return true;
    } catch (e) {
      console.log(`[Radio] Stream ${urlIndex} failed:`, e);
      return tryStream(urlIndex + 1);
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (playerState === 'playing') {
      setPlayerState('paused');
      try {
        await soundRef.current?.pauseAsync();
      } catch (e) {
        console.log('[Radio] Pause error:', e);
      }
      return;
    }

    if (playerState === 'paused' && soundRef.current) {
      setPlayerState('loading');
      try {
        await soundRef.current.playAsync();
        setPlayerState('playing');
      } catch (e) {
        console.log('[Radio] Resume error:', e);
        setPlayerState('error');
        setErrorMessage('Failed to resume stream');
      }
      return;
    }

    setPlayerState('loading');
    setErrorMessage('');
    await stopAndUnload();

    const success = await tryStream(0);
    if (!success) {
      setPlayerState('error');
      setErrorMessage('Stream unavailable, please try again');
    }
  }, [playerState, stopAndUnload, tryStream]);

  const handleRetry = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPlayerState('loading');
    setErrorMessage('');
    await stopAndUnload();
    const success = await tryStream(0);
    if (!success) {
      setPlayerState('error');
      setErrorMessage('Stream unavailable, please try again');
    }
  }, [stopAndUnload, tryStream]);

  const isPlaying = playerState === 'playing';
  const isLoading = playerState === 'loading';
  const isError = playerState === 'error';

  const accentColor = isDark ? '#7BAFA2' : '#6B9E91';
  const glowColor = isDark ? 'rgba(123,175,162,0.15)' : 'rgba(107,158,145,0.1)';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => {
              stopAndUnload();
              router.back();
            }}
            hitSlop={16}
            testID="radio-close"
          >
            <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
              <X size={18} color={theme.textSecondary} strokeWidth={1.8} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Live Radio</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.playerSection}>
          <View style={[styles.iconContainer, { backgroundColor: glowColor }]}>
            <Animated.View style={[styles.iconRing, { transform: [{ scale: pulseAnim }], borderColor: isPlaying ? accentColor : 'transparent' }]}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(123,175,162,0.12)' : 'rgba(107,158,145,0.08)' }]}>
                <Radio size={48} color={accentColor} strokeWidth={1.5} />
              </View>
            </Animated.View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Live Quran Radio</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Continuous Quran recitation
          </Text>

          <View style={[styles.sourceChip, { backgroundColor: isDark ? 'rgba(196,162,101,0.08)' : 'rgba(196,162,101,0.06)' }]}>
            <Text style={[styles.sourceText, { color: Colors.gold }]}>
              Source: Official public Quran radio stream
            </Text>
          </View>

          {isPlaying && (
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, { backgroundColor: '#E74C3C' }]} />
              <Text style={[styles.liveText, { color: theme.textSecondary }]}>LIVE</Text>
            </View>
          )}

          <View style={styles.controlsSection}>
            {isError ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={32} color={Colors.danger} strokeWidth={1.5} />
                <Text style={[styles.errorText, { color: Colors.danger }]}>{errorMessage}</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: Colors.primary }]}
                  onPress={handleRetry}
                  activeOpacity={0.7}
                  testID="radio-retry"
                >
                  <RefreshCw size={16} color="#fff" strokeWidth={2} />
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.playBtn,
                  {
                    backgroundColor: isPlaying ? theme.surfaceSecondary : Colors.primary,
                    borderColor: isPlaying ? theme.border : Colors.primary,
                  },
                ]}
                onPress={handlePlay}
                activeOpacity={0.7}
                disabled={isLoading}
                testID="radio-play"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={isPlaying ? theme.text : '#fff'} />
                ) : isPlaying ? (
                  <Pause size={28} color={theme.text} strokeWidth={1.8} />
                ) : (
                  <Play size={28} color="#fff" strokeWidth={1.8} style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>
            )}

            <Text style={[styles.stateLabel, { color: theme.textTertiary }]}>
              {isLoading ? 'Connecting to stream...' : isPlaying ? 'Now Playing' : isError ? '' : 'Tap to play'}
            </Text>
          </View>
        </View>

        <View style={[styles.disclaimerContainer, { paddingBottom: insets.bottom + 16 }]}>
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
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.medium,
  },
  headerSpacer: {
    width: 34,
  },
  closeBg: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamily.system,
    fontSize: 28,
    fontWeight: fw.bold,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    marginBottom: 12,
  },
  sourceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 16,
  },
  sourceText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.medium,
  },
  liveIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.semibold,
    letterSpacing: 1.5,
  },
  controlsSection: {
    alignItems: 'center',
    marginTop: 24,
    gap: 14,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  stateLabel: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.medium,
    textAlign: 'center' as const,
  },
  retryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 15,
    fontWeight: fw.medium,
  },
  disclaimerContainer: {
    paddingHorizontal: 24,
  },
  disclaimerCard: {
    borderRadius: 12,
    padding: 14,
  },
  disclaimerText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.regular,
    lineHeight: 16,
    textAlign: 'center' as const,
  },
});
