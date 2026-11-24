/* ===== verification suite (all in-app) ===== */
/* テストの機関：サイクル変動なし，スロットル制御，DOPRI5（判定値は DOPRI5 で求めたもの．既定の解法 BS3 の精度は TEST-13 項目 14〜 で DOPRI5 の参照解と比べて確かめる．SPEC-20 C） */
const mkPT=()=>({...mkP(),cvar:0,mode:0,sol:1}),SPD={gam:2,inj:1},SPP={gam:2,inj:0},IMEP25=108073.55662509441;
let TR={};
/* テストが一時的に書き換える共有の値の復元（REQ-20 の 8）：書き換えたら onEnd に戻し方を登録する．runAll は，テストが終わったとき，中止されたとき，例外で止まったときに endAll で全部戻す（新しいものから）．
   generator の中の try/finally は，中止のとき genStop（return）で走らせる */
const UNDO=[],
 onEnd=f=>{UNDO.push(f)},
 endAll=()=>{let n=0;while(UNDO.length){n++;try{UNDO.pop()()}catch(e){}}return n},
 genStop=it=>{try{it.return()}catch(e){}};
const TST={},
 NT=37,
 UIT=[8,15,16,17,18,19,20,21,22,23,25,26,27,30,31,32,33,34,35,36,37],
 RUN={t0:0,over:()=>performance.now()-RUN.t0>12,maxF:0,total:0,pj:1,dur:{},at:''};
const pad=i=>String(i).padStart(2,'0');
const chk=(id,n,ref,val,tol)=>{
 const e=Math.abs(val-ref)/(Math.abs(ref)||1);
 (TR[id]=TR[id]||[]).push({n,ref:fnum(ref),val:fnum(val),err:e.toExponential(2),ok:e<=tol})
};
const chkB=(id,n,ok,val,ref)=>{
 (TR[id]=TR[id]||[]).push({n,ref:ref==null?'成立':String(ref),val:val==null?(ok?'成立':'不成立'):String(val),err:'–',ok:!!ok})
};
/* 性能の記録（SPEC-20 B の 10）：時間を測った値と上限．判定する実行（RUN.pj．実機と npm test）では上限を超えると FAIL，判定しない実行（npm run verify）では記録だけ */
const chkP=(id,n,val,lim,unit,dec,note)=>{
 const over=!(val<=lim);
 (TR[id]=TR[id]||[]).push({n:'［性能］'+n,ref:'≤ '+lim+' '+unit,val:(val===val?val.toFixed(dec==null?1:dec):'–')+' '+unit+(note||''),err:'–',perf:1,over,ok:!over||!RUN.pj})
};
const fnum=x=>typeof x==='number'?(Number.isInteger(x)&&Math.abs(x)<1e9?String(x):x.toPrecision(7)):String(x);
const fin=c=>c.s.y.every(Number.isFinite);
function*runCyc(c,n,each){
 let k=0;
 if(Math.abs(c.s.y[0])>1e-6){const cb=c.s.cyc;while(c.s.cyc===cb){c.step();if((++k&3)===0&&RUN.over())yield}}
 const y0=c.s.y.slice(),c0=c.s.cyc;
 while(c.s.cyc<c0+n){const dt=c.step();each&&each(c,dt);if((++k&3)===0&&RUN.over())yield}
 return{y0,y1:c.s.y.slice(),d:i=>c.s.y[i]-y0[i]}
}
const Usens=(c,y)=>{const V=kinV(c.G,y[0]),T=y[2]*V/(y[3]*R),g=c.P.gam;return y[4]*eU(T,g)+(y[3]-y[4])*eB(T,g)};
function*runC(c,T,o){
 o=o||{};
 const t1=c.s.t+T;
 let n=0,cy=c.s.cyc,tk=Math.floor(c.s.t/.05+1e-9);
 while(c.s.t<t1&&!c.s.div){
  c.step();
  if(c.s.cyc!==cy){cy=c.s.cyc;o.cyc&&o.cyc(c)}
  if(o.tick){const k=Math.floor(c.s.t/.05+1e-9);if(k!==tk){tk=k;o.tick(c)}}
  if((++n&3)===0&&RUN.over())yield
 }
}
function*wait(ms){const t=performance.now();while(performance.now()-t<ms)yield'frame'}
const mkRec=()=>{
 const r={
  k:[],
  M:[],
  bad:0,
  tick(c){r.k.push({t:c.s.t,N:c.s.Nb,al:c.s.al,fc:c.s.fc,Ip:c.s.Ip,If:c.s.If})},
  cyc(c){
   r.M.push(c.lastM);
   const t=c.tr;
   for(let i=0;i<1440;i++)if(t.mu[i]<-1e-6||t.mu[i]>t.m[i]*(1+1e-6)+1e-6)r.bad++
  }
 };
 return r
};
const lastT=(r,T)=>{const te=r.k[r.k.length-1].t;return r.k.filter(q=>q.t>te-T)},
 mean=a=>a.reduce((s,v)=>s+v,0)/a.length,
 mdev=(a,x)=>Math.max(...a.map(v=>Math.abs(v-x)));
const lastM=(r,n)=>r.M.slice(-n),avg=(r,n,k)=>mean(lastM(r,n).map(m=>m[k]));
/* scenarios (cached) */
let SC={};
function*scen(name){
 if(SC[name])return SC[name];
 const r=mkRec();
 let c,o={rec:r};
 const from=function*(base,cfg,T){const b=yield*scen(base);c=b.c.clone();Object.assign(c.P,cfg);yield*runC(c,T,r)},
  fresh=function*(cfg,T){c=new Core(Object.assign(mkPT(),cfg));c.start();yield*runC(c,T,r)};
 switch(name){
  case'S1':
   {
    c=new Core(mkPT());
    c.start();
    o.tf=null;
    o.badDisp=0;
    const tk=r.tick;
    r.tick=cc=>{
     tk(cc);
     if(o.tf==null&&cc.s.fired)o.tf=cc.s.t;
     for(const pg of[0,1])for(const q of metricList(cc,pg)){
      const s=q[1];
      if(/NaN|Infinity|undefined/.test(s))o.badDisp++;
      if(/^η/.test(q[0])&&s!=='–'&&!(parseFloat(s)>=0&&parseFloat(s)<=1.5))o.badDisp++;
      if(!cc.s.fired&&/^(IMEP|PMEP|ηi|Pi|ηv|T_b|P_b|BMEP|FMEP|ηm|bsfc|ηb)$/.test(q[0])&&s!=='–')o.badDisp++
     }
    };
    yield*runC(c,5,r);
    o.json=JSON.stringify(c.s);
    break
   }
  case'S2':
   {
    const b=yield*scen('S1');
    c=b.c.clone();
    o.ax=new AxS(5000,500);
    o.axn=[];
    r.cyc=(cy=>cc=>{cy(cc);o.ax.up(amax(cc.tr.p),cc.s.t*1e3);o.axn.push({t:cc.s.t,n:o.ax.n,M:amax(cc.tr.p)})})(r.cyc);
    yield*runC(c,15,r);
    o.json=JSON.stringify(c.s);
    break
   }
  case'S3':
   yield*from('S2',{Tl:3},25);
   break;
  case'N1200':
   yield*from('S2',{nt:1200},8);
   break;
  case'S7':
   yield*from('S2',{pa:8e4},10);
   break;
  case'AMAX':
   yield*from('S2',{nt:2000,amax:5*D},8);
   break;
  case'CS0':
  case'CS6':
  case'CS10':
   {
    c=new Core(Object.assign(mkPT(),{Ta:+name.slice(2)}));
    c.start();
    o.tf=null;
    o.Nmin=1e9;
    o.pmin=1e9;
    o.dal=1e9;
    o.stop=0;
    const tk=r.tick;
    r.tick=cc=>{
     tk(cc);
     const q=cc.s;
     if(o.tf==null&&q.fired)o.tf=q.t;
     if(o.tf!=null){
      if(!q.fired)o.stop=1;else{o.Nmin=Math.min(o.Nmin,q.Nb);o.pmin=Math.min(o.pmin,q.y[6]);o.dal=Math.min(o.dal,q.al-almin(cc.P))}
     }
    };
    yield*runC(c,12,r);
    break
   }
  case'N600':
   yield*from('S2',{Ta:0,nt:600},15);
   break;
  case'F3000':
  case'F3500':
  case'F3000G':
   {
    const N=+name.slice(1,5);
    c=new Core(Object.assign(mkPT(),{sauto:1,mode:1,alm:90*D,nt:N},name[5]==='G'?{gam:0}:{}));
    c.fixw=1;
    c.fixTw=1;
    c.s.y[5]=SWC.Tw;
    c.s.y[1]=N*PI/30;
    c.s.Nb=N;
    c.start();
    let n=0;
    while(c.s.cyc<45){const k=c.s.cyc;c.step();if(c.s.cyc!==k)r.cyc(c);if((++n&3)===0&&RUN.over())yield}
    break
   }
  case'S4':
   yield*fresh({mode:1,nt:1500,alm:15*D},20);
   break;
  case'S4b':
   yield*from('S4',{pa:8e4},10);
   break;
  case'S8':
   yield*from('S4',{phin:30*D},5);
   break;
  case'S5':
   yield*fresh({mode:1,nt:800,alm:90*D},3);
   c.P.Tr=10;
   yield*runC(c,4.5,r);
   break;
  case'S6':
   yield*fresh({mode:1,nt:3000,alm:7*D},3);
   c.P.Tr=3;
   yield*runC(c,6,r);
   o.If5=r.k.find(q=>q.t>=6).If;
   o.If10=c.s.If;
   o.up=c.s.up;
   o.fc10=c.s.fc;
   o.n1=r.k.length;
   c.P.nt=2000;
   yield*runC(c,6,r);
   break;
  case'W3000':
   yield*fresh({mode:1,nt:3000,alm:90*D,Tr:200},12);
   break;
  case'S4V':
   yield*from('S4',{cvar:1},10);
   break;
  case'S2G':
   {
    c=new Core({...mkPT(),gam:0,inj:0,nv:1,dv:.038,dve:.038*.9375,Vm:3e-3,At:300e-6,dpx:4e3});
    c.start();
    yield*runC(c,5,{});
    c=c.clone();
    yield*runC(c,15,r);
    break
   }
  case'G3000D':
  case'G3000P':
  case'G3000D09':
  case'G3000D12':
  case'G1000D':
  case'G7000D':
   {
    const N=+name.slice(1,5),ph=name.slice(6);
    c=new Core(Object.assign(mkPT(),{sauto:1,mode:1,alm:90*D,nt:N,phi:ph==='09'?.9:ph==='12'?1.2:1},name[5]==='D'?SPD:SPP));
    c.fixw=1;
    c.fixTw=1;
    c.s.y[5]=SWC.Tw;
    c.s.y[1]=N*PI/30;
    c.s.Nb=N;
    c.start();
    let n=0;
    const nc=N===3000?45:12;
    while(c.s.cyc<nc){const k=c.s.cyc;c.step();if(c.s.cyc!==k)r.cyc(c);if((++n&3)===0&&RUN.over())yield}
    break
   }
  case'CRANK':
   c=new Core(mkPT());
   c.s.starter=1;
   yield*runC(c,5,r);
   break
 }
 o.c=c;
 return SC[name]=o
}
/* ---- tests ---- */
TST[1]=function*(){
 const G=geo(mkPT());
 chk(1,'V(0) = V_c',G.Vc,kin(G,0).V,1e-12);
 chk(1,'V(π) = V_c + V_d',G.Vc+G.Vd,kin(G,PI).V,1e-12);
 chk(1,'V(π)/V(0) = ε',G.eps,kin(G,PI).V/kin(G,0).V,1e-12);
 let w=0;
 for(const a of[.3,1.1,2.5,4.2]){
  const h=1e-5,fd=(kin(G,a+h).V-kin(G,a-h).V)/2/h;
  w=Math.max(w,Math.abs(fd-kin(G,a).dV)/Math.abs(kin(G,a).dV))
 }
 chkB(1,'dV/dθ と中心差分の相対誤差 < 1e-9',w<1e-9,w.toExponential(2),'< 1e-9');
 let bad=0,n=0,we=0;
 for(const B of[.04,.15])for(const S of[.04,.15])for(const l of[.06,.3])for(const e of[1.1,100]){
  if(S/2/l>.5)continue;
  n++;
  const g=geo({B,S,lr:l,eps:e});
  if(Math.abs(kin(g,PI).V/kin(g,0).V/e-1)>1e-12||Math.abs(kin(g,0).V/g.Vc-1)>1e-12||Math.abs(kin(g,PI).V/(g.Vc+g.Vd)-1)>1e-12)bad++;
  for(const a of[.3,1.1,2.5,4.2]){
   const h=1e-5,fd=(kin(g,a+h).V-kin(g,a-h).V)/2/h,er=Math.abs(fd-kin(g,a).dV)/Math.abs(kin(g,a).dV);
   we=Math.max(we,er);
   if(er>=1e-7)bad++
  }
  for(let a=0;a<720;a+=7){const k=kin(g,a*D);if(!(k.V>0)||k.x<-1e-15||k.x>S*(1+1e-12))bad++}
 }
 chkB(1,`設定範囲の端点 ${n} 組で V(0) = V_c，V(π) = V_c + V_d，V 比 = ε，V > 0，x ∈ [0, S]，dV/dθ と差分の相対誤差 < 1e-7`,bad===0,bad+' 件違反（dV/dθ の最大の相対誤差 '+we.toExponential(1)+'）','0 件')
};
TST[2]=function*(){
 const ab=(n,ref,v)=>chk(2,n,ref,v,1e-12);
 ab('γ_u(300 K)',1.3488,gmU(300,0));
 ab('γ_u(700 K)',1.2968,gmU(700,0));
 ab('γ_u(1000 K)',1.2578,gmU(1000,0));
 ab('γ_u(1500 K)（頭打ち）',1.2578,gmU(1500,0));
 ab('γ_b(300 K)',1.3678,gmB(300,0));
 ab('γ_b(2000 K)',1.208,gmB(2000,0));
 ab('γ_b(2700 K)',1.1422,gmB(2700,0));
 ab('γ_b(3200 K)（頭打ち）',1.1422,gmB(3200,0));
 let w=0,btw=1,lin=0,mono=1;
 for(let T=300;T<=3000;T+=100){
  for(const Y of[0,.3,1]){
   const cv=cvMix(T,Y,0),cp=cpMix(T,Y,0),g=gmMix(T,Y,0);
   w=Math.max(w,Math.abs(cp-cv-R)/R,Math.abs(cp/cv-g)/g);
   const lo=Math.min(gmU(T,0),gmB(T,0)),hi=Math.max(gmU(T,0),gmB(T,0));
   if(g<lo-1e-12||g>hi+1e-12)btw=0
  }
  lin=Math.max(lin,Math.abs(cvMix(T,.3,0)-(.3*cvMix(T,1,0)+.7*cvMix(T,0,0)))/cvMix(T,.3,0));
  if(T>300){
   if(T<=1000&&!(gmU(T,0)<gmU(T-100,0)))mono=0;
   if(T<=2700&&!(gmB(T,0)<gmB(T-100,0)))mono=0;
   if(!(cvMix(T,1,0)>=cvMix(T-100,1,0)&&cvMix(T,0,0)>=cvMix(T-100,0,0)))mono=0
  }
 }
 chkB(2,'c_p − c_v = R，c_p/c_v = γ（300〜3000 K，Y = 0, 0.3, 1）',w<1e-12,w.toExponential(2),'< 1e-12');
 chkB(2,'混合の γ が γ_u と γ_b の間，c_v が Y について線形',btw&&lin<1e-12,'線形からのずれ '+lin.toExponential(1));
 chkB(2,'γ_u，γ_b は頭打ちより下で単調減少，c_v は単調増加',mono);
 let de=0,ct=0;
 for(const[e,g,Tc]of[[eU,gmU,THM.Tu],[eB,gmB,THM.Tb]]){
  for(const T of[350,900,1500,2600,2900]){const d=(e(T+.01,0)-e(T-.01,0))/.02,cv=R/(g(T,0)-1);de=Math.max(de,Math.abs(d/cv-1))}
  ct=Math.max(ct,Math.abs(e(Tc+1e-6,0)-e(Tc-1e-6,0)),Math.abs(e(THM.T0,0)))
 }
 chkB(2,'内部エネルギーの微分 de_k/dT = c_v,k（350, 900, 1500, 2600, 2900 K）',de<1e-6,'最大の相対差 '+de.toExponential(1),'< 1e-6');
 chkB(2,'e_k(T_0) = 0，頭打ちの温度で連続',ct<=1e-2,ct.toExponential(1)+' J/kg','≤ 1e-2');
 let cb=0;
 for(const T of[300,1000,2500])for(const Y of[0,.5,1])if(gmMix(T,Y,1)!==K.g0&&Math.abs(gmMix(T,Y,1)-K.g0)>1e-12)cb++;
 chkB(2,'定比熱比モデル：γ = 1.35，e_k = c_v (T − T_0)',cb===0&&Math.abs(eU(800,1)-R/(K.g0-1)*(800-THM.T0))<1e-9&&eU(800,1)===eB(800,1))
};
TST[3]=function*(){
 for(let i=0;i<3;i++){
  chkB(3,`L(0) = L(1) = 0（${IT.cam.ch[i]}）`,PROF[i](0)+PROF[i](1)<1e-9);
  chk(3,`L(0.5) = L_max（${IT.cam.ch[i]}）`,1,PROF[i](.5),1e-12)
 }
 chk(3,'ξ = 0.25 のリフト比：Aggressive',.8123,PROF[2](.25),1e-4);
 chk(3,'ξ = 0.25 のリフト比：Polynomial',.5625,PROF[1](.25),1e-12);
 chk(3,'ξ = 0.25 のリフト比：Standard',.5,PROF[0](.25),1e-12);
 chkB(3,'滑らかさ：Standard と Polynomial は端の傾きが 0，Aggressive は端で立ち上がる',PROF[0](1e-4)<=1e-6&&PROF[1](1e-4)<=1e-6&&PROF[2](1e-4)>=1e-3,`${PROF[0](1e-4).toExponential(1)}，${PROF[1](1e-4).toExponential(1)}，${PROF[2](1e-4).toExponential(1)}`);
 {
  const Pq=mkPT(),
   g=geo(Pq),
   v1=valves({...Pq,dv:.031,dve:.026},g),
   v2=valves({...Pq,dv:.05,dve:.05},g),
   v0=valves(Pq,g),
   v3=valves({...Pq,dv:.05,dve:.05,nv:1},g),
   cap=(Math.SQRT2-1)*g.B;
  chkB(3,'弁径：吸気 min(d_v, (√2−1)B)，排気 min(d_ve, (√2−1)B)．既定で排気 < 吸気．nv = 1 では上限 0.45B',Math.abs(v1.i.d-.031)<1e-15&&Math.abs(v1.e.d-.026)<1e-15&&Math.abs(v2.i.d-cap)<1e-15&&Math.abs(v2.e.d-cap)<1e-15&&v0.e.d<v0.i.d&&Math.abs(v3.i.d-.45*g.B)<1e-15&&Math.abs(v3.e.d-.45*g.B)<1e-15,`${(v1.i.d*1e3).toFixed(3)}，${(v1.e.d*1e3).toFixed(3)}，${(v2.i.d*1e3).toFixed(2)}，${(v2.e.d*1e3).toFixed(2)} mm．既定 ${(v0.i.d*1e3).toFixed(0)}，${(v0.e.d*1e3).toFixed(0)} mm．nv = 1：${(v3.i.d*1e3).toFixed(1)} mm`);
 /* 項目 8：4 弁 */
  const mid=v=>v.o+md4(v.c-v.o)/2,
   rel=(a,b)=>Math.abs(a-b)/b,
   A=(V,s)=>Aeff(V[s],mid(V[s]),Pq.cam),
   sA=d=>PI/4*d*d,
   vL=valves({...Pq,Lv:.001},g),
   v1v=valves({...Pq,nv:1},g),
   e1=Math.max(rel(A(v0,'i'),2*K.Cdv*sA(v0.i.d)),rel(A(v0,'e'),2*K.Cdv*sA(v0.e.d))),
   e2=Math.max(rel(A(vL,'i'),2*K.Cdv*PI*vL.i.d*.001),rel(A(vL,'e'),2*K.Cdv*PI*vL.e.d*.001)),
   e3=Math.max(rel(A(v1v,'i'),A(v0,'i')/2),rel(A(v1v,'e'),A(v0,'e')/2));
  chkB(3,'4 弁：最大リフトで A_eff = 2 C_d π/4 d²（吸気，排気），最大リフト 1 mm で 2 C_d π d L_v，nv = 1 で半分（相対 1e-12）',v0.n===2&&e1<=1e-12&&e2<=1e-12&&e3<=1e-12,`${e1.toExponential(1)}，${e2.toExponential(1)}，${e3.toExponential(1)}．A_eff 吸気 ${(A(v0,'i')*1e6).toFixed(1)} mm²，排気 ${(A(v0,'e')*1e6).toFixed(1)} mm²`);
  const pg0=U.pg,tx=[];
  for(const p of[1,2]){U.pg=p;rs();pvText();tx.push($('pvt').textContent)}
  U.pg=pg0;
  rs();
  pvText();
  const cS=new Core(mkPT()),
   SS=sysSpec(cS,380,560,document.createElement('canvas').getContext('2d')),
   tg=id=>SS.tags.find(o=>o.id===id).lines.join('／');
  chkB(3,'4 弁の明記：項目の名前「吸気弁径（2 個）」「排気弁径（2 個）」，ページ「VVT・カム」「弁タイミング」の上の文字が「4 弁」で始まる，系統図の弁の枠に「2 ×」',IT.dv.n==='吸気弁径（2 個）'&&IT.dve.n==='排気弁径（2 個）'&&tx.every(t=>t.startsWith('4 弁'))&&tg('vin').includes('2 × 31 mm')&&tg('vex').includes('2 × 26 mm'),`${IT.dv.n}，${IT.dve.n}，「${tx[0].slice(0,12)}…」，${tg('vin')}，${tg('vex')}`)
 }
 const P=mkPT(),G=geo(P);
 chkB(3,'閉弁域で A_eff = 0',Aeff(valves(P,G).i,300*D,0)===0);
 let w=0,dur=[],ar=[];
 const v0=valves(P,G).i;
 for(const ph of[-40,-15,0,15,40]){
  const v=valves({...P,phin:ph*D},G).i;
  let a=0;
  for(let d=0;d<720;d++){const th=d*D;w=Math.max(w,Math.abs(lift(v,th,0)-lift(v0,th-ph*D,0)));a+=lift(v,th,0)}
  dur.push(md4(v.c-v.o));
  ar.push(a)
 }
 chkB(3,'VVT：L(θ;φ) = L(θ−φ;0)',w<1e-12*P.Lv+1e-18,w.toExponential(2),'< 1e-12 L_max');
 chkB(3,'VVT：作用角と ∫L dθ が φ によらず一定',mdev(dur,dur[0])<1e-12&&mdev(ar,ar[0])/ar[0]<1e-9);
 const direct=(Pq)=>{
   const g=geo(Pq),v=valves(Pq,g);
   for(let a=0;a<1440;a++){const th=a*.5*D,h=g.hc+kin(g,th).x;if(lift(v.i,th,Pq.cam)>=h||lift(v.e,th,Pq.cam)>=h)return 1}
   return 0
  },
  Ph={...P,eps:40,Lv:.014,phin:-40*D};
 chkB(3,'既定設定で VALVE HIT なし',valveHit(P,G)===0&&direct(P)===0);
 chkB(3,'ε=40, L=14 mm, φin=−40° で VALVE HIT',valveHit(Ph,geo(Ph))===1&&direct(Ph)===1);
 const a=yield*scen('S4'),b=yield*scen('S8'),e0=avg(a.rec,5,'ev'),e1=avg(b.rec,5,'ev');
 chkB(3,'S8：運転中の φin +30° で状態量が有限',fin(b.c));
 chkB(3,'S8：η_v が 1% 以上変化',Math.abs(e1-e0)/e0>=.01,`${e0.toFixed(3)} → ${e1.toFixed(3)}`,'変化 ≥ 1%')
};
TST[4]=function*(){
 chkB(4,'Δp = 0 → ṁ = 0',mdot(1e5,1e5,300,1e-4,1.4)===0);
 chk(4,'r_crit(γ=1.4)',.5282817877,rcrit(1.4),1e-9);
 chk(4,'Ψ(0.5) = Ψ_max',.68473145,psiF(.5,1.4),1e-7);
 chk(4,'Ψ(0.25) = Ψ(0.5)',psiF(.5,1.4),psiF(.25,1.4),1e-12);
 chk(4,'圧力入替で符号反転',mdot(2e5,1e5,300,1e-4,1.4),-mdot(1e5,2e5,300,1e-4,1.4),1e-12);
 chk(4,'r_crit(γ=1.3)',(2/2.3)**(1.3/.3),rcrit(1.3),1e-12);
 chk(4,'Ψ_max(γ=1.3)',Math.sqrt(1.3*(2/2.3)**(2.3/.3)),psiF(.3,1.3),1e-12);
 {
  const g=1.4,dr=1e-3,sub=x=>x**(1/g)*Math.sqrt(2*g/(g-1)*(1-x**((g-1)/g))),s1=sub(1-dr);
  chk(4,'正則化：r_p = 1 − δ_r の両側で値が連続',psiF(1-dr-1e-12,g),psiF(1-dr+1e-12,g),1e-7);
  chkB(4,'正則化：Ψ(1) = 0',psiF(1,g)===0);
  chk(4,'正則化：r_p = 1 − δ_r/2 で Ψ = Ψ_sub(1 − δ_r)/2',s1/2,psiF(1-dr/2,g),1e-9)
 }
 let c=1;
 for(let r=.05;r<1;r+=.01)if(psiF(r+.01,1.4)>psiF(r,1.4)+1e-12)c=0;
 for(let r=.99;r<1;r+=.0001)if(psiF(r+.0001,1.4)>psiF(r,1.4)+1e-12)c=0;
 chkB(4,'Ψ(r) が r について単調非増加（正則化域を含む）',c)
};
TST[5]=function*(){
 const P=mkPT(),gA=gmU(TA,0);
 chkB(5,'A_th(0) = 0（理想スロットル）',Ath(P,0)===0,String(Ath(P,0)),'0');
 chk(5,'A_th(π/2) = C_d πD²/4',K.Cdt*PI/4*P.Dt**2,Ath(P,PI/2),1e-12);
 let m=1;
 for(let a=0;a<90;a++)if(!(Ath(P,(a+1)*D)>Ath(P,a*D)))m=0;
 chkB(5,'A_th が α について単調増加',m);
 {
  const al=20*D,f=y=>{const mt=mdot(P.pa,y[0],TA,Ath(P,al),gA);return[R*TI/P.Vin*mt,mt]};
  let y=[.3*P.pa,0],mono=1;
  for(let i=0;i<4000;i++){const y2=rk4s(f,y,5e-5);if(y2[0]<y[0]-1e-9)mono=0;y=y2}
  chkB(5,'弁閉で p_in が単調増加し p_atm へ収束',mono&&Math.abs(y[0]-P.pa)/P.pa<1e-3,(y[0]/1e3).toFixed(2)+' kPa',(P.pa/1e3).toFixed(1)+' kPa');
  chk(5,'マニホールド質量保存 ∫ṁ_th dt',P.Vin/(R*TI)*(y[0]-.3*P.pa),y[1],1e-6)
 }
 const A=Ath(P,10*D),ch=A*P.pa/Math.sqrt(R*TA)*psiF(.1,gA);
 chk(5,'チョーク流量（p_in = 0.3 p_atm，γ_u(T_amb)）',ch,mdot(P.pa,.3*P.pa,TA,A,gA),1e-12);
 chk(5,'チョーク流量が p_in に依存しない',mdot(P.pa,.2*P.pa,TA,A,gA),mdot(P.pa,.4*P.pa,TA,A,gA),1e-12);
 chk(5,'チョーク流量 ∝ p_atm（80 kPa）',8e4/P.pa,mdot(8e4,.3*8e4,TA,A,gA)/mdot(P.pa,.3*P.pa,TA,A,gA),1e-12);
 {
  const s4=yield*scen('S4'),q=s4.c.clone(),r=yield*runCyc(q,5);
  chk(5,'S4 定常 5 サイクル：スロットルを通った質量 = 吸気弁を通った質量',r.d(23),r.d(25),.002)
 }
 const c=new Core({...P,pa:8e4});
 c.f(c.s.y);
 chkB(5,'初期状態：p = p_in = p_atm，T_ind = 0',c.s.y[2]===8e4&&c.s.y[6]===8e4&&c.X.Ti===0);
 {
  const s2=yield*scen('S2'),q=s2.c.clone();
  let lo=Infinity,hi=-Infinity,emin=Infinity,tmin=Infinity,ht=0,hm=0;
  const r1=yield*runCyc(q,1),
   r=yield*runCyc(q,5,(cc,dt)=>{
    const X=cc.X,y=cc.s.y;
    lo=Math.min(lo,X.Ybi,X.Ybp);
    hi=Math.max(hi,X.Ybi,X.Ybp);
    emin=Math.min(emin,y[16],y[17]);
    tmin=Math.min(tmin,X.Tup);
    if(X.mi>0){ht+=X.mi*X.Tup*dt;hm+=X.mi*dt}
   });
  chkB(5,'S2 から 6 サイクル：全時刻で 0 ≤ Y_b,in，Y_b,p ≤ 1，E_in，E_p ≥ 0',lo>=0&&hi<=1&&emin>=0,`Y ${lo.toFixed(4)}〜${hi.toFixed(4)}，E の最小 ${emin.toExponential(1)} J`);
  const cr=new Core(mkPT());
  cr.start();
  cr.run(.2);
  cr.reset();
  chkB(5,'コールドリセット直後に m_b,in = m_b,p = E_in = E_p = 0',cr.s.y[7]===0&&cr.s.y[10]===0&&cr.s.y[16]===0&&cr.s.y[17]===0);
  const bo=r.d(11),bi=r.d(12),dm=r.d(7)+r.d(10);
  chk(5,'S2 定常 5 サイクル：吹き返した既燃ガス = 戻った既燃ガス',(bo+bi)/2,bo,.02);
  chkB(5,'吸気側の既燃ガスの増分 = 収支（差 ≤ 吹き返し量の 10⁻³）',Math.abs(dm-(bo-bi))<=1e-3*bo,`増分 ${dm.toExponential(3)}，収支 ${(bo-bi).toExponential(3)}，吹き返し ${bo.toExponential(3)} kg`);
  const xo=r.d(35),xi=r.d(36),xt=r.d(37),dE=r.d(16)+r.d(17);
  chkB(5,'余剰エンタルピーの増分 = 収支 X_o − X_i − X_t（差 ≤ 10⁻⁶ X_o）',Math.abs(dE-(xo-xi-xt))<=1e-6*xo,`増分 ${dE.toExponential(3)}，収支 ${(xo-xi-xt).toExponential(3)}，X_o ${xo.toFixed(3)} J`);
  chk(5,'S2 定常 5 サイクル：吹き返した余剰エンタルピー = 筒内へ戻った分',(xo+xi)/2,xo,.02);
  const Tm=ht/hm;
  chkB(5,'吹き返しによる加熱：吸気弁の順流の上流温度（流量加重平均）が T_in + 15 K 以上，常に T_up ≥ T_in',Tm>=TI+15&&tmin>=TI-1e-9,`平均 ${Tm.toFixed(1)} K（T_in ${TI} K），最小 ${tmin.toFixed(2)} K`)
 }
 {
  const q=new Core({...mkPT(),gam:0}),y=q.s.y.slice();
  q.f(y);
  const t0=q.X.Tup,h0=q.X.hj,Pq=q.P,mp=y[9]*.5*PI/4*Pq.dr*Pq.dr*Pq.Lr/(R*TI),de=cpMix(TI,1,0)*30;
  y[17]=mp*de;
  q.f(y);
  chkB(5,'吸気弁の順流の状態：余剰 0 で T_up = T_in，h_j = h(T_in, Y_j)．余剰 c_p·30 K で T_up = T_in + 30 K，h_j = h(T_in, Y_j) + ε',t0===TI&&h0===hMix(TI,1,0)&&Math.abs(q.X.Tup-(TI+30))<=1e-12*(TI+30)&&Math.abs(q.X.hj-(hMix(TI,1,0)+de))<=1e-12*Math.abs(q.X.hj),`${t0} K，${q.X.Tup.toFixed(6)} K，h_j ${h0.toFixed(1)} → ${q.X.hj.toFixed(1)} J/kg`)
 }
};
TST[6]=function*(){
 const u2=yield*scen('S2'),s=yield*scen('S3'),t=yield*scen('S4'),A=[u2,s,t],nb=A.reduce((a,q)=>a+q.rec.bad,0);
 chkB(6,'全サイクルで 0 ≤ m_u ≤ m（S2, S3, S4）',nb===0,nb+' 点違反','0 点');
 const ym=Math.max(...A.flatMap(q=>lastM(q.rec,5).map(m=>m.YuE)));
 chkB(6,'排気弁が開く時点の未燃分率 Y_u < 0.01（S2, S3, S4）',ym<.01,ym.toExponential(2),'< 0.01');
 chkB(6,'残留ガス率 x_r ∈ [0, 1]（S2, S3, S4）',A.every(q=>lastM(q.rec,5).every(m=>m.xr>=0&&m.xr<=1)));
 {
  const q=t.c.clone(),r=yield*runCyc(q,5),dm=r.d(3),bal=r.d(25)-r.d(26)+r.d(45),ref=t.c.lastM.min*t.c.lastM.tc;
  chkB(6,'質量の収支：筒内質量の増分 = 吸気弁 − 排気弁 ＋ 気化した燃料（S4，5 サイクル）',Math.abs(dm-bal)<=1e-6*Math.abs(ref),`差 ${(dm-bal).toExponential(2)} kg（1 サイクルの吸入 ${ref.toExponential(2)} kg）`,'≤ 10⁻⁶')
 }
};
TST[7]=function*(){
 let s=0;
 const n=2000;
 for(let i=0;i<=n;i++)s+=wiebe(i/n)*(i===0||i===n?.5:1)/n;
 chk(7,'∫dx_b = 1 − e^(−a)',1-Math.exp(-K.wa),s,1e-5);
 chkB(7,'x_r 0.05→0.25 で S_L 減少',SLf(700,1.5e6,.25,1)<SLf(700,1.5e6,.05,1),`${SLf(700,1.5e6,.05,1).toFixed(3)} → ${SLf(700,1.5e6,.25,1).toFixed(3)} m/s`);
 const G=geo(mkPT());
 chkB(7,'点火 20°BTDC→10°ATDC で燃焼期間増大',burn(G,700,1.5e6,.1,1,150,-10).db>burn(G,700,1.5e6,.1,1,150,20).db);
 chk(7,'S_L,0(φ = 1.13) = B_m [m/s]',.2758,SL0(1.13),1e-12);
 chk(7,'S_L,0(φ = 1.0) = 0.2758 − 0.7834 × 0.13² [m/s]',.2758-.7834*.13*.13,SL0(1),1e-12);
 chkB(7,'S_L,0 は φ = 1.13 で最大',SL0(1.13)>SL0(1.0)&&SL0(1.13)>SL0(1.26)&&SL0(1.13)>SL0(.9));
 chk(7,'希釈：x_r = 0.2 の S_L は x_r = 0 の 0.58 倍',.58,SLf(298,101325,.2,1)/SLf(298,101325,0,1),1e-12);
 chk(7,'希釈：x_r = 0.5 では下限の 0.15 倍',.15,SLf(298,101325,.5,1)/SLf(298,101325,0,1),1e-12);
 const v=yield*scen('S4V'),
  b4=yield*scen('S4'),
  M=lastM(v.rec,60),
  im=M.map(m=>m.imep),
  av=q=>q.reduce((s,x)=>s+x,0)/q.length,
  sd=q=>{const m=av(q);return Math.sqrt(av(q.map(x=>(x-m)**2)))},
  cov=sd(im)/av(im);
 chkB(7,'サイクル変動 ON（S4V）：COV(IMEP) が 0.5〜5%（部分負荷の実機の目安）',cov>=.005&&cov<=.05,(cov*100).toFixed(2)+' %');
 chkB(7,'サイクル変動 ON：平均 IMEP が OFF と 2% 以内',Math.abs(av(im)/avg(b4.rec,10,'imep')-1)<=.02,`${(av(im)/1e3).toFixed(1)} / ${(avg(b4.rec,10,'imep')/1e3).toFixed(1)} kPa`);
 const z1=M.map(m=>m.cz[0]),z2=M.map(m=>m.cz[1]);
 chkB(7,'着火時期・燃焼期間の摂動：平均 0，分散 1 の一様乱数（±25%）',Math.abs(av(z1))<.3&&Math.abs(av(z2))<.3&&Math.abs(sd(z1)-1)<=.25&&Math.abs(sd(z2)-1)<=.25&&z1.every(z=>Math.abs(z)<=Math.sqrt(3)+1e-12),`σ ${sd(z1).toFixed(2)}, ${sd(z2).toFixed(2)}`);
 const cm=M.map(m=>m.ca50);
 chkB(7,'サイクル変動 ON でも MBT の平均 CA50 = 10 ± 1°',Math.abs(av(cm)-10)<=1,av(cm).toFixed(2)+'°（σ '+sd(cm).toFixed(1)+'°）');
 const v2=b4.c.clone();
 v2.P.cvar=1;
 yield*runC(v2,10);
 chkB(7,'サイクル変動は決定的（同じ初期状態から同じ結果）',JSON.stringify(v2.s)===JSON.stringify(v.c.s));
 const o0=b4.c.clone();
 o0.P.cvar=0;
 yield*runC(o0,1);
 chkB(7,'サイクル変動 OFF では摂動 0',o0.s.cz[0]===0&&o0.s.cz[1]===0);
 chkB(7,'既定：設定の項目「サイクル変動」の既定値が OFF，既定の設定でも OFF',IT.cvar.d===0&&mkP().cvar===0,`項目 ${IT.cvar.d}，mkP ${mkP().cvar}`,'0，0');
 let rb=0,rm='';
 for(const ph of[1.1,1.2,1.4]){
  const r=richProd(ph),
   y=RICH.y,
   e=[r.a+r.b-1,2*r.c+2*r.d-y,2*r.a+r.b+r.c-2*(1+y/4)/ph,r.b*r.c/(r.a*r.d)-RICH.K].map((v,q)=>Math.abs(v)/(q===3?RICH.K:q===1?y:q===2?2*(1+y/4)/ph:1));
  if(Math.max(...e)>1e-12||[r.a,r.b,r.c,r.d].some(v=>v<0)){rb++;rm+=ph+':'+Math.max(...e).toExponential(1)+' '}
 }
 chkB(7,'リッチ燃焼の生成物：元素保存（C,H,O）と水性ガスシフト K = 3.5 を満たし，全て非負（φ = 1.1, 1.2, 1.4）',rb===0,rb?rm:'3 / 3');
 chk(7,'ε(1) = 1',1,richEps(1),0);
 let mono=1;
 for(let ph=1;ph<1.4;ph+=.02)if(!((ph+.02)*richEps(ph+.02)<ph*richEps(ph)))mono=0;
 chkB(7,'空気量あたりの熱発生 φε(φ) が φ ≥ 1 で単調減少',mono);
 chk(7,'φε(φ) at φ = 1.1',.969,1.1*richEps(1.1),.002/.969);
 chk(7,'φε(φ) at φ = 1.2',.938,1.2*richEps(1.2),.002/.938);
 yield;
 const s4=yield*scen('S4'),
  run=function*(base,cfg,T){const q=base.clone();Object.assign(q.P,cfg);yield*runC(q,T);return q},
  imq={};
 for(const ph of[.8,.9,1,1.1,1.2]){const q=yield*run(s4.c,{phi:ph,sauto:0,spb:Math.round(s4.c.s.spa)},3);imq[ph]=q.lastM.imep}
 chkB(7,'当量比の効果（既定の化学平衡・直噴，モードB，開度固定）：IMEP が 0.8 < 0.9 < 1.0 < 1.1',imq[.8]<imq[.9]&&imq[.9]<imq[1]&&imq[1]<imq[1.1],[.8,.9,1,1.1,1.2].map(p=>(imq[p]/1e3).toFixed(0)).join(' / ')+' kPa');
 {
  const g={};
  for(const ph of[1,1.1,1.2]){
   const c=new Core(Object.assign(mkPT(),{gam:0,phi:ph,sauto:0,spb:25,mode:1,alm:90*D,nt:3000}));
   c.fixw=1;
   c.fixTw=1;
   c.s.y[5]=SWC.Tw;
   c.s.y[1]=3000*PI/30;
   c.s.Nb=3000;
   c.start();
   let n=0;
   while(c.s.cyc<15){c.step();if((++n&3)===0&&RUN.over())yield}
   g[ph]=c.lastM.imep
  }
  chkB(7,'当量比の効果（熱物性 γ(T)，全開・3000 rpm 固定・点火 25° 固定，15 サイクル目）：IMEP が 1.0 > 1.1 > 1.2',g[1]>g[1.1]&&g[1.1]>g[1.2],[1,1.1,1.2].map(p=>(g[p]/1e3).toFixed(0)).join(' / ')+' kPa')
 }
 const s2=yield*scen('S2'),a1=yield*run(s2.c,{phi:1},4),a2=yield*run(s2.c,{phi:1.2},4);
 chkB(7,'当量比の効果（モードA）：φ = 1.2 の燃料流量が 1.0 より 15% 以上多く，回転数は目標 ±25 rpm',a2.lastM.mfd>=1.15*a1.lastM.mfd&&Math.abs(a2.s.Nb-800)<=25&&Math.abs(a1.s.Nb-800)<=25,`${(a1.lastM.mfd*1e3).toFixed(3)} → ${(a2.lastM.mfd*1e3).toFixed(3)} g/s，N̄ ${a1.s.Nb.toFixed(0)} / ${a2.s.Nb.toFixed(0)}`);
 {
  const G=s4.c.G,
   b0=burn(G,700,1.5e6,.1,1,150,20,1,1),
   b1=burn(G,700,1.5e6,.1,1,150,20,2,1),
   b2=burn(G,700,1.5e6,.1,1,150,20,1,2),
   sp=2*PI-20*D;
  chk(7,'c_d = 2 で着火遅れがちょうど 2 倍',2,(b1.th0-sp)/(b0.th0-sp),1e-12);
  chk(7,'c_b = 2 で燃焼期間がちょうど半分',.5,b2.db/b0.db,1e-12);
  let wb=0;
  for(const m of[.5,2,4]){
   let q=0;
   const n=4000;
   for(let i=0;i<=n;i++)q+=wiebe(i/n,m)*(i===0||i===n?.5:1)/n;
   if(Math.abs(q-(1-Math.exp(-K.wa)))>1e-5||Math.abs(1-Math.exp(-K.wa*Math.pow(z50(m),m+1))-.5)>1e-12)wb++
  }
  chkB(7,'m_w = 0.5, 2, 4 で ∫dx_b = 1 − e^(−a)，x_b(ζ50) = 0.5',wb===0,wb+' 件違反')
 }
 yield;
 const f0=yield*run(s4.c,{sauto:0,spb:Math.round(s4.c.s.spa)},2),
  f1=yield*run(s4.c,{sauto:0,spb:Math.round(s4.c.s.spa),cbr:2},2);
 chkB(7,'c_b = 2（点火固定）で p_max が 5% 以上上がる',f1.lastM.pm>=1.05*f0.lastM.pm,`${(f0.lastM.pm/1e6).toFixed(3)} → ${(f1.lastM.pm/1e6).toFixed(3)} MPa`);
 const g1=yield*run(s4.c,{cbr:2},3);
 chkB(7,'c_b = 2（自動最適化 ON）で点火が遅角し CA50 が 10 ± 0.5° に戻る',g1.s.spa<s4.c.s.spa&&Math.abs(g1.lastM.ca50-10)<=.5,`点火 ${s4.c.s.spa.toFixed(1)} → ${g1.s.spa.toFixed(1)}°，CA50 ${g1.lastM.ca50.toFixed(2)}°`)
};
TST[8]=function*(){
 const G=geo(mkPT()),I0={p:1e5,V:5e-4,T:330},V=1e-4,pm=I0.p*(I0.V/V)**1.33;
 chkB(8,'C_w = 0 → 熱伝達率 h = 0',woschni(G,3e6,2000,5,1,I0,V,0).hc===0);
 const a=woschni(G,pm,900,5,1,I0,V,1),b=woschni(G,2*pm,900,5,1,I0,V,1);
 chkB(8,'燃焼増圧で特性速度 w が増大',b.w>a.w,`${a.w.toFixed(2)} → ${b.w.toFixed(2)} m/s`);
 chkB(8,'燃焼増圧で h が増大',b.hc>a.hc,`${a.hc.toFixed(0)} → ${b.hc.toFixed(0)} W/m²K`);
 const c=new Core({...mkPT(),cw:0});
 c.s.y[2]=2e6;
 c.f(c.s.y);
 chkB(8,'C_w = 0 で Q_wall = 0（ソルバ内）',c.X.Qw===0);
 {
  const cg=new Core({...mkPT(),cw:0,gam:0}),y=cg.s.y.slice();
  y[2]=2e6;
  y[5]=300;
  const d=cg.f(y);
  chk(8,'壁温の式（γ(T)）：Q_wall = 0，T_w = 300 K で dT_w/dt = 0.6 K/s',.6,d[5],1e-12)
 }
/* 4，5：壁温の設定（SPEC-08 の B） */
 if(!RUN.ui){
  const mk=o=>new Core(Object.assign(mkPT(),{mode:1,nt:1500,alm:15*D},o)),
   c0=mk(),
   c1=mk({Tw:450}),
   T0=c0.s.y[5],
   T1=c1.s.y[5],
   d5=c0.f(c0.s.y)[5];
  c0.start();
  yield*runC(c0,3);
  const same=c0.s.y[5]===360,a=c0.clone(),b=c0.clone();
  b.P.Tw=500;
  b.step();
  const now=b.s.y[5]===500;
  yield*runC(a,2);
  yield*runC(b,2);
  const qa=a.lastM.Qw,qb=b.lastM.Qw,f=c0.clone();
  f.fixTw=1;
  f.P.Tw=500;
  f.step();
  const hot=mk({Tw:3500});
  hot.start();
  yield*runC(hot,2);
  const fin=hot.s.y.every(v=>v===v&&Math.abs(v)<Infinity);
  chkB(8,'壁温の設定（化学平衡）：コールドリセットで T_w = 設定値（360，450 K），dT_w/dt = 0，3 s 運転しても変わらない，設定を 500 K にすると次のステップで 500 K，壁への熱が減る．壁温の固定の指定があれば変わらない．3500 K で 2 s 計算しても全状態が有限',T0===360&&T1===450&&d5===0&&same&&now&&qb<qa&&f.s.y[5]===360&&fin,`${T0}，${T1} K，dT_w/dt ${d5}，3 s 後 ${c0.s.y[5]} K，変更後 ${b.s.y[5]} K，ΔQ_w ${qa.toFixed(1)} → ${qb.toFixed(1)} J，固定 ${f.s.y[5]} K，3500 K：有限 ${fin}（N̄ ${hot.s.Nb.toFixed(0)} rpm）`)
 }
 {
  uiDefault();
  show(2);
  U.pg=PAGES.indexOf('冷却');
  rs();
  yield;
  const sec=$('s2'),
   ks=ITEMS.filter(i=>i.pg===U.pg).map(i=>i.k),
   b=(k,sg)=>$('Pg').querySelector(`button[data-k="${k}"][data-s="${sg}"]`),
   v0=LP.Tw,
   it=ITEMS.find(i=>i.k==='Tw');
  tapEl(b('Tw',1));
  const ch=Math.abs(LP.Tw-v0-10)<1e-9&&it.lo===300&&it.hi===3500,ns=sec.scrollHeight<=sec.clientHeight+1;
  LP.gam=0;
  rs();
  const dis=ks.every(k=>b(k,1).disabled&&b(k,-1).disabled),
   na=ks.every(k=>$('Pg').querySelector(`i[data-l="${k}"]`).textContent==='（不使用）');
  LP.gam=2;
  rs();
  const sv=live;
  live=(yield*scen('S4')).c.clone();
  pvText();
  const t=$('pvt').textContent,ok=['壁温','壁への熱','排気'].every(w=>t.includes(w))&&/\d/.test(t);
  live=sv;
  uiDefault();
  chkB(8,'設定ページ「冷却」：1 項目（壁温．300〜3500 K），[+] で 1 刻み（10 K），スクロール無し，γ(T) で不使用・無効，パネルの文字に壁温・壁への熱・排気',U.pg>=0&&ks.join()==='Tw'&&ch&&ns&&dis&&na&&ok,`${ks.join()}，${v0}→${v0+10} K ${ch}，スクロール無し ${ns}，不使用 ${dis&&na}；「${t}」`);
  show(3)
 }
};
TST[9]=function*(){
 const G=geo(mkPT()),g=K.g0,n=20000,h=PI/n,df=(t,p)=>-g*p*kin(G,t).dV/kin(G,t).V;
 let p=1e5,W=0;
 const st=t=>{
  const a=df(t,p),b=df(t+h/2,p+h/2*a),c=df(t+h/2,p+h/2*b),d=df(t+h,p+h*c),p2=p+h/6*(a+2*b+2*c+d);
  W+=(p+p2)/2*(kin(G,t+h).V-kin(G,t).V);
  p=p2
 };
 for(let i=0;i<n;i++)st(PI+i*h);
 chk(9,'断熱圧縮 p(2π) = p(π) ε^γ',1e5*G.eps**g,p,1e-5);
 for(let i=0;i<n;i++)st(2*PI+i*h);
 chk(9,'膨張後 p(3π) = p(π)',1e5,p,1e-5);
 chkB(9,'1往復の図示仕事 = 0',Math.abs(W)/(1e5*G.Vd)<1e-5,(W/(1e5*G.Vd)).toExponential(2),'|W|/(p V_d) < 1e-5');
 for(const[nm,Y,e]of[['未燃ガス',1,eU],['既燃ガス',0,eB]]){
  const c=new Core({...mkPT(),gam:0,cw:0});
  c.fixw=1;
  c.fixTw=1;
  const y=c.s.y,th=270*D,V=kinV(c.G,th),T0=450,m=1e5*V/(R*T0);
  y[0]=th;
  y[1]=200;
  y[2]=1e5;
  y[3]=m;
  y[4]=Y*m;
  const W0=y[18];
  while(c.s.y[0]<355*D&&c.s.y[0]>=th)c.step();
  const z=c.s.y,T1=z[2]*kinV(c.G,z[0])/(z[3]*R),dU=m*(e(T1,0)-e(T0,0)),dW=z[18]-W0;
  chkB(9,`温度依存比熱の閉じた系（${nm}，270°→上死点）：m Δe = −ΔW`,Math.abs(dU+dW)<=1e-6*Math.abs(dW)&&T1>=700&&Math.abs(z[3]-m)<1e-15,`m Δe ${dU.toFixed(4)} J，−ΔW ${(-dW).toFixed(4)} J，終端 ${T1.toFixed(0)} K`,'相対誤差 ≤ 10⁻⁶，終端 ≥ 700 K')
 }
/* 5：定比熱比のモデルを EngineCore の右辺で（項目 1 は式を手で積分したもので，EngineCore を通らない） */
 {
  const c=new Core({...mkPT(),gam:1,cw:0});
  c.fixw=1;
  c.fixTw=1;
  const y=c.s.y,th=270*D,V0=kinV(c.G,th),m=1e5*V0/(R*450);
  y[0]=th;
  y[1]=200;
  y[2]=1e5;
  y[3]=m;
  y[4]=m;
  const W0=y[18];
  let n=0;
  while(c.s.y[0]<355*D&&c.s.y[0]>=th){c.step();n++}
  const z=c.s.y,
   V1=kinV(c.G,z[0]),
   pe=1e5*(V0/V1)**K.g0,
   e1=Math.abs(z[2]/pe-1),
   dW=z[18]-W0,
   Wx=(1e5*V0-pe*V1)/(K.g0-1),
   e2=Math.abs(dW/Wx-1);
  chkB(9,'定比熱比のモデル（EngineCore の右辺，弁閉，熱損失なし，270°→上死点の手前）：p V^γ が一定（相対 1e-6），仕事が (p₀V₀ − p₁V₁)/(γ − 1) に一致（相対 1e-6）',e1<=1e-6&&e2<=1e-6&&n>10&&Math.abs(z[3]-m)<1e-15,`p の相対差 ${e1.toExponential(1)}，仕事の相対差 ${e2.toExponential(1)}（${n} ステップ）`)
 }
 for(const nm of['S2G','F3000G']){
  const sc=yield*scen(nm),
   q=sc.c.clone(),
   r=yield*runCyc(q,5),
   dU=Usens(q,r.y1)-Usens(q,r.y0),
   res=dU+r.d(18)+r.d(32)-r.d(31)-r.d(33)+r.d(34);
  chkB(9,`第一法則の収支（熱物性 γ(T)，${nm}，5 サイクル）：|ΔU_s + ΔW + ΔQ_w − ΔQ_c − ΔH_i + ΔH_o| ≤ 10⁻⁴ ΔQ_c`,Math.abs(res)<=1e-4*r.d(31),`残差 ${res.toExponential(2)} J（ΔQ_c ${r.d(31).toFixed(1)} J，比 ${(res/r.d(31)).toExponential(1)}）`)
 }
 {
  const sc=yield*scen('W3000'),q=sc.c.clone(),r=yield*runCyc(q,5),f=r.d(32)/r.d(31),Tm=q.lastM.Tm;
  chkB(9,'全開（既定の化学平衡・直噴，W3000）：壁面熱損失／発熱（表示用の熱発生率の積分）が 0.10〜0.30，T_max が 2200〜2800 K',f>=.1&&f<=.3&&Tm>=2200&&Tm<=2800,`${f.toFixed(3)}，${Tm.toFixed(0)} K`)
 }
};
TST[10]=function*(){
 const G=geo(mkPT());
 chk(10,'Chen–Flynn FMEP（p_max=5000 kPa, 3000 rpm）[Pa]',13.7e3+.005*5e6+16.2e3*(2*.086*3000/60),fmepCF(G,5e6,3000*PI/30),1e-12);
 const k=yield*scen('CRANK'),
  m=k.c.lastM,
  a=(K.cfA+K.cfB*k.c.s.pmx)*G.Vd/P4+k.c.P.Ta,
  b=K.cfC*G.S/PI*G.Vd/P4,
  we=(K.Tst-a)/(K.Tst/K.wnl+b);
 chkB(10,'無燃焼クランキング平衡回転数（理論値 ±15%）',Math.abs(m.wb-we)/we<=.15,(m.wb*30/PI).toFixed(0)+' rpm',(we*30/PI).toFixed(0)+' rpm ±15%');
 chkB(10,'無燃焼では完爆判定されない',!k.c.s.fired);
 const s=yield*scen('S1');
 chkB(10,'S1：3 s 以内に完爆',s.tf!=null&&s.tf<=3,s.tf==null?'未完爆':s.tf.toFixed(2)+' s','≤ 3 s');
 s.c.f(s.c.s.y);
 chkB(10,'完爆後 T_starter = 0',s.c.s.starter===0&&s.c.X.Ts===0);
 chkB(10,'S1：全状態量が有限',fin(s.c));
 const q=yield*scen('S3'),M=lastM(q.rec,1)[0];
 chk(10,'摩擦仕事 W_f = FMEP·V_d',M.Wf,M.fmep*G.Vd,1e-9);
 {
  const c=new Core(mkPT());
  c.f(c.s.y);
  const t0=c.X.Ti;
  c.fixw=1;
  c.s.y[1]=100;
  const d1=c.f(c.s.y)[1];
  c.fixw=0;
  const y=c.s.y.slice();
  y[1]=0;
  y[2]=5e4;
  y[0]=.5;
  const d=c.f(y);
  chkB(10,'p = p_atm で T_ind = 0，回転数固定で dω/dt = 0，ω = 0 で右辺が負なら dθ/dt = dω/dt = 0',t0===0&&d1===0&&d[0]===0&&d[1]===0)
 }
};
TST[11]=function*(){
 const P=mkPT(),w1=1000*PI/30,w8=60000*PI/30;
/* 1：容量と右辺 */
 {
  const a=dynMax(P,w1),b=dynMax(P,w8),c=dynMax(P,-w8),c0=new Core(mkPT());
  c0.s.y[1]=w1;
  const X=[];
  for(const T of[12.3,-4.1]){c0.s.fe=T;c0.f(c0.s.y);X.push(c0.X.Td)}
  chkB(11,'容量：|T| ≤ min(T_rated, P_rated/ω)（1000 rpm で T_rated，60000 rpm で P_rated/ω，向きによらない），右辺の T_dyno = T_e（吸収 12.3，駆動 −4.1 N·m）',a===P.Tr&&Math.abs(b/(P.Pr/w8)-1)<=1e-12&&c===b&&X[0]===12.3&&X[1]===-4.1,`1000 rpm ${a.toFixed(2)}，60000 rpm ${b.toFixed(2)} N·m，右辺 ${X.join('，')} N·m`)
 }
/* 2：一次遅れ */
 const lg=dt=>{
  let fe=0;
  const n=Math.round(P.td/dt);
  for(let i=0;i<n;i++)fe=20+(fe-20)*Math.exp(-dt/P.td);
  return fe
 };
 chk(11,'T_e(τ_d) = (1 − 1/e) T_c（T_c = 20 N·m，Δt = 1e-4）',20*(1-Math.exp(-1)),lg(1e-4),1e-9);
 chk(11,'T_e(τ_d) = (1 − 1/e) T_c（Δt = 1e-3）',20*(1-Math.exp(-1)),lg(1e-3),1e-9);
/* 3，4：つり合いと動力計制御 */
 const s3=yield*scen('S3');
 chk(11,'S3（スロットル制御，負荷トルク 3 N·m）：T_b = T_dyno（10サイクル平均）',avg(s3.rec,10,'Tdm'),avg(s3.rec,10,'tb'),.02);
 const w3=lastT(s3.rec,3);
 chkB(11,'スロットル制御：T_c = T_load で一定',w3.every(q=>q.fc===3));
 const s4=yield*scen('S4'),w=lastT(s4.rec,5),N=w.map(q=>q.N);
 chkB(11,'S4（動力計制御, 1500 rpm）：平均 ±10 rpm',Math.abs(mean(N)-1500)<=10,mean(N).toFixed(1)+' rpm','1500 ±10');
 chkB(11,'S4：瞬時 ±25 rpm',mdev(N,1500)<=25,'最大偏差 '+mdev(N,1500).toFixed(1)+' rpm','≤ 25');
 chkB(11,'S4：0 < T_c < T_max（吸収）',w.every(q=>q.fc>0&&q.fc<P.Tr),mean(w.map(q=>q.fc)).toFixed(2)+' N·m');
 chkB(11,'S4：α が α_manual に固定',w.every(q=>q.al===15*D));
 {
  const k1=s4.rec.k.find(q=>q.t>=1);
  chkB(11,'S4：スターターを使わず，始動から 1 s で N̄ > 1000 rpm',k1.N>1000,k1.N.toFixed(0)+' rpm')
 }
/* 5：燃料を止めると駆動して回転数を保つ */
 {
  const c=s4.c.clone();
  c.s.fuel=0;
  const k=[];
  yield*runC(c,8,{tick(q){k.push({t:q.s.t,N:q.s.Nb,fc:q.s.fc})}});
  const q=k.filter(o=>o.t>c.s.t-3),Nq=q.map(o=>o.N);
  chkB(11,'燃料を止めた S4（8 s）：駆動して最後の 3 s の N̄ が 1500 ±25 rpm，T_c < 0（駆動），完爆の状態のまま',mdev(Nq,1500)<=25&&q.every(o=>o.fc<0)&&c.s.fired===1,`最大偏差 ${mdev(Nq,1500).toFixed(1)} rpm，T_c ${mean(q.map(o=>o.fc)).toFixed(2)} N·m`)
 }
/* 6，7：容量の判定 */
 const s6=yield*scen('S6'),a=s6.rec.k.slice(s6.n1);
 chkB(11,'S6（定格 3 N·m）：T_c = −T_max に張り付き UNDERPOWER',s6.fc10===-3&&s6.up>=2,`T_c=${s6.fc10} N·m, ${s6.up.toFixed(1)} s`);
 chkB(11,'S6：張り付きの間に |I_T| が増え続けない',Math.abs(s6.If10)<=Math.abs(s6.If5)+1e-12,`${s6.If5.toFixed(4)} → ${s6.If10.toFixed(4)}`);
 const tr=a.find(q=>Math.abs(q.fc)<3);
 chkB(11,'S6：目標を届く値（2000 rpm）にすると 5 s 以内に張り付きが解ける',tr&&tr.t-a[0].t<=5,tr?(tr.t-a[0].t).toFixed(2)+' s':'解けず','≤ 5 s');
 chkB(11,'S6：再整定（2000 ±50 rpm）',Math.abs(a[a.length-1].N-2000)<=50,a[a.length-1].N.toFixed(0)+' rpm');
 const s4b=yield*scen('S4b');
 chkB(11,'大気圧 80 kPa で軸トルク減少（動力計制御）',avg(s4b.rec,5,'tb')<avg(s4.rec,5,'tb'),`${avg(s4.rec,5,'tb').toFixed(1)} → ${avg(s4b.rec,5,'tb').toFixed(1)} N·m`);
 const s5=yield*scen('S5');
 chkB(11,'S5（定格 10 N·m，全開）：T_c = T_max に張り付き OVERLOAD',s5.c.s.fc===dynMax(s5.c.P,s5.c.s.y[1])&&s5.c.s.ov>=2,`T_c=${s5.c.s.fc} N·m, ${s5.c.s.ov.toFixed(1)} s`);
/* 8：切替 */
 {
  const s2=yield*scen('S2'),c=s2.c.clone(),a0=c.s.al,f0=c.s.fc;
  c.P.mode=1;
  c.step();
  const a1=c.s.al,f1=c.s.fc,okA=c.P.alm===a0&&a1===a0&&Math.abs(f1-f0)<=1e-3;
  c.P.mode=0;
  c.step();
  const okB=c.P.Tl===Math.max(0,f1)&&c.s.fc===c.P.Tl&&Math.abs(c.s.fc-f1)<=1e-3&&Math.abs(c.s.al-a1)<=.01*D;
  chkB(11,'モードの切替で指令が連続（A → B：α_manual ← α，|ΔT_c| ≤ 10⁻³ N·m．B → A：T_load ← max(0, T_c)，|Δα| ≤ 0.01°）',okA&&okB,`A→B：α ${(a0/D).toFixed(3)} → ${(a1/D).toFixed(3)}°，T_c ${f0.toFixed(4)} → ${f1.toFixed(4)}／B→A：α → ${(c.s.al/D).toFixed(3)}°，T_c → ${c.s.fc.toFixed(4)} N·m`)
 }
/* 9：定格と目標によらない整定（W3000 の続き．(a) そのまま 4 s，(b) 既定の定格・目標 4000 rpm で 8 s） */
 {
  const w3=yield*scen('W3000'),res=[];
  for(const [nm,o,T] of[['(a) 定格 200 N·m，目標 3000 rpm',{},4],['(b) 既定の定格，目標 4000 rpm',{Tr:IT.Tr.d,nt:4000},4]]){
   const c=w3.c.clone();
   Object.assign(c.P,o);
   const t1=c.s.t+T;
   let mn=1e9,mx=0,k=0;
   while(c.s.t<t1){
    c.step();
    if(c.s.t>t1-2){mn=Math.min(mn,c.s.Nb);mx=Math.max(mx,c.s.Nb)}
    if((++k&3)===0&&RUN.over())yield
   }
   res.push([nm,mx-mn,mn,mx])
  }
  chkB(11,'定格と目標によらない整定：全開で (a) 定格 200 N·m・目標 3000 rpm，(b) 既定の定格・目標 4000 rpm の最後の 2 s の N̄ の幅 ≤ 20 rpm',res.every(r=>r[1]<=20),res.map(r=>`${r[0]}：${r[1].toFixed(1)} rpm（${r[2].toFixed(0)}〜${r[3].toFixed(0)}）`).join('，'),'≤ 20 rpm')
 }
/* 11：モータリングの操作 */
 {
  const c=new Core({...mkPT(),mode:1,nt:1500});
  c.start();
  const st0=c.s.starter===0&&c.s.fired===1;
  yield*runC(c,1);
  const N1=c.s.Nb;
  yield*runC(c,3);
  const N4=c.s.Nb;
  c.stop();
  const f1=c.s.fuel===0&&c.s.fired===1;
  const k=[];
  yield*runC(c,3,{tick(q){k.push(q.s.Nb)}});
  const Nq=k.slice(-20),Tc=c.s.fc,W=c.lastM.W;
  c.stop();
  c.step();
  const f2=c.s.fired===0&&c.s.fc===0,d=(yield*scen('S2')).c.clone();
  d.stop();
  const f3=d.s.fired===0&&d.s.fuel===0;
  chkB(11,'モータリングの操作：動力計制御の start() でスターターなしに 1 s で N̄ > 1000 rpm，4 s で 1500 ±25 rpm，stop()（FUEL CUT）の 3 s 後も運転中で 1500 ±25 rpm・T_c < 0・図示仕事 < 0，もう一度 stop()（STOP）で停止・T_c = 0．スロットル制御は stop() 1 回で停止',st0&&N1>1000&&Math.abs(N4-1500)<=25&&f1&&mdev(Nq,1500)<=25&&Tc<0&&W<0&&f2&&f3,`${st0?1:0}${f1?1:0}${f2?1:0}${f3?1:0}，1 s 後 ${N1.toFixed(0)}，4 s 後 ${N4.toFixed(0)} rpm，モータリング 最大偏差 ${mdev(Nq,1500).toFixed(1)} rpm，T_c ${Tc.toFixed(2)} N·m`)
 }
/* 12：40000 rpm のモータリング */
 {
  const c=new Core({...mkPT(),mode:1,nt:40000,alm:90*D});
  c.start();
  c.stop();
  c.s.y[1]=40000*PI/30;
  c.s.Nb=40000;
  let mn=1e9,mx=0,fin=true,k=0,um=0;
  const t1=c.s.t+2;
  while(c.s.t<t1){
   c.step();
   um=Math.max(um,c.s.up);
   if(c.s.t>t1-.4){mn=Math.min(mn,c.s.Nb);mx=Math.max(mx,c.s.Nb)}
   if((++k&1023)===0){if(!c.s.y.every(Number.isFinite))fin=false;if(RUN.over())yield}
  }
  const Tm=dynMax(c.P,c.s.y[1]);
  chkB(11,'40000 rpm のモータリング（既定の機関と定格，2 s）：状態が有限，最後の 0.4 s の N̄ が 40000 ±25 rpm，|T_c| < T_max，UNDERPOWER の表示（2 s 続く）なし',fin&&c.s.y.every(Number.isFinite)&&mn>=39975&&mx<=40025&&Math.abs(c.s.fc)<Tm&&um<2,`N̄ ${mn.toFixed(0)}〜${mx.toFixed(0)} rpm，T_c ${c.s.fc.toFixed(1)} N·m（T_max ${Tm.toFixed(1)}），${(c.s.fc*c.s.y[1]/1e3).toFixed(0)} kW`)
 }
/* 10：既定 */
 chkB(11,'既定：設定「回転数の制御」の既定値が動力計（1），既定の設定でも動力計制御',IT.mode.d===1&&mkP().mode===1,`項目 ${IT.mode.d}，mkP ${mkP().mode}`,'1，1')
};
TST[12]=function*(){
 const s2=yield*scen('S2');
 let N2;
 {/* 始動の後の揺れが収まってから判定する：S2 からさらに 10 s 運転した後の 3 s（S2 の最後の 3 s は始動から 17〜20 s で，揺れが残る．TEST-12 項目 1） */
  const q=s2.c.clone(),r=mkRec();
  yield*runC(q,10,r);
  N2=lastT(r,3).map(x=>x.N)
 }
 chkB(12,'S2 から 10 s：アイドル 800 ±25 rpm（最後の 3 s）',mdev(N2,800)<=25,'最大偏差 '+mdev(N2,800).toFixed(1)+' rpm','≤ 25');
 const a2=mean(lastT(s2.rec,3).map(q=>q.al));
 {
  const am=almin(s2.c.P);
  chkB(12,'S2：α が下限 α_min に張り付かない',lastT(s2.rec,3).every(q=>q.al>am),(a2/D).toFixed(2)+'°','> '+(am/D).toFixed(2)+'°')
 }
 const n=yield*scen('N1200'),Nn=lastT(n.rec,2).map(q=>q.N);
 chkB(12,'目標 1200 rpm へ整定（±25 rpm）',mdev(Nn,1200)<=25,'最大偏差 '+mdev(Nn,1200).toFixed(1)+' rpm','≤ 25');
 const s7=yield*scen('S7'),N7=lastT(s7.rec,3).map(q=>q.N),a7=mean(lastT(s7.rec,3).map(q=>q.al));
 chkB(12,'S7：80 kPa でも 800 ±25 rpm',mdev(N7,800)<=25,'最大偏差 '+mdev(N7,800).toFixed(1)+' rpm','≤ 25');
 chkB(12,'S7：定常開度が増加',a7>a2,`${(a2/D).toFixed(2)}° → ${(a7/D).toFixed(2)}°`);
 const am=yield*scen('AMAX'),k=am.rec.k,i4=k.find(q=>q.t>=k[0].t+4);
 chkB(12,'α_max 制限中に I_α が増え続けない',k[k.length-1].Ip<=i4.Ip+1e-12&&k[k.length-1].al===5*D,`${i4.Ip.toExponential(3)} → ${k[k.length-1].Ip.toExponential(3)}`);
 const s4=yield*scen('S4'),w=lastT(s4.rec,10);
 chkB(12,'モードBで I_α が更新されない',w.every(q=>q.Ip===w[0].Ip));
 const s4m=yield*scen('S4'),cm=lastM(s4m.rec,25).map(m=>m.ca50);
 chkB(12,'MBT：S4 定常の CA50 が ATDC 10 ± 0.5°（最後の 25 サイクル）',cm.every(v=>Math.abs(v-10)<=.5),`${Math.min(...cm).toFixed(2)}〜${Math.max(...cm).toFixed(2)}°`);
 const sx=s4m.c.s.spa,
  run2=function*(cfg){
   const q=s4m.c.clone();
   Object.assign(q.P,cfg);
   const ims=[];
   yield*runC(q,2,{cyc:cc=>ims.push(cc.lastM.imep)});
   return mean(ims.slice(-10))
  },
  ia=yield*run2({}),
  sw=[];
 for(const dd of[-8,-4,4,8])sw.push(yield*run2({sauto:0,spb:sx+dd}));
 const mx=Math.max(ia,...sw);
 chkB(12,'MBT：自動値の IMEP が ±4°, ±8° 固定の最大値の 99% 以上',ia>=.99*mx,`自動 ${sx.toFixed(1)}°: ${(ia/1e3).toFixed(1)} kPa / 最大 ${(mx/1e3).toFixed(1)} kPa`);
 chk(12,'MBT：x_b(θ_50) = 0.5（Wiebe）',.5,1-Math.exp(-K.wa*Math.pow(z50(),K.wm+1)),1e-12);
 {
  const q=new Core({...mkPT(),sauto:0,spb:23});
  q.start();
  yield*runC(q,2);
  chkB(12,'自動最適化 OFF では点火時期 = 設定値',q.s.spa===23&&q.s.fired===1,q.s.spa+'°')
 }
 {
  const P=mkPT(),am=(o)=>almin({...P,...o})/D;
  chk(12,'α_min（T_aux = 0）[°]',2,am({Ta:0}),1e-12);
  chk(12,'α_min（T_aux = 2 N·m）[°]',2.52,am({Ta:2}),1e-12);
  chk(12,'α_min（T_aux = 20 N·m）[°]',7.2,am({Ta:20}),1e-12);
  chkB(12,'α_base = 0，T_aux = 0 で α_min = 0',am({Ta:0,alb:0})===0);
  chkB(12,'α_min ≤ α_max（α_max = 5°，T_aux = 20 N·m）',almin({...P,Ta:20,amax:5*D})===5*D)
 }
 for(const Ta of[0,6,10]){
  const q=yield*scen('CS'+Ta),nm=`冷間始動 T_aux = ${Ta} N·m：`;
  chkB(12,nm+'3 s 以内に完爆し，停止しない',q.tf!=null&&q.tf<=3&&!q.stop&&q.c.s.fired===1,q.tf==null?'完爆せず':q.stop?'停止':'完爆 '+q.tf.toFixed(2)+' s','≤ 3 s，停止なし');
  chkB(12,nm+'完爆後の N̄ の最小 ≥ 450 rpm',!q.stop&&q.Nmin>=450,q.Nmin.toFixed(0)+' rpm','≥ 450');
  chkB(12,nm+'完爆後は常に α ≥ α_min',q.dal>=-1e-12,(q.dal/D).toFixed(3)+'°','≥ 0');
  chkB(12,nm+'完爆後の吸気管圧の最小 ≥ 6 kPa',q.pmin>=6e3,(q.pmin/1e3).toFixed(1)+' kPa','≥ 6')
 }
 {
  const q=yield*scen('N600'),w=lastT(q.rec,6),am=almin(q.c.P);
  {
   const Ns=w.map(z=>z.N);
   chkB(12,'N600（T_aux = 0）：止まらず，最後の 6 s の N̄ がすべて 600 ±100 rpm（この回転数では振れ続ける．振れの幅の記録）',!!q.c.s.fired&&mdev(Ns,600)<=100,`${Math.min(...Ns).toFixed(0)}〜${Math.max(...Ns).toFixed(0)} rpm，平均 ${mean(Ns).toFixed(1)} rpm`,'最大偏差 ≤ 100')
  }
  chkB(12,'N600：α > α_min（下限が制御を妨げない）',w.every(z=>z.al>am),(mean(w.map(z=>z.al))/D).toFixed(2)+'°','> '+(am/D).toFixed(2)+'°')
 }
};
TST[13]=function*(){
 const f=y=>[y[1],-y[0]],
  er=h=>{
   let y=[1,0];
   const n=Math.round(1/h);
   for(let i=0;i<n;i++)y=rk4s(f,y,h);
   return Math.hypot(y[0]-Math.cos(1),y[1]+Math.sin(1))
  },
  r=er(.02)/er(.01);
 chkB(13,'RK4 の大域誤差が 4 次（刻み半減で 1/16）',r>14&&r<18,'比 '+r.toFixed(2),'14〜18');
 const le=h=>{const q=dp45(f,[1,0],h);return Math.hypot(q.y5[0]-Math.cos(h),q.y5[1]+Math.sin(h))},r5=le(.2)/le(.1);
 chkB(13,'DOPRI5 の局所誤差が h⁶（刻み半減で 1/64）',r5>50&&r5<80,'比 '+r5.toFixed(1),'50〜80');
 const emb=h=>{const q=dp45(f,[1,0],h);return Math.hypot(q.y5[0]-q.y4[0],q.y5[1]-q.y4[1])},re=emb(.2)/emb(.1);
 chkB(13,'埋め込み誤差推定が h⁵',re>26&&re<38,'比 '+re.toFixed(1),'26〜38');
 const b=yield*scen('S3'),
  one=function*(base,cfg,nc){
   const c=base.clone();
   Object.assign(c.P,cfg);
   const c0=c.s.cyc;
   while(c.s.cyc<c0+1){c.step();if(RUN.over())yield}
   const r=yield*runCyc(c,nc);
   return{M:c.lastM,r}
  },
  fx=sp=>({sauto:0,spb:sp});
 {
  const sp=b.c.s.spa,
   a=(yield*one(b.c,{sol:0,dth:IT.dth.d*IT.dth.f,...fx(sp)},1)).M,
   d=(yield*one(b.c,{sol:1,rtol:1e-5,...fx(sp)},1)).M,
   e=(yield*one(b.c,{sol:0,dth:.05*D,...fx(sp)},1)).M;
  chk(13,'S3：RK4（既定）と参照 RK4（0.05°）の p_max',e.pm,a.pm,.001);
  chk(13,'S3：DOPRI5（既定）と参照の p_max',e.pm,d.pm,.001);
  chk(13,'S3：RK4（既定）と参照の W',e.W,a.W,.001);
  chk(13,'S3：DOPRI5（既定）と参照の W',e.W,d.W,.001)
 }
 const s2=yield*scen('S2');
 {
  const sp=s2.c.s.spa,
   a=yield*one(s2.c,{sol:0,dth:IT.dth.d*IT.dth.f,...fx(sp)},3),
   e=yield*one(s2.c,{sol:0,dth:.02*D,...fx(sp)},3);
  chk(13,'アイドル（S2）：RK4（既定）と参照 RK4（0.02°）の IMEP（3 サイクル目）',e.M.imep,a.M.imep,.005);
  chk(13,'アイドル：RK4（既定）の「吸気弁を通った質量 ＋ 気化した燃料」と排気弁を通った質量（3 サイクル）',a.r.d(25)+a.r.d(45),a.r.d(26),.002)
 }
 const s4=yield*scen('S4');
 {
  const q=s4.c.clone();
  yield*runCyc(q,1);
  q.s.eve=0;
  q.s.evn=[0,0,0,0,0,0,0,0];
  let lo=Infinity,hi=-Infinity,nE=0,bE=0,wE='';
  const dE=q.doEv;
  q.doEv=function(y1,th1){/* イベントを処理した後の θ が，イベントの角度と同じ（サイクルの終端では 0）か（REQ-13 の 3） */
   dE.call(this,y1,th1);
   const w=Math.abs(th1-P4)<=1e-7?0:th1;
   nE++;
   if(y1[0]!==w){bE++;wE=wE||`${th1.toFixed(6)} → ${y1[0]}`}
  };
  yield*runCyc(q,3,cc=>{lo=Math.min(lo,cc.s.y[0]);hi=Math.max(hi,cc.s.y[0])});
  delete q.doEv;
  chkB(13,'イベント（S4，3 サイクル）：終端・IVO・IVC・EVO・EVC・点火・下死点（π，3π）の角度の誤差 ≤ 10⁻⁸ rad，各 3 回',q.s.eve<=1e-8&&q.s.evn.length===8&&q.s.evn.every(v=>v===3),`最大の誤差 ${q.s.eve.toExponential(1)} rad，回数 ${q.s.evn.join(' ')}`);
  chkB(13,'イベントを処理した後の θ がイベントの角度と同じ（サイクルの終端では 0）',nE>=30&&bE===0,`処理 ${nE} 回，合わない ${bE} 回${wE?'（'+wE+'）':''}`);
  chkB(13,'クランク角が [0, 4π] にある（厳密）',lo>=0&&hi<=P4,`${lo.toExponential(1)}〜${hi.toFixed(6)} rad`)
 }
 const f3=yield*scen('F3000');
 {
  const M=lastM(f3.rec,5),w=3000*PI/30,e=Math.max(...M.map(m=>Math.abs(m.tc*w/P4-1)));
  chkB(13,'回転数固定（3000 rpm）：サイクルの時間 = 4π/ω',e<=1e-9,'相対誤差 '+e.toExponential(1),'≤ 10⁻⁹');
  const q=f3.c.clone(),
   r=yield*runCyc(q,5),
   v=[23,24,25,26,27,28].map(i=>r.d(i)-(i>=26?r.d(44):0)),
   sp=(Math.max(...v)-Math.min(...v))/Math.max(...v);
  chkB(13,'集計の整合（全開 3000 rpm，5 サイクル）：スロットル・ランナ・吸気弁を通った質量と，排気弁・排気管・出口を通った質量から噴いた燃料を引いたものが 0.1% 以内',sp<=1e-3,'最大の差 '+(sp*100).toFixed(4)+' %','≤ 0.1 %')
 }
 {
  const q=s2.c.clone(),r=yield*runCyc(q,5);
  chk(13,'集計の整合（アイドル，5 サイクル）：「吸気弁を通った質量 ＋ 気化した燃料」と排気弁を通った質量',r.d(25)+r.d(45),r.d(26),.005)
 }
 {
  const L=['S1','S2','S3','S4','S5','S6','W3000','CS0','CS6','CS10'];
  let cl=0,nf=0;
  for(const nm of L){const sc=yield*scen(nm);cl+=sc.c.s.clp;nf+=sc.c.s.nfa}
  chkB(13,`射影と強制受理（${L.length} シナリオの全ステップ）：どちらも 0 回`,cl===0&&nf===0,`射影 ${cl} 回，強制受理 ${nf} 回`,'0，0')
 }
 chk(13,'最高圧の補間：p = 5 − 2(θ − 1.3)² の 3 点から頂点の値',5,parab(1,5-2*.09,1.2,5-2*.01,1.5,5-2*.04),1e-12);
 {
  const M=s4.c.lastM;
  chkB(13,'S4：p_max がステップ点の最大以上で 1.001 倍以下',M.pm>=M.pmS&&M.pm<=1.001*M.pmS,`${(M.pm/1e3).toFixed(2)} / ${(M.pmS/1e3).toFixed(2)} kPa`)
 }
 {
  const q=s2.c.clone(),
   IX=[0,1,2,3,4,5,6,7,8,9,10,13,14,15,16,17],
   HS=[1e-7,1e-4,1,1e-10,1e-10,1e-4,1,1e-11,1e-7,1,1e-11,0,0,1e-7,1,1,1e-6,1e-6],
   n=IX.length;
  let lm=0,la=0,next=0,k=0;
  const c0=q.s.cyc;
  while(q.s.cyc===c0){
   const y=q.s.y,dg=y[0]/D;
   if(dg>=next){
    next=Math.floor(dg/10)*10+10;
    q.wx=0;
    const J=[];
    for(const i of IX){
     const h=Math.max(Math.abs(y[i])*1e-6,HS[i]),yp=y.slice(),ym=y.slice();
     yp[i]+=h;
     ym[i]-=h;
     const fp=q.f(yp),fm=q.f(ym);
     J.push(IX.map(r=>(fp[r]-fm[r])/(2*h)))
    }
    let v=new Array(n).fill(1),lam=0;
    for(let it=0;it<60;it++){
     const u=new Array(n).fill(0);
     for(let a=0;a<n;a++)for(let r=0;r<n;r++)u[r]+=J[a][r]*v[a];
     lam=Math.hypot(...u)/Math.hypot(...v);
     const nu=Math.hypot(...u)||1;
     v=u.map(x=>x/nu)
    }
    if(lam>lm){lm=lam;la=dg}
    q.wx=1
   }
   q.step();
   if((++k&3)===0&&RUN.over())yield
  }
  chkB(13,'硬さ（アイドル，10° ごと）：max|λ| × Δt_max（RK4）≤ 2.79',lm*K.dtR4<=2.79,`max|λ| ${lm.toExponential(2)} 1/s（${la.toFixed(0)}°），|λ|Δt_max = ${(lm*K.dtR4).toFixed(2)}`,'≤ 2.79')
 }
 {
  const c=b.c.clone();
  let bad=0,n=0;
  const cy=c.s.cyc;
  while(c.s.cyc<cy+1){
   const y=c.s.y,h=Math.min(c.s.h,1e-4);
   if(n%16===0){
    const f1=c.f(y),f2=c.f(y,new Array(NY).fill(0)),r=dp45(q=>c.f(q),y,h);
    dp45c(c,y,h,c.f(y));
    if(f1.some((v,i)=>v!==f2[i])||r.y5.some((v,i)=>v!==c.r5[i])||r.y4.some((v,i)=>i<NS&&v!==c.r4[i]))bad++;
    const V=c.V,tt=md4(y[0]);
    for(const v of[V.i,V.e])if(lift(v,tt,c.P.cam)!==lift({o:v.o,c:v.c,L:v.L,d:v.d},tt,c.P.cam))bad++
   }
   c.step();
   n++;
   if((n&3)===0&&RUN.over())yield
  }
  let pb=0;
  for(const g of[1.24,1.3,1.35,1.4])for(let r=.05;r<1;r+=.05){
   const k=2*g/(g-1),
    dr=1e-3,
    sub=x=>x**(1/g)*Math.sqrt(k*(1-x**((g-1)/g))),
    ref=r<=(2/(g+1))**(g/(g-1))?Math.sqrt(g*(2/(g+1))**((g+1)/(g-1))):r<=1-dr?sub(r):(1-r)/dr*sub(1-dr);
   if(psiF(r,g)!==ref)pb++
  }
  let pc=0,np=0;
  for(const g of[1.24,gmU(TA,0),gmB(TX,0),1.4]){
   const q=psiK(g);
   for(const r of[.05,.2,.4,.5,.52,.55,.6,.7,.8,.9,.95,.99,.998,1-1e-3,1-5e-4,1-1e-9,1]){np++;if(psiC(r,q)!==psiF(r,g))pc++}
   for(const[a,b]of[[2e5,1.3e5],[1e5,2e5],[1e5,99990],[3e5,1e5]]){np++;if(mdotC(a,b,700,1e-4,q)!==mdot(a,b,700,1e-4,g))pc++}
  }
  chkB(13,`高速化した経路が元の式と完全一致（1 サイクル ${n} ステップのうち 16 おき：f の出力先指定，dp45c と dp45，弁リフトの前計算；Ψ の実装と定義式 76 点；γ が一定の流れ用に定数を前計算した Ψ と流量 ${np} 点）`,bad===0&&pb===0&&pc===0,`不一致 ${bad}，Ψ ${pb}，前計算 ${pc}`,'0，0，0')
 }
/* 12：極端な弁の時期（REQ-13 の 9） */
 {
  const sc=yield*scen('S2'),o=[];
  let ok=1;
  for(const[nm,v,g]of[['a',{ivo:-60,ivc:-20},{gam:2,inj:1}],['b',{ivo:-60,ivc:-20},{gam:2,inj:0}],['c',{ivo:-10,ivc:-9},{gam:2,inj:1}],['d',{evo:729,evc:730},{gam:0}]]){
   const c=sc.c.clone();
   Object.assign(c.P,g);
   for(const k in v)c.P[k]=v[k]*D;
   yield*runC(c,2);
   const f=fin(c);
   if(!f)ok=0;
   o.push(`(${nm}) ${f?'有限':'非有限'}，N̄ ${Number.isFinite(c.s.Nb)?c.s.Nb.toFixed(0):'–'} rpm`)
  }
  chkB(13,'極端な弁の時期で状態が有限：(a) IVO −60°，IVC −20°（化学平衡・直噴），(b) 同（ポート噴射），(c) 作用角 1°（IVO −10°，IVC −9°），(d) EVO 729°，EVC 730°（γ(T)）．各 2 s',ok,o.join('，'))
 }
/* 13：RK4 の刻みの範囲（REQ-13 の 10） */
 {
  const it=IT.dth,
   q0=Math.abs(it.lo-.01)<1e-12&&Math.abs(it.hi-5)<1e-12&&Math.abs(it.st-.01)<1e-12&&Math.abs(it.d-.25)<1e-12&&IT.sol.d===2,
   s2=yield*scen('S2'),
   c=s2.c.clone();
  c.P.sol=0;
  c.P.dth=.01*D;
  let nk=0,dmx=0;
  for(let i=0;i<200;i++){
   const th=c.s.y[0];
   c.step();
   const d=md4(c.s.y[0]-th)/(.01*D);
   dmx=Math.max(dmx,d);
   if(Math.abs(d-1)<=1e-3)nk++
  }
  const w=(yield*scen('W3000')).c,a=w.clone(),b=w.clone();
  a.P.sol=0;
  a.P.dth=5*D;
  const c0=a.s.cyc,cl0=a.s.clp;
  let hm=0;
  while(a.s.cyc<c0+3){hm=Math.max(hm,a.step());if(RUN.over())yield}
  yield*runCyc(b,3);
  const di=Math.abs(a.lastM.imep/b.lastM.imep-1);
  chkB(13,'RK4 の刻みの範囲：設定は 0.01〜5°（刻み 0.01°，既定 0.25°），既定の解法は BS3(2)．Δθ = 0.01°（S2，200 ステップ）で 1 ステップの角度が 0.01°（相対 1e-3．イベントで切るステップを除く），Δθ = 5°（全開 3000 rpm，3 サイクル）で状態が有限，射影 0 回，刻み ≤ 1.02 Δt_max（イベントの直前は 2% まで延ばす），IMEP が既定の解法と 1% 以内',q0&&nk>=190&&dmx<=1+1e-3&&fin(a)&&a.s.clp===cl0&&hm<=1.02*K.dtR4*(1+1e-6)&&di<=.01,`範囲 ${it.lo}〜${it.hi}°，0.01° のステップ ${nk}/200（最大 ${dmx.toFixed(5)} 倍），5°：${fin(a)?'有限':'非有限'}，射影 ${a.s.clp-cl0}，最大の刻み ${(hm*1e6).toFixed(1)} μs，IMEP の差 ${(di*100).toFixed(3)} %`)
 }
/* 13：既定の解法 BS3(2)（REQ-13 の 11〜15．SPEC-13 の 8） */
 {
  const CD=[[800,6,17],[1500,15,22],[3000,90,25.9],[7000,90,28.9]],
   mk=(N,al,sp)=>{
    const c=new Core({...mkPT(),mode:1,alm:al*D,nt:N,sauto:0,spb:sp});
    c.fixw=1;
    c.fixTw=1;
    c.s.y[5]=c.P.Tw??SWC.Tw;
    c.s.y[1]=N*PI/30;
    c.s.Nb=N;
    c.start();
    c.s.fired=1;
    c.s.starter=0;
    return c
   },
   rel=(a,b)=>Math.abs(a/b-1),
   avg4=function*(c){
    yield*runCyc(c,3);
    const H=[];
    for(let i=0;i<4;i++){yield*runCyc(c,1);H.push(c.lastM)}
    return m=>H.reduce((a,q)=>a+q[m],0)/4
   };
  let e1=0,es=0,bad=0,ms=0,trd=NaN,fsn=0,fsok=0;
  const nf={bs:0,dp:0,rk:0},er={dp:0,rk:0},o1=[];
  for(const[N,al,sp]of CD){
   const b=mk(N,al,sp);
   yield*runCyc(b,30);
   const V={bs:b.clone(),ref:b.clone(),dp:b.clone(),rk:b.clone()},F={};
   V.bs.P.sol=2;
   V.ref.P.rtol=1e-7;
   V.ref.atS=.01;
   V.ref.cpS=.25;
   V.rk.P.sol=0;
   for(const k in V){const n0=V[k].s.nfe;yield*runCyc(V[k],1);F[k]=V[k].lastM;if(nf[k]!=null)nf[k]+=V[k].s.nfe-n0}
   const d1=k=>Math.max(...['imep','phc','ev','pm','xr'].map(m=>rel(F[k][m],F.ref[m])));
   e1=Math.max(e1,d1('bs'));
   er.dp=Math.max(er.dp,d1('dp'));
   er.rk=Math.max(er.rk,d1('rk'));
   o1.push((d1('bs')*100).toFixed(3));
   if(N===7000){
/* 線図の升：BS3 は刻みが 0.5° より大きい．升が抜けず，DOPRI5 の線図との差が小さいこと */
    const a=V.bs.tr.p,d=V.dp.tr.p,pm=Math.max(...d);
    trd=0;
    for(let i=0;i<1440;i++)trd=Math.max(trd,Number.isFinite(a[i])?Math.abs(a[i]-d[i])/pm:Infinity)
   }
   const t0=performance.now(),A=yield*avg4(V.bs),tb=performance.now()-t0,R=yield*avg4(V.ref);
   if(N===3000){
    ms=tb/7;
/* 最後の段の使い回し：使い回す値が，同じ状態での右辺と同じ（回転数固定で，制御の入力が変わらない条件） */
    const c=V.bs,tmp=new Array(NY).fill(0);
    for(let i=0;i<200;i++){
     c.step();
     if(c.kFy===c.s.y){fsn++;c.wx=0;c.f(c.s.y,tmp);c.wx=1;if(SIX.every(j=>tmp[j]===c.kF[j]))fsok++}
    }
   }
   es=Math.max(es,...['imep','pm','ev','tb'].map(m=>rel(A(m),R(m))));
   bad+=V.bs.s.nfa-b.s.nfa+V.bs.s.clp-b.s.clp+(fin(V.bs)?0:1)
  }
  chkB(13,'既定の解法（BS3）の精度：4 条件（800 rpm・開度 6°，1500 rpm・15°，全開 3000，全開 7000 rpm）で，同じ状態から進めた 1 サイクルの IMEP，φ_ig，η_v，p_max，x_r と，その後の定常（4 サイクルの平均）の IMEP，p_max，η_v，T_b が，参照解と相対差 0.1% 以内．強制受理と射影が無い',e1<=1e-3&&es<=1e-3&&bad===0,`1 サイクル ${o1.join('，')} %，定常 ${(es*100).toFixed(3)} %，強制受理・射影 ${bad}`,'≤ 0.1 %');
  chkB(13,'既定の解法の計算量：同じ 4 条件の 1 サイクルの右辺の評価の回数の合計が，DOPRI5（第26版の既定）の 0.3 倍以下',nf.bs<=.3*nf.dp,`BS3 ${nf.bs}，DOPRI5 ${nf.dp}（${(nf.bs/nf.dp).toFixed(3)} 倍），RK4 ${nf.rk}`,'≤ 0.3 倍');
  chkB(13,'既定が最良：設定で選べる解法（RK4，DOPRI5，BS3）のうち，1 サイクルの精度（参照解と 0.1% 以内）を満たすものの中で，既定の BS3 の回数が最小',IT.sol.d===2&&IT.sol.ch.join()==='RK4,DOPRI5(4),BS3(2)'&&e1<=1e-3&&['dp','rk'].every(k=>er[k]>1e-3||nf[k]>nf.bs),`誤差 BS3 ${(e1*100).toFixed(3)}，DOPRI5 ${(er.dp*100).toFixed(3)}，RK4 ${(er.rk*100).toFixed(3)} %`);
  chkB(13,'線図の升（BS3，全開 7000 rpm）：1440 升がすべて有限で，筒内圧の線図の DOPRI5 との差が最高圧の 2% 以下',trd<=.02,`${(trd*100).toFixed(2)} %`,'≤ 2 %');
  chkB(13,'最後の段の使い回し（BS3，全開 3000 rpm，200 ステップ）：使い回す値が，同じ状態での右辺と浮動小数点数として同じ．使い回せるステップが 9 割以上',fsn>=180&&fsok===fsn,`使い回せる ${fsn}／200，一致 ${fsok}`);
  chkP(13,'既定の解法の 1 サイクルの計算時間（全開 3000 rpm）',ms,8,'ms',2);
 }
/* 13：イベントの取りこぼしが無い（回転数が速く変わる始動と，イベントが重なる・ごく近い設定）．終わりの時点で，どのイベントの処理の回数も，サイクルの終端の回数と 1 以内 */
 {
  const out=[];
  let ok=true;
  for(const[nm,o,T]of[
   ['始動からアイドル（BS3）',{mode:0,sol:2},6],
   ['始動からアイドル（DOPRI5）',{mode:0,sol:1},6],
   ['動力計制御 全開 0 → 7000 rpm',{mode:1,nt:7000,alm:90*D,sol:2},4],
   ['IVC が点火の 0.001° 手前',{mode:1,nt:3000,alm:90*D,sauto:0,spb:20,ivc:(340-.001)*D,sol:2},3],
   ['IVC = 点火',{mode:1,nt:3000,alm:90*D,sauto:0,spb:20,ivc:340*D,sol:2},3]
  ]){
   const c=new Core({...mkP(),cvar:1,...o});
   c.start();
   let k=0,cy=c.s.cyc,ev=null,nc=0,ng=0;
   while(c.s.t<T){
    c.step();
    if(c.s.cyc!==cy){
     cy=c.s.cyc;
     if(ev){nc++;if(c.s.evn.length!==8||!c.s.evn.every((v,i)=>v-ev[i]===1))ng++}
     ev=c.s.evn.slice()
    }
    if((++k&3)===0&&RUN.over())yield
   }
   const q=nc>=20&&ng===0&&fin(c);
   if(!q)ok=false;
   out.push(`${nm}：${nc} サイクル，違反 ${ng}`)
  }
  chkB(13,'イベントの取りこぼしが無い：始動（BS3，DOPRI5），動力計制御の全開 0 → 7000 rpm，IVC が点火の 0.001° 手前，IVC = 点火 のそれぞれで，どのサイクルでも，サイクルの終端・IVO・IVC・EVO・EVC・点火・下死点（π，3π）がちょうど 1 回ずつ処理される（20 サイクル以上）',ok,out.join('；'))
 }
/* 13：硬さ（化学平衡のモデルの全状態．項目 10 は γ のモデルと共通の 16 状態だけ）：燃料の質量，液体の燃料，吸気側の燃料蒸気，排気ポートの温度，ポートの空気の質量を含む 23 状態のヤコビアン */
 {
  const IX=SIX.filter(i=>i!==11&&i!==12),
   n=IX.length,
   hs=i=>i===0?1e-7:i===1?1e-4:i===2||i===6||i===9||i===14||i===15?1:i===5||i===49?1e-4:i===8||i===13?1e-7:i===16||i===17?1e-6:1e-11,
   out=[];
  let worst=0;
  for(const[nm,mk]of[
   ['S2（アイドル）',function*(){return(yield*scen('S2')).c.clone()}],
   ['全開 3000 rpm・直噴・気化の時定数 0.1 ms',function*(){const q=(yield*scen('W3000')).c.clone();q.P.tev=1e-4;yield*runCyc(q,2);return q}]
  ]){
   const q=yield*mk();
   let lm=0,la=0,next=0,k=0;
   const c0=q.s.cyc;
   while(q.s.cyc===c0){
    const y=q.s.y,dg=y[0]/D;
    if(dg>=next){
     next=Math.floor(dg/10)*10+10;
     q.wx=0;
     const J=[];
     for(const i of IX){
      const h=Math.max(Math.abs(y[i])*1e-6,hs(i)),yp=y.slice(),ym=y.slice();
      yp[i]+=h;
      ym[i]-=h;
      const fp=q.f(yp),fm=q.f(ym);
      J.push(IX.map(r=>(fp[r]-fm[r])/(2*h)))
     }
     let v=new Array(n).fill(1),lam=0;
     for(let it=0;it<60;it++){
      const u=new Array(n).fill(0);
      for(let a=0;a<n;a++)for(let r=0;r<n;r++)u[r]+=J[a][r]*v[a];
      lam=Math.hypot(...u)/Math.hypot(...v);
      const nu=Math.hypot(...u)||1;
      v=u.map(x=>x/nu)
     }
     if(lam>lm){lm=lam;la=dg}
     q.wx=1
    }
    q.step();
    if((++k&3)===0&&RUN.over())yield
   }
   worst=Math.max(worst,lm);
   out.push(`${nm}：max|λ| ${lm.toExponential(2)} 1/s（${la.toFixed(0)}°），|λ|Δt_max = ${(lm*K.dtR4).toFixed(2)}`)
  }
  chkB(13,'硬さ（化学平衡のモデルの 23 状態，10° ごと）：アイドルと，全開 3000 rpm・直噴・気化の時定数 0.1 ms で，max|λ| × Δt_max（RK4）≤ 2.79',worst>0&&worst*K.dtR4<=2.79,out.join('；'),'≤ 2.79')
 }
/* 13：不連続な変更の直後は最後の段を使い回さない（REQ-13 の 17．SPEC-13 の 8） */
 {
  const c0=new Core({...mkPT(),gam:2,inj:0,mode:1,alm:90*D,nt:3000,sol:2});
  c0.start();
  yield*runCyc(c0,40);
/* probe：使い回せる状態（pre も満たす）まで進め，変更 chg を加えて 1 ステップ進める．re：そのステップの最初の右辺の評価がステップのはじめの状態で行われた（＝使い回していない．1 段目と表示の値は，変更後の入力での右辺そのもの）．dif：変更の前後で右辺が違う */
  const probe=(chg,pre)=>{
    const c=c0.clone(),a=new Array(NY).fill(0),b=new Array(NY).fill(0);
    let g=0;
    c.step();
    while((c.kFy!==c.s.y||(pre&&!pre(c)))&&g++<4000)c.step();
    const y0=c.s.y,ok0=c.kFy===y0;
    c.wx=0;
    c.f(y0,a);
    chg(c);
    c.updV();
    c.syncSw();
    c.f(y0,b);
    c.wx=1;
    let first=null;
    const F=c.f;
    c.f=function(y,o){if(first===null)first=y===y0;return F.call(this,y,o)};
    c.step();
    return{re:ok0&&first===true,keep:ok0&&first===false,dif:SIX.some(j=>a[j]!==b[j])}
   },
   ivOpen=c=>Aeff(c.V.i,md4(c.s.y[0]),c.P.cam)>0,
   CH=[
    ['φ',c=>{c.P.phi=1.1}],
    ['C_w',c=>{c.P.cw=.5}],
    ['p_a',c=>{c.P.pa=9e4}],
    ['T_aux',c=>{c.P.Ta=5}],
    ['φ_in',c=>{c.P.phin=10*D},ivOpen],
    ['T_w',c=>{c.P.Tw=450}],
    ['スロットル径',c=>{c.P.Dt=.03}],
    ['ランナ OFF',c=>{c.P.run=0},ivOpen],
    ['排気系 OFF',c=>{c.P.exs=0}],
    ['熱物性',c=>{c.P.gam=0}],
    ['停止（燃料カット）',c=>c.stop(),c=>c.s.C.on&&c.X.Q>0]
   ],
   bad=[];
  for(const[n,chg,pre]of CH){const r=probe(chg,pre);if(!(r.re&&r.dif))bad.push(n+(r.dif?'':'（右辺が変わらない）'));if(RUN.over())yield}
/* 始動：右辺が変わらなくても使い回さない */
  const rs=probe(c=>c.start());
  if(!rs.re)bad.push('始動');
/* 状態の 2 成分を，和が変わらないように直接書き換える */
  let cmp='和が同じになる書き換えを作れなかった';
  {
   const sum=y=>{let q=0;for(let i=0;i<NSX;i++)q+=y[SIX[i]];return q};
   for(const d of[1e-7,2e-7,5e-8,1e-6,3e-7]){
    let same=false;
    const r=probe(c=>{const y=c.s.y,q0=sum(y);y[7]+=d;y[10]-=d;same=sum(y)===q0&&y[10]>0});
    if(same){cmp=r.re&&r.dif?'':'和が同じ書き換えを見逃した';break}
   }
   if(cmp)bad.push(cmp)
  }
/* 右辺が実際に読む設定を Proxy で集め（熱物性・噴射・ランナ・排気系を変えた 6 通りの運転），その 1 つずつについて，値を変えると使い回しを止めること（設定の一覧の書き漏らしを見つける） */
  const rd=new Set();
  for(const o of[{gam:2,inj:1},{gam:2,inj:0},{gam:0},{gam:1},{gam:2,run:0,exs:0},{gam:0,run:0,exs:0}]){
   const c=new Core({...mkPT(),mode:1,alm:40*D,nt:2000,sol:2,...o}),F=c.f;
   let on=0,k=0;
   c.start();
   c.P=new Proxy(c.P,{get(t,q){if(on&&typeof q==='string')rd.add(q);return t[q]}});
   c.f=function(y,q){on++;const r=F.call(this,y,q);on--;return r};
   while(c.s.cyc<3){c.step();if((++k&3)===0&&RUN.over())yield}
  }
  {
   const c=c0.clone(),miss=[];
   for(const k of rd){
    if(k==='Vm'||k==='At')continue; /* 検査用の内部の値（設定の項目でない） */
    c.updV();
    c.fsalP();
    const v=c.P[k],a=c.fsalP();
    c.P[k]=IT[k]&&IT[k].ch?(v+1)%IT[k].ch.length:v*1.01+1e-4;
    c.updV();
    const b=c.fsalP();
    c.P[k]=v;
    if(!(a===true&&b===false))miss.push(k)
   }
   if(miss.length||rd.size<15)bad.push('右辺が読むのに見ていない設定：'+(miss.join('，')||'（読んだ設定が '+rd.size+' 個しか無い）'))
  }
/* 対照：右辺が使わない設定（開度の設定，最大開度）と，変更なしでは使い回しが続く */
  const ct=[['開度の設定',c=>{c.P.alm=60*D}],['最大開度',c=>{c.P.amax=80*D}],['変更なし',()=>{}]].filter(([,chg])=>{const r=probe(chg);return!(r.keep&&!r.dif)}).map(q=>q[0]);
  chkB(13,'不連続な変更の直後は最後の段を使い回さない（BS3，全開 3000 rpm）：設定（φ，C_w，p_a，T_aux，φ_in，T_w），切替（ランナ，排気系，熱物性），停止，始動，和の変わらない状態の書き換えの直後のステップで，1 段目を変更後の入力で計算し直す（変更で右辺が実際に変わることも確かめる）．右辺が使わない設定（開度の設定，最大開度）と変更なしでは使い回しが続く',bad.length===0&&ct.length===0,bad.length||ct.length?`使い回した：${bad.join('，')||'なし'}／計算し直した：${ct.join('，')||'なし'}`:'成立')
 }
/* 13：BS3 の次数（1 ステップの誤差が h⁴，誤差の見積もりが h³） */
 {
  const f=(y,out)=>{out=out||new Array(NY).fill(0);out[2]=y[3];out[3]=-y[2];return out},
   o={f,kb:null,yy:null,r4:null,r5:null,wx:0},
   e=h=>{
    const y=new Array(NY).fill(0);
    y[2]=1;
    y[3]=.5;
    bs3c(o,y,h,f(y),new Array(NY).fill(0));
    const x=[Math.cos(h)+.5*Math.sin(h),-Math.sin(h)+.5*Math.cos(h)];
    return[Math.hypot(o.r5[2]-x[0],o.r5[3]-x[1]),Math.hypot(o.r5[2]-o.r4[2],o.r5[3]-o.r4[3])]
   },
   a=e(.1),
   b=e(.05);
  chkB(13,'BS3 の次数：刻みを半分にすると 1 ステップの誤差が 1/16，誤差の見積もり（3 次と 2 次の差）が 1/8（±10%）',Math.abs(a[0]/b[0]/16-1)<=.1&&Math.abs(a[1]/b[1]/8-1)<=.1,`${(a[0]/b[0]).toFixed(2)}，${(a[1]/b[1]).toFixed(2)}`,'16，8')
 }
/* 13：互換（REQ-13 の 15）：DOPRI5 と熱物性 γ(T) を選ぶと第26版と同じ値（第26版の値は commit 93f480b を Node.js で実行して求めた．化学平衡の値は REQ-25 の 6 で変わるので比べない） */
 {
  const a=new Core({...mkP(),cvar:0,mode:1,alm:90*D,nt:3000,sol:1,gam:0}),
   b=new Core({...mkP(),cvar:0,mode:0,sol:1,gam:0});
  a.start();
  yield*runC(a,2);
  b.start();
  yield*runC(b,3);
  const va=[a.s.t,a.s.y[1],a.s.y[2],a.lastM.imep,a.s.cyc],
   vb=[b.s.t,b.s.y[1],b.s.y[2],b.lastM.imep,b.s.cyc],
   ra=[2.0000159014308676,306.42449191785664,464804.11500222684,1103436.186909774,47],
   rb=[3.000037960377129,89.42289317922796,92922.10082133336,-35582.19687220702,28];
  {
   const rv=[...ra,...rb],vv=[...va,...vb],e=Math.max(...vv.map((v,i)=>Math.abs(v/rv[i]-1)));
   chkB(13,'互換：設定で DOPRI5 と熱物性 γ(T) を選ぶと，第26版と同じ値（動力計制御・全開・目標 3000 rpm の始動から 2 s と，スロットル制御の始動から 3 s の，時刻，ω，p，IMEP，サイクル数．相対 1e-4．処理系が同じなら，第26版に θ を揃える変更だけを当てたものとビット単位で同じことを tools/dev/bitcheck.js で確かめる）',e<=1e-4,'相対差の最大 '+e.toExponential(1),'≤ 1e-4')
  }
 }
/* 13：回転数が自由な運転（アイドル S2，動力計制御 S4）で，BS3 と DOPRI5 の平均回転数と IMEP が合う */
 {
  const out=[];
  let ok=true;
  for(const id of['S2','S4']){
   const z=(yield*scen(id)).c,R={};
   for(const sol of[1,2]){
    const c=z.clone();
    c.P.sol=sol;
    yield*runC(c,2);
    const t1=c.s.t+2,n0=c.s.nfa+c.s.clp,H=[];
    let sN=0,sT=0,k=0;
    while(c.s.t<t1){
     const cy=c.s.cyc,dt=c.step();
     sN+=c.s.y[1]*30/PI*dt;
     sT+=dt;
     if(c.s.cyc!==cy)H.push(c.lastM.imep);
     if((++k&3)===0&&RUN.over())yield
    }
    R[sol]={N:sN/sT,im:H.reduce((x,y)=>x+y,0)/H.length,bad:c.s.nfa+c.s.clp-n0+(fin(c)?0:1)}
   }
   const dN=Math.abs(R[2].N/R[1].N-1),dI=Math.abs(R[2].im/R[1].im-1);
   ok=ok&&dN<=5e-3&&dI<=1e-2&&R[2].bad===0;
   out.push(`${id}：N̄ ${R[1].N.toFixed(1)}／${R[2].N.toFixed(1)} rpm，IMEP の差 ${(dI*100).toFixed(3)} %，強制受理・射影 ${R[2].bad}`)
  }
  chkB(13,'回転数が自由な運転（S2 のアイドル，S4 の動力計制御．切り替えて 2 s 後からの 2 s）：BS3 と DOPRI5 の平均回転数の差 ≤ 0.5%，IMEP の平均の差 ≤ 1%，強制受理と射影が無い',ok,out.join('；'))
 }
/* 13：段の ω < 0（REQ-13 の 18）：燃焼の最中と噴射の最中の状態で ω の符号だけを反転して右辺を評価する */
 {
  const out=[];
  let ok=true;
  for(const cf of[{gam:0},{gam:2,inj:0},{gam:2,inj:1}]){
   const c=new Core({...mkP(),cvar:0,mode:1,alm:90*D,nt:3000,...cf}),
    SPC=cf.gam===2,
    ev=(q,neg)=>{
     const d=q.clone(),y=d.s.y.slice();
     if(neg)y[1]=-y[1];
     d.wx=1;
     d.kFy=null;
     const o=d.f(y,new Array(NY).fill(0));
     return{Q:d.X.Q,mb:SPC?o[39]:-o[4],mj:d.X.minj}
    };
   c.start();
   yield*runC(c,1);
   let n=0;
   while(!(c.s.C.on&&c.X.Q>0&&c.s.y[0]%P4>2*PI+5*D)&&n<1e5){c.step();n++}
   const a=ev(c,0),b=ev(c,1);
   let o1=a.Q>0&&a.mb>0&&b.Q>=0&&b.mb>=0,
    s=`${SPC?(cf.inj?'直噴':'ポート噴射'):'γ(T)'}：Q̇ ${a.Q.toExponential(2)} → ${b.Q.toExponential(2)} W，質量 ${a.mb.toExponential(2)} → ${b.mb.toExponential(2)} kg/s`;
   if(cf.inj===1){
    n=0;
    while(!c.s.inj.on&&n<1e5){c.step();n++}
    const p=ev(c,0),m=ev(c,1);
    o1=o1&&p.mj>0&&m.mj>=0;
    s+=`，噴射率 ${p.mj.toExponential(2)} → ${m.mj.toExponential(2)} kg/s`
   }
   ok=ok&&o1;
   out.push(s)
  }
  chkB(13,'段の ω < 0：燃焼の最中（γ(T)，化学平衡のポート噴射と直噴）と直噴の噴射の最中の状態で ω の符号だけを反転して右辺を評価すると，熱の発生，既燃の側へ移る質量の速さ，噴射率が 0 以上（反転の前はどれも正）',ok,out.join('；'))
 }
/* 13：有限でない結果を受け入れない（REQ-13 の 19）：右辺の圧力の成分，補助積分の成分（図示仕事．誤差の制御の外）を有限でない値にする */
 {
  const z=(yield*scen('S4')).c,f0=Core.prototype.f,ng=[];
  let n=0;
  for(const gam of[0,2])
   for(const sol of[0,1,2])
    for(const k of[2,18]){
   const c=z.clone();
   let o1=false;
   try{
    c.P.gam=gam;
    for(let i=0;i<20;i++)c.step();
    c.P.sol=sol;
    for(let i=0;i<5;i++)c.step();
    const y0=c.s.y.slice(),
     t0=c.s.t,
     d0=c.s.ndv|0,
     same=()=>c.s.y.length===y0.length&&c.s.y.every((v,i)=>Object.is(v,y0[i]))&&c.s.t===t0;
    c.f=function(y,o){const r=f0.call(this,y,o);r[k]=NaN;return r};
    c.step();
    o1=same()&&c.s.div===1&&c.s.ndv===d0+1;
    delete c.f;
    let r=0;
    for(let i=0;i<3;i++)r+=c.step();
    o1=o1&&same()&&r===0&&c.s.ndv===d0+1;
    c.reset();
    o1=o1&&!c.s.div
   }catch(e){o1=false}
   n++;
   if(!o1)ng.push(`${gam?'化学平衡':'γ(T)'}・${['RK4','DOPRI5','BS3'][sol]}・成分 ${k}`);
   yield
  }
  chkB(13,'有限でない結果を受け入れない（S4，γ(T) と化学平衡 × RK4・DOPRI5・BS3，右辺の圧力の成分または補助積分の成分を NaN）：1 回のステップで状態と時刻が前のまま，発散の印が立ち回数が 1．右辺を戻して 3 回進めても変わらず Δt = 0．コールドリセットで印が下りる',ng.length===0,ng.length?`${n} 通り中 ${ng.length} 通りで不成立：${ng.join('，')}`:`${n} 通りすべて成立`)
 }
};
TST[14]=function*(){
 const s3=yield*scen('S3'),s4=yield*scen('S4'),G=geo(mkPT());
 for(const[nm,s]of[['S3',s3],['S4',s4]]){
  const M=lastM(s.rec,1)[0];
  chk(14,`${nm}：IMEP·V_d = W_i,net`,M.W,M.imep*G.Vd,1e-12);
  chk(14,`${nm}：BMEP = IMEP − FMEP − AMEP`,M.imep-M.fmep-M.amep,M.bmep,1e-9);
  chk(14,`${nm}：P_b = BMEP·V_d / t_cycle`,M.bmep*G.Vd/M.tc,M.pb,1e-9);
  chkB(14,`${nm}：0 < η_m < 1，bsfc > 0 有限`,M.em>0&&M.em<1&&M.bsfc>0&&isFinite(M.bsfc),`η_m=${M.em.toFixed(3)}, bsfc=${M.bsfc.toFixed(0)} g/kWh`);
  const ot=1-G.eps**(1-1.4);
  chkB(14,`${nm}：P_i ≤ η_Otto ṁ_f H_u`,lastM(s.rec,5).every(m=>m.pi<=ot*m.mfd*K.Hu),`η_i,実効=${(M.pi/(M.mfd*K.Hu)).toFixed(3)}`,'≤ '+ot.toFixed(3));
  const W=avg(s.rec,5,'W'),bal=Math.abs(W-avg(s.rec,5,'Wf')-avg(s.rec,5,'Wa')-avg(s.rec,5,'Wd'))/W;
  chkB(14,`${nm}：動力収支 |W_i − W_f − W_aux − W_dyno|/W_i ≤ 2%`,bal<=.02,(bal*100).toFixed(2)+' %','≤ 2 %')
 }
 const M=lastM(s3.rec,1)[0];
 chk(14,'PMEP·V_d = W_i,net − W_i,gross',M.W-M.Wg,M.pmep*G.Vd,1e-12);
 {
  const L=s3.c.last;
  let w=0;
  for(let i=0;i<1440;i++){const j=(i+1)%1440,a=L.p[i],b2=L.p[j];if(a===a&&b2===b2)w+=(a+b2)/2*(L.V[j]-L.V[i])*1e-3}
  chk(14,'S3：W_i,net（補助積分）と，0.5° ごとの p-V の台形則（0.1%）',w,M.W,.001);
  const q=s3.c.clone();
  yield*runCyc(q,1);
  const C=q.s.C,P=q.P;
  chk(14,'η_v = m_air / (ρ_atm V_d)（化学平衡：m_air は IVC の未燃の空気，ρ_atm = p_atm/(R_a T_amb)）',q.s.mah/(P.pa/(GAS.Ra*TA)*G.Vd),q.lastM.ev,1e-12);
  {
   const g=(yield*scen('S2G')).c.clone();
   yield*runCyc(g,1);
   chk(14,'η_v = m_u,trapped / ((1 + φ/AF) ρ_atm V_d)（熱物性 γ(T)）',g.s.C.mut/(1+g.P.phi/K.AFR)/(g.P.pa/(R*TA)*g.G.Vd),g.lastM.ev,1e-12)
  }
 }
 {
  const h=s3.c.s.Mh,
   ks=['imep','pmep','ei','pi','ev','xr','pm','Tm','mfd','tb','pb','bmep','fmep','em','bsfc','eb','ybi'],
   am=avgM(s3.c.s);
  let bad=ks.filter(k=>Math.abs(am[k]-h.reduce((a,q)=>a+q[k],0)/10)>1e-12*Math.abs(am[k])+1e-300);
  chkB(14,'S3：表示の指標 = 直近 10 サイクルの算術平均（17 指標，10⁻¹²）',h.length===10&&bad.length===0,bad.join(' ')||`${h.length} サイクル`);
  const q=new Core(mkPT());
  q.start();
  let n0=-1;
  while(!(q.s.Mh&&q.s.Mh.length>=3)){q.step();if(RUN.over())yield}
  const a3=avgM(q.s).imep,r3=q.s.Mh.reduce((a,m)=>a+m.imep,0)/3;
  const qc=s3.c.clone();
  qc.reset();
  chkB(14,'完爆後 3 サイクルで 3 サイクル平均，コールドリセットで表示が「–」',q.s.Mh.length===3&&Math.abs(a3-r3)<=1e-12*Math.abs(r3)&&metricList(qc,0)[1][1]==='–',`${(a3/1e3).toFixed(1)} kPa`)
 }
 const c=s3.c.clone(),ref=Base.cp(c.last),keep=Float32Array.from(ref.p);
 c.P.spb+=8;
 c.P.alm=30*D;
 yield*runC(c,1);
 chkB(14,'基準サイクルのディープコピー不変性',ref.p.every((v,i)=>v===keep[i]||(v!==v&&keep[i]!==keep[i])));
 const s1=yield*scen('S1');
 chkB(14,'S1 全期間：無効なメトリクスを表示しない',s1.badDisp===0,s1.badDisp+' 件','0 件');
 {
  const s4=yield*scen('S4'),M=lastM(s4.rec,1)[0],mf=M.mfd*M.tc;
  chk(14,'η_i,net = W_i,net / (m_f H_u)',M.W/(mf*K.Hu),M.ei,1e-12);
  const q1=s4.c.clone();
  q1.P.sauto=0;
  q1.P.spb=Math.round(s4.c.s.spa);
  const q2=q1.clone();
  q2.P.phi=1.2;
  yield*runC(q1,3);
  yield*runC(q2,3);
  chkB(14,'φ = 1.2 の η_i が φ = 1.0 より 10% 以上低い（燃え残りが効率に現れる）',q2.lastM.ei<=.9*q1.lastM.ei,`${q1.lastM.ei.toFixed(3)} → ${q2.lastM.ei.toFixed(3)}`)
 }
};
/* ---- UI self tests ---- */
const pev=(el,type,x,y,w)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,width:w||20,height:w||20,pointerId:7,pointerType:'touch',isPrimary:true}));
const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const tapEl=(el,w)=>{const[x,y]=ctr(el);pev(el,'pointerdown',x,y,w);pev(el,'pointerup',x,y,w)};
function*allScreens(fn){
 for(const i of[0,6,1,5,8,7,2,3]){
  show(i);
  if(i===6){drawSysT();fn('全体図')}else if(i===8){drawLossT();fn('熱効率')}else if(i===0)for(const m of[0,1]){U.mpg=m;met();drawEng();fn(`運転${m+1}`)}
else if(i===1){for(let s=0;s<8;s++){setSub(s);drawCh();fn(`線図${s+1}`)}setSub(0)}
else if(i===2){
   for(let p=0;p<PAGES.length;p++){U.pg=p;rs();if(p)drawPv();fn(`設定:${PAGES[p]}`)}
   $('pl').className='on';
   fn('設定:一覧');
   $('pl').className=''
  }
else if(i===5){
   for(let k=0;k<7;k++){swSub(k);if(k<4)drawSw();if(k===6){drawMp();mpText()}else swText();fn(`性能曲線${k+1}`)}
   swSub(0)
  }
else if(i===7){for(const m of[0,2]){optSub(m);drawOpt();fn(`最適化${m?2:1}`)}optSub(0)}
else{rchips();dtl();fn('検証')}
  yield
 }
}
const vis=el=>{
 const r=el.getBoundingClientRect();
 return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'
};
function uiDefault(){
 Object.assign(LP,mkP());
 U.pend={};
 U.x10=0;
 U.undo=null;
 U.pg=0;
 U.log=0;
 U.mpg=0;
 U.cross=U.cross.map(()=>null);
 Sim.spd=.1;
 U.hap=0;
 hapBtn();
 live.reset();
 Base.clear();
 axReset(AX);
 $('ts').textContent='';
 sp();
 rs()
}
const txtW=el=>{const r=document.createRange();r.selectNodeContents(el);return r.getBoundingClientRect().width},
 room=el=>{
  const cs=getComputedStyle(el);
  return el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)
 };
TST[15]=function*(){
 uiDefault();
 const bad=[],bb=[],cv=[],mg=[];
 let nb=0;
 yield*allScreens(name=>{
  const sec=document.querySelector('section.on');
  for(const el of[document.documentElement,document.body,sec])if(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)bad.push(name);
  if(sec.clientHeight<sec.scrollHeight)bad.push(name+'*');
  const scope=$('pl').className==='on'?[...$('pl').querySelectorAll('button')]:[...document.querySelectorAll('nav button'),...[...sec.querySelectorAll('button')].filter(b=>!b.closest('#pl'))],
   bs=scope.filter(vis),
   rc=bs.map(b=>b.getBoundingClientRect());
  nb+=bs.length;
  rc.forEach((r,i)=>{
   const b=bs[i];
   if(r.width<43.5||r.height<43.5)bb.push(`${name}:${b.textContent}:小`);
   if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)bb.push(`${name}:${b.textContent}:外`);
   if(b.scrollWidth>b.clientWidth+1||b.scrollHeight>b.clientHeight+1)bb.push(`${name}:${b.textContent}:折返`);
   if(b.textContent.trim()&&txtW(b)>.95*room(b))mg.push(`${name}:${b.textContent}:${(100*txtW(b)/room(b)).toFixed(0)}%`);
   for(let j=i+1;j<rc.length;j++){
    const q=rc[j],ox=Math.min(r.right,q.right)-Math.max(r.left,q.left),oy=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);
    if(ox>1&&oy>1)bb.push(`${name}:${b.textContent}×${bs[j].textContent}`)
   }
  });
  for(const c of sec.querySelectorAll('canvas'))if(vis(c)){
   const q=dprc();
   if(c.width!==Math.max(1,Math.round(c.clientWidth*q))||c.height!==Math.max(1,Math.round(c.clientHeight*q)))cv.push(name+':'+c.id);
   if(c.clientHeight<(c.id==='eng'?140:120))cv.push(name+':'+c.id+':低')
  }
 });
 chkB(15,'全画面でスクロールが発生しない',bad.length===0,bad.length?bad.join(' '):'0 画面','0 画面');
 chkB(15,`全ボタン（延べ ${nb} 個）が 44px 以上・重なりなし・画面内・折返しなし`,bb.length===0,bb.length?bb.slice(0,4).join(' / '):'違反 0','違反 0');
 chkB(15,'全ボタンの文字幅が利用可能幅の 95% 以下（端末フォントの差の余裕）',mg.length===0,mg.length?[...new Set(mg.map(x=>x.replace(/^[^:]*:/,'')))].slice(0,8).join(' / '):'違反 0','違反 0');
 {
  const w=innerWidth,wide=w>=900,R=e=>e.getBoundingClientRect();
  show(0);
  drawEng();
  met();
  const a=R($('ew')),b=R($('ctl')),nM=$('M').children.length,mpV=vis($('mp')),p0=vis($('pv0'));
  U.pg=4;
  show(2);
  rs();
  drawPv();
  const c=R($('Pg')),d=R($('pv')),sh=R($('s2')).height;
  const side=(p,q)=>p.right<=q.left+1&&Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top)>20,
   stack=(p,q)=>p.bottom<=q.top+1;
  const okL=wide?side(a,b)&&side(c,d)&&d.height>=.8*(sh-40)&&p0===(innerHeight>=800):stack(a,b)&&stack(c,d)&&!p0,
   okM=w>=700?nM===24&&!mpV:nM===12&&mpV;
  chkB(15,`画面の段階（幅 ${w} px：${wide?'大':w>=700?'中':'小'}）：配置と表示する情報`,okL&&okM,`配置 ${okL}，メトリクス ${nM} 項目・切替ボタン ${mpV?'表示':'非表示'}，運転の p-V ${p0?'表示':'非表示'}`);
  const pc=[[3,344,500,1],[3,1380,700,3],[4,1164,650,3],[2,1380,700,2],[1,1380,700,1],[3,800,900,1],[4,344,436,1],[4,344,300,2],[3,344,240,2],[4,300,200,1]].filter(q=>plotCols(q[0],q[1],q[2])!==q[3]).length,
   cl=plotCells(4,1164,650);
  let ovl=0;
  for(let i=0;i<4;i++){
   const p=cl[i];
   if(p.x<0||p.y<0||p.x+p.w>1164+1e-9||p.y+p.h>650+1e-9)ovl++;
   for(let j=i+1;j<4;j++){
    const q=cl[j];
    if(Math.min(p.x+p.w,q.x+q.w)-Math.max(p.x,q.x)>1e-9&&Math.min(p.y+p.h,q.y+q.h)-Math.max(p.y,q.y)>1e-9)ovl++
   }
  }
  chkB(15,'グラフの列数の式（10 例）と，横に並べた領域が重ならず Canvas 内',pc===0&&ovl===0,`不一致 ${pc}，重なり ${ovl}`,'0，0')
 }
 chkB(15,'Canvas のビットマップ寸法 = CSS寸法×dpr，高さ下限',cv.length===0,cv.length?cv.join(' '):'違反 0','違反 0');
 for(let i=0;i<10;i++){show(i%2);(i%2?drawCh:drawEng)()}
 show(0);
 drawEng();
 const e=$('eng'),q=dprc();
 chkB(15,'タブ切替10回後も Canvas 寸法が一致',e.width===Math.round(e.clientWidth*q)&&e.height===Math.round(e.clientHeight*q),`${e.width}×${e.height}`);
 chkB(15,'input[type=range] が存在しない',!document.querySelector('input[type=range]'));
 const tx=[],tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(tw.nextNode()){
  const pe=tw.currentNode.parentElement;
  if(pe&&pe.closest('nav,section')&&!pe.closest('.tx'))tx.push(tw.currentNode.nodeValue)
 }
 chkB(15,'表示テキストに bar を含まない（MPa は可．数式の TeX のソースは除く）',!/(^|[^A-Za-z])bar([^A-Za-z]|$)/.test(tx.join(' ')));
 show(0);
 yield;
 const b=$('sp').querySelector('button[data-v="1"]'),[x,y]=ctr(b),s0=Sim.spd,now0=NOW;
 let ft=1e6;
 NOW=()=>ft;
 onEnd(()=>{NOW=now0;Sim.spd=s0});
 Sim.spd=.1;
 sp();
 pev(b,'pointerdown',x,y);
 pev(b,'pointerup',x+10,y);
 const r1=Sim.spd===.1;
 pev(b,'pointerdown',x,y);
 ft+=600;
 pev(b,'pointerup',x,y);
 const r2=Sim.spd===.1;
 tapEl(b,100);
 const r3=Sim.spd===1;
 NOW=now0;
 Sim.spd=s0;
 sp();
 chkB(15,'移動量 ≥ 8 px の入力はタップにならない',r1);
 chkB(15,'接触 ≥ 500 ms の入力はタップにならない',r2);
 chkB(15,'接触幅 100 px のタップも受理される',r3);
/* 18：複数の指（REQ-15 の 13）．タップとドラッグは，始めた指（pointerId）の入力だけを見る */
 {
  const pe=(el,type,x,y,id)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,width:20,height:20,pointerId:id,pointerType:'touch',isPrimary:id===7}));
  const el=document.createElement('button');
  let n=0;
  document.body.appendChild(el);
  tap(el,()=>n++);
  pe(el,'pointerdown',10,10,7);
  pe(el,'pointerup',10,10,9);
  const t1=n===0;
  pe(el,'pointerup',10,10,7);
  const t2=n===1;
  pe(el,'pointerdown',10,10,7);
  pe(el,'pointerdown',300,300,9);
  pe(el,'pointerup',10,10,7);
  const t3=n===2;
/* 押したまま要素の外で離した（pointerup が届かない）後も，次のタップが成立する：同じ ID（マウス）でも，別の ID（次の指）でも */
  const now1=NOW;
  let tq=1e6;
  NOW=()=>tq;
  onEnd(()=>{NOW=now1});
  pe(el,'pointerdown',10,10,7);
  tq+=2000;
  pe(el,'pointerdown',10,10,7);
  pe(el,'pointerup',10,10,7);
  const t4=n===3;
  pe(el,'pointerdown',10,10,7);
  tq+=2000;
  pe(el,'pointerdown',10,10,9);
  pe(el,'pointerup',10,10,9);
  const t5=n===4;
  NOW=now1;
  el.remove();
  show(0);
  yield;
  const k=$('ntk'),[x,y]=ctr(k),nt0=LP.nt,W=ntW();
  pe(k,'pointerdown',x,y,7);
  pe(k,'pointermove',x+.4*W,y,9);
  const s1=LP.nt===nt0;
  pe(k,'pointerdown',x+.4*W,y,9);
  pe(k,'pointerup',x+.4*W,y,9);
  const s2=LP.nt===nt0&&NTD.on===1;
  pe(k,'pointermove',x+.2*W,y,7);
  const s3=LP.nt!==nt0;
  pe(k,'pointerup',x+.2*W,y,7);
  const s4=NTD.on===0;
/* つまみの離れを取りこぼしても（捕捉が失われた），次の指でドラッグを始められる */
  pe(k,'pointerdown',x,y,7);
  pe(k,'lostpointercapture',x,y,7);
  pe(k,'pointerdown',x,y,9);
  const s5=NTD.on===1&&NTD.id===9;
  pe(k,'pointerup',x,y,9);
  setParam('nt',nt0,1);
  ntRender();
  chkB(15,'複数の指：タップは，押した指と違う指が離れても成立せず，押した指が離れると成立する（別の指が後から触れても押した位置は変わらない）．要素の外で離した後も次のタップが成立し，捕捉が失われた後も次の指でドラッグを始められる．目標回転数のつまみのドラッグ中に，別の指の移動・接触・離れでは値が変わらずドラッグも終わらず，始めた指の移動で値が変わる',t1&&t2&&t3&&t4&&t5&&s1&&s2&&s3&&s4&&s5,`${[t1,t2,t3,t4,t5,s1,s2,s3,s4,s5].map(q=>q?1:0).join('')}`)
 }
/* 19：表示の書き換えは変わったときだけ（SPEC-15 の J）．制御の表示は文字が同じなら要素を作り直さない．設定のページは，設定タブを表示していない間は作り直さず，表示したときに作る */
 {
  show(0);
  ctlRender();
  const c0=$('ctl').firstChild;
  ctlRender();
  const c1=$('ctl').firstChild===c0&&!!c0;
  show(2);
  const p0=$('Pg').firstChild;
  show(0);
  rs();
  const p1=$('Pg').firstChild===p0&&!!p0;
  show(2);
  const p2=$('Pg').firstChild!==p0&&!!$('Pg').firstChild;
  show(0);
  /* 画面の状態 U を前の値に戻しても（全テストの実行の終わりに戻す），制御の表示が今の状態と一致する */
  const u0={...U},
   sv=live,
   ok0=$('ctl').textContent;
  live=new Core(mkPT());
  live.start();
  live.s.fired=1;
  live.s.fuel=1;
  live.s.Nb=1234;
  ctlRender();
  const busy=$('ctl').textContent!==ok0;
  Object.assign(U,u0);
  live=sv;
  ctlRender();
  const c2=busy&&$('ctl').textContent===ctlText(live).map(x=>x.replace(/<[^>]*>/g,'')||'\u00a0').join('');
  chkB(15,'表示の書き換え：制御の表示は文字が同じなら要素を作り直さない．設定のページは，設定タブを表示していない間は作り直さず，設定タブを表示したときに作り直す．画面の状態を前の値に戻した後も，制御の表示が今の状態と一致する',c1&&p1&&p2&&c2,`${[c1,p1,p2,c2].map(q=>q?1:0).join('')}`)
 }
/* 20：運転の状態のテキスト（REQ-15 の 15，SPEC-15 K）．クリップボードを検査用に置き換える */
 {
  const sv=live,
   cl=Object.getOwnPropertyDescriptor(navigator,'clipboard'),
   ex=document.execCommand,
   has=typeof copyRun==='function',
   rst=()=>{
    if(cl)Object.defineProperty(navigator,'clipboard',cl);else delete navigator.clipboard;
    document.execCommand=ex
   };
  let got=null;
  onEnd(()=>{
   rst();
   live=sv;
   if(typeof runBox==='function')runBox(0)
  });
  const wr=()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>{got=x}},configurable:true});
  wr();
  uiDefault();
  show(0);
  const b=$('bcp'),
   H=['【運転】','【制御】','【指標】','【状態】','【設定】','【適用待ち】','【基準サイクル】'],
   bad=t=>/NaN|Infinity|undefined/.test(t),
   hd=t=>{
    let i=-1;
    return H.every(h=>{
     const j=t.indexOf('\n'+h+'\n'),ok=j>i;
     i=j;
     return ok
    })
   },
   sec=(t,h)=>{
    const L=t.split('\n'),i=L.indexOf(h),o=[];
    if(i<0)return o;
    for(let j=i+1;j<L.length&&!L[j].startsWith('【');j++)if(L[j]!=='')o.push(L[j]);
    return o
   },
   cp=function*(){
    got=null;
    const m=has&&b?yield copyRun():null;
    return{m,t:got||'',l:b?b.textContent:''}
   };
  /* (a) ボタンの寸法と位置．断面図の文字（最も長い場合）と重ならない */
  let a1=false,aw='ボタンが無い';
  if(b){
   const q=b.getBoundingClientRect(),
    r=$('bsys').getBoundingClientRect(),
    e=$('eng').getBoundingClientRect(),
    g=$('eng').getContext('2d');
   g.save();
   const mx=Math.max(...[
    ['bold 13px system-ui,sans-serif','MOTOR  N̄ 12000 rpm'],
    ['12px system-ui,sans-serif','スロットル制御'],
    ['12px system-ui,sans-serif','動力計制御'],
    ['12px system-ui,sans-serif','最速 999×'],
    ['bold 12px system-ui,sans-serif','OVERLOAD UNDERPOWER'],
    ['bold 12px system-ui,sans-serif','VALVE HIT']
   ].map(([f,t])=>{
    g.font=f;
    return 8+g.measureText(t).width
   }));
   g.restore();
   const sl=[$('ntb'),$('thb')].filter(x=>x&&x.offsetParent!==null).map(x=>x.getBoundingClientRect().top);
   a1=q.width>=44&&q.height>=44&&(q.right<=r.left||q.left>=r.right||q.bottom<=r.top||q.top>=r.bottom)&&e.left+mx<q.left&&q.right<=e.right+.5&&q.top>=e.top-.5&&sl.every(t=>q.bottom<=t+.5);
   aw=`${q.width.toFixed(0)}×${q.height.toFixed(0)} px，文字の右端 ${mx.toFixed(0)} px，ボタンの左端 ${(q.left-e.left).toFixed(0)} px`
  }
  chkB(15,'運転の状態のテキスト：運転タブの [コピー] が 44 px 以上で，機関断面図の中にあり，[全体図] ともスライダの帯とも重ならず，機関断面図の文字（最も長い場合）より右にある',a1,aw);
  /* (b) 停止したコールドリセットの状態 */
  const c1=yield*cp(),
   s1=sec(c1.t,'【設定】'),
   b1=c1.m==='ok'&&hd(c1.t)&&c1.t.includes('\nビルド：'+BUILD+'\n')&&!bad(c1.t)&&c1.l==='完了'&&!s1.some(l=>l.startsWith('*'))&&s1.includes('既定値と違う項目：0 件');
  chkB(15,'運転の状態のテキスト（停止）：7 つの見出しがこの順にあり，ビルドの ID の行がある．NaN・Infinity を含まない．既定値と違う項目が 0 件．ボタンが「完了」になる',b1,`${c1.m}，${c1.t.split('\n').length} 行，「${c1.l}」`);
  /* (c) 動力計制御の定常（S4） */
  live=(yield*scen('S4')).c.clone();
  show(0);
  met();
  ctlRender();
  const y0=EIX.map(i=>live.s.y[i]),
   mv=[...$('M').children].map(d=>`（${d.dataset.k}）：${d.lastChild.textContent}`),
   cv=[...$('ctl').children].map(d=>d.textContent.replace(/ /g,'').trim()||'–'),
   c2=yield*cp(),
   st=sec(c2.t,'【状態】'),
   okY=y0.length===STN.length&&y0.length===23&&y0.every((v,i)=>{
    const m=/^(\d+) .*：(\S+)/.exec(st[i]||'');
    return!!m&&+m[1]===i+1&&Number(m[2])===v
   }),
   mt=sec(c2.t,'【指標】'),
   okM=mt.length===24&&mv.every(x=>mt.some(l=>l.endsWith(x))),
   okC=JSON.stringify(sec(c2.t,'【制御】'))===JSON.stringify(cv),
   si=sec(c2.t,'【設定】').filter(l=>!l.startsWith('〔')&&!l.startsWith('既定値と違う')),
   okS=si.length===ITEMS.length&&ITEMS.every(it=>si.some(l=>l.replace(/^\* /,'').startsWith(`${it.n}：${disp(it,LP[it.k])}`)));
  chkB(15,'運転の状態のテキスト（動力計制御の定常）：状態の 23 成分が読み戻すと押した瞬間の値と完全に一致し，指標 24 項目が運転タブの表示と，制御の 4 行が制御状態カードと，設定の行が全項目の設定の値と一致する．NaN・Infinity を含まない',okY&&okM&&okC&&okS&&!bad(c2.t),`状態 ${okY?1:0}，指標 ${okM?1:0}（${mt.length}），制御 ${okC?1:0}，設定 ${okS?1:0}（${si.length}/${ITEMS.length}），NaN 等 ${bad(c2.t)?1:0}`);
  /* (d) 既定値との違い，変更の記録，適用待ち */
  const it=IT.nt,n0=LP.nt,dv=gi(it,n0)>=gmax(it)?-1:1,v1=gv(it,gi(it,n0)+dv),v2=gv(it,gi(it,n0)+2*dv);
  Base.clear();
  setParam('nt',v1);
  const c3=yield*cp(),
   s3=sec(c3.t,'【設定】'),
   r3=sec(c3.t,'【基準サイクル】'),
   ln=v=>`：${it.n}：${disp(it,n0)} → ${disp(it,v)}`,
   d1=s3.filter(l=>l.startsWith('* ')).length===1&&s3.some(l=>l.startsWith(`* ${it.n}：`)&&l.includes(`（既定 ${disp(it,defv(it))}）`))&&s3.includes('既定値と違う項目：1 件')&&(r3[0]||'').startsWith('あり')&&r3.filter(l=>l.includes(ln(v1))).length===1;
  setParam('nt',v2);
  const c4=yield*cp(),
   r4=sec(c4.t,'【基準サイクル】'),
   d2=r4.filter(l=>l.includes(`：${it.n}：`)).length===1&&r4.some(l=>l.includes(ln(v2)));
  setParam('nt',n0);
  const c5=yield*cp(),
   r5=sec(c5.t,'【基準サイクル】'),
   d3=!r5.some(l=>l.includes(`：${it.n}：`))&&r5.includes('設定の変更：なし');
  const rk=ITEMS.find(i=>i.c==='r'&&!i.ch),
   rv=gv(rk,gi(rk,LP[rk.k])+(gi(rk,LP[rk.k])>=gmax(rk)?-1:1));
  setParam(rk.k,rv);
  const c6=yield*cp(),
   d4=sec(c6.t,'【適用待ち】').some(l=>l.startsWith(`${rk.n}：${disp(rk,LP[rk.k])} → ${disp(rk,rv)}`));
  U.pend={};
  chkB(15,'運転の状態のテキスト（設定の変更）：変えた項目だけに * と既定値が付き，基準サイクルと変更の行がある．同じ項目を続けて変えても 1 件で新値が変わり，元に戻すと消える．要リセット項目の保留値が適用待ちにある',d1&&d2&&d3&&d4,`${[d1,d2,d3,d4].map(q=>q?1:0).join('')}`);
  /* (e) クリップボードに書けないとき */
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('x')}},configurable:true});
  document.execCommand=()=>false;
  const c7=yield*cp(),
   bx=()=>{
    const a=document.querySelector('.ew textarea');
    return a&&a.offsetParent!==null?a:null
   },
   ta=bx(),
   e1=c7.m==='show'&&!!ta&&ta.readOnly&&hd(ta.value)&&!bad(ta.value)&&c7.l==='閉じる';
  if(b)tapEl(b);
  const e2=!bx()&&b&&b.textContent==='コピー';
  yield*cp();
  show(1);
  const e3=!bx();
  show(0);
  rst();
  live=sv;
  if(typeof runBox==='function')runBox(0);
  uiDefault();
  chkB(15,'運転の状態のテキスト（書けないとき）：機関断面図の領域に読み取り専用の枠が出て，ボタンが「閉じる」になる．[閉じる] とタブの切り替えで枠が消える',e1&&e2&&e3,`${c7.m}，枠 ${e1?1:0}，閉じる ${e2?1:0}，タブ ${e3?1:0}`)
 }
 {
  const nb3=!$('b3')&&![...document.querySelectorAll('button')].some(q=>/RESET/.test(q.textContent));
  show(0);
  live.start();
  for(let i=0;i<50;i++)live.step();
  live.s.Nb=123.4;
  const t1=live.s.t;
  tapEl($('b1'));
  const r4=live.s.Nb===123.4&&live.s.t===t1&&t1>0;
  live.s.y[2]=NaN;
  tapEl($('b1'));
  const r5=fin(live)&&live.s.t===0&&(live.s.starter===1||live.s.fired===1);
  chkB(15,'[RESET] のボタンが無い',nb3);
  chkB(15,'有限な状態での START は状態を初期値に戻さない',r4);
  chkB(15,'状態に NaN があるときの START は，初期値に戻してから始動する（状態が有限，t = 0，始動している）',r5,`有限 ${fin(live)}，t ${live.s.t}`);
  live.reset()
 }
/* 21：計算の発散（REQ-15 の 12，16）：右辺を有限でない値を返すものに置き換えて進める */
 {
  show(0);
  live.reset();
  live.start();
  for(let i=0;i<50;i++)live.step();
  const f0=Core.prototype.f,
   dw=()=>{
    const cv=document.createElement('canvas');
    cv.width=360;
    cv.height=400;
    const g=cv.getContext('2d'),ft=g.fillText.bind(g),T=[];
    g.fillText=(t,x,y)=>{T.push(t);ft(t,x,y)};
    drawEngine(g,live,360,400,COL);
    return T.some(t=>t.includes('DIVERGED'))
   },
   tx=()=>/\n警告：[^\n]*DIVERGED/.test(runText(envInfo()));
  let a=false,b=false,c=false,d=false,w='';
  try{
   live.f=function(y,o){const r=f0.call(this,y,o);r[2]=NaN;return r};
   const st={spd:1,debt:0},w0=performance.now();
   advance(st,live,1/60,FB.n);
   const ms=performance.now()-w0;
   a=ms<=FB.n+100;
   b=dw()&&tx();
   delete live.f;
   const y1=live.s.y.slice(),t1=live.s.t;
   for(let i=0;i<5;i++)advance(st,live,1/60,FB.n);
   c=dw()&&tx()&&live.s.t===t1&&live.s.y.every((v,i)=>Object.is(v,y1[i]))&&fin(live);
   tapEl($('b1'));
   d=fin(live)&&live.s.t===0&&!live.s.div&&(live.s.starter===1||live.s.fired===1)&&!dw();
   w=`1 フレーム ${ms.toFixed(0)} ms，表示 ${b?1:0}，残る ${c?1:0}，START ${d?1:0}`
  }catch(e){
   delete live.f;
   w='例外：'+e.message
  }
  chkB(15,'計算の発散：右辺が有限でない値を返すと，1 フレームが上限の時間の中で終わり，機関断面図と運転の状態のテキストに DIVERGED が出る．右辺を戻して進めても DIVERGED が残り状態と時刻が変わらない．START で初期値から始動し DIVERGED が消える',a&&b&&c&&d,w);
  live.reset()
 }
 show(3);
 yield;
 let okc=0;
 for(let i=1;i<=NT;i++){tapEl($('cp').children[i-1]);if(U.sel===i&&$('dt').textContent.startsWith('TEST-'+pad(i)))okc++}
 chkB(15,NT+' チップすべてがタップで選択できる',okc===NT,okc+' / '+NT,NT+' / '+NT);
 const run=function*(dt){
   const c=new Core(mkPT()),st={debt:0,spd:.1};
   c.start();
   const n=Math.round(2/dt);
   for(let i=0;i<n;i++){advance(st,c,dt,0);if(RUN.over())yield}
   return c.s.t
  },
  t1=yield*run(1/120),
  t2=yield*run(1/60);
 chk(15,'120 Hz と 60 Hz で時間進行が一致（実 2 s）',t2,t1,.01);
 const c=new Core(mkPT()),st={debt:0,spd:1};
 c.start();
 advance(st,c,10,0);
 chkB(15,'復帰直後の1フレームの進みが 50 ms×速度＋最大刻み 1 ms 以下',c.s.t<=.051,(c.s.t*1e3).toFixed(1)+' ms','≤ 51 ms');
 {/* 14：1 ステップが 3 ms かかる機関（模擬）でも，1 フレームの積分は上限 9 ms ＋ 4 ステップ分で打ち切られる（SPEC-15 F の 2） */
  let ns=0;
  const slow={step(){const t=performance.now();while(performance.now()-t<3);ns++;return 1e-5}},
   st2={debt:0,spd:1},
   t0=performance.now();
  advance(st2,slow,.05,9);
  const el=performance.now()-t0;
  chkB(15,'1 フレームの積分の打ち切り：1 ステップが 3 ms かかる機関（模擬）で，1 フレームの積分が 30 ms 以下（上限 9 ms ＋ 判定の間隔 4 ステップ），残りの時間は持ち越さない',el<=30&&ns<=8&&st2.debt<=0,`${el.toFixed(1)} ms，${ns} ステップ`,'≤ 30 ms，≤ 8 ステップ')
 }
/* 16：タブの並びと「設定」の区別（SPEC-15 B の 1） */
 {
  const nb=[...$('N').children],
   names=nb.map(q=>q.textContent.trim()).join(),
   B=e=>e.getBoundingClientRect(),
   stb=nb.find(q=>+q.dataset.t===2),
   sv=nb.filter(q=>q.querySelector('svg')),
   ok1=names==='運転,線図,性能曲線,熱効率,最適化,設定,検証,解説',
   ok2=nb.every(q=>B(q).width>=43.5&&txtW(q)<=.95*room(q)),
   gr=sv.length===1&&sv[0]===stb?B(stb.querySelector('svg')):null,
   ok3=!!gr&&Math.abs(gr.width-11)<=.5&&Math.abs(gr.height-11)<=.5,
   nh=B($('N')).height,
   dv=nb.map(q=>{
    const cs=getComputedStyle(q,'::before');
    return cs.content!=='none'&&parseFloat(cs.width)>=1?parseFloat(cs.height)/nh:0
   }),
   ok4=dv.every((v,i)=>nb[i]===stb?v>=.4&&v<=.6:v===0);
  chkB(15,'タブの並びと設定の区別：8 個（運転，線図，性能曲線，熱効率，最適化，設定，検証，解説），幅 44 px 以上で文字幅 ≤ 95%，「設定」にだけ歯車の印（11 px）と左の仕切り線（タブバーの高さの 40〜60%）',ok1&&ok2&&ok3&&ok4,`${names}，歯車 ${gr?gr.width.toFixed(1)+'×'+gr.height.toFixed(1):'無し'}，仕切り線 ${dv.map(v=>v.toFixed(2)).join(' ')}`)
 }
/* 17：再生速度（SPEC-15 F の 4） */
 {
  const sb=[...$('sp').querySelectorAll('button[data-v]')],
   lab=sb.map(q=>q.textContent).join(),
   c1=new Core(mkPT()),
   st1={debt:0,spd:1};
  c1.start();
  for(let i=0;i<120;i++){advance(st1,c1,1/60,0);if(RUN.over())yield}
  let ns=0;
  const slow={s:{fired:1,starter:0,y:[0,1]},step(){const t=performance.now();while(performance.now()-t<1);ns++;return 1e-5}},
   st2={debt:0,spd:Infinity},
   t0=performance.now();
  advance(st2,slow,0,24);
  const el=performance.now()-t0;
  chkB(15,'再生速度：ボタンが 0.02×，0.1×，0.5×，1×，最速．1× で実 2 s に対し 2 s ± 1%．最速で 1 ステップ 1 ms の機関（模擬）の 1 フレームが 24〜30 ms で打ち切られ，持ち越さない',lab==='0.02×,0.1×,0.5×,1×,最速'&&Math.abs(c1.s.t/2-1)<=.01&&el>=24&&el<=30&&st2.debt===0,`${lab}，${c1.s.t.toFixed(4)} s，${el.toFixed(1)} ms（${ns} ステップ）`);
  show(0);
  const s0=Sim.spd,bx=sb[sb.length-1];
  live.reset();
  live.start();
  tapEl(bx);
  const isMax=Sim.spd===Infinity;
  Sim.w0=null;
  Sim.rs=NaN;
  let w0=performance.now(),tA=live.s.t,tp=w0,mx=0,mine=NaN;
  while(performance.now()-w0<1500){
   const now=performance.now();
   advance(Sim,live,(now-tp)/1e3,24);
   const r0=Sim.rs;
   spdTick(now);
   if(Sim.rs===Sim.rs&&Sim.rs!==r0&&!(mine===mine))mine=(live.s.t-tA)/((now-w0)/1e3);
   mx=Math.max(mx,now-tp);
   tp=now;
   yield 'frame'
  }
  const rs=Sim.rs,L3=engText(live,rsShow())[2]||'';
  tapEl(sb[3]);
  const L1=engText(live,rsShow());
  Sim.spd=s0;
  sp();
  live.reset();
  chkB(15,'最速：速さの倍率が有限の正の値で，（シミュレーションの時間の進み）÷（実経過時間）と ±15% で一致，断面図の 3 行目が「最速 ○×」．[1×] に戻すと 3 行目が無い',isMax&&rs>0&&rs<Infinity&&Math.abs(rs/mine-1)<=.15&&/^最速 [0-9.]+×$/.test(L3)&&L1.length===2&&Sim.spd===s0,`倍率 ${rs===rs?rs.toFixed(2):'–'}（実測 ${mine===mine?mine.toFixed(2):'–'}），「${L3}」，最長 ${mx.toFixed(0)} ms`)
  chkP(15,'最速のときのフレームの間隔（最長）',mx,250,'ms',0);
 }
/* 11〜13：線図の切り替えのボタンと，バルブタイミングの画面（SPEC-15 I） */
 {
  uiDefault();
  show(1);
  setSub(0);
  yield 'frame';
  const B=e=>e.getBoundingClientRect(),
   sg=[...$('sg').children],
   tops=[...new Set(sg.map(b=>Math.round(B(b).top)))].sort((a,b)=>a-b),
   n1=sg.filter(b=>Math.round(B(b).top)===tops[0]).length,
   vb=sg[7],
   big=e=>B(e).width>=43.5&&B(e).height>=43.5;
  chkB(15,'線図の切り替え：ボタン 8 個が 2 行（5 個と 3 個），すべて 44×44 px 以上，「バルブタイミング」がボタンの幅に収まる',sg.length===8&&tops.length===2&&n1===5&&sg.every(big)&&!!vb&&vb.textContent==='バルブタイミング'&&vb.scrollWidth<=vb.clientWidth+1,`${sg.length} 個，${tops.length} 行（1 行目 ${n1} 個），幅 ${sg.map(b=>B(b).width.toFixed(0)).join('/')}`);
  setSub(7);
  yield 'frame';
  drawCh();
  const sc=yield*scen('S2'),
   sp=screenSpec(sc.c,AX,7,{now:0,log:0}),
   nm=s=>(s.mk||[]).map(q=>q.t).join(),
   g2=sp.length===1&&!!sp[0].xa.log&&!!sp[0].ya.log&&nm(sp[0]).startsWith('IVO,IVC,EVO,EVC')&&LAY.length===1;
  const rows=[...$('vt').querySelectorAll('.vtr')],
   row=k=>$('vt').querySelector(`.vtr[data-k="${k}"]`),
   kn=k=>row(k).querySelector('.vtk'),
   trk=k=>row(k).querySelector('.vts'),
   bt=(k,d)=>row(k).querySelector(`button[data-d="${d}"]`),
   lab=k=>row(k).querySelector('.vtv').textContent,
   uOf=k=>(B(kn(k)).left-B(trk(k)).left)/(B(trk(k)).width-44),
   want=k=>{const it=IT[k];return gv(it,Math.round(uOf(k)*gmax(it)))},
   at=(x,y)=>document.elementFromPoint(x,y),
   drag=(k,dx)=>{
    const e=kn(k),[x,y]=ctr(e);
    pev(at(x,y)||e,'pointerdown',x,y);
    pev(e,'pointermove',x+dx/2,y);
    pev(e,'pointermove',x+dx,y);
    pev(e,'pointerup',x+dx,y)
   },
   KS=['ivo','ivc','evo','evc'],
   sz=rows.length===4&&KS.every(k=>big(kn(k))&&big(bt(k,-1))&&big(bt(k,1)))&&$('s1').scrollHeight<=$('s1').clientHeight+1,
   r=[];
  for(const k of KS){
   const it=IT[k],v0=LP[k],q=[];
   drag(k,30);
   q.push(LP[k]!==v0&&LP[k]===want(k)&&live.P[k]===LP[k]&&lab(k)===disp(it,LP[k])+'°');
   drag(k,-2000);
   q.push(LP[k]===gv(it,0)&&!bt(k,-1).disabled&&!bt(k,1).disabled);
   drag(k,4000);
   q.push(LP[k]===gv(it,gmax(it))&&!bt(k,1).disabled&&!bt(k,-1).disabled);
   tapEl(bt(k,-1));
   tapEl(bt(k,-1));
   q.push(gi(it,LP[k])===gmax(it)-2);
   const v1=LP[k],T=B(trk(k));
   pev(trk(k),'pointerdown',T.left+30,T.top+22);
   pev(trk(k),'pointermove',T.left+90,T.top+22);
   pev(trk(k),'pointerup',T.left+90,T.top+22);
   tapEl(trk(k));
   q.push(LP[k]===v1);
   tapEl(bt(k,1));
   q.push(gi(it,LP[k])===gmax(it)-1);
   r.push(q.map(x=>x?1:0).join(''));
   setParam(k,v0,1)
  }
  chkB(15,'バルブタイミングの画面：両対数の p-V が 1 つ（印つき．線形の選択によらない），操作の列 4 行（つまみ・[−]・[＋] が 44×44 px 以上，スクロールなし）',g2&&sz,`グラフ ${sp.length} 個（${nm(sp[0])}），行 ${rows.length}`);
  chkB(15,'バルブタイミングの操作（IVO，IVC，EVO，EVC）：ドラッグで位置の値，左右の端で下限・上限（ボタンは有効のまま），[−] で −1°，トラックのタップでは不変，[＋] で +1°',r.every(s=>s==='111111'),r.join(' '));
/* 13：設定画面との連動と基準 */
  {
   const it=IT.ivc,v0=LP.ivc,l0=live.last,q=[];
   if(!live.last)live.last={p:new Float32Array(1440).fill(100),V:new Float32Array(1440).fill(300),me:new Float32Array(1440),imep:0,pm:0,N:0,ok:false};
   Base.clear();
   vtRender();
   const tk=row('ivc').querySelector('.vts s');
   q.push(getComputedStyle(tk).display==='none');
   tapEl(bt('ivc',-1));
   const v1=LP.ivc;
   q.push(gi(it,v1)===gi(it,v0)-1&&!!Base.ref&&!!Base.vt&&Base.vt.ivc===v0);
   vtRender();
   const T=B(trk('ivc')),xt=B(tk).left+B(tk).width/2,xw=T.left+22+gi(it,v0)/gmax(it)*(T.width-44);
   q.push(getComputedStyle(tk).display!=='none'&&Math.abs(xt-xw)<=1.5);
   show(2);
   U.pg=PAGES.indexOf('弁タイミング');
   rs();
   const sv=()=>$('Pg').querySelector('b[data-v="ivc"]').textContent;
   q.push(sv()===disp(it,v1));
   tapEl($('Pg').querySelector('button[data-k="ivc"][data-s="1"]'));
   tapEl($('Pg').querySelector('button[data-k="ivc"][data-s="1"]'));
   const v2=LP.ivc;
   q.push(gi(it,v2)===gi(it,v1)+2);
   show(1);
   setSub(7);
   vtRender();
   q.push(lab('ivc')===disp(it,v2)+'°'&&Math.abs(uOf('ivc')-gi(it,v2)/gmax(it))<.01);
   setParam('ivc',v0,1);
   live.last=l0;
   Base.clear();
   vtRender();
   chkB(15,'バルブタイミングと設定画面の連動：この画面の変更が設定の行に，設定の [＋] がこの画面の値とつまみに反映．最初の変更で基準が取られ，変更前の位置に縦線',q.every(x=>x),q.map(x=>x?1:0).join(''))
  }
/* 15：範囲を超える [−][＋] と作用角の制約（SPEC-15 I の 2，SPEC-18 B の 3） */
  {
   const q=[],
    it=IT.ivc,
    G=(k,d)=>gv(IT[k],d-lo0(IT[k])),
    dg=k=>Math.round(LP[k]/D),
    sv0={ivo:LP.ivo,ivc:LP.ivc,evo:LP.evo,evc:LP.evc},
    vt=()=>{show(1);setSub(7);VTD.sig='';vtRender()};
   vt();
   setParam('ivc',G('ivc',290),1);
   vtRender();
   tapEl(bt('ivc',1));
   q.push(dg('ivc')===291&&Math.round(live.P.ivc/D)===291&&!bt('ivc',1).disabled&&Math.abs(B(kn('ivc')).left-B(trk('ivc')).left-(B(trk('ivc')).width-44))<=1.5&&lab('ivc')==='291°');
   show(2);
   U.pg=PAGES.indexOf('弁タイミング');
   rs();
   const pb=d=>$('Pg').querySelector(`button[data-k="ivc"][data-s="${d}"]`);
   q.push($('Pg').querySelector('b[data-v="ivc"]').textContent==='291'&&pb(1).disabled&&!pb(-1).disabled);
   tapEl(pb(-1));
   q.push(dg('ivc')===290);
   vt();
   setParam('ivc',G('ivc',dg('ivo')+2),1);
   vtRender();
   tapEl(bt('ivc',-1));
   q.push(dg('ivc')-dg('ivo')===1&&bt('ivc',-1).disabled&&bt('ivo',1).disabled&&Math.abs(B(kn('ivc')).left-B(trk('ivc')).left)<=1.5);
   drag('ivc',4000);
   q.push(dg('ivc')===290);
   setParam('evc',G('evc',dg('evo')+718),1);
   vtRender();
   tapEl(bt('evc',1));
   q.push(dg('evc')-dg('evo')===719&&bt('evc',1).disabled&&bt('evo',-1).disabled);
   for(const k in sv0)setParam(k,sv0[k],1);
   vtRender();
   chkB(15,'範囲を超える [−][＋] と作用角の制約：IVC 290° で [＋] → 291°（機関も 291°，つまみは右端，[＋] は有効）．設定画面は 291 で [＋] 無効，[−] で 290°．IVC を IVO + 2° にして [−] → 作用角 1° で IVC の [−] と IVO の [＋] が無効，つまみは左端，右端へのドラッグで 290°．EVC を EVO + 718° にして [＋] → 719° で EVC の [＋] と EVO の [−] が無効',q.every(x=>x),q.map(x=>x?1:0).join(''))
  }
  setSub(0);
  uiDefault()
 }
};
TST[16]=function*(){
 uiDefault();
 docVals();
 const doc0=DV.cur,tops0=DV.top.slice();
 docShow(0);
 show(4);
 yield;
 {
  let n=0;
  while((DV.rev||DV.pend.length||(typeof MJX!=='undefined'&&(MJX.st==='load'||MJX.q.length)))&&n++<3000)yield 'frame'
 }
 yield 'frame';
 yield 'frame';
 {let n=0;while(typeof MJX!=='undefined'&&MJX.q.length&&n++<3000)yield 'frame'}
 const MJ=typeof MJX!=='undefined'&&MJX.st==='ok',
  TXS=E=>[...E.querySelectorAll('.tx')],
  cbad=[],
  txc=function*(list){
   let t0=performance.now();
   for(const e of list){
    const n=MathJax.tex2svg(e.dataset.tex,{display:e.dataset.d==='1'});
    if(n.querySelector('[data-mjx-error],mjx-merror'))cbad.push(e.dataset.tex.slice(0,30));
    if(performance.now()-t0>8){yield 'frame';t0=performance.now()}
   }
  },
  inview=(el,S)=>{
   const R=S.getBoundingClientRect();
   return[...el.querySelectorAll('.tx')].filter(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.bottom>R.top&&r.top<R.bottom})
  },
  tid=e=>(e.dataset.ids||'').split(' ').filter(Boolean).map(s=>s.normalize('NFC'));
 const S=$('s4'),
  E=$('dv0'),
  secs=[...E.querySelectorAll('h3[data-sec]')].map(h=>+h.dataset.sec),
  need=Array.from({length:21},(_,i)=>i);
 chkB(16,'§0〜§20 がすべて存在',need.every(n=>secs.includes(n)),secs.length+' 章');
 const reqs=new Set([...E.querySelectorAll('h3[data-req]')].flatMap(h=>h.dataset.req.split(',')));
 chkB(16,'章の data-req が REQ-01〜14，21，27，29，30，36 を網羅',[...Array.from({length:14},(_,i)=>pad(i+1)),'21','27','29','30','36'].every(r=>reqs.has(r)));
 chkB(16,'MathJax で組んだときに組版の誤りが無い',!MJ||!E.querySelector('[data-mjx-error],mjx-merror'),MJ?'MathJax':'TeX の表示（判定しない）');
 const ids=new Set([...E.querySelectorAll('.mx .tx')].flatMap(e=>(e.dataset.ids||'').split(' ').filter(Boolean))),
  miss=[...ids].filter(i=>!(i in SYM));
 chkB(16,`式中の全記号（${ids.size} 個）が記号表にある`,miss.length===0,miss.length?'未定義: '+miss.join(' '):'未定義 0','未定義 0');
 const cs=[...E.querySelectorAll('[data-c]')],
  bc=cs.filter(e=>Math.abs(parseFloat(e.textContent)-DOCC[e.dataset.c])>1e-12*Math.abs(DOCC[e.dataset.c]));
 chkB(16,`解説の係数値（${cs.length} 個）がソルバ定数と一致`,cs.length>=8&&bc.length===0);
 const vs=[...E.querySelectorAll('[data-v]')],bv=vs.filter(e=>e.textContent!==disp(IT[e.dataset.v],LP[e.dataset.v]));
 chkB(16,'§0 の現在値が設定値と一致',vs.length===ITEMS.length&&bv.length===0);
 const all=TXS(E),
  ms=[...E.querySelectorAll('.mx .tx')],
  emp=all.filter(e=>!e.dataset.tex),
  fs=parseFloat(getComputedStyle(E).fontSize);
 let tall=[],thin=[],mxh=0,bad4=[];
 let vis=0,nv=[];
 if(MJ){
  yield* txc(all);
  const st0=S.scrollTop;
  docTo(E.querySelector('h3[data-sec="1"]'));
  yield 'frame';
  yield 'frame';
  {let n=0;while(MJX.q.length&&n++<3000)yield 'frame'}
  vis=inview(E,S);
  S.scrollTop=st0;
  nv=vis.filter(e=>!e.querySelector('mjx-container svg'));
  {
   let t0=performance.now();
   for(const e of ms.filter(e=>!e.classList.contains('mj'))){txMJ(e);if(performance.now()-t0>8){yield 'frame';t0=performance.now()}}
  }
  bad4=ms.filter(e=>!e.querySelector('mjx-container svg'));
  const sv=ms.map(e=>e.querySelector('mjx-container')).filter(Boolean);
  tall=ms.filter(e=>!/\\frac|\\sqrt|\^|\\bar|\\dot|\\left/.test(e.dataset.tex)&&e.getBoundingClientRect().height>3*fs);
  thin=sv.filter(c=>c.getBoundingClientRect().width<.5*fs);
  mxh=Math.max(...sv.map(c=>c.getBoundingClientRect().height))
 }else bad4=all.filter(e=>e.textContent!==e.dataset.tex||!/mono/i.test(getComputedStyle(e).fontFamily));
 chkB(16,`全数式（${all.length} 個）に TeX のソースがあり，${MJ?'全数式が誤りなく組め，表示範囲の式（'+vis.length+' 個）が SVG に組まれている':'TeX のソースが等幅で表示されている'}`,ms.length>20&&emp.length===0&&bad4.length===0&&cbad.length===0&&nv.length===0&&(!MJ||vis.length>0),`空 ${emp.length}，違反 ${bad4.length}，組版の誤り ${cbad.length}${cbad.length?'（'+cbad[0]+'）':''}，表示範囲の未組版 ${nv.length}`,'0，0，0，0');
 chkB(16,'数式が横組みで組まれている（高さ・幅．MathJax のとき）',tall.length===0&&thin.length===0,MJ?`高すぎ ${tall.length}，狭すぎ ${thin.length}`:'TeX の表示（判定しない）','0，0');
 chkB(16,'分数を含む式も高さ 8 em 以下（MathJax のとき）',mxh<=8*fs,MJ?(mxh/fs).toFixed(1)+' em':'TeX の表示（判定しない）','≤ 8 em');
 {
  const want=MJ?'数式：MathJax 3.2.2 で表示':MJX.st==='fail'?'数式：MathJax を読み込めないため TeX のソースを表示':'数式：MathJax を読み込み中（TeX のソースを表示）',
   got=$('txs')?$('txs').textContent:'';
  chkB(16,'数式の状態の表示が MathJax の状態と一致',got===want,got||'（無し）',want)
 }
 const raw=[...E.querySelectorAll('p,td')].filter(e=>!e.closest('.src')).flatMap(e=>[...e.childNodes].filter(n=>n.nodeType===3&&/(?:[A-Za-zα-ω]|ṁ)_[A-Za-z0-9]/u.test(n.nodeValue.normalize("NFC"))).map(n=>n.nodeValue.slice(0,20)));
 chkB(16,'本文中に生の下付き表記（X_y）が残っていない',raw.length===0,raw.length?raw.slice(0,3).join(' | '):'0 箇所','0 箇所');
 const mxs=[...E.querySelectorAll('.mx')],
  ov=mxs.filter(d=>d.scrollWidth>d.clientWidth+1),
  shr=ms.filter(e=>parseFloat(getComputedStyle(MJ&&e.querySelector('mjx-container')||e).fontSize)<(MJ?1:.85)*parseFloat(getComputedStyle(e.parentElement).fontSize)-.01),
  tws=[...E.querySelectorAll('.tw')],
  nsc=[...ov,...tws.filter(d=>d.scrollWidth>d.clientWidth+1)].filter(d=>getComputedStyle(d).overflowX!=='auto');
 chkB(16,`数式を縮小せず，幅を超える式（${ov.length} 式）と表は容器ごとに横スクロール，解説タブ全体は横スクロールしない`,shr.length===0&&nsc.length===0&&S.scrollWidth<=S.clientWidth+1,`縮小 ${shr.length}，スクロール不可 ${nsc.length}`,'0，0');
 {
  const toc=[...E.querySelectorAll('#toc [data-go]')],secs2=toc.map(a=>+a.dataset.go);
  let bad=0;
  for(const a of toc){
   yield;
   tapEl(a);
   const h=E.querySelector(`h3[data-sec="${a.dataset.go}"]`),d=h.getBoundingClientRect().top-S.getBoundingClientRect().top;
   if(Math.abs(d)>4&&S.scrollTop<S.scrollHeight-S.clientHeight-1)bad++
  }
  tapEl($('dtop'));
  chkB(16,'目次に §0〜§20，各項目のタップで見出しが上端（±4 px），「先頭へ戻る」で 0',need.every(n=>secs2.includes(n))&&bad===0&&S.scrollTop===0,`${toc.length} 項目，ずれ ${bad} 件`)
 }
 {
  const st=[...E.querySelectorAll('h3[data-sec="1"] ~ .eqs[data-st]')].map(e=>e.dataset.st),
   want=['θ','ω','p','m','m_u','T_w','p_in','m_bi','ṁ_r','p_p','m_bp','ṁ_e','p_pe','p_te','E_in','E_p','m_f','m_bf','m_l','m_fi','m_fp','T_X','m_ap'],
   lhs=[...E.querySelectorAll('h3[data-sec="1"] ~ .eqs[data-st]')].every(e=>{const q=e.querySelector('.tx');return q&&tid(q)[0]===e.dataset.st.normalize('NFC')});
  chkB(16,'§1 に状態 23 成分の時間微分の式が一対一でそろい，左辺が各成分である',st.length===23&&new Set(st).size===23&&want.every(k=>st.includes(k))&&lhs,st.join(' '))
 }
 {
  const secM=n=>{
    const o=[];
    let nd=E.querySelector(`h3[data-sec="${n}"]`).nextElementSibling;
    while(nd&&nd.tagName!=='H3'){
     o.push(...nd.querySelectorAll('.mx .tx'),...(nd.matches('.mx')?[nd.querySelector('.tx')]:[]));
     nd=nd.nextElementSibling
    }
    return o.filter(Boolean)
   },
   first=m=>tid(m)[0]||'',
   has=(m,k)=>tid(m).includes(k),
   m3=secM(3),
   m6=secM(6),
   m10=secM(10),
   ok3=['γ_u','γ_b','e_u','e_b'].every(k=>m3.some(m=>first(m)===k)),
   ok6=['E_in','E_p','X_o'].every(k=>m6.some(m=>first(m)===k)),
   ok10=m10.some(m=>first(m)==='p'&&has(m,'e_u')&&has(m,'e_b')&&has(m,'x_b'));
  chkB(16,'§3 に未燃・既燃の比熱比と内部エネルギーの式，§6 に余剰エンタルピーの式，§10 に組成の項を含む筒内圧の式',ok3&&ok6&&ok10,`§3 ${ok3}，§6 ${ok6}，§10 ${ok10}`);
  const m18=secM(18),
   m19=secM(19),
   ok18=m18.some(m=>first(m)==='p'&&has(m,'S_E')&&has(m,'S_R'))&&m18.some(m=>first(m)==='U'&&has(m,'e_a')&&has(m,'e_f')&&has(m,'e_b'))&&m18.some(m=>first(m)==='S_E'&&has(m,'h_l')),
   ok19=m19.some(m=>first(m)==='m_cmd')&&m19.some(m=>first(m)==='ṁ_inj'.normalize('NFC'))&&m19.some(m=>has(m,'τ_ev')&&has(m,'m_l'))&&m19.some(m=>first(m)==='h_l'&&has(m,'h_fg'));
  chkB(16,'§18 に筒内圧の式（S_E，S_R を含む）・全内部エネルギー・エネルギーの式の右辺，§19 に噴射量・噴射率・気化・液体のエンタルピーの式',ok18&&ok19,`§18 ${ok18}，§19 ${ok19}`)
 }
 {
  const cur=k=>[...E.querySelectorAll(`[data-opt="${k}"]`)].filter(e=>e.classList.contains('cur')).map(e=>e.dataset.val).join(),
   g0=LP.gam,
   c0=LP.cam,
   r=[];
  for(const[k,v]of[['gam',0],['gam',1],['gam',2],['cam',0],['cam',1],['cam',2]]){LP[k]=v;docVals();r.push(cur(k))}
  LP.gam=g0;
  LP.cam=c0;
  docVals();
  const ng=E.querySelectorAll('[data-opt="gam"]').length,nc=E.querySelectorAll('[data-opt="cam"]').length;
  chkB(16,'選択中の熱物性とカムに対応する式だけが強調される',r.join(' ')==='0,0 1 2 0 1 2'&&ng===4&&nc===3&&cur('gam')===(g0===2?'2':g0?'1':'0,0')&&cur('cam')===String(c0),r.join(' '),'0,0 1 2 0 1 2')
 }
 {
  const el=[...E.querySelectorAll('[data-fl]')],
   want={
    hg:FLV.hg.join('，'),
    hd:FLV.hd.map(v=>+(v*1e3).toFixed(3)).join('，'),
    L:String(FLV.L),
    r:String(FLV.r),
    drive:String(FLV.drive),
    asym:String(FLV.asym),
    form:FLV.form.map(f=>f.join('／')).join('，'),
    dark:String(FLV.dark),
    bright:String(FLV.bright),
    noise:String(FLV.noise),
    intake:String(FLV.intake),
    pop:String(FLV.pop),
    popG:String(FLV.popG),
    shelf:FLV.shelf.join('／')
   },
   bad=Object.keys(want).filter(k=>{const e=el.find(q=>q.dataset.fl===k);return!e||e.textContent!==want[k]}),
   h16=E.querySelector('h3[data-sec="16"]');
  let rows=0,nd=h16.nextElementSibling;
  while(nd&&nd.tagName!=='H3'){
   if(nd.classList.contains('tw'))rows=Math.max(rows,nd.querySelectorAll('tr').length-1);
   nd=nd.nextElementSibling
  }
  chkB(16,'§16 に演出音の処理（10 段の表）と定数表があり，定数が合成器と一致',bad.length===0&&el.length===Object.keys(want).length&&rows>=10&&h16.parentNode.textContent.includes('物理モデルではなく'),bad.length?'不一致: '+bad.join(' '):`${el.length} 定数，${rows} 段`)
 }
 const bp=all.filter(e=>/(?<!\\right)\)\s*\^/.test(e.dataset.tex));
 chkB(16,'べき指数が閉じ括弧 1 文字だけに掛かる式が無い',bp.length===0,bp.length?bp[0].dataset.tex.slice(0,40):'0 箇所','0 箇所');
 {
  const ps=ms.find(e=>/^\\Psi\s*=/.test(e.dataset.tex||'')),rh=ps?ps.dataset.tex.replace(/^\\Psi\s*=\s*/,'').trim():'';
  let ok=false;
  if(rh.startsWith('\\sqrt{')){
   let d=0,end=-1;
   for(let i=5;i<rh.length;i++){if(rh[i]==='{')d++;else if(rh[i]==='}'){d--;if(d===0){end=i;break}}}
   ok=end===rh.length-1
  }
  chkB(16,'Ψ の式が標準形で，根号が右辺全体に掛かる',ok,rh.slice(0,50))
 }
 S.scrollTop=200;
 show(0);
 yield;
 show(4);
 yield;
 chkB(16,'解説のスクロール位置を保持',Math.abs(S.scrollTop-200)<=1,S.scrollTop+' px','200 ±1');
 chkB(16,'解説のみ縦スクロール可・横スクロールなし',S.scrollHeight>S.clientHeight&&S.scrollWidth<=S.clientWidth+1);
 S.scrollTop=0;
/* 文書の閲覧（SPEC-16 の 9） */
 {
  const sw=[...$('dsw').children],
   okB=sw.length===5&&sw.every(b=>{const r=b.getBoundingClientRect();return r.width>=43.5&&r.height>=43.5&&txtW(b)<=.95*room(b)}),
   res=[],
   pg0=DV.pg.slice(),
   heads=[[],[],[],[],[]];
  let pmax=0,one=true,navOk=true;
  for(const k of[1,2,3,4]){
   tapEl(sw[k]);
   yield 'frame';
   const el=$('dv'+k),q=DOCS[DOCK[k]],np=q.chunks.length,P=()=>el.querySelector('.dpg');
   docPage(k,0);
   const h1=!!P().querySelector('h1');
   let nm=0,pm=-1;
   const c0=cbad.length;
   for(let i=0;i<np;i++){
    const t0=performance.now();
    docPage(k,i);
    void el.offsetHeight;
    pmax=Math.max(pmax,performance.now()-t0);
    const txs=TXS(P());
    nm+=txs.length;
    if(pm<0&&txs.length>=3)pm=i;
    one=one&&el.querySelectorAll('.dpg').length===1&&P().querySelectorAll('h2,h3').length===(i?1:0);
    P().querySelectorAll('h2,h3,h4').forEach(h=>heads[k].push(h.textContent));
    if(MJ)yield* txc(txs);
    yield
   }
   {
    const nv=[...el.querySelectorAll('.dnav')],
     bt=n=>[...nv[0].querySelectorAll('button')][n],
     lab=()=>nv[0].querySelector('.dn').textContent,
     big=nv.length===2&&nv.every(n=>[...n.querySelectorAll('button')].every(b=>{const r=b.getBoundingClientRect();return r.width>=43.5&&r.height>=43.5}));
    docPage(k,0);
    const a0=bt(0).disabled&&!bt(1).disabled&&lab()===`1 / ${np}`;
    tapEl(bt(1));
    const a1=DV.pg[k]===1&&lab()===`2 / ${np}`;
    yield;
    docPage(k,np-1);
    const a2=bt(1).disabled&&!bt(0).disabled;
    yield;
    tapEl(bt(0));
    const a3=DV.pg[k]===np-2;
    yield;
    tapEl([...nv[1].querySelectorAll('button')][1]);
    const a4=DV.pg[k]===np-1&&S.scrollTop<=nv[0].offsetTop+1;
    navOk=navOk&&big&&a0&&a1&&a2&&a3&&a4
   }
   let iv=[];
   if(MJ){
    docPage(k,Math.max(pm,0));
    docTo(P().querySelector('.tx'));
    yield 'frame';
    yield 'frame';
    {let n3=0;while(MJX.q.length&&n3++<3000)yield 'frame'}
    iv=inview(el,S)
   }
   const ff=!MJ||(cbad.length===c0&&iv.length>0&&iv.every(e=>e.querySelector('mjx-container svg'))&&!el.querySelector('[data-mjx-error],mjx-merror'));
   tapEl(el.querySelector('.tocb'));
   const as=[...el.querySelectorAll('.dtoc a[data-h]')];
   let bad=0;
   for(const a of[as[0],as[as.length-1]]){
    tapEl(a);
    yield;
    const hd=document.getElementById(a.dataset.h);
    if(!hd){bad++;continue}
    const dd=hd.getBoundingClientRect().top-S.getBoundingClientRect().top;
    if(Math.abs(dd)>4&&S.scrollTop<S.scrollHeight-S.clientHeight-1)bad++
   }
   tapEl(el.querySelector('.tocb'));
   {
    const f=[h1,el.offsetHeight>100,E.offsetHeight===0,nm===q.nmath,nm>100,ff,as.length===q.toc.length,bad===0,S.scrollWidth<=S.clientWidth+1];
    res.push({k,nm,nt:as.length,ok:f.every(x=>x),f:f.map(x=>x?1:0).join('')})
   }
  }
  chkB(16,'文書の閲覧：切替のボタン 5 つ（44 px 以上，文字の余裕），4 文書とも題・数式（全ページの合計がビルド時の数と一致，MathJax のときは全数式が誤りなく組め，表示範囲の式が組まれている）・目次（最初と最後の項目でそのページに替わり見出しが上端 ±4 px）があり，横スクロールしない',okB&&res.length===4&&res.every(r=>r.ok),res.map(r=>`${['','要件定義書','仕様書','画面の文書','用語集'][r.k]}：数式 ${r.nm}，目次 ${r.nt}${r.ok?'':' ×'+r.f}`).join('／'));
  const hc=(ks,re)=>{
    const c={};
    ks.forEach(k=>heads[k].forEach(s=>{const m=s.match(re);if(m)c[m[1]]=(c[m[1]]||0)+1}));
    return Array.from({length:NT},(_,i)=>pad(i+1)).every(n=>c[n]===1)
   },
   okH=hc([1,3],/^REQ-(\d\d)：/)&&hc([2,3],/^SPEC-(\d\d)：/)&&hc([2,3],/^TEST-(\d\d)：/);
  const lng=k=>{const c=DOCS[DOCK[k]].chunks;let b=0;c.forEach((s,i)=>{if(s.length>c[b].length)b=i});return b},
   L2=lng(2),
   L3=lng(3);
  tapEl(sw[2]);
  docPage(2,L2);
  yield;
  S.scrollTop=300;
  tapEl(sw[3]);
  docPage(3,L3);
  yield;
  S.scrollTop=120;
  tapEl(sw[2]);
  yield;
  const p2=S.scrollTop,g2=DV.pg[2];
  tapEl(sw[3]);
  yield;
  const p3=S.scrollTop,g3=DV.pg[3];
  tapEl(sw[0]);
  yield;
  const back=E.offsetHeight>100&&$('dv2').offsetHeight===0&&E.querySelectorAll('h3[data-sec]').length===21;
  chkB(16,'文書の見出し：全ページを通して要件定義書と画面の文書を合わせて REQ-01〜37，仕様書と画面の文書を合わせて SPEC-01〜37 と TEST-01〜37 が 1 つずつ．[式の解説] で元の表示に戻り，文書ごとに表示中のページと縦スクロール位置を保つ',okH&&back&&Math.abs(p2-300)<=1&&Math.abs(p3-120)<=1&&g2===L2&&g3===L3,`見出し ${okH}，戻る ${back}，ページ ${g2===L2&&g3===L3}，位置 ${p2} / ${p3} px`,'300 / 120 ±1');
  chkB(16,'ページ：画面にある断片は表示中の 1 ページだけ，[◀ 前] [次 ▶] で 1 ページずつ移動（端では無効，44 px 以上）',one&&navOk,`1 ページだけ ${one}，移動 ${navOk}`);
  chkP(16,'ページの切り替え（4 文書の全ページの最長）',pmax,100,'ms',0);
  for(const k of[1,2,3,4])docPage(k,pg0[k]);
  DV.top=tops0.slice();
  docShow(doc0)
 }
 S.scrollTop=0;
 DV.top[DV.cur]=0;
 {/* 項目 18：第三者の著作物を埋め込まない（C-8） */
  let nf=0;
  for(const sh of document.styleSheets){try{for(const ru of sh.cssRules)if(ru.constructor.name==='CSSFontFaceRule')nf++}catch(_){}}
  const b64=/data:[^"'\s)]*;base64,/.test(document.documentElement.innerHTML),
   sc=document.querySelector('script[data-mj]'),
   src=sc?sc.src:'',
   lt=($('dv0').querySelector('.lic')||{}).textContent||'';
  const okF=nf===0&&!b64&&[...document.fonts].length===0,
   okS=src==='https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js',
   okL=['MathJax 3.2.2','Apache License 2.0','cdnjs'].every(s=>lt.includes(s));
  chkB(16,'第三者の著作物を埋め込まない（C-8）：@font-face と base64 が無く，MathJax の読み込み元が規定の URL，解説タブに MathJax の名前・版・ライセンス・読み込み元',okF&&okS&&okL,`@font-face ${nf}，base64 ${b64}，フォント ${[...document.fonts].length}，src ${okS}，表示 ${okL}`)
 }
 {/* 項目 19：TeX の表示（MathJax の有無によらず） */
  const e=E.querySelector('.mx .tx[data-d="1"]'),w=e&&e.closest('.mx');
  let okR=false,okM=true;
  if(e&&typeof txRaw==='function'){
   txRaw(e);
   okR=e.textContent===e.dataset.tex&&/mono/i.test(getComputedStyle(e).fontFamily)&&getComputedStyle(w).overflowX==='auto'&&!e.querySelector('svg');
   if(MJ){txMJ(e);okM=!!e.querySelector('mjx-container svg')}
  }
  chkB(16,'TeX の表示：TeX のソースを等幅で表示（別行立ては横スクロールの行），MathJax のときは組み直すと SVG に戻る',okR&&okM,`TeX 表示 ${okR}，MathJax ${MJ?okM:'無し'}`)
 }
/* 項目 20，21：相互参照（SPEC-16 の 10） */
 {
  const sw=[...$('dsw').children],
   pgX=DV.pg.slice(),
   topX=DV.top.slice(),
   docX=DV.cur,
   tg={},
   sec={},
   RX=/(?<![A-Za-z0-9])(?:REQ|SPEC|TEST)-(?:0[1-9]|[12]\d|3[0-7])(?![0-9])/,
   KD=['REQ','SPEC','TEST'];
  for(const k of[1,2,3,4])for(const t of DOCS[DOCK[k]].toc){const m=/^((?:REQ|SPEC|TEST)-\d\d)：/.exec(t[2]);if(m&&!tg[m[1]])tg[m[1]]={k,id:t[1]}}
  E.querySelectorAll('h3[data-req]').forEach(h=>h.dataset.req.split(',').forEach(r=>(sec[r]=sec[r]||[]).push('§'+h.dataset.sec)));
  const ok=x=>x&&(x[0]==='§'?!!E.querySelector(`h3[data-sec="${x.slice(1)}"]`):!!tg[x]),
   scan=root=>{
    let nl=0,un=0,nn=0;
    root.querySelectorAll('a.xr').forEach(a=>{nn++;if(!ok(a.dataset.x))nl++});
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('h1,h2,h3,h4,code,pre,.tx,.im,.dx,a')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    while(w.nextNode())if(RX.test(w.currentNode.nodeValue))un++;
    return[nn,nl,un]
   };
  let NN=0,NL=0,UN=0;
  const add=r=>{NN+=r[0];NL+=r[1];UN+=r[2]};
  add(scan(E));
  for(const k of[1,2,3,4])for(const c of DOCS[DOCK[k]].chunks){const T=document.createElement('template');T.innerHTML=c;add(scan(T.content))}
  const xs=r=>r?[...r.querySelectorAll('a.xr')].map(a=>a.dataset.x):[];
  let rb=[],big=true,cnt=0;
  for(const kd of KD)for(let i=1;i<=NT;i++){
   const n=pad(i),x=`${kd}-${n}`,t=tg[x];
   if(!t){rb.push(x);continue}
   if(DV.cur!==t.k)tapEl(sw[t.k]);
   docBuild(t.k);
   if(DV.ix[t.k][t.id]!==DV.pg[t.k])docPage(t.k,DV.ix[t.k][t.id]);
   const h=document.getElementById(t.id),
    r=h&&h.nextElementSibling&&h.nextElementSibling.classList.contains('xrow')?h.nextElementSibling:null,
    have=xs(r),
    want=[...KD.filter(q=>q!==kd).map(q=>`${q}-${n}`),...(sec[n]||[])];
   if(!r||!want.every(w=>have.includes(w))||!have.every(ok))rb.push(x);
   if(r&&!(i%7))for(const a of r.querySelectorAll('a.xr')){const b=a.getBoundingClientRect();if(b.height<43.5||b.width<43.5)big=false}
   if(!(++cnt%6))yield
  }
  tapEl(sw[0]);
  yield;
  const sb=[];
  for(const h of E.querySelectorAll('h3[data-req]')){
   const r=h.nextElementSibling&&h.nextElementSibling.classList.contains('xrow')?h.nextElementSibling:null,have=xs(r);
   if(!r||!h.dataset.req.split(',').every(n=>KD.every(q=>have.includes(`${q}-${n}`))))sb.push('§'+h.dataset.sec);else for(const a of r.querySelectorAll('a.xr')){const b=a.getBoundingClientRect();if(b.height<43.5||b.width<43.5)big=false}
  }
  chkB(16,'相互参照のリンク：全リンクの行き先があり，本文の REQ/SPEC/TEST-nn がすべてリンク．REQ・SPEC・TEST の各見出しと式の解説の章に対応の行（同じ番号の残りと式の章．44 px 以上）がある',NN>300&&NL===0&&UN===0&&rb.length===0&&sb.length===0&&big,`リンク ${NN}，行き先なし ${NL}，未リンク ${UN}，行の不足 ${rb.length+sb.length}${rb.length+sb.length?'（'+[...rb,...sb].slice(0,4).join(' ')+'）':''}，44 px ${big}`,'0，0，0');
/* 項目 21 */
  const bk=$('dback'),
   res=[],
   at=(h)=>h?Math.abs(h.getBoundingClientRect().top-S.getBoundingClientRect().top)<=4||S.scrollTop>=S.scrollHeight-S.clientHeight-1:false,
   stt=()=>({k:DV.cur,pg:DV.cur?DV.pg[DV.cur]:0,top:S.scrollTop}),
   hid=()=>!bk||bk.hidden||getComputedStyle(bk).display==='none';
  if(bk){let n=0;while(!hid()&&n++<25){tapEl(bk);yield}}
  const h0=hid();
  const go=function*(a,x){
   const t0=performance.now();
   if(a)tapEl(a);
   void S.offsetHeight;
   const t=x[0]==='§'?E.querySelector(`h3[data-sec="${x.slice(1)}"]`):document.getElementById(tg[x].id),
    dt=performance.now()-t0,
    okk=!!a&&(x[0]==='§'?DV.cur===0:DV.cur===tg[x].k)&&at(t);
   res.push([x,okk,dt]);
   yield 'frame';
   yield 'frame'
  };
  const pgOf=x=>DV.ix[tg[x].k][tg[x].id],seq=[];
  tapEl(sw[3]);
  yield;
  docPage(3,pgOf('REQ-16'));
  S.scrollTop=40;
  yield;
  seq.push(stt());
  yield* go($('dv3').querySelector('.dpg a.xr[data-x="SPEC-16"]'),'SPEC-16');
  tapEl(sw[2]);
  yield;
  docPage(2,pgOf('SPEC-07'));
  const h7=document.getElementById(tg['SPEC-07'].id);
  docTo(h7);
  S.scrollTop=Math.max(0,S.scrollTop-10);
  yield;
  seq.push(stt());
  yield* go(h7&&h7.nextElementSibling&&h7.nextElementSibling.querySelector('a.xr[data-x="§8"]'),'§8');
  seq.push(stt());
  const h8=E.querySelector('h3[data-sec="8"]');
  yield* go(h8&&h8.nextElementSibling&&h8.nextElementSibling.querySelector('a.xr[data-x="TEST-07"]'),'TEST-07');
  const vis=!hid()&&bk.getBoundingClientRect().height>=43.5&&bk.getBoundingClientRect().width>=43.5,rs=[];
  for(let i=seq.length-1;i>=0;i--){
   if(bk)tapEl(bk);
   yield;
   const s=stt(),w=seq[i];
   rs.push(s.k===w.k&&s.pg===w.pg&&Math.abs(s.top-w.top)<=1)
  }
  const h1=hid();
  chkB(16,'相互参照の移動：本文と対応の行のリンクで行き先の見出しが上端（±4 px），[◀ 戻る]（44 px 以上）で逆の順に元の文書・ページ・位置（±1 px）に戻り，空になると隠れる',!!bk&&h0&&res.length===3&&res.every(r=>r[1])&&vis&&rs.length===3&&rs.every(x=>x)&&h1,res.map(r=>`${r[0]} ${r[1]?'○':'×'} ${r[2].toFixed(0)} ms`).join('，')+`／戻る ${rs.map(x=>x?'○':'×').join('')}，表示 ${vis}，空で隠れる ${h1}`);
  chkP(16,'相互参照の移動（3 回の最長）',res.length?Math.max(...res.map(r=>r[2])):NaN,250,'ms',0);
  for(const k of[1,2,3,4])if(DV.built[k])docPage(k,pgX[k]);
  DV.top=topX;
  docShow(docX)
 }
 show(3)
};
TST[17]=function*(){
 if(!RUN.ui){
  let b1=0;
  for(const F of[1,2,5,10,20,50,100,200,500,1000,2000,5000,600,10,120,3000,720]){
   const t=ticks(0,F),k=F/t.d,m=t.d/Math.pow(10,Math.floor(Math.log10(t.d)+1e-9));
   if(k<4-1e-9||k>8+1e-9||![1,2,5].some(v=>Math.abs(m-v)<1e-9))b1++
  }
  chkB(17,'目盛間隔が 1-2-5 系列で区間数 4〜8',b1===0);
  chk(17,'諸元連動の上限 555 → 600',600,niceCeil(555),0);
  chk(17,'諸元連動の上限 9 → 10',10,niceCeil(9),0);
  let a=new AxS(5000,500);
  a.up(4500,0);
  const f0=a.F;
  a.up(6500,2000);
  chkB(17,'段階型：M > F で直ちに拡大（新 F ≥ 1.1M の最小段）',f0===5000&&a.F===10000,`${f0} → ${a.F}`,'5000 → 10000');
  a=new AxS(5000,500);
  for(let t=0;t<=2900;t+=100)a.up(1500,t);
  const f1=a.F;
  a.up(1500,3000);
  chkB(17,'段階型：M < 0.4F が 3 s 続くまで不変，3 s で縮小',f1===5000&&a.F===2000,`${f1} → ${a.F}`,'5000 → 2000');
  a=new AxS(5000,500);
  for(let t=0;t<=60000;t+=100)a.up(5000*(1+.05*Math.sin(t/700)),t);
  chkB(17,'段階型：F 付近 ±5% の振動で変更 1 回以下',a.n<=1,a.n+' 回','≤ 1');
  a=new AxS(20,1);
  a.up(3e7,0);
  const hi=a.F;
  for(let t=2000;t<=6000;t+=100)a.up(0,t);
  chkB(17,'段階型：F_min を下回らず，上限が無い（M = 3e7 で F = 5e7，M = 0 を 4 s で F_min）',hi===5e7&&a.F===1,`${hi}, ${a.F}`,'50000000, 1');
  a.reset();
  chkB(17,'段階型：リセットで既定値',a.F===20&&a.Fn===0);
  a=new AxS(5000,500);
  for(let t=0;t<=20000;t+=100)a.up(1200,t);
  chkB(17,'段階型：M 一定なら変更は高々 1 回',a.n===1&&a.F===2000,a.n+' 回, F='+a.F);
  const B=new AxB(10);
  B.up(795,805,0);
  const k=Math.round((B.b-B.a)/B.s);
  chkB(17,'帯域型：データを含み 区間数 4〜8，刻み ≥ s_min',B.a<=795&&B.b>=805&&k>=4&&k<=8&&B.s>=10,`[${B.a}, ${B.b}] 刻み ${B.s}`);
  B.up(795,905,100);
  chkB(17,'帯域型：範囲外で直ちに再計算',B.b>=905&&B.a<=795,`[${B.a}, ${B.b}]`);
 }
 const s=yield*scen('S3'),ax=mkAX();
 axUpdate(s.c,ax,0);
 show(1);
 yield;
 const W=$('ch').clientWidth||344,Hh=$('ch').clientHeight||400,cv=document.createElement('canvas');
 cv.width=W;
 cv.height=Hh;
 const g=cv.getContext('2d',{willReadFrequently:true}),col={fg:'#000',mu:'#444',ln:'#ccc',ac:'#f00'};
 let bl=[],np=0;
 for(const Hq of[Hh,300,240]){
  cv.height=Hq;
  for(let sub=0;sub<8;sub++)for(const lg of sub?[0]:[0,1]){
   const Ls=drawScreen(g,W,Hq,sub===7?[camSpec(s.c.P,s.c.G,valves({...s.c.P,phin:-10*D},s.c.G),0)]:screenSpec(s.c,ax,sub,{log:lg,ref:lg?null:Base.cp(s.c.last)}),col,null);
   Ls.forEach((L,pi)=>{
    np++;
    const R=L.R,nm=`${Hq===Hh?'':'H'+Hq+':'}${sub+1}-${pi+1}`,yn=R.find(r=>r.t==='yn'),xn=R.find(r=>r.t==='xn');
    if(!yn||!xn||!/\[.+\]/.test(yn.s)||!/\[.+\]/.test(xn.s))bl.push(nm+':軸名');
    if(R.filter(r=>r.t==='yt').length<3||R.filter(r=>r.t==='xt').length<3)bl.push(nm+':目盛');
    if(L.sp.ser.length>1&&R.filter(r=>r.t==='lg').length<2)bl.push(nm+':凡例');
    R.forEach((r,i)=>{
     if(r.x<-.5||r.y<-.5||r.x+r.w>W+.5||r.y+r.h>Hq+.5)bl.push(nm+':外:'+r.s);
     for(let j=i+1;j<R.length;j++){
      const q=R[j],ox=Math.min(r.x+r.w,q.x+q.w)-Math.max(r.x,q.x),oy=Math.min(r.y+r.h,q.y+q.h)-Math.max(r.y,q.y);
      if(ox>.5&&oy>.5)bl.push(nm+':重:'+r.s+'/'+q.s)
     }
    })
   })
  }
 }
 cv.height=Hh;
 chkB(17,`全 ${np/3} グラフ × 3 つの高さ（現在，300，240 px）：軸名（単位付き）・目盛数値・凡例があり，重ならず Canvas 内`,bl.length===0,bl.length?bl.slice(0,3).join(' | '):'違反 0','違反 0');
 g.clearRect(0,0,W,Hh);
 const sp={xa:{a:0,b:600,name:'V [cm³]'},ya:{a:0,b:5000,name:'p [kPa]'},ser:[{X:[100,500,500,100,100],Y:[1000,1000,4000,4000,1000],c:'#ff0000',w:2}]},
  L=layout(g,2,2,W-4,Hh-2,sp),
  tx=v=>L.xt.find(t=>t.v===v).px,
  ty=v=>L.yt.find(t=>t.v===v).px;
 chkB(17,'既知の長方形：頂点位置が目盛位置と ±1 px で一致',Math.abs(L.sx(100)-tx(100))<=1&&Math.abs(L.sx(500)-tx(500))<=1&&Math.abs(L.sy(1000)-ty(1000))<=1&&Math.abs(L.sy(4000)-ty(4000))<=1);
 drawPlot(g,L,sp.ser,col,null);
 const px=(x,y)=>{
  const d=g.getImageData(Math.round(x)-1,Math.round(y)-1,3,3).data;
  let m=0;
  for(let i=0;i<d.length;i+=4)if(d[i]>180&&d[i+1]<90&&d[i+2]<90&&d[i+3]>100)m++;
  return m>0
 };
 chkB(17,'既知の長方形：辺の中点に曲線の画素がある',px(L.sx(300),L.sy(4000))&&px(L.sx(300),L.sy(1000))&&px(L.sx(100),L.sy(2500))&&px(L.sx(500),L.sy(2500))&&!px(L.sx(300),L.sy(2500)));
 if(!RUN.ui){
  const s2=yield*scen('S2'),e=s2.axn[s2.axn.length-1],te=e.t,ch=e.n-s2.axn.find(q=>q.t>=te-5).n;
  chkB(17,'S2 定常：p 軸の F が M の 1〜3.2 倍（データが収まり，小さすぎない）',s2.ax.F>=e.M&&s2.ax.F<=3.2*e.M,`F=${s2.ax.F}, M=${e.M.toFixed(0)} kPa`);
  chkB(17,'S2 定常：直近 5 s で範囲変更 0 回',ch===0,ch+' 回','0 回')
 }
 let tb=[];
 const sp7=[1,2,3,4].flatMap(sb=>screenSpec(s.c,ax,sb,{}).map(q=>({...q,v:sb===2,w:sb===1}))).concat([{...camSpec(s.c.P,s.c.G,null,0),v:true}]);
 sp7.forEach((sp,i)=>{
  const xa=sp.xa,
   ok=sp.w?xa.a===180&&xa.b===540&&JSON.stringify(xa.tv)==='[180,270,360,450,540]':sp.v?xa.a===360&&xa.b===1080&&JSON.stringify(xa.tv)==='[360,540,720,900,1080]':xa.a===0&&xa.b===720&&JSON.stringify(xa.tv)==='[0,180,360,540,720]';
  if(!ok)tb.push(i+':範囲');
  sp.ser.forEach(q=>{for(let k=1;k<q.X.length;k++)if(!(q.X[k]>q.X[k-1])){tb.push(i+':単調');break}})
 });
 const rp=screenSpec(s.c,ax,2,{})[0].ser[0].Y,r0=screenSpec(s.c,ax,1,{})[0].ser[0].Y;
 chkB(17,'クランク角軸：線図②は 180〜540°，線図③とカム線図は 360〜1080°，線図④⑤は 0〜720°，全系列の横座標が単調増加',tb.length===0,tb.length?tb.slice(0,4).join(' '):`${sp7.length} グラフ`);
 chkB(17,'並べ替え：弁の線図で θ = 720° の値 = 元配列の θ = 0 の値，p-θ は並べ替えない',(rp[720]===s.c.tr.Li[0]||(rp[720]!==rp[720]&&s.c.tr.Li[0]!==s.c.tr.Li[0]))&&r0.length===1440&&r0.every((v,i)=>v===Math.fround(s.c.tr.p[i]/1e3)||(v!==v&&s.c.tr.p[i]!==s.c.tr.p[i])),`${rp[720]} / ${s.c.tr.Li[0]}`);
 if(!RUN.ui){
  const a=new AxS(5000,500);
  a.up(6500,0);
  const f1=a.F;
  a.up(12000,500);
  const f2=a.F;
  chkB(17,'段階型：拡大は待たない（切替の 0.5 s 後の拡大も直ちに）',f1===10000&&f2===20000,`${f1} → ${f2}`,'10000 → 20000');
  const A=mkAX();
  A.p.tc=1000;
  const h1=screenSpec(s.c,A,0,{now:1500})[0].ya.hot,h2=screenSpec(s.c,A,0,{now:2500})[0].ya.hot;
  chkB(17,'範囲の切替から 1 s の間だけ目盛の数値を強調する',h1===true&&h2===false,`0.5 s 後 ${h1}，1.5 s 後 ${h2}`,'true，false')
 }
 {
  show(1);
  setSub(1);
  yield 'frame';
  drawCh();
  const cv=$('ch'),
   r=cv.getBoundingClientRect(),
   L=LAY[0],
   tp=(fx)=>{
    const x=r.left+L.pl.x+L.pl.w*fx,y=r.top+L.pl.y+L.pl.h*.5;
    pev(cv,'pointerdown',x,y);
    pev(cv,'pointerup',x,y)
   };
  U.cross[1]=null;
  tp(.25);
  const c1=U.cross[1];
  tp(.6);
  const c2=U.cross[1];
  chkB(17,'グラフのタップでその横位置の読み取り線が出て，もう一度のタップで消える',c1!=null&&Math.abs(c1-.25)<.01&&c2==null,`1 回目 ${c1==null?'なし':c1.toFixed(3)}，2 回目 ${c2==null?'なし':c2.toFixed(3)}`,'0.250，なし');
  setSub(0)
 }
 show(3)
/* 10：p-V 線図の印（SPEC-17 A の 5） */
 if(!RUN.ui){
  {
   const sc=yield*scen('S2'),c=sc.c.clone();
   yield*runCyc(c,2);
   const mk=o=>screenSpec(c,AX,0,o)[0].mk||[],
    nm=m=>m.map(q=>q.t).join(),
    lin=mk({now:0}),
    lg=mk({now:0,log:1}),
    sm=mk({now:0,nt:1}),
    smL=mk({now:0,last:1,nt:1}),
    V=c.tr.V,
    Pp=Float32Array.from(c.tr.p,v=>v/1e3),
    at=q=>{let ok=false;for(let k=0;k<1440;k++)if(V[k]===q.x&&Pp[k]===q.y)ok=true;return ok},
    asc=m=>m.every(q=>/^[\x21-\x7e]+$/.test(q.t)),
    pos=lin.every(at)&&lg.every(at);
   c.P.inj=0;
   yield*runCyc(c,2);
   const pf=mk({now:0,log:1});
   chkB(17,'p-V 線図の印：線形で IVO，IVC，EVO，EVC，両対数でさらに IGN，CA50，SOI，EOI，p_max．位置が曲線の点に一致，記号は ASCII．小さい図は印 4 つで記号なし．ポート噴射では SOI，EOI なし',nm(lin)==='IVO,IVC,EVO,EVC'&&nm(lg)==='IVO,IVC,EVO,EVC,IGN,CA50,SOI,EOI,p_max'&&pos&&asc(lg)&&sm.length===4&&sm.every(q=>!q.t)&&smL.length===4&&smL.every(q=>!q.t)&&nm(pf)==='IVO,IVC,EVO,EVC,IGN,CA50,p_max',`線形 ${nm(lin)}／両対数 ${nm(lg)}／小 ${sm.length} 個／ポート噴射 ${nm(pf)}`)
  }
/* 11：印の記号の配置（SPEC-17 A の 5）．重なりの判定は placeLabels と同じ規則を，結果に対して独立に数える */
  {
   const ov=(P,B,pl)=>{
     let n=0;
     B.forEach((b,i)=>{
      if(!b)return;
      if(b.x<pl.x+1||b.x+b.w>pl.x+pl.w-1||b.y-7<pl.y||b.y+7>pl.y+pl.h)n++;
      for(let j=0;j<i;j++){const c=B[j];if(c&&b.x<c.x+c.w+2&&b.x+b.w+2>c.x&&Math.abs(b.y-c.y)<13)n++}
      for(const q of P)if(q.px>b.x-5&&q.px<b.x+b.w+5&&Math.abs(q.py-b.y)<11)n++
     });
     return n
    },
    mk=(px,py,t,dx,dy)=>({px,py,t,dx,dy,w:6.5*t.length}),
    pl={x:40,y:10,w:280,h:180},
    A=[mk(100,150,'IVO',-8,-9),mk(103,152,'EVC',-8,10),mk(250,60,'IGN',-8,0),mk(254,56,'CA50',-8,0),mk(256,50,'p_max',8,-7)],
    B=[mk(42,12,'IVC',8,-9),mk(318,188,'EVO',8,-9),mk(318,12,'SOI',6,12),mk(42,188,'EOI',8,-9)],
    rA=placeLabels(A,pl),
    rB=placeLabels(B,pl),
    rC=placeLabels([mk(100,100,'',0,0)],pl),
    rD=placeLabels([mk(10,5,'CA50',8,0)],{x:0,y:0,w:20,h:10})[0];
   chkB(17,'印の記号の配置（合成した配置）：6 px 以内に集まった印（5 個）と枠の四隅の印（4 個）で，記号が互いにも印にも枠にも重ならない．記号なしの印は位置を返さない．置けないときは最初の候補を枠の中に収める',rA.every(b=>b.free)&&ov(A,rA,pl)===0&&rB.every(b=>b.free)&&ov(B,rB,pl)===0&&rC[0]===null&&!rD.free&&rD.x===2&&rD.y===7,`集まった印：重なり ${ov(A,rA,pl)}，四隅：重なり ${ov(B,rB,pl)}，置けない場合 (${rD.x}, ${rD.y})`);
/* 弁の時期を設定範囲の端へ動かした機関（アイドル）の，バルブタイミングの画面の p-V 線図 */
   const sc=yield*scen('S2'),g=document.createElement('canvas').getContext('2d'),o=[];
   let bad=0,nl=0;
   for(const[io,ic,eo,ec]of[[-40,190,430,690],[40,290,530,760],[40,190,530,690],[-40,290,430,760]]){
    const c=sc.c.clone();
    Object.assign(c.P,{ivo:io*D,ivc:ic*D,evo:eo*D,evc:ec*D});
    yield*runCyc(c,2);
    for(const[W,H]of[[344,300],[900,500]]){
     const sp=screenSpec(c,AX,7,{now:0})[0],L=layout(g,2,2,W-4,H-2,sp);
     g.font='600 11px system-ui,sans-serif';
     const P=sp.mk.map(m=>({px:L.sx(m.x),py:L.sy(m.y),t:m.t,dx:m.dx,dy:m.dy,w:m.t?g.measureText(m.t).width:0})),
      r=placeLabels(P,L.pl),
      n=ov(P,r,L.pl)+r.filter(b=>b&&!b.free).length;
     bad+=n;
     nl+=r.filter(Boolean).length;
     if(n)o.push(`IVO ${io} IVC ${ic} EVO ${eo} EVC ${ec}（${W}×${H}）：${n}`)
    }
   }
   chkB(17,'印の記号の配置（バルブタイミングの画面）：IVO・IVC・EVO・EVC を設定範囲の端にした 4 通り × 2 つの大きさで，記号が互いにも印にも枠にも重ならない',bad===0&&nl>=8*4,`記号 ${nl} 個，重なり ${bad}${o.length?'：'+o.join('，'):''}`)
  }
 }
 if(!RUN.ui){/* 12：範囲がデータを含む（SPEC-17 B）．20 ステップごと（サイクルの途中）に軸を更新して，線図①〜⑦の全系列が範囲の中にあることを確かめる */
  const outN=(c,A)=>{
    let n=0;
    for(let sub=0;sub<7;sub++)for(const q of screenSpec(c,A,sub,{now:0}))for(const s of q.ser)for(const v of s.Y)if(Number.isFinite(v)&&(v<q.ya.a-(q.ya.a===0?.002*q.ya.b:1e-9*Math.abs(q.ya.a))-1e-12||v>q.ya.b+1e-9*Math.abs(q.ya.b)+1e-12))n++;
    return n
   },
   drive=function*(c,A,T,f){
    let n=0,k=0,bad=0,tm=0;
    const t0=c.s.t;
    while(c.s.t-t0<T){
     c.step();
     if(f)f(c.s.t-t0);
     if(++k%20===0){tm+=5;axUpdate(c,A,tm);bad+=outN(c,A);n++;if(RUN.over())yield}
    }
    return[bad,n]
   };
  const ca=(yield*scen('W3000')).c.clone(),A1=mkAX();
  axUpdate(ca,A1,0);
  const[b1,n1]=yield*drive(ca,A1,.9,tt=>{ca.P.alm=(tt<.3?90:tt<.6?5:90)*D});
  const cb=new Core({...mkPT(),B:.15,S:.15,lr:.3,mode:1,alm:90*D,nt:12000,Tr:500,Pr:2e6}),A2=mkAX();
  cb.start();
  const[b2,n2]=yield*drive(cb,A2,2);
  chkB(17,'範囲がデータを含む：(a) 全開 3000 rpm から開度 90° → 5° → 90°（0.3 s ずつ），(b) B = S = 150 mm，全開，目標 12000 rpm（始動から 2 s）．20 ステップごとに軸を更新して，線図①〜⑦の全系列の有限な値が範囲の中（外に出た点 0）．(b) で N̄ の軸の F > 10000',b1===0&&b2===0&&n1>20&&n2>20&&A2.Nt.F>10000&&fin(ca)&&fin(cb),`(a) 外 ${b1} 点（${n1} 回），(b) 外 ${b2} 点（${n2} 回），N̄ の軸 F ${A2.Nt.F}，ṁ_th の軸 F ${A2.mth.F}，ピストン速度の軸 F ${A2.vp.F}`,'0 点，0 点');
 /* 13：負の値（SPEC-17 B の 3） */
  {
   let a=new AxS(10,1);
   a.up(6.3,0,-.49);
   const r1=`${a.a},${a.b}`,tk=ticks(a.a,a.b).v.join();
   const b=new AxS(10,1);
   b.up(6.3,0,-.01);
   const r2=b.a;
   for(let tm=100;tm<=3000;tm+=100)a.up(6.3,tm,0);
   const r3=a.a;
   a.up(6.3,3100,0);
   const r4=a.a;
   const c=new Core({...mkPT(),mode:1,nt:800,alm:15*D}),A=mkAX();
   c.start();
   yield*runC(c,3);
   axUpdate(c,A,0);
   const q=screenSpec(c,A,3,{now:0})[2],mn=Math.min(...[...q.ser[0].Y].filter(Number.isFinite));
   chkB(17,'負の値：0 起点の軸（F = 10）に M = 6.3，m = −0.49 で範囲 [−2, 10]（目盛 −2, 0, …, 10），m = −0.01 では [0, 10]，m = 0 が 2.9 s では変わらず 3.0 s で [0, 10]．既定のアイドル（動力計制御，開度 15°，800 rpm）のスロットルの質量流量の最小が負で，軸の下限が最小以下',r1==='-2,10'&&tk==='-2,0,2,4,6,8,10'&&r2===0&&r3===-2&&r4===0&&mn<0&&q.ya.a<=mn,`[${r1}]，目盛 ${tk}，${r2}，${r3} → ${r4}，アイドル：最小 ${mn.toFixed(3)} g/s，下限 ${q.ya.a}`)
  }
 }
/* 14：有限でない値（SPEC-17 B の評価）．±∞ で範囲を探すと終わらないので，評価で除き，軸は範囲を変えない */
 {
  const[lo,hi]=amm([1,Infinity,NaN,-Infinity,3],[2]),
   a1=lo===1&&hi===3,
   s=new AxS(10,10),
   z=new AxS(10,10,1),
   b=new AxB(1);
  s.up(5,0,-1);
  b.up(1,2,0);
  const r0=JSON.stringify([s.a,s.b,z.a,z.b,b.a,b.b]);
  s.up(Infinity,1,-Infinity);
  z.up(Infinity,1);
  b.up(0,Infinity,1);
  b.up(-Infinity,2,2);
  b.up(-Infinity,Infinity,3);
  const a2=JSON.stringify([s.a,s.b,z.a,z.b,b.a,b.b])===r0;
  chkB(17,'有限でない値：データの最小・最大の評価が ±∞ と NaN を除く．段階型と帯域型の軸に ±∞ を与えても呼び出しが戻り，範囲が変わらない',a1&&a2,`評価 [${lo}, ${hi}]，軸 ${a2?'変わらない':'変わった'}`)
 }
};
TST[18]=function*(){
 uiDefault();
 let b=0,rv=0,ed=0;
 for(const it of ITEMS){
  const v=defv(it);
  if(it.ch)continue;
  const dv=v/it.f,n=(it.d-it.lo)/it.st;
  if(dv<it.lo-1e-9||(it.hi!=null&&dv>it.hi+1e-9)||Math.abs(n-Math.round(n))>1e-6||Math.abs(it.d*it.f-v)>1e-12*Math.abs(v)+1e-300){b++;window.__dbg=(window.__dbg||'')+it.k+' '}
  for(const m of[1,10]){
   const n0=gi(it,v),up=Math.min(gmax(it),n0+m),v1=gv(it,up),v2=gv(it,Math.max(0,gi(it,v1)-(up-n0)));
   if(Math.abs(v2-v)>1e-12*Math.abs(v))rv++
  }
  if((it.hi!=null&&gv(it,Math.min(gmax(it),gmax(it)+1))/it.f>it.hi+1e-9)||gv(it,0)/it.f<it.lo-1e-9)ed++
 }
 chkB(18,`全 ${ITEMS.length} 項目：既定値が範囲内・格子上・単位換算が整合`,b===0,b+' 件違反 '+(window.__dbg||''),'0 件');
 chk(18,'大気圧の既定表示 [kPa]',101.3,parseFloat(disp(IT.pa,defv(IT.pa))),5e-4);
 chkB(18,'＋1回→−1回で内部値が元に戻る（×1, ×10）',rv===0,rv+' 件違反','0 件');
 chkB(18,'範囲端を超えない',ed===0);
 show(2);
 U.pg=4;
 U.x10=0;
 LP.sauto=0;
 rs();
 yield;
 const s0=LP.spb;
 tapEl($('Pg').querySelector('button[data-k="spb"][data-s="1"]'));
 const im=LP.spb===s0+1&&live.P.spb===s0+1;
 chkB(18,'即時項目（点火時期）は押した時点でソルバ入力が変わる',im,`${s0} → ${LP.spb}`);
 const nt=$('ts').textContent;
 chkB(18,'変更通知「項目：旧値 → 新値」を表示',/点火時期：18 → 19/.test(nt),nt);
 tapEl($('un'));
 chkB(18,'「元に戻す」で直前の変更を取り消す',LP.spb===s0);
 U.pg=0;
 rs();
 yield;
 const e0=LP.eps;
 tapEl($('Pg').querySelector('button[data-k="eps"][data-s="1"]'));
 chkB(18,'要リセット項目（ε）は保留表示になりソルバは不変',LP.eps===e0&&U.pend.eps!==undefined&&!!$('Pg').querySelector('.r.p'));
 tapEl($('ds'));
 chkB(18,'「破棄」で保留が消える',Object.keys(U.pend).length===0);
 tapEl($('Pg').querySelector('button[data-k="eps"][data-s="1"]'));
 live.s.t=1;
 tapEl($('ap'));
 chkB(18,'「適用」で反映されコールドリセット',Math.abs(LP.eps-(e0+.1))<1e-9&&live.s.t===0&&live.G.eps===LP.eps,`ε = ${LP.eps}`);
 U.pend={S:.15,lr:.1};
 rs();
 chkB(18,'λ > 0.5 の組合せでは「適用」が無効',$('ap').disabled&&!lamOK());
 U.pend={};
 rs();
 let be=0;
 for(const e of[1.1,2,10,40,100]){
  const c=new Core({...mkPT(),eps:e});
  c.s.starter=1;
  c.s.y[1]=200;
  while(c.s.cyc<2&&c.s.t<2){c.step();if(RUN.over())yield}
  if(!fin(c)||Math.abs(kin(c.G,PI).V/kin(c.G,0).V/e-1)>1e-12||!(c.s.cyc>=1||c.s.y[0]>PI)||c.s.t<=0){
   be++;
   window.__dbg2=(window.__dbg2||'')+e+':'+fin(c)+':'+c.s.cyc+':'+(kin(c.G,PI).V/kin(c.G,0).V/e-1)+' '
  }
 }
 chkB(18,'ε = 1.1, 2, 10, 40, 100 でモータリング積分でき状態量が有限',be===0,be+' 件失敗 '+(window.__dbg2||''),'0 件');
 let bc=0,nc=0;
 for(let p=0;p<PAGES.length;p++){
  U.pg=p;
  rs();
  if(/(^|[^0-9.])[01]:/.test($('Pg').textContent))bc++;
  nc+=$('Pg').querySelectorAll('.r.c').length
 }
 chkB(18,'選択項目が名前付きボタンで，0:/1: の符号化表記なし',bc===0&&nc===ITEMS.filter(i=>i.ch).length,`選択行 ${nc}`);
 let bp=0;
 for(let p=1;p<PAGES.length;p++){U.pg=p;rs();drawPv();if(getComputedStyle($('pv')).display==='none'||$('pv').clientHeight<120)bp++}
 U.pg=0;
 rs();
 chkB(18,'「機関」以外の全ページに p-V パネル（高さ ≥ 120 px）',bp===0&&getComputedStyle($('pv')).display==='none');
 const s2=yield*scen('S2'),c=s2.c.clone(),Bq=Object.create(Base);
 Bq.ref=null;
 Bq.tl=-1e9;
 Bq.change(c,1e5);
 const r0=Bq.ref,keep=Float32Array.from(r0.p);
 c.P.sauto=0;
 c.P.spb=Math.round(c.s.spa)+10;
 yield*runC(c,5);
 chkB(18,'変更直前のサイクルが基準として保存される',!!r0&&r0.pm===s2.c.last.pm);
 chkB(18,'基準サイクルは変更後 5 s 積分しても不変',r0.p.every((v,i)=>v===keep[i]||(v!==v&&keep[i]!==keep[i])));
 chkB(18,'点火 +10° で p_max が基準と 1% 以上異なる',Math.abs(c.last.pm-r0.pm)/r0.pm>=.01,`${(r0.pm/1e6).toFixed(3)} → ${(c.last.pm/1e6).toFixed(3)} MPa`);
 Bq.change(c,101000);
 Bq.change(c,102000);
 Bq.change(c,103000);
 chkB(18,'1 s 間隔の連続変更では基準を更新しない',Bq.ref===r0);
 Bq.change(c,106500);
 chkB(18,'3 s 以上あけた変更で基準を更新',Bq.ref!==r0);
 const keepL=live.last,keepR=Base.ref;
 live.last=c.last;
 Base.ref=r0;
 pvText();
 const tx=$('pvt').textContent,d=((c.last.imep-r0.imep)/1e3);
 live.last=keepL;
 Base.ref=keepR;
 chkB(18,'差分表示が（現在値 − 基準値）と一致',tx.includes('基準比 '+(d>=0?'+':'')+d.toFixed(0)),tx);
 U.pg=5;
 U.x10=1;
 LP.nt=1000;
 rs();
 yield;
 let dis=0;
 for(let k=0;k<38;k++){const b=$('Pg').querySelector('button[data-k="nt"][data-s="1"]');if(b.disabled)dis++;tapEl(b)}
 U.x10=0;
 chkB(18,'目標回転数に上限なし：[+] は常に有効で 20000 rpm まで上げられる',dis===0&&LP.nt===20000&&$('Pg').textContent.includes('20000'),`${LP.nt} rpm，無効 ${dis} 回`);
 LP.nt=800;
 U.pg=1;
 rs();
 yield;
 drawPv();
 const ch=$('pv').clientHeight;
 Base.clear();
 const cs0=camSpec(LP,live.G,null,0),
  amx=a=>{let m=-1,k=0;for(let i=0;i<a.length;i++)if(a[i]>m){m=a[i];k=i}return TH[k]},
  x0=amx(cs0.ser.find(q=>q.c===CL.b).Y);
 for(let k=0;k<10;k++)tapEl($('Pg').querySelector('button[data-k="phin"][data-s="1"]'));
 yield;
 const cs1=camSpec(LP,live.G,Base.cam,Base.camC),x1=amx(cs1.ser.find(q=>q.c===CL.b).Y),xr=amx(cs1.ser[0].Y);
 chkB(18,'カム線図：「VVT・カム」で表示（高さ ≥ 120 px）',ch>=120&&getComputedStyle($('pv')).display!=='none',ch+' px');
 chk(18,'カム線図：吸気位相 +10° で吸気リフト最大点が 10° 移動',10,x1-x0,.05);
 chkB(18,'カム線図：基準（灰）は変更前の位置に残る',Math.abs(xr-x0)<=.5,`${xr} / ${x0}`);
 pvText();
 const v=valves(LP,live.G),ovl=Math.round((v.e.c-(v.i.o+P4))/D);
 chkB(18,'オーバーラップ角の表示 = EVC − (IVO + 720)',$('pvt').textContent.includes('オーバーラップ '+ovl+'°'),$('pvt').textContent);
 U.pg=2;
 rs();
 yield;
 drawPv();
 chkB(18,'カム線図：「弁タイミング」でも表示',$('pv').clientHeight>=120&&$('pvt').textContent.startsWith('4 弁  IVO'));
 U.pg=0;
 rs();
 U.pg=4;
 LP.sauto=1;
 live.s.spa=27.34;
 rs();
 yield;
 {
  const row=[...$('Pg').querySelectorAll('.r')].find(r=>r.querySelector('b[data-v="spb"]')),
   bs=row.querySelectorAll('button');
  chkB(18,'自動最適化 ON：点火時期の行に自動値を表示し ± は無効',row.textContent.includes('（自動）')&&row.querySelector('b').textContent==='27.3'&&[...bs].every(b=>b.disabled),row.textContent.replace(/\s+/g,' '))
 }
 live.s.fired=1;
 tapEl($('Pg').querySelector('button[data-k="sauto"][data-c="0"]'));
 chkB(18,'自動最適化 OFF：直前の自動値（1° 丸め）を手動値に引き継ぐ',LP.sauto===0&&LP.spb===27&&live.s.spa===27,`spb = ${LP.spb}`);
 U.x10=1;
 rs();
 for(let k=0;k<12;k++)tapEl($('Pg').querySelector('button[data-k="spb"][data-s="-1"]'));
 const lo=LP.spb;
 for(let k=0;k<30;k++)tapEl($('Pg').querySelector('button[data-k="spb"][data-s="1"]'));
 U.x10=0;
 chkB(18,'点火時期に上下限が無い（±が常に有効）',lo===27-120&&LP.spb===lo+300,`${lo}° → ${LP.spb}°`);
 U.pg=0;
 rs();
 {
  const cnt=PAGES.map((_,p)=>ITEMS.filter(i=>i.pg===p).length);
  chkB(18,'1 ページの項目が 1〜6 個',cnt.every(n=>n>=1&&n<=6)&&cnt.reduce((a,b)=>a+b,0)===ITEMS.length,cnt.join(' '),'各 ≤ 6')
 }
 {
  U.pg=PAGES.indexOf('吸気');
  rs();
  yield;
  const its=ITEMS.filter(i=>i.pg===U.pg&&!i.ch);
  for(const it of its)tapEl($('Pg').querySelector(`button[data-k="${it.k}"][data-s="1"]`));
  const moved=its.every(it=>LP[it.k]!==defv(it));
  tapEl($('df'));
  const back=its.every(it=>LP[it.k]===defv(it));
  U.pg=0;
  rs();
  const e0=LP.eps;
  tapEl($('Pg').querySelector('button[data-k="eps"][data-s="1"]'));
  const pe=U.pend.eps;
  tapEl($('df'));
  chkB(18,'[既定値]：表示中のページの全項目が既定値に戻る（要リセット項目は保留値が既定値になり，ソルバは変わらない）',moved&&back&&pe!==undefined&&pe!==e0&&pval('eps')===defv(IT.eps)&&LP.eps===e0&&live.P.eps===e0,`吸気 ${its.length} 項目：変更 ${moved}，復帰 ${back}`);
  U.pend={};
  rs()
 }
 {
  U.pg=4;
  rs();
  tapEl($('pt'));
  const open=$('pl').className==='on',nb=$('pl').querySelectorAll('button').length,tg=PAGES.indexOf('排気系');
  tapEl($('pl').querySelector(`button[data-p="${tg}"]`));
  chkB(18,'ページ名のタップで全ページの一覧が開き，選んだページへ移る',open&&nb===PAGES.length&&U.pg===tg&&$('pl').className===''&&$('pt').textContent.includes('排気系'),`一覧 ${nb} ページ，移動先 ${PAGES[U.pg]}`);
  U.pg=0;
  rs();
  const G=geo(LP),dt=$('drv').textContent;
  chkB(18,'「機関」のページに導出値（λ，V_d，V_c）を表示',dt.includes('λ = r/l = '+G.lam.toFixed(3))&&dt.includes('V_d = '+(G.Vd*1e6).toFixed(1))&&dt.includes('V_c = '+(G.Vc*1e6).toFixed(1)),dt.slice(0,60))
 }
 {
  const l0=live.last,b0=Base.ref;
  U.pg=4;
  rs();
  live.last=null;
  pvText();
  const noc=$('pvt').textContent.includes('START');
  live.last=s2.c.last;
  Base.clear();
  pvText();
  const t1=$('pvt').textContent;
  tapEl($('bs'));
  const r1=Base.ref;
  pvText();
  const t2=$('pvt').textContent;
  Base.clear();
  show(1);
  setSub(0);
  tapEl($('bs2'));
  const r2=Base.ref;
  live.last=l0;
  Base.clear();
  Base.ref=b0;
  show(2);
  chkB(18,'サイクルが無いとき「START してください」，[基準更新] と線図①の [基準を現在に] で現在のサイクルが基準になる',noc&&!t1.includes('基準比')&&!!r1&&r1.pm===s2.c.last.pm&&t2.includes('基準比')&&!!r2&&r2.pm===s2.c.last.pm,t2.slice(0,40))
 }
 {
  show(2);
  U.pg=PAGES.indexOf('運転');
  U.x10=0;
  LP.mode=0;
  live.s.mode=0;
  live.s.al=12.34*D;
  live.s.fc=3.7;
  rs();
  yield 'frame';
  const row=k=>[...$('Pg').querySelectorAll('.r')].find(r=>r.querySelector(`b[data-v="${k}"]`)),
   off=k=>{const r=row(k);return!!r&&[...r.querySelectorAll('button')].every(b=>b.disabled)},
   on=k=>{const r=row(k);return!!r&&[...r.querySelectorAll('button')].some(b=>!b.disabled)},
   val=k=>row(k).querySelector('b').textContent,
   lab=k=>row(k).querySelector('span').textContent,
   fit=k=>{
    const r=row(k),s=r.querySelector('span'),b=r.querySelector('b');
    return s.scrollWidth<=s.clientWidth+1&&b.scrollWidth<=b.clientWidth+1
   },
   r=[];
  const a0=LP.alm;
  r.push(off('alm')&&lab('alm').includes('（自動）')&&val('alm')==='12.3');
  stepItem('alm',1);
  r.push(LP.alm===a0);
  r.push(on('Tl')&&!lab('Tl').includes('（自動')&&!$('tsr'));
  const f0=fit('alm')&&fit('Tl');
  live.s.al=20.06*D;
  liveVals();
  r.push(val('alm')==='20.1');
  tapEl(row('mode')?row('mode').querySelector('button[data-c="1"]'):[...$('Pg').querySelectorAll('button[data-k="mode"]')][1]);
  live.s.mode=1;
  live.s.fc=288.8;
  rs();
  r.push(LP.mode===1&&on('alm')&&off('Tl')&&lab('Tl').includes('負荷トルク（吸収）')&&val('Tl')==='288.8'&&!lab('alm').includes('（自動）'));
  const f1=fit('alm')&&fit('Tl');
  live.s.fc=-4.1;
  liveVals();
  r.push(val('Tl')==='4.1'&&lab('Tl').includes('負荷トルク（駆動）'));
  LP.alm=12.34*D;
  rs();
  const a1=val('alm');
  stepItem('alm',1);
  r.push(a1==='12.3'&&Math.abs(LP.alm/D-12.4)<1e-9&&val('alm')==='12.4');
  chkB(18,'回転数の制御で使わない項目：スロットル制御でスロットル開度（自動・現在の開度）が無効，動力計制御で負荷トルク（吸収／駆動と現在の指令の絶対値．値 288.8 でも文字が欠けない）が無効，表示が毎フレームの更新（liveVals）で追従，文字が欠けない',r.every(x=>x)&&f0&&f1,`${r.map(x=>x?1:0).join('')}，幅 ${f0?1:0}${f1?1:0}`);
/* 17：スロットル開度のスライダ（SPEC-18 B の 8） */
  {
   const q=[],
    tr=$('tsr'),
    kn=$('tsk'),
    B=e=>e.getBoundingClientRect(),
    w=()=>tr.clientWidth-44,
    drag=dx=>{
     const[x,y]=ctr(kn);
     pev(kn,'pointerdown',x,y);
     pev(kn,'pointermove',x+dx/2,y);
     const same=$('tsk')===kn;
     pev(kn,'pointermove',x+dx,y);
     pev(kn,'pointerup',x+dx,y);
     return same
    };
   q.push(!!tr&&B(kn).width>=43.5&&B(kn).height>=43.5);
   setParam('alm',30*D);
   rs();
   const t2=$('tsr'),k2=$('tsk'),w2=t2.clientWidth-44;
   {
    const[x,y]=ctr(k2);
    pev(k2,'pointerdown',x,y);
    pev(k2,'pointermove',x+w2*.2,y);
    const same=$('tsk')===k2,mid=LP.alm/D;
    pev(k2,'pointermove',x+4000,y);
    const hi=LP.alm/D;
    pev(k2,'pointerup',x+4000,y);
    q.push(same&&mid===Math.round(30+.2*90)&&hi===90&&live.P.alm===LP.alm&&val('alm')==='90.0')
   }
   {
    const k3=$('tsk'),[x,y]=ctr(k3);
    pev(k3,'pointerdown',x,y);
    pev(k3,'pointermove',x-4000,y);
    pev(k3,'pointerup',x-4000,y);
    q.push(LP.alm===0)
   }
   {
    const t3=$('tsr'),R3=B(t3),v0=LP.alm;
    tapEl(t3);
    const xt=R3.right-30,yt=R3.top+22;
    pev(t3,'pointerdown',xt,yt);
    pev(t3,'pointermove',xt-60,yt);
    pev(t3,'pointerup',xt-60,yt);
    q.push(LP.alm===v0)
   }
   const sec=$('s2'),ph=$('pv').clientHeight;
   q.push(sec.scrollHeight<=sec.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1&&ph>=120);
   chkB(18,'スロットル開度のスライダ：動力計制御で行の下にある（つまみ 44 px 以上），スロットル制御では無い，ドラッグで位置の値（1° に丸める）・右端 90°・左端 0°，ドラッグの間もつまみは同じ要素，行と機関の値が同じ，トラックのタップでは不変，スクロールなし，パネル ≥ 120 px',q.every(x=>x),`${q.map(x=>x?1:0).join('')}，パネル ${ph} px`)
  }
  uiDefault();
  live.reset()
 }
 U.pg=0;
 rs();
 show(3)
};
const hueOf=(r,g,b)=>{
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
 if(d<8)return NaN;
 let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;
 h*=60;
 return h<0?h+360:h
};
TST[19]=function*(){
 const W=344,Hh=300;
 let b1=0,n1=0;
 for(const cfg of[{},{B:.06,S:.12,lr:.2},{B:.12,S:.06,lr:.1}]){
  const c=new Core({...mkPT(),...cfg});
  for(const dg of[0,90,180,270,360,450,540,630]){
   c.s.y[0]=dg*D;
   const q=scene(c,W,Hh),k=kin(c.G,dg*D);
   n1++;
   if(Math.abs((q.crownY-q.headY)-q.sc*(c.G.hc+k.x))>.5||Math.abs(Math.hypot(q.pin[0]-q.cpin[0],q.pin[1]-q.cpin[1])-q.sc*c.G.l)>.5||Math.abs(Math.hypot(q.cc[0]-q.cpin[0],q.cc[1]-q.cpin[1])-q.sc*c.G.r)>.5||Math.abs((q.vinY-q.headY)-q.sc*lift(c.V.i,dg*D,0))>.5||Math.abs((q.vexY-q.headY)-q.sc*lift(c.V.e,dg*D,0))>.5)b1++
  }
 }
 chkB(19,`実寸比：冠面・連桿長・クランク半径・弁変位（${n1} 状態，±0.5 px）`,b1===0,b1+' 件違反','0 件');
 let b2=0,n2=0,b3=0;
 for(const B of[.04,.15])for(const S of[.04,.15])for(const l of[.06,.3])for(const e of[1.1,100]){
  if(S/2/l>.5)continue;
  const c=new Core({...mkPT(),B,S,lr:l,eps:e});
  for(const th of[0,PI]){
   c.s.y[0]=th;
   const q=scene(c,W,Hh);
   n2++;
   const pts=[[q.ext[0],q.ext[1]],[q.ext[2],q.ext[3]],...q.portIn,...q.portEx,q.pin,q.cpin,[q.cc[0],q.cc[1]+1.7*c.G.r*q.sc]];
   if(!(q.sc>0)||pts.some(p=>!(p[0]>=-.5&&p[0]<=W+.5&&p[1]>=-.5&&p[1]<=Hh+.5)))b2++;
   if(!simplePoly(q.portIn)||!simplePoly(q.portEx))b3++
  }
 }
 chkB(19,`諸元範囲の端点 ${n2} 状態で全要素が Canvas 内`,b2===0,b2+' 件違反','0 件');
 chkB(19,'吸気・排気ポート多角形が自己交差しない',b3===0);
 const cv=document.createElement('canvas');
 cv.width=W;
 cv.height=Hh;
 const g=cv.getContext('2d',{willReadFrequently:true}),
  c=new Core(mkPT()),
  q=drawEngine(g,c,W,Hh,{fg:'#000',mu:'#444',ng:'#f00'}),
  hue=p=>{const d=g.getImageData(Math.round(p[0]),Math.round(p[1]),1,1).data;return hueOf(d[0],d[1],d[2])},
  hi=q.clIn.map(hue),
  he=q.clEx.map(hue);
 chkB(19,'吸気ポート中心線 10 点がすべて青系（色相 190〜250°）',hi.every(h=>h>=190&&h<=250),hi.map(h=>h.toFixed(0)).join(' '));
 chkB(19,'排気ポート中心線 10 点がすべて橙系（色相 10〜45°）',he.every(h=>h>=10&&h<=45),he.map(h=>h.toFixed(0)).join(' '));
 const hs=[300,800,1500,2500].map(gasHue);
 chkB(19,'筒内ガス色の色相が温度に対して単調',hs[0]<hs[1]&&hs[1]<hs[2]&&hs[2]<=hs[3],hs.map(h=>h.toFixed(0)).join(' < '));
 let b6=0;
 for(const cfg of[{},{phin:-20*D,phex:20*D},{eps:14,Lv:.011}]){
  const cc=new Core({...mkPT(),...cfg});
  if(cc.vhit)continue;
  for(let dg=0;dg<720;dg++){cc.s.y[0]=dg*D;const s=scene(cc,W,Hh);if(!(s.vinY<s.crownY&&s.vexY<s.crownY))b6++}
 }
 chkB(19,'VALVE HIT なしの全クランク角で弁傘が冠面より上',b6===0,b6+' 件違反','0 件');
/* 7：図の文字（SPEC-19 の 6） */
 {
  const c=new Core(mkPT());
  c.start();
  for(let i=0;i<400;i++)c.step();
  const L=engText(c,0),mN=metricList(c,0)[0][1],cvs=document.createElement('canvas');
  cvs.width=344;
  cvs.height=300;
  const g=cvs.getContext('2d'),rec=[],ft=g.fillText.bind(g);
  g.fillText=(s,...a)=>{rec.push(s);ft(s,...a)};
  drawEngine(g,c,344,300,COL,0,0);
  const stt=c.s.fired?(c.s.fuel?'RUN':'MOTOR'):c.s.starter?'CRANK':'STOP',
   okL=L.length===2&&L[0]===`${stt}  N̄ ${c.s.Nb.toFixed(0)} rpm`&&(mN==='–'||mN===`${c.s.Nb.toFixed(0)} rpm`)&&['スロットル制御','動力計制御','シャシー'].includes(L[1])&&!L.some(s=>/θ|MPa|mm|B×S|l\/r|ε/.test(s)),
   okD=rec.join('|')===L.join('|'),
   w0=c.s.y[1];
  c.s.y[1]=w0*1.3+1;
  const same=engText(c,0)[0]===L[0];
  c.s.y[1]=w0;
  const m1=engText(c,3.24)[2],m2=engText(c,12.6)[2];
  chkB(19,'図の文字：状態と平均回転数（指標の N̄ と同じ値），制御方式の 2 行だけ．瞬時の値と諸元（θ，MPa，mm，B×S，l/r，ε）が無い．描いた文字がこの行と一致．瞬時の回転数だけを変えても変わらない．速さの倍率 3.24，12.6 で 3 行目が「最速 3.2×」「最速 13×」',okL&&okD&&same&&m1==='最速 3.2×'&&m2==='最速 13×',`${L.join('／')}，描いた文字 ${rec.length} 個，${m1}，${m2}`)
 }
};
TST[20]=function*(){
/* 9：テストが書き換える共有の値の復元（REQ-20 の 8）．中止は genStop（generator の finally を走らせる）と endAll（登録した復元を実行する）で行う．runAll はこの 2 つを，終了・中止・例外のどれでも呼ぶ */
 {
  const fr=K.fr,ze=K.ze,g=(function*(){const a=K.fr,b=K.ze;K.fr=0;K.ze=0;try{yield;yield}finally{K.fr=a;K.ze=b}})();
  g.next();
  const mid=K.fr===0&&K.ze===0;
  genStop(g);
  const r1=K.fr===fr&&K.ze===ze&&g.next().done;
  const n0=UNDO.length,box={v:1};
  box.v=2;
  onEnd(()=>{box.v=1});
  const r2=UNDO.length===n0+1&&(UNDO.pop()(),box.v===1);
  const src=k=>TST[k].toString(),
   ra=runAll.toString(),
   r3=[15,20,26,36].every(k=>src(k).includes('onEnd('))&&[25,27].every(k=>src(k).includes('finally{K.fr=fr;K.ze=ze}'))&&src(36).includes('delete document.hidden')&&/if\(!done\)genStop\(it\);\s*endAll\(\)/.test(ra),
   r4=Math.abs(NOW()-performance.now())<50&&typeof GAS.warm==='function'&&GAS.warm(0)!==undefined&&!Object.prototype.hasOwnProperty.call(document,'hidden');
  chkB(20,'共有の値の復元：管の摩擦と入口損失の係数を書き換えて止まっている generator を中止の手順で止めると元の値に戻る．登録した復元が実行される．共有の値を書き換えるテスト（15，20，25，26，27，36）が復元を登録していて，全テストの実行は終了・中止・例外のどれでも復元を行う．この時点で時計，表の作成，ページの非表示の値が元のまま',mid&&r1&&r2&&r3&&r4,`${mid?1:0}${r1?1:0}${r2?1:0}${r3?1:0}${r4?1:0}`)
 }
/* 20：結果のテキストとコピー（REQ-20 の 7） */
 {
  const e=envInfo(),
   t=resText(e),
   ids=Object.keys(ST).filter(k=>ST[k]==='ok'||ST[k]==='ng'),
   L=t.split('\n'),
   np=Object.keys(TR).reduce((s,k)=>s+TR[k].filter(r=>r.perf).length,0),
   ip=L.indexOf('性能の記録（実測｜上限）：'),
   okT=/^[0-9a-f]{8}$/.test(BUILD)&&L.includes('ビルド：'+BUILD)&&L.includes('環境：'+navigator.userAgent)&&t.includes('表示領域 '+innerWidth+'×'+innerHeight)&&t.includes('画素の比 ')&&/\n日時：\d{4}-\d\d-\d\dT/.test(t)&&/\n要約：PASS \d+\/\d+/.test(t)&&L.filter(l=>/^\d\d (PASS|FAIL) \d+ \d+\.\d　/.test(l)).length===ids.length&&L.some(l=>l.startsWith('FAIL と上限超え：'))&&ip>0&&L.length-ip-1===np&&TNAME.length===NT+1&&TNAME.slice(1).every(n=>typeof n==='string'&&n.length>0)&&!t.includes('undefined');
  chkB(20,'結果のテキスト：ビルドの ID（16 進 8 桁），日時，環境（ユーザーエージェント，画面，表示領域，画素の比），要約，実行したテストごとの合否・検査の数・所要，FAIL と上限超え，性能の記録の全件を含む．全テストが名前を持つ',okT,`${L.length} 行，${t.length} 字，ビルド ${BUILD}，性能の記録 ${np} 件`);
  show(3);
  const b=$('rcp'),
   q=b.getBoundingClientRect(),
   r={x:q.left,w:q.width,h:q.height},
   dt0=$('dt').innerHTML,
   cl=Object.getOwnPropertyDescriptor(navigator,'clipboard'),
   ex=document.execCommand;
  let got=null;
  onEnd(()=>{
   if(cl)Object.defineProperty(navigator,'clipboard',cl);else delete navigator.clipboard;
   document.execCommand=ex
  });
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>{got=x}},configurable:true});
  const m1=yield copyRes(),l1=b.textContent;
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('x')}},configurable:true});
  document.execCommand=()=>false;
  const m2=yield copyRes(),
   ta=$('dt').querySelector('textarea'),
   okF=!!ta&&ta.readOnly&&ta.value===resText(e)&&getComputedStyle(ta).userSelect!=='none';
  if(cl)Object.defineProperty(navigator,'clipboard',cl);else delete navigator.clipboard;
  document.execCommand=ex;
  copyRes.done();
  $('dt').innerHTML=dt0;
  chkB(20,'[結果をコピー]：ボタンが 44 px 以上で画面の中にある．クリップボードに書けるときは結果のテキストを書き，ボタンが「コピーしました」になる．書けないときは，同じテキストを詳細カードの中の選択できる枠に表示する',r.w>=44&&r.h>=44&&r.x>=0&&r.x+r.w<=innerWidth+.5&&m1==='ok'&&got===t&&l1==='コピーしました'&&m2==='show'&&okF,`ボタン ${r.w.toFixed(0)}×${r.h.toFixed(0)} px，書ける ${m1}／${l1}，書けない ${m2}／枠 ${okF}`)
 }
 if(RUN.ui)return;
 const a=yield*scen('S1'),b=yield*scen('S2'),j1=a.json,j2=b.json;
 delete SC.S1;
 delete SC.S2;
 const a2=yield*scen('S1'),b2=yield*scen('S2');
 chkB(20,'決定性：S1・S2 の再実行で全状態量が完全一致',a2.json===j1&&b2.json===j2)
};

/* ---- TEST-21 sound ---- */
const syn=(o,n)=>{
 const s=new Synth(48000,{vol:.6,L:1,d:.04,cv:0,fl:0,c:cEx(),...o}),y=new Float32Array(n);
 s.process(y);
 return{s,y}
};
const crest=(a,i0,i1)=>{let p=0;for(let i=i0;i<i1;i++)p=Math.max(p,Math.abs(a[i]));return p/rmsA(a,i0,i1)};
const lpMag=(b,f)=>{const w=2*PI*f/48000;return(1-b)/Math.hypot(1-b*Math.cos(w),b*Math.sin(w))};
const rmsA=(a,i0,i1)=>{let q=0;for(let i=i0;i<i1;i++)q+=a[i]*a[i];return Math.sqrt(q/(i1-i0))};
function dftAbs(y,i0,n,f,fs){
 let re=0,im=0;
 const w=2*PI*f/fs;
 for(let k=0;k<n;k++){const v=y[i0+k];re+=v*Math.cos(w*k);im-=v*Math.sin(w*k)}
 return Math.hypot(re,im)
}
TST[21]=function*(){
 const c=cEx(),s4=yield*scen('S4'),T4=mkTable(s4.c.last.me),imp=new Float32Array(1440);
 if(!RUN.ui){
  chk(21,'排気中の音速 c = √(γ_b(800 K) R·800) [m/s]',Math.sqrt(gmB(800,0)*R*800),c,1e-12);
  chk(21,'第1共鳴 f₁(L=1 m) = c/4 [Hz]',c/4,pipeF(1,1),1e-12);
  let w=0;
  for(const N of[800,1500,3000]){
   const{s}=syn({tab:new Float32Array(1440),Nt:N},48000);
   w=Math.max(w,Math.abs((s.wraps*1440+s.ph)/(1440*N/120)-1))
  }
  chkB(21,'位相の進み = 1440 N̄/120 per s（800/1500/3000 rpm）',w<1e-9,w.toExponential(2),'< 1e-9');
  yield;
  let pb=[];
  for(const[N,P]of[[800,7200],[1500,3840],[3000,1920]]){
   const{y}=syn({tab:T4,Nt:N},153600),i0=96000,i1=153600-Math.floor(1.02*P);
   let a=0,b=0;
   for(let k=i0;k<i1;k++){a+=(y[k+P]-y[k])**2;b+=(y[k+Math.floor(1.02*P)]-y[k])**2}
   const R0=rmsA(y,i0,i1),e1=Math.sqrt(a/(i1-i0))/R0,e2=Math.sqrt(b/(i1-i0))/R0;
   if(!(e1<1e-3&&e2>=.05))pb.push(`${N}rpm: ${e1.toExponential(1)}/${e2.toFixed(3)}`);
   yield
  }
  chkB(21,'出力の周期 = 120/N̄（整数周期 3 条件，1.02P では不一致）',pb.length===0,pb.length?pb.join(' | '):'3 / 3','3 / 3');
  imp[720]=1;
  let rb=[];
  for(const L of[1,.5])for(let n=1;n<=3;n++){/* 周期的なパルス（約 600 rpm．パルスの幅 0.14 ms）で，f_n がちょうど爆発の周波数の倍音になる回転数にし，定常の応答の約 5 周期を DFT する */
   const f0=pipeF(L,n),
    ff=f0/Math.round(f0/5),
    Nt=120*ff,
    Pn=48000/ff,
    i0=72000,
    nw=Math.round(5*Pn),
    {y}=syn({tab:imp,Nt,L,vol:1e-4},i0+nw+10),
    A=f=>dftAbs(y,i0,nw,f,48000);
   let bf=0,bm=-1;
   for(let k=Math.ceil(f0*.9/ff);k*ff<=f0*1.1;k++){const m=A(k*ff);if(m>bm){bm=m;bf=k*ff}}
   const ft=n*c/(2*L),
    tr=A(Math.round(ft/ff)*ff),
    pk=A(f0),
    Fl=loopFit(L,.04,c,48000),
    gg=Fl.g*lpMag(Fl.b,f0),
    gt=Fl.g*lpMag(Fl.b,ft),
    th=(1+gt)/(1-gg);
   if(Math.abs(bf/f0-1)>.02||pk<.75*th*tr)rb.push(`L=${L},n=${n}: 極大 ${bf.toFixed(1)}/${f0.toFixed(1)} Hz，比 ${(pk/tr).toFixed(2)}（理論 ${th.toFixed(2)}）`);
   yield
  }
  chkB(21,'共鳴の極大位置が (2n−1)c/4L と 2% 以内，極大/極小 ≥ 理論値 (1+|H|)/(1−|H|) の 75%（L=1, 0.5 m, n=1〜3）．反射率の設定が無い',rb.length===0&&!ITEMS.some(i=>i.k==='rex'),rb.length?rb.join(' | '):'6 / 6','6 / 6');
/* 27：遅延が最も長い組合せ（L = 3 m，384 kHz）．往復の遅れは約 4140 サンプルで，48 kHz のときの遅延線の長さ 4096 を超える */
  {
   const FS=384000,L=3,f0=pipeF(L,1),ff=f0/Math.round(f0/5),Pn=FS/ff,i0=Math.round(1.5*FS),nw=Math.round(5*Pn),n=i0+nw+10;
   const s=new Synth(FS,{vol:1e-4,L,d:.04,cv:0,fl:0,c,tab:imp,Nt:120*ff}),y=new Float32Array(n);
   for(let i=0;i<n;i+=96000){s.process(y.subarray(i,Math.min(n,i+96000)));yield}
   const A=f=>dftAbs(y,i0,nw,f,FS);
   let bf=0,bm=-1,mx=0,fin=true;
   for(let k=Math.ceil(f0*.9/ff);k*ff<=f0*1.1;k++){const m=A(k*ff);if(m>bm){bm=m;bf=k*ff}}
   for(let i=0;i<n;i++){const v=y[i];if(!(v===v))fin=false;else if(Math.abs(v)>mx)mx=Math.abs(v)}
   chkB(21,'遅延が最も長い組合せ（L = 3 m，384 kHz）：出力が有限で |y| ≤ 1，第 1 共鳴が c/4L と 2% 以内．遅延線が往復の遅れより長い',fin&&mx<=1&&mx>0&&Math.abs(bf/f0-1)<=.02&&s.buf.length>2*L/c*FS+2,`極大 ${bf.toFixed(2)}／${f0.toFixed(2)} Hz，最大 ${mx.toExponential(2)}，遅延線 ${s.buf.length}（遅れ ${(2*L/c*FS).toFixed(0)} サンプル）`)
  }
/* 29〜31：排気温度と音速（REQ-21 の 10．SPEC-21 B の 1） */
  {
   const SC=typeof sndC==='function'?sndC:null,
    q0=new Core({...mkPT()}),
    cT=T=>{const o=mkGB();q0.xgas(T,o);return Math.sqrt((1+o.R/o.eT)*o.R*T)},
    TT=[700,1000,1200],
    CC=TT.map(cT);
   {
    const fb=[];
    for(const ct of CC){
     const f0=ct/4,
      ff=f0/Math.round(f0/5),
      Pn=48000/ff,
      i0=120000,
      nw=Math.round(5*Pn),
      n=i0+nw+10,
      s=new Synth(48000,{vol:1e-4,L:1,d:.04,cv:0,fl:0,c,tab:imp,Nt:120*ff}),
      y=new Float32Array(n);
     s.set({ct});
     for(let i=0;i<n;i+=48000){s.process(y.subarray(i,Math.min(n,i+48000)));yield}
     let bf=0,bm=-1;
     for(let k=Math.ceil(f0*.9/ff);k*ff<=f0*1.1;k++){const m=dftAbs(y,i0,nw,k*ff,48000);if(m>bm){bm=m;bf=k*ff}}
     fb.push([bf,f0])
    }
    const ok=fb.every(([b,f])=>Math.abs(b/f-1)<=.02),
     rt=fb.every(([b],i)=>Math.abs(b/fb[0][0]/(CC[i]/CC[0])-1)<=.02);
    chkB(21,'排気温度と音速：音速の目標値を T̄_X = 700，1000，1200 K の √(γ_X R_X T̄_X) にすると，第 1 共鳴が c*/4L と 2% 以内で，周波数の比が音速の比と 2% 以内',ok&&rt,fb.map(([b,f],i)=>`${TT[i]} K：${b.toFixed(1)}／${f.toFixed(1)} Hz`).join('，'))
   }
   {
    const r=[];
    for(const sc of[s4,yield*scen('W3000')]){
     const e=sc.c,v=SC&&SC(e),T=e.lastM.Tx,o=mkGB();
     e.xgas(T,o);
     r.push({v,T,w:Math.sqrt((1+o.R/o.eT)*o.R*T)})
    }
    let m=null,lv=null,me=null;
    const p0=SND.post,y0=SND.cyc,sv=live;
    SND.post=x=>{m=x};
    SND.cyc=-1;
    live=s4.c.clone();/* 運転中の機関の代わり（サイクルの完了時に送る値を見る） */
    try{sndTick();lv=SC&&SC(live);me=live.last.me}finally{SND.post=p0;SND.cyc=y0;live=sv}
    const wire=!!(m&&lv&&m.ct===lv.c&&m.M===exMach(me,LP.pa,LP.dex,lv.c,lv.T,lv.R)),
     ok=r.every(o=>o.v&&Math.abs(o.v.c/o.w-1)<=1e-12)&&r[1].v&&r[0].v&&r[1].v.c>r[0].v.c;
    chkB(21,'送る音速の目標値：化学平衡・排気系 ON の部分負荷（S4）と全開（3000 rpm）で，直前のサイクルの T_X から求めた √(γ_X R_X T_X) と相対 1e-12 で同じで，全開の方が大きい．サイクルの完了時に送る値と出口の Mach 数が同じ目標値を使う',ok&&wire,r.map(o=>`T_X ${o.T.toFixed(0)} K：${o.v?o.v.c.toFixed(2):'–'}／${o.w.toFixed(2)} m/s`).join('，')+(wire?'，送る値 一致':`，送る値 不一致（${m?m.ct:'送らない'}／${lv?lv.c:'–'}，M ${m?m.M:'–'}）`))
   }
   {
    const n0=48000,
     n1=24000,
     mk=o=>new Synth(48000,{vol:.6,L:1,d:.04,cv:0,fl:0,c:CC[0],tab:T4,Nt:3000,...o}),
     dmax=(y,i0,i1)=>{let d=0;for(let i=i0+1;i<i1;i++)d=Math.max(d,Math.abs(y[i]-y[i-1]));return d},
     run=f=>{
      const s=mk({}),y=new Float32Array(n0+n1);
      s.process(y.subarray(0,n0));
      f(s);
      s.process(y.subarray(n0));
      return{s,y}
     };
    const A=run(s=>s.set({ct:CC[2]})),
     F0=run(()=>{}),
     F1=(()=>{const s=mk({c:CC[2]}),y=new Float32Array(n0+n1);s.process(y);return{s,y}})(),
     S=run(s=>s.set({c:CC[2]}));
    yield;
    const B=mk({});
    B.process(new Float32Array(n0));
    B.set({ct:CC[2]});
    B.process(new Float32Array(48000));
    const da=dmax(A.y,n0,n0+n1),
     dr=Math.max(dmax(F0.y,n0,n0+n1),dmax(F1.y,n0,n0+n1)),
     ds=dmax(S.y,n0,n0+n1),
     cv=Math.abs(B.c/CC[2]-1);
    chkB(21,'音速が変わる間の跳び：700 K の音速の定常から 1200 K の目標値に替えて 0.5 s，隣り合う標本の差の最大が，音速を固めたときの大きい方の 1.1 倍以下．替えた後 1 s で合成器の音速が目標値と相対 1e-4 以内',da<=1.1*dr&&cv<=1e-4,`${(da/dr).toFixed(3)} 倍（階段状に替えたとき ${(ds/dr).toFixed(3)} 倍），1 s 後の差 ${cv.toExponential(1)}`)
   }
   {
    const c0=cEx(),g=new Core({...mkPT(),gam:0}),x=new Core({...mkPT(),exs:0});
    const vg=SC&&SC(g),vx=SC&&SC(x),okS=!!(vg&&vx&&vg.c===c0&&vx.c===c0&&vg.T===AU.Tex&&vx.T===AU.Tex);
    let okA=true;
    for(const fm of[0,1]){
     const o={tab:T4,Nt:24000,vol:.6,L:1,d:.04,cv:1,seed:3,c,fm,ld:1,fl:.2},
      a=new Synth(48000,o),
      b=new Synth(48000,o),
      ya=new Float32Array(240),
      yb=new Float32Array(240);
     for(let k=0;k<4800;k++){
      b.set({ct:c0});
      a.process(ya);
      b.process(yb);
      for(let i=0;i<240;i++)if(ya[i]!==yb[i])okA=false;
      if((k&511)===0)yield
     }
    }
    chkB(21,'γ(T) と排気系 OFF：送る音速の目標値が 800 K の値と浮動小数点数として同じ．サイクルごとにその目標値を送っても，計算の音と演出の音の出力が 4800 サイクルの全標本で，送らないときと完全に一致',okS&&okA,`γ(T) ${vg?vg.c:'–'}，排気系 OFF ${vx?vx.c:'–'}／${c0} m/s，出力 ${okA?'一致':'不一致'}`)
   }
  }
/* 28：検査のための記録は求めたときだけ（計算の音と演出の音） */
  {
   const out=[];
   let ok=true;
   for(const fm of[0,1]){
    const o={tab:T4,Nt:24000,vol:.6,L:1,d:.04,cv:1,seed:3,c,fm,ld:1,fl:.2},
     a=new Synth(48000,o),
     b=new Synth(48000,{...o,rec:1}),
     pa=a.periods,
     aa=a.amps,
     ya=new Float32Array(24000),
     yb=new Float32Array(24000);
    let same=true,nb=0;
    for(let k=0;k<46;k++){
     a.process(ya);
     b.process(yb);
     for(let i=0;i<24000;i++)if(ya[i]!==yb[i]){same=false;break}
     nb=Math.max(nb,b.periods.length);
     if(RUN.over())yield
    }
    const q=a.wraps>=4200&&a.periods===pa&&a.amps===aa&&pa.length===0&&aa.length===0&&same&&nb>0&&b.periods.length<=4096;
    if(!q)ok=false;
    out.push(`${fm?'演出':'計算'}：${a.wraps} サイクル，記録 ${pa.length}／${aa.length}（求めた側は最大 ${nb}），出力 ${same?'一致':'不一致'}`)
   }
   const w=new Synth(48000,sndOpt());
   w.set({Nt:3000,vol:.5,tab:T4});
   chkB(21,'検査のための記録は求めたときだけ：記録を求めない合成器は，計算の音と演出の音のどちらでも 4200 サイクル回して記録の配列が空のまま（同じ配列），記録を求めた合成器と出力が全サンプルで一致．音を鳴らす経路の合成器は記録を求めない',ok&&!w.rec&&!('rec'in sndOpt()),out.join('；'))
  }
  const s3=yield*scen('S3'),me=s3.c.last.me,T3=mkTable(me);
  let mx=0,mean=0,fin3=1;
  for(const v of T3){if(!isFinite(v))fin3=0;mx=Math.max(mx,Math.abs(v));mean+=v}
  mean/=1440;
  let m0=0;
  for(let i=0;i<1440;i++){const a=me[(i+1439)%1440],b=me[(i+1)%1440];m0+=((b===b?b:0)-(a===a?a:0))*1e-3/(2*P4/1440)}
  m0/=1440;
  const d1=((me[1201]||0)-(me[1199]||0))*1e-3/(2*P4/1440)-m0;
  chkB(21,'表：1440 点すべて有限，平均 ≈ 0',fin3&&Math.abs(mean)<=1e-6*mx,`|平均|/最大 = ${(Math.abs(mean)/mx).toExponential(1)}`);
  chkB(21,'表の点 i=1200（θ=600°，排気行程）が中心差分の定義と一致',Math.abs(d1-T3[1200])<=1e-6*mx&&Math.abs(d1)>1e-3*mx,`${T3[1200].toExponential(4)} / ${d1.toExponential(4)}`,'差 ≤ 1e-6·最大');
  {
   const o={tab:T4,Nt:1500},
    A=new Synth(48000,{vol:.6,L:1,d:.04,cv:0,c,...o}),
    B=new Synth(48000,{vol:.6,L:1,d:.04,cv:0,c,...o}),
    one=new Float32Array(1),
    ya=[],
    yb=[];
   for(let k=0;k<1000;k++){A.process(one);ya.push(one[0]);B.process(one);yb.push(one[0])}
   B.set({tab:T3});
   let wA=-1,w0=A.wraps;
   for(let k=0;k<8000;k++){A.process(one);ya.push(one[0]);if(wA<0&&A.wraps>w0)wA=A.cnt-1;B.process(one);yb.push(one[0])}
   let same=1;
   for(let k=0;k<B.swapAt;k++)if(ya[k]!==yb[k])same=0;
   chkB(21,'表の切替は位相が1周した瞬間（それまでの出力は不変）',B.swapAt===wA&&same&&ya[B.swapAt+50]!==yb[B.swapAt+50],`切替 ${B.swapAt} / 周回 ${wA}`)
  }
  yield;
  {
   const z=syn({tab:T4,Nt:0},24000).y;
   chkB(21,'N̄ = 0 から開始すると出力は厳密に 0',z.every(v=>v===0));
   const s=new Synth(48000,{tab:T4,Nt:800,vol:.6,L:1,d:.04,cv:0,c}),y=new Float32Array(9600);
   s.process(y);
   s.set({Nt:0});
   const y2=new Float32Array(72000);
   s.process(y2);
   const tail=Math.max(...Array.from(y2.slice(71000),Math.abs));
   chkB(21,'800 rpm → 0 で 1.5 s 後 |y| < 1e-6',tail<1e-6,tail.toExponential(2))
  }
  yield;
  {
   const s5=yield*scen('S5'),y=syn({tab:mkTable(s5.c.last.me),Nt:6000,vol:1},24000).y;
   chkB(21,'全開の表・6000 rpm・音量 100% で |y| ≤ 1，NaN なし',y.every(v=>v===v&&Math.abs(v)<=1),'最大 '+Math.max(...Array.from(y,Math.abs)).toFixed(3));
   chkB(21,'音量 0 で出力は厳密に 0',syn({tab:T4,Nt:1500,vol:0},12000).y.every(v=>v===0));
   const a=syn({tab:T4,Nt:1500,vol:.01},24000).y,b=syn({tab:T4,Nt:1500,vol:.02},24000).y;
   chk(21,'小振幅域で出力 ∝ 音量（1% と 2% の RMS 比）',2,rmsA(b,14400,24000)/rmsA(a,14400,24000),.01);
   const s2=yield*scen('S2'),
    q=[[s2,'S2'],[s4,'S4'],[s5,'S5']].map(([sc])=>{
     const me=sc.c.last.me,yy=syn({tab:mkTable(me),Nt:sc.c.s.Nb,M:exMach(me,sc.c.P.pa,.04,c)},48000).y;
     return rmsA(yy,14400,48000)
    });
   chkB(21,'音量の順序 RMS（各機関の出口の Mach 数を与える）：S2 < S4，S2 < S5',q[0]<q[1]&&q[0]<q[2],q.map(v=>v.toFixed(4)).join('，'))
  }
  yield;
 }
 {
  const b0=U.busy,on0=SND.on,sp0=Sim.spd;
  U.busy=0;
  SND.on=1;
  Sim.spd=.1;
  const f1=sndFeed().Nt;
  Sim.spd=1;
  const f2=sndFeed().Nt;
  SND.on=0;
  const f3=sndFeed().Nt;
  SND.on=1;
  U.busy=1;
  const f4=sndFeed().Nt;
  U.busy=b0;
  Sim.spd=sp0;
  chkB(21,'送信値 = 運転中の N̄（0.1× と 1× で同値）',f1===live.s.Nb&&f2===f1,`${f1.toFixed(2)} / ${f2.toFixed(2)} rpm`);
  chkB(21,'音 OFF・テスト実行中は 0 を送る',f3===0&&f4===0);
  show(0);
  SND.on=0;
  sndLbl();
  const b=$('snd'),L0=b.textContent,c0=b.className;
  tapEl(b);
  const L1=b.textContent,c1=b.className,o1=SND.on;
  tapEl(b);
  const L2=b.textContent,c2=b.className,o2=SND.on;
  SND.on=on0;
  sndLbl();
  chkB(21,'[音] ボタンで ON/OFF が切り替わり，ON のときだけ選ばれた色（文字は「音」のまま）．ページを開いた直後は OFF',SND0===0&&L0==='音'&&L1==='音'&&L2==='音'&&c0===''&&c1==='on'&&c2===''&&o1===1&&o2===0,`既定 ${SND0}，${L0}（${c0||'–'}）→ ${L1}（${c1||'–'}）→ ${L2}（${c2||'–'}）`);
  show(3)
 }
 if(!RUN.ui){/* A: compressor */
  {
   const cp=new Comp(48000),A=2,y=[];
   for(let k=0;k<48000;k++)y.push(cp.proc(A*Math.sin(2*PI*100*k/48000)));
   const pk=Math.max(...y.slice(24000).map(Math.abs));
   chk(21,'圧縮器の静特性：振幅 2 の正弦 → ピーク 0.35^(3/4)·2^(1/4)',Math.pow(.35,.75)*Math.pow(2,.25),pk,.01);
   const c2=new Comp(48000);
   let lin=1;
   for(let k=0;k<4800;k++){const x=.2*Math.sin(2*PI*100*k/48000);if(c2.proc(x)!==x)lin=0}
   chkB(21,'しきい値以下（振幅 0.2）では利得が厳密に 1',lin);
   const c3=new Comp(48000);
   let ov=0;
   const cap=Math.pow(.35,.75)*Math.pow(2,.25);
   for(let k=0;k<4800;k++)c3.proc(.1);
   for(let k=0;k<4800;k++)ov=Math.max(ov,Math.abs(c3.proc(2)));
   chkB(21,'立ち上がり即応：0.1 → 2 の段差で出力が上限を超えない',ov<=cap*(1+1e-12),ov.toFixed(6)+' ≤ '+cap.toFixed(6));
   const e0=c3.e;
   for(let k=0;k<Math.round(.2*48000);k++)c3.proc(0);
   const eh=c3.e;
   for(let k=0;k<Math.round(.3*48000);k++)c3.proc(0);
   chkB(21,'包絡は 0.2 s 保持（アイドルの爆発間隔 150 ms より長い）',Math.abs(eh-e0)<1e-3*e0,eh.toFixed(4)+' / '+e0.toFixed(4));
   chk(21,'保持後の戻り時定数 0.3 s：包絡が 1/e に減衰',e0/Math.E,c3.e,.01)
  }
  yield;
  {
   const w3=yield*scen('W3000'),
    Tw=mkTable(w3.c.last.me),
    Nw=w3.c.s.Nb,
    y=syn({tab:Tw,Nt:Nw},144000).y,
    sat=y.slice(24000).filter(v=>Math.abs(v)>.8).length/120000;
   chkB(21,`3000 rpm 全開（${Nw.toFixed(0)} rpm）・音量 60%：|y| > 0.8（制限段の非線形域）のサンプル < 0.1%`,sat<.001,(sat*100).toFixed(3)+' %','< 0.1 %');
   const s0=new Synth(48000,{tab:Tw,Nt:Nw,vol:1e-3,L:1,d:.04,cv:0,c});
   s0.comp.gain=()=>1;
   const y0=new Float32Array(144000);
   s0.process(y0);
   const k1=crest(y,96000,144000),k0=crest(y0,96000,144000);
   chkB(21,'圧縮・制限段が定常（2〜3 s）で波高率を 5% 超えて下げない（3000 rpm 全開）',k1>=.95*k0,`${k1.toFixed(2)} / 圧縮前 ${k0.toFixed(2)}`,'≥ 0.95 倍')
  }
  yield;
/* B: physical loop loss */
  {
   let mono=1;
   for(let f=50;f<5000;f*=1.2)if(!(loopMag(f*1.2,1,.04,c)<loopMag(f,1,.04,c)))mono=0;
   const Fl=loopFit(1,.04,c,48000),f1=c/4,hm=f=>Fl.g*lpMag(Fl.b,f);
   chkB(21,'管内損失の近似：|h| = exp(−2α_w L − (π f d/c)²/2) が f₁ = c/4L と 1 kHz で一致（相対 1e-9）',Math.abs(hm(1000)/loopMag(1000,1,.04,c)-1)<=1e-9&&Math.abs(hm(f1)/loopMag(f1,1,.04,c)-1)<=1e-9,`b ${Fl.b.toFixed(4)}，g ${Fl.g.toFixed(4)}，|h(f₁)| ${hm(f1).toFixed(4)}`);
   chkB(21,'管内損失 |H(f)| が周波数とともに単調減少，|H(0)| = 1',mono&&loopMag(0,1,.04,c)===1);
   const dec=[];
   for(const M of[0,.05]){
    const y=syn({tab:imp,Nt:60,vol:1e-4,M},48000+16000).y;
    let k0=48000;
    for(let k=47800;k<50000;k++)if(Math.abs(y[k])>Math.abs(y[k0]))k0=k;
    const r=rmsA(y,k0+14400,k0+15360)/rmsA(y,k0+4800,k0+5760),th=(hm(f1)*(1-M)/(1+M))**(.2/(2/c));
    dec.push([M,r,th])
   }
   chkB(21,'残響の減衰：0.10〜0.12 s と 0.30〜0.32 s の RMS の比 = g₁^(0.2/(2L/c))，g₁ = |h(f₁)|(1 − M)/(1 + M)（±25 %，M = 0，0.05）',dec.every(([,r,t])=>Math.abs(r/t-1)<=.25),dec.map(([M,r,t])=>`M ${M}：${r.toExponential(2)}（理論 ${t.toExponential(2)}）`).join('，'))
  }
  yield;
/* C: cycle-to-cycle variation */
  {
   const run=function*(cv,seed){
     const s=new Synth(48000,{tab:T4,Nt:1500,vol:.6,L:1,d:.04,cv,seed,c,rec:1}),y=new Float32Array(480000);
     for(let i=0;i<480000;i+=24000){s.process(y.subarray(i,i+24000));yield}
     return{s,y}
    },
    on=yield*run(1,1),
    off=yield*run(0,1);
   const av=q=>q.reduce((s,v)=>s+v,0)/q.length,
    P=on.s.periods,
    dp=P.slice(2).map((v,i)=>v-P[i+1]),
    mp=av(dp),
    sp=Math.sqrt(av(dp.map(v=>(v-mp)**2)))/mp,
    am=on.s.amps.slice(1),
    ma=av(am),
    sa=Math.sqrt(av(am.map(v=>(v-ma)**2)));
   chkB(21,`サイクル周期の変動係数 ≈ 0.5%（${dp.length} サイクル，±25%）`,Math.abs(sp/.005-1)<=.25,(sp*100).toFixed(3)+' %');
   chkB(21,'サイクル振幅の変動係数 ≈ 3%（±25%）',Math.abs(sa/.03-1)<=.25,(sa*100).toFixed(2)+' %');
   chk(21,'平均周期 = 120/N̄（0.2%）',3840,mp,.002);
   const Po=off.s.periods,dq=Po.slice(2).map((v,i)=>v-Po[i+1]);
   chkB(21,'サイクル変動 OFF では周期が一定（±1 サンプル）',dq.every(v=>Math.abs(v-3840)<=1));
   const a=(yield*run(1,1)).y,b=(yield*run(1,2)).y;
   chkB(21,'同じ種で完全に同じ出力，種が違えば異なる（決定性）',a.every((v,i)=>v===on.y[i])&&b.some((v,i)=>v!==on.y[i]));
   yield;
   const f0=1500/120,
    n=92160,
    i0=48000,
    hw=Float64Array.from({length:n},(_,k)=>.5-.5*Math.cos(2*PI*k/n)),
    pw=function*(y,f){
     let re=0,im=0;
     const om=2*PI*f/48000;
     for(let k=0;k<n;k++){const v=y[i0+k]*hw[k];re+=v*Math.cos(om*k);im-=v*Math.sin(om*k)}
     return re*re+im*im
    },
    hb=function*(y){
     let h=0,q=0;
     for(let k=1;f0*k<3000;k++){h+=yield*pw(y,f0*k);q+=yield*pw(y,f0*(k+.5));if(k%8===0)yield}
     return 10*Math.log10(h/q)
    },
    hOff=yield*hb(off.y),
    hOn=yield*hb(on.y);
   chkB(21,'倍音/倍音間比（Hann 窓・24 周期）：変動 OFF ≥ 100 dB（厳密周期），ON ≤ 40 dB（純音らしさの解消）',hOff>=100&&hOn<=40,`OFF ${hOff.toFixed(1)} dB / ON ${hOn.toFixed(1)} dB`)
  }
  yield;
/* (c) flow noise */
  {
   const E4=mkEnv(s4.c.last.me),
    base={tab:T4,env:E4,Nt:1500,vol:.01},
    rn=(o,n=96000)=>{
     const s=new Synth(48000,{L:1,d:.04,cv:0,c,...base,...o});
     s.comp.gain=()=>1;
     const y=new Float32Array(n);
     s.process(y);
     return y
    };
   const a=rn({fl:0}),a2=rn({fl:0,env:new Float32Array(1440).fill(.05)});
   chkB(21,'流れ雑音 0% では出力が雑音なしと完全一致',a.every((v,i)=>v===a2[i]));
   yield;
   const z=rn({fl:.5,env:new Float32Array(1440)});
   chkB(21,'排気流量 0 の区間では雑音が出ない（包絡 0 → 出力は雑音なしと一致）',z.every((v,i)=>v===a[i]));
   yield;
   const n1=rn({fl:.2}).map((v,i)=>v-a[i]),n2=rn({fl:.4}).map((v,i)=>v-a[i]);
   chk(21,'雑音の振幅 ∝ 設定値（20% と 40% で RMS 比 2）',2,rmsA(n2,24000,96000)/rmsA(n1,24000,96000),.02);
   yield;
   const nb=rn({fl:1,tab:new Float32Array(1440),env:new Float32Array(1440).fill(.05)},48000);
   let eb=0,et=0,el=0,eh=0;
   for(let f=100;f<20000;f+=100){
    const p=dftAbs(nb,24000,4096,f,48000)**2;
    et+=p;
    if(f>=1000&&f<=6000)eb+=p;
    if(f<=500)el+=p;
    if(f>=12000)eh+=p
   }
   chkB(21,'雑音の帯域：1〜6 kHz に 70% 以上，0.5 kHz 以下と 12 kHz 以上は各 10% 以下',eb/et>=.7&&el/et<=.1&&eh/et<=.1,`帯域内 ${(100*eb/et).toFixed(1)}%，低域 ${(100*el/et).toFixed(1)}%，高域 ${(100*eh/et).toFixed(1)}%`);
   yield;
   const d1=rn({fl:.4,seed:5}),d2=rn({fl:.4,seed:5});
   chkB(21,'雑音は決定的（同じ種で完全一致）',d1.every((v,i)=>v===d2[i]));
   const w3=yield*scen('W3000'),
    o3={tab:mkTable(w3.c.last.me),env:mkEnv(w3.c.last.me),Nt:w3.c.s.Nb},
    p0=rn({...o3,fl:0}),
    p4=rn({...o3,fl:.4}),
    rr=rmsA(p4.map((v,i)=>v-p0[i]),24000,96000)/rmsA(p0,24000,96000);
   chkB(21,'3000 rpm 全開・既定 40%：雑音 RMS / 排気脈動 RMS が 0.1〜0.6',rr>=.1&&rr<=.6,rr.toFixed(3))
  }
  yield;
/* D: 演出音（REQ-21 D） */
  {
   const E4=mkEnv(s4.c.last.me),
    fv=(o,n=144000)=>syn({tab:T4,env:E4,fm:1,ld:.5,...o},n),
    pspec=(y,i0,nn)=>{
     const re=new Float64Array(nn),im=new Float64Array(nn);
     for(let i=0;i<nn;i++)re[i]=y[i0+i]*(.5-.5*Math.cos(2*PI*i/nn));
     for(let i=1,j=0;i<nn;i++){let b=nn>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){const t=re[i];re[i]=re[j];re[j]=t}}
     for(let L=2;L<=nn;L<<=1){
      const a=-2*PI/L,wr=Math.cos(a),wi=Math.sin(a);
      for(let i=0;i<nn;i+=L){
       let cr=1,ci=0;
       for(let k=0;k<L/2;k++){
        const ur=re[i+k],ui=im[i+k],vr=re[i+k+L/2]*cr-im[i+k+L/2]*ci,vi=re[i+k+L/2]*ci+im[i+k+L/2]*cr;
        re[i+k]=ur+vr;
        im[i+k]=ui+vi;
        re[i+k+L/2]=ur-vr;
        im[i+k+L/2]=ui-vi;
        const t=cr*wr-ci*wi;
        ci=cr*wi+ci*wr;
        cr=t
       }
      }
     }
     const P=new Float64Array(nn/2);
     for(let i=0;i<nn/2;i++)P[i]=re[i]*re[i]+im[i]*im[i];
     return P
    },
    bandP=(P,nn,f0,f1)=>{let e=0;for(let i=Math.ceil(f0*nn/48000);i<f1*nn/48000;i++)e+=P[i];return e};
   const k0=syn({tab:T4,env:E4,Nt:1500,fl:.4},48000).y,k1=syn({tab:T4,env:E4,Nt:1500,fl:.4,fm:0,ld:.7},48000).y;
   chkB(21,'演出：既定（計算）の出力は音の種類・負荷を与えない場合と完全一致',k0.every((v,i)=>v===k1[i]));
   {
    const q=new Synth(48000,{vol:.6,L:1,d:.04,cv:0,fl:.4,c,tab:T4,env:E4,Nt:1500,fm:1,ld:.5}),y=new Float32Array(24000);
    q.process(y);
    q.set({fm:0});
    const y2=new Float32Array(24000);
    q.process(y2);
    q.set({fm:1});
    const y3=new Float32Array(24000);
    q.process(y3);
    chkB(21,'演出：演出 → 計算 → 演出 と切り替えても NaN なし，|y| ≤ 1',[y,y2,y3].every(a=>a.every(v=>v===v&&Math.abs(v)<=1))&&rmsA(y2,12000,24000)>1e-3&&rmsA(y3,12000,24000)>1e-3)
   }
   yield;
   const cor=(y,P)=>{
     let a=0,b=0,d=0;
     for(let k=96000;k<144000-P;k++){a+=y[k]*y[k+P];b+=y[k]*y[k];d+=y[k+P]*y[k+P]}
     return a/Math.sqrt(b*d)
    },
    yF=fv({Nt:1500}).y;
   yield;
   const yK=syn({tab:T4,env:E4,Nt:1500},144000).y;
   yield;
   const cF=cor(yF,960),cK=cor(yK,960);
   chkB(21,'演出：4 気筒化（1500 rpm，P/4 ずらしの相関 ≥ 0.8，計算は < 0.5）',cF>=.8&&cK<.5,`演出 ${cF.toFixed(3)} / 計算 ${cK.toFixed(3)}`,'≥ 0.8 / < 0.5');
   yield;
   const y1=fv({Nt:2000,ld:1},96000).y;
   yield;
   const y0=fv({Nt:2000,ld:0},96000).y,
    r10=rmsA(y1,48000,96000)/rmsA(y0,48000,96000),
    hi=y=>{const P=pspec(y,48000,16384);return bandP(P,16384,1000,8000)/bandP(P,16384,20,8000)},
    h1=hi(y1),
    h0=hi(y0);
   chkB(21,'演出：負荷で大きく明るくなる（2000 rpm，ℓ = 1 と 0 の RMS 比 ≥ 2，1 kHz 以上の割合が増える）',r10>=2&&h1>h0,`RMS 比 ${r10.toFixed(2)}，1 kHz 以上 ${(100*h0).toFixed(1)}% → ${(100*h1).toFixed(1)}%`);
   yield;
   const s2=yield*scen('S2');
   yield;
   const yI=syn({tab:mkTable(s2.c.last.me),env:mkEnv(s2.c.last.me),Nt:s2.c.s.Nb,fm:1,ld:0},96000).y,
    PI_=pspec(yI,48000,32768),
    lo=bandP(PI_,32768,20,160)/bandP(PI_,32768,20,8000);
   chkB(21,'演出：アイドルで 160 Hz 未満のエネルギーが 60% 以上',lo>=.6,(100*lo).toFixed(1)+' %','≥ 60 %');
   yield;
   const pA=fv({Nt:4000,ld:0},96000).s.F.pops;
   yield;
   const pB=fv({Nt:4000,ld:1},96000).s.F.pops;
   yield;
   const pC=fv({Nt:1500,ld:0},96000).s.F.pops;
   chkB(21,'演出：破裂音は 4000 rpm・ℓ = 0 でだけ起きる（ℓ = 1，1500 rpm では 0 回）',pA>0&&pB===0&&pC===0,`${pA} / ${pB} / ${pC} 回`,'> 0 / 0 / 0');
   yield;
   chkB(21,'演出：N̄ = 0 から開始すると出力は厳密に 0',fv({Nt:0},24000).y.every(v=>v===0));
   yield;
   {
    const q=new Synth(48000,{vol:.6,L:1,d:.04,cv:0,fl:0,c,tab:T4,env:E4,Nt:800,fm:1,ld:0}),y=new Float32Array(9600);
    q.process(y);
    q.set({Nt:0});
    const y2=new Float32Array(48000);
    q.process(y2);
    const tail=Math.max(...Array.from(y2.slice(47000),Math.abs));
    chkB(21,'演出：800 rpm → 0 で 1 s 後 |y| < 1e-6',tail<1e-6,tail.toExponential(2))
   }
   {
    const s5=yield*scen('S5'),y=fv({tab:mkTable(s5.c.last.me),env:mkEnv(s5.c.last.me),Nt:6000,vol:1,ld:1},48000).y;
    chkB(21,'演出：全開の表・6000 rpm・音量 100%・ℓ = 1 で |y| ≤ 1，NaN なし',y.every(v=>v===v&&Math.abs(v)<=1),'最大 '+Math.max(...Array.from(y,Math.abs)).toFixed(3));
    chkB(21,'演出：音量 0 で出力は厳密に 0',fv({Nt:1500,vol:0},12000).y.every(v=>v===0));
    const a=fv({Nt:3000,cv:1,seed:9},24000).y,b=fv({Nt:3000,cv:1,seed:9},24000).y;
    chkB(21,'演出：同じ種で完全に同じ出力',a.every((v,i)=>v===b[i]))
   }
   yield;
   {
    const t0=performance.now();
    fv({Nt:6000,ld:1,cv:1},48000);
    const dt=(performance.now()-t0)/1e3;
    chkB(21,'演出：1 s 分の合成が 0.5 s 未満',dt<.5,dt.toFixed(3)+' s','< 0.5 s')
   }
   yield;
  }
 }
 {
  const it=ITEMS.find(q=>q.k==='sm'),b0=U.busy,on0=SND.on;
  U.busy=0;
  SND.on=1;
  const m=sndFeed();
  U.busy=b0;
  SND.on=on0;
  chkB(21,'演出：設定「音と振動」に「音の種類 計算／演出」（既定 計算），送信値に種類と ℓ',!!it&&PAGES[it.pg]==='音と振動'&&it.ch.join()==='計算,演出'&&it.d===0&&m.fm===LP.sm&&m.ld===sndLoad(live.s.y[6],LP.pa)&&m.ld>=0&&m.ld<=1,`fm=${m.fm} ℓ=${m.ld.toFixed(3)}`);
  chkB(21,'演出：ℓ の定義（p_in/p_atm = 0.3, 0.6, 0.9, 1 → 0, 0.5, 1, 1）',[[.3,0],[.6,.5],[.9,1],[1,1]].every(([r,v])=>Math.abs(sndLoad(r*1e5,1e5)-v)<1e-12))
 }
 const o={tab:T4,env:mkEnv(s4.c.last.me),fl:.4,Nt:1500,vol:.6,L:1,d:.04,cv:1,seed:777,c},
  res=
yield (async()=>{
   const fs=48000,n=fs/2;
   try{
    const ctx=new OfflineAudioContext(1,n,fs);
    const how=await addWorklet(ctx);
    const nd=new AudioWorkletNode(ctx,'eng',{numberOfInputs:0,outputChannelCount:[1],processorOptions:o});
    nd.connect(ctx.destination);
    const b=await ctx.startRendering();
    return{path:'AudioWorklet（'+how+' URL）',y:b.getChannelData(0)}
   }catch(e){
    let ok=0;
    try{
     const c2=new (window.AudioContext||window.webkitAudioContext)();
     ok=typeof c2.createScriptProcessor==='function'&&!!c2.createScriptProcessor(1024,0,1);
     c2.close()
    }catch(e2){}
    return{path:'ScriptProcessor',ok,err:String(e)}
   }
  })();
 if(res.path.startsWith('AudioWorklet')){
  const ref=syn(o,res.y.length).y;
  let d=0;
  for(let i=0;i<ref.length;i++)d=Math.max(d,Math.abs(ref[i]-res.y[i]));
  chkB(21,'音声経路 '+res.path+'：出力が純粋合成と一致',d<=1e-5&&rmsA(res.y,0,res.y.length)>1e-3,'最大差 '+d.toExponential(2),'≤ 1e-5')
 }else chkB(21,'音声経路：AudioWorklet 不可 → ScriptProcessor 代替を構築',res.ok,res.err.slice(0,60));
 if(res.path.startsWith('AudioWorklet')){
  const o2={...o,fm:1,ld:.6},
   r2=yield (async()=>{
    try{
     const ctx=new OfflineAudioContext(1,24000,48000);
     await addWorklet(ctx);
     const nd=new AudioWorkletNode(ctx,'eng',{numberOfInputs:0,outputChannelCount:[1],processorOptions:o2});
     nd.connect(ctx.destination);
     return{y:(await ctx.startRendering()).getChannelData(0)}
    }catch(e){return{err:String(e)}}
   })();
  if(r2.y){
   const ref=syn(o2,r2.y.length).y;
   let d=0;
   for(let i=0;i<ref.length;i++)d=Math.max(d,Math.abs(ref[i]-r2.y[i]));
   chkB(21,'演出：AudioWorklet の出力が純粋合成と一致',d<=1e-5&&rmsA(r2.y,0,r2.y.length)>1e-3,'最大差 '+d.toExponential(2),'≤ 1e-5')
  }else chkB(21,'演出：AudioWorklet の出力が純粋合成と一致',0,r2.err.slice(0,60))
 }
 if(!RUN.ui){
  const f=yield*scen('F3500'),tb=mkTable(f.c.last.me);
  let q=0;
  for(const v of tb)q+=v*v;
  q=Math.sqrt(q/tb.length)*PI*3500/30;
  window.__qref=q;
  chk(21,'演出：音量の基準 q_ref = 全開・3500 rpm の単気筒の音源の実効値（2%）',q,FLV.ref,.02)
 }
};
/* ---- TEST-22 control status ---- */
TST[22]=function*(){
 uiDefault();
 show(0);
 yield;
 const s=live.s,P=LP,txt=()=>{ctlRender();return $('ctl').textContent},has=(x,arr)=>arr.every(w=>x.includes(w));
 s.fired=0;
 s.starter=0;
 let x=txt();
 chkB(22,'停止：「停止中」',x.includes('停止中'),x);
 s.starter=1;
 s.fuel=1;
 s.Nb=312.4;
 s.al=P.alc;
 x=txt();
 chkB(22,'始動中：目標（完爆 550 rpm）・制御量 N̄・固定 スロットル開度・点火時期',has(x,['始動中','目標','完爆 N̄ > 550','制御量','N̄ 312','固定','スロットル開度 α 6.0°','点火時期','BTDC']),x);
 s.starter=0;
 s.fired=1;
 P.mode=0;
 s.mode=0;
 s.Nb=812.4;
 s.y[1]=812.4*PI/30;
 s.al=3.21*D;
 s.fc=2.5;
 P.sauto=1;
 s.spa=31.27;
 x=txt();
 chkB(22,'モードA：目標・制御量 N̄・操作量 α・固定 動力計・自動 点火',has(x,['スロットル制御','目標 800','制御量','N̄ 812','操作量','スロットル開度 α 3.2°','固定','動力計 吸収 2.5 N·m（0.2 kW）','自動','点火時期 31.3° BTDC'])&&!x.includes('飽和'),x);
 s.al=P.amax;
 x=txt();
 chkB(22,'スロットル制御：α = α_max で「全開」',x.includes('全開')&&!x.includes('飽和'),x);
 s.al=0;
 x=txt();
 chkB(22,'スロットル制御：α = 0 で「全閉」',x.includes('全閉')&&!x.includes('飽和'),x);
 s.al=almin(P);
 x=txt();
 chkB(22,'スロットル制御：α = α_min で「下限」',almin(P)>0&&x.includes('下限')&&!x.includes('全閉'),x);
 s.al=almin(P)+.1*D;
 x=txt();
 chkB(22,'スロットル制御：α > α_min では「下限」を出さない',!x.includes('下限')&&!x.includes('全閉')&&!x.includes('全開'),x);
 P.mode=1;
 s.mode=1;
 s.fc=12.34;
 P.alm=15*D;
 P.sauto=0;
 s.spa=P.spb;
 x=txt();
 chkB(22,'動力計制御：目標・制御量・操作量 動力計（吸収）・固定 α・固定 点火',has(x,['動力計制御','目標 800','制御量','操作量','動力計 吸収 12.3 N·m（1.0 kW）','固定','スロットル開度 α 15.0°','固定 点火時期 18.0° BTDC'])&&!x.includes('飽和')&&!x.includes('自動')&&!x.includes('上限'),x);
 s.fc=-4.1;
 x=txt();
 chkB(22,'動力計制御：駆動のとき「駆動 4.1 N·m」と kW',x.includes('動力計 駆動 4.1 N·m（0.3 kW）')&&!x.includes('上限'),x);
 {
  const f0=s.fuel;
  s.fuel=1;
  const xa=txt(),ba=$('b2').textContent;
  s.fuel=0;
  const xb=txt(),bb=$('b2').textContent;
  s.fuel=f0;
  chkB(22,'モータリング：動力計制御で燃料を止めると 1 行目が「モータリング」，[FUEL CUT] のボタンが [STOP] になる（燃料があるときは「動力計制御」と [FUEL CUT]）',xa.includes('動力計制御')&&ba==='FUEL CUT'&&xb.includes('モータリング')&&!xb.includes('動力計制御')&&bb==='STOP',`${ba} → ${bb}`)
 }
 const Tm=dynMax(P,s.y[1]);
 s.fc=Tm;
 x=txt();
 chkB(22,'用語：スロットル開度 α，動力計，点火時期，BTDC（充水率の語が無い）',has(x,['スロットル開度 α','動力計','点火時期','BTDC'])&&!x.includes('充水率'),x);
 chkB(22,'動力計制御：T_c = T_max（吸収）で「上限」',x.includes('吸収')&&x.includes('上限')&&!x.includes('飽和'),x);
 s.fc=-Tm;
 x=txt();
 chkB(22,'動力計制御：T_c = −T_max（駆動）で「上限」',x.includes('駆動')&&x.includes('上限')&&!x.includes('飽和'),x);
 s.Nb=12345.6;
 P.nt=20000;
 P.Tr=300;
 P.Pr=200e3;
 s.y[1]=1000;
 s.fc=dynMax(P,s.y[1]);
 P.alm=90*D;
 s.spa=-20;
 x=txt();
 const rows=[...$('ctl').children],ov=rows.filter(r=>r.scrollWidth>r.clientWidth+1).length;
 chkB(22,'最長の表示内容でも 4 行が折り返さない（はみ出し無し）',ov===0&&rows.length===4&&rows.every(r=>r.getBoundingClientRect().height<=20),ov+' 行はみ出し');
 {
  const mj0=U.mj;
  U.mj={};
  let n=0,bad=[];
  const ok=(d,jp)=>{
   const b=d.querySelector('b');
   if(jp!==b.classList.contains('jp'))return false;
   if(jp&&!/[\u3040-\u30ff\u4e00-\u9fff]/.test(b.textContent))return false;
   return[d,b,d.querySelector('span')].every(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)
  };
  const seen={};
  for(const pg of[0,1]){
   U.mpg=pg;
   met();
   for(let i=0;i<$('M').children.length;i++){
    let d=$('M').children[i];
    const k=d.dataset.k;
    if(seen[k])continue;
    seen[k]=1;
    n++;
    if(!ok(d,false))bad.push(k+':記号');
    tapEl(d);
    d=$('M').children[i];
    const others=[...$('M').children].filter((x,j)=>j!==i).every(x=>!x.querySelector('b.jp'));
    if(!ok(d,true)||!others)bad.push(k+':日本語');
    tapEl(d);
    d=$('M').children[i];
    if(!ok(d,false))bad.push(k+':戻り');
    tapEl($('M').children[i]);
    tapEl($('M').children[i]);
    if(!ok($('M').children[i],false))bad.push(k+':再')
   }
  }
  U.mpg=0;
  met();
  {
   U.mj={};
   met();
   const d0=$('M').children[1],k=d0.dataset.k,[x,y]=ctr(d0);
   pev(d0,'pointerdown',x,y);
   met();
   const same=$('M').children[1]===d0;
   pev(d0,'pointerup',x,y);
   met();
   const jp=!!U.mj[k];
   U.mj={};
   met();
   chkB(22,'実機のタップの再現：押下と離しの間に再描画があっても切り替わり，要素は作り直されない',jp&&same,`切替 ${jp}，同一要素 ${same}`)
  }
  U.mj=mj0;
  met();
  chkB(22,`メトリクス ${n} 項目：既定は記号，その項目のタップで日本語名，再タップで記号（何度でも），他の項目は変わらない，切れない`,n===24&&bad.length===0,bad.join(' ')||'0 件','0 件')
 }
 const sec=$('s0');
 chkB(22,'運転タブがスクロールしない',sec.scrollHeight<=sec.clientHeight+1&&document.body.scrollHeight<=innerHeight+1);
 show(3)
};
/* ---- TEST-23 target-rpm slider ---- */
TST[23]=function*(){
 uiDefault();
 show(0);
 yield 'frame';
 drawEng();
 const ew=$('ew'),bd=$('ntb'),k=$('ntk'),r=$('ntr'),bm=$('ntm'),bp=$('ntp'),cv=$('eng'),sec=$('s0');
 const R=e=>e.getBoundingClientRect(),
  sz=e=>{const q=R(e);return q.width>=44-.5&&q.height>=44-.5},
  at=(x,y)=>document.elementFromPoint(x,y)||r;
 const re=R(ew),rb=R(bd),rc=R(cv);
 chkB(23,'帯・つまみ・[−]・[＋] があり，3 部品とも 44×44 px 以上',!!(bd&&k&&bm&&bp)&&sz(k)&&sz(bm)&&sz(bp),[k,bm,bp].map(e=>R(e).width.toFixed(0)+'×'+R(e).height.toFixed(0)).join('，'));
 chkB(23,'帯が Canvas の下端に収まる（高さ 48 px）',Math.abs(rb.bottom-rc.bottom)<=1&&rb.top>=rc.top&&Math.abs(rb.height-NTB)<=1&&rb.left>=re.left-1&&rb.right<=re.right+1,`帯 ${rb.top.toFixed(0)}〜${rb.bottom.toFixed(0)}，Canvas ${rc.top.toFixed(0)}〜${rc.bottom.toFixed(0)}`);
 chkB(23,'Canvas の高さ ≥ 140 px，運転タブがスクロールしない',cv.clientHeight>=140&&sec.scrollHeight<=sec.clientHeight+1&&document.body.scrollHeight<=innerHeight+1,cv.clientHeight+' px');
 chkB(23,'DOM に input[type="range"] が無い',!document.querySelector('input[type="range"]'));
 const w=()=>R(r).width-44,
  uOf=()=>(R(k).left-R(r).left)/w(),
  drag=(dx,mid)=>{
   const[x,y]=ctr(k);
   pev(at(x,y),'pointerdown',x,y);
   pev(k,'pointermove',x+dx/2,y);
   mid&&mid();
   pev(k,'pointermove',x+dx,y);
   pev(k,'pointerup',x+dx,y)
  };
 ntRender();
 const u0=uOf(),
  dx=.4*w(),
  nv=u=>u<=.7?500+Math.round(u/.7*7500/50)*50:8000+Math.round((u-.7)/.3*32000/500)*500,
  ex=nv(Math.min(1,u0+dx/w()));
 let mid=NaN;
 drag(dx,()=>{mid=LP.nt});
 chkB(23,`つまみを右へ ${dx.toFixed(0)} px：N_target = つまみ位置の値`,LP.nt===ex&&live.P.nt===ex&&$('ntv').textContent.includes(String(ex)),`${LP.nt}（solver ${live.P.nt}）`,`${ex} rpm`);
 chkB(23,'ドラッグ中に値が即時反映される',mid>800&&mid<ex,mid+' rpm');
 yield 'frame';
 ntRender();
 chkB(23,'離した後，つまみ位置が値に一致（±1 px）',Math.abs(uOf()-ntU(LP.nt))*w()<=1,(uOf()*w()).toFixed(1)+' px',(ntU(LP.nt)*w()).toFixed(1)+' px');
 drag(-3*w());
 const lo=LP.nt;
 ntRender();
 drag(3*w());
 const hi=LP.nt;
 chkB(23,'左端・右端までドラッグ：500，40000 rpm．位置 0.85 で 24000 rpm',lo===500&&hi===40000&&ntVal(.85)===24000&&Math.abs(ntU(24000)-.85)<1e-12&&ntVal(.7)===8000,`${lo}，${hi}，${ntVal(.85)}`,'500，40000，24000');
 setParam('nt',800);
 ntRender();
 yield 'frame';
 const rr=R(r),[kx,ky]=ctr(k),tx=rr.right-30,t0=at(tx,ky);
 pev(t0,'pointerdown',tx,ky);
 pev(t0,'pointerup',tx,ky);
 chkB(23,'トラックのつまみ以外をタップ：値は変わらない',LP.nt===800&&!k.contains(t0),`${LP.nt} rpm（押下対象 ${t0.tagName}）`,'800 rpm');
 pev(t0,'pointerdown',tx,ky);
 pev(t0,'pointermove',kx,ky);
 pev(k,'pointermove',kx+80,ky);
 pev(t0,'pointerup',kx+80,ky);
 pev(k,'pointerup',kx+80,ky);
 chkB(23,'つまみ以外から始めたドラッグ：値は変わらない',LP.nt===800,LP.nt+' rpm','800 rpm');
 tapEl(bp);
 const a1=LP.nt;
 tapEl(bm);
 const a2=LP.nt;
 chkB(23,'[＋]・[−] で ±50 rpm',a1===850&&a2===800&&live.P.nt===800,`${a1}，${a2}`,'850，800');
 setParam('nt',40000);
 tapEl(bp);
 tapEl(bp);
 ntRender();
 yield 'frame';
 ntRender();
 const rk=R(k),rt=R(r);
 chkB(23,'40000 rpm から [＋]×2：40100 rpm，つまみは右端，ラベル 40100',LP.nt===40100&&Math.abs(rk.right-rt.right)<=1&&$('ntv').textContent.includes('40100')&&$('ntv').scrollWidth<=$('ntv').clientWidth+1,`${LP.nt} rpm，右端差 ${(rt.right-rk.right).toFixed(1)} px，「${$('ntv').textContent}」`);
 setParam('nt',500);
 ntRender();
 tapEl(bm);
 chkB(23,'500 rpm で [−] は無効（値も変わらない）',bm.disabled&&LP.nt===500,`disabled=${bm.disabled}，${LP.nt} rpm`);
 const W=cv.clientWidth;
 let b=0,n=0;
 for(const Hh of[cv.clientHeight-NTB,cv.clientHeight-2*NTB])for(const B of[.04,.15])for(const S of[.04,.15])for(const l of[.06,.3])for(const e of[1.1,100]){
  if(S/2/l>.5)continue;
  const c=new Core({...mkPT(),B,S,lr:l,eps:e});
  for(const th of[0,PI]){
   c.s.y[0]=th;
   const q=scene(c,W,Hh);
   n++;
   const pts=[[q.ext[0],q.ext[1]],[q.ext[2],q.ext[3]],...q.portIn,...q.portEx,q.pin,q.cpin,[q.cc[0],q.cc[1]+1.7*c.G.r*q.sc]];
   if(!(q.sc>0)||pts.some(p=>!(p[1]>=-.5&&p[1]<=Hh+.5)))b++
  }
 }
 {
  const c=new Core(mkPT());
  for(const Hh of[cv.clientHeight-NTB,cv.clientHeight-2*NTB])for(const th of[0,PI]){c.s.y[0]=th;const q=scene(c,W,Hh);n++;if(q.ext[3]>Hh+.5||q.cc[1]+1.7*c.G.r*q.sc>Hh+.5)b++}
 }
 {
  const cv2=document.createElement('canvas');
  cv2.width=W;
  cv2.height=400;
  const g2=cv2.getContext('2d'),ft=g2.fillText.bind(g2),T=[];
  g2.fillText=(t,x,y)=>{T.push([t,y]);ft(t,x,y)};
  const c=new Core(mkPT());
  c.s.ov=2;
  c.vhit=1;
  for(const hh of[100,150,200,400]){
   T.length=0;
   drawEngine(g2,c,W,hh,COL);
   if(Math.max(...T.map(q=>q[1]))>hh||!T.some(q=>q[0].includes('OVERLOAD'))||!T.some(q=>q[0]==='VALVE HIT'))b++;
   n++
  }
 }
 chkB(23,`機関断面図（${n} 状態．帯 1 本と 2 本）が帯の上端より上に収まる（W=${W}，帯上端 ${cv.clientHeight-NTB}，${cv.clientHeight-2*NTB} px）`,b===0,b+' 件違反','0 件');
/* 6，7：スロットル開度の帯（SPEC-23 の 6） */
 {
  const tb=$('thb'),
   tk=$('thk'),
   tr=$('thr'),
   tm=$('thm'),
   tp=$('thp'),
   vis=e=>getComputedStyle(e).display!=='none'&&R(e).height>0;
  setParam('mode',0);
  drawEng();
  yield 'frame';
  const one=!vis(tb)&&vis(bd);
  setParam('mode',1);
  drawEng();
  yield 'frame';
  const two=vis(tb)&&vis(bd);
  const rt=R(tb),rbd=R(bd),rc2=R(cv);
  chkB(23,'スロットルの帯：動力計制御で 2 本（上がスロットル），スロットル制御で 1 本，ボタンとつまみ 44 px 以上，帯が Canvas の中，スクロールしない',one&&two&&Math.abs(rt.bottom-rbd.top)<=1&&rt.top>=rc2.top-1&&sz(tk)&&sz(tm)&&sz(tp)&&sec.scrollHeight<=sec.clientHeight+1&&document.body.scrollHeight<=innerHeight+1,`1 本 ${one}，2 本 ${two}，帯 ${rt.top.toFixed(0)}〜${rt.bottom.toFixed(0)}，Canvas ${rc2.top.toFixed(0)}〜${rc2.bottom.toFixed(0)}`);
  const tw=()=>R(tr).width-44,
   tu=()=>(R(tk).left-R(tr).left)/tw(),
   tdrag=dx=>{
    const[x,y]=ctr(tk);
    pev(at(x,y),'pointerdown',x,y);
    pev(tk,'pointermove',x+dx/2,y);
    pev(tk,'pointermove',x+dx,y);
    pev(tk,'pointerup',x+dx,y)
   },
   q=[];
  setParam('alm',15*D);
  thRender();
  const u0=tu(),dx=.3*tw(),ex=Math.round(Math.min(1,u0+dx/tw())*90);
  tdrag(dx);
  thRender();
  q.push(Math.abs(LP.alm/D-ex)<1e-9&&live.P.alm===LP.alm&&$('thv').textContent.includes(ex.toFixed(1)));
  tdrag(-3*tw());
  const lo=LP.alm;
  tdrag(3*tw());
  const hi=LP.alm/D;
  q.push(lo===0&&hi===90);
  thRender();
  q.push(tp.disabled);
  tapEl(tp);
  q.push(LP.alm/D===90);
  setParam('alm',30*D);
  thRender();
  {
   const rr=R(tr),[,ky]=ctr(tk),tx=rr.right-30,t0=at(tx,ky);
   pev(t0,'pointerdown',tx,ky);
   pev(t0,'pointerup',tx,ky);
   q.push(LP.alm===30*D&&!tk.contains(t0))
  }
  setParam('alm',12.34*D);
  thRender();
  tapEl(tp);
  const p1=LP.alm/D;
  tapEl(tm);
  const p2=LP.alm/D;
  setParam('alm',0);
  thRender();
  q.push(Math.abs(p1-13)<1e-9&&Math.abs(p2-12)<1e-9&&tm.disabled);
  chkB(23,'スロットルの帯の操作：ドラッグで位置の値（1° に丸める．ラベル・設定・機関が同じ値），左端・右端で 0°，90°，90° で [＋] 無効，トラックのタップでは不変，12.34° から [＋] で 13°，[−] で 12°，0° で [−] 無効',q.every(x=>x),`${q.map(x=>x?1:0).join('')}，期待 ${ex}°`)
 }
 show(3)
};
/* ---- TEST-24 internal EGR and spark timing ---- */
TST[24]=function*(){
 const t0=performance.now(),ol=(iv,ev)=>({ivo:iv*D,evc:ev*D}),OL=[ol(-10,730),ol(-25,745),ol(-40,760)];
 const go=function*(c,T){const r=mkRec();yield*runC(c,T,r);return r},a5=(r,k)=>avg(r,5,k),fx=(v,d)=>v.toFixed(d);
 let c=new Core({...mkPT(),nt:1500,Tl:3.5});
 c.start();
 const L=[];
 L.push(yield*go(c,10));
 for(const o of OL.slice(1)){Object.assign(c.P,o);L.push(yield*go(c,4))}
 const xr=L.map(r=>a5(r,'xr')),yb=L.map(r=>a5(r,'ybi')),sp=L.map(r=>a5(r,'spa'));
 chkB(24,'軽負荷 1500 rpm：OL 20→50→80° で x_r と Y_b,in が単調増加，x_r の増分 ≥ 0.10',xr[0]<xr[1]&&xr[1]<xr[2]&&yb[0]<yb[1]&&yb[1]<yb[2]&&xr[2]-xr[0]>=.1,`x_r ${xr.map(v=>fx(v,3)).join('，')}／Y_b,in ${yb.map(v=>fx(v,3)).join('，')}`);
 chkB(24,'軽負荷：MBT が OL 80° で 20° より 2° 以上進む（希釈）',sp[2]-sp[0]>=2,`${fx(sp[0],1)} → ${fx(sp[2],1)}° BTDC`);
 yield;
 c=new Core({...mkPT(),nt:2000,Tl:18.5});
 c.start();
 const p0=yield*go(c,10);
 Object.assign(c.P,OL[2]);
 const p1=yield*go(c,4);
 const g=k=>[a5(p0,k),a5(p1,k)],X=g('xr'),PM=g('pmep'),TM=g('Tm'),EB=g('eb');
 chkB(24,'部分負荷 2000 rpm：OL 20→80° で x_r +0.04 以上，PMEP +4 kPa 以上，T_max −40 K 以上，η_b が下がらない',X[1]-X[0]>=.04&&PM[1]-PM[0]>=4e3&&TM[0]-TM[1]>=40&&EB[1]>=EB[0],`x_r ${fx(X[0],3)}→${fx(X[1],3)}，PMEP ${fx(PM[0]/1e3,1)}→${fx(PM[1]/1e3,1)} kPa，T_max ${fx(TM[0],0)}→${fx(TM[1],0)} K，η_b ${fx(EB[0],3)}→${fx(EB[1],3)}`);
 yield;
 const wf=function*(n){const q=new Core({...mkPT(),mode:1,alm:90*D,nt:n,Tr:200});q.start();return yield*go(q,8)},
  w3=yield*scen('W3000'),
  W=[yield*wf(1500),w3.rec,yield*wf(5000)];
 {
  const q=w3.c.clone(),t0=q.s.C.th0;
  let sp=q.s.spa;
  while(q.s.C.th0===t0){sp=q.s.spa;q.step()}
  const C=q.s.C,m=C.m??K.wm,z10=Math.pow(-Math.log(.9)/K.wa,1/(m+1));
  W.fd=(C.th0-(2*PI-sp*D)+z10*C.db)/D
 }
 const Ns=W.map(r=>a5(r,'N')),ms=W.map(r=>a5(r,'spa')),x3=a5(W[1],'xr'),y3=a5(W[1],'ybi');
 chkB(24,'全開 3000 rpm：x_r ≤ 0.08，Y_b,in ≤ 0.02',x3<=.08&&y3<=.02,`x_r ${fx(x3,3)}，Y_b,in ${fx(y3,4)}（N̄ ${fx(Ns[1],0)}）`);
 chkB(24,'全開・目標 1500／3000／5000 rpm：MBT が 15〜35° BTDC で回転とともに進角',ms.every(v=>v>=15&&v<=35)&&ms[0]<ms[1]&&ms[1]<ms[2]&&Ns[0]<Ns[1]&&Ns[1]<Ns[2],ms.map(v=>fx(v,1)).join('，')+'°（N̄ '+Ns.map(v=>fx(v,0)).join('，')+'）');
 chkB(24,'全開 3000 rpm：火炎発達角（点火→x_b = 0.1）が 15〜35°CA',W.fd>=15&&W.fd<=35,fx(W.fd,1)+'°CA');
 yield;
 const s2=yield*scen('S2'),xi=avg(s2.rec,5,'xr');
 chkB(24,'アイドル（S2）：0.15 ≤ x_r ≤ 0.35',xi>=.15&&xi<=.35,fx(xi,3));
 const el=(performance.now()-t0)/1e3;
 chkP(24,'TEST-24 の所要',el,35,'s',1)
};
/* ---- TEST-25 intake runner ---- */
const SWK={};
function*swRun(key,P,Ns,al,opt){
 if(SWK[key])return SWK[key];
 const S=new Sweep(P,Ns,al,opt),t0=performance.now();
 while(!S.run(10))yield;
 S.el=(performance.now()-t0)/1e3;
 return SWK[key]=S
}
TST[25]=function*(){
 const P0={...mkPT(),run:1,Lr:.45,dr:.04};
 if(!RUN.ui){
  {
   const c=new Core({...P0,Al:0});
   c.s.y[0]=2*PI;
   c.s.y[1]=0;
   c.s.al=0;
   c.s.fuel=0;
   const y=c.s.y.slice();
   y[6]=P0.pa;
   y[9]=P0.pa;
   y[8]=1e-4;
   const fr=K.fr,ze=K.ze;
   K.fr=0;
   K.ze=0;
   let Y=y,h=1e-6,zc=[];
   try{
    for(let i=0;i<20000;i++){
     const y2=rk4s(q=>c.f(q),Y,h);
     if(Y[8]<0&&y2[8]>=0)zc.push((i+Y[8]/(Y[8]-y2[8]))*h);
     Y=y2;
     if((i&1023)===0&&RUN.over())yield
    }
   }finally{K.fr=fr;K.ze=ze}
   const Ar=PI/4*P0.dr**2,
    Vp=.5*Ar*P0.Lr,
    wH=Math.sqrt(Ar/P0.Lr*(K.gp*R*TI/Vp+R*TI/P0.Vin)),
    Tm=(zc[zc.length-1]-zc[0])/(zc.length-1);
   chk(25,`弁閉の共鳴周期 = 2π/ω_H（${zc.length} 回のゼロ交差）`,2*PI/wH,Tm,.01)
  }
  yield;
  {
   const c=new Core(P0),
    y=c.s.y.slice(),
    Ar=PI/4*P0.dr**2,
    rho=y[6]/((P0.gam===2?GAS.Ra:R)*TI),
    z=K.fr*P0.Lr/P0.dr+K.ze,
    mr=.02;
   y[8]=mr;
   y[9]=y[6]-z*mr*mr/(2*rho*Ar*Ar);
   const d=c.f(y)[8],ref=Ar/P0.Lr*(y[6]-y[9]);
   chkB(25,'摩擦：Δp = ζṁ²/(2ρA²) で dṁ_r/dt = 0（10⁻⁹）',Math.abs(d)<=1e-9*ref,d.toExponential(2)+' kg/s²')
  }
  {
   const c=new Core({...mkPT(),run:0});
   c.start();
   yield*runC(c,3);
   let bad=0;
   const cy=c.s.cyc;
   let n=0;
   while(c.s.cyc<cy+2){
    const d=c.f(c.s.y);
    if(d[8]!==0||d[9]!==0||d[10]!==0||d[17]!==0||c.X.pv!==c.s.y[6])bad++;
    c.step();
    n++
   }
   chkB(25,`OFF：ṁ_r，p_p，m_b,p，E_p の時間微分が 0，吸気弁の上流圧 = p_in（${n} ステップ）`,bad===0,bad+' 件違反','0 件')
  }
  yield;
  {
   const s3=yield*scen('S3'),a=avg(s3.rec,5,'mth'),b=avg(s3.rec,5,'mr'),d=avg(s3.rec,5,'min'),q=s3.c.clone();
   let y0=1,y1=0;
   const cy=q.s.cyc;
   while(q.s.cyc<cy+1){q.step();y0=Math.min(y0,q.X.Ybp);y1=Math.max(y1,q.X.Ybp)}
   chkB(25,'ON・S3：ṁ_th，ṁ_r，ṁ_in の5サイクル平均が相互に 1% 以内',Math.max(a,b,d)/Math.min(a,b,d)-1<=.01,[a,b,d].map(v=>(v*1e3).toFixed(4)).join('，')+' g/s');
   chkB(25,'ON：1 サイクルの全時刻で 0 ≤ Y_b,p ≤ 1',y0>=0&&y1<=1,y0.toFixed(4)+'〜'+y1.toFixed(4))
  }
  const So=yield*swRun('off',{...mkPT(),run:0}),
   S1=yield*swRun('on45',{...mkPT(),run:1,Lr:.45}),
   S9=yield*swRun('on90',{...mkPT(),run:1,Lr:.9});
  const dv=S=>S.pts.map((p,i)=>p.ev-So.pts[i].ev),
   am=a=>a.indexOf(Math.max(...a)),
   d1=dv(S1),
   d9=dv(S9),
   n1=S1.Ns[am(d1)],
   n9=S9.Ns[am(d9)];
  chkB(25,'慣性過給：L_r = 450 mm の Δη_v の最大 ≥ 0.02',Math.max(...d1)>=.02,Math.max(...d1).toFixed(3)+` @ ${n1} rpm`);
  chkB(25,'L_r = 900 mm で Δη_v 最大の回転数が下がる',n9<n1,`${n1} → ${n9} rpm（最大 ${Math.max(...d9).toFixed(3)}）`);
  {
   const c=new Core({...mkPT(),gam:0,run:0});
   c.start();
   c.run(.3);
   const y=c.s.y;
   y[7]=2e-6;
   y[16]=.4;
   c.P.run=1;
   c.syncSw();
   const pin=y[6],mi=pin*c.P.Vin/(R*TI),mp=pin*.5*PI/4*c.P.dr**2*c.P.Lr/(R*TI);
   chkB(25,'運転中に OFF → ON（γ(T)）：ṁ_r = 0，p_p = p_in，m_b,p = Y_b,in m_p，E_p = ε_in m_p から始める',y[8]===0&&y[9]===pin&&Math.abs(y[10]-2e-6/mi*mp)<=1e-12*y[10]&&Math.abs(y[17]-.4/mi*mp)<=1e-12*y[17],`m_b,p ${y[10].toExponential(3)} kg，E_p ${y[17].toExponential(3)} J`)
  }
/* 8：化学平衡のモデルで運転中に OFF → ON（REQ-25 の 5）．ポートの組成と余剰は，右辺 fS の吸気側の式（成分ごとの気体定数）で読んで，マニホールドの値と比べる */
  {
   const out=[];
   let ok=true;
   for(const[nm,inj,E]of[['ポート噴射',0,.4],['直噴・余剰が負',1,-.3]]){
    const c=new Core({...mkPT(),gam:2,inj,run:0});
    c.start();
    c.run(.3);
    const y=c.s.y,A=GAS,Z=c.zc(),Vp=.5*PI/4*c.P.dr**2*c.P.Lr;
    y[7]=2e-6;
    y[41]=inj?0:3e-6;
    y[16]=E;
    y[42]=9e-9; /* OFF の間に残っていた値（マニホールドの組成と合わない） */
    c.P.run=1;
    c.syncSw();
    const comp=(pk,Vk,mb,mf)=>{const ma=(pk*Vk/TI-mb*Z.RbI-mf*A.Rf)/A.Ra,m=ma+mb+mf;return{m,Yb:mb/m,Yf:mf/m}},
     I=comp(y[6],c.P.Vin,y[7],y[41]),
     Pt=comp(y[9],Vp,y[10],y[42]),
     rl=(a,b)=>a===b?0:Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b)),
     e=Math.max(rl(Pt.Yb,I.Yb),rl(Pt.Yf,I.Yf),rl(y[17]/Pt.m,y[16]/I.m));
    if(!(y[8]===0&&y[9]===y[6]&&e<=1e-12&&Math.sign(y[17])===Math.sign(E)&&Pt.m>0))ok=false;
    out.push(`${nm}：組成と余剰の相対差 ${e.toExponential(1)}，E_p ${y[17].toExponential(3)} J`)
   }
   chkB(25,'運転中に OFF → ON（化学平衡）：ポートの既燃ガスと燃料蒸気の質量分率，単位質量あたりの余剰がマニホールドと同じ（相対 1e-12．質量は成分ごとの気体定数）．余剰が負のときも符号を保つ',ok,out.join('；'))
  }
 }
 {
  uiDefault();
  show(2);
  U.pg=PAGES.indexOf('吸気ランナ');
  rs();
  yield;
  const sec=$('s2'),
   ks=ITEMS.filter(i=>i.pg===U.pg).map(i=>i.k),
   l0=LP.Lr,
   d0=LP.dr,
   b=k=>$('Pg').querySelector(`button[data-k="${k}"][data-s="1"]`);
  tapEl(b('Lr'));
  tapEl(b('dr'));
  const ch=LP.Lr>l0&&LP.dr>d0;
  tapEl($('Pg').querySelector('button[data-k="run"][data-c="0"]'));
  chkB(25,'設定ページ「吸気ランナ」：3 項目，操作で値が変わる，スクロール無し',U.pg>=0&&ks.join()==='run,Lr,dr'&&ch&&LP.run===0&&sec.scrollHeight<=sec.clientHeight+1,ks.join()+`，L_r ${Math.round(l0*1e3)}→${Math.round(LP.Lr*1e3)} mm`);
  show(3)
 }
/* 9・10：吸気側の原子の保存（REQ-25 の 6．化学平衡）．空気，燃料蒸気，既燃ガスの質量の出入りが合えば，C，H，O，N の原子の数が保存する */
 if(!RUN.ui){
  const sc=(yield*scen('S4')).c,
   A=GAS,
   VP=q=>.5*PI/4*q.P.dr*q.P.dr*q.P.Lr,
   ST=EIX.includes(50)/* ポートの空気の質量が状態か */,
   mI=(q,y)=>{const Rb=q.zc().RbI;return(y[6]*q.P.Vin/TI-y[7]*Rb-y[41]*A.Rf)/A.Ra+y[7]+y[41]},
   mP=(q,y)=>{const Rb=q.zc().RbI;return(ST?y[50]:(y[9]*VP(q)/TI-y[10]*Rb-y[42]*A.Rf)/A.Ra)+y[10]+y[42]};
  let w9=0,n9=0,e9='',r10=[];
  let rs=20261123;
  const rnd=()=>{rs=(Math.imul(rs,1664525)+1013904223)>>>0;return rs/4294967296};
  for(const inj of[1,0]){
   const q=sc.clone();
   q.P.inj=inj;
   yield*runCyc(q,inj?1:10);
   const ys=[];
   yield*runCyc(q,1,cc=>ys.push(cc.s.y.slice()));
   const out=new Array(NY).fill(0),N0=ys.length;
   for(let k=0;k<N0;k++){
    const y=ys[k].slice();
    for(const i of[7,41,10,42])y[i]*=1+.2*(rnd()-.5);
    if(ST)y[50]*=1+.2*(rnd()-.5);
    ys.push(y)
   }
   for(const y of ys){
    q.wx=1;
    q.fS(y,out);
    const X=q.X,f=X.cf;
    if(!f){e9='成分ごとの流量が無い';w9=Infinity;break}
    const[ta,tf,tb,ra,rf,rb,ia,if_,ib]=f,
     Rb=q.zc().RbI,
     sc_=Math.abs(X.mt)+Math.abs(X.mr)+Math.abs(X.mi)||1,
     dai=(q.P.Vin/TI*out[6]-out[7]*Rb-out[41]*A.Rf)/A.Ra,
     dap=ST?out[50]:(VP(q)/TI*out[9]-out[10]*Rb-out[42]*A.Rf)/A.Ra,
     E=[['マニホールドの空気',dai,ta-ra],['マニホールドの既燃ガス',out[7],tb-rb],['マニホールドの燃料蒸気',out[41],tf-rf],['ポートの空気',dap,ra-ia],['ポートの既燃ガス',out[10],rb-ib],['ポートの燃料蒸気',out[42],rf-if_]];
    for(const[nm,a,b]of E){const e=Math.abs(a-b)/sc_;if(e>w9){w9=e;e9=`${inj?'直噴':'ポート噴射'}，${nm}`}}
    n9++
   }
   yield;
   const r=yield*runCyc(q,1),
    eT=Math.abs(mI(q,r.y1)+mP(q,r.y1)-mI(q,r.y0)-mP(q,r.y0)-(r.d(23)-r.d(25)))/Math.abs(r.d(25)),
    eP=Math.abs(mP(q,r.y1)-mP(q,r.y0)-(r.d(24)-r.d(25)))/Math.abs(r.d(25));
   r10.push([inj,eT,eP])
  }
  chkB(25,'原子の保存（右辺）：化学平衡・ランナ ON（直噴，ポート噴射）の 1 サイクルの全ステップの状態と，成分を ±10% 変えた状態で，マニホールドとポートの空気，既燃ガス，燃料蒸気の質量の時間微分が，スロットル，ランナ，吸気弁の成分ごとの流量の出入りと相対 1e-12 で同じ',w9<=1e-12&&n9>0,`${n9} 状態，最大の差 ${w9.toExponential(1)}${w9>1e-12?'（'+e9+'）':''}`);
  chkB(25,'原子の保存（1 サイクル）：吸気側の全質量の変化が ΔM_th − ΔM_in と，ポートの全質量の変化が ΔM_r − ΔM_in と，ΔM_in の相対 1e-6 以内で合う（直噴，ポート噴射）',r10.every(([,a,b])=>a<=1e-6&&b<=1e-6),r10.map(([i,a,b])=>`${i?'直噴':'ポート噴射'}：全体 ${a.toExponential(1)}，ポート ${b.toExponential(1)}`).join('，'))
 }
};
/* ---- TEST-26 WOT sweep tab ---- */
TST[26]=function*(){
 const keep={cur:SW.cur,ref:SW.ref,sub:SW.sub,run:SW.run,step:SW.step,als:SW.als.slice(),crit:SW.crit,flow:SW.flow,proc:SW.proc,nmin:SW.nmin,nmax:SW.nmax};
 uiDefault();
 Object.assign(SW,{step:SWC.step,als:SWC.als.slice(),crit:SWC.critD,flow:SWC.flowD,proc:SWC.procD,nmin:SWC.crit[SWC.critD].nmin,nmax:SWC.nmax,cur:null,ref:null});
 show(5);
 yield 'frame';
 const nb=[...$('N').children],
  sec=$('s5'),
  fitB=el=>[...el.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.width<43.5||r.height<43.5||txtW(b)>.95*room(b)}).map(b=>b.textContent);
 const S=yield*swRun('on45',{...mkPT(),run:1,Lr:.45});
 SW.cur={sets:[{al:90,pts:S.pts}],pts:S.pts,sig:swSig(),el:S.el,P:{...LP},step:SW.step,o:swO()};
 let bl=0;
 for(let k=0;k<4;k++){
  swSub(k);
  drawSw();
  if(sec.scrollHeight>sec.clientHeight+1||document.body.scrollHeight>innerHeight+1)bl++;
  for(const L of SLAY){
   const sp=L.sp;
   if(!/\[.+\]/.test(sp.ya.name)||!/\[.+\]/.test(sp.xa.name)||L.yt.length<2||L.xt.length<2)bl++
  }
 }
 SW.ref=SW.cur;
 swSub(0);
 swText();
 const rw=[...$('swt').children],ov=rw.filter(r=>r.scrollWidth>r.clientWidth+1).length,sb=fitB($('sws'));
 SW.ref=null;
 chkB(26,'8 タブ・表示ボタン7つ（44 px 以上，文字の余裕），「掃引」無し，4 グラフ表示に単位付き軸名と目盛・スクロール無し，状態表示 3 行が切れない',JSON.stringify(nb.map(b=>b.textContent))==='["運転","線図","性能曲線","熱効率","最適化","設定","検証","解説"]'&&$('sws').children.length===7&&!sb.length&&![...document.querySelectorAll('nav,section:not(#s4)')].some(e=>e.textContent.includes('掃引'))&&bl===0&&ov===0&&rw.length===3,`違反 ${bl}，はみ出し ${ov}，余裕不足 ${sb.join(' ')}`);
 yield;
 const p=S.pts,w=o=>2*PI*o.Na/60;
 let A5,A1,UD=null;
 if(!RUN.ui){
  chkB(26,'各点で ω が目標と一致し，サイクルの時間から求めた回転数も目標と一致（どちらも相対誤差 10⁻⁹）',p.every(o=>Math.abs(o.Nw-o.N)<=1e-9*o.N&&Math.abs(o.Na-o.N)<=1e-9*o.N),'最大の相対差 '+Math.max(...p.map(o=>Math.abs(o.Na-o.N)/o.N)).toExponential(1),'≤ 10⁻⁹');
  chkB(26,'P_b = T_b ω，BMEP V_d = 4π T_b（10⁻⁹）',p.every(o=>Math.abs(o.pb-o.tb*w(o))<=1e-9*Math.abs(o.pb)&&Math.abs(o.bmep*geo(mkPT()).Vd-P4*o.tb)<=1e-9*Math.abs(P4*o.tb)));
  const S2=new Sweep({...mkPT()});
  while(!S2.run(10))yield;
  chkB(26,'同じ設定で2回の計測が完全一致',JSON.stringify(S2.pts)===JSON.stringify(p));
  const t0=performance.now();
  A5=yield*swRun('a50',{...mkPT()},undefined,50);
  A1=yield*swRun('a10',{...mkPT()},undefined,10);
  const el=(performance.now()-t0)/1e3+S.el;
  chkB(26,'開度 3 つ（90，50，10°）× 28 点の計測（厳格＋流量，上り）が全点で終わる',[S,A5,A1].every(x=>x.pts.length===28),[S,A5,A1].map(x=>x.pts.length).join('，')+' 点','28 点');
  chkP(26,'開度 3 つ × 28 点の計測の所要',el,30,'s',2);
  const it=p.map(o=>o.tb),ip=p.map(o=>o.pb),kt=it.indexOf(Math.max(...it)),kp=ip.indexOf(Math.max(...ip));
  chkB(26,'全開：T_b の最大が端点以外，P_b 最大の回転数 > T_b 最大の回転数，全点整定',kt>0&&kt<p.length-1&&S.Ns[kp]>S.Ns[kt]&&p.every(o=>o.ok),`T_b 最大 ${Math.max(...it).toFixed(1)} N·m @ ${S.Ns[kt]}，P_b 最大 ${(Math.max(...ip)/1e3).toFixed(2)} kW @ ${S.Ns[kp]} rpm`);
  yield;
  UD=null;
  {
   let worst='',ok=true;
   for(const[nm,cfg]of[['既定',{run:1,Lr:.45}],['L_r 900',{run:1,Lr:.9}],['ランナ OFF',{run:0}]]){
    const P=()=>({...mkPT(),...cfg}),R={};
    for(const pr of['up','updown','indep']){
     const Q=new SweepSet(P(),SWN7,[90],{proc:pr});
     while(!Q.run(10))yield;
     R[pr]=Q;
     if(nm==='既定'&&pr==='updown')UD=Q
    }
    const by=Q=>{const m={};Q.sets[0].pts.forEach(q=>m[q.N]=q);return m},U1=by(R.up),tm=Math.max(...SWN7.map(N=>U1[N].tb));
    let dt=0,de=0;
    for(const pr of['updown','indep']){
     const X=by(R[pr]);
     for(const N of SWN7){dt=Math.max(dt,Math.abs(U1[N].tb-X[N].tb));de=Math.max(de,Math.abs(U1[N].ev-X[N].ev))}
    }
    if(!(dt<=.005*tm&&de<=.005))ok=false;
    worst+=`${nm} ${(100*dt/tm).toFixed(2)}%/${de.toFixed(4)}　`
   }
   chkB(26,'手順の一致：上り・往復・独立（|ΔT_b| ≤ 0.5% max，|Δη_v| ≤ 0.005；既定，L_r 900，ランナ OFF）',ok,worst.trim())
  }
  yield;
 }
 {
  SW.als=[90,50,10];
  SW.cur={sets:[{al:90,pts:S.pts}],pts:S.pts,sig:swSig(),el:S.el,P:{...LP},step:SW.step,o:swO()};
  swSub(4);
  const O=$('swo'),
   tb=(k,v)=>tapEl(O.querySelector(`button[data-o="${k}"][data-v="${v}"]`)),
   stl=()=>{swText();return $('swt').textContent.includes('設定が変わりました')};
  const fit0=fitB(O),scr=sec.scrollHeight<=sec.clientHeight+1&&O.scrollHeight<=O.clientHeight+1;
  tb('al',70);
  const a1=SW.als.join(),s1=stl();
  tb('al',70);
  const s0=!stl();
  for(const a of[90,50])tb('al',a);
  const a2=SW.als.join();
  tb('al',10);
  const a3=SW.als.join();
  for(const a of[90,50])tb('al',a);
  const a4=SW.als.join();
  const ns=[];
  for(const v of SWC.steps){tb('st',v);ns.push(swN(SW.step).length)}
  tb('st',SWC.step);
  tb('cr','std');
  const c1=SW.crit,sc=stl();
  tb('cr','strict');
  tb('fl',1);
  const f1=SW.flow;
  tb('fl',1);
  const pr=[];
  for(const k of Object.keys(SWC.procs)){tb('pr',k);pr.push(SW.proc)}
  tb('pr',SWC.procD);
  const back=!stl();
  chkB(26,'条件画面：開度のチェック（大きい順，最後の1つは外せない），刻み 280/70/28/14 点，厳しさ・流量・手順の切替，変更で古さ表示，戻すと消える，ボタン 44 px・文字の余裕，スクロール無し',a1==='90,70,50,10'&&s1&&s0&&a2==='10'&&a3==='10'&&a4==='90,50,10'&&JSON.stringify(ns)==='[280,70,28,14]'&&c1==='std'&&sc&&f1===false&&SW.flow===true&&pr.join()==='up,updown,indep'&&back&&!fit0.length&&scr,`開度 ${a1}|${a2}|${a3}|${a4}，点数 ${ns.join('/')}，手順 ${pr.join(',')}，余裕不足 ${fit0.join(' ')}，スクロール ${!scr}`)
 }
 {
  swSub(4);
  const O=$('swo'),
   tc=(k,v,n)=>{
    for(let j=0;j<(n||1);j++){const b=O.querySelector(`button[data-o="${k}"][data-v="${v}"]`);if(b)tapEl(b)}
   },
   cv=k=>{const e=O.querySelector(`[data-c="${k}"]`);return e?e.textContent:''},
   dis=(k,v)=>{const b=O.querySelector(`button[data-o="${k}"][data-v="${v}"]`);return!!b&&b.disabled},
   r=[];
  r.push(SW.nmin===6&&SW.nmax===60&&cv('nmin')==='6'&&cv('nmax')==='60');
  tc('nmin',1);
  r.push(SW.nmin===7&&cv('nmin')==='7');
  swText();
  r.push($('swt').textContent.includes('設定が変わりました'));
  tc('nmin',-1,10);
  r.push(SW.nmin===3&&dis('nmin',-1));
  tc('nmax',-1,10);
  r.push(SW.nmax===10&&dis('nmax',-1));
  tc('nmin',1,20);
  r.push(SW.nmin===10&&dis('nmin',1)&&dis('nmax',-1));
  tc('nmax',1,25);
  r.push(SW.nmax===200&&dis('nmax',1));
  tc('cr','std');
  r.push(SW.nmin===4);
  tc('cr','strict');
  r.push(SW.nmin===6);
  tc('nmax',-1,14);
  r.push(SW.nmax===60);
  swText();
  r.push(!$('swt').textContent.includes('設定が変わりました'));
  const fb=fitB(O),sc2=sec.scrollHeight<=sec.clientHeight+1&&O.scrollHeight<=O.clientHeight+1;
  chkB(26,'条件画面：サイクル数の最少・最多（±で 1 刻み，3〜30・10〜200，最少 ≤ 最多，厳しさの選択で最少が初期値に，変更で古さ表示），ボタン 44 px・文字の余裕，スクロール無し',r.every(x=>x)&&!fb.length&&sc2,`${r.map(x=>x?1:0).join('')}，余裕不足 ${fb.join(' ')}，スクロール ${!sc2}`);
  swSub(0)
 }
 {
  swSub(5);
  const A=$('swa'),
   g=k=>{const e=A.querySelector(`[data-c="${k}"]`);return e?e.textContent:''},
   C=SWC.crit[SW.crit],
   okv=g('al')===SW.als.join('・')&&+g('Tw')===swTw(LP)&&+g('st')===SW.step&&+g('n')===swN(SW.step).length&&Math.abs(+g('tolR')-C.tolR*100)<1e-9&&+g('tolA')===C.tolA&&+g('tolS')===C.tolS&&+g('nmin')===SW.nmin&&+g('nmax')===SW.nmax&&+g('last')===SWC.last&&Math.abs(+g('Ta')-LP.Ta)<1e-9,
   th=A.querySelector('table').offsetHeight;
  const exr=[...A.querySelectorAll('tr')].map(r=>r.textContent).find(t=>t.startsWith('排気系'))||'',
   okx=!/NaN|undefined/.test(A.textContent)&&exr.includes('L_e')&&exr.includes('d_e');
  {
/* 壁温は計測に使う値（REQ-26 の 8）：化学平衡のモデルでは設定の壁温，ほかは定数表の値．計測の機関の壁温と同じ．弁径は吸気と排気 */
   const tw0=LP.Tw,g0=LP.gam,q=[];
   LP.gam=2;
   LP.Tw=420;
   swSub(5);
   q.push(g('Tw')==='420'&&new Sweep({...LP},[3000],90).c.s.y[5]===420);
   LP.gam=0;
   swSub(5);
   q.push(+g('Tw')===SWC.Tw&&new Sweep({...LP},[3000],90).c.s.y[5]===SWC.Tw);
   LP.gam=g0;
   LP.Tw=tw0;
   swSub(5);
   q.push(+g('dv')===+(LP.dv*1e3).toFixed(0)&&+g('dve')===+(LP.dve*1e3).toFixed(0)&&LP.dv!==LP.dve);
   chkB(26,'前提画面：壁温は計測に使う値（化学平衡では設定の壁温 420 K，γ(T) では定数表の値）で，計測の機関の壁温と同じ．弁径は吸気と排気の両方',q.every(x=>x),q.map(x=>x?1:0).join(''))
  }
  chkB(26,'前提画面：数値が定数表・選択・設定に一致（NaN が無く，排気系の行に L_e と d_e），表の高さ ≤ 95%',okv&&okx&&th<=.95*A.clientHeight&&sec.scrollHeight<=sec.clientHeight+1,`値 ${okv}，排気系「${exr}」，高さ ${th}/${A.clientHeight} px`);
  const s0=SW.step,lh=[];
  for(const v of SWC.steps){
   SW.step=v;
   swSub(5);
   const T=$('swa').querySelector('table'),hs=[...T.querySelectorAll('tr')].map(r=>r.offsetHeight).filter(h=>h>0);
   lh.push([v,T.querySelector('[data-c="st"]').closest('tr').offsetHeight,Math.min(...hs)])
  }
  SW.step=s0;
  swSub(5);
  chkB(26,'前提画面：回転数の点の行が 4 つの刻みのどれでも 1 行に収まる',lh.every(q=>q[1]<=q[2]+1),lh.map(q=>`${q[0]}：${q[1]}/${q[2]} px`).join('，'));
  swSub(0)
 }
 {
  SW.cur={sets:[{al:90,pts:p}],pts:p,sig:swSig(),el:1,P:{...LP},step:SW.step,o:swO()};
  swSub(5);
  const A=$('swa'),
   g=k=>{const e=A.querySelector(`[data-c="${k}"]`);return e?e.textContent:''},
   q=k=>!!A.querySelector(`[data-c="${k}"]`),
   dg=r=>(r/D).toFixed(0)+'°',
   k0={cam:LP.cam,Lv:LP.Lv,ivc:LP.ivc,phin:LP.phin},
   e0=LP.eps,
   r=[];
  r.push(g('cam')===IT.cam.ch[LP.cam]&&!q('old')&&!q('pend')&&!q('run'));
  setParam('cam',2,1);
  r.push(g('cam')==='Aggr'&&q('old'));
  setParam('Lv',6e-3,1);
  r.push(g('Lv')==='6.0');
  setParam('ivc',230*D,1);
  r.push(g('ivc')==='230°');
  setParam('phin',20*D,1);
  {const V=valves(LP,geo(LP));r.push(g('ivo')===dg(V.i.o)&&g('ivc')===dg(V.i.c)&&g('ivc')!=='230°')}
  setParam('eps',12);
  r.push(q('pend')&&g('eps')===e0.toFixed(1)&&LP.eps===e0);
  const th=A.querySelector('table').offsetHeight,fitH=th<=.95*A.clientHeight&&sec.scrollHeight<=sec.clientHeight+1;
  setParam('eps',e0);
  for(const k in k0)setParam(k,k0[k],1);
  r.push(!q('old')&&!q('pend')&&g('cam')===IT.cam.ch[k0.cam]&&g('Lv')===(k0.Lv*1e3).toFixed(1));
  SW.cur=null;
  swSub(5);
  setParam('cam',1,1);
  r.push(g('cam')==='Poly'&&!q('old'));
  setParam('cam',k0.cam,1);
  U.swTest=1;
  tapEl($('swg'));
  const run1=!!SW.run&&q('run');
  setParam('cam',2,1);
  r.push(run1&&g('cam')===IT.cam.ch[k0.cam]);
  tapEl($('swg'));
  r.push(!SW.run&&!q('run')&&g('cam')==='Aggr');
  setParam('cam',k0.cam,1);
  U.swTest=0;
  chkB(26,'前提画面：設定の変更を即座に反映（カム・リフト・IVC・位相．計測の有無によらない），曲線が古いときと保留中の変更があるときに注記，計測中は計測中の設定，注記を含めた表の高さ ≤ 95%',r.every(x=>x)&&fitH,`${r.map(x=>x?1:0).join('')}，高さ ${th}/${A.clientHeight} px`);
  swSub(0)
 }
 yield;
 if(!RUN.ui){
  {
   const ordT=p.every((o,i)=>A1.pts[i].tb<A5.pts[i].tb),
    ordV=p.every((o,i)=>A1.pts[i].ev<A5.pts[i].ev),
    mono=(g=>g(1000)>g(4000)&&g(4000)>g(7000))(N=>A1.pts.find(o=>o.N===N).tb),
    cv=document.createElement('canvas').getContext('2d');
   cv.font='11px system-ui,sans-serif';
   const lgFit=sets=>{
    SW.cur={sets,pts:sets[0].pts,sig:swSig(),el:1,P:{...LP},step:SW.step,o:swO()};
    swSub(0);
    drawSw();
    let bad=0;
    for(const L of SLAY){
     const pl=L.pl;
     for(const r of L.R)if(r.t==='lg'&&(r.x<pl.x-.5||r.x+12+cv.measureText(r.s).width>pl.x+pl.w+.5))bad++
    }
    return bad
   };
   const b3=lgFit([{al:90,pts:p},{al:50,pts:A5.pts},{al:10,pts:A1.pts}]),
    b9=lgFit(SWC.alsAll.slice().reverse().map(al=>({al,pts:p})));
   chkB(26,'開度の重ね描き：計測する開度の既定は 90° だけ．10° < 50°（T_b，η_v）全点，10° の T_b は 1000 > 4000 > 7000 rpm，凡例が 3 開度・9 開度ともプロット内（50° と 90° の大小は判定しない）',SWC.als.join()==='90'&&ordT&&ordV&&mono&&b3===0&&b9===0,`既定 ${SWC.als.join()}°，順序 T ${ordT} η ${ordV}，単調 ${mono}，凡例はみ出し ${b3}/${b9}`)
  }
  {
   const C=SWC.crit.strict,
    bad=p.filter(o=>o.ok&&!(o.r&&o.r.T<=C.tolR*Math.abs(o.tb)+C.tolA&&o.r.S<=C.tolS&&o.r.ev<=C.tolR&&o.r.mth<=C.tolR&&o.r.pin<=C.tolR&&o.cyc>=C.nmin)).length;
   SW.cur={sets:UD.sets,pts:UD.pts,sig:swSig(),el:1,P:{...LP},step:SW.step,o:UD.o};
   swText();
   const ud=$('swt').textContent;
   chkB(26,'収束の判定：厳格＋流量で整定した全点の幅（T_b，MBT，η_v，ṁ_th，p_in）が判定値以下・6 サイクル以上，往復で往復差を表示',bad===0&&p.every(o=>o.ok)&&/往復差 [0-9.]+%/.test(ud),`違反 ${bad}，最少サイクル ${Math.min(...p.map(o=>o.cyc))}，「${ud.slice(0,40)}」`)
  }
  {
   const PT={...mkPT()},A=new Sweep(PT,[1000,4000],90,{nmin:12,nmax:60});
   while(!A.run(10))yield;
   const B=new Sweep(PT,[1000,4000],90,{nmin:3,nmax:4});
   while(!B.run(10))yield;
   const okA=A.pts.some(o=>o.ok)&&A.pts.every(o=>!o.ok||o.cyc>=12)&&A.pts.every(o=>o.cyc<=60),
    okB=B.pts.every(o=>o.cyc<=4)&&B.pts.some(o=>!o.ok&&o.cyc===4);
   U.swTest=1;
   SW.nmin=8;
   SW.nmax=30;
   swStart();
   const o=SW.run&&SW.run.o,okC=!!o&&o.nmin===8&&o.nmax===30&&SW.run.S.nmin===8&&SW.run.S.nmax===30;
   swStop();
   swSub(5);
   const A5=$('swa'),
    g=k=>{const e=A5.querySelector(`[data-c="${k}"]`);return e?e.textContent:''},
    okD=g('nmin')==='8'&&g('nmax')==='30';
   SW.nmin=6;
   SW.nmax=60;
   U.swTest=0;
   swSub(0);
   chkB(26,'サイクル数の最少・最多：最少 12 で整定点はすべて 12 サイクル以上，最多 4（打ち切りの規則の検査）で全点 4 サイクル以下，未整定の点は 4 で打ち切り，画面の指定が計測と前提の表に渡る',okA&&okB&&okC&&okD,`最少12：${A.pts.map(o=>o.cyc+(o.ok?'':'*')).join(',')}，最多4：${B.pts.map(o=>o.cyc+(o.ok?'':'*')).join(',')}，渡し ${okC}，前提 ${okD}`)
  }
  yield;
 }
 U.swTest=1;
 SW.step=500;
 SW.als=[90];
 SW.crit='std';
 SW.flow=false;
 SW.cur=null;
 SW.ref=null;
 const lp0=JSON.stringify(LP),ls0=JSON.stringify(live.s);
 SW.maxMs=0;
 const ui=function*(){tapEl($('swg'));while(SW.run){swTick(8);yield}};
 yield*ui();
 const c1=SW.cur;
 yield*ui();
 swSub(0);
 drawSw();
 const lg1=(sweepSpec(SW.cur.sets,SW.ref&&SW.ref.sets,0)[0].lg||[]).map(q=>q.n);
 if(!RUN.ui){
  const B=new GAS.NodeB(40),ts=[];
  let tb=null;
  for(let k=0;k<200&&!tb;k++){const t0=performance.now();tb=B.run(2);ts.push(performance.now()-t0)}
  const ref=GAS.node(40),
   same=!!tb&&['e','c','R','Q'].every(k=>tb[k].length===ref[k].length&&tb[k].every((v,j)=>Object.is(v,ref[k][j])));
  const w0=GAS.warm,S0=new Sweep({...mkPT()},swN(500)),tA=S0.c.s.t;
  onEnd(()=>{GAS.warm=w0});
  GAS.warm=()=>false;
  const r0=S0.run(8),hold=r0===false&&S0.c.s.t===tA;
  GAS.warm=w0;
  const all=GAS.warm(1e9);
  chkB(26,'表を前もって作る：1 節点を持ち時間 2 ms ずつ行ごとに作り，できた表が node(i) とビット単位で一致．表がそろうまで計測は積分しない．warm が全節点をそろえる',same&&hold&&all,`${ts.length} 回，一致 ${same}，積分しない ${hold}，そろう ${all}`);
  chkP(26,'表を前もって作る：持ち時間 2 ms の 1 回（最長）',Math.max(...ts),4,'ms',2)
 }
 if(!RUN.ui){
  const S=new Sweep({...mkPT()},swN(500));
  let ns=0;
  S.c={P:{gam:0},s:{fuel:1,cyc:0,fired:1},lastM:null,step(){const t=performance.now();while(performance.now()-t<10);ns++}};
  const t0=performance.now();
  S.run(8);
  const el=performance.now()-t0;
  chkB(26,'1 回の計算の打ち切り：1 ステップ 10 ms の模擬で，持ち時間 8 ms の計算が 20 ms 以内に戻り，進めたステップが 1 回',el<=20&&ns===1,`${el.toFixed(1)} ms，${ns} ステップ`,'≤ 20 ms，1 ステップ')
 }
 chkB(26,'計測の前後で運転中のエンジンの設定と状態が一致',JSON.stringify(LP)===lp0&&JSON.stringify(live.s)===ls0);
 chkP(26,'性能曲線の計測：1 回の計算（最長）',SW.maxMs,30,'ms',1);
 tapEl($('swc'));
 chkB(26,'2 回目の完了で基準（前回）が描かれ，[基準を消す] で消える',lg1.includes('基準')&&SW.ref===null&&c1&&SW.cur!==c1,lg1.join('，'));
 setParam('phin',5*D);
 swText();
 const st1=$('swt').textContent;
 yield*ui();
 swText();
 const st2=$('swt').textContent;
 tapEl($('swg'));
 swTick(8);
 tapEl($('swg'));
 const curC=SW.cur;
 if(!RUN.ui){
  {
   const ax=[0,1,2,3].flatMap(k=>sweepSpec([],null,k)).map(g=>g.xa),
    ok=ax.length>=4&&ax.every(a=>a.a===0&&a.b===7000&&a.tv.join()==='0,1000,2000,3000,4000,5000,6000,7000');
   chkB(26,'性能曲線の全グラフ（4 つの表示の 7 個）の横軸が 0〜7000 rpm，目盛 0, 1000, …, 7000',ok,`${ax.length} 個，${ax[0].a}〜${ax[0].b}，目盛 ${ax[0].tv.join(', ')}`)
  }
  {
   const L=swN(250),S=new Sweep({...mkPT(),spb:5},[250,500],90,{crit:'strict',flow:true,proc:'up'});
   while(!S.run(10))yield;
   const q=S.pts,
    ok=L[0]===250&&L[L.length-1]===7000&&L.length===28&&L.every((N,k)=>N===250*(k+1))&&q.length===2&&q.every(o=>o.ok&&o.cyc>0&&o.tb>0&&Math.abs(o.spa-5)>1);
   chkB(26,'低い回転数：刻み 250 の点が 250, 500, …, 7000．全開の 250，500 rpm（完爆の判定より低い）が整定し，点火時期が自動最適化され，T_b > 0',ok,`点 ${L[0]}〜${L[L.length-1]}（${L.length} 点），`+q.map(o=>`${o.N} rpm：${o.ok?'整定':'未整定'} ${o.cyc} サイクル，T_b ${o.tb==null?'–':o.tb.toFixed(1)} N·m，点火 ${o.spa==null?'–':o.spa.toFixed(1)}°`).join('，'))
  }
  {
   const S=new Sweep({...mkPT()},[100,250],90,{crit:'strict',flow:true,proc:'up'});
   while(!S.run(10))yield;
   const q=S.pts,ser=sweepSpec([{al:90,pts:q}],null,0)[0].ser[0].X;
   chkB(26,'エンスト：全開の 100 rpm はエンストとして記録され（サイクル数 ≤ 1），グラフの系列に入らない．250 rpm は入る',q.length===2&&q[0].st===1&&q[0].cyc<=1&&!q[1].st&&ser.join()==='250',`100 rpm：${q[0].st?'エンスト':'エンストでない'}，${q[0].cyc} サイクル，系列の点 ${ser.join(', ')}`)
  }
  {
   const o=[];
   for(const proc of['updown','indep']){
    const S=new SweepSet({...mkPT()},[100,1000],[90],{crit:'strict',flow:true,proc});
    while(!S.run(10))yield;
    const st=S.sets[0],q=st.pts;
    o.push({
     proc,
     ok:q.length===2&&q[0].N===100&&q[0].st===1&&!q[1].st&&q[1].ok&&q[1].tb>0&&Number.isFinite(st.dT)&&Number.isFinite(st.dV),
     s:`${SWC.procs[proc]}：100 rpm ${q[0]&&q[0].st?'エンスト':'エンストでない'}，1000 rpm T_b ${q[1]&&q[1].tb!=null?q[1].tb.toFixed(2):'–'} N·m，往復差 ${st.dT.toExponential(1)}`
    })
   }
   chkB(26,'エンスト（手順が往復・独立のとき）：100 rpm はエンストとして記録され，1000 rpm は整定して値を持ち，往復差が有限',o.every(x=>x.ok),o.map(x=>x.s).join('．'))
  }
  {
   const mkp=st=>{
     const N=swN(st);
     return N.map((n,k)=>({N:n,tb:30+5*Math.sin(n/900),pb:n*.005,ev:.8,bs:300,eb:.3,spa:20,xr:.1,ok:k!==3}))
    },
    cnt=st=>{
     const cv=document.createElement('canvas');
     cv.width=320;
     cv.height=200;
     const g=cv.getContext('2d');
     let n=0;
     const a0=g.arc;
     g.arc=function(...x){n++;return a0.apply(this,x)};
     drawScreen(g,320,200,sweepSpec([{al:90,pts:mkp(st)}],null,0),COL,null);
     return n
    },
    n25=cnt(25),
    n500=cnt(500);
   chkB(26,'印の間引き（出力の 2 つのグラフ）：刻み 25 rpm（間隔 < 8 px）は未整定の 1 点だけに印（計 2 個），刻み 500 rpm は全 14 点に印（計 28 個）',n25===2&&n500===28,`刻み 25：${n25} 個，刻み 500：${n500} 個`)
  }
 }
 chkB(26,'設定変更で古さの表示が出て再計測で消える，[中止] は結果を置き換えない',st1.includes('設定が変わりました')&&!st2.includes('設定が変わりました')&&!SW.run&&SW.cur===curC,`変更後「${st1.slice(-20)}」`);
 U.swTest=0;
 Object.assign(SW,keep);
 show(3)
};
/* ---- TEST-27 exhaust system ---- */
TST[27]=function*(){
 const P0={...mkPT(),exs:1};
 if(!RUN.ui){
  {
   const c=new Core(P0);
   c.s.y[0]=2*PI;
   c.s.y[1]=0;
   c.s.al=0;
   c.s.fuel=0;
   const y=c.s.y.slice();
   y[13]=1e-4;
   y[14]=y[15]=P0.pa;
   y[49]=y[5]=800;
   const fr=K.fr,ze=K.ze;
   K.fr=0;
   K.ze=0;
   let Y=y,h=1e-6,zc=[];
   try{
    for(let i=0;i<40000;i++){
     const y2=rk4s(q=>c.f(q),Y,h);
     if(Y[13]<0&&y2[13]>=0)zc.push((i+Y[13]/(Y[13]-y2[13]))*h);
     Y=y2;
     if((i&4095)===0&&RUN.over())yield
    }
   }finally{K.fr=fr;K.ze=ze}
   const Ae=PI/4*P0.dex**2,
    Vpe=.5*Ae*P0.Lex,
    xq=c.xport(y),
    wE=Math.sqrt(Ae/P0.Lex*(1+xq.R/xq.cv)*xq.R*xq.T/Vpe),
    Tm=(zc[zc.length-1]-zc[0])/(zc.length-1);
   chk(27,`弁閉の共鳴周期 = 2π/ω_E，ω_E = √(A_e γ_X R_X T_X/(L_e V_pe))（化学平衡，T_X 800 K，${zc.length} 回のゼロ交差）`,2*PI/wE,Tm,.01)
  }
  yield;
  {
   const c=new Core(P0),y=c.s.y.slice(),Ae=PI/4*P0.dex**2,z=K.fr*P0.Lex/P0.dex+K.ze,me=.03;
   y[0]=2*PI;
   y[15]=P0.pa;
   let pp=P0.pa+500;
   for(let i=0;i<60;i++)pp=P0.pa+(z+1)*me*me/(2*(pp/(P0.gam===2?c.xport(Object.assign(y.slice(),{14:pp})).R*y[49]:R*TX))*Ae*Ae);
   y[13]=me;
   y[14]=pp;
   const d=c.f(y)[13],ref=Ae/P0.Lex*(pp-P0.pa);
   chkB(27,'損失と出口の動圧：p_pe − p_atm = (ζ_x + 1) ṁ²/(2ρA²) で dṁ_e/dt = 0（10⁻⁹）',Math.abs(d)<=1e-9*ref,d.toExponential(2)+' kg/s²')
  }
  {
   const c=new Core({...mkPT(),exs:0});
   c.start();
   yield*runC(c,3);
   let bad=0,n=0;
   const cy=c.s.cyc;
   while(c.s.cyc<cy+2){const d=c.f(c.s.y);if(d[13]!==0||d[14]!==0||d[15]!==0||c.X.pex!==c.P.pa+c.P.dpx)bad++;c.step();n++}
   chkB(27,`OFF：ṁ_e，p_pe，p_te の時間微分が 0，排気弁の下流圧 = p_atm + Δp_ex（${n} ステップ）`,bad===0,bad+' 件違反','0 件');
   c.P.exs=1;
   c.s.y[13]=.01;
   c.syncSw();
   const y=c.s.y,pb=c.P.pa+c.P.dpx;
   chkB(27,'運転中に OFF → ON：ṁ_e = 0，p_pe = p_te = p_atm + Δp_ex から始める',y[13]===0&&y[14]===pb&&y[15]===pb,`${y[13]} kg/s，${(y[14]/1e3).toFixed(2)}，${(y[15]/1e3).toFixed(2)} kPa`)
  }
  yield;
  {
   const s3=yield*scen('S3'),a=avg(s3.rec,5,'mexv'),b=avg(s3.rec,5,'mepp'),d=avg(s3.rec,5,'mtl');
   chkB(27,'ON・S3：排気弁・排気管・出口の流量の5サイクル平均が相互に 1% 以内',Math.max(a,b,d)/Math.min(a,b,d)-1<=.01,[a,b,d].map(v=>(v*1e3).toFixed(4)).join('，')+' g/s')
  }
/* 5：出口の開口と背圧 */
  {
   const c=new Core(P0),y=c.s.y.slice();
   y[0]=2*PI;
   y[13]=.02;
   y[14]=P0.pa+3e3;
   y[15]=P0.pa+1e3;
   const d=c.f(y),X=c.X;
   chkB(27,'大気開放：既定の設定に Vm，At が無い．dp_te/dt = 0，出口の流量 = ṁ_e（p_te を変えても同じ）',P0.Vm===undefined&&P0.At===undefined&&d[15]===0&&X.mtl===.02&&d[13]===(y[15]=P0.pa-5e3,c.f(y)[13]),`dp_te/dt ${d[15]}，ṁ_t ${X.mtl} kg/s`)
  }
  {
   const c=(yield*scen('G3000D')).c.clone(),
    P=c.P,
    Ae=PI/4*P.dex**2,
    zx=K.fr*P.Lex/P.dex+K.ze,
    F=y=>{const q=c.xport(y);return y[13]*Math.abs(y[13])/(2*(y[14]/(q.R*q.T))*Ae*Ae)},
    c0=c.s.cyc;
   let a=[0,0,0],T=0,k=0;
   while(c.s.cyc===c0)c.step();
   const c1=c.s.cyc,m0=c.s.y[13];
   let y0=c.s.y.slice(),t0=c.s.t;
   while(c.s.cyc===c1){
    c.step();
    const y=c.s.y,h=c.s.t-t0;
    a[0]+=h*(F(y0)+F(y))/2;
    a[2]+=h*(y0[14]+y[14])/2;
    T+=h;
    y0=y.slice();
    t0=c.s.t;
    if((++k&255)===0&&RUN.over())yield
   }
   const q=a[0]/T,fr=zx*q,ex=q,bp=a[2]/T-P.pa;
   chkB(27,'背圧の内訳（全開・3000 rpm 固定の定常 G3000D の 1 サイクル，台形則）：損失の項 (ζ_x + 1) ṁ|ṁ|/(2ρA²) の平均 ＝ p_pe の平均 − p_atm（相対 1 %）',Math.abs((fr+ex)/bp-1)<=.01,`管の損失 ${(fr/1e3).toFixed(3)} ＋ 出口の動圧 ${(ex/1e3).toFixed(3)} ＝ ${((fr+ex)/1e3).toFixed(3)} kPa，背圧 ${(bp/1e3).toFixed(3)} kPa（相対差 ${((fr+ex)/bp-1).toExponential(1)}），ζ_x ${zx.toFixed(2)}`)
  }
  {
   const S=yield*swRun('on45',{...mkPT(),run:1,Lr:.45}),
    q=S.pts.filter(o=>o.N%500===0&&o.N>=1000&&o.N<=7000),
    mx=q.reduce((a,b)=>b.dpex>a.dpex?b:a),
    s2=yield*scen('S2'),
    di=avg(s2.rec,5,'dpex');
   chkB(27,`背圧：全開 1000〜7000 rpm（${q.length} 点）で 10 kPa 以下，アイドル ≤ 0.5 kPa`,q.length>=13&&mx.dpex<=1e4&&di<=500,`最大 ${(mx.dpex/1e3).toFixed(2)} kPa（${mx.N} rpm），1000 rpm ${(q[0].dpex/1e3).toFixed(2)} kPa，5000 rpm ${(S.pts.find(o=>o.N===5000).dpex/1e3).toFixed(2)} kPa，アイドル ${(di/1e3).toFixed(3)} kPa`);
   const p3=S.pts.find(o=>o.N===3000);
   chkB(27,'脈動：全開 3000 rpm で排気ポート圧の 1 サイクルの幅 ≥ 20 kPa',p3.ppeR>=2e4,(p3.ppeR/1e3).toFixed(0)+' kPa','≥ 20 kPa')
  }
  yield;
/* 9〜11：排気ポートのガスの温度（SPEC-27 の 9〜11） */
  {
   const c=(yield*scen('S4')).c.clone(),
    r=yield*runCyc(c,5),
    d=r.d,
    a=Math.abs,
    x0=c.xport(r.y0),
    x1=c.xport(r.y1),
    em=(x1.m-x0.m)-(d(26)-d(27)),
    sm=a(d(26))+a(d(27)),
    eu=(x1.U-x0.U)-(d(54)-d(55)-d(51)),
    su=a(d(54))+a(d(55))+a(d(51));
   chkB(27,'排気ポートの収支（S4 の 5 サイクル）：Δm_X = ΔM_ex − ΔM_e，Δ[m_X(e_X − h_b^ref)] = ΔH_xs − ΔH_x − ΔQ_pw（出入りの絶対値の和の 1e-4）',a(em)<=1e-4*sm&&a(eu)<=1e-4*su,`質量 ${(em/sm).toExponential(1)}，エネルギー ${(eu/su).toExponential(1)}；ΔH_xs ${d(54).toFixed(1)}，ΔH_x ${d(55).toFixed(1)}，ΔQ_pw ${d(51).toFixed(2)} J`)
  }
  {
   const c=(yield*scen('S4')).c.clone(),P=c.P,y=c.s.y.slice();
   y[0]=300*D;
   y[13]=0;
   y[5]=y[49];
   const d=c.f(y),
    ok1=Math.abs(d[49])<=1e-9&&Math.abs(d[14])<=1e-6,
    Ae=PI/4*P.dex**2,
    ref=(me,Re0)=>{
     const q=c.xport(y),
      mu=1.458e-6*q.T**1.5/(q.T+110.4),
      Re=Math.max(me/2*P.dex/(Ae*mu),2300),
      k=(q.cv+q.R)*mu/.7,
      h=.023*Re**.8*.7**.3*k/P.dex;
     return{Q:h*PI*P.dex*P.B*(q.T-y[5]),Re}
    };
   y[5]=y[49]-300;
   y[13]=.02;
   c.f(y);
   const r1=ref(.02),e1=Math.abs(c.X.Qpw/r1.Q-1);
   y[13]=1e-5;
   c.f(y);
   const r2=ref(1e-5),e2=Math.abs(c.X.Qpw/r2.Q-1);
   chkB(27,'ポートの式：弁閉・ṁ_e = 0・T_w = T_X で |dT_X/dt| ≤ 1e-9 K/s，|dp_pe/dt| ≤ 1e-6 Pa/s．Q̇_pw が Dittus–Boelter の式に一致（1e-12．ṁ_e = 0.02 kg/s，1e-5 kg/s では Re = 2300）',ok1&&e1<=1e-12&&e2<=1e-12&&r1.Re>2300&&r2.Re===2300,`${d[49].toExponential(1)} K/s，${d[14].toExponential(1)} Pa/s，${e1.toExponential(1)}（Re ${r1.Re.toFixed(0)}），${e2.toExponential(1)}`)
  }
  {
   const g=(yield*scen('G3000D')).c.lastM,i2=(yield*scen('S2')).c.lastM;
   chkB(27,'排気温度：G3000D の 1 サイクルの質量平均 T̄_X が 900〜1400 K で，排気弁が開く時点の筒内の温度より低い．S2 はそれより低い',g.Tx>=900&&g.Tx<=1400&&g.Tx<g.TE&&i2.Tx<g.Tx,`G3000D ${g.Tx.toFixed(0)} K（EVO の筒内 ${g.TE.toFixed(0)} K），S2 ${i2.Tx.toFixed(0)} K（EVO ${i2.TE.toFixed(0)} K）`)
  }
  yield;
 }
 {
  uiDefault();
  show(2);
  U.pg=PAGES.indexOf('排気系');
  rs();
  yield;
  const sec=$('s2'),
   ks=ITEMS.filter(i=>i.pg===U.pg).map(i=>i.k),
   v0=LP.dpx,
   b=k=>$('Pg').querySelector(`button[data-k="${k}"][data-s="1"]`);
  tapEl(b('dpx'));
  const ch=LP.dpx>v0;
  const off=$('Pg').querySelector('button[data-k="exs"][data-c="0"]');
  tapEl(off);
  chkB(27,'設定ページ「排気系」：2 項目（排気系モデル，排気圧損），操作で値が変わる，スクロール無し',U.pg>=0&&ks.join()==='exs,dpx'&&ch&&v0===0&&LP.exs===0&&sec.scrollHeight<=sec.clientHeight+1,ks.join()+`，Δp_ex ${v0/1e3}→${LP.dpx/1e3} kPa`);
  show(3)
 }
};
/* ---- TEST-28 idle plausibility ---- */
TST[29]=function*(){
 const T=GAS,
  S=T.S,
  br=(f,a,b)=>{
   let fa=f(a);
   for(let i=0;i<200&&b-a>1e-7;i++){const m=(a+b)/2,fm=f(m);if(fa*fm<=0)b=m;else{a=m;fa=fm}}
   return(a+b)/2
  };
/* 1 物性の値 */
 chk(29,'空気の気体定数 R_a [J/(kg·K)]',288.19,T.Ra,1e-4);
 chk(29,'燃料蒸気の気体定数 R_f [J/(kg·K)]',75.586,T.Rf,1e-4);
 chk(29,'量論空燃比 AF_st',14.503,T.AF,1e-4);
 chk(29,'燃料蒸気の低位発熱量（298.15 K）[MJ/kg] = H_u + h_fg',44.35,(T.h(T.F,T.T0)-T.nC*T.h(S.CO2,T.T0)-T.y*T.nC/2*T.h(S.H2O,T.T0))/T.Mf/1e6,1e-4);
 {
  let e1=0,e2=0;
  for(const k of['O2','N2','CO2','H2O','CO','H2','OH','O','H','NO']){
   const s=S[k];
   for(const x of[400,900,1500,2600])e1=Math.max(e1,Math.abs((T.h(s,x+.01)-T.h(s,x-.01))/.02/T.cp(s,x)-1));
   e2=Math.max(e2,Math.abs(T.h(s,1000-1e-9)/T.h(s,1000)-1),Math.abs(T.s0(s,1000-1e-9)/T.s0(s,1000)-1))
  }
  chkB(29,'各化学種：dh/dT = c_p（相対 1e-6），1000 K で h と s° が連続（相対 1e-5）',e1<1e-6&&e2<1e-5,`${e1.toExponential(1)}，${e2.toExponential(1)}`)
 }
 yield;
/* 2 平衡定数 */
 {
  const r=[[2000,-2.879],[2500,-1.433],[3000,-.479]].map(([x,ref])=>{const G=k=>T.h(S[k],x)-x*T.s0(S[k],x);return[-(G('CO')+.5*G('O2')-G('CO2'))/(RU*x)/Math.LN10,ref]});
  chkB(29,'CO2 ⇌ CO + ½O2 の log10 Kp（2000，2500，3000 K．±0.005）',r.every(q=>Math.abs(q[0]-q[1])<=.005),r.map(q=>q[0].toFixed(4)).join('，'),'−2.879，−1.433，−0.479')
 }
/* 3 平衡の解（燃焼効率 1） */
 {
  let eb=0,es=0,nok=0,cnt=0;
  for(const ph of[.7,1,1.3])for(const x of[1700,2500,3200])for(const p of[1e5,5e6]){
   const z=T.phi2z(ph),q=T.eq(x,p,z,1),b=q.b;
   cnt++;
   if(q.ok)nok++;
   for(let i=0;i<4;i++){let s=0;for(let j=0;j<10;j++)s+=T.A[i][j]*q.n[j];eb=Math.max(eb,Math.abs(s/b[i]-1))}
 /* 停留の条件：μ_j/RT = Σ λ_i a_ij．主要な 4 種から λ を解き，残りの化学平衡で残差を見る */
   const mu=T.SP.map((s,j)=>(T.h(s,x)-x*T.s0(s,x))/(RU*x)+Math.log(q.n[j]/q.N)+Math.log(p/PSTD)),
    lN=mu[5]/2,
    lO=mu[4]/2,
    lC=mu[0]-2*lO,
    lH=(mu[2]-lO)/2,
    lam=[lC,lH,lO,lN];
   for(let j=0;j<10;j++){
    let s=0;
    for(let i=0;i<4;i++)s+=lam[i]*T.A[i][j];
    if(q.n[j]/q.N>1e-12)es=Math.max(es,Math.abs(mu[j]-s))
   }
  }
  chkB(29,'化学平衡：18 条件すべて収束，元素の保存（相対 1e-9），停留の条件の残差 ≤ 1e-8',nok===cnt&&eb<1e-9&&es<1e-8,`収束 ${nok}/${cnt}，元素 ${eb.toExponential(1)}，停留 ${es.toExponential(1)}`);
  const d=T.direct(2500,5e6,T.phi2z(1),1,false);
  chkB(29,'φ = 1，2500 K，5 MPa：CO のモル分率 0.01029（±1e-5），R_b = 289.58 J/(kg·K)（±0.01）',Math.abs(d.n[1]/d.N-.010293)<1e-5&&Math.abs(d.R-289.58)<.01,`${(d.n[1]/d.N).toFixed(6)}，${d.R.toFixed(3)}`);
  yield;
  const tad=ph=>{
    const z=T.phi2z(ph),h0=(1-z)*T.ha(298.15)+z*T.hf(298.15);
    return br(x=>{const q=T.direct(x,101325,z,1,false);return q.e+q.R*x-h0},1500,3000)
   },
   t1=tad(1);
  yield;
  const t2=tad(1.1);
  chkB(29,'定圧断熱火炎温度（298.15 K，101.325 kPa）：φ = 1.0 で 2313.7 K，1.1 で 2325.2 K（±2 K）',Math.abs(t1-2313.7)<=2&&Math.abs(t2-2325.2)<=2,`${t1.toFixed(1)}，${t2.toFixed(1)} K`)
 }
 yield;
/* 4 定容・断熱の燃焼（燃焼効率 1，凍結なし，平衡を直接解く） */
 {
  const r=[];
  for(const[ph,T2,v,Tr,pr]of[[1,690.30,.09058,2952,9.565e6],[1.1,682.90,.09016,2983,9.817e6]]){
   const z=T.phi2z(ph),
    u2=(1-z)*T.ea(T2)+z*T.ef(T2),
    st=x=>{
     let p=290*x/v,q;
     for(let i=0;i<30;i++){q=T.direct(x,p,z,1,false);const pn=q.R*x/v;if(Math.abs(pn/p-1)<1e-11)break;p=pn}
     return[q.e-u2,p]
    },
    T3=br(x=>st(x)[0],1500,4000),
    p3=st(T3)[1];
   r.push([T3,p3,Math.abs(T3-Tr)<=5&&Math.abs(p3/pr-1)<=.003]);
   yield
  }
  chkB(29,'定容・断熱の燃焼の終わり：φ = 1.0 で 2952 K，9.565 MPa，1.1 で 2983 K，9.817 MPa（±5 K，±0.3%）',r.every(q=>q[2]),r.map(q=>`${q[0].toFixed(1)} K，${(q[1]/1e6).toFixed(3)} MPa`).join('／'))
 }
/* 5 表の補間 */
 {
  const o={},G=T.G;
  let me=0,mr=0,n=0;
  for(const pr of[.00625,.25625,.73125,1.00625,1.26875]){
   const z=T.phi2z(pr/K.etac);
   for(let it=0;it<G.nT-1;it++){
    for(let ip=0;ip<G.np-1;ip++){
     const x=G.T0+G.dT*(it+.5),p=Math.exp(G.lp0+G.dlp*(ip+.5));
     T.burned(x,p,z,o);
     const d=T.direct(x,p,z);
     me=Math.max(me,Math.abs(o.e-d.e));
     mr=Math.max(mr,Math.abs(o.R/d.R-1));
     n++
    }
    if(RUN.over())yield
   }
  }
  chkB(29,`既燃ガスの表の補間（格子の中点 ${n} 点）：平衡を直接解いた値との差が e_b で 5 kJ/kg 以下，R_b で相対 1e-3 以下`,me<=5e3&&mr<=1e-3,`${(me/1e3).toFixed(2)} kJ/kg，${mr.toExponential(1)}`,'≤ 5，≤ 1e-3');
  const z=T.phi2z(1.03),
   x=2333,
   p=3.3e6,
   f=(a,b,c)=>({...T.burned(a,b,c,{})}),
   a=f(x,p,z),
   dT=(f(x+.01,p,z).e-f(x-.01,p,z).e)/.02,
   dp=(f(x,p*1.0001,z).e-f(x,p*.9999,z).e)/(p*.0002),
   dz=(f(x,p,z+1e-6).e-f(x,p,z-1e-6).e)/2e-6,
   dRz=(f(x,p,z+1e-6).R-f(x,p,z-1e-6).R)/2e-6,
   er=Math.max(Math.abs(a.eT/dT-1),Math.abs(a.ep/dp-1),Math.abs(a.ez/dz-1),Math.abs(a.Rz/dRz-1));
  chkB(29,'補間した e_b，R_b の偏微分が，補間した関数の中心差分に一致（相対 1e-6）',er<1e-6,er.toExponential(1))
 }
/* 6：閉じた断熱の系（弁が閉じている IVC〜EVO，熱損失なし，回転数固定）．既定の許容誤差と，許容誤差を絞った場合 */
 for(const[nm,ph,as,rt,lim]of[['φ = 1.0，既定の許容誤差',1,1,1e-5,1e-4],['φ = 1.0，rtol 1e-10・atol 1e-6 倍',1,1e-6,1e-10,1e-6],['φ = 1.2，rtol 1e-10・atol 1e-6 倍',1.2,1e-6,1e-10,1e-6]]){
  const c=new Core({...mkPT(),...SPP,cw:0,phi:ph,rtol:rt,sauto:0});
  c.fixw=1;
  c.fixTw=1;
  c.atS=as;
  c.start();
  const y=c.s.y,th=c.V.gA+2*D,V=kinV(c.G,th),f=ph/(T.AF+ph),m=1e5*V/(((1-f)*T.Ra+f*T.Rf)*350);
  y[0]=th;
  y[1]=3000*PI/30;
  y[2]=1e5;
  y[3]=m;
  y[4]=m;
  y[38]=f*m;
  c.s.ig=0;
  const a=c.cyl(y),W0=y[18];
  let n=0,Tm=0;
  while(c.s.y[0]<c.V.gB-2*D&&c.s.y[0]>=th){c.step();Tm=Math.max(Tm,c.X.T);if((++n&3)===0&&RUN.over())yield}
  const b=c.cyl(c.s.y),dW=c.s.y[18]-W0,rr=Math.abs(b.U-a.U+dW)/Math.abs(dW);
  chkB(29,`閉じた断熱の系（${nm}，IVC→燃焼→EVO）：U + ∫p dV の変化が仕事の ${lim.toExponential(0)} 以下`,rr<=lim&&Tm>2400&&b.mb>.9*m&&c.s.clp===0,`相対 ${rr.toExponential(1)}（${n} ステップ，T_max ${Tm.toFixed(0)} K，既燃 ${(b.mb/m*100).toFixed(1)} %）`,`≤ ${lim.toExponential(0)}，燃焼あり`)
 }
/* 7：周期定常の第一法則（SPEC-29 B の 8） */
 for(const nm of['S2','S3','W3000','G3000D']){
  const sc=yield*scen(nm),
   q=sc.c.clone(),
   r=yield*runCyc(q,5),
   dU=q.cyl(r.y1).U-q.cyl(r.y0).U,
   res=dU+r.d(18)+r.d(32)-r.d(33)+r.d(34)-r.d(43),
   mfH=r.d(44)*K.Hu;
  chkB(29,`第一法則の収支（化学平衡，${nm}，5 サイクル）：|ΔU + ΔW + ΔQ_w − ΔH_i + ΔH_o − ΔH_e| ≤ 10⁻⁴ m_f H_u`,Math.abs(res)<=1e-4*mfH&&mfH>0&&q.s.clp===0,`残差 ${res.toExponential(2)} J（m_f H_u ${mfH.toFixed(1)} J，比 ${(res/mfH).toExponential(1)}）`)
 }
/* 8：γ(T)・ポート噴射で第25版と一致 */
 {
  const sc=yield*scen('S2G');
  chk(29,'γ(T)，ポート噴射，弁 1 個ずつ（38 mm，38×0.9375 mm），消音器 3 L と出口 300 mm²，排気圧損 4 kPa：S2 の IMEP が第25版の値（Chromium で 108073.557 Pa，Node.js で 108074.077 Pa）に一致（相対 1e-4）[Pa]',IMEP25,sc.c.lastM.imep,1e-4)
 }
/* 9：リッチでの出力増（直噴，全開，点火時期は自動最適化，回転数固定．性能曲線と同じ手順，厳格・流量判定 ON） */
 {
  const ph=[.9,1,1.1,1.2,1.3],tb=[[],[]];
  let ok=1;
  for(const f of ph){
   const S=new Sweep({...mkPT(),...SPD,phi:f},[2000,4000],90,{crit:'strict',flow:true,proc:'up'});
   while(!S.run(10))yield;
   S.pts.forEach((q,i)=>{tb[i].push(q.tb);if(!q.ok)ok=0})
  }
  [2000,4000].forEach((N,i)=>{
   const v=tb[i],im=v.indexOf(Math.max(...v));
   chkB(29,`リッチでの出力増（直噴，全開，${N} rpm）：T_b(1.1) > T_b(1.0) > T_b(0.9) で，φ = 0.9〜1.3 のうち最大は 1.1 か 1.2`,ok&&v[2]>v[1]&&v[1]>v[0]&&(im===2||im===3),ph.map((f,k)=>`φ${f} ${v[k].toFixed(2)}`).join('，')+` N·m（φ = 1 比 ${((v[im]/v[1]-1)*100).toFixed(1)} %）`,'全点が整定')
  })
 }
/* 10：表の温度の範囲の外（SPEC-29 A の 6） */
 {
  const z=1/(1+K.etac*GAS.AF),
   b=T=>GAS.burned(T,1e5,z,{}),
   lo=b(240),
   l0=b(250),
   hi=b(3600),
   h0=b(3500),
   e1=Math.abs(lo.e-(l0.e-10*l0.eT))/Math.abs(l0.e),
   e2=Math.abs(hi.e-(h0.e+100*h0.eT))/Math.abs(h0.e);
  chkB(29,'表の温度の範囲の外：φ_r = 1，100 kPa で，240 K の c_v,b が 250 K の値と一致して正，e_b(240) = e_b(250) − 10 c_v,b(250)．3600 K でも e_b(3600) = e_b(3500) + 100 c_v,b(3500)（相対 1e-12）',lo.eT===l0.eT&&lo.eT>0&&e1<=1e-12&&hi.eT===h0.eT&&e2<=1e-12,`c_v,b ${lo.eT.toFixed(2)}／${l0.eT.toFixed(2)}，${hi.eT.toFixed(2)}／${h0.eT.toFixed(2)} J/(kg·K)，差 ${e1.toExponential(1)}，${e2.toExponential(1)}`)
 }
/* 13：既定の解法（BS3）での周期定常の第一法則（項目 7 は DOPRI5）．アイドル（スロットル制御），動力計制御の部分負荷，全開 */
 for(const nm of['S2','S4','W3000']){
  const sc=yield*scen(nm),q=sc.c.clone();
  q.P.sol=2;
  yield*runCyc(q,3);
  const r=yield*runCyc(q,5),
   dU=q.cyl(r.y1).U-q.cyl(r.y0).U,
   res=dU+r.d(18)+r.d(32)-r.d(33)+r.d(34)-r.d(43),
   mfH=r.d(44)*K.Hu;
  chkB(29,`第一法則の収支（化学平衡，既定の解法 BS3，${nm}，5 サイクル）：|ΔU + ΔW + ΔQ_w − ΔH_i + ΔH_o − ΔH_e| ≤ 10⁻⁴ m_f H_u`,Math.abs(res)<=1e-4*mfH&&mfH>0&&q.s.clp===0&&q.s.nfa===sc.c.s.nfa,`残差 ${res.toExponential(2)} J（m_f H_u ${mfH.toFixed(1)} J，比 ${(res/mfH).toExponential(1)}）`)
 }
/* 11：平衡の解の収束と，解けない連立方程式（REQ-29 の 9） */
 {
  const ec=K.etac,g0=T.stat.sg,sg=T.solve([[1,2],[2,4]],[1,2],2),r2=T.solve([[2,1],[1,3]],[3,5],2),cnt=T.stat.sg-g0;
  T.stat.sg=g0;
  let nb=0,n=0;
  for(const ph of[0,.25,.5,.75,1,1.25,1.5])for(const Tk of[T.Tfr,1500,2500,3500])for(const p of[2e4,1e5,2e6,2e7]){n++;if(!T.eq(Tk,p,T.phi2z(ph/ec),ec).ok)nb++}
  chkB(29,`平衡の解の収束：表の範囲の標本 ${n} 点（φ_r 0〜1.5，${T.Tfr}〜3500 K，20 kPa〜20 MPa）ですべて収束．特異な行列は「解けない」と返して数える．正則な行列は解く`,nb===0&&sg===null&&cnt===1&&!!r2&&Math.abs(r2[0]-.8)<=1e-12&&Math.abs(r2[1]-1.4)<=1e-12,`未収束 ${nb}／${n}，特異：${sg===null?'解けない':'解いた'}`)
 }
/* 12：運転中に熱物性を切り替えたサイクルは平均に入れない（REQ-29 の 10） */
 {
  const out=[];
  let ok=true;
  for(const[g0,g1]of[[2,0],[0,2]]){
   const c=new Core({...mkPT(),gam:g0,mode:1,alm:90*D,nt:3000});
   c.start();
   yield*runCyc(c,14);
   const n0=c.s.Mh.length;
   let g=0;
   while(!(md4(c.s.y[0])>2*PI&&md4(c.s.y[0])<2*PI+1)&&g++<20000)c.step();
   c.P.gam=g1;
   const end=()=>{const cb=c.s.cyc;let q=0;while(c.s.cyc===cb&&q++<20000)c.step()};
   end();
   const a=c.s.Mx===null&&c.s.Mh.length===0;
   yield;
   end();
   const b=c.s.Mx!==null&&c.s.Mh.length===1;
   if(!(n0>=2&&a&&b))ok=false;
   out.push(`${g0} → ${g1}：切替の前 ${n0} サイクル，切り替えたサイクルの後 ${a?'平均なし':'平均あり'}，次のサイクルの後 ${c.s.Mh.length} サイクル`)
  }
  chkB(29,'熱物性を運転中に切り替えたサイクルは平均に入れない（全開 3000 rpm，サイクルの途中で化学平衡 → γ(T)，γ(T) → 化学平衡）：そのサイクルの終わりに平均が空，次のサイクルから数える',ok,out.join('；'))
 }
/* 14：凍結の温度の下の区間（SPEC-29 A の 6）：T_fr − 50 K から T_fr までは凍結の側で，R_b は一定，∂R_b/∂T = 0，c_v は温度とともに減らない */
 {
  const o=mkGB(),bad=[];
  for(const ph of[.7,1,1.3])for(const p of[2e5,5e6]){
   const z=GAS.phi2z(ph);
   GAS.burned(1650,p,z,o);
   const R0=o.R;
   let cv0=o.eT,wR=0,wQ=0,dn=0;
   for(let T=1652;T<1700;T+=2){
    GAS.burned(T,p,z,o);
    wR=Math.max(wR,Math.abs(o.R/R0-1));
    wQ=Math.max(wQ,Math.abs(o.RT));
    if(o.eT<cv0-1e-9)dn=Math.max(dn,cv0-o.eT);
    cv0=o.eT
   }
   if(!(wR<=1e-12&&wQ===0&&dn===0))bad.push(`φ ${ph}，${p/1e3} kPa：R の変化 ${wR.toExponential(1)}，最大の |∂R/∂T| ${wQ.toExponential(1)}，c_v の減り ${dn.toFixed(3)}`)
  }
  chkB(29,'凍結の温度の下（1650〜1700 K）：既燃ガスの R_b が一定（相対 1e-12），∂R_b/∂T = 0，c_v が温度とともに減らない（φ 0.7，1，1.3，200 kPa と 5 MPa）',bad.length===0,bad.join('；')||'6 / 6')
 }
/* 15：表の当量比の範囲（REQ-29 の 11）．始動の直後（ポート噴射では吸気ポートに燃料がまだ無い）から 1 s，当量比の設定の下限と上限で，物性を求めた φ_r が表の外に出ない */
 {
  const r=[];
  for(const inj of[0,1])for(const phi of[.6,1.4]){
   const c=new Core({...mkP(),cvar:0,gam:2,inj,phi}),n0=GAS.stat.of;
   c.start();
   yield*runC(c,1);
   r.push([inj,phi,GAS.stat.of-n0,c.s.cyc,c.s.div])
  }
  chkB(29,'表の当量比の範囲：ポート噴射と直噴，φ 0.6 と 1.4，始動から 1 s で，既燃ガスの物性を求めた φ_r が表の範囲の外に出た回数が 0',r.every(q=>q[2]===0&&q[3]>=5&&!q[4]),r.map(q=>`${q[0]?'直噴':'ポート噴射'} φ ${q[1]}：${q[2]} 回（${q[3]} サイクル）`).join('／'))
 }
};
TST[30]=function*(){
 const A=GAS;
 if(!RUN.ui){/* 1：噴射量と収支 */
  {
   const sc=yield*scen('G3000D'),
    q=sc.c.clone(),
    r=yield*runCyc(q,1),
    mc=q.s.mfc,
    e1=Math.abs(r.d(44)/mc-1),
    e2=Math.abs(r.d(44)-r.d(45)-r.d(40))/mc,
    e3=Math.abs(r.d(45)+r.d(46)-r.d(47)-r.d(48)-r.d(38))/mc;
   chkB(30,'直噴，全開，3000 rpm の 1 サイクル：∫ṁ_inj dt = m_f,cmd（相対 1e-9）',e1<=1e-9&&mc>1e-5,`${e1.toExponential(1)}（m_f,cmd ${(mc*1e6).toFixed(3)} mg）`);
   chkB(30,'∫ṁ_inj dt − ∫ṁ_ev dt = Δm_l（m_f,cmd に対して相対 1e-9）',e2<=1e-9,e2.toExponential(1));
   chkB(30,'筒内の燃料蒸気の収支：気化 ＋ 吸気弁の正味の流入 − 排気弁からの流出 − 燃焼 = Δm_f（相対 1e-9）',e3<=1e-9&&q.s.clp===0,`${e3.toExponential(1)}（噴射に対して：燃焼 ${(r.d(48)/mc*100).toFixed(2)} %，排気弁から ${(r.d(47)/mc*100).toFixed(2)} %，吸気弁の正味 ${(r.d(46)/mc*100).toFixed(2)} %）`)
  }
/* 2：イベントの角度と噴射の幅 */
  {
   const sc=yield*scen('G3000D'),q=sc.c.clone();
   let on=q.s.inj.on,e0=1,e1=1,n0=0,n1=0,k=0;
   const c0=q.s.cyc;
   while(q.s.cyc<c0+2){
    q.step();
    const J=q.s.inj,th=md4(q.s.y[0]);
    if(J.on&&!on){n0++;e0=Math.abs(th-md4(q.P.soi))}
    if(!J.on&&on){n1++;e1=Math.abs(th-md4(J.th0+J.dth))}
    on=J.on;
    if((++k&3)===0&&RUN.over())yield
   }
   chkB(30,'噴射の開始と終了で，ステップの終端の角度が θ_SOI，θ_SOI + Δθ_inj に一致（1e-8 rad）',n0===2&&n1===2&&e0<=1e-8&&e1<=1e-8,`開始 ${n0} 回 ${e0.toExponential(1)}，終了 ${n1} 回 ${e1.toExponential(1)} rad`);
   for(const nm of['G1000D','G7000D']){
    const s2=yield*scen(nm),J=s2.c.s.inj,w=s2.c.s.y[1],ref=w*J.m/s2.c.P.qinj;
    chkB(30,`${nm.slice(1,5)} rpm：Δθ_inj = ω_SOI m_f,cmd / q_inj（相対 1e-9，上下限に掛からない）`,Math.abs(J.dth/ref-1)<=1e-9&&J.dth>D&&J.dth<300*D&&J.m>0,`${(J.dth/D).toFixed(2)}°`)
   }
  }
/* 3：潜熱（容積固定，断熱．液体の燃料を置いて全量を気化させる．右辺を時間について RK4 で積分） */
  {
   const c=new Core({...mkPT(),...SPD,cw:0});
   c.fixTw=1;
   const th=c.V.gA+40*D,V=kinV(c.G,th),ma=1e5*V/(A.Ra*320),ml=.0645*ma,y=c.s.y.slice();
   y[0]=th;
   y[1]=0;
   y[2]=1e5;
   y[3]=ma;
   y[4]=ma;
   y[40]=ml;
   for(const i of[7,10,16,17,38,39,41,42])y[i]=0;
   c.fixw=1;
   const h=c.P.tev/400,N=16000,k1=new Array(NY),k2=new Array(NY),k3=new Array(NY),k4=new Array(NY),w=new Array(NY);
   for(let n=0;n<N;n++){
    c.f(y,k1);
    for(let i=0;i<NY;i++)w[i]=y[i]+h/2*k1[i];
    c.f(w,k2);
    for(let i=0;i<NY;i++)w[i]=y[i]+h/2*k2[i];
    c.f(w,k3);
    for(let i=0;i<NY;i++)w[i]=y[i]+h*k3[i];
    c.f(w,k4);
    for(let i=0;i<NY;i++)y[i]+=h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);
    if((n&1023)===0&&RUN.over())yield
   }
   const T1=c.cyl(y).T,U0=ma*A.ea(320)+ml*(A.hf(A.Tl)-A.hfg);
   let Tr=320;
   for(let i=0;i<60;i++)Tr-=(ma*A.ea(Tr)+ml*A.ef(Tr)-U0)/(ma*A.cva(Tr)+ml*A.cvf(Tr));
   chkB(30,'潜熱：320 K，100 kPa の空気に質量の 6.45 % の液体の燃料が全量気化．温度が m_a e_a(T) + m_f e_f(T) = m_a e_a(320) + m_f [h_f(T_l) − h_fg] の解に一致（1e-6 K）',Math.abs(T1-Tr)<=1e-6&&y[40]<1e-15*ml+1e-20&&Math.abs(y[38]/ml-1)<1e-12,`${T1.toFixed(7)} K（解 ${Tr.toFixed(7)} K，低下 ${(320-T1).toFixed(2)} K）`)
  }
/* 4：時定数 0 */
  {
   const c=new Core(Object.assign(mkPT(),{sauto:1,mode:1,alm:90*D,nt:3000,tev:0},SPD));
   c.fixw=1;
   c.fixTw=1;
   c.s.y[1]=3000*PI/30;
   c.s.Nb=3000;
   c.start();
   let mx=0,ni=0,bad=0,k=0;
   while(c.s.cyc<3){
    c.step();
    mx=Math.max(mx,Math.abs(c.s.y[40]));
    if(c.X.minj>0){ni++;if(c.X.mev!==c.X.minj)bad++}
    if((++k&3)===0&&RUN.over())yield
   }
   chkB(30,'τ_ev = 0：噴射の間も m_l = 0，ṁ_ev = ṁ_inj',mx===0&&ni>10&&bad===0,`m_l の最大 ${mx} kg，噴射中のステップ ${ni}，不一致 ${bad}`)
  }
/* 5：点火の時点の当量比 */
  {
   const o=[];
   for(const[nm,ph]of[['G3000D09',.9],['G3000D',1],['G3000D12',1.2]]){const sc=yield*scen(nm);o.push([ph,sc.c.lastM.phc])}
   chkB(30,'直噴，全開，3000 rpm の定常：φ_c が設定 φ（0.9，1.0，1.2）の ±5 % 以内',o.every(q=>Math.abs(q[1]/q[0]-1)<=.05),o.map(q=>`${q[0]}→${q[1].toFixed(4)}`).join('，'))
  }
/* 6：直噴の冷却 */
  {
   const d=(yield*scen('G3000D')).c.lastM,pf=(yield*scen('G3000P')).c.lastM,dT=pf.Tivc-d.Tivc,dm=d.ma/pf.ma-1;
   chkB(30,'全開，3000 rpm，φ = 1：直噴はポート噴射より IVC の筒内温度が 10 K 以上低く，空気量が 3 % 以上多い',dT>=10&&dm>=.03,`ΔT ${dT.toFixed(1)} K（${pf.Tivc.toFixed(1)} → ${d.Tivc.toFixed(1)} K），空気 ${(dm*100).toFixed(2)} % 増`,'≥ 10 K，≥ 3 %')
  }
 }
/* 7：設定ページ「噴射」の無効化 */
 {
  uiDefault();
  show(2);
  U.pg=PAGES.indexOf('噴射');
  U.x10=0;
  rs();
  yield;
  const row=k=>$('Pg').querySelector(`[data-k="${k}"]`).closest('.r'),
   lab=k=>row(k).querySelector('span').textContent,
   bt=k=>[...row(k).querySelectorAll('button')],
   dis=k=>bt(k).every(b=>b.disabled),
   en=k=>bt(k).some(b=>!b.disabled),
   fit=k=>{const s=row(k).querySelector('span');return s.scrollWidth<=s.clientWidth+1},
   ks=['inj','soi','qinj','tev'],
   n4=ITEMS.filter(i=>i.pg===U.pg).length,
   r=[];
  r.push(n4===4&&ks.every(en)&&!ks.some(k=>lab(k).includes('（不使用）'))&&row('inj').querySelector('button.on').textContent==='直噴');
  const f0=ks.every(fit);
  LP.gam=0;
  rs();
  yield;
  const v0=ks.map(k=>LP[k]);
  for(const k of ks)for(const b of bt(k))tapEl(b);
  r.push(ks.every(dis)&&ks.every(k=>lab(k).includes('（不使用）'))&&row('inj').querySelector('button.on').textContent==='ポート噴射'&&ks.every((k,i)=>LP[k]===v0[i]));
  const f1=ks.every(fit),
   fw=f1?'':'（'+ks.filter(k=>!fit(k)).map(k=>{const s=row(k).querySelector('span');return k+' '+s.scrollWidth+'/'+s.clientWidth}).join('，')+'）';
  LP.gam=2;
  LP.inj=0;
  rs();
  yield;
  r.push(en('inj')&&!lab('inj').includes('（不使用）')&&['soi','qinj','tev'].every(k=>dis(k)&&lab(k).includes('（不使用）')));
  LP.inj=1;
  rs();
  yield;
  r.push(ks.every(en));
  tapEl(row('soi').querySelector('button[data-s="1"]'));
  r.push(Math.abs(LP.soi-85*D)<1e-12);
  chkB(30,'設定「噴射」：4 項目．熱物性 γ(T) で 4 行とも（不使用）・無効（押しても値が変わらず，噴射方式はポート噴射と表示），化学平衡・ポート噴射で噴射開始・インジェクタ流量・気化の時定数が（不使用），化学平衡・直噴で有効，文字が欠けない',r.every(x=>x)&&f0&&f1,`${r.map(x=>x?1:0).join('')}，幅 ${f0?1:0}${f1?1:0}${fw}`);
  uiDefault()
 }
/* 8：パネルの文字と，運転中の熱物性の切り替え */
 {
  const sc=yield*scen('S2'),
   c=sc.c.clone(),
   t1=injText(c),
   ok1=/^噴射 80°〜[\d.]+°（幅 [\d.]+°）  [\d.]+ mg  φ_c [\d.]+$/.test(t1);
  c.P.inj=0;
  yield*runC(c,.5);
  const t2=injText(c),ok2=t2.includes('ポート噴射')&&/φ_c [\d.]+/.test(t2);
  const q=sc.c.clone(),p0=q.s.y[2];
  q.P.gam=0;
  q.syncSw();
  const p1=q.s.y[2],m1=q.s.y[3],f1=fin(q)&&q.s.y[38]===0&&q.s.y[40]===0;
  yield*runC(q,2);
  const a=q.s.fired&&fin(q),Na=q.s.Nb;
  const p2=q.s.y[2];
  q.P.gam=2;
  q.syncSw();
  const p3=q.s.y[2],f2=fin(q)&&q.s.y[38]>=0;
  yield*runC(q,2);
  const b=q.s.fired&&fin(q)&&q.s.clp===0;
  chkB(30,'ページ「噴射」のパネルの文字：直噴で噴射の角度・m_f,cmd・φ_c，ポート噴射で「ポート噴射」',ok1&&ok2,`${t1} ／ ${t2}`);
  chkB(30,'運転中の熱物性の切り替え（S2 から 化学平衡 → γ(T) → 化学平衡，各 2 s）：切り替えの前後で筒内圧が一致，状態が有限，失火しない',Math.abs(p1/p0-1)<=1e-12&&Math.abs(p3/p2-1)<=1e-12&&f1&&f2&&a&&b,`Δp ${(p1/p0-1).toExponential(1)}，${(p3/p2-1).toExponential(1)}，N̄ ${Na.toFixed(0)} → ${q.s.Nb.toFixed(0)} rpm，判定 ${[f1,f2,a,b].map(x=>x?1:0).join('')}，射影 ${q.s.clp}`)
 }
 if(!RUN.ui){/* 9：ECU の空気量の見積もり（式の値と，過渡で機関がその式を使っていること） */
  {
   const Vd=5e-4,
    rf=[
     [ecuAir(NaN,1,9e4,0,Vd),9e4*Vd/(A.Ra*TI)],
     [ecuAir(4e-4,5e-4,9e4,0,Vd),4e-4],
     [ecuAir(4e-4,5e-4,1.1e5,1e5,Vd),4e-4+5e-4*(1.1e5/1e5-1)],
     [ecuAir(1e-5,5e-4,5e4,1e5,Vd),0]
    ],
    e0=Math.max(...rf.map(([v,r])=>Math.abs(v-r)/(r||1)));
   const sc=yield*scen('S2'),q=sc.c.clone();
   q.P.nt=2000;
   let on=q.s.inj.on,k=0,e1=0,mx=0,n=0;
   while(k<8&&n<2e5){
    q.step();
    n++;
    const z=q.s;
    if(z.inj.on&&!on){
     k++;
     const pi=z.pSn/z.pS;
     e1=Math.max(e1,Math.abs(z.mfc-q.P.phi*ecuAir(z.mah,z.mtI,z.pSn,z.pS,q.G.Vd)/A.AF)/z.mfc);
     mx=Math.max(mx,Math.abs(pi-1))
    }
    on=z.inj.on;
    if((n&3)===0&&RUN.over())yield
   }
   chkB(30,'ECU の空気量の見積もり：m̂_a の式の 4 つの場合（最初の IVC の前，前の噴射なし，π_S = 1.1，負になる場合は 0）が相対 1e-12 で一致．アイドルから目標 2000 rpm へ上げた過渡の 8 回の噴射で，m_f,cmd = φ m̂_a/AF_st（相対 1e-12），|π_S − 1| の最大 ≥ 0.05',e0<=1e-12&&k===8&&e1<=1e-12&&mx>=.05,`式 ${e0.toExponential(1)}，過渡 ${e1.toExponential(1)}（${k} 回），|π_S − 1| の最大 ${mx.toFixed(3)}`)
  }
/* 10：噴射の幅の下限（1°）と上限（300°） */
  {
   const lo=(yield*scen('S2')).c.clone();
   lo.P.qinj=40e-3;
   yield*runCyc(lo,3);
   const dl=lo.s.inj.dth,el=Math.abs(lo.lastM.minj/lo.s.mfc-1),wl=lo.s.y[1]*lo.s.mfc/lo.P.qinj;
   const N=2000,
    hi=new Core(Object.assign(mkPT(),{B:.15,S:.15,lr:.3,dv:.05,dve:.05,Lv:.014,sauto:1,mode:1,alm:90*D,nt:N,qinj:5e-3},SPD));
   hi.fixw=1;
   hi.fixTw=1;
   hi.s.y[5]=SWC.Tw;
   hi.s.y[1]=N*PI/30;
   hi.s.Nb=N;
   hi.start();
   yield*runCyc(hi,6);
   const dh=hi.s.inj.dth,eh=Math.abs(hi.lastM.minj/hi.s.mfc-1),wh=hi.s.y[1]*hi.s.mfc/hi.P.qinj,tx=injText(hi);
   chkB(30,'噴射の幅の下限と上限：アイドルで q_inj = 40 g/s にすると幅がちょうど 1°，ボア・ストローク 150 mm（連桿長 300 mm，吸気弁径・排気弁径 50 mm，最大リフト 14 mm）の全開 2000 rpm で q_inj = 5 g/s にすると幅がちょうど 300° で，どちらも 1 サイクルに噴いた質量が m_f,cmd に一致（相対 1e-9）．上限のときパネルの文字に「幅が上限」',dl===D&&wl<D&&el<=1e-9&&dh===300*D&&wh>300*D&&eh<=1e-9&&tx.includes('幅が上限')&&!injText(lo).includes('幅が上限'),`下限：幅 ${(dl/D).toFixed(3)}°（ω m/q = ${(wl/D).toFixed(2)}°），質量の差 ${el.toExponential(1)}．上限：幅 ${(dh/D).toFixed(1)}°（ω m/q = ${(wh/D).toFixed(0)}°），質量の差 ${eh.toExponential(1)}．「${tx}」`)
  }
/* 11：運転中の噴射方式の切り替え（状態は置き直さない） */
  {
   const q=(yield*scen('S2')).c.clone(),
    rec=function*(T){
     let mn=1e9,st=1;
     const w=[],t0=q.s.t;
     yield*runC(q,T,{tick(c){mn=Math.min(mn,c.s.Nb);if(!c.s.fired||!c.s.fuel)st=0;if(c.s.t>t0+T-2)w.push(c.s.Nb)}});
     return{mn,st,dev:mdev(w,800)}
    };
   q.P.inj=0;
   const a=yield*rec(6);
   q.P.inj=1;
   const b=yield*rec(6);
   chkB(30,'運転中の噴射方式の切り替え（アイドル．直噴 → ポート噴射 6 s → 直噴 6 s）：止まらない（N̄ の最小 ≥ 550 rpm），状態が有限．直噴へ戻して最後の 2 s は 800 ± 40 rpm',a.st&&b.st&&a.mn>=550&&b.mn>=550&&fin(q)&&b.dev<=40,`直噴 → ポート噴射：N̄ の最小 ${a.mn.toFixed(0)} rpm（最後の 2 s の偏差 ${a.dev.toFixed(1)} rpm）．ポート噴射 → 直噴：最小 ${b.mn.toFixed(0)} rpm，最後の 2 s の偏差 ${b.dev.toFixed(1)} rpm`)
  }
 }
 ;
}
/* TEST-31：全体図（SPEC-31） */
TST[31]=function*(){
 uiDefault();
 const Bx=e=>e.getBoundingClientRect(),
  cv=document.createElement('canvas'),
  g=cv.getContext('2d'),
  mk=o=>{const c=new Core(Object.assign(mkPT(),o||{}));c.start();for(let i=0;i<300;i++)c.step();return c};
/* 1：開く・戻る（上のタブには無い．運転タブの [全体図] から） */
 {
  const nb=[...$('N').children],q=[];
  show(0);
  yield 'frame';
  const bo=$('bsys'),ew=$('ew');
  q.push(!nb.some(b=>b.textContent.includes('全体')||+b.dataset.t===6));
  q.push(!!bo&&!!ew&&bo.textContent==='全体図'&&vis(bo)&&Bx(bo).width>=43.5&&Bx(bo).height>=43.5&&txtW(bo)<=.95*room(bo)&&Bx(bo).top>=Bx(ew).top-.5&&Bx(bo).right<=Bx(ew).right+.5&&Bx(bo).left>Bx(ew).left+Bx(ew).width/2);
  if(bo)tapEl(bo);
  yield 'frame';
  const sc=$('s6'),
   cvs=sc.querySelectorAll('canvas'),
   r=Bx($('sys')),
   rs6=Bx(sc),
   bk=$('bback'),
   on=nb.filter(b=>b.className==='on');
  q.push(U.tab===6&&sc.className==='on'&&on.length===1&&on[0].textContent.includes('運転'));
  q.push(cvs.length===1&&rs6.bottom-r.bottom<=8&&sc.scrollHeight<=sc.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1&&!!bk&&vis(bk)&&Bx(bk).height>=43.5&&sc.querySelectorAll('button').length===1);
  if(bk)tapEl(bk);
  yield 'frame';
  q.push(U.tab===0&&$('s0').className==='on');
  chkB(31,'開く・戻る：上のタブに「全体」が無い．運転タブの断面図の右上の [全体図]（44 px 以上，文字が収まる）で全体図に切り替わり，上のタブは「運転」のまま．全体図は [◀ 運転] と Canvas 1 つ（下端まで 8 px 以内，スクロールなし）．[◀ 運転] で戻る',q.every(x=>x),q.map(x=>x?1:0).join(''))
 }
/* 2：要素の一覧 */
 {
  const W=380,
   H=560,
   c0=mk(),
   A=sysSpec(c0,W,H,g).el,
   sigs=A.sig.map(o=>o.to).sort().join(),
   need=['atm','thr','man','runner','inj','spark','exPipe','out','fly','dyno','st','aux','ecu'],
   miss=need.filter(k=>!A[k]),
   cR=mk({run:0}),
   R=sysSpec(cR,W,H,g).el,
   cE=mk({exs:0}),
   E=sysSpec(cE,W,H,g).el,
   cP=mk({inj:0}),
   Pn=sysSpec(cP,W,H,g).el;
  const ok=miss.length===0&&A.inj.at==='cyl'&&sigs==='dyno,inj,spark,thr'&&!R.runner&&!!R.short&&!E.exPipe&&!E.out&&!!E.back&&!A.muf&&Pn.inj.at==='port';
  chkB(31,'要素の一覧：既定の系統図に 13 要素（消音器は無く，排気管の出口は大気開放）と 4 本の信号線．ランナ OFF で短い管，排気系 OFF で背圧，ポート噴射でインジェクタがポート',ok,`不足 ${miss.join(',')||'なし'}，信号 ${sigs}，インジェクタ ${A.inj.at}／${Pn.inj.at}`)
 }
/* 3：寸法と状態の反映 */
 {
  const W=380,H=560,c=mk({dr:.03,dex:.05}),e=[];
  for(const a of[0,6.9,45,90]){c.s.al=a*D;const t=sysSpec(c,W,H,g).el.thr;e.push(Math.abs(t.ang-(90-a)*D)/((90-a)*D||1))}
  const A=sysSpec(c,W,H,g),
   el=A.el,
   rp=Math.abs(el.inPipe.w/el.runner.w-c.P.Dt/c.P.dr)/(c.P.Dt/c.P.dr)+Math.abs(el.exPipe.w/el.runner.w-c.P.dex/c.P.dr)/(c.P.dex/c.P.dr),
   rv=Math.abs(el.vin.d/el.vex.d-c.V.i.d/c.V.e.d)/(c.V.i.d/c.V.e.d),
   lv=[];
  for(const u of[0,.5,-.5,1]){
   const Tm=dynMax(c.P,c.s.y[1]);
   c.s.fe=u*Tm;
   const S=sysSpec(c,W,H,g),d=S.el.dyno,tg=S.tags.find(o=>o.id==='dyno').lines.join('／'),dw=u<0?'駆動':'吸収';
   lv.push(Math.abs(d.arc-2*PI*Math.abs(u))/(2*PI)+(d.dir===dw&&tg.includes(dw)&&tg.includes(Math.abs(c.s.fe).toFixed(1))&&tg.includes('電動')?0:1))
  }
  const q=A.eng.q,
   q0=scene(c,300,400),
   ge=Math.max(Math.abs((q.crownY-q.headY)/q.sc-(q0.crownY-q0.headY)/q0.sc),Math.abs((q.cpin[1]-q.cc[1])/q.sc-(q0.cpin[1]-q0.cc[1])/q0.sc),Math.abs((q.cpin[0]-q.cc[0])/q.sc-(q0.cpin[0]-q0.cc[0])/q0.sc));
  chkB(31,'寸法と状態の反映：板の角 = 90° − α（α = 0，6.9，45，90°），管の太さの比 = D_t : d_r : d_e，弁の傘の幅の比 = 弁径の比（既定で吸気 > 排気），動力計の弧 = 2π|T_d|/T_max と向きの語（T_d = 0，±0.5，1 T_max），断面の位置が運転タブの図と同じ縮尺の比',Math.max(...e)<=1e-9&&rp<=1e-9&&rv<=1e-9&&el.vin.d>el.vex.d&&Math.max(...lv)<=1e-9&&ge<=1e-12,`角 ${Math.max(...e).toExponential(1)}，管 ${rp.toExponential(1)}，弁 ${rv.toExponential(1)}（${(el.vin.d).toFixed(1)}／${(el.vex.d).toFixed(1)} px），動力計 ${Math.max(...lv).toExponential(1)}，位置 ${ge.toExponential(1)} m`)
 }
/* 4：数値の一致（運転中の機関を S2 にして描く） */
 {
  const sc=yield*scen('S2'),sv=live;
  live=sc.c.clone();
  live.step();
  show(6);
  const SA=drawSys(prep($('sys')).g,live,$('sys').clientWidth,$('sys').clientHeight,COL),
   t=id=>SA.tags.find(o=>o.id===id),
   y=live.s.y,
   q=[];
  q.push(SA.man.l3===`${(y[6]/1e3).toFixed(1)} kPa`,t('cyl').lines[1]===`p ${(y[2]/1e6).toFixed(3)} MPa`,t('run2').lines[1]===`N̄ ${live.s.Nb.toFixed(0)} rpm`,!!t('exp')&&t('exp').lines.includes(`T_X ${y[49].toFixed(0)} K`));
  {
   const m0=live.P.mode,f0=live.s.fe,ok=[];
   for(const [mo,fe] of[[0,3],[1,12.34],[1,-4.1]]){
    live.P.mode=mo;
    live.s.fe=fe;
    const e=sysSpec(live,380,560,g).tags.find(o=>o.id==='ecu').lines.join('／'),
     w=`動力計 ${fe<0?'駆動':'吸収'} ${Math.abs(fe).toFixed(1)} N·m`;
    ok.push(!/充水| f /.test(e)&&e.includes(w))
   }
   live.P.mode=m0;
   live.s.fe=f0;
   q.push(ok.every(x=>x))
  }
  live=sv;
  chkB(31,'数値の一致：系統図の p_in，筒内の p，N̄，排気管の T_X が，その時点の状態から作った文字列と一致．ECU の枠の動力計が「動力計 吸収（駆動）x N·m」（充水率の語が無い）',q.every(x=>x),q.map(x=>x?1:0).join(''))
 }
/* 5：重なり無し（現在のビューポートの Canvas の寸法で） */
 {
  show(6);
  yield 'frame';
  const W=$('sys').clientWidth,
   H=$('sys').clientHeight,
   IT_=ITEMS,
   ex=(k,w)=>{const it=IT_.find(i=>i.k===k);return{[k]:(w?it.hi:it.lo)*it.f}},
   cf=[['既定',{}],['ランナ OFF',{run:0}],['排気系 OFF',{exs:0}],['ポート噴射',{inj:0}]];
  for(const k of['B','S','lr','Vin','Lr','dr','Lex','dex'])for(const w of[0,1])cf.push([`${k} ${w?'最大':'最小'}`,ex(k,w)]);
  const bad=[];
  let n=0;
  for(const [nm,o] of cf){
   const c=mk(o),S=sysSpec(c,W,H,g),R=S.tags;
   n+=R.length;
   for(let i=0;i<R.length;i++){
    const a=R[i];
    if(a.x<0||a.y<0||a.x+a.w>W+.5||a.y+a.h>H+.5)bad.push(`${nm}：${a.id} が外`);
    for(let j=i+1;j<R.length;j++){
     const b=R[j];
     if(a.x<b.x+b.w+1&&b.x<a.x+a.w+1&&a.y<b.y+b.h+1&&b.y<a.y+a.h+1)bad.push(`${nm}：${a.id} と ${b.id}`)
    }
   }
   yield
  }
  chkB(31,`重なり無し（${W.toFixed(0)}×${H.toFixed(0)} px，${cf.length} 通りの設定）：数値の枠が互いに 1 px 以上離れ，Canvas の中`,bad.length===0,bad.length?bad.slice(0,4).join('；')+(bad.length>4?` ほか ${bad.length-4} 件`:''):`枠 ${n} 個`)
 }
/* 7：桁の固定．全開・3000 rpm（W3000 の続き）で 2 サイクル，20 ステップごとに記述を作り，動いてはならない量（sysSig）が最初と一致することを確かめる */
 {
  const W=380,H=560,c=(yield*scen('W3000')).c.clone(),c0=c.s.cyc,ref=sysSig(sysSpec(c,W,H,g)),pl=new Set,sgn=new Set;
  let dm=0,n=0,st=0;
  while(c.s.cyc<c0+2){
   c.step();
   if(++st%20)continue;
   const S=sysSpec(c,W,H,g),a=sysSig(S);
   if(a.length!==ref.length)dm=Infinity;else for(let i=0;i<a.length;i++)dm=Math.max(dm,Math.abs(a[i]-ref[i]));
   pl.add(S.tags.find(o=>o.id==='cyl').lines[2].length);
   sgn.add((c.X.mr||0)>=0?1:-1);
   n++
  }
  chkB(31,'桁の固定（全開・3000 rpm，2 サイクル，20 ステップごと）：数値の枠の位置・幅・高さ，数値の欄の右端が，最初の記述と一致（差 0）．筒内の温度の文字列の長さが 2 通り以上，ランナの流量が正と負の両方',dm===0&&pl.size>=2&&sgn.size===2&&c.s.Nb>2900&&c.s.Nb<3100,`最大の差 ${dm} px（${n} 回，量 ${ref.length} 個），温度の文字列の長さ ${[...pl].sort().join('，')} 字，流量の符号 ${sgn.size} 通り，N̄ ${c.s.Nb.toFixed(0)} rpm`)
 }
/* 6：描画の時間 */
 {
  show(6);
  yield 'frame';
  const q=prep($('sys')),t0=performance.now();
  for(let i=0;i<30;i++)drawSys(q.g,live,q.W,q.H,COL);
  const t=(performance.now()-t0)/30;
  chkP(31,'全体図の描画（30 回の平均）',t,6,'ms',2)
 }
/* 8：見出しの色（SPEC-31 A の 5）．噴射の枠は淡い緑．描画が使う色の表の名前がすべて表にある */
 {
  const hc=o=>{
    const t=sysSpec(mk(o),380,560,g).tags.find(q=>q.id==='inj');
    return t?t.hc:''
   },
   h1=hc({gam:2,inj:1}),
   h0=hc({gam:2,inj:0}),
   miss=[...new Set((sysSpec.toString()+drawSys.toString()).match(/SYC\.\w+/g)||[])].map(x=>x.slice(4)).filter(k=>!(k in SYC));
  chkB(31,'見出しの色：直噴とポート噴射のどちらでも，噴射の枠の見出しが淡い緑（#8ce99a）．描画が使う色の表の名前（SYC.…）がすべて表にある',h1==='#8ce99a'&&h0==='#8ce99a'&&!miss.length,`直噴 ${h1}，ポート噴射 ${h0}，表に無い名前 ${miss.join('，')||'なし'}`)
 }
 show(0);
 uiDefault()
};
TST[28]=function*(){
 const s2=yield*scen('S2'),
  c2=s2.c,
  am=avgM(c2.s),
  at=d=>Math.round(d*2)%1440,
  nx=tr=>Math.log(tr.p[at(400)]/tr.p[at(480)])/Math.log(tr.V[at(480)]/tr.V[at(400)]);
 chkB(28,'アイドル（S2）：燃料流量 0.030〜0.050 g/s（10 サイクル平均）',am.mfd>=3e-5&&am.mfd<=5e-5,(am.mfd*1e3).toFixed(4)+' g/s');
 const fa=am.fmep+am.amep;
 chkB(28,'アイドル（S2）：FMEP + AMEP が 90〜130 kPa',fa>=9e4&&fa<=13e4,`${(am.fmep/1e3).toFixed(0)} + ${(am.amep/1e3).toFixed(0)} = ${(fa/1e3).toFixed(0)} kPa`);
 const c=new Core({...mkPT(),nt:2000,Tl:18.5});
 c.start();
 yield*runC(c,14);
 const n2=nx(c.tr);
 chkB(28,'部分負荷（2000 rpm，負荷トルク 18.5 N·m）：膨張のポリトロープ指数 1.20〜1.35',n2>=1.2&&n2<=1.35&&Math.abs(c.s.Nb-2000)<=50,`n = ${n2.toFixed(3)}（N̄ ${c.s.Nb.toFixed(0)}）`);
 const tr=c2.tr;
 let pin=0,bf=0;
 for(let i=60;i<360;i++)pin+=tr.pin[i];
 pin/=300;
 const dt=.5/(6*c2.s.Nb);
 for(let i=0;i<1440;i++)if(tr.me[i]<0)bf-=tr.me[i]*dt;
 const rec=[pin,am.xr,tr.p[at(490)],nx(tr),bf*1e3];
 chkB(28,'記録（判定は有限のみ）：アイドルの吸気管圧，x_r，EVO の筒内圧，膨張の n，排気の逆流量',rec.every(Number.isFinite),`${rec[0].toFixed(1)} kPa，${rec[1].toFixed(2)}，${(rec[2]/1e3).toFixed(3)} MPa，${rec[3].toFixed(2)}，${rec[4].toFixed(1)} mg/サイクル`)
};
/* ---- runner ---- */
const axc=o=>{
 const r={};
 for(const k in o)if(o[k]&&o[k].up)r[k]=Object.assign(Object.create(Object.getPrototypeOf(o[k])),o[k]);
 return r
};
function snapLive(){
 return{
  s:structuredClone(live.s),
  P:{...LP},
  tr:live.tr,
  H:live.H,
  last:live.last,
  lastM:live.lastM,
  X:live.X,
  U:{...U,pend:{...U.pend},cross:U.cross.slice()},
  ref:Base.ref,
  vt:Base.vt,
  tl:Base.tl,
  spd:Sim.spd,
  debt:Sim.debt,
  ax:axc(AX),
  top:$('s4').scrollTop,
  note:$('ts').textContent
 }
}
function restLive(q){
 Object.assign(LP,q.P);
 live.s=structuredClone(q.s);
 live.G=geo(LP);
 live.tr=q.tr;
 live.H=q.H;
 live.last=q.last;
 live.lastM=q.lastM;
 live.X=q.X;
 live.sig=NaN;
 live.updV();
 const keep={busy:U.busy,cancel:U.cancel,uiDraw:U.uiDraw};
 Object.assign(U,q.U,keep);
 Base.ref=q.ref;
 Base.vt=q.vt||null;
 Base.tl=q.tl;
 Sim.spd=q.spd;
 Sim.debt=q.debt;
 AX=axc(q.ax);
 $('ts').textContent=q.note;
 sp();
 $('mp').textContent=U.mpg?'指標2':'指標1';
 setSub(U.sub);
 hapBtn();
 rs()
}
const nextFrame=()=>new Promise(r=>{let d=0;const f=()=>{if(!d){d=1;r()}};requestAnimationFrame(f);setTimeout(f,60)});
const ST={};
/* ---- TEST-32 最適化（バルブタイミング） ---- */
TST[32]=function*(){
 uiDefault();
 const Bx=e=>e.getBoundingClientRect(),o0={m:OP.m,obj:OP.obj,res:OP.res,h:OP.h,run:OP.run};
 OP.run=null;
/* 1：タブとサブタブ */
 {
  const q=[],nb=[...$('N').children],bm=m=>$('opb').querySelector(`button[data-m="${m}"]`);
  show(7);
  for(const m of[2,0]){
   tapEl(bm(m));
   yield 'frame';
   const sc=$('s7');
   q.push(OP.m===m&&[0,2].every(k=>bm(k).className===(k===m?'on':'')&&$('o'+k).className===(k===m?'opv on':'opv'))&&sc.scrollHeight<=sc.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1)
  }
  const bs=[...$('opb').children,...$('oob').children,...$('oac').children];
  q.push($('opb').children.length===2&&nb[4].textContent==='最適化'&&+nb[4].dataset.t===7&&bs.every(b=>Bx(b).height>=43.5&&b.scrollWidth<=b.clientWidth+.5)&&nb.every(b=>Bx(b).width>=43.5&&b.scrollWidth<=b.clientWidth+.5));
  chkB(32,'タブ：上のタブの 5 番目が「最適化」，[バルブタイミング][VVT マップ] の 2 つで切り替わる，ボタン 44 px 以上で文字が収まる，スクロールなし',q.every(x=>x),q.map(x=>x?1:0).join(''))
 }
/* 2：解析的な関数 */
 if(!RUN.ui){
  const b=[-10,264,490,730],
   a=[-30,239,505,750],
   n2=(x,y)=>x.reduce((s,v,i)=>s+(v-y[i])**2,0),
   J=x=>3*Math.exp(-n2(x,a)/1800)+Math.exp(-n2(x,b)/128),
   run=(seed,nmax)=>{
    const g=vtQuad(b,vtOk,{...OPT,seed,nmax:nmax||OPT.nmax});
    let r=g.next(),bad=0;
    while(!r.done){if(!vtOk(r.value.x))bad++;r=g.next(J(r.value.x))}
    return[r.value,bad]
   },
   [R,bad]=run(OPT.seed),
   [R2]=run(OPT.seed),
   sd=Array.from({length:19},(_,i)=>i+1).map(k=>run(k)),
   miss=sd.filter(([q])=>q.x.join()!==a.join()).length,
   nmx=Math.max(R.ne,...sd.map(([q])=>q.ne)),
   bd=bad+sd.reduce((v,[,q])=>v+q,0);
  chkB(32,'探索器（解析的な関数，最大は a = (−30, 239, 505, 750)，x₀ の近くに局所最大）：種 20 通りのすべてで結果 = a，評価 ≤ 200 回，作用角の制約を満たす，同じ種で同じ結果',R.x.join()===a.join()&&miss===0&&nmx<=200&&bd===0&&R2.x.join()===R.x.join()&&R2.ne===R.ne,`${R.x.join('，')}，J ${R.J.toFixed(6)}（x₀ で ${R.J0.toFixed(4)}），評価 ${R.ne} 回（20 通りの最多 ${nmx}），外れ ${miss}，違反 ${bd}`);
/* 6：評価の上限で打ち切られても，探索の前の値が求まっている */
  const cut=[20,60,120].map(n=>run(OPT.seed,n)[0]),
   okc=cut.every(q=>q.stop&&q.ne<=q.hist.length+0&&q.J0===J(b)&&q.J>=q.J0&&vtOk(q.x)&&!q.local);
  chkB(32,'評価の上限（20，60，120 回）で打ち切られても，探索の前の値 J(x₀) が求まっていて，結果の値がそれ以上',okc,cut.map(q=>`${q.ne} 回：J(x₀) ${q.J0.toFixed(4)}，結果 ${q.J.toFixed(4)}`).join('，'))
 }
 yield;
/* 3：評価の条件（S4） */
 const s4=yield*scen('S4');
 if(!RUN.ui){
  const E=new VTEval(s4.c,0),x0=VTK4.map(k=>Math.round(s4.c.P[k]/D)),Tw=E.base.s.y[5];
  E.start(x0,'fine');
  while(!E.run(8))yield;
  const c=E.c,
   ok=Math.abs(c.s.y[1]/(E.N0*PI/30)-1)<=1e-12&&c.s.al===E.al0&&c.P.cvar===0&&c.P.sauto===1&&c.fixTw===1&&c.s.y[5]===Tw&&E.ok;
  chkB(32,'評価の条件（S4）：角速度 = π N̄₀/30（相対 1e-12），開度 = α₀，サイクル変動 OFF，点火の自動最適化 ON，壁温一定，周期定常の判定を満たす',ok,`N̄₀ ${E.N0.toFixed(1)} rpm，α₀ ${(E.al0/D).toFixed(2)}°，${E.h.length} サイクル，T_b ${E.J.toFixed(3)} N·m`)
 }
/* 4：機関での探索（S4，軸トルク最大） */
 if(!RUN.ui){
  const op=new VTOpt(s4.c,0);
  while(!op.run(10))yield;
  const R=op.R,E=new VTEval(s4.c,0),tol=2*(OPT.tol.fine.r*Math.abs(R.J)+OPT.tol.fine.a),nb=[];
  E.start(R.x,'fine');
  while(!E.run(8))yield;
  for(let i=0;i<4;i++)for(const sg of[1,-1]){
   const x=R.x.slice();
   x[i]+=sg;
   if(!E.feas(x)||!vtOk(x)){nb.push(-Infinity);continue}
   E.start(x,'fine');
   while(!E.run(8))yield;
   nb.push(E.J)
  }
  const P={...s4.c.P};
  VTK4.forEach((k,i)=>P[k]=R.x[i]*D);
  const hit=valveHit(P,s4.c.G);
  chkB(32,'機関での探索（S4，軸トルク最大）：8 近傍の J ≤ J* ＋ 許容の 2 倍，J* ≥ J(x₀)，VALVE HIT なし，評価 ≤ 200 回',nb.every(v=>v<=R.J+tol)&&R.J>=R.J0&&!hit&&R.ne<=200,`${R.x0.join('，')} → ${R.x.join('，')}°，T_b ${R.J0.toFixed(3)} → ${R.J.toFixed(3)} N·m，8 近傍の最大の差 ${(Math.max(...nb)-R.J).toExponential(2)}（許容 ${tol.toExponential(1)}），評価 ${R.ne} 回`);
  chkP(32,'機関での探索の所要',op.t/1e3,60,'s',1);
/* 全開 4000 rpm（最適点が探索の前の点から遠い）：上限に達せずに終わり，種を変えても同じ値に着く．機関は既定の解法（BS3）で作る（シナリオの DOPRI5 では 2 回の探索に開発用の計算機で約 55 s かかるため） */
  const c4=new Core({...mkP(),cvar:0,sauto:1,mode:1,alm:90*D,nt:4000}),w=[];
  c4.fixw=1;
  c4.fixTw=1;
  c4.s.y[5]=SWC.Tw;
  c4.s.y[1]=4000*PI/30;
  c4.s.Nb=4000;
  c4.start();
  for(let n=0;c4.s.cyc<45;){c4.step();if((++n&7)===0&&RUN.over())yield}
  for(const seed of[OPT.seed,1]){const o=new VTOpt(c4,0,{...OPT,seed});while(!o.run(10))yield;w.push(o.R)}
  const dj=Math.abs(w[0].J-w[1].J)/Math.abs(w[0].J);
  chkB(32,'機関での探索（全開 4000 rpm，軸トルク最大）：評価の上限（400 回）に達せずに終わり，種を変えた 2 回の結果の値の差が 0.1% 以下',w.every(q=>q&&!q.stop&&q.local&&q.ne<OPT.nmax&&q.J>q.J0)&&dj<=1e-3,`${w.map(q=>`(${q.x.join('，')}) ${q.J.toFixed(3)} N·m，評価 ${q.ne} 回`).join('／')}，差 ${(dj*100).toFixed(4)}%（前 ${w[0].J0.toFixed(3)} N·m）`)
 }
/* 5：画面の操作（S4 の機関で [探索] → [中止] → [適用] → [元に戻す]） */
 {
  const sv=live;
  live=s4.c.clone();
  show(7);
  optSub(0);
  optObj(0);
  const lp0=VTK4.map(k=>LP[k]);
  tapEl($('orn'));
  const st=!!OP.run;
  let mx=0,t=performance.now(),n=0;
  const x00=VTK4.map(k=>Math.round(LP[k]/D)).join();
  while(OP.run&&(OP.run.h.length<2||!OP.run.best||OP.run.best.x.join()===x00)&&n<1500){
   optTick(12);
   optText();
   drawOpt();
   yield 'frame';
   const t1=performance.now();
   mx=Math.max(mx,t1-t);
   t=t1;
   n++
  }
  tapEl($('orn'));
  const stopped=!OP.run&&!!OP.res&&OP.res.part&&$('otb').textContent.includes(String(OP.res.x[1]))&&OP.res.J0===OP.res.J0&&OP.res.J0>-Infinity;
  const x=OP.res?OP.res.x:null;
  tapEl($('oap'));
  const ap=!!x&&VTK4.every((k,i)=>LP[k]===x[i]*D)&&!!U.undo;
  tapEl($('oun'));
  const un=VTK4.every((k,i)=>LP[k]===lp0[i]);
/* 8：燃料を噴いていない運転では探索を始めない（REQ-32 の 9） */
  {
   const fc=s4.c.clone(),rs0=OP.rs,res0=OP.res;
   fc.s.fuel=0;
   live=fc;
   const a=!OP.run&&fc.s.fired&&fc.s.Nb>=300&&!optReady();
   tapEl($('orn'));
   const b=!OP.run&&$('opr').textContent===optWhy()&&optWhy().includes('燃料');
   optText();
   const c2=$('ost').textContent.includes('燃料');
   if(OP.run)optStop();
   OP.rs=rs0;
   OP.res=res0;
   chkB(32,'燃料を噴いていない運転（S4 の機関を燃料カットにしたもの）では [探索] を押しても始まらず，燃料を噴いていない旨を表示する',a&&b&&c2,`${a?1:0}${b?1:0}${c2?1:0}，「${$('opr').textContent}」`)
  }
  live=sv;
  chkB(32,'画面の操作：[探索] で始まり，[中止] で止まって最良の点と探索の前の値を表に出す，[適用] で設定の 4 項目が結果になる，[元に戻す] で戻る',st&&stopped&&ap&&un,`開始 ${st}，中止 ${stopped}，適用 ${ap}，戻す ${un}（${n} フレーム）`);
  chkP(32,'探索中のフレームの間隔（最長）',mx,250,'ms',0)
 }
/* 7：表示の切替，段階の表示，弁時期の図，探索の軌跡（解析的な関数の探索の途中と終わりの記録で） */
 {
  const b=[-10,264,490,730],
   a=[-30,239,505,750],
   n2=(x,y)=>x.reduce((s,v,i)=>s+(v-y[i])**2,0),
   J=x=>3*Math.exp(-n2(x,a)/1800)+Math.exp(-n2(x,b)/128),
   mk=stop=>{
    const S={},g=vtQuad(b,vtOk,OPT,S);
    let r=g.next(),h=[],best=null;
    while(!r.done&&h.length<stop){
     const v=J(r.value.x);
     h.push({J:v,cls:r.value.cls,x:r.value.x});
     if(!best||v>best.J)best={x:r.value.x,J:v};
     r=g.next(v)
    }
    return{S,h,best,x0:b,req:r,done:r.done,E:{obj:0,nu:0},t:0}
   },
   mid=mk(60),
   end=mk(1e9),
   sv={run:OP.run,rs:OP.rs,v:OP.v,h:OP.h},
   q=[];
  show(7);
  optSub(0);
  OP.run=mid;
  OP.rs=mid;
  OP.h=mid.h;
  optText();
  for(const v of[1,2,0]){
   tapEl($('ovb').children[v]);
   yield 'frame';
   const sc=$('s7');
   q.push(OP.v===v&&[...$('ovb').children].every((e,k)=>e.className===(k===v?'on':''))&&($('ovc').style.display==='none')===(v===0)&&($('otb').style.display==='none')===(v!==0)&&sc.scrollHeight<=sc.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1)
  }
  q.push([...$('ovb').children].map(e=>e.textContent).join()==='結果,弁時期,軌跡'&&[...$('ovb').children].every(e=>Bx(e).height>=43.5&&txtW(e)<=.95*room(e)));
  const hh=Bx($('ohc')).height;
  q.push(hh>=60);
  /* 段階の表示 */
  const sg=vtSegs(mid.S),
   se=vtSegs(end.S),
   el=[...$('osg').children],
   okS=sg.reduce((s,x)=>s+x.n,0)===mid.S.hist.length&&el.length===sg.length&&el[el.length-1].className==='on'&&el.filter(e=>e.className==='on').length===1&&sg.map(x=>x.nm).join()==='探索の前の点,標本,探索 1'&&el[1].textContent==='標本 33'&&se.map(x=>x.nm).join().startsWith('探索の前の点,標本,探索 1')&&se.some(x=>x.nm==='探索 2')&&se.reduce((s,x)=>s+x.n,0)===end.S.hist.length&&Bx($('osg')).height>=14&&el.every(e=>e.scrollWidth<=e.clientWidth+.5);
  /* 弁時期の図（探索の途中：探索の前，最良，評価中の 3 つ × 排気と吸気） */
  optView(1);
  yield 'frame';
  const c=$('ovc'),
   W=c.clientWidth,
   H=c.clientHeight,
   D1=drawOpt(),
   xb=mid.best.x,
   ar=(k,w)=>D1.arcs.find(e=>e.k===k&&e.w===w),
   okC=!!D1&&D1.arcs.length===6&&ar('ex','xb').a===xb[2]&&ar('ex','xb').b===xb[3]&&ar('in','xb').a===xb[0]+720&&ar('in','xb').b===xb[1]+720&&ar('ex','x0').a===b[2]&&ar('in','x0').b===b[1]+720&&ar('ex','xc').a===mid.req.value.x[2]&&ar('ex','xb').r>ar('in','xb').r&&D1.labs.length===4&&D1.labs.every(e=>e.x>=0&&e.y>=0&&e.x+e.w<=W&&e.y+e.h<=H)&&D1.cy-D1.R-26>=0&&D1.cy+D1.R+26<=H;
  /* 探索の軌跡（途中：点，経路，信頼領域の枠，3 つの印 × 2 枚） */
  optView(2);
  yield 'frame';
  const D2=drawOpt(),
   nf=mid.S.hist.filter(e=>e.J>-Infinity).length,
   okP=!!D2&&D2.n===nf&&D2.np===mid.S.path.length&&D2.np>=1&&D2.box&&D2.pl.length===2&&D2.pl.every(e=>e.x>=0&&e.y>=0&&e.x+e.w<=W&&e.y+e.h+20<=H&&e.w>=80&&e.h>=80)&&D2.mk.length===6&&D2.mk.every((e,k)=>{const p=D2.pl[k<3?0:1];return e.x>=p.x&&e.x<=p.x+p.w&&e.y>=p.y&&e.y<=p.y+p.h});
  /* 終わった後：評価中の点と信頼領域の枠は消え，経路は 2 つの始点の分 */
  OP.run=null;
  OP.rs=end;
  optText();
  const D3=drawOpt(),elE=[...$('osg').children];
  optView(1);
  const D4=drawOpt(),
   okE=!D3.box&&D3.mk.length===4&&D3.np===end.S.path.length&&end.S.path.some(e=>e.k===2)&&D4.arcs.length===4&&elE.length===se.length&&elE.every(e=>e.className!=='on');
  let tm=0;
  for(const v of[1,2]){
   optView(v);
   const t0=performance.now();
   for(let k=0;k<30;k++)drawOpt();
   tm=Math.max(tm,(performance.now()-t0)/30)
  }
  chkB(32,'表示：[結果][弁時期][軌跡] で切り替わる（44 px 以上，文字が収まる，スクロールなし，評価の履歴の図が 60 px 以上）．段階の表示が，段階ごとの評価の回数と，いまの段階を示す',q.every(x=>x)&&okS,`切替 ${q.map(x=>x?1:0).join('')}，段階 ${okS}（${sg.map(x=>x.nm+' '+x.n).join('｜')}／終わり ${se.map(x=>x.nm+' '+x.n).join('｜')}），履歴の図 ${hh.toFixed(0)} px`);
  chkB(32,'弁時期の図：探索の前・最良・評価中の点の，排気弁と吸気弁の区間（6 本の弧）が弁時期のとおりで，外が排気，文字 4 つと図が Canvas の中',okC,`弧 ${D1?D1.arcs.length:0} 本，文字 ${D1?D1.labs.length:0} 個，半径 ${D1?D1.R.toFixed(0):'–'} px（Canvas ${W}×${H}）`);
  chkB(32,'探索の軌跡：評価した点の全部，中心の経路，信頼領域の枠，3 つの印（探索の前・最良・評価中）が 2 枚の平面の中．終わった後は枠と評価中の点が消え，経路が 2 つの始点の分ある',okP&&okE,`途中：点 ${D2?D2.n:0}/${nf}，経路 ${D2?D2.np:0} 点，枠 ${D2&&D2.box}，印 ${D2?D2.mk.length:0}．終わり：枠 ${D3.box}，印 ${D3.mk.length}，経路 ${D3.np} 点，弧 ${D4.arcs.length} 本`);
  chkP(32,'探索の図の描画（弁時期と軌跡．30 回の平均の大きい方）',tm,6,'ms',2);
  Object.assign(OP,sv);
  optView(0)
 }
 Object.assign(OP,o0);
 uiDefault();
 show(0)
};
/* ---- TEST-33 熱効率の損失の内訳 ---- */
TST[33]=function*(){
 uiDefault();
 const lb=function*(c){const L=new LossBk(c);while(!L.run(8))yield;return L.res};
 const s4=yield*scen('S4'),w3=RUN.ui?null:yield*scen('W3000'),res=[];
 if(!RUN.ui)for(const [nm,sc] of[['S4',s4],['W3000',w3]]){const r=yield*lb(sc.c);res.push([nm,r])}
 if(!RUN.ui){
  const bad=[];
  for(const [nm,r] of res){
   if(!r.ok){bad.push(nm+' 計算できない');continue}
   const eO=1-Math.pow(r.eps,-.4),sum=r.eO-r.L.reduce((s,q)=>s+q[1],0);
   if(Math.abs(r.eO/eO-1)>1e-12||Math.abs(sum/r.ei-1)>1e-9||Math.abs(r.ei/r.eiM-1)>1e-12||Math.abs(r.eb/r.ebM-1)>1e-12||!(r.eb>0&&r.eb<r.ei)||!(r.glh>0&&r.glh<=1))bad.push(nm)
  }
  chkB(33,'損失の和（S4，W3000）：η_O = 1 − ε^−0.4（1e-12），η_O − Σ損失 = η_i（1e-9），η_i = W/(m_f H_u)（1e-12），η_b = 正味熱効率（1e-12），0 < η_b < η_i，0 < 等容度 ≤ 1',bad.length===0,bad.length?bad.join('，'):res.map(([nm,r])=>`${nm}：η_O ${(r.eO*100).toFixed(2)} %，損失 ${r.L.map(q=>(q[1]*100).toFixed(2)).join('／')} %pt，η_i ${(r.ei*100).toFixed(2)} %，機械損失 ${((r.ei-r.eb)*100).toFixed(2)} %pt，η_b ${(r.eb*100).toFixed(2)} %，等容度 ${r.glh.toFixed(3)}`).join('；'))
 }
 if(!RUN.ui){
  const r=res[0][1];
  chkB(33,'再計算の一致（S4）：段 h の EVO の筒内圧 = 実際のサイクルの EVO の筒内圧（相対 1e-6）',r.ok&&Math.abs(r.pEh/r.pE-1)<=1e-6,`${(r.pE/1e6).toFixed(7)} MPa，段 h ${(r.pEh/1e6).toFixed(7)} MPa`,'1e-6')
 }
 if(!RUN.ui){
  const c1=s4.c.clone();
  c1.P.cw=0;
  const r1=yield*lb(c1),c2=s4.c.clone();
  c2.P.evo=540*D;
  const r2=yield*lb(c2),
   Lf=(r,n)=>r.ok?r.L.find(q=>q[0].startsWith(n))[1]:NaN,
   Lc=Lf(r1,'冷却損失'),
   Lb=r2.ok?r2.L.find(q=>q[0].startsWith('有効膨張比'))[1]:NaN;
  chkB(33,'無くした場合：壁面熱伝達の係数 0 で冷却損失 = 0，EVO = 540° で吹き出しの損失 = 0（絶対値 1e-6 以下）',Math.abs(Lc)<=1e-6&&Math.abs(Lb)<=1e-6,`冷却 ${Lc.toExponential(2)}，吹き出し ${Lb.toExponential(2)}`,'≤ 1e-6')
 }
/* 5：燃え残り・比熱と組成・熱解離の分け方（SPEC-33 A，B） */
 if(!RUN.ui){
  const o={},
   z=GAS.phi2z(1),
   ev=(T,nd)=>{GAS.nd(nd);try{GAS.burned(T,5e6,z,o)}finally{GAS.nd(0)}return o.e},
   d28=ev(2800,0)-ev(2800,1),
   d10=Math.abs(ev(1000,0)-ev(1000,1)),
   n0=GAS.eq(GAS.TND,5e6,z,K.etac).n,
   dis=(['CO','H2','OH'].reduce((a,k)=>a+n0[Object.keys(GAS.S).indexOf(k)],0))/n0.reduce((a,b)=>a+b,0);
  const bad=[];
  for(const [nm,r] of res){
   if(!r.ok){bad.push(nm);continue}
   const g=n=>r.L.find(q=>q[0].startsWith(n))[1];
   if(!(r.xi>.85&&r.xi<=1.001)||Math.abs(g('燃え残り')-(r.eA-r.eU))>1e-15||!(g('比熱比の低下')>.05)||!(g('熱解離')>0&&g('熱解離')<.05)||!(r.eU<r.eA))bad.push(nm)
  }
  chkB(33,'分け方：解離の無い表は 2800 K で平衡より内部エネルギーが低く（解離の吸熱の分），1000 K で一致（1e4 J/kg 以内），T_nd の平衡組成の CO + H₂ + OH のモル分率 ≤ 1e-3．S4，W3000 で 0.85 < ξ ≤ 1，燃え残り = η_A − η_U > 0，比熱比の低下 > 5 %pt，0 < 熱解離 < 5 %pt',d28>1e5&&d10<=1e4&&dis<=1e-3&&bad.length===0,`Δe(2800 K) ${(d28/1e3).toFixed(0)} kJ/kg，Δe(1000 K) ${d10.toFixed(0)} J/kg，解離の種 ${dis.toExponential(1)}；`+res.map(([nm,r])=>r.ok?`${nm}：ξ ${r.xi.toFixed(3)}，燃え残り ${(r.eA-r.eU>0?(r.eA-r.eU)*100:0).toFixed(2)}，比熱 ${((r.eU-r.eF)*100).toFixed(2)}，解離 ${((r.eF-r.eFA)*100).toFixed(2)} %pt`:nm+' ×').join('；'))
 }
 {
  const sv=live;
  live=s4.c.clone();
  const nb4=$('N').children[3],tabOk=!!nb4&&nb4.textContent==='熱効率'&&+nb4.dataset.t===8;
  if(tabOk)tapEl(nb4);
  OP.lres=null;
  OP.lb=null;
  OP.lt=-1e9;
  let t=performance.now(),mx=0,n=0;
  const t0=t;
  while(!OP.lres&&performance.now()-t0<3000){lossTick(6);drawLossT();yield 'frame';const t1=performance.now();mx=Math.max(mx,t1-t);t=t1;n++}
  const r=OP.lres,ok1=tabOk&&U.tab===8&&$('s8').className==='on'&&!!r&&performance.now()-t0<=3000;
  let inside=false,dm=Infinity;
  if(r){
   const q=prep($('olc')),g=q.g;
   g.font='12px system-ui,sans-serif';
   const S=lossSpec(r,q.W,q.H);
   inside=S.rows.length===12&&S.rows.every(w=>{
    const nw=g.measureText(w.name).width,nx=S.two?S.pl.x:S.pl.x-6-nw;
    return nx>=0&&(S.two?S.pl.x+nw:S.pl.x-6)<=q.W&&w.ny>=0&&w.y+w.h/2<=q.H&&Math.max(w.x1,S.X(w.hi))+4+g.measureText('−00.00 %pt').width<=q.W
   });
   const t2=performance.now();
   for(let i=0;i<30;i++){const q2=prep($('olc'));drawLoss(q2.g,q2.W,q2.H,r,COL)}
   dm=(performance.now()-t2)/30;
/* 8：熱効率が負のとき（SPEC-33 C の 1）：正味熱効率を −10 % にした結果で，横軸が負の値を含み，負の棒が 0 の線の左にある */
   {
    const rn={...r,eb:-.1},
     Sn=lossSpec(rn,q.W,q.H),
     Z=Sn.X(0),
     L=Sn.pl.x,
     Rr=Sn.pl.x+Sn.pl.w,
     wb=Sn.rows[11],
     wm=Sn.rows[10],
     inP=Sn.rows.every(w=>w.x0>=L-.5&&w.x1<=Rr+.5&&w.x0<=w.x1),
     ok=Z>L+1&&Math.abs(wb.x0-Sn.X(-.1))<1e-9&&wb.x0<Z-1&&Math.abs(wb.x1-Z)<1e-9&&wm.x0<Z-1&&Math.abs(wm.x0-wb.x0)<1e-9&&inP;
    chkB(33,'熱効率が負のとき：正味熱効率 −10 % の結果で，横軸の左端が負で，正味熱効率と機械損失の棒の左端が −10 % の位置（0 の線より左），全部の棒が図の中',ok,`0 の線 ${(Z-L).toFixed(1)} px（左端から），η_b の棒 ${wb.x0.toFixed(1)}〜${wb.x1.toFixed(1)} px，図の中 ${inP}`)
   }
  }
/* 7：燃料を噴いていない運転では内訳を計算しない（REQ-33 の 7） */
  {
   const fc=s4.c.clone(),r0=OP.lres;
   fc.s.fuel=0;
   live=fc;
   OP.lb=null;
   OP.lt=-1e9;
   for(let i=0;i<5;i++){lossTick(6);drawLossT()}
   const a=U.tab===8&&LP.gam===2&&OP.lb===null&&!optReady()&&lossMsg().includes('燃料');
   live=s4.c.clone();
   OP.lt=-1e9;
   OP.lcy=-1;
   lossTick(6);
   const b=OP.lb!==null;
   OP.lb=null;
   OP.lres=r0;
   chkB(33,'燃料を噴いていない運転（S4 の機関を燃料カットにしたもの）では内訳の計算を始めず，図に燃料を噴いていない旨を書く．燃料を噴いていれば始まる',a&&b,`${a?1:0}${b?1:0}，「${lossMsg()}」`)
  }
  live=sv;
  chkB(33,'画面：上のタブの 4 番目が「熱効率」．表示すると 3 s 以内に図が出る，12 行の名前と値が Canvas の中',ok1&&inside,`図 ${ok1}（${n} フレーム），配置 ${inside}`);
  chkP(33,'熱効率の図が出るまでのフレームの間隔（最長）',mx,250,'ms',0);
  chkP(33,'熱効率の図の 1 回の描画',dm,6,'ms',2)
 }
/* 6：圧縮比の定義（SPEC-33 の A） */
 if(!RUN.ui){
  const bad=[];
  for(const [nm,r] of res){
   const sc=nm==='S4'?s4:w3,
    G=sc.c.G,
    V=sc.c.V,
    e1=Math.abs(r.epc/(kinV(G,V.gA)/G.Vc)-1),
    e2=Math.abs(r.epe/(kinV(G,V.gB)/G.Vc)-1);
   if(!(e1<=1e-6&&e2<=1e-6&&r.epc>1&&r.epc<=r.eps&&r.epe>1&&r.epe<=r.eps&&r.L[0][0].startsWith(`有効圧縮比 ${r.epc.toFixed(1)}`)&&r.L[6][0].startsWith(`有効膨張比 ${r.epe.toFixed(1)}`)))bad.push(nm)
  }
  const c3=s4.c.clone();
  c3.P.ivc=200*D;
  c3.P.evo=530*D;
  const r3=yield*lb(c3),f=r3.ok?lossFoot(r3)[0]:'',f0=lossFoot(res[0][1])[0];
  chkB(33,'圧縮比の定義：有効圧縮比 = V(IVC)/V_c，有効膨張比 = V(EVO)/V_c（1e-6），1 < 各 ≤ ε，段の名前に値がある．IVC 200°，EVO 530° にすると膨張比／圧縮比が元より小さくなる',bad.length===0&&r3.ok&&r3.epe/r3.epc<res[0][1].epe/res[0][1].epc,res.map(([nm,r])=>`${nm}：ε_c ${r.epc.toFixed(2)}，ε_e ${r.epe.toFixed(2)}`).join('；')+`；S4「${f0}」，IVC 200°・EVO 530°「${f}」`)
 }
 OP.lres=null;
 uiDefault();
 show(0)
};
/* ---- TEST-34 VVT マップ ---- */
TST[34]=function*(){
 uiDefault();
 const Bx=e=>e.getBoundingClientRect(),
  o0={m:OP.m,vm:OP.vm,vsel:OP.vsel,vkey:OP.vkey,vc:OP.vc},
  bm=m=>$('opb').querySelector(`button[data-m="${m}"]`);
/* 1：ボタン */
 {
  show(7);
  const q=[];
  for(const m of[0,2]){
   tapEl(bm(m));
   yield 'frame';
   const sc=$('s7');
   q.push(OP.m===m&&bm(m).className==='on'&&$('o'+m).className==='opv on'&&sc.scrollHeight<=sc.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1)
  }
  const bs=[...$('opb').children,...$('vac').children];
  q.push(bs.every(b=>Bx(b).height>=43.5&&b.scrollWidth<=b.clientWidth+.5)&&[...$('opb').children].map(b=>b.textContent).join()==='バルブタイミング,VVT マップ');
  chkB(34,'ボタン：[バルブタイミング][VVT マップ] で切り替わる，44 px 以上で文字が収まる，スクロールなし',q.every(x=>x),q.map(x=>x?1:0).join(''))
 }
/* 2：補間と等高線，格子の順序 */
 if(!RUN.ui){
  const xs=VVM.ph,G=xs.map((b,j)=>xs.map((a,i)=>Math.sin(i)+j*j)),L=xs.map(b=>xs.map(a=>2*a+3*b));
  let e1=0,e2=0;
  xs.forEach((b,j)=>xs.forEach((a,i)=>e1=Math.max(e1,Math.abs(bil2(G,xs,xs,a,b)/G[j][i]-1)||0)));
  for(let k=0;k<200;k++){
   const a=-40+80*((k*.618)%1),b=-40+80*((k*.382)%1);
   e2=Math.max(e2,Math.abs(bil2(L,xs,xs,a,b)-(2*a+3*b)))
  }
  const sg=contourSeg((a,b)=>bil2(L,xs,xs,a,b),-40,40,-40,40,64,50),
   e3=Math.max(0,...sg.flat().map(p=>Math.abs(2*p[0]+3*p[1]-50))),
   o=vvOrder(),
   cnt=[1,2,3].map(l=>o.filter(q=>q[2]===l).length),
   uniq=new Set(o.map(q=>q[0]+','+q[1])).size;
  chkB(34,'補間：格子の点で一致（1e-12），f = 2φin + 3φex で一致（1e-9）．等高線 f = 50 の端点が f = 50（1e-9），線分あり．順序：段階 9／16／56 点，81 点が 1 度ずつ',e1<=1e-12&&e2<=1e-9&&e3<=1e-9&&sg.length>0&&cnt.join()==='9,16,56'&&uniq===81&&o.length===81,`${e1.toExponential(1)}，${e2.toExponential(1)}，${e3.toExponential(1)}（${sg.length} 本），${cnt.join('／')}`)
 }
 yield;
/* 3：機関（S4） */
 const s4=yield*scen('S4');
 if(!RUN.ui){
  const m=new VVTMap(s4.c);
  while(!m.run(10))yield;
  const ph=VVM.ph,miss=[];
  ph.forEach((b,j)=>ph.forEach((a,i)=>{if(!m.H[j][i]&&!(m.T[j][i]===m.T[j][i]))miss.push([a,b])}));
  const E=new VTEval(s4.c,0,OPT,['phin','phex']);
  E.start([0,0],'fine');
  while(!E.run(8))yield;
  const i0=ph.indexOf(0),
   tc=OPT.tol.mc,
   tf=OPT.tol.fine,
   d00=Math.abs(m.T[i0][i0]-E.M.tb),
   ok00=d00<=2*(tc.r*Math.abs(E.M.tb)+tc.a);
  const chk=function*(o,key){
   const v=key==='tb'?x=>x.tb:x=>x.eb,J=v(o),tol=key==='tb'?2*(tf.r*Math.abs(J)+tf.a):2*tf.r*Math.abs(J),nb=[];
   for(let i=0;i<2;i++)for(const sg of[1,-1]){
    const x=o.x.slice();
    x[i]+=sg;
    if(!m.inR(x)||!E.feas(x))continue;
    E.start(x,'fine');
    while(!E.run(8))yield;
    nb.push(v(E.M)-J)
   }
   const gm=key==='tb'?Math.max(...m.T.flat().filter(q=>q===q)):Math.max(...m.B.flat().filter(q=>q===q)),
    gtol=key==='tb'?tc.r*Math.abs(gm)+tc.a:tc.r*Math.abs(gm);
   return[nb.every(d=>d<=tol)&&J>=gm-gtol,Math.max(...nb)]
  };
  const [okT,dT]=yield*chk(m.opt.T,'tb'),[okB,dB]=yield*chk(m.opt.B,'eb');
  chkB(34,'機関（S4）：格子の点がすべて値を持つ，(0, 0) が細かい許容の評価と粗い許容の 2 倍以内，★ と ◆ が 1° の局所最適で格子の最良以上',miss.length===0&&ok00&&okT&&okB,`欠け ${miss.length}，(0,0) の差 ${d00.toExponential(1)} N·m，★ (${m.opt.T.x}) ${m.opt.T.tb.toFixed(3)} N·m（近傍の最大の差 ${dT.toExponential(1)}），◆ (${m.opt.B.x}) η_b ${(m.opt.B.eb*100).toFixed(3)} %（${dB.toExponential(1)}），評価 ${m.ne} 回`);
  chkP(34,'VVT マップの計算の所要',m.t/1e3,40,'s',1)
 }
/* 4，5：画面の操作と描画（S4 の機関） */
 {
  const sv=live;
  live=s4.c.clone();
  show(7);
  optSub(2);
  OP.vm=null;
  OP.vsel=null;
  OP.vkey='';
  const lp0=[LP.phin,LP.phex];
  tapEl($('vrn'));
  const st=!!OP.vm;
  let mx=0,t=performance.now(),n=0;
  while(OP.vm&&!OP.vm.done&&OP.vm.level()<1&&n<3000){
   vmTick(12);
   vmText();
   drawOpt();
   yield 'frame';
   const t1=performance.now();
   mx=Math.max(mx,t1-t);
   t=t1;
   n++
  }
  tapEl($('vrn'));
  const stopped=!!OP.vm&&OP.vm.done&&OP.vm.stop;
  yield 'frame';
  const S=drawVMT(),c=$('vmc'),r=c.getBoundingClientRect(),pl=S.pl,X=a=>pl.x+pl.w*(a+40)/80,Y=b=>pl.y+pl.h*(1-(b+40)/80);
  {const px=r.left+X(-20),py=r.top+Y(10);pev(c,'pointerdown',px,py);pev(c,'pointerup',px,py)}
  const sel=OP.vsel&&OP.vsel.x.join()==='-20,10'&&$('vrd3').textContent.includes('(-20, 10)');
  tapEl($('vap'));
  const ap=LP.phin===-20*D&&LP.phex===10*D;
  tapEl($('vun'));
  const un=LP.phin===lp0[0]&&LP.phex===lp0[1];
  chkB(34,'操作：[計算] で始まり，段階 1 の後の [中止] で止まる，(−20, 10) のタップで選ばれて値が出る，[適用] で φin = −20°，φex = 10°，[元に戻す] で戻る',st&&stopped&&sel&&ap&&un,`開始 ${st}，中止 ${stopped}，選択 ${sel}（${OP.vsel&&OP.vsel.x}），適用 ${ap}，戻す ${un}（${n} フレーム）`);
  chkP(34,'VVT マップの計算中のフレームの間隔（最長）',mx,250,'ms',0);
  OP.vm.opt.T={x:[-20,0],tb:0,eb:.3};
  OP.vm.opt.B={x:[-10,5],tb:0,eb:.3};
  OP.vsel={x:[20,-20],src:'tap'};
  const S2=drawVMT(),
   W=c.clientWidth,
   H=c.clientHeight,
   lx=S2.pl.x+S2.pl.w+8,
   ins=S2.mk.length===4&&S2.mk.every(q=>q.x>=0&&q.x<=W&&q.y>=0&&q.y<=H)&&lx+40<=W&&S2.pl.y+S2.pl.h+30<=H;
  const t2=performance.now();
  for(let k=0;k<30;k++)drawVMT();
  const dm=(performance.now()-t2)/30;
  chkB(34,'描画：○ ★ ◆ ＋ と凡例の帯が Canvas の中',ins,`印 ${S2.mk.length} 個，${ins}`);
  chkP(34,'VVT マップの描画（色の画像を作った後の 30 回の平均）',dm,6,'ms',2);
/* 7：燃料を噴いていない運転ではマップの計算を始めない（REQ-34 の 6） */
  {
   const fc=s4.c.clone(),m0=OP.vm;
   fc.s.fuel=0;
   live=fc;
   if(OP.vm&&!OP.vm.done)vmStop();
   const mA=OP.vm;
   tapEl($('vrn'));
   const a=OP.vm===mA&&$('vpr').textContent===optWhy()&&optWhy().includes('燃料');
   vmText();
   const b=$('vst').textContent.includes('燃料')||!!OP.vm;
   OP.vm=m0;
   chkB(34,'燃料を噴いていない運転（S4 の機関を燃料カットにしたもの）では [計算] を押してもマップの計算が始まらず，燃料を噴いていない旨を表示する',a&&b,`${a?1:0}${b?1:0}，「${$('vpr').textContent}」`)
  }
  live=sv
 }
/* 6：出力の無い点（φin < 0 で T_b < 0，η_b が未定義．約 10000 rpm の全開の形） */
 if(!RUN.ui){
  const ph=VVM.ph,
   T=ph.map(b=>ph.map(a=>a<0?-1-(b+40)/20:.5+3*Math.exp(-((a-25)**2+(b-10)**2)/800))),
   B=ph.map((b,j)=>ph.map((a,i)=>a<0?NaN:.004+.036*Math.exp(-((a-25)**2+(b-10)**2)/800))),
   H=ph.map(()=>ph.map(()=>0)),
   F={T,B,H,level:()=>3,opt:{},ver:1,done:true,p0:[0,0]};
  let ok=false,info='';
  try{
   const Gd=vmGrid(F),
    nanOk=ph.every((b,j)=>ph.every((a,i)=>(B[j][i]===B[j][i])===(Gd.be[j][i]===Gd.be[j][i]))),
    cv=document.createElement('canvas'),
    C=vmBuild(Gd,340,380,1,cv),
    be=Gd.be.flat().filter(v=>v===v),
    bmin=Math.min(...be),
    ends=C.seg.flatMap(q=>q.s.flat()),
    endOk=ends.every(p=>bil2(Gd.be,Gd.xs,Gd.xs,p[0],p[1])===bil2(Gd.be,Gd.xs,Gd.xs,p[0],p[1])),
    levOk=C.seg.length>=1&&C.seg.length<=8&&C.seg.every(q=>q.L>=bmin&&q.L<=2*bmin),
    zOk=(C.z||[]).length>0,
    nOk=[[0,.5],[100,137],[1e3,6.1e4]].every(([lo,hi])=>{const l=vmNice(lo,hi);return l.length>=1&&l.length<=8});
   const sv={vm:OP.vm,vsel:OP.vsel};
   OP.vm=F;
   OP.vsel={x:[-20,0],src:'tap'};
   vmText();
   const rd=$('vrd3').textContent.includes('出力なし');
   OP.vm=sv.vm;
   OP.vsel=sv.vsel;
   vmText();
   ok=nanOk&&endOk&&levOk&&zOk&&nOk&&rd;
   info=`未定義の一致 ${nanOk}，端点 ${endOk}（${ends.length} 点），等高線 ${C.seg.length} 本（${C.seg.map(q=>q.L).join('，')}，b_min ${bmin.toFixed(0)}），T_b = 0 の線 ${(C.z||[]).length}，刻み ${nOk}，読み取り ${rd}`
  }catch(e){info='例外：'+e.message}
  chkB(34,'出力の無い点：燃料消費率は T_b > 0 の点だけ，等高線 ≤ 8 本で [b_min, 2 b_min]，端点が定義域，T_b = 0 の線，「出力なし」，刻みはどの範囲でも 1〜8 本',ok,info)
 }
 Object.assign(OP,o0);
 uiDefault();
 show(0)
};
/* ---- TEST-35 シャシーダイナモメーター（SPEC-35） ---- */
TST[35]=function*(){
 uiDefault();
 const P0=mkPT(),kmh=3.6;
 if(!RUN.ui){
/* 1：エンジンダイナモメーターへ影響しない */
  {
   const a=new Core(mkPT()),b=new Core({...mkPT(),mv:2000,Cd:1});
   a.start();
   b.start();
   yield*runC(a,5);
   yield*runC(b,5);
   chkB(35,'エンジンでは車両の設定が機関に影響しない：車重 2000 kg，C_d = 1 にして 5 s 計算した状態ベクトルが既定と完全に一致，車速 0',JSON.stringify(a.s.y)===JSON.stringify(b.s.y)&&b.s.V.v===0&&a.s.t===b.s.t,`t ${a.s.t.toFixed(3)} s，車速 ${b.s.V.v}`)
  }
/* 2：走行抵抗 */
  {
   const rho=P0.pa/(R*TA),ref=.5*rho*P0.Cd*P0.Af*900+P0.Crr*P0.mv*VEH.g;
   chk(35,'走行抵抗 F_res(30 m/s) = ½ρ C_d A v² + C_rr m_v g [N]',ref,vehRes(P0,30),1e-12);
   chk(35,'F_res(0) = C_rr m_v g [N]',P0.Crr*P0.mv*VEH.g,vehRes(P0,0),1e-12)
  }
/* 3：予測 */
  {
   const r=vehPerf(P0,25e3),
    e1=Math.abs(P0.etd*25e3/(vehRes(P0,r.vmax)*r.vmax)-1),
    Pz={...P0,Cd:0,Crr:0},
    z=vehPerf(Pz,25e3,1e9),
    v1=VEH.v100,
    e2=Math.abs(z.tTo(v1)/(Pz.mv*v1*v1/(2*Pz.etd*25e3))-1),
    w=vehPerf(P0,3e3);
   chkB(35,'予測：η_d P_max = F_res(v_max) v_max（1e-9），抵抗と駆動力の上限なしで t = m_v v²/(2 η_d P_max)（1e-9），P_max = 3 kW では 0→100 km/h が届かない（v_max < 100 km/h）',e1<=1e-9&&e2<=1e-9&&!(w.t100===w.t100)&&w.vmax<v1,`${e1.toExponential(1)}，${e2.toExponential(1)}．25 kW：最高 ${(r.vmax*kmh).toFixed(1)} km/h，0→100 km/h ${r.t100.toFixed(2)} s．3 kW：最高 ${(w.vmax*kmh).toFixed(1)} km/h`)
  }
/* 4：傾向 */
  {
   const t=[400,600,900].map(m=>vehPerf({...P0,mv:m},25e3).t100),
    v=[.25,.3,.45].map(c=>vehPerf({...P0,Cd:c},25e3).vmax*kmh);
   chkB(35,'傾向：車重 400 < 600 < 900 kg で 0→100 km/h が延びる，C_d 0.25 > 0.30 > 0.45 で最高速度が下がる（P_max = 25 kW）',t[0]<t[1]&&t[1]<t[2]&&v[0]>v[1]&&v[1]>v[2],`${t.map(x=>x.toFixed(1)).join(' < ')} s，${v.map(x=>x.toFixed(0)).join(' > ')} km/h`)
  }
/* 5：実時間の走行 */
  {
   const c=new Core({...mkPT(),bench:1,nt:4000,alm:90*D,mv:200});
   c.start();
   let mn=1e9,mx=0;
   yield*runC(c,9,{tick(q){if(q.s.V.t100===q.s.V.t100){mn=Math.min(mn,q.s.Nb);mx=Math.max(mx,q.s.Nb)}}});
   const tm=c.s.V.t100,pr=vehPerf(c.P,c.lastM.pb).t100,vE=c.s.V.v*kmh;
   c.P.alm=0;
   yield*runC(c,7.5);
   chkB(35,'実時間の走行（シャシー，全開，4000 rpm，車重 200 kg，9 s）：0→100 km/h の計測値が，その運転点の P_b からの予測と 5 % 以内，100 km/h の後の N̄ が 4000 ±25 rpm，全閉にして 7.5 s で停止',Math.abs(tm/pr-1)<=.05&&mn>=3975&&mx<=4025&&c.s.V.v===0,`計測 ${tm.toFixed(2)} s，予測 ${pr.toFixed(2)} s（P_b ${(c.lastM.pb/1e3).toFixed(1)} kW），N̄ ${mn.toFixed(0)}〜${mx.toFixed(0)} rpm，9 s の車速 ${vE.toFixed(1)} km/h，停止後 ${c.s.V.v}`)
  }
 }
/* 6：設定ページ「車両」 */
 {
  const vp0={...VP};
  show(2);
  U.pg=PAGES.indexOf('車両');
  rs();
  yield 'frame';
  const sec=$('s2'),
   ks=ITEMS.filter(i=>i.pg===U.pg).map(i=>i.k),
   bt=k=>$('Pg').querySelector(`button[data-k="${k}"][data-s="1"]`),
   tx=()=>$('pvt').textContent,
   q=[];
  q.push(ks.join()==='bench,mv,Cd,Af,Crr,etd'&&sec.scrollHeight<=sec.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1);
  VP.Pmax=25e3;
  VP.Nmax=5000;
  VP.sig=vpSig();
  VP.run=null;
  pvText();
  const t0=tx(),m0=/0→100 km\/h ([\d.]+) s｜最高 (\d+) km\/h/.exec(t0);
  tapEl(bt('mv'));
  const t1=tx(),m1=/0→100 km\/h ([\d.]+) s｜最高 (\d+) km\/h/.exec(t1);
  for(let i=0;i<10;i++)tapEl(bt('Cd'));
  const m2=/0→100 km\/h ([\d.]+) s｜最高 (\d+) km\/h/.exec(tx());
  q.push(!!m0&&!!m1&&!!m2&&LP.mv===610&&+m1[1]>+m0[1]&&+m2[2]<+m1[2]&&$('pvt').scrollWidth<=$('pvt').clientWidth+1);
  const sp=vehSpec(LP,25e3),cv=document.createElement('canvas');
  cv.width=340;
  cv.height=160;
  const L=layout(cv.getContext('2d'),2,2,336,158,sp);
  q.push(sp.xa.name==='車速 [km/h]'&&sp.ya.name==='力 [kN]'&&sp.lg.length===2&&sp.ser.length===2&&L.xt.length>=3&&L.yt.length>=3&&sp.ser.every(z=>z.Y.every(v=>v>=0&&v<=sp.ya.b)));
  VP.sig='';
  VP.Pmax=NaN;
  VP.maxMs=0;
  pvText();
  const w0=tx().startsWith('計測中');
  let t=performance.now(),mx=0,n=0;
  const ts=t;
  while(!vpOk()&&performance.now()-ts<2e4){vpTick(8);yield 'frame';const t2=performance.now();mx=Math.max(mx,t2-t);t=t2;n++}
  const el=(performance.now()-ts)/1e3;
  q.push(w0&&vpOk()&&VP.Pmax>1e4&&/0→100 km\/h/.test(tx()));
  chkB(35,'設定ページ「車両」：6 項目・スクロールなし，車重の [+] で 0→100 km/h の文字が延び，C_d の [+]×10 で最高速度の文字が下がる（同じ操作の中で．文字が欠けない），図に単位付きの軸名・目盛・2 系列，P_max が無いと「計測中」で自動の計測が 20 s 以内に終わる',q.every(x=>x),`${q.map(x=>x?1:0).join('')}，「${t0}」，計測 ${el.toFixed(1)} s（${n} フレーム），P_max ${(VP.Pmax/1e3).toFixed(1)} kW @ ${VP.Nmax} rpm`);
  chkP(35,'車両の予測の計測中のフレームの間隔（最長）',mx,250,'ms',0);
  Object.assign(VP,vp0)
 }
/* 7：運転タブ */
 {
  uiDefault();
  show(0);
  yield 'frame';
  const s=live.s,txt=()=>{ctlRender();return $('ctl').textContent},q=[];
  s.fired=1;
  s.starter=0;
  s.mode=1;
  s.Nb=3998.2;
  s.t=20;
  LP.nt=4000;
  LP.alm=90*D;
  s.al=90*D;
  s.V={v:87.3/3.6,x:0,t0:0,t100:12.3,F:1234};
  const e0=txt();
  q.push(!e0.includes('シャシー')&&!e0.includes('車速'));
  LP.bench=1;
  const x=txt();
  q.push(['シャシー','目標 4000','車速 87.3 km/h','0→100 km/h 12.3 s','スロットル開度 α 90.0°','駆動力 1.23 kN'].every(w=>x.includes(w)));
  s.V={v:399.9/3.6,x:0,t0:0,t100:NaN,F:-9999};
  s.t=123.4;
  LP.nt=20000;
  s.Nb=12345.6;
  s.spa=-20;
  const y=txt(),rows=[...$('ctl').children],ov=rows.filter(r=>r.scrollWidth>r.clientWidth+1).length;
  q.push(y.includes('車速 399.9 km/h')&&y.includes('123.4 s…')&&y.includes('制動力 10.00 kN')&&ov===0&&rows.length===4);
  drawEng();
  const band=getComputedStyle($('thb')).display!=='none';
  show(2);
  U.pg=PAGES.indexOf('運転');
  rs();
  const mr=[...$('Pg').querySelectorAll('.r')].find(r=>r.querySelector('button[data-k="mode"]'));
  q.push(band&&!!mr&&mr.querySelector('span').textContent.includes('（不使用）')&&[...mr.querySelectorAll('button')].every(b=>b.disabled)&&!!$('tsr'));
  chkB(35,'運転タブ：シャシーの制御状態の表示に「シャシー」・車速・0→100 km/h・駆動力 [kN]（エンジンでは無い），最長の表示でも 4 行が折り返さない，設定の「回転数の制御」が（不使用），スロットル開度の帯とスライダが出る',q.every(v=>v),`${q.map(v=>v?1:0).join('')}，「${x.slice(0,60)}」，はみ出し ${ov} 行`)
 }
 uiDefault();
 live.reset();
 show(3)
};
async function runAll(only,ui,pj){
 if(U.busy)return;
 U.busy=1;
 U.cancel=0;
 U.uiDraw=0;
 RUN.ui=!!ui;
 RUN.pj=pj===0?0:1;
 if(ui)only=only?only.filter(k=>UIT.includes(k)):UIT;
 TR={};
 SC={};
 for(let i=1;i<=NT;i++)ST[i]='';
 const snap=snapLive(),js0=JSON.stringify(snap.s),jp0=JSON.stringify(snap.P),tStart=performance.now();
 RUN.maxF=0;
 RUN.dur={};
 RUN.at=new Date().toISOString();
 $('rt').textContent='中止';
 let lastF=performance.now();
 for(const id of[...Array.from({length:19},(_,i)=>i+1),21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,20]){
  if(U.cancel)break;
  if(only&&!only.includes(id))continue;
  ST[id]='run';
  rchips(id);
  const it=TST[id](),tId=performance.now();
  let done=false,send;
  while(!done&&!U.cancel){
   await nextFrame();
   const n0=performance.now();
   if(n0-lastF>RUN.maxF){RUN.maxF=n0-lastF;RUN.maxId=id}
   lastF=n0;
   RUN.t0=n0;
   try{
    for(;;){
     const r=it.next(send);
     send=undefined;
     if(r.done){done=true;break}
     if(r.value&&typeof r.value.then==='function'){try{send=await r.value}catch(e){send={err:String(e)}}lastF=performance.now();break}
     if(r.value==='frame'||RUN.over())break
    }
   }catch(e){chkB(id,'例外: '+e.message,false,(e.stack||'').split('\n')[1]||'');done=true}
  }
  if(!done)genStop(it);
  endAll();
  if((id>=15&&id<=18)||id===22||id===23||(id>=25&&id<=27)||id===30||id===31||id===32||id===33||id===34||id===35||id===36||id===37)restLive(snap);
  RUN.dur[id]=(performance.now()-tId)/1e3;
  if(done){
   if(id===20){
    chkB(20,'運転中の機関の状態と設定が実行前後で一致',JSON.stringify(live.s)===js0&&JSON.stringify(LP)===jp0);
    RUN.total=(performance.now()-tStart)/1e3;
    const tg=RUN.ui?UIT:Object.keys(TST).map(Number),un=tg.filter(k=>k!=20&&!(TR[k]&&TR[k].length));
    chkB(20,RUN.ui?'画面のモード：[U] の項目を持つ TEST-'+UIT.filter(k=>k!==20).map(pad).join('，')+' がすべて実行され結果を持つ':'TEST-01〜19，21〜37 がすべて実行され結果を持つ',un.length===0||(!!only&&!RUN.ui),un.length?'未実行: '+un.join(','):`${tg.length-1} / ${tg.length-1}`);
    {
     const pj0=RUN.pj;
     RUN.pj=0;
     chkP(99,'a',2,1,'ms');
     RUN.pj=1;
     chkP(99,'a',2,1,'ms');
     chkP(99,'b',1,1,'ms');
     RUN.pj=pj0;
     const a=TR[99];
     delete TR[99];
     chkB(20,'性能の記録：上限を超えた値は，判定しない実行では記録だけ（PASS．上限超えの印），判定する実行では FAIL．上限以下は PASS',a.length===3&&a.every(r=>r.perf)&&a[0].ok&&a[0].over&&!a[1].ok&&a[1].over&&a[2].ok&&!a[2].over,a.map(r=>(r.ok?'PASS':'FAIL')+(r.over?'・超え':'')).join('，'))
    }
    chkB(20,'既燃ガスの表を作るときの化学平衡：全テストの実行の終わりに，収束しなかった解が 0，解けなかった連立方程式が 0',GAS.stat.nc===0&&GAS.stat.sg===0,`未収束 ${GAS.stat.nc}，解けない ${GAS.stat.sg}`);
    chkP(20,'テスト実行中の最長フレーム間隔',RUN.maxF,250,'ms',1,'（TEST-'+pad(RUN.maxId)+'）');
    chkP(20,'総所要時間',RUN.total,480,'s',1)
   }
   ST[id]=TR[id]&&TR[id].length&&TR[id].every(r=>r.ok)?'ok':'ng'
  }else ST[id]=''
 }
 restLive(snap);
 SC={}; /* シナリオの控えを手放す（全テストの後に数十 MB を持ち続けない） */
 U.busy=0;
 U.uiDraw=0;
 $('rt').textContent='全テスト実行';
 show(3);
 rchips();
 window.__done=1
}
function rchips(cur){
 const ids=Object.keys(ST).filter(k=>ST[k]==='ok'||ST[k]==='ng'),
  np=ids.filter(k=>ST[k]==='ok').length,
  NR=RUN.ui?UIT.length:NT,
  ni=ids.reduce((s,k)=>s+TR[k].length,0),
  nf=ids.reduce((s,k)=>s+TR[k].filter(r=>!r.ok).length,0),
  pf=ids.reduce((s,k)=>s+TR[k].filter(r=>r.perf).length,0),
  pv=ids.reduce((s,k)=>s+TR[k].filter(r=>r.over).length,0);
 $('sm').innerHTML=U.busy?`実行中… TEST-${pad(cur||0)}（完了 ${ids.length}/${NR}）`:ids.length?`<b class="${np===NR?'ok':'ng'}">PASS ${np}/${NR}${RUN.ui?'（画面のモード）':''}</b>　検証項目 ${ni} 件中 FAIL ${nf} 件　所要 ${RUN.total.toFixed(1)} s${pf?`　性能の記録 ${pf} 件（上限超え ${pv} 件${RUN.pj?'':'．判定しない'}）`:''}`:'未実行です．「全テスト実行」を押してください（運転中の機関は一時停止し，終了後に元の状態へ戻ります）．';
 $('rcp').disabled=!!U.busy||!ids.length;
 $('cp').innerHTML=Array.from({length:NT},(_,i)=>`<button data-i="${i+1}" class="${ST[i+1]||''}${U.sel===i+1?' sl':''}">${i+1}</button>`).join('');
 dtl()
}
/* 検証の結果のテキスト（REQ-20 の 7，SPEC-20 B の 11）：別の端末の結果と並べて貼れる形．e は envInfo() の値 */
const ENV={hi:null};
function envInfo(){
 const n=navigator,d=n.userAgentData,h=ENV.hi;
 return{
  ua:n.userAgent,
  pf:d?[d.platform,h&&h.platformVersion,h&&h.model,h&&h.architecture,d.mobile?'mobile':''].filter(Boolean).join(' '):n.platform||'',
  scr:screen.width+'×'+screen.height,
  vp:innerWidth+'×'+innerHeight,
  dpr:devicePixelRatio,
  hc:n.hardwareConcurrency||0,
  mem:n.deviceMemory||0,
  lang:n.language||'',
  mj:MJX.st
 }
}
function resText(e){
 const ids=Object.keys(ST).filter(k=>ST[k]==='ok'||ST[k]==='ng').map(Number).sort((a,b)=>a-b),
  all=ids.flatMap(k=>TR[k].map(r=>[k,r])),
  NR=RUN.ui?UIT.length:NT,
  bad=all.filter(([,r])=>!r.ok||r.over),
  pf=all.filter(([,r])=>r.perf),
  L=[
   'SI機関シミュレータ 検証の結果',
   'ビルド：'+BUILD,
   '日時：'+(RUN.at||'–'),
   '環境：'+e.ua,
   '　'+(e.pf?e.pf+'，':'')+'画面 '+e.scr+'，表示領域 '+e.vp+'（CSS px），画素の比 '+(+e.dpr.toFixed(3))+(e.hc?'，論理コア '+e.hc:'')+(e.mem?'，メモリ '+e.mem+' GB 以上':'')+'，言語 '+e.lang+'，数式 '+e.mj,
   '要約：PASS '+ids.filter(k=>ST[k]==='ok').length+'/'+NR+(RUN.ui?'（画面のモード）':'')+'　検証項目 '+all.length+' 件中 FAIL '+all.filter(([,r])=>!r.ok).length+' 件　所要 '+RUN.total.toFixed(1)+' s　性能の記録 '+pf.length+' 件（上限超え '+pf.filter(([,r])=>r.over).length+' 件'+(RUN.pj?'':'．判定しない')+'）　最長フレーム間隔 '+RUN.maxF.toFixed(0)+' ms（TEST-'+pad(RUN.maxId||0)+'）',
   'テストごと（番号　合否　検査の数　所要 [s]）：'
  ];
 for(const k of ids)L.push(pad(k)+' '+(ST[k]==='ok'?'PASS':'FAIL')+' '+TR[k].length+' '+(RUN.dur[k]||0).toFixed(1)+'　'+TNAME[k]);
 L.push('FAIL と上限超え：'+(bad.length?'':'なし'));
 for(const[k,r]of bad)L.push('TEST-'+pad(k)+'　'+(r.ok?'上限超え':'FAIL')+'　'+r.n+'｜基準 '+r.ref+'｜実測 '+r.val);
 L.push('性能の記録（実測｜上限）：');
 for(const[k,r]of pf)L.push('TEST-'+pad(k)+'　'+r.n.replace('［性能］','')+'：'+r.val+'｜'+r.ref);
 return L.join('\n')
}
function dtl(){
 const r=TR[U.sel],n=pad(U.sel),st=ST[U.sel];
 [...$('cp').children].forEach((b,j)=>b.classList.toggle('sl',j+1===U.sel));
 if(!r||!r.length){$('dt').innerHTML=`<b>TEST-${n}</b>　${TNAME[U.sel]}<br>${st==='run'?'実行中':'未実行'}`;return}
 U.ix=Math.min(U.ix,r.length-1);
 const x=r[U.ix],nf=r.filter(q=>!q.ok).length;
 $('dt').innerHTML=`<b>TEST-${n}</b>　${TNAME[U.sel]}　${U.ix+1}/${r.length}${nf?`　<b class="ng">FAIL ${nf}</b>`:''}<br>${x.n}<br>基準：${x.ref}<br>実測：${x.val}<br>相対誤差：${x.err}<br><b class="${x.ok&&!x.over?'ok':'ng'}">${x.over?(x.ok?'上限超え（判定しない）':'FAIL（上限超え）'):x.ok?'PASS':'FAIL'}</b>`
}
const TNAME=[
 '',
 'クランク運動学',
 '熱物性',
 'カム・VVT・弁干渉',
 'オリフィス流量',
 'スロットル・マニホールド',
 '筒内組成',
 'Wiebe燃焼',
 '壁面熱伝達',
 '筒内圧力方程式',
 '回転運動・始動・摩擦',
 '電動式動力計',
 'ECU（スロットルPI）',
 '数値積分',
 'メトリクス',
 '画面構成・操作',
 '解説',
 'グラフ軸・自動レンジ',
 '設定',
 '機関断面図',
 '検証基盤',
 'エンジン音',
 '制御状態表示',
 '目標回転数スライダ',
 '内部EGR・点火時期',
 '吸気ランナ',
 '性能曲線タブ',
 '排気系',
 'アイドルの妥当性',
 '化学種の熱物性と化学平衡',
 '燃料の噴射と気化',
 '全体図',
 '最適化（バルブタイミング）',
 '熱効率の損失の内訳',
 'VVT マップ',
 'シャシーダイナモメーター',
 '振動による体感',
 '運転点のマップ'
];

/* ---- TEST-36 振動による体感 ---- */
/* 送った命令の列から振動の区間を再構成する（後の命令で前の命令を打ち切る．打ち切られた区間と，同じ時刻から続く次の命令の区間はつなぐ）．calls：[{t, p}] */
const hapTL=calls=>{
 const on=[];
 for(let i=0;i<calls.length;i++){
  const c=calls[i],end=i+1<calls.length?calls[i+1].t:Infinity;
  if(!Array.isArray(c.p))continue;
  let x=c.t;
  c.p.forEach((d,j)=>{
   if(j%2===0&&d>0){
    const a=x,b=Math.min(x+d,end);
    if(b>a+1e-6){
     const L=on[on.length-1];
     if(L&&Math.abs(L[1]-a)<1e-6&&L[3])L[1]=b,L[3]=b===end;else on.push([a,b,c.t,b===end])
    }
   }
   x+=d
  })
 }
 return on
};
/* 機関を模擬の時計で進め，Hap に燃焼の時刻を渡す．戻り値：命令，燃焼から求めた振動の開始の予定，各フレームの処理時間 */
const hapDrive=function*(c,r,ms,on){
 const fr=1000/60,h=new Hap(),st={debt:0,spd:r},calls=[],exp=[],dts=[];
 let t=0;
 c.igT.length=0;
 while(t<ms){
  const tS=c.s.t;
  advance(st,c,fr/1e3,0);
  t+=fr;
  const ev=c.igT.splice(0),t1=c.s.t;
  for(const te of ev)exp.push(t+(t1>tS?(te-tS)/(t1-tS):0)*fr);
  const q0=performance.now(),q=h.tick(t,{on:on??1,ev,t0:tS,t1,dt:fr});
  dts.push(performance.now()-q0);
  if(q!=null)calls.push({t,p:q});
  if(RUN.over())yield
 }
 return{calls,exp,dts,end:t}
};
TST[36]=function*(){
 if(!RUN.ui){
/* 1：パターン */
  {
   const P=(sg,t0)=>hapPattern(sg,t0).p,
    a=P([[5,8],[20,23],[40,43]],0),
    b=P([[0,3]],0),
    c=P([5,9,13,17,21].map(x=>[x,x+3]),0),
    d=P(Array.from({length:100},(_,i)=>[i*10+5,i*10+8]),0),
    ok=JSON.stringify(a)==='[0,5,3,12,3,17,3]'&&JSON.stringify(b)==='[3]'&&JSON.stringify(c)==='[0,5,19]'&&d.length<=98&&[a,b,c,d].every(p=>p.every(Number.isInteger)&&p.slice(1).every(v=>v>=1));
   chkB(36,'パターン：5，20，40 ms の 3 つで [0,5,3,12,3,17,3]，0 ms で [3]，休止 1 ms の 5 つは [0,5,19] につながる，100 個でも要素 ≤ 98，整数で先頭のほかは ≥ 1',ok,`${JSON.stringify(a)}，${JSON.stringify(b)}，${JSON.stringify(c)}，${d.length} 要素`)
  }
/* 2：燃焼の回数と時刻，6：計算時間 */
  {
   const s4=yield*scen('S4'),out=[];
   let ok=true,dts=[];
   for(const r of[.1,.5,1]){
    const R=yield*hapDrive(s4.c.clone(),r,4000),
     tl=hapTL(R.calls),
     st=tl.map(q=>q[0]),
     wd=tl.map(q=>q[1]-q[0]),
     e=R.exp,
     n=Math.min(st.length,e.length),
     de=Math.max(0,...st.slice(0,n).map((x,i)=>Math.abs(x-e[i])));
    if(!(st.length===e.length&&de<=1&&wd.every(w=>w>=2.5&&w<=3.5)&&e.length>0))ok=false;
    out.push(`${r}×：燃焼 ${e.length}，振動 ${st.length}，時刻の差 ≤ ${de.toFixed(2)} ms，長さ ${Math.min(...wd).toFixed(1)}〜${Math.max(...wd).toFixed(1)} ms`);
    if(r===1)dts=R.dts
   }
   chkB(36,'燃焼の回数と時刻（S4，0.1×，0.5×，1×，実時間 4 s）：振動の数 = 燃焼の数，開始が式の時刻と 1 ms 以内，長さ 3 ms',ok,out.join('；'));
   const ds=dts.slice().sort((x,y)=>x-y),p99=ds[Math.floor(.99*ds.length)],mn=dts.reduce((a,b)=>a+b,0)/dts.length;
   chkP(36,'振動の 1 フレームの処理（平均）',mn*1e3,50,'μs',1);
   chkP(36,'振動の 1 フレームの処理（99 パーセンタイル）',p99*1e3,200,'μs',0,'（最大 '+(ds[ds.length-1]*1e3).toFixed(0)+' μs）')
  }
/* 3：つながる振動 */
  {
   const f=sp=>new Hap().tick(100,{on:1,ev:[0,1,2,3].map(i=>i*sp),t0:0,t1:16.7,dt:16.7}),a=f(4),b=f(8);
   chkB(36,'つながる振動：4 ms ごとの燃焼 4 つで休止の無い 1 つの振動，8 ms ごとでは休止がある',Array.isArray(a)&&a.length===1&&Array.isArray(b)&&b.length>1,`${JSON.stringify(a)}，${JSON.stringify(b)}`)
  }
/* 4：燃焼しないときは振動しない */
  {
   const s4=yield*scen('S4'),c=s4.c.clone();
   yield*hapDrive(c,1,500);
   c.stop();
   yield*hapDrive(c,1,200);
   const A=yield*hapDrive(c,1,1000),
    cr=(yield*scen('CRANK')).c.clone(),
    B=yield*hapDrive(cr,1,1000),
    na=A.calls.filter(q=>Array.isArray(q.p)).length,
    nb=B.calls.filter(q=>Array.isArray(q.p)).length;
   chkB(36,'燃焼しないときは振動しない：FUEL CUT（駆動）の 0.2 s 後から 1 s，クランキングの 1 s でパターンを送らない',na===0&&nb===0&&A.exp.length===0&&B.exp.length===0,`FUEL CUT ${na} 回（燃焼 ${A.exp.length}），クランキング ${nb} 回（燃焼 ${B.exp.length}）`)
  }
/* 8：長いフレーム（REQ-36 の 7）：経過 0.3 s のフレームでも，進める時間は 0.05 s．振動は，その 50 ms の中に置く */
  {
   const s3=yield*scen('S3'),c=s3.c.clone(),st={debt:0,spd:1},h=new Hap();
   c.igT.length=0;
   const tS=c.s.t;
   advance(st,c,.3,0);
   const adv=c.s.t-tS,
    n=c.igT.length,
    i=hapIn(c,1,tS,.3),
    p=h.tick(1000,i),
    tl=Array.isArray(p)?hapTL([{t:1000,p}]):[],
    last=tl.length?tl[tl.length-1][0]-1000:NaN,
    off=hapIn(c,0,tS,.3);
   chkB(36,'長いフレーム：経過 0.3 s のフレームで進める時間は 0.05 s で，その間の燃焼の振動はすべてフレームの時刻から 50 ms 以内に始まる．OFF では空',Math.abs(adv-.05)<=2e-3&&n>=1&&i.dt===50&&tl.length>=1&&last<=50&&last>=0&&off.on===0&&off.dt===0,`進めた時間 ${(adv*1e3).toFixed(1)} ms，燃焼 ${n}，振動 ${tl.length}，最後の開始 ${last.toFixed(1)} ms，dt ${i.dt} ms`)
  }
/* 7：計算に影響しない */
  {
   const s2=yield*scen('S2'),ys=[];
   for(const on of[0,1]){const c=s2.c.clone();yield*hapDrive(c,1,3000,on);ys.push(JSON.stringify(c.s.y))}
   chkB(36,'計算に影響しない：S2 から 3 s を，振動 OFF と ON で進めた状態ベクトルが完全に一致',ys[0]===ys[1])
  }
 }
/* 5：画面と止める命令 */
 {
  uiDefault();
  const own=Object.prototype.hasOwnProperty.call(navigator,'vibrate'),
   v0=navigator.vibrate,
   log=[],
   b0=U.busy,
   Bx=e=>e.getBoundingClientRect();
  onEnd(()=>{
   delete document.hidden;
   if(own)navigator.vibrate=v0;else delete navigator.vibrate;
   U.busy=b0;
   hapBtn()
  });
  navigator.vibrate=p=>{log.push(Array.isArray(p)?p.slice():p);return true};
  hapBtn();
  show(0);
  yield 'frame';
  const b=$('hap'),q=[];
  q.push(!!b&&vis(b)&&Bx(b).width>=43.5&&Bx(b).height>=43.5&&txtW(b)<=.95*room(b)&&b.textContent==='振動'&&b.className===''&&!U.hap&&!b.disabled);
  U.busy=0;
  tapEl(b);
  q.push(U.hap===1&&b.className==='on');
  Sim.spd=1;
  sp();
  live.start();
  let t0=performance.now();
  while(!log.some(Array.isArray)&&performance.now()-t0<4000)yield 'frame';
  q.push(log.some(Array.isArray));
  tapEl(b);
  const n1=log.length;
  q.push(U.hap===0&&log[n1-1]===0);
  t0=performance.now();
  while(performance.now()-t0<300)yield 'frame';
  q.push(log.slice(n1).every(x=>!Array.isArray(x)));
  tapEl(b);
  t0=performance.now();
  while(!Array.isArray(log[log.length-1])&&performance.now()-t0<1000)yield 'frame';
  U.busy=1;
  yield 'frame';
  yield 'frame';
  const n2=log.length;
  q.push(log[n2-1]===0);
  U.busy=0;
  t0=performance.now();
  while(!Array.isArray(log[log.length-1])&&performance.now()-t0<1000)yield 'frame';
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  document.dispatchEvent(new Event('visibilitychange'));
  q.push(log[log.length-1]===0);
  delete document.hidden;
  document.dispatchEvent(new Event('visibilitychange'));
  tapEl(b);
  U.busy=b0;
  navigator.vibrate=undefined;
  hapBtn();
  q.push(b.disabled);
  if(own)navigator.vibrate=v0;else delete navigator.vibrate;
  hapBtn();
  const pg=PAGES.indexOf('音と振動');
  q.push(pg>=0&&!ITEMS.some(i=>i.k==='hapt'));
  U.pg=pg;
  show(2);
  rs();
  pvText();
  q.push($('pvt').textContent.includes('サイレント'));
  uiDefault();
  show(0);
  live.reset();
  chkB(36,'画面：[振動] が 44 px 以上で文字が収まり既定 OFF．ON にして 1× で START すると 4 s 以内に送る．OFF で直ちに vibrate(0)，その後は送らない．テストの実行中とページの非表示で vibrate(0)．API が無いと無効．設定「音と振動」の説明に「サイレント」',q.every(x=>x),q.map(x=>x?1:0).join(''))
 }
};
/* ---- TEST-37 運転点のマップ（SPEC-37） ---- */
/* 合成のマップ：3 つの回転数に，値が N と T の 1 次関数の点を置く（全開の軸トルクは 40，50，30 N·m．各回転数に T_b < 0 の点を 1 つ） */
const opLin={mfd:(N,T)=>1e-4+2e-8*N+1e-5*T,Tx:(N,T)=>600+.1*N+2*T,mth:(N,T)=>1e-3+1e-6*N+2e-4*T,pm:(N,T)=>1e6+100*N+1e5*T,spa:(N,T)=>10+2e-3*N-.1*T},
 opTop=[40,50,30],
 opHi=N=>N<=4000?40+10*(N-1000)/3000:50-20*(N-4000)/3000;
function opSyn(){
 const Ns=[1000,4000,7000],M=new OpMap(mkPT(),Ns),fr=[1,.8,.55,.3,.1,-.15],al=[90,45,28,18,12,8];
 Ns.forEach((N,i)=>fr.forEach((f,k)=>{
  const T=opTop[i]*f,q={al:al[k],st:false,ok:true,cyc:6,tb:T,eb:0};
  for(const key in opLin)q[key]=opLin[key](N,T);
  M.pt[i].push(q);
  M.np++;
  M.ver++
 }));
 M.done=true;
 M.stage='終了';
 M.sg='';
 return M
}
TST[37]=function*(){
 const keep={...MP},
  sub0=SW.sub,
  Bx=e=>e.getBoundingClientRect(),
  L=()=>[...$('mpt').children].map(e=>e.textContent),
  fits=()=>[...$('mpt').children].every(e=>e.scrollWidth<=e.clientWidth+.5);
 uiDefault();
 Object.assign(MP,{run:null,cur:null,q:0,sel:null});
/* 1：ボタン */
 {
  show(5);
  tapEl($('sws').children[6]);
  yield 'frame';
  const sec=$('s5'),bs=[...$('sws').children,...$('mpq').children],q=[];
  q.push(SW.sub===6&&$('sws').children[6].className==='on'&&$('mpc').style.display!=='none'&&$('tc').style.display==='none');
  q.push([...$('sws').children].map(b=>b.textContent).join()==='出力,η_v,燃費,点火,条件,前提,マップ'&&[...$('mpq').children].map(b=>b.textContent).join()==='燃費,排気温,空気量,最大圧,点火');
  q.push(bs.every(b=>Bx(b).width>=43.5&&Bx(b).height>=43.5&&txtW(b)<=.95*room(b)));
  q.push(sec.scrollHeight<=sec.clientHeight+1&&document.documentElement.scrollHeight<=innerHeight+1&&Bx($('mpc')).height>=120);
  for(let k=4;k>=0;k--){
   tapEl($('mpq').children[k]);
   q.push(MP.q===k&&$('mpq').children[k].className==='on'&&[...$('mpq').children].filter(b=>b.className==='on').length===1)
  }
  chkB(37,'ボタン：表示の切替に [マップ]，量のボタンが 5 つ（燃費，排気温，空気量，最大圧，点火）で切り替わる，44 px 以上で文字が収まる，スクロールなし',q.every(x=>x),q.map(x=>x?1:0).join('')+'，Canvas の高さ '+Bx($('mpc')).height.toFixed(0)+' px')
 }
/* 2：補間と等高線（合成のマップ）．重い部分の間で yield して，1 フレームを長くしない */
 if(!RUN.ui){
  const M=opSyn(),rel=(a,b)=>Math.abs(a-b)/Math.max(1e-300,Math.abs(b));
  let e1=0,e2=0;
  M.Ns.forEach((N,i)=>[1,.8,.55,.3,.1].forEach(f=>{
   const T=opTop[i]*f,r=M.at(N,T);
   for(const k in opLin)e1=Math.max(e1,r?rel(r[k],opLin[k](N,T)):1);
   e1=Math.max(e1,r?rel(r.eb,T*N*PI/30/(opLin.mfd(N,T)*K.Hu)):1)
  }));
  for(let k=0;k<200;k++){
   const N=1000+6000*((k*.618)%1),T=opHi(N)*(.002+.996*((k*.382)%1)),r=M.at(N,T);
   for(const key in opLin)e2=Math.max(e2,r?rel(r[key],opLin[key](N,T)):1)
  }
  const z=M.at(4000,0),
   out=[M.at(2500,opHi(2500)+.5),M.at(2500,-.1),M.at(500,10),M.at(7001,10)].every(r=>r===null)&&!!z&&z.eb===0&&z.be!==z.be;
  chkB(37,'補間：計算した点で一致（1e-12），N と T の 1 次関数の場で一致（1e-9），η_b = T_b ω/(ṁ_f H_u)，T_b = 0 で η_b = 0．領域の外（全開の上，T_b < 0，回転数の範囲の外）は値なし',e1<=1e-12&&e2<=1e-9&&out,`${e1.toExponential(1)}，${e2.toExponential(1)}，領域の外 ${out}`);
  yield;
  const cv=document.createElement('canvas'),C=opBuild(M,1,340,300,1,cv);
  yield;
  const ends=C.seg.flatMap(q=>q.s.flatMap(sg=>sg.map(p=>[p,q.L]))),
   e3=Math.max(0,...ends.map(([p,Lv])=>Math.abs(opLin.Tx(p[0],p[1])-Lv)/Lv)),
   inn=ends.every(([p])=>M.at(p[0],p[1])!==null),
   im=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
  let bad=0,nc=0,nt=0;
  for(let py=0;py<cv.height;py++){
   for(let px=0;px<cv.width;px++){
    const on=im[4*(py*cv.width+px)+3]>0,r=M.at((px+.5)/cv.width*SWC.N1,(1-(py+.5)/cv.height)*C.ya.mx);
    if(on)nc++;else nt++;
    if(on!==(r!==null))bad++
   }
   if(py%20===19)yield
  }
  const stp=l=>{
    if(l.length<2)return true;
    const d=l[1]-l[0],m=d/10**Math.floor(Math.log10(d)+1e-9);
    return[1,2,2.5,5].some(x=>Math.abs(m-x)<1e-6)&&l.every((v,k)=>!k||Math.abs(v-l[k-1]-d)<1e-9*Math.abs(d))
   },
   lv=[];
  for(let k=0;k<OPQ.length;k++){lv.push(opBuild(M,k,340,300,1,document.createElement('canvas')).lev);yield}
  const lvOk=lv.every(l=>l.length>=1&&l.length<=10&&stp(l))&&[[0,.5],[100,137],[1e3,6.1e4],[24.7,33]].every(([a,b])=>{const l=vmNice(a,b,10);return l.length>=1&&l.length<=10&&stp(l)});
  chkB(37,'等高線：1 次関数の場で端点が値に一致（1e-9）し領域の中，10 本以下で刻みが {1, 2, 2.5, 5} × 10^k（5 つの量と 4 つの範囲），色の画像は領域の中だけ',e3<=1e-9&&inn&&ends.length>0&&C.seg.length>=1&&C.seg.length<=10&&lvOk&&bad===0&&nc>0&&nt>0,`端点 ${ends.length} 点（${e3.toExponential(1)}，領域の中 ${inn}），${C.seg.length} 本（${C.lev.join('，')}），本数 ${lv.map(l=>l.length).join('／')}，色の画素 ${nc}／透明 ${nt}／不一致 ${bad}`)
 }
 yield;
/* 3：機関（既定の設定） */
 if(!RUN.ui){
  const P0={...mkP()},M=new OpMap(P0);
  while(!M.run(10))yield;
  const C=M.cols(),
   tm=M.tmax(),
   lim=OPM.dT*tm,
   nv=C.filter(Boolean).length,
   nw=M.Ns.filter((_,i)=>M.pos(i,90)).length,
   nz=C.filter(c=>c&&c.lo===0).length;
  let gap=0;
  for(const c of C)if(c)for(let k=0;k+1<c.nd.length;k++)gap=Math.max(gap,c.nd[k+1].T-c.nd[k].T);
  chkB(37,'機関：全開で T_b > 0 の回転数がすべて列になり（20 以上），どの列も T_b = 0 まであり，隣り合う点の軸トルクの差が全開の軸トルクの最大の 10% 以下',nv===nw&&nv>=20&&nz===nv&&gap<=lim*(1+1e-9)&&M.done&&M.stage==='終了',`列 ${nv}/${M.Ns.length}（T_b = 0 まで ${nz}），差の最大 ${gap.toFixed(3)} N·m（${M.np} 点，T_b 最大 ${tm.toFixed(2)} N·m）`,`≤ ${lim.toFixed(3)} N·m`);
  const S0=new Sweep(P0,SWN,90,swOpt());
  while(!S0.run(10))yield;
  const KS=['tb','eb','spa','mfd','Tx','mth','pm'],
   wd=S0.pts.filter((q,i)=>{const w=M.pt[i].find(p=>p.al===90);return!w||w.st!==!!q.st||(!q.st&&KS.some(k=>w[k]!==q[k]))}).length;
  chkB(37,'機関：全開の点が，同じ条件の性能曲線の計測（Sweep）と完全に一致（T_b，η_b，点火時期，ṁ_f，T_X，ṁ_th，p_max）',wd===0&&S0.pts.length===M.Ns.length,`不一致 ${wd} 点 / ${S0.pts.length}`);
  const PT=[[1125,30],[1875,14],[2625,10],[3375,20],[4625,17],[5875,25]],er=[0,0,0,0,0],info=[];
  let miss=0;
  for(const [N,al] of PT){
   const S=new Sweep(P0,[N],al,swOpt());
   while(!S.run(10))yield;
   const q=S.pts[0],r=q.st?null:M.at(N,q.tb);
   if(!r){miss++;info.push(`${N} rpm ${al}°：範囲外`);continue}
   const d=[Math.abs(r.eb-q.eb)*100,Math.abs(r.Tx-q.Tx),Math.abs(r.mth/q.mth-1)*100,Math.abs(r.pm/q.pm-1)*100,Math.abs(r.spa-q.spa)];
   d.forEach((v,k)=>er[k]=Math.max(er[k],v));
   info.push(`${N} rpm ${q.tb.toFixed(1)} N·m`)
  }
  chkB(37,'機関：格子に無い 6 点（回転数と開度を別に選んで直接計算）で，マップの値との差が η_b 0.5 ポイント，T_X 20 K，ṁ_th 3%，p_max 3%，点火時期 1° 以下',miss===0&&er[0]<=.5&&er[1]<=20&&er[2]<=3&&er[3]<=3&&er[4]<=1,`η_b ${er[0].toFixed(3)} ポイント，T_X ${er[1].toFixed(1)} K，ṁ_th ${er[2].toFixed(2)}%，p_max ${er[3].toFixed(2)}%，点火 ${er[4].toFixed(2)}°（${info.join('，')}）`);
  chkP(37,'運転点のマップの計算の所要',M.t/1e3,60,'s',1);
  const two=[];
  for(let k=0;k<2;k++){const m=new OpMap(P0,[3000]);while(!m.run(10))yield;two.push(JSON.stringify(m.pt)+m.np)}
  chkB(37,'同じ設定の 2 回の計算が完全に一致（3000 rpm の列）',two[0]===two[1]&&two[0].length>100,`${two[0].length} 字`)
 }
/* 4：操作（計算の開始と中止） */
 {
  show(5);
  swSub(6);
  Object.assign(MP,{run:null,cur:null,sel:null});
  mpText();
  const js0=JSON.stringify(live.s),jp0=JSON.stringify(LP),idle=L()[0].includes('計測開始');
  U.swTest=1;
  swBtn();
  tapEl($('swg'));
  const st=!!MP.run&&$('swg').textContent==='中止';
  let mx=0,t=performance.now(),n=0;
  while(MP.run&&MP.run.np<2*SWN.length+4&&n<4000){
   mpTick(12);
   drawMp();
   mpText();
   yield 'frame';
   const t1=performance.now();
   mx=Math.max(mx,t1-t);
   t=t1;
   n++
  }
  const mid=!!MP.run&&L()[0].startsWith('計算中')&&MP.run.cols().some(Boolean);
  tapEl($('swg'));
  const m=MP.cur,
   stopped=!MP.run&&!!m&&m.stop&&!m.done&&$('swg').textContent==='計測開始',
   left=!!m&&m.cols().some(Boolean)&&L()[0].startsWith('中止')&&!!drawMp().lg,
   same=JSON.stringify(live.s)===js0&&JSON.stringify(LP)===jp0;
  U.swTest=0;
  chkB(37,'操作：[計測開始] で始まり，計算の途中からマップが出る，[中止] で止まって，それまでの範囲のマップが残る．運転中の機関の状態と設定は変わらない',idle&&st&&mid&&stopped&&left&&same,`開始 ${st}，途中 ${mid}，中止 ${stopped}，残る ${left}，不変 ${same}（${m?m.np:0} 点，${n} フレーム）`);
  chkP(37,'運転点のマップの計算中のフレームの間隔（最長）',mx,250,'ms',0)
 }
/* 5，6：表示と描画（合成のマップ） */
 {
  const M=opSyn();
  M.sg=mpSig();
  Object.assign(MP,{run:null,cur:M,sel:null});
  mpText();
  const q=[],np0=M.np;
  for(let k=4;k>=0;k--){
   tapEl($('mpq').children[k]);
   const S=drawMp();
   q.push(!!S&&!!S.lg&&MP.c.qi===k&&!MP.run&&M.np===np0);
   yield
  }
  const S=drawMp(),
   c=$('mpc'),
   r=Bx(c),
   tapAt=(N,T)=>{const px=r.left+S.X(N),py=r.top+S.Y(T);pev(c,'pointerdown',px,py);pev(c,'pointerup',px,py)};
  const l0=L(),f0=fits();
  tapAt(4000,25);
  const l1=L(),
   v=MP.sel?M.at(MP.sel.N,MP.sel.T):null,
   sel=!!v&&Math.abs(MP.sel.N-4000)<=30&&Math.abs(MP.sel.T-25)<=.5&&l1[1].includes(MP.sel.N+' rpm')&&l1[2].includes('η_b '+(v.eb*100).toFixed(1)+' %')&&l1[2].includes(v.be.toFixed(0)+' g/kWh')&&l1[2].includes(v.spa.toFixed(1)+'°BTDC')&&l1[3].includes(v.Tx.toFixed(0)+' K')&&l1[3].includes((v.mth*1e3).toFixed(2)+' g/s')&&l1[3].includes((v.pm/1e6).toFixed(2)+' MPa'),
   f1=fits();
  tapAt(7000,29.9);
  const f2=fits();
  tapAt(1500,48);
  const l2=L(),outR=l2[1].includes('範囲外')&&l2[2].startsWith('★')&&l0[2].startsWith('★')&&l0[1].includes('タップ');
  M.sg='x';
  mpText();
  const stale=L()[0].includes('設定が変わりました'),f3=fits();
  M.sg=mpSig();
  mpText();
  const fresh=!L()[0].includes('設定が変わりました');
  chkB(37,'表示：量を切り替えると計算し直さずにマップが替わる，タップで N，T_b と 5 つの量の値が出る，領域の外は「範囲外」，設定が変わると「設定が変わりました」，4 行が切れない',q.every(x=>x)&&sel&&outR&&stale&&fresh&&f0&&f1&&f2&&f3,`切替 ${q.map(x=>x?1:0).join('')}，選択 ${sel}（${MP.sel&&MP.sel.N} rpm），範囲外 ${outR}，古さ ${stale}／${fresh}，行 ${[f0,f1,f2,f3].map(x=>x?1:0).join('')}`);
  tapEl($('mpq').children[0]);
  drawMp();
  const g=prep(c),
   W=c.clientWidth,
   H=c.clientHeight,
   D2=drawOp(g.g,g.W,g.H,{M,C:MP.c,sel:{N:5000,T:10},cur:{N:3000,T:20},best:M.best(),msg:''},COL),
   pl=D2.pl,
   inB=o=>o.x>=0&&o.y>=0&&o.x+(o.w||0)<=W&&o.y+(o.h||0)<=H,
   ins=D2.mk.length===3&&D2.mk.every(inB)&&D2.lab.length>=1&&D2.lab.every(o=>o.x>=pl.x&&o.y>=pl.y&&o.x+o.w<=pl.x+pl.w&&o.y+o.h<=pl.y+pl.h)&&!!D2.lg&&inB(D2.lg)&&pl.x>=40&&pl.y+pl.h+34<=H&&pl.x+pl.w+16<=W;
  const t2=performance.now();
  for(let k=0;k<30;k++)drawMp();
  const dm=(performance.now()-t2)/30;
  chkB(37,'描画：★ ○ ＋，等高線の値，凡例，軸の目盛と軸名が Canvas の中',ins,`印 ${D2.mk.length} 個，値 ${D2.lab.length} 個，${ins}`);
  chkP(37,'運転点のマップの描画（色の画像を作った後の 30 回の平均）',dm,6,'ms',2)
 }
 Object.assign(MP,keep);
 swSub(sub0);
 uiDefault();
 show(0);
/* 7：幅の無い列（ある回転数で軸トルクの節点の範囲が 1 点）で補間が NaN にならない（SPEC-37 の 5） */
 {
  const nd=T=>({T,mfd:1e-5,Tx:900,mth:2e-3,pm:5e6,spa:20}),
   c={lo:30,hi:30,nd:[nd(30),nd(30)]},
   L={a:c,b:c,u:0,lo:30,hi:30},
   r=OpMap.prototype.at.call({loc:()=>L},2000,30,L),
   ok=!!r&&OPM.f.every(k=>Number.isFinite(r[k]))&&r.mfd===1e-5;
  chkB(37,'幅の無い列（軸トルクの節点の範囲が 30 N·m の 1 点）の点 (2000 rpm, 30 N·m) の補間の値がすべて有限で，節点の値と同じ',ok,r?OPM.f.map(k=>k+' '+r[k]).join('，'):'null')
 }
};
