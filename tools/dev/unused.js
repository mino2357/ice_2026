#!/usr/bin/env node
/* 使われていない名前の点検：src の最上位で定義した名前（const / let / function / class）と，
   オブジェクトの定数表（K，GC，SWC）のキーが，成果物に入るコードの中で定義の他に現れるかを調べる．
   使い方： node tools/dev/unused.js   （終了コード：見つかれば 1） */
'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
const F=['core.js','audio.js','plot.js','doc.js','tests.js','ui.js'],src={};for(const f of F)src[f]=fs.readFileSync(path.join(root,'src',f),'utf8');
const all=F.map(f=>src[f]).join('\n')+fs.readFileSync(path.join(root,'src/index.tpl.html'),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'');
const count=n=>{const re=new RegExp('(?<![\\w$.])'+n.replace(/\$/g,'\\$')+'(?![\\w$])','g');return (strip(all).match(re)||[]).length};
const out=[];
for(const f of F){const s=strip(src[f]),names=new Set();
  /* 行頭（最上位）の宣言だけを見る．1 行に複数の宣言があるので，括弧の深さ 0 のカンマで分ける */
  for(const line of s.split('\n')){let m;
    if((m=line.match(/^(?:async )?function\*? ?([\w$]+)/)))names.add(m[1]);
    if((m=line.match(/^class ([\w$]+)/)))names.add(m[1]);
    if((m=line.match(/^(?:const|let|var) /))){let d=0,cur='',q=null;const parts=[];const body=line.slice(m[0].length);
      for(let i=0;i<body.length;i++){const c=body[i];
        if(q){cur+=c;if(c==='\\'){cur+=body[++i]||''}else if(c===q)q=null;continue}
        if(c==="'"||c==='"'||c==='`'){q=c;cur+=c;continue}
        if('([{'.includes(c))d++;else if(')]}'.includes(c))d--;
        if(c===';'&&d===0){parts.push(cur);cur='';const r=body.slice(i+1).match(/^\s*(?:const|let|var) /);if(r){i+=r[0].length;continue}break}
        if(c===','&&d===0){parts.push(cur);cur=''}else cur+=c}
      if(cur)parts.push(cur);
      for(const p of parts){const n=p.match(/^\s*([\w$]+)\s*(=|$)/);if(n)names.add(n[1]);const ds=p.match(/^\s*\{([^}]*)\}\s*=/);if(ds)ds[1].split(',').forEach(x=>{const y=x.split(':').pop().trim();if(/^[\w$]+$/.test(y))names.add(y)})}}}
  for(const n of names)if(count(n)<=1)out.push(f+': '+n)}
/* 定数表のキー */
for(const [tbl,re] of [['K',/const K=\{([^}]*)\}/],['SWC',/SWC=\{([\s\S]*?)\}[,;]/]]){const m=src['core.js'].match(re);if(!m)continue;
  for(const kv of m[1].split(',')){const k=(kv.match(/^\s*([\w$]+):/)||[])[1];if(!k)continue;const re2=new RegExp('(?<![\\w$])'+tbl+'\\.'+k+'(?![\\w$])|\\b'+k+'\\b(?=[^:]*\\}\\s*=\\s*'+tbl+'\\b)','g');
    if(!(strip(all).match(re2)||[]).length&&!new RegExp("'"+k+"'").test(all))out.push('core.js: '+tbl+'.'+k)}}
out.forEach(l=>console.log(l));console.log(out.length?'使われていない名前 '+out.length+' 個':'使われていない名前は無い');process.exit(out.length?1:0);
