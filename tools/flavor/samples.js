/* 試聴サンプル第1回（5 種）．先に tabs.js を実行する．試作用の合成器で，アプリの Synth（src/audio.js の processF）とは別実装（4A と同じ定数を FLV に移した） */
// 排気音の味付けの試聴サンプル（物理計算ではない演出）．音源表だけはシミュレーションの排気弁流量から取る．
const fs=require('fs'),OUT=__dirname+'/../../dist/',T=JSON.parse(fs.readFileSync(OUT+'flavor_tabs.json')),FS=48000,NT=1440;
// ---- 回転数と負荷の筋書き ----
const KEY=[[0,800,0],[2,800,0],[2.35,3200,.7],[2.5,3000,0],[3.6,850,0],[4.2,800,0],[4.6,1500,1],[11,6500,1],[12.5,6500,1],[12.6,6400,0],[15,2600,0],[15.25,4200,.8],[15.4,4000,0],[17.5,900,0],[19,800,0]];
const traj=t=>{let i=0;while(i<KEY.length-2&&t>=KEY[i+1][0])i++;const a=KEY[i],b=KEY[i+1],u=Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0])));return[a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]};
const DUR=19;
// ---- 表の補間（回転数×負荷） ----
function mixTab(N,ld,dst,src){const Ns=T.Ns;let i=0;while(i<Ns.length-2&&N>Ns[i+1])i++;const u=Math.min(1,Math.max(0,(N-Ns[i])/(Ns[i+1]-Ns[i])));const A=src[0],B=src[1];for(let k=0;k<NT;k++){const lo=A[i][k]*(1-u)+A[i+1][k]*u,hi=B[i][k]*(1-u)+B[i+1][k]*u;dst[k]=lo*(1-ld)+hi*ld}}
const rng=(s=>()=>{let t=(s=(s+0x6D2B79F5)>>>0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296})(2026);
const biq=(type,f0,Q,gdb)=>{const w=2*Math.PI*f0/FS,al=Math.sin(w)/(2*Q),c=Math.cos(w);let b0,b1,b2,a0,a1,a2;if(type==='bp'){b0=al;b1=0;b2=-al;a0=1+al;a1=-2*c;a2=1-al}else if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=b0;a0=1+al;a1=-2*c;a2=1-al}else if(type==='hp'){b0=(1+c)/2;b1=-(1+c);b2=b0;a0=1+al;a1=-2*c;a2=1-al}else{const A=Math.pow(10,gdb/40);b0=1+al*A;b1=-2*c;b2=1-al*A;a0=1+al/A;a1=-2*c;a2=1-al/A}
const o={x1:0,x2:0,y1:0,y2:0,p(x){const y=(b0*x+b1*o.x1+b2*o.x2-a1*o.y1-a2*o.y2)/a0;o.x2=o.x1;o.x1=x;o.y2=o.y1;o.y1=y;return y}};return o};
class Delay{constructor(n){this.b=new Float64Array(n);this.w=0}put(x){this.b[this.w]=x;this.w=(this.w+1)%this.b.length}get(d){const M=this.b.length,p=this.w-1-d,i=Math.floor(p),f=p-i;const a=this.b[((i%M)+M)%M],c=this.b[(((i+1)%M)+M)%M];return a*(1-f)+c*f}}
/* 味付けの設定
 cyl：気筒数（720° に等間隔で点火），hd：各気筒の排気管の遅れ [ms]，hg：各気筒の利得
 L：集合後の管長 [m]，r：反射率，drive：歪み（ラスプ），asym：非対称，form：[周波数,Q,利得dB] の共鳴
 intake：吸気音の量，noise：乱流雑音，pop：アクセルオフの破裂音，bright：高域の明るさ（負荷で開く低域フィルタの上限 Hz） */
