import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';

interface PremiumGateProps {
  children: React.ReactNode;
  locked?: boolean;
  message?: string;
  style?: object;
}

export default function PremiumGate({ children, locked, message = 'Upgrade to Premium', style }: PremiumGateProps) {
  const { settings, isDark } = useApp();
  const router = useRouter();
  const isLocked = locked !== undefined ? locked : !settings.isPremium;

  if (!isLocked) return <>{children}</>;

  return (
    <View style={[styles.container, style]}>
      {children}
      <BlurView intensity={isDark ? 40 : 25} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/paywall' as any)}
          activeOpacity={0.7}
          testID="premium-gate-button"
        >
          <Lock size={18} color="#fff" />
          <Text style={styles.buttonText}>{message}</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: '#6B9E91',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 15,
    fontWeight: fw.semibold,
    letterSpacing: -0.24,
  },
});
