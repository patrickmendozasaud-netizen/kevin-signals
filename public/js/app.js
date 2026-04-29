import { STOCKS, saveStocks, savePrices, portfolio, savePortfolio } from "./state.js";
import { fetchPrices, analyzeStock } from "./api.js";
import { renderStocks, renderPortfolio } from "./ui.js";

// ---------- PARSE ----------
window.parse = async function(){
  try {
    const text = document.getElementById("report").value;

    if(!text){
      alert("Paste report first");
      return;
    }

    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];
    const unique = [...new Set(words)];

    document.getElementById("status").innerText = "Validating tickers...";

    // ⚠️ DEBUG LINE
    console.log("Sending tickers:", unique);

    const data = await fetchPrices(unique);

    console.log("Received prices:", data);

    const valid = Object.keys(data);

    if(!valid.length){
      throw new Error("No valid tickers returned");
    }

    saveStocks(valid.map(t => ({ ticker: t })));
    savePrices(data);

    document.getElementById("status").innerText = "✅ Parsed";

    renderStocks();
    renderPortfolio();

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "❌ Parse failed";
  }
};

// ---------- ANALYZE ----------
window.analyze = async function(ticker, price){
  const el = document.getElementById("ai-"+ticker);
  el.innerText = "Analyzing...";

  try {
    const d = await analyzeStock(ticker, price);

    el.innerHTML = `<b>${d.decision}</b> (${d.confidence}%)`;

    if(d.decision === "BUY" && d.confidence > 70){
      portfolio.push({ ticker, entry: price });
      savePortfolio(portfolio);
      renderPortfolio();
    }

  } catch(e){
    el.innerText = "❌";
  }
};

// ---------- INIT ----------
window.onload = async ()=>{
  const saved = localStorage.getItem("stocks");

  if(saved){
    const parsed = JSON.parse(saved);
    saveStocks(parsed);

    try {
      const data = await fetchPrices(parsed.map(s=>s.ticker));
      savePrices(data);
    } catch(e){
      console.error(e);
    }
  }

  function tab(name){
    document.querySelectorAll('.tab').forEach(t=>{
      t.style.display = 'none';
    });
  
    document.getElementById(name).style.display = 'block';
  
    document.querySelectorAll('.sidebar button').forEach(b=>{
      b.classList.remove('active');
    });
  
    document.querySelector(`.sidebar button[onclick="tab('${name}')"]`)
      .classList.add('active');
}

  renderStocks();
  renderPortfolio();

  window.parse = parse;
  window.tab = tab;
  window.sortStocks = sortStocks;
  window.video = video;
  window.earnings = earnings;
};
