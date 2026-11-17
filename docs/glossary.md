# 単気筒4ストロークSI機関シミュレータ 用語の定義集（第26版）

要件定義書（`docs/requirements.md`）と仕様書（`docs/specification.md`）で使う記号と用語を，単位と定義式とともにまとめる．式の導出と定数の出典は仕様書の各 SPEC にある．「仕様」の列は，その記号を定める仕様書の節である．

## 1. 表記の規則

1. 計算の内部は SI 単位．圧力は Pa 系（$\text{Pa}$，$\text{kPa}$，$\text{MPa}$）で表し，$\text{bar}$ は使わない．
2. 角度は内部が $\text{rad}$，表示と本文の数値は $^\circ$．クランク角は $^\circ\text{CA}$．点火時期は圧縮上死点より前を正とする $^\circ\text{BTDC}$．
3. 回転数 $N\ [\text{rpm}]$ と角速度 $\omega\ [\text{rad/s}]$ の関係は $N = \dfrac{30}{\pi}\,\omega$．
4. 添字：$u$ 未燃，$b$ 既燃，$\text{in}$ 吸気（マニホールド，吸気弁），$\text{ex}$ 排気弁，$p$ 吸気ポート，$pe$ 排気ポート，$r$ 吸気ランナ，$e$ 排気管，$m$ 消音器，$t$ テールパイプ，$\text{th}$ スロットル，$w$ 壁，$\text{atm}$ 大気，$0$ 上流のよどみ状態．
5. $\dot m^+ = \max(0, \dot m)$，$\dot m^- = \max(0, -\dot m)$．$\text{clamp}(x, a, b) = \min(b, \max(a, x))$．$\text{md}(a) = a - 4\pi\lfloor a/4\pi\rfloor \in [0, 4\pi)$．
6. $\Delta$ を量の前に付けたときは，指定した区間（多くは 1 サイクル）での増分を表す．$\overline{\ \cdot\ }$ はサイクル平均または一次遅れの平均．

---

## 2. 記号

### 2.1 独立変数とクランク角

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $t$ | 時間 | s | 独立変数 | 2.1 |
| $\theta$ | クランク角 | rad | 1 サイクル内の角度 $\theta \in [0, 4\pi)$．$\theta = 0$：吸気上死点，$\pi$：吸気下死点，$2\pi$：圧縮上死点，$3\pi$：膨張下死点．サイクルの終端で $4\pi$ を引く | 2.1 |

### 2.2 状態ベクトル $\mathbf{y} \in \mathbb{R}^{21}$

$\dfrac{d\mathbf{y}}{dt} = \mathbf{f}(\mathbf{y}; \mathbf{u})$ を時間積分する．$\mathbf{u}$ は入力（$\alpha$，$f_{\text{eff}}$，点火時期 $s$ など）で，積分の 1 ステップの間は一定．

| # | 記号 | 名称 | 単位 | 支配する式 | 仕様 |
| ---: | :--- | :--- | :--- | :--- | :--- |
| 1 | $\theta$ | クランク角 | rad | $\dfrac{d\theta}{dt} = \omega$ | SPEC-10 |
| 2 | $\omega$ | クランク軸の角速度 | rad/s | $I_{\text{tot}}\dfrac{d\omega}{dt} = T_{\text{ind}} + T_{\text{st}} - T_f - T_{\text{aux}} - T_{\text{dyno}}$ | SPEC-10 |
| 3 | $p$ | 筒内圧 | Pa | 開いた系の第一法則と状態方程式から導く筒内圧の式 | SPEC-09 |
| 4 | $m$ | 筒内ガスの全質量 | kg | $\dfrac{dm}{dt} = \dot m_{\text{in}} - \dot m_{\text{ex}}$ | SPEC-06 |
| 5 | $m_u$ | 筒内の未燃ガス（新気）の質量 | kg | $\dfrac{dm_u}{dt} = \dot m_{u,\text{in}} - \dot m_{u,\text{ex}} - r$ | SPEC-06 |
| 6 | $T_w$ | シリンダ壁の平均温度 | K | $C_{w,\text{th}}\dfrac{dT_w}{dt} = \dot Q_{\text{wall}} - G_{\text{cool}}(T_w - T_{\text{cool}})$ | SPEC-08 |
| 7 | $p_{\text{in}}$ | 吸気マニホールド圧 | Pa | $\dfrac{dp_{\text{in}}}{dt} = \dfrac{RT_{\text{in}}}{V_{\text{in}}}(\dot m_{\text{th}} - \dot m_{\text{dn}})$ | SPEC-05 |
| 8 | $m_{b,\text{in}}$ | マニホールド内の既燃ガスの質量 | kg | 流れが上流側の組成で運ぶ | SPEC-05，25 |
| 9 | $\dot m_r$ | 吸気ランナの質量流量（マニホールド → ポートが正） | kg/s | $\dfrac{d\dot m_r}{dt} = \dfrac{A_r}{L_r}(p_{\text{in}} - p_p) - \dfrac{\zeta\,\dot m_r\lvert\dot m_r\rvert}{2\rho_r A_r L_r}$ | SPEC-25 |
| 10 | $p_p$ | 吸気ポート圧 | Pa | $\dfrac{dp_p}{dt} = \dfrac{\gamma_0 RT_{\text{in}}}{V_p}(\dot m_r - \dot m_{\text{in}})$ | SPEC-25 |
| 11 | $m_{b,p}$ | 吸気ポート内の既燃ガスの質量 | kg | $\dfrac{dm_{b,p}}{dt} = \dot m_r Y_r - \dot m_{\text{in}}Y_v$ | SPEC-25 |
| 12 | $\dot m_e$ | 排気管の質量流量（ポート → 消音器が正） | kg/s | $\dfrac{d\dot m_e}{dt} = \dfrac{A_e}{L_e}(p_{pe} - p_m) - \dfrac{\zeta_x\,\dot m_e\lvert\dot m_e\rvert}{2\rho_e A_e L_e}$ | SPEC-27 |
| 13 | $p_{pe}$ | 排気ポート圧 | Pa | $\dfrac{dp_{pe}}{dt} = \dfrac{\gamma_0 RT_X}{V_{pe}}(\dot m_{\text{ex}} - \dot m_e)$ | SPEC-27 |
| 14 | $p_m$ | 消音器の圧力 | Pa | $\dfrac{dp_m}{dt} = \dfrac{RT_X}{V_m}(\dot m_e - \dot m_t)$ | SPEC-27 |
| 15 | $E_{\text{in}}$ | マニホールドの余剰エンタルピー | J | $\dfrac{dE_{\text{in}}}{dt} = -\dot m_r\varepsilon_r + \min(0, \dot m_{\text{th}})\,\varepsilon_{\text{in}}$（ランナ ON） | SPEC-05，25 |
| 16 | $E_p$ | 吸気ポートの余剰エンタルピー | J | $\dfrac{dE_p}{dt} = \dot m_r\varepsilon_r - \dot m_{\text{in}}^+\varepsilon_p + \dot X_o$ | SPEC-25 |
| 17 | $m_f$ | 筒内の未燃の燃料蒸気の質量（化学平衡のモデル） | kg | $\dfrac{dm_f}{dt} = \sum_j\dot m_j Y_{f,j} + \dot m_{\text{ev}} - r\,\psi$ | SPEC-29 |
| 18 | $m_{bf}$ | 筒内の既燃ガスのうち燃料に由来する質量（同） | kg | $\dfrac{dm_{bf}}{dt} = \sum_j\dot m_j Y_{b,j}\zeta_j + r\,\psi$ | SPEC-29 |
| 19 | $m_l$ | 筒内の液体の燃料の質量（同） | kg | $\dfrac{dm_l}{dt} = \dot m_{\text{inj}} - \dot m_{\text{ev}}$ | SPEC-30 |
| 20 | $m_{f,\text{in}}$ | 吸気マニホールド内の燃料蒸気の質量（同） | kg | 既燃ガスの追跡と同じ形 | SPEC-30 |
| 21 | $m_{f,p}$ | 吸気ポート内の燃料蒸気の質量（同） | kg | 同上 | SPEC-30 |

