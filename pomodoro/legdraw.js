'use strict';
/* 程序化像素小腿：每帧按角度重新栅格化（不是旋转位图），最近邻、无平滑。
   坐标是腿部画布内的原生像素（画布左上角 = 底图 (620,550)）。 */
const LEG_DEF={
 far:{knee:[124,20],ang:-21,w0:42,w1:32,sock:62,sl:24,toe:-56,heel:14,sh:48,side:-1,bow:[14,-1,24,16],
  skin:['#cd8673','#b9705f','#d99683'],sock_c:['#a8949c','#8e797f','#c2b2b8'],bowCol:['#4a64a8','#2a3a72'],shoe:['#3a3438','#242022','#9a94a4'],line:'#3b1e18'},
 near:{knee:[156,36],ang:3,w0:50,w1:42,sock:70,sl:20,toe:-48,heel:14,sh:42,side:1,bow:[22,8,32,22],
  skin:['#f3c1a9','#e3a48e','#f8d2bf'],sock_c:['#f1e8ec','#b9b1c6','#ffffff'],bowCol:['#5a7ec8','#2e3f78'],shoe:['#3a3438','#242022','#a8a2b4'],line:'#3b1e18'}
};
function hex(c){return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];}
for(const k in LEG_DEF){const d=LEG_DEF[k];d.bowGeo=d.bow;d.bow=d.bowCol;for(const p of ['skin','sock_c','bow','shoe'])d[p]=d[p].map(hex);d.line=hex(d.line);}
/* 部件：0 空 1 皮肤 2 袜子 3 蝴蝶结 4 鞋 */
function legPart(d,th,ph,x,y){
 const a=(d.ang*Math.PI/180)+th,sn=Math.sin(a),cs=Math.cos(a);
 const dx=x+.5-d.knee[0],dy=y+.5-d.knee[1];
 const u=-dx*sn+dy*cs, v=dx*cs+dy*sn;          // u 沿小腿向下，v 向右（负 = 往前/左）
 const S=d.sock,E=S+d.sl;
 // 鞋：脚踝处再按 ph 倾斜
 const au=u-(E-6),pc=Math.cos(ph),ps=Math.sin(ph),su=au*pc+v*ps,sv=v*pc-au*ps;
 const cv=(d.toe+d.heel)/2,rv=(d.heel-d.toe)/2,ru=d.sh/2;
 const e=Math.pow((su-ru)/ru,2)+Math.pow((sv-cv)/rv,2);
 const shoeIn=su>=0&&(e<=1||(su<ru&&Math.abs(sv-cv)<=rv*0.92));
 const w=d.w0+(d.w1-d.w0)*Math.min(1,Math.max(0,u/S));
 // 蝴蝶结：独立部件，叠在袜子/鞋上
 const g=d.bowGeo,bu=u-(S+g[0]),bvv=v-(g[1]*w/2*d.side*-1===0?0:g[1]*(w/2)),bc=v-(d.side*(w/2)*(g[1]>0?0.15:1))+(g[1]>0?-g[1]:0);
 { const cu=u-(S+g[0]),cv=v-(d.side>0?g[1]:-(w/2-4));const hw=g[2]/2,hh=g[3]/2;if(Math.abs(cv)<=hw&&Math.abs(cu)<=hh){const ax=Math.abs(cv);if(ax<3.2&&Math.abs(cu)<4.5)return [3,cu,0];if(Math.abs(cu)<=hh*(0.35+0.65*ax/hw))return [3,cu,cv];}}
 // 袜子（含荷叶边）—— 鞋口以上的袜子盖在鞋上
 if(u>=S-2&&u<E&&Math.abs(v)<=w/2+(u<S+3?2:0)){
  if(u<S&&(Math.floor((v+60)/4)%2))return [1,u,v,w];
  return [2,u-S,v];}
 if(shoeIn)return [4,su,sv];
 if(u<S){if(u<-12)return [0];const ww=u<0?w*Math.sqrt(Math.max(0,1-Math.pow(u/12,2))):w;if(Math.abs(v)<=ww/2)return [1,u,v,ww];}
 return [0];
}
function shadePx(d,p){const k=p[0];
 if(k===1){const u=p[1],v=p[2],ww=p[3];if(v<-ww/2+3)return d.skin[1];const blush=Math.hypot(u-8,v)<7;if(blush)return [Math.max(0,d.skin[0][0]-6),d.skin[0][1]-22,d.skin[0][2]-18];if(v>ww/2-6&&u<30)return d.skin[2];return d.skin[0];}
 if(k===2){const u=p[1],v=p[2];if(u<3)return d.sock_c[2];if(v*d.side<-6)return d.sock_c[1];return d.sock_c[0];}
 if(k===3){return Math.abs(p[2])<2.5?d.bow[1]:d.bow[0];}
 if(k===4){const su=p[1],sv=p[2];const strap=Math.abs((su-6)-(sv-d.toe*0.3)*0.45)<1.6||Math.abs(su-14+(sv*0.3))<1.4;if(strap&&su>2)return d.shoe[2];if(su<6&&sv<d.toe*0.4)return d.sock_c[1];return su>d.sh*0.62?d.shoe[1]:d.shoe[0];}
}
/* 画一条腿到 ImageData（覆盖写入），th = 小腿摆角（弧度，正 = 往前/往左），ph = 脚掌倾角 */
function rasterLeg(img,d,th,ph){const W=img.width,H=img.height,D=img.data;
 const ids=new Int8Array(W*H),ps=new Array(W*H);
 const x0=Math.max(0,d.knee[0]-70),x1=Math.min(W,d.knee[0]+70),y0=Math.max(0,d.knee[1]-14);
 for(let y=y0;y<H;y++)for(let x=x0;x<x1;x++){const p=legPart(d,th,ph,x,y);ids[y*W+x]=p[0];ps[y*W+x]=p;}
 for(let y=y0;y<H;y++)for(let x=x0;x<x1;x++){const i=y*W+x,k=ids[i];if(!k)continue;
  const nb=[x>0?ids[i-1]:0,x<W-1?ids[i+1]:0,y>0?ids[i-W]:0,y<H-1?ids[i+W]:k];
  let col;if(nb.some(n=>n===0))col=k===3?d.bow[1]:d.line;else if(nb.some(n=>n!==k&&!(k===1&&n===2)&&!(k===2&&n===1)))col=k===3||nb.includes(3)?d.bow[1]:d.line;else if(k===2&&nb.includes(1))col=d.line;else col=shadePx(d,ps[i]);
  D[i*4]=col[0];D[i*4+1]=col[1];D[i*4+2]=col[2];D[i*4+3]=255;}
}
function drawLegsPixel(ctx,plate,skirt,s,ph){const W=ctx.canvas.width,H=ctx.canvas.height;
 ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;if(plate)ctx.drawImage(plate,0,0);
 const img=new ImageData(W,H);const A=14*Math.PI/180;
 rasterLeg(img,LEG_DEF.far,s*A,s*0.12+(ph||0));rasterLeg(img,LEG_DEF.near,-s*A,-s*0.12+(ph||0));
 if(!drawLegsPixel.tmp){drawLegsPixel.tmp=document.createElement('canvas');drawLegsPixel.tmp.width=W;drawLegsPixel.tmp.height=H;}
 const t=drawLegsPixel.tmp,tc=t.getContext('2d');tc.putImageData(img,0,0);ctx.drawImage(t,0,0);if(skirt)ctx.drawImage(skirt,0,0);}
