#!/usr/bin/env node
/* 運転点のマップ（回転数 × 負荷）の試算（調査．製品のコードは変えない）．
   既存の Sweep（開度を固定して回転数を振る）を，開度ごとに実行し，各点の軸トルクと 5 つの量を集める．
   使い方： node tools/map/survey1.js [出力の JSON] */
'use strict';
const fs=require('fs'),NC=require('../dev/node_core');
const {mkP,Sweep}=NC.load({});
const Ns=[];for(let n=500;n<=7000;n+=500)Ns.push(n);
const ALS=[90,60,45,35,28,22,17,13,10,8,6,4.5,3.5],out=[],t0=Date.now();
for(const al of ALS){
 const t=Date.now(),S=new Sweep({...mkP()},Ns,al);while(!S.run(1e4));
 const el=(Date.now()-t)/1e3;
 for(const q of S.pts){const M=q.st?null:q;out.push({al,N:q.N,st:!!q.st,ok:q.ok,cyc:q.cyc,tb:M&&M.tb,eb:M&&M.eb,bsfc:M&&M.bsfc,spa:M&&M.spa,mt:M&&M.mt,ev:M&&M.ev})}
 console.log(('開度 '+al+'°').padEnd(9),'所要',el.toFixed(1).padStart(5),'s  サイクル',S.pts.reduce((a,q)=>a+q.cyc,0),' T_b [N·m]：',S.pts.map(q=>q.st?'  ×  ':q.tb.toFixed(1).padStart(5)).join(' '))
}
console.log('合計',((Date.now()-t0)/1e3).toFixed(1),'s，点',out.length);
const f=process.argv[2];if(f)fs.writeFileSync(f,JSON.stringify(out));
