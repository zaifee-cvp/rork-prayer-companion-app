import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { X, RotateCcw, Target, Flame, ChevronRight, Check } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import CountdownRing from '@/components/CountdownRing';

interface DhikrStep {
  arabic: string;
  transliteration: string;
  meaning: string;
  target: number;
}

const TASBIH_SEQUENCE: DhikrStep[] = [
  {
    arabic: 'سُبْحَانَ اللَّه',
    transliteration: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    target: 33,
  },
  {
    arabic: 'الْحَمْدُ للهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    target: 33,
  },
  {
    arabic: 'اللّٰهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target: 34,
  },
];

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
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
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

  const ringColor = useMemo(() => {
    if (mode === 'tasbih') {
      if (sequenceComplete) return Colors.gold;
      if (isStepComplete) return Colors.gold;
      const stepColors = ['#00D4E6', '#34C759', '#FF9500'];
      return stepColors[stepIndex] ?? Colors.primary;
    }
    return isStepComplete ? Colors.gold : Colors.primary;
  }, [mode, sequenceComplete, isStepComplete, stepIndex]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
            <X size={20} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dhikr</Text>
        <TouchableOpacity onPress={handleReset} hitSlop={16}>
          <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
            <RotateCcw size={18} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settings.isPremium && dhikrStreak > 0 && (
          <View style={styles.streakRow}>
            <Flame size={16} color={Colors.gold} />
            <Text style={[styles.streakText, { color: Colors.gold }]}>
              {dhikrStreak} day streak
            </Text>
          </View>
        )}

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'tasbih' && { backgroundColor: Colors.primary },
              mode !== 'tasbih' && { backgroundColor: theme.surfaceSecondary },
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
              mode === 'free' && { backgroundColor: Colors.primary },
              mode !== 'free' && { backgroundColor: theme.surfaceSecondary },
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
                <Text style={[styles.stepTranslit, { color: ringColor }]}>{currentStep.transliteration}</Text>
                <Text style={[styles.stepMeaning, { color: theme.textSecondary }]}>{currentStep.meaning}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.stepArabic, { color: Colors.gold }]}>ما شاء الله</Text>
                <Text style={[styles.stepTranslit, { color: Colors.gold }]}>Sequence Complete!</Text>
                <Text style={[styles.stepMeaning, { color: theme.textSecondary }]}>Tap reset to start again</Text>
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
              size={220}
              strokeWidth={10}
              color={ringColor}
              bgColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
            >
              <Text style={[styles.countText, { color: isStepComplete || sequenceComplete ? Colors.gold : theme.text }]}>
                {count}
              </Text>
              <Text style={[styles.counterTarget, { color: theme.textSecondary }]}>
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
            {isStepComplete ? 'Target reached! Tap to continue or reset.' : 'Tap anywhere on the circle to count'}
          </Text>
        )}

        {mode === 'tasbih' && (
          <View style={[styles.stepsCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.stepsTitle, { color: theme.textSecondary }]}>Sequence Progress</Text>
            <View style={[styles.overallBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
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
                      <Check size={12} color="#fff" strokeWidth={3} />
                    ) : isCurrent ? (
                      <ChevronRight size={12} color="#fff" strokeWidth={3} />
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
                  {isDone && (
                    <Text style={[styles.doneLabel, { color: Colors.gold }]}>Done</Text>
                  )}
                  {isCurrent && (
                    <Text style={[styles.currentCount, { color: ringColor }]}>{count}/{step.target}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {mode === 'free' && (
          <View style={[styles.targetRow, { backgroundColor: theme.surface }]}>
            <Target size={18} color={Colors.primary} />
            <Text style={[styles.targetLabel, { color: theme.text }]}>
              {isStepComplete ? 'Completed!' : `${target - count} remaining`}
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
  headerTitle: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.semibold, letterSpacing: -0.41 },
  closeBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  streakRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  streakText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.semibold, letterSpacing: -0.24 },
  modeToggle: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 20,
  },
  modeBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
  },
  modeBtnText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.semibold, letterSpacing: -0.24 },
  stepInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepArabic: {
    fontFamily: fontFamily.system,
    fontSize: 32,
    fontWeight: fw.bold,
    letterSpacing: 0,
    textAlign: 'center' as const,
    marginBottom: 6,
  },
  stepTranslit: {
    fontFamily: fontFamily.system,
    fontSize: 18,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
    marginBottom: 4,
  },
  stepMeaning: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.regular,
    fontStyle: 'italic' as const,
    letterSpacing: -0.15,
  },
  presets: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 28,
  },
  presetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  presetText: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
  tapArea: {
    marginBottom: 16,
  },
  ringWrapper: {},
  countText: {
    fontFamily: fontFamily.system,
    fontSize: 56,
    fontWeight: fw.bold,
    letterSpacing: -1,
  },
  counterTarget: {
    fontFamily: fontFamily.system,
    fontSize: 17,
    fontWeight: fw.regular,
    letterSpacing: -0.41,
    marginTop: -4,
  },
  tapHint: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    letterSpacing: -0.08,
    marginBottom: 20,
  },
  stepsCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stepsTitle: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  overallBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    marginBottom: 16,
    overflow: 'hidden' as const,
  },
  overallFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  stepRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotNum: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.semibold,
    color: '#999',
  },
  stepRowText: {
    flex: 1,
  },
  stepRowArabic: {
    fontFamily: fontFamily.system,
    fontSize: 18,
    fontWeight: fw.semibold,
    letterSpacing: 0,
    marginBottom: 2,
  },
  stepRowLabel: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    letterSpacing: -0.08,
  },
  doneLabel: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.semibold,
  },
  currentCount: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.bold,
    letterSpacing: -0.24,
  },
  targetRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
  },
  targetLabel: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
});
