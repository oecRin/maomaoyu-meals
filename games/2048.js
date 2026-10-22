/* 猫猫鱼 2048 —— 纯原生 JS。存档：localStorage maomaoyu-2048-v1 */
(()=>{'use strict';
const KEY='maomaoyu-2048-v1',N=4,SLIDE=120;
const TIERS={2:['🐟','小鱼干','#fff3df','#8a5a3c'],4:['🐠','热带鱼','#ffe2c2','#8a5a3c'],8:['🦐','小虾米','#ffc58f','#fff'],16:['🐡','河豚','#ffa66e','#fff'],32:['🦀','螃蟹','#ff8a6b','#fff'],64:['🦑','鱿鱼','#f2665a','#fff'],
 128:['🐙','章鱼','#f7d36b','#7a4a20'],256:['🐱','小猫','#f4bf45','#fff'],512:['😺','橘猫','#9cc8f0','#fff'],1024:['😸','胖橘','#7fa3e0','#fff'],2048:['👑','猫猫王','#f08ab0','#fff']};
const tier=v=>TIERS[v]||['🌟','传说猫','#8a6ad8','#fff'];
const $=s=>document.querySelector(s),tilesEl=$('#tiles'),board=$('#board');
let grid,score=0,best=0,won=false,keep=false,prev=null,uid=1,pending=[],els=new Map();
// ---------- 存档 ----------
function save(){try{localStorage.setItem(KEY,JSON.stringify({cells:vals(),score,best,won,keep,prev}));}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&Array.isArray(d.cells)&&d.cells.length===N){best=d.best|0;if(d.cells.flat().some(v=>v)){setVals(d.cells);score=d.score|0;won=!!d.won;keep=!!d.keep;prev=d.prev||null;return true;}}}catch(e){}return false;}
const vals=()=>grid.map(r=>r.map(t=>t?t.v:0));
function setVals(c){grid=c.map(r=>r.map(v=>v?{id:uid++,v}:null));}
// ---------- 规则 ----------
function empties(){const e=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!grid[r][c])e.push([r,c]);return e;}
function spawn(){const e=empties();if(!e.length)return null;const[r,c]=e[Math.random()*e.length|0];const t={id:uid++,v:Math.random()<.9?2:4};grid[r][c]=t;return t;}
function canMove(){if(empties().length)return true;for(let r=0;r<N;r++)for(let c=0;c<N;c++){const v=grid[r][c].v;if(c<N-1&&grid[r][c+1].v===v||r<N-1&&grid[r+1][c].v===v)return true;}return false;}
function line(dir,i){const a=[];for(let k=0;k<N;k++){const j=(dir==='R'||dir==='D')?N-1-k:k;a.push(dir==='L'||dir==='R'?[i,j]:[j,i]);}return a;}
function move(dir){
 flush();if(!$('#over').hidden||!$('#win').hidden)return false;
 const before={cells:vals(),score,won,keep};let moved=false,gain=0;const ng=grid.map(r=>r.map(()=>null)),gone=[],pops=[];
 for(let i=0;i<N;i++){const cells=line(dir,i),out=[];
  for(const[r,c]of cells){const t=grid[r][c];if(!t)continue;const last=out[out.length-1];
   if(last&&last.t.v===t.v&&!last.m){last.m=true;last.ab=t;}else out.push({t,m:false,from:[r,c]});}
  out.forEach((o,k)=>{const[r,c]=cells[k];if(o.from[0]!==r||o.from[1]!==c||o.m)moved=true;ng[r][c]=o.t;o.t.r=r;o.t.c=c;
   if(o.m){o.ab.r=r;o.ab.c=c;gone.push(o.ab);o.t.v*=2;gain+=o.t.v;pops.push(o.t);}});}
 if(!moved)return false;
 prev=before;grid=ng;score+=gain;if(score>best)best=score;
 const t=spawn();render({gone,pops,spawned:t});
 if(gain)showGain(gain);
 if(!won&&pops.some(p=>p.v>=2048)){won=true;later(()=>$('#win').hidden=false,350);}
 else if(!canMove())later(()=>$('#over').hidden=false,400);
 save();updUI();return true;}
