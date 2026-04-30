import { STOCKS, saveStocks, savePrices, portfolio, savePortfolio } from "./state.js";
import {
  fetchPrices, analyzeStock, analyzeReport,
  analyzeVideo, fetchVideos, fetchEarnings,
} from "./api.js";
import { renderStocks, renderPortfolio, renderBrief, renderVideos } from "./ui.js";

// Expose globals at the very top — function declarations below are hoisted,
// so this works even though the function bodies appear lower in the file.
// This way the inline onclick="..." handlers always have something to call,
// even if some later piece of init fails.
window.tab = tab;
window.parse = parse;
window.analyze = analyze;
window.sortStocks = sortStocks;
window.loadVideos = loadVideos;
window.analyzeVideoTicker = analyzeVideoTicker;
window.earnings = earnings;
console.log("[kevin-signals] app.js loaded — globals set:", Object.keys(window).filter(k => ["tab","parse","analyze","sortStocks","loadVideos","analyzeVideoTicker","earnings"].includes(k)));

let currentSort = null;
let currentBrief = null;
let videosCache = null;

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
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if (btn) btn.classList.add("active");
  if (name === "videos" && !videosCache) loadVideos();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function parse() {
  const ta = document.getElementById("report");
  const text = ta ? ta.value : "";
  if (!text.trim()) { alert("Paste a report first."); return; }

  setStatus(`⏳ Detecting tickers and fetching prices…`);
  try {
    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];
    const data = await fetchPrices(words);
    const valid = Object.keys(data);
    saveStocks(valid.map(t => ({ ticker: t })));
    savePrices(data);
    renderStocks(currentSort);

    setStatus(`✅ ${valid.length} tickers parsed. Asking AI for its take…`, "ok");

    try {
      currentBrief = await analyzeReport(text, valid);
      try { localStorage.setItem("brief", JSON.stringify(currentBrief)); } catch {}
      renderBrief(currentBrief);
      setStatus(`✅ Brief ready. Switching to AI Brief…`, "ok");
      tab("brief");
    } catch (e) {
      console.warn("Report analysis failed:", e.message);
      setStatus(`⚠ Tickers parsed but AI brief failed: ${e.message}`, "err");
      tab("stocks");
    }
  } catch (err) {
    console.error(err);
    setStatus(`❌ ${err.message}`, "err");
  }
}

async function analyze(ticker, price) {
  const el = document.getElementById("ai-" + ticker);
  if (!el) return;
  el.innerHTML = `<span class="spinner"></span>Analyzing…`;
  try {
    const d = await analyzeStock(ticker, price);
    const action = (d.decision || "HOLD").toUpperCase();
    const cls = action === "BUY" ? "buy" : action === "SELL" ? "sell" : "hold";
    el.innerHTML = `
      <span class="badge ${cls}">${action}</span>
      <span style="color:var(--muted);margin-left:6px">${d.confidence ?? "?"}%</span>
      ${d.reason ? `<div style="margin-top:6px;color:var(--muted)">${d.reason}</div>` : ""}
      ${(d.entry||d.target||d.stop) ? `<div style="margin-top:6px;font-family:var(--mono);font-size:10px;color:var(--muted)">${d.entry?`E:$${d.entry} `:""}${d.target?`T:$${d.target} `:""}${d.stop?`S:$${d.stop}`:""}</div>` : ""}
    `;
    if (action === "BUY" && Number(d.confidence) > 70 && !portfolio.find(p => p.ticker === ticker)) {
      const next = [...portfolio, { ticker, entry: Number(price) || 0, ts: Date.now() }];
      savePortfolio(next);
      renderPortfolio();
    }
  } catch (e) {
    el.innerHTML = `<span class="badge sell">ERROR</span> <span style="color:var(--muted)">${e.message}</span>`;
  }
}

function sortStocks() {
  currentSort = currentSort === "movers" ? null : "movers";
  renderStocks(currentSort);
}

async function loadVideos() {
  const list = document.getElementById("videosList");
  if (!list) return;
  list.innerHTML = `<div class="empty"><span class="spinner"></span>Loading latest videos…</div>`;
  try {
    videosCache = await fetchVideos();
    renderVideos(videosCache, (v) => analyzeVideoPick(v));
  } catch (e) {
    list.innerHTML = `<div class="empty">❌ ${e.message}</div>`;
  }
}

