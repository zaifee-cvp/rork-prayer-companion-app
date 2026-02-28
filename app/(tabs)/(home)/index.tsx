import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Compass,
  BookOpen,
  Hand,
  Crown,
  ChevronRight,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  CloudSun,
  Radio,
  MapPin,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import CountdownRing from '@/components/CountdownRing';
import PremiumGate from '@/components/PremiumGate';
import {
  formatTime,
  getTimeUntil,
  PRAYER_DISPLAY_NAMES,
  PrayerName,
} from '@/utils/prayer-times';
import { formatHijriDate } from '@/utils/hijri';

const PRAYER_ICONS: Record<string, (color: string) => React.ReactNode> = {
  fajr: (c) => <Sunrise size={15} color={c} strokeWidth={1.8} />,
  sunrise: (c) => <Sun size={15} color={c} strokeWidth={1.8} />,
  dhuhr: (c) => <CloudSun size={15} color={c} strokeWidth={1.8} />,
  asr: (c) => <Sun size={15} color={c} strokeWidth={1.8} />,
  maghrib: (c) => <Sunset size={15} color={c} strokeWidth={1.8} />,
  isha: (c) => <Moon size={15} color={c} strokeWidth={1.8} />,
};

const PRAYER_ACCENT: Record<string, string> = {
  fajr: '#7BAFA2',
  sunrise: '#C4A265',
  dhuhr: '#C49565',
  asr: '#C4A265',
  maghrib: '#C47B65',
  isha: '#8B7BAF',
};

