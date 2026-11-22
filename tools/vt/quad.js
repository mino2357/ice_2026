/* 2 次のモデルを使う信頼領域法の探索器（試作．SPEC-32 C の候補）．vtSearch と同じ約束の generator：
   yield {x, cls} で評価を求め，next(J) で値を受け取る（cls は 'mc'：粗い許容，'fine'：細かい許容）．
   変数は整数の x ∈ Z^n（°）．feas(x)：制約（作用角，VALVE HIT）を満たすか．O：{nmc, sd, seed, nmax, d0, dmax, rnd（乱数の関数を作る）} */
'use strict';
/* 連立 1 次方程式（部分ピボットの消去法）．A は n×n，b は n */
function solve(A,b){
 const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){
  let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
  if(Math.abs(M[p][c])<1e-14)return null;
  [M[c],M[p]]=[M[p],M[c]];
  for(let r=c+1;r<n;r++){const f=M[r][c]/M[c][c];if(f)for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k]}
 }
 const x=Array(n).fill(0);
 for(let r=n-1;r>=0;r--){let s=M[r][n];for(let k=r+1;k<n;k++)s-=M[r][k]*x[k];x[r]=s/M[r][r]}
 return x
}
/* 2 次式 m(s) = c + g·s + ½ sᵀHs の最小二乗の当てはめ．pts：[{s（n 成分），J，w（重み）}]．full：H の非対角も求める（15 個）か，対角だけ（9 個）か．ridge で正則化 */
function fitQuad(pts,n,full){
 const idx=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)idx.push([i,j]);
 const np=1+2*n+(full?idx.length:0);
 if(pts.length<np)return null;
 const phi=s=>{const v=[1,...s,...s.map(a=>.5*a*a)];if(full)for(const[i,j]of idx)v.push(s[i]*s[j]);return v};
 const A=[...Array(np)].map(()=>Array(np).fill(0)),b=Array(np).fill(0);
 for(const p of pts){const v=phi(p.s);for(let i=0;i<np;i++){b[i]+=p.w*v[i]*p.J;for(let j=0;j<np;j++)A[i][j]+=p.w*v[i]*v[j]}}
 let tr=0;for(let i=0;i<np;i++)tr+=A[i][i];
 for(let i=1;i<np;i++)A[i][i]+=1e-9*tr/np;
 const c=solve(A,b);
 if(!c)return null;
 const g=c.slice(1,1+n),H=[...Array(n)].map(()=>Array(n).fill(0));
 for(let i=0;i<n;i++)H[i][i]=c[1+n+i];
 if(full)idx.forEach(([i,j],k)=>{H[i][j]=H[j][i]=c[1+2*n+k]});
 return{c:c[0],g,H,val:s=>{let v=c[0];for(let i=0;i<n;i++){v+=g[i]*s[i];for(let j=0;j<n;j++)v+=.5*s[i]*H[i][j]*s[j]}return v}}
}
/* 箱の中の 2 次式の最大：max m(s)，lo ≤ s ≤ hi．各変数を「下端・上端・自由」の 3 通りに固定した 3^n 通りで，自由な変数の停留点を解き，箱の中にあるもののうち最大を取る（n = 4 で 81 通り．停留点が箱の中に無い組は捨てる．頂点の組は必ず残るので解は必ずある） */
function boxMax(m,lo,hi){
 const n=lo.length;let best=null;
 const rec=(i,st)=>{
  if(i<n){for(const k of[0,1,2])rec(i+1,[...st,k]);return}
  const fr=[],s=Array(n).fill(0);
  st.forEach((k,j)=>{if(k===0)s[j]=lo[j];else if(k===1)s[j]=hi[j];else fr.push(j)});
  if(fr.length){
   const A=fr.map(a=>fr.map(b=>m.H[a][b])),r=fr.map(a=>{let v=-m.g[a];for(let j=0;j<n;j++)if(!fr.includes(j))v-=m.H[a][j]*s[j];return v}),z=solve(A,r);
   if(!z)return;
   for(let q=0;q<fr.length;q++){if(z[q]<lo[fr[q]]-1e-9||z[q]>hi[fr[q]]+1e-9)return;s[fr[q]]=z[q]}
  }
  const v=m.val(s);
  if(!best||v>best.v)best={s,v}
 };
 rec(0,[]);
 return best
}
function* vtQuad(x0,feas,O){
 const n=x0.length,rnd=O.rnd(O.seed),gau=()=>{let u=0;while(u===0)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rnd())},
  memo=new Map,R={x0:x0.slice(),hist:[],ne:0,stop:false,stage:'',path:[]};
 let F=[],Fk=new Set;/* F：いまの信頼領域の探索で使う，細かい許容の点 {x, J}（始点ごとに作り直す．前の探索の点は，同じ点を求めたときだけ，評価し直さずに加わる） */
 const ev=function*(x,cls){
  const k=cls+':'+x.join(','),put=J=>{if(cls==='fine'&&J>-Infinity&&!Fk.has(k)){Fk.add(k);F.push({x:x.slice(),J})}return J};
  if(memo.has(k))return put(memo.get(k));
  let J=-Infinity;
  if(feas(x)){
   if(R.ne>=O.nmax){R.stop=true;return-Infinity}
   R.ne++;
   J=yield{x:x.slice(),cls};
   R.hist.push({x:x.slice(),J,stage:R.stage})
  }
  memo.set(k,J);
  return put(J)
 },seen=x=>Fk.has('fine:'+x.join(',')),dist=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
 /* 0．探索の前の点（細かい許容．上限で打ち切られても値が残るように最初に評価する） */
 R.stage='x0';
 const J0=yield*ev(x0,'fine');
 /* 1．標本（粗い許容．今の探索と同じ正規乱数） */
 R.stage='mc';
 const S=[{x:x0.slice(),J:yield*ev(x0,'mc')}];
 for(let g=0;g<O.nmc.length&&!R.stop;g++)for(let i=0;i<O.nmc[g]&&!R.stop;i++){
  let x,k=0;
  do{x=x0.map(v=>Math.round(v+O.sd[g]*gau()));k++}while((!feas(x)||memo.has('mc:'+x.join(',')))&&k<200);
  if(k<200)S.push({x,J:yield*ev(x,'mc')})
 }
 /* 2．応答曲面：標本の全部に 2 次式を当てはめ（標本の最良の点を原点，尺度 20°），標本の範囲の箱の中の最大点を候補にする．標本の最良の点，探索の前の点と比べて，最も良い点を 1 つ目の始点にする */
 R.stage='rs';
 const Sv=S.filter(p=>p.J>-Infinity).sort((a,b)=>b.J-a.J),sb=Sv[0];
 let xc=sb.x.slice(),Jc=yield*ev(xc,'fine');
 if(J0>Jc){xc=x0.slice();Jc=J0}
 if(O.rs!==false){
  const sc=20,m=fitQuad(Sv.map(p=>({s:p.x.map((v,i)=>(v-sb.x[i])/sc),J:p.J,w:1})),n,Sv.length>=20);
  if(m){
   const lo=sb.x.map((v,i)=>(Math.min(...Sv.map(p=>p.x[i]))-v)/sc),hi=sb.x.map((v,i)=>(Math.max(...Sv.map(p=>p.x[i]))-v)/sc),b=boxMax(m,lo,hi);
   if(b){
    let xm=sb.x.map((v,i)=>Math.round(v+sc*b.s[i]));
    for(let k=0;k<4&&!feas(xm);k++)xm=xm.map((v,i)=>Math.round((v+sb.x[i])/2));
    R.rs={x:xm.slice(),pred:b.v};
    const Jm=yield*ev(xm,'fine');
    R.rs.J=Jm;
    if(Jm>Jc){xc=xm;Jc=Jm;R.rs.used=true}
   }
  }
 }
 /* 3．信頼領域：中心 xc のまわりの細かい許容の点に 2 次式を当てはめ，箱 ‖s‖∞ ≤ Δ の中の最大点を評価する．1° の確認（8 近傍のどれも大きくない）まで行う */
 let d=O.d0;
 const axis=function*(dd){/* 軸の上の点 xc ± dd e_i のうち，まだ評価していないものを評価する．中心より良い点があれば true */
  let up=false;
  for(let i=0;i<n&&!R.stop;i++)for(const sg of[1,-1]){const x=xc.slice();x[i]+=sg*dd;if(!seen(x)){const J=yield*ev(x,'fine');if(J>Jc)up=true}}
  return up
 },recenter=()=>{/* 中心から 2Δ 以内の最良の点へ移る */
  const b=F.filter(p=>dist(p.x,xc)<=2*d).reduce((a,p)=>p.J>a.J?p:a,{J:Jc});
  if(b.x&&b.J>Jc){xc=b.x.slice();Jc=b.J;R.path.push({x:xc.slice(),J:Jc,d,ne:R.ne,k:R.nst});return true}
  return false
 },tr=function*(mg){/* mg：前の結果の点．中心がそこから sep° 以内に入ったら，同じ山とみなしてやめる（合流） */
  d=O.d0;
  R.path.push({x:xc.slice(),J:Jc,d,ne:R.ne,k:R.nst,st:1});
  for(let it=0;it<O.nit&&!R.stop;it++){
   if(mg&&dist(xc,mg)<=O.sep){R.merged=(R.merged||0)+1;return{x:xc.slice(),J:Jc,mg:true}}
   const rad=2*d,near=()=>F.filter(p=>dist(p.x,xc)<=rad);
   if(near().length<2*n+1){yield*axis(d);if(recenter())continue}
   const P=near().map(p=>({s:p.x.map((v,i)=>(v-xc[i])/d),J:p.J,w:1/(1+dist(p.x,xc)/d)})),mdl=fitQuad(P,n,P.length>=(n+1)*(n+2)/2+3)||fitQuad(P,n,false);
   let xn=null,pred=0;
   if(mdl){
    const b=boxMax(mdl,Array(n).fill(-1),Array(n).fill(1));
    let s=b.s.slice();
    for(let k=0;k<4;k++){const x=xc.map((v,i)=>Math.round(v+d*s[i]));if(feas(x)){xn=x;break}s=s.map(v=>v/2)}
    if(xn)pred=mdl.val(xn.map((v,i)=>(v-xc[i])/d))-mdl.val(Array(n).fill(0))
   }
   if(!xn||seen(xn)||!(pred>O.eps*Math.abs(Jc))){
    /* モデルが増分を見込まない：軸の点がそろっていなければ足し，そろっていれば Δ を半分に */
    if(yield*axis(d)){recenter();continue}
    if(d<=1)break;
    d=Math.max(1,d/2);
    continue
   }
   const Jn=yield*ev(xn,'fine'),rho=(Jn-Jc)/pred;
   if(Jn>Jc){
    const st=dist(xn,xc);
    xc=xn;
    Jc=Jn;
    if(rho>.7&&st>=.9*d)d=Math.min(O.dmax,2*d);
    R.path.push({x:xc.slice(),J:Jc,d,ne:R.ne,k:R.nst,rho})
   }else{
    if(d<=1){if(yield*axis(1)){recenter();continue}break}
    d=Math.max(1,d/2)
   }
  }
  d=1;
  for(let more=true;more&&!R.stop;){more=yield*axis(1);if(more)recenter()}
  return{x:xc.slice(),J:Jc}
 };
 R.stage='tr';
 R.nst=1;
 let best=yield*tr();
 /* 4．2 つ目の始点：標本のうち，1 つ目の結果と 1 つ目の始点から sep2° 以上離れた最良の点から，もう 1 度信頼領域の探索を行う．中心が 1 つ目の結果から sep° 以内に入ったら，同じ山とみなしてやめる */
 const st1=R.path[0].x;
 for(const p of Sv){
  if(R.nst>=O.ns||R.stop)break;
  if(dist(best.x,p.x)<O.sep2||dist(st1,p.x)<O.sep)continue;
  R.nst++;
  F=[];
  Fk=new Set;
  xc=p.x.slice();
  Jc=yield*ev(xc,'fine');
  if(!(Jc>-Infinity))continue;
  const r=yield*tr(best.x);
  if(!r.mg&&r.J>best.J)best=r
 }
 xc=best.x.slice();
 Jc=best.J;
 /* 感度：最後のモデルの対角の曲率から，J の低下が 0.1% 以内に収まる各成分の幅 ±δ_i = sqrt(2·0.001·|J|/|H_ii|)（Δ の尺度を戻す） */
 const P=[...memo].filter(([k,J])=>k.startsWith('fine:')&&J>-Infinity).map(([k,J])=>({x:k.slice(5).split(',').map(Number),J})).filter(p=>dist(p.x,xc)<=8).map(p=>({s:p.x.map((v,i)=>v-xc[i]),J:p.J,w:1})),mf=fitQuad(P,n,false);
 R.sens=mf?mf.H.map((r,i)=>r[i]<0?Math.sqrt(2e-3*Math.abs(Jc)/-r[i]):Infinity):null;
 return Object.assign(R,{x:xc,J:Jc,J0,local:!R.stop})
}
module.exports={vtQuad,fitQuad,boxMax,solve};
