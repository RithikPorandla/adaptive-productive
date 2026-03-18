import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

const PRIORITY_CONFIG = {
  high: { color: "var(--danger)", label: "Urgent" },
  medium: { color: "var(--warning)", label: "Important" },
  low: { color: "var(--success)", label: "Low priority" },
};

export default function Tasks() {
  const user = useUser();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [syllabusResult, setSyllabusResult] = useState(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [form, setForm] = useState({ title: "", description: "", due_date: "", estimated_minutes: "", priority: "medium" });
  const [expandedTask, setExpandedTask] = useState(null);

  const loadTasks = () => {
    if (user) api.getTasks({ user_id: user.id, parent_task_id: "null" }).then(setTasks).catch(console.error);
  };
  useEffect(loadTasks, [user]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      const parsed = await api.parseTask(quickTitle.trim());
      await api.createTask({ user_id: user.id, title: parsed.title || quickTitle.trim(), priority: parsed.priority || "medium", due_date: parsed.due_date || null, estimated_minutes: parsed.estimated_minutes || null });
    } catch { await api.createTask({ user_id: user.id, title: quickTitle.trim() }); }
    setQuickTitle("");
    loadTasks();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createTask({ user_id: user.id, ...form, estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null });
    setForm({ title: "", description: "", due_date: "", estimated_minutes: "", priority: "medium" });
    setShowForm(false);
    loadTasks();
  };

  const handleSyllabus = async (e) => {
    e.preventDefault();
    if (!syllabusText.trim()) return;
    setSyllabusLoading(true);
    try {
      const result = await api.importSyllabus(user.id, syllabusText);
      setSyllabusResult(result);
      setSyllabusText("");
      loadTasks();
    } catch (err) {
      setSyllabusResult({ error: err.message });
    } finally {
      setSyllabusLoading(false);
    }
  };

  const handleStatus = async (id, status) => { await api.updateTask(id, { status }); loadTasks(); if (expandedTask?.id === id) setExpandedTask(await api.getTask(id)); };
  const handleDelete = async (id) => { await api.deleteTask(id); if (expandedTask?.id === id) setExpandedTask(null); loadTasks(); };
  const handleDecompose = async (id) => { await api.decompose(id); setExpandedTask(await api.getTask(id)); loadTasks(); };
  const toggleExpand = async (id) => { setExpandedTask(expandedTask?.id === id ? null : await api.getTask(id)); };

  const active = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const inProgress = active.filter(t => t.status === "in_progress");
  const pending = active.filter(t => t.status === "pending");
  const done = tasks.filter(t => t.status === "completed" || t.status === "cancelled");

  const highP = pending.filter(t => t.priority === "high");
  const medP = pending.filter(t => t.priority === "medium");
  const lowP = pending.filter(t => t.priority === "low");

  const renderCard = (task) => (
    <div key={task.id} className="task-card" onClick={() => toggleExpand(task.id)}>
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-meta">
        <span className={`badge badge-${task.status}`}>{task.status.replace("_", " ")}</span>
        {task.due_date && <span className="task-card-due">{task.due_date}</span>}
        {task.estimated_minutes && <span className="task-card-due">{task.estimated_minutes}m</span>}
      </div>
      {expandedTask?.id === task.id && expandedTask.subtasks?.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
          {expandedTask.subtasks.map(st => (
            <div key={st.id} className="subtask-item">
              <span className={`badge badge-${st.status}`}>{st.status}</span>
              <span>{st.title}</span>
              {st.estimated_minutes && <span style={{ color: "var(--text-muted)" }}>({st.estimated_minutes}m)</span>}
              {st.status === "pending" && <button className="btn btn-success btn-sm" onClick={e => { e.stopPropagation(); handleStatus(st.id, "completed"); }} style={{ marginLeft: "auto" }}>Done</button>}
            </div>
          ))}
        </div>
      )}
      <div className="task-card-actions" onClick={e => e.stopPropagation()}>
        {task.status === "pending" && <button className="btn btn-sm" onClick={() => handleStatus(task.id, "in_progress")}>Start</button>}
        {task.status === "in_progress" && <button className="btn btn-success btn-sm" onClick={() => handleStatus(task.id, "completed")}>Done</button>}
        <button className="btn btn-sm" onClick={() => handleDecompose(task.id)}>Break down</button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>Remove</button>
      </div>
    </div>
  );

  const renderLane = (items, priority) => {
    if (items.length === 0) return null;
    const cfg = PRIORITY_CONFIG[priority];
    return (
      <div className="priority-lane" key={priority}>
        <div className="priority-lane-header">
          <div className="priority-lane-dot" style={{ background: cfg.color }} />
          <span className="priority-lane-title">{cfg.label}</span>
          <span className="priority-lane-count">{items.length}</span>
        </div>
        <div className="task-card-grid">{items.map(renderCard)}</div>
      </div>
    );
  };

  return (
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">Tasks</span>
          <span className="page-topbar-sub">{active.length} active · {done.length} done</span>
        </div>
        <div className="page-topbar-right">
          <button className="btn" onClick={() => { setShowSyllabus(!showSyllabus); setSyllabusResult(null); }}>{showSyllabus ? "Cancel" : "Import syllabus"}</button>
          <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Detailed"}</button>
        </div>
      </div>

      {showSyllabus && (
        <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Import Syllabus</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Paste your course syllabus below. Ada will extract all assignments, exams, and deadlines automatically.</div>
          <form onSubmit={handleSyllabus}>
            <textarea className="syllabus-textarea" value={syllabusText} onChange={e => setSyllabusText(e.target.value)} placeholder={"Paste your syllabus text here...\n\nExample:\nCS 401 - Machine Learning\nMidterm Exam: March 25, 2026\nFinal Project Proposal: April 2, 2026\nProblem Set 5: Due March 21\n..."} />
            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
              <button type="submit" className="btn btn-primary" disabled={syllabusLoading}>{syllabusLoading ? "Ada is reading..." : "Extract assignments"}</button>
              {syllabusResult && !syllabusResult.error && <span style={{ fontSize: 13, color: "var(--success)" }}>Created {syllabusResult.total} tasks from syllabus</span>}
              {syllabusResult?.error && <span style={{ fontSize: 13, color: "var(--danger)" }}>{syllabusResult.error}</span>}
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleQuickAdd} className="quick-add">
        <input value={quickTitle} onChange={e => setQuickTitle(e.target.value)} placeholder='Add a task — try "Write essay due Friday, 3 hours, high priority"' />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>
      <div className="ai-parsing-hint">AI auto-detects priority, due date, and time from your input</div>

      {showForm && (
        <div style={{ padding: "14px 32px", borderBottom: "1px solid var(--border)" }}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 3 }}><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="What needs to be done?" /></div>
              <div className="form-group"><label>Due</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
              <div className="form-group" style={{ maxWidth: 80 }}><label>Minutes</label><input type="number" value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} placeholder="120" /></div>
              <div className="form-group" style={{ maxWidth: 100 }}><label>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add details..." /></div>
            <button type="submit" className="btn btn-primary">Create task</button>
          </form>
        </div>
      )}

      <div className="page-content">
        {inProgress.length > 0 && (
          <div className="priority-lane">
            <div className="priority-lane-header">
              <div className="priority-lane-dot" style={{ background: "var(--accent)" }} />
              <span className="priority-lane-title">In progress</span>
              <span className="priority-lane-count">{inProgress.length}</span>
            </div>
            <div className="task-card-grid">{inProgress.map(renderCard)}</div>
          </div>
        )}

        {renderLane(highP, "high")}
        {renderLane(medP, "medium")}
        {renderLane(lowP, "low")}

        {done.length > 0 && (
          <div className="priority-lane" style={{ opacity: 0.5 }}>
            <div className="priority-lane-header">
              <div className="priority-lane-dot" style={{ background: "var(--text-muted)" }} />
              <span className="priority-lane-title">Completed</span>
              <span className="priority-lane-count">{done.length}</span>
            </div>
            <div className="task-card-grid">
              {done.map(t => (
                <div key={t.id} className="task-card">
                  <div className="task-card-title" style={{ textDecoration: "line-through" }}>{t.title}</div>
                  <div className="task-card-meta"><span className={`badge badge-${t.status}`}>{t.status}</span></div>
                  <div className="task-card-actions"><button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && <div className="empty">No tasks yet. Add one above.</div>}
      </div>
    </>
  );
}
