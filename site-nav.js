/* 共用頁首：單一播放器、獨立音樂狀態，不影響原有登入/聊天/遊戲。 */
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  const nav=get('site-nav');if(!nav)return;
  const path=(location.pathname.split('/').pop()||'index.html');
  nav.querySelectorAll('.site-links a').forEach(a=>{if(a.getAttribute('href').split('?')[0]===path)a.setAttribute('aria-current','page')});
  const theme=get('site-theme-toggle');
  const subpage=document.body.classList.contains('site-subpage');
  let stored=null;try{stored=localStorage.getItem('junyi-theme')}catch(_){}
  if((stored==='dark'||stored==='light')&&!subpage)document.documentElement.setAttribute('data-theme',stored);
  function updateTheme(){theme.textContent=document.documentElement.getAttribute('data-theme')==='light'?'☀️':'🌙'}
  updateTheme();theme.addEventListener('click',()=>{
    const next=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
    document.documentElement.setAttribute('data-theme',next);
    try{localStorage.setItem('junyi-theme',next)}catch(_){}
    updateTheme();
  });
  let audio=get('bg-music');
  if(!audio){audio=document.createElement('audio');audio.id='bg-music';audio.src='music.mp3';document.body.appendChild(audio)}
  if(!audio.getAttribute('src'))audio.src='music.mp3';
  audio.loop=true;
  audio.preload='metadata';
  audio.volume=.55;
  const disc=get('site-music-toggle'),slider=get('site-seek-bar'),current=get('site-current-time'),duration=get('site-total-time');
  const time=s=>Number.isFinite(s)&&s>=0?String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0'):'--:--';
  let seeking=false;
  function refresh(){
    if(!current||!duration||!slider||!disc)return;
    current.textContent=time(audio.currentTime);
    if(Number.isFinite(audio.duration)&&audio.duration>0){
      duration.textContent=time(audio.duration);
      if(!seeking)slider.value=String(Math.max(0,Math.min(100,100*audio.currentTime/audio.duration)));
      slider.disabled=false;
    }else{duration.textContent='--:--';slider.disabled=true}
    const playing=!audio.paused;
    disc.classList.toggle('playing',playing);
    disc.setAttribute('aria-pressed',String(playing));
    disc.setAttribute('aria-label',playing?'暫停背景音樂':'播放背景音樂');
    disc.title=playing?'暫停背景音樂':'播放背景音樂';
  }
  let saved={};
  try{saved=JSON.parse(sessionStorage.getItem('junyi-music')||'{}')||{}}catch(_){}
  const fresh=Number.isFinite(saved.when)&&Date.now()-saved.when<10*60*1000;
  let restored=false;
  function restore(){if(restored||!fresh||!Number.isFinite(saved.position)||!Number.isFinite(audio.duration)||audio.duration<=0)return;
    restored=true;audio.currentTime=Math.max(0,Math.min(saved.position,audio.duration-.2));refresh();}
  audio.addEventListener('loadedmetadata',restore);
  ['loadedmetadata','durationchange','timeupdate','play','pause','ended','waiting','canplay','error'].forEach(evt=>audio.addEventListener(evt,refresh));
  audio.addEventListener('error',()=>{disc.title='背景音樂載入失敗：請確認根目錄有 music.mp3';duration.textContent='音樂錯誤'});
  disc.addEventListener('click',async()=>{
    if(!audio.paused){audio.pause();refresh();return}
    try{await audio.play();restore()}catch(error){console.warn('背景音樂播放失敗',error);disc.title='請再點一次播放，或確認 music.mp3 能開啟'}
    refresh();
  });
  slider.addEventListener('input',()=>{seeking=true;if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=audio.duration*Number(slider.value)/100;refresh()}});
  slider.addEventListener('change',()=>{seeking=false;refresh()});
  function save(){try{sessionStorage.setItem('junyi-music',JSON.stringify({position:audio.currentTime,playing:!audio.paused,when:Date.now()}))}catch(_){}}
  window.addEventListener('pagehide',save);
  // 自動播放在部分瀏覽器會被封鎖；只在上一頁已播放時輕量嘗試，失敗仍由使用者按唱片播放。
  if(fresh&&saved.playing){const resume=(event)=>{if(event.target.closest('#site-music-toggle'))return;audio.play().catch(()=>{}).finally(refresh)};
    document.addEventListener('pointerdown',resume,{once:true,passive:true});}
  // metadata 非整首下載；用來在 AI 題庫、課程頁正確顯示歌曲長度。
  refresh();
  try{audio.load()}catch(_){}
  // 低音量原生 Web Audio click 音效，避免同時解碼多個 MP3。
  let ctx=null,lastPop=0;
  document.addEventListener('pointerdown',e=>{
    const target=e.target.closest('button,a,[role="button"]');
    if(!target||target.disabled||performance.now()-lastPop<110)return;
    lastPop=performance.now();
    try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      ctx=ctx||new Ctx();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const t=ctx.currentTime,osc=ctx.createOscillator(),vol=ctx.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(520,t);osc.frequency.exponentialRampToValueAtTime(270,t+.055);
      vol.gain.setValueAtTime(.024,t);vol.gain.exponentialRampToValueAtTime(.001,t+.075);
      osc.connect(vol);vol.connect(ctx.destination);osc.start(t);osc.stop(t+.08);
    }catch(_){}
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&ctx?.state==='running')ctx.suspend().catch(()=>{})});
})();
