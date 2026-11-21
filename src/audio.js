/* ===== sound: crank-angle wavetable + exhaust-pipe resonator (pure DSP, shared by AudioWorklet / fallback / tests) ===== */
const AU={NT:1440,G:.04,tauN:.05,tauA:.03,Nmin:30,kd:.7,Tex:800};
const cEx=()=>Math.sqrt(gmB(AU.Tex,0)*R*AU.Tex);                 /* speed of sound in exhaust [m/s] */
const pipeF=(L,n)=>(2*n-1)*cEx()/(4*L);                          /* quarter-wave resonances [Hz] */
function mkEnv(me){return Float32Array.from(me,v=>v===v?Math.abs(v)*1e-3:0)}
function mkTable(me){const n=AU.NT,t=new Float32Array(n),h=2*(P4/n);let m=0;for(let i=0;i<n;i++){const a=me[(i+n-1)%n],b=me[(i+1)%n];t[i]=((b===b?b:0)-(a===a?a:0))*1e-3/h;m+=t[i]}m/=n;for(let i=0;i<n;i++)t[i]-=m;return t}
const AN=40;
/* gc：共鳴器の出力から圧縮器の入力への係数 g_c（SPEC-21 B の 3） */
const ACON={nu:8.4e-5,Pr:.7,gx:1.35,fref:1000,T:.35,Rc:4,tauR:.3,ko:1.6,sa:.03,sT:.005,gc:.064};
function loopMag(f,L,d,c){const a=d/2,al=Math.sqrt(PI*f*ACON.nu)*(1+(ACON.gx-1)/Math.sqrt(ACON.Pr))/(a*c),ka=2*PI*f/c*a;return Math.exp(-2*al*L-ka*ka/2)}
/* 管内の損失の帰還フィルタ（SPEC-21 B の 2）：g(1 − b)/(1 − b z⁻¹) の |·| を，基本の共鳴 c/4L と 1 kHz の 2 点で |H(f)| に合わせる */
function loopFit(L,d,c,fs){const f1=c/(4*L),m1=loopMag(f1,L,d,c),m2=loopMag(1000,L,d,c),mg=(b,f)=>{const w=2*PI*f/fs;return(1-b)/Math.hypot(1-b*Math.cos(w),b*Math.sin(w))};let lo=0,hi=.9999;if(f1<1000){for(let i=0;i<64;i++){const b=(lo+hi)/2;if(mg(b,f1)/mg(b,1000)>m1/m2)hi=b;else lo=b}}const b=f1<1000?(lo+hi)/2:onePoleB(m2,2*PI*1000/fs);return{b,g:m2/mg(b,1000)}}
/* 出口の平均流の Mach 数（SPEC-21 B の 1）：me は排気弁の質量流量の表 [g/s]，ρ_X = p_atm/(R T_X) */
function exMach(me,pa,d,c){let s=0,n=0;for(const v of me)if(v===v){s+=v;n++}return n?Math.min(.5,Math.abs(s/n*1e-3)/(pa/(R*AU.Tex)*PI/4*d*d*c)):0}
function onePoleB(m,w){if(!(m<1))return 0;const A=m*m-1,B=2*(1-m*m*Math.cos(w)),dd=B*B-4*A*A;const r1=(-B+Math.sqrt(dd))/(2*A),r2=(-B-Math.sqrt(dd))/(2*A);return [r1,r2].find(x=>x>=0&&x<1)||0}
/* REQ-21 D：演出音（物理モデルではない．定数は試聴で決めた） */
const FLV={ref:19.28,gain:.13,hg:[1,.98,1.02,1],hd:[0,5e-5,1e-4,5e-5],L:.55,r:.8,damp:.06,drive:2.6,asym:.35,form:[[95,2.5,5],[190,3,3],[420,4,4],[1150,4,7],[2600,3,6]],dark:1400,bright:9000,lpmix:.7,intake:.2,noise:.045,pop:.5,popG:.7,shelf:[150,4],jit:.04,vg:2.5};
const sndLoad=(pin,pa)=>Math.min(1,Math.max(0,(pin/pa-.3)/.6));
function bqC(type,f0,Q,g,fs){const w=2*Math.PI*f0/fs,al=Math.sin(w)/(2*Q),c=Math.cos(w);let b0,b1,b2,a0,a1,a2;if(type==='bp'){b0=al;b1=0;b2=-al;a0=1+al;a1=-2*c;a2=1-al}else if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=b0;a0=1+al;a1=-2*c;a2=1-al}else if(type==='hp'){b0=(1+c)/2;b1=-(1+c);b2=b0;a0=1+al;a1=-2*c;a2=1-al}else{const A=Math.pow(10,g/40),sq=2*Math.sqrt(A)*al;b0=A*((A+1)-(A-1)*c+sq);b1=2*A*((A-1)-(A+1)*c);b2=A*((A+1)-(A-1)*c-sq);a0=(A+1)+(A-1)*c+sq;a1=-2*((A-1)+(A+1)*c);a2=(A+1)+(A-1)*c-sq}return[b0/a0,b1/a0,b2/a0,a1/a0,a2/a0,0,0,0,0]}
function bqP(q,x){const y=q[0]*x+q[1]*q[5]+q[2]*q[6]-q[3]*q[7]-q[4]*q[8];q[6]=q[5];q[5]=x;q[8]=q[7];q[7]=y;return y}
class Comp{constructor(fs){this.e=0;this.h=0;this.nh=Math.round(fs*.2);this.kr=Math.exp(-1/(fs*.3))}
gain(e){return e>.35?Math.pow(.35/e,1-1/4):1}
proc(x){const ax=Math.abs(x);if(ax>=this.e*.999){if(ax>this.e)this.e=ax;this.h=this.nh}else if(this.h>0)this.h--;else this.e*=this.kr;return this.gain(this.e)*x}}
class Synth{
constructor(fs,o){this.fs=fs;this.n=1440;this.tab=new Float32Array(1440);this.nx=null;this.ph=0;this.N=0;this.Nt=0;this.amp=0;this.vol=.6;this.L=1;this.d=.04;this.M=0;this.c=556.7;this.cv=1;this.seed=12345;
this.buf=new Float64Array(4096);this.w=0;this.lp=0;this.wraps=0;this.swapAt=-1;this.cnt=0;this.key='';this.b=0;this.comp=new Comp(fs);
this.ap=1;this.ac=1;this.sc=1;this.st=0;this.periods=[];this.amps=[];this.env=new Float32Array(1440);this.nxEnv=null;this.fl=0;this.ns=0;this.bq=[0,0,0,0,0,0,0,0];this.nk='';this.bc=null;
this.fm=0;this.ld=0;this.F=null;this.aN=1-Math.exp(-1/(fs*.05));this.aA=1-Math.exp(-1/(fs*.03));if(o)this.set(o,1);this.st=this.seed>>>0}
set(o,imm){if(o.tab)this.nx=Float32Array.from(o.tab);if(o.env)this.nxEnv=Float32Array.from(o.env);if(imm&&this.nx){this.tab=this.nx;this.nx=null}if(imm&&this.nxEnv){this.env=this.nxEnv;this.nxEnv=null}
for(const k of['Nt','vol','L','c','d','cv','seed','fl','fm','ld','M'])if(o[k]!=null)this[k]=o[k];if(imm){this.N=this.Nt;this.amp=this.Nt>30?1:0;this.st=this.seed>>>0;this.ns=(this.seed^0x9E3779B9)>>>0}}
nrnd(){let t=(this.ns=(this.ns+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
biq(){if(this.bc)return this.bc;const f=(f0,hp)=>{const w=2*Math.PI*f0/this.fs,al=Math.sin(w)/(2*Math.SQRT1_2),cw=Math.cos(w),a0=1+al,b0=hp?(1+cw)/2:(1-cw)/2,b1=hp?-(1+cw):1-cw;return[b0/a0,b1/a0,b0/a0,-2*cw/a0,(1-al)/a0]};return this.bc=[f(1000,1),f(6000,0)]}
bpf(x){const[h,l]=this.biq(),q=this.bq;const y1=h[0]*x+h[1]*q[0]+h[2]*q[1]-h[3]*q[2]-h[4]*q[3];q[1]=q[0];q[0]=x;q[3]=q[2];q[2]=y1;const y2=l[0]*y1+l[1]*q[4]+l[2]*q[5]-l[3]*q[6]-l[4]*q[7];q[5]=q[4];q[4]=y1;q[7]=q[6];q[6]=y2;return y2}
rnd(){let t=(this.st=(this.st+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
uz(){return(2*this.rnd()-1)*Math.sqrt(3)}
newCycle(){this.ap=this.ac;if(this.cv){this.ac=1+.03*this.uz();this.sc=1/(1+.005*this.uz())}else{this.ac=1;this.sc=1}}
loop(){const k=this.L+'|'+this.d+'|'+this.c;if(k!==this.key){this.key=k;const F=loopFit(this.L,this.d,this.c,this.fs);this.b=F.b;this.gl=F.g}return this.b}
fInit(){const fs=this.fs,B=(t,f,Q,g)=>bqC(t,f,Q,g,fs);return this.F={la:0,dl:FLV.hd.map(()=>new Float64Array(64)),dw:0,pb:new Float64Array(2048),pw:0,lpP:0,lps:0,popE:0,pops:0,ca:[1,1,1,1],form:FLV.form.map(f=>[B('bp',f[0],f[1],0),Math.pow(10,f[2]/20)]),hp:B('hp',28,.7,0),nb:[B('hp',1500,.7,0),B('lp',7000,.7,0)],ib:[B('bp',420,2.2,0),B('bp',880,3,0)],pf:[B('bp',260,1.2,0),B('bp',1100,1.5,0)],sh:B('ls',FLV.shelf[0],.7,FLV.shelf[1]),aU:1-Math.exp(-1/(fs*.04)),aD:1-Math.exp(-1/(fs*.08)),kp:Math.exp(-1/(fs*.012)),Dp:2*FLV.L/556.7*fs}}
processF(out){const n=this.n,fs=this.fs,F=this.F||this.fInit(),V=this.vol*FLV.vg,S3=1.7320508075688772;
for(let s=0;s<out.length;s++){this.N+=(this.Nt-this.N)*this.aN;this.amp+=((this.N>30?1:0)-this.amp)*this.aA;F.la+=(this.ld-F.la)*(this.ld>F.la?F.aU:F.aD);const N=this.N,la=F.la,amp=this.amp;
const inc=n*N/120/fs*this.sc,ph0=this.ph;this.ph+=inc;if(this.ph>=n){this.ph-=n;this.wraps++;if(this.nxEnv){this.env=this.nxEnv;this.nxEnv=null}if(this.nx){this.tab=this.nx;this.nx=null;this.swapAt=this.cnt}this.periods.push(this.cnt);this.newCycle();this.amps.push(this.ac)}
let x=0,ev=0;const w=N*Math.PI/30,dw=F.dw;for(let k=0;k<4;k++){let pk=this.ph+k*360,p0=ph0+k*360;if(pk>=n)pk-=n;if(p0>=n)p0-=n;if(pk<p0){F.ca[k]=this.cv?1+FLV.jit*(2*this.rnd()-1):1;if(la<.08&&N>2200&&this.nrnd()<FLV.pop*Math.min(1,(N-2200)/2000)){F.popE=1;F.pops++}}
const i=Math.floor(pk),f=pk-i,i1=i+1<n?i+1:0;ev+=this.env[i];F.dl[k][dw]=(this.tab[i]*(1-f)+this.tab[i1]*f)*w*F.ca[k]*FLV.hg[k];const d=FLV.hd[k]*fs,q=dw-d,qi=Math.floor(q),qf=q-qi;x+=F.dl[k][qi&63]*(1-qf)+F.dl[k][(qi+1)&63]*qf}F.dw=(dw+1)&63;
const lf0=.2+.8*Math.pow(la,.8),lo=Math.min(1,Math.max(0,(1600-N)/700));x*=FLV.gain/FLV.ref*(lf0+(1-lf0)*lo)*Math.min(6,Math.pow(3500/Math.max(N,1),.9));
const e4=ev/4/.05,nz=bqP(F.nb[1],bqP(F.nb[0],2*this.nrnd()-1))*FLV.noise*Math.min(4,e4*e4)*(.3+.7*la)*N/3000;
let pp=0;if(F.popE>1e-4){pp=(bqP(F.pf[0],2*this.nrnd()-1)+.6*bqP(F.pf[1],2*this.nrnd()-1))*F.popE*FLV.popG;F.popE*=F.kp}
let u=(x+nz+pp)*amp;const dr=FLV.drive*(.25+.75*la)*(.4+.6*Math.min(1,N/6000));u=Math.tanh(dr*(u+FLV.asym*u*u))/Math.max(.2,Math.tanh(dr));
const pq=F.pw-F.Dp,pi=Math.floor(pq),pf=pq-pi,yd=F.pb[pi&2047]*(1-pf)+F.pb[(pi+1)&2047]*pf;F.lpP=(1-FLV.damp)*yd+FLV.damp*F.lpP;const y=u-FLV.r*F.lpP;F.pb[F.pw]=y;F.pw=(F.pw+1)&2047;
let z=y;for(const fm of F.form)z+=fm[1]*bqP(fm[0],y);
const fc=FLV.dark+(FLV.bright-FLV.dark)*Math.pow(la,.7)*(.5+.5*Math.min(1,N/5000));F.lps+=(z-F.lps)*(1-Math.exp(-2*Math.PI*fc/fs));z=FLV.lpmix*F.lps+(1-FLV.lpmix)*z;
{const fp=2*Math.PI*this.ph/n*4;let sw=0;for(let h=1;h<=6;h++)sw+=Math.sin(h*fp)/h;z+=FLV.intake*(bqP(F.ib[0],sw)+.5*bqP(F.ib[1],sw))*la*la*Math.min(1,N/5500)*amp}
z=bqP(F.hp,bqP(F.sh,z));const c=this.comp.proc(z),o=V*c,ao=Math.abs(o);out[s]=amp<1e-9&&Math.abs(z)<1e-9?0:ao<=.8?o:Math.sign(o)*(.8+.2*Math.tanh((ao-.8)/.2));this.cnt++}
if(this.periods.length>4096){this.periods=this.periods.slice(-2048);this.amps=this.amps.slice(-2048)}}
process(out){if(this.fm)return this.processF(out);const n=this.n,fs=this.fs,bf=this.buf,M=bf.length,b=this.loop(),D=Math.max(2,2*this.L/this.c*fs-b/(1-b)),di=Math.floor(D),df=D-di,g0=ACON.gc,V=this.vol*1.6,rl=this.gl*(1-this.M)/(1+this.M);
for(let s=0;s<out.length;s++){this.N+=(this.Nt-this.N)*this.aN;this.amp+=((this.N>30?1:0)-this.amp)*this.aA;
const inc=n*this.N/120/fs*this.sc;this.ph+=inc;if(this.ph>=n){this.ph-=n;this.wraps++;if(this.nxEnv){this.env=this.nxEnv;this.nxEnv=null}if(this.nx){this.tab=this.nx;this.nx=null;this.swapAt=this.cnt}this.periods.push(this.cnt);this.newCycle();this.amps.push(this.ac)}
const i=Math.floor(this.ph),f=this.ph-i,x=this.tab[i%n]*(1-f)+this.tab[(i+1)%n]*f,am=this.ap+(this.ac-this.ap)*this.ph/n,en=this.env[i%n]*(1-f)+this.env[(i+1)%n]*f,nz=this.fl>0?this.bpf((2*this.nrnd()-1)*1.7320508075688772)*this.fl*AN*(en/.05)**2:0,src=(x*am*this.N*Math.PI/30+nz)*this.amp;
const j=(this.w-di+M)%M,k2=(j-1+M)%M,yd=bf[j]*(1-df)+bf[k2]*df;this.lp=(1-b)*yd+b*this.lp;/* 出口は開放端：反射は反転し，弱まる分は管内の損失と開口端の放射（h）と，出口の平均流（(1 − M)/(1 + M)）（SPEC-21 B の 1） */const y=src-rl*this.lp;bf[this.w]=y;this.w=(this.w+1)%M;
const z=this.comp.proc(g0*y);const u=V*z,au=Math.abs(u);out[s]=this.amp<1e-9&&Math.abs(y)<1e-12?0:au<=.8?u:Math.sign(u)*(.8+.2*Math.tanh((au-.8)/.2));this.cnt++}
if(this.periods.length>4096){this.periods=this.periods.slice(-2048);this.amps=this.amps.slice(-2048)}}}
const WSRC=()=>`const FLV=${JSON.stringify(FLV)};${bqC.toString()}${bqP.toString()}const AN=${AN},R=${R},PI=Math.PI,ACON=${JSON.stringify(ACON)};const AU=${JSON.stringify(AU)};${loopMag.toString()}${loopFit.toString()}${onePoleB.toString()}${Comp.toString()}${Synth.toString()}
registerProcessor('eng',class extends AudioWorkletProcessor{constructor(o){super();this.s=new Synth(sampleRate,o.processorOptions);this.port.onmessage=e=>this.s.set(e.data)}process(i,o){this.s.process(o[0][0]);return true}});`;
let WURL=null;const wurl=()=>WURL||(WURL=URL.createObjectURL(new Blob([WSRC()],{type:'application/javascript'})));
const durl=()=>'data:application/javascript;charset=utf-8,'+encodeURIComponent(WSRC());
async function addWorklet(ctx){try{await ctx.audioWorklet.addModule(wurl());return'blob'}catch(e){await ctx.audioWorklet.addModule(durl());return'data'}}
/* 音と振動の既定は OFF（SPEC-21 D の 5，画面の文書 SPEC-36 D の 1） */
const SND0=0,HAP0=0;
const SND={ctx:null,node:null,path:'',on:SND0,cyc:-1,err:''};
async function sndEnsure(){if(SND.ctx){if(SND.ctx.state!=='running')try{await SND.ctx.resume()}catch(e){}return}
const AC=window.AudioContext||window.webkitAudioContext;if(!AC){SND.path='なし';return}const ctx=SND.ctx=new AC({latencyHint:'interactive'});const o={Nt:0,vol:0,L:LP.Lex,d:LP.dex,cv:LP.cvar,fl:LP.fl,fm:LP.sm,ld:0,c:cEx()};
try{const how=await addWorklet(ctx);SND.node=new AudioWorkletNode(ctx,'eng',{numberOfInputs:0,outputChannelCount:[1],processorOptions:o});SND.post=m=>SND.node.port.postMessage(m);SND.path='AudioWorklet('+how+')'}
catch(e){SND.err=String(e);const sy=new Synth(ctx.sampleRate,o),sp=ctx.createScriptProcessor(1024,0,1);sp.onaudioprocess=ev=>sy.process(ev.outputBuffer.getChannelData(0));SND.node=sp;SND.post=m=>sy.set(m);SND.path='ScriptProcessor'}
SND.node.connect(ctx.destination);SND.cyc=-1;if(ctx.state!=='running')try{await ctx.resume()}catch(e){}}
function sndFeed(){return{Nt:SND.on&&!U.busy&&!document.hidden?live.s.Nb:0,vol:LP.vol,L:LP.Lex,d:LP.dex,cv:LP.cvar,fl:LP.fl,fm:LP.sm,ld:sndLoad(live.s.y[6],LP.pa)}}
function sndTick(){if(!SND.post)return;const m=sndFeed();if(live.s.cyc!==SND.cyc&&live.last&&live.last.me){SND.cyc=live.s.cyc;m.tab=mkTable(live.last.me);m.env=mkEnv(live.last.me);m.M=exMach(live.last.me,LP.pa,LP.dex,cEx())}SND.post(m)}
/* ===== 振動による体感（SPEC-36）．DOM とブラウザの API に依らない．時刻は ms ===== */
const HAPC={w0:8,w1:80,wm:5,ph:1.2e6,H:10000,Ts:100,tau:50,cont:16,gap:4,nmax:98,Nmin:30,dN:.05,dW:.25};
/* 区分（A の 2）：'b' 燃焼，'x' 失火，'m' 圧縮だけ，'s' 停止．c.s.Mx は完爆後に完了した直前のサイクルの記録 */
function hapKind(c){const s=c.s;if(s.fired&&s.fuel){const M=s.Mx;return M?(M.Qin>0?'b':'x'):'m'}if(s.fired||s.starter)return'm';return's'}
/* パルス幅（A の 3〜4）[ms]．0 は振動なし，Infinity は途切れない振動．Th：開始の間隔 [ms] */
function hapPulse(k,imep,Th){if(k==='s'||k==='x')return 0;if(!(Th>=HAPC.cont))return Infinity;const w=k==='m'?HAPC.wm:HAPC.w0+(HAPC.w1-HAPC.w0)*Math.min(1,Math.max(0,imep/HAPC.ph));return Math.min(w,Th/2)}
/* パターン（C の 2）：振動の区間 segs（絶対時刻 [ms]）を t0 からの整数 ms の配列にする．戻り値の on は丸めた後の振動の区間（絶対時刻） */
function hapPattern(segs,t0){const p=[],on=[];let cur=0;for(const[s,e]of segs){const a=Math.max(0,Math.round(s-t0)),b=Math.round(e-t0);if(b<=a)continue;
 if(!p.length){if(p.length+2>HAPC.nmax)break;if(a>0)p.push(0,a);p.push(b-a);on.push([t0+a,t0+b])}
 else if(a-cur<HAPC.gap){p[p.length-1]+=b-cur;on[on.length-1][1]=t0+b}else{if(p.length+2>HAPC.nmax)break;p.push(a-cur,b-a);on.push([t0+a,t0+b])}cur=b}
 return{p:p.length?p:[0,HAPC.Ts],on}}
/* 位相と送る判断（B，C の 1，3，4）．tick(now, i)：i = {on, Nb, kind, imep, r, cyc, mode}．戻り値：null（送らない），0（止める），配列（パターン） */
class Hap{constructor(){this.t=null;this.Nh=0;this.psi=0;this.last=-1e9;this.cyc=null;this.on=[];this.until=-1e9;this.rsP=0;this.sN=0;this.sw=0;this.sk='';this.stop=1}
 tick(now,i){if(!i.on){this.t=null;this.cyc=null;if(this.stop)return null;this.stop=1;this.on=[];return 0}
  const dt=this.t==null?0:now-this.t;this.t=now;this.Nh=dt?this.Nh+(i.Nb-this.Nh)*(1-Math.exp(-dt/HAPC.tau)):i.Nb;
  const k=this.Nh<HAPC.Nmin?'s':i.kind,f=this.Nh/120e3*(i.mode?i.r:1),Th=f>0?1/f:Infinity;
  if(f>0){this.psi+=f*dt;if(this.psi>=1){const n=Math.floor(this.psi);this.psi-=n;this.last=now-this.psi/f}}
  /* シミュレーションの時間：サイクルの完了を検出したら，いちばん近い予定のパルスとの差が許容（B の 2，C の 3）を超えるときだけ，いまパルスを始めて送り直す */
  if(i.mode&&this.cyc!=null&&i.cyc!==this.cyc&&f>0){let e=Infinity;for(const q of this.on)if(Math.abs(now-q[0])<Math.abs(e))e=now-q[0];if(!(Math.abs(e)<=Math.max(10,.2*Th))){this.psi=0;this.last=now;this.rsP=1}}
  this.cyc=i.cyc;
  if(k==='s'){if(this.stop)return null;this.stop=1;this.on=[];return 0}
  const w=hapPulse(k,i.imep,Th),need=this.stop||this.rsP||now>=this.until-HAPC.Ts||k!==this.sk||Math.abs(this.Nh-this.sN)>HAPC.dN*this.sN||(isFinite(w)&&isFinite(this.sw)?Math.abs(w-this.sw)>HAPC.dW*this.sw:w!==this.sw);
  if(!need)return null;
  /* 振動の区間の中では送らない（途切れない振動は待たない） */
  if(isFinite(w)&&this.on.some(([a,b])=>a<now-1e-9&&now<b-1e-9))return null;
  /* 位相を，前の命令で最後に始まったパルスからの経過で置き直す（C の 3） */if(!this.rsP&&isFinite(w)&&f>0){let ls=-Infinity;for(const q of this.on)if(q[0]<=now&&q[0]>ls)ls=q[0];if(ls>-Infinity&&now-ls<Th){this.psi=(now-ls)*f;this.last=ls}}
  const segs=[];if(!isFinite(w))segs.push([now,now+HAPC.H]);else if(w>0)for(let j=0;j<=HAPC.nmax/2;j++){const s=now+(j-this.psi)*Th;if(s>=now+HAPC.H)break;if(s+w>now)segs.push([s,s+w])}
  const P=hapPattern(segs,now);this.on=P.on;this.until=P.on.length?P.on[P.on.length-1][1]:now+HAPC.Ts;this.sN=this.Nh;this.sw=w;this.sk=k;this.stop=0;this.rsP=0;return P.p}}
/* 運転中の機関から Hap への入力（mode：0 実時間，1 シミュレーションの時間．r：再生速度の倍率） */
function hapIn(c,mode,r){const M=c.s.Mx;return{on:1,Nb:c.s.Nb,kind:hapKind(c),imep:M?M.imep:0,r,cyc:c.s.cyc,mode}}
