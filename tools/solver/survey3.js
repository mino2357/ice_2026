#!/usr/bin/env node
/* 調査 3：BS3(2)（上限なし，rtol 1e-4）で，刻みを決めているもの．誤差の見積もりで最大になる成分，受理と不受理の数，クランク角の区間ごとのステップ数，イベントの合わせ直しの回数． */
'use strict';
const L=require('./lib.js');
const E=L.load([
 ['E=Math.max(E,Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i]))))','{const e_=Math.abs(r5[i]-r4[i])/(ATOL[i]*aS+P.rtol*Math.max(Math.abs(y0[i]),Math.abs(r5[i])));if(e_>E){E=e_;globalThis.__IM=i}}'],
 ['const fac=E===E?','if(globalThis.__H){const H=globalThis.__H;H.try++;if(E<=1){H.acc++;H.ix[globalThis.__IM]=(H.ix[globalThis.__IM]||0)+1;H.th[Math.floor(y0[0]/(Math.PI/2))%8]++}else H.rj[globalThis.__IM]=(H.rj[globalThis.__IM]||0)+1}const fac=E===E?'],
 ['he+=dl/Math.max(this.r5[1],1e-9);','he+=dl/Math.max(this.r5[1],1e-9);if(globalThis.__H)globalThis.__H.ev++;']]),{D}=E;
const NM={0:'θ',1:'ω',2:'p',3:'m',4:'m_u',5:'T_w',6:'p_in',7:'m_b,in',8:'m_r',9:'p_p',10:'m_b,p',13:'13',14:'14',15:'15',16:'E_in',17:'E_p',38:'38',39:'39',40:'40',41:'41',42:'42',49:'T_X'};
const bs3=L.erk([null,[1/2],[0,3/4],[2/9,1/3,4/9]],[2/9,1/3,4/9,0],[7/24,1/4,1/3,1/8]);
L.set();const spa=L.COND.map(c=>L.run(E,c,null,null,80).spa);
L.COND.forEach((c,i)=>{L.set({__ST:bs3,__EX:-1/3,__CAP:1e9,__TC:1});globalThis.__H={try:0,acc:0,ev:0,ix:{},rj:{},th:new Array(8).fill(0)};const r=L.run(E,c,{rtol:1e-4},spa[i],20),H=globalThis.__H;globalThis.__H=null;
 const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>(NM[k]||k)+' '+(100*v/H.try).toFixed(0)+'%').join('，');
 console.log(c[0]+'：試行 '+(H.try/20).toFixed(0)+'／サイクル，不受理 '+(100*(1-H.acc/H.try)).toFixed(0)+'%，イベントの合わせ直し '+(H.ev/20).toFixed(1)+' 回／サイクル');
 console.log('  受理のとき誤差が最大の成分：'+top(H.ix)+'\n  不受理のとき：'+top(H.rj)+'\n  90° ごとの受理の数／サイクル：'+H.th.map(v=>(v/20).toFixed(0)).join(' '))});
