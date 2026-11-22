#!/usr/bin/env node
/* バルブタイミングの探索（SPEC-32）の現状の調査（製品のコードは変えない）．
   (1) 乱数の種を変えて今の探索を繰り返し，結果の点と目的の値のばらつきを見る（種によらず同じ最適点に着くか）．
   (2) 標本と始点を増やした探索（参照）と比べる．
   (3) 最良の点を通る 1 変数の切り口（±40°，2° ごと．細かい許容）で，目的の関数の形（滑らかさ，山の数）を見る．
   使い方： node tools/vt/survey1.js [出力の JSON] */
'use strict';
const fs=require('fs'),NC=require('../dev/node_core');
const {Core,mkP,D,PI}=NC.load({}),X=NC.load({ret:'vtSearch,VTEval,VTOpt,OPT,VTK4'});
const {VTOpt,VTEval,OPT}=X;
/* 運転中の機関：動力計で回転数 N [rpm]，開度 al [°] に保ち，20 s 回す（テストのシナリオ S4 と同じ作り方） */
function mk(N,al){const c=new X.Core({...X.mkP(),cvar:0,mode:1,nt:N,alm:al*X.D});c.start();c.run(20);return c}
const run=(c,obj,O)=>{const o=new VTOpt(c,obj,O),t=Date.now();while(!o.run(1e4));const R=o.R;return{x:R.x,J:R.J,J0:R.J0,ne:R.ne,nu:o.E.nu,t:(Date.now()-t)/1e3,st:R.hist.reduce((a,h)=>(a[h.stage]=(a[h.stage]||0)+1,a),{})}};
const f=(J,obj)=>obj?(J*100).toFixed(3)+'%':J.toFixed(3)+' N·m',out=[];
const CASES=[['S4（1500 rpm，開度 15°）',1500,15,0],['S4（1500 rpm，開度 15°）',1500,15,1],['全開 4000 rpm',4000,90,0]];
for(const [nm,N,al,obj] of CASES){
 const c=mk(N,al);
 console.log('\n━━ '+nm+'，目的：'+(obj?'正味熱効率':'軸トルク')+'　実際の回転数 '+c.s.Nb.toFixed(0)+' rpm');
 const rs=[];
 for(const seed of[OPT.seed,1,2,3,4,5]){
  const r=run(c,obj,{...OPT,seed});rs.push(r);
  console.log('  種 '+String(seed).padEnd(9),'x* =',r.x.join(', ').padEnd(20),'J* =',f(r.J,obj),'（前 '+f(r.J0,obj)+'）','評価',r.ne,JSON.stringify(r.st),'未整定',r.nu,r.t.toFixed(1)+' s')
 }
 const ref=run(c,obj,{...OPT,nmc:[64,32],ns:4,nmax:1500,seed:99});
 console.log('  参照（標本 96，始点 4）','x* =',ref.x.join(', ').padEnd(20),'J* =',f(ref.J,obj),'評価',ref.ne,ref.t.toFixed(1)+' s');
 const all=[...rs,ref],b=all.reduce((a,r)=>r.J>a.J?r:a);
 console.log('  種ごとの J* の幅：',f(Math.max(...rs.map(r=>r.J))-Math.min(...rs.map(r=>r.J)),obj),'，最良との差（既定の種）：',f(b.J-rs[0].J,obj));
 /* 切り口 */
 const E=new VTEval(c,obj,OPT),cut={};
 const ev=x=>{if(!(x[1]-x[0]>=1&&x[3]-x[2]>=1)||!E.feas(x))return NaN;E.start(x,'fine');while(!E.run(1e4));return E.J};
 ['IVO','IVC','EVO','EVC'].forEach((k,i)=>{const v=[];for(let d=-40;d<=40;d+=2){const x=b.x.slice();x[i]+=d;v.push(ev(x))}cut[k]=v;
  const m=Math.max(...v.filter(q=>q===q)),loc=v.map((q,j)=>j>0&&j<v.length-1&&q>v[j-1]&&q>v[j+1]?(-40+2*j):null).filter(q=>q!==null);
  console.log('  切り口 '+k+'（−40〜+40°）：最大との差 [%]',v.map(q=>q===q?((q-m)/Math.abs(m)*100).toFixed(1):'×').join(' '),'　極大の位置',loc.join(', '))});
 out.push({nm,N,al,obj,rs,ref,best:b,cut})
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out));
