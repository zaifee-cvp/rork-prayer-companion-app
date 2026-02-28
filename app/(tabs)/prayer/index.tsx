import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  Sunrise,
  Sunset,
  CloudSun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import PremiumGate from '@/components/PremiumGate';
import CountdownRing from '@/components/CountdownRing';
import {
  formatTime,
  getTimeUntil,
  PRAYER_DISPLAY_NAMES,
  PrayerName,
  calculatePrayerTimes,
} from '@/utils/prayer-times';

const PRAYER_ICONS_MAP: Record<string, (color: string) => React.ReactNode> = {
  fajr: (c) => <Sunrise size={18} color={c} strokeWidth={1.8} />,
  sunrise: (c) => <Sun size={18} color={c} strokeWidth={1.8} />,
  dhuhr: (c) => <CloudSun size={18} color={c} strokeWidth={1.8} />,
  asr: (c) => <Sun size={18} color={c} strokeWidth={1.8} />,
  maghrib: (c) => <Sunset size={18} color={c} strokeWidth={1.8} />,
  isha: (c) => <Moon size={18} color={c} strokeWidth={1.8} />,
};

const PRAYER_COLORS: Record<string, string> = {
  fajr: '#7BAFA2',
  sunrise: '#C4A265',
  dhuhr: '#C49565',
  asr: '#C4A265',
  maghrib: '#C47B65',
  isha: '#8B7BAF',
};

