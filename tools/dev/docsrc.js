/* 4 文書の読み込み：文書は見出し（## と ###）ごとの断片のファイルに分けて docs/<名前>/ に置き，_order.txt の順に連結して 1 つの文書として読む．
   read(key)：連結した全文．parts(key)：[{file, text, line0}]．where(key, line)：連結した文書の行番号（1 始まり）→ 'docs/<名前>/<断片>:行'．
   fix(msg)：メッセージの中の 'docs/<名前>.md:行' を断片のファイルと行に書き換える． */
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const KEYS=['requirements','specification','gui','glossary'],C={};
function parts(key){if(C[key])return C[key];const dir=path.join(root,'docs',key),o=[];let line0=0;
 for(const f of fs.readFileSync(path.join(dir,'_order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(Boolean)){const text=fs.readFileSync(path.join(dir,f),'utf8');if(!text.endsWith('\n'))throw new Error('docs/'+key+'/'+f+'：末尾に改行が無い');o.push({file:'docs/'+key+'/'+f,text,line0});line0+=text.split('\n').length-1}
 const all=fs.readdirSync(dir).filter(f=>f.endsWith('.md')),ord=new Set(o.map(p=>path.basename(p.file)));for(const f of all)if(!ord.has(f))throw new Error('docs/'+key+'/'+f+' が _order.txt に無い');
 return C[key]=o}
const read=key=>parts(key).map(p=>p.text).join('');
function where(key,line){const P=parts(key);let b=P[0];for(const p of P)if(p.line0<line)b=p;else break;return b.file+':'+(line-b.line0)}
const fix=msg=>msg.replace(/docs\/(requirements|specification|gui|glossary)\.md:(\d+)/g,(m,k,l)=>where(k,+l));
module.exports={KEYS,parts,read,where,fix,root};
