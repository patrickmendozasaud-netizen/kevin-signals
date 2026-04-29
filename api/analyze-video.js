// Pulls the actual transcript (caption track) from the YouTube watch page,
// then asks GPT-4o-mini to summarise it and extract tickers.
//
// Replaces the old "Sample transcript from video " + videoId placeholder.

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchTranscript(videoId) {
  const r = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!r.ok) throw new Error(`watch page ${r.status}`);
  const html = await r.text();

  const m = html.match(/"captionTracks":(\[[^\]]*\])/);
  if (!m) throw new Error('no caption tracks (video may have captions disabled)');
  let tracks;
  try { tracks = JSON.parse(m[1].replace(/\\u0026/g, '&')); }
  catch (e) { throw new Error('bad captionTracks JSON'); }

  const en = tracks.find(t => (t.languageCode || '').startsWith('en')) || tracks[0];
  if (!en?.baseUrl) throw new Error('no caption baseUrl');

  const xml = await (await fetch(en.baseUrl)).text();
  const text = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map(x => x[1]
      .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .join(' ');

  // Cap at ~12k chars to keep model cost down
  return text.slice(0, 12000);
}

export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on Vercel' });
    }
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    let transcript;
    try { transcript = await fetchTranscript(videoId); }
    catch (e) { return res.status(400).json({ error: 'Transcript: ' + e.message }); }

    if (!transcript || transcript.length < 50) {
      return res.status(400).json({ error: 'Transcript too short or unavailable' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content:
`Summarize this YouTube video and extract every stock ticker mentioned.

Return ONLY JSON with this exact shape:
{
  "summary": "<2-3 sentence summary>",
  "stocks":  ["AAPL", "NVDA"]
}

Transcript:
${transcript}`
      }]
    });

    res.status(200).json(JSON.parse(completion.choices[0].message.content));
  } catch (e) {
    console.error('ANALYZE VIDEO ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
