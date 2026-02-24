import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Easing, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { Navigation, MapPin, AlertCircle, RefreshCw } from 'lucide-react-native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import { useApp } from '@/providers/AppProvider';
import Colors from '@/constants/colors';
import { fontFamily, fontWeight as fw } from '@/constants/typography';
import { calculateQiblaDirection, calculateDistance } from '@/utils/qibla';

function computeTiltCompensatedHeading(
  acc: { x: number; y: number; z: number },
  mag: { x: number; y: number; z: number },
): number | null {
  const { x: ax, y: ay, z: az } = acc;
  const { x: mx, y: my, z: mz } = mag;

  const Hx = my * az - mz * ay;
  const Hy = mz * ax - mx * az;
  const Hz = mx * ay - my * ax;

  const normH = Math.sqrt(Hx * Hx + Hy * Hy + Hz * Hz);
  if (normH < 0.1) return null;

  const normA = Math.sqrt(ax * ax + ay * ay + az * az);
  if (normA < 0.1) return null;

  const invH = 1.0 / normH;
  const invA = 1.0 / normA;

  const ey = Hy * invH;
  const ez = Hz * invH;
  const ex = Hx * invH;

  const gx = ax * invA;
  const gz = az * invA;

  const Ny = gz * ex - gx * ez;

  let heading = Math.atan2(ey, Ny) * (180 / Math.PI);
  return (heading + 360) % 360;
}

function simpleHeadingFromMag(mag: { x: number; y: number; z: number }): number {
  let angle = Math.atan2(-mag.x, mag.y) * (180 / Math.PI);
  return (angle + 360) % 360;
}

