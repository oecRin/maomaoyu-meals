/* 猫猫鱼数独 —— 纯原生 JS。题目由随机终盘挖空生成，每挖一格都用求解器确认仍是唯一解。
   存档：localStorage maomaoyu-sudoku-v1 */
(()=>{'use strict';
const KEY='maomaoyu-sudoku-v1';
const DIFF={easy:{name:'简单',clues:40},medium:{name:'普通',clues:32},hard:{name:'困难',clues:25}};
const $=s=>document.querySelector(s);
const ROW=i=>i/9|0,COL=i=>i%9,BOX=i=>(ROW(i)/3|0)*3+(COL(i)/3|0);
const PEERS=Array.from({length:81},(_,i)=>{const s=new Set();for(let j=0;j<81;j++)if(j!==i&&(ROW(j)===ROW(i)||COL(j)===COL(i)||BOX(j)===BOX(i)))s.add(j);return[...s];});
// ---------- 求解器（位运算 + 最少候选优先） ----------
function countSolutions(g,limit=2,rand=false,out=null){
 const a=g.slice(),r=new Array(9).fill(0),c=new Array(9).fill(0),b=new Array(9).fill(0);
 for(let i=0;i<81;i++){const v=a[i];if(v){const m=1<<v;if(r[ROW(i)]&m||c[COL(i)]&m||b[BOX(i)]&m)return 0;r[ROW(i)]|=m;c[COL(i)]|=m;b[BOX(i)]|=m;}}
 let n=0;
 (function rec(){let best=-1,bm=0,bc=10;
  for(let i=0;i<81;i++)if(!a[i]){const m=~(r[ROW(i)]|c[COL(i)]|b[BOX(i)])&0x3fe;let k=0,x=m;while(x){x&=x-1;k++;}if(k<bc){bc=k;best=i;bm=m;if(k<2)break;}}
  if(best<0){n++;if(out&&n===1)out.push(...a);return n>=limit;}
  if(!bm)return false;
  const ds=[];for(let v=1;v<=9;v++)if(bm&1<<v)ds.push(v);if(rand)ds.sort(()=>Math.random()-.5);
  const R=ROW(best),C=COL(best),B=BOX(best);
  for(const v of ds){const m=1<<v;a[best]=v;r[R]|=m;c[C]|=m;b[B]|=m;if(rec())return true;r[R]&=~m;c[C]&=~m;b[B]&=~m;a[best]=0;}
  return false;})();
 return n;}
function generate(diff){
 const target=DIFF[diff].clues;let bestP=null;
 for(let attempt=0;attempt<6;attempt++){
  const sol=[];countSolutions(new Array(81).fill(0),1,true,sol);
  const p=sol.slice();let clues=81;const order=[...Array(81).keys()].sort(()=>Math.random()-.5);
  for(const i of order){if(clues<=target)break;const v=p[i];p[i]=0;if(countSolutions(p,2)!==1)p[i]=v;else clues--;}
  if(!bestP||clues<bestP.clues)bestP={puzzle:p,solution:sol,clues};
  if(clues<=target+1)break;}
 return bestP;}
// ---------- 状态 ----------
let S=null,sel=-1,notesMode=false,hist=[],lastTick=0;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.puzzle&&d.puzzle.length===81&&d.val&&d.val.length===81)return d;}catch(e){}return null;}
function start(diff){
 $('#busy').hidden=false;$('#win').hidden=true;
 setTimeout(()=>{const g=generate(diff);const best=S&&S.best||{};
  S={diff,puzzle:g.puzzle,solution:g.solution,val:g.puzzle.slice(),notes:new Array(81).fill(0),elapsed:0,mistakes:0,hints:0,done:false,best};
  hist=[];sel=S.puzzle.findIndex(v=>!v);$('#busy').hidden=true;$('#sboard').classList.remove('done');build();save();},30);}
// ---------- 绘制 ----------
const board=$('#sboard'),cells=[];
for(let bx=0;bx<9;bx++){const box=document.createElement('div');box.className='box';board.appendChild(box);
 for(let k=0;k<9;k++){const i=((bx/3|0)*3+(k/3|0))*9+(bx%3)*3+k%3;const el=document.createElement('button');el.className='cell';el.setAttribute('role','gridcell');el.dataset.i=i;el.style.setProperty('--d',ROW(i)+COL(i));
  el.addEventListener('click',()=>{sel=i;render();});box.appendChild(el);cells[i]=el;}}
