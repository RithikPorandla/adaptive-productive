import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { theme } from '../theme';
import { API_BASE } from '../constants';

export function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const [aiDecompose, setAiDecompose] = useState('');
  const [aiSteps, setAiSteps] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          due_date: newDueDate || null,
          estimated_minutes: newMinutes ? parseInt(newMinutes, 10) : null,
        }),
      });
      setNewTitle('');
      setNewDueDate('');
      setNewMinutes('');
      setModalVisible(false);
      fetchTasks();
    } catch (e) {
      Alert.alert('Error', 'Could not add task');
    }
  };

  const decomposeWithAI = async () => {
    if (!aiDecompose.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/decompose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment: aiDecompose.trim() }),
      });
      const data = await res.json();
      setAiSteps(data.steps);
    } catch (e) {
      setAiSteps([{ title: 'Research', minutes: 30 }, { title: 'Draft', minutes: 60 }, { title: 'Review', minutes: 20 }]);
    }
  };

  const addFromAI = async () => {
    const due = newDueDate || new Date().toISOString().slice(0, 10);
    for (const step of aiSteps || []) {
      try {
        await fetch(`${API_BASE}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: step.title,
            due_date: due,
            estimated_minutes: step.minutes,
          }),
        });
      } catch (e) {}
    }
    setAiDecompose('');
    setAiSteps(null);
    fetchTasks();
  };

  const toggleComplete = async (task) => {
    try {
      await fetch(`${API_BASE}/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      fetchTasks();
    } catch (e) {}
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    } catch (e) {}
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tasks</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI task breakdown</Text>
          <TextInput
            style={styles.aiInput}
            placeholder="e.g. Research paper due May 1"
            placeholderTextColor={theme.colors.muted}
            value={aiDecompose}
            onChangeText={setAiDecompose}
          />
          <TouchableOpacity style={styles.aiBtn} onPress={decomposeWithAI}>
            <Text style={styles.aiBtnText}>Break into steps</Text>
          </TouchableOpacity>
          {aiSteps && (
            <View style={styles.aiSteps}>
              {aiSteps.map((s, i) => (
                <Text key={i} style={styles.aiStepText}>• {s.title} ({s.minutes} min)</Text>
              ))}
              <TouchableOpacity style={styles.addFromAiBtn} onPress={addFromAI}>
                <Text style={styles.addFromAiText}>Add all to tasks</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.taskList}>
          {loading ? (
            <Text style={styles.loading}>Loading...</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.empty}>No tasks yet. Add one above!</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardDone]}>
                <TouchableOpacity style={styles.taskRow} onPress={() => toggleComplete(task)}>
                  <View style={[styles.checkbox, task.completed && styles.checkboxDone]} />
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
                    <View style={styles.taskMeta}>
                      {task.due_date && <Text style={styles.metaText}>{task.due_date}</Text>}
                      {task.estimated_minutes && <Text style={styles.metaText}>~{task.estimated_minutes} min</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(task.id)}>
                  <Text style={styles.deleteText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task title"
              placeholderTextColor={theme.colors.muted}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Due date (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.muted}
              value={newDueDate}
              onChangeText={setNewDueDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Est. minutes"
              placeholderTextColor={theme.colors.muted}
              value={newMinutes}
              onChangeText={setNewMinutes}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addTask}>
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  title: { ...theme.typography.title, color: theme.colors.text },
  addBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.full },
  addBtnText: { ...theme.typography.body, fontWeight: '600', color: '#fff' },
  aiSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { ...theme.typography.subtitle, color: theme.colors.text, marginBottom: theme.spacing.sm },
  aiInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 12,
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  aiBtn: { backgroundColor: theme.colors.accent, padding: 12, borderRadius: theme.radius.sm, alignSelf: 'flex-start' },
  aiBtnText: { ...theme.typography.body, fontWeight: '600', color: '#fff' },
  aiSteps: { marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border },
  aiStepText: { ...theme.typography.body, color: theme.colors.text, marginBottom: 4 },
  addFromAiBtn: { marginTop: 8, backgroundColor: theme.colors.primary, padding: 8, borderRadius: theme.radius.sm, alignSelf: 'flex-start' },
  addFromAiText: { ...theme.typography.small, fontWeight: '600', color: '#fff' },
  taskList: { marginTop: theme.spacing.md },
  loading: { ...theme.typography.body, color: theme.colors.muted },
  empty: { ...theme.typography.body, color: theme.colors.muted },
  taskCard: {
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
  taskCardDone: { opacity: 0.7 },
  taskRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
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
  taskTitleDone: { textDecorationLine: 'line-through', color: theme.colors.muted },
  taskMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { ...theme.typography.small, color: theme.colors.muted },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 24, color: theme.colors.muted, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg },
  modalTitle: { ...theme.typography.subtitle, color: theme.colors.text, marginBottom: theme.spacing.md },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 12,
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: theme.spacing.md },
  cancelBtn: { padding: 12 },
  cancelText: { ...theme.typography.body, color: theme.colors.muted },
  saveBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.sm },
  saveText: { ...theme.typography.body, fontWeight: '600', color: '#fff' },
});
