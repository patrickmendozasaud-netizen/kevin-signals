import { renderStocks, renderPortfolio, renderBrief, renderVideos } from "./ui.js";
import { STOCKS, prices, portfolio } from "./state.js";

console.log("✅ app.js loaded");

const API = "/api";

// ---------------- TAB ----------------
function tab(name){
  document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
  document.getElementById(name).style.display = "block";

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-tab="${name}"]`)?.classList.add("active");
}

// ---------------- PARSE ----------------
async function parse(){
  const text = document.getElementById("report").value;
  const status = document.getElementById("status");

  if(!text){
    alert("Paste report first");
    return;
  }

  status.innerHTML = "Parsing...";

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

    if(!parsed.stocks) throw new Error("No stocks returned");

    STOCKS.length = 0;
    STOCKS.push(...parsed.stocks);

    localStorage.setItem("stocks", JSON.stringify(STOCKS));

    status.innerHTML = "✅ Parsed";

    await fetchPrices();

  } catch(e){
    console.error(e);
    status.innerHTML = "❌ " + e.message;
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

// ---------------- SORT ----------------
function sortStocks(){
  renderStocks("movers");
}

// ---------------- VIDEO ----------------
async function loadVideos(){
  const res = await fetch(API + "/youtube");
  const vids = await res.json();

  renderVideos(vids, async (video)=>{
    const out = document.getElementById("videoOut");
    out.innerHTML = "Analyzing...";

    const r = await fetch(API + "/analyze-video", {
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ videoId: video.videoId })
    });

    const d = await r.json();
    out.innerHTML = `<pre>${JSON.stringify(d,null,2)}</pre>`;
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

  // TAB BUTTONS
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      tab(btn.dataset.tab);
    });
  });

  // ACTION BUTTONS
  document.getElementById("parseBtn")?.addEventListener("click", parse);
  document.getElementById("sortBtn")?.addEventListener("click", sortStocks);
  document.getElementById("videosRefreshBtn")?.addEventListener("click", loadVideos);
  document.getElementById("earningsBtn")?.addEventListener("click", loadEarnings);

  // DEFAULT TAB
  tab("import");

  // LOAD SAVED
  const saved = localStorage.getItem("stocks");
  if(saved){
    STOCKS.push(...JSON.parse(saved));
    fetchPrices();
  }

  renderPortfolio();

  // AUTO REFRESH
  setInterval(fetchPrices, 30000);
});
