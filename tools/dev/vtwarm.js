#!/usr/bin/env node
/* バルブタイミングの探索（SPEC-32）の評価の「前の評価の状態から始める」（VTEval.start の warm）が，値にどれだけ効くかを測る（Node.js）．
   使い方： node tools/dev/vtwarm.js ['{"mode":1,"nt":1500,"alm":15}'] [目的 0：軸トルク，1：正味熱効率]
   探索を 1 回実行し，細かい許容で評価した点のそれぞれを，別の評価器で「探索の前の状態から」（warm なし）評価し直して，探索の中の値（warm あり）と比べる．
   2 つ目の始点の最初の評価（前の評価は 1 つ目の探索の最後の点で，遠い）は別に示す．外部のレビューの M-3 の 4（docs/changes/2026-11-23-review-gemini-4.md）． */
'use strict';
const {mkP,Core,D,VTOpt,VTEval}=require('./node_core').load({ret:'VTOpt,VTEval'}),o=JSON.parse(process.argv[2]||'{"mode":1,"nt":1500,"alm":15}'),obj=+process.argv[3]||0;
if(o.alm!=null)o.alm*=D;const c=new Core({...mkP(),cvar:0,...o});c.start();while(c.s.t<20)c.step();
const op=new VTOpt(c,obj);while(!op.run(1e9));const R=op.R,E=new VTEval(c,obj);
const fine=R.hist.filter(h=>h.stage!=='mc'&&h.J>-Infinity),dist=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
let prev=null,mx=0,sum=0,n=0,first2=null;const big=[];
for(const h of fine){E.start(h.x,'fine',false);while(!E.run(1e9));const d=Math.abs(E.J-h.J)/Math.abs(R.J),far=prev?dist(prev,h.x):0;
 if(h.k===2&&!first2)first2={x:h.x,warm:h.J,cold:E.J,d,far};
 mx=Math.max(mx,d);sum+=d;n++;if(d>1e-4)big.push(`${h.x.join(',')}（前の点から ${far}°）：${(d*100).toFixed(4)} %`);prev=h.x}
console.log(`運転：N̄ ${c.s.Nb.toFixed(0)} rpm，開度 ${(c.s.al/D).toFixed(1)}°，目的 ${obj?'正味熱効率':'軸トルク'}．結果 ${R.x.join('，')}° J ${R.J.toFixed(5)}，始点 ${R.nst} つ，評価 ${R.ne} 回`);
console.log(`細かい許容の ${n} 点：|J(warm) − J(cold)|/|J*| の最大 ${(mx*100).toFixed(4)} %，平均 ${(sum/n*100).toFixed(4)} %，0.01 % を超えた点 ${big.length}`);big.slice(0,8).forEach(l=>console.log('  '+l));
console.log(first2?`2 つ目の始点の最初の評価 ${first2.x.join('，')}°（前の評価の点から ${first2.far}°）：warm ${first2.warm.toFixed(5)}，cold ${first2.cold.toFixed(5)}，差 ${(first2.d*100).toFixed(4)} %`:'2 つ目の始点は無かった');
