#!/usr/bin/env node
/* 始動の数値実験（単気筒の問題設定．第 2 版）：クランキング → 直噴の開始 → 完爆 → アイドル．
   スロットル制御（モード A）．ベンチの動力計はモータリングしない（一定のトルク T_load の吸収と慣性だけ）．
   src/core.js は変えず，読み込むときに 1 か所を書き換え，ECU（Core.prototype.ecu）を包んで，定数 K を上書きする．
   設定の根拠は README.md の 2 節（plant.js，step.js，design.js の計測）．
   使い方： node experiments/startup/startup.js [T=20] [I_tot の倍率=1] */
'use strict';
const path=require('path');
const {mkP,Core,K}=require(path.resolve(__dirname,'../../tools/dev/node_core.js')).load({sub:[
 /* 負荷はクランキング中から入れる（core.js は完爆前の動力計の指令を 0 にしている） */
 ['if(!s.fired){s.al=P.alc;s.fc=0}','if(!s.fired){s.al=P.alc;s.fc=s.mode===0&&s.starter?Math.min(P.Tl,Tm):0}']]});
const D=Math.PI/180,RPM=30/Math.PI;
const MAIN=require.main===module,TT=MAIN&&+process.argv[2]||20,IX=MAIN&&+process.argv[3]||1; /* 部品として読み込まれたときは引数を読まない */
/* ---- 問題設定 ---- */
const S={
 Vin:3e-4,          /* 吸気マニホールドの容積 0.3 L（スロットルボディをポートの近くに置く単気筒） */
 I:.12*IX,Id:.05*IX,/* I_tot = 0.17 kg·m²：アイドルの回転変動率 C_s ≈ 0.1 から */
 Tst:150,           /* スターターの拘束トルク：燃料 OFF の抵抗トルクの最大（約 110 N·m）+ 負荷の最大 6 N·m に余裕 1.3 倍 */
 NCS:300,           /* 燃料 OFF・負荷の最大でのクランキングの平均回転数（ω_nl をこれで決める） */
 NCR:250,           /* 噴射を始める回転数 N_crank */
 NF:500,            /* 完爆の回転数 N_fire */
 NT:800,            /* 目標のアイドル回転数 */
 TLMAX:6,
 aff:3.94,          /* T̄_b(α, 800 rpm) = 0 の開度（Vin = 0.3 L の計測．補機の負荷 2 N·m を含む）．完爆の時点で PI がここから始める */
 acrank:null,       /* 完爆の前（クランキング中）の開度 [°]．null なら aff */
 alo:2.5,ahi:90,    /* 開度の上下限 [°] */
 Kp:.0045,Ki:.0006, /* サイクルに同期した PI（design.js）：°/rpm，°/(rpm·サイクル) */
 phin:0,phex:0,     /* VVT の位相 [°]（正が遅角）．始動から終わりまで固定 */
 wnl:null           /* スターターの無負荷の角速度 [rad/s]．null なら NCS から決める */
};
Object.assign(S,JSON.parse(process.env.S||'{}')); /* 感度を調べるための上書き（例：S='{"Vin":0.0015}'，S='{"oldEcu":1}'） */
K.Nfire=S.NF;K.Tst=S.Tst;
/* ---- ECU：サイクルに同期した回転数の計測と PI（完爆後．スロットル制御のときだけ） ---- */
const ecu0=Core.prototype.ecu;
Core.prototype.ecu=function(dt,om){
 ecu0.call(this,dt,om);
 const s=this.s,E=this.E;
 if(!E||s.mode!==0||S.oldEcu)return;
 if(!s.fired){s.al=(S.acrank??S.aff)*D;E.on=0;E.cy=s.cyc;return}
 if(!E.on){E.on=1;E.z=0;E.al=S.aff;E.cy=s.cyc}
 if(s.cyc!==E.cy){/* サイクルの境目（吸気上死点）：直前のサイクルの平均回転数 N_k で開度を決め，次の境目まで保つ */
  E.cy=s.cyc;const N=this.lastM.N,e=S.NT-N,u=S.aff+S.Kp*e+E.z;
  if(!((u>=S.ahi&&e>0)||(u<=S.alo&&e<0)))E.z+=S.Ki*e;
  E.al=Math.min(S.ahi,Math.max(S.alo,S.aff+S.Kp*e+E.z))}
 s.al=E.al*D};
