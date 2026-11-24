#!/usr/bin/env node
/* アプリ内テストを 1 つのビューポートで回す開発用の道具（納品条件の判定は npm test で行う）．
   使い方： node tools/dev/run.js [--vp 360x640] [--only 24,26] [--names] [--time] [--off] [--json 出力先]
     --vp     ビューポート（既定 360x640．幅が 1000 を超えると PC として開く）
     --only   実行する TEST の番号（省くと全テスト．TEST-20 の「全テストの実行」は全テストのときだけ成り立つ）
     --names  すべての検査の名前と結果を表示（省くと FAIL だけ）
     --time   テストごとの所要時間を表示
     --off    MathJax を遮断（オフラインに相当）
     --noperf 性能の記録（時間の検査）を判定しない（記録と表示だけ．npm run verify が使う．SPEC-20 B の 10）
     --ui     画面のモード（[U] の項目だけ．npm test の 5 通りと同じ．SPEC-20 B の 9）
     --file   成果物の代わりに実行する HTML（前の版との比較に使う）
     --json   検査の一覧を JSON で保存（tools/dev/coverage.js の入力）
     --md     すべての検査の名前・基準・実測を Markdown の表で保存（docs/measured_v26.md を作る） */
'use strict';
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const A=process.argv.slice(2),opt=k=>{const i=A.indexOf('--'+k);return i<0?null:(A[i+1]&&!A[i+1].startsWith('--')?A[i+1]:true)};
const [W,H]=String(opt('vp')||'360x640').split('x').map(Number),pc=W>1000,only=opt('only')?String(opt('only')).split(',').map(Number):null;
const URL='file://'+path.resolve(typeof opt('file')==='string'?opt('file'):path.join(__dirname,'../../dist/engine.html')),MJ='https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/',MJD=path.resolve(__dirname,'../../vendor/mathjax-3.2.2/es5');
(async()=>{const b=await chromium.launch(),c=await b.newContext({viewport:{width:W,height:H},hasTouch:!pc,isMobile:!pc,deviceScaleFactor:pc?1:2,colorScheme:'dark'}),p=await c.newPage(),errs=[];
await c.route(/^https?:\/\//,async rt=>{const u=rt.request().url();if(!opt('off')&&u.startsWith(MJ)){const f=path.join(MJD,u.slice(MJ.length));if(fs.existsSync(f))return rt.fulfill({path:f,contentType:'application/javascript'})}return rt.abort()});
p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await p.waitForTimeout(300);
await p.evaluate(([only,ui,pj])=>{window.__t={};let d=0,last=performance.now(),cur=0;Object.defineProperty(window,'__done',{configurable:true,get:()=>d,set:v=>{d=v}});
  /* テストごとの所要時間：ST[i] が 'run' になった時刻の差 */
  const tm=setInterval(()=>{for(let i=1;i<=NT;i++)if(ST[i]==='run'&&cur!==i){const now=performance.now();if(cur)window.__t[cur]=(window.__t[cur]||0)+now-last;cur=i;last=now}if(d===1){window.__t[cur]=(window.__t[cur]||0)+performance.now()-last;clearInterval(tm)}},20);
  show(3);runAll(only||null,ui,pj)},[only,!!opt('ui'),opt('noperf')?0:1]);
/* 打ち切りは固まったときの止め．所要時間でテストを規定しない（利用者の方針．CLAUDE.md の 10）ので長めにとる */
await p.waitForFunction(()=>window.__done===1,null,{timeout:1800000});
const r=await p.evaluate(()=>({sum:document.getElementById('sm').textContent,maxF:RUN.maxF,maxId:RUN.maxId,total:RUN.total,t:window.__t,TR}));
console.log(W+'x'+H,r.sum,'最長フレーム間隔',Math.round(r.maxF),'ms（TEST-'+r.maxId+'）');
for(const k of Object.keys(r.TR).sort((a,b)=>a-b))for(const q of r.TR[k])if(opt('names')||!q.ok||q.over)console.log((q.over?(q.ok?'  性能 ':'  FAIL '):q.ok?'  ok   ':'  FAIL ')+'TEST-'+String(k).padStart(2,'0')+' | '+q.n+' | 実測 '+String(q.val).slice(0,160)+' | 基準 '+String(q.ref).slice(0,80));
if(opt('time'))console.log('所要時間 [s]',Object.keys(r.t).sort((a,b)=>a-b).map(k=>k+':'+(r.t[k]/1e3).toFixed(1)).join(' '));
if(typeof opt('json')==='string')fs.writeFileSync(opt('json'),JSON.stringify(r.TR));
if(typeof opt('md')==='string'){const esc=x=>String(x).replace(/\|/g,'／').replace(/\n/g,' '),names=await p.evaluate(()=>TNAME),L=['# アプリ内テストの実測値（第26版）','','`node tools/dev/run.js --md docs/measured_v26.md` で作った一覧（手で書き換えない）．ヘッドレス Chromium，ビューポート '+W+' × '+H+'．'+r.sum.replace(/\s+/g,' ')+'．','','仕様書 8 節のテスト項目に書いた「（実測 …）」のうち第25版の値のままのものは，この一覧の値が第26版（熱物性の既定が化学平衡，噴射方式の既定が直噴）での値である．所要時間とフレーム間隔は実行する計算機で変わる．',''];
 for(const k of Object.keys(r.TR).sort((a,b)=>a-b)){L.push('## TEST-'+String(k).padStart(2,'0')+'：'+(names[k]||''),'','| 検査 | 基準 | 実測 | 判定 |','| :--- | :--- | :--- | :--- |');for(const q of r.TR[k])L.push('| '+esc(q.n)+' | '+esc(q.ref)+' | '+esc(q.val)+(q.err&&q.err!=='–'?'（相対誤差 '+q.err+'）':'')+' | '+(q.ok?'PASS':'FAIL')+' |');L.push('')}
 fs.writeFileSync(opt('md'),L.join('\n'))}
errs.forEach(e=>console.log('ERR',e));await b.close();process.exit(/FAIL/.test(r.sum)&&!/FAIL 0/.test(r.sum)||errs.length?1:0)})();
