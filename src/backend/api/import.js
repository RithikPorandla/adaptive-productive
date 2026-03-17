import { Router } from "express";
import { getDb } from "../db/index.js";
import { parseICS, getDayOfWeek } from "../services/ics-parser.js";

export const importRouter = Router();

const COLORS = ["#6c6cff", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#fb923c", "#38bdf8"];

/**
 * POST /api/import/ics
 * Body: { user_id, ics_text }
 * Parses ICS, uses Gemini to classify events, creates schedules + tasks.
 */
importRouter.post("/ics", async (req, res) => {
  try {
    const { user_id, ics_text } = req.body;
    if (!user_id || !ics_text) return res.status(400).json({ error: "user_id and ics_text required" });

    const events = parseICS(ics_text);
    if (events.length === 0) return res.status(400).json({ error: "No events found in ICS data" });

    const db = getDb();
    const results = { classes: [], tasks: [], total: events.length };

    let geminiClassification = null;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const summaries = events.map((e, i) => `${i}: "${e.summary}"${e.rrule ? " (recurring)" : ""}${e.categories ? ` [${e.categories}]` : ""}${e.description ? ` - ${e.description.slice(0, 80)}` : ""}`).join("\n");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Classify these calendar events as either "class" (recurring lectures/labs/seminars) or "task" (assignments/exams/deadlines/one-time events). For tasks, assign priority: "high" for exams/finals/midterms, "medium" for assignments/projects, "low" for optional/reviews. Return ONLY a JSON array of objects: {"index": N, "type": "class"|"task", "priority": "low"|"medium"|"high"}\n\nEvents:\n${summaries}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const raw = d.candidates[0].content.parts[0].text.trim().replace(/```json\n?/g, "").replace(/```/g, "").trim();
          geminiClassification = JSON.parse(raw);
        }
      } catch (e) { console.error("Gemini classify failed:", e.message); }
    }

    const classMap = {};
    if (geminiClassification) {
      for (const c of geminiClassification) classMap[c.index] = c;
    }

    const insertSchedule = db.prepare(
      `INSERT INTO schedules (user_id, title, day_of_week, start_time, end_time, location, color) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertTask = db.prepare(
      `INSERT INTO tasks (user_id, title, description, due_date, estimated_minutes, priority) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const importAll = db.transaction(() => {
      events.forEach((ev, i) => {
        const cls = classMap[i];
        const isClass = cls ? cls.type === "class" : !!ev.rrule;
        const priority = cls?.priority || "medium";

        if (isClass) {
          const days = getDayOfWeek(ev);
          const startTime = ev.dtstart?.time || "09:00";
          const endTime = ev.dtend?.time || "10:00";
          const color = COLORS[results.classes.length % COLORS.length];
          for (const dow of (days.length ? days : [1])) {
            const info = insertSchedule.run(user_id, ev.summary, dow, startTime, endTime, ev.location || null, color);
            results.classes.push({ id: info.lastInsertRowid, title: ev.summary, day: dow });
          }
        } else {
          const dueDate = ev.dtstart?.date || null;
          const desc = ev.description || null;
          let est = null;
          if (ev.dtstart?.time && ev.dtend?.time) {
            const [sh, sm] = ev.dtstart.time.split(":").map(Number);
            const [eh, em] = ev.dtend.time.split(":").map(Number);
            est = (eh * 60 + em) - (sh * 60 + sm);
            if (est <= 0) est = null;
          }
          const info = insertTask.run(user_id, ev.summary, desc, dueDate, est, priority);
          results.tasks.push({ id: info.lastInsertRowid, title: ev.summary, due: dueDate, priority });
        }
      });
    });
    importAll();

    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
