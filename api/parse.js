import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
Extract ONLY valid stock ticker symbols from the text.

Rules:
- Tickers are 1–5 uppercase letters (e.g. AAPL, NVDA, TSLA)
- Ignore common English words (TODAY, OPEN, VERY, etc.)
- Ignore duplicates
- Ignore emojis and formatting
- Include tickers mentioned anywhere (earnings, trades, lists)

Return ONLY valid JSON:
{
  "stocks": [
    { "ticker": "AAPL" },
    { "ticker": "NVDA" }
  ]
}

Text:
${text}
`
        }
      ],
      temperature: 0
    });

    let content = completion.choices[0].message.content;

    // 🔥 HARD FIX: force clean JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { stocks: [] };
    }

    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Parse failed" });
  }
}
