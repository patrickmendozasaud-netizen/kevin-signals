// Words that look like tickers but aren't — filtered out before sending to the API
const SKIP_WORDS = new Set([
  'POST', 'GET', 'PUT', 'API', 'JSON', 'HTTP', 'HTML', 'CSS', 'URL',
  'NULL', 'TRUE', 'FALSE', 'NEW', 'LET', 'VAR', 'FOR', 'AND', 'THE',
  'NOT', 'ALL', 'ARE', 'WAS', 'HAS', 'HAD', 'ITS', 'BUT', 'CAN',
  'WILL', 'NOW', 'OUT', 'DAY', 'TOP', 'KEY', 'USE', 'SET', 'MAP',
]);

/**
 * Filter a raw list of uppercase words down to likely real tickers.
 * Export this so main.js can reuse it when parsing the report text.
 */
export function filterTickers(words) {
  return words.filter(w => {
    if (w.length < 2 || w.length > 5) return false;
    if (SKIP_WORDS.has(w)) return false;
    if (!/^[A-Z]+$/.test(w)) return false;
    return true;
  });
}

/**
 * Fetch live prices for a list of tickers.
 * Returns an object like { TSLA: { price: 250.00, change: 1.5, ... }, ... }
 *
 * Throws a descriptive Error if:
 *   - the network request fails
 *   - the server returns a non-OK status
 *   - the response body is not valid JSON
 *   - the response is not a plain object (null, array, etc.)
 */
export async function fetchPrices(tickers) {
  // Filter out obvious non-tickers before hitting the API
  const clean = filterTickers(tickers);

  if (!clean.length) {
    throw new Error(
      'No valid tickers found. The report may not contain any stock symbols, ' +
      'or all words were filtered as common English words.'
    );
  }

  let res;
  try {
    res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers: clean }),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching /api/prices: ${networkErr.message}`);
  }

  if (!res.ok) {
    // Try to read the body for a server-side error message
    let detail = '';
    try {
      const body = await res.json();
      detail = body.message || body.error || JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => '(no body)');
    }
    throw new Error(`Prices API returned ${res.status}: ${detail}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    throw new Error(
      `Prices API returned non-JSON body. ` +
      `Make sure /api/prices returns Content-Type: application/json. ` +
      `Parse error: ${parseErr.message}`
    );
  }

  // Guard: must be a plain object, not null / array / primitive
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      `Prices API returned unexpected shape: ${JSON.stringify(data).slice(0, 200)}. ` +
      `Expected an object like { TSLA: { price: 250 }, ... }.`
    );
  }

  // Warn about tickers that came back with no data (but don't crash)
  const returned = Object.keys(data);
  const missing = clean.filter(t => !returned.includes(t));
  if (missing.length) {
    console.warn(
      `[fetchPrices] ${missing.length} ticker(s) returned no data: ${missing.join(', ')}. ` +
      `They may be invalid, delisted, or unsupported by your price provider.`
    );
  }

  if (!returned.length) {
    throw new Error(
      'Prices API returned an empty object — none of the tickers were recognised. ' +
      `Tickers sent: ${clean.join(', ')}`
    );
  }

  return data;
}

/**
 * Ask the AI to analyse a single stock and return a decision.
 * Returns an object like { decision: 'BUY', confidence: 82, reason: '...' }
 *
 * Throws a descriptive Error on any failure.
 */
export async function analyzeStock(ticker, price) {
  if (!ticker || typeof ticker !== 'string') {
    throw new Error('analyzeStock: ticker must be a non-empty string');
  }
  if (price == null || isNaN(Number(price))) {
    throw new Error(`analyzeStock: price must be a number, got ${price}`);
  }

  let res;
  try {
    res = await fetch('/api/analyze-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, price: Number(price) }),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching /api/analyze-stock: ${networkErr.message}`);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.message || body.error || JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => '(no body)');
    }
    throw new Error(`Analyze-stock API returned ${res.status} for ${ticker}: ${detail}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    throw new Error(
      `Analyze-stock API returned non-JSON for ${ticker}. ` +
      `Parse error: ${parseErr.message}`
    );
  }

  // Validate expected fields so callers don't have to guess why things are undefined
  if (!data || typeof data !== 'object') {
    throw new Error(`Analyze-stock returned unexpected type for ${ticker}: ${typeof data}`);
  }
  if (!('decision' in data)) {
    throw new Error(
      `Analyze-stock response for ${ticker} is missing 'decision' field. ` +
      `Got: ${JSON.stringify(data).slice(0, 200)}`
    );
  }
  if (!('confidence' in data)) {
    throw new Error(
      `Analyze-stock response for ${ticker} is missing 'confidence' field. ` +
      `Got: ${JSON.stringify(data).slice(0, 200)}`
    );
  }

  return data;
}
