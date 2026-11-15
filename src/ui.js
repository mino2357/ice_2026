/* ===== UI state ===== */
const $=i=>document.getElementById(i);
let NOW=()=>performance.now();
const LP=mkP();let live=new Core(LP),AX=mkAX();
const U={mj:{},swTest:0,tab:0,sub:0,pg:4,mpg:0,x10:0,log:0,pend:{},undo:null,cross:[null,null,null,null,null,null,null],sel:1,ix:0,busy:0};
const Sim={debt:0,spd:.1};
const Base={ref:null,tl:-1e9,cp:l=>({p:Float32Array.from(l.p),V:Float32Array.from(l.V),imep:l.imep,pm:l.pm,N:l.N}),
cam:null,camC:0,change(c,now){if(now-this.tl>=3000){if(c.last)this.ref=this.cp(c.last);this.cam=valves({...LP},geo(LP));this.camC=LP.cam}this.tl=now},set(c){if(c.last)this.ref=this.cp(c.last);this.cam=valves({...LP},geo(LP));this.camC=LP.cam},clear(){this.ref=null;this.cam=null;this.tl=-1e9}};
let COL={};const readCol=()=>{const cs=getComputedStyle(document.documentElement),v=n=>cs.getPropertyValue(n).trim();COL={fg:v('--fg'),mu:v('--mu'),ln:v('--ln'),ac:v('--ac'),cd:v('--cd'),ng:v('--ng')}};
/* ===== input helpers ===== */
function tap(el,fn){let d;el.addEventListener('pointerdown',e=>{d={x:e.clientX,y:e.clientY,t:NOW()}});el.addEventListener('pointerup',e=>{if(d&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8&&NOW()-d.t<500)fn(e);d=0});el.addEventListener('pointercancel',()=>d=0)}
function hold(el,ms,fn){let t;el.addEventListener('pointerdown',()=>{clearTimeout(t);t=setTimeout(fn,ms)});['pointerup','pointercancel','pointerleave'].forEach(v=>el.addEventListener(v,()=>clearTimeout(t)))}
/* ===== time advance (frame-rate independent) ===== */
function advance(st,c,el,budget){st.debt+=Math.min(el,.05)*st.spd;const t0=performance.now();let n=0;while(st.debt>0){st.debt-=c.step();if(budget&&(++n&31)===0&&performance.now()-t0>budget){st.debt=Math.min(st.debt,0);break}}}
/* ===== settings logic ===== */
const note=t=>{$('ts').textContent=t};
function setParam(k,v,noUndo){const it=IT[k],old=LP[k];if(it.c==='r'){if(v===LP[k])delete U.pend[k];else U.pend[k]=v;rs();return}if(v===old)return;
Base.change(live,NOW());if(k==='sauto'&&v===0&&old===1&&live.s.fired){const sv=LP.spb;LP.spb=gv(IT.spb,gi(IT.spb,live.s.spa));live.s.spa=LP.spb;if(!noUndo)U.undo=null;note(`点火の自動最適化：ON → OFF（自動値 ${LP.spb}° を手動値へ引継ぎ，前の手動値 ${sv}°）`);LP[k]=v;rs();return}LP[k]=v;if(!noUndo)U.undo={k,old};note(`${it.n}：${disp(it,old)} → ${disp(it,v)}${it.u?' '+it.u:''}`);rs()}
const pval=k=>k in U.pend?U.pend[k]:LP[k];
function stepItem(k,dir){if(ctlSt(k))return;const it=IT[k],n=gi(it,pval(k))+dir*(U.x10?10:1),m=Math.max(gmin(it),Math.min(gmax(it),n));setParam(k,gv(it,m))}
const lamOK=()=>pval('S')/2/pval('lr')<=.5+1e-12;
function applyPend(){if(!Object.keys(U.pend).length||!lamOK())return;const ks=Object.keys(U.pend);ks.forEach(k=>LP[k]=U.pend[k]);U.pend={};U.undo=null;live.reset();Base.clear();axReset(AX);Sim.debt=0;note('適用：'+ks.map(k=>IT[k].n).join('，')+'（コールドリセット）');rs()}
function undo(){const u=U.undo;if(!u)return;U.undo=null;setParam(u.k,u.old,1);note(`元に戻しました：${IT[u.k].n} = ${disp(IT[u.k],u.old)}`)}
function defaults(){ITEMS.filter(i=>i.pg===U.pg).forEach(i=>setParam(i.k,defv(i),1));U.undo=null;note('このページを既定値に戻しました');rs()}
function coldReset(){live.reset();Base.clear();axReset(AX);Sim.debt=0}
/* ===== rendering: settings ===== */
/* SPEC-18 B.7：回転数の制御で使わない項目．'a' = 制御が操作中（現在の値を表示），'n' = 不使用，'' = 有効 */
const CTLU={alm:['a',''],fm:['','a'],fb:['n','']},ctlSt=k=>CTLU[k]?CTLU[k][LP.mode?1:0]:'';
const ctlVal=k=>k==='spb'?live.s.spa.toFixed(1):k==='alm'?(live.s.al/D).toFixed(1):live.s.fc.toFixed(2);
/* 自動の値の行を毎フレーム書き換える（設定タブの表示中に loop から呼ぶ） */
function liveVals(){for(const k of['spb','alm','fm']){if(!(k==='spb'?LP.sauto:ctlSt(k)==='a'))continue;const e=$('Pg').querySelector(`b[data-v="${k}"]`);if(e)e.textContent=ctlVal(k)}}
function rs(){const its=ITEMS.filter(i=>i.pg===U.pg),eng=U.pg===0;$('pt').textContent=`${PAGES[U.pg]}  ${U.pg+1}/${PAGES.length}`;
$('Pg').innerHTML=its.map(it=>{const v=pval(it.k),pd=it.k in U.pend;if(it.ch){const cur=it.vals?it.vals.indexOf(v):v;return`<div class="r c"><span>${it.n}</span><div>${it.ch.map((n,i)=>`<button data-k="${it.k}" data-c="${i}" class="${i===cur?'on':''}">${n}</button>`).join('')}</div></div>`}
const n=gi(it,v),cs=ctlSt(it.k),au=it.k==='spb'&&LP.sauto||cs==='a',na=cs==='n',lk=au||na;return`<div class="r${pd?' p':''}"><span>${it.n}${au?'（自動）':na?'（不使用）':''}${it.u?' ['+it.u+']':''}</span><b data-v="${it.k}">${au?ctlVal(it.k):disp(it,v)}</b><button data-k="${it.k}" data-s="-1"${lk||n<=gmin(it)?' disabled':''}>−</button><button data-k="${it.k}" data-s="1"${lk||n>=gmax(it)?' disabled':''}>＋</button></div>`}).join('');
$('x10').textContent=U.x10?'刻み×10':'刻み×1';$('x10').className=U.x10?'on':'';$('un').disabled=!U.undo;
$('bs').style.display=eng?'none':'';$('ap').style.display=$('ds').style.display=eng?'':'none';$('act').style.gridTemplateColumns=`repeat(${eng?5:4},1fr)`;
const hasP=Object.keys(U.pend).length>0;$('ap').disabled=!hasP||!lamOK();$('ds').disabled=!hasP;
$('pv').style.display=$('pvt').style.display=eng?'none':'';$('drv').style.display=eng?'':'none';
if(eng){const Pq={...LP,...U.pend},G=geo(Pq),ok=lamOK();$('drv').innerHTML=`<b>導出値${hasP?'（保留中の値で計算）':''}</b><br>連桿比 λ = r/l = ${G.lam.toFixed(3)} ${ok?'':'<b class="ng">（λ ≤ 0.5 を満たさないため適用不可）</b>'}<br>行程容積 V_d = ${(G.Vd*1e6).toFixed(1)} cm³<br>隙間容積 V_c = ${(G.Vc*1e6).toFixed(1)} cm³<br>クリアランス高さ h_c = ${(G.hc*1e3).toFixed(2)} mm<br>弁干渉：${valveHit(Pq,G)?'<b class="ng">VALVE HIT</b>':'なし'}<br><span style="color:var(--mu)">この4項目は「適用」で確定し，コールドリセットします．</span>`}swFresh()}
function pvText(){if(camPg()){$('pvt').textContent=camText(LP,live.G);return}const l=live.last,r=Base.ref;if(!l){$('pvt').textContent='運転タブで START してください';return}const sg=x=>(x>=0?'+':'')+x.toFixed(0);
$('pvt').textContent=`IMEP ${(l.imep/1e3).toFixed(0)} kPa${r?'（基準比 '+sg((l.imep-r.imep)/1e3)+'）':''}  p_max ${(l.pm/1e3).toFixed(0)} kPa${r?'（'+sg((l.pm-r.pm)/1e3)+'）':''}  N̄ ${live.s.Nb.toFixed(0)} rpm`}
/* ===== canvases ===== */
const dprc=()=>Math.min(devicePixelRatio||1,2.5);
function fit(c){const q=dprc(),w=Math.max(1,Math.round(c.clientWidth*q)),h=Math.max(1,Math.round(c.clientHeight*q));if(c.width!==w||c.height!==h){c.width=w;c.height=h}}
function prep(c){const W=c.clientWidth,H=c.clientHeight;if(!W||!H)return null;fit(c);const g=c.getContext('2d'),d=c.width/W;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.setTransform(d,0,0,d,0,0);return{g,W,H}}
/* ===== WOT sweep tab (REQ-26) ===== */
const SW={run:null,cur:null,ref:null,sub:0,t0:0,maxMs:0,step:SWC.step,als:SWC.als.slice(),crit:SWC.critD,flow:SWC.flowD,proc:SWC.procD,nmin:SWC.crit[SWC.critD].nmin,nmax:SWC.nmax};
const swO=()=>({crit:SW.crit,flow:SW.flow,proc:SW.proc,nmin:SW.nmin,nmax:SW.nmax}),swSig=()=>JSON.stringify(LP)+'|'+JSON.stringify([SW.step,SW.als.slice().sort((a,b)=>b-a),SW.crit,SW.flow,SW.proc,SW.nmin,SW.nmax]);
function swStart(){if((U.busy&&!U.swTest)||SW.run)return;SW.run=new SweepSet({...LP},swN(SW.step),SW.als,swO());SW.run.sig=swSig();SW.run.P={...LP};SW.run.step=SW.step;SW.t0=NOW();$('swg').textContent='中止';swText();swFresh()}
function swStop(){SW.run=null;$('swg').textContent='計測開始';swText();swFresh()}
function swTick(ms){if(!SW.run)return false;const t=performance.now(),d=SW.run.run(ms);SW.maxMs=Math.max(SW.maxMs,performance.now()-t);if(d){if(SW.cur)SW.ref=SW.cur;const R=SW.run;SW.cur={sets:R.sets,pts:R.pts,sig:R.sig,el:(NOW()-SW.t0)/1e3,P:R.P,step:R.step,o:R.o};swStop()}return d}
function swSub(n){SW.sub=n;[...$('sws').children].forEach((b,j)=>b.className=j===n?'on':'');const g=n<4;$('tc').style.display=g?'':'none';$('swo').style.display=n===4?'':'none';$('swa').style.display=n===5?'':'none';$('swt').style.display=g?'':'none';if(n===4)swOpts();if(n===5)swCond()}
function swOpts(){const B=(k,v,lab,on)=>`<button data-o="${k}" data-v="${v}" class="${on?'on':''}">${lab}</button>`,S=(k,v,off)=>`<button data-o="${k}" data-v="${v}"${off?' disabled':''}>${v<0?'−':'＋'}</button>`;
$('swo').innerHTML=`<p>スロットル開度 [°]（複数選択）</p><div class="ob o5">${SWC.alsAll.map(a=>B('al',a,a,SW.als.includes(a))).join('')}</div><p>回転数の刻み [rpm]</p><div class="ob o4">${SWC.steps.map(v=>B('st',v,v,v===SW.step)).join('')}</div><p>収束の判定</p><div class="ob o3">${Object.keys(SWC.crit).map(k=>B('cr',k,SWC.crit[k].n,k===SW.crit)).join('')}${B('fl',1,'流量・状態量',SW.flow)}</div><p>サイクル数（最少・最多）</p><div class="ob ocy">${S('nmin',-1,SW.nmin<=SWC.nminR[0])}<span>最少 <b data-c="nmin">${SW.nmin}</b></span>${S('nmin',1,SW.nmin>=Math.min(SWC.nminR[1],SW.nmax))}${S('nmax',-1,SW.nmax-SWC.nmaxSt<Math.max(SWC.nmaxR[0],SW.nmin))}<span>最多 <b data-c="nmax">${SW.nmax}</b></span>${S('nmax',1,SW.nmax>=SWC.nmaxR[1])}</div><p>手順</p><div class="ob o3">${Object.keys(SWC.procs).map(k=>B('pr',k,SWC.procs[k],k===SW.proc)).join('')}</div>`}
function swSet(k,v){if(k==='al'){v=+v;const i=SW.als.indexOf(v);if(i>=0){if(SW.als.length>1)SW.als.splice(i,1)}else SW.als.push(v);SW.als.sort((a,b)=>b-a)}else if(k==='st')SW.step=+v;else if(k==='cr'){SW.crit=v;SW.nmin=Math.min(SWC.crit[v].nmin,SW.nmax)}else if(k==='nmin')SW.nmin=Math.max(SWC.nminR[0],Math.min(SWC.nminR[1],SW.nmax,SW.nmin+(+v)));else if(k==='nmax')SW.nmax=Math.max(SWC.nmaxR[0],SW.nmin,Math.min(SWC.nmaxR[1],SW.nmax+SWC.nmaxSt*(+v)));else if(k==='fl')SW.flow=!SW.flow;else if(k==='pr')SW.proc=v;swOpts();swText()}
/* 前提の表：計測に使う設定は，計測中は実行中の計測の設定，それ以外は現在の適用済みの設定（次の計測に使う値）．SPEC-26 B.4 */
function swFresh(){if(SW.sub===5)swCond()}
function swCond(){const R=SW.run,P=R?R.P:LP,old=!R&&SW.cur&&SW.cur.sig!==swSig(),pend=Object.keys(U.pend).length>0,G=geo(P),V=valves(P,G),f=(v,d)=>(+v).toFixed(d),st=SW.step,n=swN(st).length,dg=r=>f(r/D,0)+'°',row=(a,b)=>`<tr><td>${a}</td><td>${b}</td></tr>`,C=SWC.crit[SW.crit];
$('swa').innerHTML=`<table><tr><th colspan="2">固定する条件</th></tr>${row('スロットル開度',`<b data-c="al">${SW.als.join('・')}</b>°（90° = 全開）`)}${row('回転数の保持','速度一定の理想動力計（dω/dt = 0）')}${row('点火・変動','MBT（CA50 = 10° ATDC），サイクル変動 OFF')}${row('壁温 T_w',`<b data-c="Tw">${SWC.Tw}</b> K 固定`)}
<tr><th colspan="2">回転数の点</th></tr>${row('範囲・刻み',`${SWC.N0}〜${SWC.N1} rpm，<b data-c="st">${st}</b> rpm，<b data-c="n">${n}</b> 点`)}${row('手順',SWC.procs[SW.proc]+(SW.proc==='up'?'（前の点から継続）':SW.proc==='updown'?'（上りと下りの平均）':'（各点を単独に開始）'))}
<tr><th colspan="2">収束の判定：${C.n}（直近 <b data-c="last">${SWC.last}</b> サイクルの幅）</th></tr>${row('T_b',`≤ <b data-c="tolR">${f(C.tolR*100,1)}</b>%·|T_b| + <b data-c="tolA">${C.tolA}</b> N·m`)}${row('MBT・流量',`≤ <b data-c="tolS">${C.tolS}</b>°，${SW.flow?`η_v・ṁ_th・p_in ≤ ${f(C.tolR*100,1)}%`:'流量・状態量は判定しない'}`)}${row('サイクル数',`最少 <b data-c="nmin">${SW.nmin}</b>，最多 <b data-c="nmax">${SW.nmax}</b>，最後の値を採る`)}
<tr><th colspan="2">${R?'<span data-c="run">計測中の設定</span>':'現在の設定（次の計測に使う）'}${old?'<br><span data-c="old">表示中の曲線は変更前の設定で計測（再計測で更新）</span>':''}${pend?'<br><span data-c="pend">保留中の変更は [適用] の後に使う</span>':''}</th></tr>${row('大気圧・φ',`${f(P.pa/1e3,1)} kPa，${f(P.phi,2)}`)}${row('ε・B×S',`<b data-c="eps">${f(P.eps,1)}</b>，${f(P.B*1e3,0)}×${f(P.S*1e3,0)} mm`)}${row('カム・リフト・弁径',`<b data-c="cam">${IT.cam.ch[P.cam]}</b>，<b data-c="Lv">${f(P.Lv*1e3,1)}</b> mm，${f(P.dv*1e3,0)} mm`)}${row('IVO・IVC・EVO・EVC',`<b data-c="ivo">${dg(V.i.o)}</b>・<b data-c="ivc">${dg(V.i.c)}</b>・${dg(V.e.o)}・${dg(V.e.c)}`)}${row('吸気ランナ',P.run?`ON，${f(P.Lr*1e3,0)} mm，内径 ${f(P.dr*1e3,0)} mm`:'OFF')}${row('排気系',P.exs?`ON，V_m ${f(P.Vm*1e3,1)} L，A_t ${f(P.At*1e6,0)} mm²`:`OFF，圧損 ${f(P.dpx/1e3,1)} kPa`)}${row('補機負荷',`<b data-c="Ta">${f(P.Ta,1)}</b> N·m`)}</table>`}
function swText(){const r=$('swt').children,R=SW.run;let a='',c='',b='';if(R){const S=R.S,m=R.o.proc==='indep'?R.sets[R.k].pts.length:S.pts.length,pass=R.o.proc==='updown'?(R.j?'（下り）':'（上り）'):'';a=`計測中 開度 ${R.als[R.k]}°（${R.k+1}/${R.als.length}）${pass} ${m}/${R.Ns.length}`}else if(SW.cur){const p=SW.cur.pts,mt=p.reduce((m,o)=>o.tb>m.tb?o:m,p[0]),mp=p.reduce((m,o)=>o.pb>m.pb?o:m,p[0]),s0=SW.cur.sets[0],o=SW.cur.o||{};a=`完了 ${SW.cur.el.toFixed(1)} s（${SWC.procs[o.proc||'up']}，${(SWC.crit[o.crit||'strict']||{}).n}${o.flow?'＋流量':''}）`+(o.proc==='updown'?`　往復差 ${(100*s0.dT).toFixed(2)}%`:'');c=`${s0.al}° 最大 ${mt.tb.toFixed(1)} N·m @ ${mt.N}，${(mp.pb/1e3).toFixed(1)} kW @ ${mp.N} rpm`}else{a='計測開始で性能曲線を求めます';c=`開度 ${SW.als.join('・')}°，${SW.step} rpm 刻み（条件で変更）`}
if(!R&&SW.cur&&SW.cur.sig!==swSig())b='設定が変わりました（再計測で更新）';else if(SW.ref)b='灰色：基準（前回の計測）';r[0].textContent=a;r[1].textContent=c;r[2].textContent=b;$('swg').disabled=!!U.busy&&!R&&!U.swTest}
let SLAY=[];function drawSw(){const q=prep($('tc'));if(!q)return;const cur=SW.run?SW.run.sets.filter(x=>x.pts.length):SW.cur&&SW.cur.sets;SLAY=drawScreen(q.g,q.W,q.H,sweepSpec(cur,SW.ref&&SW.ref.sets,SW.sub),COL,null)}
function drawPv0(){const q=prep($('pv0'));if(q)drawScreen(q.g,q.W,q.H,screenSpec(live,AX,0,{now:NOW(),ref:Base.ref}),COL,null)}
function drawEng(){const q=prep($('eng'));if(q)drawEngine(q.g,live,q.W,q.H-NTB,COL);ntRender()}
/* ===== target-rpm slider (REQ-23) ===== */
const NTD={on:0,off:0,v:NaN,u:NaN};
const ntW=()=>Math.max(1,$('ntr').clientWidth-44);
const ntU=v=>Math.max(0,Math.min(1,(v-NTS.lo)/(NTS.hi-NTS.lo)));
const ntVal=u=>NTS.lo+Math.round(Math.max(0,Math.min(1,u))*(NTS.hi-NTS.lo)/NTS.st)*NTS.st;
function ntRender(){const v=LP.nt,u=ntU(v),w=ntW();if(v!==NTD.v){NTD.v=v;$('ntv').innerHTML=`目標<b>${v}</b>rpm`;$('ntm').disabled=v<=NTS.lo}const x=Math.round(u*w*10)/10;if(x!==NTD.u){NTD.u=x;$('ntk').style.transform=`translateX(${x}px)`}}
function ntStep(d){const it=IT.nt,v=gv(it,Math.max(gmin(it),gi(it,LP.nt)+d));if(v!==LP.nt)setParam('nt',v);ntRender()}
function initNT(){const k=$('ntk'),r=$('ntr');
k.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();NTD.on=1;const R=r.getBoundingClientRect();NTD.off=e.clientX-(R.left+22+ntU(LP.nt)*ntW());try{k.setPointerCapture(e.pointerId)}catch(x){}k.classList.add('on')});
const mv=e=>{if(!NTD.on)return;e.preventDefault();const R=r.getBoundingClientRect(),u=(e.clientX-NTD.off-R.left-22)/ntW(),v=ntVal(u);if(v!==LP.nt)setParam('nt',v);ntRender()};
const up=e=>{if(!NTD.on)return;mv(e);NTD.on=0;k.classList.remove('on')};
k.addEventListener('pointermove',mv);k.addEventListener('pointerup',up);k.addEventListener('pointercancel',()=>{NTD.on=0;k.classList.remove('on')});
tap($('ntm'),()=>{if(LP.nt>NTS.lo)ntStep(-1)});tap($('ntp'),()=>ntStep(1));ntRender()}
let LAY=[];function drawCh(){const q=prep($('ch'));if(!q)return;LAY=drawScreen(q.g,q.W,q.H,screenSpec(live,AX,U.sub,{now:NOW(),log:U.log,ref:U.sub===0?Base.ref:null}),COL,U.cross[U.sub]);
const cr=U.cross[U.sub];if(cr!=null&&U.sub>0){const g=q.g,th=U.sub<5;g.font='11px system-ui,sans-serif';g.textBaseline='top';g.fillStyle=COL.ac;LAY.forEach(L=>{const sp=L.sp,xv=sp.xa.a+cr*(sp.xa.b-sp.xa.a),txt=sp.ser.map(s=>{let bi=0,bd=1e9;for(let i=0;i<s.X.length;i++){const dd=Math.abs(s.X[i]-xv);if(dd<bd){bd=dd;bi=i}}const v=s.Y[bi];return v==null||v!==v?'–':(+v).toPrecision(4)}).join(' / ');g.textAlign='right';g.fillText((th?'θ='+xv.toFixed(0)+'°: ':'t='+xv.toFixed(1)+'s: ')+txt,L.pl.x+L.pl.w,L.pl.y+2)})}}
const camPg=()=>U.pg===1||U.pg===2;
function drawPv(){const q=prep($('pv'));if(!q)return;drawScreen(q.g,q.W,q.H,camPg()?[camSpec(LP,live.G,Base.cam,Base.camC)]:screenSpec(live,AX,0,{now:NOW(),last:1,ref:Base.ref}),COL,null)}
function ctlRender(){const t=ctlText(live);$('ctl').innerHTML=t.map(x=>`<div>${x||'&nbsp;'}</div>`).join('')}
const wTier=()=>innerWidth>=900?2:innerWidth>=700?1:0; /* 画面の段階（REQ-15 H）：0 小，1 中，2 大 */
function met(){const all=wTier()>0,L=all?metricList(live,0).concat(metricList(live,1)):metricList(live,U.mpg),M=$('M'),key=L.map(q=>q[0]).join('|');if(M.dataset.key!==key){M.dataset.key=key;M.innerHTML=L.map(q=>`<div data-k="${q[0]}"><b></b><span></span></div>`).join('')}L.forEach((q,i)=>{const d=M.children[i],b=d.firstChild,sp=d.lastChild,jp=!!U.mj[q[0]],t=jp?q[2]:q[0];if(b.textContent!==t)b.textContent=t;if(b.classList.contains('jp')!==jp)b.classList.toggle('jp',jp);if(sp.textContent!==q[1])sp.textContent=q[1]})}
/* ===== tabs ===== */
function show(i){if(U.tab===4)DV.top[DV.cur]=$('s4').scrollTop;U.tab=i;[...$('N').children].forEach(b=>b.className=+b.dataset.t===i?'on':'');for(let j=0;j<6;j++)$('s'+j).className=i===j?'on':'';if(i===5){swSub(SW.sub);swText()}$('pl').className='';if(i===2)rs();if(i===3)rchips();if(i===4){docVals();fitMath($('s4'));if(DV.cur===0)docReveal();$('s4').scrollTop=DV.top[DV.cur]}}
function setSub(n){U.sub=n;[...$('sg').children].forEach((x,j)=>x.className=j===n?'on':'');$('pvo').style.display=n===0?'':'none';pvo()}
const pvo=()=>{$('lin').className=U.log?'':'on';$('lg').className=U.log?'on':''};
const sndLbl=()=>{const b=$('snd');b.textContent=SND.on?'音ON':'音OFF';b.className=SND.on?'on':''};
const sp=()=>[...$('sp').children].forEach(b=>{if(b.dataset.v)b.className=+b.dataset.v===Sim.spd?'on':''});
function initUI(){readCol();initNT();
tap($('M'),e=>{const d=e.target.closest('#M>div');if(d){const k=d.dataset.k;if(U.mj[k])delete U.mj[k];else U.mj[k]=1;met()}});tap($('N'),e=>{const b=e.target.closest('button');if(b)show(+b.dataset.t)});
tap($('swg'),()=>{if(SW.run)swStop();else swStart()});tap($('swo'),e=>{const b=e.target.closest('button[data-o]');if(b)swSet(b.dataset.o,b.dataset.v)});tap($('swc'),()=>{SW.ref=null;swText()});tap($('sws'),e=>{const b=e.target.closest('button');if(b)swSub([...$('sws').children].indexOf(b))});
tap($('b1'),()=>{live.start();if(SND.on)sndEnsure()});tap($('b2'),()=>live.stop());hold($('b3'),600,coldReset);
tap($('sp'),e=>{const b=e.target.closest('button[data-v]');if(b){Sim.spd=+b.dataset.v;sp()}});tap($('mp'),()=>{U.mpg^=1;$('mp').textContent=U.mpg?'指標2':'指標1'});tap($('snd'),()=>{SND.on^=1;sndLbl();if(SND.on)sndEnsure()});sndLbl();
document.addEventListener('visibilitychange',()=>{if(!SND.ctx)return;if(document.hidden)SND.ctx.suspend().catch(()=>{});else if(SND.on)SND.ctx.resume().catch(()=>{})});
['p-V','p-θ','弁','吸気','トルク','ECU','動力計'].forEach(t=>$('sg').insertAdjacentHTML('beforeend',`<button>${t}</button>`));
tap($('sg'),e=>{const b=e.target.closest('button');if(b)setSub([...$('sg').children].indexOf(b))});
tap($('lin'),()=>{U.log=0;pvo()});tap($('lg'),()=>{U.log=1;pvo()});tap($('bs2'),()=>{Base.set(live)});
tap($('ch'),e=>{if(!LAY.length)return;const r=$('ch').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,L=LAY.find(q=>x>=q.pl.x&&x<=q.pl.x+q.pl.w&&y>=q.pl.y-16&&y<=q.pl.y+q.pl.h+34)||LAY.find(q=>x>=q.pl.x&&x<=q.pl.x+q.pl.w),f=L?(x-L.pl.x)/L.pl.w:-1;U.cross[U.sub]=U.cross[U.sub]!=null||f<0||f>1?null:f});
tap($('pp'),()=>{U.pg=(U.pg+PAGES.length-1)%PAGES.length;rs()});tap($('pn'),()=>{U.pg=(U.pg+1)%PAGES.length;rs()});tap($('pt'),()=>{$('pl').className='on'});
$('pl').innerHTML=PAGES.map((n,i)=>`<button data-p="${i}">${n}</button>`).join('');tap($('pl'),e=>{const b=e.target.closest('button');if(b){U.pg=+b.dataset.p;$('pl').className='';rs()}});
tap($('Pg'),e=>{const b=e.target.closest('button[data-k]');if(!b||b.disabled)return;const it=IT[b.dataset.k];if(b.dataset.c!=null)setParam(it.k,it.vals?it.vals[+b.dataset.c]:+b.dataset.c);else stepItem(it.k,+b.dataset.s)});
tap($('x10'),()=>{U.x10^=1;rs()});tap($('un'),undo);tap($('df'),defaults);tap($('bs'),()=>{Base.set(live);note('現在のサイクルを基準にしました')});tap($('ap'),applyPend);tap($('ds'),()=>{U.pend={};note('保留を破棄しました');rs()});
tap($('rt'),()=>{U.busy?(U.cancel=1):runAll()});tap($('cp'),e=>{const b=e.target.closest('button');if(b){U.sel=+b.dataset.i;const r=TR[U.sel];U.ix=r?Math.max(0,r.findIndex(q=>!q.ok)):0;dtl()}});tap($('pvb'),()=>{const r=TR[U.sel];if(r&&r.length){U.ix=(U.ix+r.length-1)%r.length;dtl()}});tap($('nxb'),()=>{const r=TR[U.sel];if(r&&r.length){U.ix=(U.ix+1)%r.length;dtl()}});
buildDoc();buildToc();tap($('toc'),e=>{const a=e.target.closest('[data-go]');if(a)docGo(+a.dataset.go)});tap($('dtop'),()=>{$('s4').scrollTop=0});tap($('dsw'),e=>{const b=e.target.closest('button[data-d]');if(b)docShow(+b.dataset.d)});for(const k of[1,2,3])tap($('dv'+k),docTap);docShow(0);addEventListener('resize',()=>{if(DV.cur)docFit(DV.cur)});if(document.fonts&&document.fonts.load)document.fonts.load("16px 'ICE-Sim Math'").catch(()=>{}); /* 数式フォントを先に読み込み，解説タブを初めて開くときの待ちを減らす */setSub(0);sp();rs();rchips();show(0);
if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readCol);new MutationObserver(readCol).observe(document.documentElement,{attributes:true});
let last=performance.now(),lastDraw=0,slow=0;
function loop(now){requestAnimationFrame(loop);const el=(now-last)/1e3;last=now;if(document.hidden)return;
if(!U.busy){advance(Sim,live,el,9);swTick(8)}axUpdate(live,AX,now);sndTick();
if(now-lastDraw<15)return;lastDraw=now;if(U.busy&&!U.uiDraw)return;
if(U.tab===0){drawEng();met();ctlRender();drawPv0()}else if(U.tab===1)drawCh();else if(U.tab===5){drawSw();swText()}else if(U.tab===2&&U.pg!==0){drawPv();if(camPg()||++slow%6===0)pvText();liveVals()}}
requestAnimationFrame(loop)}
