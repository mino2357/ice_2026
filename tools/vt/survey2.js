#!/usr/bin/env node
/* バルブタイミングの探索：今の方法（vtSearch）と，2 次のモデルを使う信頼領域法（tools/vt/quad.js の試作）を，同じ場合・同じ種で比べる．
   使い方： node tools/vt/survey2.js [出力の JSON] */
'use strict';
const fs=require('fs'),NC=require('../dev/node_core'),{vtQuad}=require('./quad');
const X=NC.load({ret:'vtSearch,VTEval,OPT,VTK4,mb32,vtOk'}),{VTEval,OPT,vtSearch,mb32,vtOk,D}=X;
function mk(N,al){const c=new X.Core({...X.mkP(),cvar:0,mode:1,nt:N,alm:al*D});c.start();c.run(20);return c}
function drive(c,obj,mkGen){
 const E=new VTEval(c,obj,OPT),x0=X.VTK4.map(k=>Math.round(c.P[k]/D)),g=mkGen(x0,x=>E.feas(x)),t=Date.now();
 let r=g.next(),cy=0;
 while(!r.done){E.start(r.value.x,r.value.cls);while(!E.run(1e4));cy+=E.h.length;r=g.next(E.J)}
 const R=r.value;
 return{x:R.x,J:R.J,J0:R.J0,ne:R.ne,nst:R.nst,mg:R.merged||0,cy,nu:E.nu,t:(Date.now()-t)/1e3,st:R.hist.reduce((a,h)=>(a[h.stage]=(a[h.stage]||0)+1,a),{}),sens:R.sens,np:R.path&&R.path.length,stop:R.stop}
}
const QO={nmc:OPT.nmc,sd:OPT.sd,nmax:400,d0:8,dmax:32,nit:60,eps:1e-4,ns:2,sep:8,sep2:16,rs:false,rnd:mb32};
/* --reuse：今の方法の結果は，前に保存した JSON のものを使う（同じ場合・同じ種．計算は決定的） */
const OLD=process.argv.includes('--reuse')&&fs.existsSync(process.argv[2])?JSON.parse(fs.readFileSync(process.argv[2])):null;
const f=(J,obj)=>obj?(J*100).toFixed(3)+'%':J.toFixed(3),out=[];
const CASES=[['S4（1500 rpm，15°）',1500,15,0],['S4（1500 rpm，15°）',1500,15,1],['全開 4000 rpm',4000,90,0],['全開 4000 rpm',4000,90,1],['全開 6500 rpm',6500,90,0],['3000 rpm，25°',3000,25,1]];
const seeds=[OPT.seed,1,2,3,4,5];
for(const [ci,[nm,N,al,obj]] of CASES.entries()){
 const c=mk(N,al),row={nm,N,al,obj,a:[],b:[]};
 console.log('\n━━ '+nm+'，'+(obj?'正味熱効率':'軸トルク'));
 for(const seed of seeds){
  const a=OLD?OLD[ci].a[seeds.indexOf(seed)]:drive(c,obj,(x0,fe)=>vtSearch(x0,fe,{...OPT,seed})),b=drive(c,obj,(x0,fe)=>vtQuad(x0,x=>vtOk(x)&&fe(x),{...QO,seed}));
  row.a.push(a);row.b.push(b);
  console.log('  種',String(seed).padEnd(9),'今：',a.x.join(',').padEnd(17),f(a.J,obj).padStart(8),'評価',String(a.ne).padStart(3),'サイクル',String(a.cy).padStart(5),(a.t.toFixed(1)+' s').padStart(7),a.stop?'上限':'    ','│ 2 次：',b.x.join(',').padEnd(17),f(b.J,obj).padStart(8),'評価',String(b.ne).padStart(3),JSON.stringify(b.st),'サイクル',String(b.cy).padStart(5),(b.t.toFixed(1)+' s').padStart(7),b.stop?'上限':'','始点',b.nst,'合流',b.mg,'±'+(b.sens||[]).map(v=>v.toFixed(0)).join('/'))
 }
 const m=k=>row[k].reduce((s,r)=>s+r.ne,0)/seeds.length,best=Math.max(...row.a.map(r=>r.J),...row.b.map(r=>r.J)),gap=k=>Math.max(...row[k].map(r=>(best-r.J)/Math.abs(best)*100));
 console.log('  平均の評価：今',m('a').toFixed(0),'→ 2 次',m('b').toFixed(0),'（',(m('b')/m('a')).toFixed(2),'倍）　最良からの差の最大：今',gap('a').toFixed(3)+'%','2 次',gap('b').toFixed(3)+'%');
 out.push(row)
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out));
