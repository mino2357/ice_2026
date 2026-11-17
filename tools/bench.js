const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();await p.goto('file://'+(process.argv[2]||require('path').resolve(__dirname,'../dist/engine.html')));await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const med=a=>a.sort((x,y)=>x-y)[a.length>>1];const o={};
const t1=[];let st;for(let k=0;k<5;k++){const c=new Core({...mkP(),cvar:0});c.start();const t=performance.now();c.run(10);t1.push(performance.now()-t);st=JSON.stringify(c.s.y)}o.idle10s=med(t1).toFixed(0)+' ms';
const t2=[];let sw;for(let k=0;k<5;k++){const t=performance.now();const S=new Sweep({...mkP()},swN(500));while(!S.run(1e9));t2.push(performance.now()-t);sw=JSON.stringify(S.pts.map(q=>[q.tb,q.ev,q.spa]))}o.sweep13=med(t2).toFixed(0)+' ms';
const c=new Core({...mkP(),cvar:0});c.start();c.run(3);const y=c.s.y.slice();const t=performance.now();let acc=0;for(let i=0;i<1e6;i++){y[0]+=1e-3;acc+=c.f(y)[2]}o.f_us=((performance.now()-t)).toFixed(0)+' ns/call';
let h=0;for(const ch of st+sw)h=(h*31+ch.charCodeAt(0))|0;o.hash=h;o.st=st.slice(0,80);return o});console.log(JSON.stringify(r));await b.close()})();
