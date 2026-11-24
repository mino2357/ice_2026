#!/usr/bin/env node
/* 試算：化学平衡のモデルで，吸気ポートの空気の質量を状態にしたとき（質量を圧力から逆算しない）の，定常の値の変化（Node.js）．
   使い方： node tools/dev/portmass.js
   読み込む前にソースを書き換えて比べる（成果物は変わらない）．外部のレビューの C-4 の設計案の材料（docs/changes/2026-11-23-review-gemini-5.md）．
   書き換え：ポートの空気の質量 m_a,p を，使っていない添字 50 の状態にして dm_a,p/dt = ṁ_r Y_a − ṁ_in Y_a で積分し，組成と余剰の分母に使う．圧力の式（断熱の剛性）は変えない． */
'use strict';
const NC=require('./node_core');
const sub=[
 ['const map=Math.max(0,(pp*Vp/TI-mbp*Z.RbI-mfp*A.Rf)/A.Ra);','const map=Math.max(0,y[50]);'],
 ['  let d6,d7,d8,d9,d10,d16,d17,d41,d42;','  let d6,d7,d8,d9,d10,d16,d17,d41,d42,d50=0;'],
 ['   d42=rf-if_;\n   d16=-mr*er-xt;','   d42=rf-if_;\n   d50=ra-ia;\n   d16=-mr*er-xt;'],
 ['  out[50]=0;','  out[50]=d50;'],
 ['const SIX=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,38,39,40,41,42,49]','const SIX=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,38,39,40,41,42,49,50]']
];
function run(proto,o,N,al){
 const {mkP,Core,D,PI,GAS}=NC.load(proto?{sub}:{});
 const c=new Core({...mkP(),cvar:0,mode:1,alm:al*D,nt:N,gam:2,...o});
 c.fixw=1;c.fixTw=1;c.s.y[5]=c.P.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();c.s.fired=1;c.s.starter=0;
 const P=c.P,Vp=.5*PI/4*P.dr*P.dr*P.Lr,TI=300;
 if(proto){const Z=c.zc(),y=c.s.y;y[50]=(y[9]*Vp/298.15-y[10]*Z.RbI-y[42]*GAS.Rf)/GAS.Ra}
 while(c.s.cyc<60)c.step();
 const M=c.lastM;return{imep:M.imep,tb:M.tb,ev:M.ev,xr:M.xr,phc:M.phc,pm:M.pm,y50:c.s.y[50]}}
module.exports={run,sub};
if(require.main===module){
 for(const [nm,o,N,al] of [['直噴 全開 3000',{inj:1},3000,90],['ポート噴射 全開 3000',{inj:0},3000,90],['ポート噴射 1500・15°',{inj:0},1500,15],['直噴 800・6°',{inj:1},800,6],['ポート噴射 全開 6000',{inj:0},6000,90]]){
  const a=run(0,o,N,al),b=run(1,o,N,al),r=k=>((b[k]/a[k]-1)*100).toFixed(3)+' %';
  console.log(nm.padEnd(22),'IMEP',(a.imep/1e3).toFixed(2),'kPa',r('imep'),'| T_b',a.tb.toFixed(3),r('tb'),'| η_v',a.ev.toFixed(4),r('ev'),'| x_r',a.xr.toFixed(4),r('xr'),'| φ_ig',a.phc.toFixed(4),r('phc'),'| p_max',r('pm'))}}
