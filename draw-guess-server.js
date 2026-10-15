'use strict';
/**
 * 軍一你畫我猜：Socket.IO 房間遊戲伺服器
 * 接到現有 server.js：require('./draw-guess-server')(io)
 * 不儲存個人資料、房間及分數只在記憶體內。
 */
module.exports = function attachDrawGuess(io) {
  const channel = io.of('/draw-guess');
  const rooms = new Map();
  const WORDS = [
    '貓咪','雨傘','冰淇淋','太陽','月亮','飛機','火車','機器人','企鵝','西瓜','草莓','牙刷','電腦','手機','書包',
    '彩虹','蘋果','大象','長頸鹿','獅子','熊貓','章魚','海豚','鯊魚','蝴蝶','蜜蜂','恐龍','蛋糕','披薩','漢堡',
    '珍珠奶茶','薯條','氣球','吉他','鋼琴','棒球','籃球','溜滑梯','摩天輪','紅綠燈','消防車','飛碟','雪人','聖誕樹',
    '眼鏡','皇冠','鑰匙','時鐘','城堡','燈泡','火箭','帆船','腳踏車','烏龜','兔子','狐狸','青蛙','櫻桃','蘑菇',
    '巧克力','漢堡包','游泳池','咖啡杯','向日葵','相機','獨角獸','熱氣球','電風扇','足球','郵筒','滑板'
  ];
  const MAX_PLAYERS = 8;
  const STICKERS = new Set(['shortHair','longHair','eyes','glasses','hat','smile','tree','house']);
  const ack = (callback, result) => { if (typeof callback === 'function') callback(result); };
  const normalize = s => String(s || '').normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/[\s\p{P}\p{S}]/gu,'');
  const cleanName = s => String(s || '').trim().replace(/[<>\r\n]/g,'').slice(0,14);
  const safeRoom = code => rooms.get(String(code || '').trim().toUpperCase());

  function roomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do { code = Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join(''); }
    while(rooms.has(code));
    return code;
  }
  function summary(r) {
    const online = Array.from(r.players.values());
    return {
      code: r.code, status: r.status, ownerId:r.ownerId, expanded:r.expanded,
      players: online.map(p => ({id:p.id,name:p.name,score:p.score,guessed:r.guessed.has(p.id)})),
      seconds:r.seconds, rounds:r.rounds, currentTurn:r.turn + 1,
      totalTurns:r.totalTurns, drawerId:r.drawerId,
      masked:r.word ? [...r.word].map(ch => /[\p{L}\p{N}]/u.test(ch) ? '＿' : ch).join(' ') : '',
      remaining:r.status === 'playing' ? Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):0
    };
  }
  function broadcast(r) { channel.to(r.code).emit('state',summary(r)); }
  function clearRound(r) { r.strokes=[]; r.guessed=new Set(); r.word='';r.drawerId=null;r.deadline=0; }
  function finishGame(r) {
    r.status='finished';clearRound(r);
    broadcast(r);
    channel.to(r.code).emit('game-over',{scores:Array.from(r.players.values()).map(p=>({name:p.name,score:p.score})).sort((a,b)=>b.score-a.score)});
  }
  function nextTurn(r) {
    if (!rooms.has(r.code)) return;
    if(r.players.size<2){r.status='lobby';clearRound(r);r.turn=0;broadcast(r);return;}
    if(r.turn>=r.totalTurns){finishGame(r);return;}
    const active = r.order.filter(id=>r.players.has(id));
    if(active.length===0){finishGame(r);return;}
    clearRound(r);
    r.drawerId=active[r.turn % active.length];
    const candidates=WORDS.filter(w=>w!==r.lastWord);
    r.word=candidates[Math.floor(Math.random()*candidates.length)];
    r.lastWord=r.word;
    r.status='playing';r.deadline=Date.now()+r.seconds*1000;
    channel.to(r.code).emit('board-reset');
    broadcast(r);
    channel.to(r.drawerId).emit('your-word',r.word);
  }
  function endTurn(r,reason) {
    if(r.status!=='playing') return;
    const answer=r.word;
    r.status='intermission';
    channel.to(r.code).emit('turn-ended',{answer,reason});
    r.turn++;
    broadcast(r);
    setTimeout(()=>{if(rooms.get(r.code)===r && r.status==='intermission') nextTurn(r);},4200);
  }
  function leaveRoom(socket) {
    const code=socket.data.drawGuessRoom;
    if(!code)return;
    socket.data.drawGuessRoom=null;
    socket.leave(code);
    const r=rooms.get(code);
    if(!r) return;
    const wasDrawer=r.drawerId===socket.id;
    r.players.delete(socket.id);
    r.order=r.order.filter(id=>id!==socket.id);
    r.guessed.delete(socket.id);
    if(!r.players.size){rooms.delete(code);return;}
    if(r.ownerId===socket.id)r.ownerId=r.players.keys().next().value;
    if(r.status==='playing') {
      if(r.players.size<2){r.status='lobby';r.turn=0;clearRound(r);}
      else if(wasDrawer)endTurn(r,'畫家離開了房間');
      else if(r.guessed.size>=r.players.size-1)endTurn(r,'大家都猜對了');
    }
    if(r.status==='intermission'&&r.players.size<2){r.status='lobby';r.turn=0;clearRound(r);}
    broadcast(r);
  }

  const tick=setInterval(()=>{
    for (const r of rooms.values()) if(r.status==='playing') {
      const remaining=Math.max(0,Math.ceil((r.deadline-Date.now())/1000));
      channel.to(r.code).emit('tick',remaining);
      if(remaining===0)endTurn(r,'時間到');
    }
  },1000);
  if (typeof tick.unref==='function')tick.unref();

  channel.on('connection',socket=>{
    socket.on('create-room',(payload,done)=>{
      const name=cleanName(payload?.name);
      if(!name)return ack(done,{ok:false,error:'請輸入暱稱'});
      if(rooms.size>=200)return ack(done,{ok:false,error:'目前房間過多，請稍後再試'});
      leaveRoom(socket);
      const rounds=Math.max(1,Math.min(3,Number(payload?.rounds)||2));
      const seconds=[60,80,100].includes(Number(payload?.seconds))?Number(payload.seconds):80;
      const code=roomCode();
      const expanded=payload?.expanded === true;
      const r={code,expanded,players:new Map(),order:[socket.id],ownerId:socket.id,rounds,seconds,status:'lobby',turn:0,totalTurns:0,drawerId:null,word:'',lastWord:'',deadline:0,strokes:[],guessed:new Set()};
      r.players.set(socket.id,{id:socket.id,name,score:0,lastChat:0});
      rooms.set(code,r);socket.join(code);socket.data.drawGuessRoom=code;
      ack(done,{ok:true,code});broadcast(r);
    });
    socket.on('join-room',(payload,done)=>{
      const name=cleanName(payload?.name);
      const r=safeRoom(payload?.code);
      if(!name)return ack(done,{ok:false,error:'請輸入暱稱'});
      if(!r)return ack(done,{ok:false,error:'找不到房間，請確認房號'});
      if(r.status!=='lobby'&&r.status!=='finished')return ack(done,{ok:false,error:'遊戲進行中，下一場再加入'});
      if(r.players.size>=MAX_PLAYERS)return ack(done,{ok:false,error:'房間已滿'});
      leaveRoom(socket);
      r.players.set(socket.id,{id:socket.id,name,score:0,lastChat:0});
      r.order.push(socket.id);
      socket.join(r.code);socket.data.drawGuessRoom=r.code;
      ack(done,{ok:true,code:r.code});broadcast(r);
    });
    socket.on('start-game',(_,done)=>{
      const r=safeRoom(socket.data.drawGuessRoom);
      if(!r)return ack(done,{ok:false,error:'請先加入房間'});
      if(r.ownerId!==socket.id)return ack(done,{ok:false,error:'只有房主可以開始'});
      if(!['lobby','finished'].includes(r.status))return ack(done,{ok:false,error:'遊戲已開始'});
      if(r.players.size<2)return ack(done,{ok:false,error:'至少需要兩位玩家'});
      for(const p of r.players.values())p.score=0;
      r.order=Array.from(r.players.keys());r.turn=0;r.totalTurns=r.order.length*r.rounds;
      nextTurn(r);ack(done,{ok:true});
    });
    socket.on('draw-stroke',(s)=>{
      const r=safeRoom(socket.data.drawGuessRoom);
      if(!r||r.status!=='playing'||r.drawerId!==socket.id)return;
      if(!s||!['x0','y0','x1','y1'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=1))return;
      if(typeof s.id!=='string'||s.id.length>48||!s.id.length)return;
      if(!/^#[0-9A-Fa-f]{6}$/.test(s.color))return;
      if(!Number.isFinite(s.size)||s.size<1||s.size>70)return;
      const stroke={id:s.id,x0:s.x0,y0:s.y0,x1:s.x1,y1:s.y1,color:s.color,size:s.size};
      r.strokes.push(stroke);
      if(r.strokes.length>5000)r.strokes.shift();
      socket.to(r.code).emit('draw-stroke',stroke);
    });
    socket.on('place-sticker',(s)=>{
      const r=safeRoom(socket.data.drawGuessRoom);
      if(!r||!r.expanded||r.status!=='playing'||r.drawerId!==socket.id)return;
      if(!s||!STICKERS.has(s.asset)||typeof s.id!=='string'||!s.id.length||s.id.length>48)return;
      if(!['x','y'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=1))return;
      if(!Number.isFinite(s.scale)||s.scale<0.6||s.scale>2.2)return;
      if(!Number.isFinite(s.rotation)||s.rotation< -180||s.rotation>180)return;
      if(typeof s.color!=='string'||!/^#[0-9A-Fa-f]{6}$/.test(s.color))return;
      const player=r.players.get(socket.id);
      if(!player||Date.now()-(player.lastStamp||0)<120)return;
      player.lastStamp=Date.now();
      const sticker={kind:'sticker',id:s.id,asset:s.asset,x:s.x,y:s.y,scale:s.scale,rotation:s.rotation,color:s.color};
      r.strokes.push(sticker);
      if(r.strokes.length>5000)r.strokes.shift();
      socket.to(r.code).emit('place-sticker',sticker);
    });
    socket.on('clear-board',()=>{
      const r=safeRoom(socket.data.drawGuessRoom);
      if(!r||r.status!=='playing'||r.drawerId!==socket.id)return;
      r.strokes=[];channel.to(r.code).emit('board-reset');
    });
    socket.on('undo-stroke',()=>{
      const r=safeRoom(socket.data.drawGuessRoom);
      if(!r||r.status!=='playing'||r.drawerId!==socket.id||!r.strokes.length)return;
      const last=r.strokes[r.strokes.length-1].id;
      while(r.strokes.length && r.strokes[r.strokes.length-1].id===last)r.strokes.pop();
      channel.to(r.code).emit('board-state',r.strokes);
    });
    socket.on('chat-guess',(text)=>{
      const r=safeRoom(socket.data.drawGuessRoom);
      if(!r||typeof text!=='string')return;
      const p=r.players.get(socket.id);
      if(!p)return;
      const now=Date.now();
      if(now-p.lastChat<650)return;
      p.lastChat=now;
      const value=text.trim().slice(0,70).replace(/[<>]/g,'');
      if(!value)return;
      if(r.status==='playing' && r.drawerId!==socket.id && !r.guessed.has(socket.id) && normalize(value)===normalize(r.word)){
        const remaining=Math.max(0,Math.ceil((r.deadline-Date.now())/1000));
        const gained=100+remaining*2;
        p.score+=gained;
        const drawer=r.players.get(r.drawerId);if(drawer)drawer.score+=50;
        r.guessed.add(socket.id);
        socket.emit('correct-guess',{points:gained});
        channel.to(r.code).emit('system-chat',`${p.name} 猜對了！ 🎉`);
        broadcast(r);
        if(r.guessed.size >= r.players.size-1)endTurn(r,'大家都猜對了');
      }else if(r.status==='playing' && r.drawerId===socket.id){
        socket.emit('system-chat','畫家不能在聊天室提示答案喔');
      }else if(r.status==='playing' && r.guessed.has(socket.id)){
        socket.emit('system-chat','你已經猜對，這一回合可以幫畫家加油！');
      }else{
        channel.to(r.code).emit('chat-message',{name:p.name,text:value});
      }
    });
    socket.on('leave-room',()=>leaveRoom(socket));
    socket.on('disconnect',()=>leaveRoom(socket));
  });
};
