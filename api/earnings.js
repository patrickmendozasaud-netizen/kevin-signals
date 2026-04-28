import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TICKERS = ["AAPL","MSFT","NVDA","AMZN"];

export default async function handler(req,res){
  let out = [];

  for(let t of TICKERS){
    const ai = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[{
        role:"user",
        content:`Give short earnings insight for ${t}`
      }]
    });

    out.push({
      ticker:t,
      summary: ai.choices[0].message.content
    });
  }

  res.json(out);
}
