'use strict';
/* ===== constants (single source) ===== */
const R=287,TA=298.15,TI=298.15,TX=800,PI=Math.PI,D=PI/180,P4=4*PI;
const K={Cdx:.8,fr:.02,ze:.2,gp:1.4,lk:.025,Ck:.4,wa:5,wm:2,Cdv:.6,Cdt:.8,cfA:13.7e3,cfB:.005,cfC:16.2e3,Hu:44e6,AFR:14.7,etac:.97,C1g:2.28,C1s:6.18,C2:3.24e-3,Cw0:3.26,Twc:360,Cw:1500,Gw:15,I:.12,Tst:60,wnl:209,Nfire:550,g0:1.35,kT:.26,dal:1,Ct:6,wmin:20,dtR4:2e-5,Ti0:320};
/* ===== item definition table (single source for settings, doc, tests) ===== */
const PAGES=['機関','VVT・カム','弁タイミング','吸気','燃焼','運転','ECU','動力計','解法','音と振動','燃焼速度','吸気ランナ','排気系','噴射','車両','冷却'];
const ITEMS=[
{k:'B',n:'ボア B',u:'mm',f:1e-3,lo:40,hi:150,st:1,d:86,c:'r',pg:0},
{k:'S',n:'ストローク S',u:'mm',f:1e-3,lo:40,hi:150,st:1,d:86,c:'r',pg:0},
{k:'lr',n:'連桿長 l',u:'mm',f:1e-3,lo:60,hi:300,st:1,d:145,c:'r',pg:0},
{k:'eps',n:'圧縮比 ε',u:'',f:1,lo:1.1,hi:100,st:.1,d:10,c:'r',pg:0},
{k:'phin',n:'吸気位相 φin',u:'°CA',f:D,lo:-40,hi:40,st:1,d:0,c:'i',pg:1},
{k:'phex',n:'排気位相 φex',u:'°CA',f:D,lo:-40,hi:40,st:1,d:0,c:'i',pg:1},
{k:'cam',n:'カム',u:'',ch:['Std','Poly','Aggr'],d:0,c:'i',pg:1},
{k:'Lv',n:'最大リフト',u:'mm',f:1e-3,lo:3,hi:14,st:.5,d:9,c:'i',pg:1},
{k:'dv',n:'吸気弁径（2 個）',u:'mm',f:1e-3,lo:20,hi:50,st:1,d:31,c:'i',pg:1},
{k:'dve',n:'排気弁径（2 個）',u:'mm',f:1e-3,lo:20,hi:50,st:1,d:26,c:'i',pg:1},
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
{k:'dpx',n:'排気圧損（OFF 時）',u:'kPa',f:1e3,lo:0,hi:30,st:.5,d:0,c:'i',pg:12},
/* SPEC-30：噴射（熱物性が「化学平衡」のときだけ使う） */
{k:'inj',n:'噴射方式',u:'',ch:['ポート噴射','直噴'],d:1,c:'i',pg:13},
{k:'soi',n:'噴射開始',u:'°ATDC',f:D,lo:0,hi:330,st:5,d:80,c:'i',pg:13},
{k:'qinj',n:'インジェクタ流量',u:'g/s',f:1e-3,lo:5,hi:40,st:1,d:15,c:'i',pg:13},
{k:'tev',n:'気化の時定数',u:'ms',f:1e-3,lo:0,hi:10,st:.1,d:1.5,c:'i',pg:13},
{k:'spb',n:'点火時期',u:'°BTDC',f:1,lo:null,hi:null,st:1,d:18,c:'i',pg:4},
{k:'sauto',n:'点火の自動最適化',u:'',ch:['OFF','ON'],d:1,c:'i',pg:4},
{k:'cvar',n:'サイクル変動',u:'',ch:['OFF','ON'],d:0,c:'i',pg:4},
{k:'phi',n:'当量比 φ',u:'',f:1,lo:.6,hi:1.4,st:.01,d:1,c:'i',pg:4},
{k:'cw',n:'Woschni係数',u:'',f:1,lo:0,hi:2,st:.05,d:1,c:'i',pg:4},
{k:'gam',n:'熱物性',u:'',ch:['γ(T)','γ一定','化学平衡'],d:2,c:'i',pg:4},
{k:'mode',n:'回転数の制御',u:'',ch:['スロットル','動力計'],d:1,c:'i',pg:5},
{k:'nt',n:'目標回転数',u:'rpm',f:1,lo:500,hi:null,st:50,d:800,c:'i',pg:5},
{k:'alm',n:'スロットル開度',u:'°',f:D,lo:0,hi:90,st:.1,d:15,c:'i',pg:5},
{k:'Tl',n:'負荷トルク',u:'N·m',f:1,lo:0,hi:200,st:.5,d:0,c:'i',pg:5},
{k:'Ta',n:'補機負荷トルク',u:'N·m',f:1,lo:0,hi:20,st:.1,d:2,c:'i',pg:5},
{k:'tN',n:'平均時定数 τN',u:'s',f:1,lo:.05,hi:1,st:.05,d:.15,c:'i',pg:6},
{k:'alc',n:'始動開度',u:'°',f:D,lo:0,hi:90,st:1,d:6,c:'i',pg:6},
{k:'alb',n:'基準開度',u:'°',f:D,lo:0,hi:90,st:1,d:3,c:'i',pg:6},
{k:'Kp',n:'Kp',u:'°/rpm',f:D,lo:.001,hi:.2,st:.001,d:.008,c:'i',pg:6},
{k:'Ki',n:'Ki',u:'°/(rpm·s)',f:D,lo:.002,hi:.5,st:.002,d:.004,c:'i',pg:6},
{k:'amax',n:'最大開度',u:'°',f:D,lo:1,hi:90,st:1,d:90,c:'i',pg:6},
{k:'bench',n:'試験の種類',u:'',ch:['エンジン','シャシー'],d:0,c:'i',pg:14},
{k:'mv',n:'車重',u:'kg',f:1,lo:50,hi:3000,st:10,d:600,c:'i',pg:14},
{k:'Cd',n:'C_d',u:'',f:1,lo:.1,hi:1.5,st:.01,d:.3,c:'i',pg:14},
{k:'Af',n:'前面投影面積',u:'m²',f:1,lo:.2,hi:5,st:.1,d:2,c:'i',pg:14},
{k:'Crr',n:'転がり抵抗係数',u:'',f:1,lo:0,hi:.05,st:.001,d:.012,c:'i',pg:14},
{k:'etd',n:'駆動系の効率',u:'',f:1,lo:.5,hi:1,st:.01,d:.9,c:'i',pg:14},
{k:'Tr',n:'定格トルク',u:'N·m',f:1,lo:5,hi:500,st:1,d:100,c:'i',pg:7},
{k:'Pr',n:'定格出力',u:'kW',f:1e3,lo:10,hi:2000,st:10,d:500,c:'i',pg:7},
{k:'td',n:'トルクの時定数 τd',u:'ms',f:1e-3,lo:1,hi:200,st:1,d:10,c:'i',pg:7},
{k:'Id',n:'I_dyno',u:'kg·m²',f:1,lo:.01,hi:.5,st:.01,d:.05,c:'i',pg:7},
{k:'Kpd',n:'K_pd',u:'N·m/rpm',f:1,lo:.01,hi:2,st:.01,d:.2,c:'i',pg:7},
{k:'Kid',n:'K_id',u:'N·m/(rpm·s)',f:1,lo:.05,hi:5,st:.05,d:.6,c:'i',pg:7},
{k:'sol',n:'ソルバ',u:'',ch:['RK4','DOPRI5(4)'],d:1,c:'i',pg:8},
{k:'dth',n:'RK4刻み Δθ',u:'°CA',f:D,lo:.01,hi:5,st:.01,d:.25,c:'i',pg:8},
{k:'rtol',n:'RK45 rtol',u:'',ch:['1e-4','1e-5','1e-6'],vals:[1e-4,1e-5,1e-6],d:1,c:'i',pg:8},
{k:'vol',n:'音量',u:'%',f:.01,lo:0,hi:100,st:5,d:60,c:'i',pg:9},
{k:'Lex',n:'排気管長 L',u:'m',f:1,lo:.3,hi:3,st:.1,d:1,c:'i',pg:9},
{k:'dex',n:'排気管内径 d',u:'mm',f:1e-3,lo:20,hi:80,st:2,d:40,c:'i',pg:9},
{k:'fl',n:'流れ雑音',u:'%',f:.01,lo:0,hi:100,st:10,d:40,c:'i',pg:9},
{k:'sm',n:'音の種類',u:'',ch:['計算','演出'],d:0,c:'i',pg:9},
{k:'cid',n:'着火遅れ係数 c_d',u:'',f:1,lo:.1,hi:10,st:.1,d:1,c:'i',pg:10},
{k:'cbr',n:'燃焼速度係数 c_b',u:'',f:1,lo:.1,hi:10,st:.1,d:1,c:'i',pg:10},
{k:'wm',n:'Wiebe 形状係数 m_w',u:'',f:1,lo:0,hi:6,st:.5,d:2,c:'i',pg:10},
/* 冷却（SPEC-08 の B．化学平衡のモデルだけ） */
{k:'Tw',n:'壁温 T_w',u:'K',f:1,lo:300,hi:3500,st:10,d:360,c:'i',pg:15}];
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
/* REQ-02：比熱．未燃・既燃の γ の線形当てはめ（Klein–Eriksson）と，顕熱の内部エネルギー（T0 からの積分） */
const THM={T0:298.15,au:1.3488,bu:13.0e-5,Tu:1000,ab:1.3678,bb:9.4e-5,Tb:2700};
const gmU=(T,cst)=>cst?K.g0:THM.au-THM.bu*(Math.min(T,THM.Tu)-300),gmB=(T,cst)=>cst?K.g0:THM.ab-THM.bb*(Math.min(T,THM.Tb)-300);
const THC=(()=>{const q=(a,b,Tc)=>{const f=x=>a-1-b*(x-300);return{l0:Math.log(f(THM.T0)),k:R/b,ec:R/b*Math.log(f(THM.T0)/f(Tc)),cc:R/f(Tc)}};return{u:q(THM.au,THM.bu,THM.Tu),b:q(THM.ab,THM.bb,THM.Tb)}})();
const eU=(T,cst)=>cst?R/(K.g0-1)*(T-THM.T0):T<=THM.Tu?THC.u.k*(THC.u.l0-Math.log(THM.au-1-THM.bu*(T-300))):THC.u.ec+THC.u.cc*(T-THM.Tu);
const eB=(T,cst)=>cst?R/(K.g0-1)*(T-THM.T0):T<=THM.Tb?THC.b.k*(THC.b.l0-Math.log(THM.ab-1-THM.bb*(T-300))):THC.b.ec+THC.b.cc*(T-THM.Tb);
const cvMix=(T,Y,cst)=>Y*R/(gmU(T,cst)-1)+(1-Y)*R/(gmB(T,cst)-1),gmMix=(T,Y,cst)=>1+R/cvMix(T,Y,cst),eMix=(T,Y,cst)=>Y*eU(T,cst)+(1-Y)*eB(T,cst),hMix=(T,Y,cst)=>eMix(T,Y,cst)+R*T;
const cpMix=(T,Y,cst)=>cvMix(T,Y,cst)+R;
/* 状態 16（0〜10，13〜17）と補助積分 22（11，12，18〜37）．NS より前だけが右辺に現れる */
/* 第26版：化学平衡のモデル（SPEC-29，30）の状態を 38〜42（m_f，m_bf，m_l，m_f,in，m_f,p），補助積分を 43〜45（H_e，∫ṁ_inj，∫ṁ_ev）に置く */
const NY=59,NS=18,MIX=[7,10,38,39,40,41,42],MEPS=1e-12;
const thConst=cst=>({cst,cpu:R/(gmU(TI,cst)-1)+R,cpb:R/(gmB(TI,cst)-1)+R,cvu:R/(gmU(TI,cst)-1),cvb:R/(gmB(TI,cst)-1),hui:eU(TI,cst)+R*TI,hbi:eB(TI,cst)+R*TI,hbx:eB(TX,cst)+R*TX,gbx:gmB(TX,cst),gua:gmU(TA,cst),kbx:psiK(gmB(TX,cst)),kua:psiK(gmU(TA,cst))});
/* 3 点を通る放物線の頂点の値（上に凸でなければ 3 点の最大） */
const parab=(x0,y0,x1,y1,x2,y2)=>{const d0=(y1-y0)/(x1-x0),d1=(y2-y1)/(x2-x1),c=(d1-d0)/(x2-x0);if(!(c<0))return Math.max(y0,y1,y2);const xv=(x0+x1)/2-d0/(2*c);return Math.max(y1,y0+d0*(xv-x0)+c*(xv-x0)*(xv-x1))};
const PROF=[x=>Math.sin(PI*x)**2,x=>16*x*x*(1-x)*(1-x),x=>Math.sin(PI*x)**.6];
const md4=a=>((a%P4)+P4)%P4;
function lift(v,th,cam){const w=v.w??md4(v.c-v.o),d=md4(th-v.o);return d>w?0:v.L*PROF[cam](d/w)}
const Aeff=(v,th,cam)=>v.n*K.Cdv*Math.min(PI*v.d*lift(v,th,cam),PI/4*v.d*v.d);
/* 弁の時期の制約（SPEC-15 I の 2）：k（ivo，ivc，evo，evc）の値として許される範囲 [°]．相手の時期との作用角が 1°〜719° */
const VTW=[1,719],vtLim=(k,P)=>{const a=x=>Math.round(P[x]/D);return k==='ivo'?[a('ivc')-VTW[1],a('ivc')-VTW[0]]:k==='ivc'?[a('ivo')+VTW[0],a('ivo')+VTW[1]]:k==='evo'?[a('evc')-VTW[1],a('evc')-VTW[0]]:k==='evc'?[a('evo')+VTW[0],a('evo')+VTW[1]]:[-Infinity,Infinity]};
/* 4 弁（SPEC-03 の 2）：吸気・排気とも n = 2 個．弁径の上限は (√2−1)B．P.nv = 1 は第25版との比較の検査だけが使う（1 個ずつ，上限 0.45B） */
function valves(P,G){const n=P.nv===1?1:2,cap=(n===1?.45:Math.SQRT2-1)*G.B,d=Math.min(P.dv,cap),V={n,i:{n,o:P.ivo+P.phin,c:P.ivc+P.phin,L:P.Lv,d},e:{n,o:P.evo+P.phex,c:P.evc+P.phex,L:P.Lv,d:Math.min(P.dve,cap)}};V.i.w=md4(V.i.c-V.i.o);V.e.w=md4(V.e.c-V.e.o);V.gA=md4(V.i.c);V.gB=md4(V.e.o);V.gO=md4(V.i.o);V.gC=md4(V.e.c);return V} /* w：作用角，gA・gB：IVC・EVO の位相（毎回の md4 を避けるための前計算） */
function valveHit(P,G){const v=valves(P,G);for(let a=0;a<1440;a++){const th=a*.5*D,h=G.hc+kin(G,th).x;if(lift(v.i,th,P.cam)>=h||lift(v.e,th,P.cam)>=h)return 1}return 0}
const rcrit=g=>(2/(g+1))**(g/(g-1));
/* Ψ(r, γ)（REQ-04）．γ は呼び出しごとに変わる（筒内とポートの温度・組成による）ので，γ ごとの前計算は持たない */
function psiF(rp,g){const k=2*g/(g-1);if(rp>1-1e-3){const r=1-1e-3;return(1-rp)/1e-3*(r**(1/g)*Math.sqrt(k*(1-r**((g-1)/g))))}/* 臨界圧力比は γ > 1 で e^(−1/2) = 0.6065 未満なので，r > 0.61 では臨界かどうかの判定（べき乗 1 回）を省く */if(rp<=.61&&rp<=(2/(g+1))**(g/(g-1)))return Math.sqrt(g*(2/(g+1))**((g+1)/(g-1)));return rp**(1/g)*Math.sqrt(k*(1-rp**((g-1)/g)))}
const psiK=g=>{const k=2*g/(g-1),r=1-1e-3;return{g,k,ig:1/g,eg:(g-1)/g,rc:(2/(g+1))**(g/(g-1)),ch:Math.sqrt(g*(2/(g+1))**((g+1)/(g-1))),s1:r**(1/g)*Math.sqrt(k*(1-r**((g-1)/g)))}};
const psiC=(rp,q)=>rp>1-1e-3?(1-rp)/1e-3*q.s1:rp<=q.rc?q.ch:rp**q.ig*Math.sqrt(q.k*(1-rp**q.eg));
function mdotC(p1,p2,T0,A,q){const pu=Math.max(p1,p2),pd=Math.min(p1,p2);if(pu===pd||A<=0)return 0;return Math.sign(p1-p2)*A*pu/Math.sqrt(R*T0)*psiC(pd/pu,q)}
function mdot(p1,p2,T0,A,g){const pu=Math.max(p1,p2),pd=Math.min(p1,p2);if(pu===pd||A<=0)return 0;return Math.sign(p1-p2)*A*pu/Math.sqrt(R*T0)*psiF(pd/pu,g)}
const Ath=(P,a)=>K.Cdt*PI/4*P.Dt*P.Dt*(1-Math.cos(a));
/* ===== 車両（SPEC-35）：走行抵抗，駆動力，予測（最高速度と加速の時間） ===== */
const VEH={g:9.80665,mut:.5,v0:.1,brk:.5,alb:.5*D,v100:100/3.6};
const vehRho=P=>P.pa/(R*TA);
const vehRes=(P,v)=>.5*vehRho(P)*P.Cd*P.Af*v*v+P.Crr*P.mv*VEH.g;
/* 駆動力（SPEC-35 A の 4）．Pd：機関から変速機が受ける出力 [W]，mut：駆動力の上限の係数（省くと VEH.mut） */
function vehDrv(P,v,Pd,mut){const Fm=(mut==null?VEH.mut:mut)*P.mv*VEH.g,vv=Math.max(v,VEH.v0);return Pd>=0?Math.min(Fm,P.etd*Pd/vv):v>0?Math.max(-Fm,Pd/(P.etd*vv)):0}
/* 予測（SPEC-35 B）：vmax [m/s]，tTo(v1) [s]（届かなければ NaN） */
function vehPerf(P,Pmax,mut){const Pw=P.etd*Pmax,Fm=(mut==null?VEH.mut:mut)*P.mv*VEH.g;let a=0,b=400;for(let i=0;i<100;i++){const m=(a+b)/2;if(Pw-vehRes(P,m)*m>0)a=m;else b=m}
 const tTo=v1=>{const n=2000,h=v1/n;let t=0;for(let i=0;i<n;i++){const v=(i+.5)*h,F=Math.min(Fm,Pw/v)-vehRes(P,v);if(!(F>0))return NaN;t+=P.mv*h/F}return t};
 return{vmax:(a+b)/2,tTo,t100:tTo(VEH.v100),Pmax}}
