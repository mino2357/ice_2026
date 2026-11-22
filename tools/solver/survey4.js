#!/usr/bin/env node
/* 調査 4：BS3(2) の周りの工夫（誤差のノルム，刻みの制御則，安全率，増やす上限）と，ほかの 3〜4 次の公式（SSP(4,3)，Merson）．
   回数は 4 条件の合計／サイクル．FSAL は最後の段の使い回しを数えたもの（見積もり）． */
'use strict';
const L=require('./lib.js');
const E=L.load([
 ['E=Math.max(E,Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i]))))','{const e_=Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i])));E=globalThis.__RMS?E+e_*e_:Math.max(E,e_)}'],
 ['const fac=E===E?Math.min(2.5,Math.max(.2,','if(globalThis.__RMS)E=Math.sqrt(E/EIX.length);const pi_=globalThis.__PI?Math.pow(Math.max(globalThis.__EP||1,1e-4),globalThis.__PI):1;if(E<=1)globalThis.__EP=E;const fac=E===E?Math.min(globalThis.__FMAX??2.5,Math.max(.2,pi_*']]);
const bs3=L.erk([null,[1/2],[0,3/4],[2/9,1/3,4/9]],[2/9,1/3,4/9,0],[7/24,1/4,1/3,1/8]),
 ssp43=L.erk([null,[1/2],[1/2,1/2],[1/6,1/6,1/6]],[1/6,1/6,1/6,1/2],[1/4,1/4,1/4,1/4]),
 mer=L.erk([null,[1/3],[1/6,1/6],[1/8,0,3/8],[1/2,0,-3/2,2]],[1/6,0,0,2/3,1/6],[1/6-2/30,0,9/30,2/3-8/30,1/6+1/30]);
const C=L.COND;L.set();const spa=C.map(c=>L.run(E,c,null,null,80).spa);
const R=(g,o)=>{L.set(g);for(const k of['__RMS','__PI','__EP','__FMAX'])delete globalThis[k];Object.assign(globalThis,g);return C.map((c,i)=>L.run(E,c,o,spa[i],60))};
const ref=R({__CAP:.125},{rtol:1e-8});
const row=(nm,g,rtol,fsal)=>{const A=R(Object.assign({__CAP:1e9,__TC:1},g),{rtol}),err=A.map((r,i)=>r.fin?Math.max(...L.MET.map(k=>Math.abs(r.M[k]/ref[i].M[k]-1))):NaN),nf=A.reduce((a,r)=>a+r.nf,0),st=A.reduce((a,r)=>a+r.st,0),mx=Math.max(...err.map(e=>e===e?e:9));
 console.log(nm.padEnd(34),'rtol',rtol.toExponential(0),' 評価',A.map(r=>r.nf.toFixed(0).padStart(6)).join(''),' 計',nf.toFixed(0).padStart(6),fsal?' FSAL '+(nf-st).toFixed(0).padStart(6):'             ',' 誤差%',err.map(e=>(e*100).toFixed(3).padStart(7)).join(''),mx<=1e-3?' ○':' ×',A.some(r=>r.nfa||r.clp)?' ※'+A.map(r=>r.nfa+'/'+r.clp).join(' '):'')};
const B={__ST:bs3,__EX:-1/3};
for(const rtol of[1e-3,3e-4,1e-4]){
 row('BS3 基準（最大ノルム，I 制御）',B,rtol,1);
 row('BS3 RMS ノルム',{...B,__RMS:1},rtol,1);
 row('BS3 PI 制御（0.7/3，0.4/3）',{...B,__EX:-.7/3,__PI:.4/3},rtol,1);
 row('BS3 安全率 0.8',{...B,__SF:.8},rtol,1);
 row('BS3 安全率 0.95',{...B,__SF:.95},rtol,1);
 row('BS3 増やす上限 5 倍',{...B,__FMAX:5},rtol,1);
 row('BS3 刻みの上限 4°',{...B,__CAP:4,__TC:8e-3},rtol,1);
 row('SSP(4,3)',{__ST:ssp43,__EX:-1/3},rtol,0);
 row('Merson 4',{__ST:mer,__EX:-1/4},rtol,0)}
