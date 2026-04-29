import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { ticker, price } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `
You are a trading analyst.

Analyze stock: ${ticker}
Current price: ${price}

Return ONLY JSON:
{
  "decision": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "entry": number,
  "target": number,
  "stop": number,
  "reason": "short explanation"
}
`
        }
      ]
    });

    const content = completion.choices[0].message.content;

    const parsed = JSON.parse(content);

    res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI analysis failed" });
  }
}
