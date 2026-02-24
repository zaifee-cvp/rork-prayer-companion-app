import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, RotateCcw, Target, Flame } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import CountdownRing from '@/components/CountdownRing';

const PRESETS = [33, 99, 100];

export default function DhikrScreen() {
  const { theme, isDark, settings, addDhikrEntry, dhikrStreak } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleTap = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    const newCount = count + 1;
    setCount(newCount);

    if (newCount === target) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      addDhikrEntry({
        id: Date.now().toString(),
        count: newCount,
        target,
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [count, target, scaleAnim, addDhikrEntry]);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (count > 0 && count < target) {
      addDhikrEntry({
        id: Date.now().toString(),
        count,
        target,
        date: new Date().toISOString().split('T')[0],
      });
    }
    setCount(0);
  }, [count, target, addDhikrEntry]);

  const progress = target > 0 ? Math.min(1, count / target) : 0;
  const isComplete = count >= target;

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

      <View style={styles.content}>
        {settings.isPremium && dhikrStreak > 0 && (
          <View style={styles.streakRow}>
            <Flame size={16} color={Colors.gold} />
            <Text style={[styles.streakText, { color: Colors.gold }]}>
              {dhikrStreak} day streak
            </Text>
          </View>
        )}

        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.presetBtn,
                { backgroundColor: target === p ? Colors.primary : theme.surfaceSecondary },
              ]}
              onPress={() => { setTarget(p); setCount(0); }}
            >
              <Text style={[styles.presetText, { color: target === p ? '#fff' : theme.text }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleTap}
          style={styles.tapArea}
          testID="dhikr-tap"
        >
          <Animated.View style={[styles.ringWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <CountdownRing
              progress={progress}
              size={220}
              strokeWidth={10}
              color={isComplete ? Colors.gold : Colors.primary}
              bgColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
            >
              <Text style={[styles.countText, { color: isComplete ? Colors.gold : theme.text }]}>
                {count}
              </Text>
              <Text style={[styles.targetText, { color: theme.textSecondary }]}>
                / {target}
              </Text>
            </CountdownRing>
          </Animated.View>
        </TouchableOpacity>

        <Text style={[styles.tapHint, { color: theme.textTertiary }]}>
          {isComplete ? 'Target reached! Tap to continue or reset.' : 'Tap anywhere on the circle to count'}
        </Text>

        <View style={[styles.targetRow, { backgroundColor: theme.surface }]}>
          <Target size={18} color={Colors.primary} />
          <Text style={[styles.targetLabel, { color: theme.text }]}>
            {isComplete ? 'Completed!' : `${target - count} remaining`}
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  streakRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  streakText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.semibold, letterSpacing: -0.24 },
  presets: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 40,
  },
  presetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  presetText: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
  tapArea: {
    marginBottom: 24,
  },
  ringWrapper: {},
  countText: {
    fontFamily: fontFamily.system,
    fontSize: 56,
    fontWeight: fw.bold,
    letterSpacing: -1,
  },
  targetText: {
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
    marginBottom: 24,
  },
  targetRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  targetLabel: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
});
