/* ===== axes: ticks, staged autorange, band autorange ===== */
const lam=x=>{
 if(!(x>0))return 1;
 const k=Math.pow(10,Math.floor(Math.log10(x)));
 for(const m of[1,2,5,10]){const v=+(k*m).toPrecision(6);if(v>=x*(1-1e-12))return v}
 return k*10
};
function ticks(a,b){
 const sp=b-a;
 let d=Math.pow(10,Math.floor(Math.log10(sp/8))),r=d*10;
 for(const m of[1,2,5,10])if(sp/(d*m)<=8+1e-9){r=d*m;break}
 d=+r.toPrecision(6);
 const v=[];
 for(let n=Math.ceil(a/d-1e-9);n*d<=b+d*1e-9;n++)v.push(+(n*d).toPrecision(12));
 return{d,v}
}
const niceCeil=v=>{const d=ticks(0,v).d;return +(Math.ceil(v/d-1e-9)*d).toPrecision(12)};
/* 段階型の軸（GUI SPEC-17 B の 3）．F：フルスケール（上限は無い），Fn：0 起点の軸の負の側（下限 −Fn）．up(M, now, m)：M は最大（対称型は絶対値の最大），m は最小 */
class AxS{
 constructor(F0,lo,sym){
  this.F0=F0;
  this.lo=lo;
  this.sym=!!sym;
  this.F=F0;
  this.Fn=0;
  this.tl=null;
  this.tn=null;
  this.tc=-1e9;
  this.n=0
 }
 up(M,now,m){
  if(!(M>=0)||M===Infinity)return;
  let F=this.F,Fn=this.Fn;
  if(M>F){F=lam(1.1*M);this.tl=null}else if(M<.4*F){if(this.tl==null)this.tl=now;if(now-this.tl>=3000){F=Math.max(this.lo,lam(1.25*M));this.tl=null}}else this.tl=null;
  if(!this.sym){
   const d=ticks(0,F).d,mm=m<0&&m>-Infinity?-m:0,sm=.002*F,st=k=>mm>sm?+(d*Math.ceil(k*mm/d-1e-9)).toPrecision(12):0;
   if(F!==this.F){Fn=st(1.1);this.tn=null}else if(mm>Math.max(Fn,sm)){Fn=st(1.1);this.tn=null}else if(Fn>0&&mm<.4*Fn){if(this.tn==null)this.tn=now;if(now-this.tn>=3000){Fn=st(1.25);this.tn=null}}else this.tn=null
  }
  if(F!==this.F||Fn!==this.Fn){this.F=F;this.Fn=Fn;this.tc=now;this.n++}
 }
 reset(){this.F=this.F0;this.Fn=0;this.tl=null;this.tn=null;this.tc=-1e9}
 get a(){return this.sym?-this.F:-this.Fn}
 get b(){return this.F}
}
class AxB{
 constructor(smin){this.smin=smin;this.a=0;this.b=4*smin;this.s=smin;this.tl=null;this.tc=-1e9;this.n=0;this.init=0}
 calc(m,M){
  const sp=Math.max(M-m,1e-9),lo=m-.1*sp,hi=M+.1*sp;
  for(let s=this.smin;;s=lam(s*1.01)){
   let a=+(s*Math.floor(lo/s)).toPrecision(12),b=+(s*Math.ceil(hi/s)).toPrecision(12),k=Math.round((b-a)/s);
   if(k<=8){for(let t=0;k<4;t++,k++){if(t%2)b+=s;else a-=s}return[a,b,s]}
  }
 }
 up(m,M,now){
  if(!(M>=m))return;
  let ch=!this.init||m<this.a||M>this.b;
  if(!ch){
   if((M-m)/(this.b-this.a)<.25){if(this.tl==null)this.tl=now;if(now-this.tl>=3000){ch=1;this.tl=null}}else this.tl=null
  }
  if(ch){
   const[a,b,s]=this.calc(m,M);
   if(a!==this.a||b!==this.b){this.a=a;this.b=b;this.s=s;this.tc=now;this.n++}
   this.init=1
  }
 }
 reset(){this.init=0;this.tl=null}
}
const mkAX=()=>({
 p:new AxS(5000,500),
 T:new AxS(3000,3000),
 dq:new AxS(100,10),
 mf:new AxS(200,20,1),
 m:new AxS(1000,100),
 mth:new AxS(20,1),
 tq:new AxS(500,50,1),
 N:new AxB(10),
 vp:new AxS(10,5,1),
 Nt:new AxS(2000,1000),
 Tw:new AxB(10),
 tb:new AxS(50,10),
 pin:new AxS(120,120)
});
const amax=(...A)=>{let m=0;for(const a of A)for(let i=0;i<a.length;i++){const v=Math.abs(a[i]);if(v>m)m=v}return m};
const amm=(...A)=>{
 let lo=Infinity,hi=-Infinity;
 for(const a of A)for(let i=0;i<a.length;i++){const v=a[i];if(v===v){if(v<lo)lo=v;if(v>hi)hi=v}}
 return[lo,hi]
};
/* 毎フレーム，描いているデータ（クランク角の軌跡は直近の 720°，トレンドは表示中の窓）で範囲を評価する（GUI SPEC-17 B） */
function axUpdate(c,AX,now){
 const t=c.tr,
  H=c.H,
  u=(ax,...A)=>{const[lo,hi]=amm(...A);if(hi>=lo)ax.up(ax.sym?Math.max(-lo,hi,0):Math.max(hi,0),now,lo)};
 u(AX.p,t.p);
 u(AX.T,t.T);
 u(AX.dq,t.dq);
 u(AX.mf,t.mi,t.me);
 u(AX.m,t.m,t.mu);
 u(AX.mth,t.mt);
 u(AX.tq,t.Ti,t.Ts,t.Td,t.Tf);
 u(AX.vp,t.vp);
 {const[a,b]=amm(t.N);AX.N.up(a,b,now)}
 if(H.t.length){
  u(AX.Nt,H.N,H.Nt);
  const[a,b]=amm(H.Tw);
  AX.Tw.up(a,b,now);
  const[c1,c2]=amm(H.tb,H.td,H.fc,H.fe);
  if(c2>=c1){AX.tb.sym=c1<0;AX.tb.up(Math.max(Math.abs(c1),Math.abs(c2)),now,0)}
  u(AX.pin,t.pin,H.pin)
 }else u(AX.pin,t.pin)
}
function axReset(AX){for(const k in AX)if(AX[k]&&AX[k].reset)AX[k].reset()}
/* ===== plot layout (pure geometry, testable) and drawing ===== */
const tfmt=(v,d)=>{const n=Math.max(0,-Math.floor(Math.log10(d)+1e-9));return v.toFixed(Math.min(n,6))};
function axt(ax){
 if(ax.log){
  const o=[];
  for(let e=Math.round(Math.log10(ax.a));e<=Math.round(Math.log10(ax.b));e++)o.push({v:Math.pow(10,e),s:e>=0?String(Math.pow(10,e)):Math.pow(10,e).toFixed(-e)});
  return o
 }
 if(ax.tv)return ax.tv.map(v=>({v,s:String(v)}));
 const t=ticks(ax.a,ax.b);
 return t.v.map(v=>({v,s:tfmt(v,t.d)}))
}
function layout(g,x,y,w,h,sp){
 g.font='11px system-ui,sans-serif';
 const mw=s=>g.measureText(s).width,
  yt=axt(sp.ya),
  xt=axt(sp.xa),
  ml=Math.ceil(Math.max(...yt.map(t=>mw(t.s))))+8,
  mr=14,
  mt=16,
  mb=34;
 const pl={x:x+ml,y:y+mt,w:Math.max(10,w-ml-mr),h:Math.max(10,h-mt-mb)},
  f=(ax,v)=>ax.log?(Math.log10(v)-Math.log10(ax.a))/(Math.log10(ax.b)-Math.log10(ax.a)):(v-ax.a)/(ax.b-ax.a),
  sx=v=>pl.x+f(sp.xa,v)*pl.w,
  sy=v=>pl.y+pl.h-f(sp.ya,v)*pl.h,
  R=[];
 const ys=Math.max(1,Math.ceil(13/(pl.h/Math.max(1,yt.length-1))));
 yt.forEach((t,i)=>{
  t.px=sy(t.v);
  if((yt.length-1-i)%ys===0){const tw=mw(t.s);R.push({t:'yt',s:t.s,x:pl.x-5-tw,y:t.px-6,w:tw,h:12,ax:'y'})}
 });
 const xw=Math.max(...xt.map(t=>mw(t.s)))+8,xs=Math.max(1,Math.ceil(xw/(pl.w/Math.max(1,xt.length-1))));
 xt.forEach((t,i)=>{
  t.px=sx(t.v);
  if(i%xs===0){
   const tw=mw(t.s);
   R.push({t:'xt',s:t.s,x:Math.min(x+w-tw-1,Math.max(x+1,t.px-tw/2)),y:pl.y+pl.h+8,w:tw,h:12,ax:'x'})
  }
 });
 const yn=sp.ya.name,xn=sp.xa.name;
 R.push({t:'yn',s:yn,x:pl.x+2,y:y+1,w:mw(yn),h:12});
 R.push({t:'xn',s:xn,x:pl.x+pl.w/2-mw(xn)/2,y:pl.y+pl.h+21,w:mw(xn),h:12});
 let lx=pl.x+pl.w,ly=y+1,lmin=pl.x+mw(yn)+10;
 (sp.lg||[]).slice().reverse().forEach(l=>{
  const tw=mw(l.n)+12;
  if(lx-tw-6<lmin){lx=pl.x+pl.w;ly+=14;lmin=pl.x+4}
  lx-=tw+6;
  R.push({t:'lg',s:l.n,c:l.c,x:lx,y:ly,w:tw,h:12})
 });
 return{pl,sx,sy,xt,yt,R,sp}
}
/* 印の記号の位置（SPEC-17 A の 5）．P：印の画面上の位置 px，py，記号 t（空なら記号なし），記号の幅 w，指定の向き dx，dy．pl：プロット領域．
   記号ごとに，ほかの記号・印・枠に重ならない最初の候補を選ぶ．どれも重なるときは最初の候補を枠の中に収める．戻り値は記号の左端 x と中心の高さ y（記号なしは null）．描画に依らないので単独で検査できる */
