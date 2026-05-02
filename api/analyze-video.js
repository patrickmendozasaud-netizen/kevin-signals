// Analyzes a Kevin video using its title + YouTube description.
// Transcript scraping from YouTube's watch page is blocked on Vercel,
// so we use the public oEmbed/RSS data we already have instead.

import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getVideoMeta(videoId) {
  // YouTube oEmbed gives us title + author — free, no API key, no scraping
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`oEmbed ${r.status}`);
  return r.json(); // { title, author_name, ... }
}

export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on Vercel' });
    }

    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    let meta;
    try { meta = await getVideoMeta(videoId); }
    catch (e) { return res.status(400).json({ error: 'Could not load video: ' + e.message }); }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `You are analyzing a Meet Kevin (Kevin Paffrath) YouTube video based on its title.
Kevin is a stock market analyst. Based on the video title, infer what stocks and topics he likely covered.

Video title: "${meta.title}"

Return ONLY this JSON:
{
  "summary": "<2-3 sentence summary of what this video likely covers based on the title>",
  "stocks": ["TICKER1", "TICKER2"]
}

Only include real stock tickers (e.g. TSLA, NVDA, AAPL). If none are obvious from the title, return an empty array.`
      }]
    });

    res.status(200).json(JSON.parse(completion.choices[0].message.content));
  } catch (e) {
    console.error('ANALYZE VIDEO ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