function render(o,name){const tab=new Float64Array(NT),env=new Float64Array(NT),n=Math.round(DUR*FS),out=new Float32Array(n);
const hd=o.hd.map(ms=>ms*1e-3*FS),dl=o.hd.map(()=>new Delay(1024)),pipe=new Delay(8192),c=556.7,Dp=2*o.L/c*FS;let lpP=0;
const forms=(o.form||[]).map(f=>[biq('bp',f[0],f[1]),Math.pow(10,f[2]/20)]),hp=biq('hp',28,.7),lpA=biq('lp',1000,.7),nbp=[biq('hp',1500,.7),biq('lp',7000,.7)],ibp=[biq('bp',420,2.2),biq('bp',880,3)],popF=[biq('bp',260,1.2),biq('bp',1100,1.5)];
let clip=0,ph=0,Na=800,la=0,lpState=0,popE=0,cycAmp=o.hd.map(()=>1),e=0,hold=0,prevLd=0,rasp=0;
const ref=o.ref||1;
for(let s=0;s<n;s++){const t=s/FS,[Nt,ldt]=traj(t);Na+=(Nt-Na)*(1-Math.exp(-1/(FS*.03)));la+=(ldt-la)*(1-Math.exp(-1/(FS*(ldt>la?.04:.08))));
 if(s%64===0){mixTab(Na,la,tab,T.tab);mixTab(Na,la,env,T.env)}
 const inc=NT*Na/120/FS,ph0=ph;ph+=inc;if(ph>=NT)ph-=NT;const w=Na*Math.PI/30;
 // 各気筒
 let x=0,ev=0;const nc=o.cyl;for(let k=0;k<nc;k++){const pk=(ph+k*NT/nc)%NT,pk0=(ph0+k*NT/nc)%NT;if(pk<pk0){cycAmp[k]=1+o.jit*(2*rng()-1);if(o.pop&&la<.08&&Na>2200&&rng()<o.pop*Math.min(1,(Na-2200)/2000))popE=1}
  const i=Math.floor(pk),f=pk-i,v=(tab[i]*(1-f)+tab[(i+1)%NT]*f)*w*cycAmp[k]*o.hg[k];ev+=env[i];dl[k].put(v);x+=dl[k].get(hd[k])}
 {const lf0=.2+.8*Math.pow(la,.8),lo=Math.min(1,Math.max(0,(1600-Na)/700)),lf=lf0+(1-lf0)*lo;x*=o.gain/ref*lf*Math.min(6,Math.pow(3500/Na,.9))}
 // 乱流雑音（流量の包絡で変調）
 const nz=nbp[1].p(nbp[0].p(2*rng()-1))*o.noise*Math.min(4,(ev/nc/.05)**2)*(.3+.7*la)*(Na/3000);
 // アクセルオフの破裂音
 let pp=0;if(popE>1e-4){pp=(popF[0].p(2*rng()-1)+.6*popF[1].p(2*rng()-1))*popE*o.popG;popE*=Math.exp(-1/(FS*.012))}
 let src=x+nz+pp;
 // 歪み（負荷と回転で深くなる）
 const dr=o.drive*(.25+.75*la)*(.4+.6*Math.min(1,Na/6000));if(dr>0){const a=src+o.asym*src*src*Math.sign(1);src=Math.tanh(dr*a)/Math.max(.2,Math.tanh(dr))*(1)}
 // 集合管の共鳴
 const yd=pipe.get(Dp);lpP=(1-o.damp)*yd+o.damp*lpP;let y=src-o.r*lpP;pipe.put(y);
 // 消音器・車体の共鳴
 let z=y;for(const[f,g]of forms)z+=g*f.p(y);
 // 負荷で開く低域フィルタ（アクセルを踏むと明るくなる）
 const fc=o.dark+(o.bright-o.dark)*Math.pow(la,.7)*(.5+.5*Math.min(1,Na/5000)),al=1-Math.exp(-2*Math.PI*fc/FS);lpState+=(z-lpState)*al;z=o.lpmix*lpState+(1-o.lpmix)*z;
 // 吸気音
 if(o.intake){const fp=2*Math.PI*ph/NT*nc;let sw=0;for(let h=1;h<=6;h++)sw+=Math.sin(h*fp)/h;z+=o.intake*(ibp[0].p(sw)+.5*ibp[1].p(sw))*la*la*Math.min(1,Na/5500)}
 z=hp.p(z);
 // 圧縮
 const az=Math.abs(z);if(az>e){e=az;hold=FS*.2}else if(hold>0)hold--;else e*=Math.exp(-1/(FS*.3));const G=e>.35?Math.pow(.35/e,.75):1;const u=1.5*G*z,au=Math.abs(u);if(au>.8)clip++;out[s]=au<=.8?u:Math.sign(u)*(.8+.2*Math.tanh((au-.8)/.2))}
// 冒頭と末尾のフェード
for(let i=0;i<2400;i++){out[i]*=i/2400;out[n-1-i]*=i/2400}
let pk=0,rms=0;for(const v of out){pk=Math.max(pk,Math.abs(v));rms+=v*v}rms=Math.sqrt(rms/n);
const b=Buffer.alloc(44+2*n);b.write('RIFF',0);b.writeUInt32LE(36+2*n,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(FS,24);b.writeUInt32LE(FS*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(2*n,40);for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,out[i]))*32767),44+2*i);fs.writeFileSync(OUT+name,b);
// 区間ごとの RMS（確認用）
const seg=(a,c)=>{let q=0;for(let i=Math.round(a*FS);i<Math.round(c*FS);i++)q+=out[i]*out[i];return Math.sqrt(q/((c-a)*FS)).toFixed(3)};
console.log(name,'peak',pk.toFixed(2),'rms',rms.toFixed(3),'idle',seg(.5,2),'3000',seg(6.5,7.5),'6500',seg(11.2,12.4),'off',seg(13,15),'clip%',(100*clip/n).toFixed(2));return out}
const base={jit:.04,noise:.02,drive:0,asym:0,damp:.15,dark:6000,bright:6000,lpmix:0,intake:0,pop:0,popG:0,form:[]};
// 基準の大きさ：全開 3500 rpm の単気筒源の実効値
const REF=(()=>{const tb=T.tab[1][3];let q=0;for(const v of tb)q+=v*v;return Math.sqrt(q/NT)*3500*Math.PI/30})();
const V={
 '1_現行相当_単気筒':{...base,cyl:1,hd:[0],hg:[1],L:1,r:.6,gain:.3,ref:REF,noise:.03},
 '2_4気筒_等長_素直':{...base,cyl:4,hd:[0,0,0,0],hg:[1,.97,1.03,.99],L:1,r:.6,gain:.16,ref:REF},
 '3_4気筒_スポーツ':{...base,cyl:4,hd:[0,.25,.1,.4],hg:[1,.94,1.05,.97],L:.8,r:.7,damp:.1,gain:.2,ref:REF,drive:1.6,asym:.25,form:[[110,3,4],[330,4,3],[760,3,5],[1900,2.5,2]],dark:900,bright:7000,lpmix:.75,intake:.12,noise:.035,pop:.35,popG:.5},
 '4_4気筒_高回転レーシング':{...base,cyl:4,hd:[0,.05,.1,.05],hg:[1,.98,1.02,1],L:.55,r:.8,damp:.06,gain:.2,ref:REF,drive:2.6,asym:.35,form:[[420,4,4],[1150,4,7],[2600,3,6]],dark:1400,bright:9000,lpmix:.7,intake:.2,noise:.045,pop:.5,popG:.7},
 '5_4気筒_不等長ドロドロ':{...base,cyl:4,hd:[0,1.7,.2,1.9],hg:[1.1,.85,1.05,.9],L:1.3,r:.6,gain:.17,ref:REF,drive:1.2,asym:.2,form:[[85,3,6],[240,3,3],[600,3,2]],dark:700,bright:4500,lpmix:.8,intake:.06,noise:.03,pop:.2,popG:.4}};
for(const k in V)render(V[k],'排気音サンプル_'+k+'.wav');
