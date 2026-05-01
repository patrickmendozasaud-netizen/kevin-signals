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

    // Destructure all fields from the API response before using them
    const { decision = "HOLD", confidence = 0, score = 0, entry = 0, target = 0, stop = 0, reason = "" } = res;

    const badgeCls = decision === "BUY" ? "badge-buy" : decision === "SELL" ? "badge-sell" : "badge-hold";

    el.innerHTML = `
  <div class="ai-line">
    <span class="${badgeCls}">${decision}</span>
    <span style="color:#94a3b8;margin-left:6px">${confidence}% confidence</span>
    ${reason ? `<div style="margin-top:4px;font-size:11px;color:#94a3b8">${reason}</div>` : ""}
    <div style="margin-top:6px;font-size:11px;font-family:monospace;color:#64748b">
      ${entry  ? `E:$${entry} `  : ""}
      ${target ? `T:$${target} ` : ""}
      ${stop   ? `S:$${stop}`    : ""}
    </div>
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
    const res = await API.analyzeVideo(video.id);
    document.getElementById("videoOut").innerText = res.summary;
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
