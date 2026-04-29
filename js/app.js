import { STOCKS, saveStocks, savePrices, portfolio, savePortfolio } from "./state.js";
import { fetchPrices, analyzeStock, analyzeVideo, fetchEarnings } from "./api.js";
import { renderStocks, renderPortfolio } from "./ui.js";

let currentSort = null;

function setStatus(msg, kind) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg || "";
  el.className = "status" + (kind ? ` ${kind}` : "");
}

function tab(name) {
  document.querySelectorAll(".tab").forEach(t => (t.style.display = "none"));
  const target = document.getElementById(name);
  if (target) target.style.display = "block";
  document.querySelectorAll(".sidebar button").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.sidebar button[data-tab="${name}"]`);
  if (btn) btn.classList.add("active");
}

async function parse() {
  const ta = document.getElementById("report");
  const text = ta ? ta.value : "";
  if (!text.trim()) { alert("Paste a report first."); return; }
  setStatus("Detecting tickers and fetching prices…");
  try {
    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];
    const data = await fetchPrices(words);
    const valid = Object.keys(data);
    saveStocks(valid.map(t => ({ ticker: t })));
    savePrices(data);
    setStatus(`✅ Found ${valid.length} ticker(s). Open the Stocks tab.`, "ok");
    renderStocks(currentSort);
    renderPortfolio();
    tab("stocks");
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message}`, "err");
  }
}

async function analyze(ticker, price) {
  const el = document.getElementById("ai-" + ticker);
  if (!el) return;
  el.textContent = "Analyzing…";
  try {
    const d = await analyzeStock(ticker, price);
    const cls = d.decision === "BUY" ? "up" : d.decision === "SELL" ? "down" : "";
    el.innerHTML = `<b class="${cls}">${d.decision}</b> · ${d.confidence}%${d.reason ? ` · ${d.reason}` : ""}`;
    if (d.decision === "BUY" && d.confidence > 70 && !portfolio.find(p => p.ticker === ticker)) {
      const next = [...portfolio, { ticker, entry: Number(price) || 0, ts: Date.now() }];
      savePortfolio(next);
      renderPortfolio();
    }
  } catch (e) {
    console.error(e);
    el.textContent = "❌ " + e.message;
  }
}

function sortStocks() {
  currentSort = currentSort === "movers" ? null : "movers";
  renderStocks(currentSort);
}

async function video() {
  const inp = document.getElementById("videoId");
  const out = document.getElementById("videoOut");
  if (!inp || !out) return;
  const raw = (inp.value || "").trim();
  if (!raw) { alert("Paste a YouTube ID or URL."); return; }
  const m = raw.match(/(?:v=|youtu\.be\/|\/shorts\/|\/live\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  const videoId = m ? m[1] : raw;
  out.innerHTML = `<div class="card"><i>Analyzing video…</i></div>`;
  try {
    const d = await analyzeVideo(videoId);
    const stocks = Array.isArray(d.stocks) ? d.stocks.join(", ") : "(none)";
    out.innerHTML = `
      <div class="card">
        <b>Summary</b>
        <div style="margin:6px 0;color:#cbd5e1">${d.summary || "(none)"}</div>
        <b>Stocks mentioned:</b> ${stocks || "(none)"}
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="card down">❌ ${e.message}</div>`;
  }
}

async function earnings() {
  const out = document.getElementById("earningsOut");
  if (!out) return;
  out.innerHTML = `<div class="empty">Loading…</div>`;
  try {
    const list = await fetchEarnings();
    if (!Array.isArray(list) || !list.length) {
      out.innerHTML = `<div class="empty">No earnings data.</div>`;
      return;
    }
    out.innerHTML = list.map(e =>
      `<div class="card">
         <div class="ticker">${e.ticker}</div>
         <div style="font-size:13px;color:#cbd5e1;margin-top:6px">${e.summary}</div>
       </div>`
    ).join("");
  } catch (e) {
    out.innerHTML = `<div class="empty down">❌ ${e.message}</div>`;
  }
}

// Expose to window IMMEDIATELY so inline onclick handlers work even if init fails.
window.tab = tab;
window.parse = parse;
window.analyze = analyze;
window.sortStocks = sortStocks;
window.video = video;
window.earnings = earnings;

document.addEventListener("DOMContentLoaded", async () => {
  // Refresh prices for any stocks we already had cached
  if (STOCKS.length) {
    try {
      const data = await fetchPrices(STOCKS.map(s => s.ticker));
      savePrices(data);
    } catch (e) {
      console.warn("Initial price fetch failed:", e.message);
    }
  }
  renderStocks(currentSort);
  renderPortfolio();
});
