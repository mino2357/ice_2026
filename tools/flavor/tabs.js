/* 演出音の試聴サンプル用：回転数×開度の定常サイクルから音源の表を作る（REQ-21 D，7.20 節） */
// 回転数×開度の定常サイクルから音源表（排気弁流量の微分）を作って保存
const fs=require('fs');const S=__dirname+'/../../src/',OUT=__dirname+'/../../dist/';(0,eval)(['core.js','audio.js'].map(f=>fs.readFileSync(S+f,'utf8')).join('\n')+';globalThis.Core=Core;globalThis.mkP=mkP;globalThis.D=D;globalThis.mkTable=mkTable;globalThis.mkEnv=mkEnv;globalThis.cEx=cEx;globalThis.Synth=Synth;globalThis.PI=PI');
const Ns=[800,1500,2500,3500,4500,5500,6500],als=[5,90],out={Ns,als,tab:[],env:[],info:[]};
for(const al of als){const row=[],er=[];for(const N of Ns){const c=new Core({...mkP(),cvar:0,mode:1,alm:al*D,nt:N});c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();let k=c.s.cyc,n=0;while(n<40){c.step();if(c.s.cyc!==k){k=c.s.cyc;n++}}row.push(Array.from(mkTable(c.last.me)));er.push(Array.from(mkEnv(c.last.me)));out.info.push(`α=${al} N=${N} imep=${(c.lastM.imep/1e3).toFixed(0)}kPa fired=${c.s.fired}`)}out.tab.push(row);out.env.push(er)}
fs.writeFileSync(OUT+'flavor_tabs.json',JSON.stringify(out));console.log(out.info.join('\n'))
