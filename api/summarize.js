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
    const pageText = String(text).slice(0, 120000);

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
          content: `Summarize the following web page in 3-5 sentences. Be concise, accurate, and capture the main point. Don't editorialize. Don't add introductions like "This article..." — just deliver the summary.\n\nPage text:\n${pageText}`
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