/* 回転数を動力計（シャシーでは変速機）が決めるか */
const dynOn=P=>P.bench===1||P.mode===1;
/* 電動式動力計の容量（SPEC-11 の 1）：|T| ≤ min(T_rated, P_rated/ω) */
const dynMax=(P,om)=>Math.min(P.Tr,P.Pr/Math.max(Math.abs(om),1e-9));
/* REQ-12 2′：補機負荷の feedforward と開度の下限 */
const alff=P=>P.alb+K.kT*D*P.Ta,almin=P=>Math.min(P.amax,Math.max(0,alff(P)-K.dal*D));
const fmepCF=(G,pmx,om)=>K.cfA+K.cfB*pmx+K.cfC*G.S*om/PI;                 /* Chen-Flynn [Pa] */
const SLC={Bm:.2758,B2:-.7834,phm:1.13,dil:2.1};
const SL0=ph=>Math.max(.05,SLC.Bm+SLC.B2*(ph-SLC.phm)**2);
const SLf=(T,p,xr,ph)=>{const al=2.18-.8*(ph-1),be=-.16+.22*(ph-1);return SL0(ph)*(T/298)**al*(p/101325)**be*Math.max(.15,1-SLC.dil*xr)};
function burn(G,T,p,xr,ph,om,spb,cd=1,cb=1){const SL=SLf(T,p,xr,ph),u=.5*G.S*om/PI,ST=SL+K.Ct*u,fr=1+.025*Math.max(0,-spb);return{SL,th0:2*PI-spb*D+cd*K.lk*G.B*om/(SL+K.Ck*u),db:fr*.65*G.B*om/ST/cb}}
/* rich-mixture incomplete combustion: CH_y products by element balance + water-gas shift (K=3.5) */
const RICH={y:1.87,K:3.5,hCO:283.0e3,hH2:241.8e3,Mf:(12.011+1.87*1.008)*1e-3};
function richProd(phi){const{y,K}=RICH;if(phi<=1){const o=2*(1+y/4)/phi;return{a:1,b:0,c:y/2,d:0,S:0}}const S=(2+y/2)*(1-1/phi),A=K-1,B=y/2-S+K*(1+S),C=K*S,disc=Math.sqrt(B*B-4*A*C);let b=(B-disc)/(2*A);b=Math.min(b,1,S);const d=S-b;return{a:1-b,b,c:y/2-d,d,S}}
const richEps=phi=>{if(phi<=1)return 1;const r=richProd(phi);return 1-(r.b*RICH.hCO+r.d*RICH.hH2)/(RICH.Mf*K.Hu)};
function woschni(G,p,T,cm,gx,I0,V,cwc){const pm=I0.p*(I0.V/V)**1.33,w=gx?K.C1g*cm+K.C2*G.Vd*I0.T/(I0.p*I0.V)*Math.max(0,p-pm):K.C1s*cm;return{w,hc:cwc*K.Cw0*G.B**-.2*(p/1e3)**.8*T**-.55*Math.max(w,.5)**.8}}
const CCV={s0:3,sb:.12};
const CA50T=10,KS=.6,z50=(m=K.wm)=>Math.pow(Math.log(2)/K.wa,1/(m+1)),ca50=C=>(C.th0+C.db*z50(C.m??K.wm))/D-360;
const wiebe=(z,m=K.wm)=>z>0&&z<=1?K.wa*(m+1)*z**m*Math.exp(-K.wa*z**(m+1)):0;
/* ===== SPEC-29：化学種の熱物性と化学平衡（NASA 7 係数多項式．係数は tools/richburn/thermo.json = NASA TM-4513） ===== */
const RU=8.314462618,PSTD=1e5,AW={C:12.011e-3,H:1.008e-3,O:15.999e-3,N:14.007e-3};
const NASA={
 CO2:{c:{C: 1, O: 2},lo:[2.35677352,0.00898459677,-7.12356269e-06,2.45919022e-09,-1.43699548e-13,-48371.9697,9.90105222],hi:[4.63659493,0.00274131991,-9.95828531e-07,1.60373011e-10,-9.16103468e-15,-49024.9341,-1.93534855]},
 CO:{c:{C: 1, O: 1},lo:[3.57953347,-0.00061035368,1.01681433e-06,9.07005884e-10,-9.04424499e-13,-14344.086,3.50840928],hi:[3.04848583,0.00135172818,-4.85794075e-07,7.88536486e-11,-4.69807489e-15,-14266.1171,6.0170979]},
 H2O:{c:{H: 2, O: 1},lo:[4.19864056,-0.0020364341,6.52040211e-06,-5.48797062e-09,1.77197817e-12,-30293.7267,-0.849032208],hi:[2.67703787,0.00297318329,-7.7376969e-07,9.44336689e-11,-4.26900959e-15,-29885.8938,6.88255571]},
 H2:{c:{H: 2},lo:[2.34433112,0.00798052075,-1.9478151e-05,2.01572094e-08,-7.37611761e-12,-917.935173,0.683010238],hi:[2.93286579,0.000826607967,-1.46402335e-07,1.54100359e-11,-6.88804432e-16,-813.065597,-1.02432887]},
 O2:{c:{O: 2},lo:[3.78245636,-0.00299673415,9.847302e-06,-9.68129508e-09,3.24372836e-12,-1063.94356,3.65767573],hi:[3.66096083,0.000656365523,-1.41149485e-07,2.05797658e-11,-1.29913248e-15,-1215.97725,3.41536184]},
 N2:{c:{N: 2},lo:[3.53100528,-0.000123660987,-5.02999437e-07,2.43530612e-09,-1.40881235e-12,-1046.97628,2.96747468],hi:[2.95257626,0.00139690057,-4.92631691e-07,7.86010367e-11,-4.60755321e-15,-923.948645,5.87189252]},
 OH:{c:{O: 1, H: 1},lo:[3.99201543,-0.00240131752,4.61793841e-06,-3.88113333e-09,1.3641147e-12,3615.08056,-0.103925458],hi:[2.83864607,0.00110725586,-2.93914978e-07,4.20524247e-11,-2.42169092e-15,3943.95852,5.84452662]},
 O:{c:{O: 1},lo:[3.1682671,-0.00327931884,6.64306396e-06,-6.12806624e-09,2.11265971e-12,29122.2592,2.05193346],hi:[2.54363697,-2.73162486e-05,-4.1902952e-09,4.95481845e-12,-4.79553694e-16,29226.012,4.92229457]},
 H:{c:{H: 1},lo:[2.5,0.0,0.0,0.0,0.0,25473.6599,-0.446682853],hi:[2.50000286,-5.65334214e-09,3.63251723e-12,-9.1994972e-16,7.95260746e-20,25473.6589,-0.446698494]},
 NO:{c:{N: 1, O: 1},lo:[4.21859896,-0.00463988124,1.10443049e-05,-9.34055507e-09,2.80554874e-12,9845.09964,2.28061001],hi:[3.26071234,0.00119101135,-4.29122646e-07,6.94481463e-11,-4.03295681e-15,9921.43132,6.36900518]},
 ISO:{c:{C: 8, H: 18},lo:[0.815737338,0.0732643959,1.78300688e-05,-6.9358962e-08,3.21629382e-11,-30477.2862,24.1509994],hi:[15.9899273,0.055318479,-1.95267072e-05,3.11779172e-09,-1.85312577e-13,-35875.7973,-60.1161414]}};
