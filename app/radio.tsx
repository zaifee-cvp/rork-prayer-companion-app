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
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Radio, Play, Pause, AlertCircle, Volume2 } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

const RADIO_STREAMS = [
  'https://Qurango.com/radio/tarateel',
  'https://stream.radiojar.com/0tpy1h0kxtzuv',
  'https://backup.qurango.com/radio/tarateel',
  'http://live.mp3quran.net:8006/;',
];

type RadioState = 'idle' | 'loading' | 'playing' | 'error';

export default function RadioScreen() {
  const { theme, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [radioState, setRadioState] = useState<RadioState>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      }).catch((e) => console.log('[Radio] Audio mode error:', e));
    }

    return () => {
      isMountedRef.current = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (radioState === 'playing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => { pulse.stop(); };
    } else {
      pulseAnim.setValue(1);
    }
  }, [radioState, pulseAnim]);

  const handlePlay = useCallback(async () => {
    if (radioState === 'loading') return;

    if (radioState === 'playing') {
      console.log('[Radio] Stopping stream');
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) { console.log('[Radio] Stop error:', e); }
        soundRef.current = null;
      }
      if (isMountedRef.current) setRadioState('idle');
      return;
    }

    setRadioState('loading');

    let loaded = false;
    for (let i = 0; i < RADIO_STREAMS.length; i++) {
      const url = RADIO_STREAMS[i];
      console.log(`[Radio] Trying stream ${i + 1}/${RADIO_STREAMS.length}:`, url);
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, isLooping: false },
        );

        if (!isMountedRef.current) { await sound.unloadAsync(); return; }
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!isMountedRef.current) return;
          if (!status.isLoaded) {
            if ('error' in status && status.error) {
              console.log('[Radio] Playback error:', status.error);
              setRadioState('error');
              soundRef.current = null;
            }
          }
        });

        if (isMountedRef.current) {
          setRadioState('playing');
          console.log('[Radio] Stream playing from:', url);
        }
        loaded = true;
        break;
      } catch (e) {
        console.log(`[Radio] Stream ${i + 1} failed:`, e);
        continue;
      }
    }

    if (!loaded && isMountedRef.current) {
      console.log('[Radio] All streams failed');
      setRadioState('error');
    }
  }, [radioState]);

  const handleRetry = useCallback(() => {
    console.log('[Radio] Retrying stream');
    setRadioState('idle');
  }, []);

  const waveAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (radioState === 'playing') {
      const animations = waveAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.7 + Math.random() * 0.3,
              duration: 400 + i * 120,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.2,
              duration: 500 + i * 100,
              useNativeDriver: true,
            }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => { animations.forEach((a) => a.stop()); };
    } else {
      waveAnims.forEach((anim) => {
        Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }).start();
      });
    }
  }, [radioState, waveAnims]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark
          ? ['rgba(107,158,145,0.06)', 'transparent', 'rgba(107,158,145,0.03)']
          : ['rgba(107,158,145,0.04)', 'transparent', 'rgba(107,158,145,0.02)']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={22} color={theme.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live Radio</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.playerSection}>
          <Animated.View
            style={[
              styles.playerCircle,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: radioState === 'playing'
                  ? Colors.primary
                  : radioState === 'error'
                  ? Colors.danger
                  : isDark ? '#2A2A2C' : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity
              onPress={radioState === 'error' ? handleRetry : handlePlay}
              activeOpacity={0.8}
              disabled={radioState === 'loading'}
              style={styles.playerTouchable}
            >
              {radioState === 'loading' ? (
                <ActivityIndicator size="large" color={isDark ? '#fff' : Colors.primary} />
              ) : radioState === 'error' ? (
                <AlertCircle size={44} color="#fff" strokeWidth={1.5} />
              ) : radioState === 'playing' ? (
                <Pause size={44} color="#fff" strokeWidth={2} />
              ) : (
                <Play size={48} color={isDark ? Colors.primary : Colors.primaryDark} strokeWidth={2} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {radioState === 'playing' && (
            <View style={styles.waveformRow}>
              {waveAnims.map((anim, i) => (
                <Animated.View
                  key={`wave-${i}`}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: Colors.primary,
                      transform: [{ scaleY: anim }],
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {radioState === 'playing' && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Radio size={18} color={Colors.primary} strokeWidth={1.8} />
          <Text style={[styles.stationName, { color: theme.text }]}>
            Quran Radio — Tarateel
          </Text>
          <Text style={[styles.stationDesc, { color: theme.textSecondary }]}>
            Live recitation from official public broadcast
          </Text>
        </View>

        {radioState === 'error' ? (
          <View style={styles.errorSection}>
            <Text style={[styles.errorText, { color: Colors.danger }]}>
              Stream unavailable, please try again
            </Text>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={handleRetry} activeOpacity={0.7}>
              <Text style={styles.actionBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: radioState === 'playing'
                  ? isDark ? 'rgba(212,87,78,0.1)' : 'rgba(212,87,78,0.08)'
                  : Colors.primary,
              },
            ]}
            onPress={handlePlay}
            activeOpacity={0.7}
            disabled={radioState === 'loading'}
          >
            {radioState === 'loading' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : radioState === 'playing' ? (
              <>
                <Volume2 size={16} color={Colors.danger} strokeWidth={1.8} />
                <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Stop Listening</Text>
              </>
            ) : (
              <>
                <Play size={16} color="#fff" strokeWidth={2} />
                <Text style={styles.actionBtnText}>Start Listening</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      <View style={[styles.disclaimer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.disclaimerText, { color: theme.textTertiary }]}>
          This is a live public broadcast stream. All rights belong to the original broadcaster.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row' as const, alignItems: 'center', paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40 },
  headerTitle: { fontFamily: fontFamily.system, flex: 1, textAlign: 'center' as const, fontSize: 16, fontWeight: fw.medium },
  headerRight: { width: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  playerSection: { alignItems: 'center', justifyContent: 'center', marginBottom: 40, width: 200, height: 200 },
  playerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  playerTouchable: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  waveformRow: { flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20, height: 28 },
  waveBar: { width: 3, height: 28, borderRadius: 2 },
  liveIndicator: { flexDirection: 'row' as const, alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(212,87,78,0.1)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger },
  liveText: { fontFamily: fontFamily.system, fontSize: 10, fontWeight: fw.bold, color: Colors.danger, letterSpacing: 1.2 },
  infoSection: { alignItems: 'center', gap: 8, marginBottom: 32 },
  stationName: { fontFamily: fontFamily.system, fontSize: 20, fontWeight: fw.semibold, letterSpacing: -0.3, textAlign: 'center' as const },
  stationDesc: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.regular, textAlign: 'center' as const },
  errorSection: { alignItems: 'center', gap: 16 },
  errorText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.regular, textAlign: 'center' as const },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium, color: '#fff' },
  disclaimer: { paddingHorizontal: 32 },
  disclaimerText: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.regular, textAlign: 'center' as const, lineHeight: 16 },
});
