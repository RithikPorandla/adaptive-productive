import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';
import { API_BASE } from '../constants';

export function ProgressScreen() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const from = weekStart.toISOString().slice(0, 10);

        const [statsRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE}/api/study/stats?from=${from}&to=${today}`),
          fetch(`${API_BASE}/api/tasks`),
        ]);
        const statsData = await statsRes.json();
        const tasksData = await tasksRes.json();
        setStats(statsData);
        setTasks(tasksData);
      } catch (e) {
        setStats({ totalMinutes: 0, totalSessions: 0, sessions: [] });
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hours = stats?.totalMinutes ? (stats.totalMinutes / 60).toFixed(1) : '0';

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>This week</Text>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{pct}%</Text>
          <Text style={styles.cardLabel}>Tasks completed</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{hours}h</Text>
          <Text style={styles.cardLabel}>Study time</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats?.totalSessions || 0}</Text>
          <Text style={styles.cardLabel}>Focus sessions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent focus sessions</Text>
        {stats?.sessions?.length === 0 ? (
          <Text style={styles.empty}>No sessions yet. Use the Focus timer!</Text>
        ) : (
          stats?.sessions?.slice(0, 10).map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <Text style={styles.sessionDuration}>{s.duration_minutes} min</Text>
              <Text style={styles.sessionDate}>
                {new Date(s.completed_at).toLocaleDateString()} {new Date(s.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 100 },
  loading: { ...theme.typography.body, color: theme.colors.muted, textAlign: 'center', marginTop: 48 },
  header: { marginBottom: theme.spacing.xl },
  title: { ...theme.typography.title, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  card: {
    flex: 1,
    minWidth: 100,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardValue: { ...theme.typography.title, color: theme.colors.primary, marginBottom: 4 },
  cardLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  section: { marginTop: theme.spacing.md },
  sectionTitle: { ...theme.typography.subtitle, color: theme.colors.text, marginBottom: theme.spacing.md },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  sessionDuration: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },
  sessionDate: { ...theme.typography.caption, color: theme.colors.muted },
  empty: { ...theme.typography.body, color: theme.colors.muted },
});