function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<'low' | 'medium' | 'high'>('low');
  const [retryKey, setRetryKey] = useState(0);

  const magRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const accelRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const headingReceived = useRef(false);
  const mountedRef = useRef(true);

  const retry = useCallback(() => {
    setError(null);
    setHeading(null);
    headingReceived.current = false;
    magRef.current = null;
    accelRef.current = null;
    setRetryKey(k => k + 1);
  }, []);

  useEffect(() => {
    let magSub: { remove: () => void } | null = null;
    let accelSub: { remove: () => void } | null = null;
    let cleanupWeb: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    mountedRef.current = true;

    function updateHeading() {
      if (!mountedRef.current) return;
      const mag = magRef.current;
      const acc = accelRef.current;

      if (mag && acc) {
        const h = computeTiltCompensatedHeading(acc, mag);
        if (h !== null) {
          headingReceived.current = true;
          setHeading(h);
          setError(null);

          const magnitude = Math.sqrt(mag.x ** 2 + mag.y ** 2 + mag.z ** 2);
          if (magnitude > 25 && magnitude < 65) {
            setAccuracy('high');
          } else if (magnitude > 10 && magnitude < 100) {
            setAccuracy('medium');
          } else {
            setAccuracy('low');
          }
          return;
        }
      }

      if (mag) {
        const h = simpleHeadingFromMag(mag);
        headingReceived.current = true;
        setHeading(h);
        setError(null);
        setAccuracy('low');
      }
    }

    async function startNativeCompass() {
      try {
        console.log('[Qibla] Checking sensor availability...');

        let magAvailable = false;
        let accelAvailable = false;

        try {
          magAvailable = await Magnetometer.isAvailableAsync();
          console.log('[Qibla] Magnetometer available:', magAvailable);
        } catch (e) {
          console.warn('[Qibla] Error checking magnetometer:', e);
        }

        try {
          accelAvailable = await Accelerometer.isAvailableAsync();
          console.log('[Qibla] Accelerometer available:', accelAvailable);
        } catch (e) {
          console.warn('[Qibla] Error checking accelerometer:', e);
        }

        if (!magAvailable) {
          if (mountedRef.current) {
            setError('Magnetometer not available on this device. Showing calculated direction.');
          }
          return;
        }

        try {
          Magnetometer.setUpdateInterval(150);
        } catch (e) {
          console.warn('[Qibla] Error setting magnetometer interval:', e);
        }

        try {
          magSub = Magnetometer.addListener((data) => {
            if (!mountedRef.current) return;
            magRef.current = data;
            updateHeading();
          });
          console.log('[Qibla] Magnetometer listener started');
        } catch (e) {
          console.error('[Qibla] Error adding magnetometer listener:', e);
          if (mountedRef.current) setError('Failed to start magnetometer. Tap retry.');
          return;
        }

        if (accelAvailable) {
          try {
            Accelerometer.setUpdateInterval(150);
            accelSub = Accelerometer.addListener((data) => {
              if (!mountedRef.current) return;
              accelRef.current = data;
              updateHeading();
            });
            console.log('[Qibla] Accelerometer listener started');
          } catch (e) {
            console.warn('[Qibla] Accelerometer failed (using magnetometer only):', e);
          }
        }

        timeoutId = setTimeout(() => {
          if (mountedRef.current && !headingReceived.current) {
            console.log('[Qibla] No heading data received after timeout');
            setError('Compass not responding. Move your device in a figure-8 pattern or tap retry.');
          }
        }, 5000);
      } catch (e) {
        console.error('[Qibla] Unexpected error starting compass:', e);
        if (mountedRef.current) setError('Failed to start compass. Tap retry.');
      }
    }

    function startWebCompass() {
      try {
        const handleOrientation = (event: DeviceOrientationEvent) => {
          if (!mountedRef.current) return;
          let alpha: number | null = null;

          if ((event as any).webkitCompassHeading !== undefined) {
            alpha = (event as any).webkitCompassHeading as number;
          } else if (event.alpha !== null && event.alpha !== undefined) {
            alpha = (360 - event.alpha) % 360;
          }

          if (alpha !== null) {
            headingReceived.current = true;
            setHeading(alpha);
            setAccuracy(event.absolute ? 'high' : 'medium');
            setError(null);
          }
        };

        const init = async () => {
          try {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
              const permission = await (DeviceOrientationEvent as any).requestPermission();
              if (permission === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation, true);
              } else {
                if (mountedRef.current) setError('Compass permission denied');
                return;
              }
            } else {
              window.addEventListener('deviceorientation', handleOrientation, true);
            }

            cleanupWeb = () => {
              window.removeEventListener('deviceorientation', handleOrientation, true);
            };

            timeoutId = setTimeout(() => {
              if (mountedRef.current && !headingReceived.current) {
                setError('Compass not available. Showing calculated Qibla direction.');
              }
            }, 3000);
          } catch {
            if (mountedRef.current) setError('Compass not available. Showing calculated Qibla direction.');
          }
        };

        init();
      } catch {
        if (mountedRef.current) setError('Compass not available. Showing calculated Qibla direction.');
      }
    }

    if (Platform.OS === 'web') {
      startWebCompass();
    } else {
      startNativeCompass();
    }

    return () => {
      mountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (magSub) {
        try { magSub.remove(); } catch (e) { console.warn('[Qibla] cleanup mag error:', e); }
      }
      if (accelSub) {
        try { accelSub.remove(); } catch (e) { console.warn('[Qibla] cleanup accel error:', e); }
      }
      if (cleanupWeb) cleanupWeb();
    };
  }, [retryKey]);

  return { heading, error, accuracy, retry };
}

