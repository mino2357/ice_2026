#!/usr/bin/env node
/* EngineCore のヒープの割り当て（Node.js）：全開・3000 rpm 固定の定常で，1 ステップ・1 サイクルあたりに割り当てるバイト数と，その内訳（関数ごと）を測る．
   使い方： node --expose-gc --max-semi-space-size=64 tools/dev/alloc.js [サイクル数] ['{"gam":2,"inj":1}'] ['[["書き換える文字列","書き換えた後"]]']
   3 つ目の引数で，読み込む前にソースを書き換えて，割り当てを 1 つ外したときの差を測れる（成果物は変わらない）．
   (1) 合計：GC の起きない区間の heapUsed の増分（区間は 100 ステップ．GC が起きた区間は捨てる）．
   (2) 内訳：V8 の標本のヒーププロファイラ（HeapProfiler.startSampling．標本の間隔 64 バイト，GC で回収されたものも数える）で，割り当てた関数ごとのバイト数．
       core.js は new Function で読み込むので，行は「読み込んだソースの行」（= src/core.js の行 + 2）．
   要件定義書 7.2 節の 24（性能曲線の計測と GC）の推定を確かめるための道具（docs/report_alloc.md）． */
'use strict';
const inspector=require('inspector'),{PerformanceObserver}=require('perf_hooks');
const sub=process.argv[4]?JSON.parse(process.argv[4]):[];
const {mkP,Core,SWC,D,PI}=require('./node_core').load({sub}),n=+process.argv[2]||40,over=process.argv[3]?JSON.parse(process.argv[3]):{};
if(typeof gc!=='function'){console.log('--expose-gc を付けて実行する');process.exit(1)}
function mk(o){const N=3000,c=new Core(Object.assign(mkP(),{cvar:0,sauto:1,mode:1,alm:90*D,nt:N},o));c.fixw=1;c.fixTw=1;c.s.y[5]=SWC.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();while(c.s.cyc<8)c.step();return c}
let ngc=0;new PerformanceObserver(l=>{ngc+=l.getEntries().length}).observe({entryTypes:['gc']});
const tick=()=>new Promise(r=>setImmediate(r));
async function total(c){
 const W=[];let st=0,cy0=c.s.cyc;
 while(c.s.cyc<cy0+n){gc();await tick();await tick();const g0=ngc,h0=process.memoryUsage().heapUsed;for(let i=0;i<100;i++)c.step();const h1=process.memoryUsage().heapUsed,g1=ngc;await tick();await tick();st+=100;if(ngc===g0&&g1===g0&&h1>h0)W.push((h1-h0)/100)}
 W.sort((a,b)=>a-b);const cyc=c.s.cyc-cy0;
 return{perStep:W[W.length>>1],win:W.length,stepsPerCycle:st/cyc}}
function profile(c){
 const s=new inspector.Session();s.connect();
 return new Promise(res=>{s.post('HeapProfiler.enable',()=>s.post('HeapProfiler.startSampling',{samplingInterval:64,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true},()=>{
  const cy0=c.s.cyc;let st=0;while(c.s.cyc<cy0+n){c.step();st++}
  s.post('HeapProfiler.stopSampling',(e,r)=>{const by={};
   (function walk(nd){const f=nd.callFrame,k=(f.functionName||'(無名)')+':'+(f.lineNumber+1);by[k]=(by[k]||0)+nd.selfSize;(nd.children||[]).forEach(walk)})(r.profile.head);
   s.disconnect();res({by,st,cyc:c.s.cyc-cy0})})}))})}
(async()=>{
 for(const [nm,o] of (sub.length?[['化学平衡・直噴・BS3（既定）',{gam:2,inj:1,sol:2}]]:[['化学平衡・直噴・BS3（既定）',{gam:2,inj:1,sol:2}],['化学平衡・直噴・DOPRI5',{gam:2,inj:1,sol:1}],['γ(T)・BS3',{gam:0,sol:2}]])){
  const P=Object.assign({},o,over),t=await total(mk(P)),p=await profile(mk(P));
  console.log(`\n== ${nm}  1 サイクル ${t.stepsPerCycle.toFixed(0)} ステップ`);
  console.log(`合計（heapUsed の増分，GC の無い ${t.win} 区間の中央値）：${t.perStep.toFixed(0)} B/ステップ，${(t.perStep*t.stepsPerCycle/1e3).toFixed(1)} kB/サイクル`);
  const tot=Object.values(p.by).reduce((a,b)=>a+b,0);
  console.log(`内訳（標本のプロファイラ．合計 ${(tot/p.st).toFixed(0)} B/ステップ）：`);
  Object.entries(p.by).sort((a,b)=>b[1]-a[1]).filter(q=>q[1]/tot>.004).forEach(([k,v])=>console.log('  '+k.padEnd(28)+(v/p.st).toFixed(0).padStart(7)+' B/ステップ '+(100*v/tot).toFixed(1).padStart(5)+' %'))
 }
})();
