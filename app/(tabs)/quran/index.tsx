import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SectionList,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Lock, Star, Globe, Check, Radio, Play, Pause, X, ChevronDown } from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import { surahs, SurahMeta, PREVIEW_SURAHS, juzData } from '@/constants/quran-data';
import {
  QURAN_TRANSLATIONS,
  getTranslationById,
  getUniqueLanguages,
  getTranslationsByLanguage,
  QuranTranslation,
} from '@/constants/quran-translations';

type TabType = 'surah' | 'juz' | 'translation';

interface RadioStation {
  id: string;
  name: string;
  nameArabic: string;
  url: string;
  reciter: string;
}

const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'quran-radio',
    name: 'Quran Radio',
    nameArabic: 'إذاعة القرآن الكريم',
    url: 'https://Qurango.com/radio/tarateel',
    reciter: 'Various Reciters',
  },
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    nameArabic: 'مشاري العفاسي',
    url: 'https://Qurango.com/radio/mishary',
    reciter: 'Mishary Rashid Alafasy',
  },
  {
    id: 'sudais',
    name: 'Abdur-Rahman As-Sudais',
    nameArabic: 'عبدالرحمن السديس',
    url: 'https://Qurango.com/radio/sudais',
    reciter: 'Abdur-Rahman As-Sudais',
  },
  {
    id: 'husary',
    name: 'Al-Husary',
    nameArabic: 'محمود خليل الحصري',
    url: 'https://Qurango.com/radio/husary',
    reciter: 'Mahmoud Khalil Al-Husary',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit',
    nameArabic: 'عبد الباسط عبد الصمد',
    url: 'https://Qurango.com/radio/abdulbasit',
    reciter: 'Abdul Basit Abdus-Samad',
  },
  {
    id: 'minshawi',
    name: 'Al-Minshawi',
    nameArabic: 'محمد صديق المنشاوي',
    url: 'https://Qurango.com/radio/minshawi',
    reciter: 'Mohamed Siddiq Al-Minshawi',
  },
];