function undo(){if(!prev)return;flush();setVals(prev.cells);score=prev.score;won=prev.won;keep=prev.keep;prev=null;$('#over').hidden=true;$('#win').hidden=true;render(null,true);save();updUI();}
function newGame(){flush();setVals([[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);score=0;won=false;keep=false;prev=null;spawn();spawn();$('#over').hidden=true;$('#win').hidden=true;render(null,true);save();updUI();}
// ---------- 绘制 ----------
function later(f,ms){const o={f,h:setTimeout(()=>{pending=pending.filter(x=>x!==o);f();},ms)};pending.push(o);}
function flush(){const p=pending;pending=[];p.forEach(o=>{clearTimeout(o.h);o.f();});}
function paint(el,v){const[e,l,bg,fg]=tier(v),d=String(v).length;el.className='tile v'+v+(v>2048?' big':'');el.style.setProperty('--bg',bg);el.style.setProperty('--fg',fg);
 el.style.setProperty('--fs',d<=2?'10cqw':d===3?'8.4cqw':d===4?'6.6cqw':'5.2cqw');el.dataset.v=v;
 el.innerHTML=`<div class="in"><span class="e" aria-hidden="true">${e}</span><span class="n">${v}</span><span class="l">${l}</span></div>`;}
function place(el,r,c){el.style.setProperty('--r',r);el.style.setProperty('--c',c);}
function mk(t,cls){const el=document.createElement('div');paint(el,t.v);if(cls)el.classList.add(cls);place(el,t.r,t.c);tilesEl.appendChild(el);els.set(t.id,el);return el;}
function render(fx,full){
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){const t=grid[r][c];if(t){t.r=r;t.c=c;}}
 if(full){tilesEl.innerHTML='';els.clear();grid.flat().forEach(t=>t&&mk(t));updLadder();return;}
 const popIds=new Set(fx.pops.map(t=>t.id));
 for(const t of grid.flat()){if(!t||t===fx.spawned)continue;const el=els.get(t.id);if(!el){mk(t);continue;}place(el,t.r,t.c);}
 for(const t of fx.gone){const el=els.get(t.id);if(el){el.classList.add('gone');place(el,t.r,t.c);els.delete(t.id);later(()=>el.remove(),SLIDE);}}
 for(const t of fx.pops){const el=els.get(t.id),v=t.v;later(()=>{paint(el,v);el.classList.add('pop');},SLIDE);}
 if(fx.spawned){const t=fx.spawned;later(()=>mk(t,'new'),SLIDE);}
 updLadder();}
function showGain(g){const e=$('#gain');e.textContent='+'+g;e.classList.remove('go');void e.offsetWidth;e.classList.add('go');}
function updUI(){$('#score').textContent=score;$('#best').textContent=best;$('#undo').disabled=!prev;$('#over-undo').disabled=!prev;}
const ladder=$('#ladder');Object.keys(TIERS).forEach(v=>{const[e,l,bg,fg]=TIERS[v],li=document.createElement('li');li.dataset.v=v;li.style.setProperty('--bg',bg);li.style.setProperty('--fg',fg);li.innerHTML=`<span aria-hidden="true">${e}</span>${v}`;li.title=l;ladder.appendChild(li);});
function updLadder(){const m=Math.max(...vals().flat());ladder.querySelectorAll('li').forEach(li=>{const v=+li.dataset.v;li.classList.toggle('got',v<=m);li.classList.toggle('top',v===m);});}
$('#board .cells').innerHTML=Array.from({length:16},(_,i)=>`<i style="transform:translate(calc(var(--g) + ${i%4}*(100cqw - var(--g))/4),calc(var(--g) + ${i/4|0}*(100cqw - var(--g))/4))"></i>`).join('');
// ---------- 输入 ----------
const KEYS={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',a:'L',d:'R',w:'U',s:'D',A:'L',D:'R',W:'U',S:'D'};
addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 if(KEYS[e.key]){e.preventDefault();move(KEYS[e.key]);}else if(e.key==='z'||e.key==='Z'){undo();}});
let sx=0,sy=0,sid=null;
board.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;sid=e.pointerId;sx=e.clientX;sy=e.clientY;});
board.addEventListener('pointerup',e=>{if(e.pointerId!==sid)return;sid=null;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
 move(Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U'));});
board.addEventListener('pointercancel',()=>sid=null);
$('#new').onclick=$('#win-new').onclick=$('#over-new').onclick=()=>newGame();
$('#undo').onclick=$('#over-undo').onclick=()=>undo();
$('#keep').onclick=()=>{keep=true;$('#win').hidden=true;save();board.focus();};
if(load()){render(null,true);updUI();if(!canMove())$('#over').hidden=false;}else newGame();
// 测试钩子
window.G2048={vals,move,undo,newGame,set(c,s=0){flush();setVals(c);score=s;prev=null;won=false;$('#over').hidden=true;$('#win').hidden=true;render(null,true);updUI();if(!canMove())$('#over').hidden=false;},score:()=>score,best:()=>best};
})();
