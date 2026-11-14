'use strict';
/* ===== constants (single source) ===== */
const R=287,TA=298.15,TI=298.15,TX=800,PI=Math.PI,D=PI/180,P4=4*PI;
const K={fr:.02,ze:.2,gp:1.4,lk:.025,Ck:.4,wa:5,wm:2,Cdv:.6,Cdt:.8,cfA:13.7e3,cfB:.005,cfC:16.2e3,Hu:44e6,AFR:14.7,etac:.97,C1g:2.28,C1s:6.18,C2:3.24e-3,Cw0:3.26,Twc:360,Cw:1500,Gw:15,I:.12,Tst:60,wnl:209,Nfire:550,pexo:4e3,g0:1.35};
/* ===== item definition table (single source for settings, doc, tests) ===== */
const PAGES=['機関','VVT・カム','弁タイミング','吸気','燃焼','運転','ECU','動力計','解法','音響','燃焼速度','吸気ランナ'];
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
{k:'Al',n:'漏れ面積',u:'mm²',f:1e-6,lo:.5,hi:50,st:.5,d:1,c:'i',pg:3},
{k:'Vin',n:'マニホールド V_in',u:'L',f:1e-3,lo:.3,hi:5,st:.1,d:1.5,c:'i',pg:3},
{k:'run',n:'吸気ランナ',u:'',ch:['OFF','ON'],d:1,c:'i',pg:11},
{k:'Lr',n:'ランナ長 L_r',u:'mm',f:1e-3,lo:100,hi:1000,st:10,d:450,c:'i',pg:11},
{k:'dr',n:'ランナ内径 d_r',u:'mm',f:1e-3,lo:20,hi:60,st:1,d:40,c:'i',pg:11},
{k:'spb',n:'点火時期',u:'°BTDC',f:1,lo:null,hi:null,st:1,d:18,c:'i',pg:4},
{k:'sauto',n:'点火の自動最適化',u:'',ch:['OFF','ON'],d:1,c:'i',pg:4},
{k:'cvar',n:'サイクル変動',u:'',ch:['OFF','ON'],d:1,c:'i',pg:4},
{k:'phi',n:'当量比 φ',u:'',f:1,lo:.6,hi:1.4,st:.01,d:1,c:'i',pg:4},
{k:'cw',n:'Woschni係数',u:'',f:1,lo:0,hi:2,st:.05,d:1,c:'i',pg:4},
{k:'gam',n:'比熱',u:'',ch:['γ(T)','γ一定'],d:0,c:'i',pg:4},
{k:'mode',n:'モード',u:'',ch:['A: ISC','B: 動力計'],d:0,c:'i',pg:5},
{k:'nt',n:'目標回転数',u:'rpm',f:1,lo:500,hi:null,st:50,d:800,c:'i',pg:5},
{k:'alm',n:'手動開度 (B)',u:'°',f:D,lo:0,hi:90,st:1,d:15,c:'i',pg:5},
{k:'fm',n:'f_manual (A)',u:'',f:1,lo:0,hi:1,st:.05,d:0,c:'i',pg:5},
{k:'fb',n:'f_base (B)',u:'',f:1,lo:0,hi:1,st:.05,d:0,c:'i',pg:5},
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
function geo(P){const G={B:P.B,S:P.S,l:P.lr,eps:P.eps};G.r=G.S/2;G.lam=G.r/G.l;G.Ap=PI*G.B*G.B/4;G.Vd=G.Ap*G.S;G.Vc=G.Vd/(G.eps-1);G.hc=G.Vc/G.Ap;return G}
function kin(G,th){const s=Math.sin(th),c=Math.cos(th),q=Math.sqrt(1-G.lam*G.lam*s*s),x=G.r*(1-c+(1-q)/G.lam);return{x,V:G.Vc+G.Ap*x,dV:G.Ap*G.r*s*(1+G.lam*c/q),A:PI*G.B*G.B/2+PI*G.B*(x+G.hc)}}
const gmT=(T,cst)=>cst?K.g0:Math.min(1.4,Math.max(1.24,1.38-6.5e-5*(T-300)+1e-8*(T-300)*(T-300)));
const cpT=(T,cst)=>{const g=gmT(T,cst);return g*R/(g-1)},cvT=(T,cst)=>R/(gmT(T,cst)-1);
const PROF=[x=>Math.sin(PI*x)**2,x=>16*x*x*(1-x)*(1-x),x=>Math.sin(PI*x)**.6];
const md4=a=>((a%P4)+P4)%P4;
function lift(v,th,cam){const w=md4(v.c-v.o),d=md4(th-v.o);return d>w?0:v.L*PROF[cam](d/w)}
const Aeff=(v,th,cam)=>K.Cdv*Math.min(PI*v.d*lift(v,th,cam),PI/4*v.d*v.d);
function valves(P,G){const d=Math.min(P.dv,.45*G.B);return{i:{o:P.ivo+P.phin,c:P.ivc+P.phin,L:P.Lv,d},e:{o:P.evo+P.phex,c:P.evc+P.phex,L:P.Lv,d:d*.9375}}}
function valveHit(P,G){const v=valves(P,G);for(let a=0;a<1440;a++){const th=a*.5*D,h=G.hc+kin(G,th).x;if(lift(v.i,th,P.cam)>=h||lift(v.e,th,P.cam)>=h)return 1}return 0}
const rcrit=g=>(2/(g+1))**(g/(g-1));
function psiF(rp,g){const k=2*g/(g-1),dr=1e-3,sub=r=>r**(1/g)*Math.sqrt(k*(1-r**((g-1)/g)));return rp<=rcrit(g)?Math.sqrt(g*(2/(g+1))**((g+1)/(g-1))):rp<=1-dr?sub(rp):(1-rp)/dr*sub(1-dr)}
function mdot(p1,p2,T0,A,cst){const pu=Math.max(p1,p2),pd=Math.min(p1,p2);if(pu===pd||A<=0)return 0;return Math.sign(p1-p2)*A*pu/Math.sqrt(R*T0)*psiF(pd/pu,gmT(T0,cst))}
const Ath=(P,a)=>K.Cdt*(P.Al+PI/4*P.Dt*P.Dt*(1-Math.cos(a)));
const kwf=P=>P.Tr/((PI*P.Nr/30)**2);
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
function dp45(f,y,h,k1){const k=[k1||f(y)];for(let s=0;s<6;s++){const yy=y.slice();for(let j=0;j<=s;j++){const a=DPa[s][j];if(a)for(let i=0;i<y.length;i++)yy[i]+=h*a*k[j][i]}k.push(f(yy))}
const y5=y.slice(),y4=y.slice();for(let j=0;j<7;j++)for(let i=0;i<y.length;i++){y5[i]+=h*DPb5[j]*k[j][i];y4[i]+=h*DPb4[j]*k[j][i]}return{y5,y4}}
const ATOL=[1e-6,1e-3,1,1e-9,1e-9,1e-4,1,1e-9,1e-6,1,1e-9];
/* ===== EngineCore ===== */
const TRK=['p','V','T','mi','me','Li','Le','Ti','Ts','Td','Tf','N','pin','mt','m','mu','dq','vp'];
class Core{
constructor(P){this.P=P;this.reset()}
reset(){const P=this.P,G=this.G=geo(P),k=kin(G,PI),m=P.pa*k.V/(R*320);
this.s={y:[PI,0,P.pa,m,m,298.15,P.pa,0,0,P.pa,0,0,0],ab:[0,0],runOn:P.run,spa:P.spb,ca:NaN,rs:20261114,cz:[0,0],al:P.alc,Ip:0,If:0,fc:0,fe:0,ov:0,up:0,Nb:0,starter:0,fuel:0,fired:0,Wg:0,C:{on:0,th0:0,db:1,Q:0,mut:0},I0:{p:P.pa,V:k.V,T:320},tp:PI,t:0,pmx:P.pa,mode:P.mode,h:1e-4,cyc:0,cf:0,hn:0,li:-1,YuE:NaN,Mx:null};
this.rc();this.tr={};TRK.forEach(n=>this.tr[n]=new Float32Array(1440).fill(NaN));this.H={t:[],N:[],Nt:[],pin:[],al:[],Tw:[],tb:[],td:[],fc:[],fe:[]};this.last=null;this.X=null;this.sig=NaN;this.vhit=0;this.updV()}
rc(){this.s.cw={n:0,g:0,wf:0,wd:0,tt:0,mt:0,mi:0,mr:0,yb:0,bo:0,bi:0};this.s.cx={pmax:0,Tmax:0,xr:this.s.cx?this.s.cx.xr:0}}
updV(){const P=this.P,sg=P.ivo+P.phin*1.7+P.ivc*2.3+P.evo*3.1+P.evc*4.3+P.phex*5.9+P.Lv*71+P.dv*13+P.cam;if(sg!==this.sig){this.sig=sg;this.V=valves(P,this.G);this.vhit=valveHit(P,this.G)}}
f(y){const P=this.P,G=this.G,s=this.s,C=s.C,th=y[0],om=y[1],p=y[2],m=Math.max(y[3],1e-7),mu=y[4],Tw=y[5],pin=y[6],mbi=Math.max(0,y[7]),mr=y[8],pp=y[9],mbp=Math.max(0,y[10]),RO=!!P.run,Ar=PI/4*P.dr*P.dr,Vp=.5*Ar*P.Lr,pv=RO?pp:pin,cst=P.gam,tt=md4(th),k=kin(G,th),T=p*k.V/(m*R),g=gmT(T,cst),Yu=Math.min(1,Math.max(0,mu/m)),pex=P.pa+K.pexo;
const mi=mdot(pv,p,pv>p?TI:T,Aeff(this.V.i,tt,P.cam),cst),me=mdot(p,pex,p>pex?T:TX,Aeff(this.V.e,tt,P.cam),cst),Ybi=Math.min(1,mbi*R*TI/(pin*P.Vin)),Ybp=RO?Math.min(1,mbp*R*TI/(pp*Vp)):Ybi,mui=mi>=0?(1-Ybp)*mi:Yu*mi,mue=me>=0?Yu*me:0;
const mt=mdot(P.pa,pin,P.pa>pin?TA:TI,Ath(P,s.al),cst);
const dxb=C.on?wiebe((tt-C.th0)/C.db,C.m??K.wm)/C.db:0,Q=C.Q*dxb*om,dmc=C.mut*dxb*om,cm=G.S*om/PI,gx=tt>=md4(this.V.i.c)&&tt<md4(this.V.e.o);
const ws=woschni(G,p,T,cm,gx,s.I0,k.V,P.cw),Qw=ws.hc*k.A*(T-Tw);
const Hi=mi>=0?mi*cpT(TI,cst)*TI:mi*cpT(T,cst)*T,He=me>=0?me*cpT(T,cst)*T:me*cpT(TX,cst)*TX;
const dp=-g*p/k.V*k.dV*om+(g-1)/k.V*(Q-Qw+Hi-He);
const Ts=s.starter&&!s.fired?K.Tst*Math.max(0,1-om/K.wnl):0,Ti=(p-P.pa)*k.dV,Td=s.fe*kwf(P)*om*om,Tf=om>0?fmepCF(G,s.pmx,om)*G.Vd/P4:0;
let dom=(Ti+Ts-Tf-Td)/(K.I+P.Id),dth=om;if(this.fixw)dom=0;if(om<=0&&dom<0){dom=0;dth=0}
const mr2=RO?mr:mi;this.X={T,k,mi,me,Ts,Ti,Td,Tf,tt,Yu,mt,Q,Qw,hc:ws.hc,Ybi,Ybp,mr:mr2,pv};
return[dth,dom,dp,mi-me,mui-mue-dmc,this.fixTw?0:(Qw-K.Gw*(Tw-K.Twc))/K.Cw,...(RO?[R*TI/P.Vin*(mt-mr),-mr*(mr>=0?Ybi:Ybp)+Math.min(0,mt)*Ybi,Ar/P.Lr*(pin-pp)-(K.fr*P.Lr/P.dr+K.ze)*mr*Math.abs(mr)/(2*pin/(R*TI)*Ar*P.Lr),K.gp*R*TI/Vp*(mr-mi),mr*(mr>=0?Ybi:Ybp)-mi*(mi>=0?Ybp:1-Yu)]:[R*TI/P.Vin*(mt-mi),-mi*(mi>=0?Ybi:1-Yu)+Math.min(0,mt)*Ybi,0,0,0]),mi<0?-mi*(1-Yu):0,mi>=0?mi*Ybp:0]}
rnd(){const s=this.s;let t=(s.rs=(s.rs+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
uz(){return(2*this.rnd()-1)*Math.sqrt(3)}
ign(X){const s=this.s,P=this.P,C=s.C,om=Math.max(s.y[1],20),b=burn(this.G,X.T,s.y[2],1-X.Yu,P.phi,om,s.spa,P.cid,P.cbr);C.th0=b.th0;C.db=b.db;C.m=P.wm;if(P.cvar){const z1=this.uz(),z2=this.uz();s.cz=[z1,z2];C.th0+=CCV.s0*D*z1;C.db*=Math.max(.5,1+CCV.sb*z2)}else s.cz=[0,0];C.Q=s.fuel?C.mut/(1+P.phi/K.AFR)*P.phi/K.AFR*K.Hu*K.etac*richEps(P.phi):0;C.on=!!s.fuel}
step(){const s=this.s,P=this.P,G=this.G;this.updV();if(!!P.run!==!!s.runOn){s.runOn=P.run;if(P.run){const y=s.y,pin=y[6],Ybi=Math.min(1,Math.max(0,y[7])*R*TI/(pin*P.Vin));y[8]=0;y[9]=pin;y[10]=Ybi*pin*.5*PI/4*P.dr*P.dr*P.Lr/(R*TI)}}if(!P.sauto||!s.fired)s.spa=P.spb;const y0=s.y,om=Math.max(y0[1],20),V0=kin(G,y0[0]).V,p0=y0[2],F=y=>this.f(y);let dt,X0,y1;
if(P.sol===0){dt=Math.min(P.dth/om,1e-4);const k1=F(y0);X0=this.X;const k2=F(axpy(y0,k1,dt/2)),k3=F(axpy(y0,k2,dt/2)),k4=F(axpy(y0,k3,dt));y1=y0.map((v,i)=>v+dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]))}
else{let h=Math.min(s.h,.5*D/om,1e-3);const k1=F(y0);X0=this.X;for(let n=0;;n++){const r=dp45(F,y0,h,k1);let E=0;for(let i=0;i<11;i++)E=Math.max(E,Math.abs(r.y5[i]-r.y4[i])/(ATOL[i]+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r.y5[i]))));const fac=Math.min(2.5,Math.max(.2,.9*Math.pow(Math.max(E,1e-10),-.2)));if(E<=1||n>12||h<1e-8){y1=r.y5;dt=h;s.h=h*fac;break}h*=fac}}
y1[3]=Math.max(y1[3],1e-7);y1[7]=Math.max(0,y1[7]);y1[10]=Math.max(0,y1[10]);y1[9]=Math.max(y1[9],1e3);y1[4]=Math.min(y1[3],Math.max(0,y1[4]));y1[1]=Math.max(y1[1],0);y1[2]=Math.max(y1[2],1e3);s.y=y1;
const X=this.X=X0,k=kin(G,y1[0]),tt=md4(y1[0]),dW=(p0+y1[2])/2*(k.V-V0),da=y1[0]-y0[0],cw=s.cw,cx=s.cx;
cw.n+=dW;if(X.tt>=PI&&X.tt<3*PI)cw.g+=dW;cw.wf+=X.Tf*da;cw.wd+=X.Td*da;cw.tt+=dt;cw.mt+=X.mt*dt;cw.mi+=X.mi*dt;cw.mr+=X.mr*dt;cw.yb+=X.Ybi*dt;cx.pmax=Math.max(cx.pmax,p0);cx.Tmax=Math.max(cx.Tmax,X.T);
const i=Math.round(X.tt/D*2)%1440,tr=this.tr,vals=[p0/1e3,V0*1e6,X.T,X.mi*1e3,X.me*1e3,lift(this.V.i,X.tt,P.cam)*1e3,lift(this.V.e,X.tt,P.cam)*1e3,X.Ti,X.Ts,X.Td,X.Tf,y0[1]*30/PI,y0[6]/1e3,X.mt*1e3,y0[3]*1e6,y0[4]*1e6,X.Q/om*D,X.k.dV/G.Ap*y0[1]];
let j=s.li<0||md4((i-s.li)*.5*D)>8*D?i:(s.li+1)%1440;for(let n=0;n<16;n++){for(let q=0;q<18;q++)tr[TRK[q]][j]=vals[q];if(j===i)break;j=(j+1)%1440}s.li=i;
const cr=a=>{a=md4(a);return s.tp<=a&&tt>a};
if(tt<s.tp)this.cycleEnd();
if(cr(this.V.i.c)){s.I0={p:y1[2],V:k.V,T:X.T};s.C.mut=y1[4];cx.xr=1-y1[4]/y1[3]}
if(cr(this.V.e.o))s.YuE=y1[4]/y1[3];
if(cr(2*PI-s.spa*D))this.ign(X);
s.tp=tt;s.t+=dt;this.ecu(dt,y1[1]);
if(s.t>=s.hn*.05){s.hn++;const H=this.H,M=s.Mx;H.t.push(s.t);H.N.push(s.Nb);H.Nt.push(P.nt);H.pin.push(y1[6]/1e3);H.al.push(s.al/D);H.Tw.push(y1[5]);H.tb.push(M?M.tb:NaN);H.td.push(M?M.Tdm:NaN);H.fc.push(s.fc);H.fe.push(s.fe);if(H.t.length>620)for(const a in H)H[a].shift()}
return dt}
cycleEnd(){const s=this.s,P=this.P,G=this.G,cw=s.cw,cx=s.cx,C=s.C,W=cw.n,tc=cw.tt;s.Wg=cw.g;if(cx.pmax>0)s.pmx=cx.pmax;s.cyc++;s.ca=C.on&&C.Q>0?ca50(C):NaN;if(P.sauto&&s.fired&&s.ca===s.ca)s.spa+=KS*(s.ca-CA50T);
const ma=C.mut/(1+P.phi/K.AFR),mf=P.phi*ma/K.AFR,mfd=mf/tc,imep=W/G.Vd,fmep=cw.wf/G.Vd,Pb=(W-cw.wf)/tc,wb=P4/tc;
const M={imep,pmep:(W-cw.g)/G.Vd,W,Wg:cw.g,Wf:cw.wf,Wd:cw.wd,tc,wb,N:wb*30/PI,ei:C.Q>0&&mf>0?W/(mf*K.Hu):NaN,pi:W/tc,ev:ma/(P.pa/(R*TA)*G.Vd),xr:cx.xr,mr:cw.mr/tc,ybi:cw.yb/tc,bo:s.y[11]-s.ab[0],bi:s.y[12]-s.ab[1],pm:cx.pmax,Tm:cx.Tmax,tb:(W-cw.wf)/P4,pb:Pb,bmep:imep-fmep,fmep,em:imep>0?(imep-fmep)/imep:NaN,bsfc:Pb>0&&mfd>0?mfd/Pb*3.6e9:NaN,eb:Pb>0&&mfd>0?Pb/(mfd*K.Hu):NaN,mfd,Tdm:cw.wd/P4,ca50:s.ca,spa:s.spa,cz:s.cz.slice(),Pd:cw.wd/tc,Pf:cw.wf/tc,mth:cw.mt/tc,min:cw.mi/tc,YuE:s.YuE};
s.ab=[s.y[11],s.y[12]];s.Mx=s.cf&&s.fired?M:null;this.lastM=M;this.last={p:Float32Array.from(this.tr.p),V:Float32Array.from(this.tr.V),me:Float32Array.from(this.tr.me),imep,pm:cx.pmax,N:M.N,ok:!!s.Mx};s.cf=s.fired;this.rc()}
ecu(dt,om){const s=this.s,P=this.P;s.Nb+=(om*30/PI-s.Nb)*Math.min(1,dt/P.tN);
if(!s.fired&&s.fuel&&s.Nb>K.Nfire&&s.Wg>20){s.fired=1;s.starter=0;s.Ip=0;s.If=0}
if(s.fired&&s.Nb<150){s.fired=0;s.fuel=0;s.Mx=null}
if(P.mode!==s.mode){if(s.fired){if(P.mode===1){P.alm=s.al;s.If=s.fc-P.fb-P.Kpd*(s.Nb-P.nt)}else{P.fm=s.fc;s.Ip=s.al-P.alb-P.Kp*(P.nt-s.Nb)}}s.mode=P.mode}
const e=P.nt-s.Nb;
if(!s.fired){s.al=P.alc;s.fc=0}
else if(s.mode===0){const u=P.alb+P.Kp*e+s.Ip;if(!((u>=P.amax&&e>0)||(u<=0&&e<0)))s.Ip+=P.Ki*e*dt;s.al=Math.min(P.amax,Math.max(0,P.alb+P.Kp*e+s.Ip));s.fc=P.fm}
else{const ed=-e,u=P.fb+P.Kpd*ed+s.If;if(!((u>=1&&ed>0)||(u<=0&&ed<0)))s.If+=P.Kid*ed*dt;s.al=P.alm;s.fc=Math.min(1,Math.max(0,P.fb+P.Kpd*ed+s.If))}
s.fe=s.fc+(s.fe-s.fc)*Math.exp(-dt/P.td);
if(s.fired&&s.mode===1){s.ov=(s.fc>=1&&s.Nb>P.nt+100)?s.ov+dt:0;s.up=(s.fc<=0&&s.Nb<P.nt-100)?s.up+dt:0}else{s.ov=0;s.up=0}}
start(){this.s.fuel=1;if(!this.s.fired)this.s.starter=1}
stop(){const s=this.s;s.fuel=0;s.starter=0;s.fired=0;s.C.on=0;s.C.Q=0;s.Mx=null}
clone(){const c=new Core({...this.P});c.s=structuredClone(this.s);c.G=geo(c.P);c.sig=NaN;c.updV();if(this.last)c.last={...this.last,p:Float32Array.from(this.last.p),V:Float32Array.from(this.last.V),me:Float32Array.from(this.last.me)};c.lastM=this.lastM;return c}
run(T){const t1=this.s.t+T;while(this.s.t<t1)this.step()}
}
/* ===== metrics display (validity rule) ===== */
const fmtv=(x,n,u,lo,hi)=>x==null||!isFinite(x)||(lo!=null&&(x<lo||x>hi))?'–':x.toFixed(n)+u;
/* ===== WOT sweep (REQ-26) ===== */
const SWN=Array.from({length:13},(_,i)=>1000+500*i);
class Sweep{constructor(P0){const c=this.c=new Core({...P0,cvar:0,sauto:1,mode:1,alm:PI/2});c.fixw=1;c.fixTw=1;c.s.y[5]=K.Twc;this.pts=[];this.i=0;this.done=false;this.sig=JSON.stringify(P0);this.begin()}
begin(){const c=this.c,N=SWN[this.i];c.s.y[1]=N*PI/30;c.s.Nb=N;c.P.nt=N;if(!c.s.fuel)c.start();this.h=[];this.cy=c.s.cyc;this.nc=0}
run(ms){const c=this.c,t0=performance.now();let n=0;while(!this.done){c.step();if(c.s.cyc!==this.cy){this.cy=c.s.cyc;this.nc++;if(c.s.fired&&c.lastM)this.h.push(c.lastM);this.check()}if((++n&31)===0&&performance.now()-t0>ms)break}return this.done}
check(){const h=this.h;let ok=false;if(h.length>=4){const a=h.slice(-3),T=a.map(m=>m.tb),S=a.map(m=>m.spa);ok=Math.max(...T)-Math.min(...T)<=.003*Math.abs(T[2])+.02&&Math.max(...S)-Math.min(...S)<=.3}
if(ok||h.length>=60||this.nc>=120){const M=h[h.length-1]||{};this.pts.push({N:SWN[this.i],Na:M.N,Nw:this.c.s.y[1]*30/PI,tb:M.tb,pb:M.pb,bmep:M.bmep,ev:M.ev,bsfc:M.bsfc,eb:M.eb,spa:M.spa,xr:M.xr,ok,cyc:h.length});this.i++;if(this.i>=SWN.length)this.done=true;else this.begin()}}}
function metricList0(c,pg){const s=c.s,m=s.Mx||{},P=c.P,y=s.y,e=[0,1.5];
return pg?[['ṁ_f',fmtv(m.mfd*1e3,3,' g/s')],['T_b',fmtv(m.tb,1,' N·m')],['P_b',fmtv(m.pb/1e3,2,' kW')],['BMEP',fmtv(m.bmep/1e3,0,' kPa')],['FMEP',fmtv(m.fmep/1e3,0,' kPa')],['ηm',fmtv(m.em,3,'',...e)],['bsfc',fmtv(m.bsfc,0,' g/kWh',0,1e5)],['ηb',fmtv(m.eb,3,'',...e)],['T_dyno',fmtv(s.fe*kwf(P)*y[1]*y[1],1,' N·m')],['f_eff',fmtv(s.fe,2,'')],['Yb,in',fmtv(m.ybi,3,'',0,1)],['点火',fmtv(s.spa,1,'°')]]
:[['N̄',fmtv(s.Nb,0,' rpm')],['IMEP',fmtv(m.imep/1e3,0,' kPa')],['PMEP',fmtv(m.pmep/1e3,0,' kPa')],['ηi',fmtv(m.ei,3,'',...e)],['Pi',fmtv(m.pi/1e3,2,' kW')],['ηv',fmtv(m.ev,3,'',...e)],['xr',fmtv(m.xr,3,'',0,1)],['p_max',fmtv(m.pm/1e3,0,' kPa')],['T_max',fmtv(m.Tm,0,' K')],['T_w',fmtv(y[5],0,' K')],['α',fmtv(s.al/D,1,'°')],['p_in',fmtv(y[6]/1e3,1,' kPa')]]}
const MJP={'ṁ_f':'燃料流量','T_b':'軸トルク','P_b':'軸出力','BMEP':'正味平均有効圧','FMEP':'摩擦平均有効圧','ηm':'機械効率','bsfc':'正味燃料消費率','ηb':'正味熱効率','T_dyno':'動力計トルク','f_eff':'実効充水率','Yb,in':'吸気管既燃率','点火':'点火時期','N̄':'平均回転数','IMEP':'図示平均有効圧','PMEP':'ポンプ損失平均有効圧','ηi':'図示熱効率','Pi':'図示出力','ηv':'体積効率','xr':'残留ガス率','p_max':'最高筒内圧','T_max':'最高ガス温度','T_w':'壁温','α':'スロットル開度','p_in':'吸気管圧'};
function metricList(c,pg){return metricList0(c,pg).map(q=>q[0]==='点火'?[q[0],q[1]==='–'?q[1]:q[1]+' BTDC',MJP[q[0]]]:[q[0],q[1],MJP[q[0]]])}
