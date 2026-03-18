/**
 * AI service for task decomposition, smart parsing, and study tips.
 *
 * Uses Google Gemini when GEMINI_API_KEY is set; otherwise falls back to
 * rule-based heuristics so all features work without an API key during dev.
 */

function getApiKey() {
  return process.env.GEMINI_API_KEY || null;
}

async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  const parts = data.candidates[0].content.parts;
  const textParts = parts.filter(p => p.text);
  return textParts.map(p => p.text).join("").trim();
}

function extractJSON(raw) {
  return raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
}

/**
 * Parse natural-language task input into structured fields.
 */
export async function parseTaskInput(input) {
  if (getApiKey()) {
    try { return await parseWithGemini(input); } catch (e) { console.error("Gemini parse failed:", e.message); }
  }
  return parseWithHeuristic(input);
}

async function parseWithGemini(input) {
  const raw = await callGemini(
    `You parse student task descriptions into structured data. Return ONLY a JSON object with these fields:
- title (string — the clean task name without dates/priority/time metadata)
- priority ("low" | "medium" | "high")
- due_date (ISO date string YYYY-MM-DD, or null)
- estimated_minutes (number, or null)

Infer priority from urgency cues (urgent/important/asap = high, optional/whenever = low).
Infer due_date from relative dates. Today is ${new Date().toISOString().slice(0, 10)}.
Infer estimated_minutes from time mentions (e.g. "3 hours" = 180).

Input: "${input}"

Respond with ONLY the JSON object, no explanation.`
  );
  return JSON.parse(extractJSON(raw));
}

function parseWithHeuristic(input) {
  const lower = input.toLowerCase();
  let priority = "medium";
  if (lower.includes("urgent") || lower.includes("asap") || lower.includes("important") || lower.includes("high priority")) priority = "high";
  else if (lower.includes("low priority") || lower.includes("whenever") || lower.includes("optional")) priority = "low";

  let due_date = null;
  const today = new Date();
  if (lower.includes("tomorrow")) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    due_date = d.toISOString().slice(0, 10);
  } else if (lower.includes("next week")) {
    const d = new Date(today); d.setDate(d.getDate() + 7);
    due_date = d.toISOString().slice(0, 10);
  } else if (lower.includes("tonight") || lower.includes("today")) {
    due_date = today.toISOString().slice(0, 10);
  } else {
    const dateMatch = input.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) due_date = dateMatch[1];
    const monthMatch = input.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})/i);
    if (monthMatch) {
      const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const mKey = input.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)[0].toLowerCase().slice(0, 3);
      const d = new Date(today.getFullYear(), months[mKey], parseInt(monthMatch[1]));
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      due_date = d.toISOString().slice(0, 10);
    }
  }

  let estimated_minutes = null;
  const hourMatch = lower.match(/(\d+)\s*(?:hours?|hrs?)/);
  const minMatch = lower.match(/(\d+)\s*(?:min)/);
  if (hourMatch) estimated_minutes = parseInt(hourMatch[1]) * 60;
  if (minMatch) estimated_minutes = (estimated_minutes || 0) + parseInt(minMatch[1]);

  let title = input
    .replace(/\b(urgent|asap|important|high priority|low priority|optional|whenever)\b/gi, "")
    .replace(/\b(tomorrow|tonight|today|next week)\b/gi, "")
    .replace(/\b(?:about|around|approximately)?\s*\d+\s*(?:hours?|hrs?|min(?:ute)?s?)\b/gi, "")
    .replace(/\b(?:due|by|before)\b/gi, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/gi, "")
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) title = input.trim();

  return { title, priority, due_date, estimated_minutes };
}

/**
 * Generate a contextual study tip based on today's workload.
 */
export async function generateStudyTip(tasks, classes) {
  if (getApiKey()) {
    try {
      const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
      const highP = activeTasks.filter(t => t.priority === "high");
      const inProg = activeTasks.filter(t => t.status === "in_progress");
      const today = new Date().toISOString().slice(0, 10);
      const dueToday = activeTasks.filter(t => t.due_date && t.due_date.startsWith(today));
      const overdue = activeTasks.filter(t => t.due_date && t.due_date < today);

      const context = `Today's date: ${today}
Classes today: ${classes.map(c => `${c.title} (${c.start_time}-${c.end_time})`).join(", ") || "none"}
High priority tasks: ${highP.map(t => `"${t.title}"${t.due_date ? ` due ${t.due_date}` : ""}`).join(", ") || "none"}
In progress: ${inProg.map(t => `"${t.title}"`).join(", ") || "none"}
Due today: ${dueToday.map(t => `"${t.title}"`).join(", ") || "none"}
Overdue: ${overdue.map(t => `"${t.title}" was due ${t.due_date}`).join(", ") || "none"}
Total active tasks: ${activeTasks.length}`;

      return await callGemini(
        `You are Ada, a warm and supportive AI study coach built into a student productivity app. You're like a smart older sister who's been through college and genuinely cares.

Your personality:
- Warm but direct — you don't sugarcoat, but you're never harsh
- You use the student's actual task names and deadlines specifically
- You give ONE concrete action step they can do RIGHT NOW
- You acknowledge their effort and progress
- You keep it to 3-4 sentences max
- You occasionally use encouraging phrases naturally (not forced)
- If they're overdue on something, address it with empathy not guilt

Student's current situation:
${context}

Give your coaching tip. Don't prefix with "Ada:" or similar. Just speak naturally.`
      );
    } catch (e) { console.error("Gemini tip failed:", e.message); }
  }
  return generateTipHeuristic(tasks, classes);
}

