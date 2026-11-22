// A: 第一法則の閉じ（温度依存比熱の真の u(T), h(T) で収支を取る）
const L=require('./load.js')(),{Core,mkP,D,PI,R,cpT,gmT,K}=L;
const HT=new Float64Array(4002);for(let i=1;i<4002;i++)HT[i]=HT[i-1]+.5*(cpT(i-1,0)+cpT(i,0));const h=T=>{const i=Math.min(4000,Math.floor(T)),f=T-i;return HT[i]*(1-f)+HT[i+1]*f},u=T=>h(T)-R*T;
const TI=L.TI,TX=L.TX;console.log('TI',TI,'TX',TX);
function closure(c,ncyc){c.P.sol=0;c.P.dth=.1*D;const G=c.G;let k=c.s.cyc;while(c.s.cyc===k)c.step();k=c.s.cyc;
 const st=()=>{const y=c.s.y,V=L.kin(G,y[0]).V,T=y[2]*V/(y[3]*R);return y[3]*u(T)};const U0=st();let Q=0,Qw=0,W=0,Hin=0,Hout=0,HinM=0,HoutM=0,n=0,mbk=0,Ebk=0,mfw=0;
 while(n<ncyc){const y0=c.s.y.slice(),V0=L.kin(G,y0[0]).V;const dt=c.step(),X=c.X0||c.X;const y1=c.s.y,V1=L.kin(G,y1[0]).V;W+=(y0[2]+y1[2])/2*(V1-V0);
  // 流束は step 内で使われた X0（ステップ始点）を再計算
  c.wx=1;c.f(y0);const Z=c.X;Q+=Z.Q*dt;Qw+=Z.Qw*dt;const T=Z.T;
  if(Z.mi>=0){Hin+=Z.mi*h(TI)*dt;HinM+=Z.mi*cpT(TI,0)*TI*dt;mfw+=Z.mi*dt}else{Hin+=Z.mi*h(T)*dt;HinM+=Z.mi*cpT(T,0)*T*dt;mbk+=-Z.mi*dt;Ebk+=-Z.mi*(h(T)-h(TI))*dt}
  if(Z.me>=0){Hout+=Z.me*h(T)*dt;HoutM+=Z.me*cpT(T,0)*T*dt}else{Hout+=Z.me*h(TX)*dt;HoutM+=Z.me*cpT(TX,0)*TX*dt}
  if(c.s.cyc!==k){k=c.s.cyc;n++}}
 const dU=st()-U0,res=Q-Qw-W+Hin-Hout-dU;return{Q:Q/ncyc,W:W/ncyc,Qw:Qw/ncyc,res:res/ncyc,rel:res/Q,dU:dU/ncyc,mbk:mbk/ncyc,mfw:mfw/ncyc,Ebk:Ebk/ncyc,M:c.lastM}}
const rep=(nm,r)=>console.log(`${nm}: Q=${r.Q.toFixed(2)} J/cyc  W=${r.W.toFixed(2)}  Qw=${r.Qw.toFixed(2)}  収支の残差=${r.res.toFixed(3)} J (${(100*r.rel).toFixed(2)}% of Q)  ΔU=${r.dU.toExponential(1)} | 吸気弁の逆流 ${(r.mbk*1e6).toFixed(1)} mg/cyc，順流 ${(r.mfw*1e6).toFixed(1)} mg/cyc，逆流が運ぶ余剰エンタルピー ${r.Ebk.toFixed(2)} J/cyc → 順流の温度上昇の上限 ${(r.Ebk/(r.mfw*1040)).toFixed(0)} K | IMEP ${(r.M.imep/1e3).toFixed(1)} kPa ηv ${r.M.ev.toFixed(3)} xr ${r.M.xr.toFixed(3)} pin ${(c0.s.y[6]/1e3).toFixed(1)}`);
let c0=new Core({...mkP(),cvar:0});c0.start();c0.run(40);rep('アイドル',closure(c0,10));
c0=new Core({...mkP(),cvar:0,nt:2000,fm:.3});c0.start();c0.run(40);rep('2000rpm f=0.3',closure(c0,10));
c0=new Core({...mkP(),cvar:0,mode:1,alm:90*D,nt:3000});c0.fixw=1;c0.fixTw=1;c0.s.y[5]=360;c0.s.y[1]=3000*PI/30;c0.s.Nb=3000;c0.start();for(let i=0;i<60;){const k=c0.s.cyc;c0.step();if(c0.s.cyc!==k)i++}rep('全開 3000rpm',closure(c0,10));
