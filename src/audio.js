/* ===== sound: crank-angle wavetable + exhaust-pipe resonator (pure DSP, shared by AudioWorklet / fallback / tests) ===== */
const AU={NT:1440,G:.04,tauN:.05,tauA:.03,Nmin:30,kd:.7,Tex:800};
const cEx=()=>Math.sqrt(gmT(AU.Tex,0)*R*AU.Tex);                 /* speed of sound in exhaust [m/s] */
const pipeF=(L,n)=>(2*n-1)*cEx()/(4*L);                          /* quarter-wave resonances [Hz] */
function mkEnv(me){return Float32Array.from(me,v=>v===v?Math.abs(v)*1e-3:0)}
function mkTable(me){const n=AU.NT,t=new Float32Array(n),h=2*(P4/n);let m=0;for(let i=0;i<n;i++){const a=me[(i+n-1)%n],b=me[(i+1)%n];t[i]=((b===b?b:0)-(a===a?a:0))*1e-3/h;m+=t[i]}m/=n;for(let i=0;i<n;i++)t[i]-=m;return t}
const AN=40;
const ACON={nu:8.4e-5,Pr:.7,gx:1.35,fref:1000,T:.35,Rc:4,tauR:.3,ko:1.6,sa:.03,sT:.005};
function loopMag(f,L,d,c){const a=d/2,al=Math.sqrt(PI*f*ACON.nu)*(1+(ACON.gx-1)/Math.sqrt(ACON.Pr))/(a*c),ka=2*PI*f/c*a;return Math.exp(-2*al*L-ka*ka/2)}
function onePoleB(m,w){if(!(m<1))return 0;const A=m*m-1,B=2*(1-m*m*Math.cos(w)),dd=B*B-4*A*A;const r1=(-B+Math.sqrt(dd))/(2*A),r2=(-B-Math.sqrt(dd))/(2*A);return [r1,r2].find(x=>x>=0&&x<1)||0}
class Comp{constructor(fs){this.e=0;this.h=0;this.nh=Math.round(fs*.2);this.kr=Math.exp(-1/(fs*.3))}
gain(e){return e>.35?Math.pow(.35/e,1-1/4):1}
proc(x){const ax=Math.abs(x);if(ax>=this.e*.999){if(ax>this.e)this.e=ax;this.h=this.nh}else if(this.h>0)this.h--;else this.e*=this.kr;return this.gain(this.e)*x}}
class Synth{
constructor(fs,o){this.fs=fs;this.n=1440;this.tab=new Float32Array(1440);this.nx=null;this.ph=0;this.N=0;this.Nt=0;this.amp=0;this.vol=.6;this.L=1;this.r=.6;this.d=.04;this.c=556.7;this.cv=1;this.seed=12345;
this.buf=new Float64Array(4096);this.w=0;this.lp=0;this.wraps=0;this.swapAt=-1;this.cnt=0;this.key='';this.b=0;this.comp=new Comp(fs);
this.ap=1;this.ac=1;this.sc=1;this.st=0;this.periods=[];this.amps=[];this.env=new Float32Array(1440);this.nxEnv=null;this.fl=0;this.ns=0;this.bq=[0,0,0,0,0,0,0,0];this.nk='';this.bc=null;
this.aN=1-Math.exp(-1/(fs*.05));this.aA=1-Math.exp(-1/(fs*.03));if(o)this.set(o,1);this.st=this.seed>>>0}
set(o,imm){if(o.tab)this.nx=Float32Array.from(o.tab);if(o.env)this.nxEnv=Float32Array.from(o.env);if(imm&&this.nx){this.tab=this.nx;this.nx=null}if(imm&&this.nxEnv){this.env=this.nxEnv;this.nxEnv=null}
for(const k of['Nt','vol','L','r','c','d','cv','seed','fl'])if(o[k]!=null)this[k]=o[k];if(imm){this.N=this.Nt;this.amp=this.Nt>30?1:0;this.st=this.seed>>>0;this.ns=(this.seed^0x9E3779B9)>>>0}}
nrnd(){let t=(this.ns=(this.ns+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
biq(){if(this.bc)return this.bc;const f=(f0,hp)=>{const w=2*Math.PI*f0/this.fs,al=Math.sin(w)/(2*Math.SQRT1_2),cw=Math.cos(w),a0=1+al,b0=hp?(1+cw)/2:(1-cw)/2,b1=hp?-(1+cw):1-cw;return[b0/a0,b1/a0,b0/a0,-2*cw/a0,(1-al)/a0]};return this.bc=[f(1000,1),f(6000,0)]}
bpf(x){const[h,l]=this.biq(),q=this.bq;const y1=h[0]*x+h[1]*q[0]+h[2]*q[1]-h[3]*q[2]-h[4]*q[3];q[1]=q[0];q[0]=x;q[3]=q[2];q[2]=y1;const y2=l[0]*y1+l[1]*q[4]+l[2]*q[5]-l[3]*q[6]-l[4]*q[7];q[5]=q[4];q[4]=y1;q[7]=q[6];q[6]=y2;return y2}
rnd(){let t=(this.st=(this.st+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}
uz(){return(2*this.rnd()-1)*Math.sqrt(3)}
newCycle(){this.ap=this.ac;if(this.cv){this.ac=1+.03*this.uz();this.sc=1/(1+.005*this.uz())}else{this.ac=1;this.sc=1}}
loop(){const k=this.L+'|'+this.d+'|'+this.c;if(k!==this.key){this.key=k;this.b=onePoleB(loopMag(1000,this.L,this.d,this.c),2*Math.PI*1000/this.fs)}return this.b}
process(out){const n=this.n,fs=this.fs,bf=this.buf,M=bf.length,b=this.loop(),D=Math.max(2,2*this.L/this.c*fs-b/(1-b)),di=Math.floor(D),df=D-di,r=this.r,g0=.16*(1-r),V=this.vol*1.6;
for(let s=0;s<out.length;s++){this.N+=(this.Nt-this.N)*this.aN;this.amp+=((this.N>30?1:0)-this.amp)*this.aA;
const inc=n*this.N/120/fs*this.sc;this.ph+=inc;if(this.ph>=n){this.ph-=n;this.wraps++;if(this.nxEnv){this.env=this.nxEnv;this.nxEnv=null}if(this.nx){this.tab=this.nx;this.nx=null;this.swapAt=this.cnt}this.periods.push(this.cnt);this.newCycle();this.amps.push(this.ac)}
const i=Math.floor(this.ph),f=this.ph-i,x=this.tab[i%n]*(1-f)+this.tab[(i+1)%n]*f,am=this.ap+(this.ac-this.ap)*this.ph/n,en=this.env[i%n]*(1-f)+this.env[(i+1)%n]*f,nz=this.fl>0?this.bpf((2*this.nrnd()-1)*1.7320508075688772)*this.fl*AN*(en/.05)**2:0,src=(x*am*this.N*Math.PI/30+nz)*this.amp;
const j=(this.w-di+M)%M,k2=(j-1+M)%M,yd=bf[j]*(1-df)+bf[k2]*df;this.lp=(1-b)*yd+b*this.lp;const y=src-r*this.lp;bf[this.w]=y;this.w=(this.w+1)%M;
const z=this.comp.proc(g0*y);const u=V*z,au=Math.abs(u);out[s]=this.amp<1e-9&&Math.abs(y)<1e-12?0:au<=.8?u:Math.sign(u)*(.8+.2*Math.tanh((au-.8)/.2));this.cnt++}
if(this.periods.length>4096){this.periods=this.periods.slice(-2048);this.amps=this.amps.slice(-2048)}}}
const WSRC=()=>`const AN=${AN},gmT=${gmT.toString()},R=${R},PI=Math.PI,ACON=${JSON.stringify(ACON)};${loopMag.toString()}${onePoleB.toString()}${Comp.toString()}${Synth.toString()}
registerProcessor('eng',class extends AudioWorkletProcessor{constructor(o){super();this.s=new Synth(sampleRate,o.processorOptions);this.port.onmessage=e=>this.s.set(e.data)}process(i,o){this.s.process(o[0][0]);return true}});`;
let WURL=null;const wurl=()=>WURL||(WURL=URL.createObjectURL(new Blob([WSRC()],{type:'application/javascript'})));
const durl=()=>'data:application/javascript;charset=utf-8,'+encodeURIComponent(WSRC());
async function addWorklet(ctx){try{await ctx.audioWorklet.addModule(wurl());return'blob'}catch(e){await ctx.audioWorklet.addModule(durl());return'data'}}
const SND={ctx:null,node:null,path:'',on:1,cyc:-1,err:''};
async function sndEnsure(){if(SND.ctx){if(SND.ctx.state!=='running')try{await SND.ctx.resume()}catch(e){}return}
const AC=window.AudioContext||window.webkitAudioContext;if(!AC){SND.path='なし';return}const ctx=SND.ctx=new AC({latencyHint:'interactive'});const o={Nt:0,vol:0,L:LP.Lex,r:LP.rex,d:LP.dex,cv:LP.cvar,fl:LP.fl,c:cEx()};
try{const how=await addWorklet(ctx);SND.node=new AudioWorkletNode(ctx,'eng',{numberOfInputs:0,outputChannelCount:[1],processorOptions:o});SND.post=m=>SND.node.port.postMessage(m);SND.path='AudioWorklet('+how+')'}
catch(e){SND.err=String(e);const sy=new Synth(ctx.sampleRate,o),sp=ctx.createScriptProcessor(1024,0,1);sp.onaudioprocess=ev=>sy.process(ev.outputBuffer.getChannelData(0));SND.node=sp;SND.post=m=>sy.set(m);SND.path='ScriptProcessor'}
SND.node.connect(ctx.destination);SND.cyc=-1;if(ctx.state!=='running')try{await ctx.resume()}catch(e){}}
function sndFeed(){return{Nt:SND.on&&!U.busy&&!document.hidden?live.s.Nb:0,vol:LP.vol,L:LP.Lex,r:LP.rex,d:LP.dex,cv:LP.cvar,fl:LP.fl}}
function sndTick(){if(!SND.post)return;const m=sndFeed();if(live.s.cyc!==SND.cyc&&live.last&&live.last.me){SND.cyc=live.s.cyc;m.tab=mkTable(live.last.me);m.env=mkEnv(live.last.me)}SND.post(m)}