function generateTipHeuristic(tasks, classes) {
  const highPriority = tasks.filter(t => t.priority === "high" && t.status !== "completed");
  const inProgress = tasks.filter(t => t.status === "in_progress");
  const pending = tasks.filter(t => t.status === "pending");

  if (highPriority.length > 0) {
    return `You have ${highPriority.length} high-priority task${highPriority.length > 1 ? "s" : ""} — start with "${highPriority[0].title}". Break it into smaller chunks and tackle the hardest part first while your energy is highest.`;
  }
  if (inProgress.length > 0 && pending.length > 2) {
    return `You're working on "${inProgress[0].title}" — great momentum! Try the Pomodoro technique: 25 minutes focused work, then a 5-minute break. You've got ${pending.length} more tasks waiting.`;
  }
  if (classes.length > 0) {
    return `You have ${classes.length} class${classes.length > 1 ? "es" : ""} today. Review your notes from the last session before each class — even 5 minutes of review boosts retention by 40%.`;
  }
  if (tasks.length === 0) {
    return "No tasks on your plate! This is a great time to plan ahead — review upcoming deadlines and get a head start on bigger assignments.";
  }
  return `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} to work through. Start with the quickest one to build momentum, then switch to deeper work.`;
}

/**
 * Suggest what to work on next.
 */
