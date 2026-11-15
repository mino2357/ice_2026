const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();p.on('pageerror',e=>console.log('ERR',e.message));await p.goto('file://'+require('path').resolve(__dirname,'../../dist/engine.html'));await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const IX=[2,3,4,6,7,8,9,10,13,14,15],NS=2880,out=[];
const mk=(cfg,N,al)=>{const c=new Core({...mkP(),cvar:0,sauto:1,mode:1,alm:al*D,sol:0,dth:.25*D,nt:N,...cfg});c.fixw=1;c.fixTw=1;c.s.y[5]=360;c.s.y[1]=N*PI/30;c.s.Nb=N;c.start();return c};
const cyc=c=>{for(let i=0;i<NS;i++)c.step()};
const get=c=>IX.map(i=>c.s.y[i]).concat([c.s.spa]);
const F=(c0,x)=>{const c=c0.clone();c.fixw=1;c.fixTw=1;IX.forEach((i,k)=>c.s.y[i]=x[k]);c.s.spa=x[11];cyc(c);return get(c)};
for(const [nm,cfg,N,al] of [['WOT3000',{},3000,90],['a10_1500',{},1500,10],['WOT3000_Lr900',{Lr:.9},3000,90],['a10_1500_OL80',{ivo:-40*D,evc:760*D},1500,10],['a5_800',{},800,5],['WOT3000_fixedspark',{sauto:0,spb:24},3000,90]]){
const c=mk(cfg,N,al);for(let k=0;k<400;k++)cyc(c);const x0=get(c),x1=F(c,x0),res=Math.max(...x0.map((v,i)=>Math.abs(x1[i]-v)/(Math.abs(v)+1e-9)));
// scales from one-cycle ranges
const sc=[x0[0]*.002,x0[1]*.002,Math.max(x0[2],x0[1]*.01)*.002,x0[3]*.002,Math.max(x0[4],1e-7)*.01,2e-5,x0[6]*.002,Math.max(x0[7],1e-8)*.01,2e-5,x0[9]*.002,x0[10]*.002,.05];
const J=e=>{const M=[];for(let j=0;j<12;j++){const a=x0.slice(),b2=x0.slice();a[j]+=e*sc[j];b2[j]-=e*sc[j];const fa=F(c,a),fb=F(c,b2);M.push(fa.map((v,i)=>(v-fb[i])/(2*e*sc[j])))}return M};// M[j][i]=dF_i/dx_j
out.push({nm,N,al,x0,res,sc,J1:J(1),J2:J(.3),M:{tb:c.lastM.tb,xr:c.lastM.xr,ev:c.lastM.ev,spa:c.s.spa,imep:c.lastM.imep}})}return out});
fs.writeFileSync(require('path').resolve(__dirname,'A.json'),JSON.stringify(r));console.log(r.map(q=>q.nm+' res='+q.res.toExponential(2)+' '+JSON.stringify(q.M)).join('\n'));await b.close()})();
