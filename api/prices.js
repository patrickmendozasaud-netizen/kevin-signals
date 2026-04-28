export default async function handler(req, res){
  const { tickers } = req.body;

  let result = {};

  await Promise.all(tickers.map(async t=>{
    try{
      const r = await fetch(`https://financialmodelingprep.com/api/v3/quote/${t}?apikey=demo`);
      const d = await r.json();
      result[t] = d[0]?.price;
    }catch(e){
      result[t] = null;
    }
  }));

  res.json(result);
}
