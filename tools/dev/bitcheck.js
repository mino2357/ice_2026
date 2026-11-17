#!/usr/bin/env node
/* γ(T) の計算経路が第25版（commit 1ef8ff1）とビット単位で同じ結果を返すことの確認（CLAUDE.md「設計上の注意」，TEST-29 項目 8）．
   使い方： node tools/dev/bitcheck.js [--chromium] [--ref コミット]
   S2 と同じ手順（始動から 5 s，複製して 15 s．サイクル変動 OFF，熱物性 γ(T)）を両方のコアで走らせ，
   IMEP，回転数，サイクル数，状態（添字 0〜17）の MD5 を比べる．--chromium を付けるとヘッドレス Chromium でも比べる
   （JavaScript の処理系が違うと数学関数の丸めが違うので，処理系ごとに比べる）．排気弁径は第25版の値（吸気弁径 38 mm の 0.9375 倍）にする（第26版で設定項目になり，既定は 32 mm）． */
'use strict';
const {execSync}=require('child_process'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const A=process.argv.slice(2),ref=A.includes('--ref')?A[A.indexOf('--ref')+1]:'1ef8ff1',root=path.resolve(__dirname,'../..');
const cur=fs.readFileSync(path.join(root,'src/core.js'),'utf8'),old=execSync('git show '+ref+':src/core.js',{cwd:root,maxBuffer:1<<26}).toString();
const body=`const {mkP,Core}=new Function(src+';return {mkP,Core}')();let c=new Core({...mkP(),cvar:0,gam:0,dve:.038*.9375});c.start();let t1=c.s.t+5;while(c.s.t<t1)c.step();c=c.clone();t1=c.s.t+15;while(c.s.t<t1)c.step();return [c.lastM.imep,c.lastM.N,c.s.cyc,Array.from(c.s.y).slice(0,18).join()]`;
const show=(nm,r)=>{const h=crypto.createHash('md5').update(r[3]).digest('hex');console.log('  '+nm.padEnd(10),'IMEP',r[0],'N',r[1],'サイクル',r[2],'状態の MD5',h);return r[0]+'|'+r[1]+'|'+r[2]+'|'+h};
(async()=>{let bad=0;{console.log('Node.js '+process.version);const f=new Function('src',body);if(show('現在',f(cur))!==show(ref,f(old)))bad++}
if(A.includes('--chromium')){const {chromium}=require('playwright'),b=await chromium.launch(),p=await b.newPage();console.log('Chromium '+b.version());const run=src=>p.evaluate(([src,body])=>new Function('src',body)(src),[src,body]);if(show('現在',await run(cur))!==show(ref,await run(old)))bad++;await b.close()}
console.log(bad?'不一致':'ビット単位で一致');process.exit(bad?1:0)})();
