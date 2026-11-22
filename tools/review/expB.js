// A2: 流入エンタルピーを h(T)=∫c_p dT で整合させた場合，B: 吸気弁の逆流が運んだ熱を順流に戻す（断熱・完全混合の上限）
const load=require('./load.js');
const HSRC=";const HTB=new Float64Array(4002);for(let i=1;i<4002;i++)HTB[i]=HTB[i-1]+.5*(cpT(i-1,0)+cpT(i,0));const hT=(T,cst)=>{if(cst)return cpT(T,1)*T;const i=Math.min(4000,Math.floor(T)),f=T-i;return HTB[i]*(1-f)+HTB[i+1]*f};";
const OLD="const Hi=mi>=0?mi*cpT(TI,cst)*TI:mi*cpT(T,cst)*T,He=me>=0?me*cpT(T,cst)*T:me*cpT(TX,cst)*TX;";
const pA=s=>{if(!s.includes(OLD))throw 1;return s.replace(OLD,"const cT=cpT(T,cst)*T,Hi=mi>=0?mi*(hT(TI,cst)-hT(T,cst)+cT):mi*cT,He=me>=0?me*cT:me*(hT(TX,cst)-hT(T,cst)+cT);").replace("/* ===== generic integrators ===== */",HSRC+"/* ===== generic integrators ===== */")};
const O1="const mi=mdot(pv,p,pv>p?TI:T,";
const pB=s=>{s=pA(s);if(!s.includes(O1))throw 2;s=s.replace(O1,"const TP=this.Tp||TI;const mi=mdot(pv,p,pv>p?TP:T,").replace("Hi=mi>=0?mi*(hT(TI,cst)-hT(T,cst)+cT):mi*cT","Hi=mi>=0?mi*(hT(TP,cst)-hT(T,cst)+cT):mi*cT");return s};
function run(L,B){const{Core,mkP,D,PI,R}=L,o=[];
 const wrap=c=>{if(!B)return c;c.Ep=0;c.Tp=L.TI;const st=c.step.bind(c);c.step=function(){const y0=c.s.y.slice();const dt=st();c.wx=1;const Tp0=c.Tp;c.f(y0);const Z=c.X,cp=1040;if(Z.mi<0)c.Ep+=-Z.mi*cp*(Z.T-L.TI)*dt;else c.Ep=Math.max(0,c.Ep-Z.mi*cp*(Tp0-L.TI)*dt);const P=c.P,mp=c.s.y[9]*.5*PI/4*P.dr*P.dr*P.Lr/(R*L.TI);c.Tp=L.TI+c.Ep/(mp*cp);return dt};c.run=function(T){const t1=c.s.t+T;while(c.s.t<t1)c.step()};return c};
 const avg=(c,n,f)=>{let k=c.s.cyc,a=[],pin=0,t=0,tp=0;while(a.length<n){const dt=c.step();pin+=c.s.y[6]*dt;tp+=(c.Tp||L.TI)*dt;t+=dt;if(c.s.cyc!==k){k=c.s.cyc;a.push(c.lastM)}}const m=q=>a.reduce((s,v)=>s+v[q],0)/n;return{imep:m('imep')/1e3,ev:m('ev'),xr:m('xr'),pin:pin/t/1e3,al:c.s.al/D,Tm:m('Tm'),mfd:m('mfd')*1e3,tb:m('tb'),Tp:tp/t,ei:m('ei'),N:c.s.Nb}};
 let c=wrap(new Core({...mkP(),cvar:0}));c.start();c.run(50);o.push(['アイドル',avg(c,10)]);
 c=wrap(new Core({...mkP(),cvar:0,nt:2000,fm:.3}));c.start();c.run(40);o.push(['2000rpm f=0.3',avg(c,10)]);
 c=wrap(new Core({...mkP(),cvar:0,mode:1,alm:90*D,nt:3000}));c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=3000*PI/30;c.s.Nb=3000;c.start();for(let i=0;i<80;){const k=c.s.cyc;c.step();if(c.s.cyc!==k)i++}o.push(['全開3000',avg(c,10)]);
 c=wrap(new Core({...mkP(),cvar:0,mode:1,alm:90*D,nt:5500}));c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=5500*PI/30;c.s.Nb=5500;c.start();for(let i=0;i<80;){const k=c.s.cyc;c.step();if(c.s.cyc!==k)i++}o.push(['全開5500',avg(c,10)]);
 return o}
const fmt=r=>`N=${r.N.toFixed(0)} pin=${r.pin.toFixed(1)}kPa α=${r.al.toFixed(2)}° IMEP=${r.imep.toFixed(1)}kPa Tb=${r.tb.toFixed(2)}N·m ηv=${r.ev.toFixed(4)} xr=${r.xr.toFixed(3)} Tmax=${r.Tm.toFixed(0)}K ṁf=${r.mfd.toFixed(4)}g/s ηi=${r.ei.toFixed(4)} Tport=${r.Tp.toFixed(0)}K`;
const a=run(load(),0),b=run(load(pA),0),c=run(load(pB),1);
for(let i=0;i<a.length;i++){console.log(a[i][0]);console.log('  現行        ',fmt(a[i][1]));console.log('  A2 整合h(T)  ',fmt(b[i][1]));console.log('  B  逆流の熱を戻す',fmt(c[i][1]))}
