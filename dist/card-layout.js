'use strict';
/* 今日食签 版式配置：所有叠加元素的位置都在这里改（画布固定 1600x900，底图 card-bg.webp）。
   可用 /card-editor.html 可视化调整后“导出配置”，把 JSON 粘回下面的 CARD_LAYOUT。 */
const CARD_LAYOUT = {
  slogan1:     {x:375, y:160, fontSize:34, color:'#3a2a1c', align:'left'},
  slogan2:     {x:375, y:206, fontSize:27, color:'#000000', align:'left'},
  todayEat:    {x:860, y:268, fontSize:95, color:'#000000', align:'center'},
  dish:        {x:618, y:423, fontSize:110, fontSizeTwoLine:100, lineHeight:115, color:'#9e2a20', align:'center'},
  divider:     {x:671, y:646, width:500, color:'#5a3d22'},
  dateLine:    {x:1176, y:337, fontSize:42, color:'#3a2a1c', align:'center', accent:'#9e2a20'},
  knot:        {x:775, y:709, width:300, color:'#9e2a20'},
  bottomSlogan:{x:777, y:750, fontSize:38, color:'#3a2a1c', align:'center'},
  mascot:      {x:951, y:386, width:336, height:399, flipX:false}
};
const CARD_TEXT = {slogan1:'老味道 • 好选择', slogan2:'挑食好食材 • 吃出好运气', todayEat:'今天就吃', bottomSlogan:'今日一签 • 顺心如意'};
function splitDish(name){const a=[...name];if(a.length<=8)return [name];const t=Math.ceil(a.length/2);return [a.slice(0,t).join(''),a.slice(t).join('')];}
/* 在 g 上按 layout 画食签；返回每个元素的包围盒 {key:{x,y,w,h}}，编辑器用来点选拖动。 */
function drawCardLayout(g,L,o){const W=1600,H=900,F=o.family,boxes={};
  g.clearRect(0,0,W,H);if(o.bg&&o.bg.naturalWidth)g.drawImage(o.bg,0,0,W,H);else{g.fillStyle='#e6d2ae';g.fillRect(0,0,W,H);}
  g.textBaseline='middle';
  const text=(k,str,size,y)=>{const c=L[k];g.font=`${size}px ${F}`;g.textAlign=c.align||'left';g.fillStyle=c.color;g.fillText(str,c.x,y);const w=g.measureText(str).width;const x0=c.align==='center'?c.x-w/2:c.align==='right'?c.x-w:c.x;return {x:x0,y:y-size/2,w,h:size};};
  const union=(a,b)=>{const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,w:Math.max(a.x+a.w,b.x+b.w)-x,h:Math.max(a.y+a.h,b.y+b.h)-y};};
  for(const k of ['slogan1','slogan2','todayEat','bottomSlogan'])boxes[k]=text(k,CARD_TEXT[k],L[k].fontSize,L[k].y);
  const d=L.dish,lines=splitDish(o.food);g.save();g.shadowColor='#5e100a55';g.shadowBlur=2;
  if(lines.length===1)boxes.dish=text('dish',lines[0],d.fontSize,d.y);
  else{const s=d.fontSizeTwoLine||d.fontSize,lh=d.lineHeight;boxes.dish=union(text('dish',lines[0],s,d.y-lh/2),text('dish',lines[1],s,d.y+lh/2));}
  g.restore();
  const v=L.divider;g.strokeStyle=v.color;g.lineWidth=2;g.setLineDash([9,7]);g.beginPath();g.moveTo(v.x-v.width/2,v.y);g.lineTo(v.x+v.width/2,v.y);g.stroke();g.setLineDash([]);boxes.divider={x:v.x-v.width/2,y:v.y-8,w:v.width,h:16};
  const dl=L.dateLine;boxes.dateLine=text('dateLine',o.label,dl.fontSize,dl.y);{const lw=boxes.dateLine.w/2+40,cx=boxes.dateLine.x+boxes.dateLine.w/2;g.strokeStyle=dl.color;g.lineWidth=2;for(const s of [-1,1]){g.beginPath();g.moveTo(cx+s*lw,dl.y);g.lineTo(cx+s*(lw+90),dl.y);g.stroke();g.fillStyle=dl.accent||dl.color;g.beginPath();g.arc(cx+s*(lw-16),dl.y,6,0,7);g.fill();}boxes.dateLine={x:cx-lw-90,y:boxes.dateLine.y,w:2*(lw+90),h:boxes.dateLine.h};}
  const n=L.knot,hw=n.width/2;g.strokeStyle=n.color;g.lineWidth=2.5;g.beginPath();g.moveTo(n.x-hw,n.y);g.lineTo(n.x-24,n.y);g.moveTo(n.x+24,n.y);g.lineTo(n.x+hw,n.y);g.stroke();g.save();g.translate(n.x,n.y);g.rotate(Math.PI/4);g.strokeRect(-11,-11,22,22);g.strokeRect(-4,-4,8,8);g.restore();boxes.knot={x:n.x-hw,y:n.y-17,w:n.width,h:34};
  const m=L.mascot;if(o.mascot&&o.mascot.naturalWidth){g.save();if(m.flipX){g.translate(m.x+m.width,m.y);g.scale(-1,1);g.drawImage(o.mascot,0,0,m.width,m.height);}else g.drawImage(o.mascot,m.x,m.y,m.width,m.height);g.restore();}boxes.mascot={x:m.x,y:m.y,w:m.width,h:m.height};
  return boxes;}
