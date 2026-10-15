'use strict';
/**
 * 簡易本地伺服器，用於驗證多人連線。
 * 正式部署到原網站時，請把 draw-guess-server.js 接到現有 Express 伺服器，
 * 不要以這份測試伺服器覆寫原本的 server.js。
 */
const http=require('node:http');
const path=require('node:path');
const fs=require('node:fs');
const {Server}=require('socket.io');
const PORT=Number(process.env.PORT)||3000;
const page=path.join(__dirname,'draw-guess.html');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&['/','/index.html','/draw-guess.html'].includes(url.pathname)){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    fs.createReadStream(page).pipe(res);
    return;
  }
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
  res.end('Page not found');
});
const io=new Server(server,{cors:{origin:true,methods:['GET','POST']}});
require('./draw-guess-server')(io);
server.listen(PORT,()=>console.log(`🎨 軍一亂畫社已啟動： http://localhost:${PORT}/draw-guess.html`));
