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
  return data.candidates[0].content.parts[0].text.trim();
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
      const context = `Today's classes: ${classes.map(c => c.title).join(", ") || "none"}. 
Tasks: ${tasks.map(t => `${t.title} (priority: ${t.priority}, status: ${t.status}${t.due_date ? `, due: ${t.due_date}` : ""})`).join("; ") || "none"}.`;
      return await callGemini(
        `You are a friendly, encouraging study coach for college students. Based on this student's current workload, give one specific, actionable study tip in 2-3 sentences. Be warm and motivating.

${context}

Respond with just the tip, no prefix or formatting.`
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
