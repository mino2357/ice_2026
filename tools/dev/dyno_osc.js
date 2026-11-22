#!/usr/bin/env node
/* 動力計制御での回転数の振れの調査（docs/review_v26.md の 12.5 節）．始動から 30 s 運転し，最後の 8 s の N̄ と f_eff の幅と周期を表示する．
   使い方： node tools/dev/dyno_osc.js [a|b|c|d]
   a：全開で，定格トルクと目標回転数を変える．
   b：全開・目標 3000 rpm・定格 200 N·m（シナリオ W3000 の条件）で，PI のゲインと遅れ（τ_d，τ_N）を変える．
   c：線形の見積もり．平均化した系 I dω/dt = T_b(ω) − f k_w ω²，τ_d df/dt = f_cmd − f，τ_N dN̄/dt = N − N̄，f_cmd = K_pd e + K_id ∫e dt の
      特性方程式 s(s + a)(τ_d s + 1)(τ_N s + 1) + K (K_pd s + K_id) = 0（a = (2 T_b/ω − dT_b/dω)/I，K = (30/π) T_rated (N/N_rated)²/I）の
      Routh の条件と，実際の振れを並べる（T_b(ω) は全開の計測から）．
   d：部分負荷と，第42版の機関． */
'use strict';
const {mkP,Core,PI,D,K,Sweep}=require('./node_core').load();
function run(o,T=30,T0=22){const c=new Core({...mkP(),cvar:0,mode:1,alm:90*D,...o});c.start();const a=[];let nx=T0;while(c.s.t<T){c.step();if(c.s.t>=nx){nx+=.005;a.push([c.s.t,c.s.Nb,c.s.fe,c.s.fc!=null?c.s.fc:NaN])}}
 const N=a.map(q=>q[1]),f=a.map(q=>q[2]),mn=Math.min(...N),mx=Math.max(...N),mean=N.reduce((x,y)=>x+y)/N.length;let zc=[];for(let i=1;i<N.length;i++)if(N[i-1]<mean&&N[i]>=mean)zc.push(a[i][0]);
 const per=zc.length>1?(zc[zc.length-1]-zc[0])/(zc.length-1):NaN;return{mn,mx,mean,per,fmn:Math.min(...f),fmx:Math.max(...f)}}
const show=(nm,r)=>console.log(nm.padEnd(46),`N̄ ${r.mn.toFixed(0)}〜${r.mx.toFixed(0)}（幅 ${(r.mx-r.mn).toFixed(0)}，平均 ${r.mean.toFixed(0)}） rpm，周期 ${r.per.toFixed(2)} s，f_eff ${r.fmn.toFixed(3)}〜${r.fmx.toFixed(3)}`);
const A=process.argv[2]||'a';
if(A==='a'){for(const Tr of[35,50,70,100,140,200])show(`目標 3000，定格 ${Tr} N·m`,run({nt:3000,Tr}));
 for(const nt of[1500,2000,4000,5000])show(`目標 ${nt}，定格 200 N·m`,run({nt,Tr:200}));
 for(const nt of[2000,4000,5000])show(`目標 ${nt}，定格 35 N·m`,run({nt,Tr:35}))}
if(A==='b'){for(const [nm,o] of[['既定のゲイン',{}],['K_pd，K_id を 35/200 倍',{Kpd:1e-3*35/200,Kid:2e-3*35/200}],['K_pd，K_id を (35/200)(1500/3000)² 倍',{Kpd:1e-3*35/200/4,Kid:2e-3*35/200/4}],['K_id だけ 1/4',{Kid:.5e-3}],['K_pd だけ 4 倍',{Kpd:4e-3}],['τ_d 0.05 s',{td:.05}],['τ_N 0.05 s',{tN:.05}],['τ_d 0.05，τ_N 0.05',{td:.05,tN:.05}]])show('目標 3000，定格 200：'+nm,run({nt:3000,Tr:200,...o}))}
if(A==='c'){ // 線形の見積もり：s(s+a)(τd s+1)(τN s+1) + K(Kp s + Ki) = 0 の Routh の条件と，実際
 const Ns=[1000,1500,2000,2500,3000,3500,4000,4500,5000,5500],S=new Sweep({...mkP(),cvar:0},Ns,90,{crit:'strict',flow:true});while(!S.run(1e9));const Tb={};S.pts.forEach(p=>Tb[p.N]=p.tb);
 const P0=mkP(),It=K.I+P0.Id,td=P0.td,tN=P0.tN,Kp=P0.Kpd,Ki=P0.Kid;console.log(`I_tot ${It} kg·m²，τ_d ${td} s，τ_N ${tN} s，K_pd ${Kp} /rpm，K_id ${Ki} /(rpm·s)`);
 for(const [nt,Tr] of[[1500,35],[2000,35],[3000,35],[4000,35],[5000,35],[1500,200],[2000,200],[3000,200],[4000,200],[5000,200]]){const w=nt*PI/30,sl=(Tb[nt+500]-Tb[nt-500])/(1000*PI/30),a=(2*Tb[nt]/w-sl)/It,Kg=30/PI*Tr*(nt/P0.Nr)**2/It,
  a4=td*tN,a3=td+tN+a*td*tN,a2=1+a*(td+tN),a1=a+Kg*Kp,a0=Kg*Ki,ro=a3*a2*a1-a4*a1*a1-a3*a3*a0,
  // 限界の K：ro(K) = 0 の正の根
  f=Kx=>{const b1=a+Kx*Kp,b0=Kx*Ki;return a3*a2*b1-a4*b1*b1-a3*a3*b0};let lo=0,hi=1e6;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m}
  const r=run({nt,Tr});console.log(`目標 ${nt} rpm，定格 ${String(Tr).padStart(3)} N·m：T_b ${Tb[nt].toFixed(1)} N·m，dT_b/dω ${sl.toFixed(3)}，a ${a.toFixed(2)} 1/s，K ${Kg.toFixed(0)}，限界の K ${lo.toFixed(0)}（比 ${(Kg/lo).toFixed(2)}） → 見積もり ${ro>0?'安定':'不安定'}．実際：N̄ の幅 ${(r.mx-r.mn).toFixed(0)} rpm，周期 ${r.per.toFixed(2)} s`)}}
if(A==='d'){for(const [nm,o] of[['開度 15°，目標 2000，定格 35',{alm:15*D,nt:2000}],['開度 15°，目標 3000，定格 35',{alm:15*D,nt:3000}],['開度 30°，目標 3000，定格 35',{alm:30*D,nt:3000}],['開度 30°，目標 4000，定格 35',{alm:30*D,nt:4000}],['全開，目標 2500，定格 35',{nt:2500}],['全開，目標 2800，定格 35',{nt:2800}],['全開，目標 3000，定格 35，第42版の機関',{nt:3000,nv:1,dv:.038,dve:.032,Vm:3e-3,At:300e-6,dpx:4e3}],['全開，目標 3000，定格 200，第42版の機関',{nt:3000,Tr:200,nv:1,dv:.038,dve:.032,Vm:3e-3,At:300e-6,dpx:4e3}]])show(nm,run(o))}
