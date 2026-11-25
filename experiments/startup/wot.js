#!/usr/bin/env node
/* クランキング中のスロットルの開度の比較（初期位相 φin +40°，φex −4°）：
   1. 燃料 OFF の抵抗トルク R(θ; N)：1 サイクルの最大と平均，吸気管圧の平均
   2. 始動：T_stall = 1.3 (R̂ + 6)，ω_nl はその開度のクランキングで決め直す．負荷 0，3，6 N·m
   使い方： node experiments/startup/wot.js   結果は wot.json */
'use strict';
const path=require('path'),fs=require('fs');
const X=require('./startup.js'),{S,K,run,mkP,Core,D,RPM}=X;
const PHIN=40,PHEX=-4,NS=[30,60,120,200,300],AS=[3.94,10,20,90];
function R(a,N){
 const c=new Core({...mkP(),cvar:0,mode:1,alm:a*D,alc:a*D,Vin:S.Vin,phin:PHIN*D,phex:PHEX*D});
 c.fixw=1;c.s.y[1]=N/RPM;c.s.Nb=N;c.P.nt=N;
 let cy=c.s.cyc,n=0;while(n<4){c.step();if(c.s.cyc!==cy){cy=c.s.cyc;n++}}
 const Ti=Array.from(c.tr.Ti),Tf=Array.from(c.tr.Tf),pin=Array.from(c.tr.pin),r=Ti.map((v,i)=>-(v-Tf[i]-c.P.Ta));
 return {max:Math.max(...r),mean:r.reduce((s,v)=>s+v,0)/r.length,pin:pin.reduce((s,v)=>s+v,0)/pin.length,imep:c.lastM.imep/1e3,pmep:c.lastM.pmep/1e3}}
const out={PHIN,PHEX,NS,cases:[]};
for(const a of AS){
 const rs=NS.map(N=>R(a,N)),Rhat=Math.max(...rs.map(r=>r.max));
 S.acrank=a;K.Tst=1.3*(Rhat+S.TLMAX);S.wnl=null;X.tuneWnl({it:30,T:4,phin:PHIN,phex:PHEX});
 const st=[0,3,6].map(Tl=>{const r=run({Tl,phin:PHIN,phex:PHEX,T:12,dtr:.01});
  return {Tl,tInj:r.tInj,tFire:r.tFire,nc:r.cFire-r.cInj,tSettle:r.tSettle,Est:r.Est,Nmax:r.Nmax,Nmin:r.Nmin,stall:r.stall,tr:r.tr.map(q=>[q[0],q[1],q[3],q[8]]),cyc:r.cyc}});
 out.cases.push({a,rs,Rhat,Tst:K.Tst,wnl:K.wnl,st});
 const f=(v,d=2)=>v===v&&v!=null?v.toFixed(d):'—';
 console.log(`α_crank = ${a}°：R̂ ${Rhat.toFixed(1)} N·m（各 N の最大 ${rs.map(r=>r.max.toFixed(1)).join(' / ')}），平均 ${rs.map(r=>r.mean.toFixed(2)).join(' / ')} N·m，PMEP ${rs.map(r=>r.pmep.toFixed(1)).join(' / ')} kPa，p_in ${rs.map(r=>r.pin.toFixed(1)).join(' / ')} kPa`);
 console.log(`   T_stall ${K.Tst.toFixed(1)} N·m，ω_nl ${K.wnl.toFixed(2)}：`+st.map(r=>`負荷 ${r.Tl}：完爆 ${f(r.tFire)} s（${r.nc===r.nc?r.nc:'—'}），N_k 最大 ${r.Nmax.toFixed(0)} 最小 ${r.Nmin<1e8?r.Nmin.toFixed(0):'—'}，整定 ${r.stall?'エンスト':f(r.tSettle)}，E_st ${r.Est.toFixed(0)} J`).join('；'))}
S.acrank=null;
fs.writeFileSync(path.resolve(__dirname,'wot.json'),JSON.stringify(out));
