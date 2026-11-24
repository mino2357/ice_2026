#!/usr/bin/env node
/* 段階 1 の検証：前に検証した状態（verify.lock.json）から変わったファイルを調べ，影響するテストだけを 1〜2 ビューポートで実行する（仕様書 9 節）．
   使い方： npm run verify            点検 → ビルド → 影響するテスト．すべて PASS なら verify.lock.json を更新
            npm run verify -- --plan  何を実行するかを表示するだけ
            npm run verify -- --all   変更が無くても全項目（360×640）と画面のモード（820×1180）を実行
   性能の記録（時間の検査）は判定しない（表示だけ）．正式版の前には npm test（段階 2．7 通り，性能も判定）を実行する．
   選び方（粗く，安全な側に）：
     4 文書の断片，src/doc.js，src/build.py        → TEST-16
     src/audio.js                                   → TEST-21，36
     src/tests.js の TST[n] だけ                    → TEST-n
     src/tests.js のそれ以外，src/core.js           → 全項目（360×640．shard.js で組に分けて同時に実行）．core.js は第25版とのビット比較も
     src/ui.js，plot.js，style.css，index.tpl.html，build.py → 画面のモード（360×640 と 820×1180） */
'use strict';
const {spawnSync}=require('child_process'),path=require('path'),I=require('./inputs.js'),root=I.root;
const A=process.argv.slice(2),PLAN=A.includes('--plan'),ALL=A.includes('--all');
const sh=(cmd,args)=>{const t=Date.now(),r=spawnSync(cmd,args,{cwd:root,stdio:'inherit'});return{ok:r.status===0,s:(Date.now()-t)/1e3}};
const L=I.lock(),cur=I.hashes(),ch=ALL?Object.keys(cur):I.changed(L.tier1&&L.tier1.files,cur);
if(!ch.length){console.log('変更なし：前の検証（'+L.tier1.at+'，'+L.tier1.plan+'）の結果をそのまま使う');process.exit(0)}
let full=ALL,ui=ALL,bit=false;const only=new Set();
for(const f of ch){
 if(/^docs\//.test(f)||f==='src/doc.js')only.add(16);
 else if(f==='src/build.py'){only.add(16);ui=true}
 else if(f==='src/audio.js'){only.add(21);only.add(36)}
 else if(/^src\/tests\.js#TST-/.test(f))only.add(+f.slice(-2));
 else if(f==='src/tests.js#common')full=true;
 else if(f==='src/core.js'){full=true;bit=true}
 else if(/^src\/(ui\.js|plot\.js|style\.css|index\.tpl\.html)$/.test(f))ui=true;
 else if(f==='tests/headless.js'||f==='tools/dev/run.js')only.add(16);
 else if(f==='tools/dev/shard.js'||f==='tools/dev/times.json')full=true;
 else full=true}
const steps=[['点検（npm run check）','npm',['run','check','--silent']],['ビルド','npm',['run','build','--silent']]];
const run=(nm,a)=>steps.push([nm,'node',['tools/dev/run.js','--noperf',...a]]);
if(bit)steps.push(['第25版とのビット比較','node',['tools/dev/bitcheck.js','--chromium']]);
if(full)steps.push(['全項目（360×640．組に分けて同時に実行．tools/dev/shard.js）','node',['tools/dev/shard.js']]);
else{if(only.size)run('TEST-'+[...only].sort((a,b)=>a-b).join('，')+'（360×640）',['--only',[...only].sort((a,b)=>a-b).join(',')]);if(ui)run('画面のモード（360×640）',['--ui'])}
if(ui)run('画面のモード（820×1180）',['--ui','--vp','820x1180']);
const plan=steps.slice(2).map(s=>s[0]).join(' ＋ ');
console.log('変わった入力 '+ch.length+' 件：'+ch.slice(0,12).join(' ')+(ch.length>12?' …':''));console.log('実行：'+plan);
if(PLAN)process.exit(0);
const t0=Date.now();for(const [nm,cmd,args] of steps){console.log('── '+nm);const r=sh(cmd,args);if(!r.ok){console.log('FAIL：'+nm+'（'+r.s.toFixed(0)+' s）．verify.lock.json は更新しない');process.exit(1)}}
L.tier1={at:new Date().toISOString(),plan,files:cur};I.save(L);
console.log('段階 1 の検証：PASS（'+((Date.now()-t0)/1e3).toFixed(0)+' s）．verify.lock.json を更新した');
