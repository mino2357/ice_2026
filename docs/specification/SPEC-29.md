### SPEC-29：化学種の熱物性と化学平衡（REQ-29．第26版）

設定「燃焼」の `[熱物性　γ(T)／γ一定／化学平衡]`（既定「化学平衡」）で選ぶ．「γ(T)」「γ一定」は SPEC-02 のモデルで，筒内圧の式は SPEC-09 のままである．「化学平衡」では，この SPEC の式が SPEC-02，SPEC-06，SPEC-07 の 4（発熱量），SPEC-09 に代わる．

#### A. 成分と物性

1. **化学種のデータ**：モル比熱，モルエンタルピー，標準エントロピーを NASA の 7 係数多項式で与える（係数は付表．$1000\ \text{K}$ で低温側と高温側を切り替える）．
   $$\frac{\bar c_{p,i}}{\bar R} = a_1 + a_2 T + a_3 T^2 + a_4 T^3 + a_5 T^4, \qquad \frac{\bar h_i}{\bar R T} = a_1 + \frac{a_2}{2}T + \frac{a_3}{3}T^2 + \frac{a_4}{4}T^3 + \frac{a_5}{5}T^4 + \frac{a_6}{T}$$
   $$\frac{\bar s_i^\circ}{\bar R} = a_1\ln T + a_2 T + \frac{a_3}{2}T^2 + \frac{a_4}{3}T^3 + \frac{a_5}{4}T^4 + a_7$$
   $\bar R = 8.314462618\ \text{J/(mol·K)}$．$\bar h_i$ は生成エンタルピーを含む絶対値（基準は $298.15\ \text{K}$ の元素の標準状態）．標準圧は $p^\circ = 100\ \text{kPa}$．モル内部エネルギーは $\bar u_i = \bar h_i - \bar R T$．原子量は C $12.011$，H $1.008$，O $15.999$，N $14.007$ [g/mol]．
2. **空気**（成分 $a$）：O$_2$ + $3.76$ N$_2$ の混合物（Ar は扱わない）．モル質量 $M_a = \frac{M_{\text{O}_2} + 3.76\,M_{\text{N}_2}}{4.76} = 28.851\ \text{g/mol}$，$R_a = \bar R/M_a = 288.19\ \text{J/(kg·K)}$．
3. **燃料蒸気**（成分 $f$）：擬似種 C$_{n}$H$_{yn}$，$y = 1.87$（SPEC-07 と同じ），モル質量 $M_f = 110\ \text{g/mol}$（$n = M_f/(12.011 + 1.008y) = 7.916$）．$R_f = \bar R/M_f = 75.586\ \text{J/(kg·K)}$．
   * 比熱：イソオクタンの係数 $a_1$〜$a_5$ に $M_f/M_{\text{iso}}$（$M_{\text{iso}} = 114.229\ \text{g/mol}$）を掛ける（質量あたりの比熱がイソオクタンと同じ）．
   * 生成エンタルピー：蒸気の低位発熱量（$T_0 = 298.15\ \text{K}$）が $H_u + h_{fg}$ になるように $a_6$ を決める．$H_u = 44.0\ \text{MJ/kg}$ は液体の燃料の低位発熱量，$h_{fg} = 350\ \text{kJ/kg}$ は気化潜熱（SPEC-30）．
     $$\bar h_f(T_0) = (H_u + h_{fg})\,M_f + n\,\bar h_{\text{CO}_2}(T_0) + \frac{yn}{2}\,\bar h_{\text{H}_2\text{O}}(T_0) = -26.34\ \text{kJ/mol}$$
   * 量論空燃比：$\text{AF}_{st} = \frac{\left(1 + \frac{y}{4}\right)\left(M_{\text{O}_2} + 3.76\,M_{\text{N}_2}\right)}{12.011 + 1.008\,y} = 14.503$．「化学平衡」ではこの値を使う（$\gamma$ のモデルは $14.7$ のまま）．
   * 質量あたりの量：$e_k(T) = \bar u_k(T)/M_k$，$h_k(T) = \bar h_k(T)/M_k$，$c_{v,k}(T) = (\bar c_{p,k}(T) - \bar R)/M_k$（$k = a, f$．空気は O$_2$ と N$_2$ のモル分率での和）．
