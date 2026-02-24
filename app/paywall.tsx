import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  BookOpen,
  Bell,
  Calendar,
  Globe,
  Sparkles,
  ShieldCheck,
  Crown,
  Check,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

const BENEFITS = [
  { icon: BookOpen, text: 'Full Quran with audio & translations' },
  { icon: Bell, text: 'Azan notifications for all prayers' },
  { icon: Calendar, text: 'Monthly prayer timetable' },
  { icon: Globe, text: 'Time zone & language control' },
  { icon: Sparkles, text: 'Dhikr history & streak tracking' },
  { icon: ShieldCheck, text: 'No ads, ever' },
];

export default function PaywallScreen() {
  const { theme, updateSettings } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePurchase = () => {
    updateSettings({ isPremium: true });
    Alert.alert(
      'Lifetime Unlocked!',
      'Thank you! All premium features are now available.',
      [{ text: 'Continue', onPress: () => router.back() }],
    );
  };

  const handleRestore = () => {
    Alert.alert('Restore', 'No previous purchase found.', [{ text: 'OK' }]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={16}
      >
        <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
          <X size={20} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.gold, '#E89A10']}
          style={styles.crownCircle}
        >
          <Crown size={36} color="#fff" />
        </LinearGradient>

        <Text style={[styles.title, { color: theme.text }]}>Unlock Lifetime</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Prayer times, Quran, azan, and qibla — fully unlocked.
        </Text>

        <View style={[styles.benefitsCard, { backgroundColor: theme.surface }]}>
          {BENEFITS.map((benefit, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <View style={styles.checkCircle}>
                <Check size={14} color="#fff" />
              </View>
              <Text style={[styles.benefitText, { color: theme.text }]}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase} activeOpacity={0.85}>
          <LinearGradient
            colors={['#00D4E6', '#00A3B8']}
            style={styles.purchaseGradient}
          >
            <Text style={styles.purchaseText}>Unlock Lifetime Access</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={[styles.restoreText, { color: Colors.primary }]}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={[styles.legalText, { color: theme.textTertiary }]}>
          One-time purchase. No subscriptions.{'\n'}
          By purchasing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute' as const,
    right: 16,
    zIndex: 10,
  },
  closeBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  crownCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fontFamily.system,
    fontSize: 28,
    fontWeight: fw.bold,
    textAlign: 'center' as const,
    letterSpacing: 0.36,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fontFamily.system,
    fontSize: 17,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
    letterSpacing: -0.41,
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 300,
  },
  benefitsCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    marginTop: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.regular,
    letterSpacing: -0.32,
    flex: 1,
  },
  purchaseBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 28,
  },
  purchaseGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  purchaseText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 17,
    fontWeight: fw.semibold,
    letterSpacing: -0.41,
  },
  restoreBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  restoreText: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
  },
  legalText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
    marginTop: 16,
    lineHeight: 16,
  },
});
