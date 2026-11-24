#!/usr/bin/env node
/* 単気筒の問題設定を決めるための計測（回転数を固定した計算．fixw）．
   1. アイドル付近の定常の軸トルク T̄_b(α, N)（ECU の設計用）
   2. アイドルの 1 サイクルの中のエネルギーの変動 ΔE（フライホイールの慣性の設計用）
   3. 低い回転数で燃料 OFF のときの抵抗トルクの最大（スターターの拘束トルクの設計用）
   使い方： node experiments/startup/plant.js */
'use strict';
const path=require('path');
const {mkP,Core,K}=require(path.resolve(__dirname,'../../tools/dev/node_core.js')).load();
const D=Math.PI/180,RPM=30/Math.PI,OV=JSON.parse(process.env.OV||'{}');
/* 回転数 N，開度 a [°] で固定して nc サイクル回し，最後のサイクルの M と軌跡を返す */
function fixed(N,a,o={}){
 const c=new Core({...mkP(),cvar:0,sauto:1,mode:1,alm:a*D,...OV,...o.P});
 c.fixw=1;c.s.y[1]=N/RPM;c.s.Nb=N;c.P.nt=N;
 if(o.fuel!==0){c.start();c.s.fired=1;c.s.starter=0}
 const nc=o.nc||30,Ms=[];let cy=c.s.cyc;
 while(Ms.length<nc){c.step();if(c.s.cyc!==cy){cy=c.s.cyc;Ms.push(c.lastM)}}
 return {c,M:Ms[Ms.length-1],Ms,tr:c.last}}
const avg=(Ms,k,n=5)=>Ms.slice(-n).reduce((s,M)=>s+M[k],0)/n;
const out={};
/* 1 */
out.map=[];
console.log('1. 定常の軸トルク T̄_b [N·m]（5 サイクル平均．点火の自動最適化 ON，T_aux = 2 N·m を引いた値）');
const As=[2.5,3,3.5,4,4.5,5,6,7,8],Ns=[500,600,700,800,900,1000,1200];
console.log('  α[°] \\ N[rpm] '+Ns.join(' '));
for(const a of As){const row=[];for(const N of Ns){const r=fixed(N,a);row.push(avg(r.Ms,'tb'));out.map.push({a,N,tb:avg(r.Ms,'tb'),imep:avg(r.Ms,'imep'),pin:avg(r.Ms,'pinE')})}console.log('  '+String(a).padStart(4)+'          '+row.map(v=>v.toFixed(2).padStart(6)).join(' '))}
/* 2 */
console.log('2. 800 rpm の 1 サイクルの中のエネルギーの変動（T_b,inst = T_ind − T_f − T_aux − T̄_b を θ で積分した量の最大 − 最小）');
out.dE=[];
for(const a of [3.5,4.5,5.5,6.5]){
 const r=fixed(800,a),tr=r.tr,n=tr.p.length;
 /* 軌跡の Ti，Tf は 0.5° ごと．T_aux は一定 */
 const Tb=[];for(let i=0;i<n;i++)Tb.push(tr.Ti?r.c.tr.Ti[i]:NaN);
 const Ti=Array.from(r.c.last.p).map((p,i)=>NaN);
 const T1=Array.from(r.c.tr.Ti),Tf=Array.from(r.c.tr.Tf),m=T1.map((v,i)=>v-Tf[i]-r.c.P.Ta),mb=m.reduce((s,v)=>s+v,0)/n;
 let E=0,mx=0,mn=0;for(let i=0;i<n;i++){E+=(m[i]-mb)*(4*Math.PI/n);mx=Math.max(mx,E);mn=Math.min(mn,E)}
 out.dE.push({a,tb:mb,dE:mx-mn,Tmax:Math.max(...T1),Tmin:Math.min(...T1)});
 console.log(`  α = ${a}°：T̄_b = ${mb.toFixed(2)} N·m，ΔE = ${(mx-mn).toFixed(1)} J，T_ind の最大 ${Math.max(...T1).toFixed(1)}，最小 ${Math.min(...T1).toFixed(1)} N·m`)}
/* 3 */
console.log('3. 燃料 OFF，開度 6° の抵抗トルク −(T_ind − T_f − T_aux) の最大 [N·m]');
out.res=[];
for(const N of [30,60,100,200,300]){const r=fixed(N,6,{fuel:0,nc:6}),T1=Array.from(r.c.tr.Ti),Tf=Array.from(r.c.tr.Tf),R=T1.map((v,i)=>-(v-Tf[i]-r.c.P.Ta)),n=R.length;
 const mean=R.reduce((s,v)=>s+v,0)/n;let E=0,mx=0;for(let i=0;i<n;i++){E+=R[i]*(4*Math.PI/n)}
 out.res.push({N,max:Math.max(...R),mean});console.log(`  N = ${N} rpm：最大 ${Math.max(...R).toFixed(1)}，平均 ${mean.toFixed(2)} N·m`)}
require('fs').writeFileSync(path.resolve(__dirname,process.env.OUT||'plant.json'),JSON.stringify(out));
