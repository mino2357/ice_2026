#!/usr/bin/env node
/* src/*.js の整形：長い行を，文・クラスのメンバー・宣言・リテラルの要素の境目で改行する（空白だけを変える）．
   使い方： node --expose-internals tools/dev/fmt.js [--check] [ファイル ...]   （npm run fmt）
   目的は，1 か所を読むのに数 kB の行を読まずに済むようにすること（検索の結果と差分が小さくなる）．
   整形の前後で構文木（位置を除く）とコメントが同じことを確かめ，違えば書き込まない．
   構文解析には Node.js に入っている acorn を使う（--expose-internals が要る．外部のパッケージは使わない）． */
'use strict';
const fs=require('fs'),path=require('path'),acorn=require('internal/deps/acorn/acorn/dist/acorn');
const root=path.resolve(__dirname,'../..'),CHECK=process.argv.includes('--check');
const files=process.argv.slice(2).filter(a=>!a.startsWith('--'));if(!files.length)for(const f of fs.readdirSync(path.join(root,'src')).sort())if(f.endsWith('.js'))files.push('src/'+f);
const LIM={block:100,decl:120,lit:160,seq:160};
const parse=src=>{const comments=[];const ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',onComment:(b,t)=>comments.push((b?'B':'L')+t)});return{ast,comments}};
/* 位置を除いた構文木の比較用の文字列 */
const strip=n=>JSON.stringify(n,(k,v)=>k==='start'||k==='end'||k==='loc'||k==='range'?undefined:typeof v==='bigint'?v.toString()+'n':v instanceof RegExp?v.toString():v);
function format(src){const {ast}=parse(src),E=[];/* E：[位置, 深さ]．位置の直前の空白を「改行＋深さ分の空白」に替える */
 const brk=(pos,d)=>E.push([pos,d]),len=n=>n.end-n.start;
 const walk=(n,d)=>{if(!n||typeof n.type!=='string')return;let dc=d;
  switch(n.type){
   case'Program':for(const s of n.body)brk(s.start,0);break;
   case'BlockStatement':case'StaticBlock':if(len(n)>LIM.block&&n.body.length){dc=d+1;for(const s of n.body)brk(s.start,dc);brk(n.end-1,d)}break;
   case'ClassBody':if(n.body.length){dc=d+1;for(const s of n.body)brk(s.start,dc);brk(n.end-1,d)}break;
   case'SwitchStatement':if(len(n)>LIM.block){dc=d+1;for(const c of n.cases){brk(c.start,dc);for(const s of c.consequent)brk(s.start,dc+1)}brk(n.end-1,d)}break;
   case'VariableDeclaration':if(len(n)>LIM.decl&&n.declarations.length>1){dc=d+1;n.declarations.slice(1).forEach(q=>brk(q.start,dc))}break;
   case'ObjectExpression':if(len(n)>LIM.lit&&n.properties.length>1){dc=d+1;for(const q of n.properties)brk(q.start,dc);brk(n.end-1,d)}break;
   case'ArrayExpression':if(len(n)>LIM.lit&&n.elements.filter(Boolean).length>1&&n.elements.every(Boolean)){dc=d+1;for(const q of n.elements)brk(q.start,dc);brk(n.end-1,d)}break;
   case'ExpressionStatement':if(n.expression.type==='SequenceExpression'&&len(n)>LIM.seq){dc=d+1;n.expression.expressions.slice(1).forEach(q=>brk(q.start,dc))}break}
  for(const k of Object.keys(n)){if(k==='type'||k==='start'||k==='end')continue;const v=n[k];if(Array.isArray(v))for(const c of v)walk(c,n.type==='SwitchStatement'&&k==='cases'?dc+1:dc);else if(v&&typeof v==='object')walk(v,dc)}};
 walk(ast,0);
 /* 後ろから適用する．同じ位置に 2 つあれば深い方（子の側）を使う */
 const M=new Map();for(const [p,d] of E)if(!M.has(p)||M.get(p)<d)M.set(p,d);
 let out=src;for(const p of [...M.keys()].sort((a,b)=>b-a)){let a=p;while(a>0&&/[ \t\r\n]/.test(out[a-1]))a--;if(a===0){out=out.slice(p);continue}out=out.slice(0,a)+'\n'+' '.repeat(M.get(p))+out.slice(p)}
 return out}
let bad=0;
for(const f of files){const p=path.join(root,f),src=fs.readFileSync(p,'utf8');let out=format(src);out=format(out);/* 2 回目で変わらないこと（冪等） */
 const A=parse(src),B=parse(out);
 if(strip(A.ast)!==strip(B.ast)||JSON.stringify(A.comments)!==JSON.stringify(B.comments)||format(out)!==out){console.log('[整形] '+f+'：構文木かコメントが変わるか，冪等でない．書き込まない');bad++;continue}
 const L=s=>s.split('\n'),mx=s=>Math.max(...L(s).map(l=>l.length));
 if(out===src){console.log(f+'：整形済み（'+L(src).length+' 行，最長 '+mx(src)+' 字）');continue}
 if(CHECK){console.log('[整形] '+f+' は整形されていない（npm run fmt）');bad++;continue}
 fs.writeFileSync(p,out);console.log(f+'：'+L(src).length+' 行（最長 '+mx(src)+' 字）→ '+L(out).length+' 行（最長 '+mx(out)+' 字），'+src.length+' → '+out.length+' 字')}
process.exit(bad?1:0);
