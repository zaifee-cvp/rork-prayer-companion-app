import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import { useReview } from '@/providers/ReviewProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

export default function RamadanBanner() {
  const { theme, isDark } = useApp();
  const { showRamadanBanner, dismissRamadanBanner, onRamadanReviewTap } = useReview();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showRamadanBanner) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showRamadanBanner]);

  if (!showRamadanBanner) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(196,162,101,0.1)' : 'rgba(196,162,101,0.08)',
          borderColor: isDark ? 'rgba(196,162,101,0.2)' : 'rgba(196,162,101,0.15)',
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onRamadanReviewTap}
        activeOpacity={0.7}
        testID="ramadan-banner"
      >
        <Text style={styles.emoji}>🌙</Text>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: theme.text }]}>Ramadan Mubarak</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            If this app helps your worship, consider leaving a review
          </Text>
        </View>
        <Star size={16} color={Colors.gold} strokeWidth={2} fill={Colors.gold} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={dismissRamadanBanner}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="ramadan-banner-close"
      >
        <X size={14} color={theme.textTertiary} strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 14,
    paddingRight: 36,
    gap: 12,
  },
  emoji: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.semibold,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    lineHeight: 17,
    marginTop: 2,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