async function analyzeVideoPick(v) {
  const out = document.getElementById("videoOut");
  if (!out) return;
  out.innerHTML = `<div class="card"><span class="spinner"></span>Fetching transcript &amp; analyzing "<b>${escapeHtml(v.title)}</b>"…</div>`;
  out.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const d = await analyzeVideo(v.videoId);
    const tickers = Array.isArray(d.stocks) ? d.stocks.filter(t => /^[A-Z]{1,5}$/.test(t)) : [];

    out.innerHTML = `
      <div class="section">
        <h3>${escapeHtml(v.title)}</h3>
        <div style="line-height:1.65;font-size:14px">${escapeHtml(d.summary || "(no summary)")}</div>
        ${tickers.length ? `
          <div style="margin-top:14px">
            <b style="font-size:11px;letter-spacing:1px;color:var(--muted)">TICKERS MENTIONED</b><br>
            ${tickers.map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("")}
          </div>
          <div id="vidPicks" class="grid" style="margin-top:14px"></div>
        ` : `<div style="margin-top:10px;color:var(--muted)">No tickers detected.</div>`}
      </div>`;

    if (tickers.length) {
      try {
        const px = await fetchPrices(tickers);
        const grid = document.getElementById("vidPicks");
        if (grid) {
          grid.innerHTML = Object.keys(px).map(t => `
            <div class="card">
              <div class="ticker">${escapeHtml(t)}</div>
              <div class="price">$${(px[t].price || 0).toFixed(2)}</div>
              <button class="primary" style="margin-top:10px;width:100%;padding:7px;font-size:12px"
                onclick="window.analyzeVideoTicker('${escapeHtml(t)}', ${px[t].price || 0})">
                🤖 Get AI Take
              </button>
              <div id="vai-${escapeHtml(t)}" style="margin-top:8px;font-size:12px;line-height:1.5"></div>
            </div>
          `).join("");
        }
      } catch (e) {
        console.warn("Video picks price fetch failed:", e.message);
      }
    }
  } catch (e) {
    out.innerHTML = `<div class="empty">❌ ${e.message}</div>`;
  }
}

async function analyzeVideoTicker(ticker, price) {
  const el = document.getElementById("vai-" + ticker);
  if (!el) return;
  el.innerHTML = `<span class="spinner"></span>Analyzing…`;
  try {
    const d = await analyzeStock(ticker, price);
    const action = (d.decision || "HOLD").toUpperCase();
    const cls = action === "BUY" ? "buy" : action === "SELL" ? "sell" : "hold";
    el.innerHTML = `
      <span class="badge ${cls}">${action}</span>
      <span style="color:var(--muted);margin-left:6px">${d.confidence ?? "?"}%</span>
      ${d.reason ? `<div style="margin-top:4px;color:var(--muted)">${d.reason}</div>` : ""}
    `;
  } catch (e) {
    el.innerHTML = `<span class="badge sell">ERROR</span> ${e.message}`;
  }
}

async function earnings() {
  const out = document.getElementById("earningsOut");
  if (!out) return;
  out.innerHTML = `<div class="empty"><span class="spinner"></span>Loading…</div>`;
  try {
    const list = await fetchEarnings();
    if (!Array.isArray(list) || !list.length) {
      out.innerHTML = `<div class="empty">No earnings data.</div>`;
      return;
    }
    out.innerHTML = list.map(e =>
      `<div class="card">
         <div class="ticker">${escapeHtml(e.ticker || "?")}</div>
         <div style="font-size:13px;color:var(--muted);margin-top:6px;line-height:1.5">${escapeHtml(e.summary || "")}</div>
       </div>`
    ).join("");
  } catch (e) {
    out.innerHTML = `<div class="empty">❌ ${e.message}</div>`;
  }
}

function initUI(){

  // ---------- PARSE ----------
  document.getElementById("parseBtn")?.addEventListener("click", parse);

  // ---------- SORT ----------
  document.getElementById("sortBtn")?.addEventListener("click", ()=>{
    renderStocks("movers");
  });

  // ---------- TABS ----------
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const name = btn.dataset.tab;

      document.querySelectorAll(".tab").forEach(t=>t.style.display="none");
      document.getElementById(name).style.display = "block";

      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // ---------- VIDEOS ----------
  document.getElementById("refreshVideos")?.addEventListener("click", loadVideos);

  // ---------- EARNINGS ----------
  document.getElementById("loadEarnings")?.addEventListener("click", earnings);
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const saved = localStorage.getItem("brief");
    if (saved) currentBrief = JSON.parse(saved);
  } catch {}

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
  renderBrief(currentBrief);
});

window.onload = async ()=>{
  initUI();

  const saved = localStorage.getItem("stocks");

  if(saved){
    const parsed = JSON.parse(saved);
    // ⚠️ use your state setter if you have one
    parsed.forEach(s => STOCKS.push(s));

    await fetchPrices(parsed.map(s=>s.ticker));
  }

  renderStocks();
  renderPortfolio();
};
