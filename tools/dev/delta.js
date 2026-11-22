#!/usr/bin/env node
/* 要件の差分（変更票）：利用者が承認した時点（verify.lock.json の approved）から，要件（REQ の断片，制約，受入）がどう変わったかを表示する．
   利用者が確かめるのはこの差分だけでよい（仕様・テスト・用語は，要件から導く）．
   使い方： npm run delta              差分を表示
            npm run delta -- --approve 今の HEAD を「承認済み」として記録（利用者が承認したときに実行する） */
'use strict';
const {execFileSync}=require('child_process'),I=require('./inputs.js'),root=I.root;
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',maxBuffer:1<<26});
const PATHS=['docs/requirements','docs/gui/REQ-*.md'],L=I.lock();
if(process.argv.includes('--approve')){if(git('status','--porcelain','--',...PATHS).trim()){console.log('要件の断片にコミットしていない変更がある．コミットしてから承認する');process.exit(1)}L.approved={commit:git('rev-parse','HEAD').trim(),at:new Date().toISOString()};I.save(L);console.log('承認済み：'+L.approved.commit.slice(0,7));process.exit(0)}
if(!L.approved){console.log('承認済みの時点が無い（npm run delta -- --approve）');process.exit(1)}
const st=git('diff','--stat',L.approved.commit,'--',...PATHS).trim();
if(!st){console.log('要件の差分なし（承認済み '+L.approved.commit.slice(0,7)+'，'+L.approved.at+'）');process.exit(0)}
console.log('要件の差分（承認済み '+L.approved.commit.slice(0,7)+' から）\n'+st+'\n');
console.log(git('diff','--word-diff=plain','-U0',L.approved.commit,'--',...PATHS).split('\n').filter(l=>!/^(diff --git|index |--- |\+\+\+ )/.test(l)||/^\+\+\+ /.test(l)).join('\n'));
