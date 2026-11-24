#!/usr/bin/env node
/* 開度のステップに対するサイクルごとの軸トルクの応答（回転数を固定．800 rpm）．サイクルの境目で開度を α0 → α0 + Δα に変える．
   あわせて，サイクルの境目のクランク角（θ mod 4π）を表示する． */
'use strict';
const path=require('path');
const {mkP,Core}=require(path.resolve(__dirname,'../../tools/dev/node_core.js')).load();
const OV=JSON.parse(process.env.OV||'{}'),D=Math.PI/180,RPM=30/Math.PI,N=+process.argv[2]||800,a0=+process.argv[3]||4.3,da=+process.argv[4]||.5;
const c=new Core({...mkP(),cvar:0,sauto:1,mode:1,alm:a0*D,...OV});
c.fixw=1;c.s.y[1]=N/RPM;c.s.Nb=N;c.P.nt=N;c.start();c.s.fired=1;c.s.starter=0;
let cy=c.s.cyc,k=0;const rows=[];
while(k<60){c.step();if(c.s.cyc!==cy){cy=c.s.cyc;k++;const M=c.lastM;rows.push([k,(c.s.y[0]%(4*Math.PI))/D,M.tb,M.pinE/1e3]);if(k===35)c.P.alm=(a0+da)*D}}
const base=rows.slice(30,35).reduce((s,r)=>s+r[2],0)/5;
console.log(`N = ${N} rpm，α ${a0} → ${a0+da}°（サイクル 35 の終わりで変える）．境目の θ = ${rows[0][1].toFixed(1)}°`);
for(const r of rows.slice(32,50))console.log(`  サイクル ${r[0]}：T̄_b = ${r[2].toFixed(3)} N·m（変化 ${(r[2]-base).toFixed(3)}），p_in(EVO) = ${r[3].toFixed(2)} kPa`);
