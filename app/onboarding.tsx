import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Calculator,
  Bell,
  ChevronRight,
  Check,
  Moon,
} from 'lucide-react-native';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import cities from '@/constants/cities';
import { CALCULATION_METHODS } from '@/utils/prayer-times';

const STEPS = [
  { key: 'welcome', title: 'Prayer Companion', subtitle: 'Quran & Qibla — Your daily spiritual guide', icon: 'moon' },
  { key: 'location', title: 'Your Location', subtitle: 'For accurate prayer times', icon: 'map' },
  { key: 'method', title: 'Calculation Method', subtitle: 'Choose your preferred method', icon: 'calc' },
  { key: 'madhab', title: 'Madhab', subtitle: 'For Asr prayer calculation', icon: 'calc' },
  { key: 'notifications', title: 'Notifications', subtitle: 'Stay reminded of prayer times', icon: 'bell' },
];

export default function OnboardingScreen() {
  const { theme, isDark, settings, updateSettings } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [citySearch, setCitySearch] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const filteredCities = cities.filter((c) => {
    if (!citySearch.trim()) return true;
    const q = citySearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  const animateTransition = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 150);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      animateTransition(step + 1);
    } else {
      updateSettings({ onboardingComplete: true });
      router.replace('/');
    }
  };

  const handleSkip = () => {
    updateSettings({ onboardingComplete: true });
    router.replace('/');
  };

  const currentStep = STEPS[step];
  const progress = (step + 1) / STEPS.length;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {step === 0 && (
            <View style={styles.welcomeStep}>
              <LinearGradient
                colors={['#00D4E6', '#006B78']}
                style={styles.welcomeIcon}
              >
                <Moon size={48} color="#fff" />
              </LinearGradient>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>Prayer Companion: Quran & Qibla</Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Accurate prayer times, Qibla direction, Quran reading, and dhikr — beautifully crafted for your daily spiritual journey.
              </Text>
            </View>
          )}

          {step === 1 && (
            <View style={styles.listStep}>
              <MapPin size={32} color={Colors.primary} />
              <Text style={[styles.stepTitle, { color: theme.text }]}>{currentStep.title}</Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>{currentStep.subtitle}</Text>
              <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary }]}>
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search cities..."
                  placeholderTextColor={theme.textTertiary}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
              </View>
              <FlatList
                data={filteredCities.slice(0, 20)}
                keyExtractor={(_, i) => String(i)}
                style={styles.listContainer}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const idx = cities.indexOf(item);
                  const selected = idx === settings.selectedCityIndex;
                  return (
                    <TouchableOpacity
                      style={[styles.listRow, selected && { backgroundColor: isDark ? 'rgba(0,212,230,0.08)' : 'rgba(0,212,230,0.05)' }]}
                      onPress={() => updateSettings({ selectedCityIndex: idx })}
                    >
                      <View style={styles.listRowContent}>
                        <Text style={[styles.listRowTitle, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.listRowSub, { color: theme.textSecondary }]}>{item.country}</Text>
                      </View>
                      {selected && <Check size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.listStep}>
              <Calculator size={32} color={Colors.primary} />
              <Text style={[styles.stepTitle, { color: theme.text }]}>{currentStep.title}</Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>{currentStep.subtitle}</Text>
              <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {Object.entries(CALCULATION_METHODS).map(([key, method]) => {
                  const selected = key === settings.calculationMethod;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.listRow, selected && { backgroundColor: isDark ? 'rgba(0,212,230,0.08)' : 'rgba(0,212,230,0.05)' }]}
                      onPress={() => updateSettings({ calculationMethod: key })}
                    >
                      <View style={styles.listRowContent}>
                        <Text style={[styles.listRowTitle, { color: theme.text }]}>{method.name}</Text>
                        <Text style={[styles.listRowSub, { color: theme.textSecondary }]}>
                          Fajr: {method.params.fajr}° · Isha: {method.params.ishaMinutes ? `${method.params.ishaMinutes}min` : `${method.params.isha}°`}
                        </Text>
                      </View>
                      {selected && <Check size={18} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {step === 3 && (
            <View style={styles.choiceStep}>
              <Calculator size={32} color={Colors.primary} />
              <Text style={[styles.stepTitle, { color: theme.text }]}>{currentStep.title}</Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                Choose your school of thought for Asr prayer time calculation
              </Text>
              <View style={styles.choiceCards}>
                {(['shafi', 'hanafi'] as const).map((m) => {
                  const selected = settings.madhab === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.choiceCard,
                        { backgroundColor: theme.surface, borderColor: selected ? Colors.primary : theme.border },
                        selected && styles.choiceCardSelected,
                      ]}
                      onPress={() => updateSettings({ madhab: m })}
                    >
                      {selected && (
                        <View style={styles.choiceCheck}>
                          <Check size={16} color="#fff" />
                        </View>
                      )}
                      <Text style={[styles.choiceTitle, { color: theme.text }]}>
                        {m === 'shafi' ? "Shafi / Maliki / Hanbali" : 'Hanafi'}
                      </Text>
                      <Text style={[styles.choiceDesc, { color: theme.textSecondary }]}>
                        {m === 'shafi'
                          ? 'Shadow equals object length'
                          : 'Shadow equals twice object length'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.choiceStep}>
              <Bell size={32} color={Colors.primary} />
              <Text style={[styles.stepTitle, { color: theme.text }]}>{currentStep.title}</Text>
              <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
                Get notified when it is time to pray. You can customize this later in settings.
              </Text>
              <View style={[styles.notifCard, { backgroundColor: theme.surface }]}>
                <Bell size={40} color={Colors.primary} />
                <Text style={[styles.notifText, { color: theme.text }]}>
                  Enable prayer notifications to never miss a prayer time
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {step > 0 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={['#00D4E6', '#00A3B8']}
              style={styles.nextGradient}
            >
              <Text style={styles.nextText}>
                {step === STEPS.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,212,230,0.12)',
    borderRadius: 2,
    marginBottom: 24,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  content: { flex: 1 },
  welcomeStep: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: { fontFamily: fontFamily.system, fontSize: 34, fontWeight: fw.bold, textAlign: 'center' as const, letterSpacing: 0.37, lineHeight: 41 },
  welcomeSubtitle: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.regular, textAlign: 'center' as const, letterSpacing: -0.41, lineHeight: 22, marginTop: 12, maxWidth: 300 },
  listStep: { flex: 1, alignItems: 'center', paddingTop: 20 },
  stepTitle: { fontFamily: fontFamily.system, fontSize: 28, fontWeight: fw.bold, letterSpacing: 0.36, lineHeight: 34, marginTop: 16 },
  stepSubtitle: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, letterSpacing: -0.24, textAlign: 'center' as const, marginTop: 8, marginBottom: 20 },
  searchBox: { width: '100%', borderRadius: 12, paddingHorizontal: 14, marginBottom: 12 },
  searchInput: { fontFamily: fontFamily.system, height: 44, fontSize: 16, fontWeight: fw.regular, letterSpacing: -0.32 },
  listContainer: { width: '100%', flex: 1 },
  listRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  listRowContent: { flex: 1 },
  listRowTitle: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.regular, letterSpacing: -0.32 },
  listRowSub: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.regular, marginTop: 2 },
  choiceStep: { flex: 1, alignItems: 'center', paddingTop: 40 },
  choiceCards: { width: '100%', gap: 12, marginTop: 24 },
  choiceCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  choiceCardSelected: {
    borderColor: Colors.primary,
  },
  choiceCheck: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceTitle: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.semibold, letterSpacing: -0.41 },
  choiceDesc: { fontFamily: fontFamily.system, fontSize: 15, fontWeight: fw.regular, letterSpacing: -0.24, marginTop: 6 },
  notifCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  notifText: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.regular, letterSpacing: -0.32, textAlign: 'center' as const, lineHeight: 22 },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 16,
  },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  skipText: { fontFamily: fontFamily.system, fontSize: 16, fontWeight: fw.regular, letterSpacing: -0.32 },
  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 8,
  },
  nextText: { fontFamily: fontFamily.system, color: '#fff', fontSize: 17, fontWeight: fw.semibold, letterSpacing: -0.41 },
});
