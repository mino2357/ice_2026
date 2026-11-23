/* 検証の入力（成果物とテストを決めるファイル）のハッシュ．npm run verify と npm test が，前に検証した状態（verify.lock.json）と比べるのに使う．
   src/tests.js は，テストの関数（TST[n] = …）ごとのハッシュ 'src/tests.js#TST-nn' と，それ以外 'src/tests.js#common' に分ける． */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'../..');
const sha=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,16),pad=i=>String(i).padStart(2,'0');
const ls=(d,re)=>fs.readdirSync(path.join(root,d)).filter(f=>re.test(f)).sort().map(f=>d+'/'+f);
function hashes(){const H={};
 for(const f of[...ls('src',/\.(js|css|html|py)$/),...['requirements','specification','gui','glossary'].flatMap(k=>ls('docs/'+k,/\.(md|txt)$/)),'tests/headless.js','tools/dev/run.js','tools/dev/shard.js','tools/dev/times.json']){
  const t=fs.readFileSync(path.join(root,f),'utf8');
  if(f!=='src/tests.js'){H[f]=sha(t);continue}
  const L=t.split('\n'),com=[];let cur=null,buf=[];const flush=()=>{if(cur){H[f+'#TST-'+cur]=sha(buf.join('\n'));cur=null;buf=[]}};
  for(const l of L){const m=/^TST\[(\d+)\]=/.exec(l);if(m){flush();cur=pad(m[1]);buf=[l]}else if(cur&&/^\S/.test(l)&&!/^[)}\]]/.test(l)){flush();com.push(l)}else if(cur)buf.push(l);else com.push(l)}
  flush();H[f+'#common']=sha(com.join('\n'))}
 return H}
const LOCK=path.join(root,'verify.lock.json');
const lock=()=>fs.existsSync(LOCK)?JSON.parse(fs.readFileSync(LOCK,'utf8')):{};
const save=o=>fs.writeFileSync(LOCK,JSON.stringify(o,null,1)+'\n');
const changed=(prev,cur)=>[...new Set([...Object.keys(prev||{}),...Object.keys(cur)])].filter(k=>(prev||{})[k]!==cur[k]).sort();
module.exports={hashes,lock,save,changed,root};
