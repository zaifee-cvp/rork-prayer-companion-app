import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Purchases, { PurchasesOfferings, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import Colors from '@/constants/colors';
import cities, { City } from '@/constants/cities';
import {
  calculatePrayerTimes,
  getTimezoneOffsetHours,
  getNextPrayer,
  PrayerTimesResult,
  PrayerName,
} from '@/utils/prayer-times';
import { gregorianToHijri, HijriDate } from '@/utils/hijri';
import { schedulePrayerNotifications, cancelAllPrayerNotifications } from '@/utils/notifications';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Madhab = 'hanafi' | 'shafi';
export type HighLatRule = 'middle' | 'seventh' | 'angle';

export interface AppSettings {
  onboardingComplete: boolean;
  isPremium: boolean;
  themeMode: ThemeMode;
  calculationMethod: string;
  madhab: Madhab;
  highLatRule: HighLatRule;
  adjustments: Record<string, number>;
  useDeviceTimezone: boolean;
  manualTimezone: string;
  selectedCityIndex: number;
  use24hFormat: boolean;
  enabledNotificationPrayer: PrayerName | null;
  enabledNotificationPrayers: PrayerName[];
  reminderBeforePrayer: boolean;
  reminderMinutesBefore: number;
  azanAtPrayerTime: boolean;
  quranTranslationId: number;
  showTransliteration: boolean;
  showArabic: boolean;
  showTranslation: boolean;
  transliterationFontSize: number;
  arabicFontSize: number;
  selectedReciterId: string;
  autoPlayNextAyah: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  isPremium: false,
  themeMode: 'system',
  calculationMethod: 'MWL',
  madhab: 'shafi',
  highLatRule: 'middle',
  adjustments: {},
  useDeviceTimezone: true,
  manualTimezone: 'Asia/Riyadh',
  selectedCityIndex: 0,
  use24hFormat: false,
  enabledNotificationPrayer: null,
  enabledNotificationPrayers: [],
  reminderBeforePrayer: false,
  reminderMinutesBefore: 10,
  azanAtPrayerTime: false,
  quranTranslationId: 20,
  showTransliteration: false,
  showArabic: true,
  showTranslation: true,
  transliterationFontSize: 15,
  arabicFontSize: 26,
  selectedReciterId: 'alafasy',
  autoPlayNextAyah: false,
};

const STORAGE_KEY = '@prayer_companion_settings';
const DHIKR_HISTORY_KEY = '@prayer_companion_dhikr';
const ENTITLEMENT_ID = 'premium';

function getRCApiKey(): string | undefined {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

let rcConfigured = false;
const apiKey = getRCApiKey();
if (apiKey) {
  try {
    Purchases.configure({ apiKey });
    rcConfigured = true;
    console.log('[RC] RevenueCat configured successfully');
  } catch (e) {
    console.log('[RC] Failed to configure RevenueCat:', e);
  }
} else {
  console.log('[RC] No API key available, RevenueCat not configured');
}

export interface DhikrEntry {
  id: string;
  count: number;
  target: number;
  date: string;
}

export const [AppProvider, useApp] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [now, setNow] = useState<Date>(new Date());
  const [dhikrHistory, setDhikrHistory] = useState<DhikrEntry[]>([]);
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as AppSettings;
      }
      return DEFAULT_SETTINGS;
    },
  });

  const dhikrQuery = useQuery({
    queryKey: ['dhikr-history'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(DHIKR_HISTORY_KEY);
      return stored ? (JSON.parse(stored) as DhikrEntry[]) : [];
    },
  });

  const customerInfoQuery = useQuery({
    queryKey: ['rc-customer-info'],
    queryFn: async (): Promise<CustomerInfo | null> => {
      if (!rcConfigured) return null;
      try {
        const info = await Purchases.getCustomerInfo();
        console.log('[RC] Customer info fetched:', JSON.stringify(info.entitlements.active));
        return info;
      } catch (e) {
        console.log('[RC] Error fetching customer info:', e);
        return null;
      }
    },
    refetchOnWindowFocus: true,
  });

  const offeringsQuery = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: async (): Promise<PurchasesOfferings | null> => {
      if (!rcConfigured) return null;
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[RC] Offerings fetched:', JSON.stringify(offerings.current?.availablePackages.map(p => p.identifier)));
        return offerings;
      } catch (e) {
        console.log('[RC] Error fetching offerings:', e);
        return null;
      }
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      console.log('[RC] Purchasing package:', pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      console.log('[RC] Purchase result:', JSON.stringify(result.customerInfo.entitlements.active));
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      const isPremium = !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (isPremium) {
        updateSettings({ isPremium: true });
      }
    },
    onError: (error: any) => {
      if (error?.userCancelled) {
        console.log('[RC] Purchase cancelled by user');
      } else {
        console.log('[RC] Purchase error:', error?.message || error);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[RC] Restoring purchases...');
      const info = await Purchases.restorePurchases();
      console.log('[RC] Restore result:', JSON.stringify(info.entitlements.active));
      return info;
    },
    onSuccess: (info) => {
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      const isPremium = !!info.entitlements.active[ENTITLEMENT_ID];
      updateSettings({ isPremium });
    },
  });

  const isPremiumFromRC = useMemo(() => {
    if (!customerInfoQuery.data) return false;
    return !!customerInfoQuery.data.entitlements.active[ENTITLEMENT_ID];
  }, [customerInfoQuery.data]);

  useEffect(() => {
    if (customerInfoQuery.data) {
      const rcPremium = !!customerInfoQuery.data.entitlements.active[ENTITLEMENT_ID];
      if (rcPremium !== settings.isPremium) {
        updateSettings({ isPremium: rcPremium });
      }
    }
  }, [isPremiumFromRC]);

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (dhikrQuery.data) setDhikrHistory(dhikrQuery.data);
  }, [dhikrQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
  });

  const dhikrMutation = useMutation({
    mutationFn: async (entries: DhikrEntry[]) => {
      await AsyncStorage.setItem(DHIKR_HISTORY_KEY, JSON.stringify(entries));
      return entries;
    },
  });

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveMutation.mutate(updated);
      return updated;
    });
  }, []);

  const addDhikrEntry = useCallback((entry: DhikrEntry) => {
    setDhikrHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 100);
      dhikrMutation.mutate(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const city: City = cities[settings.selectedCityIndex] || cities[0];

  const timezoneOffset = useMemo(() => {
    if (settings.useDeviceTimezone) {
      return -new Date().getTimezoneOffset() / 60;
    }
    return getTimezoneOffsetHours(settings.manualTimezone);
  }, [settings.useDeviceTimezone, settings.manualTimezone, now]);

  const prayerTimes: PrayerTimesResult = useMemo(() => {
    return calculatePrayerTimes(
      now,
      city.lat,
      city.lng,
      timezoneOffset,
      settings.calculationMethod,
      settings.madhab,
      settings.adjustments,
      settings.highLatRule,
    );
  }, [
    now.getDate(),
    city.lat,
    city.lng,
    timezoneOffset,
    settings.calculationMethod,
    settings.madhab,
    settings.highLatRule,
    JSON.stringify(settings.adjustments),
  ]);

  const nextPrayer = useMemo(() => getNextPrayer(prayerTimes, now), [prayerTimes, now]);

  const hijriDate: HijriDate = useMemo(() => gregorianToHijri(now), [now.getDate()]);

  const isDark = useMemo(() => {
    if (settings.themeMode === 'light') return false;
    if (settings.themeMode === 'dark') return true;
    return systemColorScheme === 'dark';
  }, [settings.themeMode, systemColorScheme]);

  const theme = useMemo(() => (isDark ? Colors.dark : Colors.light), [isDark]);

  useEffect(() => {
    const enabledPrayers = settings.enabledNotificationPrayers;
    const hasAnyNotification = enabledPrayers.length > 0 && (settings.reminderBeforePrayer || settings.azanAtPrayerTime);

    if (!hasAnyNotification) {
      cancelAllPrayerNotifications();
      return;
    }

    schedulePrayerNotifications({
      prayerTimes,
      enabledPrayers,
      reminderEnabled: settings.reminderBeforePrayer,
      reminderMinutes: settings.reminderMinutesBefore,
      azanEnabled: settings.azanAtPrayerTime,
      now,
    });
  }, [
    prayerTimes.fajr?.getTime(),
    prayerTimes.dhuhr?.getTime(),
    prayerTimes.asr?.getTime(),
    prayerTimes.maghrib?.getTime(),
    prayerTimes.isha?.getTime(),
    settings.enabledNotificationPrayers.join(','),
    settings.reminderBeforePrayer,
    settings.reminderMinutesBefore,
    settings.azanAtPrayerTime,
  ]);

  const dhikrStreak = useMemo(() => {
    if (dhikrHistory.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dhikrHistory.some((e) => e.date === dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [dhikrHistory]);

  return {
    settings,
    updateSettings,
    now,
    city,
    prayerTimes,
    nextPrayer,
    hijriDate,
    isDark,
    theme,
    timezoneOffset,
    isLoading: settingsQuery.isLoading,
    dhikrHistory,
    addDhikrEntry,
    dhikrStreak,
    offerings: offeringsQuery.data,
    offeringsLoading: offeringsQuery.isLoading,
    customerInfo: customerInfoQuery.data,
    purchasePackage: purchaseMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
    restorePurchases: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    rcConfigured,
  };
});

export function usePremiumCheck() {
  const { settings } = useApp();
  return settings.isPremium;
}
