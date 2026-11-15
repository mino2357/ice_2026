'use strict';
/* ===== constants (single source) ===== */
const R=287,TA=298.15,TI=298.15,TX=800,PI=Math.PI,D=PI/180,P4=4*PI;
const K={Cdx:.8,fr:.02,ze:.2,gp:1.4,lk:.025,Ck:.4,wa:5,wm:2,Cdv:.6,Cdt:.8,cfA:13.7e3,cfB:.005,cfC:16.2e3,Hu:44e6,AFR:14.7,etac:.97,C1g:2.28,C1s:6.18,C2:3.24e-3,Cw0:3.26,Twc:360,Cw:1500,Gw:15,I:.12,Tst:60,wnl:209,Nfire:550,pexo:4e3,g0:1.35,kT:.26,dal:1};
/* ===== item definition table (single source for settings, doc, tests) ===== */
const PAGES=['機関','VVT・カム','弁タイミング','吸気','燃焼','運転','ECU','動力計','解法','音響','燃焼速度','吸気ランナ','排気系'];
const ITEMS=[
{k:'B',n:'ボア B',u:'mm',f:1e-3,lo:40,hi:150,st:1,d:86,c:'r',pg:0},
{k:'S',n:'ストローク S',u:'mm',f:1e-3,lo:40,hi:150,st:1,d:86,c:'r',pg:0},
{k:'lr',n:'連桿長 l',u:'mm',f:1e-3,lo:60,hi:300,st:1,d:145,c:'r',pg:0},
{k:'eps',n:'圧縮比 ε',u:'',f:1,lo:1.1,hi:100,st:.1,d:10,c:'r',pg:0},
{k:'phin',n:'吸気位相 φin',u:'°CA',f:D,lo:-40,hi:40,st:1,d:0,c:'i',pg:1},
{k:'phex',n:'排気位相 φex',u:'°CA',f:D,lo:-40,hi:40,st:1,d:0,c:'i',pg:1},
{k:'cam',n:'カム',u:'',ch:['Std','Poly','Aggr'],d:0,c:'i',pg:1},
{k:'Lv',n:'最大リフト',u:'mm',f:1e-3,lo:3,hi:14,st:.5,d:9,c:'i',pg:1},
{k:'dv',n:'吸気弁径',u:'mm',f:1e-3,lo:20,hi:50,st:1,d:38,c:'i',pg:1},
{k:'ivo',n:'IVO',u:'°CA',f:D,lo:-40,hi:40,st:1,d:-10,c:'i',pg:2},
{k:'ivc',n:'IVC',u:'°CA',f:D,lo:190,hi:290,st:1,d:264,c:'i',pg:2},
{k:'evo',n:'EVO',u:'°CA',f:D,lo:430,hi:530,st:1,d:490,c:'i',pg:2},
{k:'evc',n:'EVC',u:'°CA',f:D,lo:690,hi:760,st:1,d:730,c:'i',pg:2},
{k:'pa',n:'大気圧 p_atm',u:'kPa',f:1e3,lo:60,hi:110,st:.1,d:101.3,c:'i',pg:3},
{k:'Dt',n:'スロットル径',u:'mm',f:1e-3,lo:20,hi:80,st:1,d:40,c:'i',pg:3},
{k:'Vin',n:'マニホールド V_in',u:'L',f:1e-3,lo:.3,hi:5,st:.1,d:1.5,c:'i',pg:3},
{k:'run',n:'吸気ランナ',u:'',ch:['OFF','ON'],d:1,c:'i',pg:11},
{k:'Lr',n:'ランナ長 L_r',u:'mm',f:1e-3,lo:100,hi:1000,st:10,d:450,c:'i',pg:11},
{k:'dr',n:'ランナ内径 d_r',u:'mm',f:1e-3,lo:20,hi:60,st:1,d:40,c:'i',pg:11},
{k:'exs',n:'排気系モデル',u:'',ch:['OFF','ON'],d:1,c:'i',pg:12},
{k:'Vm',n:'消音器容積 V_m',u:'L',f:1e-3,lo:.5,hi:10,st:.5,d:3,c:'i',pg:12},
{k:'At',n:'出口有効面積 A_t',u:'mm²',f:1e-6,lo:20,hi:3000,st:10,d:300,c:'i',pg:12},
{k:'dpx',n:'排気圧損（OFF 時）',u:'kPa',f:1e3,lo:0,hi:30,st:.5,d:4,c:'i',pg:12},
{k:'spb',n:'点火時期',u:'°BTDC',f:1,lo:null,hi:null,st:1,d:18,c:'i',pg:4},
{k:'sauto',n:'点火の自動最適化',u:'',ch:['OFF','ON'],d:1,c:'i',pg:4},
{k:'cvar',n:'サイクル変動',u:'',ch:['OFF','ON'],d:1,c:'i',pg:4},
{k:'phi',n:'当量比 φ',u:'',f:1,lo:.6,hi:1.4,st:.01,d:1,c:'i',pg:4},
{k:'cw',n:'Woschni係数',u:'',f:1,lo:0,hi:2,st:.05,d:1,c:'i',pg:4},
{k:'gam',n:'比熱',u:'',ch:['γ(T)','γ一定'],d:0,c:'i',pg:4},
{k:'mode',n:'回転数の制御',u:'',ch:['スロットル','動力計'],d:0,c:'i',pg:5},
{k:'nt',n:'目標回転数',u:'rpm',f:1,lo:500,hi:null,st:50,d:800,c:'i',pg:5},
{k:'alm',n:'固定開度',u:'°',f:D,lo:0,hi:90,st:1,d:15,c:'i',pg:5},
{k:'fm',n:'固定充水率 f',u:'',f:1,lo:0,hi:1,st:.05,d:0,c:'i',pg:5},
{k:'fb',n:'基準充水率 f',u:'',f:1,lo:0,hi:1,st:.05,d:0,c:'i',pg:5},
{k:'Ta',n:'補機負荷トルク',u:'N·m',f:1,lo:0,hi:20,st:.1,d:2,c:'i',pg:5},
{k:'tN',n:'平均時定数 τN',u:'s',f:1,lo:.05,hi:1,st:.05,d:.15,c:'i',pg:6},
{k:'alc',n:'始動開度',u:'°',f:D,lo:0,hi:90,st:1,d:6,c:'i',pg:6},
{k:'alb',n:'基準開度',u:'°',f:D,lo:0,hi:90,st:1,d:3,c:'i',pg:6},
{k:'Kp',n:'Kp',u:'°/rpm',f:D,lo:.001,hi:.2,st:.001,d:.008,c:'i',pg:6},
{k:'Ki',n:'Ki',u:'°/(rpm·s)',f:D,lo:.002,hi:.5,st:.002,d:.004,c:'i',pg:6},
{k:'amax',n:'最大開度',u:'°',f:D,lo:1,hi:90,st:1,d:90,c:'i',pg:6},
{k:'Tr',n:'定格トルク',u:'N·m',f:1,lo:5,hi:200,st:1,d:35,c:'i',pg:7},
{k:'Nr',n:'定格回転数',u:'rpm',f:1,lo:500,hi:8000,st:100,d:1500,c:'i',pg:7},
{k:'td',n:'充水時定数 τd',u:'s',f:1,lo:.05,hi:2,st:.05,d:.3,c:'i',pg:7},
{k:'Id',n:'I_dyno',u:'kg·m²',f:1,lo:.01,hi:.5,st:.01,d:.05,c:'i',pg:7},
{k:'Kpd',n:'K_pd',u:'10⁻³/rpm',f:1e-3,lo:.2,hi:10,st:.2,d:1,c:'i',pg:7},
{k:'Kid',n:'K_id',u:'10⁻³/(rpm·s)',f:1e-3,lo:.2,hi:10,st:.2,d:2,c:'i',pg:7},
{k:'sol',n:'ソルバ',u:'',ch:['RK4','DOPRI5(4)'],d:1,c:'i',pg:8},
{k:'dth',n:'RK4刻み Δθ',u:'°CA',f:D,lo:.25,hi:2,st:.25,d:.5,c:'i',pg:8},
{k:'rtol',n:'RK45 rtol',u:'',ch:['1e-4','1e-5','1e-6'],vals:[1e-4,1e-5,1e-6],d:1,c:'i',pg:8},
{k:'vol',n:'音量',u:'%',f:.01,lo:0,hi:100,st:5,d:60,c:'i',pg:9},
{k:'Lex',n:'排気管長 L',u:'m',f:1,lo:.3,hi:3,st:.1,d:1,c:'i',pg:9},
{k:'dex',n:'排気管内径 d',u:'mm',f:1e-3,lo:20,hi:80,st:2,d:40,c:'i',pg:9},
{k:'rex',n:'消音器の反射率 ρm',u:'',f:1,lo:0,hi:.95,st:.05,d:.6,c:'i',pg:9},
{k:'fl',n:'流れ雑音',u:'%',f:.01,lo:0,hi:100,st:10,d:40,c:'i',pg:9},
{k:'cid',n:'着火遅れ係数 c_d',u:'',f:1,lo:.1,hi:10,st:.1,d:1,c:'i',pg:10},
{k:'cbr',n:'燃焼速度係数 c_b',u:'',f:1,lo:.1,hi:10,st:.1,d:1,c:'i',pg:10},
{k:'wm',n:'Wiebe 形状係数 m_w',u:'',f:1,lo:0,hi:6,st:.5,d:2,c:'i',pg:10}];
const IT={};ITEMS.forEach(i=>IT[i.k]=i);
const dec=it=>{const s=String(it.st);return s.includes('.')?s.split('.')[1].length:0};
const lo0=it=>it.lo??0,gmin=it=>it.lo==null?-Infinity:0;
const gi=(it,v)=>Math.round((v/it.f-lo0(it))/it.st);                       /* grid index of internal value */
const gmax=it=>it.hi==null?Infinity:Math.round((it.hi-it.lo)/it.st);
const gv=(it,n)=>(+(lo0(it)+n*it.st).toFixed(8))*it.f;  /* internal value at grid index */
const disp=(it,v)=>it.ch?it.ch[it.vals?it.vals.indexOf(v):v]:(v/it.f).toFixed(dec(it));
const defv=it=>it.ch?(it.vals?it.vals[it.d]:it.d):gv(it,Math.round((it.d-lo0(it))/it.st));
const mkP=()=>{const P={};ITEMS.forEach(i=>P[i.k]=defv(i));return P};
/* ===== geometry & thermo ===== */
function geo(P){const G={B:P.B,S:P.S,l:P.lr,eps:P.eps};G.r=G.S/2;G.lam=G.r/G.l;G.Ap=PI*G.B*G.B/4;G.Vd=G.Ap*G.S;G.Vc=G.Vd/(G.eps-1);G.hc=G.Vc/G.Ap;G.Bm=G.B**-.2;return G}
const kinV=(G,th)=>{const s=Math.sin(th),c=Math.cos(th),q=Math.sqrt(1-G.lam*G.lam*s*s);return G.Vc+G.Ap*(G.r*(1-c+(1-q)/G.lam))};
function kin(G,th){const s=Math.sin(th),c=Math.cos(th),q=Math.sqrt(1-G.lam*G.lam*s*s),x=G.r*(1-c+(1-q)/G.lam);return{x,V:G.Vc+G.Ap*x,dV:G.Ap*G.r*s*(1+G.lam*c/q),A:PI*G.B*G.B/2+PI*G.B*(x+G.hc)}}
const gmT=(T,cst)=>cst?K.g0:Math.min(1.4,Math.max(1.24,1.38-6.5e-5*(T-300)+1e-8*(T-300)*(T-300)));
const cpT=(T,cst)=>{const g=gmT(T,cst);return g*R/(g-1)},cvT=(T,cst)=>R/(gmT(T,cst)-1);
const PROF=[x=>Math.sin(PI*x)**2,x=>16*x*x*(1-x)*(1-x),x=>Math.sin(PI*x)**.6];
const md4=a=>((a%P4)+P4)%P4;
function lift(v,th,cam){const w=v.w??md4(v.c-v.o),d=md4(th-v.o);return d>w?0:v.L*PROF[cam](d/w)}
const Aeff=(v,th,cam)=>K.Cdv*Math.min(PI*v.d*lift(v,th,cam),PI/4*v.d*v.d);
function valves(P,G){const d=Math.min(P.dv,.45*G.B),V={i:{o:P.ivo+P.phin,c:P.ivc+P.phin,L:P.Lv,d},e:{o:P.evo+P.phex,c:P.evc+P.phex,L:P.Lv,d:d*.9375}};V.i.w=md4(V.i.c-V.i.o);V.e.w=md4(V.e.c-V.e.o);V.gA=md4(V.i.c);V.gB=md4(V.e.o);return V} /* w：作用角，gA・gB：IVC・EVO の位相（毎回の md4 を避けるための前計算） */
function valveHit(P,G){const v=valves(P,G);for(let a=0;a<1440;a++){const th=a*.5*D,h=G.hc+kin(G,th).x;if(lift(v.i,th,P.cam)>=h||lift(v.e,th,P.cam)>=h)return 1}return 0}
const rcrit=g=>(2/(g+1))**(g/(g-1));
/* Ψ(r, γ)．γ ごとに決まる量（臨界圧力比，チョーク時の値など）を 4 件まで覚えておく．式は元のままで，結果は変わらない． */
const PSC=[],psc=g=>{for(let i=0;i<PSC.length;i++)if(PSC[i].g===g)return PSC[i];const k=2*g/(g-1),r=1-1e-3,e={g,rc:(2/(g+1))**(g/(g-1)),ch:Math.sqrt(g*(2/(g+1))**((g+1)/(g-1))),k,s1:r**(1/g)*Math.sqrt(k*(1-r**((g-1)/g)))};if(PSC.length<4)PSC.push(e);else{PSC[psc.n=((psc.n|0)+1)%4]=e}return e};
function psiF(rp,g){const c=psc(g);if(rp<=c.rc)return c.ch;if(rp<=1-1e-3)return rp**(1/g)*Math.sqrt(c.k*(1-rp**((g-1)/g)));return(1-rp)/1e-3*c.s1}
function mdot(p1,p2,T0,A,cst){const pu=Math.max(p1,p2),pd=Math.min(p1,p2);if(pu===pd||A<=0)return 0;return Math.sign(p1-p2)*A*pu/Math.sqrt(R*T0)*psiF(pd/pu,gmT(T0,cst))}
const Ath=(P,a)=>K.Cdt*PI/4*P.Dt*P.Dt*(1-Math.cos(a));
const kwf=P=>P.Tr/((PI*P.Nr/30)**2);
/* REQ-12 2′：補機負荷の feedforward と開度の下限 */
const alff=P=>P.alb+K.kT*D*P.Ta,almin=P=>Math.min(P.amax,Math.max(0,alff(P)-K.dal*D));
const fmepCF=(G,pmx,om)=>K.cfA+K.cfB*pmx+K.cfC*G.S*om/PI;                 /* Chen-Flynn [Pa] */
const SLf=(T,p,xr,ph)=>{const S0=Math.max(.05,.305-.549*(ph-1.1)**2),al=2.18-.8*(ph-1),be=-.16+.22*(ph-1);return S0*(T/298)**al*(p/101325)**be*Math.max(.15,1-2.06*xr**.77)};
function burn(G,T,p,xr,ph,om,spb,cd=1,cb=1){const SL=SLf(T,p,xr,ph),u=.5*G.S*om/PI,ST=SL+6*u,fr=1+.025*Math.max(0,-spb);return{SL,th0:2*PI-spb*D+cd*K.lk*G.B*om/(SL+K.Ck*u),db:fr*.65*G.B*om/ST/cb}}
/* rich-mixture incomplete combustion: CH_y products by element balance + water-gas shift (K=3.5) */
const RICH={y:1.87,K:3.5,hCO:283.0e3,hH2:241.8e3,Mf:(12.011+1.87*1.008)*1e-3};
function richProd(phi){const{y,K}=RICH;if(phi<=1){const o=2*(1+y/4)/phi;return{a:1,b:0,c:y/2,d:0,S:0}}const S=(2+y/2)*(1-1/phi),A=K-1,B=y/2-S+K*(1+S),C=K*S,disc=Math.sqrt(B*B-4*A*C);let b=(B-disc)/(2*A);b=Math.min(b,1,S);const d=S-b;return{a:1-b,b,c:y/2-d,d,S}}
const richEps=phi=>{if(phi<=1)return 1;const r=richProd(phi);return 1-(r.b*RICH.hCO+r.d*RICH.hH2)/(RICH.Mf*K.Hu)};
function woschni(G,p,T,cm,gx,I0,V,cwc){const pm=I0.p*(I0.V/V)**1.33,w=gx?K.C1g*cm+K.C2*G.Vd*I0.T/(I0.p*I0.V)*Math.max(0,p-pm):K.C1s*cm;return{w,hc:cwc*K.Cw0*G.B**-.2*(p/1e3)**.8*T**-.55*Math.max(w,.5)**.8}}
const CCV={s0:3,sb:.12};
const CA50T=10,KS=.6,z50=(m=K.wm)=>Math.pow(Math.log(2)/K.wa,1/(m+1)),ca50=C=>(C.th0+C.db*z50(C.m??K.wm))/D-360;
const wiebe=(z,m=K.wm)=>z>0&&z<=1?K.wa*(m+1)*z**m*Math.exp(-K.wa*z**(m+1)):0;
/* ===== generic integrators ===== */
const axpy=(a,b,s)=>a.map((v,i)=>v+s*b[i]);
function rk4s(f,y,h){const k1=f(y),k2=f(axpy(y,k1,h/2)),k3=f(axpy(y,k2,h/2)),k4=f(axpy(y,k3,h));return y.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]))}
const DPa=[[1/5],[3/40,9/40],[44/45,-56/15,32/9],[19372/6561,-25360/2187,64448/6561,-212/729],[9017/3168,-355/33,46732/5247,49/176,-5103/18656],[35/384,0,500/1113,125/192,-2187/6784,11/84]],
DPb5=[35/384,0,500/1113,125/192,-2187/6784,11/84,0],DPb4=[5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
/* Core 専用の DOPRI5(4)．dp45 と同じ演算順序で，作業配列を使い回す．結果は o.r5（新しい配列）と o.r4（作業配列）に置く． */
function dp45c(o,y,h,k0){const n=y.length,B=o.kb||(o.kb=[1,2,3,4,5,6].map(()=>new Array(n).fill(0))),yy=o.yy||(o.yy=new Array(n).fill(0)),y4=o.r4||(o.r4=new Array(n).fill(0)),y5=new Array(n),A=DPa;
{const a0=h*A[0][0];for(let i=0;i<n;i++)yy[i]=y[i]+a0*k0[i]}const k1=o.f(yy,B[0]);
{const a0=h*A[1][0],a1=h*A[1][1];for(let i=0;i<n;i++)yy[i]=y[i]+a0*k0[i]+a1*k1[i]}const k2=o.f(yy,B[1]);
{const a0=h*A[2][0],a1=h*A[2][1],a2=h*A[2][2];for(let i=0;i<n;i++)yy[i]=y[i]+a0*k0[i]+a1*k1[i]+a2*k2[i]}const k3=o.f(yy,B[2]);
{const a0=h*A[3][0],a1=h*A[3][1],a2=h*A[3][2],a3=h*A[3][3];for(let i=0;i<n;i++)yy[i]=y[i]+a0*k0[i]+a1*k1[i]+a2*k2[i]+a3*k3[i]}const k4=o.f(yy,B[3]);
{const a0=h*A[4][0],a1=h*A[4][1],a2=h*A[4][2],a3=h*A[4][3],a4=h*A[4][4];for(let i=0;i<n;i++)yy[i]=y[i]+a0*k0[i]+a1*k1[i]+a2*k2[i]+a3*k3[i]+a4*k4[i]}const k5=o.f(yy,B[4]);
{const a0=h*A[5][0],a1=h*A[5][1],a2=h*A[5][2],a3=h*A[5][3],a4=h*A[5][4],a5=h*A[5][5];for(let i=0;i<n;i++)yy[i]=y[i]+a0*k0[i]+a2*k2[i]+a3*k3[i]+a4*k4[i]+a5*k5[i]}const k6=o.f(yy,B[5]);
const b0=h*DPb5[0],c0=h*DPb4[0],b1=h*DPb5[1],c1=h*DPb4[1],b2=h*DPb5[2],c2=h*DPb4[2],b3=h*DPb5[3],c3=h*DPb4[3],b4=h*DPb5[4],c4=h*DPb4[4],b5=h*DPb5[5],c5=h*DPb4[5],b6=h*DPb5[6],c6=h*DPb4[6];for(let i=0;i<n;i++){y5[i]=y[i]+b0*k0[i]+b1*k1[i]+b2*k2[i]+b3*k3[i]+b4*k4[i]+b5*k5[i]+b6*k6[i];y4[i]=y[i]+c0*k0[i]+c1*k1[i]+c2*k2[i]+c3*k3[i]+c4*k4[i]+c5*k5[i]+c6*k6[i]}o.r5=y5}
function dp45(f,y,h,k1){const k=[k1||f(y)];for(let s=0;s<6;s++){const yy=y.slice();for(let j=0;j<=s;j++){const a=DPa[s][j];if(a)for(let i=0;i<y.length;i++)yy[i]+=h*a*k[j][i]}k.push(f(yy))}
const y5=y.slice(),y4=y.slice();for(let j=0;j<7;j++)for(let i=0;i<y.length;i++){y5[i]+=h*DPb5[j]*k[j][i];y4[i]+=h*DPb4[j]*k[j][i]}return{y5,y4}}
const ATOL=[1e-6,1e-3,1,1e-9,1e-9,1e-4,1,1e-9,1e-6,1,1e-9,1,1,1e-6,1,1],EIX=[0,1,2,3,4,5,6,7,8,9,10,13,14,15];
/* ===== EngineCore ===== */
const TRK=['p','V','T','mi','me','Li','Le','Ti','Ts','Td','Tf','N','pin','mt','m','mu','dq','vp'];
class Core{
constructor(P){this.P=P;this.reset()}
reset(){const P=this.P,G=this.G=geo(P),k=kin(G,PI),m=P.pa*k.V/(R*320);
this.s={y:[PI,0,P.pa,m,m,298.15,P.pa,0,0,P.pa,0,0,0,0,P.pa,P.pa],exOn:P.exs,ab:[0,0],runOn:P.run,spa:P.spb,ca:NaN,rs:20261114,cz:[0,0],al:P.alc,Ip:0,If:0,fc:0,fe:0,ov:0,up:0,Nb:0,starter:0,fuel:0,fired:0,Wg:0,C:{on:0,th0:0,db:1,Q:0,mut:0},I0:{p:P.pa,V:k.V,T:320},tp:PI,t:0,pmx:P.pa,mode:P.mode,h:1e-4,cyc:0,cf:0,hn:0,li:-1,YuE:NaN,Mx:null};
this.rc();this.tr={};TRK.forEach(n=>this.tr[n]=new Float32Array(1440).fill(NaN));this.H={t:[],N:[],Nt:[],pin:[],al:[],Tw:[],tb:[],td:[],fc:[],fe:[]};this.last=null;this.X=null;this.sig=NaN;this.vhit=0;this.updV()}
rc(){this.s.cw={mex:0,mep:0,mtl:0,pmA:0,ppn:1e12,ppx:-1e12,n:0,g:0,wf:0,wa:0,wd:0,tt:0,mt:0,mi:0,mr:0,yb:0,bo:0,bi:0};this.s.cx={pmax:0,Tmax:0,xr:this.s.cx?this.s.cx.xr:0}}
updV(){const P=this.P,sg=P.ivo+P.phin*1.7+P.ivc*2.3+P.evo*3.1+P.evc*4.3+P.phex*5.9+P.Lv*71+P.dv*13+P.cam;if(sg!==this.sig){this.sig=sg;this.V=valves(P,this.G);this.vhit=valveHit(P,this.G)}}
/* 右辺 f(y)．ホットパス：オブジェクトと配列の生成を避ける（式の形は第20版と同一で，結果は 1 ビットも変わらない）．
   this.wx が 0 のときは，表示・集計用の this.X を作らない（RK の第 2 段以降）． */
f(y,out){const P=this.P,G=this.G,s=this.s,C=s.C,Vv=this.V,th=y[0],om=y[1],p=y[2],m=Math.max(y[3],1e-7),mu=y[4],Tw=y[5],pin=y[6],mbi=Math.max(0,y[7]),mr=y[8],pp=y[9],mbp=Math.max(0,y[10]),RO=!!P.run,Ar=PI/4*P.dr*P.dr,Vp=.5*Ar*P.Lr,pv=RO?pp:pin,cst=P.gam,tt=md4(th);
/* クランク運動学（kin と同じ式） */
const sn=Math.sin(th),cs=Math.cos(th),qq=Math.sqrt(1-G.lam*G.lam*sn*sn),xp=G.r*(1-cs+(1-qq)/G.lam),kV=G.Vc+G.Ap*xp,kdV=G.Ap*G.r*sn*(1+G.lam*cs/qq),kA=PI*G.B*G.B/2+PI*G.B*(xp+G.hc);
const T=p*kV/(m*R),g=gmT(T,cst),Yu=Math.min(1,Math.max(0,mu/m)),EX=!!P.exs,mep=y[13],ppe=y[14],pm=y[15],pex=EX?ppe:P.pa+P.dpx;
/* 弁・スロットルの流量と組成 */
const mi=mdot(pv,p,pv>p?TI:T,Aeff(Vv.i,tt,P.cam),cst),me=mdot(p,pex,p>pex?T:TX,Aeff(Vv.e,tt,P.cam),cst),Ybi=Math.min(1,mbi*R*TI/(pin*P.Vin)),Ybp=RO?Math.min(1,mbp*R*TI/(pp*Vp)):Ybi,mui=mi>=0?(1-Ybp)*mi:Yu*mi,mue=me>=0?Yu*me:0;
const mt=mdot(P.pa,pin,P.pa>pin?TA:TI,Ath(P,s.al),cst);
/* 燃焼と壁面熱伝達（woschni と同じ式） */
const dxb=C.on?wiebe((tt-C.th0)/C.db,C.m??K.wm)/C.db:0,Q=C.Q*dxb*om,dmc=C.mut*dxb*om,cm=G.S*om/PI,gx=tt>=Vv.gA&&tt<Vv.gB,I0=s.I0;
const pm0=I0.p*(I0.V/kV)**1.33,ww=gx?K.C1g*cm+K.C2*G.Vd*I0.T/(I0.p*I0.V)*Math.max(0,p-pm0):K.C1s*cm,hc=P.cw*K.Cw0*G.Bm*(p/1e3)**.8*T**-.55*Math.max(ww,.5)**.8,Qw=hc*kA*(T-Tw);
const Hi=mi>=0?mi*cpT(TI,cst)*TI:mi*cpT(T,cst)*T,He=me>=0?me*cpT(T,cst)*T:me*cpT(TX,cst)*TX;
const dp=-g*p/kV*kdV*om+(g-1)/kV*(Q-Qw+Hi-He);
/* 回転運動 */
const Ts=s.starter&&!s.fired?K.Tst*Math.max(0,1-om/K.wnl):0,Ti=(p-P.pa)*kdV,Td=s.fe*kwf(P)*om*om,Tf=om>0?fmepCF(G,s.pmx,om)*G.Vd/P4:0,Ta=om>0?P.Ta:0;
let dom=(Ti+Ts-Tf-Ta-Td)/(K.I+P.Id),dth=om;if(this.fixw)dom=0;if(om<=0&&dom<0){dom=0;dth=0}
/* 排気系 */
let e0=0,e1=0,e2=0,mtl=me;if(EX){const Ae=PI/4*P.dex*P.dex,Vpe=.5*Ae*P.Lex,re=ppe/(R*TX),zx=K.fr*P.Lex/P.dex+K.ze;mtl=mdot(pm,P.pa,pm>P.pa?TX:TA,K.Cdx*P.At,cst);e0=Ae/P.Lex*(ppe-pm)-zx*mep*Math.abs(mep)/(2*re*Ae*P.Lex);e1=K.gp*R*TX/Vpe*(me-mep);e2=R*TX/P.Vm*(mep-mtl)}
if(this.wx!==0)this.X={T,k:{x:xp,V:kV,dV:kdV,A:kA},mi,me,Ts,Ti,Td,Tf,Ta,tt,Yu,mt,Q,Qw,hc,Ybi,Ybp,mr:RO?mr:mi,pv,mep:EX?mep:me,mtl,pex,pm:EX?pm:pex};
/* 吸気側（ランナ ON／OFF） */
let d6,d7,d8,d9,d10;if(RO){d6=R*TI/P.Vin*(mt-mr);d7=-mr*(mr>=0?Ybi:Ybp)+Math.min(0,mt)*Ybi;d8=Ar/P.Lr*(pin-pp)-(K.fr*P.Lr/P.dr+K.ze)*mr*Math.abs(mr)/(2*pin/(R*TI)*Ar*P.Lr);d9=K.gp*R*TI/Vp*(mr-mi);d10=mr*(mr>=0?Ybi:Ybp)-mi*(mi>=0?Ybp:1-Yu)}else{d6=R*TI/P.Vin*(mt-mi);d7=-mi*(mi>=0?Ybi:1-Yu)+Math.min(0,mt)*Ybi;d8=0;d9=0;d10=0}
const d5=this.fixTw?0:(Qw-K.Gw*(Tw-K.Twc))/K.Cw,d11=mi<0?-mi*(1-Yu):0,d12=mi>=0?mi*Ybp:0;if(!out)return[dth,dom,dp,mi-me,mui-mue-dmc,d5,d6,d7,d8,d9,d10,d11,d12,e0,e1,e2];
out[0]=dth;out[1]=dom;out[2]=dp;out[3]=mi-me;out[4]=mui-mue-dmc;out[5]=d5;out[6]=d6;out[7]=d7;out[8]=d8;out[9]=d9;out[10]=d10;out[11]=d11;out[12]=d12;out[13]=e0;out[14]=e1;out[15]=e2;return out}
rnd(){const s=this.s;let t=(s.rs=(s.rs+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
uz(){return(2*this.rnd()-1)*Math.sqrt(3)}
ign(X){const s=this.s,P=this.P,C=s.C,om=Math.max(s.y[1],20),b=burn(this.G,X.T,s.y[2],1-X.Yu,P.phi,om,s.spa,P.cid,P.cbr);C.th0=b.th0;C.db=b.db;C.m=P.wm;if(P.cvar){const z1=this.uz(),z2=this.uz();s.cz=[z1,z2];C.th0+=CCV.s0*D*z1;C.db*=Math.max(.5,1+CCV.sb*z2)}else s.cz=[0,0];C.Q=s.fuel?C.mut/(1+P.phi/K.AFR)*P.phi/K.AFR*K.Hu*K.etac*richEps(P.phi):0;C.on=!!s.fuel}
step(){const s=this.s,P=this.P,G=this.G;this.updV();if(!!P.exs!==!!s.exOn){s.exOn=P.exs;if(P.exs){const y=s.y;y[13]=0;y[14]=y[15]=P.pa+P.dpx}}if(!!P.run!==!!s.runOn){s.runOn=P.run;if(P.run){const y=s.y,pin=y[6],Ybi=Math.min(1,Math.max(0,y[7])*R*TI/(pin*P.Vin));y[8]=0;y[9]=pin;y[10]=Ybi*pin*.5*PI/4*P.dr*P.dr*P.Lr/(R*TI)}}if(!P.sauto||!s.fired)s.spa=P.spb;const y0=s.y,om=Math.max(y0[1],20),V0=kinV(G,y0[0]),p0=y0[2],F=this.F||(this.F=y=>this.f(y));let dt,X0,y1;this.wx=1;
if(P.sol===0){dt=Math.min(P.dth/om,1e-4);const k1=F(y0);X0=this.X;this.wx=0;const k2=F(axpy(y0,k1,dt/2)),k3=F(axpy(y0,k2,dt/2)),k4=F(axpy(y0,k3,dt));y1=y0.map((v,i)=>v+dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]))}
else{let h=Math.min(s.h,.5*D/om,1e-3);const k1=this.f(y0,this.k0b||(this.k0b=new Array(16).fill(0)));X0=this.X;this.wx=0;for(let n=0;;n++){dp45c(this,y0,h,k1);const r5=this.r5,r4=this.r4;let E=0;for(let q=0;q<EIX.length;q++){const i=EIX[q];E=Math.max(E,Math.abs(r5[i]-r4[i])/(ATOL[i]+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i]))))}const fac=Math.min(2.5,Math.max(.2,.9*Math.pow(Math.max(E,1e-10),-.2)));if(E<=1||n>12||h<1e-8){y1=r5;dt=h;s.h=h*fac;break}h*=fac}}
y1[3]=Math.max(y1[3],1e-7);y1[7]=Math.max(0,y1[7]);y1[14]=Math.max(y1[14],1e3);y1[15]=Math.max(y1[15],1e3);y1[10]=Math.max(0,y1[10]);y1[9]=Math.max(y1[9],1e3);y1[4]=Math.min(y1[3],Math.max(0,y1[4]));y1[1]=Math.max(y1[1],0);y1[2]=Math.max(y1[2],1e3);s.y=y1;this.wx=1;
const X=this.X=X0,kV1=kinV(G,y1[0]),tt=md4(y1[0]),dW=(p0+y1[2])/2*(kV1-V0),da=y1[0]-y0[0],cw=s.cw,cx=s.cx;
cw.n+=dW;if(X.tt>=PI&&X.tt<3*PI)cw.g+=dW;cw.wf+=X.Tf*da;cw.wa+=X.Ta*da;cw.wd+=X.Td*da;cw.tt+=dt;cw.mt+=X.mt*dt;cw.mi+=X.mi*dt;cw.mr+=X.mr*dt;cw.mex+=X.me*dt;cw.mep+=X.mep*dt;cw.mtl+=X.mtl*dt;cw.pmA+=X.pm*dt;cw.ppn=Math.min(cw.ppn,X.pex);cw.ppx=Math.max(cw.ppx,X.pex);cw.yb+=X.Ybi*dt;cx.pmax=Math.max(cx.pmax,p0);cx.Tmax=Math.max(cx.Tmax,X.T);
if(this.trO!==this.tr){this.trO=this.tr;this.trA=TRK.map(n=>this.tr[n])}
const i=Math.round(X.tt/D*2)%1440,trA=this.trA,vals=[p0/1e3,V0*1e6,X.T,X.mi*1e3,X.me*1e3,lift(this.V.i,X.tt,P.cam)*1e3,lift(this.V.e,X.tt,P.cam)*1e3,X.Ti,X.Ts,X.Td,X.Tf,y0[1]*30/PI,y0[6]/1e3,X.mt*1e3,y0[3]*1e6,y0[4]*1e6,X.Q/om*D,X.k.dV/G.Ap*y0[1]];
let j=s.li<0||md4((i-s.li)*.5*D)>8*D?i:(s.li+1)%1440;for(let n=0;n<16;n++){for(let q=0;q<18;q++)trA[q][j]=vals[q];if(j===i)break;j=(j+1)%1440}s.li=i;
const cr=a=>{a=md4(a);return s.tp<=a&&tt>a};
if(tt<s.tp)this.cycleEnd();
if(cr(this.V.i.c)){s.I0={p:y1[2],V:kV1,T:X.T};s.C.mut=y1[4];cx.xr=1-y1[4]/y1[3]}
if(cr(this.V.e.o))s.YuE=y1[4]/y1[3];
if(cr(2*PI-s.spa*D))this.ign(X);
s.tp=tt;s.t+=dt;this.ecu(dt,y1[1]);
if(s.t>=s.hn*.05){s.hn++;const H=this.H,M=s.Mx;H.t.push(s.t);H.N.push(s.Nb);H.Nt.push(P.nt);H.pin.push(y1[6]/1e3);H.al.push(s.al/D);H.Tw.push(y1[5]);H.tb.push(M?M.tb:NaN);H.td.push(M?M.Tdm:NaN);H.fc.push(s.fc);H.fe.push(s.fe);if(H.t.length>620)for(const a in H)H[a].shift()}
return dt}
cycleEnd(){const s=this.s,P=this.P,G=this.G,cw=s.cw,cx=s.cx,C=s.C,W=cw.n,tc=cw.tt;s.Wg=cw.g;if(cx.pmax>0)s.pmx=cx.pmax;s.cyc++;s.ca=C.on&&C.Q>0?ca50(C):NaN;if(P.sauto&&s.fired&&s.ca===s.ca)s.spa+=KS*(s.ca-CA50T);
const ma=C.mut/(1+P.phi/K.AFR),mf=P.phi*ma/K.AFR,mfd=mf/tc,imep=W/G.Vd,fmep=cw.wf/G.Vd,Pb=(W-cw.wf-cw.wa)/tc,wb=P4/tc,amep=cw.wa/G.Vd;
const M={imep,pmep:(W-cw.g)/G.Vd,W,Wg:cw.g,Wf:cw.wf,Wd:cw.wd,tc,wb,N:wb*30/PI,ei:C.Q>0&&mf>0?W/(mf*K.Hu):NaN,pi:W/tc,ev:ma/(P.pa/(R*TA)*G.Vd),xr:cx.xr,pinE:s.y[6],mexv:cw.mex/tc,mepp:cw.mep/tc,mtl:cw.mtl/tc,dpex:cw.pmA/tc-P.pa,ppeR:cw.ppx-cw.ppn,mr:cw.mr/tc,ybi:cw.yb/tc,bo:s.y[11]-s.ab[0],bi:s.y[12]-s.ab[1],pm:cx.pmax,Tm:cx.Tmax,tb:(W-cw.wf-cw.wa)/P4,pb:Pb,bmep:imep-fmep-amep,fmep,amep,Wa:cw.wa,em:imep>0?(imep-fmep-amep)/imep:NaN,bsfc:Pb>0&&mfd>0?mfd/Pb*3.6e9:NaN,eb:Pb>0&&mfd>0?Pb/(mfd*K.Hu):NaN,mfd,Tdm:cw.wd/P4,ca50:s.ca,spa:s.spa,cz:s.cz.slice(),Pd:cw.wd/tc,Pf:cw.wf/tc,mth:cw.mt/tc,min:cw.mi/tc,YuE:s.YuE};
s.ab=[s.y[11],s.y[12]];s.Mx=s.cf&&s.fired?M:null;s.Mh=s.Mx?(s.Mh||[]).concat([M]).slice(-10):[];this.lastM=M;this.last={p:Float32Array.from(this.tr.p),V:Float32Array.from(this.tr.V),me:Float32Array.from(this.tr.me),imep,pm:cx.pmax,N:M.N,ok:!!s.Mx};s.cf=s.fired;this.rc()}
ecu(dt,om){const s=this.s,P=this.P;s.Nb+=(om*30/PI-s.Nb)*Math.min(1,dt/P.tN);
if(!s.fired&&s.fuel&&s.Nb>K.Nfire&&s.Wg>20){s.fired=1;s.starter=0;s.Ip=0;s.If=0}
if(s.fired&&s.Nb<150){s.fired=0;s.fuel=0;s.Mx=null}
if(P.mode!==s.mode){if(s.fired){if(P.mode===1){P.alm=s.al;s.If=s.fc-P.fb-P.Kpd*(s.Nb-P.nt)}else{P.fm=s.fc;s.Ip=s.al-alff(P)-P.Kp*(P.nt-s.Nb)}}s.mode=P.mode}
const e=P.nt-s.Nb;
if(!s.fired){s.al=P.alc;s.fc=0}
else if(s.mode===0){const ab=alff(P),am=almin(P),u=ab+P.Kp*e+s.Ip;if(!((u>=P.amax&&e>0)||(u<=am&&e<0)))s.Ip+=P.Ki*e*dt;s.al=Math.min(P.amax,Math.max(am,ab+P.Kp*e+s.Ip));s.fc=P.fm}
else{const ed=-e,u=P.fb+P.Kpd*ed+s.If;if(!((u>=1&&ed>0)||(u<=0&&ed<0)))s.If+=P.Kid*ed*dt;s.al=P.alm;s.fc=Math.min(1,Math.max(0,P.fb+P.Kpd*ed+s.If))}
s.fe=s.fc+(s.fe-s.fc)*Math.exp(-dt/P.td);
if(s.fired&&s.mode===1){s.ov=(s.fc>=1&&s.Nb>P.nt+100)?s.ov+dt:0;s.up=(s.fc<=0&&s.Nb<P.nt-100)?s.up+dt:0}else{s.ov=0;s.up=0}}
start(){this.s.fuel=1;if(!this.s.fired)this.s.starter=1}
stop(){const s=this.s;s.fuel=0;s.starter=0;s.fired=0;s.C.on=0;s.C.Q=0;s.Mx=null;s.Mh=[]}
clone(){const c=new Core({...this.P});c.s=structuredClone(this.s);c.G=geo(c.P);c.sig=NaN;c.updV();if(this.last)c.last={...this.last,p:Float32Array.from(this.last.p),V:Float32Array.from(this.last.V),me:Float32Array.from(this.last.me)};c.lastM=this.lastM;return c}
run(T){const t1=this.s.t+T;while(this.s.t<t1)this.step()}
}
/* ===== metrics display (validity rule) ===== */
const fmtv=(x,n,u,lo,hi)=>x==null||!isFinite(x)||(lo!=null&&(x<lo||x>hi))?'–':x.toFixed(n)+u;
/* ===== WOT sweep (REQ-26) ===== */
const SWC={als:[90,50,10],alsAll:[10,20,30,40,50,60,70,80,90],al:90,Tw:K.Twc,N0:1000,N1:7000,step:250,steps:[100,250,500],last:3,nmax:60,
crit:{std:{n:'標準',tolR:.003,tolA:.02,tolS:.3,nmin:4},strict:{n:'厳格',tolR:.001,tolA:.01,tolS:.1,nmin:6}},critD:'strict',flowD:true,procs:{up:'上り',updown:'往復',indep:'独立'},procD:'up'};
const swN=st=>Array.from({length:Math.round((SWC.N1-SWC.N0)/st)+1},(_,i)=>SWC.N0+st*i),SWN=swN(SWC.step),SWN13=swN(500),SWN7=swN(1000);
const swOpt=o=>({crit:SWC.critD,flow:SWC.flowD,proc:SWC.procD,...(o||{})});
const swR=a=>Math.max(...a)-Math.min(...a),swM=a=>a.reduce((x,v)=>x+v,0)/a.length;
class Sweep{constructor(P0,Ns,al,opt){this.Ns=Ns||SWN;this.al=al??SWC.al;this.o=swOpt(opt);this.C=SWC.crit[this.o.crit];const c=this.c=new Core({...P0,cvar:0,sauto:1,mode:1,alm:this.al*D});c.fixw=1;c.fixTw=1;c.s.y[5]=SWC.Tw;this.pts=[];this.i=0;this.done=false;this.sig=JSON.stringify(P0);this.begin()}
begin(){const c=this.c,N=this.Ns[this.i];c.s.y[1]=N*PI/30;c.s.Nb=N;c.P.nt=N;if(!c.s.fuel)c.start();this.h=[];this.cy=c.s.cyc;this.nc=0}
run(ms){const c=this.c,t0=performance.now();let n=0;while(!this.done){c.step();if(c.s.cyc!==this.cy){this.cy=c.s.cyc;this.nc++;if(c.s.fired&&c.lastM)this.h.push(c.lastM);this.check()}if((++n&3)===0&&performance.now()-t0>ms)break}return this.done}
check(){const h=this.h,C=this.C;let ok=false,r=null;if(h.length>=C.nmin){const a=h.slice(-SWC.last),T=a.map(m=>m.tb),z=a.length-1;r={T:swR(T),S:swR(a.map(m=>m.spa)),ev:swR(a.map(m=>m.ev))/swM(a.map(m=>m.ev)),mth:swR(a.map(m=>m.mth))/swM(a.map(m=>m.mth)),pin:swR(a.map(m=>m.pinE))/swM(a.map(m=>m.pinE))};
ok=r.T<=C.tolR*Math.abs(T[z])+C.tolA&&r.S<=C.tolS&&(!this.o.flow||(r.ev<=C.tolR&&r.mth<=C.tolR&&r.pin<=C.tolR))}
if(ok||h.length>=SWC.nmax||this.nc>=2*SWC.nmax){const M=h[h.length-1]||{};this.pts.push({N:this.Ns[this.i],Na:M.N,Nw:this.c.s.y[1]*30/PI,tb:M.tb,pb:M.pb,bmep:M.bmep,ev:M.ev,bsfc:M.bsfc,eb:M.eb,spa:M.spa,xr:M.xr,dpex:M.dpex,ppeR:M.ppeR,mt:M.mtl,ok,cyc:h.length,r});this.i++;if(this.i>=this.Ns.length)this.done=true;else this.begin()}}}
const SWF=['Na','tb','pb','bmep','ev','bsfc','eb','spa','xr'];
class SweepSet{constructor(P0,Ns,als,opt){this.P0=P0;this.Ns=Ns||SWN;this.als=(als||SWC.als).slice().sort((a,b)=>b-a);this.o=swOpt(opt);this.sets=this.als.map(al=>({al,pts:[],dT:0,dV:0}));this.k=0;this.jobs=[];this.done=false;this.next()}
get pts(){return this.sets[0].pts}
next(){const al=this.als[this.k],set=this.sets[this.k],p=this.o.proc;if(p==='up'){this.jobs=[new Sweep(this.P0,this.Ns,al,this.o)];set.pts=this.jobs[0].pts}else if(p==='updown'){this.jobs=[new Sweep(this.P0,this.Ns,al,this.o),new Sweep(this.P0,this.Ns.slice().reverse(),al,this.o)];set.pts=this.jobs[0].pts}else{this.jobs=this.Ns.map(N=>({N,mk:()=>new Sweep(this.P0,[N],al,this.o)}));set.pts=[]}this.j=0;this.S=this.jobs[0].mk?this.jobs[0].mk():this.jobs[0]}
fin(){const set=this.sets[this.k],p=this.o.proc;if(p==='updown'){const u=this.jobs[0].pts,dm={};this.jobs[1].pts.forEach(q=>dm[q.N]=q);let mx=0;set.pts=u.map(q=>{const d=dm[q.N],o={N:q.N,Nw:q.Nw,ok:q.ok&&d.ok,cyc:q.cyc+d.cyc,r:q.r,dT:Math.abs(q.tb-d.tb),dV:Math.abs(q.ev-d.ev)};SWF.forEach(k=>o[k]=(q[k]+d[k])/2);return o});const mT=Math.max(...set.pts.map(o=>o.tb));set.dT=Math.max(...set.pts.map(o=>o.dT))/mT;set.dV=Math.max(...set.pts.map(o=>o.dV))}}
run(ms){const t0=performance.now();while(!this.done){const left=ms-(performance.now()-t0);if(left<=0)break;if(this.S.run(left)){if(this.o.proc==='indep')this.sets[this.k].pts.push(this.S.pts[0]);this.j++;if(this.j<this.jobs.length){this.S=this.jobs[this.j].mk?this.jobs[this.j].mk():this.jobs[this.j]}else{this.fin();this.k++;if(this.k>=this.als.length){this.done=true;break}this.next()}}}return this.done}}
const avgM=s=>{const h=s.Mx&&s.Mh&&s.Mh.length?s.Mh:null;if(!h)return{};const o={};for(const k in h[0]){const v=h[0][k];if(typeof v==='number')o[k]=h.reduce((a,q)=>a+q[k],0)/h.length}return o};
function metricList0(c,pg){const s=c.s,m=avgM(s),P=c.P,y=s.y,e=[0,1.5];
return pg?[['ṁ_f',fmtv(m.mfd*1e3,3,' g/s')],['T_b',fmtv(m.tb,1,' N·m')],['P_b',fmtv(m.pb/1e3,2,' kW')],['BMEP',fmtv(m.bmep/1e3,0,' kPa')],['FMEP',fmtv(m.fmep/1e3,0,' kPa')],['ηm',fmtv(m.em,3,'',...e)],['bsfc',fmtv(m.bsfc,0,' g/kWh',0,1e5)],['ηb',fmtv(m.eb,3,'',...e)],['T_dyno',fmtv(s.fe*kwf(P)*y[1]*y[1],1,' N·m')],['f_eff',fmtv(s.fe,2,'')],['Yb,in',fmtv(m.ybi,3,'',0,1)],['点火',fmtv(s.spa,1,'°')]]
:[['N̄',fmtv(s.Nb,0,' rpm')],['IMEP',fmtv(m.imep/1e3,0,' kPa')],['PMEP',fmtv(m.pmep/1e3,0,' kPa')],['ηi',fmtv(m.ei,3,'',...e)],['Pi',fmtv(m.pi/1e3,2,' kW')],['ηv',fmtv(m.ev,3,'',...e)],['xr',fmtv(m.xr,3,'',0,1)],['p_max',fmtv(m.pm/1e3,0,' kPa')],['T_max',fmtv(m.Tm,0,' K')],['T_w',fmtv(y[5],0,' K')],['α',fmtv(s.al/D,1,'°')],['p_in',fmtv(y[6]/1e3,1,' kPa')]]}
const MJP={'ṁ_f':'燃料流量','T_b':'軸トルク','P_b':'軸出力','BMEP':'正味平均有効圧','FMEP':'摩擦平均有効圧','ηm':'機械効率','bsfc':'正味燃料消費率','ηb':'正味熱効率','T_dyno':'動力計トルク','f_eff':'実効充水率','Yb,in':'吸気管既燃率','点火':'点火時期','N̄':'平均回転数','IMEP':'図示平均有効圧','PMEP':'ポンプ損失平均有効圧','ηi':'図示熱効率','Pi':'図示出力','ηv':'体積効率','xr':'残留ガス率','p_max':'最高筒内圧','T_max':'最高ガス温度','T_w':'壁温','α':'スロットル開度','p_in':'吸気管圧'};
function metricList(c,pg){return metricList0(c,pg).map(q=>q[0]==='点火'?[q[0],q[1]==='–'?q[1]:q[1]+' BTDC',MJP[q[0]]]:[q[0],q[1],MJP[q[0]]])}
