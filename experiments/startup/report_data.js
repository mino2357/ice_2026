#!/usr/bin/env node
/* 報告のページ（report.html）を作る：vvt0.json の格子と最適点を読み，既定の VVT と最適な初期 VVT の始動を細かく計算して，
   report.tpl.html の /*DATA*\/ に埋め込む．
   使い方： node experiments/startup/report_data.js */
'use strict';
const path=require('path'),fs=require('fs');
const X=require('./startup.js'),{S,K,run,mkP,Core,D,RPM}=X;
const V=JSON.parse(fs.readFileSync(path.resolve(__dirname,'vvt0.json'),'utf8'));
const LOADS=V.LOADS,MARGIN=V.MARGIN,T=8;
function reaction(phin,phex,N=60){
 const c=new Core({...mkP(),cvar:0,mode:1,alm:S.aff*D,Vin:S.Vin,phin:phin*D,phex:phex*D});
 c.fixw=1;c.s.y[1]=N/RPM;c.s.Nb=N;c.P.nt=N;
 let cy=c.s.cyc,n=0;while(n<4){c.step();if(c.s.cyc!==cy){cy=c.s.cyc;n++}}
 const Ti=Array.from(c.tr.Ti),Tf=Array.from(c.tr.Tf),R=Ti.map((v,i)=>-(v-Tf[i]-c.P.Ta));
 return {max:Math.max(...R),R}}
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100,r3=v=>Math.round(v*1000)/1000;
function detail(name,phin,phex){
 const a=reaction(phin,phex);
 K.Tst=MARGIN*(a.max+S.TLMAX);S.wnl=null;X.tuneWnl({it:30,T:4,phin,phex});
 const Tst=K.Tst,wnl=K.wnl;
 const runs=LOADS.map(Tl=>{const r=run({Tl,phin,phex,T,dtr:.01});
  return {Tl,tInj:r3(r.tInj),tFire:r3(r.tFire),tSettle:r.tSettle===r.tSettle?r2(r.tSettle):null,Est:r1(r.Est),Nmax:r1(r.Nmax),Nmin:r1(r.Nmin),stall:r.stall,
   /* t，瞬時の回転数，開度，スターターのトルク */
   tr:r.tr.map(q=>[r3(q[0]),r1(q[1]),r3(q[3]),q[5]&&!q[7]?r1(Tst*Math.max(0,1-q[1]/RPM/wnl)):0]),
   cyc:r.cyc.map(c=>({k:c.k,t:r3(c.t),N:c.N,imep:c.imep,pin:c.pin,al:c.al,spa:c.spa,fired:c.fired}))}});
 return {name,phin,phex,Rmax:r1(a.max),Tst:r1(Tst),wnl:r2(wnl),runs,R:a.R.filter((_,i)=>i%2===0).map(r1)}}
const best=V.best;
const cases=[detail('既定の VVT',0,0),detail('最適な初期 VVT',best.phin,best.phex)];
/* 圧縮の反力の θ に対する形（φ_ex = 最適点の値） */
const react=[];
for(const pi of [...new Set([-40,0,best.phin,40])].sort((a,b)=>a-b)){const a=reaction(pi,best.phex);react.push({phin:pi,max:r1(a.max),R:a.R.filter((_,i)=>i%2===0).map(r1)})}
const grid=V.grid.concat(V.fine).map(g=>g.vhit?{phin:g.phin,phex:g.phex,vhit:1}:{phin:g.phin,phex:g.phex,ok:g.ok,Rmax:r1(g.Rmax),Tst:r1(g.Tst),tFire:g.tFire.map(r3),nc:g.nc,tSettle:g.tSettle.map(v=>v===v?r2(v):null),Est:g.Est.map(r1)});
const valves=(()=>{const P=mkP();return {ivo:P.ivo/D,ivc:P.ivc/D,evo:P.evo/D,evc:P.evc/D}})();
const data={S:{...S,Tst:undefined},LOADS,MARGIN,NC_MAX:V.NC_MAX,T_MAX:V.T_MAX,best:{phin:best.phin,phex:best.phex},valves,grid,cases,react};
const tpl=fs.readFileSync(path.resolve(__dirname,'report.tpl.html'),'utf8');
fs.writeFileSync(path.resolve(__dirname,'report.html'),tpl.replace('/*DATA*/null',JSON.stringify(data)));
console.log('report.html：'+(fs.statSync(path.resolve(__dirname,'report.html')).size/1e3).toFixed(0)+' kB');
for(const c of cases)console.log(c.name,`φin ${c.phin} φex ${c.phex} R_max ${c.Rmax} T_stall ${c.Tst} ω_nl ${c.wnl}`,c.runs.map(r=>`T_load ${r.Tl}：完爆 ${r.tFire} 整定 ${r.tSettle} E_st ${r.Est} N ${r.Nmin}〜${r.Nmax}`).join('；'));
