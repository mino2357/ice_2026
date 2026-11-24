#!/usr/bin/env node
/* γ(T) の計算経路が第25版（commit 1ef8ff1）とビット単位で同じ結果を返すことの確認（CLAUDE.md「設計上の注意」，TEST-29 項目 8）．
   使い方： node tools/dev/bitcheck.js [--chromium] [--ref コミット]
   基準のコードには，θ をイベントの角度に揃える変更と，下死点（π，3π）をイベントにする変更（どちらも REQ-13 の 3．関数 fix）だけを当ててから比べる．
   S2 と同じ手順（始動から 5 s，複製して 15 s．サイクル変動 OFF，熱物性 γ(T)）を両方のコアで走らせ，
   IMEP，回転数，サイクル数，状態（添字 0〜17）の MD5 を比べる．--chromium を付けるとヘッドレス Chromium でも比べる
   （JavaScript の処理系が違うと数学関数の丸めが違うので，処理系ごとに比べる）．弁は第25版と同じ 1 個ずつ（内部の値 nv = 1），吸気弁径 38 mm，排気弁径はその 0.9375 倍，排気系は消音器 3 L と出口 300 mm²（内部の値 Vm，At），排気圧損 4 kPa にする（第26版で機関は 4 弁，排気管は大気開放になり，弁径は設定項目になった）．
   あわせて，設定で DOPRI5 を選んだときの機関（熱物性 γ(T)．化学平衡は吸気ポートの空気の質量の扱い（REQ-25 の 6）を直したので第26版と比べない）が，解法 BS3 を加える前の第26版（commit 93f480b）とビット単位で同じことも比べる（REQ-13 の 15，TEST-13 項目 20）：
   スロットル制御の始動から 5 s，複製して 5 s と，動力計制御・全開・目標 3000 rpm の始動から 2 s．状態は全成分の MD5． */
'use strict';
const {execSync}=require('child_process'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const A=process.argv.slice(2),ref=A.includes('--ref')?A[A.indexOf('--ref')+1]:'1ef8ff1',root=path.resolve(__dirname,'../..');
/* 基準のコードには，計算を変えると決めた変更だけを当てる（REQ-13 の 3：イベントの後の θ をイベントの角度に揃える．下死点 π，3π もイベントにする）．当てる所がちょうど 1 つずつ無ければ止める */
const fix=src=>{const R=[['y1[0]-=P4}','y1[0]=0}'],['this.doEv(y1,ea)','y1[0]=ea;this.doEv(y1,ea)'],['this.ea=a;','if(PI>lo&&PI<a)a=PI;x=3*PI;if(x>lo&&x<a)a=x;this.ea=a;']];for(const [a,b] of R){if(src.split(a).length!==2)throw new Error('基準のコードに当てる所が無い：'+a);src=src.replace(a,b)}return src};
const cur=fs.readFileSync(path.join(root,'src/core.js'),'utf8'),old=fix(execSync('git show '+ref+':src/core.js',{cwd:root,maxBuffer:1<<26}).toString());
const body=`const {mkP,Core}=new Function(src+';return {mkP,Core}')();let c=new Core({...mkP(),sol:1,cvar:0,mode:0,gam:0,nv:1,dv:.038,dve:.038*.9375,Vm:3e-3,At:300e-6,dpx:4e3});c.start();let t1=c.s.t+5;while(c.s.t<t1)c.step();c=c.clone();t1=c.s.t+15;while(c.s.t<t1)c.step();return [c.lastM.imep,c.lastM.N,c.s.cyc,Array.from(c.s.y).slice(0,18).join()]`;
const body26=`const {mkP,Core}=new Function(src+';return {mkP,Core}')();let c=new Core({...mkP(),sol:1,cvar:0,mode:0,gam:0});c.start();let t1=c.s.t+5;while(c.s.t<t1)c.step();c=c.clone();t1=c.s.t+5;while(c.s.t<t1)c.step();const d=new Core({...mkP(),sol:1,cvar:0,mode:1,alm:Math.PI/2,nt:3000,gam:0});d.start();t1=d.s.t+2;while(d.s.t<t1)d.step();return [c.lastM.imep,d.lastM.imep,c.s.cyc+d.s.cyc,Array.from(c.s.y).join()+Array.from(d.s.y).join()]`,ref26='93f480b',old26=fix(execSync('git show '+ref26+':src/core.js',{cwd:root,maxBuffer:1<<26}).toString());
const show=(nm,r)=>{const h=crypto.createHash('md5').update(r[3]).digest('hex');console.log('  '+nm.padEnd(10),'IMEP',r[0],'N',r[1],'サイクル',r[2],'状態の MD5',h);return r[0]+'|'+r[1]+'|'+r[2]+'|'+h};
(async()=>{let bad=0;{console.log('Node.js '+process.version);const f=new Function('src',body);if(show('現在',f(cur))!==show(ref,f(old)))bad++;const g=new Function('src',body26);if(show('現在 DOPRI5',g(cur))!==show(ref26,g(old26)))bad++}
if(A.includes('--chromium')){const {chromium}=require('playwright'),b=await chromium.launch(),p=await b.newPage();console.log('Chromium '+b.version());const run=src=>p.evaluate(([src,body])=>new Function('src',body)(src),[src,body]);if(show('現在',await run(cur))!==show(ref,await run(old)))bad++;const run26=src=>p.evaluate(([src,body])=>new Function('src',body)(src),[src,body26]);if(show('現在 DOPRI5',await run26(cur))!==show(ref26,await run26(old26)))bad++;await b.close()}
console.log(bad?'不一致':'ビット単位で一致');process.exit(bad?1:0)})();
