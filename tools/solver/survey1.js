#!/usr/bin/env node
/* 調査 1：今の DOPRI5 のまま，刻みの上限と許容誤差を変えたときの誤差と右辺の評価の回数．
   使い方： node tools/solver/survey1.js */
'use strict';
const L=require('./lib.js'),E=L.load(),{D}=E;
const t0=Date.now(),base=[],ref=[];
/* 点火時期：今の既定（自動）で落ち着いた値を使い，以後は固定する */
L.set();for(const c of L.COND){const r=L.run(E,c,null,null,80);base.push(r)}
const spa=base.map(r=>r.spa);console.log('点火時期 [°BTDC]',spa.map(v=>(v/D).toFixed(2)).join(' '));
/* 参照解：DOPRI5，rtol 1e-8，絶対許容 1/100，刻みの上限 0.125° */
L.set({__CAP:.125});L.COND.forEach((c,i)=>{const r=L.run(E,c,{rtol:1e-8},spa[i],60);r.c=null;ref.push(r)});
/* 周期定常への収束：参照解の最後の 2 サイクルの差 */
console.log('参照解：最後の 2 サイクルの相対差の最大',ref.map(r=>Math.max(...L.MET.map(m=>Math.abs(r.M[m]/r.prev[m]-1))).toExponential(1)).join(' '),' 評価/サイクル',ref.map(r=>r.nf.toFixed(0)).join(' '));
console.log('参照解の値',ref.map(r=>L.MET.map(m=>r.M[m].toPrecision(6)).join('/')).join('  '));
const row=(nm,g,o)=>{L.set(g);const R=L.COND.map((c,i)=>L.run(E,c,o,spa[i],60));const err=R.map((r,i)=>Math.max(...L.MET.map(m=>Math.abs(r.M[m]/ref[i].M[m]-1))));
 console.log(nm.padEnd(26),'評価',R.map(r=>r.nf.toFixed(0).padStart(6)).join(''),' 計',R.reduce((a,r)=>a+r.nf,0).toFixed(0).padStart(6),' 誤差%',err.map(e=>(e*100).toFixed(4).padStart(8)).join(''),' 最大',(Math.max(...err)*100).toFixed(4),R.some(r=>!r.fin||r.nfa||r.clp)?' ※強制受理/射影 '+R.map(r=>r.nfa+'/'+r.clp).join(' '):'')};
for(const cap of[.5,1,2,4,8,1e9])for(const rtol of[1e-3,1e-4,1e-5,1e-6])row('上限 '+(cap>1e8?'なし':cap+'°')+' rtol '+rtol.toExponential(0),{__CAP:cap,__TC:cap>1e8?1:1e-3*cap/.5},{rtol});
console.log('所要',((Date.now()-t0)/1e3).toFixed(0),'s');
