#!/usr/bin/env node
/* 燃焼期間と着火遅れの回転数への依存の調査（製品のコードは変えない）．全開，回転数固定，点火は自動（CA50 = 10° ATDC）．
   --z：乱流燃焼速度の乱れの項を u' の 3/4 乗にする試し（Zimont の形 u_t ∝ u'^(3/4)．2000 rpm で今と同じ値になるようにそろえる）．
   使い方： node tools/burn/survey1.js [--z] */
'use strict';
const NC=require('../dev/node_core'),Z=process.argv.includes('--z');
const {Core,mkP,D,PI}=NC.load({sub:Z?[['const SL=SLf(T,p,xr,ph),u=.5*G.S*om/PI,ST=SL+K.Ct*u,','const SL=SLf(T,p,xr,ph),u=.5*G.S*om/PI,uR_=.5*G.S*(2000*PI/30)/PI,ST=SL+K.Ct*u*Math.pow(u/uR_,-.25),']]:[]});
const one=c=>{const c0=c.s.cyc;while(c.s.cyc===c0)c.step();return c.lastM};
console.log(Z?'乱れの項を u\' の 3/4 乗にした試し':'今のモデル');
for(const N of[1000,2000,3000,4000,5000,6000,7000,10000]){const c=new Core({...mkP(),cvar:0,mode:1,alm:90*D,nt:N});c.fixw=1;c.fixTw=1;c.s.y[5]=c.P.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();c.s.fired=1;c.s.starter=0;let M;for(let i=0;i<60;i++)M=one(c);
 const C=c.s.C,dd=(C.th0-2*PI)/D+M.spa,db=C.db/D,p=c.last.p;let mn=1e9;for(let i=0;i<1440;i++)mn=Math.min(mn,p[i]);
 console.log(String(N).padStart(6),'rpm  点火',M.spa.toFixed(1).padStart(5),'°BTDC  着火遅れ',dd.toFixed(1).padStart(5),'°  燃焼期間',db.toFixed(1),'°（',(db*D/(N*PI/30)*1e3).toFixed(2),'ms）  p_max',(M.pm/1e6).toFixed(2),'MPa  IMEP',(M.imep/1e3).toFixed(0).padStart(5),'kPa  η_i',(M.ei*100).toFixed(1)+'%  η_v',M.ev.toFixed(2),' x_r',(M.xr*100).toFixed(1)+'%  排気上死点',p[0].toFixed(0),'kPa  吸気の最低',mn.toFixed(0),'kPa')}
