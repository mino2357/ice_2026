#!/usr/bin/env node
/* EngineCore の計算時間（Node.js）：全開・3000 rpm 固定の 1 サイクルあたりの時間とステップ数を，熱物性と噴射方式ごとに測る．
   使い方： node tools/dev/bench_core.js [サイクル数]
   ブラウザでの計測（アイドル 10 s，性能曲線）は tools/bench.js． */
'use strict';
const {mkP,Core,SWC,D,PI}=require('./node_core').load(),n=+process.argv[2]||60;
function run(o){const N=3000,c=new Core(Object.assign(mkP(),{cvar:0,sauto:1,mode:1,alm:90*D,nt:N},o));c.fixw=1;c.fixTw=1;c.s.y[5]=SWC.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();while(c.s.cyc<5)c.step();const t=process.hrtime.bigint();let st=0;while(c.s.cyc<5+n){c.step();st++}return (Number(process.hrtime.bigint()-t)/1e6/n).toFixed(2)+' ms/サイクル，'+(st/n).toFixed(0)+' ステップ/サイクル'}
for(let k=0;k<2;k++)for(const [nm,o] of [['γ(T)',{gam:0}],['化学平衡・直噴',{gam:2,inj:1}],['化学平衡・ポート噴射',{gam:2,inj:0}]])console.log((k?'2 回目 ':'1 回目 ')+nm.padEnd(12),run(o));
