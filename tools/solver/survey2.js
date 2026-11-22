#!/usr/bin/env node
/* 調査 2：公式の比較．各公式で刻みの上限と許容誤差を変え，誤差（参照解との相対差の最大，4 条件 × 4 指標）と右辺の評価の回数（4 条件の合計／サイクル）を出す．
   「FSAL」の列は，最後の段を次のステップの最初の段に使い回したときの回数（受理したステップの数だけ減る．見積もり）．
   使い方： node tools/solver/survey2.js [公式の名前 ...] */
'use strict';
const L=require('./lib.js'),E=L.load(),{DPa,DPb5,DPb4}=E,want=process.argv.slice(2);
const M={
 'DOPRI5（製品）':{st:null,ex:-1/5,fsal:1},
 'DOPRI5（係数表）':{st:L.erk([null,...DPa],DPb5,DPb4),ex:-1/5,fsal:1},
 'BS3(2)':{st:L.erk([null,[1/2],[0,3/4],[2/9,1/3,4/9]],[2/9,1/3,4/9,0],[7/24,1/4,1/3,1/8]),ex:-1/3,fsal:1},
 'Heun–Euler 2(1)':{st:L.erk([null,[1]],[1/2,1/2],[1,0]),ex:-1/2,fsal:0},
 'Ralston 2(1)':{st:L.erk([null,[2/3]],[1/4,3/4],[1,0]),ex:-1/2,fsal:0},
 'RKC2 s=3':{st:L.rkc(3),ex:-1/3,fsal:1},'RKC2 s=4':{st:L.rkc(4),ex:-1/3,fsal:1},'RKC2 s=6':{st:L.rkc(6),ex:-1/3,fsal:1},'RKC2 s=8':{st:L.rkc(8),ex:-1/3,fsal:1}};
const C=L.COND;L.set();const spa=C.map(c=>L.run(E,c,null,null,80).spa);
const R=(g,o)=>{L.set(g);return C.map((c,i)=>L.run(E,c,o,spa[i],60))};
const ref=R({__CAP:.125},{rtol:1e-8});
console.log('条件：'+C.map(c=>c[0]).join('／')+'．誤差は IMEP，p_max，η_v，T_b の参照解との相対差の最大 [%]');
for(const [nm,m] of Object.entries(M)){if(want.length&&!want.some(w=>nm.includes(w)))continue;
 for(const cap of[2,1e9])for(const rtol of[1e-3,1e-4,1e-5,1e-6]){const A=R({__ST:m.st,__EX:m.ex,__CAP:cap,__TC:cap>1e8?1:1e-3*cap/.5},{rtol});
  const err=A.map((r,i)=>r.fin?Math.max(...L.MET.map(k=>Math.abs(r.M[k]/ref[i].M[k]-1))):NaN),nf=A.reduce((a,r)=>a+r.nf,0),st=A.reduce((a,r)=>a+r.st,0),mx=Math.max(...err.map(e=>e===e?e:9));
  console.log(nm.padEnd(18),('上限 '+(cap>1e8?'なし':cap+'°')).padEnd(8),'rtol',rtol.toExponential(0),' 評価',A.map(r=>r.nf.toFixed(0).padStart(6)).join(''),' 計',nf.toFixed(0).padStart(6),m.fsal?' FSAL '+(nf-st).toFixed(0).padStart(6):'             ',' 誤差%',err.map(e=>(e*100).toFixed(3).padStart(7)).join(''),mx<=1e-3?' ○':' ×',A.some(r=>r.nfa||r.clp)?' ※'+A.map(r=>r.nfa+'/'+r.clp).join(' '):'')}}
