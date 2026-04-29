import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { ticker, price } = req.body;

    // fetch indicators + news
    const [indRes, newsRes] = await Promise.all([
      fetch(`${process.env.BASE_URL}/api/indicators?ticker=${ticker}`),
      fetch(`${process.env.BASE_URL}/api/news?ticker=${ticker}`)
    ]);

    const indicators = await indRes.json();
    const news = await newsRes.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `
You are a professional trading analyst.

DATA:
Ticker: ${ticker}
Price: ${price}
RSI: ${indicators.rsi}
Trend: ${indicators.trend}

News Headlines:
${news.headlines.join("\n")}

RULES:
- Use RSI (overbought >70, oversold <30)
- Use trend direction
- Use news sentiment
- Be conservative

Return ONLY JSON:
{
  "decision": "BUY" | "SELL" | "HOLD",
  "confidence": number,
  "entry": number,
  "target": number,
  "stop": number,
  "reason": "short explanation"
}
`
        }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content);

    res.json(result);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI failed" });
  }
}
