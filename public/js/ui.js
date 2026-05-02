// ---------------- IMPORT STATE ----------------
import { STOCKS, prices, portfolio } from "./state.js";

// ---------------- HELPERS ----------------
function fmtPrice(p) {
  return p == null ? "—" : `$${Number(p).toFixed(2)}`;
}

function pct(p, prev) {
  if (p == null || prev == null || !prev) return null;
  return ((p - prev) / prev * 100);
}

// ---------------- STOCKS ----------------
export function renderStocks(sortBy = null) {
  const el = document.getElementById("stocksGrid");
  if (!el) return;

  if (!STOCKS.length) {
    el.innerHTML = `<div class="empty">No stocks yet</div>`;
    return;
  }

  let list = [...STOCKS];

  // 🔥 SORTING
  if (sortBy === "movers") {
    list.sort((a, b) => {
      const pa = pct(prices[a.ticker]?.price, prices[a.ticker]?.prev) ?? 0;
      const pb = pct(prices[b.ticker]?.price, prices[b.ticker]?.prev) ?? 0;
      return Math.abs(pb) - Math.abs(pa);
    });
  }

  if (sortBy === "score") {
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  el.innerHTML = list.map(s => {
    const p = prices[s.ticker]?.price ?? null;
    const prev = prices[s.ticker]?.prev ?? null;
    const change = pct(p, prev);

    const changeText = change != null ? `(${change.toFixed(2)}%)` : "";
    const cls = change == null ? "" : (change >= 0 ? "up" : "down");

    return `
      <div class="card">
        <div class="ticker">${s.ticker}</div>

        <div class="price ${cls}">
          ${fmtPrice(p)} ${changeText}
        </div>

        ${s.score != null ? `
          <div style="font-size:11px;margin-top:4px;color:#93c5fd">
            AI Score: ${Math.round(s.score)}
          </div>
        ` : ""}

        <button 
          class="analyzeBtn"
          data-ticker="${s.ticker}"
          style="margin-top:8px;width:100%">
          🤖 AI Analyze
        </button>

        <div id="ai-${s.ticker}" style="margin-top:6px;font-size:12px"></div>
      </div>
    `;
  }).join("");

  // 🔥 BUTTON WIRING (NO window dependency)
  el.querySelectorAll(".analyzeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const ticker = btn.dataset.ticker;

      // call global bridge (set in app.js)
      if (typeof window.runAnalyze === "function") {
        window.runAnalyze(ticker);
      } else {
        console.error("runAnalyze not found");
      }
    });
  });
}

// ---------------- PORTFOLIO ----------------
export function renderPortfolio() {
  const el = document.getElementById("portfolioGrid");
  if (!el) return;

  if (!portfolio.length) {
    el.innerHTML = `<div class="empty">No AI trades yet</div>`;
    return;
  }

  el.innerHTML = portfolio.map(p => {
    const now = prices[p.ticker]?.price ?? p.entry;
    const pnl = ((now - p.entry) / p.entry * 100);

    return `
      <div class="card">
        <div class="ticker">${p.ticker}</div>

        <div class="price ${pnl >= 0 ? 'up' : 'down'}">
          ${pnl.toFixed(2)}%
        </div>

        <div style="font-size:12px">Entry: $${p.entry}</div>
        <div style="font-size:12px">Now: ${fmtPrice(now)}</div>
      </div>
    `;
  }).join("");
}

// ---------------- AI BRIEF ----------------
export function renderBrief(data) {
  const el = document.getElementById("briefOut");
  if (!el) return;

  if (!data) {
    el.innerHTML = `<div class="empty">No AI brief yet</div>`;
    return;
  }

  el.innerHTML = `
    <div class="card">
      <h3>${data.verdict || "Neutral"}</h3>
      <p>${data.summary || ""}</p>
    </div>
  `;
}

// ---------------- VIDEOS ----------------
export function renderVideos(videos, onClick) {
  const el = document.getElementById("videosList");
  if (!el) return;

  if (!videos || !videos.length) {
    el.innerHTML = `<div class="empty">No videos</div>`;
    return;
  }

  el.innerHTML = videos.map(v => `
    <div class="card video-item" data-id="${v.videoId}" style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;margin-bottom:10px">
      ${v.thumbnail ? `<img src="${v.thumbnail}" style="width:120px;height:68px;border-radius:6px;object-fit:cover;flex-shrink:0">` : ''}
      <div>
        <div style="font-weight:700;font-size:14px;line-height:1.4;margin-bottom:4px">${v.title}</div>
        <div style="font-size:11px;color:#64748b">${v.published ? new Date(v.published).toLocaleDateString() : ''}</div>
        <div style="margin-top:6px;font-size:11px;color:#3b82f6">Click to analyze →</div>
      </div>
    </div>
  `).join("");

  el.querySelectorAll(".video-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.dataset.id;
      const vid = videos.find(v => v.videoId === id);
      if (onClick) onClick(vid);
    });
  });
}
