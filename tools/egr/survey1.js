#!/usr/bin/env node
/* 外部 EGR の試算（調査．製品のコードは変えない）．src/core.js を読み込むときに，吸気マニホールドへの既燃ガスの流入を 1 行だけ足す：
     ṁ_EGR = x_E/(1 − x_E)·max(ṁ_th, 0)   （x_E：EGR 率＝マニホールドへ入る流れのうちの既燃ガスの質量の割合）
   EGR ガスはマニホールドの温度まで冷やして入れる（冷却 EGR）．排気側からの取り出し（排気管の流量が減ること）は数えない．
   回転数固定，点火時期は自動（CA50 を目標に合わせる），サイクル変動なし．開度を合わせて正味平均有効圧 BMEP を目標にそろえ，EGR 率ごとに熱効率を比べる．
   使い方： node tools/egr/survey1.js [--st] [出力の JSON] */
'use strict';
const fs=require('fs'),NC=require('../dev/node_core');
/* --st：乱流燃焼速度の乱れの項にも希釈を効かせる試し（今の式は S_T = S_L + C_turb u' で，乱れの項が希釈によらない）．
   Zimont の形 u_t = u_l + A u' Da^(1/4)（Da ∝ u_l²）にならい，乱れの項を (S_L/S_L(x_r = 0))^(1/2) 倍する．着火遅れの式の乱れの項も同じ． */
const ST=process.argv.includes('--st'),SUB=[['tb=mt>=0?0:mt*Ybi;','tb=(mt>=0?0:mt*Ybi)+(globalThis.__XE||0)/(1-(globalThis.__XE||0))*Math.max(mt,0);']];
if(ST)SUB.push(['const SL=SLf(T,p,xr,ph),u=.5*G.S*om/PI,ST=SL+K.Ct*u,','const SL=SLf(T,p,xr,ph),dil_=Math.sqrt(SL/SLf(T,p,0,ph)),u=.5*G.S*om/PI*dil_,ST=SL+K.Ct*u,']);
const {Core,mkP,D,PI,SWC}=NC.load({sub:SUB});
const one=c=>{const c0=c.s.cyc;let n=0;while(c.s.cyc===c0&&n++<2e5)c.step();return c.lastM};
const avg=(c,n)=>{const H=[];for(let i=0;i<n;i++)H.push(one(c));const o={};for(const k of Object.keys(H[0]))if(typeof H[0][k]==='number')o[k]=H.reduce((a,q)=>a+q[k],0)/n;return o};
function point(N,bt,xE){globalThis.__XE=xE;
 const c=new Core({...mkP(),cvar:0,mode:1,alm:10*D,nt:N});c.fixw=1;c.fixTw=1;c.s.y[5]=c.P.Tw!=null?c.P.Tw:SWC.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();c.s.fired=1;c.s.starter=0;
 /* 開度を割線法で合わせる（対数の開度で） */
 let a0=Math.log(8*D),a1=Math.log(14*D),f0,f1,M;const f=a=>{c.P.alm=Math.min(90*D,Math.exp(a));for(let i=0;i<30;i++)one(c);M=avg(c,6);return M.bmep-bt};
 f0=f(a0);f1=f(a1);
 for(let it=0;it<10&&Math.abs(f1)>2e-3*bt;it++){let a2=a1-f1*(a1-a0)/(f1-f0);a2=Math.max(Math.log(2*D),Math.min(Math.log(90*D),a2));if(!Number.isFinite(a2)||a2===a1)break;a0=a1;f0=f1;a1=a2;f1=f(a1)}
 for(let i=0;i<20;i++)one(c);M=avg(c,10);
 return{N,bt,xE,al:c.P.alm/D,ok:Math.abs(M.bmep/bt-1)<5e-3&&c.s.y.every(Number.isFinite),bmep:M.bmep,imep:M.imep,pmep:M.pmep,fmep:M.fmep,eb:M.eb,ei:M.ei,bsfc:M.bsfc,pin:M.pinE,ybi:M.ybi,xr:M.xr,spa:M.spa,ca50:M.ca50,Tm:M.Tm,Tx:M.Tx,qw:M.Qw/M.Qin,pm:M.pm,nfa:c.s.nfa,clp:c.s.clp}}
const PT=[[1500,200e3],[2000,200e3],[2000,400e3],[3000,500e3],[3000,800e3]],XE=ST?[0,.05,.1,.15,.2,.25,.3,.35,.4]:[0,.05,.1,.15,.2,.25,.3],out=[],t0=Date.now();
for(const [N,bt] of PT){console.log('── '+N+' rpm，BMEP '+bt/1e3+' kPa');let e0=null;
 for(const x of XE){const r=point(N,bt,x);out.push(r);if(x===0)e0=r.eb;
  console.log(('EGR '+(x*100).toFixed(0)+'%').padEnd(8),r.ok?'  ':'×','開度',r.al.toFixed(1).padStart(5)+'°','p_in',(r.pin/1e3).toFixed(1).padStart(5),'kPa  η_b',(r.eb*100).toFixed(2)+'%','（'+((r.eb/e0-1)*100>=0?'+':'')+((r.eb/e0-1)*100).toFixed(1)+'%）','η_i',(r.ei*100).toFixed(2)+'%','PMEP',(r.pmep/1e3).toFixed(1).padStart(6),'kPa  壁の熱',(r.qw*100).toFixed(1)+'%','x_r',(r.xr*100).toFixed(1).padStart(5)+'%','点火',r.spa.toFixed(1).padStart(5),'CA50',r.ca50.toFixed(1),'T_max',r.Tm.toFixed(0),'K  T_x',r.Tx.toFixed(0),'K',r.nfa||r.clp?'※':'')}}
{const f=process.argv.slice(2).find(a=>!a.startsWith('--'));if(f)fs.writeFileSync(f,JSON.stringify(out))}
console.log('所要',((Date.now()-t0)/1e3).toFixed(0),'s');
