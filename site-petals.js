/* 軍一補救教室：黑綠 = 華麗落花；藍白 = 遠近景深落雪。
   Canvas 2D 精靈緩存 + 視口自適應 + 隱藏分頁暫停，不要求其他套件。 */
(()=>{
 'use strict';
 if(document.getElementById('junyi-petal-layer'))return;
 const root=document.documentElement;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=window.matchMedia('(max-width: 700px)');
 const atmosphere=document.createElement('div');atmosphere.id='junyi-atmosphere';atmosphere.setAttribute('aria-hidden','true');
 atmosphere.innerHTML='<div class="junyi-halo"></div><div class="junyi-orbit junyi-orbit--a"></div><div class="junyi-orbit junyi-orbit--b"></div><div class="junyi-orbit junyi-orbit--c"></div><div class="junyi-lens junyi-lens--a"></div><div class="junyi-lens junyi-lens--b"></div>';
 const layer=document.createElement('div');layer.id='junyi-petal-layer';layer.setAttribute('aria-hidden','true');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');layer.append(canvas);
 document.body.append(atmosphere,layer);
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const rand=(a,b)=>a+Math.random()*(b-a);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let width=0,height=0,dpr=1,particles=[],sprites={},theme='',frame=0,then=0,visible=true,animation=0;
 const isSnow=()=>['light','sky'].includes(root.getAttribute('data-theme'));
 function sprite(kind,size,tone){
   const s=Math.ceil(size*3.2+12),off=document.createElement('canvas');off.width=off.height=s;
   const c=off.getContext('2d');if(!c)return off;
   const x=s/2,y=s/2;c.translate(x,y);
   if(kind==='petal'){
     c.rotate(-.37);
     c.shadowColor=tone?'rgba(255,208,238,.55)':'rgba(252,185,218,.45)';c.shadowBlur=size*.36;
     const grad=c.createLinearGradient(-size/2,-size/2,size/2,size/2);
     grad.addColorStop(0,tone?'#fff5fb':'#fceaf3');grad.addColorStop(.45,tone?'#ffd8e9':'#f9b6d4');grad.addColorStop(1,tone?'#ed9abe':'#dd779f');
     c.fillStyle=grad;c.beginPath();c.moveTo(-size*.46,-size*.13);
     c.bezierCurveTo(-size*.15,-size*.64,size*.43,-size*.47,size*.49,-size*.15);
     c.bezierCurveTo(size*.63,size*.20,size*.12,size*.53,-size*.08,size*.42);
     c.bezierCurveTo(-size*.20,size*.24,-size*.31,.09*size,-size*.46,-size*.13);
     c.closePath();c.fill();c.shadowBlur=0;
     c.lineWidth=Math.max(.4,size*.028);c.strokeStyle='rgba(178,84,123,.19)';c.beginPath();c.moveTo(-size*.4,-size*.14);c.quadraticCurveTo(size*.02,size*.12,size*.23,size*.27);c.stroke();
     c.fillStyle='rgba(255,255,255,.32)';c.beginPath();c.ellipse(-size*.14,-size*.23,size*.24,size*.06,-.42,0,Math.PI*2);c.fill();
   }else if(kind==='crystal'){
     c.shadowColor='rgba(109,178,251,.35)';c.shadowBlur=size*.34;
     c.strokeStyle=tone?'rgba(129,185,230,.91)':'rgba(184,223,255,.92)';c.lineWidth=Math.max(.9,size*.09);c.lineCap='round';
     for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(0,-size*.55);c.moveTo(0,-size*.34);c.lineTo(-size*.13,-size*.45);c.moveTo(0,-size*.34);c.lineTo(size*.13,-size*.45);c.stroke();c.restore()}
     c.fillStyle='#fff';c.beginPath();c.arc(0,0,Math.max(.6,size*.075),0,Math.PI*2);c.fill();
   }else{
     const g=c.createRadialGradient(0,0,0,0,0,size*.55);
     if(tone){g.addColorStop(0,kind==='snow'?'rgba(97,160,220,.9)':'rgba(255,255,255,.95)');g.addColorStop(.28,'rgba(247,252,255,.88)');g.addColorStop(1,'rgba(173,211,249,0)')}
     else{g.addColorStop(0,'rgba(231,255,247,.89)');g.addColorStop(.24,'rgba(115,244,206,.5)');g.addColorStop(1,'rgba(72,220,185,0)')}
     c.fillStyle=g;c.beginPath();c.arc(0,0,size*.55,0,2*Math.PI);c.fill();
   }
   return off;
 }
 function buildSprites(){sprites={};for(const type of ['petal','crystal','glow','snow'])for(const tier of [0,1,2]){
   const base=type==='petal'?[11,18,25][tier]:type==='crystal'?[9,15,21][tier]:type==='snow'?[7,11,15][tier]:[12,20,32][tier];
   sprites[type+tier]=sprite(type,base,theme==='snow');}}
 function make(i,init){
   const snow=theme==='snow',count=snow?(mobile.matches?46:95):(mobile.matches?24:51);
   const depth=i%3, kind=snow?(i%5===0?'crystal':i%8===0?'glow':'snow'):(i%9===0?'glow':'petal');
   const p={depth,kind,x:rand(0,width),y:init?rand(-height,height):rand(-90,-15),angle:rand(0,Math.PI*2),phase:rand(0,Math.PI*2),speed:0,radius:0,opacity:0,spin:0,scale:0};
   p.speed=(snow?[13,30,54]:[15,31,58])[depth]*rand(.7,1.3);
   p.radius=rand(5,17)*(depth+1)/2;
   p.spin=rand(-.8,.8);p.opacity=(snow?[.28,.49,.74]:[.27,.53,.72])[depth]*rand(.7,1);
   p.scale=rand(.62,1.25);p.phase+=count*.001;
   return p;
 }
 function resize(){
   width=Math.max(1,window.innerWidth);height=Math.max(1,window.innerHeight);
   dpr=Math.min(window.devicePixelRatio||1,mobile.matches?1.25:1.65);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   const target=theme==='snow'?(mobile.matches?46:95):(mobile.matches?24:51);
   particles=Array.from({length:target},(_,i)=>make(i,true));
   if(reduce.matches)drawStatic();
 }
 function setTheme(){const next=isSnow()?'snow':'petals';if(theme===next)return;theme=next;buildSprites();resize();}
 function draw(p,t,staticMode=false){
   const snow=theme==='snow';
   const sway=Math.sin(t*(snow?.00054:.00075)+p.phase+p.y*.002)*p.radius;
   const x=p.x+sway,y=p.y;
   if(x<-50||x>width+50||y<-50||y>height+50)return;
   ctx.save();ctx.globalAlpha=p.opacity;ctx.translate(x,y);
   if(snow){
     if(p.kind==='crystal'){
       ctx.rotate(p.angle);const spr=sprites['crystal'+p.depth];
       const s=(p.depth+1)*.38*p.scale;ctx.drawImage(spr,-spr.width*s/2,-spr.height*s/2,spr.width*s,spr.height*s);
     }else if(p.kind==='glow'){
       const spr=sprites['glow'+p.depth];const s=p.scale*(p.depth+1)*.55;
       ctx.drawImage(spr,-spr.width*s/2,-spr.height*s/2,spr.width*s,spr.height*s);
     }else{
       const spr=sprites['snow'+p.depth];const s=p.scale*(p.depth+1)*.27;
       ctx.drawImage(spr,-spr.width*s/2,-spr.height*s/2,spr.width*s,spr.height*s);
     }
   }else{
     ctx.rotate(p.angle+Math.sin(t*.0017+p.phase)*.32);
     const spr=sprites[(p.kind==='glow'?'glow':'petal')+p.depth];
     const sizeScale=p.scale*(p.kind==='glow'?.9:1);
     ctx.scale(Math.cos(p.angle*.61)*.24+.8,1);
     ctx.drawImage(spr,-spr.width*sizeScale/2,-spr.height*sizeScale/2,spr.width*sizeScale,spr.height*sizeScale);
   }
   ctx.restore();
 }
 function drawStatic(){ctx.clearRect(0,0,width,height);particles.forEach(p=>draw(p,0,true));}
 function drawFrame(ts){
   animation=0;if(document.hidden||!visible)return;
   if(theme!==(isSnow()?'snow':'petals'))setTheme();
   if(reduce.matches){drawStatic();return;}
   const minFrame=mobile.matches?1000/26:1000/42;
   if(ts-then<minFrame){animation=requestAnimationFrame(drawFrame);return;}
   const delta=clamp((ts-then)/1000,0,.05);then=ts;
   ctx.clearRect(0,0,width,height);
   for(let i=0;i<particles.length;i++){
     const p=particles[i];p.y+=p.speed*delta;
     p.x+=Math.sin(ts*.00033+p.phase)*delta*(theme==='snow'?4:10);
     p.angle+=p.spin*delta;
     if(p.y>height+45||p.x>width+80||p.x<-80)particles[i]=make(i,false);
     draw(p,ts);
   }
   animation=requestAnimationFrame(drawFrame);
 }
 function start(){cancelAnimationFrame(animation);animation=0;if(document.hidden||!visible)return;then=performance.now();if(reduce.matches)drawStatic();else animation=requestAnimationFrame(drawFrame)}
 function visibility(){const hidden=document.hidden;layer.hidden=hidden;atmosphere.hidden=hidden;if(hidden){cancelAnimationFrame(animation);animation=0;}else start()}
 const watcher=new MutationObserver(()=>{setTheme();if(reduce.matches)drawStatic()});watcher.observe(root,{attributes:true,attributeFilter:['data-theme']});
 window.addEventListener('resize',()=>{resize();start()},{passive:true});
 document.addEventListener('visibilitychange',visibility);
 if(reduce.addEventListener)reduce.addEventListener('change',start);
 setTheme();visibility();
})();
