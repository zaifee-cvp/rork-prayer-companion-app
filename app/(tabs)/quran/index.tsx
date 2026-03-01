import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SectionList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Lock, Star, Globe, Check, Radio, ChevronRight } from 'lucide-react-native';
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

export default function QuranScreen() {
  const { theme, isDark, settings, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('surah');

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
          <View style={[styles.numberBadge, { backgroundColor: isDark ? 'rgba(107,158,145,0.1)' : 'rgba(107,158,145,0.06)' }]}>
            <Text style={[styles.numberText, { color: Colors.primary }]}>{item.number}</Text>
          </View>
          <View style={styles.surahInfo}>
            <Text style={[styles.surahName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.surahMeaning, { color: theme.textTertiary }]}>
              {item.meaning} · {item.verses} verses · {item.type}
            </Text>
          </View>
          <View style={styles.surahRight}>
            <Text style={[styles.surahArabic, { color: accessible ? Colors.primary : theme.textTertiary }]}>
              {item.nameArabic}
            </Text>
            {!accessible && (
              <View style={[styles.lockBadge, { backgroundColor: isDark ? 'rgba(196,162,101,0.12)' : 'rgba(196,162,101,0.08)' }]}>
                <Lock size={11} color={Colors.gold} strokeWidth={2} />
              </View>
            )}
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
            { backgroundColor: isSelected ? (isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.05)') : theme.surface },
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
            <Text style={[styles.translationAuthor, { color: theme.textTertiary }]} numberOfLines={1}>
              {item.author}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.checkBadge, { backgroundColor: Colors.primary }]}>
              <Check size={13} color="#fff" strokeWidth={3} />
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
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>{section.title}</Text>
      </View>
    ),
    [theme],
  );

  const searchPlaceholder = activeTab === 'translation' ? 'Search languages...' : 'Search surahs...';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Quran</Text>
            <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
              {settings.isPremium ? 'Read with clarity and focus.' : `${PREVIEW_SURAHS.length} preview surahs · Read with clarity and focus.`}
            </Text>
          </View>
          {activeTab !== 'translation' && (
            <View style={[styles.currentLangChip, { backgroundColor: isDark ? 'rgba(107,158,145,0.1)' : 'rgba(107,158,145,0.06)' }]}>
              <Globe size={12} color={Colors.primary} strokeWidth={1.8} />
              <Text style={[styles.currentLangText, { color: Colors.primary }]}>
                {currentTranslation.flag} {currentTranslation.language}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.surfaceSecondary }]}>
          <Search size={16} color={theme.textTertiary} strokeWidth={1.8} />
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
              style={[styles.tab, activeTab === tab && [styles.tabActive, { backgroundColor: isDark ? 'rgba(107,158,145,0.12)' : 'rgba(107,158,145,0.08)' }]]}
              onPress={() => { setActiveTab(tab); setSearch(''); }}
            >
              {tab === 'translation' ? (
                <View style={styles.tabInner}>
                  <Globe size={13} color={activeTab === tab ? Colors.primary : theme.textSecondary} strokeWidth={1.8} />
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
        style={[styles.radioButton, { backgroundColor: isDark ? 'rgba(107,158,145,0.08)' : 'rgba(107,158,145,0.05)', borderColor: isDark ? 'rgba(107,158,145,0.15)' : 'rgba(107,158,145,0.1)' }]}
        onPress={() => router.push('/radio' as any)}
        activeOpacity={0.7}
        testID="live-radio-btn"
      >
        <View style={[styles.radioIconBg, { backgroundColor: Colors.primary }]}>
          <Radio size={14} color="#fff" strokeWidth={2} />
        </View>
        <View style={styles.radioButtonInfo}>
          <Text style={[styles.radioButtonTitle, { color: theme.text }]}>Live Quran Radio</Text>
          <Text style={[styles.radioButtonSub, { color: theme.textTertiary }]} numberOfLines={1}>Tap to listen live</Text>
        </View>
        <ChevronRight size={16} color={theme.textTertiary} strokeWidth={1.5} />
      </TouchableOpacity>

      {activeTab === 'surah' ? (
        <FlatList
          data={filtered}
          renderItem={renderSurah}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.list}
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
                  if (!accessible) { router.push('/paywall' as any); return; }
                  router.push(`/quran/${juz.startSurah}` as any);
                }}
                activeOpacity={0.7}
                testID={`juz-${juz.juz}`}
              >
                <View style={[styles.juzBadge, { backgroundColor: isDark ? 'rgba(196,162,101,0.1)' : 'rgba(196,162,101,0.06)' }]}>
                  <Star size={15} color={Colors.gold} strokeWidth={1.8} />
                </View>
                <View style={styles.juzInfo}>
                  <Text style={[styles.juzName, { color: theme.text }]}>Juz {juz.juz}</Text>
                  <Text style={[styles.juzStart, { color: theme.textTertiary }]}>
                    {startSurah?.name ?? ''} · Ayah {juz.startAyah}
                  </Text>
                </View>
                {startSurah && (
                  <Text style={[styles.juzArabic, { color: accessible ? Colors.gold : theme.textTertiary }]}>
                    {startSurah.nameArabic}
                  </Text>
                )}
                {!accessible && <Lock size={13} color={theme.textTertiary} style={{ marginLeft: 8 }} strokeWidth={1.8} />}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24 },
  titleRow: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8 },
  title: { fontFamily: fontFamily.system, fontSize: 28, fontWeight: fw.bold, letterSpacing: -0.3, lineHeight: 34 },
  subtitle: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, marginTop: 4, marginBottom: 16 },
  currentLangChip: { flexDirection: 'row' as const, alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 6 },
  currentLangText: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium },
  searchBar: { flexDirection: 'row' as const, alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, height: 42, gap: 10, marginBottom: 12 },
  searchInput: { fontFamily: fontFamily.system, flex: 1, fontSize: 15, fontWeight: fw.regular, height: 42 },
  tabs: { flexDirection: 'row' as const, marginBottom: 14, gap: 6 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  tabActive: {},
  tabInner: { flexDirection: 'row' as const, alignItems: 'center', gap: 5 },
  tabText: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.semibold },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  radioButton: { flexDirection: 'row' as const, alignItems: 'center', marginHorizontal: 24, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  radioIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  radioButtonInfo: { flex: 1 },
  radioButtonTitle: { fontFamily: fontFamily.system, fontSize: 14, fontWeight: fw.medium },
  radioButtonSub: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 1 },
  surahRow: { flexDirection: 'row' as const, alignItems: 'center', borderRadius: 12, padding: 14 },
  numberBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  numberText: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.medium },
  surahInfo: { flex: 1, marginLeft: 12 },
  surahName: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium, letterSpacing: -0.2 },
  surahMeaning: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 3 },
  surahRight: { alignItems: 'flex-end' },
  surahArabic: { fontFamily: fontFamily.system, fontSize: 20, fontWeight: fw.regular },
  lockBadge: { marginTop: 4, width: 22, height: 22, borderRadius: 7, justifyContent: 'center' as const, alignItems: 'center' as const },
  juzRow: { flexDirection: 'row' as const, alignItems: 'center', borderRadius: 12, padding: 16, gap: 12 },
  juzBadge: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  juzInfo: { flex: 1 },
  juzName: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium, letterSpacing: -0.2 },
  juzStart: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 3 },
  juzArabic: { fontFamily: fontFamily.system, fontSize: 18, fontWeight: fw.regular },
  translationRow: { flexDirection: 'row' as const, alignItems: 'center', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1.5, borderColor: 'transparent' },
  translationFlag: { fontSize: 22, width: 34, textAlign: 'center' as const },
  translationInfo: { flex: 1 },
  translationName: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.medium },
  translationAuthor: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  checkBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { paddingVertical: 8, paddingTop: 14 },
  sectionTitle: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium, letterSpacing: 0.8, textTransform: 'uppercase' as const },
});
