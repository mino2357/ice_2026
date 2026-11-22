#!/usr/bin/env node
/* 運転点のマップ（SPEC-37）の試算：src/core.js の OpMap を Node で実行し，点の数，所要，列の節点の間隔，格子に無い点での補間の誤差を調べる．
   使い方： node tools/map/survey2.js */
'use strict';
const NC=require('../dev/node_core');
const {mkP,Sweep,OpMap,OPM,OPQ}=NC.load({ret:'OpMap,OPM,OPQ'});
const P={...mkP(),cvar:0,mode:0,sol:1};
const t0=Date.now(),M=new OpMap({...P});
while(!M.run(1e4));
const C=M.cols(),tm=M.tmax();
console.log('所要',((Date.now()-t0)/1e3).toFixed(1),'s，点',M.np,'，サイクル',M.pt.flat().reduce((a,q)=>a+q.cyc,0),'，T_max',tm.toFixed(2),'，段階',M.stage);
console.log('列：有効',C.filter(Boolean).length,'/',C.length,'，T = 0 の節点あり',C.filter(c=>c&&c.lo===0).length,'，節点の数',C.map(c=>c?c.nd.length:0).join(' '));
let g=0;for(const c of C)if(c)for(let k=0;k+1<c.nd.length;k++)g=Math.max(g,c.nd[k+1].T-c.nd[k].T);
console.log('隣り合う節点の軸トルクの差の最大',g.toFixed(2),'N·m（上限',(OPM.dT*tm).toFixed(2),'）');
console.log('開度ごとの点の数',[...new Set(M.pt.flat().map(q=>q.al))].sort((a,b)=>b-a).map(a=>a+':'+M.pt.flat().filter(q=>q.al===a).length).join(' '));
const b=M.best();console.log('η_b 最大',(b.eb*100).toFixed(2),'% @',b.N,'rpm，',b.T.toFixed(1),'N·m');
/* 格子に無い点：回転数と開度を別に選んで直接計算 */
const PT=[[1125,30],[1875,14],[2625,10],[3375,20],[4625,17],[5875,25],[625,7],[2125,60],[6625,40],[3875,12],[1375,9],[5125,21]];
for(const [N,al] of PT){
 const S=new Sweep({...P},[N],al);while(!S.run(1e4));
 const q=S.pts[0],r=q.st?null:M.at(N,q.tb);
 if(!r){console.log(N,al,'T_b',q.st?'エンスト':q.tb.toFixed(2),'範囲外');continue}
 console.log(String(N).padStart(5),String(al).padStart(3)+'°','T_b',q.tb.toFixed(2).padStart(6),' Δη_b',((r.eb-q.eb)*100).toFixed(2).padStart(6),'pt  ΔT_X',(r.Tx-q.Tx).toFixed(1).padStart(6),'K  Δṁ',((r.mth/q.mth-1)*100).toFixed(2).padStart(6),'%  Δp_max',((r.pm/q.pm-1)*100).toFixed(2).padStart(6),'%  Δ点火',(r.spa-q.spa).toFixed(2).padStart(6),'°   （η_b',(q.eb*100).toFixed(1),' T_X',q.Tx.toFixed(0),' p_max',(q.pm/1e6).toFixed(2),'）')
}