export default function PrayerScreen() {
  const { theme, isDark, settings, prayerTimes, nextPrayer, now, city, timezoneOffset } = useApp();
  const insets = useSafeAreaInsets();
  const [monthOffset, setMonthOffset] = useState(0);

  const timeUntil = useMemo(() => {
    if (!nextPrayer) return null;
    return getTimeUntil(nextPrayer.time, now);
  }, [nextPrayer, now]);

  const progress = useMemo(() => {
    if (!nextPrayer || !timeUntil) return 0;
    const prayers: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const idx = prayers.indexOf(nextPrayer.name);
    if (idx <= 0) return 1;
    const prevTime = prayerTimes[prayers[idx - 1]];
    const totalDuration = nextPrayer.time.getTime() - prevTime.getTime();
    const elapsed = now.getTime() - prevTime.getTime();
    return Math.max(0, Math.min(1, elapsed / totalDuration));
  }, [nextPrayer, timeUntil, prayerTimes, now]);

  const prayerList: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  const monthlyData = useMemo(() => {
    const targetDate = new Date(now);
    targetDate.setMonth(targetDate.getMonth() + monthOffset);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const times = calculatePrayerTimes(
        date, city.lat, city.lng, timezoneOffset,
        settings.calculationMethod, settings.madhab, settings.adjustments, settings.highLatRule,
      );
      rows.push({ day: d, date, times });
    }
    return { year, month, rows };
  }, [monthOffset, city, timezoneOffset, settings.calculationMethod, settings.madhab, settings.highLatRule, JSON.stringify(settings.adjustments)]);

  const monthName = new Date(monthlyData.year, monthlyData.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const renderMonthlyRow = useCallback(({ item }: { item: typeof monthlyData.rows[0] }) => {
    const isToday = item.date.toDateString() === now.toDateString();
    return (
      <View style={[styles.monthRow, isToday && { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.05)' }]}>
        <Text style={[styles.monthDay, { color: isToday ? Colors.primary : theme.text }]}>{item.day}</Text>
        {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map((p) => (
          <Text key={p} style={[styles.monthTime, { color: theme.textSecondary }]}>
            {formatTime(item.times[p], true)}
          </Text>
        ))}
      </View>
    );
  }, [isDark, theme, now]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Prayer Times</Text>
        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
          {city.name}, {city.country}
        </Text>

        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroLabel, { color: theme.textTertiary }]}>Next Prayer</Text>
              <Text style={[styles.heroName, { color: theme.text }]}>
                {nextPrayer ? PRAYER_DISPLAY_NAMES[nextPrayer.name] : 'Done for today'}
              </Text>
              {timeUntil && (
                <Text style={[styles.heroCountdown, { color: theme.textSecondary }]}>
                  {timeUntil.hours > 0 ? `${timeUntil.hours}h ` : ''}
                  {timeUntil.minutes}m {timeUntil.seconds}s
                </Text>
              )}
            </View>
            <CountdownRing
              progress={progress}
              size={80}
              strokeWidth={4}
              color={nextPrayer ? PRAYER_COLORS[nextPrayer.name] || Colors.primary : Colors.primary}
              bgColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
            >
              <Text style={[styles.heroTime, { color: theme.textSecondary }]}>
                {nextPrayer ? formatTime(nextPrayer.time, settings.use24hFormat) : '—'}
              </Text>
            </CountdownRing>
          </View>
        </View>

        <View style={[styles.timesCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today</Text>
          {prayerList.map((name, index) => {
            const isNext = nextPrayer?.name === name;
            const isPast = prayerTimes[name] < now && !isNext;
            const iconColor = PRAYER_COLORS[name];
            return (
              <View key={name}>
                <View
                  style={[
                    styles.prayerRow,
                    isNext && { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.05)' },
                  ]}
                >
                  <View style={styles.prayerLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: `${iconColor}12` }]}>
                      {PRAYER_ICONS_MAP[name](iconColor)}
                    </View>
                    <Text style={[
                      styles.prayerName,
                      { color: isPast ? theme.textTertiary : theme.text },
                      isNext && { fontWeight: '600' as const },
                    ]}>
                      {PRAYER_DISPLAY_NAMES[name]}
                    </Text>
                  </View>
                  <Text style={[
                    styles.prayerTime,
                    { color: isPast ? theme.textTertiary : (isNext ? Colors.primary : theme.textSecondary) },
                    isNext && { fontWeight: '600' as const },
                  ]}>
                    {formatTime(prayerTimes[name], settings.use24hFormat)}
                  </Text>
                </View>
                {index < prayerList.length - 1 && !isNext && nextPrayer?.name !== prayerList[index + 1] && (
                  <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                )}
              </View>
            );
          })}
        </View>

        <PremiumGate locked={!settings.isPremium}>
          <View style={[styles.monthlySection, { backgroundColor: theme.surface }]}>
            <View style={styles.monthlyHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Timetable</Text>
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => setMonthOffset((p) => p - 1)} hitSlop={12}>
                  <ChevronLeft size={18} color={Colors.primary} strokeWidth={1.8} />
                </TouchableOpacity>
                <Text style={[styles.monthLabel, { color: theme.text }]}>{monthName}</Text>
                <TouchableOpacity onPress={() => setMonthOffset((p) => p + 1)} hitSlop={12}>
                  <ChevronRight size={18} color={Colors.primary} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.monthHeaderRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.monthHeaderCell, styles.dayCell, { color: theme.textTertiary }]}>Day</Text>
              {(['Fajr', 'Dhuhr', 'Asr', 'Magh', 'Isha']).map((n) => (
                <Text key={n} style={[styles.monthHeaderCell, { color: theme.textTertiary }]}>{n}</Text>
              ))}
            </View>
            <FlatList
              data={monthlyData.rows}
              renderItem={renderMonthlyRow}
              keyExtractor={(item) => String(item.day)}
              scrollEnabled={false}
            />
          </View>
        </PremiumGate>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontFamily: fontFamily.system, fontSize: 28, fontWeight: fw.bold, letterSpacing: -0.3, lineHeight: 34, paddingTop: 8 },
  subtitle: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, marginTop: 4, marginBottom: 24 },
  heroCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  heroRow: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center' },
  heroInfo: { flex: 1 },
  heroLabel: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  heroName: { fontFamily: fontFamily.system, fontSize: 24, fontWeight: fw.bold, letterSpacing: -0.3, marginTop: 4 },
  heroCountdown: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium, marginTop: 4 },
  heroTime: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium },
  timesCard: {
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  sectionTitle: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.2, marginBottom: 8, paddingHorizontal: 14, paddingTop: 10 },
  prayerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  prayerLeft: { flexDirection: 'row' as const, alignItems: 'center', gap: 12 },
  iconCircle: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  prayerName: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, letterSpacing: -0.2 },
  prayerTime: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, letterSpacing: -0.2 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  monthlySection: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    minHeight: 200,
  },
  monthlyHeader: { marginBottom: 12 },
  monthNav: { flexDirection: 'row' as const, alignItems: 'center', gap: 16, marginTop: 8 },
  monthLabel: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium, minWidth: 140, textAlign: 'center' as const },
  monthHeaderRow: {
    flexDirection: 'row' as const,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthHeaderCell: { fontFamily: fontFamily.system, flex: 1, fontSize: 11, fontWeight: fw.medium, letterSpacing: 0.3, textAlign: 'center' as const },
  dayCell: { flex: 0.6 },
  monthRow: {
    flexDirection: 'row' as const,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  monthDay: { fontFamily: fontFamily.system, flex: 0.6, fontSize: 13, fontWeight: fw.medium, textAlign: 'center' as const },
  monthTime: { fontFamily: fontFamily.system, flex: 1, fontSize: 12, fontWeight: fw.regular, textAlign: 'center' as const },
});
