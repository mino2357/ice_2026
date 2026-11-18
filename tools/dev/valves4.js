#!/usr/bin/env node
/* 弁の数・径・リフトと排気系を変えたときの全開の性能の比較（成果物は変えない．検討用）．
   使い方： node tools/dev/valves4.js ['[{"n":1,"dv":38,"dve":32,"Lv":9,"muf":1},{"n":2,"dv":31,"dve":26,"Lv":9,"muf":1},{"n":2,"dv":31,"dve":26,"Lv":9}]'] [刻み rpm]
   n：吸気・排気それぞれの弁の数（1 は内部の値 nv = 1．第42版までの機関），dv，dve：弁径 [mm]，Lv：最大リフト [mm]，
   muf：1 なら第42版までの排気系（消音器 3 L，出口 300 mm²．内部の値 Vm，At），無ければ大気開放（既定）．
   出力：回転数ごとの軸トルク [N·m]，軸出力 [kW]，体積効率，残留ガス割合，背圧 [kPa]，排気ポート圧の脈動の幅 [kPa]（点火時期は自動最適化，厳格な収束，直噴・化学平衡）．
   背圧は 1 サイクル平均の排気ポート圧 − 大気圧（第42版までは消音器圧 − 大気圧だったので，muf の行の値は第42版の表示と違う）． */
'use strict';
const {mkP,Sweep,PI}=require('./node_core').load(),C=JSON.parse(process.argv[2]||'[{"n":1,"dv":38,"dve":32,"Lv":9,"muf":1},{"n":2,"dv":31,"dve":26,"Lv":9,"muf":1},{"n":2,"dv":31,"dve":26,"Lv":9}]'),st=+process.argv[3]||500;
for(const c of C){const Ns=[];for(let N=1000;N<=7000;N+=st)Ns.push(N);
 const S=new Sweep({...mkP(),cvar:0,dv:c.dv*1e-3,dve:c.dve*1e-3,Lv:c.Lv*1e-3,...(c.n===1?{nv:1}:{}),...(c.muf?{Vm:3e-3,At:300e-6}:{})},Ns,90,{crit:'strict',flow:true});while(!S.run(1e9));
 const B=86,Ai=c.n*Math.min(PI*c.dv*c.Lv,PI/4*c.dv*c.dv),Ae=c.n*Math.min(PI*c.dve*c.Lv,PI/4*c.dve*c.dve);
 console.log(`\n弁 ${c.n}+${c.n}，吸気 ${c.n}×${c.dv} mm（${(c.dv/B).toFixed(2)}B），排気 ${c.n}×${c.dve} mm（${(c.dve/B).toFixed(2)}B），最大リフト ${c.Lv} mm：最大の幾何面積 吸気 ${Ai.toFixed(0)} mm²，排気 ${Ae.toFixed(0)} mm²．排気系：${c.muf?'消音器 3 L，出口 300 mm²':'大気開放'}`);
 console.log('  N[rpm]  T_b[N·m]  P_b[kW]   η_v    x_r    背圧[kPa]  脈動[kPa]  点火[°BTDC]');
 for(const p of S.pts)console.log('  '+String(p.N).padStart(5)+(p.ok?' ':'*')+p.tb.toFixed(2).padStart(9)+(p.pb/1e3).toFixed(2).padStart(9)+p.ev.toFixed(3).padStart(7)+p.xr.toFixed(3).padStart(8)+(p.dpex/1e3).toFixed(2).padStart(10)+(p.ppeR/1e3).toFixed(0).padStart(10)+p.spa.toFixed(1).padStart(11));
 const mt=S.pts.reduce((a,b)=>b.tb>a.tb?b:a),mp=S.pts.reduce((a,b)=>b.pb>a.pb?b:a);console.log(`  最大トルク ${mt.tb.toFixed(2)} N·m（${mt.N} rpm），最大出力 ${(mp.pb/1e3).toFixed(2)} kW（${mp.N} rpm）`)}
