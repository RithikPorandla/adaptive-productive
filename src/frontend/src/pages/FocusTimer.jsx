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
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && session) {
      handleComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStart = async () => {
    const s = await api.startFocus({
      user_id: user.id,
      task_id: selectedTask || null,
      duration_minutes: duration,
    });
    setSession(s);
    setTimeLeft(duration * 60);
    setRunning(true);
  };

  const handleComplete = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    if (session) {
      await api.completeFocus(session.id);
      setSession(null);
      api.getFocusSessions(user.id).then(setHistory);
    }
  };

  const handleCancel = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    if (session) {
      await api.cancelFocus(session.id);
      setSession(null);
      api.getFocusSessions(user.id).then(setHistory);
    }
    setTimeLeft(duration * 60);
  };

  const progress = session ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;

  return (
    <div>
      <h1 className="page-title">Focus Timer</h1>
      <p className="page-subtitle">Pomodoro-style focus sessions to boost productivity</p>

      <div className="card timer-display">
        <div style={{
          width: 200, height: 200, borderRadius: "50%", margin: "0 auto 24px",
          background: `conic-gradient(var(--primary) ${progress * 3.6}deg, var(--accent) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 170, height: 170, borderRadius: "50%", background: "var(--surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div className="timer-time">{formatTime(timeLeft)}</div>
          </div>
        </div>
        <div className="timer-label">
          {session ? "Focus session in progress..." : "Ready to focus?"}
        </div>

        {!session && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <div className="form-group" style={{ margin: 0, width: 120 }}>
              <label>Minutes</label>
              <select value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setTimeLeft(Number(e.target.value) * 60); }}>
                <option value={15}>15 min</option>
                <option value={25}>25 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            {tasks.length > 0 && (
              <div className="form-group" style={{ margin: 0, width: 200 }}>
                <label>Task (optional)</label>
                <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                  <option value="">No task</option>
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="timer-controls">
          {!session ? (
            <button className="btn btn-primary btn-lg" onClick={handleStart}>Start Focus</button>
          ) : (
            <>
              <button className="btn btn-success btn-lg" onClick={handleComplete}>Complete</button>
              <button className="btn btn-danger btn-lg" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Sessions</span>
          </div>
          {history.slice(0, 10).map((h) => (
            <div key={h.id} className="task-item">
              <div className="task-info">
                <div className="task-title">
                  {h.task_title || "Free focus"} — {h.duration_minutes}min
                </div>
                <div className="task-meta">
                  <span className={`badge badge-${h.status}`}>{h.status}</span>
                  <span>{new Date(h.started_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
