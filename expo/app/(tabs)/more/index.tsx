import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Crown,
  MapPin,
  Globe,
  Moon,
  Sun,
  Monitor,
  Calculator,
  Bell,
  BellRing,
  ChevronRight,
  Shield,
  Clock,
  RefreshCw,
  Check,
  BookOpen,
  Languages,
  Type,
  VolumeX,
  Volume2,
  Timer,
  Radio,
  Play,
  Square,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import cities from '@/constants/cities';
import { CALCULATION_METHODS, PrayerName, PRAYER_DISPLAY_NAMES } from '@/utils/prayer-times';
import { AZAN_SOUNDS } from '@/constants/azan-sounds';
type ModalType = 'city' | 'method' | 'timezone' | 'azan-sound' | null;

const TIMEZONES = [
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka',
  'Asia/Jakarta', 'Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Tokyo',
  'Asia/Baghdad', 'Asia/Tehran', 'Asia/Amman', 'Asia/Beirut', 'Asia/Damascus',
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Algiers', 'Africa/Khartoum',
  'Europe/Istanbul', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Toronto',
  'Australia/Sydney', 'Pacific/Auckland',
];

export default function MoreScreen() {
  const { theme, isDark, settings, updateSettings, azanPlaying, stopAzan: handleStopAzan, playAzanPreview, restorePurchases, isRestoring } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = cities.filter((c) => {
    if (!citySearch.trim()) return true;
    const q = citySearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  const currentCity = cities[settings.selectedCityIndex] || cities[0];
  const currentMethod = CALCULATION_METHODS[settings.calculationMethod];

  const handleRestore = async () => {
    try {
      const info = await restorePurchases();
      const hasPremium = !!info?.entitlements?.active?.['premium'];
      if (hasPremium) {
        Alert.alert('Restored!', 'Your premium access has been restored.', [{ text: 'Continue' }]);
      } else {
        Alert.alert('No Purchase Found', 'We could not find a previous premium purchase linked to your account.');
      }
    } catch (error: any) {
      if (error?.userCancelled) return;
      Alert.alert('Restore Failed', error?.message || 'Something went wrong. Please try again.');
    }
  };

  const prayerNames: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>PURCHASE</Text>
          {settings.isPremium ? (
            <View style={styles.row}>
              <Crown size={18} color={Colors.gold} strokeWidth={1.8} />
              <Text style={[styles.rowText, { color: theme.text }]}>Premium Active</Text>
              <Check size={16} color={Colors.primary} strokeWidth={2} />
            </View>
          ) : (
            <TouchableOpacity style={styles.row} onPress={() => router.push('/paywall' as any)}>
              <Crown size={18} color={Colors.gold} strokeWidth={1.8} />
              <Text style={[styles.rowText, { color: theme.text }]}>Unlock Premium</Text>
              <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.row} onPress={handleRestore} disabled={isRestoring}>
            <RefreshCw size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.rowText, { color: theme.text }]}>Restore Purchase</Text>
            <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>LOCATION</Text>
          <TouchableOpacity style={styles.row} onPress={() => setActiveModal('city')}>
            <MapPin size={18} color={Colors.primary} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.text }]}>City</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]}>{currentCity.name}</Text>
            </View>
            <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>TIME ZONE</Text>
          <View style={styles.row}>
            <Clock size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.rowText, { color: theme.text }]}>Use Device Time Zone</Text>
            <Switch
              value={settings.useDeviceTimezone}
              onValueChange={(v) => updateSettings({ useDeviceTimezone: v })}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          {!settings.useDeviceTimezone && (
            <TouchableOpacity style={styles.row} onPress={() => setActiveModal('timezone')}>
              <Globe size={18} color={Colors.gold} strokeWidth={1.8} />
              <View style={styles.rowContent}>
                <Text style={[styles.rowText, { color: theme.text }]}>Time Zone</Text>
                <Text style={[styles.rowValue, { color: theme.textTertiary }]}>{settings.manualTimezone}</Text>
              </View>
              <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>CALCULATION</Text>
          <TouchableOpacity style={styles.row} onPress={() => setActiveModal('method')}>
            <Calculator size={18} color={Colors.primary} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.text }]}>Method</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]} numberOfLines={1}>
                {currentMethod?.name || settings.calculationMethod}
              </Text>
            </View>
            <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text, marginLeft: 32 }]}>Madhab (Asr)</Text>
            <View style={styles.segmented}>
              {(['shafi', 'hanafi'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.segBtn, settings.madhab === m && styles.segBtnActive]}
                  onPress={() => updateSettings({ madhab: m })}
                >
                  <Text style={[styles.segText, { color: settings.madhab === m ? '#fff' : theme.textSecondary }]}>
                    {m === 'shafi' ? "Shafi'i" : 'Hanafi'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text, marginLeft: 32 }]}>High Latitude</Text>
            <View style={styles.segmented}>
              {(['middle', 'seventh', 'angle'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.segBtn, settings.highLatRule === r && styles.segBtnActive]}
                  onPress={() => updateSettings({ highLatRule: r })}
                >
                  <Text style={[styles.segText, { color: settings.highLatRule === r ? '#fff' : theme.textSecondary }]}>
                    {r === 'middle' ? 'Mid' : r === 'seventh' ? '1/7' : 'Angle'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>ADJUSTMENTS (MINUTES)</Text>
          {prayerNames.map((name) => (
            <View key={name} style={styles.adjustRow}>
              <Text style={[styles.adjustLabel, { color: theme.text }]}>{PRAYER_DISPLAY_NAMES[name]}</Text>
              <View style={styles.adjustControls}>
                <TouchableOpacity
                  style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => {
                    const adj = { ...settings.adjustments };
                    adj[name] = (adj[name] || 0) - 1;
                    updateSettings({ adjustments: adj });
                  }}
                >
                  <Text style={[styles.adjustBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.adjustValue, { color: theme.text }]}>
                  {settings.adjustments[name] || 0}
                </Text>
                <TouchableOpacity
                  style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => {
                    const adj = { ...settings.adjustments };
                    adj[name] = (adj[name] || 0) + 1;
                    updateSettings({ adjustments: adj });
                  }}
                >
                  <Text style={[styles.adjustBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>PRAYER NOTIFICATIONS</Text>
          {prayerNames.filter(n => n !== 'sunrise').map((name) => {
            const enabledArr = settings.enabledNotificationPrayers || [];
            const isEnabled = enabledArr.includes(name);
            const freeLimit = !settings.isPremium && !isEnabled && enabledArr.length >= 1;
            return (
              <View key={name} style={styles.row}>
                <Bell size={16} color={isEnabled ? Colors.primary : theme.textTertiary} strokeWidth={1.8} />
                <Text style={[styles.rowText, { color: theme.text }]}>{PRAYER_DISPLAY_NAMES[name]}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={(v) => {
                    if (freeLimit && v) { router.push('/paywall' as any); return; }
                    const current = settings.enabledNotificationPrayers || [];
                    const updated = v ? [...current, name] : current.filter((p: PrayerName) => p !== name);
                    updateSettings({ enabledNotificationPrayers: updated, enabledNotificationPrayer: updated.length > 0 ? updated[0] : null });
                  }}
                  trackColor={{ true: Colors.primary }}
                  disabled={freeLimit}
                />
              </View>
            );
          })}
          {!settings.isPremium && (
            <Text style={[styles.noteText, { color: theme.textTertiary }]}>
              Free version: 1 prayer notification. Unlock premium for all.
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>AZAN PLAYBACK</Text>
          <View style={styles.row}>
            <Volume2 size={18} color={settings.azanPlaybackEnabled ? Colors.primary : theme.textTertiary} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.text }]}>Play Azan Sound</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]}>Plays audio when prayer time arrives</Text>
            </View>
            <Switch
              value={settings.azanPlaybackEnabled}
              onValueChange={(v) => updateSettings({ azanPlaybackEnabled: v })}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          {settings.azanPlaybackEnabled && (
            <>
              <TouchableOpacity style={styles.row} onPress={() => setActiveModal('azan-sound')}>
                <BellRing size={18} color={Colors.gold} strokeWidth={1.8} />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowText, { color: theme.text }]}>Azan Sound</Text>
                  <Text style={[styles.rowValue, { color: theme.textTertiary }]}>
                    {AZAN_SOUNDS.find((s) => s.id === settings.azanSoundId)?.name || 'Makkah Azan'}
                  </Text>
                </View>
                <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  if (azanPlaying) {
                    handleStopAzan();
                  } else {
                    playAzanPreview();
                  }
                }}
              >
                {azanPlaying ? (
                  <Square size={18} color={Colors.danger} strokeWidth={1.8} />
                ) : (
                  <Play size={18} color={Colors.primary} strokeWidth={1.8} />
                )}
                <Text style={[styles.rowText, { color: azanPlaying ? Colors.danger : theme.text }]}>
                  {azanPlaying ? 'Stop Preview' : 'Preview Azan'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={[styles.noteText, { color: theme.textTertiary }]}>
            Azan plays when the app is open and prayer time arrives for selected prayers.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>NOTIFICATION OPTIONS</Text>
          <View style={styles.row}>
            <Timer size={18} color={Colors.primary} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.text }]}>Reminder Before Prayer</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]}>{settings.reminderMinutesBefore} min before</Text>
            </View>
            <Switch value={settings.reminderBeforePrayer} onValueChange={(v) => updateSettings({ reminderBeforePrayer: v })} trackColor={{ true: Colors.primary }} />
          </View>
          {settings.reminderBeforePrayer && (
            <View style={styles.adjustRow}>
              <Text style={[styles.adjustLabel, { color: theme.text }]}>Minutes Before</Text>
              <View style={styles.adjustControls}>
                <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={() => updateSettings({ reminderMinutesBefore: Math.max(5, settings.reminderMinutesBefore - 5) })}>
                  <Text style={[styles.adjustBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.adjustValue, { color: theme.text }]}>{settings.reminderMinutesBefore}</Text>
                <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={() => updateSettings({ reminderMinutesBefore: Math.min(60, settings.reminderMinutesBefore + 5) })}>
                  <Text style={[styles.adjustBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.row}>
            <BellRing size={18} color={Colors.gold} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.text }]}>Azan at Prayer Time</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]}>Notification when prayer time arrives</Text>
            </View>
            <Switch value={settings.azanAtPrayerTime} onValueChange={(v) => updateSettings({ azanAtPrayerTime: v })} trackColor={{ true: Colors.primary }} />
          </View>
          <Text style={[styles.noteText, { color: theme.textTertiary }]}>
            Notifications are scheduled for selected prayers above.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>APPEARANCE</Text>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text, marginLeft: 0 }]}>Theme</Text>
            <View style={styles.segmented}>
              {([
                { key: 'system', icon: <Monitor size={13} color={settings.themeMode === 'system' ? '#fff' : theme.textSecondary} strokeWidth={1.8} /> },
                { key: 'light', icon: <Sun size={13} color={settings.themeMode === 'light' ? '#fff' : theme.textSecondary} strokeWidth={1.8} /> },
                { key: 'dark', icon: <Moon size={13} color={settings.themeMode === 'dark' ? '#fff' : theme.textSecondary} strokeWidth={1.8} /> },
              ] as const).map(({ key, icon }) => (
                <TouchableOpacity key={key} style={[styles.segBtn, settings.themeMode === key && styles.segBtnActive]} onPress={() => updateSettings({ themeMode: key as any })}>
                  {icon}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>24-Hour Format</Text>
            <Switch value={settings.use24hFormat} onValueChange={(v) => updateSettings({ use24hFormat: v })} trackColor={{ true: Colors.primary }} />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>QURAN AUDIO</Text>
          <View style={styles.row}>
            <VolumeX size={18} color={theme.textTertiary} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.textTertiary }]}>Reciter Playback</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]}>Audio temporarily unavailable</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/radio' as any)}>
            <Radio size={18} color={Colors.primary} strokeWidth={1.8} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowText, { color: theme.text }]}>Live Quran Radio</Text>
              <Text style={[styles.rowValue, { color: theme.textTertiary }]}>Listen to live recitation</Text>
            </View>
            <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>QURAN READER</Text>
          <View style={styles.row}>
            <Languages size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.rowText, { color: theme.text }]}>Transliteration</Text>
            <Switch value={settings.showTransliteration} onValueChange={(v) => updateSettings({ showTransliteration: v })} trackColor={{ true: Colors.primary }} />
          </View>
          <View style={styles.row}>
            <Type size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.rowText, { color: theme.text }]}>Arabic Text</Text>
            <Switch value={settings.showArabic} onValueChange={(v) => { if (!settings.showTransliteration && !settings.showTranslation && v === false) return; updateSettings({ showArabic: v }); }} trackColor={{ true: Colors.primary }} />
          </View>
          <View style={styles.row}>
            <BookOpen size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.rowText, { color: theme.text }]}>Translation</Text>
            <Switch value={settings.showTranslation} onValueChange={(v) => { if (!settings.showArabic && !settings.showTransliteration && v === false) return; updateSettings({ showTranslation: v }); }} trackColor={{ true: Colors.primary }} />
          </View>
          <View style={styles.adjustRow}>
            <Text style={[styles.adjustLabel, { color: theme.text }]}>Arabic Size</Text>
            <View style={styles.adjustControls}>
              <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={() => updateSettings({ arabicFontSize: Math.max(16, settings.arabicFontSize - 2) })}>
                <Text style={[styles.adjustBtnText, { color: theme.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.adjustValue, { color: theme.text }]}>{settings.arabicFontSize}</Text>
              <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={() => updateSettings({ arabicFontSize: Math.min(40, settings.arabicFontSize + 2) })}>
                <Text style={[styles.adjustBtnText, { color: theme.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.adjustRow}>
            <Text style={[styles.adjustLabel, { color: theme.text }]}>Transliteration Size</Text>
            <View style={styles.adjustControls}>
              <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={() => updateSettings({ transliterationFontSize: Math.max(11, settings.transliterationFontSize - 1) })}>
                <Text style={[styles.adjustBtnText, { color: theme.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.adjustValue, { color: theme.text }]}>{settings.transliterationFontSize}</Text>
              <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: theme.surfaceSecondary }]} onPress={() => updateSettings({ transliterationFontSize: Math.min(24, settings.transliterationFontSize + 1) })}>
                <Text style={[styles.adjustBtnText, { color: theme.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>ABOUT</Text>
          <View style={styles.row}>
            <Shield size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={[styles.rowText, { color: theme.text }]}>Privacy Policy</Text>
            <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: theme.textTertiary, marginLeft: 32, fontSize: 13 }]}>
              Prayer Companion: Quran & Qibla v1.0.0
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={activeModal === 'city'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select City</Text>
            <TouchableOpacity onPress={() => { setActiveModal(null); setCitySearch(''); }}>
              <Text style={[styles.modalDone, { color: Colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.modalSearch, { backgroundColor: theme.surfaceSecondary }]}>
            <TextInput style={[styles.modalSearchInput, { color: theme.text }]} placeholder="Search cities..." placeholderTextColor={theme.textTertiary} value={citySearch} onChangeText={setCitySearch} />
          </View>
          <FlatList
            data={filteredCities}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => {
              const realIdx = cities.indexOf(item);
              const selected = realIdx === settings.selectedCityIndex;
              return (
                <TouchableOpacity style={[styles.modalRow, selected && { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.04)' }]} onPress={() => { updateSettings({ selectedCityIndex: realIdx }); setActiveModal(null); setCitySearch(''); }}>
                  <Text style={[styles.modalRowText, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.modalRowSub, { color: theme.textTertiary }]}>{item.country}</Text>
                  {selected && <Check size={16} color={Colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      <Modal visible={activeModal === 'method'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Calculation Method</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={[styles.modalDone, { color: Colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {Object.entries(CALCULATION_METHODS).map(([key, method]) => {
              const selected = key === settings.calculationMethod;
              return (
                <TouchableOpacity key={key} style={[styles.modalRow, selected && { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.04)' }]} onPress={() => { updateSettings({ calculationMethod: key }); setActiveModal(null); }}>
                  <View style={styles.modalRowContent}>
                    <Text style={[styles.modalRowText, { color: theme.text }]}>{method.name}</Text>
                    <Text style={[styles.modalRowSub, { color: theme.textTertiary }]}>
                      Fajr: {method.params.fajr}° · Isha: {method.params.ishaMinutes ? `${method.params.ishaMinutes}min` : `${method.params.isha}°`}
                    </Text>
                  </View>
                  {selected && <Check size={16} color={Colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={activeModal === 'azan-sound'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Azan Sound</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={[styles.modalDone, { color: Colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {AZAN_SOUNDS.map((sound) => {
              const selected = sound.id === settings.azanSoundId;
              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[styles.modalRow, selected && { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.04)' }]}
                  onPress={() => {
                    updateSettings({ azanSoundId: sound.id });
                    setActiveModal(null);
                  }}
                >
                  <View style={styles.modalRowContent}>
                    <Text style={[styles.modalRowText, { color: theme.text }]}>{sound.name}</Text>
                    <Text style={[styles.modalRowSub, { color: theme.textTertiary }]}>
                      {sound.reciter} · {sound.duration}
                    </Text>
                  </View>
                  <TouchableOpacity
                    hitSlop={12}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (azanPlaying) {
                        handleStopAzan();
                      } else {
                        playAzanPreview(sound.id);
                      }
                    }}
                    style={styles.previewBtn}
                  >
                    {azanPlaying ? (
                      <Square size={14} color={Colors.danger} strokeWidth={2} />
                    ) : (
                      <Play size={14} color={Colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                  {selected && <Check size={16} color={Colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={activeModal === 'timezone'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalRoot, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Time Zone</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={[styles.modalDone, { color: Colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {TIMEZONES.map((tz) => {
              const selected = tz === settings.manualTimezone;
              return (
                <TouchableOpacity key={tz} style={[styles.modalRow, selected && { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.04)' }]} onPress={() => { updateSettings({ manualTimezone: tz }); setActiveModal(null); }}>
                  <Text style={[styles.modalRowText, { color: theme.text }]}>{tz}</Text>
                  {selected && <Check size={16} color={Colors.primary} strokeWidth={2} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontFamily: fontFamily.system, fontSize: 28, fontWeight: fw.bold, letterSpacing: -0.3, lineHeight: 34, marginBottom: 24, paddingTop: 8 },
  section: { borderRadius: 14, padding: 4, marginBottom: 16 },
  sectionLabel: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.medium, letterSpacing: 0.8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row' as const, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowContent: { flex: 1 },
  rowText: { fontFamily: fontFamily.system, flex: 1, fontSize: 15, fontWeight: fw.regular, letterSpacing: -0.2 },
  rowValue: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  noteText: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, paddingHorizontal: 14, paddingBottom: 12, lineHeight: 16 },
  segmented: { flexDirection: 'row' as const, gap: 4 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(107,158,145,0.06)' },
  segBtnActive: { backgroundColor: Colors.primary },
  segText: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.medium },
  adjustRow: { flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  adjustLabel: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.regular },
  adjustControls: { flexDirection: 'row' as const, alignItems: 'center', gap: 12 },
  adjustBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  adjustBtnText: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.medium },
  adjustValue: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium, minWidth: 24, textAlign: 'center' as const },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold },
  modalDone: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium },
  modalSearch: { margin: 16, borderRadius: 10, paddingHorizontal: 14 },
  modalSearchInput: { fontFamily: fontFamily.system, height: 42, fontSize: 15, fontWeight: fw.regular },
  modalRow: { flexDirection: 'row' as const, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.04)' },
  modalRowContent: { flex: 1 },
  modalRowText: { fontFamily: fontFamily.system, flex: 1, fontSize: 15, fontWeight: fw.regular },
  modalRowSub: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  previewBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(107,158,145,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
});
