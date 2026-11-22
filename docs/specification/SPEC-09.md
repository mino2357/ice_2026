### SPEC-09：筒内圧の式（開いた系の熱力学第一法則）（REQ-09）

#### 導出
顕熱の内部エネルギー（SPEC-02）を使う．未燃ガスは，燃えて既燃ガスになるときに単位質量あたり $q_u = \frac{Q_{\text{in}}}{m_{u,\text{trapped}}}$ の熱を出すとする．筒内の全エネルギーは
$$E = m_u\left(e_u(T) + q_u\right) + m_b\,e_b(T)$$
流れ $j$（質量流量 $\dot m_j$，流入が正，未燃分率 $Y_j$，顕熱エンタルピー $h_j$）が運ぶエネルギーは $\dot m_j\left(h_j + Y_j q_u\right)$ なので，第一法則は
$$\frac{dE}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + \sum_j\dot m_j\left(h_j + Y_j q_u\right)$$
左辺は，$\frac{dm_u}{dt} = \sum_j\dot m_j Y_j - r$，$\frac{dm_b}{dt} = \sum_j\dot m_j(1 - Y_j) + r$（SPEC-06）と $m c_v = m_u c_{v,u} + m_b c_{v,b}$ を使って
$$\frac{dE}{dt} = \sum_j\dot m_j\left[Y_j\left(e_u + q_u\right) + (1 - Y_j)e_b\right] - r\left(q_u + e_u - e_b\right) + m c_v\frac{dT}{dt}$$
と書ける（$e_u$，$e_b$，$c_v$ は筒内の温度 $T$ での値）．両者から $q_u$ を含む流れの項が消えて
$$m c_v\frac{dT}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + r\,q_u + r\left(e_u - e_b\right) + \sum_j\dot m_j\left[h_j - Y_j e_u - (1 - Y_j)e_b\right]$$
$r\,q_u = \dot Q_{\text{comb}}$ である．$r(e_u - e_b)$ は，未燃ガスと既燃ガスが同じ温度で持つ顕熱の差で，組成が変わることによる項である．

状態方程式 $pV = mRT$ を時間で微分すると $V\frac{dp}{dt} = RT\frac{dm}{dt} + mR\frac{dT}{dt} - p\frac{dV}{dt}$．これに上の式を代入し，$\frac{R}{c_v} = \gamma - 1$，$RT = (\gamma - 1)c_v T$，$\frac{dm}{dt} = \sum_j\dot m_j$ を使うと

$$\frac{dp}{dt} = -\gamma\,\frac{p}{V}\frac{dV}{d\theta}\,\omega + \frac{\gamma - 1}{V}\left[\dot Q_{\text{comb}} + r\left(e_u - e_b\right) - \dot Q_{\text{wall}} + \sum_j\dot m_j\left(h_j - Y_j e_u - (1 - Y_j)e_b + c_v T\right)\right]$$

ここで $\gamma = \gamma(T, Y_u)$，$c_v = c_v(T, Y_u)$．流れごとの括弧の中は次のとおり．

| 流れ | $Y_j$ | $h_j$ | 括弧の中 |
| :--- | :--- | :--- | :--- |
| 筒内から出る流れ（吸気弁の逆流，排気弁の流出） | $Y_u$ | $h(T, Y_u)$ | $c_p(T, Y_u)\,T$ |
| 吸気弁の順流 | $1 - Y_{b,\text{src}}$ | $h(T_{\text{in}}, Y_j) + \varepsilon_{\text{src}}$（SPEC-05） | $h_j - Y_j e_u(T) - (1 - Y_j)e_b(T) + c_v T$ |
| 排気弁の逆流 | $0$ | $h_b(T_X)$ | $h_b(T_X) - e_b(T) + c_v T$ |

筒内から出る流れでは $h(T, Y_u) - e(T, Y_u) = RT$ なので括弧の中は $(R + c_v)T = c_p T$ となる．定比熱比モデルでは $h_j = c_p T_j + \text{const}$ なので，流入の括弧の中も $c_p T_j$ に帰着する．

#### 第一法則の検査
顕熱エネルギー $U_s = m_u e_u(T) + m_b e_b(T)$ について，上の式から
$$\frac{dU_s}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + \dot Q_{\text{comb}} + \dot H_{\text{in}}^s - \dot H_{\text{out}}^s$$
が成り立つ（$\dot H_{\text{in}}^s = \sum_{\text{流入}}\dot m_j h_j$，$\dot H_{\text{out}}^s = \sum_{\text{流出}}|\dot m_j|\,h(T, Y_u)$）．両辺を補助積分（§2.3）で積分し，
$$\Delta U_s = -\Delta W - \Delta Q_w + \Delta Q_c + \Delta H_i - \Delta H_o$$
の残差で検査する．

* **出典**：Heywood (1988) Ch. 14；比熱の扱いは Klein and Eriksson (2004)．

---

