import { Router } from "express";

const router = Router();

/**
 * POST /api/ai/decompose
 * Takes an assignment description and returns suggested subtasks.
 * Uses OpenAI if API key is set; otherwise returns a template fallback.
 */
router.post("/decompose", async (req, res) => {
  try {
    const { assignment } = req.body;
    if (!assignment || typeof assignment !== "string") {
      return res.status(400).json({ error: "assignment (string) required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a study planner. Given an assignment, return 3-5 logical subtasks with estimated durations in minutes.
Return ONLY valid JSON array: [{"title":"...","minutes":N},...]
No markdown, no explanation.`,
            },
            {
              role: "user",
              content: assignment,
            },
          ],
          temperature: 0.3,
        }),
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        let steps;
        try {
          steps = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        } catch {
          steps = fallbackDecompose(assignment);
        }
        return res.json({ steps, source: "ai" });
      }
    }

    const steps = fallbackDecompose(assignment);
    res.json({ steps, source: "template" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function fallbackDecompose(assignment) {
  return [
    { title: "Research & gather materials", minutes: 30 },
    { title: "Outline / plan structure", minutes: 20 },
    { title: "Draft main content", minutes: 60 },
    { title: "Review and revise", minutes: 25 },
    { title: "Final polish & submit", minutes: 15 },
  ];
}

export const aiRouter = router;
