import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useUser } from "../App";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const user = useUser();
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [form, setForm] = useState({ title: "", day_of_week: "1", start_time: "09:00", end_time: "10:00", location: "", color: "#6c6cff" });
  const fileRef = useRef();

  const load = () => { if (user) api.getSchedules({ user_id: user.id }).then(setSchedules).catch(console.error); };
  useEffect(load, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createSchedule({ user_id: user.id, ...form, day_of_week: Number(form.day_of_week) });
    setForm({ title: "", day_of_week: "1", start_time: "09:00", end_time: "10:00", location: "", color: "#6c6cff" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => { await api.deleteSchedule(id); load(); };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const result = await api.importICS(user.id, text);
      setImportResult(result);
      load();
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const grouped = {};
  for (const s of schedules) { if (!grouped[s.day_of_week]) grouped[s.day_of_week] = []; grouped[s.day_of_week].push(s); }

  return (
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">Schedule</span>
          <span className="page-topbar-sub">{schedules.length} class{schedules.length !== 1 ? "es" : ""}</span>
        </div>
        <div className="page-topbar-right">
          <label className="btn" style={{ cursor: "pointer" }}>
            {importing ? "Importing..." : "Import .ics"}
            <input ref={fileRef} type="file" accept=".ics,.ical" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "+ Add class"}</button>
        </div>
      </div>

      {importResult && !importResult.error && (
        <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--border)", background: "var(--success-bg)" }}>
          <span style={{ color: "var(--success)", fontSize: 14, fontWeight: 500 }}>
            Imported {importResult.total} events — {importResult.classes.length} classes added to schedule, {importResult.tasks.length} assignments/exams added as tasks
          </span>
          {importResult.tasks.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              Tasks created: {importResult.tasks.map(t => `${t.title} (${t.priority}${t.due ? `, due ${t.due}` : ""})`).join(" · ")}
            </div>
          )}
        </div>
      )}
      {importResult?.error && (
        <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--border)", background: "var(--danger-bg)", color: "var(--danger)", fontSize: 13 }}>
          Import failed: {importResult.error}
        </div>
      )}

      {showForm && (
        <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--border)" }}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Class name</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="CS 301 - AI Fundamentals" />
              </div>
              <div className="form-group"><label>Day</label>
                <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Start</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></div>
              <div className="form-group"><label>End</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room 204" /></div>
              <div className="form-group" style={{ maxWidth: 60 }}><label>Color</label><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ padding: 2, height: 32 }} /></div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}><button type="submit" className="btn btn-primary">Add</button></div>
            </div>
          </form>
        </div>
      )}

      <div className="page-content">
        {schedules.length === 0 ? (
          <div className="empty">No classes yet. Import a calendar or add classes manually.</div>
        ) : (
          <div className="dash-grid" style={{ gridTemplateColumns: "1fr" }}>
            {DAYS.map((dayName, dayIndex) =>
              grouped[dayIndex] ? (
                <div key={dayIndex} className="card">
                  <div className="card-header">
                    <span className="card-title">{dayName}</span>
                    <span className="card-subtitle">{grouped[dayIndex].length}</span>
                  </div>
                  {grouped[dayIndex].map(s => (
                    <div key={s.id} className="schedule-item">
                      <div className="color-dot" style={{ background: s.color || "var(--accent)" }} />
                      <div className="schedule-time">{s.start_time} – {s.end_time}</div>
                      <div className="schedule-info">
                        <div className="schedule-title">{s.title}</div>
                        {s.location && <div className="schedule-location">{s.location}</div>}
                      </div>
                      <button className="btn btn-danger btn-sm" style={{ opacity: 0 }} onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0} onClick={() => handleDelete(s.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </>
  );
}
