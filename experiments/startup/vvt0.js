#!/usr/bin/env node
/* 始動の VVT の初期位置（位相 φ_in，φ_ex．始動から終わりまで固定）の評価．
   A. 圧縮の反力：燃料 OFF，60 rpm に固定，開度 α_ff で，抵抗トルク R(θ) = −(T_ind − T_f − T_aux) の 1 サイクルの最大 R_max
   B. 始動：startup.js の問題設定で，負荷 0，3，6 N·m．スターターは VVT の位置ごとに決める：
      T_stall = 1.3 (R_max + T_load,max)，ω_nl は燃料 OFF・負荷の最大でクランキングの平均が 300 rpm になる値（二分法）．
   目的：必要なスターターの拘束トルク T_stall（すなわち R_max）を最小にする．
   制約：VALVE HIT にならない．3 つの負荷のどれでも，噴射開始から NC_MAX サイクル以内に完爆し，エンストせず，T_MAX 以内に ±25 rpm に整定する．
   記録：完爆までのスターターの仕事 E_st = ∫ T_st ω dt，完爆と整定の時刻など．
   使い方： node experiments/startup/vvt0.js [格子の幅=10] [細かくする幅=2]   結果は vvt0.json */
'use strict';
const path=require('path'),fs=require('fs');
const X=require('./startup.js'),{S,K,run,mkP,Core,D,RPM}=X;
const STEP=+process.argv[2]||10,FINE=+process.argv[3]||2,LOADS=[0,3,6],T_MAX=12,NC_MAX=3,MARGIN=1.3;
/* A：圧縮の反力 */
function reaction(phin,phex,N=60){
 const c=new Core({...mkP(),cvar:0,mode:1,alm:S.aff*D,Vin:S.Vin,phin:phin*D,phex:phex*D});
 if(c.vhit)return null;
 c.fixw=1;c.s.y[1]=N/RPM;c.s.Nb=N;c.P.nt=N;
 let cy=c.s.cyc,n=0;while(n<4){c.step();if(c.s.cyc!==cy){cy=c.s.cyc;n++}}
 const Ti=Array.from(c.tr.Ti),Tf=Array.from(c.tr.Tf),R=Ti.map((v,i)=>-(v-Tf[i]-c.P.Ta));
 let k=0;for(let i=1;i<R.length;i++)if(R[i]>R[k])k=i;
 return {max:R[k],thmax:k/2,mean:R.reduce((s,v)=>s+v,0)/R.length,R}}
/* B：始動 */
function start(phin,phex){
 const a=reaction(phin,phex);if(!a)return {phin,phex,vhit:1};
 K.Tst=MARGIN*(a.max+S.TLMAX);S.wnl=null;X.tuneWnl({it:14,T:4,phin,phex});
 const rs=LOADS.map(Tl=>run({Tl,phin,phex,T:T_MAX,stopSettled:1.5,dtr:.05}));
 const ok=rs.every(r=>r.tFire===r.tFire&&r.cFire-r.cInj<=NC_MAX&&!r.stall&&r.tSettle===r.tSettle);
 const pick=k=>rs.map(r=>r[k]);
 return {phin,phex,ok,J:K.Tst,Tst:K.Tst,wnl:K.wnl,Rmax:a.max,thmax:a.thmax,Rmean:a.mean,EstMax:Math.max(...pick('Est')),Est:pick('Est'),tFire:pick('tFire'),tInj:pick('tInj'),nc:rs.map(r=>r.cFire-r.cInj),tSettle:pick('tSettle'),Nmax:pick('Nmax'),Nmin:pick('Nmin'),stall:pick('stall')}}
const out={S,LOADS,T_MAX,NC_MAX,MARGIN,grid:[],fine:[],traces:{}};
const desc=r=>`R_max ${r.Rmax.toFixed(1)}，T_stall ${r.Tst.toFixed(1)} N·m，ω_nl ${r.wnl.toFixed(2)}，E_st ${r.Est.map(v=>v.toFixed(0)).join('/')} J，完爆 ${r.tFire.map(v=>v.toFixed(2)).join('/')} s（${r.nc.join('/')} サイクル），整定 ${r.tSettle.map(v=>v===v?v.toFixed(2):'—').join('/')} s${r.ok?'':'  ×'}`;
const t0=Date.now(),log=m=>console.log(((Date.now()-t0)/1e3).toFixed(0).padStart(5)+' s  '+m);
const ph=[];for(let v=-40;v<=40;v+=STEP)ph.push(v);
for(const pi of ph)for(const pe of ph){
 const r=start(pi,pe);out.grid.push(r);
 log(`φin ${pi} φex ${pe}：`+(r.vhit?'VALVE HIT':desc(r)))}
for(const pi of [-40,-20,0,20,40]){const a=reaction(pi,0);if(a)out.traces['in'+pi]=a.R.filter((_,i)=>i%2===0).map(v=>+v.toFixed(2))}
/* 格子の最良の点のまわりを FINE の幅で詰める（座標ごとの探索．範囲 ±40） */
const feas=out.grid.filter(r=>r.ok);
let best=feas.reduce((a,b)=>b.J<a.J?b:a);
log(`格子の最良：φin ${best.phin}，φex ${best.phex}，T_stall ${best.J.toFixed(1)} N·m`);
const seen=new Map(out.grid.map(r=>[r.phin+','+r.phex,r]));
for(let moved=true;moved;){moved=false;
 for(const [di,de] of [[FINE,0],[-FINE,0],[0,FINE],[0,-FINE]]){const pi=best.phin+di,pe=best.phex+de;if(Math.abs(pi)>40||Math.abs(pe)>40)continue;const key=pi+','+pe;
  let r=seen.get(key);if(!r){r=start(pi,pe);seen.set(key,r);out.fine.push(r);log(`  詰め φin ${pi} φex ${pe}：`+(r.vhit?'VALVE HIT':desc(r)))}
  if(r.ok&&r.J<best.J){best=r;moved=true}}}
out.best=best;
log(`最適：φin ${best.phin}，φex ${best.phex}：`+desc(best));
fs.writeFileSync(path.resolve(__dirname,'vvt0.json'),JSON.stringify(out));
