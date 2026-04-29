import { STOCKS, saveStocks, savePrices, portfolio, savePortfolio } from "./state.js";
import { fetchPrices, analyzeStock } from "./api.js";
import { renderStocks, renderPortfolio } from "./ui.js";

// ---------- TAB ----------
// Defined at top level so all window.* assignments below can reference it
function tab(name) {
  document.querySelectorAll('.tab').forEach(t => {
    t.style.display = 'none';
  });

  document.getElementById(name).style.display = 'block';

  document.querySelectorAll('.sidebar button').forEach(b => {
    b.classList.remove('active');
  });

  const btn = document.querySelector(`.sidebar button[onclick="tab('${name}')"]`);
  if (btn) btn.classList.add('active');
}

// ---------- PARSE ----------
window.parse = async function () {
  try {
    const text = document.getElementById("report").value;
    if (!text) {
      alert("Paste report first");
      return;
    }

    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];
    const unique = [...new Set(words)];

    document.getElementById("status").innerText = "Validating tickers...";
    console.log("Sending tickers:", unique);

    const data = await fetchPrices(unique);
    console.log("Received prices:", data);

    const valid = Object.keys(data);
    if (!valid.length) {
      throw new Error("No valid tickers returned");
    }

    // Fixed: was saveStocks([valid.map](...)) — extra array wrap removed
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
window.analyze = async function (ticker, price) {
  const el = document.getElementById("ai-" + ticker);
  el.innerText = "Analyzing...";
  try {
    const d = await analyzeStock(ticker, price);
    el.innerHTML = `<b>${d.decision}</b> (${d.confidence}%)`;
    if (d.decision === "BUY" && d.confidence > 70) {
      portfolio.push({ ticker, entry: price });
      savePortfolio(portfolio);
      renderPortfolio();
    }
  } catch (e) {
    el.innerText = "❌";
  }
};

// ---------- STUB FUNCTIONS ----------
// These were assigned to window but never defined — stubbed so the app doesn't crash
function sortStocks(field) {
  console.warn("sortStocks not yet implemented", field);
}

function video() {
  console.warn("video not yet implemented");
}

function earnings() {
  console.warn("earnings not yet implemented");
}

// ---------- INIT ----------
window.onload = async () => {
  const saved = localStorage.getItem("stocks");
  if (saved) {
    const parsed = JSON.parse(saved);
    saveStocks(parsed);
    try {
      // Fixed: was [parsed.map](...) — broken link syntax
      const data = await fetchPrices(parsed.map(s => s.ticker));
      savePrices(data);
    } catch (e) {
      console.error(e);
    }
  }

  renderStocks();
  renderPortfolio();

  // Assign all globals after functions are defined
  window.parse    = window.parse;   // already set above
  window.tab      = tab;            // Fixed: was [window.tab] — broken link syntax
  window.sortStocks = sortStocks;
  window.video    = video;          // Fixed: was [window.video] — broken link syntax
  window.earnings = earnings;
};
