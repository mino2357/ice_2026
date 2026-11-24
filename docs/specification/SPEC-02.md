### SPEC-02：作動流体の熱物性（未燃・既燃の比熱）（REQ-02）

#### 定義と式
1. **比熱比の当てはめ**（量論比．Klein と Eriksson が化学平衡計算から求めた線形当てはめ）：
   $$\gamma_u(T) = 1.3488 - 13.0 \times 10^{-5}\left(\min(T, T_{c,u}) - 300\right), \qquad T_{c,u} = 1000\ \text{K}$$
   $$\gamma_b(T) = 1.3678 - 9.4 \times 10^{-5}\left(\min(T, T_{c,b}) - 300\right), \qquad T_{c,b} = 2700\ \text{K}$$
   未燃の当てはめの有効範囲は $300$〜$1000\ \text{K}$，既燃は $500$〜$2700\ \text{K}$（$7.5 \times 10^5\ \text{Pa}$）である．有効範囲の上限 $T_{c,k}$ より上では $\gamma_k$ を一定とし，直線を範囲外へ延ばさない．既燃の $500\ \text{K}$ 未満は直線のまま使う．
2. **比熱**（$k = u, b$）：$c_{v,k}(T) = \frac{R}{\gamma_k(T) - 1}$，$c_{p,k} = c_{v,k} + R$．気体定数は未燃・既燃とも $R = 287.0\ \text{J/(kg·K)}$ とする．**理由**：圧力と容積で見た内部エネルギー $U = m c_v T = \frac{pV}{\gamma - 1}$ は $R$ によらず $\gamma$ だけで決まるので，$\gamma$ を文献値に合わせれば，圧縮・膨張の仕事と圧力の応答が文献の物性と一致する．質量と温度の絶対値は，実際の気体定数（未燃 $\approx 275$，既燃 $\approx 288\ \text{J/(kg·K)}$）との差の分だけずれる．
3. **顕熱の内部エネルギーとエンタルピー**：基準温度 $T_0 = 298.15\ \text{K}$ からの積分で定義する．
   $$e_k(T) = \int_{T_0}^{T} c_{v,k}(T')\,dT', \qquad h_k(T) = e_k(T) + RT$$
   $\gamma_k - 1 = g_k - b_k(T - 300)$（$g_u = 0.3488$，$b_u = 13.0 \times 10^{-5}$，$g_b = 0.3678$，$b_b = 9.4 \times 10^{-5}$）と書くと，$T \le T_{c,k}$ では
   $$e_k(T) = \int_{T_0}^{T}\frac{R\,dT'}{g_k - b_k(T' - 300)} = \frac{R}{b_k}\ln\frac{g_k - b_k(T_0 - 300)}{g_k - b_k(T - 300)}$$
   $T > T_{c,k}$ では $e_k(T) = e_k(T_{c,k}) + c_{v,k}(T_{c,k})\,(T - T_{c,k})$．
4. **混合**：未燃分率 $Y$ の混合気について
   $$c_v(T, Y) = Y c_{v,u}(T) + (1 - Y)c_{v,b}(T), \quad \gamma(T, Y) = 1 + \frac{R}{c_v(T, Y)}, \quad e(T, Y) = Y e_u(T) + (1 - Y)e_b(T), \quad h(T, Y) = e(T, Y) + RT$$
   筒内には $Y = Y_u$ を使う．$\gamma$ ではなく比熱を補間する（Klein と Eriksson のモデル D1 と同じ考え方）．
5. **定比熱比モデル**（設定「燃焼」の `[比熱 γ(T)／γ一定]`，既定 $\gamma(T)$）：$\gamma_u = \gamma_b = \gamma_c = 1.35$．このとき $c_v = \frac{R}{\gamma_c - 1}$，$e_k(T) = c_v\,(T - T_0)$．
6. **化学平衡のモデル**（第26版）：設定の「化学平衡」が既定である．そのときの物性と筒内の式は SPEC-29 で定める．この SPEC は「γ(T)」「γ一定」を選んだときのものになる．

#### 仮定と限界
* 当量比・圧力による $\gamma$ の変化は扱わない（当てはめは量論比．既燃ガスは $1500\ \text{K}$ 以上で圧力にも依存する）．
* 既燃ガスの線形当てはめは，平衡組成の $\gamma$ を $1\%$ 弱の誤差で表す（同論文）．より正確な Krieger–Borman の多項式は，係数を原典で確認できていないため採用していない．
* 単一ゾーンなので，未燃ガスの比熱も筒内の平均温度 $T$ で評価する（実際の未燃部は $1000\ \text{K}$ 程度までにとどまる．$T_{c,u}$ の頭打ちがこれに対応する）．

* **出典**：[M. Klein and L. Eriksson, "A specific heat ratio model for single-zone heat release models"（Linköping 大学，2004．表 1，表 2）](https://www.fs.isy.liu.se/Publications/Articles/CCSSE_04_MK.pdf)

---

