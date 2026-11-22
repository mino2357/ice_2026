#!/usr/bin/env node
/* 当量比に対する全開の軸トルク（回転数固定，点火は自動最適化，性能曲線の計測と同じ手順・厳格）．
   使い方： node tools/dev/phi_sweep.js [--hfg 305e3] [--rpm 2000,4000] [--phi 0.9,1,1.1,1.2,1.3]
   --hfg は気化潜熱 [J/kg] を書き換えて感度を見る（既定は src/core.js の値）．
   出力：直噴／ポート噴射／γ(T) のそれぞれについて，軸トルク [N·m]，IVC の筒内温度 [K]，1 サイクルの空気量 [mg]，点火の時点の当量比． */
'use strict';
const A=process.argv.slice(2),opt=(k,d)=>{const i=A.indexOf('--'+k);return i<0?d:A[i+1]};
const hfg=opt('hfg',null),rpm=String(opt('rpm','2000,4000')).split(',').map(Number),phis=String(opt('phi','0.9,1,1.1,1.2,1.3')).split(',').map(Number);
const {mkP,Sweep,GAS}=require('./node_core').load(hfg?{sub:[[/hfg=350e3/,'hfg='+hfg]]}:{});
console.log('気化潜熱 h_fg =',GAS.hfg/1e3,'kJ/kg');
for(const [nm,o] of [['化学平衡・直噴',{gam:2,inj:1}],['化学平衡・ポート噴射',{gam:2,inj:0}],['γ(T)',{gam:0}]]){console.log(nm);
  for(const N of rpm){const row=[];for(const phi of phis){const s=new Sweep({...mkP(),cvar:0,phi,...o},[N],90,{crit:'strict',flow:true});while(!s.run(1e9));const p=s.pts[0],M=s.c.lastM;
    row.push('φ'+phi+' '+p.tb.toFixed(2)+(p.ok?'':'（未整定）')+(o.gam===2?' ['+M.Tivc.toFixed(1)+' K, '+(M.ma*1e6).toFixed(1)+' mg, φc '+M.phc.toFixed(3)+']':''))}
    console.log('  '+N+' rpm  T_b [N·m]： '+row.join('  '))}}
