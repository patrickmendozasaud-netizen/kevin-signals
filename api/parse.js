const BLACKLIST = new Set([
  'OPEN','VERY','TODAY','EXPECT','WEEK','MONTH','YEAR','AFTER','BEFORE','WITH','FROM',
  'THIS','THAT','POST','GET','API','JSON','HTTP','HTML','CSS','URL','NULL','TRUE','FALSE',
  'NEW','LET','VAR','FOR','AND','THE','NOT','ALL','ARE','WAS','HAS','HAD','ITS','BUT',
  'CAN','WILL','NOW','OUT','DAY','TOP','KEY','USE','SET','MAP','CEO','CFO','COO','IPO',
  'PE','PEG','EPS','ETF','SEC','FDA','EU','US','USA','UK','AI','GDP','GAAP',
  'Q1','Q2','Q3','Q4','MORE','LESS','HIGH','LOW',
]);

export default function handler(req, res) {
  try {
    const text = (req.body || {}).text || '';
    const words = text.match(/\b[A-Z]{2,5}\b/g) || [];
    const tickers = [...new Set(words)].filter(w => !BLACKLIST.has(w));
    res.status(200).json({ stocks: tickers.map(t => ({ ticker: t })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
