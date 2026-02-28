import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  Clock,
  Radio,
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

const PRAYER_ICONS: Record<string, React.ReactNode> = {
  fajr: <Sunrise size={16} color="#33ECFF" />,
  sunrise: <Sun size={16} color="#FFB020" />,
  dhuhr: <CloudSun size={16} color="#FF8C42" />,
  asr: <Sun size={16} color="#FFD166" />,
  maghrib: <Sunset size={16} color="#FF6B6B" />,
  isha: <Moon size={16} color="#7A8EFF" />,
};

export default function HomeScreen() {
  const { theme, isDark, settings, prayerTimes, nextPrayer, hijriDate, now, city } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const prayerList: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Today</Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {gregorianDate}
          </Text>
        </View>

        <LinearGradient
          colors={isDark ? ['#0A2028', '#061418'] : ['#00899A', '#006B78']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nextPrayerCard}
        >
          <View style={styles.nextPrayerTop}>
            <View style={styles.nextPrayerInfo}>
              <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
              <Text style={styles.nextPrayerName}>
                {nextPrayer ? PRAYER_DISPLAY_NAMES[nextPrayer.name] : 'All done'}
              </Text>
              <Text style={styles.nextPrayerTime}>
                {nextPrayer ? formatTime(nextPrayer.time, settings.use24hFormat) : '—'}
              </Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationText}>{city.name}, {city.country}</Text>
              </View>
            </View>
            <CountdownRing
              progress={progress}
              size={110}
              strokeWidth={6}
              color={Colors.gold}
              bgColor="rgba(255,255,255,0.15)"
            >
              {timeUntil ? (
                <View style={styles.countdownInner}>
                  <Text style={styles.countdownValue}>
                    {String(timeUntil.hours).padStart(2, '0')}:{String(timeUntil.minutes).padStart(2, '0')}
                  </Text>
                  <Text style={styles.countdownSec}>
                    :{String(timeUntil.seconds).padStart(2, '0')}
                  </Text>
                </View>
              ) : (
                <Moon size={28} color={Colors.gold} />
              )}
            </CountdownRing>
          </View>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Clock size={18} color={Colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Prayer Times</Text>
          </View>
          {prayerList.map((name) => {
            const isNext = nextPrayer?.name === name;
            return (
              <View
                key={name}
                style={[
                  styles.prayerRow,
                  isNext && { backgroundColor: isDark ? 'rgba(0,212,230,0.1)' : 'rgba(0,212,230,0.06)', borderRadius: 10 },
                ]}
              >
                <View style={styles.prayerRowLeft}>
                  {PRAYER_ICONS[name]}
                  <Text
                    style={[
                      styles.prayerRowName,
                      { color: isNext ? Colors.primary : theme.text },
                      isNext && { fontWeight: '700' as const },
                    ]}
                  >
                    {PRAYER_DISPLAY_NAMES[name]}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.prayerRowTime,
                    { color: isNext ? Colors.primary : theme.textSecondary },
                    isNext && { fontWeight: '700' as const },
                  ]}
                >
                  {formatTime(prayerTimes[name], settings.use24hFormat)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.cardHeader}>
            <Moon size={18} color={Colors.gold} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Hijri Date</Text>
          </View>
          <Text style={[styles.hijriMain, { color: theme.text }]}>
            {formatHijriDate(hijriDate)}
          </Text>
          <Text style={[styles.hijriArabic, { color: theme.textSecondary }]}>
            {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year} هـ
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.radioCard, { backgroundColor: isDark ? '#0D1C22' : '#E6FAFB' }]}
          onPress={() => router.push('/radio' as any)}
          activeOpacity={0.7}
          testID="quick-radio"
        >
          <View style={styles.radioIconWrap}>
            <Radio size={22} color="#fff" />
          </View>
          <View style={styles.radioTextWrap}>
            <Text style={[styles.radioTitle, { color: theme.text }]}>Live Quran Radio</Text>
            <Text style={[styles.radioSub, { color: theme.textSecondary }]}>Listen to live recitation</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/qibla' as any)}
            activeOpacity={0.7}
            testID="quick-qibla"
          >
            <Compass size={28} color={Colors.primary} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>Qibla</Text>
            <ChevronRight size={16} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/dhikr' as any)}
            activeOpacity={0.7}
            testID="quick-dhikr"
          >
            <Hand size={28} color={Colors.gold} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>Dhikr</Text>
            <ChevronRight size={16} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        <PremiumGate locked={!settings.isPremium}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/quran' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <BookOpen size={18} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Continue Reading</Text>
            </View>
            <Text style={[styles.resumeText, { color: theme.textSecondary }]}>
              Pick up where you left off in the Quran
            </Text>
          </TouchableOpacity>
        </PremiumGate>

        {!settings.isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/paywall' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.gold, '#E89A10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <Crown size={22} color="#fff" />
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumTitle}>Unlock Lifetime</Text>
                <Text style={styles.premiumSubtitle}>Full access. One-time purchase.</Text>
              </View>
              <ChevronRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  greeting: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
    marginBottom: 2,
  },
  title: {
    fontFamily: fontFamily.system,
    fontSize: 34,
    fontWeight: fw.bold,
    letterSpacing: 0.37,
    lineHeight: 41,
  },
  dateText: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    letterSpacing: -0.08,
    marginTop: 4,
  },
  nextPrayerCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  nextPrayerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerInfo: {
    flex: 1,
  },
  nextPrayerLabel: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: fw.medium,
    letterSpacing: -0.08,
  },
  nextPrayerName: {
    fontFamily: fontFamily.system,
    fontSize: 28,
    fontWeight: fw.bold,
    color: '#fff',
    letterSpacing: 0.36,
    marginTop: 4,
  },
  nextPrayerTime: {
    fontFamily: fontFamily.system,
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: fw.semibold,
    letterSpacing: -0.41,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.08,
  },
  countdownInner: {
    flexDirection: 'row' as const,
    alignItems: 'baseline',
  },
  countdownValue: {
    fontFamily: fontFamily.system,
    fontSize: 22,
    fontWeight: fw.bold,
    color: '#fff',
    letterSpacing: 0.35,
  },
  countdownSec: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.semibold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.08,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: fontFamily.system,
    fontSize: 17,
    fontWeight: fw.semibold,
    letterSpacing: -0.41,
  },
  prayerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  prayerRowLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
  },
  prayerRowName: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
  },
  prayerRowTime: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
  },
  hijriMain: {
    fontFamily: fontFamily.system,
    fontSize: 22,
    fontWeight: fw.bold,
    letterSpacing: 0.35,
  },
  hijriArabic: {
    fontFamily: fontFamily.system,
    fontSize: 17,
    marginTop: 4,
    fontWeight: fw.regular,
    letterSpacing: -0.41,
  },
  quickActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLabel: {
    fontFamily: fontFamily.system,
    flex: 1,
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
  },
  resumeText: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
  },
  premiumBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  premiumGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumTitle: {
    fontFamily: fontFamily.system,
    fontSize: 17,
    fontWeight: fw.semibold,
    color: '#fff',
    letterSpacing: -0.41,
  },
  premiumSubtitle: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: -0.08,
    marginTop: 2,
  },
  radioCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  radioIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioTextWrap: {
    flex: 1,
  },
  radioTitle: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
  },
  radioSub: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.regular,
    letterSpacing: -0.08,
    marginTop: 2,
  },
});