const GAS=(()=>{
 const M=c=>Object.keys(c).reduce((s,e)=>s+AW[e]*c[e],0),S={};for(const k in NASA)S[k]={...NASA[k],M:M(NASA[k].c)};
 const co=(s,T)=>T<1000?s.lo:s.hi;
 const cp=(s,T)=>{const a=co(s,T);return RU*(a[0]+T*(a[1]+T*(a[2]+T*(a[3]+T*a[4]))))};               /* J/(mol K) */
 const h=(s,T)=>{const a=co(s,T);return RU*T*(a[0]+T*(a[1]/2+T*(a[2]/3+T*(a[3]/4+T*a[4]/5)))+a[5]/T)}; /* J/mol（生成エンタルピーを含む） */
 const s0=(s,T)=>{const a=co(s,T);return RU*(a[0]*Math.log(T)+T*(a[1]+T*(a[2]/2+T*(a[3]/3+T*a[4]/4)))+a[6])};
 const u=(s,T)=>h(s,T)-RU*T,T0=298.15,y=1.87,Mf=.110,nC=Mf/(AW.C+y*AW.H),hfg=350e3,Tl=300,Tfr=1700;
 /* 燃料蒸気：擬似種 C_n H_{yn}．比熱はイソオクタンの質量あたりの値，生成エンタルピーは蒸気の低位発熱量 Hu + hfg から */
 const kf=Mf/S.ISO.M,F={c:{C:nC,H:y*nC},lo:S.ISO.lo.map(x=>x*kf),hi:S.ISO.hi.map(x=>x*kf),M:Mf};
 {const d=((K.Hu+hfg)*Mf+nC*h(S.CO2,T0)+y*nC/2*h(S.H2O,T0)-h(F,T0))/RU;F.lo[5]+=d;F.hi[5]+=d}
 const Ma=(S.O2.M+3.76*S.N2.M)/4.76,Ra=RU/Ma,Rf=RU/Mf,AF=(1+y/4)*(S.O2.M+3.76*S.N2.M)/(AW.C+y*AW.H),xo=1/(4.76*Ma),xn=3.76/(4.76*Ma);
 /* 空気と燃料蒸気の質量あたりの e，c_v：成分の多項式の係数をあらかじめ質量あたりに合成しておく（右辺で毎回使うため）．
    c_v = c0 + c1 T + … + c4 T⁴，e = E0 + T (c0 + T (c1/2 + T (c2/3 + T (c3/4 + T c4/5)))) */
 const pk=(ws,rng)=>{const c=[0,0,0,0,0],o=[];let E0=0;for(const[w,s]of ws){const a=s[rng];for(let k=0;k<5;k++)c[k]+=w*RU*(a[k]-(k?0:1));E0+=w*RU*a[5]}return[c[0],c[1],c[2],c[3],c[4],E0,c[1]/2,c[2]/3,c[3]/4,c[4]/5]},
  AL=pk([[xo,S.O2],[xn,S.N2]],'lo'),AH=pk([[xo,S.O2],[xn,S.N2]],'hi'),FL=pk([[1/Mf,F]],'lo'),FH=pk([[1/Mf,F]],'hi'),
  pe=(a,T)=>a[5]+T*(a[0]+T*(a[6]+T*(a[7]+T*(a[8]+T*a[9])))),pc=(a,T)=>a[0]+T*(a[1]+T*(a[2]+T*(a[3]+T*a[4])));
 const ea=T=>pe(T<1000?AL:AH,T),cva=T=>pc(T<1000?AL:AH,T),ha=T=>ea(T)+Ra*T;
 const ef=T=>pe(T<1000?FL:FH,T),cvf=T=>pc(T<1000?FL:FH,T),hf=T=>ef(T)+Rf*T;
 /* 既燃ガス：10 種の化学平衡（Gibbs エネルギー最小．Gordon–McBride の反復） */
 const SP=['CO2','CO','H2O','H2','O2','N2','OH','O','H','NO'].map(k=>S[k]),EL=['C','H','O','N'],NS=10,A=EL.map(e=>SP.map(s=>s.c[e]||0));
 const elem=(z,ec)=>[ec*z*nC/Mf,ec*z*y*nC/Mf,2*(1-z)*xo,2*(1-z)*xn];
 function solve(M,r,n){for(let i=0;i<n;i++){let p=i;for(let k=i+1;k<n;k++)if(Math.abs(M[k][i])>Math.abs(M[p][i]))p=k;if(p!==i){const t=M[i];M[i]=M[p];M[p]=t;const q=r[i];r[i]=r[p];r[p]=q}const d=M[i][i];for(let k=i+1;k<n;k++){const f=M[k][i]/d;if(f){for(let j=i;j<n;j++)M[k][j]-=f*M[i][j];r[k]-=f*r[i]}}}for(let i=n-1;i>=0;i--){let s=r[i];for(let j=i+1;j<n;j++)s-=M[i][j]*r[j];r[i]=s/M[i][i]}return r}
 function eq(T,p,z,ec,n0){const b=elem(z,ec),g=SP.map(s=>(h(s,T)-T*s0(s,T))/(RU*T)),lp=Math.log(p/PSTD),n=new Float64Array(NS);
  if(n0)for(let j=0;j<NS;j++)n[j]=Math.max(n0[j],1e-12);else n.fill((b[0]+b[1]+b[2]+b[3])/NS*.1);
  let N=0;for(let j=0;j<NS;j++)N+=n[j];const mu=new Float64Array(NS),dn=new Float64Array(NS);let it=0,ok=false;
  for(;it<400;it++){let sn=0,smu=0;for(let j=0;j<NS;j++){mu[j]=g[j]+Math.log(n[j]/N)+lp;sn+=n[j];smu+=n[j]*mu[j]}
   const Mx=[],r=[];for(let k=0;k<4;k++){const row=[0,0,0,0,0];let an=0,am=0;for(let j=0;j<NS;j++){const w=A[k][j]*n[j];if(!w)continue;an+=w;am+=w*mu[j];for(let i=0;i<4;i++)row[i]+=w*A[i][j]}row[4]=an;Mx.push(row);r.push(b[k]-an+am)}
   Mx.push([Mx[0][4],Mx[1][4],Mx[2][4],Mx[3][4],sn-N]);r.push(N-sn+smu);solve(Mx,r,5);const dN=r[4];let mx=5*Math.abs(dN);
   for(let j=0;j<NS;j++){let s=dN-mu[j];for(let i=0;i<4;i++)s+=A[i][j]*r[i];dn[j]=s;if((n[j]/N>1e-8||s>0)&&Math.abs(s)>mx)mx=Math.abs(s)}
   const lam=Math.min(1,2/Math.max(mx,1e-30));let cv=0;for(let j=0;j<NS;j++){cv=Math.max(cv,n[j]*Math.abs(dn[j])/N);n[j]=Math.max(n[j]*Math.exp(lam*dn[j]),1e-40)}N*=Math.exp(lam*dN);
   if(lam===1&&cv<1e-11&&Math.abs(dN)<1e-11){ok=true;break}}
  return{n,N,it,ok,b}}
 /* 組成 n（mol/kg）が決まったときの既燃ガスの物性．未反応の燃料 (1 − ηc) ζ を含む */
 const bE=(n,T,z,ec)=>{let e=0;for(let j=0;j<NS;j++)e+=n[j]*u(SP[j],T);return e+(1-ec)*z*ef(T)},bR=(n,z,ec)=>{let N=0;for(let j=0;j<NS;j++)N+=n[j];return RU*N+(1-ec)*z*Rf},
  bCv=(n,T,z,ec)=>{let c=0;for(let j=0;j<NS;j++)c+=n[j]*(cp(SP[j],T)-RU);return c+(1-ec)*z*cvf(T)};
 const z2phi=z=>AF*z/(1-z),phi2z=ph=>ph/(AF+ph);
 /* 表：反応に加わる燃料の当量比 φ_r = ηc φ_b 0.50〜1.50（0.0125 刻み．量論の折れ目 φ_r = 1 を節点に置く），T 250〜3500 K（50 K 刻み），p 20 kPa〜20 MPa（公比 10^(1/12)，37 点）．φ の節点ごとに初めて使うときに作る */
 const G={f0:.5,df:.0125,nf:81,T0:250,dT:50,nT:66,lp0:Math.log(2e4),dlp:Math.LN10/12,np:37},tab=new Array(G.nf).fill(null),iF=Math.round((Tfr-G.T0)/G.dT);
 /* 解離の無い既燃ガス（SPEC-33 A の段 F）：組成を T_nd = 1000 K の平衡（完全燃焼の生成物）に固定し，比熱だけ温度で変える．ND が真の間，burned はこの表を使う */
 const tabN=[],TND=1000;let ND=0;
 function nodeN(i){if(tabN[i])return tabN[i];const ec=K.etac,z=phi2z((G.f0+G.df*i)/ec),e=new Float64Array(G.np*G.nT),c=new Float64Array(G.np*G.nT),R=new Float64Array(G.np*G.nT),Q=new Float64Array(G.np*G.nT);
  for(let ip=0;ip<G.np;ip++){const n0=eq(TND,Math.exp(G.lp0+G.dlp*ip),z,ec).n,r0=bR(n0,z,ec);for(let it=0;it<G.nT;it++){const T=G.T0+G.dT*it,k=ip*G.nT+it;e[k]=bE(n0,T,z,ec);R[k]=r0;c[k]=bCv(n0,T,z,ec)}}
  return tabN[i]={e,c,R,Q}}
 /* 節点の表を p の行ごとに作る（NodeB）．node(i) は全行を一度に，warm(ms) は持ち時間の中で行ごとに作る（計測の前に表を作っておく．SPEC-29 A の 6，SPEC-26 B の 1）．どちらも同じ計算 */
 const df=(a,k,it,L,h)=>it-2>=iF&&it+2<=L?(-a[k+2]+8*a[k+1]-8*a[k-1]+a[k-2])/(12*h):it===iF?(-3*a[k]+4*a[k+1]-a[k+2])/(2*h):it===L?(3*a[k]-4*a[k-1]+a[k-2])/(2*h):(a[k+1]-a[k-1])/(2*h);
 class NodeB{constructor(i){const n=G.np*G.nT;this.i=i;this.ec=K.etac;this.z=phi2z((G.f0+G.df*i)/this.ec);this.ip=0;this.t={e:new Float64Array(n),c:new Float64Array(n),R:new Float64Array(n),Q:new Float64Array(n)}}
  row(){const ip=this.ip,{e,c,R,Q}=this.t,ec=this.ec,z=this.z,p=Math.exp(G.lp0+G.dlp*ip);let w=null,nf=null;
   for(let it=iF;it<G.nT;it++){const T=G.T0+G.dT*it,q=eq(T,p,z,ec,w),k=ip*G.nT+it;w=q.n;if(it===iF)nf=q.n.slice();e[k]=bE(q.n,T,z,ec);R[k]=bR(q.n,z,ec)}
   /* 平衡の側の傾き c_v = ∂e/∂T と ∂R/∂T は，節点の値の差分で求める（内側は 4 次の中心差分，端は 2 次の片側差分）．凍結の側は c_v が凍結組成の値，∂R/∂T = 0 */
   for(let it=iF;it<G.nT;it++){const k=ip*G.nT+it,h=G.dT,L=G.nT-1;c[k]=df(e,k,it,L,h);Q[k]=df(R,k,it,L,h)}
   for(let it=0;it<iF;it++){const T=G.T0+G.dT*it,k=ip*G.nT+it;e[k]=bE(nf,T,z,ec);R[k]=bR(nf,z,ec);c[k]=bCv(nf,T,z,ec)}this.ip++}
  /* 持ち時間 ms の中で行を作る（ms = Infinity で全行）．できたら表を返す */
  run(ms){const t0=performance.now();while(this.ip<G.np){this.row();if(performance.now()-t0>ms)break}return this.ip>=G.np?this.t:null}}
 let WB=null;const WO=Array.from({length:G.nf},(_,i)=>i).sort((a,b)=>Math.abs(G.f0+G.df*a-1)-Math.abs(G.f0+G.df*b-1)||a-b);
 function node(i){if(tab[i])return tab[i];if(WB&&WB.i===i){const t=WB.run(Infinity);WB=null;return tab[i]=t}return tab[i]=new NodeB(i).run(Infinity)}
 /* 表のまだ無い節点を，φ_r = 1 に近い順に，持ち時間 ms の中で作る．全節点がそろっていれば true */
 function warm(ms){const t0=performance.now();for(;;){if(!WB){const i=WO.find(j=>!tab[j]);if(i==null)return true;WB=new NodeB(i)}const left=ms-(performance.now()-t0);if(left<=0)return false;const t=WB.run(left);if(!t)return false;tab[WB.i]=t;WB=null}}
 /* 補間：T は 3 次 Hermite（e と傾き c_v，R と傾き ∂R/∂T．T について C¹ で，右辺が節点で跳ばない）．ln p と φ は線形．偏微分は補間した関数の微分 */
 const cl=(x,a,b)=>x<a?a:x>b?b:x,FMX=G.f0+G.df*(G.nf-1),TMX=G.T0+G.dT*(G.nT-1);
 /* ホットパス：オブジェクトと配列を作らない．o に e, R と偏微分 eT, ep, ez, RT, Rp, Rz を書く */
 function burned(T,p,z,o){const ph=cl(K.etac*AF*z/(1-z),G.f0,FMX),xf=(ph-G.f0)/G.df,jf=Math.min(G.nf-2,Math.floor(xf)),wf=xf-jf,Tc=cl(T,G.T0,TMX),xT=(Tc-G.T0)/G.dT,jt=Math.min(G.nT-2,Math.floor(xT)),s=xT-jt,
   xp=cl((Math.log(p)-G.lp0)/G.dlp,0,G.np-1),jp=Math.min(G.np-2,Math.floor(xp)),wp=xp-jp,t0=ND?tabN[jf]||nodeN(jf):tab[jf]||node(jf),t1=ND?tabN[jf+1]||nodeN(jf+1):tab[jf+1]||node(jf+1),k=jp*G.nT+jt,k2=k+G.nT,h=G.dT,s2=s*s,s3=s2*s,
   a0=2*s3-3*s2+1,a1=(s3-2*s2+s)*h,a2=-2*s3+3*s2,a3=(s3-s2)*h,b0=(6*s2-6*s)/h,b1=3*s2-4*s+1,b3=3*s2-2*s,
   E0=t0.e,C0=t0.c,R0=t0.R,Q0=t0.Q,E1=t1.e,C1=t1.c,R1=t1.R,Q1=t1.Q,
   e00=a0*E0[k]+a1*C0[k]+a2*E0[k+1]+a3*C0[k+1],e01=a0*E0[k2]+a1*C0[k2]+a2*E0[k2+1]+a3*C0[k2+1],e10=a0*E1[k]+a1*C1[k]+a2*E1[k+1]+a3*C1[k+1],e11=a0*E1[k2]+a1*C1[k2]+a2*E1[k2+1]+a3*C1[k2+1],
   d00=b0*(E0[k]-E0[k+1])+b1*C0[k]+b3*C0[k+1],d01=b0*(E0[k2]-E0[k2+1])+b1*C0[k2]+b3*C0[k2+1],d10=b0*(E1[k]-E1[k+1])+b1*C1[k]+b3*C1[k+1],d11=b0*(E1[k2]-E1[k2+1])+b1*C1[k2]+b3*C1[k2+1],
   r00=a0*R0[k]+a1*Q0[k]+a2*R0[k+1]+a3*Q0[k+1],r01=a0*R0[k2]+a1*Q0[k2]+a2*R0[k2+1]+a3*Q0[k2+1],r10=a0*R1[k]+a1*Q1[k]+a2*R1[k+1]+a3*Q1[k+1],r11=a0*R1[k2]+a1*Q1[k2]+a2*R1[k2+1]+a3*Q1[k2+1],
   q00=b0*(R0[k]-R0[k+1])+b1*Q0[k]+b3*Q0[k+1],q01=b0*(R0[k2]-R0[k2+1])+b1*Q0[k2]+b3*Q0[k2+1],q10=b0*(R1[k]-R1[k+1])+b1*Q1[k]+b3*Q1[k+1],q11=b0*(R1[k2]-R1[k2+1])+b1*Q1[k2]+b3*Q1[k2+1],
   eA=e00+(e01-e00)*wp,eB=e10+(e11-e10)*wp,rA=r00+(r01-r00)*wp,rB=r10+(r11-r10)*wp,inT=T===Tc,inP=xp>0&&xp<G.np-1,inF=ph>G.f0&&ph<FMX,dzf=K.etac*AF/((1-z)*(1-z))/G.df,ip=1/(G.dlp*p);
  o.eT=(d00+(d01-d00)*wp)*(1-wf)+(d10+(d11-d10)*wp)*wf;o.e=eA+(eB-eA)*wf+(inT?0:o.eT*(T-Tc));o.R=rA+(rB-rA)*wf; /* 表の温度の範囲の外は，端の c_v で e を直線に延ばす（R は端の値．SPEC-29 A） */
  o.RT=inT?(q00+(q01-q00)*wp)*(1-wf)+(q10+(q11-q10)*wp)*wf:0;
  o.ep=inP?((e01-e00)*(1-wf)+(e11-e10)*wf)*ip:0;o.Rp=inP?((r01-r00)*(1-wf)+(r11-r10)*wf)*ip:0;o.ez=inF?(eB-eA)*dzf:0;o.Rz=inF?(rB-rA)*dzf:0;return o}
 /* 平衡を直接解いた既燃ガスの物性（表を使わない．検証用） */
 function direct(T,p,z,ec=K.etac,frz=true){if(frz&&T<Tfr){const q=eq(Tfr,p,z,ec);return{e:bE(q.n,T,z,ec),R:bR(q.n,z,ec),n:q.n,N:q.N}}const q=eq(T,p,z,ec);return{e:bE(q.n,T,z,ec),R:bR(q.n,z,ec),n:q.n,N:q.N,q}}
 return{S,SP,F,cp,h,s0,u,T0,y,Mf,nC,hfg,Tl,Tfr,Ma,Ra,Rf,AF,ea,cva,ha,ef,cvf,hf,eq,elem,A,bE,bR,bCv,z2phi,phi2z,G,node,NodeB,warm,burned,direct,tab,TND,nd:v=>{ND=v?1:0}}})();
