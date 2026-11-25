#!/usr/bin/env node
/* 採用した始動の条件：クランキング中は全開，初期位相は vvt_rmin.json の最小点（全開で計算したもの）．
   T_stall = 1.3 (R̂ + 6)，ω_nl を決め直し，負荷 0，3，6 N·m の始動を計算する（VVT は固定）．結果は start_final.json */
'use strict';
const path=require('path'),fs=require('fs');
const X=require('./startup.js'),{S,K,run}=X;
const V=JSON.parse(fs.readFileSync(path.resolve(__dirname,'vvt_rmin.json'),'utf8'));
if(V.alpha!==90)throw new Error('vvt_rmin.json が全開の計算ではない（alpha = '+V.alpha+'）');
const {phin,phex,Rhat}=V.best;
S.acrank=90;K.Tst=1.3*(Rhat+S.TLMAX);S.wnl=null;X.tuneWnl({it:30,T:4,phin,phex});
const f=(v,d=2)=>v!=null&&v===v?v.toFixed(d):'—';
console.log(`初期位相 φin ${phin}°，φex ${phex}°，R̂ ${Rhat.toFixed(2)} N·m，T_stall ${K.Tst.toFixed(1)} N·m，ω_nl ${K.wnl.toFixed(2)} rad/s（${(K.wnl*30/Math.PI).toFixed(0)} rpm）`);
const out={phin,phex,Rhat,Tst:K.Tst,wnl:K.wnl,runs:[]};
for(const Tl of [0,3,6]){const r=run({Tl,phin,phex,T:12,dtr:.01});out.runs.push({Tl,tInj:r.tInj,tFire:r.tFire,nc:r.cFire-r.cInj,tSettle:r.tSettle,Est:r.Est,Nmax:r.Nmax,Nmin:r.Nmin,stall:r.stall,tr:r.tr.map(q=>[q[0],q[1],q[3]]),cyc:r.cyc});
 console.log(`負荷 ${Tl} N·m：噴射 ${f(r.tInj)} s，完爆 ${f(r.tFire)} s（${r.cFire-r.cInj===r.cFire-r.cInj?r.cFire-r.cInj:'—'} サイクル），N_k 最大 ${f(r.Nmax,0)} 最小 ${r.Nmin<1e8?f(r.Nmin,0):'—'} rpm，整定 ${r.stall?'エンスト':f(r.tSettle)} s，E_st ${f(r.Est,0)} J，IMEP ${r.cyc.slice(0,5).map(q=>q.imep).join('/')} kPa`)}
fs.writeFileSync(path.resolve(__dirname,'start_final.json'),JSON.stringify(out));
