'use strict';
const assert=require('node:assert/strict');
const attach=require('./draw-guess-server');
class Socket {
  constructor(id, channel){this.id=id;this.data={};this.channel=channel;this.received=[];this.handlers={};this.join(id);}
  on(name,fn){this.handlers[name]=fn;}
  emit(name,payload){this.received.push({name,payload});}
  join(room){(this.channel.rooms.get(room)||this.channel.rooms.set(room,new Set()).get(room)).add(this);}
  leave(room){this.channel.rooms.get(room)?.delete(this);}
  to(room){return{emit:(name,payload)=>{for(const s of this.channel.rooms.get(room)||[])if(s!==this)s.emit(name,payload);}};}
  async send(name,payload){return await new Promise(resolve=>{const handler=this.handlers[name];if(!handler)throw Error(name); if(['create-room','join-room','start-game'].includes(name))handler(payload,resolve);else{handler(payload);resolve();}});}
  last(name){return this.received.filter(x=>x.name===name).at(-1)?.payload;}
}
class Channel {
 constructor(){this.rooms=new Map()}
 on(name,fn){if(name==='connection')this.connection=fn;}
 to(room){return{emit:(name,payload)=>{for(const s of this.rooms.get(room)||[])s.emit(name,payload);}};}
 connect(id){const s=new Socket(id,this);this.connection(s);return s;}
}
(async()=>{
 const channel=new Channel();attach({of(namespace){assert.equal(namespace,'/draw-guess');return channel;}});
 const a=channel.connect('a'),b=channel.connect('b');
 let created=await a.send('create-room',{name:'標準房主',expanded:false,rounds:1,seconds:60});
 assert(created.ok);
 await b.send('join-room',{name:'猜題人',code:created.code});
 assert.equal(b.last('state').expanded,false);
 await a.send('start-game',{});
 const stamp={kind:'sticker',id:'s01',asset:'shortHair',x:.4,y:.5,scale:1,rotation:0,color:'#ff0000'};
 await a.send('place-sticker',stamp);
 assert.equal(b.received.some(x=>x.name==='place-sticker'),false,'standard room cannot use sticker');
 assert.equal(b.last('state').expanded,false);
 const secret=a.last('your-word');assert(secret);
 assert(!JSON.stringify(b.last('state')).includes(secret),'answer must remain secret');
 const c=channel.connect('c'),d=channel.connect('d');
 created=await c.send('create-room',{name:'擴充房主',expanded:true,rounds:1,seconds:60});
 await d.send('join-room',{name:'猜題人',code:created.code});
 await c.send('start-game',{});
 assert.equal(d.last('state').expanded,true);
 await d.send('place-sticker',stamp);
 assert.equal(c.received.some(x=>x.name==='place-sticker'),false,'non-drawer cannot stamp');
 await c.send('place-sticker',stamp);
 assert.equal(d.last('place-sticker').asset,'shortHair');
 const count=d.received.filter(x=>x.name==='place-sticker').length;
 await c.send('place-sticker',{...stamp,asset:'untrusted'});
 assert.equal(d.received.filter(x=>x.name==='place-sticker').length,count,'unknown assets must be blocked');
 await c.send('undo-stroke');
 assert.deepEqual(d.last('board-state'),[],'undo should remove sticker');
 await c.send('place-sticker',{...stamp,id:'s02',asset:'house'});
 await c.send('clear-board');
 assert(d.received.some(x=>x.name==='board-reset'));
 console.log('PASS: standard/expanded settings, sync, authorization, stamp whitelist, undo, clear, secret word');
 process.exit(0);
})().catch(err=>{console.error(err);process.exit(1);});
