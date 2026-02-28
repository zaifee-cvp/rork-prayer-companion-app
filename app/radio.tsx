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
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Radio, Play, Pause, AlertCircle, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

const RADIO_STREAM_URL = 'https://Qurango.com/radio/tarateel';

type RadioState = 'idle' | 'loading' | 'playing' | 'error';

export default function RadioScreen() {
  const { theme, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [radioState, setRadioState] = useState<RadioState>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

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
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [radioState, pulseAnim, glowAnim]);

  const handlePlay = useCallback(async () => {
    if (radioState === 'loading') return;

    if (radioState === 'playing') {
      console.log('[Radio] Stopping stream');
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {
          console.log('[Radio] Stop error:', e);
        }
        soundRef.current = null;
      }
      if (isMountedRef.current) setRadioState('idle');
      return;
    }

    console.log('[Radio] Starting stream:', RADIO_STREAM_URL);
    setRadioState('loading');

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: RADIO_STREAM_URL },
        { shouldPlay: true, isLooping: false },
      );

      if (!isMountedRef.current) {
        await sound.unloadAsync();
        return;
      }

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
        console.log('[Radio] Stream playing');
      }
    } catch (e) {
      console.log('[Radio] Stream load error:', e);
      if (isMountedRef.current) setRadioState('error');
    }
  }, [radioState]);

  const handleRetry = useCallback(() => {
    setRadioState('idle');
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={isDark ? ['#0A1820', '#060B0E'] : ['#E8F6F8', '#F0F4F5']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live Quran Radio</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.playerSection}>
          {radioState === 'playing' && (
            <Animated.View
              style={[
                styles.glowRing,
                {
                  opacity: glowOpacity,
                  backgroundColor: isDark ? 'rgba(0,212,230,0.06)' : 'rgba(0,212,230,0.08)',
                },
              ]}
            />
          )}

          <Animated.View
            style={[
              styles.playerCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={
                radioState === 'playing'
                  ? ['#00D4E6', '#009DAE']
                  : radioState === 'error'
                  ? [Colors.danger, '#CC3844']
                  : isDark
                  ? ['#1A2830', '#0D1418']
                  : ['#FFFFFF', '#E8F0F4']
              }
              style={styles.playerCircleInner}
            >
              {radioState === 'loading' ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : radioState === 'error' ? (
                <AlertCircle size={48} color="#fff" />
              ) : radioState === 'playing' ? (
                <Pause size={48} color="#fff" strokeWidth={2.5} />
              ) : (
                <Play size={48} color={isDark ? Colors.primary : Colors.primaryDark} strokeWidth={2.5} style={{ marginLeft: 4 }} />
              )}
            </LinearGradient>
          </Animated.View>

          {radioState === 'playing' && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Radio size={20} color={Colors.primary} />
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
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.7}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.mainBtn,
              {
                backgroundColor: radioState === 'playing' ? 'rgba(255,71,87,0.1)' : Colors.primary,
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
                <Volume2 size={18} color={Colors.danger} />
                <Text style={[styles.mainBtnText, { color: Colors.danger }]}>Stop Listening</Text>
              </>
            ) : (
              <>
                <Play size={18} color="#fff" />
                <Text style={[styles.mainBtnText, { color: '#fff' }]}>Start Listening</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.disclaimer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={[styles.disclaimerText, { color: theme.textTertiary }]}>
          This is a live public broadcast stream. All rights belong to the original broadcaster. No audio is downloaded or cached.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40 },
  headerTitle: {
    fontFamily: fontFamily.system,
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 17,
    fontWeight: fw.semibold,
    letterSpacing: -0.41,
  },
  headerRight: { width: 40 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  playerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: 200,
    height: 200,
  },
  glowRing: {
    position: 'absolute' as const,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  playerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  playerCircleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,71,87,0.12)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  liveText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.bold,
    color: Colors.danger,
    letterSpacing: 1.2,
  },
  infoSection: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  stationName: {
    fontFamily: fontFamily.system,
    fontSize: 22,
    fontWeight: fw.bold,
    letterSpacing: 0.35,
    textAlign: 'center' as const,
  },
  stationDesc: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.regular,
    letterSpacing: -0.15,
    textAlign: 'center' as const,
  },
  errorSection: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.medium,
    textAlign: 'center' as const,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
  },
  retryText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 15,
    fontWeight: fw.semibold,
  },
  mainBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 26,
    minWidth: 200,
  },
  mainBtnText: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
  },
  disclaimer: {
    paddingHorizontal: 32,
  },
  disclaimerText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
});
