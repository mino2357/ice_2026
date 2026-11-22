"""floquet.js が書き出した A.json から，サイクル写像の Jacobian の固有値（Floquet 乗数）を求める．"""
import json, os, numpy as np
A = json.load(open(os.path.join(os.path.dirname(__file__), 'A.json')))
for q in A:
    sc = np.array(q['sc'])
    for key in ('J1', 'J2'):          # 摂動の大きさ 2 通り（差分の頑健性の確認）
        J = np.array(q[key]).T        # J[i][j] = dF_i/dx_j
        Jn = J * sc[None, :] / sc[:, None]
        ev = sorted(np.linalg.eigvals(Jn), key=lambda z: -abs(z))
        print(q['nm'], key, ' '.join(f"{abs(z):.3f}∠{np.degrees(np.angle(z)):.0f}°" for z in ev[:8]))
