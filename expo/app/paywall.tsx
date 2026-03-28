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
import {
  X,
  Crown,
  Check,
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

export default function PaywallScreen() {
  const {
    theme, isDark, offerings, offeringsLoading, purchasePackage, isPurchasing, restorePurchases, isRestoring,
  } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const yearlyPackage = offerings?.current?.availablePackages.find(
    (p) => p.identifier === '$rc_annual' || p.productIdentifier?.includes('yearly')
  );
  const monthlyPackage = offerings?.current?.availablePackages.find(
    (p) => p.identifier === '$rc_monthly' || p.productIdentifier?.includes('monthly')
  );
  const yearlyPrice = yearlyPackage?.product?.priceString ?? '$9.99';
  const monthlyPrice = monthlyPackage?.product?.priceString ?? '$0.99';

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) { Alert.alert('Unavailable', 'This plan is not available right now.'); return; }
    try {
      await purchasePackage(pkg);
      Alert.alert('Welcome to Premium!', 'All premium features are now unlocked.', [{ text: 'Continue', onPress: () => router.back() }]);
    } catch (error: any) {
      if (error?.userCancelled) return;
      Alert.alert('Purchase Failed', error?.message || 'Something went wrong.');
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      const hasPremium = !!info?.entitlements?.active?.['premium'];
      if (hasPremium) {
        Alert.alert('Restored!', 'Your premium access has been restored.', [{ text: 'Continue', onPress: () => router.back() }]);
      } else {
        Alert.alert('No Purchase Found', 'We could not find a previous purchase.');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Something went wrong.');
    }
  };

  const isWorking = isPurchasing || isRestoring;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#1A1A1C' : '#F8F7F4' }]}>
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={16}
        testID="paywall-close"
      >
        <View style={[styles.closeBg, { backgroundColor: theme.surfaceSecondary }]}>
          <X size={18} color={theme.textSecondary} strokeWidth={1.8} />
        </View>
      </TouchableOpacity>

      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        <View style={[styles.crownCircle, { backgroundColor: isDark ? 'rgba(196,162,101,0.12)' : 'rgba(196,162,101,0.1)' }]}>
          <Crown size={28} color={Colors.gold} strokeWidth={1.8} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Unlock Focused,{"\n"}Uninterrupted Worship</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Premium tools designed for deeper spiritual focus.
        </Text>

        <View style={styles.featuresSection}>
          {PREMIUM_FEATURES.map((feat, idx) => (
            <View key={idx}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(107,158,145,0.1)' : 'rgba(107,158,145,0.08)' }]}>
                  <feat.icon size={16} color={Colors.primary} strokeWidth={1.8} />
                </View>
                <Text style={[styles.featureLabel, { color: theme.text }]}>{feat.label}</Text>
              </View>
              {idx < PREMIUM_FEATURES.length - 1 && (
                <View style={[styles.featureDivider, { backgroundColor: theme.border }]} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.planSection}>
          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: theme.surface,
                borderColor: selectedPlan === 'yearly' ? Colors.gold : theme.border,
                borderWidth: selectedPlan === 'yearly' ? 1.5 : 1,
              },
            ]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
            testID="plan-yearly"
          >
            <View style={styles.planBadge}>
              <View style={[styles.badgeBg, { backgroundColor: Colors.gold }]}>
                <Text style={styles.badgeText}>BEST VALUE</Text>
              </View>
            </View>
            <View style={styles.planContent}>
              <View style={styles.planLeft}>
                <View style={[styles.radioOuter, selectedPlan === 'yearly' && { borderColor: Colors.gold }]}>
                  {selectedPlan === 'yearly' && <View style={[styles.radioInner, { backgroundColor: Colors.gold }]} />}
                </View>
                <View>
                  <Text style={[styles.planName, { color: theme.text }]}>Yearly</Text>
                  <Text style={[styles.planTrial, { color: Colors.primary }]}>7 days free trial</Text>
                </View>
              </View>
              <View style={styles.planRight}>
                <Text style={[styles.planPrice, { color: theme.text }]}>{yearlyPrice}</Text>
                <Text style={[styles.planPeriod, { color: theme.textTertiary }]}>/year</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: theme.surface,
                borderColor: selectedPlan === 'monthly' ? Colors.primary : theme.border,
                borderWidth: selectedPlan === 'monthly' ? 1.5 : 1,
              },
            ]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
            testID="plan-monthly"
          >
            <View style={styles.planContent}>
              <View style={styles.planLeft}>
                <View style={[styles.radioOuter, selectedPlan === 'monthly' && { borderColor: Colors.primary }]}>
                  {selectedPlan === 'monthly' && <View style={[styles.radioInner, { backgroundColor: Colors.primary }]} />}
                </View>
                <View>
                  <Text style={[styles.planName, { color: theme.text }]}>Monthly</Text>
                  <Text style={[styles.planSubtext, { color: theme.textTertiary }]}>No commitment</Text>
                </View>
              </View>
              <View style={styles.planRight}>
                <Text style={[styles.planPrice, { color: theme.text }]}>{monthlyPrice}</Text>
                <Text style={[styles.planPeriod, { color: theme.textTertiary }]}>/month</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.purchaseBtn, { backgroundColor: selectedPlan === 'yearly' ? Colors.gold : Colors.primary }, isWorking && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={isWorking || offeringsLoading}
          testID="paywall-purchase"
        >
          {isWorking || offeringsLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.purchaseText}>
              {selectedPlan === 'yearly'
                ? `Start Free Trial — then ${yearlyPrice}/year`
                : `Get Premium — ${monthlyPrice}/month`}
            </Text>
          )}
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
                {feat.included ? <Check size={15} color={Colors.primary} strokeWidth={2} /> : <X size={15} color={Colors.danger} strokeWidth={1.8} />}
              </View>
              <View style={styles.compValue}>
                <Check size={15} color={Colors.primary} strokeWidth={2} />
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={isWorking} testID="paywall-restore">
          <RotateCcw size={13} color={Colors.primary} strokeWidth={1.8} />
          <Text style={[styles.restoreText, { color: Colors.primary }]}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={[styles.legalText, { color: theme.textTertiary }]}>
          {selectedPlan === 'yearly'
            ? 'After the 7-day free trial, your subscription will auto-renew at the yearly rate unless cancelled at least 24 hours before the end of the current period.'
            : 'Subscription auto-renews at $0.99/month unless cancelled at least 24 hours before the end of the current period.'}
          {'\n\n'}Cancel anytime via App Store or Google Play settings.
        </Text>

        {offeringsLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading plans...</Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: { position: 'absolute' as const, right: 16, zIndex: 10 },
  closeBg: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, alignItems: 'center' },
  crownCircle: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: fontFamily.system, fontSize: 26, fontWeight: fw.bold, textAlign: 'center' as const, letterSpacing: -0.4, lineHeight: 32 },
  subtitle: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, textAlign: 'center' as const, marginTop: 10, lineHeight: 22, maxWidth: 290, color: undefined },
  featuresSection: { width: '100%', marginTop: 32, gap: 16 },
  featureRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 14 },
  featureIcon: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  featureLabel: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, flex: 1 },
  planSection: { width: '100%', marginTop: 32, gap: 14, alignItems: 'center' },
  planCard: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  planBadge: { position: 'absolute' as const, top: -1, right: 12, zIndex: 1 },
  badgeBg: { paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  badgeText: { fontFamily: fontFamily.system, color: '#fff', fontSize: 9, fontWeight: fw.bold, letterSpacing: 0.8 },
  planContent: { flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  planLeft: { flexDirection: 'row' as const, alignItems: 'center', gap: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#9A9A9D', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold },
  planTrial: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  planSubtext: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  planRight: { alignItems: 'flex-end' as const },
  planPrice: { fontFamily: fontFamily.system, fontSize: 20, fontWeight: fw.bold, letterSpacing: -0.3 },
  planPeriod: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular },
  purchaseBtn: { width: '100%', borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', marginTop: 28, minHeight: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 },
  purchaseBtnDisabled: { opacity: 0.7 },
  purchaseText: { fontFamily: fontFamily.system, color: '#fff', fontSize: 16, fontWeight: fw.semibold, textAlign: 'center' as const },
  trialNote: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, textAlign: 'center' as const, marginTop: 8 },
  featureDivider: { height: StyleSheet.hairlineWidth, marginLeft: 48, marginVertical: 2 },
  comparisonSection: { width: '100%', marginTop: 36 },
  comparisonTitle: { fontFamily: fontFamily.system, fontSize: 18, fontWeight: fw.bold, letterSpacing: -0.2, marginBottom: 14 },
  comparisonHeader: { flexDirection: 'row' as const, paddingVertical: 8 },
  compHeaderLabel: { flex: 1, fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium },
  compHeaderValue: { width: 56, textAlign: 'center' as const, fontFamily: fontFamily.system, fontSize: 10, fontWeight: fw.bold, letterSpacing: 0.6 },
  compRow: { flexDirection: 'row' as const, alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  compLabel: { flex: 1, fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.regular },
  compValue: { width: 56, alignItems: 'center' },
  restoreBtn: { marginTop: 24, paddingVertical: 12, flexDirection: 'row' as const, alignItems: 'center', gap: 6 },
  restoreText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium },
  legalText: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.regular, textAlign: 'center' as const, marginTop: 12, lineHeight: 15, paddingHorizontal: 8 },
  loadingOverlay: { marginTop: 16, alignItems: 'center', gap: 8 },
  loadingText: { fontFamily: fontFamily.system, fontSize: 13 },
});
