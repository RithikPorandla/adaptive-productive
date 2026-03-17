import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { API_BASE } from '../constants';

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

export function FocusScreen() {
  const [totalSeconds, setTotalSeconds] = useState(POMODORO_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTotalSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          logSession(isBreak ? BREAK_MINUTES : POMODORO_MINUTES);
          setIsBreak((b) => !b);
          return b ? POMODORO_MINUTES * 60 : BREAK_MINUTES * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isBreak]);

  const logSession = async (dur) => {
    try {
      await fetch(`${API_BASE}/api/study/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_minutes: dur }),
      });
    } catch (e) {}
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setTotalSeconds(isBreak ? BREAK_MINUTES * 60 : POMODORO_MINUTES * 60);
  };

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
        <Text style={styles.subtitle}>{isBreak ? 'Take a break' : 'Time to focus'}</Text>
      </View>

      <View style={[styles.timerRing, isBreak && styles.timerRingBreak]}>
        <Text style={styles.timerText}>{display}</Text>
      </View>

      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={start}>
            <Text style={styles.primaryBtnText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryBtn} onPress={pause}>
            <Text style={styles.secondaryBtnText}>Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {isBreak ? 'Short break — stretch, hydrate, then get back to it.' : '25 min focus • 5 min break'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: { marginBottom: theme.spacing.xl },
  title: { ...theme.typography.title, color: theme.colors.text, textAlign: 'center' },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
  timerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  timerRingBreak: { borderColor: theme.colors.accent },
  timerText: { fontSize: 48, fontWeight: '700', color: theme.colors.text, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: 16, marginBottom: theme.spacing.lg },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: theme.radius.full,
  },
  primaryBtnText: { ...theme.typography.subtitle, color: '#fff' },
  secondaryBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: theme.radius.full,
  },
  secondaryBtnText: { ...theme.typography.subtitle, color: '#fff' },
  resetBtn: { paddingVertical: 16, paddingHorizontal: 24 },
  resetText: { ...theme.typography.body, color: theme.colors.muted },
  hint: { ...theme.typography.caption, textAlign: 'center', maxWidth: 260 },
});
