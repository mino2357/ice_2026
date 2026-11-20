#!/usr/bin/env node
/* 熱効率の損失の内訳（SPEC-33）を Node.js で計算する．
   使い方： node tools/dev/lossbk.js ['{"mode":1,"nt":1500,"alm":15}']（alm は °．始動から 20 s 運転した状態で計算） */
'use strict';
const {mkP,Core,D,LossBk}=require('./node_core').load({ret:'LossBk'}),o=JSON.parse(process.argv[2]||'{"mode":1,"nt":1500,"alm":15}');
if(o.alm!=null)o.alm*=D;const c=new Core({...mkP(),cvar:0,...o});c.start();while(c.s.t<20)c.step();
const t0=Date.now(),L=new LossBk(c);while(!L.run(1e9));const r=L.res,f=v=>(v*100).toFixed(2);if(!r.ok){console.log(r.why);process.exit(1)}
console.log(`N̄ ${r.N.toFixed(0)} rpm，開度 ${(r.al/D).toFixed(1)}°，ε ${r.eps}，計算 ${Date.now()-t0} ms`);
console.log(`理論（オットー） ${f(r.eO)} %`);for(const [n,v] of r.L)console.log(`  − ${n}：${f(v)} %pt`);console.log(`正味の図示熱効率 ${f(r.ei)} %（機関の η_i ${f(r.eiM)} %）`);if(r.HB){console.log('熱勘定 [J]（Q_f に対する %）');for(const [n,k,v] of r.HB)console.log(`  ${k==='t'?'＝':'−'} ${n}：${v.toFixed(1)}（${f(v/r.Qf)}）`);console.log(`  吸気行程の受熱 ${r.qin.toFixed(2)} J，圧縮〜膨張の放熱 ${r.qout.toFixed(1)} J，排気ポート ${r.hb.Qpw.toFixed(1)} J，排気温度 ${r.Tx.toFixed(0)} K，壁温 ${r.Tw} K`)}
console.log(`段：A ${f(r.eA)}，FA ${f(r.eFA)}，t ${f(r.et)}，h ${f(r.eh)}，ig ${f(r.eig)} %．等容度 ${r.glh.toFixed(3)}，CA50 ${r.ca50.toFixed(1)}°`);
console.log(`和の差 ${(r.eO-r.L.reduce((s,q)=>s+q[1],0)-r.ei).toExponential(2)}，EVO の筒内圧：実際 ${(r.pE/1e3).toFixed(4)} kPa，段 h ${(r.pEh/1e3).toFixed(4)} kPa（相対 ${(r.pEh/r.pE-1).toExponential(2)}）`);
