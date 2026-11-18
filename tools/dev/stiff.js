#!/usr/bin/env node
/* 系の硬さ（Node.js）：定常のサイクルに沿って，右辺のヤコビアンの固有値の絶対値の最大 max|λ| を調べる（SPEC-13「系の硬さと刻みの上限」，TEST-13 項目 10 と同じ求め方：
   中心差分のヤコビアンに冪乗法を 60 回）．RK4 の実軸上の安定限界は |λ|Δt ≤ 2.79．
   使い方： node tools/dev/stiff.js [刻み（°，既定 5）] ['[{"名前":{設定の上書き（内部値）}}, …]']
   既定では，アイドル，全開 1000・3000・5000 rpm（回転数固定），2000 rpm 部分負荷を，既定の機関（4 弁，排気管は大気開放）と，第42版の機関（弁 1 個ずつ 38／32 mm，消音器 3 L と出口 300 mm²）で調べる．
   設定の上書きに fixN（rpm）を書くと，その回転数に固定する． */
'use strict';
const {mkP,Core,K,D,PI}=require('./node_core').load(),dg=+process.argv[2]||5,
 W=n=>({mode:1,alm:PI/2,fixN:n}),old={nv:1,dv:.038,dve:.032,Vm:3e-3,At:300e-6,dpx:4e3},
 CF=process.argv[3]?JSON.parse(process.argv[3]):[{'アイドル':{}},{'全開 1000 rpm（回転数固定）':W(1000)},{'全開 3000 rpm（回転数固定）':W(3000)},{'全開 5000 rpm（回転数固定）':W(5000)},{'2000 rpm 部分負荷（開度 15°，動力計制御）':{mode:1,alm:15*D,nt:2000}},
  {'アイドル（第42版の機関）':old},{'全開 1000 rpm（回転数固定，第42版の機関）':{...W(1000),...old}},{'全開 3000 rpm（回転数固定，第42版の機関）':{...W(3000),...old}},{'2000 rpm 部分負荷（第42版の機関）':{mode:1,alm:15*D,nt:2000,...old}}],
 IX=[0,1,2,3,4,5,6,7,8,9,10,13,14,15,16,17],HS=[1e-7,1e-4,1,1e-10,1e-10,1e-4,1,1e-11,1e-7,1,1e-11,0,0,1e-7,1,1,1e-6,1e-6],n=IX.length;
console.log(`Δt_max（RK4）= ${K.dtR4} s，既定の刻み 0.25°．${dg}° ごと`);
for(const o of CF){const nm=Object.keys(o)[0],ov={...o[nm]},fN=ov.fixN;delete ov.fixN;const q=new Core({...mkP(),cvar:0,...ov});if(fN){q.fixw=1;q.s.y[1]=fN*PI/30;q.s.Nb=fN}q.start();if(fN){while(q.s.cyc<40)q.step()}else while(q.s.t<12)q.step();
 let lm=0,la=0,next=0;const c0=q.s.cyc;while(q.s.cyc===c0){const y=q.s.y,a=y[0]/D;if(a>=next){next=Math.floor(a/dg)*dg+dg;q.wx=0;const J=[];for(const i of IX){const h=Math.max(Math.abs(y[i])*1e-6,HS[i]),yp=y.slice(),ym=y.slice();yp[i]+=h;ym[i]-=h;const fp=q.f(yp),fm=q.f(ym);J.push(IX.map(r=>(fp[r]-fm[r])/(2*h)))}
   let v=new Array(n).fill(1),lam=0;for(let it=0;it<60;it++){const u=new Array(n).fill(0);for(let b=0;b<n;b++)for(let r=0;r<n;r++)u[r]+=J[b][r]*v[b];lam=Math.hypot(...u)/Math.hypot(...v);const nu=Math.hypot(...u)||1;v=u.map(x=>x/nu)}if(lam>lm){lm=lam;la=a}q.wx=1}q.step()}
 const om=q.s.y[1],dt=Math.min(.25*D/om,K.dtR4);console.log(`${nm}：N̄ ${q.s.Nb.toFixed(0)} rpm，max|λ| ${lm.toExponential(2)} 1/s（${la.toFixed(0)}°），|λ|Δt_max ${(lm*K.dtR4).toFixed(2)}，既定の刻みでの |λ|Δt ${(lm*dt).toFixed(2)}（Δt ${dt.toExponential(2)} s）`)}