function placeLabels(P,pl){
 const box=[],
  hit=(x,y,w)=>x<pl.x+1||x+w>pl.x+pl.w-1||y-7<pl.y||y+7>pl.y+pl.h||box.some(b=>x<b.x+b.w+2&&x+w+2>b.x&&Math.abs(y-b.y)<13)||P.some(q=>q.px>x-5&&q.px<x+w+5&&Math.abs(q.py-y)<11);
 return P.map(q=>{
  if(!q.t)return null;
  const w=q.w,
   a=Math.abs(q.dx),
   sg=q.dx<0?-1:1,
   X=s=>s>0?q.px+a:q.px-a-w,
   cand=[
    [X(sg),q.py+q.dy],
    [X(-sg),q.py+q.dy],
    [X(sg),q.py-q.dy],
    [X(-sg),q.py-q.dy],
    [q.px-w/2,q.py-14],
    [q.px-w/2,q.py+14],
    [X(sg),q.py-16],
    [X(sg),q.py+16],
    [X(-sg),q.py-16],
    [X(-sg),q.py+16],
    [q.px-w/2,q.py-26],
    [q.px-w/2,q.py+26]
   ];
  let c=cand.find(v=>!hit(v[0],v[1],w)),free=!!c;
  if(!c)c=[Math.max(pl.x+2,Math.min(pl.x+pl.w-w-2,cand[0][0])),Math.max(pl.y+7,Math.min(pl.y+pl.h-7,cand[0][1]))];
  const b={x:c[0],y:c[1],w,free};
  box.push(b);
  return b
 })
}
function drawPlot(g,L,ser,col,cross){
 const{pl,sx,sy,R,sp}=L;
 g.font='11px system-ui,sans-serif';
 g.textBaseline='top';
 g.textAlign='left';
 g.lineWidth=1;
 g.strokeStyle=col.ln;
 g.beginPath();
 L.yt.forEach(t=>{g.moveTo(pl.x,Math.round(t.px)+.5);g.lineTo(pl.x+pl.w,Math.round(t.px)+.5)});
 L.xt.forEach(t=>{g.moveTo(Math.round(t.px)+.5,pl.y);g.lineTo(Math.round(t.px)+.5,pl.y+pl.h)});
 g.stroke();
 g.strokeStyle=col.fg;
 g.beginPath();
 g.moveTo(pl.x+.5,pl.y);
 g.lineTo(pl.x+.5,pl.y+pl.h+.5);
 g.lineTo(pl.x+pl.w,pl.y+pl.h+.5);
 g.stroke();
 for(const r of R){
  if(r.t==='lg'){g.fillStyle=r.c;g.fillRect(r.x,r.y+4,8,4);g.fillStyle=col.fg;g.fillText(r.s,r.x+12,r.y)}else{
   g.fillStyle=r.t==='yn'||r.t==='xn'?col.fg:((r.ax==='y'&&sp.ya.hot)||(r.ax==='x'&&sp.xa.hot))?col.ac:col.mu;
   g.fillText(r.s,r.x,r.y)
  }
 }
 g.save();
 g.beginPath();
 g.rect(pl.x,pl.y-1,pl.w+1,pl.h+2);
 g.clip();
 const lg=sp.xa.log;
 for(const q of ser){
  g.strokeStyle=q.c;
  g.lineWidth=q.w||1.6;
  g.beginPath();
  let s=0;
  const X=q.X,Y=q.Y,n=X.length;
  for(let i=0;i<n;i++){
   const u=X[i],v=Y[i];
   if(u!==u||v!==v||(lg&&(u<=0||v<=0))){s=0;continue}
   const px=sx(u),py=sy(v);
   s?g.lineTo(px,py):g.moveTo(px,py);
   s=1
  }
  g.stroke();
  if(q.mk){/* 印は点の間隔が 8 px 以上のときだけ．狭いときは未整定（白抜き）の印だけ（SPEC-26 の 6） */
   let dx=Infinity;
   for(let i=1;i<n;i++){const d=Math.abs(sx(X[i])-sx(X[i-1]));if(d===d&&d<dx)dx=d}
   const all=dx>=8;
   for(let i=0;i<n;i++){
    const u=X[i],v=Y[i];
    if(u!==u||v!==v||(!all&&!(q.ho&&q.ho[i])))continue;
    g.beginPath();
    g.arc(sx(u),sy(v),3,0,2*PI);
    if(q.ho&&q.ho[i]){g.fillStyle=col.cd||'#fff';g.fill();g.stroke()}else{g.fillStyle=q.c;g.fill()}
   }
  }
 }
 if(sp.mk&&sp.mk.length){/* 印を先にすべて描き，記号は，ほかの記号と印に重ならない位置を候補（指定の位置，左右の反対側，上，下，斜め）から選んで置く */
  const bg=col.cd||'#fff',P=sp.mk.map(m=>({m,px:sx(m.x),py:sy(m.y),cc:m.c==='fg'?col.fg:m.c}));
  g.save();
  g.font='600 11px system-ui,sans-serif';
  g.textBaseline='middle';
  g.textAlign='left';
  g.lineJoin='round';
  for(const q of P){
   g.beginPath();
   g.arc(q.px,q.py,3.5,0,2*PI);
   g.fillStyle=q.cc;
   g.fill();
   g.strokeStyle=bg;
   g.lineWidth=1.2;
   g.stroke()
  }
  placeLabels(P.map(q=>({px:q.px,py:q.py,t:q.m.t,dx:q.m.dx,dy:q.m.dy,w:q.m.t?g.measureText(q.m.t).width:0})),pl).forEach((c,i)=>{
   if(!c)return;
   const q=P[i];
   g.strokeStyle=bg;
   g.lineWidth=3;
   g.strokeText(q.m.t,c.x,c.y);
   g.fillStyle=q.cc;
   g.fillText(q.m.t,c.x,c.y)
  });
  g.restore()
 }
 if(cross!=null){
  const px=pl.x+cross*pl.w;
  g.strokeStyle=col.ac;
  g.lineWidth=1;
  g.beginPath();
  g.moveTo(px,pl.y);
  g.lineTo(px,pl.y+pl.h);
  g.stroke()
 }
 g.restore()
}
/* ===== screen specifications ===== */
const CL={a:'#e8590c',b:'#1c7ed6',k:'#2f9e44',g:'#868e96',v:'#9c36b5'};
const TH=Float32Array.from({length:1440},(_,i)=>360+i/2);
const TH0=Float32Array.from({length:1440},(_,i)=>i/2);
const rot=a=>{const o=new Float32Array(1440);for(let i=0;i<1440;i++)o[i]=a[(i+720)%1440];return o};
/* p-V 線図の印（SPEC-17 A の 5）：曲線のデータ（0.5° ごと）の，その角度の点．記号は ASCII だけ．txt = 0 で印だけ */
const MKC={i:'#1c7ed6',e:'#e03131',s:'#e8a400',j:'#2f9e44'};
function pvMarks(c,V,p,log,txt){
 const s=c.s,
  P=c.P,
  v=c.V,
  out=[],
  add=(t,deg,col,dx,dy)=>{
   const k=((Math.round(deg*2)%1440)+1440)%1440,x=V[k],y=p[k];
   if(x===x&&y===y)out.push({x,y,c:col,t:txt?t:'',dx,dy})
  },
  dg=a=>md4(a)/D;
 add('IVO',dg(v.i.o),MKC.i,log?-8:8,log?-9:-15);
 add('IVC',dg(v.i.c),MKC.i,log?8:-8,-9);
 add('EVO',dg(v.e.o),MKC.e,8,-9);
 add('EVC',dg(v.e.c),MKC.e,log?-8:8,log?10:-3);
 if(log&&txt){
  if(s.fuel)add('IGN',360-s.spa,MKC.s,-8,0);
  if(s.fuel&&s.ca===s.ca)add('CA50',360+s.ca,MKC.s,-8,0);
  if(P.gam===2&&P.inj===1&&s.fuel&&s.inj.m>0){add('SOI',dg(s.inj.th0),MKC.j,6,12);add('EOI',dg(s.inj.th0+s.inj.dth),MKC.j,8,-9)}
  let im=-1;
  for(let k=0;k<1440;k++)if(p[k]===p[k]&&(im<0||p[k]>p[im]))im=k;
  if(im>=0)add('p_max',im/2,'fg',8,-7)
 }
 return out
}
function screenSpec(c,AX,sub,o){
 o=o||{};
 const t0=c.tr,
  t=new Proxy({},{get:(o,k)=>o[k]||(o[k]=rot(t0[k]))}),
  H=c.H,
  G=c.G,
  now=o.now||0,
  hot=a=>now-a.tc<1000,
  xth={a:0,b:720,name:'θ [°CA]（0 = 吸気上死点）',tv:[0,180,360,540,720]},
  xpt={a:180,b:540,name:'θ [°CA]（360 = 圧縮上死点）',tv:[180,270,360,450,540]},
  xtv={a:360,b:1080,name:'θ [°CA]（720 = 吸気上死点）',tv:[360,540,720,900,1080]},
  S=(X,Y,cc,w)=>({X,Y,c:cc,w});
 const st=(a,name)=>({a:a.a,b:a.b,name,hot:hot(a)}),fx=(a,b,name)=>({a,b,name});
 const tn=H.t.length?H.t[H.t.length-1]:0,HX=Float32Array.from(H.t,v=>v-tn),xt={a:-30,b:0,name:'t [s]（0 = 現在）'};
/* 筒内圧は MPa で描く（軌跡は kPa で持つ．軸の段階 AX.p も kPa で持ち，描くときに 1/1000 にする．GUI SPEC-17） */
 const MP=a=>Float32Array.from(a,v=>v/1e3),stM=(a,name)=>({a:a.a/1e3,b:a.b/1e3,name,hot:hot(a)});
 const pvS=(lgx=!!o.log)=>{
  const cur=o.last?(c.last?S(c.last.V,MP(c.last.p),CL.a):null):S(t0.V,MP(t0.p),CL.a),ser=[];
  if(o.ref)ser.push(S(o.ref.V,MP(o.ref.p),CL.g,1.2));
  if(cur)ser.push(cur);
  const lg=[{n:'現在',c:CL.a}];
  if(o.ref)lg.unshift({n:'基準',c:CL.g});
  const mk=cur?pvMarks(c,cur.X,cur.Y,lgx,!o.nt):[];
  if(lgx){
   const vm=(G.Vc+G.Vd)*1e6,v0=G.Vc*1e6,pm=Math.max(AX.p.F,1e4);
   return{
    xa:{a:Math.pow(10,Math.floor(Math.log10(v0))),b:Math.pow(10,Math.ceil(Math.log10(vm))),name:'V [cm³]',log:1},
    ya:{a:.01,b:(lam(pm)===pm&&Math.log10(pm)%1===0?pm:Math.pow(10,Math.ceil(Math.log10(pm))))/1e3,name:'p [MPa]',log:1},
    lg,
    ser,
    mk
   }
  }
  return{xa:fx(0,niceCeil((G.Vc+G.Vd)*1e6),'V [cm³]'),ya:stM(AX.p,'p [MPa]'),lg,ser,mk}
 };
 switch(sub){
  case 0:
   return[pvS()];
  case 7:
   return[pvS(true)]; /* バルブタイミングの画面：両対数の p-V（SPEC-15 I） */
  case 1:
   return[
    {xa:xpt,ya:stM(AX.p,'p [MPa]'),ser:[S(TH0,MP(t0.p),CL.a)]},
    {xa:xpt,ya:st(AX.T,'T [K]'),ser:[S(TH0,t0.T,CL.b)]},
    {xa:xpt,ya:st(AX.dq,'熱発生率 [J/°CA]'),ser:[S(TH0,t0.dq,CL.k)]}
   ];
  case 2:
   return[
    {xa:xtv,ya:fx(0,niceCeil(c.P.Lv*1e3),'リフト [mm]'),lg:[{n:'吸気',c:CL.b},{n:'排気',c:CL.a}],ser:[S(TH,t.Li,CL.b),S(TH,t.Le,CL.a)]},
    {xa:xtv,ya:st(AX.mf,'弁流量 [g/s]'),lg:[{n:'吸気',c:CL.b},{n:'排気',c:CL.a}],ser:[S(TH,t.mi,CL.b),S(TH,t.me,CL.a)]}
   ];
  case 3:
   return[
    {xa:xth,ya:st(AX.m,'筒内質量 [mg]'),lg:[{n:'全体',c:CL.a},{n:'新気',c:CL.b}],ser:[S(TH0,t0.m,CL.a),S(TH0,t0.mu,CL.b)]},
    {xa:xth,ya:st(AX.pin,'p_in [kPa]'),ser:[S(TH0,t0.pin,CL.b)]},
    {xa:xth,ya:st(AX.mth,'スロットル流量 [g/s]'),ser:[S(TH0,t0.mt,CL.k)]}
   ];
  case 4:
   return[
    {
     xa:xth,
     ya:st(AX.tq,'トルク [N·m]'),
     lg:[{n:'図示',c:CL.a},{n:'始動',c:CL.k},{n:'摩擦',c:CL.v},{n:'動力計',c:CL.b}],
     ser:[S(TH0,t0.Ti,CL.a),S(TH0,t0.Ts,CL.k),S(TH0,t0.Tf,CL.v),S(TH0,t0.Td,CL.b)]
    },
    {xa:xth,ya:{a:AX.N.a,b:AX.N.b,name:'N [rpm]',hot:hot(AX.N)},ser:[S(TH0,t0.N,CL.b)]},
    {xa:xth,ya:st(AX.vp,'ピストン速度 [m/s]'),ser:[S(TH0,t0.vp,CL.k)]}
   ];
  case 5:
   return[
    {xa:xt,ya:st(AX.Nt,'N [rpm]'),lg:[{n:'N̄',c:CL.a},{n:'目標',c:CL.k}],ser:[S(HX,H.N,CL.a),S(HX,H.Nt,CL.k)]},
    {xa:xt,ya:fx(0,90,'α [°]'),ser:[S(HX,H.al,CL.b)]},
    {xa:xt,ya:st(AX.pin,'p_in [kPa]'),ser:[S(HX,H.pin,CL.a)]},
    {xa:xt,ya:{a:AX.Tw.a,b:AX.Tw.b,name:'T_w [K]',hot:hot(AX.Tw)},ser:[S(HX,H.Tw,CL.k)]}
   ];
  default:
   return[
    {xa:xt,ya:st(AX.Nt,'N [rpm]'),lg:[{n:'N̄',c:CL.a},{n:'目標',c:CL.k}],ser:[S(HX,H.N,CL.a),S(HX,H.Nt,CL.k)]},
    {xa:xt,ya:st(AX.tb,'トルク [N·m]'),lg:[{n:'T_b',c:CL.a},{n:'T_dyno',c:CL.b}],ser:[S(HX,H.tb,CL.a),S(HX,H.td,CL.b)]},
    {xa:xt,ya:st(AX.tb,'動力計のトルク [N·m]'),lg:[{n:'指令 T_dc',c:CL.a},{n:'T_d',c:CL.b}],ser:[S(HX,H.fc,CL.a),S(HX,H.fe,CL.b)]}
   ]
 }
}
const SWX={a:0,b:7000,name:'N [rpm]',tv:[0,1000,2000,3000,4000,5000,6000,7000]};
const swCol=al=>`hsl(${Math.round(220-(al-10)/80*210)},75%,45%)`;
function sweepSpec(cur,ref,sub){/* エンストした点（st）は描かない */
 const pk=q=>q.pts.filter(o=>!o.st),
  sets=[...(ref||[]).map(q=>({p:pk(q),c:CL.g,w:1,r:1})),...(cur||[]).map(q=>({p:pk(q),c:swCol(q.al),w:1.8,al:q.al}))],
  lg=[...(cur||[]).map(q=>({n:q.al+'°',c:swCol(q.al)})),...(ref&&ref.length?[{n:'基準',c:CL.g}]:[])],
  G=(k,f,name,fix,d0)=>{
   let m=0,n=0;
   sets.forEach(q=>q.p.forEach(o=>{const v=f(o);if(v===v&&isFinite(v)){m=Math.max(m,v);n=Math.min(n,v)}}));
   return{
    xa:SWX,
    ya:fix||{a:n<0?-niceCeil(-n*1.08):0,b:m>0?niceCeil(m*1.08):d0,name},
    lg:lg.length?lg:null,
    ser:sets.map(q=>({X:q.p.map(o=>o.N),Y:q.p.map(f),c:q.c,w:q.w,mk:!q.r,ho:q.p.map(o=>!o.ok)}))
   }
  },
  pos=f=>o=>o.pb>0?f(o):NaN;
 return[
  [G('tb',o=>o.tb,'T_b [N·m]',null,50),G('pb',o=>o.pb/1e3,'P_b [kW]',null,20)],
  [G('ev',o=>o.ev,'η_v [-]',{a:0,b:1.2,name:'η_v [-]'})],
  [G('bsfc',pos(o=>o.bsfc),'bsfc [g/kWh]',null,500),G('eb',pos(o=>o.eb),'η_b [-]',{a:0,b:.5,name:'η_b [-]'})],
  [G('spa',o=>o.spa,'点火時期 [°BTDC]',null,40),G('xr',o=>o.xr,'x_r [-]',null,.2)]
 ][sub]
}
function camSpec(P,G,ref,refCam){
 const v=valves(P,G),
  mk=(vv,cm,k)=>Float32Array.from({length:1440},(_,j)=>lift(k?vv.e:vv.i,((360+j/2)*D)%P4,cm)*1e3),
  cl=Float32Array.from({length:1440},(_,j)=>(G.hc+kin(G,((360+j/2)*D)%P4).x)*1e3),
  ser=[],
  lg=[];
 if(ref){
  ser.push({X:TH,Y:mk(ref,refCam,0),c:CL.g,w:1.2},{X:TH,Y:mk(ref,refCam,1),c:CL.g,w:1.2});
  lg.push({n:'基準',c:CL.g})
 }
 ser.push({X:TH,Y:cl,c:CL.v,w:1.2},{X:TH,Y:mk(v,P.cam,0),c:CL.b},{X:TH,Y:mk(v,P.cam,1),c:CL.a});
 lg.push({n:'吸気',c:CL.b},{n:'排気',c:CL.a},{n:'ピストン余裕',c:CL.v});
 const Lm=Math.max(P.Lv,ref?ref.i.L:0)*1e3;
 return{xa:{a:360,b:1080,name:'θ [°CA]（720 = 吸気上死点）',tv:[360,540,720,900,1080]},ya:{a:0,b:niceCeil(Lm*1.05),name:'リフト [mm]'},lg,ser}
}
const camText=(P,G)=>{
 const v=valves(P,G),dg=a=>(a/D).toFixed(0),ov=(v.e.c-(v.i.o+P4))/D;
 return`4 弁  IVO ${dg(v.i.o)}° IVC ${dg(v.i.c)}° EVO ${dg(v.e.o)}° EVC ${dg(v.e.c)}°  オーバーラップ ${ov.toFixed(0)}°CA`
};
/* 車両の図（SPEC-35 D の 1）：車速に対する駆動力と走行抵抗 */
function vehSpec(P,Pmax){
 const r=vehPerf(P,Pmax),vm=Math.max(50,Math.ceil(r.vmax*3.6*1.15/50)*50),n=120,X=[],Fd=[],Fr=[];
 for(let i=1;i<=n;i++){const k=vm*i/n,v=k/3.6;X.push(k);Fd.push(vehDrv(P,v,Pmax)/1e3);Fr.push(vehRes(P,v)/1e3)}
 const top=Math.max(Fd[0],Fr[n-1]),st=Math.pow(10,Math.floor(Math.log10(top))),fb=Math.ceil(top/st*1.05)*st;
 return{xa:{a:0,b:vm,name:'車速 [km/h]'},ya:{a:0,b:fb,name:'力 [kN]'},lg:[{n:'駆動力',c:CL.a},{n:'走行抵抗',c:CL.b}],ser:[{X,Y:Fd,c:CL.a,w:2},{X,Y:Fr,c:CL.b,w:2}],r}
}
function ctlText(c){
 const s=c.s,
  P=c.P,
  R=(k,t)=>`<span class="r${k}">${t}</span>`,
  Nb=Math.round(s.Nb),
  sp=(P.sauto?R('a','自動'):R('f','固定'))+` 点火時期 ${s.spa.toFixed(1)}° BTDC`,
  TH=a=>`スロットル開度 α ${(a/D).toFixed(1)}°`,
  FF=(T,om)=>`動力計 ${T<0?'駆動':'吸収'} ${Math.abs(T).toFixed(1)} N·m（${(Math.abs(T*om)/1e3).toFixed(1)} kW）`;
 if(!s.fired&&!s.starter)return['停止中','START で始動','',''];
 const NT=`${R('c','制御量')} N̄ ${Nb} rpm`;
 if(!s.fired)return[`始動中｜${R('g','目標')} 完爆 N̄ > ${K.Nfire} → ${NT}`,`${R('f','固定')} ${TH(s.al)}（始動開度）`,'',sp];
 if(P.bench===1){
  const V=s.V,kmh=V.v*3.6,tm=V.t100===V.t100?V.t100.toFixed(1)+' s':V.t0>=0?(s.t-V.t0).toFixed(1)+' s…':'–';
  return[
   `シャシー｜${R('g','目標')} ${P.nt} → ${NT}`,
   `車速 ${kmh.toFixed(1)} km/h｜0→100 km/h ${tm}`,
   `${R('m','操作量')} ${TH(P.alm)}｜${V.F<0?'制動力':'駆動力'} ${(Math.abs(V.F)/1e3).toFixed(2)} kN`,
   sp
  ]
 }
 if(s.mode===0){
  const sat=s.al>=P.amax-1e-12?' 全開':s.al<=0?' 全閉':s.al<=almin(P)+1e-12?' 下限':'';
  return[`スロットル制御｜${R('g','目標')} ${P.nt} → ${NT}`,`${R('m','操作量')} ${TH(s.al)}${sat}`,`${R('f','固定')} ${FF(s.fc,s.y[1])}`,sp]
 }
 const Tm=dynMax(P,s.y[1]),sat=s.fc>=Tm-1e-12?' 上限':s.fc<=-Tm+1e-12?' 上限':'';
 return[`${s.fuel?'動力計制御':'モータリング'}｜${R('g','目標')} ${P.nt} → ${NT}`,`${R('m','操作量')} ${FF(s.fc,s.y[1])}${sat}`,`${R('f','固定')} ${TH(P.alm)}`,sp]
}
/* SPEC-30 の 10：ページ「噴射」のパネルの文字 */
/* ページ「冷却」のパネルの文字（画面の文書 SPEC-18 D の 4）：壁温，壁が受ける熱（前のサイクルの平均），排気温度 */
function coolText(c){
 const P=c.P,y=c.s.y,M=c.lastM;
 if(P.gam!==2)return'熱物性が「化学平衡」のときに使います';
 const pc=M&&M.Pwall===M.Pwall?(M.Pwall/1e3).toFixed(2):'–',tx=M&&M.Tx===M.Tx?M.Tx.toFixed(0):'–';
 return`壁温 ${y[5].toFixed(0)} K，壁への熱 ${pc} kW，排気 ${tx} K`
}
function injText(c){
 const s=c.s,P=c.P,ph=s.phc===s.phc&&s.phc!=null?`φ_c ${s.phc.toFixed(3)}`:'φ_c –';
 if(P.gam!==2)return'ポート噴射（予混合気．熱物性が「化学平衡」のときだけ噴射方式を選べます）';
 if(P.inj!==1)return`ポート噴射（予混合気）  ${ph}`;
 const J=s.inj;
 if(!(J.m>0))return`直噴  噴射なし  ${ph}`;
 const a=md4(J.th0)/D,b=a+J.dth/D;
 return`噴射 ${a.toFixed(0)}°〜${b.toFixed(1)}°（幅 ${(J.dth/D).toFixed(1)}°${J.dth>=300*D-1e-9?'．幅が上限：インジェクタ流量を超える率':''}）  ${(J.m*1e6).toFixed(2)} mg  ${ph}`
}
/* グラフの列数（REQ-15 H.4）：Canvas が横長なら横に並べる */
/* 列数（GUI SPEC-15 G の 4）：横長は幅 320 px ごとに 1 列．どちらでも，1 つのグラフの高さが 100 px 以上になるように列を増やす（1 列の幅 160 px 以上の範囲で） */
const plotCols=(n,W,H)=>Math.max(1,Math.min(n,Math.max(W>1.25*H?Math.floor(W/320):1,Math.ceil(n/Math.max(1,Math.floor(H/100)))),Math.floor(W/160)));
const plotCells=(n,W,H)=>{
 const nc=plotCols(n,W,H),nr=Math.ceil(n/nc),cw=W/nc,ch=H/nr;
 return Array.from({length:n},(_,i)=>({x:(i%nc)*cw,y:Math.floor(i/nc)*ch,w:cw,h:ch}))
};
function drawScreen(g,w,h,specs,col,cross){
 const cells=plotCells(specs.length,w,h),Ls=[];
 specs.forEach((sp,i)=>{const c=cells[i],L=layout(g,c.x+2,c.y+2,c.w-4,c.h-2,sp);drawPlot(g,L,sp.ser,col,cross);Ls.push(L)});
 return Ls
}
/* ===== engine scene (pure geometry) ===== */
const gasHue=T=>215+165*Math.min(1,Math.max(0,(T-300)/1700));
const NTB=48,NTS={lo:500,hi:40000,st:50,um:.7,mid:8000,st2:500};
function scene(c,W,Hh){
 const G=c.G,
  P=c.P,
  s=c.s,
  th=s.y[0],
  tt=md4(th),
  k=kin(G,th),
  B=G.B,
  b=B/2,
  wt=.012,
  r=G.r,
  l=G.l,
  hc=G.hc,
  pp=.32*B,
  hp=.62*B,
  V=c.V,
  hh=.062,
  yc=hc+k.x,
  yC=hc+pp+r+l,
  top=-.1,
  bot=yC+1.7*r+.006,
  xo=b+wt+.045,
  sc=Math.min(W*.6/(2*xo+.02),(Hh-8)/(bot-top)),
  ox=W*.6,
  oy=(Hh-(bot-top)*sc)/2,
  X=x=>ox+x*sc,
  Y=y=>oy+(y-top)*sc,
  xi=-.26*B,
  xe=.26*B,
  di=V.i.d,
  de=V.e.d,
  Li=lift(V.i,tt,P.cam),
  Le=lift(V.e,tt,P.cam),
  yb=hc+G.S+.45*B;
 const port=(xv,dv,sg)=>{
   const h2=dv*.52,X0=sg*xo,inner=xv-sg*h2,outer=xv+sg*h2;
   return[[inner,0],[inner,-.052],[X0,-.052],[X0,-.028],[outer,-.028],[outer,0]].map(q=>[X(q[0]),Y(q[1])])
  },
  cl=(xv,dv,sg)=>{
   const o=[],xa=sg*(xo-.004),xb=xv+sg*dv*.3;
   for(let i=0;i<10;i++){const u=i/9;o.push(u<.6?[X(xa+(xb-xa)*u/.6),Y(-.04)]:[X(xb),Y(-.04+(-.01+.04)*(u-.6)/.4)])}
   return o
  };
 return{
  sc,
  X,
  Y,
  W,
  Hh,
  B,
  b,
  wt,
  r,
  l,
  hc,
  pp,
  hp,
  hh,
  yb,
  yc,
  yC,
  xo,
  top,
  bot,
  xi,
  xe,
  di,
  de,
  Li,
  Le,
  tt,
  th,
  T:c.X?c.X.T:300,
  crownY:Y(yc),
  headY:Y(0),
  pin:[X(0),Y(yc+pp)],
  cpin:[X(r*Math.sin(th)),Y(yC-r*Math.cos(th))],
  cc:[X(0),Y(yC)],
  vinY:Y(Li),
  vexY:Y(Le),
  portIn:port(xi,di,-1),
  portEx:port(xe,de,1),
  clIn:cl(xi,di,-1),
  clEx:cl(xe,de,1),
  ext:[X(-xo),Y(top),X(xo),Y(bot)]
 }
}
function segX(a,b,c,d){
 const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 const d1=o(c,d,a),d2=o(c,d,b),d3=o(a,b,c),d4=o(a,b,d);
 return d1*d2<0&&d3*d4<0
}
function simplePoly(p){
 const n=p.length;
 for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(segX(p[i],p[(i+1)%n],p[j],p[(j+1)%n]))return false}
 return true
}
function drawEngine(g,c,W,Hh,col,nt,rs){
 const q=scene(c,W,Hh),
  {X,Y,sc,b,wt,r,hc,pp,hp,hh,yb,yc,yC,xo,xi,xe,di,de,Li,Le,tt,th,T}=q,
  s=c.s,
  P=c.P,
  mt='#8a93a3',
  md='#5b6575',
  pc='#b9c1cd';
 const rect=(x0,y0,x1,y1)=>g.fillRect(X(x0),Y(y0),(x1-x0)*sc,(y1-y0)*sc),
  ln=(x0,y0,x1,y1)=>{g.moveTo(X(x0),Y(y0));g.lineTo(X(x1),Y(y1))},
  poly=p=>{g.beginPath();p.forEach((v,i)=>i?g.lineTo(v[0],v[1]):g.moveTo(v[0],v[1]));g.closePath()};
 g.fillStyle=`hsl(${Math.max(190,215-(s.y[5]-300)*.5)} 14% 36%)`;
 rect(-(b+wt),-hh,-b,yb);
 rect(b,-hh,b+wt,yb);
 rect(-(b+wt),-hh,b+wt,0);
 g.fillStyle=md;
 g.globalAlpha=.35;
 g.beginPath();
 g.moveTo(X(-(b+wt)),Y(yb));
 g.lineTo(X(-1.7*r),Y(yb+.012));
 g.lineTo(X(-1.7*r),Y(yC));
 g.arc(X(0),Y(yC),1.7*r*sc,PI,0,true);
 g.lineTo(X(1.7*r),Y(yb+.012));
 g.lineTo(X(b+wt),Y(yb));
 g.closePath();
 g.fill();
 g.globalAlpha=1;
 const pr=Math.min(1.1,s.y[6]/P.pa);
 poly(q.portIn);
 g.fillStyle=`hsl(212 75% ${28+30*pr}%)`;
 g.fill();
 poly(q.portEx);
 g.fillStyle='hsl(22 80% 45%)';
 g.fill();
 const arrow=(x,y,dir,m,cc)=>{
  const a=Math.min(1,Math.abs(m)/.05);
  if(a<.02)return;
  const w=(.006+.008*a)*sc,px=X(x),py=Y(y);
  g.fillStyle=cc;
  g.beginPath();
  g.moveTo(px+dir*w*1.4,py);
  g.lineTo(px-dir*w,py-w);
  g.lineTo(px-dir*w,py+w);
  g.closePath();
  g.fill()
 };
 if(c.X){arrow(-(xo+.012),-.04,c.X.mi>=0?1:-1,c.X.mi,CL.b);arrow(xo+.012,-.04,c.X.me>=0?1:-1,c.X.me,CL.a)}
 const tq=Math.min(1,Math.max(0,(T-300)/1700));
 g.fillStyle=`hsl(${gasHue(T)%360} 80% ${42+12*tq}%)`;
 g.globalAlpha=.85;
 rect(-b,0,b,yc);
 g.globalAlpha=1;
 if(s.C.on&&s.fuel){
  const zz=md4(tt-s.C.th0)/s.C.db;
  if(zz>0&&zz<1){
   const xb=1-Math.exp(-K.wa*zz**((s.C.m??K.wm)+1)),Rf=Math.max(.004,Math.sqrt(xb)*1.25*b);
   g.save();
   g.beginPath();
   g.rect(X(-b),Y(0),2*b*sc,yc*sc);
   g.clip();
   const gr=g.createRadialGradient(X(0),Y(.002),0,X(0),Y(.002),Rf*sc);
   gr.addColorStop(0,'rgba(255,255,200,.95)');
   gr.addColorStop(.7,'rgba(255,170,40,.8)');
   gr.addColorStop(1,'rgba(255,90,20,0)');
   g.fillStyle=gr;
   g.beginPath();
   g.arc(X(0),Y(.002),Rf*sc,0,7);
   g.fill();
   g.restore()
  }
 }
 g.fillStyle=pc;
 rect(-b+.0008,yc,b-.0008,yc+.012);
 rect(-b+.0008,yc+.012,-b+.0043,yc+hp);
 rect(b-.0043,yc+.012,b-.0008,yc+hp);
 rect(-b+.0008,yc+pp-.014,b-.0008,yc+pp+.014);
 g.strokeStyle=md;
 g.lineWidth=1;
 g.beginPath();
 for(const o of[.004,.008,.012])ln(-b+.0008,yc+o,b-.0008,yc+o);
 g.stroke();
 g.lineCap='round';
 g.strokeStyle='#d6dbe4';
 g.lineWidth=Math.max(3,.011*sc);
 g.beginPath();
 g.moveTo(q.pin[0],q.pin[1]);
 g.lineTo(q.cpin[0],q.cpin[1]);
 g.stroke();
 g.fillStyle='#d6dbe4';
 g.beginPath();
 g.arc(q.cpin[0],q.cpin[1],.0165*sc,0,7);
 g.fill();
 g.fillStyle=md;
 g.beginPath();
 g.arc(q.pin[0],q.pin[1],.0075*sc,0,7);
 g.fill();
 const a0=Math.atan2(Math.cos(th),-Math.sin(th));
 g.fillStyle=mt;
 g.beginPath();
 g.moveTo(q.cc[0],q.cc[1]);
 g.arc(q.cc[0],q.cc[1],1.45*r*sc,a0-1.15,a0+1.15);
 g.closePath();
 g.fill();
 g.beginPath();
 g.arc(q.cc[0],q.cc[1],r*sc*.55,0,7);
 g.fill();
 g.strokeStyle=mt;
 g.lineWidth=Math.max(3,.02*sc);
 g.beginPath();
 g.moveTo(q.cc[0],q.cc[1]);
 g.lineTo(q.cpin[0],q.cpin[1]);
 g.stroke();
 g.lineCap='butt';
 g.fillStyle=md;
 g.beginPath();
 g.arc(q.cc[0],q.cc[1],.35*r*sc,0,7);
 g.fill();
 g.fillStyle='#d6dbe4';
 g.beginPath();
 g.arc(q.cpin[0],q.cpin[1],.011*sc,0,7);
 g.fill();
 const valve=(xv,dv,Lf,cc)=>{
  const hw=dv/2,y1=Lf,y0=Lf-.004;
  g.fillStyle=cc;
  poly([[xv-hw,y1],[xv+hw,y1],[xv+.004,y0],[xv-.004,y0]].map(v=>[X(v[0]),Y(v[1])]));
  g.fill();
  rect(xv-.003,-.094,xv+.003,y0);
  g.strokeStyle=mt;
  g.lineWidth=1;
  g.beginPath();
  const t0=-.088,t1=-.064+Lf*.9;
  for(let i=0;i<=8;i++){const yy=t0+(t1-t0)*i/8,xx=xv+(i%2?.008:-.008);i?g.lineTo(X(xx),Y(yy)):g.moveTo(X(xx),Y(yy))}
  g.stroke();
  g.fillStyle=mt;
  rect(xv-.009,-.092,xv+.009,-.088)
 };
 valve(xi,di,Li,Li>1e-4?'#a9c9f5':'#c3c9d3');
 valve(xe,de,Le,Le>1e-4?'#f5b48c':'#c3c9d3');
 g.fillStyle='#e8e2d0';
 rect(-.004,-.095,.004,-.05);
 g.fillStyle=mt;
 rect(-.009,-.07,.009,-.056);
 rect(-.006,-.056,.006,-.002);
 g.strokeStyle='#222';
 g.lineWidth=Math.max(1.5,.0012*sc);
 g.beginPath();
 ln(0,-.002,0,.006);
 ln(-.006,-.002,-.006,.002);
 ln(-.006,.002,0,.002);
 g.stroke();
 const sa=P4/2-s.spa*D;
 if(s.C.on&&s.fuel&&tt>sa&&tt<sa+.25){
  g.strokeStyle='#ffe44d';
  g.lineWidth=2;
  g.beginPath();
  ln(0,.002,-.004,.005);
  ln(-.004,.005,.003,.007);
  g.stroke();
  g.fillStyle='rgba(255,230,90,.5)';
  g.beginPath();
  g.arc(X(0),Y(.005),.01*sc,0,7);
  g.fill()
 }
 g.strokeStyle=col.fg;
 g.lineWidth=1.5;
 g.beginPath();
 ln(-(b+wt),-hh,b+wt,-hh);
 ln(-(b+wt),-hh,-(b+wt),yb);
 ln(b+wt,-hh,b+wt,yb);
 ln(-b,0,-b,yb);
 ln(b,0,b,yb);
 g.stroke();
 if(nt)return q; /* 全体図（SPEC-31 B の 2）は文字を描かない */
 g.textBaseline='alphabetic';
 g.textAlign='left';
 const L=engText(c,rs),
  fl=(s.ov>=2?' OVERLOAD':'')+(s.up>=2?' UNDERPOWER':''),
  W_=[...(fl?[fl.trim()]:[]),...(c.vhit?['VALVE HIT']:[])];
/* 帯の上端（Hh）より下に文字を描かない．入り切らないときは警告を残し，状態の行を下から省く（SPEC-19 の 6） */
 const nl=Math.max(0,Math.floor((Hh-22)/15)+1),ns=Math.max(Math.min(1,L.length),Math.min(L.length,nl-W_.length));
 g.fillStyle=col.fg;
 g.font='bold 13px system-ui,sans-serif';
 g.fillText(L[0],8,18);
 g.font='12px system-ui,sans-serif';
 g.fillStyle=col.mu;
 for(let i=1;i<ns;i++)g.fillText(L[i],8,21+i*15);
 g.fillStyle=col.ng;
 g.font='bold 12px system-ui,sans-serif';
 W_.forEach((w,i)=>g.fillText(w,8,21+(ns+i)*15));
 return q
}
/* 断面図の文字の行（SPEC-19 の 6）：状態と平均回転数，制御方式，「最速」のときの速さの倍率 rs（0 なら書かない） */
function engText(c,rs){
 const s=c.s,P=c.P;
 return[
  (s.fired?(s.fuel?'RUN':'MOTOR'):s.starter?'CRANK':'STOP')+'  N̄ '+s.Nb.toFixed(0)+' rpm',
  P.bench===1?'シャシー':s.mode?'動力計制御':'スロットル制御',
  ...(rs>0?['最速 '+(rs<9.95?rs.toFixed(1):rs.toFixed(0))+'×']:[])
 ]
}
/* ===== 全体図（SPEC-31．系統図）．設計座標 400×620 を一様な縮尺 k で置く．sysSpec が場面の記述（要素，位置，寸法，文字），drawSys が描画 ===== */
const SYW=400,
 SYH=620,
 SYC={in:'#5b8fd8',inl:'#a9c9f5',ex:'#e0773a',exl:'#f5b48c',sig:'#c9a227',abs:'#ff8a4c',mot:'#69db7c',met:'#9aa3ad',dk:'#0b0e13'};
