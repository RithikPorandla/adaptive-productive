import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import { useUser } from "../App";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const HOUR_PX = 48;

function timeToMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToTime(m) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
function fmtHour(h) { const ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12} ${ap}`; }

export default function Schedule() {
  const user = useUser();
  const [schedules, setSchedules] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [popPos, setPopPos] = useState({ top: 100, left: 400 });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [form, setForm] = useState({ title: "", day_of_week: "1", start_time: "09:00", end_time: "10:00", location: "", color: "#6c6cff" });
  const fileRef = useRef();

  const load = () => { if (user) api.getSchedules({ user_id: user.id }).then(setSchedules).catch(console.error); };
  useEffect(load, [user]);

  const resetForm = () => setForm({ title: "", day_of_week: "1", start_time: "09:00", end_time: "10:00", location: "", color: "#6c6cff" });

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.updateSchedule(editing.id, { ...form, day_of_week: Number(form.day_of_week) });
      setEditing(null);
    } else {
      await api.createSchedule({ user_id: user.id, ...form, day_of_week: Number(form.day_of_week) });
      setShowAdd(false);
    }
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteSchedule(id);
    setEditing(null);
    load();
  };

  const openEdit = (ev, s) => {
    ev.stopPropagation();
    const rect = ev.currentTarget.getBoundingClientRect();
    setPopPos({ top: Math.min(rect.top, window.innerHeight - 360), left: Math.min(rect.right + 8, window.innerWidth - 320) });
    setForm({ title: s.title, day_of_week: String(s.day_of_week), start_time: s.start_time, end_time: s.end_time, location: s.location || "", color: s.color || "#6c6cff" });
    setEditing(s);
    setShowAdd(false);
  };

  const handleCellClick = (dayIndex, hour) => {
    setForm({ title: "", day_of_week: String(dayIndex), start_time: minToTime(hour * 60), end_time: minToTime((hour + 1) * 60), location: "", color: "#6c6cff" });
    setShowAdd(true);
    setEditing(null);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.importICS(user.id, await file.text());
      setImportResult(result);
      load();
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const todayDow = new Date().getDay();

  const byDay = {};
  for (const s of schedules) {
    if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
    byDay[s.day_of_week].push(s);
  }

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
          <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); setEditing(null); resetForm(); }}>
            {showAdd ? "Cancel" : "+ Add class"}
          </button>
        </div>
      </div>

      {importResult && !importResult.error && (
        <div style={{ padding: "10px 32px", borderBottom: "1px solid var(--border)", background: "var(--success-bg)", fontSize: 13, color: "var(--success)" }}>
          Imported {importResult.total} events — {importResult.classes.length} classes, {importResult.tasks.length} tasks
        </div>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div style={{ padding: "14px 32px", borderBottom: "1px solid var(--border)" }}>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}><label>Class</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="CS 301 - AI Fundamentals" /></div>
              <div className="form-group"><label>Day</label>
                <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
                  {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select></div>
              <div className="form-group"><label>Start</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></div>
              <div className="form-group"><label>End</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></div>
              <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room 204" /></div>
              <div className="form-group" style={{ maxWidth: 50 }}><label>Color</label><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ padding: 2, height: 34 }} /></div>
              <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}><button type="submit" className="btn btn-primary">Add</button></div>
            </div>
          </form>
        </div>
      )}

      {/* Calendar grid */}
      <div className="page-content">
        <div className="cal-wrap">
          <div className="cal-grid">
            {/* Header row */}
            <div className="cal-corner" />
            {DAYS.map((d, i) => (
              <div key={i} className={`cal-header${i === todayDow ? " today" : ""}`}>{d}</div>
            ))}

            {/* Time column + day columns */}
            <div className="cal-time-col">
              {HOURS.map(h => <div key={h} className="cal-time-label">{fmtHour(h)}</div>)}
            </div>
            {DAYS.map((_, dayIdx) => (
              <div key={dayIdx} className="cal-day-col" style={{ height: HOURS.length * HOUR_PX }}>
                {HOURS.map(h => (
                  <div key={h} className="cal-hour-line" onClick={() => handleCellClick(dayIdx, h)} />
                ))}
                {(byDay[dayIdx] || []).map(s => {
                  const startMin = timeToMin(s.start_time);
                  const endMin = timeToMin(s.end_time);
                  const top = ((startMin - START_HOUR * 60) / 60) * HOUR_PX;
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 20);
                  const bgColor = s.color || "var(--accent)";
                  return (
                    <div
                      key={s.id}
                      className="cal-event"
                      style={{ top, height, background: bgColor + "22", borderLeftColor: bgColor, borderLeftWidth: 3, borderLeftStyle: "solid", color: "var(--text)" }}
                      onClick={(e) => openEdit(e, s)}
                    >
                      <div className="cal-event-title">{s.title}</div>
                      {height > 30 && <div className="cal-event-meta">{s.start_time}–{s.end_time}</div>}
                      {height > 46 && s.location && <div className="cal-event-meta">{s.location}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit popover */}
      {editing && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setEditing(null)} />
          <div className="cal-popover" style={{ top: popPos.top, left: popPos.left }}>
            <h3>Edit class</h3>
            <form onSubmit={handleSave}>
              <div className="form-group"><label>Class</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Day</label>
                  <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
                    {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select></div>
                <div className="form-group"><label>Start</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></div>
                <div className="form-group"><label>End</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div className="form-group" style={{ maxWidth: 50 }}><label>Color</label><input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ padding: 2, height: 34 }} /></div>
              </div>
              <div className="cal-popover-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(editing.id)}>Delete</button>
                <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
