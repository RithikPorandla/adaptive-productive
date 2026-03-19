import React, { useState } from "react";
import { mockTasks } from "../store.js";

const priorityConfig = {
  critical: { color: "#fb7185", bg: "rgba(251,113,133,0.1)", label: "Critical" },
  high:     { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  label: "High" },
  medium:   { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",  label: "Medium" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.1)",  label: "Low" },
};

const typeIcon = {
  exam: "◈", assignment: "◻", report: "▤", writing: "▦", project: "◆", quiz: "◇"
};

function TaskRow({ task, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const p = priorityConfig[task.priority];
  const isUrgent = task.daysUntil <= 3;

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${expanded ? task.color + "30" : "var(--border)"}`,
      background: expanded ? `${task.color}06` : "transparent",
      transition: "all 0.2s ease",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", cursor: "pointer",
          transition: "background 0.15s"
        }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
        onMouseOut={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Complete button */}
        <button
          onClick={e => { e.stopPropagation(); onComplete(task.id); }}
          style={{
            width: 20, height: 20, borderRadius: "50%",
            border: `1.5px solid ${task.status === "completed" ? task.color : "var(--text-muted)"}`,
            background: task.status === "completed" ? task.color : "transparent",
            cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", color: "white", fontSize: 11
          }}
        >
          {task.status === "completed" && "✓"}
        </button>

        {/* Type icon */}
        <span style={{ color: task.color, fontSize: 14, flexShrink: 0 }}>
          {typeIcon[task.type] || "◻"}
        </span>

        {/* Title + course */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, color: task.status === "completed" ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: task.status === "completed" ? "line-through" : "none",
            fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {task.title}
          </div>
          <div style={{ fontSize: 12, color: task.color, marginTop: 2, opacity: 0.8 }}>
            {task.course}
          </div>
        </div>

        {/* Due */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 12,
            color: isUrgent ? p.color : "var(--text-secondary)",
            fontWeight: isUrgent ? 600 : 400,
          }}>
            {task.daysUntil === 0 ? "Today" : task.daysUntil === 1 ? "Tomorrow" : `${task.daysUntil}d`}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: p.bg, borderRadius: 4,
            padding: "2px 6px", marginTop: 3
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, display: "inline-block" }} />
            <span style={{ fontSize: 10, color: p.color, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {p.label}
            </span>
          </div>
        </div>

        <span style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0 }}>
          {expanded ? "▴" : "▾"}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 16px 16px 48px", borderTop: `1px solid ${task.color}15` }}>
          <div style={{ display: "flex", gap: 24, marginBottom: task.adaNote ? 12 : 0, marginTop: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Est. time</div>
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{task.estimatedHours}h</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Due date</div>
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{task.dueDate}</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Type</div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", textTransform: "capitalize" }}>{task.type}</div>
            </div>
          </div>

          {task.adaNote && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              background: "var(--ada-cyan-dim)",
              border: "1px solid rgba(56,189,248,0.15)",
              borderRadius: 8, padding: "10px 14px",
            }}>
              <span style={{ color: "var(--ada-cyan)", fontSize: 14, flexShrink: 0 }}>✦</span>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ada-cyan)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  Ada's note
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5 }}>
                  {task.adaNote}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaskList() {
  const [tasks, setTasks] = useState(mockTasks);
  const [filter, setFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "urgent", label: "Urgent" },
    { id: "exam", label: "Exams" },
    { id: "assignment", label: "Assignments" },
  ];

  const filtered = tasks.filter(t => {
    if (filter === "all") return true;
    if (filter === "urgent") return t.daysUntil <= 5;
    return t.type === filter;
  }).sort((a, b) => a.daysUntil - b.daysUntil);

  const complete = (id) => setTasks(prev =>
    prev.map(t => t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t)
  );

  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Tasks</h3>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {completedCount}/{tasks.length} complete
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: 80, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${(completedCount / tasks.length) * 100}%`,
              background: "linear-gradient(90deg, var(--ada-cyan), var(--accent-violet))",
              transition: "width 0.4s ease"
            }} />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6 }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12,
              border: `1px solid ${filter === f.id ? "var(--ada-cyan)" : "var(--border)"}`,
              background: filter === f.id ? "var(--ada-cyan-dim)" : "transparent",
              color: filter === f.id ? "var(--ada-cyan)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-ui)"
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.map(task => (
          <TaskRow key={task.id} task={task} onComplete={complete} />
        ))}
      </div>
    </div>
  );
}
