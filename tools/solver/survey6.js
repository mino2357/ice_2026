#!/usr/bin/env node
/* 調査 6：実装した BS3(2)（src/core.js の sol = 2）の許容誤差の選び直し．
   定常の平均では見えない誤差を見るため，DOPRI5（第26版の既定）で 40 サイクル回した状態から解法を切り替え，直後の 1 サイクルの指標（IMEP，φ_ig，η_v，p_max，x_r）を，
   同じ状態から DOPRI5 のまま進めた 1 サイクルと比べる（1 サイクルの写像の誤差）．回数は切り替えの 7 サイクル後からの 4 サイクルの平均（4 条件の合計）．
   使い方： node tools/solver/survey6.js */
'use strict';
const NC=require('../dev/node_core'),CD=[[800,6,17.0],[1500,15,22.0],[3000,90,25.9],[7000,90,28.9]];
function go(nm,sub,as,ref){const {Core,mkP,D,PI}=NC.load({sub:sub||[]});
 const mk=(N,al,sp)=>{const c=new Core({...mkP(),cvar:0,sol:1,mode:1,alm:al*D,nt:N,sauto:0,spb:sp});c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();c.s.fired=1;c.s.starter=0;return c};
 const one=c=>{const c0=c.s.cyc;while(c.s.cyc===c0)c.step();return c.lastM};let tot=0,tdp=0;const o=[];
 for(const [N,al,sp] of CD){const b=mk(N,al,sp);for(let i=0;i<40;i++)one(b);const a=b.clone();if(ref){a.P.rtol=1e-8;a.cpS=.125}else{a.P.sol=2;if(as)a.atS=as}const d=b.clone();
  const A=one(a),B=one(d);let mx=0;for(const k of['imep','phc','ev','pm','xr'])mx=Math.max(mx,Math.abs(A[k]/B[k]-1));
  for(let i=0;i<6;i++){one(a);one(d)}const n0=a.s.nfe,m0=d.s.nfe;for(let i=0;i<4;i++){one(a);one(d)}tot+=(a.s.nfe-n0)/4;tdp+=(d.s.nfe-m0)/4;o.push((mx*100).toFixed(3).padStart(6))}
 console.log(nm.padEnd(40),'1 サイクルの差 [%]',o.join(' '),' 回数',tot.toFixed(0).padStart(6),' 比',(tot/tdp).toFixed(3))}
const B=(rt,x)=>[['const BS3={rt:3e-4,cap:5,ht:2e-3,kI:.7/3,kP:.4/3};','const BS3={rt:'+rt+',cap:'+(x&&x.cap||5)+',ht:2e-3,kI:'+(x&&x.kI||'.7/3')+',kP:'+(x&&x.kP!=null?x.kP:'.4/3')+'};']];
go('参照（DOPRI5，1e-8，上限 0.125°）',null,0,1);
for(const rt of['3e-4','1e-4','6e-5','4e-5','3e-5','2e-5','1e-5'])go('BS3 相対許容 '+rt,B(rt));
for(const rt of['1e-4','6e-5'])for(const as of[.3,.1])go('BS3 相対許容 '+rt+'，絶対許容 ×'+as,B(rt),as);
for(const rt of['6e-5','3e-5']){go('BS3 '+rt+'，PI 制御なし',B(rt,{kI:'1/3',kP:0}));go('BS3 '+rt+'，刻みの上限 3°',B(rt,{cap:3}));go('BS3 '+rt+'，刻みの上限 10°',B(rt,{cap:10}))}
