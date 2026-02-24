import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Globe, Type, Languages, BookOpen, Eye, EyeOff, Play, Pause, Square, Volume2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import { surahs } from '@/constants/quran-data';
import { getTranslationById, QURAN_TRANSLATIONS } from '@/constants/quran-translations';
import { getReciterById } from '@/constants/reciters';
import { useQuranAudio } from '@/hooks/useQuranAudio';

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
  } catch {
    return null;
  }
}

async function cacheSurahData(surahNum: number, translationId: number, data: CachedSurahData): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${surahNum}_${translationId}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.log('[Quran] Cache write failed:', e);
  }
}

export type AyahAudioState = 'idle' | 'loading' | 'playing' | 'paused';

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
      {
        backgroundColor: active
          ? Colors.primary
          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      },
    ]}
  >
    {icon}
    <Text
      style={[
        styles.togglePillText,
        { color: active ? '#fff' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
      ]}
    >
      {label}
    </Text>
    {active ? (
      <Eye size={11} color="#fff" strokeWidth={2.5} />
    ) : (
      <EyeOff size={11} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} strokeWidth={2} />
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
  audioState: AyahAudioState;
  onAudioPress: (ayahNumber: number) => void;
}

const AyahCard = React.memo(({
  verse,
  index,
  transliteration,
  showArabic,
  showTransliteration,
  showTranslation,
  arabicFontSize,
  translitFontSize,
  isDark,
  theme,
  audioState,
  onAudioPress,
}: AyahCardProps) => {
  const translationText = verse.translations?.[0]?.text;
  const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '');

  const isActive = audioState !== 'idle';
  const cardBg = isActive
    ? isDark ? 'rgba(0,212,230,0.06)' : 'rgba(0,212,230,0.04)'
    : index % 2 === 0 ? theme.surface : 'transparent';

  return (
    <View
      style={[
        styles.ayahCard,
        { backgroundColor: cardBg },
        isActive && styles.ayahCardActive,
        isActive && { borderColor: isDark ? 'rgba(0,212,230,0.15)' : 'rgba(0,212,230,0.2)' },
      ]}
    >
      <View style={styles.ayahHeader}>
        <View style={[styles.ayahBadge, { backgroundColor: isDark ? 'rgba(0,212,230,0.08)' : 'rgba(0,212,230,0.05)' }]}>
          <Text style={[styles.ayahNum, { color: Colors.primary }]}>
            {verse.verse_number}
          </Text>
        </View>
        <View style={[styles.ayahDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} />
        <TouchableOpacity
          onPress={() => onAudioPress(verse.verse_number)}
          style={[
            styles.audioBtn,
            isActive && { backgroundColor: isDark ? 'rgba(0,212,230,0.12)' : 'rgba(0,212,230,0.08)' },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
          testID={`ayah-audio-${verse.verse_number}`}
        >
          {audioState === 'loading' ? (
            <ActivityIndicator size={14} color={Colors.primary} />
          ) : audioState === 'playing' ? (
            <Pause size={13} color={Colors.primary} strokeWidth={2.5} />
          ) : audioState === 'paused' ? (
            <Play size={13} color={Colors.primary} strokeWidth={2.5} />
          ) : (
            <Play size={13} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {showArabic && (
        <Text style={[styles.arabicText, { color: theme.text, fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.85 }]}>
          {verse.text_uthmani}
        </Text>
      )}

      {showTransliteration && transliteration && (
        <View style={styles.translitBlock}>
          <View style={[styles.translitAccent, { backgroundColor: isDark ? 'rgba(0,212,230,0.2)' : 'rgba(0,212,230,0.3)' }]} />
          <Text
            style={[
              styles.transliterationText,
              {
                color: isDark ? '#7DD4D9' : '#007A82',
                fontSize: translitFontSize,
                lineHeight: translitFontSize * 1.6,
              },
            ]}
          >
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

  const {
    showTransliteration,
    showArabic,
    showTranslation,
    transliterationFontSize,
    arabicFontSize,
  } = settings;

  const currentTranslation = useMemo(
    () => getTranslationById(settings.quranTranslationId) ?? QURAN_TRANSLATIONS[0],
    [settings.quranTranslationId],
  );

  const currentReciter = useMemo(
    () => getReciterById(settings.selectedReciterId),
    [settings.selectedReciterId],
  );

  const versesQuery = useQuery({
    queryKey: ['quran-verses', surahNum, settings.quranTranslationId],
    queryFn: async () => {
      const translationId = settings.quranTranslationId;

      const cached = await getCachedSurah(surahNum, translationId);
      if (cached) {
        console.log(`[Quran] Using cached data for surah ${surahNum}`);
        return cached;
      }

      const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?translations=${translationId}&fields=text_uthmani&per_page=300&language=${currentTranslation.languageCode}&words=true&word_fields=transliteration`;
      console.log(`[Quran] Fetching surah ${surahNum} with translation ${translationId}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch verses');
      const data = await res.json();
      const verses = data.verses as QuranVerse[];

      const transliterations: Record<number, string> = {};
      for (const verse of verses) {
        if (verse.words && verse.words.length > 0) {
          const parts = verse.words
            .filter((w) => w.transliteration?.text)
            .map((w) => w.transliteration!.text);
          if (parts.length > 0) {
            transliterations[verse.verse_number] = parts.join(' ');
          }
        }
      }

      const cacheData: CachedSurahData = {
        verses,
        transliterations,
        timestamp: Date.now(),
      };
      await cacheSurahData(surahNum, translationId, cacheData);
      console.log(`[Quran] Cached surah ${surahNum} (${Object.keys(transliterations).length} transliterations)`);

      return cacheData;
    },
  });

  const audio = useQuranAudio({
    surahNumber: surahNum,
    totalVerses: versesQuery.data?.verses?.length ?? 0,
    reciterFolder: currentReciter.folder,
    autoPlayNext: settings.autoPlayNextAyah,
  });

  useEffect(() => {
    if (audio.currentAyah !== null && audio.isPlaying && versesQuery.data?.verses) {
      const index = versesQuery.data.verses.findIndex((v) => v.verse_number === audio.currentAyah);
      if (index >= 0) {
        try {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
        } catch {
          console.log('[Quran] scrollToIndex failed, ignoring');
        }
      }
    }
  }, [audio.currentAyah]);

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

  const getAyahAudioState = useCallback((verseNumber: number): AyahAudioState => {
    if (audio.currentAyah !== verseNumber) return 'idle';
    if (audio.isLoading) return 'loading';
    if (audio.isPlaying) return 'playing';
    return 'paused';
  }, [audio.currentAyah, audio.isLoading, audio.isPlaying]);

  const renderAyah = useCallback(
    ({ item, index }: { item: QuranVerse; index: number }) => {
      const translit = versesQuery.data?.transliterations[item.verse_number] ?? null;
      return (
        <AyahCard
          verse={item}
          index={index}
          transliteration={translit}
          showArabic={showArabic}
          showTransliteration={showTransliteration}
          showTranslation={showTranslation}
          arabicFontSize={arabicFontSize}
          translitFontSize={transliterationFontSize}
          isDark={isDark}
          theme={theme}
          audioState={getAyahAudioState(item.verse_number)}
          onAudioPress={audio.handleAyahPress}
        />
      );
    },
    [versesQuery.data, showArabic, showTransliteration, showTranslation, arabicFontSize, transliterationFontSize, isDark, theme, getAyahAudioState, audio.handleAyahPress],
  );

  const bismillah = useMemo(() => {
    if (surahNum === 9 || surahNum === 1) return null;
    return (
      <Text style={[styles.bismillah, { color: theme.text }]}>
        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
      </Text>
    );
  }, [surahNum, theme.text]);

  const keyExtractor = useCallback((item: QuranVerse) => String(item.id), []);

  const hasMiniPlayer = audio.currentAyah !== null;

  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
    }, 300);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => { audio.stop(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{surah.name}</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {surah.nameArabic} · {surah.verses} verses
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.translationBanner, { backgroundColor: isDark ? 'rgba(0,212,230,0.06)' : 'rgba(0,212,230,0.04)' }]}>
        <Globe size={13} color={Colors.primary} />
        <Text style={[styles.translationBannerText, { color: theme.textSecondary }]}>
          {currentTranslation.language} · {currentTranslation.name}
        </Text>
      </View>

      <View style={[styles.toggleBar, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)', borderBottomColor: theme.border }]}>
        <TogglePill
          label="Arabic"
          active={showArabic}
          onPress={toggleArabic}
          icon={<Type size={12} color={showArabic ? '#fff' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'} strokeWidth={2.5} />}
          isDark={isDark}
        />
        <TogglePill
          label="Transliteration"
          active={showTransliteration}
          onPress={toggleTransliteration}
          icon={<Languages size={12} color={showTransliteration ? '#fff' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'} strokeWidth={2.5} />}
          isDark={isDark}
        />
        <TogglePill
          label="Translation"
          active={showTranslation}
          onPress={toggleTranslation}
          icon={<BookOpen size={12} color={showTranslation ? '#fff' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'} strokeWidth={2.5} />}
          isDark={isDark}
        />
      </View>

      {versesQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading surah...</Text>
        </View>
      ) : versesQuery.isError ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: Colors.danger }]}>Failed to load surah</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { versesQuery.refetch(); }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={versesQuery.data?.verses ?? []}
          renderItem={renderAyah}
          keyExtractor={keyExtractor}
          ListHeaderComponent={bismillah}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: hasMiniPlayer ? 130 : 60 }} />}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          onScrollToIndexFailed={onScrollToIndexFailed}
        />
      )}

      {hasMiniPlayer && (
        <View
          style={[
            styles.miniPlayer,
            {
              backgroundColor: isDark ? 'rgba(13,20,24,0.96)' : 'rgba(255,255,255,0.96)',
              borderTopColor: theme.border,
            },
          ]}
          testID="mini-player"
        >
          <View style={[styles.miniPlayerAccent, { backgroundColor: Colors.primary, width: audio.isPlaying ? '100%' : '30%' }]} />
          <View style={styles.miniPlayerContent}>
            <View style={[styles.miniPlayerIcon, { backgroundColor: isDark ? 'rgba(0,212,230,0.1)' : 'rgba(0,212,230,0.06)' }]}>
              <Volume2 size={15} color={Colors.primary} />
            </View>
            <View style={styles.miniPlayerInfo}>
              <Text style={[styles.miniPlayerTitle, { color: theme.text }]} numberOfLines={1}>
                {surah.name} · Ayah {audio.currentAyah}
              </Text>
              <Text style={[styles.miniPlayerSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {currentReciter.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={audio.togglePlayback}
              style={[styles.miniPlayerPlayBtn, { backgroundColor: Colors.primary }]}
              activeOpacity={0.7}
              testID="mini-player-toggle"
            >
              {audio.isPlaying ? (
                <Pause size={15} color="#fff" strokeWidth={3} />
              ) : (
                <Play size={15} color="#fff" strokeWidth={3} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={audio.stop}
              style={styles.miniPlayerStopBtn}
              activeOpacity={0.6}
              testID="mini-player-stop"
            >
              <Square size={13} color={theme.textTertiary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.semibold, letterSpacing: -0.41 },
  headerSub: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  headerRight: { width: 40 },
  translationBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  translationBannerText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.medium,
    letterSpacing: -0.08,
  },
  toggleBar: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  togglePill: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  togglePillText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.semibold,
    letterSpacing: -0.08,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, letterSpacing: -0.24, marginTop: 8 },
  errorText: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.semibold, letterSpacing: -0.32 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { fontFamily: fontFamily.system, color: '#fff', fontWeight: fw.semibold, letterSpacing: -0.32 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  bismillah: {
    fontSize: 26,
    textAlign: 'center' as const,
    marginBottom: 20,
    lineHeight: 42,
    fontWeight: fw.regular,
  },
  ayahCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  ayahCardActive: {
    borderWidth: 1,
    borderRadius: 14,
  },
  ayahHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  ayahBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahDivider: {
    flex: 1,
    height: 1,
  },
  ayahNum: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.semibold },
  audioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicText: {
    textAlign: 'right' as const,
    fontWeight: fw.regular,
    marginBottom: 12,
    writingDirection: 'rtl' as const,
  },
  translitBlock: {
    flexDirection: 'row' as const,
    marginBottom: 10,
  },
  translitAccent: {
    width: 2.5,
    borderRadius: 2,
    marginRight: 10,
  },
  transliterationText: {
    fontFamily: fontFamily.system,
    fontWeight: fw.regular,
    fontStyle: 'italic' as const,
    letterSpacing: -0.15,
    flex: 1,
  },
  translationText: {
    fontFamily: fontFamily.system,
    fontSize: 15,
    fontWeight: fw.regular,
    letterSpacing: -0.24,
    lineHeight: 22,
  },
  miniPlayer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  miniPlayerAccent: {
    height: 2,
    borderRadius: 1,
  },
  miniPlayerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  miniPlayerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayerInfo: {
    flex: 1,
  },
  miniPlayerTitle: {
    fontFamily: fontFamily.system,
    fontSize: 14,
    fontWeight: fw.semibold,
    letterSpacing: -0.15,
  },
  miniPlayerSub: {
    fontFamily: fontFamily.system,
    fontSize: 11,
    fontWeight: fw.regular,
    letterSpacing: -0.08,
    marginTop: 1,
  },
  miniPlayerPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlayerStopBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
