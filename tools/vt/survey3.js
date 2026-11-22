#!/usr/bin/env node
/* 製品の探索器（src/core.js の vtQuad，VTOpt）が，試作（tools/vt/quad.js）と同じ結果を出すことの確認と，図の案のための記録．
   使い方： node tools/vt/survey3.js [記録の JSON] */
'use strict';
const fs=require('fs'),NC=require('../dev/node_core');
const X=NC.load({ret:'vtQuad,VTOpt,VTEval,OPT,VTK4,vtOk'}),{VTOpt,OPT,D}=X;
function mk(N,al){const c=new X.Core({...X.mkP(),cvar:0,mode:1,nt:N,alm:al*D});c.start();c.run(20);return c}
const out=[];
for(const [nm,N,al,obj] of[['S4（1500 rpm，15°）',1500,15,0],['全開 4000 rpm',4000,90,0],['3000 rpm，25°',3000,25,1]]){
 const c=mk(N,al),o=new VTOpt(c,obj),t=Date.now();
 while(!o.run(1e4));
 const R=o.R;
 console.log(nm,obj?'η_b':'T_b','x* =',R.x.join(','),'J* =',R.J.toFixed(4),'J0 =',R.J0.toFixed(4),'評価',R.ne,'始点',R.nst,'合流',R.mg,'経路',R.path.length,((Date.now()-t)/1e3).toFixed(1)+' s');
 out.push({nm,N,al,obj,x0:R.x0,x:R.x,J:R.J,J0:R.J0,hist:R.hist,path:R.path})
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out));
