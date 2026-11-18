#!/usr/bin/env node
/* 4 弁（吸気 2・排気 2）にしたときの全開の性能の試算（成果物は変えない．検討用）．
   弁の有効面積 A_eff = n C_d min(π d L, π d²/4) の n を，読み込むソースの書き換えで与える（n = 1 は現在のモデル）．
   使い方： node tools/dev/valves4.js ['[{"n":1,"dv":38,"dve":32,"Lv":9},{"n":2,"dv":31,"dve":26,"Lv":9}]'] [刻み rpm]
   出力：回転数ごとの軸トルク [N·m]，軸出力 [kW]，体積効率，残留ガス割合，背圧 [kPa]（点火時期は自動最適化，厳格な収束，直噴・化学平衡）． */
'use strict';
const L=require('./node_core'),C=JSON.parse(process.argv[2]||'[{"n":1,"dv":38,"dve":32,"Lv":9},{"n":2,"dv":31,"dve":26,"Lv":9},{"n":2,"dv":31,"dve":26,"Lv":8}]'),st=+process.argv[3]||500;
for(const c of C){const {mkP,Sweep,PI}=L.load({sub:[['K.Cdv*Math.min(PI*v.d*lift(v,th,cam),PI/4*v.d*v.d)',c.n+'*K.Cdv*Math.min(PI*v.d*lift(v,th,cam),PI/4*v.d*v.d)']]});
 const Ns=[];for(let N=1000;N<=7000;N+=st)Ns.push(N);const S=new Sweep({...mkP(),cvar:0,dv:c.dv*1e-3,dve:c.dve*1e-3,Lv:c.Lv*1e-3},Ns,90,{crit:'strict',flow:true});while(!S.run(1e9));
 const B=86,Ai=c.n*Math.min(PI*c.dv*c.Lv,PI/4*c.dv*c.dv),Ae=c.n*Math.min(PI*c.dve*c.Lv,PI/4*c.dve*c.dve);
 console.log(`\n弁 ${c.n}+${c.n}，吸気 ${c.n}×${c.dv} mm（${(c.dv/B).toFixed(2)}B），排気 ${c.n}×${c.dve} mm（${(c.dve/B).toFixed(2)}B），最大リフト ${c.Lv} mm：最大の幾何面積 吸気 ${Ai.toFixed(0)} mm²，排気 ${Ae.toFixed(0)} mm²`);
 console.log('  N[rpm]  T_b[N·m]  P_b[kW]   η_v    x_r    背圧[kPa]  点火[°BTDC]');
 for(const p of S.pts)console.log('  '+String(p.N).padStart(5)+(p.ok?' ':'*')+p.tb.toFixed(2).padStart(9)+(p.pb/1e3).toFixed(2).padStart(9)+p.ev.toFixed(3).padStart(7)+p.xr.toFixed(3).padStart(8)+(p.dpex/1e3).toFixed(1).padStart(10)+p.spa.toFixed(1).padStart(10));
 const mt=S.pts.reduce((a,b)=>b.tb>a.tb?b:a),mp=S.pts.reduce((a,b)=>b.pb>a.pb?b:a);console.log(`  最大トルク ${mt.tb.toFixed(2)} N·m（${mt.N} rpm），最大出力 ${(mp.pb/1e3).toFixed(2)} kW（${mp.N} rpm）`)}
