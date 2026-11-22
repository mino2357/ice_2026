#!/usr/bin/env node
/* 流量関数 Ψ の折れ目（r_p = 1 − δ_r，δ_r = 1e-3．SPEC-04：それより 1 に近い側は直線，遠い側は等エントロピーの式で，傾きが跳ぶ）と，
   BS3 のステップの棄却の関係を数える（Node.js）．Ψ を C¹ にする案（レビューの H-4 の 1）を採るかどうかの判断の材料．
   使い方： node tools/dev/kink.js [サイクル数]
   1 回の試行（bs3c の 1 回の呼び出し．1 段目は前のステップの値を使うので，2〜4 段目の 3 回の右辺）の中で，
     「折れ目をまたぐ」＝ 直線の側（r_p > 1 − δ_r）と，すぐ外側（1 − 3δ_r < r_p ≤ 1 − δ_r）の両方の評価があった
     「折れ目の近く」＝ どちらかがあった
   として，棄却（誤差の見積もり E > 1）の率を比べる．どのオリフィス（吸気弁，排気弁，スロットル）かは区別しない（別のオリフィスが片側ずつでも「またぐ」に数える．多めに数える側）．
   結果は docs/report_alloc.md． */
'use strict';
const sub=[
 ['function psiF(rp,g){\n const k=2*g/(g-1);','function psiF(rp,g){\n globalThis.KZ|=rp>1-1e-3?1:rp>1-3e-3?2:0;\n const k=2*g/(g-1);'],
 ['const psiC=(rp,q)=>rp>1-1e-3?','const psiC=(rp,q)=>(globalThis.KZ|=rp>1-1e-3?1:rp>1-3e-3?2:0,0)||rp>1-1e-3?'],
 ['    bs3c(this,y0,he,k1,kn);\n    s.nfe+=3;','    globalThis.KZ=0;\n    bs3c(this,y0,he,k1,kn);\n    s.nfe+=3;'],
 ['    const pi=Math.pow(Math.max(s.eP,1e-4),BS3.kP);','    {const C=globalThis.CT,z=globalThis.KZ,j=z===3?2:z?1:0;C.n[j]++;if(!(E<=1))C.r[j]++}\n    const pi=Math.pow(Math.max(s.eP,1e-4),BS3.kP);']
];
const {mkP,Core,SWC,D,PI}=require('./node_core').load({sub}),n=+process.argv[2]||40;
globalThis.KZ=0;
globalThis.CT={n:[0,0,0],r:[0,0,0]};
function run(N,al,sp,free){
 const c=new Core(Object.assign(mkP(),{cvar:0,mode:1,alm:al*D,nt:N,sol:2},sp==null?{sauto:1}:{sauto:0,spb:sp}));
 if(!free){c.fixw=1;c.fixTw=1;c.s.y[5]=c.P.Tw??SWC.Tw;c.s.y[1]=N*PI/30;c.s.Nb=N}
 c.start();if(!free){c.s.fired=1;c.s.starter=0}
 const w=free?60:30;while(c.s.cyc<w)c.step();
 globalThis.CT={n:[0,0,0],r:[0,0,0]};
 const c0=c.s.cyc,nfa0=c.s.nfa;let st=0;while(c.s.cyc<c0+n){c.step();st++}
 const C=globalThis.CT,T=C.n[0]+C.n[1]+C.n[2],Rj=C.r[0]+C.r[1]+C.r[2],pc=(a,b)=>b?(100*a/b).toFixed(2)+' %':'–';
 return `${(st/n).toFixed(0)} ステップ/サイクル，試行 ${(T/n).toFixed(0)}/サイクル，棄却 ${pc(Rj,T)}（${(Rj/n).toFixed(1)}/サイクル）｜折れ目から遠い：試行 ${pc(C.n[0],T)}，棄却率 ${pc(C.r[0],C.n[0])}｜近く（またがない）：試行 ${pc(C.n[1],T)}，棄却率 ${pc(C.r[1],C.n[1])}｜またぐ：試行 ${pc(C.n[2],T)}，棄却率 ${pc(C.r[2],C.n[2])}（棄却の ${pc(C.r[2],Rj)}）｜強制受理 ${c.s.nfa-nfa0}`}
for(const [nm,a] of [['800 rpm・開度 6°（回転数固定）',[800,6,17]],['1500 rpm・開度 15°（回転数固定）',[1500,15,22]],['全開 3000 rpm（回転数固定）',[3000,90,25.9]],['全開 7000 rpm（回転数固定）',[7000,90,28.9]],['動力計制御 1500 rpm・開度 15°（回転数は自由）',[1500,15,null,1]],['動力計制御 全開 3000 rpm（回転数は自由）',[3000,90,null,1]]])console.log(nm+'：'+run(...a));
