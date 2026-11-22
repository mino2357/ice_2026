### REQ-01：スライダ・クランク運動学

**要求**：ボア $B$，ストローク $S$，クランク半径 $r = S/2$，連桿長 $l$，連桿比 $\lambda = r/l$，圧縮比 $\varepsilon$ から，行程容積 $V_d$，隙間容積 $V_c$，上死点からのピストン変位 $x(\theta)$，筒内容積 $V(\theta)$，$\frac{dV}{d\theta}$，伝熱面積 $A_w(\theta)$ を求めること．

**受入基準**：

1. $V(0) = V_c$，$V(\pi) = V_c + V_d$，$\dfrac{V(\pi)}{V(0)} = \varepsilon$（相対誤差 $10^{-12}$．TEST-01 項目 1）．
2. 解析式の $\dfrac{dV}{d\theta}$ が，$V(\theta)$ の中心差分と相対誤差 $10^{-9}$ 未満で一致する（項目 2）．
3. 設定できる諸元の全範囲（$\lambda \le 0.5$）で $V(\theta) > 0$，$0 \le x(\theta) \le S$（項目 3）．

**仕様**：仕様書 SPEC-01　**検証**：TEST-01

---

