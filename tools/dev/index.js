#!/usr/bin/env node
/* 索引 docs/INDEX.md を作る（手で書き換えない）．
   使い方： node tools/dev/index.js          書き出す
            node tools/dev/index.js --check  今の内容と違えば終了コード 1（npm run check が使う）
   項目（REQ-nn／SPEC-nn／TEST-nn）ごとに，断片のファイルと字数，画面の検査の有無，参照する番号，番号が出てくるコードの行，テストの行を 1 行にまとめる．
   作業のはじめに索引を読み，要る断片だけを読む（CLAUDE.md）． */
'use strict';
const fs=require('fs'),path=require('path'),DS=require('./docsrc.js'),root=DS.root,rd=f=>fs.readFileSync(path.join(root,f),'utf8');
const pad=i=>String(i).padStart(2,'0'),SRC=['core.js','audio.js','plot.js','doc.js','ui.js','tests.js'];
const NAME={requirements:'要件定義書',specification:'仕様書',gui:'画面の文書',glossary:'用語の定義集'};
const tests=rd('src/tests.js'),UIT=new Set(JSON.parse(/UIT=(\[[\d,]*\])/.exec(tests)[1])),NT=+/NT=(\d+)/.exec(tests)[1];
/* 断片：番号の付いたもの（REQ／SPEC／TEST）と，そのほかの節 */
const IT={},OTH=[];for(let i=1;i<=NT;i++)IT[pad(i)]={REQ:[],SPEC:[],TEST:[],title:'',refs:new Set()};
for(const key of DS.KEYS)for(const p of DS.parts(key)){const b=path.basename(p.file,'.md'),m=/^(REQ|SPEC|TEST)-(\d\d)([A-Z]?)$/.exec(b),h=p.text.split('\n',1)[0].replace(/^#+ /,''),n=[...p.text].length;
 if(m&&IT[m[2]]){const it=IT[m[2]];it[m[1]].push({file:p.file,n});if(m[1]==='REQ')it.title=h.replace(/^REQ-\d\d：/,'');if(m[1]!=='TEST')for(const r of p.text.matchAll(/\b(?:REQ|SPEC|TEST)-(\d\d)\b/g))if(r[1]!==m[2])it.refs.add(r[1])}
 else OTH.push({key,file:p.file,h:h.replace(/\$[^$]*\$/g,'').replace(/\|/g,'／').trim()||'（前書き）',n})}
/* コードの中の番号（コメントや検査の名前に書いた SPEC-nn など）の行と，テストの関数の行の範囲 */
const CODE={};for(const f of SRC){const L=rd('src/'+f).split('\n');L.forEach((l,i)=>{if(f==='tests.js'&&/^\s*TST\[\d+\]=/.test(l))return;for(const r of l.matchAll(/\b(?:REQ|SPEC|TEST)-(\d\d)\b/g)){const c=CODE[r[1]]=CODE[r[1]]||{};(c[f]=c[f]||new Set()).add(i+1)}})}
const TL={};{const L=tests.split('\n');let cur=null;L.forEach((l,i)=>{const m=/^\s*TST\[(\d+)\]=/.exec(l);if(m){if(cur)TL[cur][1]=i;cur=pad(m[1]);TL[cur]=[i+1,L.length]}else if(cur&&/^\S/.test(l)&&!/^[)}\]]/.test(l)){TL[cur][1]=i;cur=null}})}
const fl=a=>a.map(x=>'`'+x.file.replace(/^docs\//,'')+'`（'+x.n+'）').join(' ')||'–';
const code=k=>{const c=CODE[k];if(!c)return'–';return Object.keys(c).filter(f=>f!=='tests.js'&&f!=='doc.js').map(f=>{const a=[...c[f]];return'`'+f+'`:'+a.slice(0,6).join(',')+(a.length>6?'…':'')}).join(' ')||'–'};
const o=['# 索引（自動生成）','','`node tools/dev/index.js` が作る．手で書き換えない（`npm run check` が，今の文書とコードから作ったものと同じかを調べる）．','',
'* **使い方**：作業のはじめにこの索引だけを読み，変更に関係する番号の断片（`docs/` の下のファイル）だけを読む．全文は `npm run build` の後，`dist/docs/` にある．',
'* **文書の持ち方**：4 文書は，見出し（`##` と `###`）ごとの断片のファイルに分けて `docs/requirements/`，`docs/specification/`，`docs/gui/`，`docs/glossary/` に置く．並びは各ディレクトリの `_order.txt`．ビルドと点検は，連結して 1 つの文書として読む（`tools/dev/docsrc.js`）．',
'* **（ ）の中**は字数．**[U]** は画面を操作する検査を持つテスト（`src/tests.js` の `UIT`）．**参照**は，REQ と SPEC の本文に出てくるほかの番号．**コード**は，番号がコメントなどに出てくる行（`src/`．`tests.js` と `doc.js` を除く）．','',
'## 1. 項目','','| 番号 | 題 | REQ | SPEC | TEST | テストの行（`src/tests.js`） | 参照 | コード |','| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'];
for(let i=1;i<=NT;i++){const k=pad(i),it=IT[k];o.push('| '+k+(UIT.has(i)?' [U]':'')+' | '+it.title.replace(/\|/g,'／')+' | '+fl(it.REQ)+' | '+fl(it.SPEC)+' | '+fl(it.TEST)+' | '+(TL[k]?TL[k][0]+'–'+TL[k][1]:'–')+' | '+([...it.refs].sort().join(' ')||'–')+' | '+code(k)+' |')}
o.push('','## 2. そのほかの節','','| 文書 | 見出し | ファイル | 字数 |','| :--- | :--- | :--- | ---: |');for(const x of OTH)o.push('| '+NAME[x.key]+' | '+x.h+' | `'+x.file.replace(/^docs\//,'')+'` | '+x.n+' |');
o.push('','## 3. そのほかの文書とコード','','| ファイル | 字数 |','| :--- | ---: |');
for(const f of['CLAUDE.md','docs/dev-notes.md','docs/verification.md','docs/review_v26.md','docs/history/changes_v25.md','docs/history/changes_v26.md',...SRC.map(f=>'src/'+f)])if(fs.existsSync(path.join(root,f)))o.push('| `'+f+'` | '+[...rd(f)].length+' |');
{const d=path.join(root,'docs/changes');if(fs.existsSync(d))for(const f of fs.readdirSync(d).sort())o.push('| `docs/changes/'+f+'` | '+[...rd('docs/changes/'+f)].length+' |')}
const text=o.join('\n')+'\n',dst=path.join(root,'docs/INDEX.md');
if(process.argv.includes('--check')){const cur=fs.existsSync(dst)?fs.readFileSync(dst,'utf8'):'';if(cur!==text){console.log('[索引] docs/INDEX.md が古い（node tools/dev/index.js で作り直す）');process.exit(1)}console.log('索引は最新')}
else{fs.writeFileSync(dst,text);console.log('docs/INDEX.md',[...text].length,'字')}
