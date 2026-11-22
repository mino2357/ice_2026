#!/usr/bin/env node
/* アイドルの回転数の偏差（Node.js）：始動から T 秒運転し，最後の 3 s の |N̄ − 目標| の最大を表示する．
   使い方： node tools/dev/idle.js ['[{"gam":2,"inj":1},{"gam":2,"inj":0},{"gam":0}]'] [T]
   引数は設定の上書きの配列（内部値．既定は直噴・ポート噴射・γ(T) の 3 通り）．サイクル変動は OFF． */
'use strict';
const {mkP,Core}=require('./node_core').load(),V=JSON.parse(process.argv[2]||'[{"gam":2,"inj":1},{"gam":2,"inj":0},{"gam":0}]'),T=+process.argv[3]||20;
for(const o of V){const c=new Core({...mkP(),cvar:0,...o});c.start();const w=[];let tick=0,mn=1e9;while(c.s.t<T){c.step();const k=Math.floor(c.s.t/.05);if(k!==tick){tick=k;if(c.s.t>T-3)w.push(c.s.Nb);if(c.s.fired)mn=Math.min(mn,c.s.Nb)}}
 console.log(JSON.stringify(o),T+' s：最後の 3 s の偏差の最大',Math.max(...w.map(v=>Math.abs(v-c.P.nt))).toFixed(1),'rpm，完爆後の N̄ の最小',mn.toFixed(0),'rpm，完爆',c.s.fired?'済':'無')}
