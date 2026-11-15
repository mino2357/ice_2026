# expC.js が書き出したヤコビアンの固有値（硬さ）を求める：python3 tools/review/eig.py
import json,os,numpy as np
d=json.load(open(os.path.join(os.path.dirname(__file__),'../../dist/review_jac.json')))
for nm,rows in d.items():
    arr=sorted([(max(abs(np.linalg.eigvals(np.array(r['J']).T))),r['tt'],r['om']) for r in rows],reverse=True)
    m,tt,om=arr[0];dt=min(0.5*np.pi/180/om,1e-4)
    print(f"{nm}: max|λ| = {m:.3e} 1/s（{tt:.0f}°CA），RK4 既定刻み Δt = {dt:.2e} s で |λ|Δt = {m*dt:.2f}（実軸の安定限界 2.79）")