4. **既燃ガス**（成分 $b$）：既燃ガスのうち燃料に由来する質量の割合を $\zeta$ とする．当量比は $\phi_b = \text{AF}_{st}\,\frac{\zeta}{1 - \zeta}$．既燃ガス $1\ \text{kg}$ は，空気 $(1 - \zeta)\ \text{kg}$ と燃料 $\zeta\ \text{kg}$ からできている．燃料のうち $\eta_c = 0.97$（SPEC-07）が反応に加わり，残り $(1 - \eta_c)\zeta$ は燃料蒸気のまま既燃ガスに含まれる（反応しない）．
   * 反応に加わる元素の量 [mol/kg]：$b_{\text{C}} = \frac{\eta_c\zeta n}{M_f}$，$b_{\text{H}} = \frac{\eta_c\zeta yn}{M_f}$，$b_{\text{O}} = \frac{2(1 - \zeta)}{4.76\,M_a}$，$b_{\text{N}} = \frac{2 \times 3.76\,(1 - \zeta)}{4.76\,M_a}$．
   * **化学平衡**：10 種（CO$_2$，CO，H$_2$O，H$_2$，O$_2$，N$_2$，OH，O，H，NO）の物質量 $n_j$ [mol/kg]（$N = \sum_j n_j$）を，温度 $T$ と圧力 $p$ で Gibbs エネルギー
     $$G = \sum_j n_j\mu_j, \qquad \frac{\mu_j}{\bar R T} = \frac{\bar h_j - T\bar s_j^\circ}{\bar R T} + \ln\frac{n_j}{N} + \ln\frac{p}{p^\circ}$$
     が最小になるように決める．条件は元素の保存 $\sum_j a_{ij}n_j = b_i$（$a_{ij}$：化学種 $j$ の 1 分子に含まれる元素 $i$ の数）．停留の条件は，元素ごとの未定乗数 $\lambda_i$ を使って $\frac{\mu_j}{\bar R T} = \sum_i\lambda_i a_{ij}$．
   * **解法**（Gordon と McBride の反復）：$\ln n_j$，$\ln N$，$\pi_i$ を未知数とする Newton 法．各回，次の $(n_e + 1)$ 元の連立 1 次方程式を解く（$n_e$：元素の数）．
     $$\sum_i\left(\sum_j a_{kj}a_{ij}n_j\right)\pi_i + \left(\sum_j a_{kj}n_j\right)\Delta\ln N = b_k - \sum_j a_{kj}n_j + \sum_j a_{kj}n_j\frac{\mu_j}{\bar R T} \quad (k = 1, \dots, n_e)$$
     $$\sum_i\left(\sum_j a_{ij}n_j\right)\pi_i + \left(\sum_j n_j - N\right)\Delta\ln N = N - \sum_j n_j + \sum_j n_j\frac{\mu_j}{\bar R T}$$
     $$\Delta\ln n_j = \Delta\ln N + \sum_i a_{ij}\pi_i - \frac{\mu_j}{\bar R T}$$
     更新は $\ln n_j \leftarrow \ln n_j + \lambda\,\Delta\ln n_j$，$\ln N \leftarrow \ln N + \lambda\,\Delta\ln N$，緩和係数 $\lambda = \min\left(1, \frac{2}{\max\left(5\lvert\Delta\ln N\rvert,\ \max_j\lvert\Delta\ln n_j\rvert\right)}\right)$（$\max_j$ は $n_j/N > 10^{-8}$ か $\Delta\ln n_j > 0$ の化学種について取る）．$n_j$ の下限は $10^{-40}$．初期値は全化学種に $0.1\sum_i b_i/10$．$\lambda = 1$ で $\max_j\frac{n_j\lvert\Delta\ln n_j\rvert}{N} < 10^{-11}$ かつ $\lvert\Delta\ln N\rvert < 10^{-11}$ になったら終える（上限 400 回）．連立方程式のピボットが $0$（か非有限）のときは解けないとして反復を止める．表を作るときに，収束しなかった解の数と，解けなかった連立方程式の数を数える（`GAS.stat`．値はそのときの反復の結果をそのまま使う．検証で，どちらも $0$ であることを確かめる．REQ-29 の 9）．
   * **物性**：
     $$e_b(T, p, \zeta) = \sum_j n_j\,\bar u_j(T) + (1 - \eta_c)\,\zeta\,e_f(T), \qquad R_b(T, p, \zeta) = \bar R\sum_j n_j + (1 - \eta_c)\,\zeta\,R_f, \qquad h_b = e_b + R_b T$$
