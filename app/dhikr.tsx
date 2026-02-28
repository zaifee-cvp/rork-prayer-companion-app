import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { X, RotateCcw, Target, Flame, ChevronRight, Check, BookOpen, Volume2, Square } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import CountdownRing from '@/components/CountdownRing';

interface DhikrStep {
  arabic: string;
  transliteration: string;
  meaning: string;
  target: number;
  audioUrl: string;
}

const TASBIH_SEQUENCE: DhikrStep[] = [
  {
    arabic: 'سُبْحَانَ اللَّه',
    transliteration: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    target: 33,
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',
  },
  {
    arabic: 'الْحَمْدُ للهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    target: 33,
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3',
  },
  {
    arabic: 'اللّٰهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target: 33,
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/3.mp3',
  },
  {
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    transliteration: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
    target: 1,
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/4.mp3',
  },
  {
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illallahu, wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu, wa Huwa \'ala kulli shai\'in Qadir',
    meaning: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.',
    target: 1,
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/5.mp3',
  },
];

const COMPLETION_HADITH = {
  narrator: 'Narrated Abu Hurairah (RA)',
  text: 'Allah\'s Messenger (peace be upon him) said, "Whoever says, \'Subhan Allah wa bihamdihi,\' one hundred times a day, will be forgiven all his sins even if they were as much as the foam of the sea."',
  source: 'Sahih al-Bukhari, Book 80, Hadith 100',
};

const FREE_PRESETS = [33, 99, 100];

type Mode = 'tasbih' | 'free';

