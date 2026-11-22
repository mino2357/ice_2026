### SPEC-24：内部 EGR と点火時期の妥当性の確かめ方（REQ-24）

1. **オーバーラップの変え方**：オーバーラップ角 $\theta_{\text{OL}} = \text{EVC} - (\text{IVO} + 720^\circ)$ を，IVO と EVC だけで変える（$\text{IVO} = -10, -25, -40^\circ$，$\text{EVC} = 730, 745, 760^\circ$ の組で $\theta_{\text{OL}} = 20, 50, 80^\circ$）．カムの位相で変えると EVO と IVC も動き，効果が混ざるため．
2. **期待する傾向**：残留ガスの相関（Fox–Cheng–Heywood）は，オーバーラップによる項が $\frac{OF}{N}\sqrt{p_{\text{em}} - p_{\text{im}}}$ に比例する（$OF$：オーバーラップ係数，$N$：回転数，$p_{\text{em}}$，$p_{\text{im}}$：排気・吸気マニホールド圧）．したがって，
   * 吸気管の負圧が大きい軽負荷ほど，オーバーラップで $x_r$ が大きく増える．
   * 部分負荷では，$x_r$ の増加に伴って吸気管圧が上がってポンプ損失が減り，$T_{\max}$ が下がり，正味熱効率は下がらない．
   * 全開では吸排気の差圧が小さく，内部 EGR は小さい．
   * MBT 点火時期は回転とともに進角し，希釈（$x_r$ の増加）でも進角する．
3. **判定値**：実測に余裕を持たせて決めた．実機の典型値との比較は推定で，文献値で確かめたものではない．

* **出典**：[J. W. Fox, W. K. Cheng, J. B. Heywood, SAE Technical Paper 931025 (1993)](https://doi.org/10.4271/931025)；[P. Öberg and L. Eriksson, SAE (2006)](https://www.fs.isy.liu.se/Publications/Articles/SAE_06_POLE.pdf)

---