function run(o){
 const T=o.T||TT;
 K.I=S.I;
 const c=new Core({...mkP(),cvar:0,mode:0,Tl:o.Tl,Id:S.Id,nt:S.NT,Vin:S.Vin,alc:(S.acrank??S.aff)*D,phin:(o.phin??S.phin)*D,phex:(o.phex??S.phex)*D});
 c.E={on:0};
 c.start();c.s.fuel=0;c.kFy=null;
 const R={...o,tInj:NaN,tFire:NaN,cInj:NaN,cFire:NaN,Nmax:0,Nmin:1e9,stall:0,Est:0,vhit:c.vhit,cyc:[],tr:[]};
 let tick=-1,lastOut=0,cyc=c.s.cyc,sumN=0,nN=0;
 while(c.s.t<T&&!c.s.div){
  const t0=c.s.t,w0=c.s.y[1],st0=c.s.starter&&!c.s.fired?1:0;
  c.step();
  const t=c.s.t,N=c.s.y[1]*RPM,Nb=c.s.Nb;
  /* スターターの仕事 E_st = ∫ T_st ω dt（台形） */
  if(st0){const Ts=w=>K.Tst*Math.max(0,1-w/K.wnl)*w;R.Est+=.5*(Ts(w0)+Ts(c.s.y[1]))*(t-t0)}
  if(o.fuel!==0&&!c.s.fuel&&!(R.tInj===R.tInj)&&Nb>=S.NCR){c.s.fuel=1;c.kFy=null;R.tInj=t;R.cInj=c.s.cyc}
  if(c.s.fired&&!(R.tFire===R.tFire)){R.tFire=t;R.cFire=c.s.cyc}
  if(R.tFire===R.tFire&&!c.s.fired)R.stall=1;
  if(t>T-3){sumN+=N;nN++}
  if(c.s.cyc!==cyc){cyc=c.s.cyc;const M=c.lastM;
   R.cyc.push({k:cyc,t:+t.toFixed(4),N:+M.N.toFixed(1),imep:+(M.imep/1e3).toFixed(1),tb:+M.tb.toFixed(2),pin:+(M.pinE/1e3).toFixed(1),al:+(c.s.al/D).toFixed(3),spa:+c.s.spa.toFixed(2),fired:c.s.fired,fuel:c.s.fuel});
   if(R.tFire===R.tFire&&c.s.fired){R.Nmax=Math.max(R.Nmax,M.N);R.Nmin=Math.min(R.Nmin,M.N);if(Math.abs(M.N-S.NT)>25)lastOut=t}}
  const k=Math.floor(t/(o.dtr||.01));if(k!==tick){tick=k;R.tr.push([+t.toFixed(3),+N.toFixed(1),+Nb.toFixed(1),+(c.s.al/D).toFixed(3),+c.s.fe.toFixed(3),c.s.starter,c.s.fuel,c.s.fired,+(c.s.y[6]/1e3).toFixed(2)])}
  if(o.stopSettled&&R.tFire===R.tFire&&t-lastOut>o.stopSettled&&t-R.tFire>o.stopSettled)break;
 }
 const w=R.cyc.filter(r=>r.t>T-3),wt=R.tr.filter(r=>r[0]>T-3);
 R.Nmean=nN?sumN/nN:NaN;
 R.Nkpp=w.length?Math.max(...w.map(r=>r.N))-Math.min(...w.map(r=>r.N)):NaN;   /* サイクル平均の回転数の幅 */
 R.Npp=wt.length?Math.max(...wt.map(r=>r[1]))-Math.min(...wt.map(r=>r[1])):NaN; /* 瞬時の回転数の幅 */
 R.tSettle=R.stall||!(R.tFire===R.tFire)||lastOut>T-3?NaN:lastOut;
 R.div=c.s.div;R.alEnd=c.s.al/D;
 return R}
function tuneWnl(o={}){
 if(S.wnl){K.wnl=S.wnl;return}
 let lo=S.NCR/RPM,hi=209;
 for(let i=0;i<(o.it||30);i++){K.wnl=.5*(lo+hi);const r=run({Tl:S.TLMAX,fuel:0,T:o.T||6,phin:o.phin,phex:o.phex,dtr:.05});if(r.Nmean<S.NCS)lo=K.wnl;else hi=K.wnl}
 K.wnl=.5*(lo+hi)}
module.exports={S,K,run,tuneWnl,mkP,Core,D,RPM};
if(require.main===module){
tuneWnl();
/* ω_nl：燃料 OFF，負荷の最大で，最後の 3 s の時間平均の回転数が NCS */
const crank=run({Tl:S.TLMAX,fuel:0,T:6});
console.log(`I_tot = ${(S.I+S.Id).toFixed(3)} kg·m²，V_in = ${S.Vin*1e3} L，ω_nl = ${K.wnl.toFixed(3)} rad/s（${(K.wnl*RPM).toFixed(1)} rpm），T_stall = ${K.Tst} N·m：燃料 OFF・負荷 ${S.TLMAX} N·m のクランキング 平均 ${crank.Nmean.toFixed(1)} rpm，瞬時の幅 ${crank.Npp.toFixed(0)} rpm`);
const out=[];
for(const Tl of [0,3,6]){const r=run({Tl});out.push(r);
 const f=v=>v===v?v.toFixed(2):'—';
 console.log(`T_load = ${Tl} N·m：噴射開始 ${f(r.tInj)} s，完爆 ${f(r.tFire)} s（噴射開始から ${r.cFire-r.cInj} サイクル），完爆後のサイクル平均 N の最大 ${r.Nmax.toFixed(0)}，最小 ${r.Nmin===1e9?'—':r.Nmin.toFixed(0)} rpm，${r.stall?'エンスト':'±25 rpm に整定 '+f(r.tSettle)+' s'}，最後の 3 s：サイクル平均 N の幅 ${f(r.Nkpp)}，瞬時 N の幅 ${f(r.Npp)} rpm，開度 ${r.alEnd.toFixed(2)}°`)}
require('fs').writeFileSync(path.resolve(__dirname,process.env.OUT||'result.json'),JSON.stringify({S,wnl:K.wnl,T:TT,IX,crank:{Nmean:crank.Nmean,Npp:crank.Npp},runs:out}));
}