/* 圧力の色（SPEC-31 A の 4）．kPa → [r,g,b] */
function pcol(kPa){
 const u=Math.max(0,Math.min(1,Math.log10(Math.max(kPa,1e-9)/10)/Math.log10(500))),
  S=[[0,[60,110,210]],[.38,[150,160,175]],[1,[220,70,50]]],
  i=u<=.38?0:1,
  a=S[i],
  b=S[i+1],
  t=(u-a[0])/(b[0]-a[0]);
 return a[1].map((v,j)=>v+(b[1][j]-v)*t)
}
const pcs=kPa=>`rgb(${pcol(kPa).map(Math.round)})`;
/* 桁の固定（SPEC-31 A の 5）．num：符号を U+2212 で書く．Nv：文の中の数値の欄（v は書く文字列，t は最大の桁数のひな形）．Cl：「名前，数値，単位」の 3 欄の行．lnText：行の文字列 */
const SYT={
 p:'888.8',
 pc:'88.888',
 m:'−888.8',
 a:'88.8',
 L:'88.8',
 mf:'888.8',
 sa:'−88.8',
 T:'8888',
 th:'888',
 f:'8.88',
 Td:'888.8',
 N:'8888',
 Tb:'−888.8',
 Pb:'−88.88',
 im:'−8888',
 tq:'−888.88',
 V:'8.888'
};
const num=(x,d)=>{const t=Math.abs(x).toFixed(d);return(x<0&&+t!==0?'−':'')+t},
 Nv=(v,t)=>({v,t}),
 Cl=(n,v,t,u)=>({c:1,n,v,t:t||v,u:u||''}),
 lnText=q=>typeof q==='string'?q:q.c?`${q.n} ${q.v}${q.u?(q.u[0]==='°'?'':' ')+q.u:''}`:q.map(o=>typeof o==='string'?o:o.v).join('');
