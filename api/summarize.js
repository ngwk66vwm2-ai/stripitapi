export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-stripit-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const expectedKey = process.env.STRIPIT_SHARED_SECRET;
  const providedKey = req.headers["x-stripit-key"];
  if (!expectedKey || !providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });
    const mode = (req.body && req.body.mode) === "lecture" ? "lecture" : "default";
    const pageText = String(text).slice(0, 120000);

    const defaultPrompt = `Summarize the following web page in 3-5 sentences. Be concise, accurate, and capture the main point. Don't editorialize. Don't add introductions like "This article..." — just deliver the summary.\n\nPage text:\n${pageText}`;

    const lecturePrompt = `You are creating detailed study notes from a lecture transcript for a student preparing for an exam. Produce thorough, well-organized notes that capture ALL substantive content.

Requirements:
- Organize into clear sections with short headings, each heading on its own line starting with "## ".
- Under each heading, use concise bullet points starting with "- ".
- Capture every important topic, concept, definition, legal rule, and especially any COURT CASES mentioned (include the case name and what it established or why it matters).
- Include any procedures, tests, distinctions, exceptions, and exam-relevant points.
- Leave out filler: greetings, scheduling/logistics chatter, tangents, and repetition.
- Be accurate to the transcript. Do not invent cases or facts. Auto-generated transcripts may misspell names — preserve them as given.
- Do NOT add a top-level title or a "Summary" heading; start directly with the first "## " section.

Lecture transcript:
${pageText}`;

    const prompt = mode === "lecture" ? lecturePrompt : defaultPrompt;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const summary = data.content[0].text.trim();
    return res.status(200).json({ summary });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
