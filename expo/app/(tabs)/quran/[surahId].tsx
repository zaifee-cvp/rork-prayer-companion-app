import React, { useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Globe, Type, Languages, BookOpen, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import { surahs } from '@/constants/quran-data';
import { getTranslationById, QURAN_TRANSLATIONS } from '@/constants/quran-translations';

interface QuranWord {
  id: number;
  position: number;
  text_uthmani: string;
  transliteration: { text: string; language_name: string } | null;
}

interface QuranVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  translations: { id: number; resource_id: number; text: string }[];
  words?: QuranWord[];
}

interface CachedSurahData {
  verses: QuranVerse[];
  transliterations: Record<number, string>;
  timestamp: number;
}

const CACHE_PREFIX = '@quran_cache_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

async function getCachedSurah(surahNum: number, translationId: number): Promise<CachedSurahData | null> {
  try {
    const key = `${CACHE_PREFIX}${surahNum}_${translationId}`;
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;
    const data = JSON.parse(stored) as CachedSurahData;
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

async function cacheSurahData(surahNum: number, translationId: number, data: CachedSurahData): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${surahNum}_${translationId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) { console.log('[Quran] Cache write failed:', e); }
}

interface TogglePillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  isDark: boolean;
}

const TogglePill = React.memo(({ label, active, onPress, icon, isDark }: TogglePillProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      styles.togglePill,
      { backgroundColor: active ? Colors.primary : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
    ]}
  >
    {icon}
    <Text style={[styles.togglePillText, { color: active ? '#fff' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }]}>
      {label}
    </Text>
    {active ? (
      <Eye size={10} color="#fff" strokeWidth={2.5} />
    ) : (
      <EyeOff size={10} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} strokeWidth={2} />
    )}
  </TouchableOpacity>
));

interface AyahCardProps {
  verse: QuranVerse;
  index: number;
  transliteration: string | null;
  showArabic: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  arabicFontSize: number;
  translitFontSize: number;
  isDark: boolean;
  theme: any;
}

