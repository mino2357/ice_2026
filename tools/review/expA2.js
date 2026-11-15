// A の検算：流入エンタルピーを整合させた式（expB.js の pA）で第一法則の残差が消えるか
const load=require('./load.js');
const HSRC=";const HTB=new Float64Array(4002);for(let i=1;i<4002;i++)HTB[i]=HTB[i-1]+.5*(cpT(i-1,0)+cpT(i,0));const hT=(T,cst)=>{if(cst)return cpT(T,1)*T;const i=Math.min(4000,Math.floor(T)),f=T-i;return HTB[i]*(1-f)+HTB[i+1]*f};";
const OLD="const Hi=mi>=0?mi*cpT(TI,cst)*TI:mi*cpT(T,cst)*T,He=me>=0?me*cpT(T,cst)*T:me*cpT(TX,cst)*TX;";
const pA=s=>s.replace(OLD,"const cT=cpT(T,cst)*T,Hi=mi>=0?mi*(hT(TI,cst)-hT(T,cst)+cT):mi*cT,He=me>=0?me*cT:me*(hT(TX,cst)-hT(T,cst)+cT);").replace("/* ===== generic integrators ===== */",HSRC+"/* ===== generic integrators ===== */");
for(const[nm,L]of[['現行',load()],['整合',load(pA)]]){const{Core,mkP,D,PI,R,cpT}=L,TI=L.TI,TX=L.TX;const HT=new Float64Array(4002);for(let i=1;i<4002;i++)HT[i]=HT[i-1]+.5*(cpT(i-1,0)+cpT(i,0));const h=T=>{const i=Math.min(4000,Math.floor(T)),f=T-i;return HT[i]*(1-f)+HT[i+1]*f},u=T=>h(T)-R*T;
 for(const[cn,cfg,fix]of[['アイドル',{},0],['全開3000',{mode:1,alm:90*D,nt:3000},3000]])for(const dth of[.1,.05]){const c=new Core({...mkP(),cvar:0,...cfg});if(fix){c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=fix*PI/30;c.s.Nb=fix}c.start();if(fix){for(let i=0;i<60;){const k=c.s.cyc;c.step();if(c.s.cyc!==k)i++}}else c.run(40);c.P.sol=0;c.P.dth=dth*D;const G=c.G;let k=c.s.cyc;while(c.s.cyc===k)c.step();k=c.s.cyc;const st=()=>{const y=c.s.y,V=L.kin(G,y[0]).V,T=y[2]*V/(y[3]*R);return y[3]*u(T)};const U0=st();let Q=0,Qw=0,W=0,Hin=0,Hout=0,n=0;
  // 流束は台形則（ステップ両端の平均）で積分する
  let Zp=null;const flux=y=>{c.wx=1;c.f(y);const Z=c.X,T=Z.T;return[Z.Q,Z.Qw,Z.mi>=0?Z.mi*h(TI):Z.mi*h(T),Z.me>=0?Z.me*h(T):Z.me*h(TX)]};
  while(n<5){const y0=c.s.y.slice(),V0=L.kin(G,y0[0]).V,F0=flux(y0);const dt=c.step();const y1=c.s.y,V1=L.kin(G,y1[0]).V,F1=flux(y1.slice());W+=(y0[2]+y1[2])/2*(V1-V0);Q+=(F0[0]+F1[0])/2*dt;Qw+=(F0[1]+F1[1])/2*dt;Hin+=(F0[2]+F1[2])/2*dt;Hout+=(F0[3]+F1[3])/2*dt;if(c.s.cyc!==k){k=c.s.cyc;n++}}
  const res=Q-Qw-W+Hin-Hout-(st()-U0);console.log(`${nm} ${cn} Δθ=${dth}°: 第一法則の残差 ${(res/5).toFixed(4)} J/サイクル（発熱の ${(100*res/Q).toFixed(3)}%）`)}}
