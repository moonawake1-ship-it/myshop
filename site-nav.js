/* JUNYI · shared navigation, one audio instance, one click sound source */
(()=>{'use strict';
const q=(id)=>document.getElementById(id), nav=q('site-nav');if(!nav)return;
const page=location.pathname.split('/').pop()||'index.html';
nav.querySelectorAll('.site-links a').forEach(a=>{if(a.getAttribute('href')?.split('?')[0]===page)a.setAttribute('aria-current','page');const icon=a.querySelector('span:not(.site-word)');if(icon)icon.classList.add('nav-symbol');});
const themeBtn=q('site-theme-toggle');let stored='dark';try{stored=localStorage.getItem('junyi-theme')||'dark'}catch(_){ }
if(stored==='dark'||stored==='light')document.documentElement.dataset.theme=stored;
function themeUI(){if(themeBtn){const light=document.documentElement.dataset.theme==='light';themeBtn.textContent=light?'☀':'☾';themeBtn.title=light?'切換到黑綠模式':'切換到藍白模式';themeBtn.setAttribute('aria-label',themeBtn.title)}}
themeUI();themeBtn?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;try{localStorage.setItem('junyi-theme',next)}catch(_){}themeUI();});
let audio=q('bg-music');if(!audio){audio=document.createElement('audio');audio.id='bg-music';audio.src='music.mp3';document.body.append(audio)}
if(!audio.getAttribute('src'))audio.src='music.mp3';audio.loop=true;audio.preload='metadata';
let state={};try{state=JSON.parse(sessionStorage.getItem('junyi-music')||'{}')||{}}catch(_){};
let volume=.52;try{const n=Number(localStorage.getItem('junyi-volume'));if(Number.isFinite(n)&&n>=0&&n<=1)volume=n}catch(_){}audio.volume=volume;
const disc=q('site-music-toggle'),seek=q('site-seek-bar'),current=q('site-current-time'),total=q('site-total-time'),player=nav.querySelector('.site-player');
const fmt=n=>Number.isFinite(n)&&n>=0?`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`:'--:--';
let seeking=false,restored=false;
if(disc){disc.innerHTML='<span aria-hidden="true">▶</span>';}
if(player){const title=document.createElement('span');title.className='site-player-note';title.textContent='LISTEN · 音樂';title.setAttribute('aria-hidden','true');const t=player.querySelector('.site-progress');t?.prepend(title);
const vb=document.createElement('button');vb.type='button';vb.className='site-volume-toggle';vb.title='調整音量';vb.setAttribute('aria-label','調整背景音樂音量');vb.textContent='◖))';player.append(vb);
const pop=document.createElement('div');pop.className='site-volume';pop.innerHTML='<label for="junyi-music-volume">背景音樂音量</label><input id="junyi-music-volume" type="range" min="0" max="100" value="'+Math.round(volume*100)+'" aria-label="背景音樂音量">';player.append(pop);vb.addEventListener('click',()=>{pop.classList.toggle('is-open');vb.setAttribute('aria-expanded',String(pop.classList.contains('is-open')))});
pop.querySelector('input').addEventListener('input',e=>{audio.volume=Number(e.target.value)/100;try{localStorage.setItem('junyi-volume',String(audio.volume))}catch(_){} });
document.addEventListener('pointerdown',e=>{if(!player.contains(e.target))pop.classList.remove('is-open')},{passive:true});}
function restore(){if(restored)return;restored=true;if(Number.isFinite(audio.duration)&&audio.duration>0&&Number.isFinite(state.position)&&Date.now()-state.when<8*60*1000){try{audio.currentTime=Math.max(0,Math.min(state.position,audio.duration-.2))}catch(_){}}}
function display(){if(!disc)return;const playing=!audio.paused;disc.classList.toggle('playing',playing);disc.setAttribute('aria-pressed',String(playing));disc.setAttribute('aria-label',playing?'暫停背景音樂':'播放背景音樂');disc.querySelector('span').textContent=playing?'Ⅱ':'▶';if(current)current.textContent=fmt(audio.currentTime);if(total)total.textContent=fmt(audio.duration);if(seek){if(Number.isFinite(audio.duration)&&audio.duration>0){seek.disabled=false;if(!seeking)seek.value=String(Math.round(100*audio.currentTime/audio.duration))}else{seek.disabled=true;seek.value=0}}}
audio.addEventListener('loadedmetadata',()=>{restore();display()});['timeupdate','play','pause','durationchange','ended','canplay'].forEach(evt=>audio.addEventListener(evt,display));
audio.addEventListener('error',()=>{if(total)total.textContent='--:--';if(disc)disc.title='背景音樂載入失敗：請確認 music.mp3';});
disc?.addEventListener('click',async()=>{if(!audio.paused){audio.pause();display();return}try{await audio.play();restore()}catch(e){console.warn('音樂未播放',e);disc.title='瀏覽器未允許播放；請再次點擊'}display()});
seek?.addEventListener('input',()=>{seeking=true;if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=audio.duration*Number(seek.value)/100;display()}});seek?.addEventListener('change',()=>{seeking=false;display()});
window.addEventListener('pagehide',()=>{try{sessionStorage.setItem('junyi-music',JSON.stringify({position:audio.currentTime,when:Date.now(),playing:!audio.paused}))}catch(_){} });
if(state.playing&&Date.now()-state.when<8*60*1000){document.addEventListener('pointerdown',e=>{if(e.target.closest('#site-music-toggle'))return;if(audio.paused)audio.play().catch(()=>{});},{once:true,passive:true});}
display();
// 10KB POP：Web Audio 預解碼，降低連續點擊與影片同時播放時的卡頓；失敗才使用 MP3 備援。
let ctx=null,buffer=null,loading=null,last=0;const fallback=new Audio('pop.mp3');fallback.preload='none';fallback.volume=.34;
function prime(){if(loading)return;loading=(async()=>{try{ctx=new (window.AudioContext||window.webkitAudioContext)();const res=await fetch('pop.mp3');if(!res.ok)throw Error('no pop');buffer=await ctx.decodeAudioData(await res.arrayBuffer())}catch(_){buffer=null}})()}
function pop(){if(performance.now()-last<85)return;last=performance.now();prime();if(buffer&&ctx){ctx.resume().catch(()=>{});const source=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.28;source.buffer=buffer;source.connect(gain).connect(ctx.destination);source.start()}else{try{fallback.pause();fallback.currentTime=0;fallback.play().catch(()=>{})}catch(_){}}}
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,[role="button"]'))pop()},{passive:true});
})();