### 2.3 補助積分 $\mathbf{z} \in \mathbb{R}^{28}$

状態と同じ Runge–Kutta の重みで同時に積分する量．$\mathbf{f}$ には現れない．サイクルの集計と保存則の検査に使う．

| 記号 | 名称 | 単位 | 定義 |
| :--- | :--- | :--- | :--- |
| $W$，$W_g$ | 図示仕事（正味），圧縮・膨張行程の図示仕事 | J | $W = \displaystyle\int p\,\frac{dV}{d\theta}\,\omega\,dt$．$W_g$ は $\pi \le \theta < 3\pi$ の間だけ積分 |
| $W_f$，$W_a$，$W_d$ | 摩擦・補機・動力計の仕事 | J | $\displaystyle\int T_f\,\omega\,dt$，$\displaystyle\int T_{\text{aux}}\,\omega\,dt$，$\displaystyle\int T_{\text{dyno}}\,\omega\,dt$ |
| $M_{\text{th}}$，$M_r$，$M_{\text{in}}$，$M_{\text{ex}}$，$M_e$，$M_t$ | 各断面を通った質量 | kg | $M_k = \displaystyle\int\dot m_k\,dt$ |
| $B_o$，$B_i$ | 吸気弁から吹き返した既燃ガス，戻った既燃ガス | kg | $\displaystyle\int\dot m_{\text{in}}^-(1 - Y_u)\,dt$，$\displaystyle\int\dot m_{\text{in}}^+ Y_{b,\text{src}}\,dt$ |
| $X_o$，$X_i$，$X_t$ | 吹き返しが運んだ余剰エンタルピー，順流で筒内へ戻った分，スロットルの逆流で出た分 | J | $\displaystyle\int\dot X_o\,dt$，$\displaystyle\int\dot m_{\text{in}}^+\varepsilon_{\text{src}}\,dt$，$\displaystyle\int\dot m_{\text{th}}^-\varepsilon_{\text{in}}\,dt$ |
| $Q_c$，$Q_w$ | 発熱，壁への熱 | J | $\displaystyle\int\dot Q_{\text{comb}}\,dt$，$\displaystyle\int\dot Q_{\text{wall}}\,dt$ |
| $H_i$，$H_o$ | 筒内へ入った／筒内から出た顕熱エンタルピー | J | $\displaystyle\int\dot H^s_{\text{in}}\,dt$，$\displaystyle\int\dot H^s_{\text{out}}\,dt$ |
| $P_m$，$\Upsilon$ | 背圧と吸気管既燃率の時間積分 | Pa·s，s | $\displaystyle\int p_m\,dt$，$\displaystyle\int Y_{b,\text{in}}\,dt$ |
| $H_e$ | 気化した燃料が持ち込んだエネルギー | J | $\displaystyle\int\dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right]dt$ |
| $F_{\text{inj}}$，$F_{\text{ev}}$，$F_{\text{iv}}$，$F_{\text{ex}}$，$F_b$ | 噴いた燃料，気化した燃料，吸気弁を通った燃料蒸気（流入が正），排気弁から出た燃料蒸気，燃えた燃料 | kg | $\displaystyle\int\dot m_{\text{inj}}\,dt$，$\displaystyle\int\dot m_{\text{ev}}\,dt$，…，$\displaystyle\int r\psi\,dt$ |

### 2.4 幾何（スライダ・クランク機構と弁）

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $B$，$S$，$l$ | ボア，ストローク，連桿長 | m | 設定 | SPEC-01 |
| $r$，$\lambda$ | クランク半径，連桿比 | m，– | $r = S/2$，$\lambda = r/l$（$\lambda \le 0.5$） | SPEC-01 |
| $\varepsilon$ | 圧縮比 | – | $\varepsilon = \dfrac{V_c + V_d}{V_c}$ | SPEC-01 |
| $A_p$ | ピストン頂面の面積 | m² | $A_p = \dfrac{\pi B^2}{4}$ | SPEC-01 |
| $V_d$，$V_c$ | 行程容積，隙間容積 | m³ | $V_d = A_p S$，$V_c = \dfrac{V_d}{\varepsilon - 1}$ | SPEC-01 |
| $x(\theta)$ | 上死点からのピストン変位 | m | $x = r\left[(1 - \cos\theta) + \dfrac{1}{\lambda}\left(1 - \sqrt{1 - \lambda^2\sin^2\theta}\right)\right]$ | SPEC-01 |
| $V(\theta)$ | 筒内容積 | m³ | $V = V_c + A_p\,x(\theta)$ | SPEC-01 |
| $h_c$ | 等価な隙間の高さ | m | $h_c = V_c/A_p$ | SPEC-01 |
| $A_w(\theta)$ | 伝熱面積 | m² | $A_w = \dfrac{\pi B^2}{2} + \pi B\,(x + h_c)$ | SPEC-01 |
| $c_m$ | 平均ピストン速度 | m/s | $c_m = \dfrac{S\omega}{\pi}$ | SPEC-07，10 |
| $L_v$，$L_{\max}$ | 弁リフト，最大リフト | m | カムの種類ごとの関数 $L_v = L_{\max}\,g(\xi)$，$\xi = \delta/\Delta\theta_{\text{cam}}$ | SPEC-03 |
| IVO，IVC，EVO，EVC | 吸気弁の開・閉，排気弁の開・閉の時期 | rad | 設定（位相 $\varphi$ を加える前の基本の時期） | SPEC-03 |
| $\varphi_{\text{in}}$，$\varphi_{\text{ex}}$ | カムの位相（正が遅角） | rad | $L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$ | SPEC-03 |
| $A_{\text{eff}}$ | 弁の有効開口面積 | m² | $A_{\text{eff}} = C_d\min\left(\pi d_v L_v,\ \dfrac{\pi}{4}d_v^2\right)$，$C_d = 0.6$ | SPEC-03 |
| $\theta_{\text{OL}}$ | オーバーラップ角 | rad | $\theta_{\text{OL}} = \text{EVC} - (\text{IVO} + 4\pi)$ | SPEC-24 |

