export let STOCKS = [];
export let prices = {};
export let portfolio = [];

try {
  const p = JSON.parse(localStorage.getItem("portfolio") || "[]");
  if (Array.isArray(p)) portfolio = p;
} catch { portfolio = []; }

try {
  const s = JSON.parse(localStorage.getItem("stocks") || "[]");
  if (Array.isArray(s)) STOCKS = s.filter(x => x && typeof x.ticker === "string");
} catch { STOCKS = []; }

export function saveStocks(data) {
  STOCKS = Array.isArray(data) ? data : [];
  try { localStorage.setItem("stocks", JSON.stringify(STOCKS)); } catch {}
}

export function savePrices(p) {
  prices = (p && typeof p === "object") ? p : {};
}

export function savePortfolio(p) {
  portfolio = Array.isArray(p) ? p : [];
  try { localStorage.setItem("portfolio", JSON.stringify(portfolio)); } catch {}
}
