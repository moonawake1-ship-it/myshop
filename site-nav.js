/* JUNYI · shared navigation, one audio instance, one click sound source */
(()=>{'use strict';
const q=(id)=>document.getElementById(id), nav=q('site-nav');if(!nav)return;
const page=location.pathname.split('/').pop()||'index.html';
nav.querySelectorAll('.site-links a').forEach(a=>{if(a.getAttribute('href')?.split('?')[0]===page)a.setAttribute('aria-current','page');const icon=a.querySelector('span:not(.site-word)');if(icon)icon.classList.add('nav-symbol');});
const themeBtn=q('site-theme-toggle');let stored='dark';try{stored=localStorage.getItem('junyi-theme')||'dark'}catch(_){ }
if(stored==='dark'||stored==='light')document.documentElement.dataset.theme=stored;
function themeUI(){if(themeBtn){const light=document.documentElement.dataset.theme==='light';themeBtn.textContent=light?'☀':'☾';themeBtn.title=light?'切換到黑綠模式':'切換到藍白模式';themeBtn.setAttribute('aria-label',themeBtn.title)}}
themeUI();themeBtn?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;try{localStorage.setItem('junyi-theme',next)}catch(_){}themeUI();});
// 恢復最初版黑膠唱片介面；播放只使用一個 <audio> 實例。
// 修正舊版 Number(null) === 0 導致所有新訪客被意外設定靜音。
let audio=q('bg-music');
if(!audio){audio=document.createElement('audio');audio.id='bg-music';document.body.append(audio);}
if(!audio.getAttribute('src'))audio.src='music.mp3';
audio.loop=true;audio.preload='metadata';audio.muted=false;
// 原始唱片模板並沒有音量旋鈕，採舒適的預設音量，避免先前儲存的錯誤 0 音量。
let savedVolume=null;try{savedVolume=localStorage.getItem('junyi-volume')}catch(_){ }
let volume=savedVolume!==null ? Number(savedVolume) : .72;
if(!Number.isFinite(volume)||volume<=0||volume>1)volume=.72;
audio.volume=volume;
const disc=q('site-music-toggle'),seek=q('site-seek-bar'),current=q('site-current-time'),total=q('site-total-time'),player=nav.querySelector('.site-player');
const fmt=n=>Number.isFinite(n)&&n>=0?`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`:'--:--';
let seeking=false,restored=false,playPromise=null;
if(disc){disc.innerHTML='<span aria-hidden="true"></span>';disc.title='播放背景音樂';}
let state={};try{state=JSON.parse(sessionStorage.getItem('junyi-music')||'{}')||{}}catch(_){ }
function restore(){
 if(restored||!Number.isFinite(audio.duration)||audio.duration<=0)return;
 restored=true;
 if(Number.isFinite(state.position)&&Date.now()-state.when<8*60*1000){
   try{audio.currentTime=Math.max(0,Math.min(state.position,audio.duration-.15))}catch(_){ }
 }
}
function display(){
 if(disc){const playing=!audio.paused;disc.classList.toggle('playing',playing);
   disc.setAttribute('aria-pressed',String(playing));disc.setAttribute('aria-label',playing?'暫停背景音樂':'播放背景音樂');
   disc.title=playing?'暫停背景音樂':'播放背景音樂';}
 if(current)current.textContent=fmt(audio.currentTime);
 if(total)total.textContent=fmt(audio.duration);
 if(seek){const d=audio.duration;if(Number.isFinite(d)&&d>0){seek.disabled=false;if(!seeking)seek.value=String(Math.round(100*audio.currentTime/d));}else{seek.disabled=true;seek.value='0';}}
}
function audioNotice(message){
 if(!player)return;
 let el=player.querySelector('.music-feedback');
 if(!el){el=document.createElement('span');el.className='music-feedback';el.setAttribute('role','status');player.append(el);}
 el.textContent=message;
 clearTimeout(audioNotice.timer);
 audioNotice.timer=setTimeout(()=>{if(el.textContent===message)el.textContent=''},5000);
}
async function playMusic(){
 try{if(audio.muted)audio.muted=false;if(audio.volume===0)audio.volume=.72;
   await audio.play();display();return true;
 }catch(err){console.warn('背景音樂無法播放',err);
   audioNotice(err?.name==='NotAllowedError'?'請再點唱片啟動音樂':'音樂未能載入，請檢查 music.mp3');display();return false;}
}
audio.addEventListener('loadedmetadata',()=>{restore();display()});
['timeupdate','play','pause','durationchange','ended','canplay','volumechange'].forEach(evt=>audio.addEventListener(evt,display));
audio.addEventListener('error',()=>{audioNotice('music.mp3 載入失敗');display();});
disc?.addEventListener('click',()=>{if(!audio.paused){audio.pause();display();return;}if(!playPromise){playPromise=playMusic().finally(()=>playPromise=null);}});
seek?.addEventListener('input',()=>{seeking=true;if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=audio.duration*Number(seek.value)/100;display();}});
seek?.addEventListener('change',()=>{seeking=false;display();});
window.addEventListener('pagehide',()=>{try{sessionStorage.setItem('junyi-music',JSON.stringify({position:audio.currentTime,when:Date.now(),playing:!audio.paused}))}catch(_){}});
// 瀏覽器不允許換頁時自動播放；保留時間點，在下次使用者點擊後恢復。
if(state.playing&&Date.now()-state.when<8*60*1000){document.addEventListener('pointerdown',e=>{if(e.target.closest('#site-music-toggle'))return;if(audio.paused)void playMusic();},{once:true,passive:true});}
display();
// 10KB POP：Web Audio 預解碼，降低連續點擊與影片同時播放時的卡頓；失敗才使用 MP3 備援。
let ctx=null,buffer=null,loading=null,last=0;const fallback=new Audio('pop.mp3');fallback.preload='none';fallback.volume=.34;
function prime(){if(loading)return;loading=(async()=>{try{ctx=new (window.AudioContext||window.webkitAudioContext)();const res=await fetch('pop.mp3');if(!res.ok)throw Error('no pop');buffer=await ctx.decodeAudioData(await res.arrayBuffer())}catch(_){buffer=null}})()}
function pop(){if(performance.now()-last<85)return;last=performance.now();prime();if(buffer&&ctx){ctx.resume().catch(()=>{});const source=ctx.createBufferSource(),gain=ctx.createGain();gain.gain.value=.28;source.buffer=buffer;source.connect(gain).connect(ctx.destination);source.start()}else{try{fallback.pause();fallback.currentTime=0;fallback.play().catch(()=>{})}catch(_){}}}
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,[role="button"]'))pop()},{passive:true});
})();
