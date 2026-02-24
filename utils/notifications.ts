import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTimesResult, PrayerName, PRAYER_DISPLAY_NAMES } from '@/utils/prayer-times';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping permission request');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-reminder', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('azan', {
        name: 'Azan (Call to Prayer)',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 500, 250, 500],
      });
    }

    console.log('[Notifications] Permission granted');
    return true;
  } catch (error) {
    console.log('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

export async function cancelAllPrayerNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = notification.content.data as Record<string, unknown> | undefined;
      if (data?.type === 'prayer-reminder' || data?.type === 'azan') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    console.log('[Notifications] Cancelled all prayer notifications');
  } catch (error) {
    console.log('[Notifications] Error cancelling notifications:', error);
  }
}

export async function schedulePrayerNotifications(params: {
  prayerTimes: PrayerTimesResult;
  enabledPrayers: PrayerName[];
  reminderEnabled: boolean;
  reminderMinutes: number;
  azanEnabled: boolean;
  now: Date;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  const { prayerTimes, enabledPrayers, reminderEnabled, reminderMinutes, azanEnabled, now } = params;

  try {
    await cancelAllPrayerNotifications();

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[Notifications] No permission, skipping scheduling');
      return;
    }

    for (const prayerName of enabledPrayers) {
      if (prayerName === 'sunrise') continue;

      const prayerTime = prayerTimes[prayerName];
      if (!prayerTime) continue;

      const displayName = PRAYER_DISPLAY_NAMES[prayerName];

      if (reminderEnabled) {
        const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000);
        if (reminderTime > now) {
          const secondsUntil = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${displayName} in ${reminderMinutes} minutes`,
              body: `Prepare for ${displayName} prayer. Time to make wudu.`,
              data: { type: 'prayer-reminder', prayer: prayerName },
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'prayer-reminder' } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: secondsUntil,
              repeats: false,
            },
          });
          console.log(`[Notifications] Scheduled reminder for ${displayName} in ${secondsUntil}s`);
        }
      }

      if (azanEnabled) {
        if (prayerTime > now) {
          const secondsUntil = Math.floor((prayerTime.getTime() - now.getTime()) / 1000);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🕌 ${displayName} - Allahu Akbar`,
              body: `It's time for ${displayName} prayer. Azan is calling.`,
              data: { type: 'azan', prayer: prayerName },
              sound: 'default',
              ...(Platform.OS === 'android' ? { channelId: 'azan' } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: secondsUntil,
              repeats: false,
            },
          });
          console.log(`[Notifications] Scheduled azan for ${displayName} in ${secondsUntil}s`);
        }
      }
    }

    console.log('[Notifications] All prayer notifications scheduled');
  } catch (error) {
    console.log('[Notifications] Error scheduling notifications:', error);
  }
}

export async function getScheduledCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch {
    return 0;
  }
}
