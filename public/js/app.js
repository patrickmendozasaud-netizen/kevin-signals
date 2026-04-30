import { STOCKS, prices } from "./state.js";
import { renderStocks, renderPortfolio } from "./ui.js";

const API = "/api";

// -------- TAB SYSTEM --------
window.tab = (name)=>{
  document.querySelectorAll(".tab").forEach(t=>t.style.display="none");
  document.getElementById(name).style.display="block";
};

// -------- PARSE --------
window.parse = async ()=>{
  const text = document.getElementById("report").value;

  if(!text) return alert("Paste report");

  document.getElementById("status").innerText = "Parsing...";

  const words = text.match(/\b[A-Z]{2,5}\b/g) || [];

  const blacklist = ["THE","AND","FOR","WITH","THIS","THAT","FROM","KEVIN","VERY"];

  const tickers = [...new Set(words)].filter(w=>!blacklist.includes(w));

  STOCKS.length = 0;
  tickers.forEach(t=>STOCKS.push({ticker:t}));

  localStorage.setItem("stocks", JSON.stringify(STOCKS));

  document.getElementById("status").innerText = "✅ Parsed";

  fetchPrices();
};

// -------- PRICES --------
async function fetchPrices(){
  if(!STOCKS.length) return;

  const res = await fetch(API+"/prices",{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({tickers:STOCKS.map(s=>s.ticker)})
  });

  const data = await res.json();

  Object.assign(prices, data);

  renderStocks("score");
  renderPortfolio();
}

// -------- SORT --------
window.sortStocks = (type="score")=>{
  renderStocks(type);
};

// -------- AI ANALYZE --------
window.analyze = async (ticker, price)=>{
  const el = document.getElementById("ai-"+ticker);
  el.innerText = "Analyzing...";

  try{
    const res = await fetch(API+"/analyze-stock",{
      method:"POST",
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ticker,price})
    });

    const d = await res.json();

    el.innerHTML = `
      <b>${d.decision}</b> (${d.confidence}%)
      <br>${d.reason}
      <br>Entry: ${d.entry} | Target: ${d.target} | Stop: ${d.stop}
    `;

  }catch{
    el.innerText = "❌ AI error";
  }
};

// -------- INIT --------
window.onload = ()=>{
  const saved = localStorage.getItem("stocks");
  if(saved){
    STOCKS.push(...JSON.parse(saved));
    fetchPrices();
  }
};

setInterval(fetchPrices, 30000);