### 2.5 熱力学と物性

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $R$ | 気体定数（未燃・既燃で共通） | J/(kg·K) | $R = 287.0$ | SPEC-02 |
| $T$ | 筒内ガスの平均温度 | K | $T = \dfrac{pV}{mR}$ | 2.2 |
| $Y_u$ | 未燃分率 | – | $Y_u = \text{clamp}\left(\dfrac{m_u}{m}, 0, 1\right)$ | 2.2 |
| $x_r$ | 残留ガス率（既燃分率） | – | $x_r = 1 - Y_u$（性能の指標としては吸気弁が閉じた時点の値） | 2.2，SPEC-14 |
| $\gamma_u$，$\gamma_b$ | 未燃ガス・既燃ガスの比熱比 | – | $\gamma_u = 1.3488 - 13.0 \times 10^{-5}(\min(T, 1000) - 300)$，$\gamma_b = 1.3678 - 9.4 \times 10^{-5}(\min(T, 2700) - 300)$ | SPEC-02 |
| $c_{v,k}$，$c_{p,k}$ | 定積比熱，定圧比熱（$k = u, b$） | J/(kg·K) | $c_{v,k} = \dfrac{R}{\gamma_k - 1}$，$c_{p,k} = c_{v,k} + R$ | SPEC-02 |
| $c_v$，$\gamma$ | 混合気の定積比熱と比熱比 | J/(kg·K)，– | $c_v = Y c_{v,u} + (1 - Y)c_{v,b}$，$\gamma = 1 + \dfrac{R}{c_v}$ | SPEC-02 |
| $T_0$ | 内部エネルギーの基準温度 | K | $T_0 = 298.15$（SPEC-04 では上流のよどみ温度も $T_0$ と書く） | SPEC-02 |
| $e_k$，$h_k$ | 顕熱の内部エネルギー，顕熱エンタルピー | J/kg | $e_k(T) = \displaystyle\int_{T_0}^{T}c_{v,k}(T')\,dT'$，$h_k = e_k + RT$ | SPEC-02 |
| $e(T, Y)$，$h(T, Y)$ | 混合気の内部エネルギーとエンタルピー | J/kg | $e = Y e_u + (1 - Y)e_b$，$h = e + RT$ | SPEC-02 |
| $U_s$ | 筒内ガスの顕熱エネルギー | J | $U_s = m_u e_u(T) + (m - m_u)e_b(T)$ | SPEC-09 |
| $q_u$ | 未燃ガスが燃えるときに出す単位質量あたりの熱 | J/kg | $q_u = Q_{\text{in}}/m_{u,\text{trapped}}$ | SPEC-09 |
| $\gamma_0$ | 定数として使う比熱比 | – | 定比熱比モデル $1.35$，ポートの剛性 $1.4$，オリフィスの式では上流のガスの $\gamma$ | SPEC-02，04，25，27 |

### 2.5a 化学種の熱物性と噴射（第26版．SPEC-29，SPEC-30）

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $\bar R$ | 一般気体定数 | J/(mol·K) | $8.314462618$ | SPEC-29 |
| $\bar c_{p,i}$，$\bar h_i$，$\bar s_i^\circ$，$\bar u_i$ | 化学種 $i$ のモル比熱，モルエンタルピー（生成エンタルピーを含む），標準エントロピー，モル内部エネルギー | J/(mol·K)，J/mol | NASA の 7 係数多項式．$\bar u_i = \bar h_i - \bar R T$ | SPEC-29 |
| $p^\circ$ | 標準圧 | Pa | $100\ \text{kPa}$ | SPEC-29 |
| $R_a$，$R_f$，$R_b$ | 空気，燃料蒸気，既燃ガスの気体定数 | J/(kg·K) | $288.19$，$75.586$，$R_b(T, p, \zeta)$ | SPEC-29 |
| $e_a$，$e_f$，$e_b$ | 空気，燃料蒸気，既燃ガスの内部エネルギー（絶対値） | J/kg | $e_b(T, p, \zeta)$ は平衡組成から | SPEC-29 |
| $M_a$，$M_f$ | 空気，燃料のモル質量 | kg/mol | $28.851$，$110\ \text{g/mol}$ | SPEC-29 |
| $h_{fg}$，$T_l$ | 燃料の気化潜熱，液体の燃料の温度 | J/kg，K | $350\ \text{kJ/kg}$，$300\ \text{K}$ | SPEC-30 |
| $m_f$，$m_{bf}$，$m_a$ | 筒内の未燃の燃料蒸気，既燃ガスのうち燃料に由来する質量，未燃の空気 | kg | 状態，状態，$m_u - m_f$ | SPEC-29 |
| $\zeta$，$\zeta^*$，$\phi_b$ | 既燃ガスの燃料由来の質量の割合，筒外の既燃ガスに使う値，既燃ガスの当量比 | – | $m_{bf}/m_b$，EVO の時点の $\zeta$，$\text{AF}_{st}\zeta/(1 - \zeta)$ | SPEC-29 |
| $\psi$ | 未燃ガスの燃料の質量の割合 | – | $m_f/m_u$ | SPEC-29 |
| $n_j$，$N$，$\mu_j$，$a_{ij}$，$b_i$，$\lambda_i$，$\pi_i$ | 既燃ガス 1 kg あたりの化学種 $j$ の物質量，その和，化学ポテンシャル，化学種 $j$ の 1 分子の元素 $i$ の数，元素 $i$ の量，未定乗数，反復の未知数 | mol/kg ほか | 平衡の計算 | SPEC-29 |
| $T_{fr}$ | 凍結温度 | K | $1700$ | SPEC-29 |
| $\mathcal{R}$，$C$，$S_E$，$S_R$ | 筒内ガスの $\sum m_k R_k$，熱容量，エネルギーの式と状態方程式の右辺 | J/K，J/K，W，W | SPEC-29 B の 5 | SPEC-29 |
| $m_l$，$m_{f,\text{in}}$，$m_{f,p}$ | 筒内の液体の燃料，吸気マニホールドとポートの燃料蒸気の質量 | kg | 状態 | SPEC-30 |
| $\dot m_{\text{inj}}$，$\dot m_{\text{ev}}$ | 噴射率，気化の速さ | kg/s | $\frac{m_{f,\text{cmd}}}{\Delta\theta_{\text{inj}}}\omega$，$\frac{m_l}{\tau_{\text{ev}}}$ | SPEC-30 |
| $m_{f,\text{cmd}}$，$\hat m_a$，$m_{a,\text{IVC}}$ | 噴射量の指令，今回のサイクルの空気量の推定，IVC の時点の筒内の未燃の空気の質量 | kg | $\phi\,\hat m_a/\text{AF}_{st}$，$m_{a,\text{IVC}} + m_{\text{IVC}}(\pi_S - 1)$（前のサイクルの値．$m_{\text{IVC}}$ は IVC の筒内の全質量，$\pi_S$ は噴射の開始の時点の $p_{\text{in}}$ の比（今回／前回）） | SPEC-30 |
| $\theta_{\text{SOI}}$，$\Delta\theta_{\text{inj}}$，$q_{\text{inj}}$，$\tau_{\text{ev}}$ | 噴射の開始角，角度の幅，インジェクタの流量，気化の時定数 | rad，rad，kg/s，s | 設定（既定 $80^\circ$，–，$15\ \text{g/s}$，$1.5\ \text{ms}$） | SPEC-30 |
| $\phi_c$，$f_\phi$ | 点火の時点の筒内の当量比，予混合気の燃料の質量分率 | – | $\text{AF}_{st}\,m_f/m_a$，$\phi/(\text{AF}_{st} + \phi)$ | SPEC-30 |

### 2.6 流れと吸排気系

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $\dot m$ | オリフィスの質量流量 | kg/s | $\dot m = \text{sgn}(p_1 - p_2)\,\dfrac{A\,p_0}{\sqrt{RT_0}}\,\Psi(r_p)$ | SPEC-04 |
| $r_p$，$r_{\text{crit}}$ | 圧力比，臨界圧力比 | – | $r_p = \dfrac{\min(p_1, p_2)}{\max(p_1, p_2)}$，$r_{\text{crit}} = \left(\dfrac{2}{\gamma_0 + 1}\right)^{\gamma_0/(\gamma_0 - 1)}$ | SPEC-04 |
| $\Psi$ | 流量関数 | – | 亜音速で $\Psi_{\text{sub}} = r_p^{1/\gamma_0}\sqrt{\dfrac{2\gamma_0}{\gamma_0 - 1}\left(1 - r_p^{(\gamma_0 - 1)/\gamma_0}\right)}$，$r_p \le r_{\text{crit}}$ で一定，$1 - r_p < \delta_r = 10^{-3}$ で直線 | SPEC-04 |
| $\dot m_{\text{th}}$，$\dot m_{\text{in}}$，$\dot m_{\text{ex}}$，$\dot m_t$ | スロットル，吸気弁（筒内へが正），排気弁（筒内からが正），テールパイプの流量 | kg/s | SPEC-04 の式に各断面の圧力と面積を入れる | SPEC-04 |
| $\alpha$ | スロットル開度（$0$：全閉，$\pi/2$：全開） | rad | 入力 | SPEC-05，12 |
| $A_{\text{th}}$ | スロットルの有効開口面積 | m² | $A_{\text{th}} = C_{d,\text{th}}\dfrac{\pi}{4}D_{\text{th}}^2(1 - \cos\alpha)$，$C_{d,\text{th}} = 0.8$ | SPEC-05 |
| $p_{\text{atm}}$，$T_{\text{amb}}$ | 大気圧，大気温 | Pa，K | 設定（既定 $101.3\ \text{kPa}$），$298.15$ | SPEC-05 |
| $T_{\text{in}}$，$V_{\text{in}}$，$m_{\text{in}}$ | マニホールドの温度（一定），容積，ガス質量 | K，m³，kg | $T_{\text{in}} = 298.15$，$m_{\text{in}} = \dfrac{p_{\text{in}}V_{\text{in}}}{RT_{\text{in}}}$ | SPEC-05 |
| $Y_{b,\text{in}}$，$Y_{b,p}$ | マニホールド，ポートの既燃ガス分率 | – | $Y_{b,\text{in}} = \text{clamp}\left(\dfrac{m_{b,\text{in}}}{m_{\text{in}}}, 0, 1\right)$，$Y_{b,p} = \text{clamp}\left(\dfrac{m_{b,p}}{m_p}, 0, 1\right)$ | SPEC-05，25 |
| $\dot X_o$ | 吸気弁の逆流が吸気側へ持ち込む余剰エンタルピーの流束 | W | $\dot X_o = \dot m_{\text{in}}^-\left[h(T, Y_u) - h(T_{\text{in}}, Y_u)\right]$ | SPEC-05 |
| $\varepsilon_{\text{in}}$，$\varepsilon_p$ | 単位質量あたりの余剰エンタルピー | J/kg | $\varepsilon_{\text{in}} = E_{\text{in}}/m_{\text{in}}$，$\varepsilon_p = E_p/m_p$ | SPEC-05，25 |
| $Y_{b,\text{src}}$，$\varepsilon_{\text{src}}$ | 吸気弁のすぐ上流の容積の既燃分率と余剰 | –，J/kg | ランナ ON ではポート，OFF ではマニホールドの値 | SPEC-05 |
| $h_j$，$T_{\text{up}}$ | 吸気弁の順流の顕熱エンタルピーと上流温度 | J/kg，K | $h_j = h(T_{\text{in}}, Y_j) + \varepsilon_{\text{src}}$，$T_{\text{up}} = T_{\text{in}} + \dfrac{\varepsilon_{\text{src}}}{c_p(T_{\text{in}}, Y_j)}$，$Y_j = 1 - Y_{b,\text{src}}$ | SPEC-05 |
| $L_r$，$d_r$，$A_r$，$V_p$，$m_p$ | 吸気ランナの長さ，内径，断面積，ポート容積，ポートのガス質量 | m，m，m²，m³，kg | $A_r = \dfrac{\pi}{4}d_r^2$，$V_p = \dfrac12 A_r L_r$，$m_p = \dfrac{p_p V_p}{RT_{\text{in}}}$ | SPEC-25 |
| $\zeta$，$\rho_r$ | ランナの損失係数，ガス密度 | –，kg/m³ | $\zeta = f_r\dfrac{L_r}{d_r} + \zeta_e$（$f_r = 0.02$，$\zeta_e = 0.2$），$\rho_r = \dfrac{p_{\text{in}}}{RT_{\text{in}}}$ | SPEC-25 |
| $Y_r$，$\varepsilon_r$，$Y_v$ | ランナの流れ，吸気弁の流れに乗る値（上流側の値） | – | $\dot m_r \ge 0$ でマニホールドの値，$< 0$ でポートの値．$Y_v$ は $\dot m_{\text{in}} \ge 0$ で $Y_{b,p}$，$< 0$ で $1 - Y_u$ | SPEC-25 |
| $\omega_H$ | 吸気ランナの共鳴の角振動数（弁が閉じているとき） | rad/s | $\omega_H = \sqrt{\dfrac{A_r}{L_r}\left(\dfrac{\gamma_0 RT_{\text{in}}}{V_p} + \dfrac{RT_{\text{in}}}{V_{\text{in}}}\right)}$ | SPEC-25 |
| $L_e$，$d_e$，$A_e$，$V_{pe}$，$V_m$，$A_t$ | 排気管の長さ，内径，断面積，排気ポート容積，消音器容積，出口の有効面積 | m，m，m²，m³，m³，m² | $A_e = \dfrac{\pi}{4}d_e^2$，$V_{pe} = \dfrac12 A_e L_e$ | SPEC-27 |
| $T_X$ | 排気系のガス温度（一定） | K | $T_X = 800$ | SPEC-27 |
| $\omega_E$ | 排気管の共鳴の角振動数 | rad/s | $\omega_E = \sqrt{\dfrac{A_e}{L_e}\left(\dfrac{\gamma_0 RT_X}{V_{pe}} + \dfrac{RT_X}{V_m}\right)}$ | SPEC-27 |
| $\Delta\bar p_{\text{ex}}$ | 排気背圧（サイクル平均） | Pa | $\Delta\bar p_{\text{ex}} = \dfrac{\Delta P_m}{t_c} - p_{\text{atm}}$ | SPEC-14，27 |

### 2.7 燃焼

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $\phi$ | 当量比 | – | 量論空燃比 $\text{AF}_{st} = 14.7$ に対する燃料の割合．設定 | SPEC-07 |
| $m_{u,\text{trapped}}$ | 吸気弁が閉じた時点の未燃ガスの質量 | kg | IVC の時点の $m_u$ | SPEC-06 |
| $m_{\text{air}}$，$m_f$ | 1 サイクルの空気と燃料の質量 | kg | $m_{\text{air}} = \dfrac{m_{u,\text{trapped}}}{1 + \phi/\text{AF}_{st}}$，$m_f = \dfrac{\phi}{\text{AF}_{st}}\,m_{\text{air}}$ | SPEC-07 |
| $S_{L,0}$，$S_L$ | 基準状態・点火時の層流燃焼速度 | m/s | $S_{L,0} = \max(0.05,\ 0.2758 - 0.7834(\phi - 1.13)^2)$，$S_L = S_{L,0}\left(\dfrac{T_s}{298}\right)^{2.18 - 0.8(\phi - 1)}\left(\dfrac{p_s}{101325}\right)^{-0.16 + 0.22(\phi - 1)}\max(0.15,\ 1 - 2.1x_r)$ | SPEC-07 |
| $u'$，$S_T$ | 乱れの強さ，乱流燃焼速度 | m/s | $u' = 0.5\,c_m$，$S_T = S_L + 6u'$ | SPEC-07 |
| $s$ | 点火進角 | °BTDC | 点火の角度は $\theta = 2\pi - s$ | SPEC-07，12 |
| $\Delta\theta_d$，$\Delta\theta_b$ | 着火遅れ，燃焼期間 | rad | $\Delta\theta_d = c_d\dfrac{\ell_k\,\omega}{S_L + C_k u'}$，$\Delta\theta_b = \dfrac{f_{\text{ret}}}{c_b}\dfrac{\ell_c\,\omega}{S_T}$ | SPEC-07 |
| $\theta_0$，$\zeta$ | 燃焼の開始角，正規化した燃焼の進行 | rad，– | $\theta_0 = 2\pi - s + \Delta\theta_d$，$\zeta = \dfrac{\theta - \theta_0}{\Delta\theta_b}$（SPEC-25 では $\zeta$ はランナの損失係数） | SPEC-07 |
| $x_b$ | 質量燃焼割合（Wiebe 関数） | – | $x_b = 1 - \exp\left(-a\,\zeta^{m_w + 1}\right)$，$a = 5$ | SPEC-07 |
| $r$ | 未燃ガスが既燃ガスに変わる速さ（燃焼の節） | kg/s | $r = m_{u,\text{trapped}}\dfrac{dx_b}{d\theta}\,\omega$（SPEC-01 では $r$ はクランク半径） | SPEC-06 |
| $Q_{\text{in}}$，$\dot Q_{\text{comb}}$ | 1 サイクルの発熱量，熱発生率 | J，W | $Q_{\text{in}} = m_f H_u\,\eta_c\,\epsilon(\phi)$，$\dot Q_{\text{comb}} = Q_{\text{in}}\dfrac{dx_b}{d\theta}\,\omega$（$H_u = 44.0\ \text{MJ/kg}$，$\eta_c = 0.97$） | SPEC-07 |
| $\epsilon(\phi)$ | リッチ側で実際に発熱する割合 | – | $\epsilon = 1 - \dfrac{b'\Delta h_{\text{CO}} + d'\Delta h_{\text{H}_2}}{M_f H_u}$（$\phi > 1$），$1$（$\phi \le 1$） | SPEC-07 |
| $\theta_{50}$，CA50 | 質量燃焼割合 $50\%$ の時期 | rad，°ATDC | $\theta_{50} = \theta_0 + \Delta\theta_b\left(\dfrac{\ln 2}{a}\right)^{1/(m_w + 1)}$，$\text{CA50} = \theta_{50} - 360^\circ$ | SPEC-12 |

### 2.8 壁面熱伝達

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $h_c$ | 熱伝達率（Woschni） | W/(m²·K) | $h_c = C_w \cdot 3.26\,B^{-0.2}\left(\dfrac{p}{1000}\right)^{0.8}T^{-0.55}\max(w, 0.5)^{0.8}$（SPEC-01 では $h_c$ は隙間の高さ） | SPEC-08 |
| $w$ | 代表ガス速度 | m/s | $w = C_1 c_m + C_2\dfrac{V_d T_r}{p_r V_r}\max(0,\ p - p_{\text{mot}})$ | SPEC-08 |
| $p_{\text{mot}}$ | 燃焼が無いとしたときの圧力 | Pa | $p_{\text{mot}} = p_r\left(\dfrac{V_r}{V}\right)^{1.33}$（$(p_r, V_r, T_r)$：IVC の時点の状態） | SPEC-08 |
| $\dot Q_{\text{wall}}$ | 壁への熱流量 | W | $\dot Q_{\text{wall}} = h_c\,A_w\,(T - T_w)$ | SPEC-08 |

### 2.9 回転運動，摩擦，動力計

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $I_{\text{tot}}$ | 全慣性モーメント | kg·m² | $I_{\text{tot}} = I + I_{\text{dyno}}$，$I = 0.12$ | SPEC-10 |
| $T_{\text{ind}}$ | 図示トルク | N·m | $T_{\text{ind}} = (p - p_{\text{atm}})\dfrac{dV}{d\theta}$ | SPEC-10 |
| FMEP，$T_f$ | 摩擦平均有効圧，摩擦トルク | Pa，N·m | $\text{FMEP} = F_0 + F_1 p_{\max} + F_2 c_m$，$T_f = \dfrac{\text{FMEP}\cdot V_d}{4\pi}$ | SPEC-10 |
| $T_{\text{aux}}$，AMEP | 補機の負荷トルク，その平均有効圧 | N·m，Pa | 設定，$\text{AMEP} = \dfrac{4\pi T_{\text{aux}}}{V_d}$ | SPEC-10 |
| $T_{\text{st}}$ | スターターのトルク | N·m | $T_{\text{st}} = T_{\text{stall}}\max\left(0,\ 1 - \dfrac{\omega}{\omega_{nl}}\right)$（完爆前） | SPEC-10 |
| $T_{\text{dyno}}$ | 動力計の吸収トルク | N·m | $T_{\text{dyno}} = f_{\text{eff}}\,k_w\,\omega^2$，$k_w = \dfrac{T_{\text{rated}}}{\omega_{\text{rated}}^2}$ | SPEC-11 |
| $f_{\text{cmd}}$，$f_{\text{eff}}$ | 充水率の指令，実効充水率 | – | $\tau_d\dfrac{df_{\text{eff}}}{dt} = f_{\text{cmd}} - f_{\text{eff}}$ | SPEC-11 |

### 2.10 制御

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $N$，$\bar N$ | 瞬時の回転数，平均回転数 | rpm | $N = \dfrac{30}{\pi}\omega$，$\tau_N\dfrac{d\bar N}{dt} = N - \bar N$ | SPEC-12 |
| $N_{\text{target}}$ | 目標回転数 | rpm | 設定 | SPEC-12 |
| $\alpha_{\text{manual}}$，$f_{\text{manual}}$，$f_{\text{base}}$ | 固定開度（動力計制御で使う），固定充水率（スロットル制御で使う），基準充水率（動力計制御の PI の基準） | rad，–，– | 設定．使わない制御のときは設定画面で変更できない（SPEC-18 B.7） | SPEC-11，18 |
| $e_N$，$e_d$ | 偏差 | rpm | $e_N = N_{\text{target}} - \bar N$，$e_d = \bar N - N_{\text{target}}$ | SPEC-11，12 |
| $\alpha_{\text{ff}}$，$\alpha_{\min}$ | feedforward を加えた基準開度，開度の下限 | rad | $\alpha_{\text{ff}} = \alpha_{\text{base}} + k_T T_{\text{aux}}$，$\alpha_{\min} = \min(\alpha_{\max},\ \max(0,\ \alpha_{\text{ff}} - \delta_\alpha))$ | SPEC-12 |
| $I_\alpha$，$I_f$ | スロットル制御・動力計制御の積分の状態 | rad，– | $\dfrac{dI_\alpha}{dt} = K_i e_N$，$\dfrac{dI_f}{dt} = K_{i,d}\,e_d$（張り付きを深める向きでは $0$） | SPEC-11，12 |

### 2.11 数値積分

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $\Delta t$ | 積分の刻み | s | RK4：$\Delta t = \min\left(\dfrac{\Delta\theta_{\text{step}}}{\max(\omega, \omega_{\min})},\ \Delta t_{\max}\right)$ | SPEC-13 |
| $E$ | DOPRI5 の誤差の見積もり | – | $E = \displaystyle\max_i\frac{\lvert y_{5,i} - y_{4,i}\rvert}{\text{atol}_i + \text{rtol}\cdot\max(\lvert y_{n,i}\rvert, \lvert y_{5,i}\rvert)}$ | SPEC-13 |
| $\lambda$ | ヤコビアン $\partial\mathbf{f}/\partial\mathbf{y}$ の固有値（数値積分の節） | 1/s | RK4 の安定の条件は $\lvert\lambda\rvert\,\Delta t \le 2.79$（SPEC-01 では $\lambda$ は連桿比） | SPEC-13 |

### 2.12 性能の指標

1 サイクルの補助積分の増分 $\Delta$ と，サイクルの所要時間 $t_c$ から求める．

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $W_{i,\text{net}}$，$W_{i,\text{gross}}$ | 正味の図示仕事，圧縮・膨張行程の図示仕事 | J | $W_{i,\text{net}} = \Delta W = \displaystyle\oint p\,dV$，$W_{i,\text{gross}} = \Delta W_g$ | SPEC-14 |
| IMEP，PMEP | 図示平均有効圧，ポンプ損失平均有効圧 | Pa | $\text{IMEP} = \dfrac{W_{i,\text{net}}}{V_d}$，$\text{PMEP} = \dfrac{W_{i,\text{net}} - W_{i,\text{gross}}}{V_d}$ | SPEC-14 |
| BMEP | 正味平均有効圧 | Pa | $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$ | SPEC-14 |
| $T_b$，$P_b$，$P_i$ | 軸トルク，軸出力，図示出力 | N·m，W，W | $T_b = \dfrac{\text{BMEP}\cdot V_d}{4\pi}$，$P_b = \dfrac{\text{BMEP}\cdot V_d}{t_c}$，$P_i = \dfrac{W_{i,\text{net}}}{t_c}$ | SPEC-14 |
| $\eta_m$，$\eta_i$，$\eta_b$ | 機械効率，図示熱効率，正味熱効率 | – | $\eta_m = \dfrac{\text{BMEP}}{\text{IMEP}}$，$\eta_i = \dfrac{W_{i,\text{net}}}{m_f H_u}$，$\eta_b = \dfrac{P_b}{\dot m_f H_u}$ | SPEC-14 |
| $\eta_v$ | 体積効率 | – | $\eta_v = \dfrac{m_{\text{air}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \dfrac{p_{\text{atm}}}{RT_{\text{amb}}}$（化学平衡のモデルでは $m_{\text{air}} = m_{a,\text{IVC}}$，気体定数は $R_a$） | SPEC-14 |
| bsfc | 正味燃料消費率 | g/kWh | $\text{bsfc} = \dfrac{\dot m_f}{P_b}$，$\dot m_f = \dfrac{m_f}{t_c}$ | SPEC-14 |
| $p_{\max}$，$T_{\max}$ | 1 サイクルの最高筒内圧，最高ガス温度 | Pa，K | $p_{\max}$ は 3 点の放物線の頂点，$T_{\max}$ はステップ点の最大 | SPEC-13，14 |
| $\eta_{\text{Otto}}$ | 理論サイクルの熱効率（上限の目安） | – | $\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$ | TEST-14 |

### 2.13 エンジン音

| 記号 | 名称 | 単位 | 定義 | 仕様 |
| :--- | :--- | :--- | :--- | :--- |
| $q$ | 音源（排気弁の質量流量の時間微分） | kg/s² | $q = \omega\dfrac{d\dot m_{\text{ex}}}{d\theta}$ | SPEC-21 |
| $\psi$，$f_s$ | 再生の位相（表の添字，$[0, 1440)$），サンプリング周波数 | –，Hz | 1 サンプルごとに $\Delta\psi = \dfrac{1440\,\bar N_a}{120\,f_s}$ | SPEC-21 |
| $c$，$f_n$ | 排気中の音速，排気管の共鳴周波数 | m/s，Hz | $c = \sqrt{\gamma_b(T_X)\,R\,T_X}$，$f_n = \dfrac{(2n - 1)\,c}{4L}$ | SPEC-21 |
| $\rho_m$ | 消音器の反射率 | – | 設定（既定 $0.6$） | SPEC-21 |
| $\ell$ | 負荷の目安（演出の音） | – | $\ell = \text{clamp}\left(\dfrac{p_{\text{in}}/p_{\text{atm}} - 0.3}{0.6},\ 0,\ 1\right)$ | SPEC-21 |
| $q_{\text{ref}}$ | 演出の音の音量の基準 | kg/s² | 全開・$3500\ \text{rpm}$ の単気筒の音源の実効値 $16.01$（第26版の既定のモデルで測り直した．第25版は $14.59$） | SPEC-21 |

---

## 3. 用語

### 3.1 機関

| 用語 | 定義 |
| :--- | :--- |
| 単気筒4ストローク SI 機関 | 1 つの気筒で，吸気・圧縮・膨張・排気の 4 行程（クランク 2 回転，$4\pi\ \text{rad}$）を 1 サイクルとする火花点火（spark ignition）機関 |
| 上死点，下死点 | ピストンが最もヘッドに近い位置（$V = V_c$），最も遠い位置（$V = V_c + V_d$）．$\theta = 0$ が吸気上死点，$2\pi$ が圧縮上死点 |
| 行程 | 吸気 $0 \le \theta < \pi$，圧縮 $\pi \le \theta < 2\pi$，膨張 $2\pi \le \theta < 3\pi$，排気 $3\pi \le \theta < 4\pi$ |
| 未燃ガス，既燃ガス | 未燃ガスは新気（空気と燃料蒸気の予混合気），既燃ガスは燃焼の生成物．筒内ガスは両者の混合で，未燃分率 $Y_u = m_u/m$ で表す |
| 化学平衡，解離 | 高温の既燃ガスで，CO$_2$ ⇌ CO + ½O$_2$ などの反応がつり合った組成．完全燃焼の生成物の一部が CO，H$_2$，O$_2$，OH などに分かれている（解離）ので，その分の発熱が出ない．第26版で 10 種の平衡として扱う（SPEC-29．未実装） |
| 凍結 | 膨張で温度が下がると反応が遅くなり，組成が平衡に追いつかずに止まること．$T_{fr}$ 以下で組成を固定して表す（SPEC-29） |
| ポート噴射，直噴 | 燃料を吸気管で気化させて予混合気として吸う方式と，筒内へ液体のまま噴く方式．直噴では気化潜熱が筒内のガスを冷やす（SPEC-30．未実装） |
| speed-density 方式 | 吸気管圧（と回転数，温度）から，筒内に入る空気の質量を見積もる方式．本モデルの ECU は，前のサイクルの IVC の筒内の質量と，吸気管圧の比 $\pi_S$ から $\hat m_a$ を求める（SPEC-30 の 4） |
| 燃料空気サイクル | 作動流体を実際の燃料と空気，既燃ガスの物性で扱う理想サイクル（熱損失なし，瞬時の燃焼）．`tools/richburn` の試算に使った |
| 残留ガス，内部 EGR | 前のサイクルから筒内に残る既燃ガス．バルブオーバーラップ中に吸気側へ吹き返して次の吸気で戻る分を含む．その割合が残留ガス率 $x_r$ |
| バルブオーバーラップ | 排気弁と吸気弁が同時に開いている期間．角度は $\theta_{\text{OL}} = \text{EVC} - (\text{IVO} + 720^\circ)$ |
| 吹き返し | 吸気弁を筒内から吸気側へ流れる逆流（$\dot m_{\text{in}} < 0$） |
| 吹き抜け | 新気が燃えずに排気側へ出ること．本モデルでは排気側へ出た新気は既燃ガスとして扱う |
| 完爆 | 始動中に，燃料 ON で $\bar N > 550\ \text{rpm}$ かつ直前のサイクルの $W_g > 20\ \text{J}$ になったこと．スターターを切る |
| エンスト | 完爆後に $\bar N < 150\ \text{rpm}$ になったこと．完爆の状態と燃料を OFF にする |
| MBT | 図示仕事が最大になる点火時期（minimum advance for best torque）．本モデルでは CA50 が上死点後 $10^\circ$ になる点火時期で近似する |
| CA50 | 質量燃焼割合が $50\%$ になるクランク角（圧縮上死点後の角度） |
| 火炎発達角 | 点火から $x_b = 0.1$ までのクランク角 |
| 慣性過給 | 吸気ランナのガス柱の慣性で，吸気弁が閉じる直前のポート圧が上がり，充填が増えること |
| 背圧 | 排気弁の下流（消音器）の圧力と大気圧の差 |
| チョーク | オリフィスののど部の流速が音速に達し，流量が下流の圧力によらなくなること（$r_p \le r_{\text{crit}}$） |

### 3.2 モデルと数値計算

| 用語 | 定義 |
| :--- | :--- |
| 0 次元・単一ゾーン | 筒内ガスを空間的に一様（1 つの温度，1 つの圧力）とみなすモデル |
| 開いた系の第一法則 | 質量の出入りを含むエネルギー保存．$\dfrac{dE}{dt} = -p\dfrac{dV}{dt} - \dot Q_{\text{wall}} + \sum_j\dot m_j\,(h_j + Y_j q_u)$ |
| 顕熱の内部エネルギー | 基準温度 $T_0$ からの比熱の積分 $e_k(T) = \int_{T_0}^{T}c_{v,k}\,dT'$．発熱（化学エネルギー）を含まない |
| 余剰エンタルピー | 吸気側の容積にあるガスが，同じ組成のガスが $T_{\text{in}}$ で持つ顕熱エンタルピーより余分に持つ熱．吹き返した高温ガスが持ち込み，流れに乗って運ばれる（$E_{\text{in}}$，$E_p$） |
| 第一法則の残差 | $\Delta U_s + \Delta W + \Delta Q_w - \Delta Q_c - \Delta H_i + \Delta H_o$．数値積分が正しければ $0$ になる |
| 周期定常 | サイクルごとの状態が同じ値を繰り返す運転状態 |
| 補助積分 | 状態と同じ Runge–Kutta の重みで同時に積分する，集計と検査のための量（2.3 節）．右辺には現れない |
| イベント | 右辺が折れるか，状態の記録や切替が起きるクランク角：サイクルの終端，弁の開閉（IVO，IVC，EVO，EVC），点火．積分のステップはちょうどその角度で終わる |
| 射影 | ステップの後で，丸めによる非物理的な値（負の質量など）を防ぐために下限・上限を適用する処理．通常の運転では一度も働かないことを要件とする |
| 強制受理 | DOPRI5 で，刻みを縮めても誤差が許容を超えたままのステップを受け入れること．通常の運転では起きないことを要件とする |
| 硬さ | ヤコビアンの固有値の絶対値の最大 $\max\lvert\lambda\rvert$．陽的解法の刻みの上限を決める |
| 正則化 | 流量関数 $\Psi$ の傾きが $r_p \to 1$ で無限大になるのを避けるため，$1 - r_p < \delta_r$ で直線に置き換えること |
| 参照解 | 既定より細かい刻み（RK4，$0.05^\circ$ または $0.02^\circ$）で積分した解．既定の刻みの精度の判定に使う |
| コールドリセット | 状態を初期値（$\theta = \pi$，$\omega = 0$，全ての圧力が $p_{\text{atm}}$，筒内 $320\ \text{K}$，壁温 $298.15\ \text{K}$）に戻すこと |
| 冷間始動 | コールドリセットからの始動．「冷間」は壁温の初期値だけを指す（冷却水温は一定） |
| サイクル変動 | 点火のたびに，燃焼の開始角と燃焼期間を擬似乱数でばらつかせること |

### 3.3 制御と動力計

| 用語 | 定義 |
| :--- | :--- |
| スロットル制御（モード A） | ECU がスロットル開度 $\alpha$ を PI 制御して $\bar N$ を $N_{\text{target}}$ に合わせる方式．動力計の充水率は一定 |
| 動力計制御（モード B） | スロットル開度を一定にし，動力計の充水率を PI 制御して $\bar N$ を $N_{\text{target}}$ に保つ方式 |
| 水ブレーキ式動力計 | 回転数の 2 乗と充水率に比例するトルク $T_{\text{dyno}} = f_{\text{eff}}k_w\omega^2$ を吸収する負荷装置（吸収専用） |
| feedforward | 補機の負荷 $T_{\text{aux}}$ に応じて基準の開度を上げること：$\alpha_{\text{ff}} = \alpha_{\text{base}} + k_T T_{\text{aux}}$ |
| アンチワインドアップ | 操作量が上下限に張り付いていて，偏差がそれを深める向きのとき，積分を止めること |
| 張り付き | 操作量が上限または下限にあること（画面の `全開`，`全閉`，`下限`，`上限`） |
| `OVERLOAD`，`UNDERPOWER` | $f_{\text{cmd}} = 1$ のまま回転が目標より $100\ \text{rpm}$ 以上高い状態，$f_{\text{cmd}} = 0$ のまま $100\ \text{rpm}$ 以上低い状態が $2\ \text{s}$ 続いたときの表示 |
| 回転数の固定 | $\dfrac{d\omega}{dt} = 0$ とするモード．性能曲線の計測と一部のテストで使う |

### 3.4 画面と検証

| 用語 | 定義 |
| :--- | :--- |
| 即時項目，要リセット項目 | 押した時点で反映される設定と，「適用」で確定してコールドリセットを伴う設定（$B$，$S$，$l$，$\varepsilon$） |
| 項目定義表 | 設定項目の唯一の定義（キー，表示名，単位，単位係数，範囲，刻み，既定値）．表示値 × 単位係数 = 内部値 |
| MathJax，TeX の表示 | 解説タブの数式の表示．数式は TeX のソースで持ち，ネットワークがあれば MathJax 3.2.2（Apache License 2.0，`tex-svg`）を cdnjs から読み込んで SVG に組む．読み込めなければ TeX のソースを等幅で示す（TeX の表示）．フォントは埋め込まない（C-1，C-8，SPEC-16 3） |
| 基準サイクル | 設定を変える直前に完了していた 1 サイクルの波形．現在のサイクルと重ねて描く |
| $p$-$V$ 線図の印 | $p$-$V$ 線図の曲線の上に描く丸印と記号（IVO，IVC，EVO，EVC，IGN，CA50，SOI，EOI，p_max）．記号は互いに重ならない位置に置く（SPEC-17 A の 5） |
| バルブタイミングの画面 | 線図タブの 8 つ目の画面．両対数の $p$-$V$ 線図を見ながら，IVO，IVC，EVO，EVC をスライダと `[−]` `[＋]` で変える（SPEC-15 I） |
| 段階型，帯域型（レンジ） | グラフの表示範囲の決め方．段階型はフルスケール $F \in \{1, 2, 5\} \times 10^k$ をデータの最大に応じて切り替える．帯域型はデータの最小・最大のまわりの範囲を取る |
| 計測（性能曲線） | 回転数を固定して，回転数ごとの定常の特性（$T_b$，$P_b$，$\eta_v$ など）を求めること |
| 整定 | 計測の各点で，直近 3 サイクルの各量の幅が判定値以下になること |
| エンストの点（計測） | 性能曲線の計測で，計測中に燃料が OFF になった点（回転数を固定しているので $150\ \text{rpm}$ 未満の点）．記録だけしてグラフに描かない（SPEC-26 A の 4） |
| $n_{\min}$，$n_{\max}$（計測のサイクル数の最少・最多） | 計測の各点で，判定を始めるまでに完了させる完爆後のサイクル数と，判定を満たさなくても打ち切るサイクル数．条件の画面で指定する（$3 \le n_{\min} \le 30$，$10 \le n_{\max} \le 200$，$n_{\min} \le n_{\max}$．SPEC-26 A.6） |
| シナリオ | テストで `EngineCore` を走らせる決まった運転の手順（S1，S2，…） |
| 実行区分 | テスト項目の種類：[A] 解析，[S] シナリオ，[U] 画面，[D] 開発時（ヘッドレスブラウザ），[M] 実機目視 |
| 計算の音，演出の音 | 計算の音は排気流量から物理的な式で作る音．演出の音は聞いて心地よいように作った 4 気筒風の音で，物理モデルではない |

---

## 4. 略語

| 略語 | 意味 |
| :--- | :--- |
| SI | spark ignition（火花点火）．単位系の SI は文脈で区別する |
| ECU | engine control unit |
| VVT | variable valve timing（カムの位相を変える機構） |
| EGR | exhaust gas recirculation（ここでは内部 EGR だけを扱う） |
| MBT | minimum advance for best torque |
| IVO，IVC，EVO，EVC | intake valve opening／closing，exhaust valve opening／closing |
| BTDC，ATDC | before／after top dead center（圧縮上死点の前／後） |
| IGN | ignition（点火の時点．$p$-$V$ 線図の印） |
| CA50 | 燃焼質量割合が $50\%$ になるクランク角（圧縮上死点後の角度で表す） |
| SOI，EOI | start／end of injection（噴射の開始，終了） |
| IMEP，PMEP，FMEP，AMEP，BMEP | indicated／pumping／friction／accessory／brake mean effective pressure |
| bsfc | brake specific fuel consumption |
| RK4，DOPRI5 | 4 次の古典的 Runge–Kutta 法，Dormand–Prince の 5(4) 次の埋め込み型 Runge–Kutta 法 |
| PI | 比例（proportional）と積分（integral）による制御 |
| WOT | wide open throttle（全開） |
| LHV | lower heating value（低位発熱量 $H_u$） |
| CA | crank angle（クランク角） |
