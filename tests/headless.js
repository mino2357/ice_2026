// アプリ内テスト（REQ-20）をヘッドレス Chromium で実行する開発時検証 [D]．
// スマートフォン 3 ＋ 極端な利用者状態 ＋ タブレット 2 ＋ PC 1 のビューポート．1 件でも FAIL なら終了コード 1．
// 全項目を実行するのは 360×640 と極端な利用者状態の 2 通り．ほかの 5 通りは画面のモード（[U] の項目だけ．仕様書 SPEC-20 B の 9，9 節）．
// 使い方: npm test  （初回は npm install && npx playwright install chromium）
const {chromium}=require('playwright'),path=require('path');
const URL='file://'+path.resolve(__dirname,'..','dist','engine.html'),fs=require('fs');
// MathJax（C-1．成果物は実行時に cdnjs から読む）：手元の同じ版に振り向ける．極端な利用者状態では遮断する（オフラインに相当）
const MJ_URL='https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/',MJ_DIR=process.env.MATHJAX||path.resolve(__dirname,'..','vendor','mathjax-3.2.2','es5');
async function run(vp,extreme,pc,ui){const b=await chromium.launch(),c=await b.newContext({viewport:vp,hasTouch:!pc,isMobile:!pc,deviceScaleFactor:pc?1:2,colorScheme:'dark'}),p=await c.newPage(),errs=[];
await c.route(/^https?:\/\//,async rt=>{const u=rt.request().url();if(!extreme&&u.startsWith(MJ_URL)){const f=path.join(MJ_DIR,u.slice(MJ_URL.length));if(fs.existsSync(f))return rt.fulfill({path:f,contentType:'application/javascript'});errs.push('MathJax の手元に無いファイル: '+u)}return rt.abort()});
p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await p.waitForTimeout(300);
if(extreme)await p.evaluate(()=>{for(const it of ITEMS){if(it.c==='r')continue;if(it.ch)LP[it.k]=it.vals?it.vals[it.vals.length-1]:it.ch.length-1;else LP[it.k]=it.hi==null?gv(it,1000):gv(it,gmax(it))}LP.mode=1;LP.sol=0;U.x10=1;U.pend={eps:gv(IT.eps,gmax(IT.eps))};U.pg=5;live.start();Sim.spd=1;for(let i=0;i<3000;i++)live.step();rs()});
await p.evaluate(__ui=>{window.__b=JSON.stringify({s:live.s,P:LP});let d=0;Object.defineProperty(window,'__done',{configurable:true,get:()=>d,set:v=>{d=v;if(v===1)window.__a=JSON.stringify({s:live.s,P:LP})}});show(3);runAll(null,__ui)},ui);
await p.waitForFunction(()=>window.__done===1,null,{timeout:600000});
const r=await p.evaluate(()=>({mj:typeof MJX!=='undefined'?MJX.st:'-',sum:document.getElementById('sm').textContent,same:window.__a===window.__b,fails:Object.keys(TR).flatMap(k=>TR[k].filter(q=>!q.ok).map(q=>`TEST-${k}: ${q.n} | 基準 ${q.ref} | 実測 ${q.val}`))}));await b.close();return{...r,errs}}
(async()=>{let bad=0;const t0=Date.now();for(const[vp,ex,pc,ui]of[[{width:360,height:640},0],[{width:384,height:780},0,0,1],[{width:412,height:915},0,0,1],[{width:384,height:780},1],[{width:820,height:1180},0,0,1],[{width:1180,height:820},0,0,1],[{width:1440,height:900},0,1,1]]){const r=await run(vp,ex,pc,ui),ok=!r.fails.length&&!r.errs.length&&(!ex||r.same);if(!ok)bad++;
console.log(`${vp.width}x${vp.height}${ex?'（極端な利用者状態・MathJax 遮断）':''}${pc?'（PC・マウス）':''}${ui?'（画面のモード）':'（全項目）'}: ${r.sum}　数式 ${r.mj}${ex?` 状態復元 ${r.same?'OK':'NG'}`:''}`);r.fails.forEach(f=>console.log('  FAIL',f));r.errs.forEach(e=>console.log('  ERROR',e))}console.log(`7 通りの所要 ${((Date.now()-t0)/60e3).toFixed(1)} 分`);process.exit(bad?1:0)})();
