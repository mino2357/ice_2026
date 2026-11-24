#!/usr/bin/env node
/* 全項目を n 個に分けて，run.js を同時に n 本実行する（段階 1 の全項目を速くするため．docs/report_testtime.md）．
   使い方： node tools/dev/shard.js [--n 4] [run.js に渡す引数...]
   分け方：tools/dev/times.json のテストごとの所要時間（無いテストは 1 s とする）で，長い順に，合計が最も小さい組へ入れる．
   どの組も TEST-20（全テストの実行の確認）の対象を自分の組に限る（--only）ので，全部の組を合わせて 1〜37 がそろうことをここで確かめる．
   性能の記録は，同時に走らせると遅くなるので，ここでは判定しない（--noperf を付ける．段階 2 は 1 本で実行する）．
   終了コード：どれかの組が FAIL（終了コードが 0 でない）なら 1． */
'use strict';
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'../..'),A=process.argv.slice(2);
let n=Math.max(1,Math.min(4,Math.floor(os.cpus().length/2)));
const i=A.indexOf('--n');if(i>=0){n=+A[i+1];A.splice(i,2)}
const NT=37,T=(()=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,'times.json'),'utf8')).t}catch(e){return{}}})();
const ids=Array.from({length:NT},(_,k)=>k+1),bins=Array.from({length:n},()=>({s:0,ids:[]}));
for(const id of ids.slice().sort((a,b)=>(T[b]??1)-(T[a]??1))){const b=bins.reduce((x,y)=>y.s<x.s?y:x);b.s+=T[id]??1;b.ids.push(id)}
const all=new Set(bins.flatMap(b=>b.ids));
if(all.size!==NT){console.log('分け方の誤り：1〜'+NT+' がそろわない');process.exit(1)}
const args=A.includes('--noperf')?A:[...A,'--noperf'],t0=Date.now();
console.log('全項目を '+n+' 組に分けて同時に実行する（見込み：'+bins.map(b=>Math.round(b.s)+' s').join('，')+'）');
const runs=bins.map((b,k)=>new Promise(res=>{
 const ch=spawn('node',[path.join(__dirname,'run.js'),...args,'--only',b.ids.sort((x,y)=>x-y).join(',')],{cwd:root});
 let out='';
 ch.stdout.on('data',d=>out+=d);ch.stderr.on('data',d=>out+=d);
 ch.on('close',code=>res({k,code,out,ids:b.ids}))
}));
Promise.all(runs).then(R=>{
 let bad=0,nck=0,nf=0;
 for(const r of R){
  const head=(r.out.match(/^\d+x\d+ .*$/m)||[''])[0],m=head.match(/検証項目 (\d+) 件中 FAIL (\d+) 件/);
  if(m){nck+=+m[1];nf+=+m[2]}
  console.log('── 組 '+(r.k+1)+'（TEST-'+r.ids.join('，')+'）終了コード '+r.code);
  console.log(r.out.trim().split('\n').filter(l=>!/^\s+(ok|性能)\s/.test(l)).join('\n'));
  if(r.code!==0||!m)bad++
 }
 console.log('合計：検証項目 '+nck+' 件中 FAIL '+nf+' 件，組の失敗 '+bad+'，所要 '+((Date.now()-t0)/1e3).toFixed(0)+' s');
 process.exit(bad||nf?1:0)
});
