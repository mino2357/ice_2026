#!/usr/bin/env node
/* 始動の数値実験：クランキング → 直噴の開始 → 完爆 → アイドル（スロットル制御．ベンチはモータリングしない）．
   src/core.js は変えず，読み込むときに 1 か所だけ書き換え，定数 K を上書きする（実験用ブランチ）．
   - 負荷：動力計が一定のトルク T_load を吸収する．完爆の前（クランキング中）も入れる（core.js は完爆前の指令を 0 にしている所を書き換える）．
   - スターター：直流モータの直線特性（ワンウェイクラッチ）．T_stall = 150 N·m（既定の 60 N·m では，クランキングを 250 rpm 付近にすると最初の圧縮を越えられない）．
   ω_nl は，燃料 OFF・既定の慣性・最大の負荷（6 N·m）でのクランキングの時間平均の回転数が N_cs = 300 rpm になるよう二分法で決める（どの条件でも N_crank を超えるように）．
   - 噴射：START では燃料 OFF．N̄ ≥ N_crank に達したら燃料 ON（直噴，SOI は吸気上死点後 80°）．
   - 完爆：N̄ > N_fire（500 rpm）かつ W_g > 20 J（W_g の条件は既定のまま）．
   使い方： node experiments/startup/startup.js [T=20] */
'use strict';
const path=require('path');
const {mkP,Core,K}=require(path.resolve(__dirname,'../../tools/dev/node_core.js')).load({sub:[
 ['if(!s.fired){s.al=P.alc;s.fc=0}','if(!s.fired){s.al=P.alc;s.fc=s.mode===0&&s.starter?Math.min(P.Tl,Tm):0}']]});
const TT=+process.argv[2]||20,TC=6,NCR=250,NCS=300,NF=500,NT=800,TLMAX=6,RPM=30/Math.PI;
K.Nfire=NF;K.Tst=150;
function run(o){
 const T=o.T||TT;
 K.I=o.I;
 const c=new Core({...mkP(),cvar:0,mode:0,Tl:o.Tl,Id:o.Id,nt:NT});
 c.start();c.s.fuel=0;c.kFy=null;
 const R={...o,tInj:NaN,tFire:NaN,cInj:NaN,cFire:NaN,Nmax:0,Nmin:1e9,stall:0,cyc:[],tr:[]};
 let tick=-1,lastOut=0,cyc=c.s.cyc,sumN=0,nN=0;
 while(c.s.t<T&&!c.s.div){
  c.step();
  const t=c.s.t,N=c.s.y[1]*RPM,Nb=c.s.Nb;
  if(o.fuel!==0&&!c.s.fuel&&!(R.tInj===R.tInj)&&Nb>=NCR){c.s.fuel=1;c.kFy=null;R.tInj=t;R.cInj=c.s.cyc}
  if(c.s.fired&&!(R.tFire===R.tFire)){R.tFire=t;R.cFire=c.s.cyc}
  if(R.tFire===R.tFire){R.Nmax=Math.max(R.Nmax,Nb);R.Nmin=Math.min(R.Nmin,Nb);if(Math.abs(Nb-NT)>25)lastOut=t}
  if(R.tFire===R.tFire&&!c.s.fired)R.stall=1;
  if(t>T-3){sumN+=N;nN++}
  if(c.s.cyc!==cyc){cyc=c.s.cyc;const M=c.lastM;R.cyc.push({k:cyc,t:+t.toFixed(4),N:+M.N.toFixed(1),imep:+(M.imep/1e3).toFixed(1),Wg:+c.s.Wg.toFixed(2),al:+(c.s.al*180/Math.PI).toFixed(2),fired:c.s.fired,fuel:c.s.fuel})}
  const k=Math.floor(t/.01);if(k!==tick){tick=k;R.tr.push([+t.toFixed(3),+N.toFixed(1),+Nb.toFixed(1),+(c.s.al*180/Math.PI).toFixed(3),+c.s.fe.toFixed(3),c.s.starter,c.s.fuel,c.s.fired])}
 }
 const w=R.tr.filter(r=>r[0]>T-3);
 R.Nmean=nN?sumN/nN:NaN;R.Nbpp=w.length?Math.max(...w.map(r=>r[2]))-Math.min(...w.map(r=>r[2])):NaN;R.Npp=w.length?Math.max(...w.map(r=>r[1]))-Math.min(...w.map(r=>r[1])):NaN;
 R.tSettle=R.stall||!(R.tFire===R.tFire)||lastOut>T-3?NaN:lastOut;
 R.div=c.s.div;R.alEnd=c.s.al*180/Math.PI;
 return R}
/* ω_nl を決める：燃料 OFF，既定の慣性，最大の負荷で，最後の 3 s の時間平均の回転数が N_cs */
const base={I:.12,Id:.05,Tl:TLMAX};
let lo=NCR/RPM,hi=209;
for(let i=0;i<30;i++){K.wnl=.5*(lo+hi);const r=run({...base,fuel:0,T:TC});if(r.Nmean<NCS)lo=K.wnl;else hi=K.wnl}
K.wnl=.5*(lo+hi);
const crank=run({...base,fuel:0,T:TC});
console.log(`ω_nl = ${K.wnl.toFixed(3)} rad/s（${(K.wnl*RPM).toFixed(1)} rpm），T_stall = ${K.Tst} N·m，燃料 OFF のクランキング：平均 ${crank.Nmean.toFixed(1)} rpm，瞬時の回転数の最大−最小 ${crank.Npp.toFixed(0)} rpm`);
const cases=[];
for(const [I,Id] of [[.12,.05],[.05,.02],[.03,0]])for(const Tl of [0,3,6])cases.push({I,Id,Tl});
const out=[];
for(const o of cases){const r=run(o);out.push(r);
 const f=v=>v===v?v.toFixed(2):'—';
 console.log(`I=${o.I} Id=${o.Id} Tl=${o.Tl}：噴射開始 ${f(r.tInj)} s，完爆 ${f(r.tFire)} s（噴射開始から ${r.cFire-r.cInj} サイクル），完爆後の N̄ 最大 ${r.Nmax.toFixed(0)} 最小 ${r.Nmin===1e9?'—':r.Nmin.toFixed(0)} rpm，${r.stall?'エンスト':'±25 rpm に整定 '+f(r.tSettle)+' s'}，最後の 3 s：N̄ の幅 ${f(r.Nbpp)}，瞬時 N の幅 ${f(r.Npp)} rpm，開度 ${r.alEnd.toFixed(2)}°`)}
require('fs').writeFileSync(path.resolve(__dirname,'result.json'),JSON.stringify({wnl:K.wnl,Tst:K.Tst,NCR,NCS,NF,NT,T:TT,crank:{Nmean:crank.Nmean,Npp:crank.Npp},runs:out}));