/* 場面の記述のうち，値が変わっても動いてはならないもの（枠の位置・幅・高さ，数値の欄の右端）を並べる（TEST-31 項目 7） */
function sysSig(S){
 const a=[],sg=(L,x0)=>{for(const q of L.segs)if(q.r)a.push(x0+q.x)};
 for(const o of S.tags){a.push(o.x,o.y,o.w,o.h);for(const L of o.L)sg(L,o.x+.45*S.f)}
 for(const L of S.cen)sg(L,L.x0);
 return a
}
function sysSpec(c,W,H,g){
 const k=Math.min(W/SYW,H/SYH),
  ox=(W-SYW*k)/2,
  oy=(H-SYH*k)/2,
  f=Math.max(9,Math.min(13,10*k)),
  X=x=>ox+x*k,
  Y=y=>oy+y*k,
  P=c.P,
  G=c.G,
  s=c.s,
  y=s.y,
  Xc=c.X||{},
  M=c.lastM||{},
  RO=!!P.run,
  EX=!!P.exs,
  DI=P.inj===1&&P.gam===2,
  kPa=v=>(v/1e3).toFixed(1),
  gs=v=>num(v*1e3,1),
  T_=SYT;
 const fn=`${f}px system-ui,sans-serif`,
  fb=`600 ${f}px system-ui,sans-serif`,
  lh=1.25*f,
  tags=[],
  cen=[],
  mw=(t,b)=>{g.font=b?fb:fn;return g.measureText(t).width},
  sp=mw(' '),
 /* 数値の欄の幅：文字ごとの幅の和．数字は 0〜9 の最大の幅で数える（数字の幅が字ごとに違うフォントでも，値が欄を超えない）．値の字数がひな形より多いときだけ，値の字数で数える */
  dW=[0,1].map(b=>Math.max(...[...'0123456789'].map(ch=>mw(ch,b)))),
  tw=(t,b)=>{let w=0;for(const ch of t)w+=ch>='0'&&ch<='9'?dW[b?1:0]:mw(ch,b);return w},
  sw=(o,b)=>tw(o.v.length>o.t.length?o.v:o.t,b),
 /* 行を組む：文字の区切りごとに，行の左端からの位置 x を決める（r = 1 の区切りは数値で，x が右端）．数値の欄の幅は sw．nW，vW は 3 欄の行の名前と数値の欄の幅 */
  lay=(q,b,nW,vW)=>{
   const segs=[];
   let x=0;
   if(typeof q==='string')return{segs:[{s:q,x:0}],w:mw(q,b)};
   if(q.c){
    segs.push({s:q.n,x:0});
    x=nW+sp+vW;
    segs.push({s:q.v,x,r:1});
    if(q.u){x+=q.u[0]==='°'?0:sp;segs.push({s:q.u,x});x+=mw(q.u,b)}
    return{segs,w:x}
   }
   for(const o of q){if(typeof o==='string'){segs.push({s:o,x});x+=mw(o,b)}else{x+=sw(o,b);segs.push({s:o.v,x,r:1})}}
   return{segs,w:x}
  },
 /* 中央に置く 1 行（数値は欄の右端にそろえる） */
  cl=(q,b,cx)=>{const L=lay(q,b);L.x0=cx-L.w/2;cen.push(L);return L},
 /* 数値の枠：(x, y) は設計座標の左上．al = 'r' なら x を右端とする．1 行目は太字 */
  tag=(id,x,y,lines,hc,al)=>{
   let nW=0,vW=0;
   for(const q of lines)if(q.c){nW=Math.max(nW,mw(q.n));vW=Math.max(vW,sw(q))}
   const L=lines.map((q,i)=>lay(q,!i,nW,vW)),
    w=Math.max(...L.map(q=>q.w))+.9*f,
    h=lines.length*lh+.5*f,
    o={id,x:al==='r'?X(x)-w:X(x),y:Y(y),w,h,lines:lines.map(lnText),L,hc:hc||'#e8ecf2'};
   tags.push(o);
   return o
  };
 const S={k,ox,oy,f,lh,X,Y,W,H,tags,cen,el:{}};
 const thr=s.al/D,Dt=P.Dt*1e3;
 {/* ---------- 系統図（B） ---------- */
  const el=S.el,pw=d=>.32*k*d*1e3,yI=58;
  /* 機関の断面：運転タブの断面図を，設計座標の幅 150・高さ 300（上端 150）の枠へ */
  const bw=150*k,bh=300*k,W2=bw/.6,tx=X(200)-bw,ty=Y(150),q=scene(c,W2,bh),gx=x=>tx+q.X(x),gy=v=>ty+q.Y(v);
  S.eng={tx,ty,W2,H2:bh,q};
  const PI_=[gx(-q.xo),gy(-.04)],PE=[gx(q.xo),gy(-.04)],CC=[tx+q.cc[0],ty+q.cc[1]];
  S.PI=PI_;
  S.PE=PE;
  S.CC=CC;
  el.atm=1;
  el.thr={cx:X(40),cy:Y(yI),ang:(90-thr)*D,L:pw(P.Dt)/2+2*k,w:pw(P.Dt)};
  el.inPipe={pts:[[X(4),Y(yI)],[X(70),Y(yI)]],w:pw(P.Dt)};
  el.man={x:X(70),y:Y(24),w:80*k,h:68*k,p:y[6]};
  if(RO){el.runner={pts:[[X(110),Y(92)],[X(110),PI_[1]],[PI_[0],PI_[1]]],w:pw(P.dr)}}else el.short={pts:[[X(110),Y(92)],[X(110),PI_[1]],[PI_[0],PI_[1]]],w:pw(P.Dt)};
  el.inj=DI?{x:gx(-q.b)-6*k,y:gy(.004),at:'cyl'}:{x:PI_[0]-10*k,y:PI_[1]-pw(RO?P.dr:P.Dt)/2-7*k,at:'port'};
  el.spark={x:gx(0),y:gy(-.095)};
  el.vin={d:q.di*q.sc,L:q.Li};
  el.vex={d:q.de*q.sc,L:q.Le};
  /* 排気管：ポートから右へ出て上へ曲がり，吸気の入口と同じ高さで右へ出る．端は大気に開いている（消音器は無い） */
  if(EX){
   el.exPipe={pts:[PE,[X(341),PE[1]],[X(341),Y(yI)],[X(386),Y(yI)]],w:pw(P.dex)};
   el.out={x:X(386),y:Y(yI)}
  }
  else el.back={pts:[PE,[X(330),PE[1]]],w:pw(P.dex),dp:P.dpx};
  const Rd=40*k,dx=X(344);
  el.shaft={x0:CC[0],x1:dx-Rd,y:CC[1]};
  el.fly={x:X(268),y:CC[1],h:52*k};
  /* 電動式動力計（SPEC-31 A の 3）：外周の弧の角度 = 2π|T_e|/T_max，色は吸収と駆動で変える */
  {
   const Tm=dynMax(P,y[1]),u=Math.max(-1,Math.min(1,s.fe/Tm));
   el.dyno={x:dx,y:CC[1],R:Rd,u,th:y[0],arc:2*PI*Math.abs(u),dir:s.fe<0?'駆動':'吸収'}
  }
  el.aux={x:X(110),y:CC[1]-30*k,r:11*k};
  el.st={x:X(110),y:CC[1]+24*k,r:14*k};
  el.ecu={x:X(8),y:Y(500),w:224*k};
  const sg=[];
  sg.push({to:'thr',pts:[[X(4),Y(500)],[X(4),Y(70)],[X(40),Y(70)],[X(40),el.thr.cy+el.thr.w/2]]});
  sg.push({to:'inj',pts:[[X(121),Y(500)],[X(121),el.inj.y],[el.inj.x-4*k,el.inj.y]]});
  sg.push({to:'spark',pts:[[X(126),Y(500)],[X(126),Y(146)],[el.spark.x,Y(146)],[el.spark.x,el.spark.y]]});
  sg.push({to:'dyno',pts:[[X(226),Y(500)],[X(226),Y(492)],[X(292),Y(492)],[X(292),CC[1]+Rd*.7],[dx-Rd*.71,CC[1]+Rd*.7]]});
  el.sig=sg;
  /* 数値の枠 */
  tag('atm',4,4,[`大気 ${(P.pa/1e3).toFixed(1)} kPa`],'#e8ecf2');
  tag('thr',4,96,['スロットル',['α ',Nv(thr.toFixed(1),T_.a),`°，D_t ${Dt.toFixed(0)} mm`],['ṁ_th ',Nv(gs(Xc.mt||0),T_.m),' g/s']],SYC.inl);
  if(RO)tag('run',122,98,['吸気ランナ',Cl('L_r',(P.Lr*1e3).toFixed(0),0,'mm'),Cl('d_r',(P.dr*1e3).toFixed(0),0,'mm'),Cl('ṁ_r',gs(Xc.mr||0),T_.m,'g/s')],SYC.inl);
  const nvs=c.V.n===1?'':`${c.V.n} × `;
  tag('vin',4,146,['吸気弁',Cl('d',nvs+(c.V.i.d*1e3).toFixed(0),0,'mm'),Cl('L',(q.Li*1e3).toFixed(1),T_.L,'mm')],SYC.inl);
  tag('inj',4,194,[DI?'直噴':'ポート噴射',Cl('m_f,cmd',(s.mfc*1e6).toFixed(1),T_.mf,'mg'),DI?Cl('SOI',num(P.soi/D,0),0,'°'):Cl('φ',P.phi.toFixed(2))],SYC.fuel);
  tag('ign',4,242,['点火',[Nv(num(s.spa,1),T_.sa),`° BTDC（${P.sauto?'自動':'手動'}）`]],'#ffd43b');
  tag('eng',4,280,['機関',`B×S ${(G.B*1e3).toFixed(0)}×${(G.S*1e3).toFixed(0)} mm`,`l ${(G.l*1e3).toFixed(0)} mm，ε ${G.eps.toFixed(1)}`],'#e8ecf2');
  const tt=md4(y[0]),ph=['吸気','圧縮','膨張','排気'][Math.floor(tt/PI)%4];
  tag('vex',396,PE[1]/k-oy/k+14,['排気弁',Cl('d',nvs+(c.V.e.d*1e3).toFixed(0),0,'mm'),Cl('L',(q.Le*1e3).toFixed(1),T_.L,'mm')],SYC.exl,'r');
  tag('cyl',396,PE[1]/k-oy/k+64,['筒内',Cl('p',(y[2]/1e6).toFixed(3),T_.pc,'MPa'),Cl('T',(Xc.T||0).toFixed(0),T_.T,'K'),Cl('θ',(tt/D).toFixed(0),T_.th,`°（${ph}）`)],'#e8ecf2','r');
  if(EX)tag('exp',332,98,[
   '排気管',
   Cl('L_e',P.Lex.toFixed(2),0,'m'),
   Cl('d_e',(P.dex*1e3).toFixed(0),0,'mm'),
   Cl('p_pe',kPa(y[14]),T_.p,'kPa'),
   Cl('T_X',(P.gam===2?y[49]:TX).toFixed(0),T_.T,'K')
  ],SYC.exl,'r');
  else tag('back',396,PE[1]/k-oy/k-36,['背圧',`Δp_ex ${(P.dpx/1e3).toFixed(1)} kPa`],SYC.exl,'r');
  if(EX)tag('out',396,2,['出口（大気開放）',Cl('A_e',(PI/4*P.dex*P.dex*1e6).toFixed(0),0,'mm²'),Cl('ṁ_e',gs(Xc.mep||0),T_.m,'g/s')],SYC.exl,'r');
  {
   const o=tag('dyno',396,(CC[1]-oy)/k+46,[
    '動力計（電動）',
    Cl(s.fe<0?'駆動':'吸収',Math.abs(s.fe).toFixed(1),T_.Td,'N·m'),
    Cl('P_d',(Math.abs(s.fe*y[1])/1e3).toFixed(2),T_.Pb,'kW'),
    Cl('定格',`${P.Tr.toFixed(0)} N·m，${(P.Pr/1e3).toFixed(0)}`,0,'kW')
   ],'#74c0fc','r');
   o.y=Math.min(o.y,Y(500)-4*k-o.h)
  }
  tag('run2',396,500,[
   '運転',
   Cl('N̄',s.Nb.toFixed(0),T_.N,'rpm'),
   Cl('T_b',num(M.tb||0,1),T_.Tb,'N·m'),
   Cl('P_b',num((M.pb||0)/1e3,2),T_.Pb,'kW'),
   Cl('IMEP',num((M.imep||0)/1e3,0),T_.im,'kPa')
  ],'#ff8a4c','r');
  const ecu=[
   'ECU',
   `回転数：${P.bench===1?'変速機':P.mode?'動力計':'スロットル'}の PI，目標 ${P.nt.toFixed(0)} rpm`,
   [`点火：${P.sauto?'自動最適化':'手動'} `,Nv(num(s.spa,1),T_.sa),'° BTDC'],
   [`噴射：${DI?'直噴':'ポート噴射'}，φ ${P.phi.toFixed(2)}，`,Nv((s.mfc*1e6).toFixed(1),T_.mf),' mg'],
   [`動力計 ${s.fe<0?'駆動':'吸収'} `,Nv(Math.abs(s.fe).toFixed(1),T_.Td),` N·m（${dynOn(P)?'トルクの PI':'負荷トルク 固定'}）`]
  ];
  tag('ecu',8,500,ecu,SYC.sig);
  S.man={l1:'マニホールド',l2:`V_in ${(P.Vin*1e3).toFixed(1)} L`,l3:`${kPa(y[6])} kPa`,L3:cl([Nv(kPa(y[6]),T_.p),' kPa'],1,el.man.x+el.man.w/2)};
  return S
 }
}
/* 描画 */
function drawSys(g,c,W,H,col){
 const S=sysSpec(c,W,H,g),{k,f,X,Y,el}=S,fb=`600 ${f}px system-ui,sans-serif`,fn=`${f}px system-ui,sans-serif`;
 const line=(pts,w,cc,dash)=>{
   g.beginPath();
   pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));
   g.lineWidth=w;
   g.strokeStyle=cc;
   g.setLineDash(dash||[]);
   g.stroke();
   g.setLineDash([])
  },
  pipe=(pts,w,cc)=>{g.lineJoin='round';line(pts,w+3,SYC.dk);line(pts,w,cc)},
  arrow=(x,y,ux,uy,cc,s)=>{
   g.fillStyle=cc;
   g.beginPath();
   g.moveTo(x+ux*s,y+uy*s);
   g.lineTo(x-ux*s*.6-uy*s*.6,y-uy*s*.6+ux*s*.6);
   g.lineTo(x-ux*s*.6+uy*s*.6,y-uy*s*.6-ux*s*.6);
   g.closePath();
   g.fill()
  },
  rr=(x,y,w,h,r)=>{g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h)},
  txt=(t,x,y,c,font,al)=>{g.font=font||fn;g.fillStyle=c;g.textAlign=al||'left';g.textBaseline='middle';g.fillText(t,x,y)},
  /* 組んだ行を書く（数値は欄の右端にそろえる） */
  drawL=(L,x0,y,c,font)=>{for(const q of L.segs)txt(q.s,x0+q.x,y,c,font,q.r?'right':'left')},
  drawTag=o=>{
   rr(o.x,o.y,o.w,o.h,4*k);
   g.fillStyle='rgba(20,24,31,.86)';
   g.fill();
   g.lineWidth=1;
   g.strokeStyle='#3a4250';
   g.stroke();
   o.L.forEach((L,i)=>drawL(L,o.x+.45*f,o.y+.25*f+S.lh*(i+.5),i?'#e8ecf2':o.hc,i?fn:fb))
  };
 g.save();
 g.lineCap='butt';
 {
  /* 吸気 */
  pipe(el.inPipe.pts,el.inPipe.w,SYC.in);
  arrow(X(18),Y(58),1,0,'#e8ecf2',5*k);
  const th=el.thr;
  g.lineWidth=2.4*k;
  g.strokeStyle='#e8ecf2';
  g.beginPath();
  g.moveTo(th.cx-th.L*Math.cos(th.ang),th.cy+th.L*Math.sin(th.ang));
  g.lineTo(th.cx+th.L*Math.cos(th.ang),th.cy-th.L*Math.sin(th.ang));
  g.stroke();
  const mn=el.man;
  rr(mn.x,mn.y,mn.w,mn.h,8*k);
  g.fillStyle=pcs(mn.p/1e3);
  g.fill();
  g.lineWidth=2;
  g.strokeStyle=SYC.dk;
  g.stroke();
  txt(S.man.l1,mn.x+mn.w/2,mn.y+mn.h*.24,SYC.dk,fb,'center');
  txt(S.man.l2,mn.x+mn.w/2,mn.y+mn.h*.5,SYC.dk,fn,'center');
  drawL(S.man.L3,S.man.L3.x0,mn.y+mn.h*.76,SYC.dk,fb);
  if(el.runner)pipe(el.runner.pts,el.runner.w,SYC.in);
  if(el.short)pipe(el.short.pts,el.short.w,SYC.in);
  /* 排気 */
  if(el.exPipe){pipe(el.exPipe.pts,el.exPipe.w,SYC.ex);arrow(el.out.x+6*k,el.out.y,1,0,'#e8ecf2',6*k)}
  else{pipe(el.back.pts,el.back.w,SYC.ex);const p=el.back.pts[1];arrow(p[0]+4*k,p[1],1,0,'#e8ecf2',7*k)}
  /* 回転系（機関の下になる部分を先に） */
  const sh=el.shaft;
  g.fillStyle='#6b7480';
  g.fillRect(sh.x0,sh.y-4*k,sh.x1-sh.x0,8*k);
  const fl=el.fly;
  g.fillStyle='#8e96a3';
  g.fillRect(fl.x-5*k,fl.y-fl.h/2,10*k,fl.h);
  /* 機関の断面（運転タブの図．文字なし） */
  g.save();
  g.translate(S.eng.tx,S.eng.ty);
  g.beginPath();
  g.rect(0,-4*k,S.eng.W2,S.eng.H2+8*k);
  g.clip();
  drawEngine(g,c,S.eng.W2,S.eng.H2,col,1);
  g.restore();
  const ij=el.inj;
  g.save();
  g.translate(ij.x,ij.y);
  g.rotate(ij.at==='cyl'?.45:.9);
  g.fillStyle='#2f9e44';
  g.fillRect(-14*k,-3*k,16*k,6*k);
  g.restore();
  /* 動力計 */
  const dy=el.dyno;
  g.beginPath();
  g.arc(dy.x,dy.y,dy.R,0,7);
  g.fillStyle='#2a303a';
  g.fill();
  g.lineWidth=3;
  g.strokeStyle='#6b7480';
  g.stroke();
  if(dy.arc>0){
   g.beginPath();
   g.arc(dy.x,dy.y,dy.R-3*k,-PI/2,-PI/2+dy.arc);
   g.lineWidth=5*k;
   g.strokeStyle=dy.u<0?SYC.mot:SYC.abs;
   g.stroke()
  }
  g.lineWidth=3*k;
  g.strokeStyle=SYC.met;
  for(let i=0;i<6;i++){
   const a=dy.th+i*PI/3;
   g.beginPath();
   g.moveTo(dy.x,dy.y);
   g.lineTo(dy.x+(dy.R-8*k)*Math.cos(a),dy.y+(dy.R-8*k)*Math.sin(a));
   g.stroke()
  }
  g.beginPath();
  g.arc(dy.x,dy.y,7*k,0,7);
  g.fillStyle='#6b7480';
  g.fill();
  for(const [o,t] of [[el.aux,''],[el.st,'M']]){
   g.beginPath();
   g.arc(o.x,o.y,o.r,0,7);
   g.fillStyle='#3a4250';
   g.fill();
   g.lineWidth=1;
   g.strokeStyle='#6b7480';
   g.stroke();
   if(t)txt(t,o.x,o.y,'#e8ecf2',fb,'center')
  }
  txt(`補機 ${c.P.Ta.toFixed(1)} N·m`,el.aux.x,el.aux.y-el.aux.r-.7*f,'#9aa3b2',fn,'center');
  txt('スターター',el.st.x,el.st.y+el.st.r+.7*f,'#9aa3b2',fn,'center');
  /* 信号 */
  for(const q of el.sig)line(q.pts,1.2,SYC.sig,[4,3]);
 }
 for(const o of S.tags)drawTag(o);
 g.restore();
 return S
}
/* ===== 最適化タブと熱効率タブの図（SPEC-32 A の 2，SPEC-33 C） ===== */
/* 評価の履歴：横軸 評価の番号，縦軸 目的の値．粗い評価（モンテカルロ）は灰，細かい評価は橙，それまでの最良を線で */
function drawOptH(g,W,H,h,col,lab){
 g.font='12px system-ui,sans-serif';
 g.textBaseline='middle';
 const pl={x:44,y:10,w:W-54,h:H-34};
 g.strokeStyle=col.ln;
 g.lineWidth=1;
 g.strokeRect(pl.x,pl.y,pl.w,pl.h);
 const v=h.filter(q=>q.J>-Infinity);
 if(!v.length){
  g.fillStyle=col.mu;
  g.textAlign='center';
  g.fillText(lab||'探索の結果がここに出ます',pl.x+pl.w/2,pl.y+pl.h/2);
  return null
 }
 let lo=Math.min(...v.map(q=>q.J)),hi=Math.max(...v.map(q=>q.J));
 const top=hi;
 lo=Math.max(lo,hi-Math.max(.25*Math.abs(hi),1e-9));
 if(hi-lo<1e-9){hi+=1e-3*Math.abs(hi||1);lo-=1e-3*Math.abs(lo||1)}
 const n=h.length,X=i=>pl.x+pl.w*(n>1?i/(n-1):.5),Y=J=>pl.y+pl.h*(1-(Math.max(lo,J)-lo)/(hi-lo));
 g.fillStyle=col.mu;
 g.textAlign='right';
 for(const t of[lo,(lo+hi)/2,hi]){const y=Y(t);g.fillText(fmtJ(t),pl.x-4,y)}
 g.textAlign='center';
 g.fillText(`評価 ${n} 回`,pl.x+pl.w/2,H-10);
 let b=-Infinity;
 g.strokeStyle=col.fg;
 g.lineWidth=1.5;
 g.beginPath();
 h.forEach((q,i)=>{
  if(q.J>b&&q.cls==='fine')b=q.J;
  if(b>-Infinity){const x=X(i),y=Y(b);i&&isFinite(b)?g.lineTo(x,y):g.moveTo(x,y)}
 });
 g.stroke();
 h.forEach((q,i)=>{
  if(!(q.J>-Infinity))return;
  g.fillStyle=q.cls==='fine'?col.ac:col.mu;
  g.beginPath();
  g.arc(X(i),Y(q.J),q.cls==='fine'?2.2:1.8,0,7);
  g.fill()
 });
 return{pl,lo,hi,top}
}
const fmtJ=v=>Math.abs(v)<2?v.toFixed(4):v.toFixed(2);
/* 熱効率の損失の内訳：横向きの滝の図．r は LossBk の結果 */
function lossSpec(r,W,H){
 const rows=[['理論（オットー，圧縮比 ε '+r.eps.toFixed(1)+'）',0,r.eO,'t']];
 let e=r.eO;
 for(const [n,v] of r.L){rows.push([n,e-v,e,v>=0?'l':'g',v]);e-=v}
 rows.push(['正味の図示熱効率 η_i',0,r.ei,'r'],['機械損失（摩擦・補機）',r.eb,r.ei,'l',r.ei-r.eb],['正味熱効率 η_b',0,r.eb,'r']);
 /* 幅が 520 px 未満では，名前を棒の上の行に置く（SPEC-33 C の 1） */
 const nr=rows.length,
  two=W<520,
  lw=two?6:Math.min(Math.max(150,W*.42),260),
  pl={x:lw,y:6,w:Math.max(40,W-lw-62),h:H-82},
  rh=pl.h/nr,
  mx=Math.ceil(r.eO*10)/10,
  X=v=>pl.x+pl.w*Math.max(0,v)/mx,
  bh=Math.min(20,rh*(two?.4:.62));
 return{
  two,
  rows:rows.map((q,i)=>{
   const a=Math.min(q[1],q[2]),b=Math.max(q[1],q[2]),yt=pl.y+rh*i;
   return{name:q[0],kind:q[3],v:q[4],lo:q[1],hi:q[2],ny:two?yt+8:yt+rh/2,y:two?yt+16+bh/2+1:yt+rh/2,x0:X(a),x1:X(b),h:bh,yt}
  }),
  pl,
  mx,
  X,
  rh
 }
}
/* 図の下の 3 行．膨張比／圧縮比が 1.05 より大きいときをミラーサイクル（過膨張）と書く（SPEC-33 C の 1） */
function lossFoot(r){
 const q=r.epe/r.epc;
 return[
  `膨張比／圧縮比 ${q.toFixed(2)}（${q>1.05?'膨張比のほうが大きい：ミラーサイクルの向き':q<.95?'膨張比のほうが小さい':'ほぼ等しい'}）`,
  `等容度 ${r.glh.toFixed(3)}，CA50 ${r.ca50.toFixed(1)}° ATDC，壁への熱 Q_w/Q_f ${(r.qw*100).toFixed(1)} %`,
  `N̄ ${r.N.toFixed(0)} rpm，開度 ${(r.al/D).toFixed(1)}°，燃えた燃料の割合 ξ ${r.xi.toFixed(3)}`
 ]
}
function drawLoss(g,W,H,r,col,msg){
 g.font='12px system-ui,sans-serif';
 g.textBaseline='middle';
 if(!r){g.fillStyle=col.mu;g.textAlign='center';g.fillText(msg||'',W/2,H/2);return null}
 const S=lossSpec(r,W,H),pc=(v,d)=>(v*100).toFixed(d);
 g.strokeStyle=col.ln;
 g.lineWidth=1;
 for(let v=0;v<=S.mx+1e-9;v+=.1){
  const x=S.X(v);
  g.beginPath();
  g.moveTo(x,S.pl.y);
  g.lineTo(x,S.pl.y+S.pl.h);
  g.stroke();
  g.fillStyle=col.mu;
  g.textAlign='center';
  g.fillText(Math.round(v*100)+'',x,S.pl.y+S.pl.h+9)
 }
 g.fillText('熱効率（%）',S.pl.x+S.pl.w/2,S.pl.y+S.pl.h+22);
 S.rows.forEach((q,i)=>{
  const c=q.kind==='l'?'#e8590c':q.kind==='g'?'#37b24d':q.kind==='t'?col.mu:col.ac;
  g.fillStyle=c;
  g.fillRect(q.x0,q.y-q.h/2,Math.max(1,q.x1-q.x0),q.h);
  if(q.kind==='l'||q.kind==='g'){
   g.strokeStyle=col.mu;
   g.setLineDash([2,2]);
   g.beginPath();
   g.moveTo(S.X(q.hi),q.y-S.rh+q.h/2);
   g.lineTo(S.X(q.hi),q.y-q.h/2);
   g.stroke();
   g.setLineDash([])
  }
  g.fillStyle=col.fg;
  if(S.two){g.textAlign='left';g.fillText(q.name,S.pl.x,q.ny)}else{g.textAlign='right';g.fillText(q.name,S.pl.x-6,q.ny)}
  g.textAlign='left';
  g.fillText(q.kind==='l'||q.kind==='g'?`${q.v>=0?'−':'+'}${pc(Math.abs(q.v),2)} %pt`:`${pc(q.hi,1)} %`,Math.max(q.x1,S.X(q.hi))+4,q.y)
 });
 g.fillStyle=col.mu;
 g.textAlign='left';
 lossFoot(r).forEach((t,n)=>g.fillText(t,4,H-35+n*14,W-8));
 return S
}
/* ===== VVT マップ（SPEC-34 A） ===== */
/* 双一次補間：G[j][i] は (xs[i], ys[j]) の値．範囲の外は端に寄せる．4 隅のどれかが未定義（NaN）なら未定義 */
function bil2(G,xs,ys,a,b){
 const n=xs.length,
  m=ys.length,
  fx=Math.min(n-1,Math.max(0,(a-xs[0])/(xs[n-1]-xs[0])*(n-1))),
  fy=Math.min(m-1,Math.max(0,(b-ys[0])/(ys[m-1]-ys[0])*(m-1))),
  i=Math.min(n-2,Math.floor(fx)),
  j=Math.min(m-2,Math.floor(fy)),
  u=fx-i,
  v=fy-j;
 return(G[j][i]*(1-u)+G[j][i+1]*u)*(1-v)+(G[j+1][i]*(1-u)+G[j+1][i+1]*u)*v
}
/* 等高線（marching squares）：場 F を [x0,x1]×[y0,y1] の m×m の小区画に分け，F = L の線分 [[a1,b1],[a2,b2]] を返す */
function contourSeg(F,x0,x1,y0,y1,m,L){
 const sx=(x1-x0)/m,sy=(y1-y0)/m,out=[],v=[];
 for(let j=0;j<=m;j++){v.push([]);for(let i=0;i<=m;i++)v[j].push(F(x0+i*sx,y0+j*sy))}
 for(let j=0;j<m;j++)for(let i=0;i<m;i++){
  const c=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]],pts=[];
  if(c.some(([a,b])=>!(v[b][a]===v[b][a])))continue;
  for(let e=0;e<4;e++){
   const[pi,pj]=c[e],[qi,qj]=c[(e+1)%4],f1=v[pj][pi],f2=v[qj][qi];
   if((f1-L)*(f2-L)<0){const t=(L-f1)/(f2-f1);pts.push([x0+(pi+t*(qi-pi))*sx,y0+(pj+t*(qj-pj))*sy])}
  }
  if(pts.length===2)out.push(pts);else if(pts.length===4){out.push([pts[0],pts[1]],[pts[2],pts[3]])}
 }
 return out
}
/* 表示に使う格子：埋まっている最も細かい段階の部分格子．軸トルクの VALVE HIT の点は隣の平均で埋める．燃料消費率は η_b > 0 の点だけ（埋めない） */
function vmGrid(M){
 const L=M.level();
 if(!L)return null;
 const st=[4,2,1][L-1],ph=VVM.ph,id=[];
 for(let i=0;i<ph.length;i+=st)id.push(i);
 const xs=id.map(i=>ph[i]),
  raw=G=>id.map(j=>id.map(i=>G[j][i])),
  sub=G=>{
   const S=id.map(j=>id.map(i=>G[j][i]));
   for(let r=0;r<2;r++)S.forEach((row,j)=>row.forEach((v,i)=>{
    if(v!==v){
     let s=0,n=0;
     for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const q=S[j+dj]&&S[j+dj][i+di];if(q===q&&q!==undefined){s+=q;n++}}
     if(n)row[i]=s/n
    }
   }));
   return S
  };
 const T=sub(M.T),be=raw(M.B.map(r=>r.map(e=>e>0?3.6e9/(e*K.Hu):NaN)));
 return{L,xs,T,be,H:id.map(j=>id.map(i=>M.H[j][i]))}
}
/* マップの領域：正方形で，横に余れば中央に寄せる */
const vmLayout=(W,H)=>{const s=Math.max(40,Math.min(W-92,H-40));return{x:40+Math.max(0,(W-92-s)/2),y:6,w:s,h:s}};
/* 等高線の値：刻み {1, 2, 2.5, 5} × 10^k のうち (lo, hi) の中の本数が 8 以下になる最小の刻みの倍数（SPEC-34 A の 4） */
const vmNice=(lo,hi,nm=8)=>{
 if(!(hi>lo))return[];
 const r=hi-lo;
 let s=Infinity;
 for(let k=Math.floor(Math.log10(r/nm))-1;k<=Math.floor(Math.log10(r))+1&&s===Infinity;k++)for(const m of[1,2,2.5,5]){const q=m*10**k;if(Math.floor(hi/q)-Math.ceil(lo/q)+1<=nm){s=q;break}}
 const l=[];
 for(let n=Math.ceil(lo/s);n*s<hi;n++){const v=+(n*s).toPrecision(12);if(v>lo&&v<hi)l.push(v)}
 return l
};
/* 燃料消費率の等高線の範囲：[b_min, min(b_max, 2 b_min)] */
const vmLev=(blo,bhi)=>vmNice(blo,Math.min(bhi,2*blo));
/* 色の画像と等高線を作る（値が変わったときだけ．cache に保存） */
/* 色の画像は一辺 240 画素まで（描くときに拡大する） */
function vmBuild(Gd,W,H,d,cv){
 const pl=vmLayout(W,H),r=Math.min(240,Math.round(pl.w*d));
 cv.width=Math.max(1,r);
 cv.height=Math.max(1,r);
 const g=cv.getContext('2d'),
  im=g.createImageData(cv.width,cv.height),
  xs=Gd.xs,
  a0=xs[0],
  a1=xs[xs.length-1],
  tv=Gd.T.flat().filter(v=>v===v),
  lo=Math.min(...tv),
  hi=Math.max(...tv);
 for(let py=0;py<cv.height;py++)for(let px=0;px<cv.width;px++){
  const a=a0+(px+.5)/cv.width*(a1-a0),
   b=a1-(py+.5)/cv.height*(a1-a0),
   c=vir((bil2(Gd.T,xs,xs,a,b)-lo)/Math.max(1e-12,hi-lo)),
   k=4*(py*cv.width+px);
  im.data[k]=c[0];
  im.data[k+1]=c[1];
  im.data[k+2]=c[2];
  im.data[k+3]=255
 }
 g.putImageData(im,0,0);
 const bv=Gd.be.flat().filter(v=>v===v),
  blo=bv.length?Math.min(...bv):NaN,
  bhi=bv.length?Math.max(...bv):NaN,
  lev=bv.length?vmLev(blo,bhi):[],
  F=(a,b)=>bil2(Gd.be,xs,xs,a,b),
  seg=lev.map(L=>({L,s:contourSeg(F,a0,a1,a0,a1,64,L)})).filter(q=>q.s.length);
 /* T_b = 0 の線（場が 0 をまたぐとき） */
 const z=lo<0&&hi>0?contourSeg((a,b)=>bil2(Gd.T,xs,xs,a,b),a0,a1,a0,a1,64,0):[];
 return{img:cv,lo,hi,seg,z,blo,bhi}
}
/* ===== 運転点のマップ（SPEC-37 A） ===== */
/* 場の格子の数（横，縦），等高線の本数の上限，色の画像の大きさの上限 */
const OPD={nx:120,ny:80,nl:10,iw:240,ih:200};
/* マップの領域：左に縦軸の目盛と軸名，下に横軸の目盛と軸名，右に横軸の端の目盛の文字の半分 */
const opLayout=(W,H)=>({x:42,y:8,w:Math.max(40,W-60),h:Math.max(40,H-44)});
/* 縦軸：0 から，全開の軸トルクの最大の 1.05 倍を含む目盛まで．目盛の刻みは {1, 2, 5} × 10^k のうち目盛が 6 本以下になる最小のもの */
function opAxis(tm){
 const t=Math.max(1e-9,1.05*tm);
 let s=1;
 for(let k=Math.floor(Math.log10(t))-1;;k++){const q=[1,2,5].map(m=>m*10**k).find(q=>t/q<=6);if(q){s=q;break}}
 const mx=Math.ceil(t/s-1e-9)*s,tv=[];
 for(let v=0;v<=mx+1e-9;v+=s)tv.push(+v.toPrecision(12));
 return{mx,s,tv}
}
/* 等高線（marching squares）：格子の節点の値 v（(nx+1)×(ny+1)．v[j(nx+1)+i] は (x0+i·sx, y0+j·sy) の値）から，値 L の線分を返す．4 隅のどれかが未定義（NaN）の小区画には引かない */
function contourV(v,nx,ny,x0,x1,y0,y1,L){
 const sx=(x1-x0)/nx,sy=(y1-y0)/ny,out=[],w=nx+1;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const c=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]],f=c.map(([a,b])=>v[b*w+a]),pts=[];
  if(f.some(q=>q!==q))continue;
  for(let e=0;e<4;e++){
   const f1=f[e],f2=f[(e+1)%4];
   if((f1-L)*(f2-L)<0){
    const t=(L-f1)/(f2-f1),[pi,pj]=c[e],[qi,qj]=c[(e+1)%4];
    pts.push([x0+(pi+t*(qi-pi))*sx,y0+(pj+t*(qj-pj))*sy])
   }
  }
  if(pts.length===2)out.push(pts);else if(pts.length===4)out.push([pts[0],pts[1]],[pts[2],pts[3]])
 }
 return out
}
/* 色の画像と等高線を作る（値が変わったときだけ）．M は at(N, T) と tmax() を持つもの（OpMap），qi は量の番号（OPQ） */
function opBuild(M,qi,W,H,d,cv){
 const Q=OPQ[qi],
  pl=opLayout(W,H),
  ya=opAxis(M.tmax()),
  nx=OPD.nx,
  ny=OPD.ny,
  w=nx+1,
  x1=SWC.N1,
  y1=ya.mx,
  v=new Float64Array(w*(ny+1));
 let lo=Infinity,hi=-Infinity;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const r=M.at(x1*i/nx,y1*j/ny),f=r?r[Q.k]*Q.sc:NaN;
  v[j*w+i]=f;
  if(f===f){if(f<lo)lo=f;if(f>hi)hi=f}
 }
 const ok=hi>=lo,lev=ok?vmNice(Math.max(lo,Q.fr*hi),hi,OPD.nl):[];
 cv.width=Math.max(1,Math.min(OPD.iw,Math.round(pl.w*d)));
 cv.height=Math.max(1,Math.min(OPD.ih,Math.round(pl.h*d)));
 const g=cv.getContext('2d'),im=g.createImageData(cv.width,cv.height),nb=lev.length,pal=[];
 for(let b=0;b<=nb;b++)pal.push(vir(nb?b/nb:.5));
 /* 画素の値は場の格子の双一次補間．4 隅のどれかが領域の外にある小区画（領域の縁）の画素は，点の値を直接求める */
 for(let px=0;px<cv.width;px++){
  const N=(px+.5)/cv.width*x1,L=M.loc?M.loc(N):null,fx=(px+.5)/cv.width*nx,i=Math.min(nx-1,Math.floor(fx)),a=fx-i;
  for(let py=0;py<cv.height;py++){
   const fy=(1-(py+.5)/cv.height)*ny,j=Math.min(ny-1,Math.floor(fy)),b=fy-j,q=j*w+i,k=4*(py*cv.width+px);
   let f=(v[q]*(1-a)+v[q+1]*a)*(1-b)+(v[q+w]*(1-a)+v[q+w+1]*a)*b;
   if(f!==f){const r=M.at(N,fy/ny*y1,L||undefined);f=r?r[Q.k]*Q.sc:NaN}
   if(f!==f)continue;
   let n=0;
   while(n<nb&&lev[n]<=f)n++;
   const c=pal[n];
   im.data[k]=c[0];
   im.data[k+1]=c[1];
   im.data[k+2]=c[2];
   im.data[k+3]=255
  }
 }
 g.putImageData(im,0,0);
 return{img:cv,qi,lo,hi,ok,lev,ya,seg:lev.map(L=>({L,s:contourV(v,nx,ny,0,x1,0,y1,L)})).filter(q=>q.s.length)}
}
/* マップを描く．S：{M（OpMap），C（opBuild の結果），sel（選んだ点 {N, T}），cur（運転中の機関の点 {N, T}），best（熱効率最大の点），msg}．領域，印，等高線の値の枠，凡例の枠を返す */
function drawOp(g,W,H,S,col){
 const pl=opLayout(W,H),
  C=S.C,
  x1=SWC.N1,
  ya=C?C.ya:opAxis(S.M?S.M.tmax():50),
  X=n=>pl.x+pl.w*n/x1,
  Y=t=>pl.y+pl.h*(1-t/ya.mx),
  mk=[],
  lab=[];
 let lg=null;
 g.font='11px system-ui,sans-serif';
 g.textBaseline='middle';
 g.lineWidth=1;
 if(C&&C.ok){
  g.drawImage(C.img,pl.x,pl.y,pl.w,pl.h);
  g.save();
  g.beginPath();
  g.rect(pl.x,pl.y,pl.w,pl.h);
  g.clip();
  g.strokeStyle='rgba(20,24,31,.7)';
  for(const q of C.seg){
   g.beginPath();
   for(const [p1,p2] of q.s){g.moveTo(X(p1[0]),Y(p1[1]));g.lineTo(X(p2[0]),Y(p2[1]))}
   g.stroke()
  }
  /* 全開の軸トルクの曲線（領域の上の縁）と下の縁 */
  const cs=S.M.cols();
  for(const k of['hi','lo']){
   g.strokeStyle=col.fg;
   g.lineWidth=k==='hi'?1.5:1;
   g.beginPath();
   let pen=false;
   cs.forEach(c=>{if(!c){pen=false;return}if(pen)g.lineTo(X(c.N),Y(c[k]));else g.moveTo(X(c.N),Y(c[k]));pen=true});
   g.stroke()
  }
  g.lineWidth=1;
  /* 等高線の値：各線の線分の中点を，領域の縁から遠い順に候補とし，印とほかの文字に重ならない最初の位置に書く（置けなければ書かない） */
  const occ=[S.best,S.cur,S.sel].filter(Boolean).map(p=>({x:X(p.N)-9,y:Y(p.T)-9,w:18,h:18})),
   hit=r=>occ.some(o=>r.x<o.x+o.w&&o.x<r.x+r.w&&r.y<o.y+o.h&&o.y<r.y+r.h),
   Q=OPQ[C.qi];
  g.font='10px system-ui,sans-serif';
  g.textAlign='left';
  const tl=`${Q.n} ${Q.l} [${Q.u}]`,tw=g.measureText(tl).width;
  lg={x:pl.x+4,y:pl.y+2,w:tw+6,h:16};
  occ.push(lg);
  g.textAlign='center';
  for(const q of C.seg){
   const t=String(q.L),
    w=g.measureText(t).width+4,
    cand=q.s.filter((_,k)=>k%3===0).map(sg=>{
     const m=[(sg[0][0]+sg[1][0])/2,(sg[0][1]+sg[1][1])/2];
     return[m,Math.min(X(m[0])-pl.x,pl.x+pl.w-X(m[0]),Y(m[1])-pl.y,pl.y+pl.h-Y(m[1]))]
    }).sort((a,b)=>b[1]-a[1]);
   for(const [m] of cand){
    const r={x:X(m[0])-w/2,y:Y(m[1])-7,w,h:14};
    if(r.x<pl.x||r.x+r.w>pl.x+pl.w||r.y<pl.y||r.y+r.h>pl.y+pl.h||hit(r))continue;
    occ.push(r);
    lab.push(r);
    g.lineWidth=3;
    g.strokeStyle='rgba(20,24,31,.8)';
    g.strokeText(t,X(m[0]),Y(m[1]));
    g.fillStyle='#ffffff';
    g.fillText(t,X(m[0]),Y(m[1]));
    g.lineWidth=1;
    break
   }
  }
  g.restore();
  g.font='10px system-ui,sans-serif';
  g.textAlign='left';
  g.fillStyle=col.fg;
  g.fillText(tl,lg.x+3,lg.y+8)
 }else{
  g.fillStyle=col.mu;
  g.textAlign='center';
  g.fillText(S.msg||'',pl.x+pl.w/2,pl.y+pl.h/2)
 }
 g.strokeStyle=col.ln;
 g.lineWidth=1;
 g.strokeRect(pl.x,pl.y,pl.w,pl.h);
 g.fillStyle=col.mu;
 g.font='11px system-ui,sans-serif';
 g.textAlign='center';
 for(let n=0;n<=x1;n+=1000)g.fillText(n,X(n),pl.y+pl.h+11);
 g.fillText('回転数 N [rpm]',pl.x+pl.w/2,pl.y+pl.h+27);
 g.textAlign='right';
 for(const t of ya.tv)g.fillText(t,pl.x-4,Y(t));
 g.save();
 g.translate(pl.x-31,pl.y+pl.h/2);
 g.rotate(-Math.PI/2);
 g.textAlign='center';
 g.fillText('軸トルク T_b [N·m]',0,0);
 g.restore();
 const draw=(p,sh,c)=>{
  const x=X(p.N),y=Y(p.T);
  mk.push({sh,x,y});
  g.fillStyle=c;
  g.strokeStyle='#14181f';
  g.lineWidth=1.5;
  g.beginPath();
  if(sh==='o')g.arc(x,y,5,0,7);else if(sh==='s'){
   for(let k=0;k<10;k++){const r=k%2?3:7,t=-PI/2+k*PI/5;g.lineTo(x+r*Math.cos(t),y+r*Math.sin(t))}
   g.closePath()
  }else{g.rect(x-1.5,y-7,3,14);g.rect(x-7,y-1.5,14,3)}
  g.fill();
  if(sh!=='+')g.stroke()
 };
 const inR=p=>p&&p.N>=0&&p.N<=x1&&p.T>=0&&p.T<=ya.mx;
 if(C&&C.ok&&inR(S.best))draw(S.best,'s','#ff8a4c');
 if(inR(S.cur))draw(S.cur,'o','#ffffff');
 if(C&&C.ok&&inR(S.sel))draw(S.sel,'+','#ffffff');
 return{pl,mk,lab,lg,X,Y,ya}
}
const vir=t=>{
 t=Math.max(0,Math.min(1,t));
 const c=[[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]],x=t*4,i=Math.min(3,Math.floor(x)),f=x-i;
 return c[i].map((v,k)=>Math.round(v+(c[i+1][k]-v)*f))
};
/* マップを描く．S：{M（VVTMap），Gd，C（vmBuild の結果），p0（現在の位相），sel（選んだ点）}．印の位置を返す */
function drawVM(g,W,H,S,col){
 g.font='11px system-ui,sans-serif';
 g.textBaseline='middle';
 const pl=vmLayout(W,H),lo=VVM.lo,hi=VVM.hi,X=a=>pl.x+pl.w*(a-lo)/(hi-lo),Y=b=>pl.y+pl.h*(1-(b-lo)/(hi-lo));
 g.strokeStyle=col.ln;
 g.lineWidth=1;
 if(!S.Gd){
  g.strokeRect(pl.x,pl.y,pl.w,pl.h);
  g.fillStyle=col.mu;
  g.textAlign='center';
  g.fillText(S.msg||'',pl.x+pl.w/2,pl.y+pl.h/2);
  return{pl,mk:[]}
 }
 const C=S.C;
 g.drawImage(C.img,pl.x,pl.y,pl.w,pl.h);
 g.save();
 g.beginPath();
 g.rect(pl.x,pl.y,pl.w,pl.h);
 g.clip();
 g.strokeStyle='rgba(255,255,255,.85)';
 g.fillStyle='#ffffff';
 g.lineWidth=1;
 for(const q of C.seg){
  g.beginPath();
  for(const [p1,p2] of q.s){g.moveTo(X(p1[0]),Y(p1[1]));g.lineTo(X(p2[0]),Y(p2[1]))}
  g.stroke()
 }
 /* T_b = 0 の線（黒の破線） */
 if(C.z&&C.z.length){
  g.strokeStyle='#000000';
  g.lineWidth=1.5;
  g.setLineDash([4,3]);
  g.beginPath();
  for(const [p1,p2] of C.z){g.moveTo(X(p1[0]),Y(p1[1]));g.lineTo(X(p2[0]),Y(p2[1]))}
  g.stroke();
  g.setLineDash([]);
  g.lineWidth=1
 }
 /* 値の文字：各線の線分の中点を，枠から遠い順に候補とし，印と置いた文字に重ならない最初の位置に置く（置けなければ書かない） */
 const mkp=[S.p0,S.M.opt.T&&S.M.opt.T.x,S.M.opt.B&&S.M.opt.B.x,S.sel&&S.sel.x].filter(Boolean).map(p=>({x:X(p[0])-8,y:Y(p[1])-8,w:16,h:16})),
  occ=mkp.slice(),
  hit=r=>occ.some(o=>r.x<o.x+o.w&&o.x<r.x+r.w&&r.y<o.y+o.h&&o.y<r.y+r.h);
 g.font='10px system-ui,sans-serif';
 const place=(segs,t,fg,bg)=>{
  const w=g.measureText(t).width+4,
   cand=segs.filter((_,k)=>k%3===0).map(sg=>{
    const m=[(sg[0][0]+sg[1][0])/2,(sg[0][1]+sg[1][1])/2];
    return[m,Math.min(m[0]-lo,hi-m[0],m[1]-lo,hi-m[1])]
   }).sort((a,b)=>b[1]-a[1]);
  for(const [m] of cand){
   const r={x:X(m[0])-w/2,y:Y(m[1])-7,w,h:14};
   if(r.x<pl.x||r.x+r.w>pl.x+pl.w||r.y<pl.y||r.y+r.h>pl.y+pl.h||hit(r))continue;
   occ.push(r);
   g.textAlign='center';
   g.lineWidth=3;
   g.strokeStyle=bg;
   g.strokeText(t,X(m[0]),Y(m[1]));
   g.fillStyle=fg;
   g.fillText(t,X(m[0]),Y(m[1]));
   g.lineWidth=1;
   return r
  }
  return null
 };
 if(C.z&&C.z.length)place(C.z,'T_b = 0','#000000','rgba(255,255,255,.85)');
 for(const q of C.seg)place(q.s,String(q.L),'#ffffff','rgba(20,24,31,.8)');
 /* VALVE HIT の点：周り 10° 四方を斜線 */
 const sp=VVM.ph[1]-VVM.ph[0];
 g.strokeStyle='rgba(255,80,80,.9)';
 VVM.ph.forEach((b,j)=>VVM.ph.forEach((a,i)=>{
  if(!S.M.H[j][i])return;
  const x0=X(a-sp/2),y0=Y(b+sp/2),w=X(a+sp/2)-x0,h=Y(b-sp/2)-y0;
  g.beginPath();
  for(let k=-h;k<w;k+=5){g.moveTo(x0+k,y0+h);g.lineTo(x0+k+h,y0)}
  g.stroke()
 }));
 g.restore();
 g.strokeStyle=col.ln;
 g.strokeRect(pl.x,pl.y,pl.w,pl.h);
 g.fillStyle=col.mu;
 g.font='11px system-ui,sans-serif';
 g.textAlign='center';
 for(const v of[-40,-20,0,20,40]){g.fillText(v,X(v),pl.y+pl.h+11);g.textAlign='right';g.fillText(v,pl.x-4,Y(v));g.textAlign='center'}
 g.fillText('吸気位相 φin（°CA，負 = 進角）',pl.x+pl.w/2,pl.y+pl.h+26);
 g.save();
 g.translate(pl.x-29,pl.y+pl.h/2);
 g.rotate(-Math.PI/2);
 g.fillText('排気位相 φex（°CA）',0,0);
 g.restore();
 const lx=pl.x+pl.w+8;
 for(let k=0;k<pl.h;k++){const c=vir(1-k/pl.h);g.fillStyle=`rgb(${c})`;g.fillRect(lx,pl.y+k,10,1.5)}
 g.fillStyle=col.mu;
 g.textAlign='left';
 g.font='10px system-ui,sans-serif';
 g.fillText(C.hi.toFixed(1),lx+12,pl.y+5);
 g.fillText(C.lo.toFixed(1),lx+12,pl.y+pl.h-5);
 g.fillText('N·m',lx+12,pl.y+pl.h/2);
 const mk=[],
  draw=(a,b,sh,c)=>{
   const x=X(a),y=Y(b);
   mk.push({sh,x,y});
   g.fillStyle=c;
   g.strokeStyle='#14181f';
   g.lineWidth=1.5;
   g.beginPath();
   if(sh==='o')g.arc(x,y,5,0,7);else if(sh==='s'){
    for(let k=0;k<10;k++){const r=k%2?3:7,t=-PI/2+k*PI/5;g.lineTo(x+r*Math.cos(t),y+r*Math.sin(t))}
    g.closePath()
   }else if(sh==='d'){g.moveTo(x,y-6);g.lineTo(x+6,y);g.lineTo(x,y+6);g.lineTo(x-6,y);g.closePath()}else{g.rect(x-1.5,y-7,3,14);g.rect(x-7,y-1.5,14,3)}
   g.fill();
   if(sh!=='+')g.stroke()
  };
 draw(S.p0[0],S.p0[1],'o','#ffffff');
 if(S.M.opt.T)draw(...S.M.opt.T.x,'s','#ff8a4c');
 if(S.M.opt.B)draw(...S.M.opt.B.x,'d','#4dabf7');
 if(S.sel)draw(...S.sel.x,'+','#ffffff');
 return{pl,mk,X,Y}
}
