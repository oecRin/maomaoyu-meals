'use strict';
const KEY='maomaoyu-pomodoro-v1';
const MODES={focus:'专注',short:'短休',long:'长休'};
const $=s=>document.querySelector(s);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
let S={minutes:{focus:25,short:5,long:15},mode:'focus',todos:[],day:today(),done:0,cycle:0,endAt:null,left:null};
try{const st=JSON.parse(localStorage.getItem(KEY)||'null');if(st&&typeof st==='object'){for(const k in MODES){const v=+st.minutes?.[k];if(v>0&&v<=180)S.minutes[k]=v;}if(MODES[st.mode])S.mode=st.mode;if(Array.isArray(st.todos))S.todos=st.todos.filter(t=>t&&typeof t.text==='string').slice(0,100).map(t=>({text:t.text.slice(0,40),done:!!t.done}));if(st.day===today()){S.done=+st.done||0;S.cycle=+st.cycle||0;}if(typeof st.endAt==='number')S.endAt=st.endAt;if(typeof st.left==='number')S.left=st.left;}}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}}
const total=()=>Math.round(S.minutes[S.mode]*60000);
const running=()=>S.endAt!==null;
function remaining(){return running()?Math.max(0,S.endAt-Date.now()):(S.left??total());}
const fmt=ms=>{const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};

/* ---- 番茄表盘（56x56 原生像素，对齐底图里的表面） ---- */
const tc=$('#tomato'),tg=tc.getContext('2d');
function px(x,y,c){tg.fillStyle=c;tg.fillRect(x,y,1,1);}
function drawTomato(frac){tg.clearRect(0,0,56,56);const cx=28,cy=28,R=26;
 for(let y=0;y<56;y++)for(let x=0;x<56;x++){const dx=x+.5-cx,dy=y+.5-cy,d=Math.hypot(dx,dy);if(d>R)continue;
  if(d>R-1.6){px(x,y,'#3b1a12');continue;}
  let a=Math.atan2(dx,-dy);if(a<0)a+=Math.PI*2;
  px(x,y,(frac>0&&a<=frac*Math.PI*2&&d<R-3)?(S.mode==='focus'?'#f1a08c':'#a9c7e8'):'#f6ead2');}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=R-5,x=Math.round(cx+Math.sin(a)*r-1),y=Math.round(cy-Math.cos(a)*r-1);tg.fillStyle='#2b201a';tg.fillRect(x,y,i%3?2:3,i%3?2:3);}
 const ha=frac*Math.PI*2;tg.fillStyle=S.mode==='focus'?'#a8281c':'#2f5f8f';for(let r=0;r<R-6;r+=.5){tg.fillRect(Math.round(cx+Math.sin(ha)*r-1),Math.round(cy-Math.cos(ha)*r-1),2,2);}
 tg.fillStyle='#2b201a';tg.fillRect(cx-2,cy-2,4,4);}

/* ---- UI ---- */
let lastFrac=-1;
function render(){const ms=remaining(),t=fmt(ms);$('#time').textContent=t;document.title=(running()?t+' · ':'')+MODES[S.mode]+' · 番茄钟';
 const frac=1-ms/total();if(Math.abs(frac-lastFrac)>.0005){lastFrac=frac;drawTomato(Math.min(1,Math.max(0,frac)));}
}
function renderStatic(){document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===S.mode;b.classList.toggle('active',on);b.setAttribute('aria-selected',on);});
 document.querySelectorAll('[data-min]').forEach(s=>s.textContent=+S.minutes[s.dataset.min].toFixed(1));
 $('#start').textContent=running()?'暂停':(S.left!==null&&S.left<total()?'继续':'开始');
 $('#stage').classList.toggle('break',S.mode!=='focus');
 const st=$('#stamps');st.replaceChildren();for(let i=0;i<Math.min(S.done,24);i++){const s=document.createElement('i');s.textContent='茄';st.append(s);}if(S.done>24){const s=document.createElement('b');s.textContent='×'+S.done;st.append(s);}st.setAttribute('aria-label','今日完成 '+S.done+' 个');if(!S.done){const e=document.createElement('span');e.textContent='还没有，开始第一个吧';st.append(e);}
 lastFrac=-1;render();}
function setStatus(t){$('#status').textContent=t;}
function setMode(m){S.mode=m;S.endAt=null;S.left=null;persist();renderStatic();setStatus(m==='focus'?'准备好就开始吧':'喝口茶，摸摸猫');}
function start(){if(running())return;S.endAt=Date.now()+(S.left??total());S.left=null;persist();renderStatic();setStatus(S.mode==='focus'?'专注中…':'休息中…');unlockAudio();
 if('Notification' in window&&Notification.permission==='default'){try{Notification.requestPermission();}catch{}}}
