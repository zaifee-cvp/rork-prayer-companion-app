import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Radio, Play, Pause, AlertCircle, Volume2 } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import { RADIO_STATIONS, RadioStation } from '@/constants/radio-stations';

type RadioState = 'idle' | 'loading' | 'playing' | 'error';

export default function RadioScreen() {
  const { theme, isDark } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [radioState, setRadioState] = useState<RadioState>('idle');
  const [selectedStation, setSelectedStation] = useState<RadioStation>(RADIO_STATIONS[0]);
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

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) { console.log('[Radio] Stop error:', e); }
      soundRef.current = null;
    }
    if (isMountedRef.current) setRadioState('idle');
  }, []);

  const startPlayback = useCallback(async (station: RadioStation) => {
    setRadioState('loading');

    const urls = [station.streamUrl, ...(station.fallbackUrls ?? [])];
    let loaded = false;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[Radio] Trying stream ${i + 1}/${urls.length}:`, url);
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
  }, []);

  const handlePlay = useCallback(async () => {
    if (radioState === 'loading') return;

    if (radioState === 'playing') {
      console.log('[Radio] Stopping stream');
      await stopPlayback();
      return;
    }

    await startPlayback(selectedStation);
  }, [radioState, selectedStation, stopPlayback, startPlayback]);

  const handleStationSelect = useCallback(async (station: RadioStation) => {
    if (station.id === selectedStation.id && radioState !== 'error') return;

    console.log('[Radio] Switching to:', station.name);
    setSelectedStation(station);

    if (radioState === 'playing' || radioState === 'loading') {
      await stopPlayback();
      setTimeout(() => startPlayback(station), 100);
    }
  }, [selectedStation, radioState, stopPlayback, startPlayback]);

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

  const generalStations = RADIO_STATIONS;

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.playerArea, { opacity: fadeAnim }]}>
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
              {selectedStation.name}
            </Text>
            <Text style={[styles.stationNameArabic, { color: theme.textSecondary }]}>
              {selectedStation.nameArabic}
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

        <View style={styles.stationsSection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>STATIONS</Text>

          {RADIO_STATIONS.map((station) => (
            <TouchableOpacity
              key={station.id}
              style={[
                styles.stationRow,
                {
                  backgroundColor: selectedStation.id === station.id
                    ? isDark ? 'rgba(107,158,145,0.12)' : 'rgba(107,158,145,0.08)'
                    : isDark ? theme.surface : theme.surface,
                  borderColor: selectedStation.id === station.id
                    ? Colors.primary
                    : theme.border,
                },
              ]}
              onPress={() => handleStationSelect(station)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.stationDot,
                { backgroundColor: selectedStation.id === station.id ? Colors.primary : theme.border },
              ]} />
              <View style={styles.stationInfo}>
                <Text style={[styles.stationRowName, { color: theme.text }]}>{station.name}</Text>
                <Text style={[styles.stationRowArabic, { color: theme.textSecondary }]}>{station.nameArabic}</Text>
              </View>
              {selectedStation.id === station.id && radioState === 'playing' && (
                <View style={styles.miniWaveRow}>
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={`mini-wave-${i}`}
                      style={[
                        styles.miniWaveBar,
                        {
                          backgroundColor: Colors.primary,
                          transform: [{ scaleY: waveAnims[i] ?? waveAnims[0] }],
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}


        </View>

        <View style={styles.disclaimer}>
          <Text style={[styles.disclaimerText, { color: theme.textTertiary }]}>
            Free public broadcast streams via mp3quran.net. All rights belong to the original reciters and broadcasters.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row' as const, alignItems: 'center', paddingBottom: 12, paddingHorizontal: 16 },
  backBtn: { width: 40 },
  headerTitle: { fontFamily: fontFamily.system, flex: 1, textAlign: 'center' as const, fontSize: 16, fontWeight: fw.medium },
  headerRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  playerArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
  playerSection: { alignItems: 'center', justifyContent: 'center', marginBottom: 24, width: 180, height: 180 },
  playerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  playerTouchable: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  waveformRow: { flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, height: 24 },
  waveBar: { width: 3, height: 24, borderRadius: 2 },
  liveIndicator: { flexDirection: 'row' as const, alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(212,87,78,0.1)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.danger },
  liveText: { fontFamily: fontFamily.system, fontSize: 10, fontWeight: fw.bold, color: Colors.danger, letterSpacing: 1.2 },
  infoSection: { alignItems: 'center', gap: 4, marginBottom: 20 },
  stationName: { fontFamily: fontFamily.system, fontSize: 18, fontWeight: fw.semibold, letterSpacing: -0.3, textAlign: 'center' as const },
  stationNameArabic: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, textAlign: 'center' as const },
  errorSection: { alignItems: 'center', gap: 16 },
  errorText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.regular, textAlign: 'center' as const },
  actionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium, color: '#fff' },
  stationsSection: { marginTop: 28 },
  sectionLabel: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.semibold,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  stationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  stationInfo: { flex: 1 },
  stationRowName: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium },
  stationRowArabic: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  miniWaveRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 2, marginLeft: 8 },
  miniWaveBar: { width: 2, height: 14, borderRadius: 1 },
  disclaimer: { paddingHorizontal: 12, paddingTop: 24, paddingBottom: 8 },
  disclaimerText: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.regular, textAlign: 'center' as const, lineHeight: 16 },
});
