#!/usr/bin/env node
/* VVT の初期位相を「圧縮の反力の最小」で決める．
   R(θ) = −(T_ind − T_f − T_aux)：燃料 OFF，回転数 N に固定，開度はクランキングの開度（S.acrank．無ければ α_ff），4 サイクル目の 1 サイクル．
   使い方の例： S='{"acrank":90}' node experiments/startup/vvt_rmin.js（全開でクランキング）
   R̂(φin, φex) = max_N max_θ R（N ∈ NS：止まった状態からクランキングの回転数まで）を，範囲 [−40, 40]² で最小にする（弁とピストンが当たる点は除く）．
   使い方： node experiments/startup/vvt_rmin.js   結果は vvt_rmin.json */
'use strict';
const path=require('path'),fs=require('fs');
const {S,mkP,Core,D,RPM}=require('./startup.js');
const NS=[30,60,120,200,300];
function R(phin,phex,N,a=S.acrank??S.aff){
 const c=new Core({...mkP(),cvar:0,mode:1,alm:a*D,alc:a*D,Vin:S.Vin,phin:phin*D,phex:phex*D});
 if(c.vhit)return null;
 c.fixw=1;c.s.y[1]=N/RPM;c.s.Nb=N;c.P.nt=N;
 let cy=c.s.cyc,n=0;while(n<4){c.step();if(c.s.cyc!==cy){cy=c.s.cyc;n++}}
 const Ti=Array.from(c.tr.Ti),Tf=Array.from(c.tr.Tf);let mx=-1e9,k=0;
 for(let i=0;i<Ti.length;i++){const r=-(Ti[i]-Tf[i]-c.P.Ta);if(r>mx){mx=r;k=i}}
 return {max:mx,th:k/2}}
module.exports={R,NS};
if(require.main===module){
const t0=Date.now(),out={NS,alpha:S.acrank??S.aff,grid:[]};
const ev=(pi,pe)=>{const rs=NS.map(N=>R(pi,pe,N));if(rs[0]===null)return {phin:pi,phex:pe,vhit:1};
 const m=Math.max(...rs.map(r=>r.max));return {phin:pi,phex:pe,Rhat:m,byN:rs.map(r=>+r.max.toFixed(2)),Nw:NS[rs.findIndex(r=>r.max===m)],th:rs.map(r=>r.th)}};
for(let pi=-40;pi<=40;pi+=4)for(let pe=-40;pe<=40;pe+=10){const r=ev(pi,pe);out.grid.push(r)}
const ok=out.grid.filter(r=>!r.vhit);let best=ok.reduce((a,b)=>b.Rhat<a.Rhat?b:a);
/* 1° で詰める */
for(let moved=true;moved;){moved=false;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1],[0,5],[0,-5]]){const pi=best.phin+a,pe=best.phex+b;if(Math.abs(pi)>40||Math.abs(pe)>40)continue;
 if(out.grid.some(r=>r.phin===pi&&r.phex===pe))continue;const r=ev(pi,pe);out.grid.push(r);if(!r.vhit&&r.Rhat<best.Rhat){best=r;moved=true}}}
out.best=best;
const at=(pi,pe)=>out.grid.find(r=>r.phin===pi&&r.phex===pe);
console.log(`所要 ${((Date.now()-t0)/1e3).toFixed(0)} s．弁とピストンが当たる点 ${out.grid.filter(r=>r.vhit).length}`);
console.log('φin ごとの R̂（φex = 0）[N·m]（N = '+NS.join('，')+' rpm の値）：');
for(let pi=-40;pi<=40;pi+=8){const r=at(pi,0);console.log(`  φin ${String(pi).padStart(3)}：R̂ ${r.Rhat.toFixed(1)}（${r.byN.join(' / ')}），最大の回転数 ${r.Nw}`)}
const col=out.grid.filter(r=>r.phin===best.phin&&!r.vhit).map(r=>r.Rhat);
console.log(`最小：φin ${best.phin}°，φex ${best.phex}°，R̂ ${best.Rhat.toFixed(2)} N·m（${best.byN.join(' / ')}）．同じ φin で φex を振った幅 ${(Math.max(...col)-Math.min(...col)).toFixed(2)} N·m`);
fs.writeFileSync(path.resolve(__dirname,'vvt_rmin.json'),JSON.stringify(out));
}
