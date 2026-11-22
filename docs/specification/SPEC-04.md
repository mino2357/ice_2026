### SPEC-04：オリフィスの圧縮性流れ（順流・逆流・チョーク）（REQ-04）

#### 定義と式
上流（高圧側）のよどみ圧 $p_0 = \max(p_1, p_2)$，よどみ温度 $T_0$，比熱比 $\gamma_0$，下流の静圧 $p_d = \min(p_1, p_2)$，圧力比 $r_p = p_d/p_0 \in (0, 1]$ とする．エネルギーの式 $c_p T_0 = c_p T + \frac{u^2}{2}$ と等エントロピーの関係 $\frac{T}{T_0} = r_p^{(\gamma_0 - 1)/\gamma_0}$，$\rho = \frac{p_0}{RT_0}r_p^{1/\gamma_0}$ から，のど部の質量流束は
$$\rho u = \frac{p_0}{\sqrt{RT_0}}\,\Psi_{\text{sub}}(r_p), \qquad \Psi_{\text{sub}}(r_p) = r_p^{1/\gamma_0}\sqrt{\frac{2\gamma_0}{\gamma_0 - 1}\left(1 - r_p^{(\gamma_0 - 1)/\gamma_0}\right)}$$
$\frac{\partial(\rho u)}{\partial r_p} = 0$ から，流速が音速に達する臨界圧力比は $r_{\text{crit}} = \left(\frac{2}{\gamma_0 + 1}\right)^{\gamma_0/(\gamma_0 - 1)}$．$r_p \le r_{\text{crit}}$ では流量が飽和する（チョーク）．

$r_p \to 1$ では $\frac{d\Psi_{\text{sub}}}{dr_p} \to -\infty$ となり，右辺が Lipschitz 連続でなくなる．これを避けるため，$1 - r_p < \delta_r = 10^{-3}$ では原点を通る直線に置き換える：
$$\Psi(r_p) = \begin{cases} \sqrt{\gamma_0\left(\frac{2}{\gamma_0 + 1}\right)^{(\gamma_0 + 1)/(\gamma_0 - 1)}} & (r_p \le r_{\text{crit}}) \\[4pt] \Psi_{\text{sub}}(r_p) & (r_{\text{crit}} < r_p \le 1 - \delta_r) \\[4pt] \dfrac{1 - r_p}{\delta_r}\,\Psi_{\text{sub}}(1 - \delta_r) & (1 - \delta_r < r_p \le 1) \end{cases}$$
$r_p = 1 - \delta_r$ で値は連続だが，**傾きは連続でない**（$C^0$．直線の傾きは $\Psi_{\text{sub}}$ の傾きの約 2 倍）．直線部の傾き $\Psi_{\text{sub}}(1 - \delta_r)/\delta_r \approx \sqrt{2/\delta_r} = 44.7$ が系の硬さを決める（SPEC-13）．

質量流量は，有効面積 $A$ に対し
$$\dot m = \text{sgn}(p_1 - p_2)\,\frac{A\,p_0}{\sqrt{RT_0}}\,\Psi(r_p)$$
$T_0$ と $\gamma_0$ は上流側のガスの値を使う（下表）．$\gamma_0 = \gamma(T_0, Y)$ は SPEC-02 の混合の式による．

| 流れ | $p_1$，$p_2$ | 正の向き | 順流の上流（$T_0$，組成） | 逆流の上流（$T_0$，組成） |
| :--- | :--- | :--- | :--- | :--- |
| スロットル $\dot m_{\text{th}}$ | $p_{\text{atm}}$，$p_{\text{in}}$ | マニホールドへ | $T_{\text{amb}}$，未燃 | マニホールドのガス（SPEC-05） |
| 吸気弁 $\dot m_{\text{in}}$ | $p_p$（ランナ OFF では $p_{\text{in}}$），$p$ | 筒内へ | ポートのガス（SPEC-05） | 筒内（$T$，$Y_u$） |
| 排気弁 $\dot m_{\text{ex}}$ | $p$，$p_{pe}$（排気系 OFF では $p_{\text{atm}} + \Delta p_{\text{ex}}$） | 筒内から外へ | 筒内（$T$，$Y_u$） | $T_X$，既燃 |
| 排気管の出口 $\dot m_t$（SPEC-27 の 8 の内部の値で出口に開口を置いたときだけ．大気開放では $\dot m_t = \dot m_e$） | $p_{te}$，$p_{\text{atm}}$ | 大気へ | $T_X$，既燃 | $T_{\text{amb}}$，未燃 |

* **出典**：Heywood (1988) Appendix C．

---

