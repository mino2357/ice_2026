#!/usr/bin/env node
/* 調査 1b：アイドル相当の条件の選び直し（開度）と，指標ごとの誤差，参照解どうしの差（誤差の下限の見積もり） */
'use strict';
const L=require('./lib.js'),E=L.load();
for(const al of[3,4,5,6,8]){L.set();const r=L.run(E,['',800,al],null,null,80);console.log('800 rpm 開度',al,'° IMEP',(r.M.imep/1e3).toFixed(1),'kPa T_b',r.M.tb.toFixed(2),'N·m 点火',r.spa.toFixed(1),' 最後の 2 サイクルの差',Math.max(...L.MET.map(m=>Math.abs(r.M[m]/r.prev[m]-1))).toExponential(1))}
const C=[['アイドル相当',800,6],L.COND[1],L.COND[2],L.COND[3]];
L.set();const spa=C.map(c=>L.run(E,c,null,null,80).spa);
const R=(g,o,nc)=>{L.set(g);return C.map((c,i)=>L.run(E,c,o,spa[i],nc||60))};
const ref=R({__CAP:.125},{rtol:1e-8}),ref2=R({__CAP:.25},{rtol:1e-7}),ref3=R({__CAP:.125},{rtol:1e-8},100);
const pr=(nm,A)=>console.log(nm.padEnd(30),A.map((r,i)=>L.MET.map(m=>((r.M[m]/ref[i].M[m]-1)*100).toFixed(4).padStart(8)).join('')).join(' |'),' 評価計',A.reduce((a,r)=>a+r.nf,0).toFixed(0));
console.log('指標の順：'+L.MET.join(' ')+'（相対差 %．条件の順：アイドル相当 6°，部分負荷，全開 3000，全開 7000）');
pr('参照解 2（0.25°，1e-7）',ref2);pr('参照解 3（100 サイクル）',ref3);
pr('今の既定（0.5°，1e-5）',R({},{rtol:1e-5}));pr('1°，1e-5',R({__CAP:1,__TC:2e-3},{rtol:1e-5}));pr('2°，1e-5',R({__CAP:2,__TC:4e-3},{rtol:1e-5}));pr('2°，1e-6',R({__CAP:2,__TC:4e-3},{rtol:1e-6}));pr('4°，1e-6',R({__CAP:4,__TC:8e-3},{rtol:1e-6}));pr('なし，1e-6',R({__CAP:1e9,__TC:1},{rtol:1e-6}));pr('なし，1e-7',R({__CAP:1e9,__TC:1},{rtol:1e-7}));