/* SPEC-29：温度が固定の場所（吸気 TI，外気 TA，液体の燃料）の物性の定数と，気体定数を引数に取るオリフィスの式 */
const GC={cvaI:GAS.cva(TI),cpaI:GAS.cva(TI)+GAS.Ra,haI:GAS.ha(TI),cvfI:GAS.cvf(TI),cpfI:GAS.cvf(TI)+GAS.Rf,hfI:GAS.hf(TI),cvaA:GAS.cva(TA),cvfA:GAS.cvf(TA),gA:1+GAS.Ra/GAS.cva(TA),kA:psiK(1+GAS.Ra/GAS.cva(TA)),hl:GAS.hf(GAS.Tl)-GAS.hfg};
const PRX=.023*.7**.3/.7 /* Dittus–Boelter の係数 0.023 Pr^0.3 と k = c_p μ/Pr の 1/Pr（Pr = 0.7） */;
/* ECU の空気量の見積もり m̂_a（SPEC-30 の 4）．mah，mtI：前の IVC の筒内の未燃の空気と全質量．pS，pS0：噴射の開始の時点の吸気管圧（今回，前回）．最初の IVC の前（mah が NaN）は p V_d/(R_a T_in)，前のサイクルの噴射が無いとき（pS0 = 0）は π_S = 1 */
const ecuAir=(mah,mtI,pS,pS0,Vd)=>mah===mah?Math.max(0,mah+(pS0>0?mtI*(pS/pS0-1):0)):pS*Vd/(GAS.Ra*TI);
/* 比熱比が決まっている場所（外気，排気系，スロットルの順流）は，Ψ の定数を前計算したものを使う（結果は mdR と同じ） */
function mdRC(p1,p2,T0,A,q,Rg){const pu=Math.max(p1,p2),pd=Math.min(p1,p2);if(pu===pd||A<=0)return 0;return Math.sign(p1-p2)*A*pu/Math.sqrt(Rg*T0)*psiC(pd/pu,q)}
function mdR(p1,p2,T0,A,g,Rg){const pu=Math.max(p1,p2),pd=Math.min(p1,p2);if(pu===pd||A<=0)return 0;return Math.sign(p1-p2)*A*pu/Math.sqrt(Rg*T0)*psiF(pd/pu,g)}
/* ===== generic integrators ===== */
const axpy=(a,b,s)=>a.map((v,i)=>v+s*b[i]);
function rk4s(f,y,h){const k1=f(y),k2=f(axpy(y,k1,h/2)),k3=f(axpy(y,k2,h/2)),k4=f(axpy(y,k3,h));return y.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]))}
const DPa=[[1/5],[3/40,9/40],[44/45,-56/15,32/9],[19372/6561,-25360/2187,64448/6561,-212/729],[9017/3168,-355/33,46732/5247,49/176,-5103/18656],[35/384,0,500/1113,125/192,-2187/6784,11/84]],
DPb5=[35/384,0,500/1113,125/192,-2187/6784,11/84,0],DPb4=[5179/57600,0,7571/16695,393/640,-92097/339200,187/2100,1/40];
/* Core 専用の DOPRI5(4)．dp45 と同じ演算順序で，作業配列を使い回す．結果は o.r5（新しい配列）と o.r4（作業配列）に置く． */
/* 段の計算に要るのは右辺に効く成分（添字 0〜17 と 38〜42）だけ．補助積分は最後の 5 次の和だけ求める */
const SIX=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,38,39,40,41,42,49],NSX=SIX.length;
function dp45c(o,y,h,k0){const N=y.length,n=NSX,X=SIX,B=o.kb||(o.kb=[1,2,3,4,5,6].map(()=>new Array(N).fill(0))),yy=o.yy||(o.yy=new Array(N).fill(0)),y4=o.r4||(o.r4=new Array(N).fill(0)),y5=new Array(N),A=DPa;
{const a0=h*A[0][0];for(let q=0;q<n;q++){const i=X[q];yy[i]=y[i]+a0*k0[i]}}const k1=o.f(yy,B[0]);
{const a0=h*A[1][0],a1=h*A[1][1];for(let q=0;q<n;q++){const i=X[q];yy[i]=y[i]+a0*k0[i]+a1*k1[i]}}const k2=o.f(yy,B[1]);
{const a0=h*A[2][0],a1=h*A[2][1],a2=h*A[2][2];for(let q=0;q<n;q++){const i=X[q];yy[i]=y[i]+a0*k0[i]+a1*k1[i]+a2*k2[i]}}const k3=o.f(yy,B[2]);
{const a0=h*A[3][0],a1=h*A[3][1],a2=h*A[3][2],a3=h*A[3][3];for(let q=0;q<n;q++){const i=X[q];yy[i]=y[i]+a0*k0[i]+a1*k1[i]+a2*k2[i]+a3*k3[i]}}const k4=o.f(yy,B[3]);
{const a0=h*A[4][0],a1=h*A[4][1],a2=h*A[4][2],a3=h*A[4][3],a4=h*A[4][4];for(let q=0;q<n;q++){const i=X[q];yy[i]=y[i]+a0*k0[i]+a1*k1[i]+a2*k2[i]+a3*k3[i]+a4*k4[i]}}const k5=o.f(yy,B[4]);
{const a0=h*A[5][0],a1=h*A[5][1],a2=h*A[5][2],a3=h*A[5][3],a4=h*A[5][4],a5=h*A[5][5];for(let q=0;q<n;q++){const i=X[q];yy[i]=y[i]+a0*k0[i]+a2*k2[i]+a3*k3[i]+a4*k4[i]+a5*k5[i]}}const k6=o.f(yy,B[5]);
const b0=h*DPb5[0],c0=h*DPb4[0],b1=h*DPb5[1],c1=h*DPb4[1],b2=h*DPb5[2],c2=h*DPb4[2],b3=h*DPb5[3],c3=h*DPb4[3],b4=h*DPb5[4],c4=h*DPb4[4],b5=h*DPb5[5],c5=h*DPb4[5],b6=h*DPb5[6],c6=h*DPb4[6];for(let i=0;i<N;i++)y5[i]=y[i]+b0*k0[i]+b1*k1[i]+b2*k2[i]+b3*k3[i]+b4*k4[i]+b5*k5[i]+b6*k6[i];for(let q=0;q<n;q++){const i=X[q];y4[i]=y[i]+c0*k0[i]+c1*k1[i]+c2*k2[i]+c3*k3[i]+c4*k4[i]+c5*k5[i]+c6*k6[i]}o.r5=y5}
function dp45(f,y,h,k1){const k=[k1||f(y)];for(let s=0;s<6;s++){const yy=y.slice();for(let j=0;j<=s;j++){const a=DPa[s][j];if(a)for(let i=0;i<y.length;i++)yy[i]+=h*a*k[j][i]}k.push(f(yy))}
const y5=y.slice(),y4=y.slice();for(let j=0;j<7;j++)for(let i=0;i<y.length;i++){y5[i]+=h*DPb5[j]*k[j][i];y4[i]+=h*DPb4[j]*k[j][i]}return{y5,y4}}
const ATOL=[1e-6,1e-3,1,1e-9,1e-9,1e-4,1,1e-9,1e-6,1,1e-9,1,1,1e-6,1,1,1e-6,1e-6];for(let i=18;i<38;i++)ATOL[i]=1;ATOL.push(1e-10,1e-10,1e-10,1e-9,1e-9);for(let i=43;i<49;i++)ATOL[i]=1;ATOL.push(1e-3);const EIX=[0,1,2,3,4,5,6,7,8,9,10,13,14,15,16,17,38,39,40,41,42,49];
/* ===== EngineCore ===== */
const TRK=['p','V','T','mi','me','Li','Le','Ti','Ts','Td','Tf','N','pin','mt','m','mu','dq','vp'];
/* 既燃ガスの物性の書き込み先（GAS.burned と xgas が書く順に，はじめから全部のプロパティを持たせる） */
const mkGB=()=>({eT:0,e:0,R:0,RT:0,ep:0,Rp:0,ez:0,Rz:0});
class Core{
/* 右辺とソルバが使う作業用のプロパティを，はじめに全部宣言しておく（後から足すとオブジェクトの形が変わり，JIT の最適化が繰り返し捨てられる） */
constructor(P){this.P=P;this.bo=null;this.bo2=null;this.bo3=null;this.bx=null;this.kT=null;this.TC=null;this.Zc=null;this.k0b=null;this.kb=null;this.yy=null;this.r4=null;this.r5=null;this.ea=0;this.wx=1;this.atS=0;this.trO=null;this.trA=null;this.fixw=0;this.fixTw=0;this.lastM=null;this.igT=[];this.reset()}
reset(){const P=this.P,G=this.G=geo(P),k=kin(G,PI),SPC=P.gam===2,m=P.pa*k.V/((SPC?GAS.Ra:R)*K.Ti0);
const y0=[PI,0,P.pa,m,m,298.15,P.pa,0,0,P.pa,0,0,0,0,P.pa,P.pa].concat(new Array(NY-16).fill(0));y0[49]=TA;if(SPC)y0[5]=P.Tw??K.Twc; /* 排気ポートのガスの温度（2.2 の 22）．化学平衡のモデルの壁温は設定の一定値（SPEC-08 の B） */
this.s={y:y0,exOn:P.exs,clp:0,nfa:0,eve:0,evn:[0,0,0,0,0,0],ig:0,tc0:0,pq:[0,0,0,0],runOn:P.run,spa:P.spb,ca:NaN,rs:20261114,cz:[0,0],al:P.alc,Ip:0,If:0,fc:0,fe:0,ov:0,up:0,V:{v:0,x:0,t0:-1,t100:NaN,F:0},Nb:0,starter:0,fuel:0,fired:0,Wg:0,C:{on:0,th0:0,db:1,Q:0,mut:0},I0:{p:P.pa,V:k.V,T:K.Ti0},t:0,pmx:P.pa,mode:P.mode,h:1e-4,cyc:0,cf:0,hn:0,li:-1,YuE:NaN,Mx:null,spc:SPC,zs:GAS.phi2z(P.phi),inj:{on:0,th0:0,dth:1,m:0},mah:NaN,mtI:0,mfI:0,mfc:0,phc:NaN,pS:0,pSn:0,TE:NaN};
this.s.a0=this.s.y.slice();this.rc();this.tr={};TRK.forEach(n=>this.tr[n]=new Float32Array(1440).fill(NaN));this.H={t:[],N:[],Nt:[],pin:[],al:[],Tw:[],tb:[],td:[],fc:[],fe:[]};this.last=null;this.X=null;this.sig=NaN;this.vhit=0;this.updV()}
rc(){this.s.cw={ppn:1e12,ppx:-1e12};this.s.cx={pmax:0,pmS:0,Tmax:0,xr:this.s.cx?this.s.cx.xr:0}}
updV(){const P=this.P,sg=P.ivo+P.phin*1.7+P.ivc*2.3+P.evo*3.1+P.evc*4.3+P.phex*5.9+P.Lv*71+P.dv*13+P.dve*17+P.cam+(P.nv===1?.5:0);if(sg!==this.sig){this.sig=sg;this.V=valves(P,this.G);this.vhit=valveHit(P,this.G)}}
/* 右辺 f(y)．ホットパス：オブジェクトと配列の生成を避ける．out の 0〜17 が状態と旧補助積分，18〜37 が補助積分の被積分関数．
   this.wx が 0 のときは，表示・集計用の this.X を作らない（RK の第 2 段以降）． */
f(y,out){if(this.P.gam===2)return this.fS(y,out);const P=this.P,G=this.G,s=this.s,C=s.C,Vv=this.V,th=y[0],om=y[1],p=y[2],m=Math.max(y[3],1e-7),mu=y[4],Tw=y[5],pin=y[6],mbi=Math.max(0,y[7]),mr=y[8],pp=y[9],mbp=Math.max(0,y[10]),Ein=Math.max(0,y[16]),Ep=Math.max(0,y[17]),RO=!!P.run,Ar=PI/4*P.dr*P.dr,Vp=.5*Ar*P.Lr,pv=RO?pp:pin,cst=P.gam,tt=md4(th);
/* クランク運動学（kin と同じ式） */
const sn=Math.sin(th),cs=Math.cos(th),qq=Math.sqrt(1-G.lam*G.lam*sn*sn),xp=G.r*(1-cs+(1-qq)/G.lam),kV=G.Vc+G.Ap*xp,kdV=G.Ap*G.r*sn*(1+G.lam*cs/qq),kA=PI*G.B*G.B/2+PI*G.B*(xp+G.hc);
/* 筒内の物性（REQ-02）：未燃分率 Yu で比熱を補間 */
const T=p*kV/(m*R),Yu=Math.min(1,Math.max(0,mu/m)),cv=Yu*R/(gmU(T,cst)-1)+(1-Yu)*R/(gmB(T,cst)-1),g=1+R/cv,eu=eU(T,cst),eb=eB(T,cst),cT=(cv+R)*T,hc0=Yu*eu+(1-Yu)*eb+R*T;
const EX=!!P.exs,mep=y[13],ppe=y[14],pm=y[15],pex=EX?ppe:P.pa+P.dpx,TCc=this.TC&&this.TC.cst===cst?this.TC:(this.TC=thConst(cst));
/* 吸気側の組成と余剰エンタルピー（REQ-05） */
const min_=pin*P.Vin/(R*TI),mp_=pp*Vp/(R*TI),Ybi=Math.min(1,mbi/min_),Ybp=RO?Math.min(1,mbp/mp_):Ybi,epi=Ein/min_,epp=RO?Ep/mp_:epi,Ys=1-Ybp,cps=Ys*TCc.cpu+(1-Ys)*TCc.cpb,Tup=TI+epp/cps,gup=1+R/(Ys*R/(gmU(Tup,cst)-1)+(1-Ys)*R/(gmB(Tup,cst)-1));
/* 弁・スロットルの流量 */
const mi=mdot(pv,p,pv>p?Tup:T,Aeff(Vv.i,tt,P.cam),pv>p?gup:g),me=p>pex?mdot(p,pex,T,Aeff(Vv.e,tt,P.cam),g):mdotC(p,pex,TX,Aeff(Vv.e,tt,P.cam),TCc.kbx),mui=mi>=0?Ys*mi:Yu*mi,mue=me>=0?Yu*me:0;
let mt;if(P.pa>pin)mt=mdotC(P.pa,pin,TA,Ath(P,s.al),TCc.kua);else{const Tt=TI+epi/((1-Ybi)*TCc.cpu+Ybi*TCc.cpb);mt=mdot(P.pa,pin,Tt,Ath(P,s.al),1+R/((1-Ybi)*R/(gmU(Tt,cst)-1)+Ybi*R/(gmB(Tt,cst)-1)))}
/* 燃焼と壁面熱伝達（woschni と同じ式） */
const dxb=C.on?wiebe((tt-C.th0)/C.db,C.m??K.wm)/C.db:0,Q=C.Q*dxb*om,dmc=C.mut*dxb*om,cm=G.S*om/PI,gx=tt>=Vv.gA&&tt<Vv.gB,I0=s.I0;
const ww=gx?K.C1g*cm+K.C2*G.Vd*I0.T/(I0.p*I0.V)*Math.max(0,p-I0.p*(I0.V/kV)**1.33):K.C1s*cm,hc=P.cw*K.Cw0*G.Bm*(p/1e3)**.8*T**-.55*Math.max(ww,.5)**.8,Qw=hc*kA*(T-Tw);
/* エネルギー（REQ-09）：流入は h_j − Σ Y_j e_k(T) + c_v T，流出は c_p T */
const hji=Ys*TCc.hui+(1-Ys)*TCc.hbi+epp,Hi=mi>=0?mi*(hji-Ys*eu-(1-Ys)*eb+cv*T):mi*cT,He=me>=0?me*cT:me*(TCc.hbx-eb+cv*T);
const dp=-g*p/kV*kdV*om+(g-1)/kV*(Q+dmc*(eu-eb)-Qw+Hi-He);
/* 回転運動 */
const Ts=s.starter&&!s.fired?K.Tst*Math.max(0,1-om/K.wnl):0,Ti=(p-P.pa)*kdV,Td=s.fe,Tf=om>0?fmepCF(G,s.pmx,om)*G.Vd/P4:0,Ta=om>0?P.Ta:0;
let dom=(Ti+Ts-Tf-Ta-Td)/(K.I+P.Id),dth=om;if(this.fixw)dom=0;if(om<=0&&dom<0){dom=0;dth=0}
/* 排気系 */
/* 排気系（SPEC-27）：排気管の出口は大気に開いている（出口の圧力 = 大気圧，損失係数に出口の動圧の 1 を足す．p_te = y[15] は使わない）．P.Vm，P.At は内部の値で，与えると出口に容積と開口を置く（第25版の消音器と出口．比較の検査だけが使う） */
let e0=0,e1=0,e2=0,mtl=me;if(EX){const Ae=PI/4*P.dex*P.dex,Vpe=.5*Ae*P.Lex,re=ppe/(R*TX),zx=K.fr*P.Lex/P.dex+K.ze;e1=K.gp*R*TX/Vpe*(me-mep);if(P.Vm!=null){mtl=pm>P.pa?mdotC(pm,P.pa,TX,K.Cdx*P.At,TCc.kbx):mdotC(pm,P.pa,TA,K.Cdx*P.At,TCc.kua);e0=Ae/P.Lex*(ppe-pm)-zx*mep*Math.abs(mep)/(2*re*Ae*P.Lex);e2=R*TX/P.Vm*(mep-mtl)}else{mtl=mep;e0=Ae/P.Lex*(ppe-P.pa)-(zx+1)*mep*Math.abs(mep)/(2*re*Ae*P.Lex)}}
/* 吸気弁の逆流が運ぶ余剰エンタルピーと，順流で戻る分 */
const xo=mi<0?-mi*(hc0-(Yu*TCc.hui+(1-Yu)*TCc.hbi)):0,xi=mi>0?mi*epp:0,xt=mt<0?-mt*epi:0;
if(this.wx!==0)this.X={T,k:{x:xp,V:kV,dV:kdV,A:kA},mi,me,Ts,Ti,Td,Tf,Ta,tt,Yu,mt,Q,Qw,hc,Ybi,Ybp,mr:RO?mr:mi,pv,mep:EX?mep:me,mtl,pex,pm:EX?pm:pex,g,Tup,hj:hji};
/* 吸気側（ランナ ON／OFF） */
let d6,d7,d8,d9,d10,d16,d17;if(RO){const er=mr>=0?epi:epp;d6=R*TI/P.Vin*(mt-mr);d7=-mr*(mr>=0?Ybi:Ybp)+Math.min(0,mt)*Ybi;d8=Ar/P.Lr*(pin-pp)-(K.fr*P.Lr/P.dr+K.ze)*mr*Math.abs(mr)/(2*pin/(R*TI)*Ar*P.Lr);d9=K.gp*R*TI/Vp*(mr-mi);d10=mr*(mr>=0?Ybi:Ybp)-mi*(mi>=0?Ybp:1-Yu);d16=-mr*er-xt;d17=mr*er-xi+xo}else{d6=R*TI/P.Vin*(mt-mi);d7=-mi*(mi>=0?Ybi:1-Yu)+Math.min(0,mt)*Ybi;d8=0;d9=0;d10=0;d16=-xi+xo-xt;d17=0}
const d5=this.fixTw?0:(Qw-K.Gw*(Tw-K.Twc))/K.Cw,d11=mi<0?-mi*(1-Yu):0,d12=mi>=0?mi*Ybp:0;
/* 補助積分（REQ-14）：仕事，流量，エネルギーの収支 */
const pdv=p*kdV*om,His=(mi>0?mi*hji:0)+(me<0?-me*TCc.hbx:0),Hos=(mi<0?-mi*hc0:0)+(me>0?me*hc0:0);
if(!out)out=new Array(NY);
out[0]=dth;out[1]=dom;out[2]=dp;out[3]=mi-me;out[4]=mui-mue-dmc;out[5]=d5;out[6]=d6;out[7]=d7;out[8]=d8;out[9]=d9;out[10]=d10;out[11]=d11;out[12]=d12;out[13]=e0;out[14]=e1;out[15]=e2;out[16]=d16;out[17]=d17;
out[18]=pdv;out[19]=tt>=PI&&tt<3*PI?pdv:0;out[20]=Tf*dth;out[21]=Ta*dth;out[22]=Td*dth;out[23]=mt;out[24]=RO?mr:mi;out[25]=mi;out[26]=me;out[27]=EX?mep:me;out[28]=mtl;out[29]=EX?ppe:pex;out[30]=Ybi;out[31]=Q;out[32]=Qw;out[33]=His;out[34]=Hos;out[35]=xo;out[36]=xi;out[37]=xt;out[38]=0;out[39]=0;out[40]=0;out[41]=0;out[42]=0;out[43]=0;out[44]=0;out[45]=0;out[46]=0;out[47]=0;out[48]=0;for(let i=49;i<NY;i++)out[i]=0;return out}
/* ===== 化学平衡のモデルの右辺（SPEC-29 B，C，SPEC-30）．成分は空気 a，燃料蒸気 f，既燃ガス b．内部エネルギーは絶対値で，発熱の項は無い ===== */
/* 筒外の既燃ガス（組成 ζ*）の，温度が固定の場所での物性 */
zc(){const s=this.s;let Z=this.Zc;if(!Z||Z.z!==s.zs){const o={};GAS.burned(TI,1e5,s.zs,o);const Z0={RbI:o.R,cvbI:o.eT,cpbI:o.eT+o.R,hbI:o.e+o.R*TI};let xt;{/* 排気ポートのガスの物性の表（SPEC-27 の 9）：組成 ζ*，圧力 p° で，温度だけの関数．右辺で毎回使うので，ζ* が変わったときに 1 次元の表にしておく */const g=GAS.G,n=g.nT,e=new Float64Array(n),c=new Float64Array(n),r=new Float64Array(n),q=new Float64Array(n);for(let i=0;i<n;i++){GAS.burned(g.T0+g.dT*i,1e5,s.zs,o);e[i]=o.e;c[i]=o.eT;r[i]=o.R;q[i]=o.RT}xt={e,c,r,q}}GAS.burned(TX,1e5,s.zs,o);const gbX=1+o.R/o.eT;
 /* 形（プロパティの並び）を 1 つにするため，全部の値を求めてから 1 つのリテラルで作る（後からプロパティを足すと最適化のやり直しが続く） */
 Z={z:s.zs,RbI:Z0.RbI,cvbI:Z0.cvbI,cpbI:Z0.cpbI,hbI:Z0.hbI,xt,RbX:o.R,hbX:o.e+o.R*TX,gbX,kbX:psiK(gbX)};this.Zc=Z}return Z}
/* 筒内の温度：p V = (m_a R_a + m_f R_f + m_b R_b(T, p, ζ)) T を Newton 法で解く（初期値は凍結の R_b．修正が相対 1e-11 未満になったら終える．
   凍結の温度より下では R_b が一定なので 1 回で終わる）．o に既燃ガスの物性（最後の T での値）を書く */
cylT(p,V,ma,mf,mb,z,o){const A=GAS,r0=ma*A.Ra+mf*A.Rf,pV=p*V;if(!(mb>1e-12)){const T=pV/r0;A.burned(T,p,z,o);return T}let T=pV/(r0+mb*A.burned(A.Tfr,p,z,o).R);for(let i=0;i<8;i++){A.burned(T,p,z,o);const Rt=r0+mb*o.R,dT=(T*Rt-pV)/(Rt+T*mb*o.RT);if(Math.abs(dT)<1e-11*T)return T;T-=dT}A.burned(T,p,z,o);return T}
/* 排気ポートのガスの物性（温度の 3 次 Hermite 補間．表の範囲の外は端の値と端の c_v で延ばす）．o に e，eT，R，RT を書く */
xgas(T,o){const g=GAS.G,t=this.zc().xt,Tc=Math.min(g.T0+g.dT*(g.nT-1),Math.max(g.T0,T)),x=(Tc-g.T0)/g.dT,j=Math.min(g.nT-2,Math.floor(x)),u=x-j,h=g.dT,u2=u*u,u3=u2*u,a0=2*u3-3*u2+1,a1=(u3-2*u2+u)*h,a2=-2*u3+3*u2,a3=(u3-u2)*h,b0=(6*u2-6*u)/h,b1=3*u2-4*u+1,b3=3*u2-2*u;
 o.eT=b0*(t.e[j]-t.e[j+1])+b1*t.c[j]+b3*t.c[j+1];o.e=a0*t.e[j]+a1*t.c[j]+a2*t.e[j+1]+a3*t.c[j+1]+(T===Tc?0:o.eT*(T-Tc));o.R=a0*t.r[j]+a1*t.q[j]+a2*t.r[j+1]+a3*t.q[j+1];o.RT=T===Tc?b0*(t.r[j]-t.r[j+1])+b1*t.q[j]+b3*t.q[j+1]:0;return o}
/* 状態 y から筒内の成分と温度を求める（イベントの処理と検査用） */
cyl(y){const G=this.G,m=Math.max(y[3],1e-7),mu=Math.min(m,Math.max(0,y[4])),mf=Math.min(mu,Math.max(0,y[38])),mb=m-mu,ma=mu-mf,z=mb>1e-12?Math.min(.3,Math.max(0,y[39])/mb):this.s.zs,o={},V=kinV(G,y[0]),T=this.cylT(y[2],V,ma,mf,mb,z,o);return{T,V,m,mu,ma,mf,mb,z,B:o,U:ma*GAS.ea(T)+mf*GAS.ef(T)+mb*o.e}}
fS(y,out){const P=this.P,G=this.G,s=this.s,C=s.C,Vv=this.V,A=GAS,Z=this.zc(),th=y[0],om=y[1],p=y[2],m=Math.max(y[3],1e-7),mu=Math.min(m,Math.max(0,y[4])),Tw=y[5],pin=y[6],mbi=Math.max(0,y[7]),mr=y[8],pp=y[9],mbp=Math.max(0,y[10]),Ein=y[16],Ep=y[17],
 mf=Math.min(mu,Math.max(0,y[38])),mb=m-mu,ma=mu-mf,mbf=Math.max(0,y[39]),ml=Math.max(0,y[40]),mfi=Math.max(0,y[41]),mfp=Math.max(0,y[42]),RO=!!P.run,Ar=PI/4*P.dr*P.dr,Vp=.5*Ar*P.Lr,pv=RO?pp:pin,tt=md4(th),DI=P.inj===1,hasB=mb>1e-12,zt=hasB?Math.min(.3,mbf/mb):Z.z,B=this.bo||(this.bo=mkGB());
const sn=Math.sin(th),cs=Math.cos(th),qq=Math.sqrt(1-G.lam*G.lam*sn*sn),xp=G.r*(1-cs+(1-qq)/G.lam),kV=G.Vc+G.Ap*xp,kdV=G.Ap*G.r*sn*(1+G.lam*cs/qq),kA=PI*G.B*G.B/2+PI*G.B*(xp+G.hc);
/* 筒内の物性 */
const T=this.cylT(p,kV,ma,mf,mb,zt,B),ea=A.ea(T),ef=A.ef(T),Rt=ma*A.Ra+mf*A.Rf+mb*B.R,Cc=ma*A.cva(T)+mf*A.cvf(T)+mb*B.eT,g=1+Rt/Cc,Rm=Rt/m,Ya=ma/m,Yf=mf/m,Yb=mb/m,Yu=mu/m,hc0=(ma*(ea+A.Ra*T)+mf*(ef+A.Rf*T)+mb*(B.e+B.R*T))/m;
const EX=!!P.exs,mep=y[13],ppe=y[14],pm=y[15],pex=EX?ppe:P.pa+P.dpx;
/* 排気ポートのガス（SPEC-27 の 9）：温度 T_X（状態），組成 ζ* の既燃ガス．排気系 OFF では T_X = 800 K の一定値 */
const TXs=EX?y[49]:TX,XB=this.bx||(this.bx=mkGB());if(EX)this.xgas(TXs,XB);const RX=EX?XB.R:Z.RbX,gX=EX?1+XB.R/XB.eT:Z.gbX;
/* 吸気側の組成（成分ごとの気体定数．SPEC-29 C）と余剰エンタルピー */
const mai=Math.max(0,(pin*P.Vin/TI-mbi*Z.RbI-mfi*A.Rf)/A.Ra),min_=mai+mbi+mfi,Ybi=mbi/min_,Yfi=mfi/min_;let mp_=min_,Ybp=Ybi,Yfp=Yfi;if(RO){const map=Math.max(0,(pp*Vp/TI-mbp*Z.RbI-mfp*A.Rf)/A.Ra);mp_=map+mbp+mfp;Ybp=mbp/mp_;Yfp=mfp/mp_}
const epi=Ein/min_,epp=RO?Ep/mp_:epi,Yap=1-Ybp-Yfp,Yai=1-Ybi-Yfi,Tup=TI+epp/(Yap*GC.cpaI+Yfp*GC.cpfI+Ybp*Z.cpbI),Rup=Yap*A.Ra+Yfp*A.Rf+Ybp*Z.RbI;
/* 弁・スロットルの流量 */
const Ai=Aeff(Vv.i,tt,P.cam),Ae=Aeff(Vv.e,tt,P.cam),mi=!(Ai>0)?0:pv>p?mdR(pv,p,Tup,Ai,1+Rup/(Yap*A.cva(Tup)+Yfp*A.cvf(Tup)+Ybp*Z.cvbI),Rup):mdR(pv,p,T,Ai,g,Rm),me=p>pex?mdR(p,pex,T,Ae,g,Rm):EX?mdR(p,pex,TXs,Ae,gX,RX):mdRC(p,pex,TX,Ae,Z.kbX,Z.RbX),fph=DI?0:P.phi/(A.AF+P.phi);
let mt;if(P.pa>pin){let kT=this.kT;if(!kT||kT.f!==fph){const Rth=(1-fph)*A.Ra+fph*A.Rf;kT=this.kT={f:fph,R:Rth,q:psiK(1+Rth/((1-fph)*GC.cvaA+fph*GC.cvfA))}}mt=mdRC(P.pa,pin,TA,Ath(P,s.al),kT.q,kT.R)}else{const Tt=TI+epi/(Yai*GC.cpaI+Yfi*GC.cpfI+Ybi*Z.cpbI),Rin=Yai*A.Ra+Yfi*A.Rf+Ybi*Z.RbI;mt=mdR(P.pa,pin,Tt,Ath(P,s.al),1+Rin/(Yai*A.cva(Tt)+Yfi*A.cvf(Tt)+Ybi*Z.cvbI),Rin)}
/* 噴射と気化（SPEC-30） */
/* 噴射中かどうかは開始と終了のイベントで切り替える（ステップの中では一定の率．∫ṁ_inj dt = m_f,cmd が丸めの範囲で成り立つ） */
let minj=0;{const J=s.inj;if(DI&&J.on)minj=J.m/J.dth*om}const mev=P.tev>0?ml/P.tev:minj;
/* 燃焼と壁面熱伝達 */
const dxb=C.on?wiebe((tt-C.th0)/C.db,C.m??K.wm)/C.db:0,r=C.mut*dxb*om,psi=mu>1e-12?mf/mu:0,cm=G.S*om/PI,gx=tt>=Vv.gA&&tt<Vv.gB,I0=s.I0,Q=r*((1-psi)*ea+psi*ef-B.e);
const ww=gx?K.C1g*cm+K.C2*G.Vd*I0.T/(I0.p*I0.V)*Math.max(0,p-I0.p*(I0.V/kV)**1.33):K.C1s*cm,hc=P.cw*K.Cw0*G.Bm*(p/1e3)**.8*T**-.55*Math.max(ww,.5)**.8,Qw=hc*kA*(T-Tw);
/* 成分の質量（SPEC-29 B の 3） */
let ia,if_,ib,ibz;if(mi>=0){ia=mi*Yap;if_=mi*Yfp;ib=mi*Ybp;ibz=ib*Z.z}else{ia=mi*Ya;if_=mi*Yf;ib=mi*Yb;ibz=ib*zt}
let xa,xf,xb,xbz;if(me>=0){xa=me*Ya;xf=me*Yf;xb=me*Yb;xbz=xb*zt}else{xa=0;xf=0;xb=me;xbz=me*Z.z}
const dm=mi-me+mev,dmu=ia+if_-xa-xf-r+mev,dmf=if_-xf-r*psi+mev,dmbf=ibz-xbz+r*psi,dmb=dm-dmu,dma=dmu-dmf,dz=hasB?(dmbf*mb-mbf*dmb)/(mb*mb):0;
/* エネルギーの式と状態方程式を Ṫ，ṗ について解く（SPEC-29 B の 5） */
const hbX=EX?XB.e+XB.R*TXs:Z.hbX,hji=Yap*GC.haI+Yfp*GC.hfI+Ybp*Z.hbI+epp,Hin=(mi>=0?mi*hji:mi*hc0)-(me>=0?me*hc0:me*hbX),pdv=p*kdV*om,
 SE=-pdv-Qw+Hin+mev*GC.hl-dma*ea-dmf*ef-dmb*B.e-mb*B.ez*dz,SR=-pdv+T*(dma*A.Ra+dmf*A.Rf+dmb*B.R+mb*B.Rz*dz),a21=Rt+T*mb*B.RT,dp=(Cc*SR+a21*SE)/(Cc*(kV-T*mb*B.Rp)+mb*B.ep*a21);
/* 回転運動 */
const Ts=s.starter&&!s.fired?K.Tst*Math.max(0,1-om/K.wnl):0,Ti=(p-P.pa)*kdV,Td=s.fe,Tf=om>0?fmepCF(G,s.pmx,om)*G.Vd/P4:0,Ta=om>0?P.Ta:0;
let dom=(Ti+Ts-Tf-Ta-Td)/(K.I+P.Id),dth=om;if(this.fixw)dom=0;if(om<=0&&dom<0){dom=0;dth=0}
/* 排気系（気体定数は既燃ガスの値） */
/* 排気弁を通る顕熱（SPEC-27 の 9）．筒内のガスの顕熱は T_ref = T_in の各成分のエンタルピーとの差 */
let hbRz=Z.hbI;if(me>0&&hasB&&zt!==Z.z){const B3=this.bo3||(this.bo3=Object.assign(mkGB(),{z:NaN,h:0}));if(B3.z!==zt){A.burned(TI,1e5,zt,B3);B3.h=B3.e+B3.R*TI;B3.z=zt}hbRz=B3.h} /* T_ref の既燃ガスのエンタルピーは ζ だけで決まるので，ζ が変わったときだけ求める */
const hXs=hbX-Z.hbI,Hxs=me>=0?me*(hc0-(Ya*GC.haI+Yf*GC.hfI+Yb*hbRz)):me*(EX?hXs:Z.hbX-Z.hbI);
let e0=0,e1=0,e2=0,d49=0,Qpw=0,Hx=Hxs,Thx=me>0?me*T:0,Mxp=me>0?me:0,hp=0,ReX=0,mtl=me;if(EX){const Ax=PI/4*P.dex*P.dex,Vpe=.5*Ax*P.Lex,re=ppe/(RX*TXs),zx=K.fr*P.Lex/P.dex+K.ze;
 /* ポートの壁への熱伝達（SPEC-27 の 10．Dittus–Boelter，Re の下限 2300） */
 const mu=1.458e-6*TXs*Math.sqrt(TXs)/(TXs+110.4),cvX=XB.eT;ReX=Math.max((Math.abs(me)+Math.abs(mep))/2*P.dex/(Ax*mu),2300);hp=PRX*ReX**.8*(cvX+RX)*mu/P.dex;Qpw=hp*PI*P.dex*G.B*(TXs-Tw);
 /* 質量とエネルギーの式を ṗ_pe，Ṫ_X について解く（SPEC-27 の 9） */
 Hx=mep*hXs;Thx=mep>0?mep*TXs:0;Mxp=mep>0?mep:0;const mX=ppe*Vpe/(RX*TXs),dmX=me-mep,b2=Hxs-Hx-Qpw-dmX*(XB.e-Z.hbI);
 d49=b2/(mX*cvX);e1=(dmX*RX*TXs+mX*(RX+TXs*XB.RT)*d49)/Vpe;if(P.Vm!=null){mtl=pm>P.pa?mdRC(pm,P.pa,TX,K.Cdx*P.At,Z.kbX,Z.RbX):mdRC(pm,P.pa,TA,K.Cdx*P.At,GC.kA,A.Ra);e0=Ax/P.Lex*(ppe-pm)-zx*mep*Math.abs(mep)/(2*re*Ax*P.Lex);e2=Z.RbX*TX/P.Vm*(mep-mtl)}else{mtl=mep;e0=Ax/P.Lex*(ppe-P.pa)-(zx+1)*mep*Math.abs(mep)/(2*re*Ax*P.Lex)}}

/* 吸気弁の逆流が運ぶ余剰エンタルピー（筒内の成分で T と T_in の差）と，順流で戻る分 */
let xo=0;if(mi<0){let hbI=0;if(hasB){const B2=this.bo2||(this.bo2=mkGB());A.burned(TI,p,zt,B2);hbI=B2.e+B2.R*TI}xo=-mi*(hc0-(Ya*GC.haI+Yf*GC.hfI+Yb*hbI))}const xi=mi>0?mi*epp:0,xt=mt<0?-mt*epi:0;
if(this.wx!==0)this.X={T,k:{x:xp,V:kV,dV:kdV,A:kA},mi,me,Ts,Ti,Td,Tf,Ta,tt,Yu,mt,Q,Qw,hc,Ybi,Ybp,mr:RO?mr:mi,pv,mep:EX?mep:me,mtl,pex,pm:EX?pm:pex,g,Tup,hj:hji,minj,mev,zt,Yf,TX:TXs,Qpw,hp,ReX,Hxs,Hx};
/* 吸気側：スロットルと弁（ランナ）の流れを成分ごとに数える．スロットルの順流は，ポート噴射では当量比 φ の予混合気 */
const ta=mt>=0?mt*(1-fph):mt*Yai,tf=mt>=0?mt*fph:mt*Yfi,tb=mt>=0?0:mt*Ybi;let d6,d7,d8,d9,d10,d16,d17,d41,d42;
if(RO){const fw=mr>=0,ra=mr*(fw?Yai:Yap),rf=mr*(fw?Yfi:Yfp),rb=mr*(fw?Ybi:Ybp),er=fw?epi:epp;d6=TI/P.Vin*(A.Ra*(ta-ra)+A.Rf*(tf-rf)+Z.RbI*(tb-rb));d7=tb-rb;d41=tf-rf;d8=Ar/P.Lr*(pin-pp)-(K.fr*P.Lr/P.dr+K.ze)*mr*Math.abs(mr)/(2*min_/P.Vin*Ar*P.Lr);d9=K.gp*TI/Vp*(A.Ra*(ra-ia)+A.Rf*(rf-if_)+Z.RbI*(rb-ib));d10=rb-ib;d42=rf-if_;d16=-mr*er-xt;d17=mr*er-xi+xo}
else{d6=TI/P.Vin*(A.Ra*(ta-ia)+A.Rf*(tf-if_)+Z.RbI*(tb-ib));d7=tb-ib;d41=tf-if_;d8=0;d9=0;d10=0;d42=0;d16=-xi+xo-xt;d17=0}
/* 壁温は設定の一定値（SPEC-08 の B） */
const d5=0,His=(mi>0?mi*hji:0)+(me<0?-me*hbX:0),Hos=(mi<0?-mi*hc0:0)+(me>0?me*hc0:0);
if(!out)out=new Array(NY);
out[0]=dth;out[1]=dom;out[2]=dp;out[3]=dm;out[4]=dmu;out[5]=d5;out[6]=d6;out[7]=d7;out[8]=d8;out[9]=d9;out[10]=d10;out[11]=mi<0?-ib:0;out[12]=mi>=0?ib:0;out[13]=e0;out[14]=e1;out[15]=e2;out[16]=d16;out[17]=d17;
out[18]=pdv;out[19]=tt>=PI&&tt<3*PI?pdv:0;out[20]=Tf*dth;out[21]=Ta*dth;out[22]=Td*dth;out[23]=mt;out[24]=RO?mr:mi;out[25]=mi;out[26]=me;out[27]=EX?mep:me;out[28]=mtl;out[29]=EX?ppe:pex;out[30]=Ybi;out[31]=Q;out[32]=Qw;out[33]=His;out[34]=Hos;out[35]=xo;out[36]=xi;out[37]=xt;
out[38]=dmf;out[39]=dmbf;out[40]=P.tev>0?minj-mev:0;out[41]=d41;out[42]=d42;out[43]=mev*GC.hl;out[44]=minj;out[45]=mev;out[46]=if_;out[47]=xf;out[48]=r*psi;
out[49]=d49;out[50]=0;out[51]=Qpw;out[52]=0;out[53]=0;out[54]=Hxs;out[55]=Hx;out[56]=0;out[57]=Thx;out[58]=Mxp;return out}
/* 排気ポートのガスの質量と顕熱の内部エネルギー（SPEC-27 の 9．検査用） */
xport(y){const P=this.P,Z=this.zc(),o={},T=y[49],p=y[14],Vpe=.5*PI/4*P.dex*P.dex*P.Lex;this.xgas(T,o);const m=p*Vpe/(o.R*T);return{T,p,m,e:o.e,R:o.R,cv:o.eT,U:m*(o.e-Z.hbI)}}

rnd(){const s=this.s;let t=(s.rs=(s.rs+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
uz(){return(2*this.rnd()-1)*Math.sqrt(3)}
ign(T,Yu,p,cy){const s=this.s,P=this.P,C=s.C,om=Math.max(s.y[1],K.wmin),phc=cy?GAS.AF*cy.mf/Math.max(cy.ma,1e-12):P.phi,b=burn(this.G,T,p,1-Yu,cy?Math.min(2,Math.max(.3,phc)):P.phi,om,s.spa,P.cid,P.cbr);if(cy){s.phc=phc;C.mut=cy.mu}C.th0=b.th0;C.db=b.db;C.m=P.wm;if(P.cvar){const z1=this.uz(),z2=this.uz();s.cz=[z1,z2];C.th0+=CCV.s0*D*z1;C.db*=Math.max(.5,1+CCV.sb*z2)}else s.cz=[0,0];C.Q=cy?(s.fuel?cy.mf*K.Hu:0):s.fuel?C.mut/(1+P.phi/K.AFR)*P.phi/K.AFR*K.Hu*K.etac*richEps(P.phi):0;C.on=cy?!!s.fuel&&cy.mf>0:!!s.fuel;s.ig=1;/* 燃焼の時刻（振動．SPEC-36 A の 3）．状態ではない */if(C.on&&C.Q>0){const g=this.igT;g.push(s.t);if(g.length>256)g.shift()}}
/* 次のイベント（REQ-13 4）：サイクルの終端，IVO，IVC，EVO，EVC，点火．th より先で最も近い角度を this.ea に置く */
nextEv(th){const V=this.V,lo=th+1e-7;let a=P4;let x=V.gO;if(x>lo&&x<a)a=x;x=V.gA;if(x>lo&&x<a)a=x;x=V.gB;if(x>lo&&x<a)a=x;x=V.gC;if(x>lo&&x<a)a=x;x=md4(2*PI-this.s.spa*D);if(x>lo&&x<a)a=x;if(this.P.gam===2&&this.P.inj===1){x=md4(this.P.soi);if(x>lo&&x<a)a=x;const J=this.s.inj;if(J.on){x=md4(J.th0+J.dth);if(x>lo&&x<a)a=x}}this.ea=a;return a-th}
/* イベントの処理：ステップの終端（角度 th1，状態 y1）で，その角度にあるイベントをすべて処理する */
doEv(y1,th1){const s=this.s,V=this.V,G=this.G,P=this.P,near=a=>Math.abs(a-th1)<=1e-7,kV=kinV(G,th1),SPC=P.gam===2,cy=SPC?this.cyl(y1):null,T=SPC?cy.T:y1[2]*kV/(Math.max(y1[3],1e-7)*R),Yu=Math.min(1,Math.max(0,y1[4]/y1[3])),n=s.evn;
if(SPC&&P.inj===1){const J=s.inj;if(J.on&&near(md4(J.th0+J.dth)))J.on=0;if(near(md4(P.soi))&&s.fuel&&!J.on){/* ECU の空気量の推定（SPEC-30 の 4）：前の IVC の筒内の全質量が，噴射の開始の時点の吸気管圧（今回／前回）に比例して変わり，残留ガスの量は前のサイクルと同じとする */const pS=y1[6],mah=ecuAir(s.mah,s.mtI,pS,s.pS,G.Vd),mc=P.phi*mah/GAS.AF,om=Math.max(y1[1],K.wmin);J.m=mc;J.th0=md4(P.soi);J.dth=Math.min(300*D,Math.max(D,om*mc/P.qinj));J.on=1;s.mfc=mc;s.pSn=pS}}
if(near(V.gO))n[1]++;if(near(V.gC))n[4]++;
if(near(V.gA)){n[2]++;s.I0={p:y1[2],V:kV,T};s.C.mut=y1[4];s.cx.xr=1-y1[4]/y1[3];if(SPC){s.mah=cy.ma;s.mtI=cy.m;s.mfI=cy.mf;s.pS=s.pSn||0}}
if(near(V.gB)){n[3]++;s.YuE=y1[4]/y1[3];s.TE=T;if(SPC&&cy.mb>1e-9)s.zs=cy.z}
if(near(md4(2*PI-s.spa*D))&&!s.ig){n[5]++;this.ign(T,Yu,y1[2],cy)}
if(near(P4)){n[0]++;this.cycleEnd();y1[0]-=P4}}
/* 運転中にランナ・排気系を ON にしたときの初期化（REQ-25 6，REQ-27 7） */
syncSw(){const s=this.s,P=this.P;if((P.gam===2)!==!!s.spc)this.swThermo();if(P.gam===2&&!this.fixTw&&P.Tw!=null)s.y[5]=P.Tw;if(!!P.exs!==!!s.exOn){s.exOn=P.exs;if(P.exs){const y=s.y;y[13]=0;y[14]=y[15]=P.pa+P.dpx;y[49]=TX}}if(!!P.run!==!!s.runOn){s.runOn=P.run;if(P.run){const y=s.y,pin=y[6],mp=pin*.5*PI/4*P.dr*P.dr*P.Lr/(R*TI),mi=pin*P.Vin/(R*TI);y[8]=0;y[9]=pin;y[10]=Math.min(1,Math.max(0,y[7])/mi)*mp;y[17]=Math.max(0,y[16])/mi*mp}}}
/* 熱物性のモデルを運転中に切り替えたとき：筒内の圧力・温度・未燃分率と，吸気側の圧力・既燃分率を保って質量を取り直す */
swThermo(){const s=this.s,P=this.P,y=s.y,G=this.G,V=kinV(G,y[0]),A=GAS,fph=P.phi/(A.AF+P.phi) /* γ のモデルの未燃ガスは当量比 φ の予混合気 */,Vp=.5*PI/4*P.dr*P.dr*P.Lr;
 if(P.gam===2){const T=y[2]*V/(Math.max(y[3],1e-7)*R),Yu=Math.min(1,Math.max(0,y[4]/y[3])),o={};s.zs=A.phi2z(P.phi);this.Zc=null;const Z=this.zc();A.burned(T,y[2],s.zs,o);const Rm=Yu*((1-fph)*A.Ra+fph*A.Rf)+(1-Yu)*o.R,m=y[2]*V/(Rm*T);y[3]=m;y[4]=Yu*m;y[38]=fph*Yu*m;y[39]=s.zs*(1-Yu)*m;y[40]=0;y[49]=TX;
  const cv=(pk,Vk,mb)=>{const m0=pk*Vk/(R*TI),Yb=Math.min(1,Math.max(0,mb)/m0),Ru=(1-fph)*A.Ra+fph*A.Rf,mn=pk*Vk/(TI*(Yb*Z.RbI+(1-Yb)*Ru));return[Yb*mn,fph*(1-Yb)*mn]};{const q=cv(y[6],P.Vin,y[7]);y[7]=q[0];y[41]=q[1]}{const q=cv(y[9],Vp,y[10]);y[10]=q[0];y[42]=q[1]}s.mah=NaN;s.inj.on=0}
 else{const c=this.cylOld(y,V);y[3]=c.m;y[4]=c.mu;const Z=this.zc(),bk=(pk,Vk,mb,mfk)=>{const ma=Math.max(0,(pk*Vk/TI-mb*Z.RbI-mfk*A.Rf)/A.Ra),tot=ma+mb+mfk;return tot>0?mb/tot*pk*Vk/(R*TI):0};y[7]=bk(y[6],P.Vin,Math.max(0,y[7]),Math.max(0,y[41]));y[10]=bk(y[9],Vp,Math.max(0,y[10]),Math.max(0,y[42]));y[38]=y[39]=y[40]=y[41]=y[42]=0}
 s.spc=P.gam===2;s.a0=y.slice();this.TC=null}
cylOld(y,V){const m0=Math.max(y[3],1e-7),mu=Math.min(m0,Math.max(0,y[4])),mf=Math.min(mu,Math.max(0,y[38])),mb=m0-mu,z=mb>1e-12?Math.min(.3,Math.max(0,y[39])/mb):this.s.zs,o={},T=this.cylT(y[2],V,mu-mf,mf,mb,z,o),m=y[2]*V/(R*T);return{m,mu:mu/m0*m}}
step(){const s=this.s,P=this.P,G=this.G;this.updV();this.syncSw();if(!P.sauto||!s.fired)s.spa=P.spb;
const y0=s.y,w0=y0[1],om=Math.max(w0,K.wmin),p0=y0[2],th0=y0[0],ed=w0>0?this.nextEv(th0):Infinity,ea=this.ea;let dt,X0,y1,hit=0;this.wx=1;
if(P.sol===0){let h=Math.min(P.dth/om,K.dtR4);if(ed<=w0*h*1.02){h=ed/w0;hit=1}const k1=this.f(y0);X0=this.X;this.wx=0;
for(let it=0;;it++){const k2=this.f(axpy(y0,k1,h/2)),k3=this.f(axpy(y0,k2,h/2)),k4=this.f(axpy(y0,k3,h));y1=y0.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));if(!hit)break;const dl=ea-y1[0];if(Math.abs(dl)<=1e-9||it>=4)break;h+=dl/Math.max(y1[1],1e-9)}dt=h}
else{let h=Math.min(s.h,.5*D/om,1e-3);const aS=this.atS||1,k1=this.f(y0,this.k0b||(this.k0b=new Array(NY).fill(0)));X0=this.X;this.wx=0;for(let n=0;;n++){let he=h,isEv=0;if(ed<=w0*h*1.02){he=ed/w0;isEv=1}dp45c(this,y0,he,k1);const r5=this.r5,r4=this.r4;let E=0;for(let q=0;q<EIX.length;q++){const i=EIX[q];E=Math.max(E,Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i]))))}/* 段の状態で右辺が非有限になると E は NaN．そのときは受け入れず，刻みを最小の比で縮める（SPEC-13 の 4） */const fac=E===E?Math.min(2.5,Math.max(.2,.9*Math.pow(Math.max(E,1e-10),-.2))):.2;
if(E<=1||n>12||he<1e-8){if(!(E<=1))s.nfa++;if(isEv){for(let it=0;it<4;it++){const dl=ea-this.r5[0];if(Math.abs(dl)<=1e-9)break;he+=dl/Math.max(this.r5[1],1e-9);dp45c(this,y0,he,k1)}hit=1}y1=this.r5;dt=he;s.h=isEv?Math.max(h,he*fac):he*fac;break}h=he*fac}}
/* 射影（REQ-13 7）．通常の運転では働かない */
/* 成分の質量（m_b,in，m_b,p，m_f，m_bf，m_l，m_f,in，m_f,p）は 0 で切る．−MEPS より下へ出たときだけ回数に数える（流れの向きが変わるステップでは，誤差の許容内で 0 をわずかに下回ることがある） */
for(let q=0;q<7;q++){const i=MIX[q],v=y1[i];if(v<0){if(v<-ATOL[i])s.clp++;y1[i]=0}} /* 数えるのはその成分の絶対許容誤差より下へ出たときだけ（SPEC-13 の 7） */if(y1[38]>y1[4]&&y1[4]>=0){if(y1[38]-y1[4]>MEPS)s.clp++;y1[38]=y1[4]}
/* 余剰エンタルピーの下限 0 は γ のモデルだけ（化学平衡のモデルでは，直噴の気化で T_in より冷えた筒内ガスの逆流が負の余剰を運ぶ） */
const SPC=P.gam===2;if(y1[3]<1e-7||y1[14]<1e3||y1[15]<1e3||y1[9]<1e3||y1[4]<0||y1[4]>y1[3]||y1[1]<0||y1[2]<1e3||(!SPC&&(y1[16]<0||y1[17]<0))){s.clp++;y1[3]=Math.max(y1[3],1e-7);y1[14]=Math.max(y1[14],1e3);y1[15]=Math.max(y1[15],1e3);y1[9]=Math.max(y1[9],1e3);y1[4]=Math.min(y1[3],Math.max(0,y1[4]));y1[1]=Math.max(y1[1],0);y1[2]=Math.max(y1[2],1e3);if(!SPC){y1[16]=Math.max(0,y1[16]);y1[17]=Math.max(0,y1[17])}}
s.y=y1;this.wx=1;const X=this.X=X0,cw=s.cw,cx=s.cx;
/* サイクル内の最大・最小（補助積分にできない量） */
cw.ppn=Math.min(cw.ppn,X.pex);cw.ppx=Math.max(cw.ppx,X.pex);cx.Tmax=Math.max(cx.Tmax,X.T);cx.pmS=Math.max(cx.pmS,p0);
{const q=s.pq;if(q[3]>=q[1]&&q[3]>p0&&q[2]>q[0]&&th0>q[2])cx.pmax=Math.max(cx.pmax,parab(q[0],q[1],q[2],q[3],th0,p0));q[0]=q[2];q[1]=q[3];q[2]=th0;q[3]=p0}
if(this.trO!==this.tr){this.trO=this.tr;this.trA=TRK.map(n=>this.tr[n])}
const i=Math.round(X.tt/D*2)%1440,trA=this.trA,vals=[p0/1e3,X.k.V*1e6,X.T,X.mi*1e3,X.me*1e3,lift(this.V.i,X.tt,P.cam)*1e3,lift(this.V.e,X.tt,P.cam)*1e3,X.Ti,X.Ts,X.Td,X.Tf,y0[1]*30/PI,y0[6]/1e3,X.mt*1e3,y0[3]*1e6,y0[4]*1e6,X.Q/om*D,X.k.dV/G.Ap*y0[1]];
let j=s.li<0||md4((i-s.li)*.5*D)>8*D?i:(s.li+1)%1440;for(let n=0;n<16;n++){for(let q=0;q<18;q++)trA[q][j]=vals[q];if(j===i)break;j=(j+1)%1440}s.li=i;
s.t+=dt;
if(hit||(ed<Infinity&&y1[0]>=ea-1e-9)){s.eve=Math.max(s.eve,Math.abs(ea-y1[0]));this.doEv(y1,ea)}
this.ecu(dt,y1[1]);
if(s.t>=s.hn*.05){s.hn++;const H=this.H,M=s.Mx;H.t.push(s.t);H.N.push(s.Nb);H.Nt.push(P.nt);H.pin.push(y1[6]/1e3);H.al.push(s.al/D);H.Tw.push(y1[5]);H.tb.push(M?M.tb:NaN);H.td.push(M?M.Tdm:NaN);H.fc.push(s.fc);H.fe.push(s.fe);if(H.t.length>620)for(const a in H)H[a].shift()}
return dt}
/* サイクルの終端：補助積分の増分から指標を求める（REQ-14） */
cycleEnd(){const s=this.s,P=this.P,G=this.G,cw=s.cw,cx=s.cx,C=s.C,y=s.y,a=s.a0,d=k=>y[k]-a[k],W=d(18),tc=s.t-s.tc0,Wf=d(20),Wa=d(21),Wd=d(22);s.Wg=d(19);if(cx.pmax>0)s.pmx=cx.pmax;else if(cx.pmS>0)s.pmx=cx.pmS;s.cyc++;s.ca=C.on&&C.Q>0?ca50(C):NaN;if(P.sauto&&s.fired&&s.ca===s.ca)s.spa+=KS*(s.ca-CA50T);
const SPC=P.gam===2,ma=SPC?(s.mah===s.mah?s.mah:0):C.mut/(1+P.phi/K.AFR),mf=SPC?(P.inj===1?s.mfc:s.mfI):P.phi*ma/K.AFR,mfd=mf/tc,imep=W/G.Vd,fmep=Wf/G.Vd,amep=Wa/G.Vd,bmep=imep-fmep-amep,Pb=bmep*G.Vd/tc,wb=P4/tc,pm=cx.pmax>0?cx.pmax:cx.pmS;
const M={imep,pmep:(W-s.Wg)/G.Vd,W,Wg:s.Wg,Wf,Wd,tc,wb,N:wb*30/PI,ei:C.Q>0&&mf>0?W/(mf*K.Hu):NaN,Qin:C.Q,pi:W/tc,ev:ma/(P.pa/((SPC?GAS.Ra:R)*TA)*G.Vd),xr:cx.xr,pinE:y[6],mexv:d(26)/tc,mepp:d(27)/tc,mtl:d(28)/tc,dpex:d(29)/tc-P.pa,ppeR:cw.ppx-cw.ppn,mr:d(24)/tc,ybi:d(30)/tc,bo:d(11),bi:d(12),pm,pmS:cx.pmS,Tm:cx.Tmax,tb:bmep*G.Vd/P4,pb:Pb,bmep,fmep,amep,Wa,em:imep>0?bmep/imep:NaN,bsfc:Pb>0&&mfd>0?mfd/Pb*3.6e9:NaN,eb:Pb>0&&mfd>0?Pb/(mfd*K.Hu):NaN,mfd,Tdm:Wd/P4,ca50:s.ca,spa:s.spa,cz:s.cz.slice(),Pd:Wd/tc,Pf:Wf/tc,mth:d(23)/tc,min:d(25)/tc,YuE:s.YuE,Qc:d(31),Qw:d(32),Hi:d(33),Ho:d(34),Xo:d(35),Xi:d(36),Xt:d(37),He:d(43),minj:d(44),mev:d(45),mfx:d(47),phc:s.phc,ma,mf,Tivc:s.I0.T,TE:s.TE,Tx:SPC?(d(58)>0?d(57)/d(58):NaN):TX,Pwall:(d(32)+d(51))/tc,Qpw:d(51)};
s.a0=y.slice();s.tc0=s.t;s.ig=0;s.Mx=s.cf&&s.fired?M:null;s.Mh=s.Mx?(s.Mh||[]).concat([M]).slice(-10):[];this.lastM=M;this.last={p:Float32Array.from(this.tr.p),V:Float32Array.from(this.tr.V),me:Float32Array.from(this.tr.me),imep,pm,N:M.N,ok:!!s.Mx};s.cf=s.fired;this.rc()}
ecu(dt,om){const s=this.s,P=this.P;{const N=om*30/PI;s.Nb=N+(s.Nb-N)*Math.exp(-dt/P.tN)}
if(!s.fired&&s.fuel&&s.Nb>K.Nfire&&s.Wg>20){s.fired=1;s.starter=0;s.Ip=0;s.If=0}
if(s.fired&&s.Nb<150&&(!dynOn(P)||this.fixw)){s.fired=0;s.fuel=0;s.Mx=null}
const md=dynOn(P)?1:0;if(md!==s.mode){if(s.fired){if(md===1){P.alm=s.al;s.If=s.fc-P.Kpd*(om*30/PI-P.nt)}else{P.Tl=Math.max(0,s.fc);s.Ip=s.al-alff(P)-P.Kp*(P.nt-s.Nb)}}s.mode=md}
const e=P.nt-s.Nb,Tm=dynMax(P,om);
if(!s.fired){s.al=P.alc;s.fc=0}
else if(s.mode===0){const ab=alff(P),am=almin(P),u=ab+P.Kp*e+s.Ip;if(!((u>=P.amax&&e>0)||(u<=am&&e<0)))s.Ip+=P.Ki*e*dt;s.al=Math.min(P.amax,Math.max(am,ab+P.Kp*e+s.Ip));s.fc=Math.min(P.Tl,Tm)}
else{/* 動力計制御の PI（SPEC-11 の 3）：トルクの指令 T_c = K_pd (N − N_target) + I_T を ±T_max で頭打ち（比例は瞬時の回転数 N，積分は平均回転数 N̄ の偏差 e_d）．張り付いて偏差がそれを深める向きなら積分しない */const ed=-e,ei=om*30/PI-P.nt,u=P.Kpd*ei+s.If;if(!((u>=Tm&&ed>0)||(u<=-Tm&&ed<0)))s.If+=P.Kid*ed*dt;s.al=P.alm;s.fc=Math.min(Tm,Math.max(-Tm,P.Kpd*ei+s.If))}
s.fe=s.fc+(s.fe-s.fc)*Math.exp(-dt/P.td);
if(s.fired&&s.mode===1){s.ov=(s.fc>=Tm&&s.Nb>P.nt+100)?s.ov+dt:0;s.up=(s.fc<=-Tm&&s.Nb<P.nt-100)?s.up+dt:0}else{s.ov=0;s.up=0}
this.veh(dt,om)}
/* 車両（SPEC-35 C）：車速を陽的 Euler で進める．機関の計算には影響しない */
veh(dt,om){const s=this.s,P=this.P,V=s.V;if(P.bench!==1){if(V.v!==0||V.t0>=0){V.v=0;V.x=0;V.t0=-1;V.t100=NaN;V.F=0}return}if(!s.fired){V.F=0;return}
 const v0=V.v,Fd=vehDrv(P,v0,s.fe*om),Fb=s.al<VEH.alb?VEH.brk*P.mv*VEH.g:0,Fr=vehRes(P,v0),F=Fd-Fb;V.F=F;let v1=v0+(F-Fr)/P.mv*dt;if(v0<=0&&F<=Fr)v1=0;if(v1<0)v1=0;
 if(v0<=0&&v1>0){V.t0=s.t-dt;V.t100=NaN}if(V.t0>=0&&!(V.t100===V.t100)&&v0<VEH.v100&&v1>=VEH.v100)V.t100=s.t-dt+dt*(VEH.v100-v0)/(v1-v0)-V.t0;if(v1<=0&&v0>0)V.t0=-1;
 V.x+=.5*(v0+v1)*dt;V.v=v1}
