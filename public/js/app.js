import * as UI from "./ui.js";
import * as API from "./api.js";
import {
  STOCKS,
  prices,
  portfolio,
  setStocks,
  setPrices,
  addToPortfolio
} from "./state.js";

// ---------------- GLOBALS ----------------
let videosCache = [];

// ---------------- TAB ----------------
function tab(name){
  document.querySelectorAll(".tab").forEach(t=>t.style.display="none");
  const el = document.getElementById(name);
  if(el) el.style.display = "block";

  document.querySelectorAll(".tab-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.tab === name);
  });
}
window.tab = tab;

// ---------------- PARSE ----------------
async function parse(){
  const text = document.getElementById("report").value;
  const status = document.getElementById("status");

  status.innerText = "Parsing...";

  const tickers = [...new Set((text.match(/\b[A-Z]{2,5}\b/g) || []))];

  setStocks(tickers.map(t => ({ ticker: t })));

  status.innerText = "Fetching prices...";

  try{
    const res = await API.getPrices(tickers);
    setPrices(res);

    UI.renderStocks();
    UI.renderPortfolio();

    status.innerText = "Done";
  }catch(e){
    console.error(e);
    status.innerText = "Error loading prices";
  }
}
window.parse = parse;

// ---------------- ANALYZE STOCK ----------------
async function analyze(ticker){
  const el = document.getElementById("ai-" + ticker);
  if(!el) return;

  el.innerText = "Analyzing...";

  try{
    const price = prices[ticker]?.price || 0;

    const d = await API.analyzeStock(ticker, price);

    const decision = d?.decision || "HOLD";
    const confidence = d?.confidence || 0;
    const entry = d?.entry ?? "-";
    const target = d?.target ?? "-";
    const stop = d?.stop ?? "-";
    const score = d?.score ?? confidence;

    el.innerHTML =
      "<div class='ai-line'>" +
      "<b>" + decision + "</b> (" + confidence + "%)<br>" +
      "Score: " + score + "<br>" +
      "Entry: " + entry + "<br>" +
      "Target: " + target + "<br>" +
      "Stop: " + stop +
      "</div>";

    const stock = STOCKS.find(s => s.ticker === ticker);
    if(stock) stock.score = score;

    if(decision === "BUY" && confidence > 70){
      addToPortfolio({ ticker, entry: price });
      UI.renderPortfolio();
    }

  }catch(e){
    console.error(e);
    el.innerText = "AI error";
  }
}
window.analyze = analyze;

// ---------------- RANK ----------------
function rankStocks(){
  STOCKS.sort((a,b)=>(b.score||0)-(a.score||0));
  UI.renderStocks();
}
window.sortStocks = rankStocks;

// ---------------- VIDEOS (BULLETPROOF) ----------------
async function loadVideos(){
  const list = document.getElementById("videosList");
  const out = document.getElementById("videoOut");

  if(list) list.innerHTML = "Loading videos...";
  if(out) out.innerHTML = "";

  try{
    videosCache = await API.getVideos();

    if(!videosCache || !videosCache.length){
      if(list) list.innerHTML = "No videos found";
      return;
    }

    UI.renderVideos(videosCache, async (video)=>{
      if(!video || !video.videoId) return;

      out.innerHTML = "Analyzing video...";

      try{
        const res = await API.analyzeVideo(video.videoId);

        out.innerHTML =
          "<div class='card'>" +
          (res?.summary || "No summary") +
          "</div>";

      }catch(err){
        console.error(err);
        out.innerHTML = "Video analysis failed";
      }
    });

  }catch(e){
    console.error(e);
    if(list) list.innerHTML = "Error loading videos";
  }
}
window.loadVideos = loadVideos;

// ---------------- EARNINGS ----------------
async function loadEarnings(){
  const el = document.getElementById("earningsOut");

  try{
    const data = await API.getEarnings();

    el.innerHTML = data.map(e =>
      "<div class='card'><b>" + e.ticker + "</b><br>" + e.summary + "</div>"
    ).join("");

  }catch(e){
    console.error(e);
    el.innerHTML = "Error loading earnings";
  }
}
window.loadEarnings = loadEarnings;

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", ()=>{

  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> tab(btn.dataset.tab));
  });

  document.getElementById("parseBtn")?.addEventListener("click", parse);
  document.getElementById("rankBtn")?.addEventListener("click", rankStocks);
  document.getElementById("refreshVideos")?.addEventListener("click", loadVideos);
  document.getElementById("loadEarnings")?.addEventListener("click", loadEarnings);

  UI.renderStocks();
  UI.renderPortfolio();

  window.appReady = true;
});
