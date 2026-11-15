/* ===== axes: ticks, staged autorange, band autorange ===== */
const lam=x=>{if(!(x>0))return 1;const k=Math.pow(10,Math.floor(Math.log10(x)));for(const m of[1,2,5,10]){const v=+(k*m).toPrecision(6);if(v>=x*(1-1e-12))return v}return k*10};
function ticks(a,b){const sp=b-a;let d=Math.pow(10,Math.floor(Math.log10(sp/8))),r=d*10;for(const m of[1,2,5,10])if(sp/(d*m)<=8+1e-9){r=d*m;break}d=+r.toPrecision(6);const v=[];for(let n=Math.ceil(a/d-1e-9);n*d<=b+d*1e-9;n++)v.push(+(n*d).toPrecision(12));return{d,v}}
const niceCeil=v=>{const d=ticks(0,v).d;return +(Math.ceil(v/d-1e-9)*d).toPrecision(12)};
class AxS{constructor(F0,lo,hi,sym){this.F0=F0;this.lo=lo;this.hi=hi;this.sym=!!sym;this.F=F0;this.tl=null;this.tc=-1e9;this.n=0}
up(M,now){if(!(M>=0))return;let F=this.F;if(M>F){F=Math.min(this.hi,lam(1.1*M));this.tl=null}else if(M<.4*F){if(this.tl==null)this.tl=now;if(now-this.tl>=3000){F=Math.max(this.lo,Math.min(this.hi,lam(1.25*M)));this.tl=null}}else this.tl=null;
if(F!==this.F&&now-this.tc>=1000){this.F=F;this.tc=now;this.n++}}
reset(){this.F=this.F0;this.tl=null;this.tc=-1e9}get a(){return this.sym?-this.F:0}get b(){return this.F}}
class AxB{constructor(smin){this.smin=smin;this.a=0;this.b=4*smin;this.s=smin;this.tl=null;this.tc=-1e9;this.n=0;this.init=0}
calc(m,M){const sp=Math.max(M-m,1e-9),lo=m-.1*sp,hi=M+.1*sp;for(let s=this.smin;;s=lam(s*1.01)){let a=+(s*Math.floor(lo/s)).toPrecision(12),b=+(s*Math.ceil(hi/s)).toPrecision(12),k=Math.round((b-a)/s);if(k<=8){for(let t=0;k<4;t++,k++){if(t%2)b+=s;else a-=s}return[a,b,s]}}}
up(m,M,now){if(!(M>=m))return;let ch=!this.init||m<this.a||M>this.b;if(!ch){if((M-m)/(this.b-this.a)<.25){if(this.tl==null)this.tl=now;if(now-this.tl>=3000){ch=1;this.tl=null}}else this.tl=null}
if(ch){const[a,b,s]=this.calc(m,M);if(a!==this.a||b!==this.b){this.a=a;this.b=b;this.s=s;this.tc=now;this.n++}this.init=1}}
reset(){this.init=0;this.tl=null}}
const mkAX=()=>({p:new AxS(5000,500,50000),T:new AxS(3000,3000,5000),dq:new AxS(100,10,1000),mf:new AxS(200,20,2000,1),m:new AxS(1000,100,5000),mth:new AxS(20,1,100),tq:new AxS(500,50,5000,1),N:new AxB(10),vp:new AxS(10,5,50,1),Nt:new AxS(2000,1000,10000),Tw:new AxB(10),tb:new AxS(50,10,500),cyc:-1});
const amax=(...A)=>{let m=0;for(const a of A)for(let i=0;i<a.length;i++){const v=Math.abs(a[i]);if(v>m)m=v}return m};
const amm=(...A)=>{let lo=Infinity,hi=-Infinity;for(const a of A)for(let i=0;i<a.length;i++){const v=a[i];if(v===v){if(v<lo)lo=v;if(v>hi)hi=v}}return[lo,hi]};
function axUpdate(c,AX,now){const t=c.tr,H=c.H;if(c.s.cyc!==AX.cyc&&c.s.cyc>0){AX.cyc=c.s.cyc;AX.p.up(amax(t.p),now);AX.T.up(amax(t.T),now);AX.dq.up(amax(t.dq),now);AX.mf.up(amax(t.mi,t.me),now);AX.m.up(amax(t.m),now);AX.mth.up(amax(t.mt),now);AX.tq.up(amax(t.Ti,t.Ts,t.Td,t.Tf),now);AX.vp.up(amax(t.vp),now);const[a,b]=amm(t.N);AX.N.up(a,b,now)}
if(H.t.length){AX.Nt.up(amax(H.N,H.Nt),now);const[a,b]=amm(H.Tw);AX.Tw.up(a,b,now);const[c1,c2]=amm(H.tb,H.td);if(c2>=c1){AX.tb.sym=c1<0;AX.tb.up(Math.max(Math.abs(c1),Math.abs(c2)),now)}}}
function axReset(AX){for(const k in AX)if(AX[k]&&AX[k].reset)AX[k].reset();AX.cyc=-1}
/* ===== plot layout (pure geometry, testable) and drawing ===== */
const tfmt=(v,d)=>{const n=Math.max(0,-Math.floor(Math.log10(d)+1e-9));return v.toFixed(Math.min(n,6))};
function axt(ax){if(ax.log){const o=[];for(let e=Math.round(Math.log10(ax.a));e<=Math.round(Math.log10(ax.b));e++)o.push({v:Math.pow(10,e),s:e>=0?String(Math.pow(10,e)):Math.pow(10,e).toFixed(-e)});return o}
if(ax.tv)return ax.tv.map(v=>({v,s:String(v)}));const t=ticks(ax.a,ax.b);return t.v.map(v=>({v,s:tfmt(v,t.d)}))}
function layout(g,x,y,w,h,sp){g.font='11px system-ui,sans-serif';const mw=s=>g.measureText(s).width,yt=axt(sp.ya),xt=axt(sp.xa),ml=Math.ceil(Math.max(...yt.map(t=>mw(t.s))))+8,mr=14,mt=16,mb=34;
const pl={x:x+ml,y:y+mt,w:Math.max(10,w-ml-mr),h:Math.max(10,h-mt-mb)},f=(ax,v)=>ax.log?(Math.log10(v)-Math.log10(ax.a))/(Math.log10(ax.b)-Math.log10(ax.a)):(v-ax.a)/(ax.b-ax.a),
sx=v=>pl.x+f(sp.xa,v)*pl.w,sy=v=>pl.y+pl.h-f(sp.ya,v)*pl.h,R=[];
const ys=Math.max(1,Math.ceil(13/(pl.h/Math.max(1,yt.length-1))));yt.forEach((t,i)=>{t.px=sy(t.v);if((yt.length-1-i)%ys===0){const tw=mw(t.s);R.push({t:'yt',s:t.s,x:pl.x-5-tw,y:t.px-6,w:tw,h:12,ax:'y'})}});
const xw=Math.max(...xt.map(t=>mw(t.s)))+8,xs=Math.max(1,Math.ceil(xw/(pl.w/Math.max(1,xt.length-1))));xt.forEach((t,i)=>{t.px=sx(t.v);if(i%xs===0){const tw=mw(t.s);R.push({t:'xt',s:t.s,x:Math.min(x+w-tw-1,Math.max(x+1,t.px-tw/2)),y:pl.y+pl.h+8,w:tw,h:12,ax:'x'})}});
const yn=sp.ya.name,xn=sp.xa.name;R.push({t:'yn',s:yn,x:pl.x+2,y:y+1,w:mw(yn),h:12});R.push({t:'xn',s:xn,x:pl.x+pl.w/2-mw(xn)/2,y:pl.y+pl.h+21,w:mw(xn),h:12});
let lx=pl.x+pl.w,ly=y+1,lmin=pl.x+mw(yn)+10;(sp.lg||[]).slice().reverse().forEach(l=>{const tw=mw(l.n)+12;if(lx-tw-6<lmin){lx=pl.x+pl.w;ly+=14;lmin=pl.x+4}lx-=tw+6;R.push({t:'lg',s:l.n,c:l.c,x:lx,y:ly,w:tw,h:12})});
return{pl,sx,sy,xt,yt,R,sp}}
function drawPlot(g,L,ser,col,cross){const{pl,sx,sy,R,sp}=L;g.font='11px system-ui,sans-serif';g.textBaseline='top';g.textAlign='left';g.lineWidth=1;g.strokeStyle=col.ln;g.beginPath();L.yt.forEach(t=>{g.moveTo(pl.x,Math.round(t.px)+.5);g.lineTo(pl.x+pl.w,Math.round(t.px)+.5)});L.xt.forEach(t=>{g.moveTo(Math.round(t.px)+.5,pl.y);g.lineTo(Math.round(t.px)+.5,pl.y+pl.h)});g.stroke();
g.strokeStyle=col.fg;g.beginPath();g.moveTo(pl.x+.5,pl.y);g.lineTo(pl.x+.5,pl.y+pl.h+.5);g.lineTo(pl.x+pl.w,pl.y+pl.h+.5);g.stroke();
for(const r of R){if(r.t==='lg'){g.fillStyle=r.c;g.fillRect(r.x,r.y+4,8,4);g.fillStyle=col.fg;g.fillText(r.s,r.x+12,r.y)}else{g.fillStyle=r.t==='yn'||r.t==='xn'?col.fg:((r.ax==='y'&&sp.ya.hot)||(r.ax==='x'&&sp.xa.hot))?col.ac:col.mu;g.fillText(r.s,r.x,r.y)}}
g.save();g.beginPath();g.rect(pl.x,pl.y-1,pl.w+1,pl.h+2);g.clip();const lg=sp.xa.log;
for(const q of ser){g.strokeStyle=q.c;g.lineWidth=q.w||1.6;g.beginPath();let s=0;const X=q.X,Y=q.Y,n=X.length;for(let i=0;i<n;i++){const u=X[i],v=Y[i];if(u!==u||v!==v||(lg&&(u<=0||v<=0))){s=0;continue}const px=sx(u),py=sy(v);s?g.lineTo(px,py):g.moveTo(px,py);s=1}g.stroke();if(q.mk){for(let i=0;i<n;i++){const u=X[i],v=Y[i];if(u!==u||v!==v)continue;g.beginPath();g.arc(sx(u),sy(v),3,0,2*PI);if(q.ho&&q.ho[i]){g.fillStyle=col.cd||'#fff';g.fill();g.stroke()}else{g.fillStyle=q.c;g.fill()}}}}
if(cross!=null){const px=pl.x+cross*pl.w;g.strokeStyle=col.ac;g.lineWidth=1;g.beginPath();g.moveTo(px,pl.y);g.lineTo(px,pl.y+pl.h);g.stroke()}g.restore()}
/* ===== screen specifications ===== */
const CL={a:'#e8590c',b:'#1c7ed6',k:'#2f9e44',g:'#868e96',v:'#9c36b5'};
const TH=Float32Array.from({length:1440},(_,i)=>360+i/2);
const TH0=Float32Array.from({length:1440},(_,i)=>i/2);
const rot=a=>{const o=new Float32Array(1440);for(let i=0;i<1440;i++)o[i]=a[(i+720)%1440];return o};
function screenSpec(c,AX,sub,o){o=o||{};const t0=c.tr,t=new Proxy({},{get:(o,k)=>o[k]||(o[k]=rot(t0[k]))}),H=c.H,G=c.G,now=o.now||0,hot=a=>now-a.tc<1000,xth={a:0,b:720,name:'θ [°CA]（0 = 吸気上死点）',tv:[0,180,360,540,720]},xpt={a:180,b:540,name:'θ [°CA]（360 = 圧縮上死点）',tv:[180,270,360,450,540]},xtv={a:360,b:1080,name:'θ [°CA]（720 = 吸気上死点）',tv:[360,540,720,900,1080]},S=(X,Y,cc,w)=>({X,Y,c:cc,w});
const st=(a,name)=>({a:a.a,b:a.b,name,hot:hot(a)}),fx=(a,b,name)=>({a,b,name});
const tn=H.t.length?H.t[H.t.length-1]:0,HX=Float32Array.from(H.t,v=>v-tn),xt={a:-30,b:0,name:'t [s]（0 = 現在）'};
const pvS=()=>{const cur=o.last?(c.last?S(c.last.V,c.last.p,CL.a):null):S(t0.V,t0.p,CL.a),ser=[];if(o.ref)ser.push(S(o.ref.V,o.ref.p,CL.g,1.2));if(cur)ser.push(cur);const lg=[{n:'現在',c:CL.a}];if(o.ref)lg.unshift({n:'基準',c:CL.g});
if(o.log){const vm=(G.Vc+G.Vd)*1e6,v0=G.Vc*1e6,pm=Math.max(AX.p.F,1e4);return{xa:{a:Math.pow(10,Math.floor(Math.log10(v0))),b:Math.pow(10,Math.ceil(Math.log10(vm))),name:'V [cm³]',log:1},ya:{a:10,b:lam(pm)===pm&&Math.log10(pm)%1===0?pm:Math.pow(10,Math.ceil(Math.log10(pm))),name:'p [kPa]',log:1},lg,ser}}
return{xa:fx(0,niceCeil((G.Vc+G.Vd)*1e6),'V [cm³]'),ya:st(AX.p,'p [kPa]'),lg,ser}};
switch(sub){
case 0:return[pvS()];
case 1:return[{xa:xpt,ya:st(AX.p,'p [kPa]'),ser:[S(TH0,t0.p,CL.a)]},{xa:xpt,ya:st(AX.T,'T [K]'),ser:[S(TH0,t0.T,CL.b)]},{xa:xpt,ya:st(AX.dq,'熱発生率 [J/°CA]'),ser:[S(TH0,t0.dq,CL.k)]}];
case 2:return[{xa:xtv,ya:fx(0,niceCeil(c.P.Lv*1e3),'リフト [mm]'),lg:[{n:'吸気',c:CL.b},{n:'排気',c:CL.a}],ser:[S(TH,t.Li,CL.b),S(TH,t.Le,CL.a)]},{xa:xtv,ya:st(AX.mf,'弁流量 [g/s]'),lg:[{n:'吸気',c:CL.b},{n:'排気',c:CL.a}],ser:[S(TH,t.mi,CL.b),S(TH,t.me,CL.a)]}];
case 3:return[{xa:xth,ya:st(AX.m,'筒内質量 [mg]'),lg:[{n:'全体',c:CL.a},{n:'新気',c:CL.b}],ser:[S(TH0,t0.m,CL.a),S(TH0,t0.mu,CL.b)]},{xa:xth,ya:fx(0,120,'p_in [kPa]'),ser:[S(TH0,t0.pin,CL.b)]},{xa:xth,ya:st(AX.mth,'スロットル流量 [g/s]'),ser:[S(TH0,t0.mt,CL.k)]}];
case 4:return[{xa:xth,ya:st(AX.tq,'トルク [N·m]'),lg:[{n:'図示',c:CL.a},{n:'始動',c:CL.k},{n:'摩擦',c:CL.v},{n:'動力計',c:CL.b}],ser:[S(TH0,t0.Ti,CL.a),S(TH0,t0.Ts,CL.k),S(TH0,t0.Tf,CL.v),S(TH0,t0.Td,CL.b)]},{xa:xth,ya:{a:AX.N.a,b:AX.N.b,name:'N [rpm]',hot:hot(AX.N)},ser:[S(TH0,t0.N,CL.b)]},{xa:xth,ya:st(AX.vp,'ピストン速度 [m/s]'),ser:[S(TH0,t0.vp,CL.k)]}];
case 5:return[{xa:xt,ya:st(AX.Nt,'N [rpm]'),lg:[{n:'N̄',c:CL.a},{n:'目標',c:CL.k}],ser:[S(HX,H.N,CL.a),S(HX,H.Nt,CL.k)]},{xa:xt,ya:fx(0,90,'α [°]'),ser:[S(HX,H.al,CL.b)]},{xa:xt,ya:fx(0,120,'p_in [kPa]'),ser:[S(HX,H.pin,CL.a)]},{xa:xt,ya:{a:AX.Tw.a,b:AX.Tw.b,name:'T_w [K]',hot:hot(AX.Tw)},ser:[S(HX,H.Tw,CL.k)]}];
default:return[{xa:xt,ya:st(AX.Nt,'N [rpm]'),lg:[{n:'N̄',c:CL.a},{n:'目標',c:CL.k}],ser:[S(HX,H.N,CL.a),S(HX,H.Nt,CL.k)]},{xa:xt,ya:st(AX.tb,'トルク [N·m]'),lg:[{n:'T_b',c:CL.a},{n:'T_dyno',c:CL.b}],ser:[S(HX,H.tb,CL.a),S(HX,H.td,CL.b)]},{xa:xt,ya:fx(0,1,'充水率 f [-]'),lg:[{n:'f_cmd',c:CL.a},{n:'f_eff',c:CL.b}],ser:[S(HX,H.fc,CL.a),S(HX,H.fe,CL.b)]}]}}
const SWX={a:1000,b:7000,name:'N [rpm]',tv:[1000,2000,3000,4000,5000,6000,7000]};
const swCol=al=>`hsl(${Math.round(220-(al-10)/80*210)},75%,45%)`;
function sweepSpec(cur,ref,sub){const sets=[...(ref||[]).map(q=>({p:q.pts,c:CL.g,w:1,r:1})),...(cur||[]).map(q=>({p:q.pts,c:swCol(q.al),w:1.8,al:q.al}))],lg=[...(cur||[]).map(q=>({n:q.al+'°',c:swCol(q.al)})),...(ref&&ref.length?[{n:'基準',c:CL.g}]:[])],
G=(k,f,name,fix,d0)=>{let m=0,n=0;sets.forEach(q=>q.p.forEach(o=>{const v=f(o);if(v===v&&isFinite(v)){m=Math.max(m,v);n=Math.min(n,v)}}));return{xa:SWX,ya:fix||{a:n<0?-niceCeil(-n*1.08):0,b:m>0?niceCeil(m*1.08):d0,name},lg:lg.length?lg:null,ser:sets.map(q=>({X:q.p.map(o=>o.N),Y:q.p.map(f),c:q.c,w:q.w,mk:!q.r,ho:q.p.map(o=>!o.ok)}))}},pos=f=>o=>o.pb>0?f(o):NaN;
return[[G('tb',o=>o.tb,'T_b [N·m]',null,50),G('pb',o=>o.pb/1e3,'P_b [kW]',null,20)],[G('ev',o=>o.ev,'η_v [-]',{a:0,b:1.2,name:'η_v [-]'})],[G('bsfc',pos(o=>o.bsfc),'bsfc [g/kWh]',null,500),G('eb',pos(o=>o.eb),'η_b [-]',{a:0,b:.5,name:'η_b [-]'})],[G('spa',o=>o.spa,'点火時期 [°BTDC]',null,40),G('xr',o=>o.xr,'x_r [-]',null,.2)]][sub]}
function camSpec(P,G,ref,refCam){const v=valves(P,G),mk=(vv,cm,k)=>Float32Array.from({length:1440},(_,j)=>lift(k?vv.e:vv.i,((360+j/2)*D)%P4,cm)*1e3),
cl=Float32Array.from({length:1440},(_,j)=>(G.hc+kin(G,((360+j/2)*D)%P4).x)*1e3),ser=[],lg=[];
if(ref){ser.push({X:TH,Y:mk(ref,refCam,0),c:CL.g,w:1.2},{X:TH,Y:mk(ref,refCam,1),c:CL.g,w:1.2});lg.push({n:'基準',c:CL.g})}
ser.push({X:TH,Y:cl,c:CL.v,w:1.2},{X:TH,Y:mk(v,P.cam,0),c:CL.b},{X:TH,Y:mk(v,P.cam,1),c:CL.a});lg.push({n:'吸気',c:CL.b},{n:'排気',c:CL.a},{n:'ピストン余裕',c:CL.v});
const Lm=Math.max(P.Lv,ref?ref.i.L:0)*1e3;return{xa:{a:360,b:1080,name:'θ [°CA]（720 = 吸気上死点）',tv:[360,540,720,900,1080]},ya:{a:0,b:niceCeil(Lm*1.05),name:'リフト [mm]'},lg,ser}}
const camText=(P,G)=>{const v=valves(P,G),dg=a=>(a/D).toFixed(0),ov=(v.e.c-(v.i.o+P4))/D;return`IVO ${dg(v.i.o)}° IVC ${dg(v.i.c)}° EVO ${dg(v.e.o)}° EVC ${dg(v.e.c)}°  オーバーラップ ${ov.toFixed(0)}°CA`};
function ctlText(c){const s=c.s,P=c.P,R=(k,t)=>`<span class="r${k}">${t}</span>`,Nb=Math.round(s.Nb),sp=(P.sauto?R('a','自動'):R('f','固定'))+` 点火時期 ${s.spa.toFixed(1)}° BTDC`,TH=a=>`スロットル開度 α ${(a/D).toFixed(1)}°`,FF=f=>`動力計の充水率 f ${f.toFixed(2)}`;
if(!s.fired&&!s.starter)return['停止中','START で始動','',''];const NT=`${R('c','制御量')} N̄ ${Nb} rpm`;
if(!s.fired)return[`始動中｜${R('g','目標')} 完爆 N̄ > ${K.Nfire} → ${NT}`,`${R('f','固定')} ${TH(s.al)}（始動開度）`,'',sp];
if(s.mode===0){const sat=s.al>=P.amax-1e-12?' 全開':s.al<=0?' 全閉':'';return[`スロットル制御｜${R('g','目標')} ${P.nt} → ${NT}`,`${R('m','操作量')} ${TH(s.al)}${sat}`,`${R('f','固定')} ${FF(P.fm)}`,sp]}
const sat=s.fc>=1?' 上限':s.fc<=0?' 下限':'';return[`動力計制御｜${R('g','目標')} ${P.nt} → ${NT}`,`${R('m','操作量')} ${FF(s.fc)}${sat}`,`${R('f','固定')} ${TH(P.alm)}`,sp]}
function drawScreen(g,w,h,specs,col,cross){const n=specs.length,ph=h/n,Ls=[];specs.forEach((sp,i)=>{const L=layout(g,2,i*ph+2,w-4,ph-2,sp);drawPlot(g,L,sp.ser,col,cross);Ls.push(L)});return Ls}
/* ===== engine scene (pure geometry) ===== */
const gasHue=T=>215+165*Math.min(1,Math.max(0,(T-300)/1700));
const NTB=48,NTS={lo:500,hi:8000,st:50};
function scene(c,W,Hh){const G=c.G,P=c.P,s=c.s,th=s.y[0],tt=md4(th),k=kin(G,th),B=G.B,b=B/2,wt=.012,r=G.r,l=G.l,hc=G.hc,pp=.32*B,hp=.62*B,V=c.V,hh=.062,
yc=hc+k.x,yC=hc+pp+r+l,top=-.1,bot=yC+1.7*r+.006,xo=b+wt+.045,sc=Math.min(W*.6/(2*xo+.02),(Hh-8)/(bot-top)),ox=W*.6,oy=(Hh-(bot-top)*sc)/2,X=x=>ox+x*sc,Y=y=>oy+(y-top)*sc,
xi=-.26*B,xe=.26*B,di=V.i.d,de=V.e.d,Li=lift(V.i,tt,P.cam),Le=lift(V.e,tt,P.cam),yb=hc+G.S+.45*B;
const port=(xv,dv,sg)=>{const h2=dv*.52,X0=sg*xo,inner=xv-sg*h2,outer=xv+sg*h2;return[[inner,0],[inner,-.052],[X0,-.052],[X0,-.028],[outer,-.028],[outer,0]].map(q=>[X(q[0]),Y(q[1])])},
cl=(xv,dv,sg)=>{const o=[],xa=sg*(xo-.004),xb=xv+sg*dv*.3;for(let i=0;i<10;i++){const u=i/9;o.push(u<.6?[X(xa+(xb-xa)*u/.6),Y(-.04)]:[X(xb),Y(-.04+(-.01+.04)*(u-.6)/.4)])}return o};
return{sc,X,Y,W,Hh,B,b,wt,r,l,hc,pp,hp,hh,yb,yc,yC,xo,top,bot,xi,xe,di,de,Li,Le,tt,th,T:c.X?c.X.T:300,
crownY:Y(yc),headY:Y(0),pin:[X(0),Y(yc+pp)],cpin:[X(r*Math.sin(th)),Y(yC-r*Math.cos(th))],cc:[X(0),Y(yC)],vinY:Y(Li),vexY:Y(Le),
portIn:port(xi,di,-1),portEx:port(xe,de,1),clIn:cl(xi,di,-1),clEx:cl(xe,de,1),
ext:[X(-xo),Y(top),X(xo),Y(bot)]}}
function segX(a,b,c,d){const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);const d1=o(c,d,a),d2=o(c,d,b),d3=o(a,b,c),d4=o(a,b,d);return d1*d2<0&&d3*d4<0}
function simplePoly(p){const n=p.length;for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(segX(p[i],p[(i+1)%n],p[j],p[(j+1)%n]))return false}return true}
function drawEngine(g,c,W,Hh,col){const q=scene(c,W,Hh),{X,Y,sc,b,wt,r,hc,pp,hp,hh,yb,yc,yC,xo,xi,xe,di,de,Li,Le,tt,th,T}=q,s=c.s,P=c.P,mt='#8a93a3',md='#5b6575',pc='#b9c1cd';
const rect=(x0,y0,x1,y1)=>g.fillRect(X(x0),Y(y0),(x1-x0)*sc,(y1-y0)*sc),ln=(x0,y0,x1,y1)=>{g.moveTo(X(x0),Y(y0));g.lineTo(X(x1),Y(y1))},poly=p=>{g.beginPath();p.forEach((v,i)=>i?g.lineTo(v[0],v[1]):g.moveTo(v[0],v[1]));g.closePath()};
g.fillStyle=`hsl(${Math.max(190,215-(s.y[5]-300)*.5)} 14% 36%)`;rect(-(b+wt),-hh,-b,yb);rect(b,-hh,b+wt,yb);rect(-(b+wt),-hh,b+wt,0);
g.fillStyle=md;g.globalAlpha=.35;g.beginPath();g.moveTo(X(-(b+wt)),Y(yb));g.lineTo(X(-1.7*r),Y(yb+.012));g.lineTo(X(-1.7*r),Y(yC));g.arc(X(0),Y(yC),1.7*r*sc,PI,0,true);g.lineTo(X(1.7*r),Y(yb+.012));g.lineTo(X(b+wt),Y(yb));g.closePath();g.fill();g.globalAlpha=1;
const pr=Math.min(1.1,s.y[6]/P.pa);poly(q.portIn);g.fillStyle=`hsl(212 75% ${28+30*pr}%)`;g.fill();poly(q.portEx);g.fillStyle='hsl(22 80% 45%)';g.fill();
const arrow=(x,y,dir,m,cc)=>{const a=Math.min(1,Math.abs(m)/.05);if(a<.02)return;const w=(.006+.008*a)*sc,px=X(x),py=Y(y);g.fillStyle=cc;g.beginPath();g.moveTo(px+dir*w*1.4,py);g.lineTo(px-dir*w,py-w);g.lineTo(px-dir*w,py+w);g.closePath();g.fill()};
if(c.X){arrow(-(xo+.012),-.04,c.X.mi>=0?1:-1,c.X.mi,CL.b);arrow(xo+.012,-.04,c.X.me>=0?1:-1,c.X.me,CL.a)}
const tq=Math.min(1,Math.max(0,(T-300)/1700));g.fillStyle=`hsl(${gasHue(T)%360} 80% ${42+12*tq}%)`;g.globalAlpha=.85;rect(-b,0,b,yc);g.globalAlpha=1;
if(s.C.on&&s.fuel){const zz=md4(tt-s.C.th0)/s.C.db;if(zz>0&&zz<1){const xb=1-Math.exp(-K.wa*zz**((s.C.m??K.wm)+1)),Rf=Math.max(.004,Math.sqrt(xb)*1.25*b);g.save();g.beginPath();g.rect(X(-b),Y(0),2*b*sc,yc*sc);g.clip();const gr=g.createRadialGradient(X(0),Y(.002),0,X(0),Y(.002),Rf*sc);gr.addColorStop(0,'rgba(255,255,200,.95)');gr.addColorStop(.7,'rgba(255,170,40,.8)');gr.addColorStop(1,'rgba(255,90,20,0)');g.fillStyle=gr;g.beginPath();g.arc(X(0),Y(.002),Rf*sc,0,7);g.fill();g.restore()}}
g.fillStyle=pc;rect(-b+.0008,yc,b-.0008,yc+.012);rect(-b+.0008,yc+.012,-b+.0043,yc+hp);rect(b-.0043,yc+.012,b-.0008,yc+hp);rect(-b+.0008,yc+pp-.014,b-.0008,yc+pp+.014);
g.strokeStyle=md;g.lineWidth=1;g.beginPath();for(const o of[.004,.008,.012])ln(-b+.0008,yc+o,b-.0008,yc+o);g.stroke();
g.lineCap='round';g.strokeStyle='#d6dbe4';g.lineWidth=Math.max(3,.011*sc);g.beginPath();g.moveTo(q.pin[0],q.pin[1]);g.lineTo(q.cpin[0],q.cpin[1]);g.stroke();
g.fillStyle='#d6dbe4';g.beginPath();g.arc(q.cpin[0],q.cpin[1],.0165*sc,0,7);g.fill();g.fillStyle=md;g.beginPath();g.arc(q.pin[0],q.pin[1],.0075*sc,0,7);g.fill();
const a0=Math.atan2(Math.cos(th),-Math.sin(th));g.fillStyle=mt;g.beginPath();g.moveTo(q.cc[0],q.cc[1]);g.arc(q.cc[0],q.cc[1],1.45*r*sc,a0-1.15,a0+1.15);g.closePath();g.fill();g.beginPath();g.arc(q.cc[0],q.cc[1],r*sc*.55,0,7);g.fill();
g.strokeStyle=mt;g.lineWidth=Math.max(3,.02*sc);g.beginPath();g.moveTo(q.cc[0],q.cc[1]);g.lineTo(q.cpin[0],q.cpin[1]);g.stroke();g.lineCap='butt';g.fillStyle=md;g.beginPath();g.arc(q.cc[0],q.cc[1],.35*r*sc,0,7);g.fill();g.fillStyle='#d6dbe4';g.beginPath();g.arc(q.cpin[0],q.cpin[1],.011*sc,0,7);g.fill();
const valve=(xv,dv,Lf,cc)=>{const hw=dv/2,y1=Lf,y0=Lf-.004;g.fillStyle=cc;poly([[xv-hw,y1],[xv+hw,y1],[xv+.004,y0],[xv-.004,y0]].map(v=>[X(v[0]),Y(v[1])]));g.fill();rect(xv-.003,-.094,xv+.003,y0);
g.strokeStyle=mt;g.lineWidth=1;g.beginPath();const t0=-.088,t1=-.064+Lf*.9;for(let i=0;i<=8;i++){const yy=t0+(t1-t0)*i/8,xx=xv+(i%2?.008:-.008);i?g.lineTo(X(xx),Y(yy)):g.moveTo(X(xx),Y(yy))}g.stroke();g.fillStyle=mt;rect(xv-.009,-.092,xv+.009,-.088)};
valve(xi,di,Li,Li>1e-4?'#a9c9f5':'#c3c9d3');valve(xe,de,Le,Le>1e-4?'#f5b48c':'#c3c9d3');
g.fillStyle='#e8e2d0';rect(-.004,-.095,.004,-.05);g.fillStyle=mt;rect(-.009,-.07,.009,-.056);rect(-.006,-.056,.006,-.002);g.strokeStyle='#222';g.lineWidth=Math.max(1.5,.0012*sc);g.beginPath();ln(0,-.002,0,.006);ln(-.006,-.002,-.006,.002);ln(-.006,.002,0,.002);g.stroke();
const sa=P4/2-s.spa*D;if(s.C.on&&s.fuel&&tt>sa&&tt<sa+.25){g.strokeStyle='#ffe44d';g.lineWidth=2;g.beginPath();ln(0,.002,-.004,.005);ln(-.004,.005,.003,.007);g.stroke();g.fillStyle='rgba(255,230,90,.5)';g.beginPath();g.arc(X(0),Y(.005),.01*sc,0,7);g.fill()}
g.strokeStyle=col.fg;g.lineWidth=1.5;g.beginPath();ln(-(b+wt),-hh,b+wt,-hh);ln(-(b+wt),-hh,-(b+wt),yb);ln(b+wt,-hh,b+wt,yb);ln(-b,0,-b,yb);ln(b,0,b,yb);g.stroke();
const ph=['吸気','圧縮','膨張','排気'][Math.floor(tt/PI)%4];g.textBaseline='alphabetic';g.textAlign='left';g.fillStyle=col.fg;g.font='bold 13px system-ui,sans-serif';g.fillText((s.fired?'RUN':s.starter?'CRANK':'STOP')+'  '+(s.y[1]*30/PI|0)+' rpm',8,18);
g.font='12px system-ui,sans-serif';const fl=(s.ov>=2?' OVERLOAD':'')+(s.up>=2?' UNDERPOWER':'');[s.mode?'動力計制御':'スロットル制御',`θ ${(tt/D).toFixed(0)}°CA ${ph}`,`p ${(s.y[2]/1e3).toFixed(0)} kPa`,`T ${T.toFixed(0)} K`,`吸気弁 ${(Li*1e3).toFixed(1)} mm`,`排気弁 ${(Le*1e3).toFixed(1)} mm`,`B×S ${(q.B*1e3).toFixed(0)}×${(c.G.S*1e3).toFixed(0)}`,`l/r ${(q.l/r).toFixed(2)}`,`ε ${c.G.eps.toFixed(1)}`].forEach((t,i)=>{g.fillStyle=col.mu;g.fillText(t,8,36+i*15)});
g.fillStyle=col.ng;g.font='bold 12px system-ui,sans-serif';if(fl)g.fillText(fl.trim(),8,36+9*15);if(c.vhit)g.fillText('VALVE HIT',8,36+10*15);return q}
