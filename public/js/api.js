const API_BASE = "/api";

// ---------------- PRICES ----------------
export async function getPrices(tickers) {
  const res = await fetch(API_BASE + "/prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers })
  });

  return await res.json();
}

// ---------------- AI STOCK ANALYSIS ----------------
export async function analyzeStock(ticker, price) {
  const res = await fetch(API_BASE + "/analyze-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, price })
  });

  return await res.json();
}

// ---------------- VIDEOS ----------------
export async function getVideos() {
  const res = await fetch(API_BASE + "/videos");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Videos API returned ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Videos API returned unexpected data");
  return data;
}

// ---------------- VIDEO ANALYSIS ----------------
export async function analyzeVideo(videoId) {
  const res = await fetch(API_BASE + "/analyze-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId })
  });

  return await res.json();
}

// ---------------- EARNINGS ----------------
export async function getEarnings() {
  const res = await fetch(API_BASE + "/earnings");
  return await res.json();
}
