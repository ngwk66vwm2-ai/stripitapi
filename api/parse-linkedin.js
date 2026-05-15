export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Parse this LinkedIn profile text and return ONLY a JSON object with this structure, no other text:
{
  "name": "full name",
  "headline": "job title/headline",
  "location": "location",
  "about": "about section text",
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "dates": "date range",
      "location": "job location",
      "description": "job description"
    }
  ],
  "education": [
    {
      "school": "school name",
      "degree": "degree",
      "dates": "date range",
      "activities": "activities"
    }
  ],
  "skills": ["skill1", "skill2"]
}

LinkedIn profile text:
${text}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
