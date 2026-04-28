import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res){
  const { videoId } = req.body;

  const transcriptRes = await fetch(`https://youtubetranscript.com/?server_vid2=${videoId}`);
  const transcript = await transcriptRes.json();

  const text = transcript.map(t=>t.text).join(" ");

  const ai = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[{
      role:"user",
      content:`Summarize + extract stock calls:\n${text}`
    }]
  });

  res.json({summary: ai.choices[0].message.content});
}
