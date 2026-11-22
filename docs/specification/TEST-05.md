### TEST-05：スロットルと吸気マニホールド（REQ-05，SPEC-05）

1. [A] $A_{\text{th}}(0) = 0$（厳密），$A_{\text{th}}(\pi/2) = C_{d,\text{th}}\frac{\pi}{4}D_{\text{th}}^2$（相対誤差 $10^{-12}$），$\alpha$ について単調増加．
2. [A] 吸気弁を閉じ $p_{\text{in}}(0) = 0.3\,p_{\text{atm}}$ から積分すると，$p_{\text{in}}$ が単調に増えて $p_{\text{atm}}$ に収束し，$\int\dot m_{\text{th}}\,dt = \frac{V_{\text{in}}}{RT_{\text{in}}}\left(p_{\text{in}}(t) - p_{\text{in}}(0)\right)$（相対誤差 $10^{-6}$）．
3. [A] チョーク域で $\dot m_{\text{th}}$ が $p_{\text{in}}$ によらず $\frac{A_{\text{th}}p_{\text{atm}}}{\sqrt{RT_{\text{amb}}}}\Psi_{\max}$（$\gamma_0 = \gamma_u(T_{\text{amb}})$）に一致し，$p_{\text{atm}}$ を $101.325 \to 80\ \text{kPa}$ にすると $\frac{80000}{101325}$ 倍になる（相対誤差 $10^{-12}$）．
4. [S]（質量の収支）S4 の定常の直近 5 サイクルで，$M_{\text{th}}$ と $M_{\text{in}}$ の増分が相対誤差 $0.2\%$ 以内．
5. [A] $p_{\text{atm}}$ を変えてコールドリセットすると $p = p_{\text{in}} = p_{\text{atm}}$，図示トルク $T_{\text{ind}} = 0$．
6. [S] S2 から 6 サイクルの全時刻で $0 \le Y_{b,\text{in}} \le 1$，$0 \le Y_{b,p} \le 1$，$E_{\text{in}} \ge 0$，$E_p \ge 0$．コールドリセット直後は $m_{b,\text{in}} = m_{b,p} = E_{\text{in}} = E_p = 0$．
7. [S]（既燃ガスの収支）S2 の直近 5 サイクルで，$B_o$ と $B_i$ の増分の差が両者の平均の $2\%$ 以内（定常では既燃ガスがたまり続けない）．かつ $m_{b,\text{in}} + m_{b,p}$ の増分と $\Delta B_o - \Delta B_i$ の差が $10^{-3}\,\Delta B_o$ 以内．
8. [S]（余剰エンタルピーの収支）同じ 5 サイクルで，$E_{\text{in}} + E_p$ の増分と $\Delta X_o - \Delta X_i - \Delta X_t$ の差が $10^{-6}\,\Delta X_o$ 以内（$X_i$：順流で筒内へ戻った分 $\int\dot m_{\text{in}}^+\varepsilon_{\text{src}}\,dt$，$X_t$：スロットルの逆流で出た分）．かつ $\Delta X_o$ と $\Delta X_i$ の差が両者の平均の $2\%$ 以内（定常では全量が戻る）．
9. [S]（吹き返しによる加熱）S2 の 1 サイクルで，吸気弁の順流の上流温度 $T_{\text{up}}$ の流量加重平均が $T_{\text{in}}$ より $15\ \text{K}$ 以上高い（実測 $+47\ \text{K}$）．全時刻で $T_{\text{up}} \ge T_{\text{in}}$．
10. [A]（熱物性 $\gamma(T)$ で）余剰が $0$ のとき $T_{\text{up}} = T_{\text{in}}$，$h_j = h(T_{\text{in}}, Y_j)$（厳密）．$\varepsilon_{\text{src}} = c_p(T_{\text{in}}, Y_j) \cdot 30\ \text{K}$ のとき $T_{\text{up}} = T_{\text{in}} + 30\ \text{K}$，$h_j = h(T_{\text{in}}, Y_j) + \varepsilon_{\text{src}}$（相対誤差 $10^{-12}$）．

