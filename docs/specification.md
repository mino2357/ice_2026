# 単気筒4ストロークSI機関シミュレータ 仕様書（第26版）

## 0. この文書について

* **位置づけ**：要件定義書（`docs/requirements.md`）の要件 REQ-01〜35 を満たすために，**何をどの式で計算し，どう表示し，どう確かめるか**を定める．要件定義書が「何ができること」と受入基準を定め，この仕様書がその実現の内容を定める．
* **番号**：SPEC-nn は REQ-nn を実現する仕様，TEST-nn はその検証項目で，同じ番号どうしが対応する．
* **記号と用語**：用語の定義集（`docs/glossary.md`）に，単位と定義式とともにまとめてある．
* **構成**：1 節 構成，2 節 座標系と状態変数，3 節 機関モデル（SPEC-01〜12，25，27，29，30），4 節 数値積分と性能の指標（SPEC-13，14），5 節 画面（SPEC-26，32〜34．画面だけの章 SPEC-15〜19，22，23，31 と，SPEC-26 B，SPEC-32 A，SPEC-33 C，SPEC-34 A は画面の文書 `docs/gui.md`），6 節 エンジン音（SPEC-21），7 節 検証（SPEC-20，24，28），8 節 テスト項目（TEST-01〜35．TEST-15〜19，22，23，31 は画面の文書），9 節 開発時検証．
* **規則**：
  1. 現行の仕様だけを書く．変更の経緯は要件定義書の改訂の記録に書く．
  2. 式は導出を省かず，記号はすべて定義する．定数は値と出典（または決め方）を書く．
  3. 判定値のうち，実測に余裕を持たせて決めたものは「（実測 …）」と添える．文献で確かめていない値は「推定」「未確認」と書く．
  4. 句読点は「，」「．」．計算の内部は SI．圧力は Pa 系（$\text{Pa}$，$\text{kPa}$，$\text{MPa}$）で表し，$\text{bar}$ は使わない．角度は内部が $\text{rad}$，表示と本文の数値は $^\circ$（クランク角は $^\circ\text{CA}$）．定着した日本語訳の無い術語は英語のまま書く．

---

## 1. 構成

1. 物理モデル・ECU・動力計・ソルバは，DOM にもグローバル変数にも依存しない `EngineCore`（生成できるオブジェクト）にまとめ，運転用とテスト用に別々のインスタンスを作れる（SPEC-20）．
2. 設定項目は 1 つの**項目定義表**（キー，表示名，単位，単位係数，下限，上限，刻み，既定値，分類，選択肢）で定義し，設定画面・解説タブ §0・テストがこの表を参照する（SPEC-18）．
3. グラフは「レイアウト計算」と「描画」を分け，機関断面図は「場面記述」と「描画」を分ける（SPEC-17，SPEC-19 のテストのため）．
4. エンジン音の合成器は DOM に依存しない `Synth` とし，AudioWorklet・代替経路・テストが同じクラスを使う（SPEC-21）．
5. 成果物は，単一の HTML ファイル（JavaScript，Canvas 2D，CSS）である．数式の組版だけは，ネットワークがあれば実行時に MathJax を読み込む（C-1，SPEC-16 3）．ソースは `src/` にあり，`src/build.py` が結合する．要件定義書・仕様書・用語の定義集は，ビルド時に HTML に変換し，数式を TeX のまま成果物に埋め込む（SPEC-16）．

---

## 2. 座標系・状態変数・補助積分

### 2.1 独立変数とクランク角
* $t$：時間 $[\text{s}]$．
* $\theta \in [0, 4\pi)$：1サイクル（$720^\circ\text{CA}$）内のクランク角 $[\text{rad}]$．サイクルの終端（$\theta = 4\pi$）で $4\pi$ を引く（SPEC-13）．
  * $\theta = 0$：吸気上死点（ガス交換の上死点）
  * $\theta = \pi$（$180^\circ$）：吸気下死点
  * $\theta = 2\pi$（$360^\circ$）：圧縮上死点
  * $\theta = 3\pi$（$540^\circ$）：膨張下死点
* 角度の剰余を $\text{md}(a) = a - 4\pi\lfloor a/4\pi \rfloor \in [0, 4\pi)$ と書く．

### 2.2 状態ベクトル $\mathbf{y}(t) \in \mathbb{R}^{22}$
$\frac{d\mathbf{y}}{dt} = \mathbf{f}(\mathbf{y}; \mathbf{u})$ を時間積分する．$\mathbf{u}$ は ECU と動力計が決める入力（スロットル開度 $\alpha$，動力計のトルク $T_{\text{dyno}}$，点火時期 $s$ など）で，積分の1ステップの間は一定とする（SPEC-13）．

| # | 記号 | 意味 | 単位 | 式 |
| ---: | :--- | :--- | :--- | :--- |
| 1 | $\theta$ | クランク角 | rad | SPEC-10 |
| 2 | $\omega$ | クランク軸の角速度（回転数 $N = \frac{30}{\pi}\omega$ [rpm]） | rad/s | SPEC-10 |
| 3 | $p$ | 筒内圧 | Pa | SPEC-09 |
| 4 | $m$ | 筒内ガスの全質量 | kg | SPEC-06 |
| 5 | $m_u$ | 筒内の未燃ガス（新気）の質量 | kg | SPEC-06 |
| 6 | $T_w$ | シリンダ壁の平均温度 | K | SPEC-08 |
| 7 | $p_{\text{in}}$ | 吸気マニホールド圧 | Pa | SPEC-05 |
| 8 | $m_{b,\text{in}}$ | 吸気マニホールド内の既燃ガスの質量 | kg | SPEC-05 |
| 9 | $\dot m_r$ | 吸気ランナの質量流量（マニホールド → ポートが正） | kg/s | SPEC-25 |
| 10 | $p_p$ | 吸気ポート圧 | Pa | SPEC-25 |
| 11 | $m_{b,p}$ | 吸気ポート内の既燃ガスの質量 | kg | SPEC-25 |
| 12 | $\dot m_e$ | 排気管の質量流量（排気ポート → 出口が正） | kg/s | SPEC-27 |
| 13 | $p_{pe}$ | 排気ポート圧 | Pa | SPEC-27 |
| 14 | $p_{te}$ | 排気管の出口側の圧力（大気開放では使わない．時間微分は $0$．SPEC-27 の 8） | Pa | SPEC-27 |
| 15 | $E_{\text{in}}$ | 吸気マニホールドの余剰エンタルピー | J | SPEC-05 |
| 16 | $E_p$ | 吸気ポートの余剰エンタルピー | J | SPEC-25 |
| 17 | $m_f$ | 筒内の未燃の燃料蒸気の質量 | kg | SPEC-29 |
| 18 | $m_{bf}$ | 筒内の既燃ガスのうち燃料に由来する質量 | kg | SPEC-29 |
| 19 | $m_l$ | 筒内の液体の燃料の質量 | kg | SPEC-30 |
| 20 | $m_{f,\text{in}}$ | 吸気マニホールド内の燃料蒸気の質量 | kg | SPEC-30 |
| 21 | $m_{f,p}$ | 吸気ポート内の燃料蒸気の質量 | kg | SPEC-30 |
| 22 | $T_X$ | 排気ポートのガスの温度（排気温度） | K | SPEC-27 |

* 17〜21 は熱物性が「化学平衡」（既定）のときだけ使う．「γ(T)」「γ一定」では $0$ のままで，以下の 2 項は $\gamma$ のモデルのものである（「化学平衡」での温度と気体定数は SPEC-29 B）．
* 22 も熱物性が「化学平衡」のときだけ使う．ほかの熱物性では時間微分を $0$ とし，排気ポートのガスの温度に $800\ \text{K}$ の定数を使う（第25版と同じ）．排気系 OFF でも時間微分を $0$ とし，排気弁の逆流の温度に $800\ \text{K}$ を使う（SPEC-27 の 12）．
* 6 の壁温 $T_w$ は，熱物性が「化学平衡」のときは設定の一定値で，時間微分は $0$（SPEC-08 の B）．
* 従属変数：筒内ガスの平均温度 $T = \frac{pV(\theta)}{mR}$，既燃ガスの質量 $m_b = m - m_u$，未燃分率 $Y_u = \text{clamp}\left(\frac{m_u}{m}, 0, 1\right)$，残留ガス率（既燃分率）$x_r = 1 - Y_u$．
* 気体定数は未燃・既燃とも $R = 287.0\ \text{J/(kg·K)}$ とする（SPEC-02）．
* ランナ OFF（SPEC-25）では 9〜11 と 16，排気系 OFF（SPEC-27）では 12〜14 の時間微分を $0$ とする．
* **初期値（コールドリセット）**：$\theta = \pi$，$\omega = 0$，$p = p_{\text{in}} = p_p = p_{pe} = p_{te} = p_{\text{atm}}$，筒内ガスは温度 $320\ \text{K}$ の未燃ガス（$m = m_u = \frac{p_{\text{atm}}V(\pi)}{R \cdot 320}$），$T_w = 298.15\ \text{K}$（化学平衡のモデルでは設定の壁温．SPEC-08 の B），$T_X = T_{\text{amb}} = 298.15\ \text{K}$，そのほかは $0$．IVC の基準状態（SPEC-08）の初期値は $(p_{\text{atm}}, V(\pi), 320\ \text{K})$．

### 2.3 補助積分 $\mathbf{z}(t) \in \mathbb{R}^{33}$
サイクルの集計と保存則の検査に使う量を，状態と同じ Runge–Kutta の重みで同時に積分する（SPEC-13）．$\mathbf{z}$ は $\mathbf{f}$ に現れず，誤差判定にも含めない．

| 記号 | 被積分関数 | 用途 |
| :--- | :--- | :--- |
| $B_o$，$B_i$ | $\dot m_{\text{in}}^-(1 - Y_u)$，$\dot m_{\text{in}}^+ Y_{b,\text{src}}$ | 吸気弁を出入りする既燃ガス（SPEC-05） |
| $W$，$W_g$ | $p\frac{dV}{d\theta}\omega$，同（$\pi \le \theta < 3\pi$ のみ） | 図示仕事（正味，圧縮膨張） |
| $W_f$，$W_a$，$W_d$ | $T_f\omega$，$T_{\text{aux}}\omega$，$T_{\text{dyno}}\omega$ | 摩擦・補機・動力計の仕事 |
| $M_{\text{th}}$，$M_r$，$M_{\text{in}}$，$M_{\text{ex}}$，$M_e$，$M_t$ | $\dot m_{\text{th}}$，$\dot m_r$，$\dot m_{\text{in}}$，$\dot m_{\text{ex}}$，$\dot m_e$，$\dot m_t$ | 各断面を通った質量 |
| $P_{pe}$，$\Upsilon$ | 排気弁の下流圧（排気系 ON では $p_{pe}$，OFF では $p_{\text{atm}} + \Delta p_{\text{ex}}$），$Y_{b,\text{in}}$ | サイクル平均の背圧と吸気管既燃率 |
| $Q_c$，$Q_w$，$H_i$，$H_o$ | $\dot Q_{\text{comb}}$，$\dot Q_{\text{wall}}$，$\dot H_{\text{in}}^s$，$\dot H_{\text{out}}^s$ | 第一法則の収支（SPEC-09） |
| $X_o$，$X_i$，$X_t$ | 吸気弁の逆流が運ぶ余剰エンタルピー，順流で戻る分，スロットルの逆流で出る分 | 余剰エンタルピーの収支（SPEC-05） |
| $H_e$，$F_{\text{inj}}$，$F_{\text{ev}}$ | $\dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right]$，$\dot m_{\text{inj}}$，$\dot m_{\text{ev}}$ | 気化した燃料が持ち込むエネルギー，噴いた質量，気化した質量（SPEC-29 B の 8，SPEC-30．化学平衡のモデルだけ） |
| $F_{\text{iv}}$，$F_{\text{ex}}$，$F_b$ | 吸気弁を通る燃料蒸気（流入が正），排気弁から出る燃料蒸気，$r\psi$ | 筒内の燃料蒸気の収支（TEST-30 項目 1．化学平衡のモデルだけ） |
| $Q_{pw}$ | $\dot Q_{pw}$ | 排気ポートの壁への熱（SPEC-27 の 10．化学平衡のモデルだけ） |
| $H_{xs}$，$H_x$ | $\dot H_{xs}$，$\dot H_x$ | 排気弁から排気ポートへ入る顕熱，排気管へ出る顕熱（SPEC-27 の 9．収支の検査用．化学平衡のモデルだけ） |
| $\Theta_x$，$M_x^+$ | $\dot m_e^+ T_X$，$\dot m_e^+$ | 排気温度の質量平均（SPEC-27 の 11．化学平衡のモデルだけ） |

ここで $\dot m^+ = \max(0, \dot m)$，$\dot m^- = \max(0, -\dot m)$．ランナ OFF では $M_r$ に $\dot m_{\text{in}}$，排気系 OFF では $M_e$ に $\dot m_{\text{ex}}$ を積分する．

---

## 3. 機関モデル

### SPEC-01：スライダ・クランク運動学（REQ-01）

#### 定義と式
ピストンピンのオフセットは $0$ とする．連桿の傾き角を $\beta$ とすると $r\sin\theta = l\sin\beta$ より $\cos\beta = \sqrt{1 - \lambda^2\sin^2\theta}$．上死点でのピストン位置 $r + l$ からの変位は
$$x(\theta) = (r + l) - (r\cos\theta + l\cos\beta) = r\left[(1 - \cos\theta) + \frac{1}{\lambda}\left(1 - \sqrt{1 - \lambda^2\sin^2\theta}\right)\right]$$
最大容積と最小容積の比が $\varepsilon$ なので，ピストン頂面の面積を $A_p = \frac{\pi B^2}{4}$ として
$$V_d = A_p S, \qquad V_c = \frac{V_d}{\varepsilon - 1}, \qquad V(\theta) = V_c + A_p\,x(\theta)$$
$\frac{d}{d\theta}\sqrt{1 - \lambda^2\sin^2\theta} = \frac{-\lambda^2\sin\theta\cos\theta}{\sqrt{1 - \lambda^2\sin^2\theta}}$ を使うと
$$\frac{dV}{d\theta} = A_p\,r\sin\theta\left(1 + \frac{\lambda\cos\theta}{\sqrt{1 - \lambda^2\sin^2\theta}}\right)$$
伝熱面積は，ピストン頂面 $A_p$，シリンダヘッド $A_p$，ライナ $\pi B\,(x + h_c)$ の和とする（$h_c = V_c/A_p$：等価な隙間の高さ）：
$$A_w(\theta) = \frac{\pi B^2}{2} + \pi B\left(x(\theta) + h_c\right)$$