/* SPEC-11 の 9：動力計制御（とシャシー）では動力計が回して始動し，FUEL CUT は燃料だけを止める（モータリング）．もう一度で停止 */
start(){const s=this.s;s.fuel=1;if(!s.fired){if(dynOn(this.P)){const P=this.P,Tm=dynMax(P,s.y[1]);s.fired=1;s.starter=0;s.Ip=0;s.If=0;s.mode=1;/* 始動の最初のステップから駆動する（トルクの一次遅れを待つと，止まった機関が逆に回ろうとして ω ≥ 0 の射影が働く） */s.fc=s.fe=Math.min(Tm,Math.max(-Tm,P.Kpd*(s.Nb-P.nt)))}else s.starter=1}}
stop(){const s=this.s;if(dynOn(this.P)&&s.fired&&s.fuel){s.fuel=0;s.C.on=0;s.C.Q=0;return}s.fuel=0;s.starter=0;s.fired=0;s.C.on=0;s.C.Q=0;s.Mx=null;s.Mh=[]}
clone(){const c=new Core({...this.P});c.s=structuredClone(this.s);c.G=geo(c.P);c.sig=NaN;c.updV();if(this.last)c.last={...this.last,p:Float32Array.from(this.last.p),V:Float32Array.from(this.last.V),me:Float32Array.from(this.last.me)};c.lastM=this.lastM;c.fixw=this.fixw;c.fixTw=this.fixTw;return c}
run(T){const t1=this.s.t+T;while(this.s.t<t1)this.step()}
}
/* ===== metrics display (validity rule) ===== */
const fmtv=(x,n,u,lo,hi)=>x==null||!isFinite(x)||(lo!=null&&(x<lo||x>hi))?'–':x.toFixed(n)+u;
/* ===== WOT sweep (REQ-26) ===== */
const SWC={als:[90],alsAll:[10,20,30,40,50,60,70,80,90],al:90,Tw:K.Twc,N1:7000,step:250,steps:[25,100,250,500],last:3,nmax:60,nminR:[3,30],nmaxR:[10,200],nmaxSt:10,
crit:{std:{n:'標準',tolR:.003,tolA:.02,tolS:.3,nmin:4},strict:{n:'厳格',tolR:.001,tolA:.01,tolS:.1,nmin:6}},critD:'strict',flowD:true,procs:{up:'上り',updown:'往復',indep:'独立'},procD:'up'};
/* 回転数の点：刻みの 1 つ目から N1 まで（SPEC-26 の 5．N = 0 はサイクルが進まないので含めない） */const swN=st=>Array.from({length:Math.round(SWC.N1/st)},(_,i)=>st*(i+1)),SWN=swN(SWC.step),SWN7=swN(1000);
const swOpt=o=>({crit:SWC.critD,flow:SWC.flowD,proc:SWC.procD,...(o||{})});
const swR=a=>Math.max(...a)-Math.min(...a),swM=a=>a.reduce((x,v)=>x+v,0)/a.length;
class Sweep{constructor(P0,Ns,al,opt){this.Ns=Ns||SWN;this.al=al??SWC.al;this.o=swOpt(opt);this.C=SWC.crit[this.o.crit];this.nmin=this.o.nmin??this.C.nmin;this.nmax=this.o.nmax??SWC.nmax;const c=this.c=new Core({...P0,cvar:0,sauto:1,mode:1,alm:this.al*D});c.fixw=1;c.fixTw=1;c.s.y[5]=c.P.gam===2&&c.P.Tw!=null?c.P.Tw:SWC.Tw;this.pts=[];this.i=0;this.done=false;this.sig=JSON.stringify(P0);this.begin()}
begin(){const c=this.c,N=this.Ns[this.i];c.s.y[1]=N*PI/30;c.s.Nb=N;c.P.nt=N;if(!c.s.fuel)c.start();/* 計測の機関は初めから完爆済みとして扱う（SPEC-26 の 4） */c.s.fired=1;c.s.starter=0;this.h=[];this.cy=c.s.cyc;this.nc=0}
run(ms){const c=this.c,t0=performance.now();/* 化学平衡のモデルでは，既燃ガスの表の全節点ができるまで積分しない（表を作る遅いステップで 1 回の計算が延びないよう，持ち時間の中で行ごとに作る．SPEC-26 B の 1） */if(c.P.gam===2&&!GAS.warm(ms))return false;while(!this.done){c.step();/* エンスト（燃料 OFF）：点をエンストとして記録し，描かない（SPEC-26 の 4） */if(!c.s.fuel){this.pts.push({N:this.Ns[this.i],st:1,ok:false,cyc:this.h.length});this.i++;if(this.i>=this.Ns.length)this.done=true;else this.begin();continue}if(c.s.cyc!==this.cy){this.cy=c.s.cyc;this.nc++;if(c.s.fired&&c.lastM)this.h.push(c.lastM);this.check()}/* 経過時間は毎ステップ調べる（最初の点で表の節点を作る遅いステップが続くため．SPEC-26 B の 1） */if(performance.now()-t0>ms)break}return this.done}
check(){const h=this.h,C=this.C;let ok=false,r=null;if(h.length>=this.nmin){const a=h.slice(-SWC.last),T=a.map(m=>m.tb),z=a.length-1;r={T:swR(T),S:swR(a.map(m=>m.spa)),ev:swR(a.map(m=>m.ev))/swM(a.map(m=>m.ev)),mth:swR(a.map(m=>m.mth))/swM(a.map(m=>m.mth)),pin:swR(a.map(m=>m.pinE))/swM(a.map(m=>m.pinE))};
ok=r.T<=C.tolR*Math.abs(T[z])+C.tolA&&r.S<=C.tolS&&(!this.o.flow||(r.ev<=C.tolR&&r.mth<=C.tolR&&r.pin<=C.tolR))}
if(ok||h.length>=this.nmax||this.nc>=2*this.nmax){const M=h[h.length-1]||{};this.pts.push({N:this.Ns[this.i],Na:M.N,Nw:this.c.s.y[1]*30/PI,tb:M.tb,pb:M.pb,bmep:M.bmep,ev:M.ev,bsfc:M.bsfc,eb:M.eb,spa:M.spa,xr:M.xr,dpex:M.dpex,ppeR:M.ppeR,mt:M.mtl,ok,cyc:h.length,r});this.i++;if(this.i>=this.Ns.length)this.done=true;else this.begin()}}}
const SWF=['Na','tb','pb','bmep','ev','bsfc','eb','spa','xr'];
class SweepSet{constructor(P0,Ns,als,opt){this.P0=P0;this.Ns=Ns||SWN;this.als=(als||SWC.als).slice().sort((a,b)=>b-a);this.o=swOpt(opt);this.sets=this.als.map(al=>({al,pts:[],dT:0,dV:0}));this.k=0;this.jobs=[];this.done=false;this.next()}
get pts(){return this.sets[0].pts}
next(){const al=this.als[this.k],set=this.sets[this.k],p=this.o.proc;if(p==='up'){this.jobs=[new Sweep(this.P0,this.Ns,al,this.o)];set.pts=this.jobs[0].pts}else if(p==='updown'){this.jobs=[new Sweep(this.P0,this.Ns,al,this.o),new Sweep(this.P0,this.Ns.slice().reverse(),al,this.o)];set.pts=this.jobs[0].pts}else{this.jobs=this.Ns.map(N=>({N,mk:()=>new Sweep(this.P0,[N],al,this.o)}));set.pts=[]}this.j=0;this.S=this.jobs[0].mk?this.jobs[0].mk():this.jobs[0]}
fin(){const set=this.sets[this.k],p=this.o.proc;if(p==='updown'){const u=this.jobs[0].pts,dm={};this.jobs[1].pts.forEach(q=>dm[q.N]=q);let mx=0;set.pts=u.map(q=>{const d=dm[q.N];if(q.st||d.st)return{N:q.N,st:1,ok:false,cyc:q.cyc+d.cyc};const o={N:q.N,Nw:q.Nw,ok:q.ok&&d.ok,cyc:q.cyc+d.cyc,r:q.r,dT:Math.abs(q.tb-d.tb),dV:Math.abs(q.ev-d.ev)};SWF.forEach(k=>o[k]=(q[k]+d[k])/2);return o});const pv=set.pts.filter(o=>!o.st),mT=Math.max(...pv.map(o=>o.tb));set.dT=Math.max(...pv.map(o=>o.dT))/mT;set.dV=Math.max(...pv.map(o=>o.dV))}}
run(ms){const t0=performance.now();while(!this.done){const left=ms-(performance.now()-t0);if(left<=0)break;if(this.S.run(left)){if(this.o.proc==='indep')this.sets[this.k].pts.push(this.S.pts[0]);this.j++;if(this.j<this.jobs.length){this.S=this.jobs[this.j].mk?this.jobs[this.j].mk():this.jobs[this.j]}else{this.fin();this.k++;if(this.k>=this.als.length){this.done=true;break}this.next()}}}return this.done}}
const avgM=s=>{const h=s.Mx&&s.Mh&&s.Mh.length?s.Mh:null;if(!h)return{};const o={};for(const k in h[0]){const v=h[0][k];if(typeof v==='number')o[k]=h.reduce((a,q)=>a+q[k],0)/h.length}return o};
function metricList0(c,pg){const s=c.s,m=avgM(s),P=c.P,y=s.y,e=[0,1.5];
return pg?[['ṁ_f',fmtv(m.mfd*1e3,3,' g/s')],['T_b',fmtv(m.tb,1,' N·m')],['P_b',fmtv(m.pb/1e3,2,' kW')],['BMEP',fmtv(m.bmep/1e3,0,' kPa')],['FMEP',fmtv(m.fmep/1e3,0,' kPa')],['ηm',fmtv(m.em,3,'',...e)],['bsfc',fmtv(m.bsfc,0,' g/kWh',0,1e5)],['ηb',fmtv(m.eb,3,'',...e)],['T_dyno',(s.fe<0?'駆動 ':'吸収 ')+fmtv(Math.abs(s.fe),1,' N·m')],['P_dyno',fmtv(Math.abs(s.fe*y[1])/1e3,2,' kW')],['Yb,in',fmtv(m.ybi,3,'',0,1)],['点火',fmtv(s.spa,1,'°')]]
:[['N̄',fmtv(s.Nb,0,' rpm')],['IMEP',fmtv(m.imep/1e3,0,' kPa')],['PMEP',fmtv(m.pmep/1e3,0,' kPa')],['ηi',fmtv(m.ei,3,'',...e)],['Pi',fmtv(m.pi/1e3,2,' kW')],['ηv',fmtv(m.ev,3,'',...e)],['xr',fmtv(m.xr,3,'',0,1)],['p_max',fmtv(m.pm/1e6,2,' MPa')],['T_max',fmtv(m.Tm,0,' K')],['T_w',fmtv(y[5],0,' K')],['α',fmtv(s.al/D,1,'°')],['p_in',fmtv(y[6]/1e3,1,' kPa')]]}
const MJP={'ṁ_f':'燃料流量','T_b':'軸トルク','P_b':'軸出力','BMEP':'正味平均有効圧','FMEP':'摩擦平均有効圧','ηm':'機械効率','bsfc':'正味燃料消費率','ηb':'正味熱効率','T_dyno':'動力計トルク','P_dyno':'動力計出力','Yb,in':'吸気管既燃率','点火':'点火時期','N̄':'平均回転数','IMEP':'図示平均有効圧','PMEP':'ポンプ損失平均有効圧','ηi':'図示熱効率','Pi':'図示出力','ηv':'体積効率','xr':'残留ガス率','p_max':'最高筒内圧','T_max':'最高ガス温度','T_w':'壁温','α':'スロットル開度','p_in':'吸気管圧'};
function metricList(c,pg){return metricList0(c,pg).map(q=>q[0]==='点火'?[q[0],q[1]==='–'?q[1]:q[1]+' BTDC',MJP[q[0]]]:[q[0],q[1],MJP[q[0]]])}
/* ===== 最適化：バルブタイミングの探索（SPEC-32） ===== */
const OPT={nmc:[24,8],sd:[20,60],ns:2,sep:8,h0:4,hmin:2,t0:8,ts:[16,8,4,2,1],nit:20,nmax:400,seed:20261119,cmin:4,cmax:30,
 tol:{mc:{r:1e-3,a:.01,s:.1},fine:{r:1e-4,a:1e-3,s:.01}}};
