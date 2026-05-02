import { STOCKS, prices, portfolio, setStocks, setPrices } from "./state.js";
import { renderStocks, renderPortfolio, renderVideos } from "./ui.js";
import * as API from "./api.js";

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupButtons();
  loadSaved();
  setInterval(fetchPrices, 30000);
});

// ---------------- TABS ----------------
function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
      document.getElementById(tab).style.display = "block";

      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ---------------- BUTTONS ----------------
function setupButtons() {
  document.getElementById("parseBtn")?.addEventListener("click", parse);

  document.getElementById("refreshVideos")?.addEventListener("click", loadVideos);

  document.getElementById("loadEarnings")?.addEventListener("click", loadEarnings);

  // 🔥 STOCK BUTTONS (event delegation)
  document.getElementById("stocksGrid")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("analyze-btn")) {
      const ticker = e.target.dataset.ticker;
      analyze(ticker);
    }
  });

  // 🔥 SORT BUTTON
  document.querySelector("#stocks button")?.addEventListener("click", () => {
    renderStocks("score");
  });
}

// ---------------- PARSE ----------------
async function parse() {
  const text = document.getElementById("report").value;
  const status = document.getElementById("status");

  if (!text) return;

  status.innerText = "Parsing...";

  const words = text.match(/\b[A-Z]{2,5}\b/g) || [];

  const tickers = [...new Set(words)];

  setStocks(tickers.map(t => ({ ticker: t })));

  localStorage.setItem("stocks", JSON.stringify(STOCKS));

  status.innerText = "Fetching prices...";

  await fetchPrices();

  for (const s of STOCKS) {
  await analyze(s.ticker);
}

  status.innerText = "✅ Done";
}

// ---------------- PRICES ----------------
async function fetchPrices() {
  if (!STOCKS.length) return;

  try {
    const data = await API.getPrices(STOCKS.map(s => s.ticker));

    setPrices(data);

    renderStocks();
    renderPortfolio();
  } catch (e) {
    console.error(e);
  }
}

// ---------------- ANALYZE ----------------
async function analyze(ticker) {
  const el = document.getElementById("ai-" + ticker);
  if (!el) return;

  el.innerText = "Analyzing...";

  try {
    const price = prices[ticker]?.price || 0;

    const res = await API.analyzeStock(ticker, price);

    // save score
    const stock = STOCKS.find(s => s.ticker === ticker);

    if (stock) {
      stock.score = Number(res.score ?? res.confidence ?? 0);
    } else {
      console.warn("Stock not found for scoring:", ticker);
    }

    el.innerHTML = `
  <div class="ai-line">
    <b>${decision}</b> (${confidence}%)
    <br>Score: ${score}
    <br>Entry: ${entry}
    <br>Target: ${target}
    <br>Stop: ${stop}
  </div>
`;

    // auto buy
    if (res.decision === "BUY" && res.confidence > 70) {
      autoBuy(ticker, price);
    }

  } catch (e) {
    el.innerText = "❌ Error";
  }
  renderStocks("score");
}

window.runAnalyze = analyze;

// ---------------- AUTO BUY ----------------
function autoBuy(ticker, price) {
  if (portfolio.find(p => p.ticker === ticker)) return;

  portfolio.push({
    ticker,
    entry: price,
    time: Date.now()
  });

  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  renderPortfolio();
}

// ---------------- VIDEOS ----------------
async function loadVideos() {
  const videos = await API.getVideos();

  renderVideos(videos, async (video) => {
    const out = document.getElementById("videoOut");
    out.innerHTML = `<div class="card" style="margin-top:12px"><span class="spinner"></span> Analyzing video...</div>`;
    try {
      const res = await API.analyzeVideo(video.videoId);
      const tickers = Array.isArray(res.stocks) ? res.stocks : [];
      out.innerHTML = `
        <div class="card" style="margin-top:12px">
          <div style="font-weight:700;font-size:15px;margin-bottom:10px">${video.title}</div>
          <div style="color:#94a3b8;font-size:13px;line-height:1.6;margin-bottom:12px">${res.summary || ""}</div>
          ${tickers.length ? `
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Tickers Mentioned</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${tickers.map(t => `<span style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:4px 10px;font-family:monospace;font-size:13px;font-weight:700">${t}</span>`).join("")}
            </div>
          ` : '<div style="color:#64748b">No specific tickers detected.</div>'}
        </div>`;
    } catch(e) {
      out.innerHTML = `<div class="card" style="margin-top:12px;color:#f87171">❌ ${e.message}</div>`;
    }
  });
}

// ---------------- EARNINGS ----------------
async function loadEarnings() {
  const data = await API.getEarnings();

  document.getElementById("earningsOut").innerHTML =
    data.map(e => `<div class="card">${e.ticker}: ${e.summary}</div>`).join("");
}

// ---------------- LOAD ----------------
function loadSaved() {
  const saved = localStorage.getItem("stocks");

  if (saved) {
    setStocks(JSON.parse(saved));
    fetchPrices();
  }

  renderPortfolio();
}
window.appReady = true;