export default function HomeScreen() {
  const { theme, isDark, settings, prayerTimes, nextPrayer, hijriDate, now, city, isLoading } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && !settings.onboardingComplete) {
      router.replace('/onboarding' as any);
    }
  }, [isLoading, settings.onboardingComplete]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const timeUntil = useMemo(() => {
    if (!nextPrayer) return null;
    return getTimeUntil(nextPrayer.time, now);
  }, [nextPrayer, now]);

  const progress = useMemo(() => {
    if (!nextPrayer || !timeUntil) return 0;
    const prayers: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const idx = prayers.indexOf(nextPrayer.name);
    if (idx <= 0) return timeUntil.totalSeconds > 0 ? 1 - timeUntil.totalSeconds / 3600 : 1;
    const prevTime = prayerTimes[prayers[idx - 1]];
    const totalDuration = nextPrayer.time.getTime() - prevTime.getTime();
    const elapsed = now.getTime() - prevTime.getTime();
    return Math.max(0, Math.min(1, elapsed / totalDuration));
  }, [nextPrayer, timeUntil, prayerTimes, now]);

  const gregorianDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const prayerList: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >
        <View style={styles.locationRow}>
          <MapPin size={12} color={theme.textTertiary} strokeWidth={1.8} />
          <Text style={[styles.locationText, { color: theme.textTertiary }]}>
            {city.name}, {city.country}
          </Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>
            {nextPrayer ? 'Next Prayer' : 'All prayers done'}
          </Text>
          <Text style={[styles.heroName, { color: theme.text }]}>
            {nextPrayer ? PRAYER_DISPLAY_NAMES[nextPrayer.name] : 'Rest well'}
          </Text>
          <Text style={[styles.heroTime, { color: Colors.primary }]}>
            {nextPrayer ? formatTime(nextPrayer.time, settings.use24hFormat) : '—'}
          </Text>

          {timeUntil && (
            <View style={styles.countdownRow}>
              <CountdownRing
                progress={progress}
                size={64}
                strokeWidth={4}
                color={nextPrayer ? PRAYER_ACCENT[nextPrayer.name] || Colors.primary : Colors.primary}
                bgColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
              >
                <Text style={[styles.countdownMini, { color: theme.textSecondary }]}>
                  {String(timeUntil.hours).padStart(2, '0')}:{String(timeUntil.minutes).padStart(2, '0')}
                </Text>
              </CountdownRing>
              <Text style={[styles.countdownLabel, { color: theme.textTertiary }]}>remaining</Text>
            </View>
          )}
        </View>

        <View style={[styles.dateRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.dateGregorian, { color: theme.textSecondary }]}>{gregorianDate}</Text>
          <Text style={[styles.dateHijri, { color: theme.textTertiary }]}>
            {formatHijriDate(hijriDate)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {prayerList.map((name, index) => {
            const isNext = nextPrayer?.name === name;
            const isPast = prayerTimes[name] < now && !isNext;
            const accentColor = PRAYER_ACCENT[name];
            return (
              <View key={name}>
                <View
                  style={[
                    styles.prayerRow,
                    isNext && [styles.prayerRowActive, {
                      backgroundColor: isDark ? 'rgba(107,158,145,0.14)' : 'rgba(107,158,145,0.09)',
                    }],
                  ]}
                >
                  <View style={styles.prayerRowLeft}>
                    {PRAYER_ICONS[name](isPast ? theme.textTertiary : accentColor)}
                    <Text
                      style={[
                        styles.prayerRowName,
                        { color: isPast ? theme.textTertiary : (isNext ? theme.text : theme.text) },
                        isNext && { fontWeight: '600' as const },
                      ]}
                    >
                      {PRAYER_DISPLAY_NAMES[name]}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.prayerRowTime,
                      { color: isPast ? theme.textTertiary : (isNext ? Colors.primary : theme.textSecondary) },
                      isNext && { fontWeight: '600' as const },
                    ]}
                  >
                    {formatTime(prayerTimes[name], settings.use24hFormat)}
                  </Text>
                </View>
                {index < prayerList.length - 1 && !isNext && nextPrayer?.name !== prayerList[index + 1] && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.radioCard, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/radio' as any)}
          activeOpacity={0.7}
          testID="quick-radio"
        >
          <View style={[styles.radioIconWrap, { backgroundColor: isDark ? 'rgba(107,158,145,0.15)' : 'rgba(107,158,145,0.1)' }]}>
            <Radio size={18} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <View style={styles.radioTextWrap}>
            <Text style={[styles.radioTitle, { color: theme.text }]}>Live Quran Radio</Text>
            <Text style={[styles.radioSub, { color: theme.textTertiary }]}>Listen to live recitation</Text>
          </View>
          <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/qibla' as any)}
            activeOpacity={0.7}
            testID="quick-qibla"
          >
            <Compass size={22} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>Qibla</Text>
            <ChevronRight size={14} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/dhikr' as any)}
            activeOpacity={0.7}
            testID="quick-dhikr"
          >
            <Hand size={22} color={Colors.gold} strokeWidth={1.8} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>Dhikr</Text>
            <ChevronRight size={14} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <PremiumGate locked={!settings.isPremium}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, paddingVertical: 18 }]}
            onPress={() => router.push('/quran' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.continueRow}>
              <BookOpen size={18} color={Colors.primary} strokeWidth={1.8} />
              <View style={styles.continueText}>
                <Text style={[styles.continueTitle, { color: theme.text }]}>Continue Reading</Text>
                <Text style={[styles.continueSub, { color: theme.textTertiary }]}>
                  Pick up where you left off
                </Text>
              </View>
              <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
        </PremiumGate>

        {!settings.isPremium && (
          <TouchableOpacity
            style={[styles.premiumBanner, { backgroundColor: isDark ? 'rgba(196,162,101,0.08)' : 'rgba(196,162,101,0.06)' }]}
            onPress={() => router.push('/paywall' as any)}
            activeOpacity={0.7}
          >
            <Crown size={18} color={Colors.gold} strokeWidth={1.8} />
            <View style={styles.premiumBannerText}>
              <Text style={[styles.premiumTitle, { color: theme.text }]}>Unlock Premium</Text>
              <Text style={[styles.premiumSubtitle, { color: theme.textSecondary }]}>Ad-free experience & more</Text>
            </View>
            <ChevronRight size={16} color={Colors.gold} strokeWidth={1.5} />
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </Animated.ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  locationText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    letterSpacing: 0.2,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  heroLabel: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.medium,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  heroName: {
    fontFamily: fontFamily.system,
    fontSize: 44,
    fontWeight: fw.bold,
    letterSpacing: -0.5,
    lineHeight: 50,
  },
  heroTime: {
    fontFamily: fontFamily.system,
    fontSize: 24,
    fontWeight: fw.semibold,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  countdownRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  countdownMini: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    fontWeight: fw.semibold,
  },
  countdownLabel: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
  },
  dateRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    marginBottom: 24,
  },
  dateGregorian: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
  },
  dateHijri: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  prayerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  prayerRowActive: {
    borderRadius: 10,
  },
  prayerRowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  prayerRowName: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.2,
  },
  prayerRowTime: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  quickActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    fontFamily: fontFamily.system,
    flex: 1,
    fontSize: 14,
    fontWeight: fw.medium,
    letterSpacing: -0.2,
  },
  continueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  continueText: {
    flex: 1,
  },
  continueTitle: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.medium,
    letterSpacing: -0.2,
  },
  continueSub: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    marginTop: 2,
  },
  premiumBanner: {
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumTitle: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.medium,
    letterSpacing: -0.2,
  },
  premiumSubtitle: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    marginTop: 2,
  },
  radioCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  radioIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioTextWrap: {
    flex: 1,
  },
  radioTitle: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.medium,
    letterSpacing: -0.2,
  },
  radioSub: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    marginTop: 2,
  },
});
