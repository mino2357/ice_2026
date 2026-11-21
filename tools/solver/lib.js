/* 積分の解法の比較（REQ-13 の受入基準 11〜13 のための調査）の共通部分．製品のコード（src/core.js）は書き換えず，読み込むときに差し替える．
   差し替え：刻みの上限（__CAP [°]，__TC [s]），誤差から刻みを決める指数（__EX），1 ステップの計算（__ST：段の計算を別の公式に替える），右辺の評価の回数（__NF）． */
'use strict';
const NC=require('../dev/node_core');
const SUB=[
 ['function dp45c(o,y,h,k0){','function dp45c(o,y,h,k0){if(globalThis.__ST)return globalThis.__ST(o,y,h,k0,SIX,NSX);'],
 ['let h=Math.min(s.h,.5*D/om,1e-3);','let h=Math.min(s.h,(globalThis.__CAP??.5)*D/om,globalThis.__TC??1e-3);'],
 ['.9*Math.pow(Math.max(E,1e-10),-.2)','(globalThis.__SF??.9)*Math.pow(Math.max(E,1e-10),globalThis.__EX??-.2)'],
 [' f(y,out){',' f(y,out){globalThis.__NF++;']];
const load=(extra)=>NC.load({sub:SUB.concat(extra||[]),ret:'DPa,DPb5,DPb4'});
/* 代表の 4 条件（回転数固定，壁温固定，サイクル変動なし，点火時期は固定：自動の最適化が解法ごとに別の値に落ち着くと，解法の誤差と区別できないため） */
const COND=[['低負荷（800 rpm，開度 6°）',800,6],['部分負荷',1500,15],['全開 3000',3000,90],['全開 7000',7000,90]];
const MET=['imep','pm','ev','tb'];
function run(E,cond,o,spa,nc){const {Core,mkP,SWC,D,PI}=E,[,N,al]=cond;
 const P=Object.assign(mkP(),{cvar:0,sauto:spa==null?1:0,mode:1,alm:al*D,nt:N},o||{});if(spa!=null)P.spb=spa;
 const c=new Core(P);c.fixw=1;c.fixTw=1;c.s.y[5]=P.gam===2&&P.Tw!=null?P.Tw:SWC.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();c.s.fired=1;c.s.starter=0;
 nc=nc||60;let st=0,nf0=0,st0=0,prev=null;const H=[];globalThis.__NF=0;
 while(c.s.cyc<nc){const cy=c.s.cyc;c.step();st++;if(c.s.cyc!==cy){if(c.s.cyc===nc-10){nf0=globalThis.__NF;st0=st}if(c.s.cyc>nc-10)H.push(c.lastM);if(c.s.cyc===nc-1)prev=c.lastM}if(st>4e6||!Number.isFinite(c.s.y[2]))break}
 /* 指標は最後の 10 サイクルの平均（低負荷ではサイクルごとの差が 10⁻⁴ ほど残るため） */
 const M={};for(const m of MET)M[m]=H.length?H.reduce((a,q)=>a+q[m],0)/H.length:NaN;
 return{M,last:c.lastM||{},prev,nf:(globalThis.__NF-nf0)/10,st:(st-st0)/10,spa:c.s.spa,fin:c.s.y.every(Number.isFinite)&&H.length===10,nfa:c.s.nfa,clp:c.s.clp}}
const set=o=>{for(const k of['__ST','__CAP','__TC','__EX','__SF'])delete globalThis[k];Object.assign(globalThis,o||{})};
/* 陽的 Runge–Kutta の埋め込み対（一般の係数表）．段 0 は与えられた k0．A[i]：段 i の係数，b：進める解，bh：誤差の見積もり用の解 */
function erk(A,b,bh){const s=b.length;return function(o,y,h,k0,X,n){const N=y.length,K=o.__K&&o.__K.length===s?o.__K:(o.__K=Array.from({length:s},()=>new Array(N).fill(0))),yy=o.__y||(o.__y=new Array(N).fill(0)),ks=[k0];
 for(let i=1;i<s;i++){const a=A[i];for(let q=0;q<n;q++){const j=X[q];let v=y[j];for(let m=0;m<i;m++)if(a[m])v+=h*a[m]*ks[m][j];yy[j]=v}ks.push(o.f(yy,K[i]))}
 const y5=new Array(N),y4=o.r4||(o.r4=new Array(N).fill(0));for(let j=0;j<N;j++){let v=y[j],w=y[j];for(let m=0;m<s;m++){v+=h*b[m]*ks[m][j];w+=h*bh[m]*ks[m][j]}y5[j]=v;y4[j]=w}o.r5=y5}}
/* 安定化した陽的 Runge–Kutta（RKC，2 次，s 段．Sommeijer–Shampine–Verwer 1998）．実軸上の安定の範囲が約 0.65 s² */
function rkc(s){const eps=2/13,w0=1+eps/(s*s),T=[1,w0],dT=[0,1],d2=[0,0];for(let j=2;j<=s;j++){T[j]=2*w0*T[j-1]-T[j-2];dT[j]=2*T[j-1]+2*w0*dT[j-1]-dT[j-2];d2[j]=4*dT[j-1]+2*w0*d2[j-1]-d2[j-2]}
 const w1=dT[s]/d2[s],b=[];for(let j=2;j<=s;j++)b[j]=d2[j]/(dT[j]*dT[j]);b[0]=b[2];b[1]=b[2];const a=b.map((v,j)=>1-v*T[j]);
 return function(o,y,h,k0,X,n){const N=y.length,F=o.__K&&o.__K.length===s+1?o.__K:(o.__K=Array.from({length:s+1},()=>new Array(N).fill(0)));
  let Y2=y,Y1=y.map((v,j)=>v+b[1]*w1*h*k0[j]);
  for(let j=2;j<=s;j++){const Fj=o.f(Y1,F[j-1]),mu=2*b[j]*w0/b[j-1],nu=-b[j]/b[j-2],mt=2*b[j]*w1/b[j-1],gt=-a[j-1]*mt,Yn=new Array(N);
   for(let i=0;i<N;i++)Yn[i]=(1-mu-nu)*y[i]+mu*Y1[i]+nu*Y2[i]+mt*h*Fj[i]+gt*h*k0[i];Y2=Y1;Y1=Yn}
  const Fn=o.f(Y1,F[s]),y4=o.r4||(o.r4=new Array(N).fill(0));for(let i=0;i<N;i++)y4[i]=Y1[i]-(.8*(y[i]-Y1[i])+.4*h*(k0[i]+Fn[i]));o.r5=Y1}}
module.exports={load,COND,MET,run,set,erk,rkc};
