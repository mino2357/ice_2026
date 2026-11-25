#!/usr/bin/env node
/* 検証で使う MathJax 3.2.2（es5/tex-svg.js）を用意する．リポジトリには置かない（仕様書 9 節）．
   はじめての実行で cdnjs から取り寄せ，成果物の SRI（src/doc.js の MJX.sri．sha512）と一致したものだけを
   ~/.cache/ice_2026/mathjax-3.2.2/es5/ に置く．次からはそれを使う（毎回 SRI と照合する）．
   環境変数 MATHJAX で別の場所（es5 のディレクトリ）を指定できる（そのときも照合する）．
   使い方：const dir=await require('./mathjax.js').ensure()   コマンドとして実行すると用意して場所を表示する */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),https=require('https'),crypto=require('crypto');
const URL='https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js',
 DIR=process.env.MATHJAX||path.join(os.homedir(),'.cache','ice_2026','mathjax-3.2.2','es5');
/* 成果物が要求する SRI（integrity の値） */
const sri=()=>{const m=fs.readFileSync(path.resolve(__dirname,'../../src/doc.js'),'utf8').match(/sri:'(sha512-[A-Za-z0-9+/=]+)'/);if(!m)throw new Error('src/doc.js に MJX.sri が見つからない');return m[1]};
const sum=b=>'sha512-'+crypto.createHash('sha512').update(b).digest('base64');
const get=u=>new Promise((res,rej)=>{https.get(u,{headers:{'User-Agent':'ice-sim-dev'}},r=>{if(r.statusCode!==200){r.resume();return rej(new Error('取り寄せに失敗：HTTP '+r.statusCode+' '+u))}const a=[];r.on('data',d=>a.push(d));r.on('end',()=>res(Buffer.concat(a)))}).on('error',rej)});
async function ensure(){
 const want=sri(),f=path.join(DIR,'tex-svg.js');
 if(fs.existsSync(f)){
  const s=sum(fs.readFileSync(f));
  if(s===want)return DIR;
  if(process.env.MATHJAX)throw new Error('MATHJAX の tex-svg.js が成果物の SRI と一致しない：'+s);
 }
 const b=await get(URL),s=sum(b);
 if(s!==want)throw new Error('cdnjs から取り寄せた tex-svg.js が成果物の SRI と一致しない：'+s+'（期待 '+want+'）');
 fs.mkdirSync(DIR,{recursive:true});
 const tmp=f+'.'+process.pid+'.part';/* 組に分けて同時に実行するとき，同時に取り寄せても互いに壊さない */
 fs.writeFileSync(tmp,b);
 fs.renameSync(tmp,f);
 return DIR
}
exports.ensure=ensure;
exports.URL=URL;
if(require.main===module)ensure().then(d=>console.log('MathJax 3.2.2：'+d+'（SRI 一致）'),e=>{console.log(e.message);process.exit(1)});
