#!/usr/bin/env node
/* 調査 5：候補を 50 の運転点（回転数 10 × 開度 5）で確かめる．回転数固定，壁温固定，点火時期は今の既定（自動）で落ち着いた値に固定．
   使い方： node tools/solver/survey5.js [出力の JSON]
   参照解のサイクルごとの揺れ（最後の 10 サイクルの IMEP の幅／平均）が 2e-4 を超える点は，0.1% の比較ができないので「揺れ」と印を付けて集計から外す． */
'use strict';
const fs=require('fs'),L=require('./lib.js');
const E=L.load([
 ['E=Math.max(E,Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i]))))','{const e_=Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i])));E=Math.max(E,e_)}'],
 ['const fac=E===E?Math.min(2.5,Math.max(.2,','const pi_=globalThis.__PI?Math.pow(Math.max(globalThis.__EP||1,1e-4),globalThis.__PI):1;if(E<=1)globalThis.__EP=E;const fac=E===E?Math.min(2.5,Math.max(.2,pi_*']]);
const bs3=L.erk([null,[1/2],[0,3/4],[2/9,1/3,4/9]],[2/9,1/3,4/9,0],[7/24,1/4,1/3,1/8]),ssp43=L.erk([null,[1/2],[1/2,1/2],[1/6,1/6,1/6]],[1/6,1/6,1/6,1/2],[1/4,1/4,1/4,1/4]);
const NO={__CAP:1e9,__TC:1},CAND={
 '今':{g:{},o:{rtol:1e-5}},
 'A':{g:{...NO,__ST:bs3,__EX:-.7/3,__PI:.4/3},o:{rtol:3e-4},fsal:1},
 'B':{g:{...NO,__ST:bs3,__EX:-.7/3,__PI:.4/3},o:{rtol:1e-3},fsal:1},
 'C':{g:{...NO,__ST:ssp43,__EX:-1/3},o:{rtol:3e-4}},
 'D':{g:{__CAP:2,__TC:4e-3},o:{rtol:1e-5}}};
const go=(g,o,c,spa,nc)=>{L.set();delete globalThis.__PI;delete globalThis.__EP;Object.assign(globalThis,g);return L.run(E,c,o,spa,nc)};
const NS=[800,1000,1500,2000,2500,3000,4000,5000,6000,7000],AL=[6,10,20,40,90],out=[],t0=Date.now();
for(const N of NS)for(const al of AL){const c=['',N,al],spa=go({},null,c,null,80).spa,ref=go({__CAP:.125},{rtol:1e-8},c,spa,60);
 const im=ref.H.map(q=>q.imep),sw=(Math.max(...im)-Math.min(...im))/Math.abs(ref.M.imep),row={N,al,spa,imep:ref.M.imep,tb:ref.M.tb,pm:ref.M.pm,ev:ref.M.ev,sw,nfRef:ref.nf,c:{}};
 for(const [k,q] of Object.entries(CAND)){const r=go(q.g,q.o,c,spa,60),e={};for(const m of L.MET)e[m]=r.fin?r.M[m]/ref.M[m]-1:NaN;
  /* 軸トルクは 0 に近い点があるので，相対差の分母を max(|T_b|, 図示トルクの 5%) にする（図示トルク = IMEP·V_d/(4π) を tb と imep の比から求めず，参照解の |T_b| と 2 N·m の大きい方で代える） */
  e.tb=r.fin?(r.M.tb-ref.M.tb)/Math.max(Math.abs(ref.M.tb),2):NaN;
  row.c[k]={nf:r.nf,st:r.st,fs:q.fsal?r.nf-r.st:r.nf,e,mx:Math.max(...L.MET.map(m=>Math.abs(e[m]))),nfa:r.nfa,clp:r.clp,fin:r.fin}}
 out.push(row);
 console.log(String(N).padStart(5),String(al).padStart(3)+'°','IMEP',(row.imep/1e3).toFixed(0).padStart(5),'kPa T_b',row.tb.toFixed(1).padStart(6),sw>2e-4?'揺れ '+sw.toExponential(1):'             ',Object.entries(row.c).map(([k,v])=>k+' '+v.fs.toFixed(0).padStart(5)+' '+(v.mx*100).toFixed(3)+'%'+(v.nfa||v.clp?'※':'')).join(' | '))}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out));
const ok=out.filter(r=>r.sw<=2e-4);console.log('比べた点 '+ok.length+'／'+out.length+'（参照解が揺れる点を除く）．所要 '+((Date.now()-t0)/1e3).toFixed(0)+' s');
for(const k of Object.keys(CAND)){const v=ok.map(r=>r.c[k]),mx=Math.max(...v.map(x=>x.mx)),nb=v.filter(x=>!(x.mx<=1e-3)).length,sum=v.reduce((a,x)=>a+x.fs,0),s0=ok.reduce((a,r)=>a+r.c['今'].nf,0);
 console.log(k.padEnd(2),'誤差の最大',(mx*100).toFixed(3)+'%','0.1% を超える点',nb,' 回数の合計の比',(sum/s0).toFixed(3),' 強制受理/射影のあった点',v.filter(x=>x.nfa||x.clp).length)}
