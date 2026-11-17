#!/usr/bin/env node
/* 仕様書のテスト項目と，アプリ内の検査（tools/dev/run.js --json で保存した一覧）を並べて表示する．
   使い方： node tools/dev/coverage.js 検査の一覧.json [TEST の番号 ...]
   番号を省くと，テストごとの項目の数（区分ごと）と検査の数だけを表示する．
   仕様書の項目と検査の名前は 1 対 1 に番号で結ばれていないので，漏れの判定は人が読んで行う． */
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const spec=fs.readFileSync(path.join(root,'docs/specification.md'),'utf8'),TR=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),ids=process.argv.slice(3).map(Number);
const T={};let cur=null;for(const l of spec.split('\n')){const m=l.match(/^### TEST-(\d\d)：(.*)$/);if(m){cur=+m[1];T[cur]={title:m[2],items:[]}}else if(/^##+ /.test(l))cur=null;else if(cur&&/^\d+\. /.test(l))T[cur].items.push(l)}
const kinds=l=>(l.match(/\[[ASUDM]\]/g)||[]).join('');
if(!ids.length){console.log('TEST  項目  [A] [S] [U] [D]  検査');for(const k of Object.keys(T)){const it=T[k].items,c=x=>it.filter(l=>l.includes('['+x+']')).length;console.log(String(k).padStart(4),String(it.length).padStart(5),String(c('A')).padStart(4),String(c('S')).padStart(3),String(c('U')).padStart(3),String(c('D')).padStart(3),String((TR[k]||[]).length).padStart(5),(TR[k]||[]).length<it.length-c('D')?' ← 検査の数が項目の数より少ない':'')}process.exit(0)}
for(const k of ids){console.log('=== TEST-'+String(k).padStart(2,'0')+' '+T[k].title);T[k].items.forEach(l=>console.log('  '+l.replace(/\$/g,'').replace(/\\text\{([^}]*)\}/g,'$1').replace(/\\[a-z]+/g,'').slice(0,110)));console.log('  --- 検査 '+(TR[k]||[]).length+' 件');(TR[k]||[]).forEach(q=>console.log('  · '+q.n.slice(0,70)))}
