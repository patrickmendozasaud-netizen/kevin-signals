const BLACKLIST = new Set([
  // Common English words that appear in financial reports
  'OPEN','VERY','TODAY','EXPECT','WEEK','MONTH','YEAR','AFTER','BEFORE','WITH','FROM',
  'THIS','THAT','THEN','THAN','THEM','THEY','THEIR','THERE','THESE','THOSE',
  'POST','GET','PUT','API','JSON','HTTP','HTML','CSS','URL','NULL','TRUE','FALSE',
  'NEW','LET','VAR','FOR','AND','THE','NOT','ALL','ARE','WAS','HAS','HAD','ITS',
  'BUT','CAN','WILL','NOW','OUT','DAY','TOP','KEY','USE','SET','MAP','MAY','OUR',
  'CEO','CFO','COO','CTO','IPO','PE','PEG','EPS','ETF','SEC','FDA','FED','IMF',
  'EU','US','USA','UK','AI','GDP','GAAP','EBIT','EBITDA','YOY','QOQ','MOM',
  'Q1','Q2','Q3','Q4','MORE','LESS','HIGH','LOW','LONG','TERM','SHORT',
  'ALSO','BACK','BEEN','BOTH','COME','DOES','DONE','DOWN','EACH','EVEN',
  'EVER','FEEL','FELT','FIND','GIVE','GOES','GONE','GOOD','GROW','HALF',
  'HARD','HAVE','HERE','HOLD','HOPE','JUST','KEEP','KNOW','LAST','LATE',
  'LIKE','LOOK','MADE','MAKE','MANY','MEAN','MOST','MOVE','MUCH','MUST',
  'NEAR','NEED','NEXT','NICE','ONLY','OVER','PAST','PLAN','PLAY','PLUS',
  'PULL','PUSH','PUTS','RATE','REAL','RISK','ROAD','ROLE','RUNS','SAID',
  'SAME','SAYS','SEEN','SELF','SELL','SHOW','SIDE','SLOW','SOME','SOON',
  'STAY','SUCH','SURE','TAKE','TALK','TELL','THAN','THAT','TIME','TOLD',
  'TOOK','TURN','TYPE','UNIT','UPON','VERY','WANT','WAYS','WEEK','WELL',
  'WENT','WERE','WHAT','WHEN','WHOM','WIDE','WITH','WORD','WORK','YEAR',
  'YOUR','ZERO','BEST','CALL','CASE','CASH','COST','CUTS','DATA','DEAL',
  'DEBT','DROP','EACH','EARN','FALL','FAST','FEEL','FELL','FIRM','FIVE',
  'FLOW','FOUR','FREE','FROM','FULL','FUND','GAIN','GETS','GOLD','GREW',
  'GREW','GREW','GROW','HELP','HUGE','INTO','JOBS','JUMP','JUST','KEEP',
  'LACK','LEAD','LEND','LIFT','LIST','LIVE','LOAN','LOCK','LOSS','LOTS',
  'MADE','MAIN','MARK','MEET','MISS','MOVE','NEWS','NOTE','ONCE','ONLY',
  'ONTO','PART','PEAK','PICK','POOR','PURE','PUSH','READ','RELY','REPO',
  'REST','RISE','ROSE','SAID','SALE','SAVE','SEES','SENT','SIZE','SOAR',
  'SOLD','SOME','SPIN','SPOT','STEP','STOP','SUIT','SWAP','TALK','TECH',
  'TELL','TEST','THEY','THIN','THUS','TILL','TRIM','USED','VIEW','VOTE',
  'WAIT','WALK','WARN','WAYS','WEEK','WIDE','WILD','WILL','WINS','WONT',
  'WORD','WORE','WORN','WRIT','YEAR','ADDS','AIMS','ALSO','AMID','AREA',
  'ARMY','ASKS','AWAY','BASE','BEAR','BEEN','BIAS','BIDS','BOOM','BOOT',
  'BORE','BORN','BOTH','BULL','BURN','BUYS','CALM','CARE','CAST','CHIP',
  'CITE','CITY','CLUE','CODE','COIN','COLD','CORE','CORP','CUTS','DEAL',
  // Financial jargon
  'BULL','BEAR','PUTS','CALL','CASH','DEBT','BOND','FUND','RATE','REPO',
  'FOMC','JOLTS','CPI','PPI','PCE','PMI','ISM','NFP','ADP','ECB','BOJ',
  'OPEC','NATO','BRIC','SPAC','PIPE','REIT','MLP','ADR','OTC','NYSE',
  'NASDAQ','DJIA','SPX','NDX','VIX','CBOE','CFTC','FDIC','FINRA','SIPC',
  // Kevin-specific common words
  'KEVIN','MEET','ALPHA','REPORT','BRIEF','NOTES','LIVE','COURSE','STREAM',
  'REINVEST','COURSE','MEMBER','MEMBERS','WATCH','LIST','BELOW','ABOVE',
  'CRITICAL','OPINION','DATA','INFO','CHART','TRADE','SIGNAL','ENTRY',
  'TARGET','STOP','LOSS','PROFIT','PRICE','SHARE','STOCK','MARKET','SECTOR',
  'MACRO','MICRO','TREND','SETUP','BREAK','BOUNCE','RALLY','DUMP','PUMP',
  'MOON','CRASH','BULL','BEAR','PUTS','CALL','OPTION','COVER','HEDGE',
  'LONG','SHORT','SCALE','DOLLAR','COST','AVERAGE','SWING','DAYTRADE',
]);

export default async function handler(req, res) {
  try {
    const text = (req.body || {}).text || '';

    // Extract uppercase words 2-5 chars
    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];
    const candidates = [...new Set(words)].filter(w => !BLACKLIST.has(w));

    if (!candidates.length) {
      return res.status(200).json({ stocks: [] });
    }

    // Validate against Yahoo Finance — only keep tickers that return a real price
    const results = await Promise.all(candidates.map(async (t) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=1d`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!r.ok) return null;
        const j = await r.json();
        const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
        return price ? t : null;
      } catch { return null; }
    }));

    const tickers = results.filter(Boolean);
    res.status(200).json({ stocks: tickers.map(t => ({ ticker: t })) });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