const pad=$('#pad');for(let v=1;v<=9;v++){const b=document.createElement('button');b.dataset.v=v;b.innerHTML=`${v}<small></small>`;b.addEventListener('click',()=>input(v));pad.appendChild(b);}
function build(){document.querySelectorAll('.diffs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.diff===S.diff));render();}
function clashes(){const bad=new Set();for(let i=0;i<81;i++){const v=S.val[i];if(!v)continue;for(const j of PEERS[i])if(S.val[j]===v){bad.add(i);bad.add(j);}}return bad;}
function render(fx){
 const bad=clashes(),sv=sel>=0?S.val[sel]:0;
 for(let i=0;i<81;i++){const el=cells[i],v=S.val[i],given=!!S.puzzle[i];
  const peer=sel>=0&&i!==sel&&(ROW(i)===ROW(sel)||COL(i)===COL(sel)||BOX(i)===BOX(sel));
  el.className='cell'+(given?' given':'')+(peer?' peer':'')+(sv&&v===sv&&i!==sel?' same':'')+(i===sel?' sel':'')+(bad.has(i)?' clash':'')+(v&&!given&&v!==S.solution[i]?' wrong':'')+(fx&&fx.i===i?' '+fx.cls:'');
  if(v)el.textContent=v;
  else if(S.notes[i]){let h='<span class="nt">';for(let d=1;d<=9;d++)h+=`<i class="${S.notes[i]&1<<d?'on':''}">${S.notes[i]&1<<d?d:''}</i>`;el.innerHTML=h+'</span>';}
  else el.textContent='';
  el.setAttribute('aria-label',`第${ROW(i)+1}行第${COL(i)+1}列，${v?v:'空'}${given?'（题目）':''}`);el.setAttribute('aria-selected',i===sel);}
 const cnt=new Array(10).fill(0);S.val.forEach((v,i)=>{if(v&&v===S.solution[i])cnt[v]++;});
 pad.querySelectorAll('button').forEach(b=>{const v=+b.dataset.v,left=9-cnt[v];b.querySelector('small').textContent=left||'';b.disabled=left<=0||S.done;});
 pad.classList.toggle('notes',notesMode);$('#notes').setAttribute('aria-pressed',notesMode);$('#notes-state').textContent=notesMode?'开':'关';
 $('#mistakes').textContent=S.mistakes;$('#hints').textContent=S.hints;$('#undo').disabled=!hist.length||S.done;$('#erase').disabled=$('#notes').disabled=$('#hint').disabled=S.done;$('#time').textContent=fmt(S.elapsed);}
const fmt=s=>{s=Math.floor(s);const h=s/3600|0,m=(s/60|0)%60,x=s%60;return(h?h+':':'')+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0');};
// ---------- 操作 ----------
const editable=i=>i>=0&&!S.puzzle[i]&&!S.done;
function snap(){hist.push({val:S.val.slice(),notes:S.notes.slice(),sel});if(hist.length>200)hist.shift();}
function input(v){if(!editable(sel))return;const i=sel;
 if(notesMode){if(S.val[i])return;snap();S.notes[i]^=1<<v;render();save();return;}
 if(S.val[i]===v)return;snap();S.val[i]=v;S.notes[i]=0;
 if(v!==S.solution[i])S.mistakes++;else for(const j of PEERS[i])S.notes[j]&=~(1<<v);
 render({i,cls:'fill'});checkWin();save();}
function erase(){if(!editable(sel)||(!S.val[sel]&&!S.notes[sel]))return;snap();S.val[sel]=0;S.notes[sel]=0;render();save();}
function undo(){const h=hist.pop();if(!h||S.done)return;S.val=h.val;S.notes=h.notes;sel=h.sel;render();save();}
function hint(){if(S.done)return;let i=sel;
 if(!editable(i)||S.val[i]===S.solution[i]){const c=[];for(let j=0;j<81;j++)if(!S.puzzle[j]&&S.val[j]!==S.solution[j])c.push(j);if(!c.length)return;i=c[Math.random()*c.length|0];}
 snap();sel=i;S.val[i]=S.solution[i];S.notes[i]=0;for(const j of PEERS[i])S.notes[j]&=~(1<<S.val[i]);S.hints++;render({i,cls:'hinted'});checkWin();save();}
function checkWin(){if(!S.val.every((v,i)=>v===S.solution[i]))return;S.done=true;sel=-1;
 const prevBest=S.best[S.diff];const nb=!prevBest||S.elapsed<prevBest;if(nb)S.best[S.diff]=Math.floor(S.elapsed);
 render();save();board.classList.add('done');
 $('#win-msg').innerHTML=`${DIFF[S.diff].name}难度 · 用时 <b>${fmt(S.elapsed)}</b> · 错误 ${S.mistakes} · 提示 ${S.hints}<br>${nb?'🏆 新纪录！':'最好成绩 '+fmt(prevBest)}`;
 setTimeout(()=>{$('#win').hidden=false;confetti();},700);}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const box=document.createElement('div');box.className='confetti';const E=['🐟','🐾','⭐','🐠','💖','🎉','😺'];
 for(let k=0;k<46;k++){const i=document.createElement('i');i.textContent=E[k%E.length];i.style.left=Math.random()*100+'%';i.style.fontSize=14+Math.random()*20+'px';i.style.animationDuration=2.4+Math.random()*2.4+'s';i.style.animationDelay=Math.random()*1.2+'s';box.appendChild(i);}
 document.body.appendChild(box);setTimeout(()=>box.remove(),6500);}
// ---------- 输入 ----------
addEventListener('keydown',e=>{if(!S||e.ctrlKey&&e.key!=='z'||e.metaKey&&e.key!=='z'||e.altKey)return;const k=e.key;
 if(/^[1-9]$/.test(k)){input(+k);e.preventDefault();}
 else if(k==='Backspace'||k==='Delete'||k==='0'){erase();e.preventDefault();}
 else if(k==='n'||k==='N'){notesMode=!notesMode;render();}
 else if(k==='z'||k==='Z'){undo();e.preventDefault();}
 else if(k==='h'||k==='H')hint();
 else if(k.startsWith('Arrow')){e.preventDefault();if(sel<0)sel=0;else{let r=ROW(sel),c=COL(sel);if(k==='ArrowUp')r=(r+8)%9;if(k==='ArrowDown')r=(r+1)%9;if(k==='ArrowLeft')c=(c+8)%9;if(k==='ArrowRight')c=(c+1)%9;sel=r*9+c;}render();cells[sel].focus({preventScroll:true});}});
$('#erase').onclick=erase;$('#undo').onclick=undo;$('#hint').onclick=hint;
$('#notes').onclick=()=>{notesMode=!notesMode;render();};
const inProgress=()=>S&&!S.done&&S.val.some((v,i)=>v&&!S.puzzle[i]);
$('#new').onclick=()=>{if(inProgress()&&!confirm('放弃当前这题，换一题吗？'))return;start(S?S.diff:'easy');};
$('#win-new').onclick=()=>start(S.diff);$('#win-close').onclick=()=>$('#win').hidden=true;
document.querySelectorAll('.diffs button').forEach(b=>b.onclick=()=>{if(b.dataset.diff===S.diff&&!S.done)return;if(inProgress()&&!confirm(`换成「${DIFF[b.dataset.diff].name}」会放弃当前这题，确定吗？`))return;start(b.dataset.diff);});
// 计时：只在页面可见、未完成时走；用时间戳累计
function tick(){const t=performance.now();if(S&&!S.done&&!document.hidden&&$('#busy').hidden&&lastTick){S.elapsed+=(t-lastTick)/1000;$('#time').textContent=fmt(S.elapsed);}lastTick=document.hidden?0:t;}
setInterval(tick,500);setInterval(()=>S&&!S.done&&save(),5000);document.addEventListener('visibilitychange',()=>{lastTick=0;if(document.hidden&&S)save();});addEventListener('pagehide',()=>S&&save());
const saved=load();if(saved){S=saved;S.best=S.best||{};sel=S.done?-1:S.puzzle.findIndex((v,i)=>!S.val[i]);build();if(S.done){board.classList.add('done');}}else start('easy');
window.SUDOKU={countSolutions,generate,state:()=>S,select:i=>{sel=i;render();},input,hint,erase,undo,toggleNotes:()=>{notesMode=!notesMode;render();}};
})();
