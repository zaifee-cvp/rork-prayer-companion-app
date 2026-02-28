import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Crown,
  Check,
  ShieldCheck,
  Sparkles,
  Moon,
  BookMarked,
  Headphones,
  Ban,
  RotateCcw,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

type PlanType = 'yearly' | 'monthly';

const PREMIUM_FEATURES = [
  { icon: Ban, label: 'Ad-free experience' },
  { icon: Moon, label: 'Dark mode theme' },
  { icon: BookMarked, label: 'Advanced bookmarks' },
  { icon: Headphones, label: 'Audio recitation (Coming Soon)' },
  { icon: Sparkles, label: 'All future premium features' },
];

const FREE_FEATURES = [
  { label: 'Full Quran text', included: true },
  { label: 'Translations', included: true },
  { label: 'Live Radio', included: true },
  { label: 'Basic bookmarks', included: true },
  { label: 'Ads removed', included: false },
];

const PREMIUM_ALL = [
  { label: 'Everything in Free', included: true },
  { label: 'No ads', included: true },
  { label: 'Dark mode', included: true },
  { label: 'Advanced bookmarks', included: true },
  { label: 'Future audio features', included: true },
];

export default function PaywallScreen() {
  const {
    theme,
    isDark,
    offerings,
    offeringsLoading,
    purchasePackage,
    isPurchasing,
    restorePurchases,
    isRestoring,
  } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const yearlyPackage = offerings?.current?.availablePackages.find(
    (p) => p.identifier === '$rc_annual',
  );
  const monthlyPackage = offerings?.current?.availablePackages.find(
    (p) => p.identifier === '$rc_monthly',
  );

  const yearlyPrice = yearlyPackage?.product?.priceString ?? '$9.99';
  const monthlyPrice = monthlyPackage?.product?.priceString ?? '$2.99';

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) {
      Alert.alert('Unavailable', 'This plan is not available right now. Please try again later.');
      return;
    }
    try {
      await purchasePackage(pkg);
      Alert.alert(
        'Welcome to Premium!',
        'Thank you! All premium features are now unlocked.',
        [{ text: 'Continue', onPress: () => router.back() }],
      );
    } catch (error: any) {
      if (error?.userCancelled) return;
      Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      const hasPremium = !!info?.entitlements?.active?.['premium'];
      if (hasPremium) {
        Alert.alert('Restored!', 'Your premium access has been restored.', [
          { text: 'Continue', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Purchase Found', 'We could not find a previous purchase linked to your account.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Something went wrong. Please try again.');
    }
  };

  const isWorking = isPurchasing || isRestoring;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#060B0E' : '#F0F4F5' }]}>
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={16}
        testID="paywall-close"
      >
        <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
          <X size={20} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={[Colors.gold, '#E89A10']} style={styles.crownCircle}>
          <Crown size={32} color="#fff" />
        </LinearGradient>

        <Text style={[styles.title, { color: theme.text }]}>Upgrade to Premium</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Support the app and unlock an ad-free experience.
        </Text>

        <View style={styles.featuresSection}>
          {PREMIUM_FEATURES.map((feat, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: isDark ? '#0D2A1A' : '#E6F9EE' }]}>
                <feat.icon size={16} color="#22C55E" />
              </View>
              <Text style={[styles.featureLabel, { color: theme.text }]}>{feat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.planSection}>
          <Animated.View style={{ transform: [{ scale: selectedPlan === 'yearly' ? pulseAnim : 1 }], width: '100%' }}>
            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedPlan === 'yearly' ? Colors.gold : theme.border,
                  borderWidth: selectedPlan === 'yearly' ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
              testID="plan-yearly"
            >
              <View style={styles.planBadge}>
                <LinearGradient colors={[Colors.gold, '#E89A10']} style={styles.badgeGradient}>
                  <Text style={styles.badgeText}>BEST VALUE</Text>
                </LinearGradient>
              </View>
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <View style={[styles.radioOuter, selectedPlan === 'yearly' && styles.radioOuterActive]}>
                    {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                  </View>
                  <View>
                    <Text style={[styles.planName, { color: theme.text }]}>Yearly</Text>
                    <Text style={[styles.planTrial, { color: '#22C55E' }]}>7 days free trial</Text>
                  </View>
                </View>
                <View style={styles.planRight}>
                  <Text style={[styles.planPrice, { color: theme.text }]}>{yearlyPrice}</Text>
                  <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/year</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: theme.surface,
                borderColor: selectedPlan === 'monthly' ? Colors.primary : theme.border,
                borderWidth: selectedPlan === 'monthly' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
            testID="plan-monthly"
          >
            <View style={styles.planContent}>
              <View style={styles.planLeft}>
                <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioOuterActiveBlue]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioInnerBlue} />}
                </View>
                <View>
                  <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                  <Text style={[styles.planSubtext, { color: theme.textTertiary }]}>No commitment</Text>
                </View>
              </View>
              <View style={styles.planRight}>
                <Text style={[styles.planPrice, { color: theme.text }]}>{monthlyPrice}</Text>
                <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.purchaseBtn, isWorking && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={isWorking}
          testID="paywall-purchase"
        >
          <LinearGradient
            colors={selectedPlan === 'yearly' ? [Colors.gold, '#E89A10'] : ['#00D4E6', '#00A3B8']}
            style={styles.purchaseGradient}
          >
            {isWorking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.purchaseText}>
                {selectedPlan === 'yearly'
                  ? `Start Free Trial — then ${yearlyPrice}/year`
                  : `Get Premium — ${monthlyPrice}/month`}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {selectedPlan === 'yearly' && (
          <Text style={[styles.trialNote, { color: theme.textSecondary }]}>
            7 days free, then {yearlyPrice}/year. Cancel anytime.
          </Text>
        )}

        <View style={styles.comparisonSection}>
          <Text style={[styles.comparisonTitle, { color: theme.text }]}>Compare Plans</Text>
          <View style={styles.comparisonHeader}>
            <Text style={[styles.compHeaderLabel, { color: theme.textTertiary }]}></Text>
            <Text style={[styles.compHeaderValue, { color: theme.textTertiary }]}>FREE</Text>
            <Text style={[styles.compHeaderValue, { color: Colors.gold }]}>PRO</Text>
          </View>
          {FREE_FEATURES.map((feat, idx) => (
            <View key={idx} style={[styles.compRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.compLabel, { color: theme.text }]}>{feat.label}</Text>
              <View style={styles.compValue}>
                {feat.included ? (
                  <Check size={16} color="#22C55E" />
                ) : (
                  <X size={16} color={Colors.danger} />
                )}
              </View>
              <View style={styles.compValue}>
                <Check size={16} color="#22C55E" />
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={isWorking}
          testID="paywall-restore"
        >
          <RotateCcw size={14} color={Colors.primary} />
          <Text style={[styles.restoreText, { color: Colors.primary }]}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={[styles.legalText, { color: theme.textTertiary }]}>
          {selectedPlan === 'yearly'
            ? 'After the 7-day free trial, your subscription will auto-renew at the yearly rate unless cancelled at least 24 hours before the end of the current period.'
            : 'Subscription auto-renews monthly unless cancelled at least 24 hours before the end of the current period.'}
          {'\n\n'}Cancel anytime via App Store or Google Play settings.
        </Text>

        {offeringsLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading plans...</Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: fontFamily.system,
    fontSize: 26,
    fontWeight: fw.bold,
    textAlign: 'center' as const,
    letterSpacing: 0.36,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
    letterSpacing: -0.24,
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  featuresSection: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
    flex: 1,
  },
  planSection: {
    width: '100%',
    marginTop: 24,
    gap: 10,
    alignItems: 'center',
  },
  planCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  planBadge: {
    position: 'absolute' as const,
    top: -1,
    right: 12,
    zIndex: 1,
  },
  badgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  badgeText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 10,
    fontWeight: fw.bold,
    letterSpacing: 0.8,
  },
  planContent: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  planLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#7E929E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.gold,
  },
  radioOuterActiveBlue: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gold,
  },
  radioInnerBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planName: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
  },
  planTrial: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.medium,
    marginTop: 2,
  },
  planSubtext: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    marginTop: 2,
  },
  planRight: {
    alignItems: 'flex-end' as const,
  },
  planPrice: {
    fontFamily: fontFamily.system,
    fontSize: 20,
    fontWeight: fw.bold,
    letterSpacing: -0.41,
  },
  planPeriod: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
  },
  purchaseBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  purchaseBtnDisabled: {
    opacity: 0.7,
  },
  purchaseGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  purchaseText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
    textAlign: 'center' as const,
  },
  trialNote: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
    marginTop: 8,
    letterSpacing: -0.08,
  },
  comparisonSection: {
    width: '100%',
    marginTop: 28,
  },
  comparisonTitle: {
    fontFamily: fontFamily.system,
    fontSize: 18,
    fontWeight: fw.semibold,
    letterSpacing: -0.36,
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: 'row' as const,
    paddingVertical: 8,
  },
  compHeaderLabel: {
    flex: 1,
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.medium,
  },
  compHeaderValue: {
    width: 56,
    textAlign: 'center' as const,
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.bold,
    letterSpacing: 0.6,
  },
  compRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compLabel: {
    flex: 1,
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.regular,
    letterSpacing: -0.15,
  },
  compValue: {
    width: 56,
    alignItems: 'center',
  },
  restoreBtn: {
    marginTop: 24,
    paddingVertical: 12,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  restoreText: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.medium,
    letterSpacing: -0.24,
  },
  legalText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.regular,
    textAlign: 'center' as const,
    marginTop: 12,
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  loadingOverlay: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: fontFamily.system,
    fontSize: 13,
  },
});
