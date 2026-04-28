import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  const { text } = req.body;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Extract stock tickers and signals from this:\n${text}\nReturn JSON format`
      }
    ]
  });

  res.status(200).json({
    result: completion.choices[0].message.content
  });
}
