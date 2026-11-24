#!/usr/bin/env node
/* 計算だけのアプリ内テスト（画面を使わないもの．NODE_IDS）を Node.js で実行する（朝の判断の 12 (a) で作った．段階 1 には入れていない：全体が縮まず，値が Chromium とビット単位では一致しないため．docs/changes/2026-11-25-node-tests.md）．
   src/core.js，audio.js，plot.js，tests.js を連結して関数の中で読み込み（vm の文脈では最上位の名前の参照が遅いので使わない），runAll と同じ手順（例外は FAIL，終わったら endAll）で TST[id] を最後まで進める．
   出力は run.js と同じ形（1 行目が「node PASS n/m　検証項目 … 件中 FAIL … 件」）．
   使い方： node tools/dev/node_tests.js [--only 5,6] [--quick] [--names] [--time] [--json 保存先]
   ビルドも Playwright も要らない．画面に触れるテストをここで実行すると例外で FAIL になる（NODE_IDS の誤りが分かる）． */
'use strict';
const fs=require('fs'),path=require('path');
const NODE_IDS=[1,2,4,5,6,7,9,10,11,12,13,24,28,29];
{
 const A=process.argv.slice(2),opt=k=>{const i=A.indexOf('--'+k);return i<0?null:(A[i+1]&&!A[i+1].startsWith('--')?A[i+1]:true)};
 const only=opt('only')?String(opt('only')).split(',').map(Number):NODE_IDS,bad=only.filter(k=>!NODE_IDS.includes(k));
 if(bad.length){console.log('Node.js で実行しないテスト：TEST-'+bad.join('，'));process.exit(1)}
 const R=path.resolve(__dirname,'../../src/'),
  src=['core.js','audio.js','plot.js','tests.js'].map(f=>fs.readFileSync(path.join(R,f),'utf8')).join('\n')+'\n;return {TST,RUN,endAll,chkB,get TR(){return TR}};',
  X=new Function(src)();
 X.RUN.pj=0;
 X.RUN.quick=opt('quick')?1:0;
 X.RUN.skip=[];
 const t={},t0=performance.now();
 /* runAll と同じ順（TEST-20 は無い） */
 for(const id of only.slice().sort((a,b)=>a-b)){
  const s=performance.now();
  try{
   const it=X.TST[id]();
   let send;
   for(;;){
    X.RUN.t0=performance.now();
    const r=it.next(send);
    send=undefined;
    if(r.done)break;
    if(r.value&&typeof r.value.then==='function')throw new Error('Node.js では待てない値を返した（画面のテスト？）')
   }
  }catch(e){X.chkB(id,'例外: '+e.message,false,(e.stack||'').split('\n')[1]||'')}
  X.endAll();
  t[id]=performance.now()-s
 }
 const TR=X.TR,all=Object.values(TR).flat(),nf=all.filter(q=>!q.ok).length,np=only.filter(k=>TR[k]&&TR[k].length&&TR[k].every(q=>q.ok)).length,pf=all.filter(q=>q.perf);
 console.log(`node PASS ${np}/${only.length}　検証項目 ${all.length} 件中 FAIL ${nf} 件　所要 ${((performance.now()-t0)/1e3).toFixed(1)} s　性能の記録 ${pf.length} 件（上限超え ${pf.filter(q=>q.over).length} 件．判定しない）`);
 for(const k of Object.keys(TR).sort((a,b)=>a-b))for(const q of TR[k])if(opt('names')||!q.ok||q.over)console.log((q.over?(q.ok?'  性能 ':'  FAIL '):q.ok?'  ok   ':'  FAIL ')+'TEST-'+String(k).padStart(2,'0')+' | '+q.n+' | 実測 '+String(q.val).slice(0,160)+' | 基準 '+String(q.ref).slice(0,80));
 if(X.RUN.skip.length)console.log('段階 1 で省いた重い検査（--quick）：'+X.RUN.skip.join('，'));
 if(opt('time'))console.log('所要時間 [s]',Object.keys(t).sort((a,b)=>a-b).map(k=>k+':'+(t[k]/1e3).toFixed(1)).join(' '));
 if(typeof opt('json')==='string')fs.writeFileSync(opt('json'),JSON.stringify(TR));
 process.exit(nf||np!==only.length?1:0)
}
