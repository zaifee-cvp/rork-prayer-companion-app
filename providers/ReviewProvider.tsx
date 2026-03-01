import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { gregorianToHijri } from '@/utils/hijri';

const REVIEW_STORAGE_KEY = '@prayer_companion_review';
const APP_VERSION = '1.0.0';

interface ReviewData {
  appOpens: number;
  firstLaunchDate: string;
  lastReviewVersion: string | null;
  lastDismissDate: string | null;
  lastReviewRequestDate: string | null;
  subscriptionStartDate: string | null;
  premiumReviewShown: boolean;
  softModalDismissed: boolean;
}

const DEFAULT_REVIEW_DATA: ReviewData = {
  appOpens: 0,
  firstLaunchDate: new Date().toISOString(),
  lastReviewVersion: null,
  lastDismissDate: null,
  lastReviewRequestDate: null,
  subscriptionStartDate: null,
  premiumReviewShown: false,
  softModalDismissed: false,
};

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function isRamadan(): boolean {
  const hijri = gregorianToHijri(new Date());
  return hijri.month === 9;
}

export const [ReviewProvider, useReview] = createContextHook(() => {
  const [reviewData, setReviewData] = useState<ReviewData>(DEFAULT_REVIEW_DATA);
  const [showSoftModal, setShowSoftModal] = useState<boolean>(false);
  const [showRamadanBanner, setShowRamadanBanner] = useState<boolean>(false);
  const [ramadanBannerDismissed, setRamadanBannerDismissed] = useState<boolean>(false);
  const hasCheckedRef = useRef<boolean>(false);

  const reviewQuery = useQuery({
    queryKey: ['review-data'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_REVIEW_DATA, ...JSON.parse(stored) } as ReviewData;
      }
      const fresh = { ...DEFAULT_REVIEW_DATA, firstLaunchDate: new Date().toISOString() };
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ReviewData) => {
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(data));
      return data;
    },
  });

  useEffect(() => {
    if (reviewQuery.data) {
      setReviewData(reviewQuery.data);
    }
  }, [reviewQuery.data]);

  const updateReviewData = useCallback((partial: Partial<ReviewData>) => {
    setReviewData((prev) => {
      const updated = { ...prev, ...partial };
      saveMutation.mutate(updated);
      return updated;
    });
  }, []);

  const incrementAppOpens = useCallback(() => {
    setReviewData((prev) => {
      const updated = { ...prev, appOpens: prev.appOpens + 1 };
      saveMutation.mutate(updated);
      console.log('[Review] App opens:', updated.appOpens);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (!reviewQuery.isLoading && reviewQuery.data) {
      incrementAppOpens();
    }
  }, [reviewQuery.isLoading]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        hasCheckedRef.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  const canShowReview = useCallback((): boolean => {
    if (Platform.OS === 'web') return false;

    if (reviewData.appOpens < 5) {
      console.log('[Review] Not enough app opens:', reviewData.appOpens);
      return false;
    }

    const now = new Date().toISOString();
    const daysSinceFirstLaunch = daysBetween(reviewData.firstLaunchDate, now);
    if (daysSinceFirstLaunch < 7) {
      console.log('[Review] Too early since first launch:', daysSinceFirstLaunch, 'days');
      return false;
    }

    if (reviewData.lastReviewVersion === APP_VERSION) {
      console.log('[Review] Already reviewed this version');
      return false;
    }

    if (reviewData.lastDismissDate) {
      const daysSinceDismiss = daysBetween(reviewData.lastDismissDate, now);
      if (daysSinceDismiss < 30) {
        console.log('[Review] Dismissed recently:', daysSinceDismiss, 'days ago');
        return false;
      }
    }

    if (reviewData.lastReviewRequestDate) {
      const daysSinceLastRequest = daysBetween(reviewData.lastReviewRequestDate, now);
      if (daysSinceLastRequest < 30) {
        console.log('[Review] Requested recently:', daysSinceLastRequest, 'days ago');
        return false;
      }
    }

    return true;
  }, [reviewData]);

  const canShowPremiumReview = useCallback((isPremium: boolean): boolean => {
    if (Platform.OS === 'web') return false;
    if (!isPremium) return false;
    if (reviewData.premiumReviewShown) return false;
    if (reviewData.lastReviewVersion === APP_VERSION) return false;

    if (!reviewData.subscriptionStartDate) return false;

    const daysSinceSub = daysBetween(reviewData.subscriptionStartDate, new Date().toISOString());
    if (daysSinceSub < 3) {
      console.log('[Review] Premium user too new:', daysSinceSub, 'days');
      return false;
    }

    return true;
  }, [reviewData]);

  const checkAndTriggerReview = useCallback((isPremium: boolean) => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (canShowPremiumReview(isPremium)) {
      console.log('[Review] Triggering premium user review flow');
      setShowSoftModal(true);
      return;
    }

    if (canShowReview()) {
      console.log('[Review] Triggering standard review flow');
      setShowSoftModal(true);
    }
  }, [canShowReview, canShowPremiumReview]);

  const onSoftModalPositive = useCallback(async () => {
    setShowSoftModal(false);
    console.log('[Review] User responded positively, requesting native review');

    updateReviewData({
      lastReviewRequestDate: new Date().toISOString(),
      lastReviewVersion: APP_VERSION,
      premiumReviewShown: true,
    });

    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
        console.log('[Review] Native review requested');
      } else {
        console.log('[Review] Store review not available');
      }
    } catch (e) {
      console.log('[Review] Error requesting review:', e);
    }
  }, [updateReviewData]);

  const onSoftModalNegative = useCallback(() => {
    setShowSoftModal(false);
    console.log('[Review] User responded negatively, will not show review');

    updateReviewData({
      lastDismissDate: new Date().toISOString(),
      softModalDismissed: true,
    });
  }, [updateReviewData]);

  const onSoftModalDismiss = useCallback(() => {
    setShowSoftModal(false);
    updateReviewData({
      lastDismissDate: new Date().toISOString(),
    });
  }, [updateReviewData]);

  const markSubscriptionStart = useCallback(() => {
    if (!reviewData.subscriptionStartDate) {
      updateReviewData({ subscriptionStartDate: new Date().toISOString() });
      console.log('[Review] Subscription start marked');
    }
  }, [reviewData.subscriptionStartDate, updateReviewData]);

  useEffect(() => {
    const ramadan = isRamadan();
    setShowRamadanBanner(ramadan && !ramadanBannerDismissed);
  }, [ramadanBannerDismissed]);

  const dismissRamadanBanner = useCallback(() => {
    setRamadanBannerDismissed(true);
    setShowRamadanBanner(false);
  }, []);

  const onRamadanReviewTap = useCallback(async () => {
    setShowRamadanBanner(false);
    setRamadanBannerDismissed(true);

    if (Platform.OS === 'web') return;

    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
        updateReviewData({
          lastReviewRequestDate: new Date().toISOString(),
          lastReviewVersion: APP_VERSION,
        });
      }
    } catch (e) {
      console.log('[Review] Ramadan review error:', e);
    }
  }, [updateReviewData]);

  return {
    showSoftModal,
    showRamadanBanner,
    checkAndTriggerReview,
    onSoftModalPositive,
    onSoftModalNegative,
    onSoftModalDismiss,
    markSubscriptionStart,
    dismissRamadanBanner,
    onRamadanReviewTap,
    isRamadan: isRamadan(),
  };
});