const VTK4=['ivo','ivc','evo','evc'];
/* 種を固定した擬似乱数（mulberry32．SPEC-21 と同じ） */
function mb32(seed){let s=seed>>>0;return()=>{let t=(s=(s+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
/* 作用角の制約（1〜719°） */
const vtOk=x=>{const di=x[1]-x[0],de=x[3]-x[2];return di>=1&&di<=719&&de>=1&&de<=719};
/* 探索器（SPEC-32 C．VVT マップの最適点では 2 変数，モンテカルロなし，O.dur = false で作用角の制約なし．SPEC-34 B の 3）．generator：yield {x, cls} で評価を求め，next(J) で値を受け取る．feas(x)：作用角以外の制約（VALVE HIT）．
   cls は評価の許容の種類（'mc'：粗い，'fine'：細かい）．値は種類ごとに覚え，同じ点を 2 度評価しない */
function* vtSearch(x0,feas,O){O=O||OPT;const rnd=mb32(O.seed),gau=()=>{let u=0;while(u===0)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*rnd())},memo=new Map,R={x0:x0.slice(),hist:[],ne:0,stop:false,stage:''};
 const nd=x0.length,ok=x=>(O.dur===false||vtOk(x))&&feas(x),ev=function*(x,cls){const k=cls+':'+x.join(',');if(memo.has(k))return memo.get(k);let J=-Infinity;if(ok(x)){if(R.ne>=O.nmax){R.stop=true;return-Infinity}R.ne++;J=yield{x:x.slice(),cls};R.hist.push({x:x.slice(),J,stage:R.stage})}memo.set(k,J);return J};
 /* 1．始点と 2．モンテカルロ（粗い許容） */
 R.stage='mc';const pts=[{x:x0.slice(),J:yield*ev(x0,'mc')}];
 for(let g=0;g<O.nmc.length&&!R.stop;g++)for(let i=0;i<O.nmc[g]&&!R.stop;i++){let x,n=0;do{x=x0.map(v=>Math.round(v+O.sd[g]*gau()));n++}while((!ok(x)||memo.has('mc:'+x.join(',')))&&n<200);if(n<200)pts.push({x,J:yield*ev(x,'mc')})}
 /* 3．勾配の段の始点：J の大きい順に，互いに sep° 以上離れた ns 点 */
 const st=[];for(const p of pts.filter(p=>p.J>-Infinity).sort((a,b)=>b.J-a.J)){if(st.every(s=>Math.max(...s.x.map((v,i)=>Math.abs(v-p.x[i])))>=O.sep))st.push(p);if(st.length>=O.ns)break}
 /* 4．勾配（中心差分．制約で片側が無ければ片側差分）と直線探索（細かい許容） */
 R.stage='grad';let best=null;
 for(const s0 of st){if(R.stop)break;let x=s0.x.slice(),J=yield*ev(x,'fine'),h=O.h0,tp=O.t0;
  for(let it=0;it<O.nit&&!R.stop;it++){const g=[];for(let i=0;i<nd;i++){const xp=x.slice(),xm=x.slice();xp[i]+=h;xm[i]-=h;const Jp=yield*ev(xp,'fine'),Jm=yield*ev(xm,'fine');g.push(Jp>-Infinity&&Jm>-Infinity?(Jp-Jm)/(2*h):Jp>-Infinity?(Jp-J)/h:Jm>-Infinity?(J-Jm)/h:0)}
   const gm=Math.max(...g.map(Math.abs));let mv=false;
   if(gm>0){const d=g.map(v=>v/gm);for(const t of O.ts.filter(t=>t<=Math.min(16,2*tp))){const xn=x.map((v,i)=>Math.round(v+t*d[i]));if(xn.every((v,i)=>v===x[i]))continue;const Jn=yield*ev(xn,'fine');if(Jn>J){x=xn;J=Jn;tp=t;mv=true;break}}}
   if(!mv){if(h>O.hmin)h/=2;else break}}
  if(!best||J>best.J)best={x,J}}
 if(!best){const p=st[0]||pts[0];best={x:p.x.slice(),J:yield*ev(p.x,'fine')}}
 /* 5．1° の仕上げ：8 近傍で最も増える点へ，増えなくなるまで */
 R.stage='fine';let {x,J}=best;for(let more=true;more&&!R.stop;){more=false;let bx=null,bJ=J;for(let i=0;i<nd;i++)for(const sg of[1,-1]){const xn=x.slice();xn[i]+=sg;const Jn=yield*ev(xn,'fine');if(Jn>bJ){bJ=Jn;bx=xn}}if(bx){x=bx;J=bJ;more=true}}
 /* 探索の前の点も細かい許容で評価して並べる */
 R.stage='x0';const J0=yield*ev(x0,'fine');
 return Object.assign(R,{x,J,J0,local:!R.stop})}
/* 評価器（SPEC-32 B）：運転中の機関を複製し，回転数・開度・壁温を固定して，弁時期 x の周期定常の値を求める．run(ms) は値が出たら true */
class VTEval{constructor(c0,obj,O,ks){O=O||OPT;this.O=O;this.obj=obj|0;this.ks=ks||VTK4;const c=this.base=c0.clone();c.P.cvar=0;c.P.sauto=1;this.N0=c0.s.Nb;this.al0=c0.s.al;c.P.alm=this.al0;c.P.mode=1;c.s.mode=1;c.fixw=1;c.fixTw=1;c.s.y[1]=this.N0*PI/30;c.s.fired=1;c.s.starter=0;this.cur=null;this.c=null;this.n=0;this.nu=0}
 feas(x){const P={...this.base.P};this.ks.forEach((k,i)=>P[k]=x[i]*D);return!valveHit(P,this.base.G)}
 /* warm：直前の評価の終わりの状態から始める（既定は細かい許容のとき） */
 start(x,cls,warm){const c=((warm??cls==='fine')&&this.cur?this.cur:this.base).clone();this.ks.forEach((k,i)=>c.P[k]=x[i]*D);c.P.alm=this.al0;c.s.al=this.al0;this.c=c;this.cls=cls;this.tol=this.O.tol[cls]||this.O.tol.fine;this.h=[];this.cy=c.s.cyc;this.J=null}
 /* 正味熱効率は T_b ≤ 0 で未定義（NaN）なので，探索では最も悪い値とする */
 val(M){return this.obj?(M.eb===M.eb?M.eb:-Infinity):M.tb}
 run(ms){const c=this.c,t0=performance.now();let k=0;for(;;){c.step();if(c.s.cyc!==this.cy){this.cy=c.s.cyc;if(c.lastM)this.h.push(c.lastM);if(this.check())return true}if((++k&3)===0&&performance.now()-t0>ms)return false}}
 /* 周期定常の判定（SPEC-32 B の 3） */
 check(){const h=this.h,T=this.tol,O=this.O;if(h.length<O.cmin)return false;const a=h.slice(-3),tb=a.map(m=>m.tb),z=tb[2],rng=v=>Math.max(...v)-Math.min(...v),rel=v=>rng(v)/Math.max(1e-30,Math.abs(swM(v)));
  const ok=rng(tb)<=T.r*Math.abs(z)+T.a&&rng(a.map(m=>m.spa))<=T.s&&rel(a.map(m=>m.ev))<=T.r&&rel(a.map(m=>m.mth))<=T.r&&rel(a.map(m=>m.pinE))<=T.r;
  if(ok||h.length>=O.cmax){if(!ok)this.nu++;this.n++;this.ok=ok;this.J=this.val(a[2]);this.M=a[2];this.cur=this.c;return true}return false}}
/* 探索の進行（評価器と探索器をつなぐ．時間を区切って進める） */
class VTOpt{constructor(c0,obj,O){this.O=O||OPT;this.h=[];this.E=new VTEval(c0,obj,this.O);this.x0=VTK4.map(k=>Math.round(c0.P[k]/D));this.g=vtSearch(this.x0,x=>this.E.feas(x),this.O);this.req=this.g.next();this.done=false;this.R=null;this.t=0;this.best=null;this.stop=false;if(this.req.done)this.fin(this.req.value);else this.E.start(this.req.value.x,this.req.value.cls)}
 fin(R){this.done=true;this.R=R}
 run(ms){if(this.done)return true;const t0=performance.now();while(!this.done&&performance.now()-t0<ms){if(this.E.run(Math.max(1,ms-(performance.now()-t0)))){const J=this.E.J,q=this.req.value;this.h.push({J,cls:q.cls});if(J>-Infinity&&(!this.best||J>this.best.J))this.best={x:q.x,J};if(this.stop){this.g.return();this.fin(null);break}this.req=this.g.next(J);if(this.req.done){this.fin(this.req.value);break}this.E.start(this.req.value.x,this.req.value.cls)}}this.t+=performance.now()-t0;return this.done}}
/* ===== 熱効率の損失の内訳（SPEC-33） ===== */
const LBK={g:1.4,Ra:287,th0:359,db:2,dg:.1};
/* 段 A：空気標準（γ = 1.4）で IVC の質量 m，温度 T1，容積 V1 から，上死点で Q を等容で加え，V_max まで膨張したときの仕事 */
function airW(m,T1,V1,Vc,Vm,Q){const g=LBK.g,cv=LBK.Ra/(g-1),T2=T1*(V1/Vc)**(g-1),T3=T2+Q/(m*cv),T4=T3*(Vc/Vm)**(g-1);return m*cv*((T3-T4)-(T2-T1))}
/* 等容度：Wiebe の燃焼割合 x_b(θ) で，1 − (V/V_max)^(γ−1) を平均し，η_O で割る（0.1° ごとの台形則．x_b(1) で正規化） */
function glh(G,C){const g=LBK.g,eO=1-Math.pow(G.eps,1-g),m=C.m??K.wm,xb=z=>1-Math.exp(-K.wa*Math.max(0,Math.min(1,z))**(m+1)),n=Math.max(1,Math.ceil(C.db/(LBK.dg*D))),Vm=G.Vc+G.Vd;let s=0;for(let i=0;i<n;i++){const z0=i/n,z1=(i+1)/n,th=C.th0+(i+.5)/n*C.db;s+=(1-Math.pow(kinV(G,th)/Vm,g-1))*(xb(z1)-xb(z0))}return s/xb(1)/eO}
/* 計算の進行：運転中の機関を複製し，回転数・壁温を固定，サイクル変動なしで 1 サイクル余り進め，その次の 1 サイクルを実際のサイクルとする．
   IVC で複製した機関から，弁を閉じた再計算を 3 つ（FA：断熱・瞬時燃焼，t：断熱・実際の燃焼，h：熱伝達・実際の燃焼）を 540° まで行う．run(ms) は終われば true */
class LossBk{constructor(c0){const c=this.c=c0.clone();c.P.cvar=0;c.fixw=1;c.fixTw=1;c.s.y[1]=c0.s.Nb*PI/30;this.N0=c0.s.Nb;this.al0=c0.s.al;this.g=this.gen();this.done=false;this.res=null;this.t=0}
 run(ms){const t0=performance.now();while(!this.done&&performance.now()-t0<ms){const r=this.g.next();if(r.done){this.done=true;this.res=r.value}}this.t+=performance.now()-t0;return this.done}
 *gen(){const c=this.c,s=c.s;let k=0;const st=()=>{c.step();return(++k&3)===0};
  let cy=s.cyc;while(s.cyc===cy){if(st())yield}
  /* 実際のサイクル */
  cy=s.cyc;const z0=s.y[19],SPC=c.P.gam===2,bf=q=>SPC?q.s.y[39]:q.s.y[31];let rep=null,zI=0,pE=NaN,ivc=null,bI=0,bE_=NaN,vE=NaN;
  while(s.cyc===cy){const n2=s.evn[2],n3=s.evn[3];c.step();if(s.cyc!==cy)break;if(s.evn[2]!==n2&&!rep){rep=c.clone();zI=s.y[19];bI=bf(c);ivc={m:s.y[3],T:s.I0.T,V:s.I0.V,th:s.y[0]}}if(s.evn[3]!==n3){pE=s.y[2];bE_=bf(c);vE=kinV(c.G,s.y[0])}if((++k&3)===0)yield}
  const M=c.lastM,C={...s.C},G=c.G;if(!rep||!M||!(M.ei>0)||!C.on)return{ok:false,why:'燃焼したサイクルが得られない'};
  const Qf=M.W/M.ei,W180=zI-z0,xi=d=>SPC?K.etac*d*K.Hu/Qf:d/Qf; /* 燃えた燃料の熱の割合 ξ（SPEC-33 A）：化学平衡では既燃の側へ移った燃料 × η_c，ほかは発熱の積分 */
  /* 再計算（弁を閉じ，点火の処理をしない） */
  const R={};for(const [nm,cw,inst,nd] of[['F',0,1,1],['FA',0,1,0],['t',0,0,0],['h',1,0,0]]){if(nd&&!SPC){R[nm]=null;continue}const q=rep.clone();q.P.Lv=0;if(!cw)q.P.cw=0;q.s.ig=1;q.s.C={...C};if(inst){q.s.C.th0=LBK.th0*D;q.s.C.db=LBK.db*D}const zs=q.s.y[19],b0=bf(q);let pe=NaN;
   /* 段 F の間だけ，既燃ガスの表を解離の無いものに替える（1 ステップごとに戻す．運転中の機関と交互に進むため） */
   while(q.s.y[0]<3*PI&&q.s.cyc===rep.s.cyc){const n3=q.s.evn[3];if(nd)GAS.nd(1);try{q.step()}finally{if(nd)GAS.nd(0)}if(q.s.evn[3]!==n3)pe=q.s.y[2];if((++k&3)===0)yield}R[nm]={W:q.s.y[19]-zs,pe,xi:xi(bf(q)-b0)}}
  if(!R.F)R.F=R.FA;
  const aw=x=>(W180+airW(ivc.m,ivc.T,ivc.V,G.Vc,G.Vc+G.Vd,x*Qf))/Qf,xiT=xi(bE_-bI);if(!(xiT>.05)||!(R.F.xi>.05)||!(R.FA.xi>.05))return{ok:false,why:'燃えた燃料が少なすぎる'};
  /* 瞬時燃焼の段は，燃えた燃料の量が実際と違う（気化の途中で燃やす）ので，同じ熱の空気標準との比で換算する（SPEC-33 A） */
  const eO=1-Math.pow(G.eps,1-LBK.g),eA=aw(1),eU=aw(xiT),eF=eU*((W180+R.F.W)/Qf)/aw(R.F.xi),eFA=eU*((W180+R.FA.W)/Qf)/aw(R.FA.xi),et=(W180+R.t.W)/Qf,eh=(W180+R.h.W)/Qf,eig=M.Wg/Qf,ei=M.W/Qf;
  /* 有効圧縮比 ε_c = V(IVC)/V_c，有効膨張比 ε_e = V(EVO)/V_c（SPEC-33 の A） */
  const epc=ivc.V/G.Vc,epe=vE/G.Vc,L=[[`有効圧縮比 ${epc.toFixed(1)}（吸気弁の閉じる時期）`,eO-eA],['燃え残り（燃焼効率・気化の遅れ）',eA-eU],['比熱比の低下',eU-eF],['熱解離',eF-eFA],['燃焼の遅れ（等容度）',eFA-et],['冷却損失',et-eh],[`有効膨張比 ${epe.toFixed(1)}（排気弁の開く時期）`,eh-eig],['ポンピング',eig-ei]];
  return{ok:true,eO,eA,eU,eF,eFA,et,eh,eig,ei,L,xi:xiT,xiF:R.F.xi,xiFA:R.FA.xi,eFr:(W180+R.F.W)/Qf,eFAr:(W180+R.FA.W)/Qf,glh:glh(G,C),ca50:M.ca50,qw:M.Qw/Qf,N:this.N0,al:this.al0,eps:G.eps,Qf,W180,pE,pEh:R.h.pe,eiM:M.ei,eb:(M.W-M.Wf-M.Wa)/Qf,ebM:M.eb,epc,epe}}}
/* ===== VVT マップ（SPEC-34） ===== */
const VVM={ph:[-40,-30,-20,-10,0,10,20,30,40],lo:-40,hi:40};
/* 格子の順序（SPEC-34 B の 2）：段階 1（添字 0，4，8），段階 2（偶数），段階 3（残り）．各段階の中は行ごとに向きを変える．[i（φin の添字），j（φex の添字），段階] */
function vvOrder(){const n=VVM.ph.length,lv=[[0,4,8],[0,2,4,6,8],[...Array(n).keys()]],seen=new Set,o=[];lv.forEach((L,k)=>{let r=0;for(const j of L){const row=r++%2?[...L].reverse():L;for(const i of row){const q=i+','+j;if(!seen.has(q)){seen.add(q);o.push([i,j,k+1])}}}});return o}
/* マップの計算：運転中の機関を複製した評価器（変える項目は φin，φex）で格子を埋め，T_b 最大と η_b 最大の点を 1° まで詰める．run(ms) は終われば true */
class VVTMap{constructor(c0,O){this.O=O||OPT;const n=VVM.ph.length,E=this.E=new VTEval(c0,0,this.O,['phin','phex']);this.p0=[Math.round(c0.P.phin/D),Math.round(c0.P.phex/D)];this.ord=vvOrder();this.T=[...Array(n)].map(()=>Array(n).fill(NaN));this.B=[...Array(n)].map(()=>Array(n).fill(NaN));this.H=[...Array(n)].map(()=>Array(n).fill(0));this.k=0;this.ne=0;this.ver=0;this.opt={};this.stage='格子 1/3';this.done=false;this.t=0;this.stop=false;this.ms=10;this.g=this.gen()}
 inR(x){return x.every(v=>v>=VVM.lo&&v<=VVM.hi)}
 *ev(x,cls,warm){const E=this.E;E.start(x,cls,warm);while(!E.run(this.ms))yield;this.ne++;return E.M}
 *gen(){const E=this.E,ph=VVM.ph;let first=true;
  for(const [i,j,lv] of this.ord){this.stage=`格子 ${lv}/3`;const x=[ph[i],ph[j]];if(!E.feas(x)){this.H[j][i]=1}else{const M=yield*this.ev(x,'mc',!first);first=false;this.T[j][i]=M.tb;this.B[j][i]=M.eb}this.k++;this.ver++;if(this.stop)return}
  for(const [nm,o,G] of[['T',0,this.T],['B',1,this.B]]){this.stage=nm==='T'?'軸トルク最大を詰める':'燃料消費率最小を詰める';let b=null;G.forEach((r,j)=>r.forEach((v,i)=>{if(v===v&&(!b||v>b[0]))b=[v,[ph[i],ph[j]]]}));if(!b)continue;E.obj=o;
   const g=vtSearch(b[1],x=>this.inR(x)&&E.feas(x),{...this.O,nmc:[],ns:1,dur:false});let r=g.next();while(!r.done){E.start(r.value.x,r.value.cls);while(!E.run(this.ms))yield;this.ne++;if(this.stop)return;r=g.next(E.J)}
   const R=r.value,M=yield*this.ev(R.x,'fine');this.opt[nm]={x:R.x,tb:M.tb,eb:M.eb,local:R.local,gmax:b[0]};this.ver++}
  this.stage='終了'}
 run(ms){if(this.done)return true;const t0=performance.now();this.ms=Math.max(1,ms);while(performance.now()-t0<ms){const r=this.g.next();if(r.done){this.done=true;break}}this.t+=performance.now()-t0;return this.done}
 /* 埋まっている最も細かい段階（0：なし） */
 level(){let L=0;for(const lv of[1,2,3]){if(this.ord.every(([i,j,l])=>l>lv||this.H[j][i]||this.T[j][i]===this.T[j][i]))L=lv;else break}return L}}
