import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

export default function Tasks() {
  const user = useUser();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
    await api.createTask({ user_id: user.id, title: quickTitle.trim() });
    setQuickTitle("");
    loadTasks();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createTask({
      user_id: user.id,
      ...form,
      estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
    });
    setForm({ title: "", description: "", due_date: "", estimated_minutes: "", priority: "medium" });
    setShowForm(false);
    loadTasks();
  };

  const handleStatusChange = async (id, status) => {
    await api.updateTask(id, { status });
    loadTasks();
    if (expandedTask?.id === id) setExpandedTask(await api.getTask(id));
  };

  const handleDelete = async (id) => {
    await api.deleteTask(id);
    if (expandedTask?.id === id) setExpandedTask(null);
    loadTasks();
  };

  const handleDecompose = async (id) => {
    await api.decompose(id);
    setExpandedTask(await api.getTask(id));
    loadTasks();
  };

  const toggleExpand = async (id) => {
    if (expandedTask?.id === id) {
      setExpandedTask(null);
    } else {
      setExpandedTask(await api.getTask(id));
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="page-header">
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginTop: 8 }}>
          {showForm ? "Cancel" : "Detailed add"}
        </button>
      </div>

      <form onSubmit={handleQuickAdd} className="quick-add">
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task..."
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="What needs to be done?" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add details..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Due date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Minutes</label>
                <input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} placeholder="120" />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty">No tasks yet</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {tasks.map((task) => (
            <div key={task.id}>
              <div className="task-item">
                <div className="task-info" onClick={() => toggleExpand(task.id)} style={{ cursor: "pointer" }}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span className={`badge badge-${task.status}`}>{task.status.replace("_", " ")}</span>
                    {task.due_date && <span>{task.due_date}</span>}
                    {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
                  </div>
                </div>
                <div className="task-actions">
                  {task.status === "pending" && (
                    <button className="btn btn-sm" onClick={() => handleStatusChange(task.id, "in_progress")}>Start</button>
                  )}
                  {task.status === "in_progress" && (
                    <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(task.id, "completed")}>Done</button>
                  )}
                  <button className="btn btn-sm" onClick={() => handleDecompose(task.id)} title="Break down with AI">Break down</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>Remove</button>
                </div>
              </div>

              {expandedTask?.id === task.id && expandedTask.subtasks?.length > 0 && (
                <div className="subtask-list">
                  {expandedTask.subtasks.map((st) => (
                    <div key={st.id} className="subtask-item">
                      <span className={`badge badge-${st.status}`}>{st.status}</span>
                      <span>{st.title}</span>
                      {st.estimated_minutes && <span style={{ color: "var(--text-muted)" }}>({st.estimated_minutes}m)</span>}
                      {st.status === "pending" && (
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(st.id, "completed")} style={{ marginLeft: "auto" }}>Done</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