export default function QiblaScreen() {
  const { theme, isDark, city } = useApp();
  const insets = useSafeAreaInsets();
  const { heading, error, accuracy, retry } = useCompassHeading();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevTarget = useRef<number>(0);

  const qiblaAngle = useMemo(
    () => calculateQiblaDirection(city.lat, city.lng),
    [city.lat, city.lng],
  );

  const distance = useMemo(
    () => calculateDistance(city.lat, city.lng, 21.4225, 39.8262),
    [city.lat, city.lng],
  );

  const qiblaRelative = heading !== null ? ((qiblaAngle - heading) + 360) % 360 : null;
  const isPointingToQibla = qiblaRelative !== null && (qiblaRelative < 5 || qiblaRelative > 355);

  useEffect(() => {
    if (heading === null) return;

    const target = -heading;
    let diff = target - prevTarget.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const newTarget = prevTarget.current + diff;
    prevTarget.current = newTarget;

    Animated.timing(rotateAnim, {
      toValue: newTarget,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [heading, rotateAnim]);

  const compassRotation = rotateAnim.interpolate({
    inputRange: [-36000, 36000],
    outputRange: ['-36000deg', '36000deg'],
  });

  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 30;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  const qiblaRad = ((qiblaAngle - 90) * Math.PI) / 180;
  const pointerLen = radius - 10;
  const pointerEndX = center + pointerLen * Math.cos(qiblaRad);
  const pointerEndY = center + pointerLen * Math.sin(qiblaRad);
  const kaabaDist = radius * 0.75;
  const kaabaPx = center + kaabaDist * Math.cos(qiblaRad);
  const kaabaPy = center + kaabaDist * Math.sin(qiblaRad);

  const accuracyLabel = accuracy === 'high' ? 'Good' : accuracy === 'medium' ? 'Fair' : 'Calibrate';
  const accuracyColor = accuracy === 'high' ? '#00E676' : accuracy === 'medium' ? Colors.gold : '#FF4757';

  const renderCompassSvg = useCallback(() => (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        strokeWidth={2}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius * 0.65}
        stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
        strokeWidth={1}
        fill="none"
      />

      {directions.map((dir, i) => {
        const angle = ((i * 45 - 90) * Math.PI) / 180;
        const textR = radius + 16;
        const tx = center + textR * Math.cos(angle);
        const ty = center + textR * Math.sin(angle);
        const tickStart = center + (radius - 6) * Math.cos(angle);
        const tickEnd = center + (radius + 2) * Math.cos(angle);
        const tickSY = center + (radius - 6) * Math.sin(angle);
        const tickEY = center + (radius + 2) * Math.sin(angle);
        const isCardinal = i % 2 === 0;
        return (
          <G key={dir}>
            <Line
              x1={tickStart}
              y1={tickSY}
              x2={tickEnd}
              y2={tickEY}
              stroke={dir === 'N' ? '#FF4757' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')}
              strokeWidth={isCardinal ? 2 : 1}
            />
            <SvgText
              x={tx}
              y={ty + 4}
              textAnchor="middle"
              fontSize={isCardinal ? 13 : 10}
              fontWeight={isCardinal ? '700' : '400'}
              fill={dir === 'N' ? '#FF4757' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)')}
            >
              {dir}
            </SvgText>
          </G>
        );
      })}

      {Array.from({ length: 36 }).map((_, i) => {
        if (i % 4 === 0) return null;
        const angle = ((i * 10 - 90) * Math.PI) / 180;
        const s = center + (radius - 3) * Math.cos(angle);
        const e = center + radius * Math.cos(angle);
        const sy = center + (radius - 3) * Math.sin(angle);
        const ey = center + radius * Math.sin(angle);
        return (
          <Line
            key={`tick-${i}`}
            x1={s} y1={sy} x2={e} y2={ey}
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
            strokeWidth={1}
          />
        );
      })}

      <Line
        x1={center}
        y1={center}
        x2={pointerEndX}
        y2={pointerEndY}
        stroke={isPointingToQibla ? '#00E676' : Colors.primary}
        strokeWidth={3}
        strokeLinecap="round"
      />

      <Circle cx={center} cy={center} r={5} fill={isPointingToQibla ? '#00E676' : Colors.primary} />

      <Circle cx={kaabaPx} cy={kaabaPy} r={14} fill={Colors.gold} />
      <SvgText
        x={kaabaPx}
        y={kaabaPy + 5}
        textAnchor="middle"
        fontSize={12}
        fontWeight="800"
        fill="#fff"
      >
        ۞
      </SvgText>
    </Svg>
  ), [isDark, isPointingToQibla, qiblaAngle, size, center, radius, kaabaPx, kaabaPy, pointerEndX, pointerEndY]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Qibla</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Direction to the Kaaba
      </Text>

      {isPointingToQibla && (
        <View style={styles.alignedBadge}>
          <Text style={styles.alignedText}>Facing Qibla ✓</Text>
        </View>
      )}

      <View style={[styles.compassCard, { backgroundColor: theme.surface }]}>
        {heading !== null ? (
          <Animated.View style={{ transform: [{ rotate: compassRotation }] }}>
            {renderCompassSvg()}
          </Animated.View>
        ) : (
          <View>
            {renderCompassSvg()}
          </View>
        )}

        {heading !== null && (
          <View style={styles.headingRow}>
            <Text style={[styles.headingText, { color: theme.text }]}>
              {Math.round(heading)}°
            </Text>
            <View style={[styles.accuracyDot, { backgroundColor: accuracyColor }]} />
            <Text style={[styles.accuracyText, { color: accuracyColor }]}>
              {accuracyLabel}
            </Text>
          </View>
        )}
      </View>

      {error && (
        <TouchableOpacity
          style={[styles.errorCard, { backgroundColor: isDark ? 'rgba(255,71,87,0.1)' : 'rgba(255,71,87,0.06)' }]}
          onPress={retry}
          activeOpacity={0.7}
        >
          <AlertCircle size={16} color="#FF4757" />
          <Text style={[styles.errorText, { color: '#FF4757' }]}>{error}</Text>
          <RefreshCw size={16} color="#FF4757" />
        </TouchableOpacity>
      )}

      <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
        <View style={styles.infoRow}>
          <Navigation size={20} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Qibla Direction</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {qiblaAngle.toFixed(1)}°
              {qiblaRelative !== null && (
                <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '400' as const }}>
                  {' '}({Math.round(qiblaRelative)}° from you)
                </Text>
              )}
            </Text>
          </View>
          <TouchableOpacity
            onPress={retry}
            style={styles.retryButton}
            activeOpacity={0.7}
            testID="qibla-retry"
          >
            <RefreshCw size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
        <View style={styles.infoRow}>
          <MapPin size={20} color={Colors.gold} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Distance to Kaaba</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{Math.round(distance).toLocaleString()} km</Text>
          </View>
        </View>
      </View>

      <View style={[styles.noteCard, { backgroundColor: isDark ? 'rgba(0,212,230,0.08)' : 'rgba(0,212,230,0.05)' }]}>
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          {heading !== null
            ? 'Hold your device flat and rotate until the compass aligns with the Kaaba marker. Keep away from magnets and metal objects for best accuracy.'
            : `Showing calculated Qibla direction from ${city.name}. Hold device flat for live compass.`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 20, alignItems: 'center' },
  title: { fontFamily: fontFamily.system, fontSize: 34, fontWeight: fw.bold, letterSpacing: 0.37, lineHeight: 41, alignSelf: 'flex-start', paddingTop: 8 },
  subtitle: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, letterSpacing: -0.08, marginTop: 4, marginBottom: 16, alignSelf: 'flex-start' },
  alignedBadge: {
    backgroundColor: '#00E676',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  alignedText: {
    fontFamily: fontFamily.system,
    color: '#fff',
    fontSize: 15,
    fontWeight: fw.semibold,
    letterSpacing: -0.24,
  },
  compassCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  headingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  headingText: {
    fontFamily: fontFamily.system,
    fontSize: 16,
    fontWeight: fw.semibold,
    letterSpacing: -0.32,
  },
  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  accuracyText: {
    fontFamily: fontFamily.system,
    fontSize: 12,
    fontWeight: fw.medium,
  },
  errorCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  errorText: {
    fontFamily: fontFamily.system,
    fontSize: 13,
    fontWeight: fw.medium,
    letterSpacing: -0.08,
    flex: 1,
  },
  infoCard: {
    borderRadius: 16,
    padding: 18,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 14, paddingVertical: 4 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: fontFamily.system, fontSize: 12, fontWeight: fw.medium },
  infoValue: { fontFamily: fontFamily.system, fontSize: 17, fontWeight: fw.semibold, letterSpacing: -0.41, marginTop: 2 },
  infoDivider: { height: 1, marginVertical: 12 },
  retryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  noteCard: {
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  noteText: { fontFamily: fontFamily.system, fontSize: 13, fontWeight: fw.regular, letterSpacing: -0.08, lineHeight: 18 },
});
