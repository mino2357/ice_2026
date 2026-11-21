#!/usr/bin/env node
/* 文書とコードの整合の機械的な点検（ビルドやブラウザは不要）．
   使い方： node tools/dev/check_docs.js [-v]
   終了コード： 指摘が 1 件でもあれば 1．
   点検の内容は tools/dev/README.md． */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const DS=require('./docsrc.js');
/* 4 文書は断片を連結して読む（docsrc.js）．指摘の行番号は，出力のときに断片のファイルと行に直す */
const root=path.resolve(__dirname,'../..'),rd=f=>{const m=/^docs\/(requirements|specification|gui|glossary)\.md$/.exec(f);return m?DS.read(m[1]):fs.readFileSync(path.join(root,f),'utf8')};
const V=process.argv.includes('-v');
const req=rd('docs/requirements.md'),spec=rd('docs/specification.md'),gui=rd('docs/gui.md'),glo=rd('docs/glossary.md'),claude=rd('CLAUDE.md');
const core=rd('src/core.js'),tests=rd('src/tests.js'),docjs=rd('src/doc.js'),uijs=rd('src/ui.js'),plotjs=rd('src/plot.js'),audiojs=rd('src/audio.js');
const out=[];const bad=(k,m)=>out.push('['+k+'] '+m);
const N=36,pad=i=>String(i).padStart(2,'0');
const lines=s=>s.split('\n');
const cut=(s,re)=>{const i=s.search(re);return i<0?s:s.slice(0,i)};
/* 見出しの間の本文を取る */
const sect=(src,re)=>{const L=lines(src),r={};let cur=null;for(const l of L){const m=l.match(re);if(m){cur=m[1];r[cur]={title:m[2],body:[]}}else if(/^## /.test(l))cur=null;else if(/^### /.test(l)&&!re.test(l))cur=null;else if(cur)r[cur].body.push(l)}return r};
/* 画面の文書（docs/gui.md）に置いた章も同じ番号で数える（どちらか一方にだけ見出しがあること） */
const dupH=(srcs,re,nm)=>{const c={};for(const s of srcs)for(const l of lines(s)){const m=l.match(re);if(m)c[m[1]]=(c[m[1]]||0)+1}for(const k of Object.keys(c))if(c[k]>1)bad('番号',nm+'-'+k+' の見出しが '+c[k]+' 個')};
const REQ=sect(req+'\n'+gui,/^### REQ-(\d\d)：(.*)$/),SPEC=sect(spec+'\n'+gui,/^### SPEC-(\d\d)：(.*)$/),TEST=sect(spec+'\n'+gui,/^### TEST-(\d\d)：(.*)$/);
dupH([req,gui],/^### REQ-(\d\d)：/,'REQ');dupH([spec,gui],/^### SPEC-(\d\d)：/,'SPEC');dupH([spec,gui],/^### TEST-(\d\d)：/,'TEST');
const base=t=>t.replace(/（(REQ|SPEC|TEST)-[^）]*）\s*$/,'').replace(/（第\d+版）\s*$/,'').replace(/（REQ-\d\d．第\d+版）\s*$/,'').replace(/の確かめ方$/,'').trim();

/* 1. 番号と題 */
for(let i=1;i<=N;i++){const k=pad(i);
  if(!REQ[k])bad('番号','REQ-'+k+' の見出しが無い');if(!SPEC[k])bad('番号','SPEC-'+k+' の見出しが無い');if(!TEST[k])bad('番号','TEST-'+k+' の見出しが無い');
  if(REQ[k]&&SPEC[k]&&base(REQ[k].title)!==base(SPEC[k].title))bad('題','REQ-'+k+'「'+base(REQ[k].title)+'」と SPEC-'+k+'「'+base(SPEC[k].title)+'」');
  if(REQ[k]&&TEST[k]&&base(REQ[k].title)!==base(TEST[k].title))bad('題','REQ-'+k+'「'+base(REQ[k].title)+'」と TEST-'+k+'「'+base(TEST[k].title)+'」')}
for(const [nm,o] of [['REQ',REQ],['SPEC',SPEC],['TEST',TEST]])for(const k of Object.keys(o))if(+k<1||+k>N)bad('番号',nm+'-'+k+' は範囲外');

/* 2. 要件定義書 6 節の対応表 */
{const rows=lines(req).filter(l=>/^\| REQ-\d\d \|/.test(l));if(rows.length!==N)bad('対応表','行数 '+rows.length+'（'+N+' のはず）');
 rows.forEach(l=>{const c=l.split('|').map(s=>s.trim());const k=c[1].slice(4);if(c[3]!=='SPEC-'+k||c[4]!=='TEST-'+k)bad('対応表','REQ-'+k+' の行：'+c[3]+'，'+c[4])})}

/* 3. 項目の数（テストは番号付きリスト，要件は「受入基準」の番号付きリスト） */
const items=b=>b.filter(l=>/^\d+\. /.test(l)).map(l=>+l.match(/^(\d+)\./)[1]);
const nT={},nA={};
for(const k of Object.keys(TEST)){const it=items(TEST[k].body);nT[k]=it.length;it.forEach((v,i)=>{if(v!==i+1)bad('連番','TEST-'+k+' の項目の番号が '+v+'（'+(i+1)+' のはず）')})}
for(const k of Object.keys(REQ)){const b=REQ[k].body,i0=b.findIndex(l=>/受入基準/.test(l));const it=items(i0<0?[]:b.slice(i0));nA[k]=it.length;if(!it.length)bad('受入基準','REQ-'+k+' に番号付きの受入基準が無い');it.forEach((v,i)=>{if(v!==i+1)bad('連番','REQ-'+k+' の受入基準の番号が '+v+'（'+(i+1)+' のはず）')})}

/* 4. 参照の切れ */
const docs={'docs/requirements.md':req,'docs/specification.md':spec,'docs/gui.md':gui,'docs/glossary.md':glo,'CLAUDE.md':claude,'src/doc.js':docjs,'src/tests.js':tests,'src/ui.js':uijs,'src/core.js':core,'src/plot.js':plotjs};
const SUB={};for(const k of Object.keys(SPEC))SUB[k]=new Set(SPEC[k].body.map(l=>(l.match(/^#### ([A-Z])\. /)||[])[1]).filter(Boolean));
for(const [f,s] of Object.entries(docs)){lines(s).forEach((l,i)=>{const at=f+':'+(i+1);
  for(const m of l.matchAll(/\b(REQ|SPEC|TEST)-(\d\d)\b/g))if(+m[2]<1||+m[2]>N)bad('参照',at+' '+m[0]+' は存在しない');
  for(const m of l.matchAll(/TEST-(\d\d)(?: の)? ?項目 (\d+)(?:[〜，・](\d+))?/g)){const n=nT[m[1]]||0;for(const v of [m[2],m[3]].filter(Boolean))if(+v>n)bad('参照',at+' '+m[0]+'：TEST-'+m[1]+' は '+n+' 項目')}
  for(const m of l.matchAll(/SPEC-(\d\d) ([A-Z])(?:[.．](\d+))?(?![A-Za-z])/g)){const S=SUB[m[1]];if(S&&!S.has(m[2]))bad('参照',at+' '+m[0]+'：SPEC-'+m[1]+' に節 '+m[2]+' が無い')}
  for(const m of l.matchAll(/REQ-(\d\d)(?: の)? ?受入基準 (\d+)/g)){if(+m[2]>(nA[m[1]]||0))bad('参照',at+' '+m[0]+'：REQ-'+m[1]+' の受入基準は '+nA[m[1]]+' 項目')}})}
/* 同じ TEST の中の「項目 k」 */
for(const k of Object.keys(TEST))TEST[k].body.forEach(l=>{for(const m of l.matchAll(/(?<!TEST-\d\d(?: の)? ?)項目 (\d+)/g))if(+m[1]>nT[k])bad('参照','TEST-'+k+' の中の「項目 '+m[1]+'」（'+nT[k]+' 項目）')});

/* 5. コードの定数（EngineCore を Node で読む） */
const sb={console,performance:{now:()=>0},Float64Array,Float32Array,Math,JSON,Object,Array,Number,String,Map,Set};vm.createContext(sb);
vm.runInContext(core+'\n;globalThis.__X={ITEMS,PAGES,K,NY:typeof NY!=="undefined"?NY:null,SWC:typeof SWC!=="undefined"?SWC:null,GC:typeof GC!=="undefined"?GC:null};',sb);
const {ITEMS,PAGES,K,NY,SWC}=sb.__X;
/* 5a. SPEC-18 C の表と項目定義表 */
{const b=SPEC['18'].body,rows=b.filter(l=>/^\| /.test(l)&&!/^\| :?-/.test(l)&&!/^\| ページ/.test(l));const T={};
 rows.forEach(l=>{const c=l.split('|').map(s=>s.trim());if(c.length>=3&&PAGES.includes(c[1]))T[c[1]]=c[2].split('／').map(s=>s.trim())});
 for(const pg of PAGES)if(!T[pg])bad('設定の表','SPEC-18 C の表にページ「'+pg+'」が無い');
 for(const pg of Object.keys(T))if(!PAGES.includes(pg))bad('設定の表','SPEC-18 C の表のページ「'+pg+'」は項目定義表に無い');
 const num=x=>x==null?null:String(+(+x).toPrecision(10)).replace('-','−');
 const cnt={};for(const pg of PAGES)cnt[pg]=0;
 for(const it of ITEMS){const pg=PAGES[it.pg];cnt[pg]++;const E=T[pg];if(!E)continue;let want,hit;
  if(it.ch){want=it.ch.join('・')+'，既定 '+it.ch[it.d];hit=E.some(e=>e.replace(/\s/g,'').includes(want.replace(/\s/g,'')))}
  else{const lo=num(it.lo),hi=num(it.hi);want=(lo==null&&hi==null?'上下限なし':(lo==null?'':lo)+'〜'+(hi==null?'（上限なし）':hi))+'，'+num(it.st)+'，'+num(it.d);
   hit=E.some(e=>e.replace(/\s/g,'').replace(/1e-(\d)/g,'1e-$1').includes(want)&&(!it.u||!/（[^）]*）：/.test(e)||e.includes('（'+it.u+'）')||/\$/.test(e)))}
  if(!hit)bad('設定の表','「'+pg+'」の '+it.k+'（'+it.n+(it.u?'，'+it.u:'')+'）：'+want+' が表に無い')}
 for(const pg of PAGES)if(cnt[pg]>6)bad('設定の表','ページ「'+pg+'」が '+cnt[pg]+' 項目（6 以内のはず）');
 if(V)console.log('ITEMS',ITEMS.length,'PAGES',PAGES.length,JSON.stringify(cnt))}
/* 5b. 数の記述 */
{const nS=(core.match(/NY=(\d+)/)||[])[1];const want=[[/長さ (\d+)/g,claude,'CLAUDE.md',+nS],[/TEST-01〜(\d+)/g,claude,'CLAUDE.md',N],[/TEST-01〜(\d+)(?!\d|，21〜)/g,spec,'仕様書',N],[/REQ-01〜(\d+)/g,req,'要件定義書',N],[/REQ-01〜(\d+)/g,claude,'CLAUDE.md',N],[/SPEC-01〜(\d+)/g,claude,'CLAUDE.md',N]];
 for(const [re,s,nm,v] of want)for(const m of s.matchAll(re))if(+m[1]!==v)bad('数',nm+'「'+m[0]+'」（'+v+' のはず）');
 const nt=(tests.match(/NT=(\d+)/)||[])[1];if(+nt!==N)bad('数','tests.js の NT='+nt);
 for(let i=1;i<=N;i++)if(!new RegExp('TST\\['+i+'\\]=').test(tests))bad('数','tests.js に TST['+i+'] が無い');
 /* 画面のモード（SPEC-20 B の 9）：tests.js の UIT が，仕様書で [U] の項目を持つ TEST の集合と一致する */
 {const ut=(tests.match(/UIT=\[([\d,]+)\]/)||[])[1],want=Object.keys(TEST).filter(k=>TEST[k].body.some(l=>/^\d+\. \[U\]/.test(l))).map(Number).sort((a,b)=>a-b).join();if(ut!==want)bad('数','tests.js の UIT='+ut+'（[U] の項目を持つ TEST は '+want+'）')}
 /* 「n/n PASS」の数 */
 for(const [nm,s] of [['要件定義書',cut(req,/^## 7\. /m)],['仕様書',spec],['CLAUDE.md',claude]])for(const m of s.matchAll(/(\d+)\/(\d+) PASS/g))if(+m[1]!==N||+m[2]!==N)bad('数',nm+'「'+m[0]+'」（'+N+' のはず）');
 for(const m of spec.matchAll(/(\d+) ページ/g))if(+m[1]>=10&&+m[1]<=20&&+m[1]!==PAGES.length)bad('数','仕様書「'+m[0]+'」（設定のページは '+PAGES.length+'）')}

/* 6. 表記の規則と，古い記述の残り（改訂記録・履歴は除く） */
const live={'docs/requirements.md':cut(req,/^## 7\. /m),'docs/specification.md':spec,'docs/gui.md':gui,'docs/glossary.md':glo,'CLAUDE.md':claude,'src/doc.js':docjs,'src/ui.js':uijs,'src/plot.js':plotjs,'src/core.js':core,'src/index.tpl.html':rd('src/index.tpl.html')};
const STALE=[[/[、。]/,'句読点「、」「。」'],[/(?<![A-Za-z_])Nm(?![A-Za-z_])|\dN m\b|N・m|N･m|kgf/,'トルクの単位（N·m と書く）'],[/\d ?K[WN]\b|\d ?Kpa\b|\d ?KPa\b|\d ?Mm\b/,'SI 接頭辞の大文字と小文字'],[/(?<![A-Za-z\\_{])bar(?![A-Za-z}])/,'圧力の単位 bar'],[/しても(よい|良い)が/,'「してもよいが」'],
 [/「化学種」|化学種\s*→|→\s*化学種(?!の)/,'設定値の名「化学種」（「化学平衡」に改めた）'],[/1000\s*〜\s*7000\s*(\\ \\text\{)?rpm/,'性能曲線の範囲 1000〜7000 rpm'],[/≤\s*180\s*s|(?<!から緩めた[^|]{0,200})180\\ \\text\{s\}(?!\$? ?から緩めた)/,'所要時間 180 s'],
 [/比熱：γ\(T\)・γ一定/,'設定「比熱」（「熱物性」に改めた）'],[/7 画面|7 つの画面/,'線図の画面の数 7（8 に増えた）'],[/第25版）$/m,'題の版の番号']];
for(const [f,s] of Object.entries(live))lines(s).forEach((l,i)=>{for(const [re,nm] of STALE){if(nm.startsWith('トルクの単位')&&/は使わない/.test(l))continue;if(nm.startsWith('圧力')&&/`bar`|bar は使わない|\\bar|\\text\{bar\}\$ は使わない|toolbar|scrollbar|progressbar/.test(l))continue;if(nm.startsWith('句読点')&&f.startsWith('src/')&&/\/[^/]*[、。][^/]*\/|replace\(/.test(l))continue;if(re.test(l))bad('表記',f+':'+(i+1)+' '+nm+'：'+l.trim().slice(0,70))}});

/* 6a. 句読点の重なり（コードの部分は除く）と，ファイルの末尾の改行 */
for(const [f,s0] of [['docs/requirements.md',req],['docs/specification.md',spec],['docs/gui.md',gui],['docs/glossary.md',glo]]){lines(s0).forEach((l,i)=>{const t=l.replace(/`[^`]*`/g,'`…`');if(/，，|．．|，．|．，/.test(t))bad('表記',f+':'+(i+1)+' 句読点の重なり：'+(t.match(/.{0,20}(，，|．．|，．|．，).{0,10}/)||[''])[0])});if(!s0.endsWith('\n'))bad('表記',f+' の末尾に改行が無い')}

/* 6b. 番号付きリストの連番（pandoc は先頭の番号から振り直すので，原稿の番号が飛ぶと，本文の「〜の 14」の参照と表示がずれる） */
for(const [f,s0] of [['docs/requirements.md',req],['docs/specification.md',spec],['docs/gui.md',gui],['docs/glossary.md',glo]]){let prev=null;lines(s0).forEach((l,i)=>{const m=l.match(/^(\d+)\. /);if(m){const v=+m[1];if(prev!=null&&v!==prev+1)bad('連番',f+':'+(i+1)+' リストの番号が '+prev+' の次に '+v+'：'+l.slice(0,40));prev=v}else if(/^#/.test(l)||/^---/.test(l)||(/^\S/.test(l)&&!/^[|*$>]/.test(l)&&l.trim()!==''))prev=null})}

/* 7. 受入基準 → テスト項目（「項目 k」「TEST-nn」「[M]」のどれかを引いていること），テスト項目 ← 受入基準 */
{const used={};for(const k of Object.keys(TEST))used[k]=new Set();const exp=t=>{const r=[];for(const m of t.matchAll(/(\d+)(?:〜(\d+))?/g)){const a=+m[1],b=m[2]?+m[2]:a;for(let v=a;v<=b;v++)r.push(v)}return r};
 for(const k of Object.keys(REQ)){const b=REQ[k].body,i0=b.findIndex(l=>/受入基準/.test(l));if(i0<0)continue;let cur=k;
  b.slice(i0).filter(l=>/^\d+\. /.test(l)).forEach(l=>{const no=l.match(/^(\d+)/)[1];let any=/\[M\]|5\.2 節|TEST-\d\d/.test(l);
   for(const m of l.matchAll(/(TEST-(\d\d)(?: の)? ?)?項目 ((?:\d+(?:〜\d+)?)(?:[，・]\s*\d+(?:〜\d+)?)*)/g)){any=true;const t=m[2]||k;for(const v of exp(m[3])){if(v>(nT[t]||0))bad('受入基準','REQ-'+k+' の '+no+'：TEST-'+t+' 項目 '+v+' は無い（'+nT[t]+' 項目）');else used[t].add(v)}}
   for(const m of l.matchAll(/TEST-(\d\d)(?!(?: の)? ?項目)/g))if(used[m[1]])used[m[1]].add(0);
   if(!any)bad('受入基準','REQ-'+k+' の受入基準 '+no+' がテスト項目を引いていない：'+l.slice(0,60))})}
 const free=[];for(const k of Object.keys(TEST).sort()){if(used[k].has(0))continue;const f=[];for(let v=1;v<=nT[k];v++)if(!used[k].has(v))f.push(v);if(f.length)free.push(k+':'+f.join(','))}
 if(V)console.log('どの受入基準からも引かれていないテスト項目（参考）',free.join(' ')||'なし')}

if(V){console.log('TEST の項目数',Object.keys(nT).sort().map(k=>k+':'+nT[k]).join(' '),'計',Object.values(nT).reduce((a,b)=>a+b,0));console.log('受入基準の数',Object.keys(nA).sort().map(k=>k+':'+nA[k]).join(' '),'計',Object.values(nA).reduce((a,b)=>a+b,0))}
/* 性能の記録（SPEC-20 B の 10）：仕様書の表と，src/tests.js の chkP の呼び出し（番号，上限，単位）が同じこと */
{const U={'\\text{ms}':'ms','\\text{s}':'s','\\mu\\text{s}':'μs'},doc=[],code=[];
 for(const l of lines(SPEC['20'].body.join('\n'))){const m=l.match(/^\s*\| TEST-(\d\d) \| (.*?) \| \$([0-9.]+)\\ (.*?)\$ \|$/);if(m)doc.push(+m[1]+'|'+m[2]+'|'+m[3]+' '+(U[m[4]]||m[4]))}
 for(const m of tests.matchAll(/chkP\((\d+),'([^']*)',[^\n]*?,([0-9.]+),'([^']+)'/g))if(m[1]!=='99')code.push(+m[1]+'|'+m[2]+'|'+m[3]+' '+m[4]);
 for(const c of code)if(!doc.includes(c))bad('性能の記録','src/tests.js の「'+c+'」が SPEC-20 B の 10 の表に無い');
 if(doc.length<10)bad('性能の記録','SPEC-20 B の 10 の表が読めない（'+doc.length+' 行）');
 for(const d of doc)if(!code.includes(d))bad('性能の記録','SPEC-20 B の 10 の表の「'+d+'」が src/tests.js に無い')}
out.forEach(l=>console.log(DS.fix(l)));console.log(out.length?'指摘 '+out.length+' 件':'指摘なし');process.exit(out.length?1:0);