function pause(){if(!running())return;S.left=remaining();S.endAt=null;persist();renderStatic();setStatus('暂停了，随时继续');}
function reset(){S.endAt=null;S.left=null;persist();renderStatic();setStatus('重新来过');}
function finish(){const was=S.mode;S.endAt=null;S.left=null;chime();
 if(was==='focus'){S.done++;S.cycle++;const m=S.cycle%4===0?'long':'short';notify('专注完成 🍅','休息一下吧，'+MODES[m]+' '+S.minutes[m]+' 分钟。');S.mode=m;persist();renderStatic();start();setStatus('完成一个番茄！'+MODES[m]+'开始了');}
 else{notify('休息结束','回到书桌，开始下一个番茄吧。');S.mode='focus';persist();renderStatic();setStatus('休息结束，准备下一个番茄');}}
function tick(){if(S.day!==today()){S.day=today();S.done=0;S.cycle=0;persist();renderStatic();}if(running()&&remaining()<=0)finish();render();}
$('#start').onclick=()=>running()?pause():start();
$('#reset').onclick=reset;
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(b.dataset.mode===S.mode&&!running())return;if(running()&&!confirm('计时还在进行，确定切换吗？'))return;setMode(b.dataset.mode);});
/* 设置 */
const sb=$('#settings-btn'),sp=$('#settings');
sb.onclick=e=>{e.stopPropagation();sp.hidden=!sp.hidden;sb.setAttribute('aria-expanded',!sp.hidden);};
document.addEventListener('click',e=>{if(!sp.hidden&&!sp.contains(e.target)&&e.target!==sb){sp.hidden=true;sb.setAttribute('aria-expanded','false');}});
for(const k in MODES){const inp=$('#set-'+k);inp.value=S.minutes[k];inp.onchange=()=>{const v=+inp.value;if(!(v>0&&v<=180)){inp.value=S.minutes[k];return;}S.minutes[k]=v;if(k===S.mode&&!running())S.left=null;persist();renderStatic();};}
/* 待办 */
function renderTodos(){const ul=$('#todo-list');ul.replaceChildren();S.todos.forEach((t,i)=>{const li=document.createElement('li');li.classList.toggle('done',t.done);const c=document.createElement('input');c.type='checkbox';c.checked=t.done;c.setAttribute('aria-label','完成 '+t.text);c.onchange=()=>{t.done=c.checked;persist();renderTodos();};const s=document.createElement('span');s.textContent=t.text;const d=document.createElement('button');d.textContent='删除';d.setAttribute('aria-label','删除 '+t.text);d.onclick=()=>{S.todos.splice(i,1);persist();renderTodos();};li.append(c,s,d);ul.append(li);});if(!S.todos.length){const li=document.createElement('li');li.className='empty';li.textContent='写下这轮想做的小事。';ul.append(li);}}
$('#todo-form').onsubmit=e=>{e.preventDefault();const v=$('#todo-input').value.trim();if(!v)return;S.todos.push({text:v,done:false});$('#todo-input').value='';persist();renderTodos();};
/* 提示音（WebAudio 现场合成） */
let ac=null;function unlockAudio(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();}catch{}}
function chime(){try{unlockAudio();if(!ac)return;const t0=ac.currentTime;[659.25,880,1318.5].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;const t=t0+i*.22;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+1.4);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+1.5);});}catch{}}
function notify(title,body){try{if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body,icon:'pomodoro/room.webp',tag:'maomaoyu-pomo'});}catch{}}
/* ---- 氛围动画 ---- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LIGHTS=[[42.7,21.7],[46.9,13.1],[50.8,6.9],[54.4,3.5],[71.1,6.1],[74.5,9.6],[77.8,6.1]];
LIGHTS.forEach(([x,y],i)=>{const l=document.createElement('i');l.style.left=x+'%';l.style.top=y+'%';l.style.animationDelay=(-i*0.83)+'s';l.style.animationDuration=(2.6+(i%3)*.7)+'s';$('#lights').append(l);});
const rc=$('#rain'),rg=rc.getContext('2d');const drops=Array.from({length:70},()=>({x:Math.random()*220,y:Math.random()*350,v:4+Math.random()*4,l:5+Math.random()*7}));
function rain(){rg.clearRect(0,0,192,350);rg.strokeStyle='#bcd3ff';rg.lineWidth=1;rg.globalAlpha=.55;rg.beginPath();for(const d of drops){rg.moveTo(Math.round(d.x),Math.round(d.y));rg.lineTo(Math.round(d.x-d.l*.25),Math.round(d.y+d.l));if(!reduce){d.y+=d.v;d.x-=d.v*.25;if(d.y>350){d.y=-10;d.x=Math.random()*220;}}}rg.stroke();if(!reduce)requestAnimationFrame(rain);}
rain();
renderStatic();renderTodos();if(running())setStatus(S.mode==='focus'?'专注中…':'休息中…');
setInterval(tick,250);document.addEventListener('visibilitychange',tick);
