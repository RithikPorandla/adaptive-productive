import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { theme } from '../theme';
import { API_BASE } from '../constants';

export function TodayScreen() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addClassModal, setAddClassModal] = useState(false);
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassStart, setNewClassStart] = useState('09:00');
  const [newClassEnd, setNewClassEnd] = useState('10:00');
  const [newClassDay, setNewClassDay] = useState(String(new Date().getDay()));

  const fetchPlan = async () => {
    try {
      const date = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${API_BASE}/api/plan/today?date=${date}`);
      const data = await res.json();
      setPlan(data);
    } catch (e) {
      setPlan({ schedule: [], tasks: [], completedTasks: [], date: new Date().toISOString().slice(0, 10) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPlan(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchPlan(); };

  const completeTask = async (id) => {
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
      fetchPlan();
    } catch (e) {}
  };

  const addClass = async () => {
    if (!newClassTitle.trim()) return;
    try {
      await fetch(`${API_BASE}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newClassTitle.trim(),
          day_of_week: parseInt(newClassDay, 10),
          start_time: newClassStart,
          end_time: newClassEnd,
        }),
      });
      setNewClassTitle('');
      setAddClassModal(false);
      fetchPlan();
    } catch (e) {}
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = plan?.date ? new Date(plan.date) : new Date();
  const dayName = dayNames[today.getDay()];
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Today's Plan</Text>
        <Text style={styles.date}>{dayName}, {monthDay}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <TouchableOpacity style={styles.addClassBtn} onPress={() => setAddClassModal(true)}>
            <Text style={styles.addClassText}>+ Add class</Text>
          </TouchableOpacity>
        </View>
      {plan?.schedule?.length > 0 ? (
          <>
          {plan.schedule.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={[styles.scheduleDot, { backgroundColor: item.color || theme.colors.primary }]} />
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <Text style={styles.scheduleTime}>{item.start_time} – {item.end_time}</Text>
              </View>
            </View>
          ))}
          </>
          ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes today. Tap "+ Add class" to add your schedule.</Text>
          </View>
          )}
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        {plan?.tasks?.length === 0 && plan?.completedTasks?.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tasks for today. Add one in the Tasks tab!</Text>
          </View>
        ) : (
          <>
            {plan?.tasks?.map((task) => (
              <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => completeTask(task.id)} activeOpacity={0.7}>
                <View style={styles.taskRow}>
                  <View style={styles.checkbox} />
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.estimated_minutes && (
                      <Text style={styles.taskMeta}>~{task.estimated_minutes} min</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {plan?.completedTasks?.length > 0 && (
              <>
                <Text style={styles.doneLabel}>Done</Text>
                {plan.completedTasks.map((task) => (
                  <View key={task.id} style={[styles.taskCard, styles.completedCard]}>
                    <View style={styles.taskRow}>
                      <View style={[styles.checkbox, styles.checkboxDone]} />
                      <Text style={styles.taskTitleDone}>{task.title}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </View>

      <Modal visible={addClassModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add class</Text>
            <TextInput style={styles.input} placeholder="Class name" placeholderTextColor={theme.colors.muted} value={newClassTitle} onChangeText={setNewClassTitle} />
            <TextInput style={styles.input} placeholder="Day (0-6, Sun-Sat)" placeholderTextColor={theme.colors.muted} value={newClassDay} onChangeText={setNewClassDay} />
            <TextInput style={styles.input} placeholder="Start (HH:MM)" placeholderTextColor={theme.colors.muted} value={newClassStart} onChangeText={setNewClassStart} />
            <TextInput style={styles.input} placeholder="End (HH:MM)" placeholderTextColor={theme.colors.muted} value={newClassEnd} onChangeText={setNewClassEnd} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddClassModal(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addClass}><Text style={styles.saveText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 100 },
  loadingText: { ...theme.typography.body, color: theme.colors.muted, textAlign: 'center', marginTop: 48 },
  header: { marginBottom: theme.spacing.xl },
  greeting: { ...theme.typography.title, color: theme.colors.text, marginBottom: 4 },
  date: { ...theme.typography.caption, color: theme.colors.textSecondary },
  section: { marginBottom: theme.spacing.xl },
  sectionTitle: { ...theme.typography.subtitle, color: theme.colors.text, marginBottom: theme.spacing.md },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleDot: { width: 12, height: 12, borderRadius: 6, marginRight: theme.spacing.md },
  scheduleContent: { flex: 1 },
  scheduleTitle: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text },
  scheduleTime: { ...theme.typography.caption, marginTop: 2 },
  taskCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: { opacity: 0.7 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  checkboxDone: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  taskContent: { flex: 1 },
  taskTitle: { ...theme.typography.body, fontWeight: '500', color: theme.colors.text },
  taskTitleDone: { ...theme.typography.body, color: theme.colors.muted, textDecorationLine: 'line-through' },
  taskMeta: { ...theme.typography.small, color: theme.colors.muted, marginTop: 2 },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  emptyText: { ...theme.typography.body, color: theme.colors.muted },
  doneLabel: { ...theme.typography.small, color: theme.colors.muted, marginTop: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  addClassBtn: { padding: 8 },
  addClassText: { ...theme.typography.small, fontWeight: '600', color: theme.colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg },
  modalTitle: { ...theme.typography.subtitle, color: theme.colors.text, marginBottom: theme.spacing.md },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 12, ...theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: theme.spacing.md },
  cancelBtn: { padding: 12 },
  cancelText: { ...theme.typography.body, color: theme.colors.muted },
  saveBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.sm },
  saveText: { ...theme.typography.body, fontWeight: '600', color: '#fff' },
});