export function suggestNextTask(tasks) {
  const actionable = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled" && !t.parent_task_id);
  if (actionable.length === 0) return null;

  const scored = actionable.map(t => {
    let score = 0;
    if (t.priority === "high") score += 30;
    else if (t.priority === "medium") score += 15;
    if (t.status === "in_progress") score += 20;
    if (t.due_date) {
      const daysUntil = (new Date(t.due_date) - new Date()) / 86400000;
      if (daysUntil < 0) score += 50;
      else if (daysUntil < 1) score += 40;
      else if (daysUntil < 3) score += 25;
      else if (daysUntil < 7) score += 10;
    }
    return { ...t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  let reason;
  if (best.due_date && new Date(best.due_date) < new Date()) reason = "This is overdue";
  else if (best.due_date && (new Date(best.due_date) - new Date()) / 86400000 < 1) reason = "Due today";
  else if (best.priority === "high") reason = "Highest priority";
  else if (best.status === "in_progress") reason = "Already in progress";
  else reason = "Best to tackle next";

  return { task: best, reason };
}

/**
 * Extract assignments, exams, and deadlines from syllabus text.
 */
export async function extractSyllabus(syllabusText) {
  if (!getApiKey()) throw new Error("GEMINI_API_KEY required for syllabus extraction");

  const today = new Date().toISOString().slice(0, 10);
  const raw = await callGemini(
    `You are a syllabus parser. Extract ALL assignments, exams, deadlines, and due dates from this course syllabus. Return ONLY a JSON array of objects.

Each object must have:
- "title" (string): assignment/exam name (e.g., "Midterm Exam", "Problem Set 3", "Research Paper")
- "due_date" (string|null): ISO date YYYY-MM-DD. If only a week number or relative date is given, estimate based on a typical semester starting Jan 2026. If no date, use null.
- "priority" ("low"|"medium"|"high"): "high" for exams/midterms/finals, "medium" for major assignments/papers, "low" for readings/optional work
- "estimated_minutes" (number|null): estimated time to complete. Exams=120, papers=360, problem sets=90, readings=60, presentations=180
- "type" ("exam"|"assignment"|"reading"|"project"): category
- "course" (string): course name/code extracted from syllabus

Today is ${today}. Only include items with due dates from today onward (skip past dates). If the syllabus mentions a course name/code, include it.

Syllabus text:
"""
${syllabusText.slice(0, 6000)}
"""

Return ONLY the JSON array, no explanation.`
  );

  let cleaned = extractJSON(raw);
  const arrStart = cleaned.indexOf("[");
  const arrEnd = cleaned.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1) cleaned = cleaned.slice(arrStart, arrEnd + 1);
  const items = JSON.parse(cleaned);
  if (!Array.isArray(items)) throw new Error("Failed to parse syllabus");
  return items;
}

/**
 * Suggest study blocks based on schedule gaps and upcoming deadlines.
 */
export function suggestStudyBlocks(schedules, tasks) {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const todayClasses = schedules
    .filter(s => s.day_of_week === dayOfWeek)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const urgentTasks = tasks
    .filter(t => t.status !== "completed" && t.status !== "cancelled" && !t.parent_task_id)
    .sort((a, b) => {
      const scoreA = (a.priority === "high" ? 30 : a.priority === "medium" ? 15 : 0) + (a.due_date && a.due_date <= today.toISOString().slice(0, 10) ? 50 : 0);
      const scoreB = (b.priority === "high" ? 30 : b.priority === "medium" ? 15 : 0) + (b.due_date && b.due_date <= today.toISOString().slice(0, 10) ? 50 : 0);
      return scoreB - scoreA;
    });

  const gaps = [];
  const dayStart = 8 * 60;
  const dayEnd = 21 * 60;
  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  let cursor = dayStart;
  for (const cls of todayClasses) {
    const start = toMin(cls.start_time);
    const end = toMin(cls.end_time);
    if (start > cursor + 30) {
      gaps.push({ start: cursor, end: start, minutes: start - cursor });
    }
    cursor = Math.max(cursor, end);
  }
  if (dayEnd > cursor + 30) {
    gaps.push({ start: cursor, end: dayEnd, minutes: dayEnd - cursor });
  }

  const fmtTime = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const suggestions = [];
  let taskIdx = 0;
  for (const gap of gaps) {
    if (taskIdx >= urgentTasks.length) break;
    const task = urgentTasks[taskIdx];
    const blockLen = Math.min(gap.minutes, task.estimated_minutes || 45, 60);
    if (blockLen >= 20) {
      suggestions.push({
        start_time: fmtTime(gap.start),
        end_time: fmtTime(gap.start + blockLen),
        duration: blockLen,
        task_id: task.id,
        task_title: task.title,
        reason: task.due_date && task.due_date <= today.toISOString().slice(0, 10) ? "Due today" : task.priority === "high" ? "High priority" : "Next up",
      });
      taskIdx++;
    }
  }
  return suggestions;
}

/**
 * Decompose a task into 3-5 actionable subtasks.
 */
export async function decomposeTask(title, description, estimatedMinutes) {
  if (getApiKey()) {
    try { return await decomposeWithGemini(title, description, estimatedMinutes); } catch (e) { console.error("Gemini decompose failed:", e.message); }
  }
  return decomposeWithHeuristic(title, description, estimatedMinutes);
}

async function decomposeWithGemini(title, description, estimatedMinutes) {
  const raw = await callGemini(
    `You are a study planning assistant for college students. Break this assignment into 3-5 concrete, actionable subtasks. Each subtask should have a short title and an estimated duration in minutes.

Assignment: ${title}${description ? `\nDetails: ${description}` : ""}${estimatedMinutes ? `\nTotal estimated effort: ${estimatedMinutes} minutes` : ""}

Respond ONLY with a JSON array. Each element: {"title": "...", "estimated_minutes": N}
No explanation, just the JSON array.`
  );

  const subtasks = JSON.parse(extractJSON(raw));
  if (!Array.isArray(subtasks)) throw new Error("AI response was not an array");
  return subtasks.slice(0, 5).map((s) => ({
    title: String(s.title),
    estimated_minutes: Number(s.estimated_minutes) || 30,
  }));
}

function decomposeWithHeuristic(title, _description, estimatedMinutes) {
  const total = estimatedMinutes || 120;
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("paper") || lowerTitle.includes("essay") || lowerTitle.includes("report")) {
    return [
      { title: "Research and gather sources", estimated_minutes: Math.round(total * 0.25) },
      { title: "Create outline", estimated_minutes: Math.round(total * 0.1) },
      { title: "Write first draft", estimated_minutes: Math.round(total * 0.35) },
      { title: "Revise and edit", estimated_minutes: Math.round(total * 0.2) },
      { title: "Final proofreading and formatting", estimated_minutes: Math.round(total * 0.1) },
    ];
  }
  if (lowerTitle.includes("study") || lowerTitle.includes("exam") || lowerTitle.includes("test")) {
    return [
      { title: "Review lecture notes", estimated_minutes: Math.round(total * 0.25) },
      { title: "Summarize key concepts", estimated_minutes: Math.round(total * 0.2) },
      { title: "Practice problems", estimated_minutes: Math.round(total * 0.3) },
      { title: "Self-quiz and review weak areas", estimated_minutes: Math.round(total * 0.25) },
    ];
  }
  if (lowerTitle.includes("project") || lowerTitle.includes("presentation")) {
    return [
      { title: "Define scope and outline", estimated_minutes: Math.round(total * 0.15) },
      { title: "Research and gather materials", estimated_minutes: Math.round(total * 0.25) },
      { title: "Build / create content", estimated_minutes: Math.round(total * 0.35) },
      { title: "Review and refine", estimated_minutes: Math.round(total * 0.15) },
      { title: "Prepare for delivery", estimated_minutes: Math.round(total * 0.1) },
    ];
  }
  return [
    { title: "Understand requirements", estimated_minutes: Math.round(total * 0.15) },
    { title: "Plan approach", estimated_minutes: Math.round(total * 0.1) },
    { title: "Work on main content", estimated_minutes: Math.round(total * 0.45) },
    { title: "Review and finalize", estimated_minutes: Math.round(total * 0.3) },
  ];
}