* **既定値と範囲**：$B = S = 86\ \text{mm}$，$l = 145\ \text{mm}$，$\varepsilon = 10$．$B, S \in [40, 150]\ \text{mm}$，$l \in [60, 300]\ \text{mm}$，$\varepsilon \in [1.1, 100]$，かつ $\lambda \le 0.5$．$\varepsilon > 1$ は $V_c > 0$ の必要十分条件（下限 $1.1$ は数値上の余裕），$\lambda < 1$ は根号が実数になる条件である．
* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Ch. 2](https://www.accessengineeringlibrary.com/content/book/9781260116106)（リンク先は第 2 版，2018．この文書の章の番号は初版のもの．1〜5 章の題が第 2 版でも同じことは出版社の目次で確かめた．6 章以降は確かめていない）

---

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
5. **定比熱比モデル**（設定「燃焼」の `[比熱 γ(T)／γ一定]`，既定 $\gamma(T)$）：$\gamma_u = \gamma_b = \gamma_0 = 1.35$．このとき $c_v = \frac{R}{\gamma_0 - 1}$，$e_k(T) = c_v\,(T - T_0)$．
6. **化学平衡のモデル**（第26版）：設定の「化学平衡」が既定である．そのときの物性と筒内の式は SPEC-29 で定める．この SPEC は「γ(T)」「γ一定」を選んだときのものになる．

#### 仮定と限界
* 当量比・圧力による $\gamma$ の変化は扱わない（当てはめは量論比．既燃ガスは $1500\ \text{K}$ 以上で圧力にも依存する）．
* 既燃ガスの線形当てはめは，平衡組成の $\gamma$ を $1\%$ 弱の誤差で表す（同論文）．より正確な Krieger–Borman の多項式は，係数を原典で確認できていないため採用していない．
* 単一ゾーンなので，未燃ガスの比熱も筒内の平均温度 $T$ で評価する（実際の未燃部は $1000\ \text{K}$ 程度までにとどまる．$T_{c,u}$ の頭打ちがこれに対応する）．

* **出典**：[M. Klein and L. Eriksson, "A specific heat ratio model for single-zone heat release models"（Linköping 大学，2004．表 1，表 2）](https://www.fs.isy.liu.se/Publications/Articles/CCSSE_04_MK.pdf)

---

### SPEC-03：カムプロファイルと弁の有効開口面積（REQ-03）

#### 定義と式
1. **リフト**：開時期 $\theta_o$，閉時期 $\theta_c$ に対し，作用角 $\Delta\theta_{\text{cam}} = \text{md}(\theta_c - \theta_o)$，開弁からの経過角 $\delta = \text{md}(\theta - \theta_o)$ とする．$\delta \le \Delta\theta_{\text{cam}}$ のとき開弁で，$\xi = \delta/\Delta\theta_{\text{cam}} \in [0, 1]$ に対しリフト $L_v$ を次のいずれかで与える（それ以外は $L_v = 0$）．

   | 名称 | $L_v(\xi)/L_{\max}$ | 開閉点での滑らかさ |
   | :--- | :--- | :--- |
   | Standard | $\sin^2(\pi\xi)$ | $C^1$（速度が連続，加速度が不連続） |
   | Polynomial | $16\,\xi^2(1 - \xi)^2$ | $C^1$（端の 2 階微分は $32 \ne 0$） |
   | Aggressive | $\sin^{0.6}(\pi\xi)$ | $C^0$（端で速度が無限大） |

   カムの種類と最大リフト $L_{\max}$ は吸気・排気で共通とする．
2. **有効開口面積**：機関は 4 弁で，吸気弁と排気弁がそれぞれ $n_v = 2$ 個ある．弁 1 個のカーテン面積 $\pi d_v L_v$ を，弁座の面積 $\frac{\pi}{4}d_v^2$ で頭打ちにし，$n_v$ 個分を合わせる（同じ側の 2 個の弁は同じリフトで動く）．
   $$A_{\text{eff}}(\theta) = n_v\,C_d\,\min\left(\pi d_v L_v,\ \frac{\pi}{4}d_v^2\right), \qquad n_v = 2,\quad C_d = 0.6$$
   弁径（1 個の径）は，吸気が $d_{v,\text{in}} = \min\left(d_v, (\sqrt2 - 1)B\right)$，排気が $d_{v,\text{ex}} = \min\left(d_{ve}, (\sqrt2 - 1)B\right)$（$d_v$，$d_{ve}$：設定値の吸気弁径と排気弁径）．
   * **上限の由来**：平らなヘッドに，半径 $a$ の吸気弁 2 個と半径 $b$ の排気弁 2 個を，同じ側の 2 個が互いに接し，ボアの壁（半径 $R = B/2$）にも接するように置く．吸気弁の中心は $(\pm a, y_i)$，$y_i = \sqrt{(R - a)^2 - a^2} = \sqrt{R^2 - 2Ra}$，排気弁の中心は $(\pm b, -y_e)$，$y_e = \sqrt{R^2 - 2Rb}$．$a, b \le (\sqrt2 - 1)R$ なら $y_i \ge a$，$y_e \ge b$（$R^2 - 2Ra \ge a^2 \iff a \le (\sqrt2 - 1)R$）なので，吸気弁と排気弁の中心の距離は $y_i + y_e \ge a + b$ 以上で，4 つの傘は重ならない．$a = b = (\sqrt2 - 1)R$ は，同じ径の 4 つの円がボアにちょうど収まる場合である．$B = 86\ \text{mm}$ で上限は $35.6\ \text{mm}$．
   * **既定**：吸気 $31\ \text{mm}$（$0.36B$），排気 $26\ \text{mm}$（$0.30B$）．[Energies 13(6) 1330 (2020)](https://www.mdpi.com/1996-1073/13/6/1330) が引く Ghazal らの機関のポートの径と同じ値である．ペントルーフ形の 4 弁の目安として吸気 $0.35$〜$0.37B$，排気 $0.28$〜$0.32B$ という値を記憶しているが，文献では確かめていない（`docs/review_v26.md` の 11.2 節）．最大の幾何面積 $n_v \frac{\pi}{4} d^2$ は吸気 $1510\ \text{mm}^2$，排気 $1062\ \text{mm}^2$ で，リフトが $d/4$（吸気 $7.75\ \text{mm}$）を超えると弁座の面積で決まる．
   * **検査のための 1 弁の計算**：第25版（弁が 1 個ずつ）との比較（TEST-29 項目 8）のために，コアは内部の値 `nv`（設定項目ではない．既定 2）を持つ．`nv = 1` のときは $n_v = 1$，上限を第25版と同じ $0.45B$ とする．利用者はこの値を変えられない．
3. **基本の開閉時期と VVT**：吸気 IVO，IVC，排気 EVO，EVC と，位相 $\varphi_{\text{in}}$，$\varphi_{\text{ex}}$（正が遅角）から，$\theta_o = \text{IVO} + \varphi_{\text{in}}$，$\theta_c = \text{IVC} + \varphi_{\text{in}}$（排気も同様）．位相は作用角とリフト曲線の形を変えない：$L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$．
4. **弁とピストンの干渉**：平らなヘッド面とピストン頂面を仮定し，全クランク角（$0.5^\circ$ 刻み）で $L_v(\theta) < h_c + x(\theta)$ を検査する．破る角度があれば `VALVE HIT` を運転タブに表示する（衝突はモデル化せず，計算は続ける）．

* **既定値と範囲**（すべて運転中に変更できる）：IVO $-10^\circ$（$[-40, 40]$），IVC $264^\circ$（$[190, 290]$），EVO $490^\circ$（$[430, 530]$），EVC $730^\circ$（$[690, 760]$），$\varphi_{\text{in}} = \varphi_{\text{ex}} = 0$（$\pm 40^\circ$），$L_{\max} = 9\ \text{mm}$（$[3, 14]$），$d_v = 31\ \text{mm}$（$[20, 50]$），$d_{ve} = 26\ \text{mm}$（$[20, 50]$），カムは Standard．バルブタイミングの画面の `[−]` `[＋]` では，IVO，IVC，EVO，EVC を範囲の外へ変えられる（SPEC-15 I の 2）．
* **数値上の注意**：$A_{\text{eff}}$ は開閉点で折れる（Aggressive では傾きが無限大になる）．開閉点は積分のステップの境界にそろえる（SPEC-13）．
* **出典**：Heywood (1988) Ch. 6．

---

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

### SPEC-05：スロットルと吸気マニホールド（REQ-05）

#### 定義と式
1. **環境**：大気圧 $p_{\text{atm}}$（既定 $101.3\ \text{kPa}$，$60$〜$110\ \text{kPa}$），大気温 $T_{\text{amb}} = 298.15\ \text{K}$．エアクリーナと吸気ダクトの圧力損失は無視する．$p_{\text{atm}}$ は，スロットルの上流圧，排気管の出口の外の圧力（SPEC-27），クランクケースの背圧（SPEC-10），体積効率の基準密度（SPEC-14），初期値（§2.2）に共通に使う．層流燃焼速度の基準圧（SPEC-07）は物性式の定数で，$p_{\text{atm}}$ とは無関係である．
2. **吸気は予混合気とする**（熱物性が「化学平衡」のときは，噴射方式に応じて SPEC-30 の 2，3 に代わる）：スロットルを通るガスは，当量比 $\phi$ の空気と燃料蒸気の混合気（SPEC-02 の未燃ガス）とみなす．したがって $\dot m_{\text{th}}$ は混合気の流量で，その $\frac{1}{1 + \phi/\text{AF}_{st}}$ が空気である（SPEC-07）．
3. **スロットルの有効開口面積**（理想スロットル．全閉で流量 $0$）：開度 $\alpha \in [0, \pi/2]$ に対し
   $$A_{\text{th}}(\alpha) = C_{d,\text{th}}\,\frac{\pi}{4}D_{\text{th}}^2\,(1 - \cos\alpha), \qquad C_{d,\text{th}} = 0.8$$
   円板の流れ方向への投影面積が $\cos\alpha$ 倍になることによる近似（板厚と軸は無視）．$D_{\text{th}}$：スロットル径（既定 $40\ \text{mm}$，$20$〜$80$）．$\alpha = 90^\circ$ は板が流れと平行な全開である．
4. **スロットルの流量**：SPEC-04 の式で $p_1 = p_{\text{atm}}$，$p_2 = p_{\text{in}}$，$A = A_{\text{th}}(\alpha)$．
5. **マニホールド圧**：容積 $V_{\text{in}}$（既定 $1.5\ \text{L}$，$0.3$〜$5$）のガスを一様・等温（$T_{\text{in}} = 298.15\ \text{K}$）とする．質量 $m_{\text{in}} = \frac{p_{\text{in}}V_{\text{in}}}{RT_{\text{in}}}$ の保存 $\frac{dm_{\text{in}}}{dt} = \dot m_{\text{th}} - \dot m_{\text{dn}}$ から
   $$\frac{dp_{\text{in}}}{dt} = \frac{RT_{\text{in}}}{V_{\text{in}}}\left(\dot m_{\text{th}} - \dot m_{\text{dn}}\right)$$
   $\dot m_{\text{dn}}$ は下流へ出る流量で，ランナ ON では $\dot m_r$（SPEC-25），OFF では吸気弁の流量 $\dot m_{\text{in}}$．
6. **既燃ガスの追跡**：マニホールドの既燃ガス分率を $Y_{b,\text{in}} = \text{clamp}\left(\frac{m_{b,\text{in}}}{m_{\text{in}}}, 0, 1\right)$ とする．流れが運ぶ既燃分は上流側の組成で決める．スロットルから入るガスは既燃分 $0$．ランナ OFF では
   $$\frac{dm_{b,\text{in}}}{dt} = -\dot m_{\text{in}}\,Y_{\text{src}} + \min(0, \dot m_{\text{th}})\,Y_{b,\text{in}}, \qquad Y_{\text{src}} = \begin{cases} Y_{b,\text{in}} & (\dot m_{\text{in}} \ge 0) \\ 1 - Y_u & (\dot m_{\text{in}} < 0) \end{cases}$$
   第 2 項はスロットルの逆流で出ていく分．ランナ ON の式は SPEC-25．
7. **余剰エンタルピーの追跡**：吸気側の容積の温度は圧力の式では $T_{\text{in}}$ 一定とするが，筒内から吹き返した高温ガスが持ち込む熱は，既燃ガスと同じく「流れに乗って運ばれる量」として追跡する．
   * 吸気弁の逆流（$\dot m_{\text{in}} < 0$）が吸気側へ持ち込む**余剰エンタルピー**の流束を，筒内ガスの顕熱エンタルピーと，同じ組成のガスが $T_{\text{in}}$ で持つ顕熱エンタルピーの差とする：
     $$\dot X_o = \dot m_{\text{in}}^-\left[h(T, Y_u) - h(T_{\text{in}}, Y_u)\right]$$
   * 容積 $k$（マニホールド，ポート）にたまった余剰エンタルピーを $E_k$ $[\text{J}]$，単位質量あたりを $\varepsilon_k = E_k/m_k$ とする．順流はこれを上流側の $\varepsilon$ で運ぶ．ランナ OFF では
     $$\frac{dE_{\text{in}}}{dt} = \dot X_o - \dot m_{\text{in}}^+\,\varepsilon_{\text{in}} + \min(0, \dot m_{\text{th}})\,\varepsilon_{\text{in}}$$
     ランナ ON の式は SPEC-25．
   * **吸気弁の順流の状態**：吸気弁のすぐ上流の容積（ランナ ON ではポート，OFF ではマニホールド）の既燃分率を $Y_{b,\text{src}}$，余剰を $\varepsilon_{\text{src}}$ とすると，筒内へ入るガスの未燃分率は $Y_j = 1 - Y_{b,\text{src}}$，顕熱エンタルピーは
     $$h_j = h(T_{\text{in}}, Y_j) + \varepsilon_{\text{src}}$$
     オリフィスの式（SPEC-04）の上流温度は $T_{\text{up}} = T_{\text{in}} + \frac{\varepsilon_{\text{src}}}{c_p(T_{\text{in}}, Y_j)}$，比熱比は $\gamma(T_{\text{up}}, Y_j)$ とする．スロットルの逆流の上流温度も同様に $T_{\text{in}} + \varepsilon_{\text{in}}/c_p(T_{\text{in}}, 1 - Y_{b,\text{in}})$ で，比熱比はその温度と組成での値とする．
   * 壁との熱のやりとりは無い（断熱）とする．周期定常では，吹き返した余剰エンタルピーは，混ざる容積の大きさによらず全量が筒内へ戻る．

#### 仮定と限界
* 吸気側の容積は圧力の式では等温で，温度上昇による密度の低下（$m_k$ の減少）は扱わない．余剰エンタルピーは吸気弁の流れの上流温度と筒内へのエンタルピーにだけ効く．
* 断熱なので，吹き返しによる吸気の加熱は**上限**の見積もりである．実機ではポート壁への放熱で一部が失われ，逆に高温の壁が吸気を温める効果もあるが，どちらも扱わない．
* 既定の IVC（$264^\circ$）は遅く，低回転では吸った新気の押し戻しが多い．アイドルでは吸気弁の逆流が順流の約 $1/4$ ある（実測 $0.24$）．

* **出典**：[L. Guzzella and C. H. Onder, *Introduction to Modeling and Control of Internal Combustion Engine Systems*, 2nd ed., Springer (2010), Ch. 2](https://doi.org/10.1007/978-3-642-10775-7)；[E. Hendricks and S. C. Sorenson, SAE Technical Paper 900616 (1990)](https://doi.org/10.4271/900616)

---

### SPEC-06：筒内の組成（未燃ガスと既燃ガス）（REQ-06）

#### 定義と式
$$\frac{dm}{dt} = \dot m_{\text{in}} - \dot m_{\text{ex}}, \qquad \frac{dm_u}{dt} = \dot m_{u,\text{in}} - \dot m_{u,\text{ex}} - r$$
* 吸気弁：順流は上流の容積の組成（既燃分率 $Y_{b,\text{src}}$，SPEC-05），逆流は筒内の組成で出る．
  $$\dot m_{u,\text{in}} = \begin{cases} (1 - Y_{b,\text{src}})\,\dot m_{\text{in}} & (\dot m_{\text{in}} \ge 0) \\ Y_u\,\dot m_{\text{in}} & (\dot m_{\text{in}} < 0) \end{cases}$$
* 排気弁：流出は筒内の組成，逆流は既燃ガスだけとする（排気側へ吹き抜けた新気は既燃ガスとして扱う）．
  $$\dot m_{u,\text{ex}} = \begin{cases} Y_u\,\dot m_{\text{ex}} & (\dot m_{\text{ex}} \ge 0) \\ 0 & (\dot m_{\text{ex}} < 0) \end{cases}$$
* 燃焼：吸気弁が閉じた時点（IVC）の未燃ガスの質量を $m_{u,\text{trapped}}$ とし，Wiebe 関数の燃焼割合 $x_b$（SPEC-07）に従って既燃ガスに変わる．
  $$r = m_{u,\text{trapped}}\,\frac{dx_b}{d\theta}\,\omega$$

* **出典**：[C. R. Ferguson and A. T. Kirkpatrick, *Internal Combustion Engines: Applied Thermosciences*, 3rd ed., Wiley (2015)](https://www.wiley.com/en-us/Internal+Combustion+Engines%3A+Applied+Thermosciences%2C+3rd+Edition-p-9781118533314)

---

### SPEC-07：燃焼（乱流火炎伝播に連動する単一 Wiebe モデル）（REQ-07）

#### 定義と式
1. **層流燃焼速度**（Metghalchi と Keck の相関．定数は Turns の教科書の gasoline の組）：基準 $T_{\text{ref}} = 298\ \text{K}$，$p_{\text{ref}} = 101.325\ \text{kPa}$ で
   $$S_{L,0}(\phi) = \max\left(0.05,\ B_m + B_2(\phi - \phi_m)^2\right), \qquad B_m = 0.2758\ \text{m/s},\ B_2 = -0.7834\ \text{m/s},\ \phi_m = 1.13$$
   点火時の筒内の状態 $(T_s, p_s)$ と残留ガス率 $x_r$（質量分率）に対し
   $$S_L = S_{L,0}(\phi)\left(\frac{T_s}{T_{\text{ref}}}\right)^{2.18 - 0.8(\phi - 1)}\left(\frac{p_s}{p_{\text{ref}}}\right)^{-0.16 + 0.22(\phi - 1)}\max\left(0.15,\ 1 - 2.1\,x_r\right)$$
   $T_s$ には筒内の平均温度を使う（単一ゾーン）．
2. **着火遅れと燃焼期間**：平均ピストン速度 $c_m = \frac{S\omega}{\pi}$，乱れの強さ $u' = 0.5\,c_m$，乱流燃焼速度 $S_T = S_L + C_{\text{turb}}\,u'$（$C_{\text{turb}} = 6$）とする．点火進角を $s$ [°BTDC] とし，上死点後の点火（$s < 0$）では膨張による乱れの減衰と温度低下を係数 $f_{\text{ret}} = 1 + 0.025\max(0, -s)$ で表す．
   $$\Delta\theta_d = c_d\,\frac{\ell_k\,\omega}{S_L + C_k u'}, \qquad \Delta\theta_b = \frac{f_{\text{ret}}}{c_b}\,\frac{\ell_c\,\omega}{S_T}$$
   $\ell_k = 0.025B$（火炎核の形成距離），$C_k = 0.4$，$\ell_c = 0.65B$（燃焼室の代表距離）．$c_d$（着火遅れ係数）と $c_b$（燃焼速度係数）は設定「燃焼速度」の調整係数（$0.1$〜$10$，既定 $1$）．
3. **Wiebe 関数**：燃焼の開始角 $\theta_0 = 2\pi - s + \Delta\theta_d$，$\zeta = \frac{\theta - \theta_0}{\Delta\theta_b}$，$a = 5$，形状係数 $m_w$（設定，$0$〜$6$，既定 $2$．点火時の値をそのサイクルに固定）に対し
   $$x_b = 1 - \exp\left(-a\,\zeta^{m_w + 1}\right), \qquad \frac{dx_b}{d\theta} = \frac{a\,(m_w + 1)}{\Delta\theta_b}\,\zeta^{m_w}\exp\left(-a\,\zeta^{m_w + 1}\right) \qquad (0 < \zeta \le 1)$$
   $\zeta \le 0$ と $\zeta > 1$ では $\frac{dx_b}{d\theta} = 0$．燃焼割合は $1 - e^{-a} = 99.3\%$ で打ち切る．
4. **発熱量**：$m_{u,\text{trapped}}$ のうち空気は $m_{\text{air}} = \frac{m_{u,\text{trapped}}}{1 + \phi/\text{AF}_{st}}$，燃料は $m_f = \frac{\phi}{\text{AF}_{st}}m_{\text{air}}$（$\text{AF}_{st} = 14.7$）．低位発熱量 $H_u = 44.0\ \text{MJ/kg}$，燃焼効率 $\eta_c = 0.97$ として
   $$Q_{\text{in}} = m_f\,H_u\,\eta_c\,\epsilon(\phi), \qquad \dot Q_{\text{comb}} = Q_{\text{in}}\,\frac{dx_b}{d\theta}\,\omega$$
   $\eta_c$ と Wiebe の打ち切りが重なるので，供給した燃料の発熱量のうち実際に発熱するのは，$\phi \le 1$ で $0.97 \times 0.993 = 96.3\%$ である．
5. **リッチ側の不完全燃焼** $\epsilon(\phi)$：燃料を $\text{CH}_y$（$y = 1.87$）とし，酸素が足りないときの生成物 $a'\,\text{CO}_2 + b'\,\text{CO} + c'\,\text{H}_2\text{O} + d'\,\text{H}_2$ を，元素の保存と水性ガスシフト平衡で決める．
   $$a' + b' = 1, \quad 2c' + 2d' = y, \quad 2a' + b' + c' = \frac{2(1 + y/4)}{\phi}, \quad \frac{b'c'}{a'd'} = K_w = 3.5$$
   はじめの 3 式から $b' + d' = S_r \equiv \left(2 + \frac{y}{2}\right)\left(1 - \frac{1}{\phi}\right)$．これと第 4 式から $b'$ の 2 次方程式 $(K_w - 1)b'^2 - \left[\frac{y}{2} - S_r + K_w(1 + S_r)\right]b' + K_w S_r = 0$ を得て，$[0, \min(1, S_r)]$ の根を取る．燃え残る CO と H₂ が持ち去る発熱量を差し引く：
   $$\epsilon(\phi) = 1 - \frac{b'\,\Delta h_{\text{CO}} + d'\,\Delta h_{\text{H}_2}}{M_f\,H_u} \quad (\phi > 1), \qquad \epsilon = 1 \quad (\phi \le 1)$$
   $\Delta h_{\text{CO}} = 283.0\ \text{kJ/mol}$，$\Delta h_{\text{H}_2} = 241.8\ \text{kJ/mol}$，$M_f = 13.896\ \text{g/mol}$．空気量あたりの発熱 $\phi\,\epsilon(\phi)$ は $\phi = 1$ で最大．
6. **サイクル変動**（設定「燃焼」の `[サイクル変動 OFF／ON]`，既定 OFF）：点火のたびに，平均 $0$・分散 $1$ の一様乱数 $z_1, z_2 \in [-\sqrt 3, \sqrt 3]$ を引き，
   $$\theta_0 \leftarrow \theta_0 + \sigma_\theta z_1, \qquad \Delta\theta_b \leftarrow \Delta\theta_b\max(0.5,\ 1 + \sigma_b z_2), \qquad \sigma_\theta = 3^\circ,\ \sigma_b = 0.12$$
   乱数は `EngineCore` ごとに種を固定した擬似乱数（mulberry32）で，状態の複製で乱数の状態も複製される（結果は決定的）．

#### 仮定と限界
* 着火遅れの定数 $\ell_k$，$C_k$ は，全開の MBT 点火時期が回転とともに $20^\circ$ 台で進角するよう校正した値である（文献値ではない）．
* 希釈の項 $1 - 2.1\,x_r$ の $x_r$ は，原式の希釈ガスの質量分率に対応させている．
* 生成物のモル数の増加（実機で出力最大が $\phi \approx 1.1$ になる要因）は扱わないので，出力最大は $\phi = 1$ にある．
* $S_L$ の圧力指数が負なので，部分負荷で MBT が全開より大きく進む実機の傾向は十分には出ない．

* **出典**：[M. Metghalchi and J. C. Keck, *Combustion and Flame* 48, 191–210 (1982)](https://doi.org/10.1016/0010-2180(82)90127-4)；定数の組と希釈の項は S. R. Turns, *An Introduction to Combustion* の式 8.33（[BYU の講義ノートで確認](https://ignite.byu.edu/cbe522/lectures/SL_correlation)）；I. I. Wiebe, *Brennverlauf und Kreisprozess von Verbrennungsmotoren* (1970)；リッチ側は Heywood (1988) Sec. 4.9．

---

### SPEC-08：壁面熱伝達と壁温（REQ-08）

#### A. 壁面熱伝達と壁温
IVC の時点の筒内の状態を $(p_r, V_r, T_r)$ とし，燃焼が無いとしたときの圧力を**ポリトロープ指数 $1.33$** の圧縮膨張 $p_{\text{mot}}(\theta) = p_r\left(\frac{V_r}{V(\theta)}\right)^{1.33}$ で見積もる．代表ガス速度は
$$w = C_1 c_m + C_2\,\frac{V_d T_r}{p_r V_r}\max\left(0,\ p - p_{\text{mot}}\right)$$
* 圧縮・燃焼・膨張（IVC〜EVO）：$C_1 = 2.28$，$C_2 = 3.24 \times 10^{-3}\ \text{m/(s·K)}$
* ガス交換（EVO〜IVC）：$C_1 = 6.18$，$C_2 = 0$

熱伝達率（圧力を kPa で入れる形）と熱流量は，係数 $C_w$（設定「燃焼」の Woschni 係数，$0$〜$2$，既定 $1$）を掛けて
$$h_c = C_w \cdot 3.26\,B^{-0.2}\left(\frac{p}{1000}\right)^{0.8}T^{-0.55}\max(w, 0.5)^{0.8}, \qquad \dot Q_{\text{wall}} = h_c\,A_w(\theta)\,(T - T_w)$$
壁は 1 つの熱容量 $C_{w,\text{th}} = 1500\ \text{J/K}$ とし，熱物性が $\gamma(T)$，$\gamma$ 一定のときは，冷却水（$T_{\text{cool}} = 360\ \text{K}$ 一定）へ熱コンダクタンス $G_{\text{cool}} = 15\ \text{W/K}$ で放熱する．
$$C_{w,\text{th}}\frac{dT_w}{dt} = \dot Q_{\text{wall}} - G_{\text{cool}}\,(T_w - T_{\text{cool}})$$

#### B. 壁温の設定（熱物性が「化学平衡」のとき）
1. 壁温 $T_w$ は設定の一定値とする：$\frac{dT_w}{dt} = 0$．設定はページ「冷却」の「壁温 $T_w$」（$300$〜$3500\ \text{K}$，刻み $10$，既定 $360$．即時．上限は既燃ガスの物性の表の上限で，計算の上で扱える範囲として広く取ってある．実機の壁温の範囲ではない）．コールドリセットで $T_w$ に設定値を入れ，運転中に設定を変えると，次の積分のステップの始めに $T_w$ を新しい値にする（壁温を固定する内部の指定（性能曲線の計測，最適化，一部のテスト）があるときは，その値のままにする）．
   * 既定の $360\ \text{K}$ は，第26版までの冷却水温（一定）と，性能曲線の計測の壁温と同じ値である．
2. 壁が受ける熱は，筒内ガスからの $\dot Q_{\text{wall}}$ と，排気ポートのガスからの $\dot Q_{pw}$（SPEC-27 の 10．ポートの壁の温度も $T_w$）．壁温が一定なので，受けた熱の行き先（冷却水）は扱わない．壁温がガスより高い間は，壁からガスへ熱が入る（$\dot Q_{\text{wall}} < 0$）．
3. **性能曲線の計測と最適化**：計測の機関の壁温（SPEC-26 A の 3）は，化学平衡のモデルでは設定の壁温とする（既定で $360\ \text{K}$）．
4. **ほかの熱物性**：$\gamma(T)$，$\gamma$ 一定では，A の式（壁温は状態，冷却水温 $360\ \text{K}$ 一定，$\dot Q_{pw} = 0$）のままで，設定の壁温は使わない（設定画面では「（不使用）」と書き，`[−]` `[+]` を無効にする）．

#### 仮定と限界
* $\gamma$ のモデルでは，コールドリセット後（壁温 $298.15\ \text{K}$）は，燃焼が無くても壁が冷却水で温められる（時定数 $C_{w,\text{th}}/G_{\text{cool}} = 100\ \text{s}$）．この文書の「冷間」は壁温の初期値だけを指す．化学平衡のモデルでは壁温が設定値のままなので，冷間は壁温の設定を下げて表す．
* 吸気ポートの壁への熱伝達は扱わない．排気ポートの壁への熱伝達は化学平衡のモデルだけで扱う（SPEC-27 の 10）．
* 壁温は 1 つで，ヘッド，ライナ，ピストンを分けない．実機の燃焼室の壁は部位によって約 $400$〜$550\ \text{K}$（暖機後．推定）で，吸気行程にガスが壁から受ける熱は壁温の設定に強くよる．冷却水と油の温度，摩擦の熱の行き先は扱わない（要件定義書 7.2 の 19）．

* 温度の指数：$\text{Nu} = 0.035\,\text{Re}^{m}$（$m = 0.8$），熱伝導率 $k \propto T^{0.75}$，粘性係数 $\mu \propto T^{0.62}$，密度 $\rho = \frac{p}{RT}$ とすると $h_c = \frac{k}{B}\,\text{Nu} \propto B^{m-1}p^{m}w^{m}T^{0.75 - 1.62m}$ で，$m = 0.8$ のとき温度の指数は $-0.546$ になる．この仕様は，これを丸めた $-0.55$ と係数 $3.26$ の形（Heywood の教科書の形）を使う．Woschni の原論文の式として $-0.53$ を引く文献もある（係数を同じ $3.26$ とすると，差は $T = 1000\ \text{K}$ で $h_c$ の $15\%$．設定の Woschni 係数 $C_w$ で調整できる範囲）．

* **出典**：[G. Woschni, SAE Technical Paper 670931 (1967)](https://doi.org/10.4271/670931)；係数 $3.26$ と指数 $-0.55$ の形は Heywood (1988) Ch. 12（機関の熱伝達）

---

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

### SPEC-10：回転運動，摩擦，スターター（REQ-10）

#### 定義と式
$$\frac{d\theta}{dt} = \omega, \qquad I_{\text{tot}}\frac{d\omega}{dt} = T_{\text{ind}} + T_{\text{st}} - T_f - T_{\text{aux}} - T_{\text{dyno}}$$
1. **慣性**：$I_{\text{tot}} = I + I_{\text{dyno}}$，$I = 0.12\ \text{kg·m}^2$（クランク軸とフライホイール），$I_{\text{dyno}}$ は動力計（SPEC-11，既定 $0.05\ \text{kg·m}^2$）．
2. **図示トルク**：クランクケースの圧力を $p_{\text{atm}}$ とし，仮想仕事 $T_{\text{ind}}\,d\theta = (p - p_{\text{atm}})\,dV$ から
   $$T_{\text{ind}}(\theta) = (p - p_{\text{atm}})\frac{dV}{d\theta}$$
3. **摩擦**（Chen–Flynn 型の摩擦平均有効圧）：直前に完了したサイクルの筒内最高圧を $p_{\max}$（初期値 $p_{\text{atm}}$．サイクルの終端で更新），平均ピストン速度を $c_m = \frac{S\omega}{\pi}$ として
   $$\text{FMEP} = F_0 + F_1\,p_{\max} + F_2\,c_m, \qquad T_f = \frac{\text{FMEP}\cdot V_d}{4\pi} \quad (\omega > 0)$$
   $F_0 = 13.7\ \text{kPa}$，$F_1 = 0.005$，$F_2 = 16.2\ \text{kPa·s/m}$．
4. **補機の負荷**：オルタネータ，ウォーターポンプ，オイルポンプなどが吸収するトルクを，回転数によらない一定値 $T_{\text{aux}}$（設定「運転」の補機負荷トルク，$0$〜$20\ \text{N·m}$，既定 $2.0$）で与える（$\omega > 0$ のとき）．平均有効圧に直すと $\text{AMEP} = \frac{4\pi T_{\text{aux}}}{V_d}$（既定で約 $50\ \text{kPa}$）．
5. **スターター**：ワンウェイクラッチを介して駆動する直流モータとし，スターターが ON かつ完爆前のとき
   $$T_{\text{st}} = T_{\text{stall}}\max\left(0,\ 1 - \frac{\omega}{\omega_{nl}}\right), \qquad T_{\text{stall}} = 60\ \text{N·m},\ \omega_{nl} = 209\ \text{rad/s}$$
   それ以外は $T_{\text{st}} = 0$．
6. **完爆とエンスト**：燃料が ON で，平均回転数 $\bar N$（SPEC-12）が $N_{\text{fire}} = 550\ \text{rpm}$ を超え，直前に完了したサイクルの圧縮膨張の図示仕事 $W_g$ が $20\ \text{J}$ を超えているとき，完爆と判定してスターターを切る．完爆後に $\bar N < 150\ \text{rpm}$ になると，エンストとして完爆の状態と燃料を OFF にする．
7. **逆転の防止**：$\omega \le 0$ かつ右辺が負のとき，$\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$ とする．
8. **回転数の固定**：`EngineCore` は $\frac{d\omega}{dt} = 0$ とするモードを持つ（性能曲線の計測と一部のテストで使う．画面の設定には出さない）．

#### 仮定と限界
* ピストンと連桿の往復質量による慣性トルクは扱わない．サイクル平均には影響しないが，サイクル内の回転変動は実機と異なる．
* 補機の負荷は実機では回転数とともに増える．
* スターターの無負荷回転数は実機より高く，燃料 OFF のクランキングは約 $1700\ \text{rpm}$ に達する．始動直後の吹け上がり（約 $1400\ \text{rpm}$．実測 $1428\ \text{rpm}$）とアイドルへの整定の遅さ（$\pm 25\ \text{rpm}$ に収まるまで約 $12\ \text{s}$．実測 $12.5\ \text{s}$）の一因である．

* **出典**：[U. Kiencke and L. Nielsen, *Automotive Control Systems*, 2nd ed., Springer (2005), Ch. 6](https://doi.org/10.1007/b137654)；[S. K. Chen and P. F. Flynn, SAE Technical Paper 650733 (1965)](https://doi.org/10.4271/650733)

---

### SPEC-11：電動式動力計と運転モード（REQ-11）

#### 定義と式
1. **容量**：電動式動力計（交流の動力計を想定）は，吸収（$T_{\text{dyno}} > 0$．機関から仕事を取る）も駆動（$T_{\text{dyno}} < 0$．モータリング）もでき，どちらの向きも
   $$\lvert T_{\text{dyno}}\rvert \le T_{\max}(\omega) = \min\left(T_{\text{rated}},\ \frac{P_{\text{rated}}}{\lvert\omega\rvert}\right)$$
   に収まる（低回転では定格トルク，高回転では定格出力で頭打ち）．既定 $T_{\text{rated}} = 100\ \text{N·m}$，$P_{\text{rated}} = 500\ \text{kW}$（設定で変更可．既定の機関を $40000\ \text{rpm}$ でモータリングするのに要るトルクと出力（実測 $75.5\ \text{N·m}$，$316\ \text{kW}$．ほとんどが摩擦）を上回る値とした）．出力の頭打ちが始まる回転数は $\frac{30}{\pi}\frac{P_{\text{rated}}}{T_{\text{rated}}} = 47746\ \text{rpm}$．
2. **トルクの応答**：トルクの指令 $T_c$ に一次遅れで従う：$\tau_d\frac{dT_{\text{dyno}}}{dt} = T_c - T_{\text{dyno}}$（$\tau_d$ 既定 $10\ \text{ms}$．電流制御の応答を表す）．$T_{\text{dyno}}$ は状態ベクトルに入れず，積分のステップの終わりに $T_{\text{dyno}} \leftarrow T_c + (T_{\text{dyno}} - T_c)\,e^{-\Delta t/\tau_d}$ で更新する（ステップの間は一定）．
3. **動力計制御の PI**：比例の項は瞬時の回転数 $N = \frac{30}{\pi}\omega$ の偏差 $e_N' = N - N_{\text{target}}$，積分の項は平均回転数の偏差 $e_d = \bar N - N_{\text{target}}$（回転が目標を超えると正）で作る．
   $$T_c = \text{clamp}\left(K_{p,d}\,e_N' + I_T,\ -T_{\max},\ T_{\max}\right), \qquad \frac{dI_T}{dt} = \begin{cases} 0 & (\text{上下限に張り付き，} e_d \text{ がそれを深める向き}) \\ K_{i,d}\,e_d & (\text{それ以外}) \end{cases}$$
   既定 $K_{p,d} = 0.2\ \text{N·m/rpm}$，$K_{i,d} = 0.6\ \text{N·m/(rpm·s)}$．始動の時点で $I_T = 0$．
   * **比例を瞬時の回転数で作る理由**：$\bar N$ は時定数 $\tau_N$（既定 $0.15\ \text{s}$）の平均で，実際の回転数より遅れる．比例も $\bar N$ で作ると，始動の行き過ぎの後に動力計が吸収を続け，$\bar N$ が下がる前に実際の回転が $0$ まで落ちた（実測：既定（$800\ \text{rpm}$，開度 $15^\circ$）の始動の $1.5\ \text{s}$ 後に圧縮の途中で瞬時の回転数が $0$ になり，$\omega \ge 0$ の射影（SPEC-13）が 5 回働いた．全開・$800\ \text{rpm}$ では $\bar N$ が $169$〜$1304\ \text{rpm}$ で振れ続けた）．瞬時の回転数で作ると，どちらも射影が $0$ 回で，$\bar N$ は $775$〜$814$，$771$〜$817\ \text{rpm}$ に収まる（サイクルの中のトルクの脈動による幅）．電動式動力計は回転の検出が速いので，この形は実機にも合う．比例の項はサイクルの中の回転の脈動にも働き，慣性を大きくしたのと同じ向きに脈動を抑える．
   * **ゲインの決め方**：トルクの指令が直接トルクになる（$\tau_d$ は小さい）ので，偏差から動力計のトルクまでのゲインは定格トルクと回転数によらない．$\tau_d$ と $\bar N$ の遅れ $\tau_N$ を無視すると，目標の近くの閉ループは $I_{\text{tot}}\ddot e + K_p'\dot e + K_i' e = 0$（$K_p' = \frac{30}{\pi}K_{p,d}$，$K_i' = \frac{30}{\pi}K_{i,d}$．$\omega$ で書いたゲイン）で，固有角振動数 $\omega_n = \sqrt{K_i'/I_{\text{tot}}}$，減衰比 $\zeta = \frac{K_p'}{2\sqrt{I_{\text{tot}}K_i'}}$ である．既定（$I_{\text{tot}} = I + I_{\text{dyno}} = 0.17\ \text{kg·m}^2$）で $\omega_n = 5.8\ \text{rad/s}$，$\zeta = 0.97$．$\tau_N$ を入れた 3 次の系 $I_{\text{tot}}\tau_N s^3 + I_{\text{tot}}s^2 + K_p's + K_i' = 0$ の Routh の条件 $K_p' > \tau_N K_i'$（$1.91 > 0.86$）を満たす．
   * ゲインが小さすぎると，既定の始動で完爆後に $\bar N$ が行き過ぎ，その間にたまった積分で回転を引き下げてエンストする（$0.035\ \text{N·m/rpm}$，$0.07\ \text{N·m/(rpm·s)}$ での実測．要件定義書 7.4 節の 26）．上の既定のゲインでは始動からエンストせず，燃料を止めても $\pm 25\ \text{rpm}$ に保てる．
4. **スロットル制御**：$T_c = \min(T_{\text{load}},\ T_{\max})$（$T_{\text{load}}$：設定「負荷トルク」，$0$〜$200\ \text{N·m}$，既定 $0$．吸収だけ）．
5. **モードの切替**（完爆後）：指令が連続になるよう初期化する．A → B：$\alpha_{\text{manual}} \leftarrow \alpha$，$I_T = T_c - K_{p,d}\,e_N'$．B → A：$T_{\text{load}} \leftarrow \max(0, T_c)$，$I_\alpha = \alpha - \alpha_{\text{ff}} - K_p\,e_N$（SPEC-12）．
6. **容量の判定**：$T_c = T_{\max}$ のまま $\bar N > N_{\text{target}} + 100\ \text{rpm}$ が $2\ \text{s}$ 続くと `OVERLOAD`（吸収の容量不足），$T_c = -T_{\max}$ のまま $\bar N < N_{\text{target}} - 100\ \text{rpm}$ が $2\ \text{s}$ 続くと `UNDERPOWER`（駆動の容量不足．機関の出力不足を動力計でも補えない）を表示する．
7. **向きの表示**：画面では $T_{\text{dyno}} \ge 0$ を「吸収」，$< 0$ を「駆動」と書き，値は絶対値（N·m，小数 1 桁）とする．出力は $\lvert T_{\text{dyno}}\,\omega\rvert$（kW）．
8. **軸トルクとのつり合い**：瞬時の軸トルクを $T_b^{\text{inst}} = T_{\text{ind}} - T_f - T_{\text{aux}}$ とすると，完爆後の運動方程式は $I_{\text{tot}}\frac{d\omega}{dt} = T_b^{\text{inst}} - T_{\text{dyno}}$．定常ではサイクル平均で $\overline{T_b} = \overline{T_{\text{dyno}}}$．燃料を止めて駆動しているときは $\overline{T_{\text{dyno}}} = \overline{T_b} < 0$ で，その大きさが摩擦・ポンピング・補機の損失の和になる．
9. **始動，燃料の停止，モータリング**：動力計制御（とシャシー．SPEC-35）では，`[START]` で燃料を入れ，同時に動力計の PI を働かせる（スターターは使わない．機関は「運転中」として扱い，完爆の判定とエンストの判定（SPEC-10 の 6）は行わない．回転数を固定する計算（性能曲線の計測など）ではエンストの判定を行う）．始動の時点で $T_{\text{dyno}} = T_c = \text{clamp}(K_{p,d}e_N', -T_{\max}, T_{\max})$ と置き，一次遅れを待たずに駆動を始める．`[FUEL CUT]` は燃料だけを止め，PI はそのまま働くので，動力計が駆動して回転数を保つ（モータリング）．このとき `[FUEL CUT]` のボタンは `[STOP]` になり，押すと動力計も止めて機関を停止の状態にする．`[START]` で燃料を戻すと燃焼が再開する．スロットル制御では，`[START]` でスターターが回し，完爆の前は $T_c = 0$．`[FUEL CUT]` で停止の状態になる（回転は惰性で下がる）．

#### 仮定と限界
* 軸のねじり剛性は無視する（剛体）．
* 動力計の慣性 $I_{\text{dyno}}$（既定 $0.05\ \text{kg·m}^2$）は仮の値である．電動式の回転子の慣性は機種によって大きく異なる．
* 電流制御・インバータの特性は一次遅れ $\tau_d$ だけで表す．

* **出典**：Heywood (1988) Ch. 2（軸トルク，BMEP）；動力計の種類と特性は A. J. Martyr and M. A. Plint, *Engine Testing*（版とページは未確認）．

---

### SPEC-12：ECU（スロットル開度の PI 制御と点火時期の自動最適化）（REQ-12）

#### 定義と式
1. **平均回転数**：$\frac{d\bar N}{dt} = \frac{N - \bar N}{\tau_N}$（$N = \frac{30}{\pi}\omega$，$\tau_N$ 既定 $0.15\ \text{s}$）．$\bar N$ と積分の状態 $I_\alpha$ は ECU の内部状態で，積分のステップ（刻み $\Delta t$）の終わりに，終端の $N$ を使って $\bar N \leftarrow N + (\bar N - N)\,e^{-\Delta t/\tau_N}$，$I_\alpha \leftarrow I_\alpha + K_i\,e_N\,\Delta t$ と更新する（SPEC-13 の 6）．
2. **補機負荷の feedforward と開度の下限**：
   $$\alpha_{\text{ff}} = \alpha_{\text{base}} + k_T\,T_{\text{aux}}, \qquad \alpha_{\min} = \min\left(\alpha_{\max},\ \max\left(0,\ \alpha_{\text{ff}} - \delta_\alpha\right)\right)$$
   $\alpha_{\text{base}}$：基準開度（既定 $3^\circ$），$k_T = 0.26\ ^\circ/(\text{N·m})$，$\delta_\alpha = 1^\circ$（$k_T$ と $\delta_\alpha$ は定数）．既定（$T_{\text{aux}} = 2\ \text{N·m}$）で $\alpha_{\text{ff}} = 3.52^\circ$，$\alpha_{\min} = 2.52^\circ$．ECU は $T_{\text{aux}}$ を正確に知っているとする（理想化）．
3. **PI 制御**（アンチワインドアップ付き）：偏差 $e_N = N_{\text{target}} - \bar N$ に対し
   $$\alpha = \text{clamp}\left(\alpha_{\text{ff}} + K_p\,e_N + I_\alpha,\ \alpha_{\min},\ \alpha_{\max}\right), \qquad \frac{dI_\alpha}{dt} = \begin{cases} 0 & (\text{上下限に張り付き，} e_N \text{ がそれを深める向き}) \\ K_i\,e_N & (\text{それ以外}) \end{cases}$$
   既定 $K_p = 0.008\ ^\circ/\text{rpm}$，$K_i = 0.004\ ^\circ/(\text{rpm·s})$，$\alpha_{\max} = 90^\circ$．スロットルは指令に即時に追従するとする．
4. **状態ごとの開度**：完爆前は $\alpha = \alpha_{\text{crank}}$（始動開度，既定 $6^\circ$）．完爆の時点で $I_\alpha = 0$ とし，スロットル制御では 3 の式，動力計制御では $\alpha = \alpha_{\text{manual}}$（$I_\alpha$ は更新しない）．
5. **下限の役割**：完爆直後は回転が約 $1400\ \text{rpm}$ まで吹け上がり，比例項が開度を大きく閉じる．理想スロットル（全閉で流量 $0$）では，開度が $0$ になると吸気管圧が枯渇して図示仕事が負になり，回転が落ちてからの回復が間に合わずに止まる（$T_{\text{aux}} \ge 5\ \text{N·m}$）．下限 $\alpha_{\min}$ はこれを防ぎ，feedforward は下限を負荷に連動させる．$k_T$ は，$800\ \text{rpm}$ の定常開度の実測（$T_{\text{aux}} = 0, 2, 6\ \text{N·m}$ で $3.59^\circ, 4.18^\circ, 5.16^\circ$．始動から $42$〜$45\ \text{s}$ の平均）の傾き $0.26$ による．
6. **点火時期の自動最適化**（設定「燃焼」の `[点火の自動最適化 OFF／ON]`，既定 ON）：サイクルごとに，燃焼割合 $50\%$ の時期
   $$\theta_{50} = \theta_0 + \Delta\theta_b\left(\frac{\ln 2}{a}\right)^{1/(m_w + 1)}$$
   （Wiebe 関数で $x_b = 0.5$ となる角度．SPEC-07）から $\text{CA50} = \theta_{50} - 360^\circ$ を求め，サイクルの終端で点火進角 $s$ [°BTDC] を
   $$s \leftarrow s + k_s\left(\text{CA50} - \text{CA50}^*\right), \qquad k_s = 0.6,\ \text{CA50}^* = 10^\circ$$
   と更新する（完爆後のみ）．OFF または完爆前は $s =$ 設定値（既定 $18^\circ$ BTDC）．点火時期には上下限を設けない．ノッキングは扱わない．

#### 仮定と限界
* 目標回転数を下げたときも開度は $\alpha_{\min}$ までしか閉じない．
* $T_{\text{aux}} \ge 10\ \text{N·m}$ ではアイドルへの整定が遅い（PI のゲインは軽負荷に合わせてある）．低い目標回転数（$600\ \text{rpm}$）では回転が数十 rpm の幅で振れ続ける．
* CA50 の目標 $10^\circ$ は，本モデルで点火時期を振ったときの図示仕事の最大付近にある（TEST-12 項目 7 で判定）．

* **出典**：Guzzella and Onder (2010) Ch. 4；MBT と CA50 の関係は Heywood (1988) Sec. 9.2．

---

### SPEC-25：吸気ランナの慣性（慣性過給）（REQ-25）

#### 定義と式
1. **寸法**：断面積 $A_r = \frac{\pi}{4}d_r^2$．ランナの弁側の半分の容積をポート容積 $V_p = \frac12 A_r L_r$ とし，ポートの圧力を $p_p$ とする（集中定数の近似．マニホールド側の半分は $V_{\text{in}}$ に含める）．
2. **運動量の式**：ランナのガスを密度 $\rho_r = \frac{p_{\text{in}}}{RT_{\text{in}}}$，速度 $u$ が一様な柱とみなす．Newton の第 2 法則 $\rho_r A_r L_r\frac{du}{dt} = A_r(p_{\text{in}} - p_p) - A_r\,\zeta\frac{\rho_r u|u|}{2}$ に $\dot m_r = \rho_r A_r u$ を代入して（$\rho_r$ の時間変化は無視）
   $$\frac{d\dot m_r}{dt} = \frac{A_r}{L_r}(p_{\text{in}} - p_p) - \frac{\zeta\,\dot m_r|\dot m_r|}{2\rho_r A_r L_r}, \qquad \zeta = f_r\frac{L_r}{d_r} + \zeta_e$$
   $f_r = 0.02$（管摩擦係数），$\zeta_e = 0.2$（入口損失係数）．
3. **ポートの圧力**：ポートのガスは断熱的に圧縮・膨張するとする（音響的な剛性）．$\frac{dp_p}{dt} = \gamma_0\frac{p_p}{\rho_p}\frac{d\rho_p}{dt}$ と $\frac{dm_p}{dt} = \dot m_r - \dot m_{\text{in}}$ から
   $$\frac{dp_p}{dt} = \frac{\gamma_0 RT_{\text{in}}}{V_p}\left(\dot m_r - \dot m_{\text{in}}\right), \qquad \gamma_0 = 1.4$$
   吸気弁の流量（SPEC-04）は上流圧を $p_p$ として求める．マニホールドの式（SPEC-05）の下流の流量は $\dot m_r$．
4. **既燃ガスと余剰エンタルピーの輸送**：ポートのガス質量を $m_p = \frac{p_p V_p}{RT_{\text{in}}}$，既燃分率を $Y_{b,p} = \text{clamp}\left(\frac{m_{b,p}}{m_p}, 0, 1\right)$，単位質量あたりの余剰を $\varepsilon_p = \frac{E_p}{m_p}$ とする．ランナの流れは上流側の値を運ぶ：
   $$Y_r = \begin{cases} Y_{b,\text{in}} & (\dot m_r \ge 0) \\ Y_{b,p} & (\dot m_r < 0) \end{cases}, \qquad \varepsilon_r = \begin{cases} \varepsilon_{\text{in}} & (\dot m_r \ge 0) \\ \varepsilon_p & (\dot m_r < 0) \end{cases}$$
   $$\frac{dm_{b,\text{in}}}{dt} = -\dot m_r Y_r + \min(0, \dot m_{\text{th}})\,Y_{b,\text{in}}, \qquad \frac{dm_{b,p}}{dt} = \dot m_r Y_r - \dot m_{\text{in}}Y_v, \qquad Y_v = \begin{cases} Y_{b,p} & (\dot m_{\text{in}} \ge 0) \\ 1 - Y_u & (\dot m_{\text{in}} < 0) \end{cases}$$
   $$\frac{dE_{\text{in}}}{dt} = -\dot m_r\varepsilon_r + \min(0, \dot m_{\text{th}})\,\varepsilon_{\text{in}}, \qquad \frac{dE_p}{dt} = \dot m_r\varepsilon_r - \dot m_{\text{in}}^+\varepsilon_p + \dot X_o$$
   $\dot X_o$ は吸気弁の逆流が持ち込む余剰（SPEC-05）．吸気弁の順流の上流は $Y_{b,\text{src}} = Y_{b,p}$，$\varepsilon_{\text{src}} = \varepsilon_p$．
5. **共鳴の目安**：弁が閉じているとき，摩擦を無視して線形化すると $\frac{d^2\dot m_r}{dt^2} = \frac{A_r}{L_r}\left(\frac{dp_{\text{in}}}{dt} - \frac{dp_p}{dt}\right) = -\frac{A_r}{L_r}\left(\frac{RT_{\text{in}}}{V_{\text{in}}} + \frac{\gamma_0 RT_{\text{in}}}{V_p}\right)\dot m_r$ なので，$\dot m_r$ は角振動数
   $$\omega_H = \sqrt{\frac{A_r}{L_r}\left(\frac{\gamma_0 RT_{\text{in}}}{V_p} + \frac{RT_{\text{in}}}{V_{\text{in}}}\right)}$$
   で振動する．弁が開くと筒内の容積が加わって振動数が下がり，その周期が吸気行程と合う回転数で充填が増える．
6. **設定**（ページ「吸気ランナ」）：ランナ ON／OFF（既定 ON），$L_r$（$100$〜$1000\ \text{mm}$，既定 $450$），$d_r$（$20$〜$60\ \text{mm}$，既定 $40$）．運転中に OFF から ON にしたときは $\dot m_r = 0$，$p_p = p_{\text{in}}$，$m_{b,p} = Y_{b,\text{in}}m_p$，$E_p = \varepsilon_{\text{in}}m_p$ から始める．OFF では $\dot m_r$，$p_p$，$m_{b,p}$，$E_p$ の時間微分を $0$ とし，吸気弁はマニホールドに直接つながる．

#### 仮定と限界
* 管内の圧力波の往復は解かず，質量とばねで近似する．2 次以上の同調と，排気側の脈動との干渉は表せない．
* ポートの質量は $T_{\text{in}}$ で評価し，断熱の剛性 $\gamma_0$ とは厳密には整合しない．$\gamma_0 = 1.4$ は集中定数の剛性の定数で，SPEC-02 の物性とは独立である．

* **出典**：Heywood, *Internal Combustion Engine Fundamentals*, 2nd ed. (2018) Ch. 7；[D. E. Winterbone and R. J. Pearson, *Design Techniques for Engine Manifolds* (1999)](https://www.wiley.com/en-us/Design+Techniques+for+Engine+Manifolds%3A+Wave+Action+Methods+for+IC+Engines-p-9781860581793)

---

### SPEC-27：排気系（排気管の脈動と背圧）（REQ-27）

#### 定義と式
1. **寸法**：排気管の寸法は音響の設定（SPEC-21）の排気管長 $L_e$（既定 $1.0\ \text{m}$）と内径 $d_e$（既定 $40\ \text{mm}$）を共用する．断面積 $A_e = \frac{\pi}{4}d_e^2$．管の弁側の半分を排気ポート容積 $V_{pe} = \frac12 A_e L_e$ とする（出口側の半分は，大気圧に保たれる開放端に付くので，容積として働かない）．排気系のガスは温度 $T_X = 800\ \text{K}$ 一定の既燃ガスとする．消音器と触媒は無く，排気管の出口は大気に開いている．
2. **排気管の運動量の式**（SPEC-25 の 2 と同じ導出．出口の圧力は大気圧）：
   $$\frac{d\dot m_e}{dt} = \frac{A_e}{L_e}(p_{pe} - p_{\text{atm}}) - \frac{(\zeta_x + 1)\,\dot m_e|\dot m_e|}{2\rho_e A_e L_e}, \qquad \zeta_x = f_r\frac{L_e}{d_e} + \zeta_e, \qquad \rho_e = \frac{p_{pe}}{R_X T_X}$$
   $T_X$ と $R_X$ は排気ポートのガスの温度と気体定数（化学平衡のモデルでは 9 の状態 $T_X$ と $R_X = R_b(T_X, p^\circ, \zeta^*)$．$\gamma$ のモデルと排気系 OFF では $T_X = 800\ \text{K}$，$R_X = R$．以下も同じ）．
   損失係数の $1$ は**出口の動圧**である：管を出た噴流は大気の中で運動エネルギーを失い，圧力に戻らない．定常の流れでは，流速を $v = \frac{\dot m_e}{\rho_e A_e}$ として
   $$p_{pe} - p_{\text{atm}} = (\zeta_x + 1)\frac{\rho_e v^2}{2}$$
   になる（$\zeta_x$ の分が管の摩擦と入口の損失，$1$ の分が出口の動圧）．大気から管へ戻る向きでも同じ係数を使う．
3. **排気ポートの圧力**：熱物性が $\gamma(T)$，$\gamma$ 一定のときは断熱の剛性 $\frac{dp_{pe}}{dt} = \frac{\gamma_0 RT_X}{V_{pe}}\left(\dot m_{\text{ex}} - \dot m_e\right)$，$\gamma_0 = 1.4$．化学平衡のモデルでは 9 の質量とエネルギーの式．排気弁の流量（SPEC-04）は下流圧を $p_{pe}$ として求める．
4. **出口**：出口の流量は $\dot m_t = \dot m_e$．出口側の圧力 $p_{te}$ は使わず，$\frac{dp_{te}}{dt} = 0$ とする（状態ベクトルの並びを変えないために残している．8）．
5. **背圧**：1 サイクル平均の排気ポート圧（排気弁の下流圧）と大気圧の差 $\Delta\bar p_{\text{ex}}$（SPEC-14）．目標の値は持たず，管の損失と出口の動圧から決まる．周期定常では $\dot m_e$ が 1 サイクルで元に戻るので，2 の式を 1 サイクルで平均すると左辺が $0$ になり，
   $$\Delta\bar p_{\text{ex}} = \overline{p_{pe}} - p_{\text{atm}} = \overline{\left(\frac{(\zeta_x + 1)\,\dot m_e|\dot m_e|}{2\rho_e A_e^2}\right)}$$
   が成り立つ（上線は 1 サイクルの時間平均．TEST-27 項目 5）．右辺は流速の 2 乗の平均で決まり，流量は排気の吹き出しの間に集中するので，平均の流量から求めた動圧よりずっと大きい．
6. **共鳴の目安**：排気弁が閉じているとき，損失を無視すると，$\dot m_e$ は $\omega_E = \sqrt{\frac{A_e}{L_e}\frac{\gamma_X R_X T_X}{V_{pe}}} = \frac{\sqrt{2\gamma_X R_X T_X}}{L_e}$ で振動する（$\gamma$ のモデルでは $\gamma_X = \gamma_0$．化学平衡のモデルでは，9 の式で熱伝達を $0$ にし，組成が凍結している（$T_X < T_{fr}$，$R_T = 0$）とすると，$\frac{dp_{pe}}{dt} = \frac{\gamma_X R_X T_X}{V_{pe}}(\dot m_{\text{ex}} - \dot m_e)$，$\gamma_X = 1 + \frac{R_X}{c_{v,X}}$ になる）．$R = 287\ \text{J/(kg·K)}$ とすると既定の $L_e = 1\ \text{m}$ で $802\ \text{rad/s}$（$128\ \text{Hz}$）で，弁側が閉端・出口が開放端の管の最も低い共鳴 $\frac{c}{4L_e} = 142\ \text{Hz}$（$c = \sqrt{\gamma_0 RT_X} = 567\ \text{m/s}$）より $10\%$ 低い（集中定数で表したための差）．
7. **設定**（ページ「排気系」）：排気系モデル ON／OFF（既定 ON），OFF のときの排気圧損 $\Delta p_{\text{ex}}$（$0$〜$30\ \text{kPa}$，既定 $0$：排気弁の下流が大気圧）．OFF では $\dot m_e$，$p_{pe}$，$p_{te}$ の時間微分を $0$ とし，排気弁の下流圧を $p_{\text{atm}} + \Delta p_{\text{ex}}$ とする．運転中に ON にしたときは $\dot m_e = 0$，$p_{pe} = p_{te} = p_{\text{atm}} + \Delta p_{\text{ex}}$ から始める．
8. **内部の値**（設定の項目ではない）：`Vm`（容積 [m³]）と `At`（開口の幾何面積 [m²]）を与えると，排気管の出口に容積 $V_m$ と開口を置く（第25版の排気系：消音器 $3\ \text{L}$ と出口 $300\ \text{mm}^2$）．このとき，2 の式の $p_{\text{atm}}$ を $p_{te}$ に，損失係数を $\zeta_x$ に替え，$\frac{dp_{te}}{dt} = \frac{RT_X}{V_m}(\dot m_e - \dot m_t)$（消音器の中の温度は $800\ \text{K}$ 一定），$\dot m_t$ は SPEC-04 の式で $p_1 = p_{te}$，$p_2 = p_{\text{atm}}$，有効面積 $C_{d,x}A_t$（$C_{d,x} = 0.8$）とする．第25版との比較の検査（TEST-29 項目 8，`tools/dev/bitcheck.js`）だけが使う．
9. **排気ポートのガスの温度**（熱物性が「化学平衡」のとき．状態 $T_X$．2.2 の 22）：ポートのガスは組成 $\zeta^*$ の既燃ガスとし（SPEC-29 C），質量 $m_X = \frac{p_{pe}V_{pe}}{R_X T_X}$，内部エネルギー $e_X = e_b(T_X, p^\circ, \zeta^*)$，$R_X = R_b(T_X, p^\circ, \zeta^*)$（SPEC-29 A の表の $p^\circ = 100\ \text{kPa}$ の値．温度だけの関数として扱う．ポートの圧力は大気圧の近くで，平衡組成の圧力による違いは凍結温度 $T_{fr}$ より上でだけ現れる．$\zeta^*$ が変わるたびに温度 $50\ \text{K}$ 刻みの 1 次元の表を作り，3 次 Hermite で補間する．はじめは圧力にもよる 3 次元の表をそのまま引いたが，全開の計算が $36\%$ 遅くなったので改めた）とする．顕熱の基準温度を $T_{\text{ref}} = T_{\text{amb}} = 298.15\ \text{K}$，ポートのガスの顕熱（単位質量）を $h_X^s = e_X + R_X T_X - h_b^{\text{ref}}$，$h_b^{\text{ref}} = h_b(T_{\text{ref}}, p^\circ, \zeta^*)$ とする．質量とエネルギーの式は
   $$\frac{dm_X}{dt} = \dot m_{\text{ex}} - \dot m_e, \qquad \frac{d}{dt}\left[m_X\left(e_X - h_b^{\text{ref}}\right)\right] = \dot H_{xs} - \dot H_x - \dot Q_{pw}$$
   $$\dot H_{xs} = \begin{cases}\dot m_{\text{ex}}\,h_c^s & (\dot m_{\text{ex}} \ge 0) \\ \dot m_{\text{ex}}\,h_X^s & (\dot m_{\text{ex}} < 0)\end{cases}, \qquad \dot H_x = \dot m_e\,h_X^s$$
   * $h_c^s$ は筒内のガスの顕熱：筒内の成分 $c = a, f, b$（質量分率 $Y_c$，既燃ガスの組成 $\zeta$）について $h_c^s = \sum_c Y_c\left[h_c(T) - h_c(T_{\text{ref}})\right]$（既燃ガスは $h_b(T, p, \zeta) - h_b(T_{\text{ref}}, p^\circ, \zeta)$．低温では組成が凍結しているので，平衡の再結合の熱も顕熱に入る）．筒内から出た空気と燃料蒸気は，顕熱だけをポートへ運び，ポートでは組成 $\zeta^*$ の既燃ガスとして扱う．
   * 管からポートへ戻る流れ（$\dot m_e < 0$）は，管の出口側の半分にある直前に出たガスで，ポートのガスと同じ状態とみなす（顕熱 $h_X^s$）．脈動の 1 往復で管の中のガスが動く距離は管の長さより短いので，出口から大気の空気が入ることは扱わない．（はじめは大気の空気（$T_{\text{amb}}$）が戻るとしたが，全開・$3000\ \text{rpm}$ で $\bar T_X$ が約 $690\ \text{K}$ と，排気弁が開く時点の筒内の温度（約 $1620\ \text{K}$）の半分以下になった．脈動で同じガスが出入りするたびに冷たい空気と入れ替わる計算になっていたため，改めた．）
   * $pV = mRT$ を微分した式と，エネルギーの式を $\dot p_{pe}$，$\dot T_X$ について解く（$R_T = dR_X/dT$，$c_{v,X} = de_X/dT$）：
   $$m_X c_{v,X}\,\dot T_X = \dot H_{xs} - \dot H_x - \dot Q_{pw} - \left(\dot m_{\text{ex}} - \dot m_e\right)\left(e_X - h_b^{\text{ref}}\right), \qquad V_{pe}\,\dot p_{pe} = \left(\dot m_{\text{ex}} - \dot m_e\right)R_X T_X + m_X\left(R_X + T_X R_T\right)\dot T_X$$
   * 排気弁の逆流（$\dot m_{\text{ex}} < 0$）の上流は温度 $T_X$，気体定数 $R_X$，比熱比 $\gamma_X$ のポートのガスで，筒内へ絶対値のエンタルピー $e_X + R_X T_X$ を運ぶ（SPEC-29 B の表の「排気弁の逆流」）．
   * 初期値：コールドリセットで $T_X = T_{\text{amb}}$．運転中に排気系を ON にしたときは $T_X = 800\ \text{K}$（7 の初期化と同時）．
10. **ポートの壁への熱伝達**（化学平衡のモデル）：ポートのうちシリンダヘッドの中の部分（長さ $L_{px} = B$，内径 $d_e$．内面積 $A_{px} = \pi d_e L_{px}$）から壁（温度 $T_w$．SPEC-08 の B）へ，管内乱流の熱伝達の式（Dittus–Boelter．冷やされる流体の指数 $0.3$）で
   $$\dot Q_{pw} = h_p A_{px}\left(T_X - T_w\right), \qquad h_p = \frac{\text{Nu}\,k_X}{d_e}, \qquad \text{Nu} = 0.023\,\text{Re}^{0.8}\,\text{Pr}^{0.3}, \qquad \text{Re} = \max\left(\frac{\dot m_p\,d_e}{A_e\,\mu_X},\ 2300\right)$$
   $\dot m_p = \frac{\lvert\dot m_{\text{ex}}\rvert + \lvert\dot m_e\rvert}{2}$（ポートを通る流量の代表），$\text{Pr} = 0.7$，粘性係数は空気の Sutherland の式 $\mu_X = \frac{1.458 \times 10^{-6}\,T_X^{1.5}}{T_X + 110.4}\ \text{Pa·s}$，熱伝導率は $k_X = \frac{c_{p,X}\mu_X}{\text{Pr}}$（$c_{p,X} = c_{v,X} + R_X$）．
   * $\text{Re}$ の下限 $2300$（層流との境）は，流量が $0$ を横切るときに $\text{Re}^{0.8}$ の傾きが無限大になって右辺が Lipschitz 連続でなくなるのを避けるためと，流れの止まった間の熱伝達を $0$ にしないためである．
11. **排気温度**（表示と検査）：1 サイクルに排気管へ出たガスの質量で重みをつけた平均 $\bar T_X = \frac{\Delta\Theta_x}{\Delta M_x^+}$（補助積分．2.3）．
12. **排気系 OFF と $\gamma$ のモデル**：$T_X$ の時間微分を $0$ とし，排気弁の逆流の温度に $800\ \text{K}$ を使う．$\dot Q_{pw} = 0$．化学平衡のモデルで排気系 OFF のときは，$\dot H_x = \dot H_{xs}$（排気弁から出た顕熱がそのまま外へ出る），$\Theta_x$，$M_x^+$ の被積分関数を $\dot m_{\text{ex}}^+ T$，$\dot m_{\text{ex}}^+$（筒内の温度の質量平均）とする．

#### 仮定と限界
* 圧力波の往復は解かない（集中定数）．
* 排気の温度は，化学平衡のモデルでは 9 の式で求める．$\gamma$ のモデルと排気系 OFF では $800\ \text{K}$ 一定とする（排気弁が開く時点の筒内の温度は，全開（W3000）で約 $1650\ \text{K}$，アイドルで約 $1180\ \text{K}$ で，これより高い）．
* 排気ポートの容積の中の温度は一様とする（排気弁からの噴流と，ポートの中の温度の分布は扱わない）．排気管の出口側の半分（容積として働かない部分．1）から外気への放熱は扱わない．
* ポートの熱伝達は定常の管内乱流の式で求める．Caton と Heywood は，排気の吹き出しの間の熱伝達が排気弁からの噴流で大きくなることを実験で示した（SAE 800290）．このモデルはポートの壁への熱と排気温度の下がり方を小さく見積もる（要件定義書 7.2 の 20）．
* 排気側へ吹き抜けた新気は既燃ガスとして扱う．
* 背圧は脈動する流量の 2 乗の平均で決まるので，平均流量だけの関数ではなく，回転数とともに単調には増えない（排気管の脈動の同調で上下する）．
* 開放端での圧力波の反射（負の圧力波が排気弁へ戻って掃気を助ける効果）は，1 つの容積と 1 つの慣性で表せる範囲（1 つの共鳴）だけが入る．
* 出口の損失（動圧 1 つ分）は，流れの向きによらず同じ係数で表す．管から戻るガスは，化学平衡のモデルではポートのガスと同じ状態，$\gamma$ のモデルでは温度 $T_X = 800\ \text{K}$ の既燃ガスとして扱う．
* エンジン音（SPEC-21）は排気弁の流量から作り，排気管の流れの計算結果は音に使わない．

* **出典**：Heywood (2018) Ch. 6，7；Winterbone and Pearson (1999)；管内乱流の熱伝達の式は F. W. Dittus and L. M. K. Boelter (1930)（経緯は [R. H. S. Winterton, *Int. J. Heat Mass Transfer* 41, 809–810 (1998)](https://doi.org/10.1016/S0017-9310(97)00177-4)）；排気ポートの熱伝達の実験は [J. A. Caton and J. B. Heywood, SAE Technical Paper 800290 (1980)](https://doi.org/10.4271/800290)；粘性係数は Sutherland の式（W. Sutherland, *Phil. Mag.* 36, 507 (1893)．空気の定数 $1.458 \times 10^{-6}\ \text{Pa·s·K}^{-1/2}$，$110.4\ \text{K}$）．

---

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
     更新は $\ln n_j \leftarrow \ln n_j + \lambda\,\Delta\ln n_j$，$\ln N \leftarrow \ln N + \lambda\,\Delta\ln N$，緩和係数 $\lambda = \min\left(1, \frac{2}{\max\left(5\lvert\Delta\ln N\rvert,\ \max_j\lvert\Delta\ln n_j\rvert\right)}\right)$（$\max_j$ は $n_j/N > 10^{-8}$ か $\Delta\ln n_j > 0$ の化学種について取る）．$n_j$ の下限は $10^{-40}$．初期値は全化学種に $0.1\sum_i b_i/10$．$\lambda = 1$ で $\max_j\frac{n_j\lvert\Delta\ln n_j\rvert}{N} < 10^{-11}$ かつ $\lvert\Delta\ln N\rvert < 10^{-11}$ になったら終える（上限 400 回）．
   * **物性**：
     $$e_b(T, p, \zeta) = \sum_j n_j\,\bar u_j(T) + (1 - \eta_c)\,\zeta\,e_f(T), \qquad R_b(T, p, \zeta) = \bar R\sum_j n_j + (1 - \eta_c)\,\zeta\,R_f, \qquad h_b = e_b + R_b T$$
5. **凍結**：$T < T_{fr} = 1700\ \text{K}$ では，組成を「同じ圧力 $p$ で温度 $T_{fr}$ のときの平衡組成」に固定して 4 の物性の式を使う．膨張の途中で CO の酸化が止まることを表す．どの圧力で凍結したかという経路は追わない（状態量としての近似）．
6. **表と補間**：$e_b$，$R_b$ と $c_{v,b} \equiv \left(\frac{\partial e_b}{\partial T}\right)_{p,\zeta}$ を，次の格子の節点で求めて保持する．
   * 当量比の座標は，反応に加わる燃料の当量比 $\phi_r = \eta_c\phi_b$ とし，$0.50$ から $1.50$ まで $0.0125$ 刻み（81 点）．量論（$\phi_r = 1$）で物性の $\phi$ についての傾きが折れるので，そこを節点に置く．$T$：$250$ から $3500\ \text{K}$ まで $50\ \text{K}$ 刻み（66 点）．$p$：$20\ \text{kPa}$ から $20\ \text{MPa}$ まで公比 $10^{1/12}$ の 37 点．範囲の外は端の値に丸める．ただし $T$ の範囲の外では，$e_b$ を端の $c_{v,b}$ で直線に延ばし（$e_b(T) = e_b(T_e) + c_{v,b}(T_e)(T - T_e)$，$T_e$：近いほうの端），$c_{v,b}$ は端の値とする（$c_{v,b} = 0$ とすると，$\gamma = 1 + \frac{R}{c_v}$ が無限大になり，筒内の質量が小さく $250\ \text{K}$ を下回る運転（吸気弁がほとんど開かない弁の時期など）で計算が破綻した．REQ-13 の 9）．$R_b$ は端の値で，そのほかの方向の偏微分は $0$）．
   * 刻みは補間の誤差を測って決めた：$\phi$ を $0.05$ 刻み，$p$ を公比 $10^{1/3}$ にした最初の案では，量論の近くで $e_b$ の誤差が $34\ \text{kJ/kg}$，高温・低圧で $16\ \text{kJ/kg}$ あった（折れ目が節点の間にあったことと，解離が $p$ に強く依存することによる）．上の格子では最大 $3.6\ \text{kJ/kg}$（量論のすぐリッチ側，$1900\ \text{K}$ 付近）．
   * 節点の $c_{v,b}$ は，$T \ge T_{fr}$ では節点の $e_b$ の差分（内側は 4 次の中心差分 $\frac{-e_{i+2} + 8e_{i+1} - 8e_{i-1} + e_{i-2}}{12\,\Delta T}$，端は 2 次の片側差分．平衡を解く回数を増やさないため），$T < T_{fr}$ では固定した組成での $\sum_j n_j(\bar c_{p,j} - \bar R) + (1 - \eta_c)\zeta c_{v,f}$．
   * 補間：$T$ の方向は，節点の値 $e_b$ と傾き $c_{v,b}$ による 3 次 Hermite 補間．$R_b$ も，節点の値と傾き $\frac{\partial R_b}{\partial T}$（節点の値の差分．凍結の側は $0$）による 3 次 Hermite 補間とする（$T$ について $C^1$．$R_b$ を線形にすると $\frac{\partial R_b}{\partial T}$ が節点で跳び，右辺が不連続になって，閉じた断熱の系のエネルギーの誤差が約 10 倍になった．TEST-29 項目 6）．$\ln p$ と $\phi_r$ の方向は線形．偏微分 $\frac{\partial e_b}{\partial T}$，$\frac{\partial e_b}{\partial p}$，$\frac{\partial e_b}{\partial\zeta}$，$\frac{\partial R_b}{\partial T}$，$\frac{\partial R_b}{\partial p}$，$\frac{\partial R_b}{\partial\zeta}$ は，補間した関数を微分して求める（エネルギーの式と整合させるため）．
   * 表は $\phi_r$ の節点ごとに，初めて必要になったときに作って保持する（起動時にはまとめて作らない．1 節点は平衡の計算 $37 \times 37 = 1369$ 回で，開発用の計算機の Chromium で約 $7\ \text{ms}$）．混合気の濃さが急に変わるサイクルでは，1 ステップで 1〜3 節点，連続する約 20 ステップで 30 節点あまりを作る（運転中に直噴からポート噴射へ切り替えた直後のサイクルの実測で，計 $230\ \text{ms}$）．このため，時間を区切って積分するループは，経過時間を 4 ステップごとに調べる（SPEC-15 F の 2，SPEC-20 B の 4）．計算は決定的で，同じ節点は同じ値になる．

#### B. 筒内の式

1. **状態**：$m$，$m_u$（§2.2）に，次の 2 つを加える．
   | 記号 | 意味 | 単位 |
   | :--- | :--- | :--- |
   | $m_f$ | 筒内の未燃の燃料蒸気の質量 | kg |
   | $m_{bf}$ | 筒内の既燃ガスのうち，燃料に由来する質量 | kg |

   従属変数：未燃の空気 $m_a = m_u - m_f$，既燃ガス $m_b = m - m_u$，$\zeta = \frac{m_{bf}}{m_b}$（$m_b \le 10^{-12}\ \text{kg}$ では $\zeta = \zeta^*$），未燃ガスの燃料の割合 $\psi = \frac{m_f}{m_u}$．$\zeta^*$ は筒外の既燃ガスに使う値で，排気弁が開く時点（EVO）の $\zeta$ で更新する（初期値は設定の $\phi$ から $\frac{\phi}{\text{AF}_{st} + \phi}$）．
2. **温度**：状態方程式 $pV = \mathcal{R}\,T$，$\mathcal{R} \equiv m_a R_a + m_f R_f + m_b R_b(T, p, \zeta)$ [J/K] を $T$ について解く．$R_b$ が $T$ に依存するので，$T^{(0)} = \frac{pV}{m_a R_a + m_f R_f + m_b R_b(T_{fr}, p, \zeta)}$ から $T^{(k+1)} = \frac{pV}{m_a R_a + m_f R_f + m_b R_b(T^{(k)}, p, \zeta)}$ を 6 回繰り返す（回数は固定．右辺を状態の関数にするため）．
3. **成分の質量**：流れ $j$（質量流量 $\dot m_j$，流入が正）の成分の質量分率を $Y_{a,j}$，$Y_{f,j}$，$Y_{b,j}$（和は 1），既燃分の $\zeta$ を $\zeta_j$ とする．燃焼の速さ $r$ は SPEC-06（$m_{u,\text{trapped}}$ は点火の時点の $m_u$ とする．SPEC-30 の 7），液体の燃料の気化の速さ $\dot m_{\text{ev}}$ は SPEC-30．
   $$\frac{dm}{dt} = \sum_j\dot m_j + \dot m_{\text{ev}}, \qquad \frac{dm_u}{dt} = \sum_j\dot m_j\left(Y_{a,j} + Y_{f,j}\right) + \dot m_{\text{ev}} - r$$
   $$\frac{dm_f}{dt} = \sum_j\dot m_j Y_{f,j} + \dot m_{\text{ev}} - r\,\psi, \qquad \frac{dm_{bf}}{dt} = \sum_j\dot m_j Y_{b,j}\zeta_j + r\,\psi$$
   | 流れ | 成分 | 温度 | $\zeta_j$ |
   | :--- | :--- | :--- | :--- |
   | 筒内から出る流れ（吸気弁の逆流，排気弁の流出） | 筒内の値（$\frac{m_a}{m}$，$\frac{m_f}{m}$，$\frac{m_b}{m}$） | $T$ | $\zeta$ |
   | 吸気弁の順流 | 上流の容積の値（$Y_{b,\text{src}}$，$Y_{f,\text{src}}$．SPEC-05，SPEC-30） | $T_{\text{up}}$（SPEC-05 の 7） | $\zeta^*$ |
   | 排気弁の逆流 | 既燃ガスだけ | $T_X$（SPEC-27） | $\zeta^*$ |

   流れのエンタルピーは $h_j = Y_{a,j}h_a(T_j) + Y_{f,j}h_f(T_j) + Y_{b,j}h_b(T_j, p_j, \zeta_j)$（$p_j$ は上流の圧力）．吸気弁の順流は，SPEC-05 の 7 と同じく，$T_{\text{in}}$ での値に余剰 $\varepsilon_{\text{src}}$ を加える．
4. **エネルギーの式**：筒内の全内部エネルギーは $U = m_a e_a(T) + m_f e_f(T) + m_b e_b(T, p, \zeta)$（絶対値）．第一法則は
   $$\frac{dU}{dt} = -p\frac{dV}{dt} - \dot Q_{\text{wall}} + \sum_j\dot m_j h_j + \dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right]$$
   発熱の項 $\dot Q_{\text{comb}}$ は無い．未燃ガスが既燃ガスに変わると，同じ温度での内部エネルギーが $e_u - e_b$（生成エンタルピーの差を含む）だけ下がり，その分が温度と圧力の上昇になる．最後の項は気化した燃料が持ち込むエネルギーで，液体のエンタルピーを $h_f(T_l) - h_{fg}$ とする（SPEC-30）．
5. **$\dot T$ と $\dot p$ の連立**：$\dot\zeta = \frac{\dot m_{bf}\,m_b - m_{bf}\,\dot m_b}{m_b^2}$（$m_b \le 10^{-12}\ \text{kg}$ では $0$），$\dot m_b = \dot m - \dot m_u$，$\dot m_a = \dot m_u - \dot m_f$ とし，
   $$C \equiv m_a c_{v,a} + m_f c_{v,f} + m_b\frac{\partial e_b}{\partial T}$$
   と書く．エネルギーの式の左辺を展開したものと，状態方程式を時間で微分したものは
   $$C\,\dot T + m_b\frac{\partial e_b}{\partial p}\,\dot p = S_E, \qquad S_E \equiv -p\dot V - \dot Q_{\text{wall}} + \sum_j\dot m_j h_j + \dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right] - \dot m_a e_a - \dot m_f e_f - \dot m_b e_b - m_b\frac{\partial e_b}{\partial\zeta}\dot\zeta$$
   $$-\left(\mathcal{R} + T m_b\frac{\partial R_b}{\partial T}\right)\dot T + \left(V - T m_b\frac{\partial R_b}{\partial p}\right)\dot p = S_R, \qquad S_R \equiv -p\dot V + T\left(\dot m_a R_a + \dot m_f R_f + \dot m_b R_b + m_b\frac{\partial R_b}{\partial\zeta}\dot\zeta\right)$$
   これを $\dot p$ について解いて
   $$\frac{dp}{dt} = \frac{C\,S_R + \left(\mathcal{R} + T m_b\frac{\partial R_b}{\partial T}\right)S_E}{C\left(V - T m_b\frac{\partial R_b}{\partial p}\right) + m_b\frac{\partial e_b}{\partial p}\left(\mathcal{R} + T m_b\frac{\partial R_b}{\partial T}\right)}$$
   組成が固定で $R$ が共通（$R_a = R_f = R_b = R$，$\frac{\partial e_b}{\partial p} = \frac{\partial R_b}{\partial p} = \frac{\partial R_b}{\partial T} = 0$）のとき，$\mathcal{R} = mR$，$C = mc_v$ となり，SPEC-09 の式の形（$\dot Q_{\text{comb}}$ が $r(e_u - e_b)$ に含まれる）に帰着する．
6. **オリフィスの流れ**（SPEC-04）と壁面熱伝達（SPEC-08）に使う比熱比と気体定数は，その場所の成分の質量分率で混合した値とする：$R_{\text{mix}} = \sum_k Y_k R_k$，$c_{v,\text{mix}} = \sum_k Y_k c_{v,k}$（既燃ガスは $c_{v,b} = \frac{\partial e_b}{\partial T}$），$\gamma = 1 + \frac{R_{\text{mix}}}{c_{v,\text{mix}}}$．
7. **表示と集計に使う発熱率**：$\dot Q_{\text{comb}} \equiv r\left[(1 - \psi)e_a(T) + \psi e_f(T) - e_b(T, p, \zeta)\right]$（その時点の温度と圧力で，未燃ガスが既燃ガスに変わるときに出る熱）．補助積分 $Q_c$ と熱発生率の線図に使う．エネルギーの式には使わない．
8. **第一法則の検査**：補助積分に $H_e$（被積分関数 $\dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right]$）を加え，$\Delta U = -\Delta W - \Delta Q_w + \Delta H_i - \Delta H_o + \Delta H_e$ の残差を，1 サイクルに供給した燃料の発熱量 $m_f H_u$ で割って検査する．燃料の収支の検査（TEST-30 項目 1）のために，補助積分に $\int\dot m_{\text{inj}}\,dt$，$\int\dot m_{\text{ev}}\,dt$，吸気弁を通る燃料蒸気（流入が正），排気弁から出る燃料蒸気，燃えた燃料 $\int r\psi\,dt$ も加える．
9. **初期値**（コールドリセット）：筒内は温度 $320\ \text{K}$ の空気（$m = m_u = \frac{p_{\text{atm}}V(\pi)}{R_a \cdot 320}$，$m_f = m_{bf} = 0$）．

#### C. 筒外の容積

1. 吸気マニホールドとポートの圧力の式（SPEC-05，SPEC-25）は，成分ごとの気体定数を使う：容積 $k$ について $p_k V_k = T_{\text{in}}\sum_c m_{c,k}R_c$ から $\frac{dp_k}{dt} = \frac{T_{\text{in}}}{V_k}\sum_c R_c\,\dot m_{c,k}$（$c = a, f, b$）．既燃ガスの気体定数は $R_b^* \equiv R_b(T_{\text{in}}, 100\ \text{kPa}, \zeta^*)$．各容積の燃料蒸気の質量は SPEC-30 の状態で追う．
2. 排気系（SPEC-27）のガスは組成 $\zeta^*$ の既燃ガスで，温度は排気ポートのガスの温度 $T_X$（状態．SPEC-27 の 9），気体定数は $R_X = R_b(T_X, p^\circ, \zeta^*)$ とする．
3. 余剰エンタルピー（SPEC-05 の 7）は，筒内の成分で $T$ と $T_{\text{in}}$ のエンタルピーの差を取る（既燃ガスは $h_b(T, p, \zeta) - h_b(T_{\text{in}}, p, \zeta)$）．

#### 仮定と限界
* **単一ゾーン**：既燃ガスの平衡組成を筒内の平均温度 $T$ で評価する．実際の既燃部は平均より高温で，解離はもっと進む．このモデルは解離を小さく見積もる．
* 平衡は 10 種．N，炭化水素の中間生成物，すすは扱わない．NO は平衡値で，実際より多い．
* 凍結は，温度だけで決まる状態量の近似である（A の 5）．
* 筒外の既燃ガスの組成は $\zeta^*$（直近の EVO の値）とする．当量比を変えた直後の数サイクルは，筒外の既燃ガスの元素の量が正確には保存しない（質量は保存する）．
* 燃料は 1 つの擬似種で，比熱はイソオクタン，発熱量と H/C はガソリンの値である．
* 空気は O$_2$ と N$_2$ だけで，湿度と Ar は扱わない．

* **出典**：[B. J. McBride, S. Gordon, M. A. Reno, NASA TM-4513 (1993)](https://ntrs.nasa.gov/citations/19940013151)（係数．Cantera の `data/nasa_gas.yaml` から取った．`tools/richburn/thermo.json`）；S. Gordon and B. J. McBride, NASA RP-1311 (1994)（平衡の反復法）；Heywood (1988) Ch. 3（燃料と空気の混合気の熱化学．化学平衡），Ch. 4（作動流体の物性），Ch. 5（理想サイクル．5.5 節が燃料空気サイクル）；試算と考察は `docs/report_richburn.md`．

#### 付表：NASA 7 係数多項式の係数

| 化学種 | 範囲 [K] | $a_1$ | $a_2$ | $a_3$ | $a_4$ | $a_5$ | $a_6$ | $a_7$ |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| O2 | 200〜1000 | `3.78245636e+00` | `-2.99673415e-03` | `9.84730200e-06` | `-9.68129508e-09` | `3.24372836e-12` | `-1.06394356e+03` | `3.65767573e+00` |
| O2 | 1000〜6000 | `3.66096083e+00` | `6.56365523e-04` | `-1.41149485e-07` | `2.05797658e-11` | `-1.29913248e-15` | `-1.21597725e+03` | `3.41536184e+00` |
| N2 | 200〜1000 | `3.53100528e+00` | `-1.23660987e-04` | `-5.02999437e-07` | `2.43530612e-09` | `-1.40881235e-12` | `-1.04697628e+03` | `2.96747468e+00` |
| N2 | 1000〜6000 | `2.95257626e+00` | `1.39690057e-03` | `-4.92631691e-07` | `7.86010367e-11` | `-4.60755321e-15` | `-9.23948645e+02` | `5.87189252e+00` |
| CO2 | 200〜1000 | `2.35677352e+00` | `8.98459677e-03` | `-7.12356269e-06` | `2.45919022e-09` | `-1.43699548e-13` | `-4.83719697e+04` | `9.90105222e+00` |
| CO2 | 1000〜6000 | `4.63659493e+00` | `2.74131991e-03` | `-9.95828531e-07` | `1.60373011e-10` | `-9.16103468e-15` | `-4.90249341e+04` | `-1.93534855e+00` |
| H2O | 200〜1000 | `4.19864056e+00` | `-2.03643410e-03` | `6.52040211e-06` | `-5.48797062e-09` | `1.77197817e-12` | `-3.02937267e+04` | `-8.49032208e-01` |
| H2O | 1000〜6000 | `2.67703787e+00` | `2.97318329e-03` | `-7.73769690e-07` | `9.44336689e-11` | `-4.26900959e-15` | `-2.98858938e+04` | `6.88255571e+00` |
| CO | 200〜1000 | `3.57953347e+00` | `-6.10353680e-04` | `1.01681433e-06` | `9.07005884e-10` | `-9.04424499e-13` | `-1.43440860e+04` | `3.50840928e+00` |
| CO | 1000〜6000 | `3.04848583e+00` | `1.35172818e-03` | `-4.85794075e-07` | `7.88536486e-11` | `-4.69807489e-15` | `-1.42661171e+04` | `6.01709790e+00` |
| H2 | 200〜1000 | `2.34433112e+00` | `7.98052075e-03` | `-1.94781510e-05` | `2.01572094e-08` | `-7.37611761e-12` | `-9.17935173e+02` | `6.83010238e-01` |
| H2 | 1000〜6000 | `2.93286579e+00` | `8.26607967e-04` | `-1.46402335e-07` | `1.54100359e-11` | `-6.88804432e-16` | `-8.13065597e+02` | `-1.02432887e+00` |
| OH | 200〜1000 | `3.99201543e+00` | `-2.40131752e-03` | `4.61793841e-06` | `-3.88113333e-09` | `1.36411470e-12` | `3.61508056e+03` | `-1.03925458e-01` |
| OH | 1000〜6000 | `2.83864607e+00` | `1.10725586e-03` | `-2.93914978e-07` | `4.20524247e-11` | `-2.42169092e-15` | `3.94395852e+03` | `5.84452662e+00` |
| O | 200〜1000 | `3.16826710e+00` | `-3.27931884e-03` | `6.64306396e-06` | `-6.12806624e-09` | `2.11265971e-12` | `2.91222592e+04` | `2.05193346e+00` |
| O | 1000〜6000 | `2.54363697e+00` | `-2.73162486e-05` | `-4.19029520e-09` | `4.95481845e-12` | `-4.79553694e-16` | `2.92260120e+04` | `4.92229457e+00` |
| H | 200〜1000 | `2.50000000e+00` | `0.00000000e+00` | `0.00000000e+00` | `0.00000000e+00` | `0.00000000e+00` | `2.54736599e+04` | `-4.46682853e-01` |
| H | 1000〜6000 | `2.50000286e+00` | `-5.65334214e-09` | `3.63251723e-12` | `-9.19949720e-16` | `7.95260746e-20` | `2.54736589e+04` | `-4.46698494e-01` |
| NO | 200〜1000 | `4.21859896e+00` | `-4.63988124e-03` | `1.10443049e-05` | `-9.34055507e-09` | `2.80554874e-12` | `9.84509964e+03` | `2.28061001e+00` |
| NO | 1000〜6000 | `3.26071234e+00` | `1.19101135e-03` | `-4.29122646e-07` | `6.94481463e-11` | `-4.03295681e-15` | `9.92143132e+03` | `6.36900518e+00` |
| イソオクタン（燃料の比熱のもと） | 200〜1000 | `8.15737338e-01` | `7.32643959e-02` | `1.78300688e-05` | `-6.93589620e-08` | `3.21629382e-11` | `-3.04772862e+04` | `2.41509994e+01` |
| イソオクタン（燃料の比熱のもと） | 1000〜6000 | `1.59899273e+01` | `5.53184790e-02` | `-1.95267072e-05` | `3.11779172e-09` | `-1.85312577e-13` | `-3.58757973e+04` | `-6.01161414e+01` |

燃料蒸気の係数は，イソオクタンの行に A の 3 の変換をしたもの．

---

### SPEC-30：燃料の噴射と気化（REQ-30．第26版）

設定「噴射」の `[噴射方式　ポート噴射／直噴]`（既定「直噴」）で選ぶ．熱物性（SPEC-29）が「化学平衡」でないときは，ポート噴射に固定する（第25版の予混合気のまま．設定画面では変更できない）．以下は「化学平衡」のときの定めである．

#### 定義と式

1. **吸気側の燃料蒸気の追跡**：吸気マニホールドとポートの燃料蒸気の質量を状態に加える．
   | 記号 | 意味 | 単位 |
   | :--- | :--- | :--- |
   | $m_{f,\text{in}}$ | 吸気マニホールド内の燃料蒸気の質量 | kg |
   | $m_{f,p}$ | 吸気ポート内の燃料蒸気の質量 | kg |

   式は既燃ガスの追跡（SPEC-05 の 6，SPEC-25）と同じ形で，既燃分率を燃料蒸気の分率 $Y_{f,k} = \text{clamp}\left(\frac{m_{f,k}}{m_k}, 0, 1\right)$ に，筒内から出る流れの分率を $\frac{m_f}{m}$ に置き換える．スロットルの順流が運ぶ燃料は 2 と 3 で定める．
2. **ポート噴射**：スロットルの順流は，当量比 $\phi$（設定）の予混合気とする．燃料蒸気の質量分率は $f_\phi = \frac{\phi}{\text{AF}_{st} + \phi}$ で，マニホールドには $f_\phi\,\dot m_{\text{th}}^+$ の燃料蒸気が入る．オリフィスの式の上流のガスは，この混合気（$T_{\text{amb}}$）である．気化に要る熱は上流でまかなわれるとし，筒内では潜熱を引かない（$\dot m_{\text{inj}} = 0$）．
3. **直噴**：スロットルの順流は空気だけ（$f_\phi = 0$）．燃料は 4〜6 のとおり筒内へ噴く．
4. **噴射量**（ECU）：吸気弁が閉じる時点（IVC）ごとに，筒内の未燃の空気の質量 $m_{a,\text{IVC}}$ と，筒内のガスの全質量 $m_{\text{IVC}}$ を記録する．噴射の開始の時点で，吸気マニホールド圧の変化から今回のサイクルの空気量の推定 $\hat m_a$ を求め，噴射の指令を決める：
   $$\hat m_a = \max\left(0,\ m_{a,\text{IVC}}^{(k-1)} + m_{\text{IVC}}^{(k-1)}\left(\pi_S - 1\right)\right), \qquad \pi_S = \frac{p_{\text{in}}^{(k)}(\theta_{\text{SOI}})}{p_{\text{in}}^{(k-1)}(\theta_{\text{SOI}})}, \qquad m_{f,\text{cmd}} = \frac{\phi\,\hat m_a}{\text{AF}_{st}}$$
   （$k$ はサイクルの番号．前のサイクルの噴射が無いときは $\pi_S = 1$ とする．リセットの後，最初の IVC までは $\hat m_a = \frac{p_{\text{in}}V_d}{R_a T_{\text{in}}}$．$V_d$：行程容積．）燃料 OFF（点火しない条件．SPEC-12）では噴かない．
   * 考え方：閉じ込めるガスの全質量は吸気管圧に比例して変わり，そのうち残留ガスの量は前のサイクルと同じとする．増減はすべて空気である（実機の ECU が吸気管圧から筒内の空気量を見積もる speed-density 方式にならった．調整する係数は無い）．定常では $\pi_S = 1$ で，補正は効かない．
   * 補正する理由：補正なし（$\hat m_a = m_{a,\text{IVC}}^{(k-1)}$）では，アイドルで 1 サイクルごとの空気量の変化（$4$〜$5\%$）に燃料が 1 サイクル遅れ，回転数が $\pm 50\ \text{rpm}$ の持続振動になる．吸気管圧に比例させるだけの補正より，残留ガスを分けた上の式のほうが推定の誤差が小さい（経緯と実測は要件定義書 7.4 節）．
   * 噴いた燃料の一部は，吸気弁の逆流でポートとマニホールドへ戻り，全開ではスロットルの逆流で外へ出る（マニホールドは一様に混ざった容積で，外気は無限大の空気だめである）．このため点火の時点の当量比 $\phi_c$ は設定より小さくなる（全開，$3000\ \text{rpm}$ で約 $3\%$．TEST-30 項目 1，5）．ECU はこれを補正しない．
5. **噴射の時期と噴射率**：噴射の開始角を $\theta_{\text{SOI}}$（設定）とする．開始の時点の角速度 $\omega_{\text{SOI}}$ と，インジェクタの流量 $q_{\text{inj}}$（設定）から，噴射の角度の幅を
   $$\Delta\theta_{\text{inj}} = \text{clamp}\left(\frac{\omega_{\text{SOI}}\,m_{f,\text{cmd}}}{q_{\text{inj}}},\ 1^\circ,\ 300^\circ\right)$$
   と決め，$0 \le \text{md}(\theta - \theta_{\text{SOI}}) < \Delta\theta_{\text{inj}}$ の間，クランク角について一定の率で噴く（噴いているかどうかは，開始と終了のイベントで切り替える．ステップの途中の角度では判定しない）：
   $$\dot m_{\text{inj}} = \frac{m_{f,\text{cmd}}}{\Delta\theta_{\text{inj}}}\,\omega$$
   それ以外では $\dot m_{\text{inj}} = 0$．1 サイクルに噴く質量は，回転数が途中で変わっても $m_{f,\text{cmd}}$ に一致する．噴射の開始と終了は積分のイベントとし，その角度でステップをちょうど終える（SPEC-13）．幅が上限の $300^\circ$ に達したときは，インジェクタの流量を超える率で噴くことになる（画面に注記する）．
6. **気化**：筒内の液体の燃料の質量 $m_l$ を状態に加える．気化の時定数を $\tau_{\text{ev}}$（設定）として
   $$\frac{dm_l}{dt} = \dot m_{\text{inj}} - \dot m_{\text{ev}}, \qquad \dot m_{\text{ev}} = \frac{m_l}{\tau_{\text{ev}}}$$
   $\tau_{\text{ev}} = 0$ のときは $\dot m_{\text{ev}} = \dot m_{\text{inj}}$，$m_l = 0$ とする．気化した燃料は未燃の燃料蒸気になり（SPEC-29 B の 3 の $\dot m_{\text{ev}}$），筒内のガスにエネルギー $\dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right]$ を持ち込む（SPEC-29 B の 4）．液体は温度 $T_l = 300\ \text{K}$ のままで，体積を占めず，弁からは出ないとする．$h_{fg} = 350\ \text{kJ/kg}$．
   * 断熱・定容で，筒内のガス（熱容量 $C$．SPEC-29 B の 5）に質量 $\Delta m$ の燃料が気化すると，温度の変化は $C\,\Delta T \approx -\Delta m\left[h_{fg} + e_f(T) - h_f(T_l)\right]$ である．
   * 燃え終わった後に気化した燃料は，未燃の燃料蒸気として残り，排気弁から出る．
7. **点火の時点の当量比**：点火の時点の筒内の未燃ガスから $\phi_c = \text{AF}_{st}\,\frac{m_f}{m_a}$ を求め，そのサイクルの層流燃焼速度（SPEC-07）に使う．燃焼の速さ $r$ の $m_{u,\text{trapped}}$ は，点火の時点の $m_u$ とする（ポート噴射では IVC の値と同じ）．
8. **供給した燃料**（効率と燃料消費率の分母．SPEC-14）：直噴では $m_{f,\text{cmd}}$，ポート噴射では IVC の時点の筒内の燃料蒸気 $m_f$．
9. **設定**（熱物性はページ「燃焼」，ほかの 4 項目は新しいページ「噴射」．「燃焼」は既に 6 項目で，1 ページの上限（SPEC-18）に達しているため）：
   | 項目 | 範囲，刻み，既定 | 区分 |
   | :--- | :--- | :--- |
   | 熱物性 | γ(T)／γ一定／化学平衡，既定 化学平衡（第25版までの保存値 γ(T)，γ一定 の意味を変えないように，化学平衡を 3 番目に置く） | 即時 |
   | 噴射方式 | ポート噴射／直噴，既定 直噴 | 即時 |
   | 噴射開始 $\theta_{\text{SOI}}$（°．吸気上死点後） | $0$〜$330$，$5$，$80$ | 即時 |
   | インジェクタ流量 $q_{\text{inj}}$（g/s） | $5$〜$40$，$1$，$15$ | 即時 |
   | 気化の時定数 $\tau_{\text{ev}}$（ms） | $0$〜$10$，$0.1$，$1.5$ | 即時 |

   噴射開始，インジェクタ流量，気化の時定数は，ポート噴射のときは使わない（SPEC-18 B.7 と同じく，行に「（不使用）」と書いて `[−]` `[+]` を無効にする）．熱物性が「化学平衡」でないときは，噴射方式の行にも「（不使用）」と書き，選択のボタンを無効にして「ポート噴射」を選択中として表示する（設定値は保持する）．運転中に熱物性を切り替えたときは，筒内の圧力・温度・未燃分率と，吸気側の圧力・既燃分率を保って，質量を新しいモデルの気体定数で取り直す（$\gamma$ のモデルの未燃ガスは当量比 $\phi$ の予混合気なので，「化学平衡」へ切り替えるときは，筒内と吸気側の未燃ガスに質量分率 $f_\phi$ の燃料蒸気を置く．既燃ガスの $\zeta$ と $\zeta^*$ は設定の $\phi$ から決める）．運転中に噴射方式を切り替えたときは，状態を置き直さない：直噴からポート噴射へ切り替えると，吸気側が予混合気で満たされるまでの数サイクルは薄くなり（アイドルで約 10 サイクル．回転数が約 $650\ \text{rpm}$ まで下がってから戻る），逆では吸気側に残った燃料の分だけ濃くなる（いずれも実測．止まらない）．
10. **ページ「噴射」のパネルの文字**（SPEC-18 の p-V パネルの上の 1 行）：直噴で運転しているときは「噴射 $\theta_{\text{SOI}}$〜$\theta_{\text{SOI}} + \Delta\theta_{\text{inj}}$°（幅），$m_{f,\text{cmd}}$ [mg]，$\phi_c$」を表示する．幅が上限の $300^\circ$ のときは「（幅が上限：インジェクタ流量を超える率）」を付ける．ポート噴射では「ポート噴射（予混合気）」と $\phi_c$ を表示する．

#### 仮定と限界
* 冷却は**上限寄り**である：壁やピストンに付いた燃料が壁から熱をもらうこと，液滴が温まる分は扱わない．
* 筒内は一様で，成層と，噴霧による乱れの増加は扱わない．
* 気化潜熱 $h_{fg} = 350\ \text{kJ/kg}$ は，文献の値の幅（$305$〜$380\ \text{kJ/kg}$）の中ほどで，$150\ \text{Btu/lb} = 349\ \text{kJ/kg}$ に当たる．$305\ \text{kJ/kg}$ にしたときの差（全開，$3000\ \text{rpm}$，$\phi = 1$，Node.js での計測）：直噴の軸トルク $39.94 \to 39.39\ \text{N·m}$（$-1.4\%$），IVC の筒内温度 $382.5 \to 385.2\ \text{K}$，空気量 $535.0 \to 529.9\ \text{mg}$（$-1.0\%$）．$\phi = 1.1$ と $1.0$ の軸トルクの比は $1.061$ のまま変わらない．TEST-30 項目 6 と TEST-29 項目 9 の判定は，どちらの値でも成り立つ．
* $q_{\text{inj}}$ と $\tau_{\text{ev}}$ の既定値は推定で，実機の値で確かめていない．既定の行程容積（$0.50\ \text{L}$）の全開では，1 サイクルの燃料は約 $35\ \text{mg}$ で，$15\ \text{g/s}$ なら噴射は約 $2.3\ \text{ms}$（$7000\ \text{rpm}$ で約 $100^\circ$）になる．
* 噴射時期は固定の設定で，回転数や負荷で自動には動かさない．噴射の時間と気化の時定数は時間で決まるので，高回転ほどクランク角では長くなり，気化の一部が吸気弁の閉じた後にずれ込む（$7000\ \text{rpm}$ で噴射が約 $100^\circ$，時定数が約 $63^\circ$）．壁への付着と混合を扱わないので，早く噴くことの不利益は現れない．
* 既定の噴射開始（吸気上死点後 $80^\circ$）では，気化の大半が吸気弁の閉じる前に起こり，冷却が空気量の増加に効く．吸気弁が閉じた後に噴くと，圧縮の温度が下がるだけになる．
* ポート噴射の「上流で気化」は第25版の仮定の引き継ぎで，吸気管の壁の燃料の膜は扱わない．

* **出典**：直噴の体積効率の実測は [SAE Technical Paper 2002-01-0839](https://saemobilus.sae.org/papers/volumetric-efficiency-direct-port-injection-gasoline-engines-different-fuels-2002-01-0839)；気化潜熱の値は米国石油協会の資料（API Publication 4261）に基づく[燃料の物性の表](https://user.iiasa.ac.at/~gruebler/Lectures/skku_2009/data/doe_fueltable.pdf)（ガソリン：約 $150\ \text{Btu/lb}$，$60\ ^\circ\text{F}$）；Heywood (1988) Appendix D の燃料の物性の表（$305\ \text{kJ/kg}$．この値は表を引いた二次資料で確かめた）；空気量の見積もりの考え方（speed-density）は Guzzella and Onder (2010) Ch. 2，[E. Hendricks and S. C. Sorenson, SAE Technical Paper 900616 (1990)](https://doi.org/10.4271/900616)；考察は `docs/report_richburn.md`．

---

## 4. 数値積分と性能の指標

### SPEC-13：数値積分（REQ-13）

#### 定義と式
1. **RK4**：クランク角の刻み $\Delta\theta_{\text{step}}$（設定，$0.25$〜$2^\circ$，既定 $0.25^\circ$）から
   $$\Delta t = \min\left(\frac{\Delta\theta_{\text{step}}}{\max(\omega, \omega_{\min})},\ \Delta t_{\max}\right), \qquad \omega_{\min} = 20\ \text{rad/s},\ \Delta t_{\max} = 2 \times 10^{-5}\ \text{s}$$
   $$\mathbf{k}_1 = \mathbf{f}(\mathbf{y}_n),\ \mathbf{k}_2 = \mathbf{f}\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_1\right),\ \mathbf{k}_3 = \mathbf{f}\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_2\right),\ \mathbf{k}_4 = \mathbf{f}(\mathbf{y}_n + \Delta t\,\mathbf{k}_3), \qquad \mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{\Delta t}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$
2. **DOPRI5**：節点 $c = \left(0, \frac15, \frac{3}{10}, \frac45, \frac89, 1, 1\right)$，5 次の重み $b = \left(\frac{35}{384}, 0, \frac{500}{1113}, \frac{125}{192}, -\frac{2187}{6784}, \frac{11}{84}, 0\right)$，4 次の重み $\hat b = \left(\frac{5179}{57600}, 0, \frac{7571}{16695}, \frac{393}{640}, -\frac{92097}{339200}, \frac{187}{2100}, \frac{1}{40}\right)$．5 次の解 $\mathbf{y}_5$ で進め，4 次の解 $\mathbf{y}_4$ との差で誤差を見積もる：
   $$E = \max_i\frac{|y_{5,i} - y_{4,i}|}{\text{atol}_i + \text{rtol}\cdot\max(|y_{n,i}|, |y_{5,i}|)}$$
   $E \le 1$ なら受理し，次の刻みを $\Delta t\cdot\min\left(2.5, \max\left(0.2,\ 0.9E^{-1/5}\right)\right)$ とする．$E > 1$ なら同じ係数で縮めてやり直す．段の状態で右辺が有限でない（例：段の状態の圧力が負）と $E$ が数でなくなる．そのときは受理せず，係数 $0.2$ で縮めてやり直す（この規則が無いと係数も数でなくなり，刻みが NaN のまま受理されていた．REQ-13 の 9）．刻みの上限は $\min\left(\frac{0.5^\circ}{\max(\omega, \omega_{\min})},\ 10^{-3}\ \text{s}\right)$．rtol は設定（$10^{-4}$，$10^{-5}$，$10^{-6}$，既定 $10^{-5}$）．やり直しが 13 回続くか，刻みが $10^{-8}\ \text{s}$ を下回ったときは，誤差が許容を超えていても受理し，その回数を数える（**強制受理**）．
   * 絶対許容誤差 $\text{atol}_i$（SI）：$\theta$：$10^{-6}$，$\omega$：$10^{-3}$，$p$，$p_{\text{in}}$，$p_p$，$p_{pe}$，$p_{te}$：$1$，$m$，$m_u$，$m_{b,\text{in}}$，$m_{b,p}$：$10^{-9}$，$T_w$：$10^{-4}$，$\dot m_r$，$\dot m_e$：$10^{-6}$，$E_{\text{in}}$，$E_p$：$10^{-6}$．
3. **補助積分**：$\mathbf{z}$（§2.3）は，$\mathbf{y}$ と同じ段の値と重みで積分する（RK4 は $\frac16(1, 2, 2, 1)$，DOPRI5 は $b$）．$\mathbf{z}$ は誤差の見積もりに含めない．これにより，サイクルの集計は $\mathbf{y}$ と同じ次数になり，保存則（質量，既燃ガス，余剰エンタルピー，エネルギー）の検査式は Runge–Kutta の各ステップで丸め誤差の範囲で成り立つ．
4. **イベント**：次の角度では右辺が折れるか，状態の記録や切替が起きる．ステップは，これらの角度を**またがず，ちょうどその角度で終わる**ようにする．
   * サイクルの終端 $\theta = 4\pi$，吸気弁の開閉（IVO，IVC），排気弁の開閉（EVO，EVC），点火（$\theta = 2\pi - s$）
   * 手順：次のイベントまでの角度 $d$ が，予定の刻みで進む角度以下なら，刻みを $\Delta t = d/\omega$ とする．ステップ後の角度の残差 $\delta = \theta_e - \theta_{n+1}$ が $|\delta| > 10^{-9}\ \text{rad}$ なら $\Delta t \leftarrow \Delta t + \delta/\omega_{n+1}$ として同じ始点からやり直す（最大 4 回）．
   * イベントでの処理は，**そのステップの終端の状態**（同じ時刻の $p$，$V$，$T$，$m_u$）で行う：IVC では基準状態 $(p_r, V_r, T_r)$（SPEC-08）と $m_{u,\text{trapped}}$ と $x_r$ を記録，点火では SPEC-07 の $\theta_0$，$\Delta\theta_b$，$Q_{\text{in}}$ を計算，サイクルの終端では集計（SPEC-14）・点火時期の更新（SPEC-12）・$p_{\max}$ の更新（SPEC-10）を行い，$\theta \leftarrow \theta - 4\pi$ とする．
   * $\omega = 0$ ではイベントの処理をしない．設定の変更で角度が動いたイベントは，次にその角度に達したときに処理する．
5. **筒内最高圧**：ステップ点の圧力が極大になった点と前後の点（角度 $\theta_{-}, \theta_0, \theta_{+}$，圧力 $p_{-}, p_0, p_{+}$）を通る放物線の頂点の値を，そのサイクルの $p_{\max}$ の候補とし，候補の最大を取る．
6. **制御入力の保持**：ECU と動力計の状態（$\bar N$，$I_\alpha$，$I_T$，$T_{\text{dyno}}$，$\alpha$，$T_c$）は，ステップの終わりにそのステップの刻み $\Delta t$ で更新し，ステップの間は一定とする（積分は陽的 Euler，一次遅れは指数形）．制御の離散化の周期はソルバの刻みである．
7. **射影**：ステップの後で，丸めによる非物理的な値を防ぐために次の下限・上限を適用し，適用した回数を数える：$m \ge 10^{-7}\ \text{kg}$，$0 \le m_u \le m$，$p, p_p, p_{pe}, p_{te} \ge 1\ \text{kPa}$，$m_{b,\text{in}}, m_{b,p}, E_{\text{in}}, E_p \ge 0$，$\omega \ge 0$．**通常の運転では一度も適用されないこと**を要件とする．第26版で次のとおり改めた：成分の質量（$m_{b,\text{in}}$，$m_{b,p}$ と，SPEC-29，30 の $m_f$，$m_{bf}$，$m_l$，$m_{f,\text{in}}$，$m_{f,p}$）は $0$ で切り（$m_f \le m_u$ も同じ），その成分の絶対許容誤差（$m_{b,\text{in}}$，$m_{b,p}$，$m_{f,\text{in}}$，$m_{f,p}$：$10^{-9}\ \text{kg}$，$m_f$，$m_{bf}$，$m_l$：$10^{-10}\ \text{kg}$）より下へ出たときだけ回数に数える（流れの向きが変わるステップでは，誤差の許容の範囲で $0$ をわずかに下回ることがある．$m_f \le m_u$ は $10^{-12}\ \text{kg}$ を超えたときに数える）．数える閾値は，はじめ一律に $-10^{-12}\ \text{kg}$ としていた（実測で $-10^{-14}\ \text{kg}$ 程度だったため）．排気弁径の既定を $32\ \text{mm}$ にすると，冷始動（CS0）の始動直後に $m_{f,p}$ が $-4.1 \times 10^{-11}\ \text{kg}$ になり，TEST-13 項目 7 が FAIL した．これは絶対許容誤差 $10^{-9}\ \text{kg}$ の範囲の中の積分の誤差なので，閾値を許容誤差にそろえた（判定の緩和．値の切り方は変えていない）．化学平衡のモデルでは $E_{\text{in}}, E_p \ge 0$ を適用しない（直噴の気化で筒内が $T_{\text{in}}$ より冷えると，吸気弁の逆流が負の余剰を運ぶ）．

#### 系の硬さと刻みの上限
最も硬いのは，弁が開いていて弁の前後の圧力がほぼ等しいときの，筒内とポートの間のやりとりである（SPEC-04 の直線部の傾きによる）．その速さは弁の有効開口面積に比例する．周期定常のサイクルに沿ったヤコビアン $\frac{\partial\mathbf f}{\partial\mathbf y}$ の固有値の絶対値の最大（$1^\circ$ ごとに差分でヤコビアンを作り，べき乗法で求めた値．`tools/dev/stiff.js`．第42版の機関の列は $2^\circ$ ごと）は次のとおりである．大きい値は，弁の前後の圧力がほぼ等しい狭い区間でだけ現れるので，調べる角度がその区間に当たるかどうかで値が変わる．

| 条件 | $\max\lvert\lambda\rvert$ [1/s] | 場所 | 第42版の機関（弁 1 個ずつ $38$／$32\ \text{mm}$，消音器）での値 |
| :--- | ---: | :--- | ---: |
| アイドル | $2.6 \times 10^4$（TEST-13 項目 10 の S2，$10^\circ$ ごとでは $9.2 \times 10^4$，$120^\circ$：吸気行程） | $711^\circ$ | $5.2 \times 10^4$ |
| 全開 $1000\ \text{rpm}$（回転数固定） | $1.00 \times 10^5$ | $648^\circ$（排気行程） | $6.7 \times 10^4$ |
| 全開 $3000\ \text{rpm}$（回転数固定） | $1.06 \times 10^5$ | $652^\circ$（排気行程） | $3.5 \times 10^4$ |
| 全開 $5000\ \text{rpm}$（回転数固定） | $2.4 \times 10^4$ | $220^\circ$ | – |
| $2000\ \text{rpm}$ 部分負荷（開度 $15^\circ$） | $9.0 \times 10^4$ | $636^\circ$ | $6.8 \times 10^4$ |

RK4 の実軸上の安定限界は $|\lambda|\Delta t \le 2.79$ である．4 弁にして弁の面積が吸気で $1.41$ 倍，排気で $1.32$ 倍になり（SPEC-03），$\max|\lambda|$ が最大 $1.06 \times 10^5\ \text{1/s}$ になったので，$\Delta t_{\max}$ を $3 \times 10^{-5}$ から $2 \times 10^{-5}\ \text{s}$（$|\lambda|\Delta t \le 2.1$）に改めた．$3 \times 10^{-5}\ \text{s}$ のままだと $|\lambda|\Delta t = 3.2$ で安定限界を超える：TEST-13 項目 10 が $2.83$ で FAIL し，項目 3 の RK4 の $p_{\max}$ と図示仕事が参照解から $0.2\%$，$0.5\%$ ずれた（基準 $0.1\%$）．DOPRI5 は誤差制御が刻みを安定限界の内側に保つ．

#### 仮定と限界
* 上の表は既定の機関の値である．弁径と最大リフトを大きくする（例：弁径 $50\ \text{mm}$（上限で $35.6\ \text{mm}$），リフト $14\ \text{mm}$ の全開 $3000\ \text{rpm}$ で $\max|\lambda| = 2.3 \times 10^5\ \text{1/s}$），吸気ポートや排気管の容積を小さくする，といった設定では，RK4 の安定の条件を超えることがある（SPEC-04 の直線部の中での有界な振動になり，精度が落ちる）．そのような設定では既定の DOPRI5 を使う．
* DOPRI5 の刻みは，ほとんどのステップで上限 $0.5^\circ$ に張り付く．rtol を変えても刻みの数と結果はほとんど変わらない（精度を決めているのは上限とイベントの扱いである）．
* 燃焼の開始と終了（Wiebe 関数の端）はイベントにしていない．$m_w = 0$ では熱発生率がそこで不連続になる．

* **出典**：[J. R. Dormand and P. J. Prince, *J. Comput. Appl. Math.* 6, 19–26 (1980)](https://doi.org/10.1016/0771-050X(80)90013-3)

---

### SPEC-14：性能の指標と基準サイクル（REQ-14）

#### 定義と式
1 サイクルの間の補助積分の増分を $\Delta$ で表し，サイクルの所要時間を $t_c$ とする．

| 指標 | 定義 |
| :--- | :--- |
| 正味の図示仕事，圧縮膨張の図示仕事 | $W_{i,\text{net}} = \Delta W = \oint p\,dV$，$W_{i,\text{gross}} = \Delta W_g$（$\pi \le \theta < 3\pi$） |
| 図示平均有効圧，ポンプ損失平均有効圧 | $\text{IMEP} = \frac{W_{i,\text{net}}}{V_d}$，$\text{PMEP} = \frac{W_{i,\text{net}} - W_{i,\text{gross}}}{V_d}$ |
| 摩擦・補機の平均有効圧 | $\text{FMEP} = \frac{\Delta W_f}{V_d}$，$\text{AMEP} = \frac{\Delta W_a}{V_d}$ |
| 正味平均有効圧，軸トルク，軸出力 | $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$，$T_b = \frac{\text{BMEP}\cdot V_d}{4\pi}$，$P_b = \frac{\text{BMEP}\cdot V_d}{t_c}$ |
| 図示出力，機械効率 | $P_i = \frac{W_{i,\text{net}}}{t_c}$，$\eta_m = \frac{\text{BMEP}}{\text{IMEP}}$ |
| 動力計の平均トルク | $\overline{T_{\text{dyno}}} = \frac{\Delta W_d}{4\pi}$ |
| 空気量，燃料量 | $m_{\text{air}} = \frac{m_{u,\text{trapped}}}{1 + \phi/\text{AF}_{st}}$，$m_f = \frac{\phi\,m_{\text{air}}}{\text{AF}_{st}}$，$\dot m_f = \frac{m_f}{t_c}$ |
| 体積効率 | $\eta_v = \frac{m_{\text{air}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{RT_{\text{amb}}}$（化学平衡のモデルでは，$m_{\text{air}}$ は IVC の時点の筒内の未燃の空気 $m_{a,\text{IVC}}$，$\rho_{\text{atm}}$ の気体定数は $R_a$） |
| 図示熱効率，正味熱効率，正味燃料消費率 | $\eta_i = \frac{W_{i,\text{net}}}{m_f H_u}$，$\eta_b = \frac{P_b}{\dot m_f H_u}$，$\text{bsfc} = \frac{\dot m_f}{P_b}$ [g/kWh] |
| 残留ガス率 | $x_r = 1 - Y_u$（IVC の時点） |
| 最高圧，最高温度 | $p_{\max}$（SPEC-13 の補間），$T_{\max}$（ステップ点の最大） |
| 各断面の平均流量 | $\frac{\Delta M_k}{t_c}$（$k$：th，r，in，ex，e，t） |
| 排気背圧，排気ポート圧の脈動幅 | $\Delta\bar p_{\text{ex}} = \frac{\Delta P_{pe}}{t_c} - p_{\text{atm}}$，1 サイクルの排気弁の下流圧の最大と最小の差 |
| 吸気管の既燃率 | $\bar Y_{b,\text{in}} = \frac{\Delta\Upsilon}{t_c}$ |
| CA50，点火時期 | SPEC-12 |

* 発熱の分母は供給した燃料の発熱量 $m_f H_u$ とする（燃え残りと燃焼効率の損失が効率に現れる）．
* ポンプ損失は IMEP に含まれ，FMEP には含めない．
* **表示の規則**：指標は，完爆後に完了したサイクルの値だけを表示する．始動中・停止中・最初のサイクルの完了前と，定義の分母が $0$ 以下のときは「–」を表示する．$\eta_v$，$\eta_i$，$\eta_m$，$\eta_b$ は $[0, 1.5]$ の外の値を表示しない．$P_b \le 0$ では bsfc と $\eta_b$ を「–」とする．
* **10 サイクル平均**：サイクルごとの指標は，完爆後の直近 10 サイクル（満たないときは完爆後の全サイクル）の算術平均を表示する．瞬時値である $\bar N$，$T_w$，$\alpha$，$p_{\text{in}}$，瞬時の $T_{\text{dyno}}$ と動力計の出力，点火時期は現在の値を表示する．コールドリセット，停止，エンストで平均をやり直す．
* **表示する項目と名称**（運転タブ．配置は SPEC-15）：
  * 1 ページ目：平均回転数 $\bar N$，図示平均有効圧 IMEP，ポンプ損失平均有効圧 PMEP，図示熱効率 $\eta_i$，図示出力 $P_i$，体積効率 $\eta_v$，残留ガス率 $x_r$，最高筒内圧 $p_{\max}$（MPa，小数 2 桁．ほかの圧力の指標は kPa，整数），最高ガス温度 $T_{\max}$，壁温 $T_w$，スロットル開度 $\alpha$，吸気管圧 $p_{\text{in}}$
  * 2 ページ目：燃料流量 $\dot m_f$，軸トルク $T_b$，軸出力 $P_b$，正味平均有効圧 BMEP，摩擦平均有効圧 FMEP，機械効率 $\eta_m$，正味燃料消費率 bsfc，正味熱効率 $\eta_b$，動力計トルク $T_{\text{dyno}}$（「吸収」「駆動」と絶対値．SPEC-11 の 7），動力計出力 $P_{\text{dyno}} = \lvert T_{\text{dyno}}\,\omega\rvert$，吸気管既燃率 $Y_{b,\text{in}}$，点火時期（°BTDC）
  * 各項目は既定で記号を示し，その項目をタップすると日本語名に切り替わり，もう一度タップすると記号に戻る（項目ごと．何度でも）．値は描画フレームごとに更新するが，項目の要素は作り直さず文字だけを書き換える（押している間に要素が DOM から外れるとタップが届かないため）．

* **出典**：Heywood (1988) Ch. 2．

---

## 5. 性能曲線と最適化

画面だけの章（SPEC-15〜19，22，23，31）と，この節の章の画面の節は，画面の文書（`docs/gui.md`）にある．

**SPEC-15〜19** は画面の文書（`docs/gui.md`）にある．

---

**SPEC-22，SPEC-23** は画面の文書（`docs/gui.md`）にある．

---

### SPEC-26：性能曲線タブ（回転数に対する特性の計測）（REQ-26）

#### A. 計測の条件
1. **設定の複製**：計測を始めた時点の設定（適用済みの値）を複製した独立の `EngineCore` で計算する．運転中の機関の状態と設定は変えない．
2. **スロットル開度**：$10, 20, \dots, 90^\circ$ から，計測の前に複数を選ぶ（既定は $90^\circ$，$50^\circ$，$10^\circ$）．大きい開度から順に計測する．少なくとも 1 つは選ばれている．
3. **固定する条件**：点火は自動最適化 ON，サイクル変動 OFF，壁温は固定（$\gamma$ のモデルでは $360\ \text{K}$，化学平衡のモデルでは設定の壁温．既定で同じ値．暖機後を想定．壁の熱容量の時定数は約 $100\ \text{s}$ で，点ごとに整定を待てないため）．
4. **回転数の保持**：理想的な速度一定の動力計とみなし，回転数を固定する（SPEC-10）．軸トルクは SPEC-14 の $T_b$．計測の機関は，初めから完爆済み（SPEC-10 の 6）として扱う（スターターを切り，運転中の制御則と点火時期の自動最適化を使う）．$N_{\text{fire}}$ より低い点も，始動の途中ではなく運転中の機関として計算するためである．エンストの判定（SPEC-10 の 6）は通常どおり行い，計測中に燃料が OFF になった点は「エンスト」として記録して，その点の計算をやめ，グラフに描かない（次の点では機関をかけ直す．手順が「往復」のときは上りと下りのどちらかでエンストになった点を，「独立」のときはその点を，エンストとする）．回転数を固定しているので，$150\ \text{rpm}$ 未満の点（刻み $25$，$100\ \text{rpm}$ のときの $25$〜$125$，$100\ \text{rpm}$）がエンストになる．
5. **回転数の点**：刻み $\Delta N = 25$，$100$，$250$，$500\ \text{rpm}$ に対して，$N_k = k\,\Delta N$（$k = 1, 2, \ldots, 7000/\Delta N$．280，70，28，14 点）．既定は $250\ \text{rpm}$．$N = 0$ はクランクが回らずサイクルが完了しないので点にしない（グラフの横軸は $0$ から描く）．
6. **収束の判定**（数値はコードの定数表を唯一の情報源とし，「前提」の画面にもそこから書き出す）：完爆後の直近 3 サイクルの各量の幅（最大 − 最小）で判定する．
   * 厳しさ：「標準」は $T_b$ の幅 $\le 0.3\%\,|T_b| + 0.02\ \text{N·m}$，MBT 点火時期の幅 $\le 0.3^\circ$，最少サイクル数の初期値 4．「厳格」（既定）は $0.1\%\,|T_b| + 0.01\ \text{N·m}$，$0.1^\circ$，最少サイクル数の初期値 6．
   * 流量・状態量の判定（ON／OFF，既定 ON）：同じ 3 サイクルで，$\eta_v$，サイクル平均のスロットル流量，サイクルの終端の吸気管圧の幅が，それぞれの平均の $0.3\%$（標準）または $0.1\%$（厳格）以下．
   * **サイクル数の最少 $n_{\min}$ と最多 $n_{\max}$**（数えるのは完爆後に完了したサイクル）：判定は $n \ge n_{\min}$ になってから行う（$n_{\min} \ge 3$ は幅を取る 3 サイクルを確保するため）．$n_{\max}$ サイクルで判定を満たさない点は「未整定」として白抜きの印で描き，最後のサイクルの値を採る．失火などで完爆後のサイクルが数えられない場合に備え，回転数の点ごとのサイクルの総数（完爆前を含む）が $2n_{\max}$ に達したときも打ち切る．
   * $n_{\min}$：$3$〜$30$，刻み $1$．$n_{\max}$：$10$〜$200$，刻み $10$，既定 $60$．常に $n_{\min} \le n_{\max}$（$n_{\min}$ の `[+]` は $n_{\min} = n_{\max}$ で，$n_{\max}$ の `[−]` は $n_{\max} - 10 < n_{\min}$ で無効）．厳しさを選ぶと $n_{\min}$ をその厳しさの初期値にする．
7. **手順**：「上り」（既定．低回転から順に，各点は前の点の状態から続ける），「往復」（上りに続けて下りも計測し，各点で平均を採る．両者の差の最大を完了の表示に出す），「独立」（各点を，その回転数で単独に始める）．
8. **記録する量**：$N$，$T_b$，$P_b$，BMEP，$\eta_v$，bsfc，$\eta_b$，MBT 点火時期，$x_r$，排気背圧，整定の可否，使ったサイクル数，判定に使った各量の幅．

#### B. 画面
画面の文書（`docs/gui.md`）の 3 節「SPEC-26 B」にある．

#### C. 実行
1. 計測は時間を分けて実行し（1 フレームあたり $8\ \text{ms}$ 以内），運転中の機関の実時間の進行を妨げない．
2. 既定（3 開度 × 28 点，厳格，流量・状態量の判定 ON，上り）の計測の所要時間は，ヘッドレス Chromium の $360 \times 640$ で $30\ \text{s}$ 以下（2026-11-17 に利用者の指示で緩めた．開発用の計算機が遅くなり，7 通りのうち数通りで上限を数 % 超えたため．総所要時間の上限を $180 \to 240\ \text{s}$ にしたのと同じ比率に余裕を足した値．要件定義書 7.4 節の 16）．

---

**SPEC-31** は画面の文書（`docs/gui.md`）にある．

---

### SPEC-32：最適化（バルブタイミング）（REQ-32）

#### A. 画面
画面の文書（`docs/gui.md`）の 3 節「SPEC-32 A」にある．

#### B. 評価
1. **基準の状態**：`[探索]` を押した時点の運転中の機関を複製し，次のように固定する：角速度 $\omega = \frac{\pi\bar N_0}{30}$（$\bar N_0$：その時の平均回転数），スロットル開度 $\alpha_0$（その時の値．動力計制御として扱い，開度を保つ），壁温（その時の値），サイクル変動なし，点火時期の自動最適化 ON，完爆済み．機関が回っていない（完爆前，または $\bar N_0 < 300\ \text{rpm}$）ときは探索しない．
2. **1 回の評価**：弁時期 $\mathbf x = (\text{IVO}, \text{IVC}, \text{EVO}, \text{EVC})$（°，整数）を設定し，サイクルを回して周期定常の判定（3）を満たした最後のサイクルの値を目的の値 $J(\mathbf x)$ とする：軸トルク $T_b$［N·m］，または正味熱効率 $\eta_b = \frac{P_b}{\dot m_f H_u}$．始めの状態は，モンテカルロの段では基準の状態，勾配と仕上げの段では直前に評価した点の終わりの状態（温めた状態）とする．
3. **周期定常の判定**：直近 3 サイクルで，$T_b$ の幅が $\epsilon_r|T_b| + \epsilon_a$ 以下，点火時期の幅が $\epsilon_s$ 以下，体積効率・スロットルの流量・吸気管圧の幅がそれぞれ平均の $\epsilon_r$ 倍以下．モンテカルロの段は $\epsilon_r = 10^{-3}$，$\epsilon_a = 0.01\ \text{N·m}$，$\epsilon_s = 0.1^\circ$（性能曲線の「厳格」と同じ），勾配と仕上げの段は $\epsilon_r = 10^{-4}$，$\epsilon_a = 10^{-3}\ \text{N·m}$，$\epsilon_s = 0.01^\circ$．最少 4 サイクル，最多 30 サイクル（最多に達したら判定を満たさないまま，その値を使い，その回数を数えて表示する）．
4. **制約**：作用角 $\text{IVC} - \text{IVO}$，$\text{EVC} - \text{EVO}$ が $1^\circ$ 以上 $719^\circ$ 以下で，VALVE HIT（SPEC-03 の干渉）にならないこと．満たさない点は評価せず，$J = -\infty$ とする．設定の項目の範囲には縛られない．
5. 同じ点は 2 度評価しない（値を覚えておく）．

#### C. 探索
変数は整数の $\mathbf x \in \mathbb Z^4$（°）．$\mathbf x_0$ を探索の前の弁時期とする．乱数は種を固定した擬似乱数（SPEC-21 と同じ mulberry32．種 $20261119$）．
1. **始点**：$J(\mathbf x_0)$ を評価する．
2. **モンテカルロ**：$\mathbf x_0$ を中心に，各成分に独立な正規乱数（標準偏差 $20^\circ$ を 24 点，$60^\circ$ を 8 点）を加えて丸めた 32 点を評価する（制約を満たさない点は引き直す．同じ点も引き直す）．
3. **始点の選択**：評価した点（$\mathbf x_0$ を含む）を $J$ の大きい順に並べ，互いの各成分の差の最大が $8^\circ$ 以上離れた上位 2 点を，勾配の段の始点とする．
4. **勾配**（有限差分）：始点ごとに，差分の幅 $h = 4^\circ$ から始めて，中心差分 $g_k = \frac{J(\mathbf x + h\mathbf e_k) - J(\mathbf x - h\mathbf e_k)}{2h}$ で勾配を求め，向き $\mathbf d = \mathbf g/\lVert\mathbf g\rVert_\infty$ に沿って，歩幅 $t$（初め $8^\circ$．$16, 8, 4, 2, 1^\circ$ の順に，前の成功の 2 倍から試す）の点 $\text{round}(\mathbf x + t\mathbf d)$ を評価し，$J$ が増えた最初の点へ移る．どの歩幅でも増えなければ $h$ を半分にする（$4 \to 2$）．$h = 2^\circ$ でも増えなければその始点を終える．1 つの始点で 20 回まで移る．
5. **$1^\circ$ の仕上げ**：勾配の段で最も良かった点から，4 成分のそれぞれを $\pm 1^\circ$ ずらした 8 点を評価し，最も増えた点へ移ることを，増えなくなるまで繰り返す．終わった点は $1^\circ$ 単位の局所最大である（8 近傍のどれも大きくない）．
6. **打ち切り**：評価が 400 回に達したら，それまでの最良の点で終える．`[中止]` でもそれまでの最良の点を結果とする．
7. **結果**：最良の点 $\mathbf x^*$，$J(\mathbf x^*)$，$J(\mathbf x_0)$，評価の回数（段ごと），周期定常の判定を満たさなかった回数，所要時間．

#### D. 仮定と限界
* 回転数と開度を固定した評価なので，探索の結果は「その運転点の最適」である．スロットル制御で運転しているときは，結果を適用すると，同じ回転数を保つために ECU が開度を変える．
* $J$ は整数の格子の上の関数で，弁の開閉のイベントの角度でステップが切れるので，$1^\circ$ の差の中では滑らかでないことがある．勾配は $h \ge 2^\circ$ の中心差分で求め，$1^\circ$ の局所最大は差分ではなく 8 近傍の直接の比較で確かめる．
* モンテカルロの点の数と分布は，計算時間との釣り合いで決めた．大域最大である保証は無い．

### SPEC-33：熱効率の損失の内訳（REQ-33）

#### A. 求め方
運転中の機関を複製し，角速度をその時の $\bar N$ に，壁温をその時の値に固定し，サイクル変動を無しにして，次のサイクルの終わりまで進める．その次の 1 サイクルを「実際のサイクル」とする．実際のサイクルの吸気弁が閉じた時点（IVC）で機関をもう一度複製し，3 つの**閉じた系の再計算**の始めの状態とする．再計算では，両方の弁を閉じたまま（リフト $0$），角速度を固定して，下死点 $\theta = 540^\circ$ まで進める．点火の処理はせず，燃焼の定数（$\theta_0$，$\Delta\theta_b$，$m_w$，$m_{u,\text{trapped}}$）を与える．「3 つ」は燃焼と熱伝達の条件の数で，瞬時燃焼は既燃ガスの物性を替えて 2 回行う（段 F，FA）ので，再計算は 4 回である．

| 段 | 条件 | 熱効率 |
| :--- | :--- | :--- |
| 理論 | オットーサイクル（空気標準，$\gamma = 1.4$） | $\eta_O = 1 - \varepsilon^{1 - \gamma}$ |
| A | 空気標準（$\gamma = 1.4$，$R = 287\ \text{J/(kg·K)}$），IVC の実際の質量と温度から，上死点で燃料の熱 $Q_f$ を等容で加え，$540^\circ$ まで等エントロピーで膨張 | $\eta_A$ |
| U | 空気標準（段 A と同じ）で，加える熱を実際に燃えた燃料の分 $\xi Q_f$ にする | $\eta_U = \eta_A(\xi)$ |
| F | 再計算：断熱，上死点で瞬時に燃焼（$\theta_0 = 359^\circ$，$\Delta\theta_b = 2^\circ$）．既燃ガスは**解離の無い組成**（$T_{nd} = 1000\ \text{K}$ の平衡組成 ＝ 完全燃焼の生成物に固定）で，比熱は温度の関数（NASA 多項式） | $\eta_F$ |
| FA | 再計算：F と同じ条件で，既燃ガスを化学平衡（実際の熱物性）にする | $\eta_{FA}$ |
| t | 再計算：実際の熱物性，断熱，実際の燃焼 | $\eta_t$ |
| h | 再計算：実際の熱物性，実際の壁面熱伝達，実際の燃焼（排気弁が開くまでは実際のサイクルと同じ計算） | $\eta_h$ |
| g | 実際のサイクルの図示仕事（圧縮と膨張の行程，$180$〜$540^\circ$） | $\eta_{ig} = W_g/Q_f$ |
| i | 実際のサイクルの正味の図示仕事 | $\eta_i = W/Q_f$ |

* 燃料の熱 $Q_f = m_f H_u$（$m_f$：そのサイクルの燃料の質量．SPEC-14 の図示熱効率と同じ定義）．
* **燃えた燃料の割合** $\xi = \dfrac{\eta_c\,\Delta m_{bf}}{m_f}$：$\Delta m_{bf}$ は，IVC から排気弁が開くまでに既燃の側へ移った燃料の質量（状態 $m_{bf}$ の増分．弁が閉じている間は $\frac{dm_{bf}}{dt} = r\psi$．SPEC-29 B），$\eta_c = 0.97$ は燃焼効率．$\xi < 1$ になるのは，$\eta_c$ と，燃え終わるまでに気化しなかった燃料（SPEC-30）と，Wiebe 関数が $1 - e^{-a}$ で終わることによる．
* **瞬時燃焼の段の換算**：段 F，FA は上死点で瞬時に燃やすので，その時点までに気化した燃料しか燃えず，燃えた燃料の割合 $\xi_F$，$\xi_{FA}$ が実際の $\xi$ と違う（高回転で小さくなる）．そこで，再計算の熱効率 $\eta_X^{\text{raw}} = \frac{W_{180 \to \text{IVC}} + \int p\,dV|_X}{Q_f}$ を，同じ熱を加えた空気標準との比にして，実際の $\xi$ の空気標準に掛ける：$\eta_X = \eta_U\,\dfrac{\eta_X^{\text{raw}}}{\eta_A(\xi_X)}$（$X = F, FA$）．段 t から後は実際の燃焼なので換算しない．
* 段 F の間だけ，既燃ガスの物性の表（SPEC-29 A）を，組成を $T_{nd}$ の平衡に固定した表に替える（内部エネルギーと比熱は温度の関数，気体定数は一定）．
* 段 A，FA，t，h の熱効率は，$180^\circ$ から IVC までの実際の仕事 $W_{180 \to \text{IVC}}$ と，IVC から $540^\circ$ までのその段の仕事の和を $Q_f$ で割る：$\eta_X = \frac{W_{180 \to \text{IVC}} + \int_{\text{IVC}}^{540^\circ}p\,dV\big|_X}{Q_f}$．
* 段 A の仕事：$T_1$，$m$，$V_1$ を IVC の筒内の温度，質量，容積とし，$c_v = \frac{R}{\gamma - 1}$ として
  $$T_2 = T_1\left(\frac{V_1}{V_c}\right)^{\gamma - 1},\quad T_3 = T_2 + \frac{Q_f}{mc_v},\quad T_4 = T_3\left(\frac{V_c}{V_{\max}}\right)^{\gamma - 1},\quad W_A = mc_v\left[(T_3 - T_4) - (T_2 - T_1)\right]$$

#### B. 損失
**圧縮比の定義**：
* **幾何の圧縮比** $\varepsilon = \dfrac{V_c + V_d}{V_c}$（設定値．SPEC-01）．理論熱効率 $\eta_O = 1 - \varepsilon^{1 - \gamma}$ の基準で，圧縮比と膨張比がともに $\varepsilon$ のオットーサイクルに当たる．
* **有効圧縮比** $\varepsilon_c = \dfrac{V(\theta_{\text{IVC}})}{V_c}$：吸気弁が閉じた時点の容積から上死点までの容積の比．実際に閉じ込めたガスが圧縮される比である．
* **有効膨張比** $\varepsilon_e = \dfrac{V(\theta_{\text{EVO}})}{V_c}$：上死点から排気弁が開く時点までの容積の比．
* どちらも弁時期（位相を含む）とクランク機構の幾何だけで決まり，$1 < \varepsilon_c, \varepsilon_e \le \varepsilon$．$\frac{\varepsilon_e}{\varepsilon_c} > 1$（膨張比のほうが大きい）のサイクルを**ミラーサイクル**（吸気弁の早閉じ・遅閉じで圧縮比だけを下げる．リンク機構で行程を変えるものを含めてアトキンソンサイクルとも呼ぶ）という．圧縮の仕事と圧縮後の温度を下げたまま，膨張を長く取れるので，「有効圧縮比」の段は利得（負の損失）になり得る．その代わり，閉じ込める空気が減る（体積効率が下がる）．この図は燃料あたりの効率だけを示すので，出力の低下は現れない．
* **注意**：$\theta_{\text{IVC}}$，$\theta_{\text{EVO}}$ はリフトが $0$ になる（$0$ から立ち上がる）角度である．既定のカム（SPEC-03）は開閉点の近くでリフトがごく小さいので，流れが実質的に止まるのはこれより内側で，実質の圧縮比は $\varepsilon_c$ より大きい．既定の弁時期（IVC $264^\circ$，EVO $490^\circ$）で $\varepsilon_c = 6.65$，$\varepsilon_e = 8.79$（実測）と，定義の上では既に膨張比のほうが大きい．どれだけ得をしているかは，比ではなく「有効圧縮比」の段の値で読む．
* 段の名前に $\varepsilon_c$，$\varepsilon_e$ の値（小数 1 桁）を入れる：「有効圧縮比 ○（吸気弁の閉じる時期）」「有効膨張比 ○（排気弁の開く時期）」．

段の差を損失とする（%pt．負なら利得）：

| 損失 | 式 | 意味 |
| :--- | :--- | :--- |
| 有効圧縮比（吸気弁の閉じる時期） | $\eta_O - \eta_A$ | IVC が下死点より遅いことで，圧縮が IVC から始まる（吹き戻しの仕事を含む） |
| 燃え残り（燃焼効率・気化の遅れ） | $\eta_A - \eta_U$ | 燃料の一部が燃えない（$\xi < 1$） |
| 比熱比の低下 | $\eta_U - \eta_F$ | 比熱が温度とともに大きくなること（比熱比が $1.4$ より小さい），既燃ガスの組成（当量比．リッチでは CO と H$_2$ が残る），残留ガス |
| 熱解離 | $\eta_F - \eta_{FA}$ | 高温で CO$_2$ と H$_2$O の一部が CO，H$_2$，O$_2$，OH などに分かれて熱を吸い，上死点の温度と圧力が下がる．膨張で再結合して戻る熱は，上死点より大きい容積で出るので仕事になりにくい |
| 燃焼の遅れ（等容度） | $\eta_{FA} - \eta_t$ | 燃焼に時間がかかり，上死点から離れた容積で熱が出る（時間損失） |
| 冷却損失 | $\eta_t - \eta_h$ | 壁への熱伝達で失う仕事 |
| 有効膨張比（排気弁の開く時期） | $\eta_h - \eta_{ig}$ | 排気弁が下死点より前に開き，膨張の仕事を失う |
| ポンピング | $\eta_{ig} - \eta_i$ | 吸気と排気の行程の仕事 |
| 機械損失（摩擦・補機） | $\eta_i - \eta_b$ | 摩擦と補機の仕事（SPEC-10）．$\eta_b = \dfrac{W - W_f - W_a}{Q_f}$ は正味熱効率（SPEC-14．実際のサイクルの値） |

ポンピングまでの 8 つの損失の和は $\eta_O - \eta_i$ に，機械損失まで含めた和は $\eta_O - \eta_b$ に，恒等的に等しい．図では，$\eta_i$ の棒の下に機械損失の段と $\eta_b$ の棒を続ける．添える値：
* **等容度** $\eta_{glh} = \dfrac{1}{\eta_O}\displaystyle\int_0^1\left[1 - \left(\frac{V(\theta)}{V_{\max}}\right)^{\gamma - 1}\right]dx_b$（$\gamma = 1.4$．実際の燃焼の $x_b(\theta)$ で，$0.1^\circ$ ごとの台形則）．熱を容積 $V(\theta)$ で加えた空気標準のサイクルの熱効率を，燃焼の割合で平均し，上死点で加えた場合で割った値．
* **CA50**（°ATDC，SPEC-12），**壁への熱** $Q_w/Q_f$（実際のサイクルの 1 サイクルの壁面熱伝達の積分）．

#### C. 画面
画面の文書（`docs/gui.md`）の 3 節「SPEC-33 C」にある．

#### D. 仮定と限界
* 損失の分け方は，段の順序に依存する（例：冷却損失を燃焼の遅れより先に数えると値が変わる）．ここでは，理想から実際へ近づける順に並べた．
* 段 A の空気標準は，IVC の実際の温度と質量から始める．段 A は閉じたサイクルではない（始めと終わりの容積が違う）ので，$\eta_A$ は IVC の時期によって $\eta_O$ より大きくも小さくもなる．
* 燃焼の効率（γ のモデルの $\eta_c$）の段は無い．化学平衡のモデルでは，燃焼で生じる CO，H₂ などは平衡組成として物性の段に入る．
* 壁への熱 $Q_w$ のうち仕事に変わり得た分だけが冷却損失になるので，冷却損失は $Q_w/Q_f$ より小さい．

### SPEC-34：VVT マップ（REQ-34）

#### A. 画面
画面の文書（`docs/gui.md`）の 3 節「SPEC-34 A」にある．

#### B. 計算
1. **評価**：SPEC-32 B と同じ評価器で，変える項目を $\phi_{\text{in}}$，$\phi_{\text{ex}}$ にする（弁時期 IVO〜EVC は設定のまま）．軸トルク $T_b$ と正味熱効率 $\eta_b$ を同時に得る．正味の燃料消費率は $b_e = \frac{3.6 \times 10^9}{\eta_b H_u}\ \text{g/kWh}$（$H_u$ は J/kg）．
2. **格子と順序**：$\phi \in \{-40, -30, \ldots, 40\}^2$ の 81 点．段階 1（$\{-40, 0, 40\}^2$ の 9 点），段階 2（$\{-40, -20, 0, 20, 40\}^2$ の残り 16 点），段階 3（残り 56 点）の順に，各段階の中は行ごとに向きを変えて（蛇行）並べる．格子の点は粗い許容（SPEC-32 B の 3 のモンテカルロの段と同じ）で，直前の点の終わりの状態から始める（最初の点は基準の状態から）．
3. **最適点**：格子の $T_b$ 最大の点と $b_e$ 最小（$\eta_b$ 最大．$\eta_b$ が定義された点の中で．無ければ ◆ を作らない）の点から，それぞれ SPEC-32 C の 4，5 と同じ勾配と $1^\circ$ の仕上げを，2 変数で，範囲 $[-40, 40]^2$ の中で行う（細かい許容．モンテカルロの段は無い）．
4. 計算は描画のループの中で時間を区切って進める（1 フレームに $12\ \text{ms}$）．運転中の機関がなければ計算しない．

#### C. 仮定と限界
* 燃料消費率は同じ開度で比べるので，部分負荷では軸トルクとほぼ同じ形になる（REQ-34 の経緯）．同じ軸トルクでの比較（開度を合わせる）はしない．
* $10^\circ$ の格子の補間なので，マップの細部（$10^\circ$ より細かい山や谷）は表せない．★ ◆ の値は詰めた点で計算した値で，マップの色とは少し違うことがある．

### SPEC-35：シャシーダイナモメーター（REQ-35）

#### A. 車両と変速機
1. **設定**（ページ「車両」）：試験の種類（エンジン／シャシー，既定 エンジン），車重 $m_v$（乗員を含む．既定 $600\ \text{kg}$），空気抵抗係数 $C_d$（既定 $0.30$），前面投影面積 $A$（既定 $2.0\ \text{m}^2$），転がり抵抗係数 $C_{rr}$（既定 $0.012$），駆動系の効率 $\eta_d$（既定 $0.90$）．
2. **走行抵抗**：$F_{\text{res}}(v) = \tfrac12\rho\,C_d A\,v^2 + C_{rr}\,m_v g$．$\rho = \dfrac{p_{\text{atm}}}{R\,T_{\text{atm}}}$（空気の密度．設定の大気圧と $T_{\text{atm}} = 298.15\ \text{K}$．既定で $1.184\ \text{kg/m}^3$），$g = 9.80665\ \text{m/s}^2$．勾配は無い．
3. **変速機**：理想の無段変速機とする．機関の回転数を目標回転数に保ち（変速比を連続に変える），機関から受けた出力 $P_d$ を，効率 $\eta_d$ で車輪に伝える．変速の時間と変速比の範囲の制限は無い．
4. **駆動力**：車輪の駆動力は，出力から決まる値と，タイヤが伝えられる上限の小さいほうである．
   $$F_{\text{drv}}(v) = \begin{cases}\min\left(F_{\max},\ \dfrac{\eta_d P_d}{\max(v, v_0)}\right) & (P_d \ge 0) \\[2mm] \max\left(-F_{\max},\ \dfrac{P_d}{\eta_d\max(v, v_0)}\right) & (P_d < 0,\ v > 0)\end{cases}, \qquad F_{\max} = \mu_t\,m_v g$$
   $\mu_t = 0.5$（駆動輪の荷重の割合と摩擦係数の積．定数），$v_0 = 0.1\ \text{m/s}$（$v \to 0$ で出力／車速が発散するのを避ける下限）．$P_d < 0$ で $v = 0$ のときは $F_{\text{drv}} = 0$．$F_{\max}$ で頭打ちの間（発進の直後），機関の出力の残りは変速機（発進のクラッチ）の滑りで失われるとみなす．$P_d < 0$（機関を車両が回す．エンジンブレーキ）のときは，効率が逆向きに掛かる．
5. **運動方程式**：$m_v\dfrac{dv}{dt} = F_{\text{drv}} - F_{\text{res}} - F_{\text{brk}}$，$v \ge 0$（$v = 0$ で右辺が負なら $0$ のまま）．車輪と駆動系の回転の慣性は無視する．機関の回転数は一定に保たれるので，機関の慣性の項は無い．
6. **制動**：スロットル開度が $0.5^\circ$ 未満のとき，$F_{\text{brk}} = 0.5\,m_v g$（ローラのブレーキ）．それ以外は $0$．

#### B. 予測（準定常）
全開の最大軸出力 $P_{\max}$（下の 3）を使い，$P_d = P_{\max}$ で一定として，A の式から求める（$F_{\text{brk}} = 0$）．
1. **最高速度** $v_{\max}$：$g(v) = \eta_d P_{\max} - F_{\text{res}}(v)\,v$ の根．$g$ は $v > 0$ で単調に減るので，区間 $[0, 400\ \text{m/s}]$ の二分法（100 回）で求める．
2. **加速の時間**：$0$ から $v_1$ までの時間
   $$t(v_1) = \int_0^{v_1}\frac{m_v\,dv}{\min\left(F_{\max},\ \dfrac{\eta_d P_{\max}}{v}\right) - F_{\text{res}}(v)}$$
   を，$[0, v_1]$ を 2000 等分した中点則で求める（$v_0$ の下限は使わない）．被積分関数の分母が $0$ 以下になる点があれば（$v_1 \ge v_{\max}$）「届かない」とする．$0 \to 100\ \text{km/h}$ は $v_1 = \frac{100}{3.6}\ \text{m/s}$．走行抵抗が $0$ で $F_{\max} = \infty$ のとき，被積分関数は $\frac{m_v v}{\eta_d P_{\max}}$ で，$t = \frac{m_v v_1^2}{2\eta_d P_{\max}}$（中点則は 1 次式に対して厳密）．
3. **最大軸出力**：設定の全開の計測（SPEC-26．開度 $90^\circ$，刻み $500\ \text{rpm}$ の 14 点，判定は「標準」，流量・状態量の判定なし）の軸出力 $P_b$ の最大とその回転数．画面を開いたときに自動で計測し（運転中の機関の設定の複製で，描画のループの中で時間を区切って進める），計測に使う設定（SPEC-26 の古さの判定と同じ署名）が変わったら計測し直す．車両の設定の変更では計測し直さない（予測の式を計算し直すだけ）．回転数の点が粗いので，$P_{\max}$ は真の最大より小さいことがある．

#### C. 実時間の走行（試験の種類がシャシーのとき）
1. 回転数の制御は動力計制御と同じ計算（SPEC-11 の 3）で，動力計が変速機と車両の役をする：目標回転数に保つためのトルク $T_{\text{dyno}}$ が機関から受ける出力 $P_d = T_{\text{dyno}}\,\omega$ になる．設定「回転数の制御」は使わない（設定画面で不使用）．スロットル開度は設定の値（アクセル）．
2. 車速 $v$ と走行距離は，A の 5 の式を積分のステップごとに陽的 Euler で進める（機関の状態ベクトルには入れない．機関の計算に影響しない）．完爆前は進めない．試験の種類がエンジンのときは $v = 0$ とする．
3. **$0 \to 100\ \text{km/h}$ の計測**：$v = 0$ から $v > 0$ になった時刻を発進とし，$v$ が $\frac{100}{3.6}\ \text{m/s}$ を初めて超えた時刻との差（ステップの中は線形に補間）を計測値とする．$v = 0$ に戻ると，次の発進で計り直す．
4. 動力計の容量の判定（`OVERLOAD`／`UNDERPOWER`．SPEC-11 の 6）はそのまま働く．

#### D. 画面
画面の文書（`docs/gui.md`）の 3 節「SPEC-35 D」にある．

#### E. 仮定と限界
* 理想の無段変速機なので，予測は「その機関で出せる最良の値」である．段付きの変速機では，変速の時間と，回転数が最大出力の点から外れる分だけ遅くなる．
* 発進の駆動力の上限 $\mu_t m_v g$ は一定（荷重移動なし）．車輪の慣性，勾配，風は無い．
* 既定の機関は単気筒 $0.5\ \text{L}$ で，軸出力は約 $20$〜$30\ \text{kW}$ である．車重の既定はそれに合わせて軽くしてある．
* **出典**：走行抵抗と加速の式は T. D. Gillespie, *Fundamentals of Vehicle Dynamics* (SAE, 1992) Ch. 2，4 の形（版とページは未確認）．

---

## 6. エンジン音

### SPEC-21：エンジン音（REQ-21）

#### A. 音源（ウェーブテーブル）
1. 排気口を点音源とみなすと，遠方の音圧は体積流量の時間微分に比例する．これにならい，音源を排気弁の質量流量の時間微分とする：$q = \frac{d\dot m_{\text{ex}}}{dt} = \omega\frac{d\dot m_{\text{ex}}}{d\theta}$．
2. 直前に完了したサイクルの $\dot m_{\text{ex}}(\theta)$（$0.5^\circ$ 刻み，1440 点）から，中心差分で $\frac{d\dot m_{\text{ex}}}{d\theta}$ の表 $s_i$（周期境界）を作り，平均を引く．記録の無い点は $0$ とする．表はサイクルの完了ごとに更新する．
3. 再生の位相 $\psi \in [0, 1440)$ を，サンプリング周波数 $f_s$ に対し 1 サンプルごとに $\Delta\psi = \frac{1440\,\bar N_a}{120\,f_s}$ だけ進め，表を線形補間して読む．$\bar N_a$ は機関の $\bar N$ を時定数 $50\ \text{ms}$ の一次遅れで平滑した値．出力の周期は $120/\bar N_a\ [\text{s}]$ になる．
4. 音源の振幅は $q = \frac{\pi\bar N_a}{30}\,s(\psi)$．
5. 新しい表は，位相が 1 周して $0$ に戻る瞬間に切り替える．
6. $\bar N_a \le 30\ \text{rpm}$ では音源の包絡を時定数 $30\ \text{ms}$ で $0$ に下げ，残響が減衰した後は出力を厳密に $0$ にする．

#### B. 排気管の共鳴，音量，ばらつき，雑音（計算の音）
1. **共鳴**：長さ $L$，内径 $d_e$ の排気管を，弁側が閉端・出口が開放端の管とみなし，往復時間 $2L/c$ の遅延と出口での反転反射を持つ帰還型のくし形フィルタで表す：$v_k = q_k - \rho_M\,(h * v)_{k - D}$，$D = \frac{2Lf_s}{c}$．出口は大気に開いた開放端で（消音器は無い），反射は反転する．往復で弱まる分は，管内の損失（管壁の粘性・熱伝導）と開口端の放射を表すフィルタ $h$（2）と，出口の平均流による反射の減少 $\rho_M = \frac{1 - M}{1 + M}$ で表し，調整の係数（反射率）は持たない．$M = \frac{|\bar{\dot m}_{\text{ex}}|}{\rho_X A_e c}$ は出口の平均流の Mach 数（$\bar{\dot m}_{\text{ex}}$：直前のサイクルの排気弁の流量の平均，$\rho_X = \frac{p_{\text{atm}}}{RT_X}$，$A_e = \frac{\pi}{4}d_e^2$．上限 $0.5$）で，表と同時に更新する．$\rho_M$ は低い Mach 数の流れの出る開放端の反射の大きさの近似（推定．文献の式の確認はしていない）．既定の機関では $M$ はアイドルで約 $0.002$，$1500\ \text{rpm}$ の部分負荷で約 $0.019$，全開 $3000\ \text{rpm}$ で約 $0.047$ である．音速は $c = \sqrt{\gamma_b(T_X)\,R\,T_X}$（$T_X = 800\ \text{K}$．SPEC-02 の既燃ガス）$\approx 550.7\ \text{m/s}$．共鳴は $f_n = \frac{(2n - 1)c}{4L}$（既定 $L = 1\ \text{m}$ で $f_1 \approx 138\ \text{Hz}$），極小は $\frac{nc}{2L}$，極大と極小の比は $\frac{1 + g}{1 - g}$（$g = |H(f)|$）．
2. **管内の損失**：往復の振幅の減衰を，管壁の粘性・熱伝導（Kirchhoff）と開口端の放射の積とする：
   $$|H(f)| = \exp\left(-2\alpha_w L - \frac{(ka)^2}{2}\right), \quad \alpha_w = \frac{\sqrt{\pi f\nu}}{a\,c}\left(1 + \frac{\gamma_a - 1}{\sqrt{Pr}}\right), \quad k = \frac{2\pi f}{c},\ a = \frac{d_e}{2}$$
   $\nu = 8.4 \times 10^{-5}\ \text{m}^2/\text{s}$，$Pr = 0.7$，$\gamma_a = 1.35$（音響の損失の定数）．これを，利得 $g$ の一次の低域フィルタ $y_k = g(1 - b)x_k + b\,y_{k - 1}$（$|h| = \frac{g(1 - b)}{|1 - be^{-i\omega}|}$）で近似し，$g$ と $b$ を，基本の共鳴 $f_1 = \frac{c}{4L}$ と $1\ \text{kHz}$ の 2 点で $|h| = |H|$ となるように決める（$\frac{|h(f_1)|}{|h(1\ \text{kHz})|} = \frac{|H(f_1)|}{|H(1\ \text{kHz})|}$ を $b$ について二分法で解き，$g$ を 1 kHz で合わせる．$f_1 \ge 1\ \text{kHz}$ では $g = 1$ として 1 kHz だけで合わせる）．既定の $L = 1\ \text{m}$，$d_e = 40\ \text{mm}$ で $b = 0.770$，$g = 0.954$，$|H(f_1)| = 0.952$．（1 kHz の 1 点だけで合わせると，$f_1$ で $|h| = 0.996$ と損失が小さすぎる．）フィルタの低域の群遅延 $b/(1 - b)$ サンプルを $D$ から引き，$D$ の小数部は線形補間する．基本の共鳴の残響は，往復ごとに $g_1 = |h(f_1)|\rho_M$ 倍に減る（既定，$M = 0$ で $1\%$ まで約 $0.34\ \text{s}$．直管の鳴り）．
3. **音量の制御（圧縮器）**：入力 $x_c = g_c v$（$g_c = 0.064$） のピークの包絡 $e_p$ を即応で立ち上げ，$0.2\ \text{s}$ 保持した後，時定数 $0.3\ \text{s}$ で戻す（入力が包絡の $99.9\%$ 以上なら保持を更新）．利得 $G = \min\left(1, (l_t/e_p)^{1 - 1/R_c}\right)$，$l_t = 0.35$，$R_c = 4$．出力は $u = 1.6\,V\,G\,x_c$（$V$：音量）に対し，$|u| \le 0.8$ では $y = u$，$|u| > 0.8$ では $y = \text{sgn}(u)\left(0.8 + 0.2\tanh\frac{|u| - 0.8}{0.2}\right)$（$|y| < 1$）．保持の $0.2\ \text{s}$ はアイドルの爆発間隔より長いので，定常では 1 サイクルの中で利得が一定になる．
4. **サイクルのばらつき**（設定「燃焼」のサイクル変動が ON のとき）：位相が 1 周するごとに，一様乱数 $z_1, z_2$（平均 $0$，分散 $1$，種を固定）で振幅係数 $A_j = 1 + 0.03z_1$，周期 $P_j = \frac{120}{\bar N}(1 + 0.005z_2)$ とする．振幅係数はサイクルの中で前の値から線形に移す．OFF では厳密に周期的．
5. **流れの雑音**：弁の質量流量の絶対値の表 $e(\psi) = |\dot m_{\text{ex}}|$ を使い，音源に $q_n = F\,A_n\left(\frac{e(\psi)}{e_{\text{ref}}}\right)^2 w_{\text{bp}}$ を加える（$A_n = 40$，$e_{\text{ref}} = 0.05\ \text{kg/s}$，$F$：設定の流れ雑音，既定 $40\%$）．$w_{\text{bp}}$ は分散 $1$ の一様白色雑音（種を固定）を $1\ \text{kHz}$ の 2 次の高域通過と $6\ \text{kHz}$ の 2 次の低域通過（$Q = 1/\sqrt 2$）に通した信号．雑音も共鳴器を通る．

#### C. 演出の音（数値計算ではない）
設定「音響」の `[音の種類 計算／演出]`（既定：計算）で切り替える．**計算**は A・B の音．**演出**は，聞いて心地よいことを目的に作った 4 気筒風の音で，物理モデルではない．定数はすべて利用者の試聴で決めた（9 種の試聴サンプルから選ばれた「4A」）．演出は機関の計算に影響しない．

**処理の流れ**（1 サンプルごと）：

```
計算（機関モデル）                     演出（合成器 Synth）
 排気流量の表 s(ψ)，包絡 e(ψ) ─┐
 平均回転数 N̄               ─┼→ [2] 4 気筒化（位相 180° ずつ，気筒ごとの利得と遅れ）→ 音量の配分
 吸気管圧 p_in → [1] 負荷 ℓ  ─┘        │
                                       ├← [3] 雑音（1.5〜7 kHz，流量の包絡で変調）
                                       ├← [4] アクセルオフの破裂音（ℓ < 0.08，N̄ > 2200 rpm）
                                       ↓
                                    [5] 歪み → [6] 集合管の共鳴 → [7] 共鳴の付加 → [8] 明るさ
                                       ├← [9] 吸気音
                                       ↓
                                    [10] 低域の持ち上げ → 高域通過 28 Hz → 圧縮器 → 制限 → 出力
```

1. **負荷の目安**：$\ell = \text{clamp}\left(\frac{p_{\text{in}}/p_{\text{atm}} - 0.3}{0.6},\ 0,\ 1\right)$．合成器の中で一次遅れ（上昇 $40\ \text{ms}$，下降 $80\ \text{ms}$）で平滑する．
2. **4 気筒化と音量の配分**：同じ表を位相 $360k$（クランク角 $180^\circ k$，$k = 0..3$）ずつずらして 4 本読み，気筒ごとの利得 $g_k = (1, 0.98, 1.02, 1)$ と遅れ $\tau_k = (0, 0.05, 0.1, 0.05)\ \text{ms}$ を与えて足す：
   $$x = G_x\,\lambda_\ell\,\lambda_N\sum_{k = 0}^{3}g_k\,a_k\,\frac{\pi\bar N_a}{30}\,s\left(\psi(t - \tau_k) + 360k\right)$$
   $a_k$：気筒ごと・サイクルごとの振幅のばらつき（サイクル変動 ON で $1 \pm 4\%$ の一様乱数）．$G_x = 0.13/q_{\text{ref}}$，$q_{\text{ref}} = 19.28\ \text{kg/s}^2$（第26版で既定のモデルが化学平衡・直噴になり，同じ条件の音源の実効値が $14.59$ から $16.01$ に変わったので合わせ直した．排気弁径の既定を $32\ \text{mm}$ にして $15.10$，4 弁にし，排気管を大気開放にして $20.64$，排気ポートのガスの温度を計算するようにして（SPEC-27 の 9）$19.28$ になり，そのつど合わせ直した．全開・$3500\ \text{rpm}$ の音量は変わらない） は既定の諸元の全開・$3500\ \text{rpm}$ の単気筒の音源 $\frac{\pi\bar N}{30}s(\psi)$ の実効値（定数として持つ．実測 $14.587$）．$\lambda_\ell = \lambda_0 + (1 - \lambda_0)\,\text{clamp}\left(\frac{1600 - \bar N_a}{700}, 0, 1\right)$，$\lambda_0 = 0.2 + 0.8\ell^{0.8}$，$\lambda_N = \min\left(6, (3500/\bar N_a)^{0.9}\right)$．
3. **雑音**：一様白色雑音（$\pm 1$）を $1.5\ \text{kHz}$ の高域通過と $7\ \text{kHz}$ の低域通過に通し，$0.045\min\left(4, (\bar e/0.05)^2\right)(0.3 + 0.7\ell)\frac{\bar N_a}{3000}$ を掛ける（$\bar e$：4 気筒の包絡の平均）．
4. **破裂音**：$\ell < 0.08$ かつ $\bar N_a > 2200\ \text{rpm}$ のとき，各気筒の周回ごとに確率 $0.5\min\left(1, \frac{\bar N_a - 2200}{2000}\right)$ で起こす．白色雑音を $260\ \text{Hz}$（$Q = 1.2$）と $1.1\ \text{kHz}$（$Q = 1.5$，利得 $0.6$）の帯域通過に通し，時定数 $12\ \text{ms}$ で減衰する包絡と $0.7$ を掛ける．
5. **歪み**：$u = x + \text{雑音} + \text{破裂音}$，$d = 2.6(0.25 + 0.75\ell)\left(0.4 + 0.6\min(1, \bar N_a/6000)\right)$ として $u \leftarrow \frac{\tanh\left(d\,(u + 0.35u^2)\right)}{\max(0.2, \tanh d)}$．
6. **集合管の共鳴**：B.1 と同じ形のくし形フィルタを，管長 $0.55\ \text{m}$，反射率 $0.8$，帰還の低域フィルタの係数 $0.06$，音速 $556.7\ \text{m/s}$（演出の定数）で使う．
7. **共鳴の付加**：帯域通過（中心 [Hz]，$Q$，利得 [dB]）$= (95, 2.5, 5)$，$(190, 3, 3)$，$(420, 4, 4)$，$(1150, 4, 7)$，$(2600, 3, 6)$ を通した成分を足す．
8. **明るさ**：遮断周波数 $f_c = 1400 + 7600\,\ell^{0.7}\left(0.5 + 0.5\min(1, \bar N_a/5000)\right)$ [Hz] の一次の低域通過を通した信号 $0.7$ と元の信号 $0.3$ を混ぜる．
9. **吸気音**：爆発の基本周波数の鋸歯状波（6 倍音まで）を $420\ \text{Hz}$（$Q = 2.2$）と $880\ \text{Hz}$（$Q = 3$，利得 $0.5$）の帯域通過に通し，$0.2\,\ell^2\min(1, \bar N_a/5500)$ を掛けて足す．
10. **出力**：$150\ \text{Hz}$ の low shelf $+4\ \text{dB}$，$28\ \text{Hz}$ の高域通過の後，B.3 と同じ圧縮器と制限を通す．音量に対する利得は $2.5V$．停止では A.6 と同じ包絡で音源を止め，残響が $10^{-9}$ 未満になれば出力を厳密に $0$ にする．
11. 演出では，排気管長・内径・流れ雑音の設定は使わない（音量とサイクル変動は使う）．

**各段の意図**：

| 段 | 聞こえ方 | 値の決め方 |
| :--- | :--- | :--- |
| 1 | 以下の段を「踏んでいる／離している」で変える | アイドルと減速で $0$，全開で $1$ になるよう $0.3$，$0.6$ を選んだ |
| 2 | 音の高さが 4 倍（$6500\ \text{rpm}$ で $217\ \text{Hz}$）．減速中は静かに，アイドルは聞こえる大きさに | モデルの排気流量は減速中も大きく，そのままでは減速中も全開並みの音量になるため下げる |
| 3 | 排気の流れの「シャー」 | 試聴 |
| 4 | アクセルオフの「パラパラ」 | 実機の減速時の後燃えを模した演出．モデルでは燃えていない |
| 5 | 踏むほど，回すほど荒くなる | 非対称の項は偶数次の倍音を足すため |
| 6 | 硬く張った音 | 計算の音の既定より短く，反射を強くした |
| 7 | $95$，$190\ \text{Hz}$：低音．$1150$，$2600\ \text{Hz}$：高回転の甲高さ | 1 回目の試聴で低音の不足を指摘され追加 |
| 8 | 離すとこもり，踏むと開ける | 試聴 |
| 9 | 全開の「クォー」 | 踏んだときだけ出す |
| 10 | 低音の底上げ | 試聴 |

**限界**：4 気筒の爆発の周波数は $6500\ \text{rpm}$ で $217\ \text{Hz}$ なので，高回転ではそれより低い成分はほとんど出ない．スマートフォンの内蔵スピーカでは $95$，$190\ \text{Hz}$ は聞こえにくい．聴感の良し悪しは自動では判定できないので，要件定義書の実機目視チェックリストで確かめる．試聴サンプルの生成スクリプトは `tools/flavor/` にある．

#### D. 実装
1. 合成は AudioWorklet（音声専用のスレッド）で行う．合成器は DOM に依存しないクラス `Synth` とし，Worklet のコードはそのソースから作って，Blob URL，data URL の順で読み込む．どちらも失敗する環境では ScriptProcessorNode に同じ `Synth` を載せる．
2. メインスレッドは毎フレーム $\bar N$，音量，設定，音の種類，$\ell$ を送り，サイクルの完了時に新しい表を送る．
3. 音声は利用者の操作なしに始められないので，`[START]` または `[音]` のタップで AudioContext を作る．
4. 音が OFF のとき，テストの実行中，ページが非表示のときは，送る回転数を $0$ にする．非表示の間は AudioContext を止める．
5. 設定「音響」の項目は SPEC-18．運転タブに `[音ON]`／`[音OFF]` の切替を置く（既定 ON）．
6. スマートフォンの内蔵スピーカは低音が弱いので，ヘッドホンを勧める旨を解説タブに書く．

* **出典**：L. E. Kinsler et al., *Fundamentals of Acoustics*, 4th ed., Wiley (2000), Ch. 7；[W3C, Web Audio API](https://www.w3.org/TR/webaudio/)；[Chrome の自動再生の方針](https://developer.chrome.com/blog/autoplay)

---

## 7. 検証

### SPEC-20：検証の基盤（REQ-20）

#### A. 実行区分
| 区分 | 内容 | 実行の場所 |
| :--- | :--- | :--- |
| [A] 解析 | 関数・状態機械・恒等式の検査（すぐ終わる） | アプリ内 |
| [S] シナリオ | 下の表のシナリオで `EngineCore` を走らせる検査 | アプリ内 |
| [U] 画面 | DOM・Canvas・合成した Pointer Events による検査（現在のビューポートで） | アプリ内 |
| [D] 開発時 | 複数のビューポートでのヘッドレス検証 | 開発時 |
| [M] 実機目視 | 自動化できない見た目・操作感・聴感（要件定義書 5 節のチェックリスト） | 利用者の実機 |

#### B. 規則
1. TEST-01〜35 の [A][S][U] の項目はすべてアプリ内に実装し，`[全テスト実行]` で実行できる．チップの状態は「未実行／実行中／PASS／FAIL」の 4 つだけ．
2. **利用者の状態によらない**：設定画面・解説・画面の構成を操作する [U] の検査は，開始時に全設定を既定値，刻み ×1，保留なし，機関をコールドリセットした状態にしてから行い，終了後に実行前の状態（設定値，保留値，刻み，運転の状態，基準サイクル，表示中のページ）へ完全に戻す．
3. [S] は運転中の機関とは別の `EngineCore` で実行し，運転中の機関の状態と設定を変えない．
4. テストの実行中も画面が固まらないよう，1 フレームあたり $12\ \text{ms}$ 以内に分けて実行し（積分のループでは 4 ステップごとに経過時間を調べる），進捗を表示する．途中で中止できる．実行中は運転中の機関の時間の進行を止めてよい（状態は保つ）．
5. 全テストの所要時間は $360\ \text{s}$ 以内．
6. 決定性：シナリオはサイクル変動 OFF で回し，乱数は種を固定した擬似乱数だけを使う．同じビルドで 2 回実行した結果の数値が完全に一致する．
7. 各検証項目は，項目名・基準・実測値・誤差・合否を持ち，詳細カードに表示する．
8. **納品条件**：[A][S][U] が全 PASS，[D] が全 PASS．1 件でも FAIL があれば成果物を公開しない．[M] で見つかった不具合は，再発を防ぐ自動テストを加えてから直す．
9. **画面のモード**（開発時検証の 5 通りで使う．9 節）：[A] と [S] の項目は画面の大きさによらず同じ値になる（6 の決定性）ので，ビューポートごとに繰り返さない．画面のモードでは，[U] の項目を持つテスト（TEST-15〜23，25〜27，30〜35）だけを実行する．そのうち TEST-17，20，21，25〜27，30，32〜35 では [U] の項目だけを実行し（[U] の項目が使うシナリオは走らせる），TEST-20 では項目 2，3，5 を実行する．TEST-15，16，18，19，22，23，31 は全項目を実行する（[A][S] の項目は短い）．結果の表示は「PASS $n$/17（画面のモード）」の形にする．アプリの `[全テスト実行]` は常に全項目を実行する（`runAll(null, 1)` で画面のモード）．

#### C. シナリオ
既定設定から，サイクル変動を OFF，回転数の制御をスロットル制御にして（どちらも設定の既定と同じとは限らないので明示する．回転数の制御の既定は動力計制御），既定のソルバ（DOPRI5）で積分する．「継続」は元のシナリオの終端の状態を複製して続ける．

| ID | 開始 | 操作 | 時間 |
| :--- | :--- | :--- | :--- |
| S1 | コールドリセット | START | $5\ \text{s}$ |
| S2（アイドル） | S1 を継続 | なし | $+15\ \text{s}$ |
| S3（負荷） | S2 を継続 | 負荷トルク $T_{\text{load}} = 3\ \text{N·m}$ | $+25\ \text{s}$ |
| N1200 | S2 を継続 | 目標 $1200\ \text{rpm}$ | $+8\ \text{s}$ |
| S7（低気圧） | S2 を継続 | $p_{\text{atm}} = 80\ \text{kPa}$ | $+10\ \text{s}$ |
| AMAX | S2 を継続 | 目標 $2000\ \text{rpm}$，$\alpha_{\max} = 5^\circ$ | $+8\ \text{s}$ |
| N600 | S2 を継続 | $T_{\text{aux}} = 0$，目標 $600\ \text{rpm}$ | $+15\ \text{s}$ |
| CS0，CS6，CS10 | コールドリセット | $T_{\text{aux}} = 0, 6, 10\ \text{N·m}$，START | $12\ \text{s}$ |
| S4（動力計制御） | コールドリセット | 動力計制御，目標 $1500\ \text{rpm}$，開度 $15^\circ$，START | $20\ \text{s}$ |
| S4b | S4 を継続 | $p_{\text{atm}} = 80\ \text{kPa}$ | $+10\ \text{s}$ |
| S8（VVT） | S4 を継続 | $\varphi_{\text{in}} = +30^\circ$ | $+5\ \text{s}$ |
| S4V | S4 を継続 | サイクル変動 ON | $+10\ \text{s}$ |
| S5（容量超過） | コールドリセット | 動力計制御，目標 $800\ \text{rpm}$，全開，START．$3\ \text{s}$ 後に定格トルク $10\ \text{N·m}$（始めから $10\ \text{N·m}$ では全開の圧縮を越えられず始動できない） | $3 + 4.5\ \text{s}$ |
| S6（駆動の容量不足） | コールドリセット | 動力計制御，目標 $3000\ \text{rpm}$，開度 $7^\circ$，START．$3\ \text{s}$ 後に定格トルク $3\ \text{N·m}$．さらに $6\ \text{s}$ 後に目標 $2000\ \text{rpm}$ | $3 + 6 + 6\ \text{s}$ |
| W3000 | コールドリセット | 動力計制御，目標 $3000\ \text{rpm}$，全開，定格トルク $200\ \text{N·m}$，START | $12\ \text{s}$ |
| CRANK | コールドリセット | 燃料 OFF でスターターだけ | $5\ \text{s}$ |

S3 を $+25\ \text{s}$ とするのは，一定の負荷トルクではスロットル制御の回転数の振れの減衰が遅いためである（実測：$5\ \text{s}$ ごとの $\bar N$ の幅が $664$〜$859$，$743$〜$842$，$771$〜$829$，$780$〜$813$，$793$〜$807\ \text{rpm}$）．

回転数を固定した全開の定常（SPEC-26 の計測と同じ条件）は，`EngineCore` の回転数の固定（SPEC-10）と壁温の固定（$360\ \text{K}$）を使う．

---

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

### SPEC-28：アイドルの妥当性の確かめ方（REQ-28）

1. **対象**：既定設定，無負荷，目標 $800\ \text{rpm}$ の定常（S2），サイクル変動 OFF，直近 10 サイクル平均．
2. **単気筒であることの注意**：本機は $0.5\ \text{L}$ の単気筒で，比べる実機の値は多気筒機関からの 1 気筒あたりの換算である．単気筒は排気量あたりの摩擦や熱損失が多気筒と同じとは限らず，回転変動も大きい．以下の範囲はこの差を見込んだ目安である．
3. **判定する指標**：
   * 燃料流量 $\dot m_f$：$0.030$〜$0.050\ \text{g/s}$．根拠（推定）：排気量 $2.0\ \text{L}$・4 気筒の乗用車の暖機後アイドルの燃料消費を $0.6$〜$0.8\ \text{L/h}$ とすると，1 気筒あたり $0.7 \times 0.745/4/3600 \approx 0.036\ \text{g/s}$（ガソリンの密度 $0.745\ \text{kg/L}$）．
   * $\text{FMEP} + \text{AMEP}$：$90$〜$130\ \text{kPa}$．根拠：火花点火機関の全摩擦平均有効圧の相関 $97 + 15\,(N/1000) + 5\,(N/1000)^2\ \text{kPa}$（Heywood の教科書に載る Barnes–Moss の相関と記憶しているが，**係数は原典で確認できていない**）が $800\ \text{rpm}$ で約 $112\ \text{kPa}$．
   * 部分負荷（$2000\ \text{rpm}$，負荷トルク $18.5\ \text{N·m}$）の膨張のポリトロープ指数（$400^\circ$ と $480^\circ$ の $p$，$V$ から）：$1.20$〜$1.35$．根拠：圧縮・膨張とも $1.3 \pm 0.05$ が目安（Heywood）．本モデルの既燃ガスの $\gamma$ は平衡組成の値（解離を含む）なので，目安の下側に出る．
4. **記録する量**（判定は「有限」だけ．値を検証タブの実測欄に出す）：吸気管圧，$x_r$，排気弁が開く時点の筒内圧，アイドルの膨張の指数，排気弁が開いた直後の排気の逆流量．

---

## 8. テスト項目

各項目の先頭の記号は実行区分（SPEC-20 A）：[A] 解析，[S] シナリオ，[U] 画面，[D] 開発時．[A][S][U] はアプリの「検証」タブから実行できる．「（実測 …）」は，成果物をヘッドレス Chromium（$360 \times 640$）で実行したときの値である．TEST-29，TEST-30 と，第26版で加えた項目・判定値を改めた項目は第26版の値，ほかは第25版（熱物性の既定が $\gamma(T)$）の値のままである．第26版の成果物での全検査の実測値は `docs/measured_v26.md` にある（`tools/dev/run.js` で作る）．

### TEST-01：スライダ・クランク運動学（REQ-01，SPEC-01）

1. [A] $V(0) = V_c$，$V(\pi) = V_c + V_d$，$V(\pi)/V(0) = \varepsilon$（相対誤差 $10^{-12}$）．
2. [A] $\theta \in \{0.3, 1.1, 2.5, 4.2\}\ \text{rad}$ で，解析的な $\frac{dV}{d\theta}$ と中心差分（$h = 10^{-5}\ \text{rad}$）の相対誤差が $10^{-9}$ 未満．
3. [A] 設定範囲の端点の組合せ（$\lambda \le 0.5$）すべてで，項目 1 が成り立ち，$\frac{dV}{d\theta}$ と中心差分の相対誤差が $10^{-7}$ 未満（$\varepsilon$ が小さいと $V_c$ が大きく，差分の丸め誤差が増えるので，項目 2 より緩い．実測 $3 \times 10^{-10}$），$V(\theta) > 0$，$x(\theta) \in [0, S]$．$\lambda > 0.5$ の組合せが適用できないことは TEST-18 項目 4 で確かめる．

### TEST-02：作動流体の熱物性（未燃・既燃の比熱）（REQ-02，SPEC-02）

1. [A]（当てはめの値）$\gamma_u(300) = 1.3488$，$\gamma_u(700) = 1.2968$，$\gamma_u(1000) = \gamma_u(1500) = 1.2578$，$\gamma_b(300) = 1.3678$，$\gamma_b(2000) = 1.2080$，$\gamma_b(2700) = \gamma_b(3200) = 1.1422$（絶対誤差 $10^{-12}$）．
2. [A] $T \in [300, 3000]\ \text{K}$，$Y \in \{0, 0.3, 1\}$ で $c_p - c_v = R$，$c_p/c_v = \gamma(T, Y)$（相対誤差 $10^{-12}$）．$\gamma(T, Y)$ は $\gamma_u(T)$ と $\gamma_b(T)$ の間にあり，$c_v$ は $Y$ について線形（$Y = 0.3$ の値が両端の内分に一致）．
3. [A]（積分の整合）$T \in \{350, 900, 1500, 2600, 2900\}\ \text{K}$（頭打ちの上下を含む）で，$e_k$ の中心差分（$\pm 0.01\ \text{K}$）が $c_{v,k}(T)$ と相対誤差 $10^{-6}$ で一致する．$e_k(T_0) = 0$．$e_k$ は $T_{c,k}$ で連続（$\pm 10^{-6}\ \text{K}$ の差が $10^{-2}\ \text{J/kg}$ 以下）．
4. [A] $\gamma_u$，$\gamma_b$ は頭打ちより下で $T$ について単調減少，$c_{v,k}$ は単調増加．
5. [A]（定比熱比）定比熱比モデルで $\gamma(T, Y) = 1.35$（すべての $T$，$Y$），$e_k(T) = \frac{R}{0.35}(T - T_0)$．

### TEST-03：カムプロファイルと弁の有効開口面積（REQ-03，SPEC-03）

1. [A] 3 種とも $L_v(0) = L_v(1) = 0$，$L_v(0.5) = L_{\max}$（相対誤差 $10^{-12}$），閉弁域で $A_{\text{eff}} = 0$．
2. [A] $\xi = 0.25$ のリフト比が Aggressive $0.8123$（$= \sin^{0.6}(\pi/4)$），Polynomial $0.5625$，Standard $0.5$（相対誤差 $10^{-4}$，$10^{-12}$，$10^{-12}$）．
3. [A]（滑らかさ）Standard と Polynomial は $L_v(10^{-4})/L_{\max} \le 10^{-6}$（端の傾きが $0$），Aggressive は $L_v(10^{-4})/L_{\max} \ge 10^{-3}$．
4. [A]（弁径）$d_v = 31\ \text{mm}$，$d_{ve} = 26\ \text{mm}$，$B = 86\ \text{mm}$ で $d_{v,\text{in}} = 31\ \text{mm}$，$d_{v,\text{ex}} = 26\ \text{mm}$．$d_v = d_{ve} = 50\ \text{mm}$ で $d_{v,\text{in}} = d_{v,\text{ex}} = (\sqrt2 - 1)B = 35.62\ \text{mm}$．既定の設定で $d_{v,\text{ex}} < d_{v,\text{in}}$．内部の値 `nv = 1` では上限が $0.45B = 38.7\ \text{mm}$．
5. [A]（VVT）$\varphi \in \{-40, -15, 0, 15, 40\}^\circ$ で $L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$ が全周 $1^\circ$ 刻みで成り立ち（相対誤差 $10^{-12}$），作用角と $\int L_v\,d\theta$ が $\varphi$ によらない．
6. [A]（干渉）既定設定では `VALVE HIT` が出ない．$\varepsilon = 40$，$L_{\max} = 14\ \text{mm}$，$\varphi_{\text{in}} = -40^\circ$ では出る．判定が定義式の直接の評価と一致する．
7. [S] S8（S4 の定常から $\varphi_{\text{in}} = 30^\circ$，$5\ \text{s}$）：状態量が有限で，$\eta_v$ が $1\%$ 以上変わる．
8. [A][U]（4 弁）既定の設定で，最大リフトの角度の有効開口面積が，吸気 $2 C_d \frac{\pi}{4} d_{v,\text{in}}^2$，排気 $2 C_d \frac{\pi}{4} d_{v,\text{ex}}^2$ に一致する（相対 $10^{-12}$．リフト $9\ \text{mm} > d/4$）．最大リフトを $1\ \text{mm}$ にすると（$< d/4$）$2 C_d \pi d L_v$ に一致する．内部の値 `nv = 1` ではその半分になる．設定の項目の名前が「吸気弁径（2 個）」「排気弁径（2 個）」で，ページ「VVT・カム」と「弁タイミング」の上の文字が「4 弁」で始まり，系統図の吸気弁と排気弁の枠に「2 ×」がある．

### TEST-04：オリフィスの圧縮性流れ（順流・逆流・チョーク）（REQ-04，SPEC-04）

1. [A] $p_1 = p_2$ で厳密に $\dot m = 0$．$(p_1, p_2)$ を入れ替えると，同じ上流温度・比熱比のもとで絶対値が等しく符号が反転する．
2. [A] $\gamma_0 = 1.4$ で $r_{\text{crit}} = 0.5282817877$（相対誤差 $10^{-9}$），$r_p = 0.50$ と $0.25$ で $\Psi = 0.68473145$（相対誤差 $10^{-7}$，両者は完全に一致）．$\gamma_0 = 1.3$ で $r_{\text{crit}} = \left(\frac{2}{2.3}\right)^{1.3/0.3}$，$\Psi_{\max} = \sqrt{1.3\left(\frac{2}{2.3}\right)^{2.3/0.3}}$（相対誤差 $10^{-12}$）．
3. [A]（正則化）$r_p = 1 - \delta_r$ の両側（$\pm 10^{-12}$）で値が一致（相対誤差 $10^{-7}$），$\Psi(1) = 0$，$r_p = 1 - \delta_r/2$ で $\Psi = \frac{1}{2}\Psi_{\text{sub}}(1 - \delta_r)$，$(r_{\text{crit}}, 1]$ で $\Psi$ が単調減少．

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

### TEST-06：筒内の組成（未燃ガスと既燃ガス）（REQ-06，SPEC-06）

1. [S] S2，S3，S4 の全サイクルの全記録点で $0 \le m_u \le m$．直近 5 サイクルで，排気弁が開く時点の $Y_u < 0.01$（Wiebe の燃焼割合 $99.3\%$ に対応），$0 \le x_r \le 1$．
2. [S]（質量の収支）S4 の定常の 5 サイクルで，$M_{\text{in}} - M_{\text{ex}} + F_{\text{ev}}$（$F_{\text{ev}}$ は気化した燃料．直噴のとき）の増分と筒内質量 $m$ の増分の差が，1 サイクルに吸気弁を通る質量の $10^{-6}$ 以下（実測：差 $5.5 \times 10^{-16}\ \text{kg}$）．

### TEST-07：燃焼（乱流火炎伝播に連動する単一 Wiebe モデル）（REQ-07，SPEC-07）

1. [A] $\int_0^1\frac{dx_b}{d\zeta}\,d\zeta = 1 - e^{-a}$（台形則 2000 分割，相対誤差 $10^{-5}$．$m_w = 0.5, 2, 4$）．$x_b(\zeta_{50}) = 0.5$（$\zeta_{50} = (\ln 2/a)^{1/(m_w + 1)}$）．
2. [A]（層流燃焼速度）$S_{L,0}(1.13) = 0.2758$，$S_{L,0}(1.0) = 0.2758 - 0.7834 \times 0.13^2 = 0.26256$（相対誤差 $10^{-12}$），$S_{L,0}$ は $\phi = 1.13$ で最大．基準状態で $x_r = 0.2$ の $S_L$ は $x_r = 0$ の $0.58$ 倍，$x_r = 0.5$ では下限の $0.15$ 倍．
3. [A] $x_r = 0.05 \to 0.25$ で $S_L$ が減る．点火を $20^\circ$ BTDC から $10^\circ$ ATDC にすると燃焼期間が延びる．
4. [A]（調整係数）$c_d = 2$ で着火遅れが 2 倍，$c_b = 2$ で燃焼期間が半分．
5. [A]（リッチ）$\epsilon(1) = 1$．$\phi = 1.1, 1.2, 1.4$ で $a', b', c', d'$ が元素保存の 3 式と $K_w = 3.5$ を満たし（相対誤差 $10^{-12}$），すべて $\ge 0$．$\phi\,\epsilon(\phi)$ は $\phi \ge 1$ で単調減少し，$\phi = 1.1$ で $0.969 \pm 0.002$，$1.2$ で $0.938 \pm 0.002$．
6. [S]（当量比）S4 の定常から当量比だけを変えて各 $3\ \text{s}$：既定（化学平衡・直噴）では IMEP が $\phi = 0.8 < 0.9 < 1.0 < 1.1$ の順に増える（実測：$781$，$868$，$951$，$977\ \text{kPa}$．$\phi = 1.2$ は $971\ \text{kPa}$．リッチでの出力増は TEST-29 項目 9）．熱物性 $\gamma(T)$ では，全開・$3000\ \text{rpm}$ 固定・点火 $25^\circ$ 固定の 15 サイクル目で，IMEP が $\phi = 1.0 > 1.1 > 1.2$（実測：$1068$，$1035$，$1003\ \text{kPa}$．第25版までは既定のモデルでこの順だった）．スロットル制御（S2 から）では $\phi = 1.2$ の燃料流量が $\phi = 1.0$ より $15\%$ 以上多く，回転数は目標 $\pm 25\ \text{rpm}$．
7. [S]（調整係数の効果）S4 の定常から点火を固定して $c_b = 2$ にすると $p_{\max}$ が $5\%$ 以上上がる．自動最適化 ON では CA50 が上死点後 $10 \pm 0.5^\circ$ に戻る．
8. [S]（サイクル変動）S4V（S4 の定常からサイクル変動 ON で $10\ \text{s}$）：直近 60 サイクルの IMEP の変動係数が $0.5$〜$5\%$，平均 IMEP が OFF と $2\%$ 以内，$z_1, z_2$ の標本平均の絶対値が $0.3$ 未満・標準偏差が $1 \pm 0.25$・$|z| \le \sqrt 3$，平均 CA50 が上死点後 $10 \pm 1^\circ$．
9. [S]（決定性）S4 の終端を複製してサイクル変動 ON で $10\ \text{s}$ 積分した状態が S4V の終端と完全に一致する．OFF では $z_1 = z_2 = 0$．
10. [A]（既定）設定の項目「サイクル変動」の既定値が OFF（$0$）で，既定の設定（`mkP()`）でも OFF．

### TEST-08：壁面熱伝達と壁温（REQ-08，SPEC-08）

1. [A] $C_w = 0$ で $h_c = 0$．ソルバの右辺でも $\dot Q_{\text{wall}} = 0$．
2. [A] $p > p_{\text{mot}}$ のとき，$p = p_{\text{mot}}$ のときより $w$ と $h_c$ が大きい．
3. [A] 壁温の式（熱物性 $\gamma(T)$）：$\dot Q_{\text{wall}} = 0$，$T_w = 300\ \text{K}$ で $\frac{dT_w}{dt} = \frac{15 \times 60}{1500} = 0.6\ \text{K/s}$（相対誤差 $10^{-12}$）．
4. [A][S]（壁温の設定．化学平衡）既定の設定のコールドリセットで $T_w = 360\ \text{K}$，壁温の設定 $450\ \text{K}$ のコールドリセットで $T_w = 450\ \text{K}$（厳密）．右辺で $\frac{dT_w}{dt} = 0$．S4 と同じ手順で $3\ \text{s}$ 運転しても $T_w$ が変わらない．そこで設定を $500\ \text{K}$ にすると次のステップで $T_w = 500\ \text{K}$ になり，$2\ \text{s}$ 後の 1 サイクルの壁への熱 $\Delta Q_w$ が，設定を変えずに進めた場合より小さい．壁温を固定する内部の指定があるときは，設定を変えても $T_w$ が変わらない．壁温の設定 $3500\ \text{K}$ で S4 と同じ手順で $2\ \text{s}$ 計算しても全状態が有限（機関が回り続けるかどうかは判定しない）．
5. [U]（設定ページ「冷却」）1 項目（壁温）があり，`[+]` で値が 1 刻み（$10\ \text{K}$）変わり，設定の範囲が $300$〜$3500\ \text{K}$ で，ページがスクロールしない．熱物性 $\gamma(T)$ では「（不使用）」で `[−]` `[+]` が無効．運転中（化学平衡）のパネルの文字に「壁温」「壁への熱」「排気」と値が出る．

### TEST-09：筒内圧の式（開いた系の熱力学第一法則）（REQ-09，SPEC-09）

1. [A]（断熱圧縮）弁を閉じ，燃焼と熱損失を無くし，定比熱比 $\gamma_0 = 1.35$ で下死点（$100\ \text{kPa}$）から上死点まで積分すると，$p(2\pi) = p(\pi)\,\varepsilon^{\gamma_0}$（相対誤差 $10^{-5}$）．さらに膨張下死点まで積分すると $p(3\pi) = p(\pi)$（$10^{-5}$）で，1 往復の図示仕事が $0$．
2. [A]（温度依存比熱の閉じた系）`EngineCore` の右辺で，弁を閉じ，燃焼と熱損失を無くし，回転数を固定し，比熱を $\gamma(T)$ として，未燃ガスだけ（$Y_u = 1$）と既燃ガスだけ（$Y_u = 0$）のそれぞれを，両方の弁が閉じている $270^\circ$（$100\ \text{kPa}$，$450\ \text{K}$）から上死点（$360^\circ$）まで積分すると，$m\left[e_k(T_{\text{end}}) - e_k(T_{\text{start}})\right] = -\Delta W$（相対誤差 $10^{-6}$）．終端の温度が $700\ \text{K}$ 以上（比熱の温度依存が効く範囲）．
3. [S]（第一法則の収支．熱物性 $\gamma(T)$）S2G（熱物性 $\gamma(T)$ で S2 と同じ手順のアイドル）と F3000G（熱物性 $\gamma(T)$，全開，$3000\ \text{rpm}$ 固定，45 サイクル）のそれぞれで，直近 5 サイクルの $\left|\Delta U_s + \Delta W + \Delta Q_w - \Delta Q_c - \Delta H_i + \Delta H_o\right| \le 10^{-4}\,\Delta Q_c$（実測：$1.9 \times 10^{-6}$，$2.4 \times 10^{-7}$）．既定の化学平衡のモデルの第一法則は TEST-29 項目 7 で確かめる．（第25版では S2，S3，W3000 で確かめていた．第26版で既定のモデルが変わったので，$\gamma$ のモデルの検査はこの 2 つにした．）
4. [S]（熱の行き先が妥当）W3000（既定の化学平衡・直噴）の直近 5 サイクルで，$\Delta Q_w/\Delta Q_c$（$Q_c$ は SPEC-29 B の 7 の表示用の熱発生率の積分）が $0.10$〜$0.30$，$T_{\max}$ が $2200$〜$2800\ \text{K}$（実測：$0.158$，$2568\ \text{K}$．第25版の $\gamma(T)$ では $0.179$，$2484\ \text{K}$ で，上限は $2700\ \text{K}$ だった．化学平衡のモデルは空気量と燃料が多く，$T_{\max}$ が約 $80\ \text{K}$ 高いので，上限を $2800\ \text{K}$ にした）．

### TEST-10：回転運動，摩擦，スターター（REQ-10，SPEC-10）

1. [A] $\text{FMEP}(p_{\max} = 5000\ \text{kPa},\ 3000\ \text{rpm}) = 13.7 + 25 + 16.2 \times 8.6 = 178.02\ \text{kPa}$（相対誤差 $10^{-12}$）．
2. [S] CRANK（燃料 OFF でスターターだけ，$5\ \text{s}$）：サイクル平均の角速度が，$T_f = a + b\,\omega$（$a = (F_0 + F_1 p_{\max})\frac{V_d}{4\pi} + T_{\text{aux}}$，$b = F_2\frac{S}{\pi}\frac{V_d}{4\pi}$）としたつり合いの値 $\omega_{\text{eq}} = \frac{T_{\text{stall}} - a}{T_{\text{stall}}/\omega_{nl} + b}$ の $\pm 15\%$ 以内（差はポンプ損失）．完爆と判定されない．
3. [S] S1（コールドリセットから START，$5\ \text{s}$）：$3\ \text{s}$ 以内に完爆と判定し，その後は $T_{\text{st}} = 0$，全状態量が有限．
4. [S] S3 の定常サイクルで $W_f = \text{FMEP}\cdot V_d$（相対誤差 $10^{-9}$）．
5. [A] 図示トルク：$p = p_{\text{atm}}$ で $T_{\text{ind}} = 0$．回転数固定のモードで $\frac{d\omega}{dt} = 0$．$\omega = 0$ で右辺が負なら $\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$．

### TEST-11：電動式動力計と運転モード（REQ-11，SPEC-11）

1. [A]（容量と右辺）既定の定格で $T_{\max}(1000\ \text{rpm}) = T_{\text{rated}}$，$T_{\max}(60000\ \text{rpm}) = P_{\text{rated}}/\omega$（相対 $10^{-12}$），回転の向きによらない．ソルバの右辺で $T_{\text{dyno}}$ がそのまま入る（吸収 $12.3$，駆動 $-4.1\ \text{N·m}$ で一致）．
2. [A] トルクの指令を $0 \to 20\ \text{N·m}$ にすると $t = \tau_d$ で $T_{\text{dyno}} = (1 - e^{-1}) \times 20\ \text{N·m}$（相対誤差 $10^{-9}$．刻み $10^{-4}\ \text{s}$ と $10^{-3}\ \text{s}$ の両方）．
3. [S] S3（スロットル制御，負荷トルク $3\ \text{N·m}$）：直近 10 サイクル平均で $T_b$ と $T_{\text{dyno}}$ の相対差が $2\%$ 以内．$T_c = T_{\text{load}}$ で一定．
4. [S] S4（動力計制御，$1500\ \text{rpm}$，開度 $15^\circ$）：最後の $5\ \text{s}$ で $\bar N$ の平均が $1500 \pm 10\ \text{rpm}$，瞬時値が $\pm 25\ \text{rpm}$，$0 < T_c < T_{\text{rated}}$（吸収），$\alpha = \alpha_{\text{manual}}$ で一定．始動はスターターを使わず，始動から $1\ \text{s}$ 以内に $\bar N > 1000\ \text{rpm}$ になる．
5. [S]（燃料の停止と駆動）S4 の終端から燃料を止めて $8\ \text{s}$：最後の $3\ \text{s}$ の $\bar N$ が $1500 \pm 25\ \text{rpm}$，$T_c < 0$（駆動），完爆の状態のまま．
6. [S] S6（動力計制御，$3000\ \text{rpm}$，開度 $7^\circ$．始動の $3\ \text{s}$ 後に定格トルクを $3\ \text{N·m}$ にする）：$T_c = -T_{\max}$ に張り付いて `UNDERPOWER` になり，その間 $\lvert I_T\rvert$ が増えない．目標を $2000\ \text{rpm}$ に下げると $5\ \text{s}$ 以内に張り付きが解け，$6\ \text{s}$ 後に $2000 \pm 50\ \text{rpm}$．
7. [S] S5（動力計制御，$800\ \text{rpm}$，全開．始動の $3\ \text{s}$ 後に定格トルクを $10\ \text{N·m}$ にする）：$T_c = T_{\max}$ に張り付いて `OVERLOAD` になる．S4b（S4 から $p_{\text{atm}} = 80\ \text{kPa}$）の定常の軸トルクが S4 より小さい．
8. [S]（モードの切替）S2 の終端からスロットル制御 → 動力計制御に切り替えた直後の 1 ステップで，$\alpha_{\text{manual}}$ が切替前の $\alpha$ に等しく，$\alpha$ が変わらず，$\lvert\Delta T_c\rvert \le 10^{-3}\ \text{N·m}$．続けてスロットル制御に戻した直後の 1 ステップで，$T_{\text{load}} = \max(0, T_c)$，$\lvert\Delta\alpha\rvert \le 0.01^\circ$．
9. [S]（定格と目標によらない整定）W3000（動力計制御，全開，定格トルク $200\ \text{N·m}$，目標 $3000\ \text{rpm}$，始動から $12\ \text{s}$）から，(a) そのまま $4\ \text{s}$，(b) 定格トルクを既定に戻し，目標を $4000\ \text{rpm}$ にして $4\ \text{s}$ 運転し，最後の $2\ \text{s}$ の $\bar N$ の最大と最小の差がどちらも $20\ \text{rpm}$ 以下．
10. [A]（既定）設定の項目「回転数の制御」の既定値が動力計（$1$）で，既定の設定（`mkP()`）でも動力計制御．
11. [S]（モータリングの操作）動力計制御，目標 $1500\ \text{rpm}$ で，停止の状態から `start()`：スターターが働かず，$1\ \text{s}$ 後に $\bar N > 1000\ \text{rpm}$，$4\ \text{s}$ 後に $1500 \pm 25\ \text{rpm}$．そこで `stop()`（FUEL CUT）して $3\ \text{s}$ 後：燃料が止まり，運転中のまま，$\bar N$ が $1500 \pm 25\ \text{rpm}$，$T_c < 0$，図示仕事が負．もう一度 `stop()`（STOP）で停止の状態になり $T_c = 0$．スロットル制御（S2 の終端）では `stop()` 1 回で停止の状態になる．
12. [S]（$40000\ \text{rpm}$ のモータリング）既定の機関と既定の定格で，角速度と $\bar N$ を $40000\ \text{rpm}$ に置き，燃料を止めた動力計制御（目標 $40000\ \text{rpm}$，全開）で $2\ \text{s}$：全状態が有限，最後の $0.4\ \text{s}$ の $\bar N$ が $40000 \pm 25\ \text{rpm}$，$\lvert T_c\rvert < T_{\max}$，`UNDERPOWER` の表示（$2\ \text{s}$ 続く）が出ない．（実測：積分の状態が $0$ から始まるので初めの $0.4\ \text{s}$ に $39569\ \text{rpm}$ まで下がって $T_c$ が上限に触れ，$1.6\ \text{s}$ で整定．定常は $T_c \approx -76$〜$-79\ \text{N·m}$，約 $320\ \text{kW}$．）

### TEST-12：ECU（スロットル開度の PI 制御と点火時期の自動最適化）（REQ-12，SPEC-12）

1. [S] S2（S1 に続けて $15\ \text{s}$）：最後の $3\ \text{s}$ で $|\bar N - 800| \le 25\ \text{rpm}$，かつ $\alpha > \alpha_{\min}$．
2. [S] N1200（S2 から目標 $1200\ \text{rpm}$，$8\ \text{s}$）：最後の $2\ \text{s}$ で $\pm 25\ \text{rpm}$．
3. [S] S7（S2 から $p_{\text{atm}} = 80\ \text{kPa}$，$10\ \text{s}$）：$800 \pm 25\ \text{rpm}$ を保ち，定常の開度が S2 より大きい．
4. [S] AMAX（S2 から目標 $2000\ \text{rpm}$，$\alpha_{\max} = 5^\circ$，$8\ \text{s}$）：$\alpha = \alpha_{\max}$ に張り付き，$4\ \text{s} \to 8\ \text{s}$ で $I_\alpha$ が増えない．
5. [S] S4（動力計制御）：最後の $10\ \text{s}$ で $I_\alpha$ が変わらない．
6. [S]（MBT）S4 の定常で，最後の 25 サイクルの CA50 が上死点後 $10 \pm 0.5^\circ$．
7. [S]（MBT）S4 の定常から，自動最適化を OFF にして点火時期を自動の値の $\pm 4^\circ$，$\pm 8^\circ$ に固定した各 $2\ \text{s}$ の IMEP の最大に対し，自動の値での IMEP が $99\%$ 以上．
8. [A]（MBT）$\theta_{50}$ の式が $x_b(\theta_{50}) = 0.5$ を満たす（相対誤差 $10^{-12}$）．自動最適化 OFF では点火時期が設定値に一致する．
9. [A]（下限）$T_{\text{aux}} = 0, 2, 20\ \text{N·m}$ で $\alpha_{\min} = 2^\circ, 2.52^\circ, 7.2^\circ$（相対誤差 $10^{-12}$）．$\alpha_{\text{base}} = 0$，$T_{\text{aux}} = 0$ で $0$．$\alpha_{\max} = 5^\circ$，$T_{\text{aux}} = 20\ \text{N·m}$ で $5^\circ$．
10. [S]（冷間始動）CS0，CS6，CS10（コールドリセットから START，$T_{\text{aux}} = 0, 6, 10\ \text{N·m}$，各 $12\ \text{s}$）：$3\ \text{s}$ 以内に完爆して終了まで止まらない．完爆後の $\bar N$ の最小が $450\ \text{rpm}$ 以上．完爆後は常に $\alpha \ge \alpha_{\min}$．完爆後の吸気管圧の最小が $6\ \text{kPa}$ 以上．
11. [S]（下限が制御を妨げない）N600（S2 から $T_{\text{aux}} = 0$，目標 $600\ \text{rpm}$，$15\ \text{s}$）：機関が止まらず，最後の $6\ \text{s}$ の $\bar N$ がすべて $600 \pm 100\ \text{rpm}$ の中にあり，その間は常に $\alpha > \alpha_{\min}$．（スロットル制御では，この回転数で $\bar N$ が約 $530$〜$680\ \text{rpm}$ の間を周期約 $6\ \text{s}$ で振れ続ける（実測．第26版の Version 45 でも $526$〜$678\ \text{rpm}$）．開度だけで回転数を合わせる制御では，この機関は $600\ \text{rpm}$ で安定には回らない（要件定義書 7.2 の 2）．以前の判定「最後の $3\ \text{s}$ の平均が $600 \pm 25\ \text{rpm}$」は，振れの位相によって合否が変わり，振れていても通っていた．判定を，この項目の目的（開度の下限が制御を妨げない）と，振れの幅が記録した大きさを超えないことの検査に改めた．振れを無くしたわけではない．）

### TEST-13：数値積分（REQ-13，SPEC-13）

1. [A] 調和振動子を $t = 1$ まで RK4 で積分すると，刻みを半分にしたとき大域誤差が $1/16$（比 $14$〜$18$）になる．
2. [A] DOPRI5 の 1 ステップの誤差が刻み半分で $1/64$（比 $50$〜$80$），誤差の見積もり $|\mathbf{y}_5 - \mathbf{y}_4|$ が $1/32$（比 $26$〜$38$）になる．
3. [S]（参照解との一致）S3 の定常から 1 サイクルを，RK4（既定），DOPRI5（既定），参照解（RK4，$\Delta\theta = 0.05^\circ$）で積分し，$p_{\max}$ と $W$ が参照解と相対差 $0.1\%$ 以内．
4. [S]（アイドルでの RK4）S2 の定常から 3 サイクルを RK4（既定）と参照解（RK4，$\Delta\theta = 0.02^\circ$）で積分し，3 サイクル目の IMEP が参照解と相対差 $0.5\%$ 以内（実測 $1.3 \times 10^{-5}$）．RK4（既定）の 3 サイクルで，$M_{\text{in}} + F_{\text{ev}}$ と $M_{\text{ex}}$ の増分が互いに相対差 $0.2\%$ 以内（直噴では，排気弁を通る質量は吸気弁を通る質量より気化した燃料の分だけ多い）．
5. [S]（イベント）S4 の定常の 3 サイクルで，サイクルの終端・IVO・IVC・EVO・EVC・点火のそれぞれについて，ステップの終端の角度とイベントの角度の差の最大が $10^{-8}\ \text{rad}$ 以下．各イベントが 1 サイクルに 1 回ずつ処理される．全時刻で $-10^{-8} \le \theta \le 4\pi + 10^{-8}$．
6. [S]（サイクルの時間）回転数を $3000\ \text{rpm}$ に固定した全開の定常で，サイクルの所要時間が $\frac{4\pi}{\omega}$ と相対誤差 $10^{-9}$ で一致する．
7. [S]（射影と強制受理）S1，S2，S3，S4，S5，S6，W3000，CS0，CS6，CS10 の全ステップで，射影の適用回数と強制受理の回数がともに $0$．
8. [A]（最高圧の補間）$p = 5 - 2(\theta - 1.3)^2$ の 3 点（$\theta = 1.0, 1.2, 1.5$）から頂点の値 $5$ を返す（相対誤差 $10^{-12}$）．[S] S4 の定常の $p_{\max}$ が，ステップ点の最大以上で，その $1.001$ 倍以下．
9. [S]（集計の整合）回転数を $3000\ \text{rpm}$ に固定した全開の定常の 5 サイクルで，$M_{\text{th}}$，$M_r$，$M_{\text{in}}$，$M_{\text{ex}} - F_{\text{inj}}$，$M_e - F_{\text{inj}}$，$M_t - F_{\text{inj}}$ の増分が相互に相対誤差 $0.1\%$ 以内（$F_{\text{inj}}$ は噴いた燃料．排気側はその分だけ多い）．S2（アイドル）の 5 サイクルで $M_{\text{in}} + F_{\text{ev}}$ と $M_{\text{ex}}$ の増分が $0.5\%$ 以内．
10. [S]（硬さ）S2 の 1 サイクルに沿って $10^\circ$ ごとにヤコビアンを差分で作り，べき乗法で求めた $\max|\lambda|$ が $2.79/\Delta t_{\max}$ 以下．（4 弁にした時点で，$\Delta t_{\max} = 3 \times 10^{-5}\ \text{s}$ のままでは $|\lambda|\Delta t_{\max} = 2.83$ で FAIL した．基準は変えず，$\Delta t_{\max}$ を $2 \times 10^{-5}\ \text{s}$ に改めた．SPEC-13「系の硬さと刻みの上限」）
11. [S]（高速化の等価性）速い計算経路が元の式の経路と浮動小数点数として同じ値を返す：右辺の出力先を指定した呼び出しとしない呼び出し，`EngineCore` 専用の DOPRI5 と汎用の DOPRI5，作用角を前計算した弁リフトとしない弁リフト，$\Psi$ の実装と SPEC-04 の定義式，比熱比が一定の流れ（大気，排気系）のために $\gamma_0$ だけで決まる量を前計算した $\Psi$・流量と，前計算しないもの．
12. [S]（極端な弁の時期．REQ-13 の 9）S2 の定常から，次の弁の時期にして $2\ \text{s}$ 運転し，全状態が有限：(a) IVO $-60^\circ$，IVC $-20^\circ$（化学平衡・直噴），(b) 同じ弁の時期で化学平衡・ポート噴射，(c) IVO $-10^\circ$，IVC $-9^\circ$（作用角 $1^\circ$，化学平衡・直噴），(d) EVO $729^\circ$，EVC $730^\circ$（$\gamma(T)$）．どれも，修正の前（第26版の Version 41 まで）は計算が NaN になった（(a)(b) は既燃ガスの温度が表の範囲を下回ったこと，(c)(d) は誤差の見積もりが NaN のまま受理されたことによる）．機関が止まるかどうかは判定しない．

### TEST-14：性能の指標と基準サイクル（REQ-14，SPEC-14）

S3（スロットル制御，負荷トルク $3\ \text{N·m}$）と S4（動力計制御）の定常について，

1. [S] $\text{IMEP}\cdot V_d = W_{i,\text{net}}$，$\text{PMEP}\cdot V_d = W_{i,\text{net}} - W_{i,\text{gross}}$（相対誤差 $10^{-12}$）．$W_{i,\text{net}}$ が，ステップ点の $p$-$V$ の台形則による値と相対差 $0.1\%$ 以内．
2. [S] $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$，$P_b = \text{BMEP}\cdot V_d/t_c$（相対誤差 $10^{-9}$）．$0 < \eta_m < 1$，$\text{bsfc} > 0$ で有限．
3. [S]（理論の上限）直近 5 サイクルで $P_i \le \eta_{\text{Otto}}\,\dot m_f H_u$，$\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$．
4. [S]（動力の収支）直近 5 サイクル平均で $|W_{i,\text{net}} - \Delta W_f - \Delta W_a - \Delta W_d|/W_{i,\text{net}} \le 2\%$．
5. [S] 基準サイクルを保存した後，点火時期と開度を変えて $1\ \text{s}$ 積分しても，保存した配列が書き換わらない．
6. [S]（表示の規則）S1 の全期間（$0.05\ \text{s}$ ごと）で，完爆前の IMEP・効率の表示が「–」，効率の表示が $[0, 1.5]$ の外に出ず，`NaN`・`Infinity` を表示しない．
7. [S] $\eta_i = W_{i,\text{net}}/(m_f H_u)$（相対誤差 $10^{-12}$）．動力計制御・開度固定で，$\phi = 1.2$ の $\eta_i$ が $\phi = 1.0$ より $10\%$ 以上低い．
8. [S]（10 サイクル平均）S3 の定常で，表示用の各指標が直近 10 サイクルの値の算術平均と一致する（相対誤差 $10^{-12}$）．コールドリセットの直後は「–」に戻り，完爆後 3 サイクルの時点では 3 サイクルの平均である．
9. [S]（体積効率）化学平衡のモデル（既定）で $\eta_v = \frac{m_{a,\text{IVC}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{R_a T_{\text{amb}}}$．熱物性 $\gamma(T)$ で $\eta_v = \frac{m_{u,\text{trapped}}}{(1 + \phi/\text{AF}_{st})\,\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{RT_{\text{amb}}}$（どちらも相対誤差 $10^{-12}$）．

**TEST-15〜19** は画面の文書（`docs/gui.md`）にある．

---

### TEST-20：検証の基盤（REQ-20，SPEC-20）

1. [S] 決定性：S1 と S2 をもう一度実行し，終端の全状態（内部状態を含む）が 1 回目と完全に一致する．
2. [A] 全テストの実行の前後で，運転中の機関の状態と全設定値が完全に一致する．
3. [U] TEST-01〜19，21〜35 がすべて実行され，結果を持つ．画面のモード（SPEC-20 B の 9）では，[U] の項目を持つ TEST-15〜19，21〜23，25〜27，30〜35 がすべて実行され，結果を持つ．
4. [D]（利用者の状態によらない）全即時項目を上限値（選択項目は最後の選択肢），動力計制御，刻み ×10，要リセット項目の保留あり，運転中，の状態で全項目を実行し，35/35 PASS で，実行の直前と直後で機関の状態と全設定値が完全に一致する．
5. [U] テストの実行中の最長のフレーム間隔が $250\ \text{ms}$ 以下，総所要時間が $360\ \text{s}$ 以下（上限は $120 \to 180 \to 240 \to 300 \to 360\ \text{s}$ と緩めてきた．理由は，開発用の計算機が遅くなったことと，検査の追加である．$300 \to 360$ は，TEST-35（約 $18\ \text{s}$）と TEST-11 項目 11，12（約 $10\ \text{s}$）を加えて $360 \times 640$ で $279$〜$292\ \text{s}$ になり，実行ごとのばらつき（約 $\pm 10\%$）で超えるおそれがあるため．要件定義書 7.3 節，7.4 節の 14，22，28）．

### TEST-21：エンジン音（REQ-21，SPEC-21）

1. [A] $c = \sqrt{\gamma_b(800)\,R \cdot 800}$，$f_1(L = 1) = c/4$（相対誤差 $10^{-12}$）．
2. [A] 位相：$\bar N_a = 800, 1500, 3000\ \text{rpm}$ 一定で $1\ \text{s}$ 合成すると，位相の総進みが $1440\bar N/120$ と一致（相対誤差 $10^{-9}$）．
3. [S] 周期性（サイクル変動 OFF）：S4 の表で，周期が整数サンプルになる $800$，$1500$，$3000\ \text{rpm}$ について，既定の設定で，$2$〜$3\ \text{s}$ の区間の $y_{k + P}$ と $y_k$ の差の RMS が出力の RMS の $10^{-3}$ 未満，$\lfloor 1.02P\rfloor$ ずらすと $5\%$ 以上違う．
4. [A] 共鳴：周期的なパルス（1 周期に 1 回，約 $600\ \text{rpm}$．$f_n$ が爆発の周波数のちょうど整数倍になる回転数，$M = 0$）の定常の応答の約 5 周期の DFT で，$L = 1.0$ と $0.5\ \text{m}$ について，$f_1, f_2, f_3$ の近く $\pm 10\%$ の振幅の最大点が理論値と $2\%$ 以内，$f_n$ と隣の極小の振幅の比が理論値 $\frac{1 + g(f_t)}{1 - g(f_n)}$（$g = |h|$，$f_t = \frac{nc}{2L}$）の $75\%$ 以上．設定に反射率の項目が無い．（反射率を外した後，残響がパルスの間隔より長くなり，はじめの単一パルスの $170\ \text{ms}$ の区間の DFT では打ち切りの漏れで比が理論値の $56$〜$66\%$ になった．定常の周期的な応答で測る形に改めた．）
5. [S] 表：S3 の最終サイクルから作った表が 1440 点すべて有限，平均の絶対値が最大の $10^{-6}$ 以下，排気行程の点 $i = 1200$ が中心差分の定義と一致．
6. [A] 表の切替：サイクルの途中で新しい表を送ると，位相が 1 周した瞬間に切り替わり，それまでの出力は切替なしと完全に一致する．
7. [A] 無音と制限：$\bar N = 0$ から始めると出力は厳密に $0$．$800\ \text{rpm}$ から $0$ にすると $1.5\ \text{s}$ 後に $|y| < 10^{-6}$（$0.5\ \text{s}$ 後から改めた．反射率の設定を外して残響が長くなったため．要件定義書 7.4 節の 22）．S5 の表・$6000\ \text{rpm}$・音量 $100\%$ でも $|y| \le 1$ で NaN が無い．音量 $0$ で出力は厳密に $0$．小振幅では出力が音量に比例する（$1\%$ と $2\%$ で RMS 比 $2$，誤差 $1\%$）．
8. [S] 音量の順序：S2（アイドル）の RMS が S4 と S5 のどちらよりも小さい（それぞれの機関の $M$ を与える）．（S5 と S4 の大小は判定しない．反射率を外すと，S4 の爆発の倍音が基本の共鳴に重なって S4 が大きくなるため．要件定義書 7.4 節の 22）
9. [U] 送る値：運転中の機関の $\bar N$ が送られ，再生速度 $0.1\times$ と $1\times$ で同じ値．音 OFF とテストの実行中は $0$．`[音]` のタップで ON／OFF とラベルが切り替わる．
10. [A]（圧縮器）振幅 $2$ の正弦の定常のピークが $l_t^{3/4}\cdot 2^{1/4}$（$1\%$），振幅 $0.2$ では利得が厳密に $1$，$0.1 \to 2$ の段差で出力が上限を超えない，包絡が $0.2\ \text{s}$ 保持された後 $0.3\ \text{s}$ で $1/e$ に減衰する．
11. [S]（歪まない）W3000 の表・音量 $60\%$ で，$|y| > 0.8$ のサンプルが $0.1\%$ 未満．圧縮と制限が定常で波高率を $5\%$ を超えて下げない．
12. [A]（管内の損失）近似のフィルタの $|h|$ が $f_1$ と $1\ \text{kHz}$ で定義式の $|H|$ と一致（相対誤差 $10^{-9}$），$|H(f)|$ が単調減少で $|H(0)| = 1$．単一パルスの応答の $0.10$〜$0.12\ \text{s}$ と $0.30$〜$0.32\ \text{s}$ の RMS の比が，往復ごとに $g_1 = |h(f_1)|\rho_M$ 倍に減るとした値 $g_1^{0.2/(2L/c)}$ と $\pm 25\%$ 以内（$M = 0$ と $0.05$）．（「残響が $40\ \text{ms}$ 後にピークの $1\%$ 未満」から改めた．物理の損失だけでは満たさないため．要件定義書 7.4 節の 22）
13. [A]（サイクルのばらつき）ON で $10\ \text{s}$（$1500\ \text{rpm}$）合成すると，周期の変動係数が $0.5\%$，振幅係数の変動係数が $3\%$（いずれも $\pm 25\%$），平均の周期が $120/\bar N$（$0.2\%$）．OFF では周期が一定（$\pm 1$ サンプル）．同じ種で出力が完全に一致し，種が違えば異なる．
14. [A]（純音らしさの解消）Hann 窓・ちょうど 24 周期で，倍音とその中間のエネルギーの比が，OFF で $100\ \text{dB}$ 以上，ON で $40\ \text{dB}$ 以下．
15. [A]（流れの雑音）$F = 0$ で出力が雑音なしと完全に一致．包絡 $0$ では雑音が出ない．雑音の振幅が $F$ に比例（$20\%$ と $40\%$ で RMS 比 $2$，誤差 $2\%$）．$1$〜$6\ \text{kHz}$ にエネルギーの $70\%$ 以上，$0.5\ \text{kHz}$ 以下と $12\ \text{kHz}$ 以上は各 $10\%$ 以下．同じ種で完全に一致．
16. [S]（流れの雑音）W3000 の表・既定の $F$ で，雑音の RMS／排気の脈動の RMS が $0.1$〜$0.6$．
17. [U] 音声の経路：OfflineAudioContext の AudioWorklet で $0.5\ \text{s}$ 描いた出力が，同じ条件の `Synth` の直接の計算と最大の差 $10^{-5}$ 以内（計算と演出の両方）．AudioWorklet が使えない環境では ScriptProcessorNode の代替の経路が作れる．
18. [S]（演出）既定（計算）の出力は，音の種類と負荷を与えない場合と完全に一致する．演出 → 計算 → 演出と切り替えても NaN を出さない．
19. [S]（演出：4 気筒化）S4 の表・$1500\ \text{rpm}$・サイクル変動 OFF・$\ell = 0.5$ で，$2$〜$3\ \text{s}$ の出力の $P/4$ ずらしとの正規化相関が $0.8$ 以上，計算では $0.5$ 未満．
20. [S]（演出：負荷）S4 の表・$2000\ \text{rpm}$ で，$\ell = 1$ の RMS が $\ell = 0$ の 2 倍以上で，$1\ \text{kHz}$ 以上のエネルギーの割合も大きい（破裂音の起きない回転数で比べる）．
21. [S]（演出：低音）S2 の表・その回転数・$\ell = 0$ で，$160\ \text{Hz}$ 未満のエネルギーの割合が $60\%$ 以上．
22. [A]（演出：破裂音）$4000\ \text{rpm}$・$\ell = 0$ の $2\ \text{s}$ で 1 回以上起き，$4000\ \text{rpm}$・$\ell = 1$ と $1500\ \text{rpm}$・$\ell = 0$ では $0$ 回．
23. [A]（演出：無音と制限）$\bar N = 0$ から始めると出力は厳密に $0$．$800\ \text{rpm}$ から $0$ にすると $1\ \text{s}$ 後に $|y| < 10^{-6}$．S5 の表・$6000\ \text{rpm}$・音量 $100\%$・$\ell = 1$ でも $|y| \le 1$．音量 $0$ で厳密に $0$．同じ種で完全に一致．
24. [A]（演出：処理時間）$1\ \text{s}$ 分の合成が $0.5\ \text{s}$ 未満．
25. [U]（演出：送る値）設定「音響」に「音の種類」があり，送る値に音の種類と $\ell$ が含まれ，$\ell$ が定義式と一致する（$p_{\text{in}}/p_{\text{atm}} = 0.3, 0.6, 0.9, 1$ で $0, 0.5, 1, 1$）．
26. [S]（演出：音量の基準）$q_{\text{ref}}$ が，既定の諸元の全開・回転数 $3500\ \text{rpm}$ 固定の定常（45 サイクル目）の単気筒の音源の実効値と $2\%$ 以内で一致する．

**TEST-22，TEST-23** は画面の文書（`docs/gui.md`）にある．

---

### TEST-24：内部 EGR と点火時期の妥当性（REQ-24，SPEC-24）

サイクル変動 OFF，点火の自動最適化 ON，既定の諸元から各条件で $12\ \text{s}$ 積分し，直近のサイクルで判定する．

1. [S]（軽負荷）スロットル制御，目標 $1500\ \text{rpm}$，負荷トルク $3.5\ \text{N·m}$：$\theta_{\text{OL}} = 20, 50, 80^\circ$ で $x_r$ と $\bar Y_{b,\text{in}}$ がともに単調に増え，$x_r(80^\circ) - x_r(20^\circ) \ge 0.10$．（実測：$x_r = 0.121, 0.173, 0.310$）
2. [S]（部分負荷）スロットル制御，目標 $2000\ \text{rpm}$，負荷トルク $18.5\ \text{N·m}$：$\theta_{\text{OL}} = 20 \to 80^\circ$ で，$x_r$ が $0.04$ 以上増え，PMEP が $4\ \text{kPa}$ 以上 $0$ に近づき，$T_{\max}$ が $40\ \text{K}$ 以上下がり，$\eta_b$ が下がらない．（実測：$x_r$ $+0.056$，PMEP $-47.7 \to -36.6\ \text{kPa}$，$T_{\max}$ $-59\ \text{K}$，$\eta_b$ $0.258 \to 0.265$）
3. [S]（全開）W3000（動力計制御，全開，目標 $3000\ \text{rpm}$，定格トルク $200\ \text{N·m}$）：$x_r \le 0.08$，$\bar Y_{b,\text{in}} \le 0.02$．（実測：$0.054$，$0.003$）
4. [S]（アイドル）S2：$0.15 \le x_r \le 0.35$．（実測：$0.21$）
5. [S]（MBT 点火時期）動力計制御，全開，定格トルク $200\ \text{N·m}$，目標 $1500, 3000, 5000\ \text{rpm}$：MBT 点火時期がいずれも $15$〜$35^\circ$ BTDC で，実際の回転数 $\bar N$ とともに単調に進角する．全開では動力計の整定が遅く $\bar N$ は目標に届かないので，目標との一致は判定しない．（実測：$1454, 2516, 4298\ \text{rpm}$ で $20.7, 24.0, 26.4^\circ$）
6. [S]（火炎発達角）W3000 で，点火から $x_b = 0.1$ までが $15$〜$35^\circ\text{CA}$．（実測：$24.8^\circ$）
7. [S]（希釈による進角）1 の条件で，MBT 点火時期が $\theta_{\text{OL}} = 80^\circ$ のほうが $20^\circ$ より $2^\circ$ 以上進む．（実測：$20.7 \to 23.6^\circ$）
8. [S] TEST-24 全体の所要時間が $35\ \text{s}$ 以下（TEST-20 の総所要の上限を守るため．$25\ \text{s}$ から緩めた．開発用の計算機が遅くなったため．要件定義書 7.4 節の 16）．

### TEST-25：吸気ランナの慣性（慣性過給）（REQ-25，SPEC-25）

1. [A]（共鳴）吸気弁が閉じた角度で回転を止め，$\zeta = 0$，$\dot m_{\text{th}} = 0$ として $\dot m_r(0) = 10^{-4}\ \text{kg/s}$ から積分すると，$\dot m_r$ の振動の周期が $2\pi/\omega_H$ と相対誤差 $1\%$ 以内．
2. [A]（摩擦）$p_{\text{in}} - p_p = \frac{\zeta\dot m_r^2}{2\rho_r A_r^2}$ のとき $\frac{d\dot m_r}{dt} = 0$（$p_{\text{in}} - p_p$ を基準に相対誤差 $10^{-9}$．$\rho_r$ の気体定数は，化学平衡のモデルでは空気の $R_a$）．
3. [S]（OFF）ランナ OFF で $\dot m_r$，$p_p$，$m_{b,p}$，$E_p$ の時間微分が $0$ で，吸気弁の流量が上流圧 $p_{\text{in}}$ で計算される（S2 の定常から 1 サイクルの全ステップ）．
4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{th}}$，$M_r$，$M_{\text{in}}$ の増分が相互に相対誤差 $1\%$ 以内．全時刻で $0 \le Y_{b,p} \le 1$．
5. [S]（慣性過給）全開・回転数固定の計測（SPEC-26）で，既定のランナ（$L_r = 450\ \text{mm}$）の $\Delta\eta_v(N) = \eta_{v,\text{ON}}(N) - \eta_{v,\text{OFF}}(N)$ の最大が $0.02$ 以上．その最大を与える回転数が，$L_r = 900\ \text{mm}$ では $450\ \text{mm}$ より低い．（実測：$4000 \to 2500\ \text{rpm}$，最大 $0.107$，$0.147$）
6. [U] 設定ページ「吸気ランナ」に 3 項目があり，全項目の操作で値が変わり，画面がスクロールしない．
7. [A]（運転中に ON）ランナ OFF で運転中の状態から ON にすると，$\dot m_r = 0$，$p_p = p_{\text{in}}$（厳密），$m_{b,p} = Y_{b,\text{in}}m_p$，$E_p = \varepsilon_{\text{in}}m_p$（相対誤差 $10^{-12}$）になる．

### TEST-26：性能曲線タブ（回転数に対する特性の計測）（REQ-26，SPEC-26）

1. [U] 8 タブが表示され，タブの文字が切れず，画面の文言に「掃引」が無い．性能曲線タブがスクロールしない．表示のボタン 6 つが $44\ \text{px}$ 以上で文字幅の余裕を満たす．4 つのグラフ表示の全グラフに単位付きの軸名と目盛がある．完了後の状態の表示の 3 行が切れない．
2. [S]（回転数の保持）各点で角速度が目標と相対誤差 $10^{-9}$ 以内，サイクルの時間から求めた回転数も目標と相対誤差 $10^{-9}$ 以内．
3. [S]（恒等式）各点で $P_b = T_b\cdot\frac{2\pi N}{60}$，$\text{BMEP}\cdot V_d = 4\pi T_b$（相対誤差 $10^{-9}$）．
4. [S]（決定性）同じ設定で 2 回計測した結果が完全に一致する．
5. [U]（干渉しない）`[計測開始]` から完了までの前後で，運転中の機関の設定と状態が一致し，1 フレームあたりの計算時間の最大が $30\ \text{ms}$ 以下．（項目 5・6 の画面操作による計測は，刻み $500\ \text{rpm}$・開度 $90^\circ$・標準・流量判定 OFF で行う．）
6. [U]（基準と古さ）2 回目の計測の完了後に基準が描かれ，`[基準を消す]` で消える．計測後に設定を 1 つ変えると古さの表示が出て，再計測で消える．`[中止]` した結果は基準を置き換えない．
7. [S]（所要時間）既定の計測が $30\ \text{s}$ 以下（$20\ \text{s}$ から緩めた．開発用の計算機が遅くなったため．要件定義書 7.4 節の 16）．
8. [S]（形）既定設定の全開の曲線で，$T_b$ の最大が端点以外にあり，$P_b$ の最大を与える回転数が $T_b$ の最大を与える回転数より高く，全点が整定する．
9. [S]（手順の一致）刻み $1000\ \text{rpm}$（7 点），開度 $90^\circ$，厳格・流量判定 ON で，「上り」「往復」「独立」の結果が，既定設定，ランナ長 $900\ \text{mm}$，ランナ OFF のそれぞれで，全点で $|\Delta T_b| \le 0.5\%\max T_b$，$|\Delta\eta_v| \le 0.005$ で一致する．
10. [U]（条件）開度のボタンで選んだ集合が計測に使われる開度と一致し（大きい順），最後の 1 つは外せない．刻みのボタンで点数が 280，70，28，14．厳しさ・流量判定・手順のボタンが状態を切り替える．サイクル数の `[−]` `[+]` で $n_{\min}$，$n_{\max}$ が 1 刻み変わり，範囲の端と $n_{\min} \le n_{\max}$ を超えない．厳しさを選ぶと $n_{\min}$ がその初期値（標準 4，厳格 6）になる．どれを変えても計測済みなら古さの表示が出る．全ボタンが $44\ \text{px}$ 以上で，画面がスクロールしない．
11. [U]（前提）表の数値が定数表と選択・設定値に一致し（表に `NaN` が無く，排気系の行が $L_e$ と $d_e$ を示す），表の高さが表示領域の $95\%$ 以下．回転数の点の行（例：「250, 500, …, 7000 rpm（28 点）」）が，4 つの刻みのどれでも 1 行に収まる（行の高さが表のいちばん低い行と同じ）．（第26版の公開後，この行を「250〜7000 rpm，250 rpm 刻み，28 点」と長くしたところ，実機（Galaxy S26+）で折り返して表の高さが $488/498\ \text{px}$ になり FAIL した．開発時の 7 通りでは $95\%$ を超えなかったので，行が 1 行に収まることを別に確かめる．）
12. [S]（開度の重ね描き）既定（$90, 50, 10^\circ$）で 3 曲線がそろい（各 28 点），全点で $T_b(10^\circ) < T_b(50^\circ)$，$\eta_v(10^\circ) < \eta_v(50^\circ)$，$10^\circ$ の $T_b$ は $1000 > 4000 > 7000\ \text{rpm}$ の順に小さい．凡例に 3 つの開度があり，プロット領域の中に収まる．9 つの開度すべてを選んでも凡例が収まる．（$50^\circ$ と $90^\circ$ の大小は判定しない．）
13. [S]（収束の判定）厳格・流量判定 ON の全開の計測で，整定した全点について，記録した幅が判定値以下で，使ったサイクル数が 6 以上．「往復」では完了の表示に往復差が出る．
14. [U]（前提の即時の反映）計測済みの結果がある状態で「前提」を表示し，カムの種類，最大リフト，IVC，吸気位相を順に変えると，そのたびに（表示を切り替え直さなくても）表の値が変わり，古さの注記が出る．圧縮比を保留にすると保留の注記が出て，表の圧縮比は適用済みの値のまま．2 つの注記が出た状態で表の高さが表示領域の $95\%$ 以下．すべて戻すと注記が消える．計測済みの結果が無い状態でも，カムの変更が表に現れる．計測の実行中は見出しが「計測中の設定」になり，実行中に変えたカムは表に現れず，中止すると現れる．
15. [S]（サイクル数の最少・最多）開度 $90^\circ$，$1000$，$4000\ \text{rpm}$ の 2 点，厳格・流量判定 ON で，(a) $n_{\min} = 12$，$n_{\max} = 60$ のとき，整定した点の使ったサイクル数が $12$ 以上，(b) $n_{\min} = 3$，$n_{\max} = 4$ のとき，全点の使ったサイクル数が $4$ 以下で，$4$ サイクルで打ち切った「未整定」の点がある（既定の条件では各点が約 7 サイクルで整定するため，打ち切りの規則を確かめるには画面の範囲（$n_{\max} \ge 10$）より小さい値をコアに直接渡す）．(c) 画面の条件で選んだ $n_{\min}$，$n_{\max}$ が計測に渡り，「前提」の表の最少・最多がその値を示す．
16. [A]（横軸）性能曲線の全グラフ（`[出力]` `[η_v]` `[燃費]` `[点火]` の 7 個）の横軸が $0$〜$7000\ \text{rpm}$，目盛が $0, 1000, \ldots, 7000$．
17. [S]（低い回転数）刻み $250\ \text{rpm}$ の点の列が $250, 500, \ldots, 7000$ で，全開の $250\ \text{rpm}$ と $500\ \text{rpm}$（完爆の判定 $550\ \text{rpm}$ より低い）が整定し，点火時期が自動最適化され（設定の固定値と異なる），$T_b > 0$．全開の $100\ \text{rpm}$ はエンストとして記録され（使ったサイクル数が $1$ 以下），グラフの系列に入らない（同じ計測の $250\ \text{rpm}$ は入る）．手順が「往復」と「独立」の計測（$100$ と $1000\ \text{rpm}$ の 2 点）でも，$100\ \text{rpm}$ がエンストとして記録され，$1000\ \text{rpm}$ は整定して値を持ち，往復差が有限の値になる．
18. [A]（印の間引き）性能曲線のグラフで，点の間隔が $8\ \text{px}$ 未満の系列（刻み $25\ \text{rpm}$）は整定した点に印を描かず，未整定の点にだけ白抜きの印を描く．間隔が $8\ \text{px}$ 以上（刻み $500\ \text{rpm}$）ではすべての点に印を描く（描いた印の数で判定）．

### TEST-27：排気系（排気管の脈動と背圧）（REQ-27，SPEC-27）

1. [A]（共鳴）排気弁が閉じた角度で回転を止め，$f_r = \zeta_e = 0$ として $\dot m_e(0) = 10^{-4}\ \text{kg/s}$ から積分すると，振動の周期が $2\pi/\omega_E$ と相対誤差 $1\%$ 以内．化学平衡のモデル（既定）では，壁温を排気ポートのガスの温度にそろえて（ポートの壁への熱がほぼ $0$），$\omega_E = \sqrt{\frac{A_e}{L_e}\frac{\gamma_X R_X T_X}{V_{pe}}}$（$\gamma_X = 1 + R_X/c_{v,X}$．始めの $T_X$，$p_{pe}$ での値）．
2. [A]（損失と出口の動圧）$p_{pe} - p_{\text{atm}} = \frac{(\zeta_x + 1)\dot m_e^2}{2\rho_e A_e^2}$ のとき $\frac{d\dot m_e}{dt} = 0$（相対誤差 $10^{-9}$．$\rho_e$ の気体定数は，化学平衡のモデルでは $R_b(T_X, 100\ \text{kPa}, \zeta^*)$）．
3. [S]（OFF）排気系 OFF で $\dot m_e$，$p_{pe}$，$p_{te}$ の時間微分が $0$ で，排気弁の下流圧が $p_{\text{atm}} + \Delta p_{\text{ex}}$．
4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{ex}}$，$M_e$，$M_t$ の増分が相互に相対誤差 $1\%$ 以内．
5. [A][S]（大気開放と背圧）既定の設定に `Vm`，`At` が無く，右辺で $\frac{dp_{te}}{dt} = 0$，出口の流量が $\dot m_e$ に等しい．全開・回転数 $3000\ \text{rpm}$ 固定の定常（G3000D）の 1 サイクルで，ステップごとの台形則で求めた損失の項 $\frac{(\zeta_x + 1)\dot m_e|\dot m_e|}{2\rho_e A_e^2}$ の平均が，同じ方法で求めた $\overline{p_{pe}} - p_{\text{atm}}$ と相対 $1\%$ 以内（SPEC-27 の 5 の式）．全開・回転数固定の計測の $1000$〜$7000\ \text{rpm}$ の各点で背圧が $10\ \text{kPa}$ 以下，S2（アイドル）の背圧が $0.5\ \text{kPa}$ 以下（上限は実測に余裕を見た値で，文献の値ではない）．（実測：管の損失 $1.005$ ＋ 出口の動圧 $1.435$ ＝ $2.440\ \text{kPa}$，背圧 $2.440\ \text{kPa}$．全開の最大 $6.28\ \text{kPa}$（$5000\ \text{rpm}$），アイドル $0.014\ \text{kPa}$）
6. [S]（脈動）全開・$3000\ \text{rpm}$ で，1 サイクルの排気ポート圧の最大と最小の差が $20\ \text{kPa}$ 以上（実測 $138\ \text{kPa}$）．
7. [U] 設定ページ「排気系」に 2 項目（排気系モデル，排気圧損）があり，項目の操作で値が変わり，画面がスクロールしない．
8. [A]（運転中に ON）排気系 OFF で運転中の状態から ON にすると，$\dot m_e = 0$，$p_{pe} = p_{te} = p_{\text{atm}} + \Delta p_{\text{ex}}$（厳密）になる．
9. [S]（排気ポートの収支．化学平衡）S4 の定常の 5 サイクルで，ポートのガスの質量 $m_X$ の増分と $\Delta M_{\text{ex}} - \Delta M_e$ の差が $\Delta M_{\text{ex}} + \Delta M_e$ の $10^{-6}$ 以下，$m_X(e_X - h_b^{\text{ref}})$ の増分と $\Delta H_{xs} - \Delta H_x - \Delta Q_{pw}$ の差が $\lvert\Delta H_{xs}\rvert + \lvert\Delta H_x\rvert + \lvert\Delta Q_{pw}\rvert$ の $10^{-6}$ 以下．
10. [A]（ポートの式）S4 の定常の状態を，排気弁が閉じた角度にし，$\dot m_e = 0$，$T_w = T_X$ にした右辺で，$\lvert\dot T_X\rvert \le 10^{-9}\ \text{K/s}$，$\lvert\dot p_{pe}\rvert \le 10^{-6}\ \text{Pa/s}$．同じ状態で $T_w = T_X - 300\ \text{K}$，$\dot m_e = 0.02\ \text{kg/s}$ にした右辺の $\dot Q_{pw}$ が，SPEC-27 の 10 の式（$\text{Re}$ の下限が効かない）を別に計算した値と相対誤差 $10^{-12}$ で一致し，$\dot m_e = 10^{-5}\ \text{kg/s}$ では $\text{Re} = 2300$ の値に一致する．
11. [S]（排気温度の妥当性）G3000D（全開，$3000\ \text{rpm}$ 固定）の 1 サイクルの $\bar T_X$ が $900$〜$1400\ \text{K}$ で，そのサイクルの排気弁が開く時点の筒内の温度より低い．S2 の直近 1 サイクルの $\bar T_X$ が G3000D より低い．

### TEST-28：アイドルの妥当性（REQ-28，SPEC-28）

1. [S] S2 の直近 10 サイクル平均で $0.030 \le \dot m_f \le 0.050\ \text{g/s}$．（実測：$0.039$）
2. [S] 同じく $90 \le \text{FMEP} + \text{AMEP} \le 130\ \text{kPa}$．（実測：$56 + 50 = 106$）
3. [S] スロットル制御，目標 $2000\ \text{rpm}$，負荷トルク $18.5\ \text{N·m}$ の定常で，膨張の指数が $1.20$〜$1.35$．（実測：$1.26$）
4. [S] 4 の「記録する量」が有限の値として実測欄に出る．（実測：吸気管圧 $26.6\ \text{kPa}$，$x_r = 0.21$，排気弁が開く時点の筒内圧 $83\ \text{kPa}$，アイドルの膨張の指数 $1.34$，排気の逆流量 $79\ \text{mg}$／サイクル）

---

### TEST-29：化学種の熱物性と化学平衡（REQ-29，SPEC-29）

1. [A]（物性の値）$R_a = 288.19$，$R_f = 75.586\ \text{J/(kg·K)}$，$\text{AF}_{st} = 14.503$，$\frac{\bar h_f(T_0) - n\bar h_{\text{CO}_2}(T_0) - \frac{yn}{2}\bar h_{\text{H}_2\text{O}}(T_0)}{M_f} = 44.35\ \text{MJ/kg}$（相対誤差 $10^{-4}$）．各化学平衡で，$\bar h_i$ の中心差分（$\pm 0.01\ \text{K}$）が $\bar c_{p,i}$ に一致し（相対 $10^{-6}$．$T = 400, 900, 1500, 2600\ \text{K}$），$1000\ \text{K}$ の両側で $\bar h_i$ と $\bar s_i^\circ$ が連続（相対 $10^{-5}$）．
2. [A]（平衡定数）$\log_{10}K_p = -\frac{\Delta\bar g^\circ}{\bar R T\ln 10}$（CO$_2$ ⇌ CO + ½O$_2$）が，$2000$，$2500$，$3000\ \text{K}$ で $-2.879$，$-1.433$，$-0.479$（$\pm 0.005$）．
3. [A]（平衡の解）$\eta_c = 1$ として，$\phi_b \in \{0.7, 1.0, 1.3\}$，$T \in \{1700, 2500, 3200\}\ \text{K}$，$p \in \{0.1, 5\}\ \text{MPa}$ で，元素の保存の残差が相対 $10^{-9}$ 以下，停留の条件 $\frac{\mu_j}{\bar R T} = \sum_i\lambda_i a_{ij}$ の残差が $10^{-8}$ 以下．$\phi_b = 1$，$2500\ \text{K}$，$5\ \text{MPa}$ で CO のモル分率 $0.01029$（$\pm 10^{-5}$），$R_b = 289.58\ \text{J/(kg·K)}$（$\pm 0.01$）．定圧断熱火炎温度（反応物 $298.15\ \text{K}$，$101.325\ \text{kPa}$，平衡を直接解く）が $\phi = 1.0$ で $2313.7\ \text{K}$，$\phi = 1.1$ で $2325.2\ \text{K}$（$\pm 2\ \text{K}$）．
4. [A]（定容・断熱の燃焼）$\eta_c = 1$，凍結なし，平衡を直接解いて（表は $\eta_c = 0.97$ で作るので使わない），未燃の混合気（$\phi = 1.0$：$T = 690.30\ \text{K}$，比体積 $0.09058\ \text{m}^3/\text{kg}$．$\phi = 1.1$：$682.90\ \text{K}$，$0.09016\ \text{m}^3/\text{kg}$）と内部エネルギー・比体積が同じ既燃ガスの状態が，$\phi = 1.0$ で $2952\ \text{K}$，$9.565\ \text{MPa}$，$\phi = 1.1$ で $2983\ \text{K}$，$9.817\ \text{MPa}$（$\pm 5\ \text{K}$，$\pm 0.3\%$．値は `tools/richburn` の M3／PFI）．
5. [A]（表の補間）格子の中点（$T$ と $\ln p$ のすべての区間の中点）で，$\phi_r \in \{0.73125, 1.00625, 1.26875\}$（節点の中間）の全 $7020$ 点について，補間の値と平衡を直接解いた値の差が，$e_b$ で $5\ \text{kJ/kg}$ 以下，$R_b$ で相対 $10^{-3}$ 以下．補間した $e_b$，$R_b$ の偏微分が，補間した関数の中心差分に一致（相対 $10^{-6}$）．（実測：$3.59\ \text{kJ/kg}$，$2.0 \times 10^{-4}$，$3.3 \times 10^{-9}$．$e_b$ の基準は当初 $3\ \text{kJ/kg}$ としたが，量論のすぐリッチ側（$\phi_r = 1$〜$1.0125$）で $3.6\ \text{kJ/kg}$ が残るので $5$ にした．燃料の発熱量に対して約 $0.13\%$ である．）
6. [A]（閉じた断熱の系）`EngineCore` の右辺で，弁が閉じている間（IVC の $2^\circ$ 後から EVO の $2^\circ$ 前まで），熱損失を無くし，ポート噴射，回転数を $3000\ \text{rpm}$ に固定して，圧縮・燃焼・膨張を積分する（初期：$350\ \text{K}$，$100\ \text{kPa}$ の混合気）．$U + \int p\,dV$ の変化を仕事 $\left\lvert\int p\,dV\right\rvert$ で割った値が，既定の許容誤差で $10^{-4}$ 以下，相対の許容誤差 $10^{-10}$・絶対の許容誤差を既定の $10^{-6}$ 倍にして $10^{-6}$ 以下（$\phi = 1.0$ と $1.2$）．（実測：$1.8 \times 10^{-5}$，$2.5 \times 10^{-7}$，$1.8 \times 10^{-8}$．当初の基準は「許容誤差 $10^{-10}$ で $10^{-8}$」としたが，既燃ガスの表は $\ln p$ と $\phi_r$ について線形の補間で，偏微分が格子の線で跳ぶので，そこを跨ぐステップで積分の次数が落ちる．許容誤差を絞ると残差が小さくなることから，式そのものは保存の形になっていると判断し，基準を実測に合わせた．）
7. [S]（周期定常の第一法則）S2（アイドル），S3（部分負荷），W3000（全開，動力計），G3000D（全開，$3000\ \text{rpm}$ 固定）の直近 5 サイクルで，SPEC-29 B の 8 の残差が $m_f H_u$ の $10^{-4}$ 以下（実測：$3.4 \times 10^{-6}$，$1.2 \times 10^{-5}$，$3.5 \times 10^{-6}$，$3.9 \times 10^{-6}$）．
8. [S]（第25版との一致）熱物性を $\gamma(T)$，噴射方式をポート噴射，弁を 1 個ずつ（内部の値 `nv = 1`），吸気弁径 $38\ \text{mm}$，排気弁径 $38 \times 0.9375\ \text{mm}$（第25版の値）にして，S2 と同じ手順（始動から $5\ \text{s}$，複製して $15\ \text{s}$）の最後のサイクルの IMEP が，第25版の実装の値 $108073.557\ \text{Pa}$ と相対 $10^{-4}$ 以下で一致．（開発時に，第25版の `src/core.js`（コミット `1ef8ff1`）とこの実装とで，同じ手順の最後の状態 18 成分が Chromium でも Node.js でもビット単位で一致することを確かめた．ただし Chromium と Node.js の間では IMEP が $108073.557$ と $108074.077\ \text{Pa}$ で $4.8 \times 10^{-6}$ 違う（数学関数の実装の違いが制御のループで広がる）．アプリ内の検査は利用者の端末で動くので，当初の $10^{-12}$ を $10^{-4}$ にした．）
9. [S]（リッチでの出力増）直噴，全開，点火時期は自動最適化，動力計で回転数を固定（SPEC-26 の計測と同じ手順，厳格）．$2000$ と $4000\ \text{rpm}$ で $T_b(1.1) > T_b(1.0) > T_b(0.9)$．$\phi \in \{0.9, 1.0, 1.1, 1.2, 1.3\}$ のうち $T_b$ が最大になるのは $1.1$ か $1.2$．満たさない場合は，係数を調整せず，要件定義書 7.4 節に結果と理由を書く．実測（$\phi = 0.9, 1.0, 1.1, 1.2, 1.3$ の順．$\text{N·m}$．排気弁径 $32\ \text{mm}$）：$2000\ \text{rpm}$ で $37.33$，$41.67$，$43.72$，$43.50$，$43.15$（最大は $\phi = 1.1$ で，$\phi = 1$ より $4.9\%$ 大きい）．$4000\ \text{rpm}$ で $36.52$，$41.14$，$43.01$，$42.63$，$42.06$（同 $4.5\%$）．全点が整定した．同じ手順で，化学平衡・ポート噴射は $2000\ \text{rpm}$ で $35.10$，$38.84$，$39.95$，$39.40$，$38.75$，熱物性 $\gamma(T)$ は $32.00$，$35.30$，$34.02$，$32.76$，$31.52$（$\phi = 1$ で最大）だった（Node.js での計測．排気弁径 $35.6\ \text{mm}$ のときは，直噴の $2000\ \text{rpm}$ で $37.59$，$41.92$，$43.92$，$43.65$，$43.25$）．

---
10. [A]（表の温度の範囲の外．SPEC-29 A の 6）$\phi_r = 1$，$p = 100\ \text{kPa}$ の既燃ガスで，$T = 240\ \text{K}$ の $c_{v,b}$ が $T = 250\ \text{K}$ の値と一致して正，$e_b(240) = e_b(250) - 10\,c_{v,b}(250)$（相対 $10^{-12}$）．$T = 3600\ \text{K}$ でも同様に $e_b(3600) = e_b(3500) + 100\,c_{v,b}(3500)$．

### TEST-30：燃料の噴射と気化（REQ-30，SPEC-30）

1. [S]（噴射量と収支）直噴，全開，$3000\ \text{rpm}$ の定常の 1 サイクルで，$\int\dot m_{\text{inj}}\,dt = m_{f,\text{cmd}}$（相対 $10^{-9}$），$\int\dot m_{\text{inj}}\,dt - \int\dot m_{\text{ev}}\,dt = \Delta m_l$（同）．筒内の燃料蒸気の収支（気化 ＋ 吸気弁の正味の流入 − 排気弁からの流出 − 燃焼 ＝ $\Delta m_f$）が，$m_{f,\text{cmd}}$ に対して相対 $10^{-9}$ で閉じる．噴射に対する燃焼・排気弁からの流出・吸気弁の正味の流入の割合を記録する（実測：$96.01\%$，$0.63\%$，$-3.36\%$．弁 1 個ずつのときは $97.36\%$，$0.64\%$，$-1.99\%$）．
2. [S]（イベントの角度）噴射の開始と終了で，ステップの終端の角度が $\theta_{\text{SOI}}$ と $\theta_{\text{SOI}} + \Delta\theta_{\text{inj}}$ に一致（$10^{-8}\ \text{rad}$）．$1000$ と $7000\ \text{rpm}$ で $\Delta\theta_{\text{inj}} = \frac{\omega_{\text{SOI}}m_{f,\text{cmd}}}{q_{\text{inj}}}$（相対 $10^{-9}$．上限と下限に掛からない条件で）．
3. [A]（潜熱）`EngineCore` の右辺で，弁を閉じ，熱損失を無くし，容積を固定して（回転数 $0$），$320\ \text{K}$，$100\ \text{kPa}$ の空気の中に，その質量の $6.45\%$ の液体の燃料を置いて（$m_l$ の初期値），全量を気化させる（右辺を時間について RK4 で積分．刻み $\frac{\tau_{\text{ev}}}{400}$，$40\tau_{\text{ev}}$）．最後の温度が，$m_a e_a(T) + m_f e_f(T) = m_a e_a(320) + m_f\left[h_f(T_l) - h_{fg}\right]$ の解に一致（$10^{-6}\ \text{K}$．実測：$291.946\ \text{K}$，低下 $28.05\ \text{K}$）．
4. [A]（時定数 0）$\tau_{\text{ev}} = 0$ で，噴射の間も $m_l = 0$，$\dot m_{\text{ev}} = \dot m_{\text{inj}}$．
5. [S]（点火の時点の当量比）直噴，全開，$3000\ \text{rpm}$ の定常，設定 $\phi \in \{0.9, 1.0, 1.2\}$ で，$\phi_c$ が設定値の $\pm 5\%$ 以内．（4 弁，排気管を大気開放にした機関の実測：$0.8694$，$0.9665$，$1.1619$ で，設定より $3.2$〜$3.4\%$ 小さい．基準は $\pm 3\%$ だったが，4 弁にして吸気弁の面積が $1.41$ 倍になり，圧縮行程のはじめに吸気弁から戻る燃料蒸気が，噴いた量の $1.99\%$ から $3.36\%$ に増えて（項目 1），$\phi_c$ のずれが $3\%$ を超えた．モデルの帰結なので，補正を入れずに基準を $\pm 5\%$ に広げた．弁 1 個ずつ（$38$／$32\ \text{mm}$）のときの実測は $0.8818$，$0.9803$，$1.1777$ で，設定より $1.9$〜$2.0\%$ 小さかった．当初の基準は $\pm 1\%$ としたが，噴いた燃料の約 $2\%$ が吸気側へ戻ってスロットルから出る（SPEC-30 の 4，項目 1）．モデルの帰結なので，補正を入れずに基準を広げた．）
6. [S]（直噴の冷却）全開，$3000\ \text{rpm}$，$\phi = 1$ の定常で，直噴はポート噴射に比べて，IVC の時点の筒内の温度が $10\ \text{K}$ 以上低く，$\hat m_a$ が $3\%$ 以上多い．実測：$22.1\ \text{K}$（$404.7 \to 382.6\ \text{K}$），$+7.03\%$（試算の上限は $24.5\ \text{K}$，$+8.0\%$）．
7. [U] ページ「噴射」に 4 項目がある．熱物性を $\gamma(T)$ にすると，噴射方式の行が「（不使用）」で「ポート噴射」を選択中として表示し，噴射方式・噴射開始・インジェクタ流量・気化の時定数の行の `[−]` `[+]` と選択が無効で，押しても設定値が変わらない．「化学平衡」に戻すと有効になる．ポート噴射では噴射開始・インジェクタ流量・気化の時定数の行が「（不使用）」で無効．文字が欠けない．
8. [U] ページ「噴射」のパネルの文字が，直噴では噴射の角度の範囲・$m_{f,\text{cmd}}$・$\phi_c$ を，ポート噴射では「ポート噴射」を含む．運転中に熱物性を 化学平衡 → γ(T) → 化学平衡 と切り替えても，切り替えの前後で筒内圧が一致し（相対 $10^{-12}$），状態が有限で，その後 $2\ \text{s}$ 運転を続けて失火しない．
9. [A][S]（ECU の空気量の見積もり．SPEC-30 の 4）$\hat m_a$ の式の値：最初の IVC の前は $\frac{p_{\text{in}}V_d}{R_a T_{\text{in}}}$，前のサイクルの噴射が無いときは $m_{a,\text{IVC}}$，$\pi_S = 1.1$ で $m_{a,\text{IVC}} + 0.1\,m_{\text{IVC}}$，負になる場合は $0$（相対 $10^{-12}$）．S2（アイドル）から目標回転数を $2000\ \text{rpm}$ に上げた過渡の 8 回の噴射で，$m_{f,\text{cmd}} = \frac{\phi\,\hat m_a}{\text{AF}_{st}}$（相対 $10^{-12}$）．この間の $|\pi_S - 1|$ の最大が $0.05$ 以上（補正の項が効く条件で確かめていること．実測 $1.158$）．
10. [S]（噴射の幅の下限と上限．SPEC-30 の 5，10）S2 で $q_{\text{inj}} = 40\ \text{g/s}$ にすると，3 サイクル後の $\Delta\theta_{\text{inj}}$ がちょうど $1^\circ$（実測：$\frac{\omega m_{f,\text{cmd}}}{q_{\text{inj}}} = 0.75^\circ$）．ボア・ストローク $150\ \text{mm}$，連桿長 $300\ \text{mm}$，吸気弁径と排気弁径 $50\ \text{mm}$，最大リフト $14\ \text{mm}$ の機関を全開・$2000\ \text{rpm}$ に固定し，$q_{\text{inj}} = 5\ \text{g/s}$ にすると，6 サイクル後の $\Delta\theta_{\text{inj}}$ がちょうど $300^\circ$（実測：$\frac{\omega m_{f,\text{cmd}}}{q_{\text{inj}}} = 338^\circ$．既定の機関では，設定の範囲で上限に達しない）．どちらも，1 サイクルに噴いた質量が $m_{f,\text{cmd}}$ に一致する（相対 $10^{-9}$）．上限のときだけ，パネルの文字に「幅が上限」がある．
11. [S]（運転中の噴射方式の切り替え．SPEC-30 の 9）S2 から，ポート噴射にして $6\ \text{s}$，直噴に戻して $6\ \text{s}$ 運転する．どちらの間も完爆の状態と燃料が OFF にならず，$\bar N$ の最小が $550\ \text{rpm}$ 以上（実測：$663$，$775\ \text{rpm}$），状態が有限．直噴に戻した後の最後の $2\ \text{s}$ は $800 \pm 40\ \text{rpm}$（実測 $18.8\ \text{rpm}$．ポート噴射の $6\ \text{s}$ の最後の $2\ \text{s}$ は偏差 $80\ \text{rpm}$ で，整定の途中である．ポート噴射への切り替えは整定が遅く，$10\ \text{s}$ 後でも $43\ \text{rpm}$ なので，こちらには判定値を置かない）．

**TEST-31** は画面の文書（`docs/gui.md`）にある．

---

### TEST-32：最適化（バルブタイミング）（REQ-32，SPEC-32）

1. [U]（タブ）上のタブの 5 番目が「最適化」で，その中の `[バルブタイミング]` `[VVT マップ]` `[熱効率の内訳]` で領域が切り替わる（ボタンの強調も）．ボタンが $44\ \text{px}$ 以上で文字幅の余裕を満たす．ページと容器がスクロールしない．
2. [A]（探索器）4 変数の関数 $J(\mathbf x) = 3e^{-\lVert\mathbf x - \mathbf a\rVert^2/(2 \cdot 30^2)} + e^{-\lVert\mathbf x - \mathbf b\rVert^2/(2 \cdot 8^2)}$（$\mathbf b = \mathbf x_0 = (-10, 264, 490, 730)$，$\mathbf a = (-30, 239, 505, 750)$．最大は $\mathbf a$ で $J = 3$，$\mathbf x_0$ の近くに $J \approx 2.2$ の局所最大がある）で，探索の結果が $\mathbf a$ に一致し，評価の回数が 500 以下．評価したすべての点の作用角が $1^\circ$ 以上 $719^\circ$ 以下．同じ種で同じ結果になる．
3. [S]（評価の条件）S4 から作った評価器で 1 回評価すると，評価の機関の角速度が $\frac{\pi\bar N_0}{30}$ のまま（相対 $10^{-12}$），開度が $\alpha_0$，サイクル変動 OFF，点火の自動最適化 ON，壁温が一定で，周期定常の判定を満たす．
4. [S]（機関での探索）S4（$1500\ \text{rpm}$，開度 $15^\circ$）で軸トルク最大を探索すると：結果の 8 近傍の $J$（同じ評価器で評価）がどれも $J(\mathbf x^*)$ 以下，$J(\mathbf x^*) \ge J(\mathbf x_0)$，結果が VALVE HIT にならない，評価の回数が 400 以下，所要時間が $60\ \text{s}$ 以下．
5. [U]（画面の操作）運転中の機関で `[探索]` を押し，数フレームの後に `[中止]` を押すと探索が止まり，結果の表にそれまでの最良の点が出る．`[適用]` で設定の 4 項目が結果に変わり，`[元に戻す]` で前の値に戻る．探索の間のフレームの間隔が $250\ \text{ms}$ 以下．

### TEST-33：熱効率の損失の内訳（REQ-33，SPEC-33）

1. [S]（和）S4 と W3000 の運転中の機関で計算すると，$\eta_O = 1 - \varepsilon^{-0.4}$（相対 $10^{-12}$），$\eta_O - \sum(\text{損失}) = \eta_i$（相対 $10^{-9}$），$\eta_i$ が実際のサイクルの $\frac{W}{m_f H_u}$（SPEC-14 の図示熱効率）に一致（相対 $10^{-12}$）．等容度が $0$ より大きく $1$ 以下．機械損失 $= \eta_i - \eta_b$ で，$\eta_b$ が実際のサイクルの正味熱効率（SPEC-14）に一致（相対 $10^{-12}$），$0 < \eta_b < \eta_i$．
2. [S]（再計算の一致）段 h の再計算の排気弁が開く時点の筒内圧が，実際のサイクルの同じ時点の筒内圧に一致する（相対 $10^{-6}$）．
3. [S]（無くした場合）壁面の熱伝達の係数を $0$ にした機関で冷却損失の絶対値が $10^{-6}$ 以下．EVO を $540^\circ$ にした機関で吹き出しの損失の絶対値が $10^{-6}$ 以下．
4. [U]（画面）運転中に `[熱効率の内訳]` を表示すると，$3\ \text{s}$ 以内に図が出て，12 行（理論，8 つの損失，正味の図示熱効率，機械損失，正味熱効率）の名前と値が Canvas の中にある．表示の間のフレームの間隔が $250\ \text{ms}$ 以下で，1 回の描画が $6\ \text{ms}$ 以下．
5. [A][S]（分け方）$\phi = 1$，$5\ \text{MPa}$ の既燃ガスの内部エネルギーが，$2800\ \text{K}$ で平衡の表のほうが解離の無い表より $100\ \text{kJ/kg}$ 以上高く（実測 $299\ \text{kJ/kg}$），$1000\ \text{K}$ で差が $10\ \text{kJ/kg}$ 以下．$T_{nd}$ の平衡組成の CO，H$_2$，OH のモル分率の和が $10^{-3}$ 以下．S4 と W3000 で，$0.85 < \xi \le 1$，燃え残りの損失 $= \eta_A - \eta_U > 0$，比熱比の低下の損失が $5\ \%\text{pt}$ より大きく，熱解離の損失が $0$ より大きく $5\ \%\text{pt}$ 未満．
6. [S]（圧縮比の定義）S4 と W3000 で，$\varepsilon_c = \frac{V(\theta_{\text{IVC}})}{V_c}$，$\varepsilon_e = \frac{V(\theta_{\text{EVO}})}{V_c}$（弁時期から別に計算．相対 $10^{-6}$），$1 < \varepsilon_c, \varepsilon_e \le \varepsilon$，段の名前がその値（小数 1 桁）で始まる．S4 の機関で IVC を $200^\circ$，EVO を $530^\circ$ にすると，$\frac{\varepsilon_e}{\varepsilon_c}$ が元より小さくなる．

### TEST-34：VVT マップ（REQ-34，SPEC-34）

1. [U]（ボタン）「最適化」タブの `[バルブタイミング]` `[VVT マップ]` `[熱効率の内訳]` で領域が切り替わる（ボタンの強調も）．ボタンが $44\ \text{px}$ 以上で文字が収まる．ページと容器がスクロールしない．
2. [A]（補間と等高線）双一次補間が格子の点で格子の値に一致し（相対 $10^{-12}$），場 $f = 2\phi_{\text{in}} + 3\phi_{\text{ex}}$ では任意の点で $f$ に一致する（$10^{-9}$）．同じ場の等高線 $f = 50$ の線分の端点がすべて $|2\phi_{\text{in}} + 3\phi_{\text{ex}} - 50| \le 10^{-9}$ を満たし，線分が 1 本以上ある．格子の順序が段階 1 の 9 点，段階 2 の 16 点，段階 3 の 56 点で，81 点が 1 度ずつ現れる．
3. [S]（機関）S4 でマップを計算すると：VALVE HIT でない格子の点がすべて値を持つ．$(0, 0)$ の $T_b$ が，同じ評価器で現在の位相を細かい許容で評価した値と，粗い許容の 2 倍以内で一致する．★ の 4 近傍（範囲の中）の $T_b$ が ★ の値 ＋ 細かい許容の 2 倍以下で，★ の $T_b$ が格子の最大 − 粗い許容以上．◆ について $\eta_b$ で同じ．計算が $40\ \text{s}$ 以下．
4. [U]（操作）S4 の機関で `[計算]` を押し，段階 1 が埋まった後に `[中止]` を押すと止まる．マップの $(-20^\circ, 10^\circ)$ に当たる位置をタップすると，選んだ点が $(-20, 10)$ になり読み取りの行に出る．`[適用]` で設定の $\phi_{\text{in}} = -20^\circ$，$\phi_{\text{ex}} = 10^\circ$ になり，`[元に戻す]` で前の値に戻る．計算の間のフレームの間隔が $250\ \text{ms}$ 以下．
5. [U]（描画）段階 1 の値でマップを描くと，○ ★ ◆ ＋ の印と凡例の帯が Canvas の中にある．色の画像を作った後の描画 30 回の平均が $6\ \text{ms}$ 以下．
6. [A]（出力の無い点）$\phi_{\text{in}} < 0$ で $T_b < 0$（$\eta_b$ が未定義），$\phi_{\text{in}} \ge 0$ で $\eta_b$ が $0.004$〜$0.04$ の 81 点の格子（約 $10000\ \text{rpm}$ の全開の形）で：表示の格子の燃料消費率が，$\eta_b$ が未定義の点でちょうど未定義．等高線が 8 本以下で，値がすべて $[b_{\min}, 2b_{\min}]$ の中，線分の端点の補間の値がすべて定義されている．$T_b = 0$ の線分がある．未定義の点を選んだときの読み取りに「出力なし」が出る．刻みの関数が，範囲 $0.5$，$37$，$6 \times 10^4$ のどれでも 1〜8 本を返す．

### TEST-35：シャシーダイナモメーター（REQ-35，SPEC-35）

1. [S]（エンジンダイナモメーターへ影響しない）試験の種類がエンジンのとき，車両の設定（車重 $2000\ \text{kg}$，$C_d = 1$）を変えて始動から $5\ \text{s}$ を計算した機関の状態ベクトルが，既定の車両の設定での状態と完全に一致し，車速が $0$．
2. [A]（走行抵抗）既定の設定で $F_{\text{res}}(30\ \text{m/s}) = \tfrac12\rho C_d A \cdot 30^2 + C_{rr}m_v g$（相対 $10^{-12}$．$\rho = \frac{p_{\text{atm}}}{R\,T_{\text{atm}}}$）．$F_{\text{res}}(0) = C_{rr}m_v g$．
3. [A]（予測）$P_{\max} = 25\ \text{kW}$ と既定の車両で，$\eta_d P_{\max} = F_{\text{res}}(v_{\max})v_{\max}$（相対 $10^{-9}$）．走行抵抗を $0$（$C_d = 0$，$C_{rr} = 0$），駆動力の上限を無しにすると $t(v_1) = \frac{m_v v_1^2}{2\eta_d P_{\max}}$（相対 $10^{-9}$）．$P_{\max} = 3\ \text{kW}$ では $0 \to 100\ \text{km/h}$ が「届かない」（NaN）で，$v_{\max} < 100\ \text{km/h}$．
4. [A]（傾向）$P_{\max} = 25\ \text{kW}$ で，車重 $400, 600, 900\ \text{kg}$ の順に $0 \to 100\ \text{km/h}$ の時間が延び，$C_d = 0.25, 0.30, 0.45$ の順に最高速度が下がる．
5. [S]（実時間の走行）シャシー，全開，目標 $4000\ \text{rpm}$，車重 $200\ \text{kg}$ で始動から $9\ \text{s}$：$0 \to 100\ \text{km/h}$ の計測値が，最後の 1 サイクルの軸出力 $P_b$ を $P_{\max}$ に置いた予測と $5\%$ 以内．$100\ \text{km/h}$ を超えた後の $\bar N$ が $4000 \pm 25\ \text{rpm}$．続けてスロットル開度を $0^\circ$ にして $7.5\ \text{s}$ で車速が $0$ になる．
6. [U]（設定ページ「車両」）6 項目があり，ページがスクロールしない．$P_{\max}$ を与えた状態で，文字に $0 \to 100\ \text{km/h}$ の時間と最高速度が出て，車重の `[+]` を押すと同じ操作の中で時間の文字が変わり，$C_d$ の `[+]` で最高速度の文字が変わる．図（横軸が車速 [km/h]，縦軸が力 [kN]，系列が駆動力と走行抵抗）に単位付きの軸名と目盛がある．$P_{\max}$ が無いときは「計測中」と出て，自動の計測が進むと $20\ \text{s}$ 以内に値が出る．計測の間のフレームの間隔が $250\ \text{ms}$ 以下．
7. [U]（運転タブ）シャシーで運転中の機関（車速 $87.3\ \text{km/h}$，計測値 $12.3\ \text{s}$ を与える）の制御状態の表示に「シャシー」「車速 87.3 km/h」「0→100 km/h 12.3 s」「駆動力」と kN の値があり，エンジンのときは無い．最長の表示（車速 $399.9\ \text{km/h}$，目標 $20000\ \text{rpm}$）でも 4 行が折り返さない．シャシーでは設定の「回転数の制御」の行が「（不使用）」で，スロットル開度の帯が出る．

## 9. 開発時検証 [D]

`npm test` は，文書とコードの整合を点検し，成果物をビルドし，ヘッドレス Chromium で次の 7 通りについてテストを実行する（SPEC-15 A.2，SPEC-20）．

| ビューポート | 入力 | 実行する項目 | MathJax |
| :--- | :--- | :--- | :--- |
| $360 \times 640$ | タッチ | 全項目 | 手元の版 |
| $384 \times 780$ | タッチ | 画面のモード | 手元の版 |
| $412 \times 915$ | タッチ | 画面のモード | 手元の版 |
| $384 \times 780$（極端な利用者状態．TEST-20 項目 4） | タッチ | 全項目 | 遮断 |
| $820 \times 1180$ | タッチ | 画面のモード | 手元の版 |
| $1180 \times 820$ | タッチ | 画面のモード | 手元の版 |
| $1440 \times 900$ | マウス | 画面のモード | 手元の版 |

全項目の 2 通りが 35/35 PASS，画面のモードの 5 通りが実行した全テストで PASS し，極端な利用者状態では実行の前後で状態が一致することを納品条件とする．画面のモード（SPEC-20 B の 9）は，画面の大きさによらない [A][S] の項目を 5 回繰り返さないためのもので，1 通りあたりの所要は全項目の約 5 分の 1 である（実測：全項目 $221.8$〜$227.5\ \text{s}$，画面のモード $39.8$〜$45.3\ \text{s}$，7 通りで $11.1$ 分）．MathJax は，手元の MathJax 3.2.2（`vendor/mathjax-3.2.2/es5/tex-svg.js`．環境変数 `MATHJAX` で場所を変えられる）を CDN の URL に振り向けて読み込み，極端な利用者状態では読み込みを遮断して TeX の表示で全テストを通す．
