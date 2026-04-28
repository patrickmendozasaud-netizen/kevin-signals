let DB = {};

export default function handler(req, res){
  if(req.method === "POST"){
    DB.data = req.body;
    return res.json({ ok:true });
  }

  if(req.method === "GET"){
    return res.json(DB.data || {});
  }
}
