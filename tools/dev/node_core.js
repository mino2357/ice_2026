/* EngineCore（src/core.js）を Node.js で読み込む．ブラウザもビルドも要らない．
   const {Core,mkP,Sweep,SWC,GAS,K,ITEMS}=require('./node_core').load();
   load({sub:[[/hfg=350e3/,'hfg=305e3']]}) のように，読み込む前にソースを書き換えて感度を調べられる（成果物は変わらない）． */
'use strict';
const fs=require('fs'),path=require('path');
exports.load=(o={})=>{let src=fs.readFileSync(o.file||path.resolve(__dirname,'../../src/core.js'),'utf8');
  for(const [a,b] of o.sub||[]){if(!(a instanceof RegExp?a.test(src):src.includes(a)))throw new Error('書き換える箇所が見つからない: '+a);src=src.replace(a,b)}
  return new Function(src+';return {Core,mkP,Sweep,SweepSet,SWC,swN,GAS,GC,K,ITEMS,PAGES,R,D,PI,valves,vtLim}')()};
