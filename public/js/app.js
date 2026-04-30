import { renderStocks, renderPortfolio, renderVideos } from "./ui.js";
import { STOCKS, prices, portfolio } from "./state.js";

console.log("✅ app.js loaded");

const API = "/api";

// expose globals for UI
window.STOCKS = STOCKS;
window.prices = prices;
window.portfolio = portfolio;

// ---------------- TAB ----------------
function tab(name){
  document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
  document.getElementById(name).style.display = "block";

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-tab="${name}"]`)?.classList.add("active");
}
window.tab = tab; // 👈 IMPORTANT

// ---------------- PARSE ----------------
async function parse(){
  const text = document.getElementById("report").value;
  const status = document.getElementById("status");

  if(!text){
    alert("Paste report first");
    return;
  }

  status.innerText = "Parsing...";

  try{
    const res = await fetch(API + "/parse", {
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ text })
    });

    const data = await res.json();

    const parsed = typeof data.result === "string"
      ? JSON.parse(data.result)
      : data;

    STOCKS.length = 0;
    STOCKS.push(...(parsed.stocks || []));

    localStorage.setItem("stocks", JSON.stringify(STOCKS));

    status.innerText = "✅ Parsed";

    await fetchPrices();

  } catch(e){
    console.error(e);
    status.innerText = "❌ Failed";
  }
}

// ---------------- PRICES ----------------
async function fetchPrices(){
  if(!STOCKS.length) return;

  try{
    const res = await fetch(API + "/prices", {
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        tickers: STOCKS.map(s=>s.ticker)
      })
    });

    const data = await res.json();

    Object.keys(data).forEach(t=>{
      prices[t] = {
        price: data[t].price ?? data[t],
        prev: data[t].prev ?? null
      };
    });

    renderStocks();
    renderPortfolio();

  } catch(e){
    console.error("Price error", e);
  }
}

// ---------------- AI ANALYZE ----------------
async function analyze(ticker){
  const el = document.getElementById("ai-" + ticker);
  if(!el) return;

  el.innerText = "Analyzing...";

  try{
    const price = prices[ticker]?.price || 0;

    const res = await fetch(API + "/analyze-stock", {
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ ticker, price })
    });

    const d = await res.json();

    el.innerHTML = `
      <b>${d.decision}</b> (${d.confidence}%)
      <br>${d.reason || ""}
    `;

    // auto buy logic
    if(d.decision === "BUY" && d.confidence > 70){
      aiBuy(ticker, price);
    }

  } catch(e){
    console.error(e);
    el.innerText = "❌ AI error";
  }
}

// 👇 FIXES YOUR ERROR
window.analyze = analyze;

// ---------------- AUTO BUY ----------------
function aiBuy(ticker, price){
  if(portfolio.find(p=>p.ticker===ticker)) return;

  portfolio.push({
    ticker,
    entry: price,
    time: Date.now()
  });

  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  renderPortfolio();
}

// ---------------- SORT ----------------
function sortStocks(){
  renderStocks("movers");
}
window.sortStocks = sortStocks;

// ---------------- VIDEOS ----------------
async function loadVideos(){
  const res = await fetch(API + "/youtube");
  const vids = await res.json();

  renderVideos(vids, async (video)=>{
    const out = document.getElementById("videoOut");
    out.innerText = "Analyzing...";

    const r = await fetch(API + "/analyze-video", {
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ videoId: video.videoId })
    });

    const d = await r.json();
    out.innerText = d.summary || "No summary";
  });
}

// ---------------- EARNINGS ----------------
async function loadEarnings(){
  const res = await fetch(API + "/earnings");
  const data = await res.json();

  document.getElementById("earningsOut").innerHTML =
    data.map(e=>`<div class="card"><b>${e.ticker}</b><br>${e.summary}</div>`).join("");
}

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {
  
  console.log("✅ DOM ready");

  // tabs
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>tab(btn.dataset.tab));
  });

  // buttons
  document.getElementById("parseBtn")?.addEventListener("click", parse);
  document.getElementById("refreshVideos")?.addEventListener("click", loadVideos);
  document.getElementById("loadEarnings")?.addEventListener("click", loadEarnings);
  document.getElementById("rankBtn")?.addEventListener("click", sortStocks);

  // default tab
  tab("import");

  // load saved
  const saved = localStorage.getItem("stocks");
  if(saved){
    STOCKS.push(...JSON.parse(saved));
    fetchPrices();
  }

  renderPortfolio();

  setInterval(fetchPrices, 30000);
});
