#!/usr/bin/env node
/* バルブタイミングの探索（SPEC-32）を Node.js で実行する．
   使い方： node tools/dev/vtopt.js ['{"mode":1,"nt":1500,"alm":15}'] [目的 0：軸トルク，1：正味熱効率]
   設定の上書き（alm は °）で始動から 20 s 運転し，その状態から探索する．結果の 8 近傍も別の評価器で確かめる． */
'use strict';
const {mkP,Core,D,PI,VTOpt,VTEval,OPT,VTK4}=require('./node_core').load({ret:'VTOpt,VTEval,OPT,VTK4'}),o=JSON.parse(process.argv[2]||'{"mode":1,"nt":1500,"alm":15}'),obj=+process.argv[3]||0;
if(o.alm!=null)o.alm*=D;const c=new Core({...mkP(),cvar:0,...o});c.start();while(c.s.t<20)c.step();
const t0=Date.now(),op=new VTOpt(c,obj);while(!op.run(1e9));const R=op.R,dt=(Date.now()-t0)/1e3,un=op.E.nu;
console.log(`運転：N̄ ${c.s.Nb.toFixed(0)} rpm，開度 ${(c.s.al/D).toFixed(1)}°．目的 ${obj?'正味熱効率':'軸トルク'}`);
console.log(`探索の前 ${R.x0.join('，')}° → J ${R.J0.toFixed(5)}`);console.log(`結果     ${R.x.join('，')}° → J ${R.J.toFixed(5)}（${((R.J/R.J0-1)*100).toFixed(2)} %）`);
const st={};R.hist.forEach(h=>st[h.stage]=(st[h.stage]||0)+1);console.log(`評価 ${R.ne} 回（${Object.entries(st).map(([k,v])=>k+' '+v).join('，')}），判定を満たさない ${un} 回，${dt.toFixed(1)} s，1° の局所最大 ${R.local}`);
const E=new VTEval(c,obj),nb=[];for(let i=0;i<4;i++)for(const s of[1,-1]){const x=R.x.slice();x[i]+=s;if(!E.feas(x)){nb.push('×');continue}E.start(x,'fine');while(!E.run(1e9));nb.push((E.J-R.J).toExponential(2))}
console.log('8 近傍の J − J*（別の評価器）：',nb.join('，'));