export default function DhikrScreen() {
  const { theme, isDark, settings, addDhikrEntry, dhikrStreak } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('tasbih');
  const [stepIndex, setStepIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [freeTarget, setFreeTarget] = useState(33);
  const [sequenceComplete, setSequenceComplete] = useState(false);

  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const stepTransition = useRef(new Animated.Value(1)).current;

  const currentStep = TASBIH_SEQUENCE[stepIndex];
  const target = mode === 'tasbih' ? currentStep.target : freeTarget;
  const progress = target > 0 ? Math.min(1, count / target) : 0;
  const isStepComplete = count >= target;

  const totalTasbihCount = useMemo(() => {
    return TASBIH_SEQUENCE.reduce((sum, s) => sum + s.target, 0);
  }, []);

  const completedStepsCount = useMemo(() => {
    let total = 0;
    for (let i = 0; i < stepIndex; i++) {
      total += TASBIH_SEQUENCE[i].target;
    }
    return total + count;
  }, [stepIndex, count]);

  const overallProgress = totalTasbihCount > 0 ? completedStepsCount / totalTasbihCount : 0;

  const animateTap = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  const animateStepTransition = useCallback(() => {
    stepTransition.setValue(0);
    Animated.spring(stepTransition, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [stepTransition]);

  const handleTap = useCallback(() => {
    if (sequenceComplete) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateTap();

    const newCount = count + 1;
    setCount(newCount);

    if (mode === 'tasbih' && newCount >= currentStep.target) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (stepIndex < TASBIH_SEQUENCE.length - 1) {
        setTimeout(() => {
          setStepIndex(stepIndex + 1);
          setCount(0);
          animateStepTransition();
        }, 600);
      } else {
        setSequenceComplete(true);
        addDhikrEntry({
          id: Date.now().toString(),
          count: totalTasbihCount,
          target: totalTasbihCount,
          date: new Date().toISOString().split('T')[0],
        });
      }
    } else if (mode === 'free' && newCount >= freeTarget) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      addDhikrEntry({
        id: Date.now().toString(),
        count: newCount,
        target: freeTarget,
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [count, mode, currentStep, stepIndex, freeTarget, sequenceComplete, animateTap, animateStepTransition, addDhikrEntry, totalTasbihCount]);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (mode === 'tasbih') {
      if (!sequenceComplete && (stepIndex > 0 || count > 0)) {
        addDhikrEntry({
          id: Date.now().toString(),
          count: completedStepsCount,
          target: totalTasbihCount,
          date: new Date().toISOString().split('T')[0],
        });
      }
      setStepIndex(0);
      setSequenceComplete(false);
    } else {
      if (count > 0 && count < freeTarget) {
        addDhikrEntry({
          id: Date.now().toString(),
          count,
          target: freeTarget,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
    setCount(0);
    animateStepTransition();
  }, [mode, count, freeTarget, stepIndex, sequenceComplete, completedStepsCount, totalTasbihCount, addDhikrEntry, animateStepTransition]);

  const switchMode = useCallback((newMode: Mode) => {
    if (newMode === mode) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMode(newMode);
    setCount(0);
    setStepIndex(0);
    setSequenceComplete(false);
    animateStepTransition();
  }, [mode, animateStepTransition]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlayVoice = useCallback(async (index: number) => {
    const step = TASBIH_SEQUENCE[index];
    if (!step?.audioUrl) return;

    if (playingIndex === index) {
      try {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      } catch (e) {
        console.log('Stop audio error:', e);
      }
      setPlayingIndex(null);
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.log('Cleanup previous audio error:', e);
    }

    setPlayingIndex(index);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('Loading audio for:', step.transliteration, step.audioUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: step.audioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      console.log('Audio playing for:', step.transliteration);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('Audio finished for index:', index);
          setPlayingIndex(null);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.log('Audio error caught:', err);
      setPlayingIndex(null);
    }
  }, [playingIndex]);

  const ringColor = useMemo(() => {
    if (mode === 'tasbih') {
      if (sequenceComplete) return Colors.gold;
      if (isStepComplete) return Colors.gold;
      const stepColors = ['#6B9E91', '#7BAF8B', '#C49565', '#8B7BAF', '#C47B65'];
      return stepColors[stepIndex] ?? Colors.primary;
    }
    return isStepComplete ? Colors.gold : Colors.primary;
  }, [mode, sequenceComplete, isStepComplete, stepIndex]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
            <X size={18} color={theme.textSecondary} strokeWidth={1.8} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dhikr</Text>
        <TouchableOpacity onPress={handleReset} hitSlop={16}>
          <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
            <RotateCcw size={16} color={theme.textSecondary} strokeWidth={1.8} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settings.isPremium && dhikrStreak > 0 && (
          <View style={[styles.streakRow, { backgroundColor: isDark ? 'rgba(196,162,101,0.08)' : 'rgba(196,162,101,0.06)' }]}>
            <Flame size={14} color={Colors.gold} strokeWidth={1.8} />
            <Text style={[styles.streakText, { color: Colors.gold }]}>
              {dhikrStreak} day streak
            </Text>
          </View>
        )}

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: mode === 'tasbih' ? Colors.primary : theme.surfaceSecondary },
            ]}
            onPress={() => switchMode('tasbih')}
          >
            <Text style={[styles.modeBtnText, { color: mode === 'tasbih' ? '#fff' : theme.text }]}>
              Tasbih
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: mode === 'free' ? Colors.primary : theme.surfaceSecondary },
            ]}
            onPress={() => switchMode('free')}
          >
            <Text style={[styles.modeBtnText, { color: mode === 'free' ? '#fff' : theme.text }]}>
              Free Count
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'tasbih' && (
          <Animated.View style={[styles.stepInfo, { opacity: stepTransition, transform: [{ translateY: stepTransition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
            {!sequenceComplete ? (
              <>
                <Text style={[styles.stepArabic, { color: theme.text }]}>{currentStep.arabic}</Text>
                <View style={styles.translitRow}>
                  <Text style={[styles.stepTranslit, { color: ringColor }]}>{currentStep.transliteration}</Text>
                  <TouchableOpacity
                    onPress={() => handlePlayVoice(stepIndex)}
                    hitSlop={12}
                    style={[styles.voiceBtn, { backgroundColor: playingIndex === stepIndex ? ringColor : theme.surfaceSecondary }]}
                    testID={`dhikr-voice-${stepIndex}`}
                  >
                    {playingIndex === stepIndex ? (
                      <Square size={10} color="#fff" strokeWidth={2.5} />
                    ) : (
                      <Volume2 size={14} color={ringColor} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.stepMeaning, { color: theme.textSecondary }]}>{currentStep.meaning}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.stepArabic, { color: Colors.gold }]}>ما شاء الله</Text>
                <Text style={[styles.stepTranslit, { color: Colors.gold }]}>Sequence Complete!</Text>
                <Text style={[styles.stepMeaning, { color: theme.textSecondary }]}>Dhikr completed</Text>
              </>
            )}
          </Animated.View>
        )}

        {mode === 'free' && (
          <View style={styles.presets}>
            {FREE_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetBtn,
                  { backgroundColor: freeTarget === p ? Colors.primary : theme.surfaceSecondary },
                ]}
                onPress={() => { setFreeTarget(p); setCount(0); }}
              >
                <Text style={[styles.presetText, { color: freeTarget === p ? '#fff' : theme.text }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleTap}
          style={styles.tapArea}
          testID="dhikr-tap"
          disabled={sequenceComplete && mode === 'tasbih'}
        >
          <Animated.View style={[styles.ringWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <CountdownRing
              progress={mode === 'tasbih' ? progress : progress}
              size={200}
              strokeWidth={8}
              color={ringColor}
              bgColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
            >
              <Text style={[styles.countText, { color: isStepComplete || sequenceComplete ? Colors.gold : theme.text }]}>
                {count}
              </Text>
              <Text style={[styles.counterTarget, { color: theme.textTertiary }]}>
                / {target}
              </Text>
            </CountdownRing>
          </Animated.View>
        </TouchableOpacity>

        {mode === 'tasbih' && !sequenceComplete && (
          <Text style={[styles.tapHint, { color: theme.textTertiary }]}>
            {isStepComplete ? 'Moving to next dhikr...' : 'Tap the circle to count'}
          </Text>
        )}
        {mode === 'free' && (
          <Text style={[styles.tapHint, { color: theme.textTertiary }]}>
            {isStepComplete ? 'Target reached! Tap to continue or reset.' : 'Tap the circle to count'}
          </Text>
        )}

        {mode === 'tasbih' && (
          <View style={[styles.stepsCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.stepsTitle, { color: theme.textTertiary }]}>Sequence Progress</Text>
            <View style={[styles.overallBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={[styles.overallFill, { width: `${Math.min(100, overallProgress * 100)}%`, backgroundColor: sequenceComplete ? Colors.gold : Colors.primary }]} />
            </View>
            {TASBIH_SEQUENCE.map((step, i) => {
              const isDone = i < stepIndex || sequenceComplete;
              const isCurrent = i === stepIndex && !sequenceComplete;
              return (
                <View key={i} style={[styles.stepRow, i < TASBIH_SEQUENCE.length - 1 && styles.stepRowBorder, { borderBottomColor: theme.border }]}>
                  <View style={[
                    styles.stepDot,
                    isDone && { backgroundColor: Colors.gold },
                    isCurrent && { backgroundColor: ringColor },
                    !isDone && !isCurrent && { backgroundColor: theme.surfaceSecondary },
                  ]}>
                    {isDone ? (
                      <Check size={11} color="#fff" strokeWidth={3} />
                    ) : isCurrent ? (
                      <ChevronRight size={11} color="#fff" strokeWidth={3} />
                    ) : (
                      <Text style={styles.stepDotNum}>{i + 1}</Text>
                    )}
                  </View>
                  <View style={styles.stepRowText}>
                    <Text style={[styles.stepRowArabic, { color: isCurrent ? theme.text : isDone ? Colors.gold : theme.textTertiary }]}>{step.arabic}</Text>
                    <Text style={[styles.stepRowLabel, { color: isCurrent ? theme.textSecondary : theme.textTertiary }]}>
                      {step.transliteration} × {step.target}
                    </Text>
                  </View>
                  <View style={styles.stepRowActions}>
                    <TouchableOpacity
                      onPress={() => handlePlayVoice(i)}
                      hitSlop={8}
                      style={[styles.voiceBtnSmall, { backgroundColor: playingIndex === i ? (isCurrent ? ringColor : Colors.gold) : theme.surfaceSecondary }]}
                    >
                      {playingIndex === i ? (
                        <Square size={8} color="#fff" strokeWidth={2.5} />
                      ) : (
                        <Volume2 size={11} color={isCurrent ? ringColor : isDone ? Colors.gold : theme.textTertiary} strokeWidth={2.2} />
                      )}
                    </TouchableOpacity>
                    {isDone && (
                      <Text style={[styles.doneLabel, { color: Colors.gold }]}>Done</Text>
                    )}
                    {isCurrent && (
                      <Text style={[styles.currentCount, { color: ringColor }]}>{count}/{step.target}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {mode === 'free' && (
          <View style={[styles.targetRow, { backgroundColor: theme.surface }]}>
            <Target size={16} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.targetLabel, { color: theme.text }]}>
              {isStepComplete ? 'Completed!' : `${target - count} remaining`}
            </Text>
          </View>
        )}

        {mode === 'tasbih' && sequenceComplete && (
          <View style={[styles.hadithCard, { backgroundColor: theme.surface }]}>
            <View style={styles.hadithHeader}>
              <BookOpen size={16} color={Colors.gold} strokeWidth={1.8} />
              <Text style={[styles.hadithHeaderText, { color: Colors.gold }]}>Hadith</Text>
            </View>
            <Text style={[styles.hadithQuote, { color: theme.text }]}>
              The Prophet ﷺ said:
            </Text>
            <Text style={[styles.hadithBody, { color: theme.text }]}>
              "His sins will be forgiven even if they are like the foam of the sea."
            </Text>
            <View style={[styles.hadithDivider, { backgroundColor: theme.border }]} />
            <Text style={[styles.hadithNarrator, { color: theme.textSecondary }]}>
              {COMPLETION_HADITH.narrator}:
            </Text>
            <Text style={[styles.hadithFull, { color: theme.textSecondary }]}>
              {COMPLETION_HADITH.text}
            </Text>
            <Text style={[styles.hadithSource, { color: theme.textTertiary }]}>
              ({COMPLETION_HADITH.source})
            </Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.medium },
  closeBg: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingHorizontal: 24 },
  streakRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  streakText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium },
  modeToggle: { flexDirection: 'row' as const, gap: 8, marginBottom: 24 },
  modeBtn: { paddingHorizontal: 22, paddingVertical: 9, borderRadius: 12 },
  modeBtnText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium },
  stepInfo: { alignItems: 'center', marginBottom: 24 },
  stepArabic: { fontFamily: fontFamily.system, fontSize: 30, fontWeight: fw.bold, textAlign: 'center' as const, marginBottom: 6 },
  stepTranslit: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.medium, marginBottom: 4 },
  stepMeaning: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, fontStyle: 'italic' as const },
  presets: { flexDirection: 'row' as const, gap: 10, marginBottom: 28 },
  presetBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  presetText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium },
  tapArea: { marginBottom: 16 },
  ringWrapper: {},
  countText: { fontFamily: fontFamily.system, fontSize: 52, fontWeight: fw.bold, letterSpacing: -1 },
  counterTarget: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.regular, marginTop: -4 },
  tapHint: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, marginBottom: 24 },
  stepsCard: { width: '100%', borderRadius: 14, padding: 16, marginBottom: 16 },
  stepsTitle: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.medium, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 12 },
  overallBar: { height: 3, borderRadius: 2, width: '100%', marginBottom: 16, overflow: 'hidden' as const },
  overallFill: { height: '100%', borderRadius: 2 },
  stepRow: { flexDirection: 'row' as const, alignItems: 'center', paddingVertical: 12, gap: 12 },
  stepRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  stepDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  stepDotNum: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.medium, color: '#999' },
  stepRowText: { flex: 1 },
  stepRowArabic: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.medium, marginBottom: 2 },
  stepRowLabel: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular },
  doneLabel: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium },
  currentCount: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.bold },
  translitRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 8, marginBottom: 4 },
  voiceBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center' as const, alignItems: 'center' as const },
  voiceBtnSmall: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center' as const, alignItems: 'center' as const },
  stepRowActions: { flexDirection: 'row' as const, alignItems: 'center', gap: 8 },
  targetRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, width: '100%' },
  targetLabel: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium },
  hadithCard: { width: '100%', borderRadius: 14, padding: 20, marginTop: 16, marginBottom: 16 },
  hadithHeader: { flexDirection: 'row' as const, alignItems: 'center', gap: 8, marginBottom: 14 },
  hadithHeaderText: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  hadithQuote: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.medium, textAlign: 'center' as const, marginBottom: 8 },
  hadithBody: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.regular, fontStyle: 'italic' as const, textAlign: 'center' as const, lineHeight: 26, marginBottom: 16 },
  hadithDivider: { height: StyleSheet.hairlineWidth, width: '100%', marginBottom: 14 },
  hadithNarrator: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium, marginBottom: 6 },
  hadithFull: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, fontStyle: 'italic' as const, lineHeight: 19, marginBottom: 8 },
  hadithSource: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.regular },
});
