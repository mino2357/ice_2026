#!/usr/bin/env node
/* 調査 7：実装した既定の解法（src/core.js の sol = 2）を 50 の運転点（回転数 10 × 開度 5）で確かめる．
   点ごとに，DOPRI5（第26版の既定）で 40 サイクル回した状態（点火時期は自動で落ち着いた値に固定）から，(a) 既定の解法，(b) 参照解（DOPRI5，1e-8，上限 0.125°），(c) DOPRI5 のまま，で進める．
   1 サイクルの差：直後の 1 サイクルの IMEP，φ_ig，η_v，p_max，x_r の，参照解との相対差の最大（IMEP の分母は max(|IMEP|, 100 kPa)）．
   定常の差：その後 10 サイクル進め，最後の 6 サイクルの平均の IMEP，p_max，η_v，T_b の，参照解との相対差の最大（T_b の分母は max(|T_b|, 2 N·m)）．
   使い方： node tools/solver/survey7.js [出力の JSON] */
'use strict';
const fs=require('fs'),{Core,mkP,D,PI}=require('../dev/node_core').load();
const one=c=>{const c0=c.s.cyc;while(c.s.cyc===c0)c.step();return c.lastM},den={imep:1e5,tb:2};
const rel=(a,b,k)=>Math.abs(a-b)/Math.max(Math.abs(b),den[k]||0);
const NS=[800,1000,1500,2000,2500,3000,4000,5000,6000,7000],AL=[6,10,20,40,90],out=[],t0=Date.now();
for(const N of NS)for(const al of AL){
 const P={...mkP(),cvar:0,sol:1,mode:1,alm:al*D,nt:N},mk=o=>{const c=new Core({...P,...o});c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();c.s.fired=1;c.s.starter=0;return c};
 const z=mk({});for(let i=0;i<40;i++)one(z);const spa=z.s.spa,b=mk({sauto:0,spb:spa});const im=[];for(let i=0;i<40;i++){const M=one(b);if(i>=30)im.push(M.imep)}
 const sw=(Math.max(...im)-Math.min(...im))/Math.max(Math.abs(im[9]),1e5);
 const V={bs:b.clone(),ref:b.clone(),dp:b.clone()};V.bs.P.sol=2;V.ref.P.rtol=1e-8;V.ref.cpS=.125;
 const F={},S={},nf={};for(const k in V)F[k]=one(V[k]);
 for(const k in V){const c=V[k];for(let i=0;i<4;i++)one(c);const n0=c.s.nfe,H=[];for(let i=0;i<6;i++)H.push(one(c));nf[k]=(c.s.nfe-n0)/6;S[k]={};for(const m of['imep','pm','ev','tb'])S[k][m]=H.reduce((a,q)=>a+q[m],0)/6}
 const e1=k=>Math.max(...['imep','phc','ev','pm','xr'].map(m=>rel(F[k][m],F.ref[m],m))),es=k=>Math.max(...['imep','pm','ev','tb'].map(m=>rel(S[k][m],S.ref[m],m)));
 const r={N,al,imep:S.ref.imep,tb:S.ref.tb,sw,e1:{bs:e1('bs'),dp:e1('dp')},es:{bs:es('bs'),dp:es('dp')},nf,bad:V.bs.s.nfa+V.bs.s.clp,fin:V.bs.s.y.every(Number.isFinite)};out.push(r);
 console.log(String(N).padStart(5),String(al).padStart(3)+'°','IMEP',(r.imep/1e3).toFixed(0).padStart(5),'T_b',r.tb.toFixed(1).padStart(6),sw>2e-4?'揺れ '+sw.toExponential(0):'        ','| 既定 1 サイクル',(r.e1.bs*100).toFixed(3),'定常',(r.es.bs*100).toFixed(3),'回数',nf.bs.toFixed(0).padStart(5),'| DOPRI5',(r.e1.dp*100).toFixed(3),(r.es.dp*100).toFixed(3),nf.dp.toFixed(0),r.bad||!r.fin?'※':'')}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out));
const ok=out.filter(r=>r.sw<=2e-4),mx=f=>Math.max(...ok.map(f));
console.log('比べた点 '+ok.length+'／'+out.length+'．既定：1 サイクルの差の最大 '+(mx(r=>r.e1.bs)*100).toFixed(3)+'%，定常の差の最大 '+(mx(r=>r.es.bs)*100).toFixed(3)+'%，0.1% を超えた点 '+ok.filter(r=>r.e1.bs>1e-3||r.es.bs>1e-3).length+'．DOPRI5：'+(mx(r=>r.e1.dp)*100).toFixed(3)+'%，'+(mx(r=>r.es.dp)*100).toFixed(3)+'%．回数の比 '+(ok.reduce((a,r)=>a+r.nf.bs,0)/ok.reduce((a,r)=>a+r.nf.dp,0)).toFixed(3)+'（全 50 点では '+(out.reduce((a,r)=>a+r.nf.bs,0)/out.reduce((a,r)=>a+r.nf.dp,0)).toFixed(3)+'）．強制受理・射影・非有限のあった点 '+out.filter(r=>r.bad||!r.fin).length+'．所要 '+((Date.now()-t0)/1e3).toFixed(0)+' s');