5. **凍結**：$T < T_{fr} = 1700\ \text{K}$ では，組成を「同じ圧力 $p$ で温度 $T_{fr}$ のときの平衡組成」に固定して 4 の物性の式を使う．膨張の途中で CO の酸化が止まることを表す．どの圧力で凍結したかという経路は追わない（状態量としての近似）．
6. **表と補間**：$e_b$，$R_b$ と $c_{v,b} \equiv \left(\frac{\partial e_b}{\partial T}\right)_{p,\zeta}$ を，次の格子の節点で求めて保持する．
   * 当量比の座標は，反応に加わる燃料の当量比 $\phi_r = \eta_c\phi_b$ とし，$0.50$ から $1.50$ まで $0.0125$ 刻み（81 点）．量論（$\phi_r = 1$）で物性の $\phi$ についての傾きが折れるので，そこを節点に置く．$T$：$250$ から $3500\ \text{K}$ まで $50\ \text{K}$ 刻み（66 点）．$p$：$20\ \text{kPa}$ から $20\ \text{MPa}$ まで公比 $10^{1/12}$ の 37 点．範囲の外は端の値に丸める．ただし $T$ の範囲の外では，$e_b$ を端の $c_{v,b}$ で直線に延ばし（$e_b(T) = e_b(T_e) + c_{v,b}(T_e)(T - T_e)$，$T_e$：近いほうの端），$c_{v,b}$ は端の値とする（$c_{v,b} = 0$ とすると，$\gamma = 1 + \frac{R}{c_v}$ が無限大になり，筒内の質量が小さく $250\ \text{K}$ を下回る運転（吸気弁がほとんど開かない弁の時期など）で計算が破綻した．REQ-13 の 9）．$R_b$ は端の値で，そのほかの方向の偏微分は $0$）．
   * 刻みは補間の誤差を測って決めた：$\phi$ を $0.05$ 刻み，$p$ を公比 $10^{1/3}$ にした最初の案では，量論の近くで $e_b$ の誤差が $34\ \text{kJ/kg}$，高温・低圧で $16\ \text{kJ/kg}$ あった（折れ目が節点の間にあったことと，解離が $p$ に強く依存することによる）．上の格子では最大 $3.6\ \text{kJ/kg}$（量論のすぐリッチ側，$1900\ \text{K}$ 付近）．
   * 節点の $c_{v,b}$ は，$T \ge T_{fr}$ では節点の $e_b$ の差分（内側は 4 次の中心差分 $\frac{-e_{i+2} + 8e_{i+1} - 8e_{i-1} + e_{i-2}}{12\,\Delta T}$，端は 2 次の片側差分．平衡を解く回数を増やさないため），$T < T_{fr}$ では固定した組成での $\sum_j n_j(\bar c_{p,j} - \bar R) + (1 - \eta_c)\zeta c_{v,f}$．
   * 補間：$T$ の方向は，節点の値 $e_b$ と傾き $c_{v,b}$ による 3 次 Hermite 補間．$R_b$ も，節点の値と傾き $\frac{\partial R_b}{\partial T}$（節点の値の差分．凍結の側は $0$）による 3 次 Hermite 補間とする（$T_{fr}$ の節点は平衡の側の傾きを持つ．$T_{fr}$ のすぐ左の区間 $[T_{fr} - \Delta T, T_{fr}]$ は凍結の側なので，その区間の右端の傾きには，凍結の側の値（$c_{v,b}$ は凍結組成の値，$\frac{\partial R_b}{\partial T} = 0$）を使う．以前は平衡の側の傾きを使っていたので，その区間で $R_b$ が下がり（$\frac{\partial R_b}{\partial T} < 0$），$c_{v,b}$ も一度下がった．外部のレビューの指摘．TEST-29 項目 14）（$T$ について $C^1$．$R_b$ を線形にすると $\frac{\partial R_b}{\partial T}$ が節点で跳び，右辺が不連続になって，閉じた断熱の系のエネルギーの誤差が約 10 倍になった．TEST-29 項目 6）．$\ln p$ と $\phi_r$ の方向は線形．偏微分 $\frac{\partial e_b}{\partial T}$，$\frac{\partial e_b}{\partial p}$，$\frac{\partial e_b}{\partial\zeta}$，$\frac{\partial R_b}{\partial T}$，$\frac{\partial R_b}{\partial p}$，$\frac{\partial R_b}{\partial\zeta}$ は，補間した関数を微分して求める（エネルギーの式と整合させるため）．
   * 表は $\phi_r$ の節点ごとに，初めて必要になったときに作って保持する（起動時にはまとめて作らない．性能曲線の計測の前には，全節点を行ごとに少しずつ作る（SPEC-26 B の 1）．1 節点は平衡の計算 $37 \times 37 = 1369$ 回で，開発用の計算機の Chromium で約 $7\ \text{ms}$）．混合気の濃さが急に変わるサイクルでは，1 ステップで 1〜3 節点，連続する約 20 ステップで 30 節点あまりを作る（運転中に直噴からポート噴射へ切り替えた直後のサイクルの実測で，計 $230\ \text{ms}$）．このため，時間を区切って積分するループは，経過時間を 4 ステップごとに調べる（SPEC-15 F の 2，SPEC-20 B の 4）．計算は決定的で，同じ節点は同じ値になる．

---

