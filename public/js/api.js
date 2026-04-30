// Words that look like tickers but aren't — filtered before sending to the API
const SKIP_WORDS = new Set([
  'POST','GET','PUT','API','JSON','HTTP','HTML','CSS','URL','NULL','TRUE','FALSE',
  'NEW','LET','VAR','FOR','AND','THE','NOT','ALL','ARE','WAS','HAS','HAD','ITS','BUT',
  'CAN','WILL','NOW','OUT','DAY','TOP','KEY','USE','SET','MAP','CEO','CFO','COO','IPO',
  'PE','PEG','EPS','ETF','SEC','FDA','EU','US','USA','UK','AI','GDP','GAAP',
  'Q1','Q2','Q3','Q4','OPEN','VERY','TODAY','EXPECT','WEEK','MONTH','YEAR',
  'AFTER','BEFORE','WITH','FROM','THIS','THAT','MORE','LESS','HIGH','LOW',
]);

export function filterTickers(words) {
  return [...new Set(words)].filter(w => {
    if (!w || w.length < 2 || w.length > 5) return false;
    if (SKIP_WORDS.has(w)) return false;
    if (!/^[A-Z]+$/.test(w)) return false;
    return true;
  });
}

async function postJSON(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`Network error reaching ${path}: ${e.message}`);
  }
  if (!res.ok) {
    let detail = '';
    try { const b = await res.json(); detail = b.error || b.message || JSON.stringify(b); }
    catch { detail = await res.text().catch(() => '(no body)'); }
    throw new Error(`${path} returned ${res.status}: ${detail}`);
  }
  try { return await res.json(); }
  catch (e) { throw new Error(`${path} returned non-JSON: ${e.message}`); }
}

async function getJSON(path) {
  const r = await fetch(path);
  if (!r.ok) {
    let detail = '';
    try { const b = await r.json(); detail = b.error || JSON.stringify(b); }
    catch { detail = await r.text().catch(() => '(no body)'); }
    throw new Error(`${path} returned ${r.status}: ${detail}`);
  }
  return r.json();
}

export async function fetchPrices(tickers) {
  const clean = filterTickers(tickers);
  if (!clean.length) {
    throw new Error('No valid tickers found in the report.');
  }
  const data = await postJSON('/api/prices', { tickers: clean });
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Prices API returned unexpected shape.');
  }
  const returned = Object.keys(data);
  if (!returned.length) {
    throw new Error(`Prices API returned no recognised tickers. Sent: ${clean.join(', ')}`);
  }
  return data;
}

export async function analyzeStock(ticker, price) {
  if (!ticker) throw new Error('analyzeStock: ticker required');
  return postJSON('/api/analyze-stock', { ticker, price: Number(price) || 0 });
}

export async function analyzeReport(text, tickers) {
  return postJSON('/api/analyze-report', { text, tickers });
}

export async function analyzeVideo(videoId) {
  return postJSON('/api/analyze-video', { videoId });
}

export async function fetchVideos() {
  return getJSON('/api/videos');
}

export async function fetchEarnings() {
  return getJSON('/api/earnings');
}
