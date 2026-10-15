/* 全站共用音樂播放器、主題與輕量點擊聲。無外部套件。 */
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const nav=$('site-nav'); if(!nav)return;
  const here=location.pathname.split('/').pop()||'index.html';
  nav.querySelectorAll('.site-links a').forEach(a=>{if((a.getAttribute('href')||'').split('?')[0]===here)a.setAttribute('aria-current','page')});
  const themeBtn=$('site-theme-toggle');
  let stored=null;try{stored=localStorage.getItem('junyi-theme')}catch(_){}
  if(stored==='dark'||stored==='light')document.documentElement.setAttribute('data-theme',stored);
  function themeIcon(){themeBtn.textContent=document.documentElement.getAttribute('data-theme')==='light'?'☀️':'🌙'}
  themeIcon();themeBtn.addEventListener('click',()=>{
    const next=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem('junyi-theme',next)}catch(_){}themeIcon();
  });
  let music=$('bg-music');
  if(!music){music=document.createElement('audio');music.id='bg-music';music.src='music.mp3';music.preload='none';document.body.appendChild(music)}
  music.loop=true;music.preload='none';
  const disc=$('site-music-toggle'),range=$('site-seek-bar'),elapsed=$('site-current-time'),total=$('site-total-time');
  const time=s=>Number.isFinite(s)?`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`:'--:--';
  let seeking=false;
  const refresh=()=>{
    elapsed.textContent=time(music.currentTime);
    total.textContent=time(music.duration);
    if(!seeking&&Number.isFinite(music.duration)&&music.duration>0)range.value=String((music.currentTime/music.duration)*100);
    const playing=!music.paused;disc.classList.toggle('playing',playing);disc.setAttribute('aria-pressed',String(playing));disc.setAttribute('aria-label',playing?'暫停背景音樂':'播放背景音樂');
  };
  ['loadedmetadata','durationchange','timeupdate','play','pause','ended','error'].forEach(event=>music.addEventListener(event,refresh));
  music.addEventListener('error',()=>{disc.title='背景音樂無法載入，請確認 music.mp3 已上傳';});
  disc.addEventListener('click',async()=>{
    if(music.paused){try{await music.play()}catch(error){console.warn('背景音樂暫時無法播放',error);disc.title='無法播放背景音樂，請檢查瀏覽器媒體設定'}}
    else music.pause();refresh();
  });
  range.addEventListener('input',()=>{seeking=true; if(Number.isFinite(music.duration)&&music.duration>0){music.currentTime=(Number(range.value)/100)*music.duration;refresh()}});
  range.addEventListener('change',()=>{seeking=false;refresh()});
  refresh();
  // 音樂跨頁保留秒數與播放意願；新頁面需使用者點擊才能自動播放是正常瀏覽器限制。
  try{const saved=JSON.parse(sessionStorage.getItem('junyi-music')||'null');if(saved&&Date.now()-saved.when<120000&&saved.position>0){
    music.addEventListener('loadedmetadata',()=>{if(Number.isFinite(music.duration))music.currentTime=Math.min(music.duration-0.2,saved.position)},{once:true});
  }}catch(_){ }
  addEventListener('pagehide',()=>{try{sessionStorage.setItem('junyi-music',JSON.stringify({position:music.currentTime,when:Date.now()}))}catch(_){}});
  // 合成極短 pop，避免每次 click 建立一個 MP3 播放器、重複下載與重播卡頓。
  let audioCtx=null,lastPop=0;
  addEventListener('pointerdown',event=>{
    const target=event.target.closest('button,a,[role="button"]');
    if(!target || target.disabled || performance.now()-lastPop<95)return;
    lastPop=performance.now();
    try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
      if(!audioCtx)audioCtx=new Context();
      if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
      const t=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(510,t);osc.frequency.exponentialRampToValueAtTime(275,t+.055);
      gain.gain.setValueAtTime(.035,t);gain.gain.exponentialRampToValueAtTime(.001,t+.075);
      osc.connect(gain).connect(audioCtx.destination);osc.start(t);osc.stop(t+.08);
    }catch(_){ }
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&audioCtx&&audioCtx.state==='running')audioCtx.suspend().catch(()=>{})});
})();
