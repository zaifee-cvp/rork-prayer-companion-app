import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Heart, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProvider';
import { useReview } from '@/providers/ReviewProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

export default function PreReviewModal() {
  const { theme, isDark } = useApp();
  const { showSoftModal, onSoftModalPositive, onSoftModalNegative, onSoftModalDismiss } = useReview();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSoftModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [showSoftModal]);

  const handlePositive = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSoftModalPositive();
  };

  const handleNegative = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSoftModalNegative();
  };

  if (!showSoftModal) return null;

  return (
    <Modal
      visible={showSoftModal}
      transparent
      animationType="none"
      onRequestClose={onSoftModalDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onSoftModalDismiss}
        />
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(107,158,145,0.15)' : 'rgba(107,158,145,0.1)' }]}>
            <Heart size={28} color={Colors.primary} strokeWidth={1.8} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Are you finding Prayer{'\n'}Companion helpful?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your feedback helps us improve the app for the Muslim community.
          </Text>

          <TouchableOpacity
            style={[styles.positiveBtn, { backgroundColor: Colors.primary }]}
            onPress={handlePositive}
            activeOpacity={0.8}
            testID="review-positive"
          >
            <Heart size={16} color="#fff" strokeWidth={2} />
            <Text style={styles.positiveBtnText}>Yes, it&apos;s helpful</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.negativeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            onPress={handleNegative}
            activeOpacity={0.7}
            testID="review-negative"
          >
            <MessageSquare size={16} color={theme.textSecondary} strokeWidth={1.8} />
            <Text style={[styles.negativeBtnText, { color: theme.textSecondary }]}>Not really</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fontFamily.system,
    fontSize: 20,
    fontWeight: fw.semibold,
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  positiveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 50,
    borderRadius: 14,
    marginBottom: 10,
  },
  positiveBtnText: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.semibold,
    color: '#fff',
    letterSpacing: -0.2,
  },
  negativeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 50,
    borderRadius: 14,
  },
  negativeBtnText: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.medium,
    letterSpacing: -0.2,
  },
});