const AyahCard = React.memo(({
  verse, index, transliteration, showArabic, showTransliteration, showTranslation,
  arabicFontSize, translitFontSize, isDark, theme,
}: AyahCardProps) => {
  const translationText = verse.translations?.[0]?.text;
  const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '');
  const cardBg = index % 2 === 0 ? theme.surface : 'transparent';

  return (
    <View style={[styles.ayahCard, { backgroundColor: cardBg }]}>
      <View style={styles.ayahHeader}>
        <View style={[styles.ayahBadge, { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.05)' }]}>
          <Text style={[styles.ayahNum, { color: Colors.primary }]}>{verse.verse_number}</Text>
        </View>
        <View style={[styles.ayahDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />
      </View>
      {showArabic && (
        <Text style={[styles.arabicText, { color: theme.text, fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.85 }]}>
          {verse.text_uthmani}
        </Text>
      )}
      {showTransliteration && transliteration && (
        <View style={styles.translitBlock}>
          <View style={[styles.translitAccent, { backgroundColor: isDark ? 'rgba(107,158,145,0.3)' : 'rgba(107,158,145,0.4)' }]} />
          <Text style={[styles.transliterationText, { color: isDark ? '#8BBFB5' : '#4A8B7E', fontSize: translitFontSize, lineHeight: translitFontSize * 1.6 }]}>
            {transliteration}
          </Text>
        </View>
      )}
      {showTranslation && translationText && (
        <Text style={[styles.translationText, { color: theme.textSecondary }]}>
          {stripHtml(translationText)}
        </Text>
      )}
    </View>
  );
});

export default function SurahScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const { theme, isDark, settings, updateSettings } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const surahNum = parseInt(surahId || '1', 10);
  const surah = surahs.find((s) => s.number === surahNum) || surahs[0];
  const flatListRef = useRef<FlatList>(null);

  const { showTransliteration, showArabic, showTranslation, transliterationFontSize, arabicFontSize } = settings;

  const currentTranslation = useMemo(
    () => getTranslationById(settings.quranTranslationId) ?? QURAN_TRANSLATIONS[0],
    [settings.quranTranslationId],
  );

  const versesQuery = useQuery({
    queryKey: ['quran-verses', surahNum, settings.quranTranslationId],
    queryFn: async () => {
      const translationId = settings.quranTranslationId;
      const cached = await getCachedSurah(surahNum, translationId);
      if (cached) { console.log(`[Quran] Using cached data for surah ${surahNum}`); return cached; }
      const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?translations=${translationId}&fields=text_uthmani&per_page=300&language=${currentTranslation.languageCode}&words=true&word_fields=transliteration`;
      console.log(`[Quran] Fetching surah ${surahNum} with translation ${translationId}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch verses');
      const data = await res.json();
      const verses = data.verses as QuranVerse[];
      const transliterations: Record<number, string> = {};
      for (const verse of verses) {
        if (verse.words && verse.words.length > 0) {
          const parts = verse.words.filter((w) => w.transliteration?.text).map((w) => w.transliteration!.text);
          if (parts.length > 0) transliterations[verse.verse_number] = parts.join(' ');
        }
      }
      const cacheData: CachedSurahData = { verses, transliterations, timestamp: Date.now() };
      await cacheSurahData(surahNum, translationId, cacheData);
      return cacheData;
    },
  });

  const toggleArabic = useCallback(() => {
    if (!showTransliteration && !showTranslation && showArabic) return;
    updateSettings({ showArabic: !showArabic });
  }, [showArabic, showTransliteration, showTranslation, updateSettings]);

  const toggleTransliteration = useCallback(() => {
    if (!showArabic && !showTranslation && showTransliteration) return;
    updateSettings({ showTransliteration: !showTransliteration });
  }, [showArabic, showTransliteration, showTranslation, updateSettings]);

  const toggleTranslation = useCallback(() => {
    if (!showArabic && !showTransliteration && showTranslation) return;
    updateSettings({ showTranslation: !showTranslation });
  }, [showArabic, showTransliteration, showTranslation, updateSettings]);

  const renderAyah = useCallback(
    ({ item, index }: { item: QuranVerse; index: number }) => {
      const translit = versesQuery.data?.transliterations[item.verse_number] ?? null;
      return (
        <AyahCard verse={item} index={index} transliteration={translit} showArabic={showArabic}
          showTransliteration={showTransliteration} showTranslation={showTranslation}
          arabicFontSize={arabicFontSize} translitFontSize={transliterationFontSize} isDark={isDark} theme={theme} />
      );
    },
    [versesQuery.data, showArabic, showTransliteration, showTranslation, arabicFontSize, transliterationFontSize, isDark, theme],
  );

  const bismillah = useMemo(() => {
    if (surahNum === 9 || surahNum === 1) return null;
    return <Text style={[styles.bismillah, { color: theme.text }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>;
  }, [surahNum, theme.text]);

  const keyExtractor = useCallback((item: QuranVerse) => String(item.id), []);
  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    setTimeout(() => { flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 }); }, 300);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.primary} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{surah.name}</Text>
          <Text style={[styles.headerSub, { color: theme.textTertiary }]}>{surah.nameArabic} · {surah.verses} verses</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.translationBanner, { backgroundColor: isDark ? 'rgba(107,158,145,0.05)' : 'rgba(107,158,145,0.03)' }]}>
        <Globe size={12} color={Colors.primary} strokeWidth={1.8} />
        <Text style={[styles.translationBannerText, { color: theme.textSecondary }]}>{currentTranslation.language} · {currentTranslation.name}</Text>
      </View>

      <View style={[styles.toggleBar, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderBottomColor: theme.border }]}>
        <TogglePill label="Arabic" active={showArabic} onPress={toggleArabic}
          icon={<Type size={11} color={showArabic ? '#fff' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} strokeWidth={2.5} />} isDark={isDark} />
        <TogglePill label="Transliteration" active={showTransliteration} onPress={toggleTransliteration}
          icon={<Languages size={11} color={showTransliteration ? '#fff' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} strokeWidth={2.5} />} isDark={isDark} />
        <TogglePill label="Translation" active={showTranslation} onPress={toggleTranslation}
          icon={<BookOpen size={11} color={showTranslation ? '#fff' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'} strokeWidth={2.5} />} isDark={isDark} />
      </View>

      {versesQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading surah...</Text>
        </View>
      ) : versesQuery.isError ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: Colors.danger }]}>Failed to load surah</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { versesQuery.refetch(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList ref={flatListRef} data={versesQuery.data?.verses ?? []} renderItem={renderAyah}
          keyExtractor={keyExtractor} ListHeaderComponent={bismillah} contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false} ListFooterComponent={<View style={{ height: 60 }} />}
          initialNumToRender={10} maxToRenderPerBatch={10} windowSize={7} onScrollToIndexFailed={onScrollToIndexFailed} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row' as const, alignItems: 'center', paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.2 },
  headerSub: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  headerRight: { width: 40 },
  translationBanner: { flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 16 },
  translationBannerText: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular },
  toggleBar: { flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  togglePill: { flexDirection: 'row' as const, alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  togglePillText: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.medium },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.regular, marginTop: 8 },
  errorText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { fontFamily: fontFamily.system, color: '#fff', fontWeight: fw.medium },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  bismillah: { fontSize: 28, textAlign: 'center' as const, marginBottom: 24, lineHeight: 46, fontWeight: fw.regular },
  ayahCard: { borderRadius: 12, padding: 16, marginBottom: 4 },
  ayahHeader: { flexDirection: 'row' as const, alignItems: 'center', marginBottom: 12, gap: 10 },
  ayahBadge: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ayahDivider: { flex: 1, height: StyleSheet.hairlineWidth },
  ayahNum: { fontFamily: fontFamily.system, fontSize: 11, fontWeight: fw.medium },
  arabicText: { textAlign: 'right' as const, fontWeight: fw.regular, marginBottom: 14, writingDirection: 'rtl' as const },
  translitBlock: { flexDirection: 'row' as const, marginBottom: 10 },
  translitAccent: { width: 2, borderRadius: 2, marginRight: 10 },
  transliterationText: { fontFamily: fontFamily.system, fontWeight: fw.regular, fontStyle: 'italic' as const, flex: 1 },
  translationText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, lineHeight: 23 },
});
