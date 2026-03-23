import express from "express";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/generate", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input: [
        {
          role: "developer",
          content: `
You are a professional football coaching assistant.

Generate a football drill draft from the user's prompt.

Return ONLY valid JSON with exactly this structure:

{
  "name": "",
  "description": "",
  "objectives": "",
  "category": "warmup",
  "focusTags": "",
  "difficulty": 1,
  "minPlayers": 4,
  "maxPlayers": 8,
  "durationMin": 10,
  "intensity": 1,
  "equipment": "",
  "pitchArea": "",
  "ageMin": 10,
  "ageMax": 12
}

Rules:
- category must be one of: warmup, technical, possession, finishing, game
- difficulty must be between 1 and 5
- intensity must be between 1 and 3
- minPlayers and maxPlayers must be realistic football drill numbers
- durationMin must be a positive integer
- focusTags should be comma-separated
- description should be concise but practical
- objectives should describe the coaching focus clearly
- ageMin and ageMax should be integers
- return JSON only, no markdown, no explanation
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = response.output_text?.trim() || "{}";
    const parsed = JSON.parse(text);

    return res.json({
      name: parsed.name || "",
      description: parsed.description || "",
      objectives: parsed.objectives || "",
      category: parsed.category || "technical",
      focusTags: parsed.focusTags || "",
      difficulty: Number(parsed.difficulty || 1),
      minPlayers: Number(parsed.minPlayers || 4),
      maxPlayers: Number(parsed.maxPlayers || 8),
      durationMin: Number(parsed.durationMin || 10),
      intensity: Number(parsed.intensity || 1),
      equipment: parsed.equipment || "",
      pitchArea: parsed.pitchArea || "",
      ageMin:
        parsed.ageMin === null || parsed.ageMin === undefined
          ? null
          : Number(parsed.ageMin),
      ageMax:
        parsed.ageMax === null || parsed.ageMax === undefined
          ? null
          : Number(parsed.ageMax),
    });
  } catch (error) {
    console.error("AI drill generation failed:", error);

    return res.status(500).json({
      error: "Could not generate drill with AI.",
    });
  }
});

export default router;