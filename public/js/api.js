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
  return await res.json();
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
