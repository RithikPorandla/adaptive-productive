import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useUser } from "../App";

export default function FocusTimer() {
  const user = useUser();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.getFocusSessions(user.id).then(setHistory).catch(console.error);
      api.getTasks({ user_id: user.id, status: "in_progress" }).then(setTasks).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && session) { handleComplete(); }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft]);

  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleStart = async () => {
    const s = await api.startFocus({ user_id: user.id, task_id: selectedTask || null, duration_minutes: duration });
    setSession(s); setTimeLeft(duration * 60); setRunning(true);
  };
  const handleComplete = async () => {
    clearInterval(intervalRef.current); setRunning(false);
    if (session) { await api.completeFocus(session.id); setSession(null); api.getFocusSessions(user.id).then(setHistory); }
  };
  const handleCancel = async () => {
    clearInterval(intervalRef.current); setRunning(false);
    if (session) { await api.cancelFocus(session.id); setSession(null); api.getFocusSessions(user.id).then(setHistory); }
    setTimeLeft(duration * 60);
  };

  const progress = session ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;

  return (
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">Focus Timer</span>
          <span className="page-topbar-sub">{session ? "Session active" : "Ready"}</span>
        </div>
      </div>
      <div className="page-content">
        <div className="dash-grid">
          {/* Left: Timer */}
          <div className="card timer-display">
            <div className="timer-ring-outer" style={{ background: `conic-gradient(var(--accent) ${progress * 3.6}deg, var(--border) 0deg)` }}>
              <div className="timer-ring-inner">
                <div className="timer-time">{fmt(timeLeft)}</div>
              </div>
            </div>

            {!session && (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
                <div className="form-group" style={{ margin: 0, width: 100 }}>
                  <label>Duration</label>
                  <select value={duration} onChange={e => { setDuration(Number(e.target.value)); setTimeLeft(Number(e.target.value) * 60); }}>
                    <option value={15}>15 min</option>
                    <option value={25}>25 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
                {tasks.length > 0 && (
                  <div className="form-group" style={{ margin: 0, width: 180 }}>
                    <label>Task</label>
                    <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}>
                      <option value="">No task</option>
                      {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="timer-controls">
              {!session ? (
                <button className="btn btn-primary" onClick={handleStart}>Start session</button>
              ) : (
                <>
                  <button className="btn btn-success" onClick={handleComplete}>Complete</button>
                  <button className="btn btn-danger" onClick={handleCancel}>Cancel</button>
                </>
              )}
            </div>
          </div>

          {/* Right: History */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">History</span>
              <span className="card-subtitle">{history.length} sessions</span>
            </div>
            {history.length > 0 ? history.slice(0, 10).map(h => (
              <div key={h.id} className="list-item">
                <span className={`badge badge-${h.status}`} style={{ fontSize: 10 }}>{h.status}</span>
                <span style={{ flex: 1 }}>{h.task_title || "Free focus"}</span>
                <span className="list-item-secondary">{h.duration_minutes}m</span>
                <span className="list-item-secondary">{new Date(h.started_at).toLocaleDateString()}</span>
              </div>
            )) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No sessions yet</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