export default function QuranScreen() {
  const { theme, isDark, settings, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('surah');

  const [radioVisible, setRadioVisible] = useState(false);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioLoading, setRadioLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [showStationPicker, setShowStationPicker] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const playerSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (radioPlaying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [radioPlaying]);

  const openRadio = useCallback(() => {
    setRadioVisible(true);
    Animated.spring(playerSlideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, []);

  const closeRadio = useCallback(async () => {
    Animated.timing(playerSlideAnim, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => {
      setRadioVisible(false);
      setShowStationPicker(false);
    });
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.log('[Radio] Cleanup error:', e);
      }
      soundRef.current = null;
    }
    setRadioPlaying(false);
    setRadioLoading(false);
  }, []);

  const playRadio = useCallback(async (station: RadioStation) => {
    console.log(`[Radio] Playing station: ${station.name}`);
    setRadioLoading(true);
    setSelectedStation(station);
    setShowStationPicker(false);

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.log('[Radio] Stop previous error:', e);
      }
      soundRef.current = null;
    }

    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true },
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.isPlaying) {
            setRadioPlaying(true);
            setRadioLoading(false);
          }
        }
      });

      setRadioPlaying(true);
      setRadioLoading(false);
      console.log(`[Radio] Now playing: ${station.name}`);
    } catch (e) {
      console.log('[Radio] Play error:', e);
      setRadioPlaying(false);
      setRadioLoading(false);
    }
  }, []);

  const toggleRadio = useCallback(async () => {
    if (radioPlaying && soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setRadioPlaying(false);
      } catch (e) {
        console.log('[Radio] Pause error:', e);
      }
    } else if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
        setRadioPlaying(true);
      } catch (e) {
        console.log('[Radio] Resume error:', e);
      }
    } else {
      await playRadio(selectedStation);
    }
  }, [radioPlaying, selectedStation, playRadio]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const currentTranslation = useMemo(
    () => getTranslationById(settings.quranTranslationId) ?? QURAN_TRANSLATIONS[0],
    [settings.quranTranslationId],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.toLowerCase();
    return surahs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.nameArabic.includes(q) ||
        String(s.number).includes(q),
    );
  }, [search]);

  const translationSections = useMemo(() => {
    const languages = getUniqueLanguages();
    const searchLower = search.toLowerCase();
    return languages
      .map((lang) => {
        const items = getTranslationsByLanguage(lang).filter((t) => {
          if (!searchLower) return true;
          return (
            t.language.toLowerCase().includes(searchLower) ||
            t.name.toLowerCase().includes(searchLower) ||
            t.author.toLowerCase().includes(searchLower)
          );
        });
        return { title: lang, data: items };
      })
      .filter((section) => section.data.length > 0);
  }, [search]);

  const isAccessible = useCallback(
    (surahNumber: number) => {
      if (settings.isPremium) return true;
      return PREVIEW_SURAHS.includes(surahNumber);
    },
    [settings.isPremium],
  );

  const handlePress = useCallback(
    (surah: SurahMeta) => {
      if (!isAccessible(surah.number)) {
        router.push('/paywall' as any);
        return;
      }
      router.push(`/quran/${surah.number}` as any);
    },
    [isAccessible, router],
  );

  const handleSelectTranslation = useCallback(
    (translation: QuranTranslation) => {
      console.log(`[Quran] Selected translation: ${translation.name} (${translation.language})`);
      updateSettings({ quranTranslationId: translation.id });
    },
    [updateSettings],
  );

  const renderSurah = useCallback(
    ({ item }: { item: SurahMeta }) => {
      const accessible = isAccessible(item.number);
      return (
        <TouchableOpacity
          style={[styles.surahRow, { backgroundColor: theme.surface }]}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
          testID={`surah-${item.number}`}
        >
          <View style={[styles.numberBadge, { backgroundColor: isDark ? 'rgba(0,212,230,0.1)' : 'rgba(0,212,230,0.06)' }]}>
            <Text style={[styles.numberText, { color: Colors.primary }]}>{item.number}</Text>
          </View>
          <View style={styles.surahInfo}>
            <Text style={[styles.surahName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.surahMeaning, { color: theme.textSecondary }]}>
              {item.meaning} · {item.verses} verses · {item.type}
            </Text>
          </View>
          <View style={styles.surahRight}>
            <Text style={[styles.surahArabic, { color: accessible ? Colors.primary : theme.textTertiary }]}>
              {item.nameArabic}
            </Text>
            {!accessible && <Lock size={14} color={theme.textTertiary} style={styles.lockIcon} />}
          </View>
        </TouchableOpacity>
      );
    },
    [theme, isDark, isAccessible, handlePress],
  );

  const renderTranslationItem = useCallback(
    ({ item }: { item: QuranTranslation }) => {
      const isSelected = item.id === settings.quranTranslationId;
      return (
        <TouchableOpacity
          style={[
            styles.translationRow,
            { backgroundColor: isSelected ? (isDark ? 'rgba(0,212,230,0.08)' : 'rgba(0,212,230,0.05)') : theme.surface },
            isSelected && { borderColor: Colors.primary, borderWidth: 1.5 },
          ]}
          onPress={() => handleSelectTranslation(item)}
          activeOpacity={0.7}
          testID={`translation-${item.id}`}
        >
          <Text style={styles.translationFlag}>{item.flag}</Text>
          <View style={styles.translationInfo}>
            <Text style={[styles.translationName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.translationAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.author}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.checkBadge, { backgroundColor: Colors.primary }]}>
              <Check size={14} color="#fff" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [theme, isDark, settings.quranTranslationId, handleSelectTranslation],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
      </View>
    ),
    [theme],
  );

  const searchPlaceholder = activeTab === 'translation' ? 'Search languages...' : 'Search surahs...';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Quran</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {settings.isPremium ? '114 Surahs' : `${PREVIEW_SURAHS.length} preview surahs available`}
            </Text>
          </View>
          {activeTab !== 'translation' && (
            <View style={[styles.currentLangChip, { backgroundColor: isDark ? 'rgba(0,212,230,0.1)' : 'rgba(0,212,230,0.06)' }]}>
              <Globe size={13} color={Colors.primary} />
              <Text style={[styles.currentLangText, { color: Colors.primary }]}>
                {currentTranslation.flag} {currentTranslation.language}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.surfaceSecondary }]}>
          <Search size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
            testID="quran-search"
          />
        </View>

        <View style={styles.tabs}>
          {(['surah', 'juz', 'translation'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { setActiveTab(tab); setSearch(''); }}
            >
              {tab === 'translation' ? (
                <View style={styles.tabInner}>
                  <Globe size={14} color={activeTab === tab ? Colors.primary : theme.textSecondary} />
                  <Text style={[styles.tabText, { color: activeTab === tab ? Colors.primary : theme.textSecondary }]}>
                    Translation
                  </Text>
                </View>
              ) : (
                <Text style={[styles.tabText, { color: activeTab === tab ? Colors.primary : theme.textSecondary }]}>
                  {tab === 'surah' ? 'Surahs' : 'Juz'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.radioButton,
          {
            backgroundColor: radioPlaying
              ? isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)'
              : isDark ? 'rgba(0,212,230,0.1)' : 'rgba(0,212,230,0.06)',
            borderColor: radioPlaying
              ? isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)'
              : isDark ? 'rgba(0,212,230,0.2)' : 'rgba(0,212,230,0.15)',
          },
        ]}
        onPress={openRadio}
        activeOpacity={0.7}
        testID="live-radio-btn"
      >
        <Animated.View style={[styles.radioIconWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[
            styles.radioIconBg,
            { backgroundColor: radioPlaying ? '#EF4444' : Colors.primary },
          ]}>
            <Radio size={16} color="#fff" strokeWidth={2.5} />
          </View>
        </Animated.View>
        <View style={styles.radioButtonInfo}>
          <Text style={[styles.radioButtonTitle, { color: theme.text }]}>
            {radioPlaying ? 'LIVE' : 'Quran Radio'}
          </Text>
          <Text style={[styles.radioButtonSub, { color: radioPlaying ? '#EF4444' : theme.textSecondary }]} numberOfLines={1}>
            {radioPlaying ? selectedStation.name : 'Tap to listen live'}
          </Text>
        </View>
        {radioPlaying && (
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.liveDot, styles.liveDot2, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.liveDot, styles.liveDot3, { backgroundColor: '#EF4444' }]} />
          </View>
        )}
      </TouchableOpacity>

      {activeTab === 'surah' ? (
        <FlatList
          data={filtered}
          renderItem={renderSurah}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={[styles.list, { paddingBottom: radioVisible ? 140 : 40 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      ) : activeTab === 'juz' ? (
        <FlatList
          data={juzData}
          renderItem={({ item: juz }) => {
            const accessible = settings.isPremium || juz.juz === 1 || juz.juz === 30;
            const startSurah = surahs.find((s) => s.number === juz.startSurah);
            return (
              <TouchableOpacity
                style={[styles.juzRow, { backgroundColor: theme.surface }]}
                onPress={() => {
                  if (!accessible) {
                    router.push('/paywall' as any);
                    return;
                  }
                  router.push(`/quran/${juz.startSurah}` as any);
                }}
                activeOpacity={0.7}
                testID={`juz-${juz.juz}`}
              >
                <View style={[styles.juzBadge, { backgroundColor: isDark ? 'rgba(255,176,32,0.1)' : 'rgba(255,176,32,0.06)' }]}>
                  <Star size={16} color={Colors.gold} />
                </View>
                <View style={styles.juzInfo}>
                  <Text style={[styles.juzName, { color: theme.text }]}>Juz {juz.juz}</Text>
                  <Text style={[styles.juzStart, { color: theme.textSecondary }]}>
                    {startSurah?.name ?? ''} · Ayah {juz.startAyah}
                  </Text>
                </View>
                {startSurah && (
                  <Text style={[styles.juzArabic, { color: accessible ? Colors.gold : theme.textTertiary }]}>
                    {startSurah.nameArabic}
                  </Text>
                )}
                {!accessible && <Lock size={14} color={theme.textTertiary} style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(juz) => String(juz.juz)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      ) : (
        <SectionList
          sections={translationSections}
          renderItem={renderTranslationItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          stickySectionHeadersEnabled
        />
      )}

      {radioVisible && (
        <Animated.View
          style={[
            styles.radioPlayer,
            {
              backgroundColor: isDark ? 'rgba(13,20,24,0.98)' : 'rgba(255,255,255,0.98)',
              borderTopColor: theme.border,
              transform: [{ translateY: playerSlideAnim }],
            },
          ]}
          testID="radio-player"
        >
          <View style={[styles.radioPlayerHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} />

          <View style={styles.radioPlayerHeader}>
            <View style={styles.radioPlayerHeaderLeft}>
              <View style={[styles.radioLiveBadge, { backgroundColor: radioPlaying ? '#EF4444' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <Radio size={12} color={radioPlaying ? '#fff' : theme.textSecondary} strokeWidth={2.5} />
                <Text style={[styles.radioLiveText, { color: radioPlaying ? '#fff' : theme.textSecondary }]}>
                  {radioPlaying ? 'LIVE' : 'RADIO'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeRadio} hitSlop={12} style={styles.radioCloseBtn}>
              <X size={18} color={theme.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.stationSelector,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              },
            ]}
            onPress={() => setShowStationPicker(!showStationPicker)}
            activeOpacity={0.7}
          >
            <Text style={[styles.stationNameArabic, { color: theme.textSecondary }]}>
              {selectedStation.nameArabic}
            </Text>
            <Text style={[styles.stationName, { color: theme.text }]} numberOfLines={1}>
              {selectedStation.name}
            </Text>
            <ChevronDown size={16} color={theme.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>

          {showStationPicker && (
            <View style={[
              styles.stationList,
              { backgroundColor: isDark ? 'rgba(20,28,34,0.98)' : 'rgba(245,248,250,0.98)', borderColor: theme.border },
            ]}>
              {RADIO_STATIONS.map((station) => {
                const isActive = station.id === selectedStation.id;
                return (
                  <TouchableOpacity
                    key={station.id}
                    style={[
                      styles.stationItem,
                      isActive && { backgroundColor: isDark ? 'rgba(0,212,230,0.08)' : 'rgba(0,212,230,0.05)' },
                    ]}
                    onPress={() => playRadio(station)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stationItemArabic, { color: theme.textSecondary }]}>{station.nameArabic}</Text>
                    <View style={styles.stationItemInfo}>
                      <Text style={[styles.stationItemName, { color: isActive ? Colors.primary : theme.text }]}>
                        {station.name}
                      </Text>
                      <Text style={[styles.stationItemReciter, { color: theme.textSecondary }]}>
                        {station.reciter}
                      </Text>
                    </View>
                    {isActive && radioPlaying && (
                      <View style={styles.stationPlayingDots}>
                        <View style={[styles.liveDot, { backgroundColor: Colors.primary }]} />
                        <View style={[styles.liveDot, styles.liveDot2, { backgroundColor: Colors.primary }]} />
                        <View style={[styles.liveDot, styles.liveDot3, { backgroundColor: Colors.primary }]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.radioControls}>
            <TouchableOpacity
              style={[
                styles.radioPlayBtn,
                { backgroundColor: radioPlaying ? '#EF4444' : Colors.primary },
              ]}
              onPress={toggleRadio}
              activeOpacity={0.7}
              testID="radio-play-toggle"
            >
              {radioLoading ? (
                <ActivityIndicator size={22} color="#fff" />
              ) : radioPlaying ? (
                <Pause size={22} color="#fff" strokeWidth={2.5} />
              ) : (
                <Play size={22} color="#fff" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20 },
  titleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  title: { fontFamily: fontFamily.system, fontSize: 34, fontWeight: fw.bold, letterSpacing: 0.37, lineHeight: 41 },
  subtitle: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, letterSpacing: -0.08, marginTop: 4, marginBottom: 16 },
  currentLangChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
  },
  currentLangText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.semibold,
    letterSpacing: -0.08,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: { fontFamily: fontFamily.system, flex: 1, fontSize: 16, fontWeight: fw.regular, letterSpacing: -0.32, height: 44 },
  tabs: {
    flexDirection: 'row' as const,
    marginBottom: 12,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: 'rgba(0,212,230,0.1)',
  },
  tabInner: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
  },
  tabText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.semibold, letterSpacing: -0.24 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  radioButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  radioIconWrap: {},
  radioIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInfo: { flex: 1 },
  radioButtonTitle: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.bold,
    letterSpacing: 0.5,
  },
  radioButtonSub: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    gap: 3,
    height: 16,
  },
  liveDot: {
    width: 3,
    height: 6,
    borderRadius: 1.5,
  },
  liveDot2: {
    height: 12,
  },
  liveDot3: {
    height: 8,
  },
  radioPlayer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  radioPlayerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  radioPlayerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  radioPlayerHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
  },
  radioLiveBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  radioLiveText: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.bold,
    letterSpacing: 1,
  },
  radioCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  stationNameArabic: {
    fontSize: 16,
    fontWeight: fw.regular,
  },
  stationName: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.semibold,
    letterSpacing: -0.24,
    flex: 1,
  },
  stationList: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    maxHeight: 220,
    overflow: 'hidden' as const,
  },
  stationItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10,
  },
  stationItemArabic: {
    fontSize: 14,
    width: 28,
    textAlign: 'center' as const,
  },
  stationItemInfo: { flex: 1 },
  stationItemName: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.semibold,
    letterSpacing: -0.15,
  },
  stationItemReciter: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.regular,
    marginTop: 1,
  },
  stationPlayingDots: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  radioControls: {
    alignItems: 'center',
  },
  radioPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  surahRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.semibold, letterSpacing: -0.15 },
  surahInfo: { flex: 1, marginLeft: 12 },
  surahName: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
  surahMeaning: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 3 },
  surahRight: { alignItems: 'flex-end' },
  surahArabic: { fontFamily: fontFamily.system, fontSize: 18, fontWeight: fw.regular },
  lockIcon: { marginTop: 4 },
  juzRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  juzBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  juzInfo: { flex: 1 },
  juzName: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
  juzStart: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 3 },
  juzArabic: { fontFamily: fontFamily.system, fontSize: 18, fontWeight: fw.regular },
  translationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  translationFlag: {
    fontSize: 24,
    width: 36,
    textAlign: 'center' as const,
  },
  translationInfo: { flex: 1 },
  translationName: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.semibold,
    letterSpacing: -0.24,
  },
  translationAuthor: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.regular,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingTop: 14,
  },
  sectionTitle: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
});
