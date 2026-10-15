/* 軍一補救教室：全站常駐落花，無開關、無滑鼠跟隨、不攔截互動。 */
(function(){
  'use strict';
  if(document.getElementById('junyi-petal-layer'))return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');
  layer.id='junyi-petal-layer';layer.setAttribute('aria-hidden','true');
  document.body.appendChild(layer);
  const narrow=window.matchMedia('(max-width:680px)').matches;
  const amount=narrow?7:13;
  const fragment=document.createDocumentFragment();
  for(let i=0;i<amount;i++){
    const p=document.createElement('span');p.className='junyi-petal';
    p.style.left=((i*37+12)%97)+'%';p.style.setProperty('--static-top',((i*17+10)%85)+'%');
    p.style.setProperty('--duration',(11+(i*7)%10)+'s');
    p.style.setProperty('--delay',(-2*i-.6*(i%4))+'s');
    p.style.setProperty('--drift',((i%2?1:-1)*(25+13*(i%5)))+'px');
    p.style.width=(9+i%5*2)+'px';p.style.height=(7+i%4*2)+'px';
    fragment.appendChild(p);
  }
  layer.appendChild(fragment);
  function refresh(){layer.hidden=document.hidden;}
  document.addEventListener('visibilitychange',refresh);
  if(media.addEventListener)media.addEventListener('change',refresh);
  refresh();
})();
