#!/usr/bin/env node
/* アイドルの回転数の制御（サイクルに同期した PI）のゲインを，サイクルごとの線形モデルで決める．
   モデル（偏差．k はサイクルの番号．u_k はサイクル k の終わり（吸気上死点）に置く開度）：
     T_k     = p T_{k-1} + (1 − p) k_α u_{k−2}             （step.js の応答：2 サイクル目に約半分，以後 比 p で近づく）
     N_{k+1} = a N_k + g ( (T_k + T_{k+1})/2 − d )          （g = (30/π) T_c / I_tot，a = 1 + g k_N，d：負荷の変化）
     e_k = −N_k，z_k = z_{k−1} + K_i e_k，u_k = K_p e_k + z_k
   負荷のステップ d に対する応答から，回転数の落ち込みの最大と，2 % に収まるまでのサイクル数を求め，格子の上で選ぶ．
   使い方： node experiments/startup/design.js [I_tot=0.17] */
'use strict';
const I=+process.argv[2]||.17,Tc=.15,g=30/Math.PI*Tc/I,kA=4.15,kN=-.0105,a=1+g*kN,p=.55,d=1;
function sim(Kp,Ki,n=200){const T=new Array(n+3).fill(0),N=new Array(n+3).fill(0),u=new Array(n+3).fill(0);let z=0,mx=0,last=0;
 for(let k=2;k<n;k++){T[k]=p*T[k-1]+(1-p)*kA*u[k-2];
  /* N_k は T_{k-1} と T_k で決まる */
  N[k]=a*N[k-1]+g*((T[k-1]+T[k])/2-d);
  const e=-N[k];z+=Ki*e;u[k]=Kp*e+z;
  if(Math.abs(N[k])>mx)mx=Math.abs(N[k]);if(!isFinite(N[k])||Math.abs(N[k])>1e6)return {mx:Infinity,ts:Infinity}}
 for(let k=n-1;k>=2;k--)if(Math.abs(N[k])>.02*mx){last=k;break}
 return {mx,ts:last-2,N}}
let best=null;
for(let Kp=0;Kp<=.05;Kp+=.0005)for(let Ki=.0002;Ki<=.02;Ki+=.0002){const r=sim(Kp,Ki);if(r.ts>=190)continue;const J=r.ts+.2*r.mx;if(!best||J<best.J)best={Kp,Ki,J,...r}}
console.log(`I_tot = ${I} kg·m²：g = ${g.toFixed(3)} rpm/(N·m·サイクル)，a = ${a.toFixed(4)}`);
console.log(`選んだゲイン：K_p = ${best.Kp.toFixed(4)} °/rpm，K_i = ${best.Ki.toFixed(4)} °/(rpm·サイクル)（${(best.Ki/Tc).toFixed(4)} °/(rpm·s)）`);
console.log(`負荷 1 N·m のステップ：落ち込みの最大 ${best.mx.toFixed(1)} rpm，2 % に収まるまで ${best.ts} サイクル`);
console.log('応答（サイクル 0〜20）：'+best.N.slice(2,23).map(v=>v.toFixed(1)).join(' '));
for(const [Kp,Ki] of [[.008,.0006]]){const r=sim(Kp,Ki);console.log(`参考：既定の ECU のゲイン相当（K_p = ${Kp}，K_i = ${Ki}/サイクル）：落ち込み ${r.mx.toFixed(1)} rpm，${r.ts} サイクル`)}
