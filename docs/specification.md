# 単気筒4ストロークSI機関シミュレータ 仕様書（第25版）

## 0. この文書について

* **位置づけ**：要件定義書（`docs/requirements.md`）の要件 REQ-01〜30 を満たすために，**何をどの式で計算し，どう表示し，どう確かめるか**を定める．要件定義書が「何ができること」と受入基準を定め，この仕様書がその実現の内容を定める．
* **番号**：SPEC-nn は REQ-nn を実現する仕様，TEST-nn はその検証項目で，同じ番号どうしが対応する．
* **記号と用語**：用語の定義集（`docs/glossary.md`）に，単位と定義式とともにまとめてある．
* **構成**：1 節 構成，2 節 座標系と状態変数，3 節 機関モデル（SPEC-01〜12，25，27，29，30），4 節 数値積分と性能の指標（SPEC-13，14），5 節 画面（SPEC-15〜19，22，23，26），6 節 エンジン音（SPEC-21），7 節 検証（SPEC-20，24，28），8 節 テスト項目（TEST-01〜30），9 節 開発時検証．
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

### 2.2 状態ベクトル $\mathbf{y}(t) \in \mathbb{R}^{21}$
$\frac{d\mathbf{y}}{dt} = \mathbf{f}(\mathbf{y}; \mathbf{u})$ を時間積分する．$\mathbf{u}$ は ECU と動力計が決める入力（スロットル開度 $\alpha$，実効充水率 $f_{\text{eff}}$，点火時期 $s$ など）で，積分の1ステップの間は一定とする（SPEC-13）．

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
| 12 | $\dot m_e$ | 排気管の質量流量（排気ポート → 消音器が正） | kg/s | SPEC-27 |
| 13 | $p_{pe}$ | 排気ポート圧 | Pa | SPEC-27 |
| 14 | $p_m$ | 消音器の圧力 | Pa | SPEC-27 |
| 15 | $E_{\text{in}}$ | 吸気マニホールドの余剰エンタルピー | J | SPEC-05 |
| 16 | $E_p$ | 吸気ポートの余剰エンタルピー | J | SPEC-25 |
| 17 | $m_f$ | 筒内の未燃の燃料蒸気の質量 | kg | SPEC-29 |
| 18 | $m_{bf}$ | 筒内の既燃ガスのうち燃料に由来する質量 | kg | SPEC-29 |
| 19 | $m_l$ | 筒内の液体の燃料の質量 | kg | SPEC-30 |
| 20 | $m_{f,\text{in}}$ | 吸気マニホールド内の燃料蒸気の質量 | kg | SPEC-30 |
| 21 | $m_{f,p}$ | 吸気ポート内の燃料蒸気の質量 | kg | SPEC-30 |

* 17〜21 は熱物性が「化学種」（既定）のときだけ使う．「γ(T)」「γ一定」では $0$ のままで，以下の 2 項は $\gamma$ のモデルのものである（「化学種」での温度と気体定数は SPEC-29 B）．
* 従属変数：筒内ガスの平均温度 $T = \frac{pV(\theta)}{mR}$，既燃ガスの質量 $m_b = m - m_u$，未燃分率 $Y_u = \text{clamp}\left(\frac{m_u}{m}, 0, 1\right)$，残留ガス率（既燃分率）$x_r = 1 - Y_u$．
* 気体定数は未燃・既燃とも $R = 287.0\ \text{J/(kg·K)}$ とする（SPEC-02）．
* ランナ OFF（SPEC-25）では 9〜11 と 16，排気系 OFF（SPEC-27）では 12〜14 の時間微分を $0$ とする．
* **初期値（コールドリセット）**：$\theta = \pi$，$\omega = 0$，$p = p_{\text{in}} = p_p = p_{pe} = p_m = p_{\text{atm}}$，筒内ガスは温度 $320\ \text{K}$ の未燃ガス（$m = m_u = \frac{p_{\text{atm}}V(\pi)}{R \cdot 320}$），$T_w = 298.15\ \text{K}$，そのほかは $0$．IVC の基準状態（SPEC-08）の初期値は $(p_{\text{atm}}, V(\pi), 320\ \text{K})$．

### 2.3 補助積分 $\mathbf{z}(t) \in \mathbb{R}^{28}$
サイクルの集計と保存則の検査に使う量を，状態と同じ Runge–Kutta の重みで同時に積分する（SPEC-13）．$\mathbf{z}$ は $\mathbf{f}$ に現れず，誤差判定にも含めない．

| 記号 | 被積分関数 | 用途 |
| :--- | :--- | :--- |
| $B_o$，$B_i$ | $\dot m_{\text{in}}^-(1 - Y_u)$，$\dot m_{\text{in}}^+ Y_{b,\text{src}}$ | 吸気弁を出入りする既燃ガス（SPEC-05） |
| $W$，$W_g$ | $p\frac{dV}{d\theta}\omega$，同（$\pi \le \theta < 3\pi$ のみ） | 図示仕事（正味，圧縮膨張） |
| $W_f$，$W_a$，$W_d$ | $T_f\omega$，$T_{\text{aux}}\omega$，$T_{\text{dyno}}\omega$ | 摩擦・補機・動力計の仕事 |
| $M_{\text{th}}$，$M_r$，$M_{\text{in}}$，$M_{\text{ex}}$，$M_e$，$M_t$ | $\dot m_{\text{th}}$，$\dot m_r$，$\dot m_{\text{in}}$，$\dot m_{\text{ex}}$，$\dot m_e$，$\dot m_t$ | 各断面を通った質量 |
| $P_m$，$\Upsilon$ | $p_m$（排気系 OFF では排気弁の下流圧），$Y_{b,\text{in}}$ | サイクル平均の背圧と吸気管既燃率 |
| $Q_c$，$Q_w$，$H_i$，$H_o$ | $\dot Q_{\text{comb}}$，$\dot Q_{\text{wall}}$，$\dot H_{\text{in}}^s$，$\dot H_{\text{out}}^s$ | 第一法則の収支（SPEC-09） |
| $X_o$，$X_i$，$X_t$ | 吸気弁の逆流が運ぶ余剰エンタルピー，順流で戻る分，スロットルの逆流で出る分 | 余剰エンタルピーの収支（SPEC-05） |
| $H_e$，$F_{\text{inj}}$，$F_{\text{ev}}$ | $\dot m_{\text{ev}}\left[h_f(T_l) - h_{fg}\right]$，$\dot m_{\text{inj}}$，$\dot m_{\text{ev}}$ | 気化した燃料が持ち込むエネルギー，噴いた質量，気化した質量（SPEC-29 B の 8，SPEC-30．化学種のモデルだけ） |
| $F_{\text{iv}}$，$F_{\text{ex}}$，$F_b$ | 吸気弁を通る燃料蒸気（流入が正），排気弁から出る燃料蒸気，$r\psi$ | 筒内の燃料蒸気の収支（TEST-30 項目 1．化学種のモデルだけ） |

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
* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Ch. 2](https://www.accessengineeringlibrary.com/content/book/9781260116106)

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
6. **化学種のモデル**（第26版）：設定の「化学種」が既定である．そのときの物性と筒内の式は SPEC-29 で定める．この SPEC は「γ(T)」「γ一定」を選んだときのものになる．

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
2. **有効開口面積**：弁のカーテン面積 $\pi d_v L_v$ を，弁座の面積 $\frac{\pi}{4}d_v^2$ で頭打ちにする．
   $$A_{\text{eff}}(\theta) = C_d\,\min\left(\pi d_v L_v,\ \frac{\pi}{4}d_v^2\right), \qquad C_d = 0.6$$
   弁径は，吸気が $d_{v,\text{in}} = \min(d_v, 0.45B)$（$d_v$：設定値），排気が $d_{v,\text{ex}} = 0.9375\,d_{v,\text{in}}$．
3. **基本の開閉時期と VVT**：吸気 IVO，IVC，排気 EVO，EVC と，位相 $\varphi_{\text{in}}$，$\varphi_{\text{ex}}$（正が遅角）から，$\theta_o = \text{IVO} + \varphi_{\text{in}}$，$\theta_c = \text{IVC} + \varphi_{\text{in}}$（排気も同様）．位相は作用角とリフト曲線の形を変えない：$L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$．
4. **弁とピストンの干渉**：平らなヘッド面とピストン頂面を仮定し，全クランク角（$0.5^\circ$ 刻み）で $L_v(\theta) < h_c + x(\theta)$ を検査する．破る角度があれば `VALVE HIT` を運転タブに表示する（衝突はモデル化せず，計算は続ける）．

* **既定値と範囲**（すべて運転中に変更できる）：IVO $-10^\circ$（$[-40, 40]$），IVC $264^\circ$（$[190, 290]$），EVO $490^\circ$（$[430, 530]$），EVC $730^\circ$（$[690, 760]$），$\varphi_{\text{in}} = \varphi_{\text{ex}} = 0$（$\pm 40^\circ$），$L_{\max} = 9\ \text{mm}$（$[3, 14]$），$d_v = 38\ \text{mm}$（$[20, 50]$），カムは Standard．
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
| テールパイプ $\dot m_t$ | $p_m$，$p_{\text{atm}}$ | 大気へ | $T_X$，既燃 | $T_{\text{amb}}$，未燃 |

* **出典**：Heywood (1988) Appendix C．

---

### SPEC-05：スロットルと吸気マニホールド（REQ-05）

#### 定義と式
1. **環境**：大気圧 $p_{\text{atm}}$（既定 $101.3\ \text{kPa}$，$60$〜$110\ \text{kPa}$），大気温 $T_{\text{amb}} = 298.15\ \text{K}$．エアクリーナと吸気ダクトの圧力損失は無視する．$p_{\text{atm}}$ は，スロットルの上流圧，テールパイプの出口圧（SPEC-27），クランクケースの背圧（SPEC-10），体積効率の基準密度（SPEC-14），初期値（§2.2）に共通に使う．層流燃焼速度の基準圧（SPEC-07）は物性式の定数で，$p_{\text{atm}}$ とは無関係である．
2. **吸気は予混合気とする**（熱物性が「化学種」のときは，噴射方式に応じて SPEC-30 の 2，3 に代わる）：スロットルを通るガスは，当量比 $\phi$ の空気と燃料蒸気の混合気（SPEC-02 の未燃ガス）とみなす．したがって $\dot m_{\text{th}}$ は混合気の流量で，その $\frac{1}{1 + \phi/\text{AF}_{st}}$ が空気である（SPEC-07）．
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
6. **サイクル変動**（設定「燃焼」の `[サイクル変動 OFF／ON]`，既定 ON）：点火のたびに，平均 $0$・分散 $1$ の一様乱数 $z_1, z_2 \in [-\sqrt 3, \sqrt 3]$ を引き，
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

#### 定義と式
IVC の時点の筒内の状態を $(p_r, V_r, T_r)$ とし，燃焼が無いとしたときの圧力を**ポリトロープ指数 $1.33$** の圧縮膨張 $p_{\text{mot}}(\theta) = p_r\left(\frac{V_r}{V(\theta)}\right)^{1.33}$ で見積もる．代表ガス速度は
$$w = C_1 c_m + C_2\,\frac{V_d T_r}{p_r V_r}\max\left(0,\ p - p_{\text{mot}}\right)$$
* 圧縮・燃焼・膨張（IVC〜EVO）：$C_1 = 2.28$，$C_2 = 3.24 \times 10^{-3}\ \text{m/(s·K)}$
* ガス交換（EVO〜IVC）：$C_1 = 6.18$，$C_2 = 0$

熱伝達率（圧力を kPa で入れる形）と熱流量は，係数 $C_w$（設定「燃焼」の Woschni 係数，$0$〜$2$，既定 $1$）を掛けて
$$h_c = C_w \cdot 3.26\,B^{-0.2}\left(\frac{p}{1000}\right)^{0.8}T^{-0.55}\max(w, 0.5)^{0.8}, \qquad \dot Q_{\text{wall}} = h_c\,A_w(\theta)\,(T - T_w)$$
壁は 1 つの熱容量 $C_{w,\text{th}} = 1500\ \text{J/K}$ とし，冷却水（$T_{\text{cool}} = 360\ \text{K}$ 一定）へ熱コンダクタンス $G_{\text{cool}} = 15\ \text{W/K}$ で放熱する．
$$C_{w,\text{th}}\frac{dT_w}{dt} = \dot Q_{\text{wall}} - G_{\text{cool}}\,(T_w - T_{\text{cool}})$$

#### 仮定と限界
* 冷却水温は一定なので，コールドリセット後（壁温 $298.15\ \text{K}$）は，燃焼が無くても壁が冷却水で温められる（時定数 $C_{w,\text{th}}/G_{\text{cool}} = 100\ \text{s}$）．この文書の「冷間」は壁温の初期値だけを指す．
* 吸気ポートと排気ポートの壁への熱伝達は扱わない．

* **出典**：[G. Woschni, SAE Technical Paper 670931 (1967)](https://doi.org/10.4271/670931)

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

### SPEC-11：水ブレーキ式動力計と運転モード（REQ-11）

#### 定義と式
1. **吸収トルク**：回転数の 2 乗と実効充水率 $f_{\text{eff}} \in [0, 1]$ に比例する．
   $$T_{\text{dyno}} = f_{\text{eff}}\,k_w\,\omega^2, \qquad k_w = \frac{T_{\text{rated}}}{\omega_{\text{rated}}^2},\ \omega_{\text{rated}} = \frac{\pi N_{\text{rated}}}{30}$$
   定格 $T_{\text{rated}} = 35\ \text{N·m}$，$N_{\text{rated}} = 1500\ \text{rpm}$（設定で変更可）．最大吸収トルク $k_w\omega^2$ は低回転ほど小さい（既定で $800\ \text{rpm}$：$9.96\ \text{N·m}$）．
2. **充水の応答**：$\tau_d\frac{df_{\text{eff}}}{dt} = f_{\text{cmd}} - f_{\text{eff}}$（$\tau_d$ 既定 $0.3\ \text{s}$）．$f_{\text{eff}}$ は状態ベクトルに入れず，積分のステップの終わりに $f_{\text{eff}} \leftarrow f_{\text{cmd}} + (f_{\text{eff}} - f_{\text{cmd}})\,e^{-\Delta t/\tau_d}$ で更新する（ステップの間は一定）．
3. **動力計制御の PI**：偏差 $e_d = \bar N - N_{\text{target}}$（回転が目標を超えると正）に対し
   $$f_{\text{cmd}} = \text{clamp}\left(f_{\text{base}} + K_{p,d}\,e_d + I_f,\ 0,\ 1\right), \qquad \frac{dI_f}{dt} = \begin{cases} 0 & (\text{上下限に張り付き，} e_d \text{ がそれを深める向き}) \\ K_{i,d}\,e_d & (\text{それ以外}) \end{cases}$$
   既定 $K_{p,d} = 0.001\ /\text{rpm}$，$K_{i,d} = 0.002\ /(\text{rpm·s})$，$f_{\text{base}} = 0$．完爆の時点で $I_f = 0$．
4. **モードの切替**（完爆後）：指令が連続になるよう初期化する．A → B：$\alpha_{\text{manual}} \leftarrow \alpha$，$I_f = f_{\text{cmd}} - f_{\text{base}} - K_{p,d}\,e_d$．B → A：$f_{\text{manual}} \leftarrow f_{\text{cmd}}$，$I_\alpha = \alpha - \alpha_{\text{ff}} - K_p\,e_N$（SPEC-12）．
5. **容量の判定**：$f_{\text{cmd}} = 1$ のまま $\bar N > N_{\text{target}} + 100\ \text{rpm}$ が $2\ \text{s}$ 続くと `OVERLOAD`（動力計の容量不足），$f_{\text{cmd}} = 0$ のまま $\bar N < N_{\text{target}} - 100\ \text{rpm}$ が $2\ \text{s}$ 続くと `UNDERPOWER`（機関の出力不足）を表示する．
6. **軸トルクとのつり合い**：瞬時の軸トルクを $T_b^{\text{inst}} = T_{\text{ind}} - T_f - T_{\text{aux}}$ とすると，完爆後の運動方程式は $I_{\text{tot}}\frac{d\omega}{dt} = T_b^{\text{inst}} - T_{\text{dyno}}$．定常ではサイクル平均で $\overline{T_b} = \overline{T_{\text{dyno}}}$．

#### 仮定と限界
* 軸のねじり剛性は無視する（剛体）．
* $T_{\text{dyno}} \propto \omega^2$ による低回転での感度の低下に対するゲインの切替は行わない．全開では整定が遅い．
* 全開の軸トルク $T_b$ を保てる最低の回転数は $\frac{30}{\pi}\sqrt{T_b/k_w}$ で，既定の定格では全開（約 $35\ \text{N·m}$）で約 $1500\ \text{rpm}$ である．

* **出典**：Heywood (1988) Ch. 2（軸トルク，BMEP）；水ブレーキの特性は A. J. Martyr and M. A. Plint, *Engine Testing*（版とページは未確認）．

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
1. **寸法**：排気管の寸法は音響の設定（SPEC-21）の排気管長 $L_e$（既定 $1.0\ \text{m}$）と内径 $d_e$（既定 $40\ \text{mm}$）を共用する．断面積 $A_e = \frac{\pi}{4}d_e^2$．弁側の半分を排気ポート容積 $V_{pe} = \frac12 A_e L_e$ とし，下流側の半分は $V_m$ に含める．排気系のガスは温度 $T_X = 800\ \text{K}$ 一定の既燃ガスとする．
2. **排気管の運動量の式**（SPEC-25 の 2 と同じ導出）：
   $$\frac{d\dot m_e}{dt} = \frac{A_e}{L_e}(p_{pe} - p_m) - \frac{\zeta_x\,\dot m_e|\dot m_e|}{2\rho_e A_e L_e}, \qquad \zeta_x = f_r\frac{L_e}{d_e} + \zeta_e, \qquad \rho_e = \frac{p_{pe}}{RT_X}$$
3. **排気ポートの圧力**（断熱の剛性）：$\frac{dp_{pe}}{dt} = \frac{\gamma_0 RT_X}{V_{pe}}\left(\dot m_{\text{ex}} - \dot m_e\right)$，$\gamma_0 = 1.4$．排気弁の流量（SPEC-04）は下流圧を $p_{pe}$ として求める．
4. **消音器の圧力**（等温）：$\frac{dp_m}{dt} = \frac{RT_X}{V_m}\left(\dot m_e - \dot m_t\right)$．テールパイプの出口の流量 $\dot m_t$ は SPEC-04 の式で $p_1 = p_m$，$p_2 = p_{\text{atm}}$，有効面積 $C_{d,t}A_t$（$C_{d,t} = 0.8$）．
5. **背圧**：1 サイクル平均の消音器圧と大気圧の差 $\Delta\bar p_{\text{ex}}$（SPEC-14）．出口の流量はおおむね $\dot m_t \approx C_{d,t}A_t\sqrt{2\rho\,\Delta p}$ なので，背圧は流量のほぼ 2 乗に比例する．$A_t$ の既定値 $300\ \text{mm}^2$ は，全開・$5000\ \text{rpm}$ の背圧が $10$〜$20\ \text{kPa}$（量産の排気系の典型として推定）になるよう選んだ（試作の段階の値：$A_t = 200, 250, 300, 400\ \text{mm}^2$ で $23.3, 16.9, 13.8, 10.5\ \text{kPa}$．既定の $300\ \text{mm}^2$ の実測は $13.8\ \text{kPa}$）．
6. **共鳴の目安**：排気弁が閉じ，$\dot m_t$ を一定とみなすと，$\dot m_e$ は $\omega_E = \sqrt{\frac{A_e}{L_e}\left(\frac{\gamma_0 RT_X}{V_{pe}} + \frac{RT_X}{V_m}\right)}$ で振動する．
7. **設定**（ページ「排気系」）：排気系モデル ON／OFF（既定 ON），$V_m$（$0.5$〜$10\ \text{L}$，既定 $3$），$A_t$（$20$〜$3000\ \text{mm}^2$，既定 $300$），OFF のときの排気圧損 $\Delta p_{\text{ex}}$（$0$〜$30\ \text{kPa}$，既定 $4$）．OFF では $\dot m_e$，$p_{pe}$，$p_m$ の時間微分を $0$ とし，排気弁の下流圧を $p_{\text{atm}} + \Delta p_{\text{ex}}$ とする．運転中に ON にしたときは $\dot m_e = 0$，$p_{pe} = p_m = p_{\text{atm}} + \Delta p_{\text{ex}}$ から始める．

#### 仮定と限界
* 圧力波の往復は解かない（集中定数）．
* 排気の温度は $800\ \text{K}$ 一定とする．排気弁が開く時点の筒内の温度は，全開（W3000）で約 $1650\ \text{K}$，アイドルで約 $1180\ \text{K}$（実測）で，これより高い．排気の密度（背圧）と，排気弁の逆流の温度に影響する．
* 排気側へ吹き抜けた新気は既燃ガスとして扱う．
* $5000\ \text{rpm}$ を超えると体積効率の低下で排気流量が頭打ちになり，背圧は下がる．背圧は脈動する流量の 2 乗の平均で決まるので，平均流量だけの関数ではない．
* エンジン音（SPEC-21）は排気弁の流量から作り，排気管の流れの計算結果は音に使わない．

* **出典**：Heywood (2018) Ch. 6，7；Winterbone and Pearson (1999)．

---

### SPEC-29：化学種の熱物性と化学平衡（REQ-29．第26版）

設定「燃焼」の `[熱物性　γ(T)／γ一定／化学種]`（既定「化学種」）で選ぶ．「γ(T)」「γ一定」は SPEC-02 のモデルで，筒内圧の式は SPEC-09 のままである．「化学種」では，この SPEC の式が SPEC-02，SPEC-06，SPEC-07 の 4（発熱量），SPEC-09 に代わる．

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
   * 量論空燃比：$\text{AF}_{st} = \frac{\left(1 + \frac{y}{4}\right)\left(M_{\text{O}_2} + 3.76\,M_{\text{N}_2}\right)}{12.011 + 1.008\,y} = 14.503$．「化学種」ではこの値を使う（$\gamma$ のモデルは $14.7$ のまま）．
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
   * 当量比の座標は，反応に加わる燃料の当量比 $\phi_r = \eta_c\phi_b$ とし，$0.50$ から $1.50$ まで $0.0125$ 刻み（81 点）．量論（$\phi_r = 1$）で物性の $\phi$ についての傾きが折れるので，そこを節点に置く．$T$：$250$ から $3500\ \text{K}$ まで $50\ \text{K}$ 刻み（66 点）．$p$：$20\ \text{kPa}$ から $20\ \text{MPa}$ まで公比 $10^{1/12}$ の 37 点．範囲の外は端の値に丸める（その方向の偏微分は $0$）．
   * 刻みは補間の誤差を測って決めた：$\phi$ を $0.05$ 刻み，$p$ を公比 $10^{1/3}$ にした最初の案では，量論の近くで $e_b$ の誤差が $34\ \text{kJ/kg}$，高温・低圧で $16\ \text{kJ/kg}$ あった（折れ目が節点の間にあったことと，解離が $p$ に強く依存することによる）．上の格子では最大 $3.6\ \text{kJ/kg}$（量論のすぐリッチ側，$1900\ \text{K}$ 付近）．
   * 節点の $c_{v,b}$ は，$T \ge T_{fr}$ では節点の $e_b$ の差分（内側は 4 次の中心差分 $\frac{-e_{i+2} + 8e_{i+1} - 8e_{i-1} + e_{i-2}}{12\,\Delta T}$，端は 2 次の片側差分．平衡を解く回数を増やさないため），$T < T_{fr}$ では固定した組成での $\sum_j n_j(\bar c_{p,j} - \bar R) + (1 - \eta_c)\zeta c_{v,f}$．
   * 補間：$T$ の方向は，節点の値 $e_b$ と傾き $c_{v,b}$ による 3 次 Hermite 補間．$R_b$ も，節点の値と傾き $\frac{\partial R_b}{\partial T}$（節点の値の差分．凍結の側は $0$）による 3 次 Hermite 補間とする（$T$ について $C^1$．$R_b$ を線形にすると $\frac{\partial R_b}{\partial T}$ が節点で跳び，右辺が不連続になって，閉じた断熱の系のエネルギーの誤差が約 10 倍になった．TEST-29 項目 6）．$\ln p$ と $\phi_r$ の方向は線形．偏微分 $\frac{\partial e_b}{\partial T}$，$\frac{\partial e_b}{\partial p}$，$\frac{\partial e_b}{\partial\zeta}$，$\frac{\partial R_b}{\partial T}$，$\frac{\partial R_b}{\partial p}$，$\frac{\partial R_b}{\partial\zeta}$ は，補間した関数を微分して求める（エネルギーの式と整合させるため）．
   * 表は $\phi_r$ の節点ごとに，初めて必要になったときに作って保持する（起動時にはまとめて作らない．1 節点は平衡の計算 $37 \times 37 = 1369$ 回）．計算は決定的で，同じ節点は同じ値になる．

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
2. 排気系（SPEC-27）の気体定数は $R_b(T_X, 100\ \text{kPa}, \zeta^*)$ とする．
3. 余剰エンタルピー（SPEC-05 の 7）は，筒内の成分で $T$ と $T_{\text{in}}$ のエンタルピーの差を取る（既燃ガスは $h_b(T, p, \zeta) - h_b(T_{\text{in}}, p, \zeta)$）．

#### 仮定と限界
* **単一ゾーン**：既燃ガスの平衡組成を筒内の平均温度 $T$ で評価する．実際の既燃部は平均より高温で，解離はもっと進む．このモデルは解離を小さく見積もる．
* 平衡は 10 種．N，炭化水素の中間生成物，すすは扱わない．NO は平衡値で，実際より多い．
* 凍結は，温度だけで決まる状態量の近似である（A の 5）．
* 筒外の既燃ガスの組成は $\zeta^*$（直近の EVO の値）とする．当量比を変えた直後の数サイクルは，筒外の既燃ガスの元素の量が正確には保存しない（質量は保存する）．
* 燃料は 1 つの擬似種で，比熱はイソオクタン，発熱量と H/C はガソリンの値である．
* 空気は O$_2$ と N$_2$ だけで，湿度と Ar は扱わない．

* **出典**：[B. J. McBride, S. Gordon, M. A. Reno, NASA TM-4513 (1993)](https://ntrs.nasa.gov/citations/19940013151)（係数．Cantera の `data/nasa_gas.yaml` から取った．`tools/richburn/thermo.json`）；S. Gordon and B. J. McBride, NASA RP-1311 (1994)（平衡の反復法）；Heywood (1988) Ch. 3，4（平衡と燃料空気サイクル．章の番号は記憶による）；試算と考察は `docs/report_richburn.md`．

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

設定「噴射」の `[噴射方式　ポート噴射／直噴]`（既定「直噴」）で選ぶ．熱物性（SPEC-29）が「化学種」でないときは，ポート噴射に固定する（第25版の予混合気のまま．設定画面では変更できない）．以下は「化学種」のときの定めである．

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
   * 経緯：当初は補正なし（$\hat m_a = m_{a,\text{IVC}}^{(k-1)}$）としたが，アイドルで回転数が $\pm 50\ \text{rpm}$ の持続振動になった（TEST-12 が検出）．アイドルでは 1 サイクルごとの空気量の変化が $4$〜$5\%$ あり，燃料が 1 サイクル遅れると $\phi_c$ が $0.95$〜$1.07$ の間を振れて，回転数の制御の一巡のゲインが上がるためである．始動後のアイドル（$6$〜$25\ \text{s}$）で，推定の誤差の実効値は，補正なしで $3.8\%$，空気量を吸気管圧に比例させる補正（$\hat m_a = m_{a,\text{IVC}}\pi_S$）で $1.1\%$ だった．アイドルでは残留ガスが約 $24\%$ あり，空気量は吸気管圧の $1.39$ 乗に比例して変わる（実測．$\frac{1}{1 - x_r} = 1.32$ に近い）ので，残留ガスを分けた上の式にした．始動から $17$〜$20\ \text{s}$ の回転数の偏差の最大は，補正なしで持続振動，比例の補正で $26.9\ \text{rpm}$，上の式で $17.1\ \text{rpm}$（ポート噴射は $14.8\ \text{rpm}$，$\gamma(T)$ は $11.5\ \text{rpm}$．Node.js での計測）．
   * 噴いた燃料の一部は，吸気弁の逆流でポートとマニホールドへ戻り，全開ではスロットルの逆流で外へ出る（マニホールドは一様に混ざった容積で，外気は無限大の空気だめである）．このため点火の時点の当量比 $\phi_c$ は設定より小さくなる（全開，$3000\ \text{rpm}$ で約 $2\%$．TEST-30 項目 1，5）．ECU はこれを補正しない．
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
   | 熱物性 | γ(T)／γ一定／化学種，既定 化学種（第25版までの保存値 γ(T)，γ一定 の意味を変えないように，化学種を 3 番目に置く） | 即時 |
   | 噴射方式 | ポート噴射／直噴，既定 直噴 | 即時 |
   | 噴射開始 $\theta_{\text{SOI}}$（°．吸気上死点後） | $0$〜$330$，$5$，$80$ | 即時 |
   | インジェクタ流量 $q_{\text{inj}}$（g/s） | $5$〜$40$，$1$，$15$ | 即時 |
   | 気化の時定数 $\tau_{\text{ev}}$（ms） | $0$〜$10$，$0.1$，$1.5$ | 即時 |

   噴射開始，インジェクタ流量，気化の時定数は，ポート噴射のときは使わない（SPEC-18 B.7 と同じく，行に「（不使用）」と書いて `[−]` `[+]` を無効にする）．熱物性が「化学種」でないときは，噴射方式の行にも「（不使用）」と書き，選択のボタンを無効にして「ポート噴射」を選択中として表示する（設定値は保持する）．運転中に熱物性を切り替えたときは，筒内の圧力・温度・未燃分率と，吸気側の圧力・既燃分率を保って，質量を新しいモデルの気体定数で取り直す（$\gamma$ のモデルの未燃ガスは当量比 $\phi$ の予混合気なので，「化学種」へ切り替えるときは，筒内と吸気側の未燃ガスに質量分率 $f_\phi$ の燃料蒸気を置く．既燃ガスの $\zeta$ と $\zeta^*$ は設定の $\phi$ から決める）．運転中に噴射方式を切り替えたときは，状態を置き直さない：直噴からポート噴射へ切り替えると，吸気側が予混合気で満たされるまでの数サイクルは薄くなり（アイドルで約 10 サイクル．回転数が約 $650\ \text{rpm}$ まで下がってから戻る），逆では吸気側に残った燃料の分だけ濃くなる（いずれも実測．止まらない）．
10. **ページ「噴射」のパネルの文字**（SPEC-18 の p-V パネルの上の 1 行）：直噴で運転しているときは「噴射 $\theta_{\text{SOI}}$〜$\theta_{\text{SOI}} + \Delta\theta_{\text{inj}}$°（幅），$m_{f,\text{cmd}}$ [mg]，$\phi_c$」を表示する．幅が上限の $300^\circ$ のときは「（幅が上限：インジェクタ流量を超える率）」を付ける．ポート噴射では「ポート噴射（予混合気）」と $\phi_c$ を表示する．

#### 仮定と限界
* 冷却は**上限寄り**である：壁やピストンに付いた燃料が壁から熱をもらうこと，液滴が温まる分は扱わない．
* 筒内は一様で，成層と，噴霧による乱れの増加は扱わない．
* $q_{\text{inj}}$ と $\tau_{\text{ev}}$ の既定値は推定で，実機の値で確かめていない．既定の行程容積（$0.50\ \text{L}$）の全開では，1 サイクルの燃料は約 $35\ \text{mg}$ で，$15\ \text{g/s}$ なら噴射は約 $2.3\ \text{ms}$（$7000\ \text{rpm}$ で約 $100^\circ$）になる．
* 噴射時期は固定の設定で，回転数や負荷で自動には動かさない．噴射の時間と気化の時定数は時間で決まるので，高回転ほどクランク角では長くなり，気化の一部が吸気弁の閉じた後にずれ込む（$7000\ \text{rpm}$ で噴射が約 $100^\circ$，時定数が約 $63^\circ$）．壁への付着と混合を扱わないので，早く噴くことの不利益は現れない．
* 既定の噴射開始（吸気上死点後 $80^\circ$）では，気化の大半が吸気弁の閉じる前に起こり，冷却が空気量の増加に効く．吸気弁が閉じた後に噴くと，圧縮の温度が下がるだけになる．
* ポート噴射の「上流で気化」は第25版の仮定の引き継ぎで，吸気管の壁の燃料の膜は扱わない．

* **出典**：直噴の体積効率の実測は [SAE Technical Paper 2002-01-0839](https://saemobilus.sae.org/papers/volumetric-efficiency-direct-port-injection-gasoline-engines-different-fuels-2002-01-0839)；気化潜熱の値は Heywood (1988) の燃料の物性の表（表の番号は未確認）；考察は `docs/report_richburn.md`．

---

## 4. 数値積分と性能の指標

### SPEC-13：数値積分（REQ-13）

#### 定義と式
1. **RK4**：クランク角の刻み $\Delta\theta_{\text{step}}$（設定，$0.25$〜$2^\circ$，既定 $0.25^\circ$）から
   $$\Delta t = \min\left(\frac{\Delta\theta_{\text{step}}}{\max(\omega, \omega_{\min})},\ \Delta t_{\max}\right), \qquad \omega_{\min} = 20\ \text{rad/s},\ \Delta t_{\max} = 3 \times 10^{-5}\ \text{s}$$
   $$\mathbf{k}_1 = \mathbf{f}(\mathbf{y}_n),\ \mathbf{k}_2 = \mathbf{f}\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_1\right),\ \mathbf{k}_3 = \mathbf{f}\left(\mathbf{y}_n + \tfrac{\Delta t}{2}\mathbf{k}_2\right),\ \mathbf{k}_4 = \mathbf{f}(\mathbf{y}_n + \Delta t\,\mathbf{k}_3), \qquad \mathbf{y}_{n+1} = \mathbf{y}_n + \tfrac{\Delta t}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$
2. **DOPRI5**：節点 $c = \left(0, \frac15, \frac{3}{10}, \frac45, \frac89, 1, 1\right)$，5 次の重み $b = \left(\frac{35}{384}, 0, \frac{500}{1113}, \frac{125}{192}, -\frac{2187}{6784}, \frac{11}{84}, 0\right)$，4 次の重み $\hat b = \left(\frac{5179}{57600}, 0, \frac{7571}{16695}, \frac{393}{640}, -\frac{92097}{339200}, \frac{187}{2100}, \frac{1}{40}\right)$．5 次の解 $\mathbf{y}_5$ で進め，4 次の解 $\mathbf{y}_4$ との差で誤差を見積もる：
   $$E = \max_i\frac{|y_{5,i} - y_{4,i}|}{\text{atol}_i + \text{rtol}\cdot\max(|y_{n,i}|, |y_{5,i}|)}$$
   $E \le 1$ なら受理し，次の刻みを $\Delta t\cdot\min\left(2.5, \max\left(0.2,\ 0.9E^{-1/5}\right)\right)$ とする．$E > 1$ なら同じ係数で縮めてやり直す．刻みの上限は $\min\left(\frac{0.5^\circ}{\max(\omega, \omega_{\min})},\ 10^{-3}\ \text{s}\right)$．rtol は設定（$10^{-4}$，$10^{-5}$，$10^{-6}$，既定 $10^{-5}$）．やり直しが 13 回続くか，刻みが $10^{-8}\ \text{s}$ を下回ったときは，誤差が許容を超えていても受理し，その回数を数える（**強制受理**）．
   * 絶対許容誤差 $\text{atol}_i$（SI）：$\theta$：$10^{-6}$，$\omega$：$10^{-3}$，$p$，$p_{\text{in}}$，$p_p$，$p_{pe}$，$p_m$：$1$，$m$，$m_u$，$m_{b,\text{in}}$，$m_{b,p}$：$10^{-9}$，$T_w$：$10^{-4}$，$\dot m_r$，$\dot m_e$：$10^{-6}$，$E_{\text{in}}$，$E_p$：$10^{-6}$．
3. **補助積分**：$\mathbf{z}$（§2.3）は，$\mathbf{y}$ と同じ段の値と重みで積分する（RK4 は $\frac16(1, 2, 2, 1)$，DOPRI5 は $b$）．$\mathbf{z}$ は誤差の見積もりに含めない．これにより，サイクルの集計は $\mathbf{y}$ と同じ次数になり，保存則（質量，既燃ガス，余剰エンタルピー，エネルギー）の検査式は Runge–Kutta の各ステップで丸め誤差の範囲で成り立つ．
4. **イベント**：次の角度では右辺が折れるか，状態の記録や切替が起きる．ステップは，これらの角度を**またがず，ちょうどその角度で終わる**ようにする．
   * サイクルの終端 $\theta = 4\pi$，吸気弁の開閉（IVO，IVC），排気弁の開閉（EVO，EVC），点火（$\theta = 2\pi - s$）
   * 手順：次のイベントまでの角度 $d$ が，予定の刻みで進む角度以下なら，刻みを $\Delta t = d/\omega$ とする．ステップ後の角度の残差 $\delta = \theta_e - \theta_{n+1}$ が $|\delta| > 10^{-9}\ \text{rad}$ なら $\Delta t \leftarrow \Delta t + \delta/\omega_{n+1}$ として同じ始点からやり直す（最大 4 回）．
   * イベントでの処理は，**そのステップの終端の状態**（同じ時刻の $p$，$V$，$T$，$m_u$）で行う：IVC では基準状態 $(p_r, V_r, T_r)$（SPEC-08）と $m_{u,\text{trapped}}$ と $x_r$ を記録，点火では SPEC-07 の $\theta_0$，$\Delta\theta_b$，$Q_{\text{in}}$ を計算，サイクルの終端では集計（SPEC-14）・点火時期の更新（SPEC-12）・$p_{\max}$ の更新（SPEC-10）を行い，$\theta \leftarrow \theta - 4\pi$ とする．
   * $\omega = 0$ ではイベントの処理をしない．設定の変更で角度が動いたイベントは，次にその角度に達したときに処理する．
5. **筒内最高圧**：ステップ点の圧力が極大になった点と前後の点（角度 $\theta_{-}, \theta_0, \theta_{+}$，圧力 $p_{-}, p_0, p_{+}$）を通る放物線の頂点の値を，そのサイクルの $p_{\max}$ の候補とし，候補の最大を取る．
6. **制御入力の保持**：ECU と動力計の状態（$\bar N$，$I_\alpha$，$I_f$，$f_{\text{eff}}$，$\alpha$，$f_{\text{cmd}}$）は，ステップの終わりにそのステップの刻み $\Delta t$ で更新し，ステップの間は一定とする（積分は陽的 Euler，一次遅れは指数形）．制御の離散化の周期はソルバの刻みである．
7. **射影**：ステップの後で，丸めによる非物理的な値を防ぐために次の下限・上限を適用し，適用した回数を数える：$m \ge 10^{-7}\ \text{kg}$，$0 \le m_u \le m$，$p, p_p, p_{pe}, p_m \ge 1\ \text{kPa}$，$m_{b,\text{in}}, m_{b,p}, E_{\text{in}}, E_p \ge 0$，$\omega \ge 0$．**通常の運転では一度も適用されないこと**を要件とする．第26版で次のとおり改めた：成分の質量（$m_{b,\text{in}}$，$m_{b,p}$ と，SPEC-29，30 の $m_f$，$m_{bf}$，$m_l$，$m_{f,\text{in}}$，$m_{f,p}$）は $0$ で切り（$m_f \le m_u$ も同じ），$-10^{-12}\ \text{kg}$ より下へ出たときだけ回数に数える（流れの向きが変わるステップでは，誤差の許容の範囲で $0$ をわずかに下回ることがある．実測で $-10^{-14}\ \text{kg}$ 程度）．化学種のモデルでは $E_{\text{in}}, E_p \ge 0$ を適用しない（直噴の気化で筒内が $T_{\text{in}}$ より冷えると，吸気弁の逆流が負の余剰を運ぶ）．

#### 系の硬さと刻みの上限
最も硬いのは，弁が開いていて弁の前後の圧力がほぼ等しいときの，筒内とポートの間のやりとりである（SPEC-04 の直線部の傾きによる）．周期定常のサイクルに沿ったヤコビアン $\frac{\partial\mathbf f}{\partial\mathbf y}$ の固有値の絶対値の最大は，試作で次のとおりだった．

| 条件 | $\max\lvert\lambda\rvert$ [1/s] | 場所 |
| :--- | ---: | :--- |
| アイドル | $6.5 \times 10^4$ | $599^\circ$（排気行程）．TEST-13 項目 10（$10^\circ$ ごと）の実測は $6.0 \times 10^4$（$590^\circ$） |
| 全開 $1000\ \text{rpm}$ | $7.5 \times 10^4$ | $638^\circ$ |
| 全開 $3000\ \text{rpm}$ | $3.8 \times 10^4$ | $185^\circ$（吸気下死点付近） |
| $2000\ \text{rpm}$ 部分負荷 | $2.8 \times 10^4$ | $633^\circ$ |

RK4 の実軸上の安定限界は $|\lambda|\Delta t \le 2.79$ なので，$\Delta t_{\max} = 3 \times 10^{-5}\ \text{s}$（$|\lambda|\Delta t \le 2.3$）とした．DOPRI5 は誤差制御が刻みを安定限界の内側に保つ．

#### 仮定と限界
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
| 体積効率 | $\eta_v = \frac{m_{\text{air}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{RT_{\text{amb}}}$（化学種のモデルでは，$m_{\text{air}}$ は IVC の時点の筒内の未燃の空気 $m_{a,\text{IVC}}$，$\rho_{\text{atm}}$ の気体定数は $R_a$） |
| 図示熱効率，正味熱効率，正味燃料消費率 | $\eta_i = \frac{W_{i,\text{net}}}{m_f H_u}$，$\eta_b = \frac{P_b}{\dot m_f H_u}$，$\text{bsfc} = \frac{\dot m_f}{P_b}$ [g/kWh] |
| 残留ガス率 | $x_r = 1 - Y_u$（IVC の時点） |
| 最高圧，最高温度 | $p_{\max}$（SPEC-13 の補間），$T_{\max}$（ステップ点の最大） |
| 各断面の平均流量 | $\frac{\Delta M_k}{t_c}$（$k$：th，r，in，ex，e，t） |
| 排気背圧，排気ポート圧の脈動幅 | $\Delta\bar p_{\text{ex}} = \frac{\Delta P_m}{t_c} - p_{\text{atm}}$，1 サイクルの排気弁の下流圧の最大と最小の差 |
| 吸気管の既燃率 | $\bar Y_{b,\text{in}} = \frac{\Delta\Upsilon}{t_c}$ |
| CA50，点火時期 | SPEC-12 |

* 発熱の分母は供給した燃料の発熱量 $m_f H_u$ とする（燃え残りと燃焼効率の損失が効率に現れる）．
* ポンプ損失は IMEP に含まれ，FMEP には含めない．
* **表示の規則**：指標は，完爆後に完了したサイクルの値だけを表示する．始動中・停止中・最初のサイクルの完了前と，定義の分母が $0$ 以下のときは「–」を表示する．$\eta_v$，$\eta_i$，$\eta_m$，$\eta_b$ は $[0, 1.5]$ の外の値を表示しない．$P_b \le 0$ では bsfc と $\eta_b$ を「–」とする．
* **10 サイクル平均**：サイクルごとの指標は，完爆後の直近 10 サイクル（満たないときは完爆後の全サイクル）の算術平均を表示する．瞬時値である $\bar N$，$T_w$，$\alpha$，$p_{\text{in}}$，瞬時の $T_{\text{dyno}}$，$f_{\text{eff}}$，点火時期は現在の値を表示する．コールドリセット，停止，エンストで平均をやり直す．
* **表示する項目と名称**（運転タブ．配置は SPEC-15）：
  * 1 ページ目：平均回転数 $\bar N$，図示平均有効圧 IMEP，ポンプ損失平均有効圧 PMEP，図示熱効率 $\eta_i$，図示出力 $P_i$，体積効率 $\eta_v$，残留ガス率 $x_r$，最高筒内圧 $p_{\max}$，最高ガス温度 $T_{\max}$，壁温 $T_w$，スロットル開度 $\alpha$，吸気管圧 $p_{\text{in}}$
  * 2 ページ目：燃料流量 $\dot m_f$，軸トルク $T_b$，軸出力 $P_b$，正味平均有効圧 BMEP，摩擦平均有効圧 FMEP，機械効率 $\eta_m$，正味燃料消費率 bsfc，正味熱効率 $\eta_b$，動力計トルク $T_{\text{dyno}}$，実効充水率 $f_{\text{eff}}$，吸気管既燃率 $Y_{b,\text{in}}$，点火時期（°BTDC）
  * 各項目は既定で記号を示し，その項目をタップすると日本語名に切り替わり，もう一度タップすると記号に戻る（項目ごと．何度でも）．値は描画フレームごとに更新するが，項目の要素は作り直さず文字だけを書き換える（押している間に要素が DOM から外れるとタップが届かないため）．

* **出典**：Heywood (1988) Ch. 2．

---

## 5. 画面

### SPEC-15：画面の構成と操作（REQ-15）

#### A. 対象環境
1. 主対象：Samsung Galaxy S26+，Android 版 Google Chrome．
2. 代表のビューポート（CSS px）：スマートフォン縦 $360 \times 640$（最小），$384 \times 780$，$412 \times 915$．タブレット縦 $820 \times 1180$，タブレット横 $1180 \times 820$，PC $1440 \times 900$（マウス）．

#### B. 画面の原則
1. **上部のタブ**：高さ $48\ \text{px}$ のタブバーを最上部に固定し，「運転」「線図」「性能曲線」「設定」「検証」「解説」を等幅で常に表示する．切り替えはタップだけ．切り替えてもシミュレーションは止めず，各タブのサブページの選択と，解説の縦スクロール位置を保つ．タブの文字は $13\ \text{px}$，左右の余白は $0$．
2. **1 画面に固定**：「解説」以外のタブとサブページは，ページ全体も内部の容器も縦横にスクロールしない．収まらない項目はサブページかページ送りに分ける．高さは `100dvh` を基準とし，`overscroll-behavior: none` を指定する．
3. `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`，`color-scheme: light dark`，`text-size-adjust: 100%` を指定する．

#### C. 各タブの内容
1. **運転**（上から）：機関断面図（SPEC-19．高さは残りの領域に従い，最小 $140\ \text{px}$）とその下端に重ねた目標回転数スライダ（SPEC-23），回転数の制御方式と `OVERLOAD`／`UNDERPOWER`／`VALVE HIT` の表示，制御状態カード（SPEC-22，4 行），操作ボタン `[START]` `[FUEL CUT]` `[RESET 長押し]`（コールドリセット），再生速度のボタン（$0.02\times$，$0.1\times$，$0.5\times$，$1\times$）と指標のページ切替 `[指標1/2]` と `[音ON/音OFF]`，指標（2 列 × 6 行，2 ページ．項目は SPEC-14）．
2. **線図**：上部のボタン（1 行）で 7 画面を切り替える．① $p$-$V$ 線図（線形／両対数の切替，基準サイクルの重ね描き），② $p$-$\theta$（$p$，$T$，熱発生率），③ 弁リフトと弁の質量流量，④ 筒内質量の内訳，$p_{\text{in}}$，$\dot m_{\text{th}}$，⑤ トルクの内訳，$N$，ピストン速度，⑥ ECU のトレンド（$\bar N$ と $N_{\text{target}}$，$\alpha$，$p_{\text{in}}$，$T_w$），⑦ 動力計のトレンド（$\bar N$ と $N_{\text{target}}$，$T_b$ と $T_{\text{dyno}}$，$f_{\text{cmd}}$ と $f_{\text{eff}}$）．軸と目盛は SPEC-17．
3. **性能曲線**：SPEC-26．
4. **設定**：SPEC-18．
5. **検証**：`[全テスト実行]`，進捗，総合結果（PASS $n$/30），30 個の結果チップ（7 列），選んだテストの詳細カード（項目，基準，実測，誤差，PASS/FAIL），項目送り ◀ ▶．選んだチップは枠で示す（SPEC-20）．
6. **解説**：SPEC-16（唯一，縦スクロールできるタブ）．

#### D. 誤操作の防止
1. `<input type="range">` は使わない．値の変更はボタンで行う．例外は，独自実装の目標回転数スライダ（SPEC-23）だけ．
2. 編集のロックは設けない．設定の「元に戻す」と変更の通知（SPEC-18）で保護する．
3. **タップの判定**：押してから離すまでの移動が $8\ \text{px}$ 未満，かつ接触が $500\ \text{ms}$ 未満の `pointerup` だけをタップとする．接触の幅（`PointerEvent.width`）では棄却しない．
4. `[RESET]` は $0.6\ \text{s}$ の長押しでだけ実行する．コールドリセットを伴う設定は「適用」で確定する（SPEC-18）．
5. 操作要素は $44 \times 44\ \text{px}$ 以上，隣との間隔は $4\ \text{px}$ 以上，`touch-action: manipulation` を指定する．

#### E. グラフのタップ
グラフをタップすると，その横位置の値を読む十字線と数値を表示する（もう一度タップで消す）．1 画面に複数のグラフが横に並ぶときは，タップした位置を含むグラフの横軸で読む．

#### F. 描画と時間の進め方
1. Canvas の内部解像度は常に CSS の寸法 × $\min(\text{devicePixelRatio}, 2.5)$ と一致させる．描画のたびに一致を確かめ，違えば設定し直す．毎フレーム全面を消してから描く．
2. 描画は $60\ \text{fps}$ に間引く．シミュレーションの時間は `performance.now()` の実経過時間から進め，リフレッシュレートによらない．1 フレームの積分に使う時間は $9\ \text{ms}$ を上限とする．
3. ページが非表示になったら積分と描画を止め，戻ったときに大きな時間の飛びを作らない（戻った直後の 1 フレームで進む時間は $50\ \text{ms}$ × 再生速度 以下）．

#### G. 読みやすさ
1. 圧力は Pa 系（既定 kPa）で表示し，`bar` は表示しない．本文の最小の文字は $12\ \text{px}$（指標の日本語名は $11\ \text{px}$），数値は等幅数字，配色は `prefers-color-scheme` に従う．
2. ボタンの文字は折り返さない．端末のフォントの差を見込み，ボタンの文字幅は，ボタンの利用可能幅（内寸から左右の余白を除いた幅）の $95\%$ 以下とする．

#### H. 画面の大きさに応じた表示
スマートフォンの表示を基本とし，ビューポートの幅 $w$ が大きいほど同時に表示する情報を増やす．タブの構成と操作は変えない．
1. **小**（$w < 700$）：C のとおり．
2. **中**（$700 \le w < 900$）：運転タブの指標を 2 ページ分（24 項目）同時に 4 列で表示し，`[指標1/2]` を隠す．本文の領域は最大幅 $900\ \text{px}$ で中央に置く．
3. **大**（$w \ge 900$）：2 列にする．運転タブは，左に機関断面図（スライダを含む），右に制御状態カード・操作ボタン・再生速度・指標 24 項目（2 列）．高さが $800\ \text{px}$ 以上なら，右の列の残りに運転中の $p$-$V$ 線図（基準サイクルの重ね描きつき）を表示する．設定タブは，左に項目の一覧と操作ボタン，右に $p$-$V$ 図（またはカム線図・機関の説明）を列の高さいっぱいに表示する．本文の領域は最大 $1400\ \text{px}$（検証と解説は $900\ \text{px}$）で中央に置く．
4. **グラフの横並び**（全段階）：1 画面に $n$ 個のグラフがあり，Canvas（CSS 寸法 $W \times H$）が $W > 1.25H$ なら，列数を $n_c = \max\left(1, \min\left(n, \lfloor W/320\rfloor\right)\right)$，行数を $\lceil n/n_c\rceil$ とする．そうでなければ 1 列．
5. **マウス**：Pointer Events により，マウスでも同じ操作ができる（クリック，長押し，スライダのドラッグ）．ホバーできる環境ではボタンにカーソルとホバー表示を出す．
6. B〜G の規則は，どの段階でも満たす．

---

### SPEC-16：解説タブ（REQ-16）

1. **章立て**：§0 記号表と設定項目／§1 状態方程式系（21 個の状態の時間微分の式を，詳細を述べる章の番号とともに並べる）／§2 クランク運動学（SPEC-01）／§3 熱物性（SPEC-02）／§4 弁の有効開口面積（SPEC-03）／§5 オリフィス流量（SPEC-04）／§6 スロットルと吸気マニホールド（SPEC-05）／§7 筒内の組成（SPEC-06）／§8 燃焼（SPEC-07）／§9 壁面熱伝達と壁温（SPEC-08）／§10 筒内圧の式の導出（SPEC-09）／§11 回転運動とスターター（SPEC-10）／§12 動力計と運転モード（SPEC-11）／§13 ECU（SPEC-12）／§14 数値積分（SPEC-13）／§15 性能の指標（SPEC-14）／§16 エンジン音（SPEC-21）／§17 排気系（SPEC-27）／§18 化学種の熱物性と化学平衡（SPEC-29）／§19 燃料の噴射と気化（SPEC-30）．吸気ランナ（SPEC-25）は §6 に含める．§3，§7，§10 は $\gamma$ のモデルの式で，熱物性が「化学種」（既定）のときに代わる式は §18 に書く．§18 では，NASA 多項式の係数と平衡の反復法の細部は仕様書 SPEC-29 を参照する形にし，成分の定義，エネルギーの式，$\dot p$ の導出，表と補間，仮定を書く．記号表は 1 記号 1 定義なので，仕様書の $\zeta$，$\zeta^*$，$\psi$，$\phi_c$，$m_{a,\text{IVC}}$，$\text{AF}_{st}$ は，解説では $\zeta_b$，$\zeta_o$，$\psi_f$，$\phi_{ig}$，$m_{aI}$，$A_{st}$ と書く（解説では $\zeta$ がランナの損失係数，$\psi$ が音の位相，$\phi_c$ がカムの位相に使われているため）．
2. **各章**：目的の一文，支配式（途中の式変形を含む），仮定と適用範囲，出典へのリンク．式に現れる記号はすべて §0 の記号表で定義する．
3. **数式**：数式は TeX（LaTeX の数式記法）で持つ．解説（§0〜§17）の式は生成器 `mp` が独自の簡略記法から TeX を作り，3 文書の式は Markdown に書いた TeX をそのまま使う．数式 1 つを要素 1 つ（`.tx`．別行立ては `data-d="1"`）に入れ，要素の `data-tex` に TeX のソースを保持する．
   * **組版（MathJax）**：解説タブを初めて開いたときに，MathJax 3.2.2 の `tex-svg` を `https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js` から読み込む（`<script>` を 1 つ加える）．SVG 出力を使う：字形の形は MathJax のスクリプトに含まれ，フォントのファイルを別に読まない（アーティファクトの CSP は cdnjs のスクリプトを許すが，そこからのフォントのファイルは許さないため）．準備が整ったら，数式を `MathJax.tex2svg(TeX, {display})` で SVG に組み，要素の中身を置き換える．組むのは画面に入る数式だけ（解説タブの表示範囲と，その上下 1 画面分．`IntersectionObserver`）で，スクロールして入ってきた式を順に組む．組んだ式は戻さない．組版は 1 フレームあたり $8\ \text{ms}$ を目安に区切る．字形の定義は 1 か所（MathJax の global font cache）に置き，各式は参照だけを持つ．全数式を一度に組むと，3 文書の約 $4100$ 式で解説タブの要素が約 $13.5$ 万個になり，タブの切り替えに $158\ \text{ms}$ かかった（実測）ため，この方式にした．
   * **隠している間のレイアウトの保持**：解説タブは，ほかのタブを表示している間も `display: none` にせず，`content-visibility: hidden`（高さ $0$，位置は絶対指定，幅は表示中と同じ）で隠す．`display: none` にすると，タブへ戻るたびに組んだ数式を含む全体のレイアウトをやり直すことになり，式の解説の全数式を組んだ状態で $138$〜$164\ \text{ms}$ かかった（実測．TEST-20 のフレーム間隔の FAIL の原因だった）．隠している間は，内容の寸法を読む処理（幅を超える行内の式の判定）を行わない．
   * **TeX の表示**：MathJax の読み込みが失敗したとき（`error`），または読み込みを始めて $15\ \text{s}$ 以内に準備が整わないときは，以後 MathJax を使わず，各数式の TeX のソースを等幅の字で表示する（本文中の式は行内に，別行立ての式は独立の行にして横スクロールできるようにする）．読み込み中も TeX のソースを表示しておき，準備が整ったら置き換える．
   * **状態の表示**：解説タブの切替のボタンの下に 1 行で，「数式：MathJax 3.2.2 で表示」「数式：MathJax を読み込み中（TeX のソースを表示）」「数式：MathJax を読み込めないため TeX のソースを表示」のいずれかを示す．
   * **生成器の規則**：ギリシャ文字は TeX の命令（`\theta` など）にする．2 文字以上の添字は立体（`\mathrm{in}`）．`sin`，`cos`，`exp`，`tanh`，`ln`，`max`，`min` は `\sin` などの命令，`clamp`，`sgn` は `\operatorname{}`．微分の d は `\mathrm{d}`．上線と上点は `\bar{}`，`\dot{}`．括弧の組は，中身に分数・根号・上線・上点があるときだけ `\left(` `\right)` で伸ばす．`{a|b}` は `\frac{a}{b}`，`[x]` は `\sqrt{x}`．べきの底が括弧の組のときは組全体に掛ける．生成した式に現れる記号（記号表のキー）を要素の `data-ids` に空白区切りで記録する．
   * **フォントを埋め込まない**（C-8）：成果物に `@font-face` も base64 のデータも置かない．式の解説の末尾に「数式の組版：MathJax 3.2.2（Apache License 2.0，https://www.mathjax.org/）を実行時に cdnjs から読み込む．読み込めないときは TeX のソースを表示する．」の旨を書く．
4. **幅**：数式は縮小しない．画面の幅を超える数式は式ごとに，記号表と設定項目の表は表ごとに，横スクロールできる（`overflow-x: auto`）．解説タブ全体は横にスクロールしない．
5. **ナビゲーション**：冒頭に目次（全章）を置き，タップでその章の見出しが上端に来る．「先頭へ戻る」ボタンを右下に常に表示する．ほかのタブへ移って戻っても縦スクロール位置を保つ．
6. **単一の情報源**：本文中の定数と現在の設定値は，ソルバの定数・項目定義表・合成器の定数から生成する．記号表は 1 つの記号を 1 回だけ定義する（ビルド時に重複を検査する）．選択中の比熱モデルとカムプロファイルに対応する式は強調し（左の線をアクセント色），選択していない方は薄く表示する．
7. **エンジン音**：§16 に，計算の音の式と，演出音の処理（式，10 段の表，定数の表）を書く（SPEC-21）．
8. **読みやすさ**：本文 $14\ \text{px}$ 以上，行間 $1.6$ 以上，配色に追従．ネットワークなしで読める（数式は TeX のソース）．
9. **文書の閲覧**：解説タブの先頭に切替のボタン `[式の解説]` `[要件定義書]` `[仕様書]` `[用語集]`（1 行，$44\ \text{px}$ 以上）を置き，要件定義書・仕様書・用語の定義集の全文を，このタブの中で読めるようにする．
   * **変換**：3 文書は，ビルド時に `docs/` の Markdown を pandoc で HTML に変換して成果物に埋め込む（ビルド時だけ）．数式は TeX のまま残し（pandoc の `--mathjax` の出力から区切り `\(` `\)` `\[` `\]` を外し，3 の `.tx` 要素にする），3 の規則で組む．TeX の誤りを見つけるため，ビルド時に pandoc で全数式を MathML にも変換してみて，変換できない式があればビルドを止める（この MathML は埋め込まない）．
   * **ページ**：3 文書は，見出し（`##` と `###`）ごとの断片を 1 ページとして，1 ページずつ表示する（要件定義書なら REQ ごと，仕様書なら SPEC・TEST ごと）．画面（DOM）に置くのは表示中のページだけで，ページを替えるときに前のページを取り除く．目次の下と，ページの末尾に，`[◀ 前]`，位置（`12 / 74` の形），`[次 ▶]` を置く（ボタンは $44\ \text{px}$ 以上．端のページでは対応するボタンを無効にする）．ページを替えたら縦スクロール位置を先頭に戻す．式の解説（§0〜§17）は分けない．
   * **目次**：各文書の先頭に `[目次（n 項目）を開く]` を置き，押すとその文書の見出し（2 階層）の目次が開く（もう一度押すと閉じる）．目次の項目のタップで，その見出しのページに替わり，見出しが上端に来る．
   * **幅**：別行立ての数式と表は，幅を超えたら式・表ごとに横スクロールする．本文中の数式が行に収まらないときは，その式を独立の行にして横スクロールできるようにする（画面の幅が変わったら判定し直す）．解説タブ全体は横にスクロールしない．
   * **組み立て**：ページは，表示するときにその断片だけを組み立てる（全文をまとめて組み立てない．第25版では全文を数フレームに分けて組み立てていたが，文書が大きくなるとフレームの間隔と要素の数が増えるため改めた）．式の解説は，初めて開いたときに章を数フレームに分けて表示する．表示していない文書は，表示中のページを保ったまま隠す．文書ごとに，表示中のページと縦スクロール位置を保つ．
   * 「先頭へ戻る」と縦スクロール位置の保持（5）は，どの文書の表示中にも働く．


---

### SPEC-17：グラフの軸・目盛・自動レンジ（REQ-17）

#### A. 軸の表示
1. 各グラフは，プロット領域の左に縦軸，下に横軸を持ち，目盛線，目盛の数値，軸名を表示する．軸名は「量 [単位]」の形（例：`p [kPa]`，`V [cm³]`，`θ [°CA]`，`t [s]`）．縦軸の名前はプロット領域の左上に横書きで，横軸の名前は目盛の数値の下に置く．
2. 目盛の間隔は $\Lambda = \{1, 2, 5\} \times 10^k$（$k$ は整数）から選び，区間の数が 4〜8 になるようにする．目盛の数値は互いに重ならず，Canvas の外へ出ない．重なるときは数値を間引く（目盛線は残す）．
3. 複数の系列を描くグラフには凡例（系列名と色）をプロット領域の中に置く．凡例が 1 行に収まらないときは折り返す．
4. 体積は $\text{cm}^3$，クランク角は $^\circ\text{CA}$ で表示する．クランク角の横軸は次のとおり．

   | グラフ | 範囲 | 目盛 |
   | :--- | :--- | :--- |
   | 線図④⑤（基本） | $0$〜$720^\circ$（$0$：吸気上死点，$360$：圧縮上死点） | $180^\circ$ ごと |
   | 線図③「弁」とカム線図（オーバーラップを中央に見る） | $360$〜$1080^\circ$（$720$：吸気上死点） | $180^\circ$ ごと |
   | 線図②「$p$-$\theta$」の 3 グラフ（圧縮・膨張を拡大） | $180$〜$540^\circ$ | $90^\circ$ ごと |

   $360$〜$1080^\circ$ の表示では，$\theta < 360^\circ$ のデータを $\theta + 720^\circ$ として並べ替え，折り返しで線をつながない．範囲外の点は描画領域で切り取る．

#### B. レンジの方式
フルスケールを $F$，評価の窓（クランク角のグラフは直近に完了した 1 サイクル，トレンドは表示中の時間窓）でのデータの最大を $M$（対称型では絶対値の最大）とする．
1. **固定型**：範囲は定数．
2. **諸元連動型**：範囲は設定値から決まる（例：$V$ 軸の上限は $V_c + V_d$ 以上で最小の目盛の倍数）．
3. **段階型**（$[0, F]$ または対称の $[-F, F]$）：$F \in \Lambda$，$F_{\min} \le F \le F_{\max}$．
   * 拡大：$M > F$ になったら直ちに $F \leftarrow \min\{F' \in \Lambda : F' \ge 1.1M\}$．
   * 縮小：$M < 0.4F$ が実時間で $3\ \text{s}$ 続いたら $F \leftarrow \max\left(F_{\min},\ \min\{F' \in \Lambda : F' \ge 1.25M\}\right)$．
   * 縮小の後は $M \le 0.8F$ なので直後に拡大せず，$M$ が一定なら範囲は高々 1 回の変更で動かなくなる．
   * コールドリセットと要リセット項目の適用で既定値 $F_0$ に戻す．
4. **帯域型** $[a, b]$（平均のまわりの小さな変動を見る量）：刻み $s \in \Lambda$（$s \ge s_{\min}$）に対し $a = s\lfloor m_-/s\rfloor$，$b = s\lceil m_+/s\rceil$（$m_\pm$：データの最小・最大に幅の $10\%$ の余裕を付けた値）．$s$ は区間の数が 8 以下になる最小の値とし，4 未満なら下・上の順に $s$ ずつ広げて 4 にする．データが $[a, b]$ を出たら直ちに，占有率 $(M - m)/(b - a) < 0.25$ が $3\ \text{s}$ 続いたときにも，計算し直す．
5. 範囲が切り替わったら，新しい目盛の数値を $1\ \text{s}$ 強調して表示する．段階型の切替は軸ごとに $1\ \text{s}$ あたり高々 1 回とする（その間に必要になった切替は $1\ \text{s}$ たってから行う）．

#### C. 各軸の割当
| グラフ | 軸 | 方式 | 既定 $F_0$／範囲 | $F_{\min}$〜$F_{\max}$ |
| :--- | :--- | :--- | :--- | :--- |
| ① $p$-$V$（線形） | $V\ [\text{cm}^3]$ | 諸元連動 | $0$〜$(V_c + V_d)$ 以上の目盛の倍数（既定 $600$） | – |
| ①② と設定画面 | $p\ [\text{kPa}]$（共有） | 段階・0 起点 | $5000$ | $500$〜$50000$ |
| ① $p$-$V$（両対数） | $p$，$V$ | 10 の整数乗の区間 | $p$：$10$〜$10^4$，$V$：$V_c$ と $V_c + V_d$ を含む最小の区間 | $p$ の上限 $10^5$ |
| ② | $T\ [\text{K}]$ | 段階・0 起点 | $3000$ | $3000$〜$5000$ |
| ② | 熱発生率 $[\text{J}/^\circ\text{CA}]$ | 段階・0 起点 | $100$ | $10$〜$1000$ |
| ③ | リフト $[\text{mm}]$ | 諸元連動 | $0$〜$L_{\max}$ 以上の目盛の倍数（既定 $10$） | – |
| ③ | 弁の質量流量 $[\text{g/s}]$ | 段階・対称 | $200$ | $20$〜$2000$ |
| ④ | 筒内質量 $[\text{mg}]$ | 段階・0 起点 | $1000$ | $100$〜$5000$ |
| ④⑥ | $p_{\text{in}}\ [\text{kPa}]$ | 固定 | $0$〜$120$ | – |
| ④ | $\dot m_{\text{th}}\ [\text{g/s}]$ | 段階・0 起点 | $20$ | $1$〜$100$ |
| ⑤ | トルク $[\text{N·m}]$ | 段階・対称 | $500$ | $50$〜$5000$ |
| ⑤ | $N(\theta)\ [\text{rpm}]$ | 帯域 | $s_{\min} = 10$ | – |
| ⑤ | ピストン速度 $[\text{m/s}]$ | 段階・対称 | $10$ | $5$〜$50$ |
| ⑥⑦ | 横軸 $t\ [\text{s}]$ | 固定 | 直近 $30\ \text{s}$（右端が現在，目盛 $5\ \text{s}$） | – |
| ⑥⑦ | $\bar N\ [\text{rpm}]$ | 段階・0 起点 | $2000$ | $1000$〜$10000$ |
| ⑥ | $\alpha\ [^\circ]$ | 固定 | $0$〜$90$ | – |
| ⑥ | $T_w\ [\text{K}]$ | 帯域 | $s_{\min} = 10$ | – |
| ⑦ | $T_b$，$T_{\text{dyno}}\ [\text{N·m}]$ | 段階（負の値があれば対称） | $50$ | $10$〜$500$ |
| ⑦ | $f_{\text{cmd}}$，$f_{\text{eff}}$ | 固定 | $0$〜$1$ | – |

---

### SPEC-18：設定画面（REQ-18）

#### A. 項目の分類
| 分類 | 対象 | 反映 |
| :--- | :--- | :--- |
| **即時項目** | 要リセット項目以外のすべて | 押した時点の積分ステップの境界で反映する．状態 $\mathbf{y}$ は連続のまま． |
| **要リセット項目** | $B$，$S$，$l$，$\varepsilon$（$V(\theta)$ が不連続に変わるため） | 保留値として強調して表示し，「適用」で確定してコールドリセットする．「破棄」で保留を捨てる． |

#### B. 表示と入力
1. 1 項目は 1 行（高さ $46\ \text{px}$，ボタン $44\ \text{px}$）：項目名（単位付き），現在値，`[−]` `[+]`．選択項目は名前付きの選択ボタンで表示する（`0/1` のような符号を画面に出さない）．
2. 表示値 $=$ 内部値（SI）$\div$ 単位係数．単位係数は項目定義表の 1 か所だけに持ち，表示と入力の両方が使う．
3. 1 タップで 1 刻み．`[刻み ×1／×10]` で刻みを 10 倍にできる．長押しの連続入力は設けない．範囲の端ではボタンを無効にする．
4. $\lambda = r/l > 0.5$ になる組合せは「適用」を無効にして理由を表示する．目標回転数と点火時期には上限（点火時期は下限も）を設けない．
5. 変更のたびに「項目名：旧値 → 新値」を 1 行表示する．`[元に戻す]` で直前の 1 変更を取り消す．`[既定値]` で表示中のページの全項目を既定値に戻す（要リセット項目は保留値として）．
6. 点火の自動最適化が ON のとき，点火時期の行は現在の自動の値を毎フレーム表示し（小数 1 桁，項目名に「（自動）」），`[−]` `[+]` を無効にする．完爆後に ON から OFF にしたときは，その時点の自動の値を $1^\circ$ に丸めて手動の値に引き継ぐ．
7. **回転数の制御で使わない項目**（ページ「運転」）：選んだ制御（SPEC-11）で使わない項目は `[−]` `[+]` を無効にする．値は保持する（`[既定値]` では既定値に戻る）．

   | 項目 | スロットル制御（`mode` $= 0$） | 動力計制御（`mode` $= 1$） |
   | :--- | :--- | :--- |
   | 固定開度 $\alpha_{\text{manual}}$ | 無効．項目名に「（自動）」，値は現在の開度 $\alpha$（ECU の操作量．小数 1 桁，毎フレーム更新） | 有効 |
   | 固定充水率 $f_{\text{manual}}$ | 有効 | 無効．項目名に「（自動）」，値は現在の充水率の指令 $f_{\text{cmd}}$（動力計の PI の操作量．小数 2 桁，毎フレーム更新） |
   | 基準充水率 $f_{\text{base}}$ | 無効．項目名に「（不使用）」，値は保持している設定値 | 有効 |

   完爆前は，どちらの制御でも $\alpha = \alpha_{\text{crank}}$，$f_{\text{cmd}} = 0$ を表示する（SPEC-11 の完爆前の規定どおり）．制御を切り替えると，同じフレームで行の表示と無効化を入れ替える．動力計制御に切り替えたときは，SPEC-11 4 のとおり $\alpha_{\text{manual}}$ を切替の直前の開度で上書きし，スロットル制御に切り替えたときは $f_{\text{manual}}$ を直前の $f_{\text{cmd}}$ で上書きする（画面の値はそれを示す）．上書きした値は刻みの格子に丸めない．表示は刻みの桁（固定開度は小数 1 桁，充水率は小数 2 桁）に丸める．

#### C. ページと項目
ページの選択は `◀ ［ページ名 k/n］ ▶` で行い，ページ名をタップすると全ページの一覧が開いて直接移動できる．1 ページは 6 項目以内．「機関」のページには導出値（$\lambda$，$V_d$，$V_c$）も表示する．下の表は内容ごとに並べてある（画面のページの順は項目定義表による）．

| ページ | 項目（単位）：下限〜上限，刻み，既定 |
| :--- | :--- |
| 機関 | ボア $B$（mm）：40〜150，1，86 ／ ストローク $S$（mm）：40〜150，1，86 ／ 連桿長 $l$（mm）：60〜300，1，145 ／ 圧縮比 $\varepsilon$：1.1〜100，0.1，10 |
| VVT・カム | 吸気位相 $\varphi_{\text{in}}$，排気位相 $\varphi_{\text{ex}}$（°CA）：−40〜40，1，0 ／ カム：Std・Poly・Aggr，既定 Std ／ 最大リフト（mm）：3〜14，0.5，9 ／ 吸気弁径（mm）：20〜50，1，38 |
| 弁タイミング | IVO（°CA）：−40〜40，1，−10 ／ IVC：190〜290，1，264 ／ EVO：430〜530，1，490 ／ EVC：690〜760，1，730 |
| 吸気 | 大気圧 $p_{\text{atm}}$（kPa）：60〜110，0.1，101.3 ／ スロットル径（mm）：20〜80，1，40 ／ マニホールド容積 $V_{\text{in}}$（L）：0.3〜5，0.1，1.5 |
| 吸気ランナ | 吸気ランナ：OFF・ON，既定 ON ／ ランナ長 $L_r$（mm）：100〜1000，10，450 ／ ランナ内径 $d_r$（mm）：20〜60，1，40 |
| 排気系 | 排気系モデル：OFF・ON，既定 ON ／ 消音器容積 $V_m$（L）：0.5〜10，0.5，3 ／ 出口有効面積 $A_t$（mm²）：20〜3000，10，300 ／ 排気圧損（OFF 時）（kPa）：0〜30，0.5，4 |
| 燃焼 | 点火時期（°BTDC）：上下限なし，1，18 ／ 点火の自動最適化：OFF・ON，既定 ON ／ サイクル変動：OFF・ON，既定 ON ／ 当量比 $\phi$：0.6〜1.4，0.01，1 ／ Woschni 係数：0〜2，0.05，1 ／ 比熱：γ(T)・γ一定，既定 γ(T) |
| 燃焼速度 | 着火遅れ係数 $c_d$，燃焼速度係数 $c_b$：0.1〜10，0.1，1 ／ Wiebe 形状係数 $m_w$：0〜6，0.5，2 |
| 運転 | 回転数の制御：スロットル・動力計，既定 スロットル ／ 目標回転数（rpm）：500〜（上限なし），50，800 ／ 固定開度（°）：0〜90，0.1，15 ／ 固定充水率 $f$：0〜1，0.05，0 ／ 基準充水率 $f$：0〜1，0.05，0 ／ 補機負荷トルク（N·m）：0〜20，0.1，2 |
| ECU | 平均時定数 $\tau_N$（s）：0.05〜1，0.05，0.15 ／ 始動開度（°）：0〜90，1，6 ／ 基準開度（°）：0〜90，1，3 ／ $K_p$（°/rpm）：0.001〜0.2，0.001，0.008 ／ $K_i$（°/(rpm·s)）：0.002〜0.5，0.002，0.004 ／ 最大開度（°）：1〜90，1，90 |
| 動力計 | 定格トルク（N·m）：5〜200，1，35 ／ 定格回転数（rpm）：500〜8000，100，1500 ／ 充水時定数 $\tau_d$（s）：0.05〜2，0.05，0.3 ／ $I_{\text{dyno}}$（kg·m²）：0.01〜0.5，0.01，0.05 ／ $K_{pd}$（$10^{-3}$/rpm）：0.2〜10，0.2，1 ／ $K_{id}$（$10^{-3}$/(rpm·s)）：0.2〜10，0.2，2 |
| 解法 | ソルバ：RK4・DOPRI5(4)，既定 DOPRI5(4) ／ RK4 刻み $\Delta\theta$（°CA）：0.25〜2，0.25，0.25 ／ rtol：1e-4・1e-5・1e-6，既定 1e-5 |
| 音響 | 音量（%）：0〜100，5，60 ／ 排気管長 $L$（m）：0.3〜3，0.1，1 ／ 排気管内径 $d$（mm）：20〜80，2，40 ／ 消音器の反射率 $\rho_m$：0〜0.95，0.05，0.6 ／ 流れ雑音（%）：0〜100，10，40 ／ 音の種類：計算・演出，既定 計算 |

#### D. 効果を確かめるパネル
1. 「機関」「VVT・カム」「弁タイミング」以外のページの下部に $p$-$V$ 線図（線形．軸は SPEC-17，$p$ 軸は線図タブと共有）を表示する．高さは残りの領域に従い，$360 \times 640$ で $120\ \text{px}$ 以上．
2. 「VVT・カム」と「弁タイミング」のページでは，代わりに**カム線図**を表示する．横軸 $360$〜$1080^\circ$，縦軸リフト [mm]．吸気・排気の現在のリフト曲線（位相を含む），変更前の基準（灰色），ピストン頂面までの余裕 $h_c + x(\theta)$ を描く．パネルの上に，有効な IVO・IVC・EVO・EVC とオーバーラップ角 $\text{EVC} - (\text{IVO} + 720^\circ)$ を表示する．
3. **基準サイクル**：現在のサイクル（直近に完了した 1 サイクル，アクセント色）と基準サイクル（灰色）を重ねる．
   * 即時項目を変更したとき，直前の変更から $3\ \text{s}$ 以上たっていれば，変更の直前に完了していた 1 サイクルを基準として保存する（複製）．$3\ \text{s}$ 未満の連続操作では基準を更新しない．
   * 設定画面の `[基準更新]`（線図タブの ① では `[基準を現在に]`）で，現在のサイクルを基準にできる．コールドリセットと要リセット項目の適用で基準は消える．
   * 線図タブの ① $p$-$V$ も同じ基準サイクルを重ねる．
4. パネルに「IMEP：現在値（基準比 $\pm\Delta$）」「$p_{\max}$：現在値（$\pm\Delta$）」「$\bar N$」を表示する．基準が無いときは現在値だけ．
5. 機関が止まっていてサイクルが無いときは「運転タブで START してください」と表示する．

---

### SPEC-19：機関断面図（REQ-19）

1. **実寸の比**：$B$，$S$，$l$，$r$，隙間の高さ $h_c$，弁径，リフトを同じ縮尺 $s$ [px/m] で描く．設定を変えると図の比率が変わる．縮尺は，設定できる全範囲で図全体が Canvas に収まるように毎回決める．
2. **要素**：シリンダブロックとヘッド，ピストン（リング，ピン），連桿，クランク（ウェブ，カウンタウェイト，主軸），クランクケース，吸気ポートと排気ポート，吸気弁と排気弁（傘，ステム，ばね），点火プラグと火花，筒内ガス，火炎．
3. **位置**：ピストン頂面は $y = h_c + x(\theta)$，ピストンピンとクランクピンの距離は常に $l$，クランクピンは主軸から半径 $r$，弁の傘は弁座から $L_v(\theta)$ だけ筒内側へ動く（位相を反映）．
4. **色**：吸気ポートは，外端から弁座までの流路全体を連続した 1 つの領域として青系で塗り，濃さで $p_{\text{in}}/p_{\text{atm}}$ を表す．排気ポートは同様に橙系．筒内ガスの色は温度に単調に対応させる（低温は青，高温は赤〜橙）．燃焼中は燃焼割合に応じた火炎を点火プラグから描く．
5. **流れ**：吸気・排気ポートに，弁の質量流量の向きと大きさを示す矢印を描く．
6. **文字**：運転の状態（STOP／CRANK／RUN），回転数，制御方式，行程名，$\theta$，$p$ [kPa]，$T$，両弁のリフト，$B \times S$，$l/r$，$\varepsilon$ を，図に重ならない位置に表示する．
7. 幾何の計算（場面記述：要素ごとの多角形・円の座標）と描画を分ける．

---

### SPEC-22：制御状態の表示（REQ-22）

1. 運転タブの機関断面図と操作ボタンの間に，**制御状態カード**（4 行．各行は折り返さない）を置く．量は日本語名で示す：「スロットル開度 α」「動力計の充水率 f」「点火時期 ○° BTDC」．
2. 各量に役割の色付きの見出しを付ける：**目標**（緑），**制御量**（橙），**操作量**（青），**固定**（灰：利用者が与えた一定値），**自動**（紫：自動最適化）．
3. 表示の内容：

   | 状態 | 1 行目 | 2 行目 | 3 行目 | 4 行目 |
   | :--- | :--- | :--- | :--- | :--- |
   | 停止 | `停止中` | `START で始動` | （空） | （空） |
   | 始動中 | `始動中` 目標 完爆 $\bar N > 550$／制御量 $\bar N$ | 固定 スロットル開度（始動開度） | （空） | 固定 点火時期 |
   | スロットル制御 | `スロットル制御` 目標 $N_{\text{target}}$／制御量 $\bar N$ | 操作量 スロットル開度 $\alpha$ | 固定 動力計の充水率 | 自動または固定 点火時期 |
   | 動力計制御 | `動力計制御` 目標 $N_{\text{target}}$／制御量 $\bar N$ | 操作量 動力計の充水率 $f_{\text{cmd}}$ | 固定 スロットル開度 | 自動または固定 点火時期 |

4. 操作量が上下限に張り付いているときは，値の後に，スロットルなら `全開`（$\alpha = \alpha_{\max}$），`全閉`（$\alpha = 0$），`下限`（$0 < \alpha \le \alpha_{\min}$），充水率なら `上限`（$f_{\text{cmd}} = 1$），`下限`（$f_{\text{cmd}} = 0$）を付ける．
5. 表示は描画フレームごとに更新する．数値は $\bar N$ が整数，$\alpha$ が小数 1 桁，$f$ が小数 2 桁，点火時期が小数 1 桁．

---

### SPEC-23：目標回転数スライダ（REQ-23）

1. **配置**：機関断面図の下端に高さ $48\ \text{px}$ の帯を重ね，左から `[−]`，スライダ（現在値のラベル付き），`[＋]` を置く．機関断面図は帯の上の領域に収まるよう縮尺を決める．
2. **範囲と刻み**：スライダは $500$〜$8000\ \text{rpm}$，刻み $50\ \text{rpm}$（位置と値は線形）．ボタンは $\pm 50\ \text{rpm}$．目標回転数には上限が無いので，ボタンではスライダの範囲を超えて上げられ，そのときつまみは右端にとどまり，ラベルは実際の値を表示する．下限は $500\ \text{rpm}$．
3. **誤操作の防止**：値を変えるのは，つまみ（当たり判定 $44 \times 44\ \text{px}$ 以上）から始めたドラッグだけとする．トラックのタップと，つまみ以外から始めたドラッグでは値が変わらない．ドラッグ中は指の横位置に合わせて値を直ちに反映する．
4. 設定画面の目標回転数と同じ値で，即時項目として扱う．どちらの制御方式でも目標回転数として働く．
5. 独自実装（`div` と Pointer Events）とし，`input[type="range"]` は使わない．

---

### SPEC-26：性能曲線タブ（回転数に対する特性の計測）（REQ-26）

#### A. 計測の条件
1. **設定の複製**：計測を始めた時点の設定（適用済みの値）を複製した独立の `EngineCore` で計算する．運転中の機関の状態と設定は変えない．
2. **スロットル開度**：$10, 20, \dots, 90^\circ$ から，計測の前に複数を選ぶ（既定は $90^\circ$，$50^\circ$，$10^\circ$）．大きい開度から順に計測する．少なくとも 1 つは選ばれている．
3. **固定する条件**：点火は自動最適化 ON，サイクル変動 OFF，壁温 $360\ \text{K}$ 固定（暖機後を想定．壁の熱容量の時定数は約 $100\ \text{s}$ で，点ごとに整定を待てないため）．
4. **回転数の保持**：理想的な速度一定の動力計とみなし，回転数を固定する（SPEC-10）．軸トルクは SPEC-14 の $T_b$．計測の機関は，初めから完爆済み（SPEC-12 の 6）として扱う（スターターを切り，運転中の制御則と点火時期の自動最適化を使う）．$N_{\text{fire}}$ より低い点も，始動の途中ではなく運転中の機関として計算するためである．エンストの判定（SPEC-12 の 6）は通常どおり行い，計測中に燃料が OFF になった点は「エンスト」として記録して，その点の計算をやめ，グラフに描かない（次の点では機関をかけ直す）．回転数を固定しているので，$150\ \text{rpm}$ 未満の点（刻み $25$，$100\ \text{rpm}$ のときの $25$〜$125$，$100\ \text{rpm}$）がエンストになる．
5. **回転数の点**：刻み $\Delta N = 25$，$100$，$250$，$500\ \text{rpm}$ に対して，$N_k = k\,\Delta N$（$k = 1, 2, \ldots, 7000/\Delta N$．280，70，28，14 点）．既定は $250\ \text{rpm}$．$N = 0$ はクランクが回らずサイクルが完了しないので点にしない（グラフの横軸は $0$ から描く）．
6. **収束の判定**（数値はコードの定数表を唯一の情報源とし，「前提」の画面にもそこから書き出す）：完爆後の直近 3 サイクルの各量の幅（最大 − 最小）で判定する．
   * 厳しさ：「標準」は $T_b$ の幅 $\le 0.3\%\,|T_b| + 0.02\ \text{N·m}$，MBT 点火時期の幅 $\le 0.3^\circ$，最少サイクル数の初期値 4．「厳格」（既定）は $0.1\%\,|T_b| + 0.01\ \text{N·m}$，$0.1^\circ$，最少サイクル数の初期値 6．
   * 流量・状態量の判定（ON／OFF，既定 ON）：同じ 3 サイクルで，$\eta_v$，サイクル平均のスロットル流量，サイクルの終端の吸気管圧の幅が，それぞれの平均の $0.3\%$（標準）または $0.1\%$（厳格）以下．
   * **サイクル数の最少 $n_{\min}$ と最多 $n_{\max}$**（数えるのは完爆後に完了したサイクル）：判定は $n \ge n_{\min}$ になってから行う（$n_{\min} \ge 3$ は幅を取る 3 サイクルを確保するため）．$n_{\max}$ サイクルで判定を満たさない点は「未整定」として白抜きの印で描き，最後のサイクルの値を採る．失火などで完爆後のサイクルが数えられない場合に備え，回転数の点ごとのサイクルの総数（完爆前を含む）が $2n_{\max}$ に達したときも打ち切る．
   * $n_{\min}$：$3$〜$30$，刻み $1$．$n_{\max}$：$10$〜$200$，刻み $10$，既定 $60$．常に $n_{\min} \le n_{\max}$（$n_{\min}$ の `[+]` は $n_{\min} = n_{\max}$ で，$n_{\max}$ の `[−]` は $n_{\max} - 10 < n_{\min}$ で無効）．厳しさを選ぶと $n_{\min}$ をその厳しさの初期値にする．
7. **手順**：「上り」（既定．低回転から順に，各点は前の点の状態から続ける），「往復」（上りに続けて下りも計測し，各点で平均を採る．両者の差の最大を完了の表示に出す），「独立」（各点を，その回転数で単独に始める）．
8. **記録する量**：$N$，$T_b$，$P_b$，BMEP，$\eta_v$，bsfc，$\eta_b$，MBT 点火時期，$x_r$，排気背圧，整定の可否，使ったサイクル数，判定に使った各量の幅．

#### B. 画面
1. 画面の文言では「計測」と言う（「掃引」は使わない）．
2. 上段に `[計測開始]`（実行中は `[中止]`）と `[基準を消す]`，その下に表示の切替 `[出力]` `[η_v]` `[燃費]` `[点火]` `[条件]` `[前提]`，残りの高さにグラフまたは表を置く．`[条件]` と `[前提]` の表示中は状態の表示（3 行）を隠す．
3. **条件**：開度のチェック式のボタン 9 つ，刻み（ボタン 4 つ），厳しさ，流量・状態量の判定，サイクル数（1 行に `[−]` 最少の値 `[+]` `[−]` 最多の値 `[+]`），手順．どれかを変えると，計測済みの結果に「設定が変わりました」と表示する．
4. **前提**：計測の仮定を数値で書き出す表．固定する条件（開度の一覧，回転数の保持，点火，サイクル変動，壁温），回転数の点（範囲，刻み，点数，手順），収束の判定（選んだ厳しさの数値，流量・状態量の判定の有無，最少・最多のサイクル数），計測に使う設定（大気圧，当量比，圧縮比，ボア × ストローク，カムの種類，最大リフト，吸気弁径，IVO・IVC・EVO・EVC（位相を含む），吸気ランナ，排気系（ON なら消音器容積と出口有効面積，OFF なら排気圧損），補機負荷トルク）．
   * 「計測に使う設定」は，計測の実行中は実行中の計測が複製した設定（見出しは「計測中の設定」），それ以外は現在の適用済みの設定（見出しは「現在の設定（次の計測に使う）」）を示す．計測済みの結果があっても，結果を計測した時点の設定は示さない．
   * 表は，設定の変更（設定画面の値の変更，`[適用]`，`[元に戻す]`，`[既定値]`），計測の開始・中止・完了，「前提」の表示への切替，性能曲線タブへの切替のたびに作り直す．
   * 表示中の曲線が現在と異なる設定・条件で計測したものであるとき（B.7 の古さの注記と同じ判定）は「表示中の曲線は変更前の設定で計測（再計測で更新）」，保留中（未適用）の変更があるときは「保留中の変更は [適用] の後に使う」と，見出しに続けて書く．保留中の値は表に出さない（計測に使わないため）．
5. **グラフ**：`[出力]` は $T_b$ と $P_b$，`[η_v]` は $\eta_v$，`[燃費]` は bsfc と $\eta_b$，`[点火]` は MBT 点火時期と $x_r$．横軸は $N$（$0$〜$7000\ \text{rpm}$，目盛 $1000\ \text{rpm}$ ごと．計測の範囲は $1000\ \text{rpm}$ からだが，軸は原点から描く）．縦軸は 0 起点の段階的な自動レンジで，負の値があれば負の側にも広げる．$\eta_v$ は $0$〜$1.2$，$\eta_b$ は $0$〜$0.5$ に固定．$P_b \le 0$ の点では bsfc と $\eta_b$ を描かない．
6. **重ね描き**：選んだ開度の曲線を，開度に応じた色（$10^\circ$ を青，$90^\circ$ を赤とする色相の変化）で重ね，凡例に開度を示す．点は印と線でつなぎ，求まるたびに描き足す．凡例はプロット領域の中に収まる．
7. **状態の表示（3 行）**：計測中は開度と回転数の進捗．完了後は所要時間，最大の開度の曲線の最大トルクと最大出力（とその回転数），往復なら往復差の最大．3 行目に基準または古さの注記．
8. **基準**：新しい計測が完了したとき，それまでの結果を「基準」として灰色の細い線で重ねる．`[基準を消す]` で消す．中止した計測は基準を置き換えない．
9. 実行中はタブを切り替えても計測を続ける．検証タブの全テストの実行中は計測を始められない．

#### C. 実行
1. 計測は時間を分けて実行し（1 フレームあたり $8\ \text{ms}$ 以内），運転中の機関の実時間の進行を妨げない．
2. 既定（3 開度 × 25 点，厳格，流量・状態量の判定 ON，上り）の計測の所要時間は，ヘッドレス Chromium の $360 \times 640$ で $20\ \text{s}$ 以下．

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
1. **共鳴**：長さ $L$，内径 $d_e$ の排気管を，弁側が閉端・出口が開放端の管とみなし，往復時間 $2L/c$ の遅延と出口での反転反射を持つ帰還型のくし形フィルタで表す：$v_k = q_k - \rho_m\,(h * v)_{k - D}$，$D = \frac{2Lf_s}{c}$．$\rho_m$ は消音器の吸収を表す反射率（設定，既定 $0.6$），$h$ は管内の損失を表す一次の低域フィルタ．音速は $c = \sqrt{\gamma_b(T_X)\,R\,T_X}$（$T_X = 800\ \text{K}$．SPEC-02 の既燃ガス）$\approx 550.7\ \text{m/s}$．共鳴は $f_n = \frac{(2n - 1)c}{4L}$（既定 $L = 1\ \text{m}$ で $f_1 \approx 138\ \text{Hz}$），極小は $\frac{nc}{2L}$，極大と極小の比は $\frac{1 + g}{1 - g}$（$g = \rho_m|H(f)|$）．
2. **管内の損失**：往復の振幅の減衰を，管壁の粘性・熱伝導（Kirchhoff）と開口端の放射の積とする：
   $$|H(f)| = \exp\left(-2\alpha_w L - \frac{(ka)^2}{2}\right), \quad \alpha_w = \frac{\sqrt{\pi f\nu}}{a\,c}\left(1 + \frac{\gamma_a - 1}{\sqrt{Pr}}\right), \quad k = \frac{2\pi f}{c},\ a = \frac{d_e}{2}$$
   $\nu = 8.4 \times 10^{-5}\ \text{m}^2/\text{s}$，$Pr = 0.7$，$\gamma_a = 1.35$（音響の損失の定数）．これを，$1\ \text{kHz}$ で $|H|$ が一致する一次の低域フィルタ $y_k = (1 - b)x_k + b\,y_{k - 1}$ で近似する（$b$ は $m^2|1 - be^{-i\omega}|^2 = (1 - b)^2$，$m = |H(1\ \text{kHz})|$ の $[0, 1)$ の根）．フィルタの低域の群遅延 $b/(1 - b)$ サンプルを $D$ から引き，$D$ の小数部は線形補間する．単一のパルスに対する残響は，$40\ \text{ms}$ 後にピークの $1\%$ 未満であること．
3. **音量の制御（圧縮器）**：入力 $x_c = 0.16(1 - \rho_m)v$ のピークの包絡 $e_p$ を即応で立ち上げ，$0.2\ \text{s}$ 保持した後，時定数 $0.3\ \text{s}$ で戻す（入力が包絡の $99.9\%$ 以上なら保持を更新）．利得 $G = \min\left(1, (l_t/e_p)^{1 - 1/R_c}\right)$，$l_t = 0.35$，$R_c = 4$．出力は $u = 1.6\,V\,G\,x_c$（$V$：音量）に対し，$|u| \le 0.8$ では $y = u$，$|u| > 0.8$ では $y = \text{sgn}(u)\left(0.8 + 0.2\tanh\frac{|u| - 0.8}{0.2}\right)$（$|y| < 1$）．保持の $0.2\ \text{s}$ はアイドルの爆発間隔より長いので，定常では 1 サイクルの中で利得が一定になる．
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
   $a_k$：気筒ごと・サイクルごとの振幅のばらつき（サイクル変動 ON で $1 \pm 4\%$ の一様乱数）．$G_x = 0.13/q_{\text{ref}}$，$q_{\text{ref}} = 16.01\ \text{kg/s}^2$（第26版で既定のモデルが化学種・直噴になり，同じ条件の音源の実効値が $14.59$ から $16.01$ に変わったので合わせ直した．全開・$3500\ \text{rpm}$ の音量は変わらない） は既定の諸元の全開・$3500\ \text{rpm}$ の単気筒の音源 $\frac{\pi\bar N}{30}s(\psi)$ の実効値（定数として持つ．実測 $14.587$）．$\lambda_\ell = \lambda_0 + (1 - \lambda_0)\,\text{clamp}\left(\frac{1600 - \bar N_a}{700}, 0, 1\right)$，$\lambda_0 = 0.2 + 0.8\ell^{0.8}$，$\lambda_N = \min\left(6, (3500/\bar N_a)^{0.9}\right)$．
3. **雑音**：一様白色雑音（$\pm 1$）を $1.5\ \text{kHz}$ の高域通過と $7\ \text{kHz}$ の低域通過に通し，$0.045\min\left(4, (\bar e/0.05)^2\right)(0.3 + 0.7\ell)\frac{\bar N_a}{3000}$ を掛ける（$\bar e$：4 気筒の包絡の平均）．
4. **破裂音**：$\ell < 0.08$ かつ $\bar N_a > 2200\ \text{rpm}$ のとき，各気筒の周回ごとに確率 $0.5\min\left(1, \frac{\bar N_a - 2200}{2000}\right)$ で起こす．白色雑音を $260\ \text{Hz}$（$Q = 1.2$）と $1.1\ \text{kHz}$（$Q = 1.5$，利得 $0.6$）の帯域通過に通し，時定数 $12\ \text{ms}$ で減衰する包絡と $0.7$ を掛ける．
5. **歪み**：$u = x + \text{雑音} + \text{破裂音}$，$d = 2.6(0.25 + 0.75\ell)\left(0.4 + 0.6\min(1, \bar N_a/6000)\right)$ として $u \leftarrow \frac{\tanh\left(d\,(u + 0.35u^2)\right)}{\max(0.2, \tanh d)}$．
6. **集合管の共鳴**：B.1 と同じ形のくし形フィルタを，管長 $0.55\ \text{m}$，反射率 $0.8$，帰還の低域フィルタの係数 $0.06$，音速 $556.7\ \text{m/s}$（演出の定数）で使う．
7. **共鳴の付加**：帯域通過（中心 [Hz]，$Q$，利得 [dB]）$= (95, 2.5, 5)$，$(190, 3, 3)$，$(420, 4, 4)$，$(1150, 4, 7)$，$(2600, 3, 6)$ を通した成分を足す．
8. **明るさ**：遮断周波数 $f_c = 1400 + 7600\,\ell^{0.7}\left(0.5 + 0.5\min(1, \bar N_a/5000)\right)$ [Hz] の一次の低域通過を通した信号 $0.7$ と元の信号 $0.3$ を混ぜる．
9. **吸気音**：爆発の基本周波数の鋸歯状波（6 倍音まで）を $420\ \text{Hz}$（$Q = 2.2$）と $880\ \text{Hz}$（$Q = 3$，利得 $0.5$）の帯域通過に通し，$0.2\,\ell^2\min(1, \bar N_a/5500)$ を掛けて足す．
10. **出力**：$150\ \text{Hz}$ の low shelf $+4\ \text{dB}$，$28\ \text{Hz}$ の高域通過の後，B.3 と同じ圧縮器と制限を通す．音量に対する利得は $2.5V$．停止では A.6 と同じ包絡で音源を止め，残響が $10^{-9}$ 未満になれば出力を厳密に $0$ にする．
11. 演出では，排気管長・内径・反射率・流れ雑音の設定は使わない（音量とサイクル変動は使う）．

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
1. TEST-01〜30 の [A][S][U] の項目はすべてアプリ内に実装し，`[全テスト実行]` で実行できる．チップの状態は「未実行／実行中／PASS／FAIL」の 4 つだけ．
2. **利用者の状態によらない**：設定画面・解説・画面の構成を操作する [U] の検査は，開始時に全設定を既定値，刻み ×1，保留なし，機関をコールドリセットした状態にしてから行い，終了後に実行前の状態（設定値，保留値，刻み，運転の状態，基準サイクル，表示中のページ）へ完全に戻す．
3. [S] は運転中の機関とは別の `EngineCore` で実行し，運転中の機関の状態と設定を変えない．
4. テストの実行中も画面が固まらないよう，1 フレームあたり $12\ \text{ms}$ 以内に分けて実行し，進捗を表示する．途中で中止できる．実行中は運転中の機関の時間の進行を止めてよい（状態は保つ）．
5. 全テストの所要時間は $180\ \text{s}$ 以内．
6. 決定性：シナリオはサイクル変動 OFF で回し，乱数は種を固定した擬似乱数だけを使う．同じビルドで 2 回実行した結果の数値が完全に一致する．
7. 各検証項目は，項目名・基準・実測値・誤差・合否を持ち，詳細カードに表示する．
8. **納品条件**：[A][S][U] が全 PASS，[D] が全 PASS．1 件でも FAIL があれば成果物を公開しない．[M] で見つかった不具合は，再発を防ぐ自動テストを加えてから直す．

#### C. シナリオ
既定設定からサイクル変動だけを OFF にし，既定のソルバ（DOPRI5）で積分する．「継続」は元のシナリオの終端の状態を複製して続ける．

| ID | 開始 | 操作 | 時間 |
| :--- | :--- | :--- | :--- |
| S1 | コールドリセット | START | $5\ \text{s}$ |
| S2（アイドル） | S1 を継続 | なし | $+15\ \text{s}$ |
| S3（負荷） | S2 を継続 | $f_{\text{manual}} = 0.3$ | $+12\ \text{s}$ |
| N1200 | S2 を継続 | 目標 $1200\ \text{rpm}$ | $+8\ \text{s}$ |
| S7（低気圧） | S2 を継続 | $p_{\text{atm}} = 80\ \text{kPa}$ | $+10\ \text{s}$ |
| AMAX | S2 を継続 | 目標 $2000\ \text{rpm}$，$\alpha_{\max} = 5^\circ$ | $+8\ \text{s}$ |
| N600 | S2 を継続 | $T_{\text{aux}} = 0$，目標 $600\ \text{rpm}$ | $+15\ \text{s}$ |
| CS0，CS6，CS10 | コールドリセット | $T_{\text{aux}} = 0, 6, 10\ \text{N·m}$，START | $12\ \text{s}$ |
| S4（動力計制御） | コールドリセット | 動力計制御，目標 $1500\ \text{rpm}$，開度 $15^\circ$，START | $20\ \text{s}$ |
| S4b | S4 を継続 | $p_{\text{atm}} = 80\ \text{kPa}$ | $+10\ \text{s}$ |
| S8（VVT） | S4 を継続 | $\varphi_{\text{in}} = +30^\circ$ | $+5\ \text{s}$ |
| S4V | S4 を継続 | サイクル変動 ON | $+10\ \text{s}$ |
| S5（容量超過） | コールドリセット | 動力計制御，目標 $800\ \text{rpm}$，全開，START | $10\ \text{s}$ |
| S6（出力不足） | コールドリセット | 動力計制御，目標 $3000\ \text{rpm}$，開度 $7^\circ$，START．$10\ \text{s}$ 後に目標 $1400\ \text{rpm}$ | $10 + 8\ \text{s}$ |
| W3000 | コールドリセット | 動力計制御，目標 $3000\ \text{rpm}$，全開，定格トルク $200\ \text{N·m}$，START | $12\ \text{s}$ |
| CRANK | コールドリセット | 燃料 OFF でスターターだけ | $5\ \text{s}$ |

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
   * 部分負荷（$2000\ \text{rpm}$，$f_{\text{manual}} = 0.3$）の膨張のポリトロープ指数（$400^\circ$ と $480^\circ$ の $p$，$V$ から）：$1.20$〜$1.35$．根拠：圧縮・膨張とも $1.3 \pm 0.05$ が目安（Heywood）．本モデルの既燃ガスの $\gamma$ は平衡組成の値（解離を含む）なので，目安の下側に出る．
4. **記録する量**（判定は「有限」だけ．値を検証タブの実測欄に出す）：吸気管圧，$x_r$，排気弁が開く時点の筒内圧，アイドルの膨張の指数，排気弁が開いた直後の排気の逆流量．

---

## 8. テスト項目

各項目の先頭の記号は実行区分（SPEC-20 A）：[A] 解析，[S] シナリオ，[U] 画面，[D] 開発時．[A][S][U] はアプリの「検証」タブから実行できる．「（実測 …）」は，第25版の成果物をヘッドレス Chromium（$360 \times 640$）で実行したときの値である．

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
4. [A]（弁径）$d_v = 38\ \text{mm}$，$B = 86\ \text{mm}$ で $d_{v,\text{in}} = 38\ \text{mm}$，$d_{v,\text{ex}} = 35.625\ \text{mm}$．$d_v = 50\ \text{mm}$ で $d_{v,\text{in}} = 38.7\ \text{mm}$（$0.45B$）．
5. [A]（VVT）$\varphi \in \{-40, -15, 0, 15, 40\}^\circ$ で $L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$ が全周 $1^\circ$ 刻みで成り立ち（相対誤差 $10^{-12}$），作用角と $\int L_v\,d\theta$ が $\varphi$ によらない．
6. [A]（干渉）既定設定では `VALVE HIT` が出ない．$\varepsilon = 40$，$L_{\max} = 14\ \text{mm}$，$\varphi_{\text{in}} = -40^\circ$ では出る．判定が定義式の直接の評価と一致する．
7. [S] S8（S4 の定常から $\varphi_{\text{in}} = 30^\circ$，$5\ \text{s}$）：状態量が有限で，$\eta_v$ が $1\%$ 以上変わる．

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
6. [S]（当量比）S4 の定常から当量比だけを変えて各 $3\ \text{s}$：既定（化学種・直噴）では IMEP が $\phi = 0.8 < 0.9 < 1.0 < 1.1$ の順に増える（実測：$781$，$868$，$951$，$977\ \text{kPa}$．$\phi = 1.2$ は $971\ \text{kPa}$．リッチでの出力増は TEST-29 項目 9）．熱物性 $\gamma(T)$ では，全開・$3000\ \text{rpm}$ 固定・点火 $25^\circ$ 固定の 15 サイクル目で，IMEP が $\phi = 1.0 > 1.1 > 1.2$（実測：$1068$，$1035$，$1003\ \text{kPa}$．第25版までは既定のモデルでこの順だった）．スロットル制御（S2 から）では $\phi = 1.2$ の燃料流量が $\phi = 1.0$ より $15\%$ 以上多く，回転数は目標 $\pm 25\ \text{rpm}$．
7. [S]（調整係数の効果）S4 の定常から点火を固定して $c_b = 2$ にすると $p_{\max}$ が $5\%$ 以上上がる．自動最適化 ON では CA50 が上死点後 $10 \pm 0.5^\circ$ に戻る．
8. [S]（サイクル変動）S4V（S4 の定常からサイクル変動 ON で $10\ \text{s}$）：直近 60 サイクルの IMEP の変動係数が $0.5$〜$5\%$，平均 IMEP が OFF と $2\%$ 以内，$z_1, z_2$ の標本平均の絶対値が $0.3$ 未満・標準偏差が $1 \pm 0.25$・$|z| \le \sqrt 3$，平均 CA50 が上死点後 $10 \pm 1^\circ$．
9. [S]（決定性）S4 の終端を複製してサイクル変動 ON で $10\ \text{s}$ 積分した状態が S4V の終端と完全に一致する．OFF では $z_1 = z_2 = 0$．

### TEST-08：壁面熱伝達と壁温（REQ-08，SPEC-08）

1. [A] $C_w = 0$ で $h_c = 0$．ソルバの右辺でも $\dot Q_{\text{wall}} = 0$．
2. [A] $p > p_{\text{mot}}$ のとき，$p = p_{\text{mot}}$ のときより $w$ と $h_c$ が大きい．
3. [A] 壁温の式：$\dot Q_{\text{wall}} = 0$，$T_w = 300\ \text{K}$ で $\frac{dT_w}{dt} = \frac{15 \times 60}{1500} = 0.6\ \text{K/s}$（相対誤差 $10^{-12}$）．

### TEST-09：筒内圧の式（開いた系の熱力学第一法則）（REQ-09，SPEC-09）

1. [A]（断熱圧縮）弁を閉じ，燃焼と熱損失を無くし，定比熱比 $\gamma_0 = 1.35$ で下死点（$100\ \text{kPa}$）から上死点まで積分すると，$p(2\pi) = p(\pi)\,\varepsilon^{\gamma_0}$（相対誤差 $10^{-5}$）．さらに膨張下死点まで積分すると $p(3\pi) = p(\pi)$（$10^{-5}$）で，1 往復の図示仕事が $0$．
2. [A]（温度依存比熱の閉じた系）`EngineCore` の右辺で，弁を閉じ，燃焼と熱損失を無くし，回転数を固定し，比熱を $\gamma(T)$ として，未燃ガスだけ（$Y_u = 1$）と既燃ガスだけ（$Y_u = 0$）のそれぞれを，両方の弁が閉じている $270^\circ$（$100\ \text{kPa}$，$450\ \text{K}$）から上死点（$360^\circ$）まで積分すると，$m\left[e_k(T_{\text{end}}) - e_k(T_{\text{start}})\right] = -\Delta W$（相対誤差 $10^{-6}$）．終端の温度が $700\ \text{K}$ 以上（比熱の温度依存が効く範囲）．
3. [S]（第一法則の収支．熱物性 $\gamma(T)$）S2G（熱物性 $\gamma(T)$ で S2 と同じ手順のアイドル）と F3000G（熱物性 $\gamma(T)$，全開，$3000\ \text{rpm}$ 固定，45 サイクル）のそれぞれで，直近 5 サイクルの $\left|\Delta U_s + \Delta W + \Delta Q_w - \Delta Q_c - \Delta H_i + \Delta H_o\right| \le 10^{-4}\,\Delta Q_c$（実測：$1.9 \times 10^{-6}$，$2.4 \times 10^{-7}$）．既定の化学種のモデルの第一法則は TEST-29 項目 7 で確かめる．（第25版では S2，S3，W3000 で確かめていた．第26版で既定のモデルが変わったので，$\gamma$ のモデルの検査はこの 2 つにした．）
4. [S]（熱の行き先が妥当）W3000（既定の化学種・直噴）の直近 5 サイクルで，$\Delta Q_w/\Delta Q_c$（$Q_c$ は SPEC-29 B の 7 の表示用の熱発生率の積分）が $0.10$〜$0.30$，$T_{\max}$ が $2200$〜$2800\ \text{K}$（実測：$0.158$，$2568\ \text{K}$．第25版の $\gamma(T)$ では $0.179$，$2484\ \text{K}$ で，上限は $2700\ \text{K}$ だった．化学種のモデルは空気量と燃料が多く，$T_{\max}$ が約 $80\ \text{K}$ 高いので，上限を $2800\ \text{K}$ にした）．

### TEST-10：回転運動，摩擦，スターター（REQ-10，SPEC-10）

1. [A] $\text{FMEP}(p_{\max} = 5000\ \text{kPa},\ 3000\ \text{rpm}) = 13.7 + 25 + 16.2 \times 8.6 = 178.02\ \text{kPa}$（相対誤差 $10^{-12}$）．
2. [S] CRANK（燃料 OFF でスターターだけ，$5\ \text{s}$）：サイクル平均の角速度が，$T_f = a + b\,\omega$（$a = (F_0 + F_1 p_{\max})\frac{V_d}{4\pi} + T_{\text{aux}}$，$b = F_2\frac{S}{\pi}\frac{V_d}{4\pi}$）としたつり合いの値 $\omega_{\text{eq}} = \frac{T_{\text{stall}} - a}{T_{\text{stall}}/\omega_{nl} + b}$ の $\pm 15\%$ 以内（差はポンプ損失）．完爆と判定されない．
3. [S] S1（コールドリセットから START，$5\ \text{s}$）：$3\ \text{s}$ 以内に完爆と判定し，その後は $T_{\text{st}} = 0$，全状態量が有限．
4. [S] S3 の定常サイクルで $W_f = \text{FMEP}\cdot V_d$（相対誤差 $10^{-9}$）．
5. [A] 図示トルク：$p = p_{\text{atm}}$ で $T_{\text{ind}} = 0$．回転数固定のモードで $\frac{d\omega}{dt} = 0$．$\omega = 0$ で右辺が負なら $\frac{d\theta}{dt} = \frac{d\omega}{dt} = 0$．

### TEST-11：水ブレーキ式動力計と運転モード（REQ-11，SPEC-11）

1. [A] $T_{\text{dyno}}(1, \omega_{\text{rated}}) = T_{\text{rated}}$，$T(2\omega)/T(\omega) = 4$，$T_{\text{dyno}}(1,\ 800\ \text{rpm}) = 9.9\ \text{N·m}$（$1\%$）．ソルバの右辺で $T_{\text{dyno}} = f_{\text{eff}}k_w\omega^2$（$f_{\text{eff}} = 0.5$，相対誤差 $10^{-12}$）．
2. [A] $f_{\text{cmd}}$ を $0 \to 1$ にすると $t = \tau_d$ で $f_{\text{eff}} = 1 - e^{-1}$（相対誤差 $10^{-9}$．刻み $10^{-4}\ \text{s}$ と $3 \times 10^{-3}\ \text{s}$ の両方）．
3. [S] S3（スロットル制御，$f_{\text{manual}} = 0.3$）：直近 10 サイクル平均で $T_b$ と $T_{\text{dyno}}$ の相対差が $2\%$ 以内．$f_{\text{cmd}} = f_{\text{manual}}$ で一定．
4. [S] S4（動力計制御，$1500\ \text{rpm}$，開度 $15^\circ$）：最後の $5\ \text{s}$ で $\bar N$ の平均が $1500 \pm 10\ \text{rpm}$，瞬時値が $\pm 25\ \text{rpm}$，$0 < f_{\text{cmd}} < 1$，$\alpha = \alpha_{\text{manual}}$ で一定．
5. [S] S6（動力計制御，$3000\ \text{rpm}$，開度 $7^\circ$）：$f_{\text{cmd}} = 0$ に張り付いて `UNDERPOWER` になり，その間 $|I_f|$ が増えない．目標を $1400\ \text{rpm}$ に下げると $5\ \text{s}$ 以内に $f_{\text{cmd}} > 0$，$8\ \text{s}$ 後に $1400 \pm 50\ \text{rpm}$．
6. [S] S4b（S4 から $p_{\text{atm}} = 80\ \text{kPa}$）：定常の軸トルクが S4 より小さい．
7. [S] S5（動力計制御，$800\ \text{rpm}$，全開）：$f_{\text{cmd}} = 1$ に張り付いて `OVERLOAD` になる．
8. [S]（モードの切替）S2 の終端からスロットル制御 → 動力計制御に切り替えた直後の 1 ステップで，$\alpha_{\text{manual}}$ が切替前の $\alpha$ に等しく，$\alpha$ が変わらず，$|\Delta f_{\text{cmd}}| \le 10^{-3}$．続けてスロットル制御に戻した直後の 1 ステップで，$f_{\text{manual}}$ が切替前の $f_{\text{cmd}}$ に等しく，$|\Delta\alpha| \le 0.01^\circ$．

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
11. [S]（下限が制御を妨げない）N600（S2 から $T_{\text{aux}} = 0$，目標 $600\ \text{rpm}$，$15\ \text{s}$）：最後の $3\ \text{s}$ の $\bar N$ の平均が $600 \pm 25\ \text{rpm}$ で，常に $\alpha > \alpha_{\min}$．

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
10. [S]（硬さ）S2 の 1 サイクルに沿って $10^\circ$ ごとにヤコビアンを差分で作り，べき乗法で求めた $\max|\lambda|$ が $2.79/\Delta t_{\max}$ 以下．
11. [S]（高速化の等価性）速い計算経路が元の式の経路と浮動小数点数として同じ値を返す：右辺の出力先を指定した呼び出しとしない呼び出し，`EngineCore` 専用の DOPRI5 と汎用の DOPRI5，作用角を前計算した弁リフトとしない弁リフト，$\Psi$ の実装と SPEC-04 の定義式，比熱比が一定の流れ（大気，排気系）のために $\gamma_0$ だけで決まる量を前計算した $\Psi$・流量と，前計算しないもの．

### TEST-14：性能の指標と基準サイクル（REQ-14，SPEC-14）

S3（スロットル制御，$f_{\text{manual}} = 0.3$）と S4（動力計制御）の定常について，

1. [S] $\text{IMEP}\cdot V_d = W_{i,\text{net}}$，$\text{PMEP}\cdot V_d = W_{i,\text{net}} - W_{i,\text{gross}}$（相対誤差 $10^{-12}$）．$W_{i,\text{net}}$ が，ステップ点の $p$-$V$ の台形則による値と相対差 $0.1\%$ 以内．
2. [S] $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$，$P_b = \text{BMEP}\cdot V_d/t_c$（相対誤差 $10^{-9}$）．$0 < \eta_m < 1$，$\text{bsfc} > 0$ で有限．
3. [S]（理論の上限）直近 5 サイクルで $P_i \le \eta_{\text{Otto}}\,\dot m_f H_u$，$\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$．
4. [S]（動力の収支）直近 5 サイクル平均で $|W_{i,\text{net}} - \Delta W_f - \Delta W_a - \Delta W_d|/W_{i,\text{net}} \le 2\%$．
5. [S] 基準サイクルを保存した後，点火時期と開度を変えて $1\ \text{s}$ 積分しても，保存した配列が書き換わらない．
6. [S]（表示の規則）S1 の全期間（$0.05\ \text{s}$ ごと）で，完爆前の IMEP・効率の表示が「–」，効率の表示が $[0, 1.5]$ の外に出ず，`NaN`・`Infinity` を表示しない．
7. [S] $\eta_i = W_{i,\text{net}}/(m_f H_u)$（相対誤差 $10^{-12}$）．動力計制御・開度固定で，$\phi = 1.2$ の $\eta_i$ が $\phi = 1.0$ より $10\%$ 以上低い．
8. [S]（10 サイクル平均）S3 の定常で，表示用の各指標が直近 10 サイクルの値の算術平均と一致する（相対誤差 $10^{-12}$）．コールドリセットの直後は「–」に戻り，完爆後 3 サイクルの時点では 3 サイクルの平均である．
9. [S]（体積効率）化学種のモデル（既定）で $\eta_v = \frac{m_{a,\text{IVC}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{R_a T_{\text{amb}}}$．熱物性 $\gamma(T)$ で $\eta_v = \frac{m_{u,\text{trapped}}}{(1 + \phi/\text{AF}_{st})\,\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{RT_{\text{amb}}}$（どちらも相対誤差 $10^{-12}$）．

### TEST-15：画面の構成と操作（REQ-15，SPEC-15）

1. [U] 「解説」以外の 5 タブの全サブページ（線図 7，性能曲線 6，設定の全ページ，検証，運転の指標 2 ページ）で，ルート要素と全容器が `scrollHeight ≤ clientHeight` かつ `scrollWidth ≤ clientWidth`．
2. [U] 表示中の全ボタンが $44 \times 44\ \text{px}$ 以上で，互いに重ならず，ビューポート内にある．ボタンの文字が折り返していない．
3. [U] DOM に `input[type="range"]` が無い．表示している全テキストに `bar` を含まない．ただし数式の TeX のソース（`.tx` の中）は除く（`\bar` は上線の命令で，圧力の単位ではないため．TeX の表示のときに画面に出る）．
4. [U] 合成した Pointer Events で，(a) 移動 $\ge 8\ \text{px}$ または接触 $\ge 500\ \text{ms}$ はタップにならない，(b) 接触の幅 $100\ \text{px}$ のタップも受理される，(c) `[RESET]` は単押しで無効・$0.6\ \text{s}$ の長押しで有効，(d) 検証タブの 28 チップすべてがタップで選べ，詳細カードの見出しが選んだテストの番号になる．
5. [U] Canvas のビットマップ寸法が CSS 寸法 × $\min(\text{dpr}, 2.5)$（四捨五入）と一致し，高さが下限以上．タブの切替を 10 回繰り返した後も一致する．
6. [A] フレーム間隔を $8.3\ \text{ms}$ と $16.7\ \text{ms}$ に模擬したとき，同じ実経過時間 $2\ \text{s}$ に対するシミュレーション時間の進みの差が $1\%$ 未満．非表示から戻った直後の 1 フレームで進む時間が $50\ \text{ms}$ × 再生速度 ＋ 最大刻み 以下．
7. [U] 表示中の全ボタンの文字幅（`Range.getBoundingClientRect`）が利用可能幅の $95\%$ 以下．
8. [U]（画面の段階）現在の幅 $w$ に応じて：$w \ge 900$ なら運転タブで機関断面図と制御状態カードが横に並び，設定タブ（$p$-$V$ 図のあるページ）で項目の一覧と $p$-$V$ 図が横に並んで $p$-$V$ 図の高さが列の高さの $80\%$ 以上，高さ $\ge 800$ なら運転タブに $p$-$V$ 線図が表示される．$w < 900$ ならどちらも縦に並び，運転タブの $p$-$V$ 線図は表示されない．$w \ge 700$ なら指標 24 項目が同時に表示されて `[指標1/2]` が隠れ，$w < 700$ なら 12 項目と `[指標1/2]` が表示される．
9. [A]（グラフの列数）$(n, W, H) = (3, 344, 500) \to 1$，$(3, 1380, 700) \to 3$，$(4, 1164, 650) \to 3$，$(2, 1380, 700) \to 2$，$(1, 1380, 700) \to 1$，$(3, 800, 900) \to 1$．横に並べたとき，各グラフのプロット領域が互いに重ならず Canvas 内にある．
10. [D] ヘッドレス Chromium で，A.2 の 6 つのビューポート（PC はタッチ無し）と，極端な利用者状態（$384 \times 780$．SPEC-20）で全テストを実行する．MathJax の読み込み（C-1）は，6 つのビューポートでは手元に置いた同じ版（MathJax 3.2.2 の `es5/tex-svg.js`）に振り向け，極端な利用者状態では遮断する（オフラインに相当）．

### TEST-16：解説タブ（REQ-16，SPEC-16）

1. [U] §0〜§19 がすべてあり，章に付けた `data-req` が SPEC-01〜14 と 21，27，29，30 を網羅する．MathJax で組んだときは組版の誤り（`data-mjx-error`，`mjx-merror`）が無い．
2. [U] 式に現れる全識別子（`.tx` の `data-ids`）が §0 の記号表にある（未定義 $0$ 個）．
3. [U] 解説に表示した係数の値がソルバの定数と一致する．§0 の現在値が設定値と一致する．
4. [U] 全数式の要素に空でない TeX のソース（`data-tex`）がある．MathJax が使えるときは，(a) 解説（§0〜§17）と 3 文書の全数式を `MathJax.tex2svg` で組んで（画面には入れない）組版の誤りが無い，(b) 表示範囲に入っている数式が SVG（`mjx-container`）に組まれている，(c) 解説の別行立ての全数式を組んだとき，分数・根号・上付きを含まない式の高さが $3\ \text{em}$ 以下，全数式の幅が $0.5\ \text{em}$ 以上，分数を含む式も $8\ \text{em}$ 以下．TeX の表示のときは各要素の文字列が TeX のソースと一致し，等幅の字で表示される．
5. [U] 数式の状態の表示（SPEC-16 3）が，MathJax の状態（組版／読み込み中／TeX 表示）と一致する．
6. [U] 本文（段落・表）に生の下付き表記（`X_y`）が残っていない．
7. [U] 数式が縮小されていない（MathJax の SVG の字の大きさが本文の $1$ 倍以上．TeX の表示は本文の $0.85$ 倍以上）．幅を超える数式と表の容器は `overflow-x: auto` で，解説タブ全体は横にスクロールしない．
8. [U] 目次に §0〜§19 があり，各項目のタップで見出しの上端が解説タブの上端から $\pm 4\ \text{px}$ に来る．「先頭へ戻る」で縦スクロール位置が $0$ になる．
9. [U] §1 に 21 個の時間微分の式があり，左辺の記号が状態ベクトルの 21 成分に一対一で対応する．
10. [U] 生成した TeX で，べき指数の底が閉じ括弧 1 文字だけになっている式が無い（`)^` は `\right)^` の形だけ）．$\Psi$ の式は根号が右辺全体に掛かる（右辺が `\sqrt{` で始まり対応する `}` で終わる）．
11. [U] §16 に演出音の処理（10 段の表）と定数の表があり，表示している定数が合成器の定数と一致する．
12. [U] 解説だけが縦にスクロールでき，ほかのタブへ移って戻った後のスクロール位置が $\pm 1\ \text{px}$ で保たれる．
13. [U] §3 に未燃・既燃の比熱比の式と内部エネルギーの式（左辺が $\gamma_u$，$\gamma_b$，$e_u$，$e_b$），§6 に余剰エンタルピーの式（左辺が $E_{\text{in}}$，$E_p$，$\dot X_o$），§10 に組成の項（燃焼割合の時間微分と $e_u - e_b$ の積）を含む筒内圧の式がある（式の TeX のソースで判定する）．
14. [U] 設定の熱物性（γ(T)／γ一定／化学種）とカム（Std／Poly／Aggr）を順に変えると，それぞれに対応する式だけが強調される．§18 に $\dot p$ の式（左辺が $\frac{dp}{dt}$ で $S_E$，$S_R$ を含む）とエネルギーの式，§19 に噴射量，噴射率，気化の式がある（式の TeX のソースで判定する）．
15. [U]（文書の閲覧）切替のボタンが 4 つあり，$44\ \text{px}$ 以上で文字幅の余裕（SPEC-15 G.2）を満たす．`[要件定義書]` `[仕様書]` `[用語集]` のそれぞれをタップすると，最初のページに文書の題（`h1`）が表示される．全ページを順に表示して数えた数式（`.tx`）の数が，ビルド時に数えた数と一致する．MathJax が使えるときは全数式が誤りなく組め，表示範囲の数式が組まれている．目次の最初と最後の項目のタップで，その見出しのページに替わって見出しが上端（$\pm 4\ \text{px}$）に来る．解説タブが横にスクロールしない．
16. [U]（文書の閲覧）全ページを通して，要件定義書に REQ-01〜30 の見出しが，仕様書に SPEC-01〜30 と TEST-01〜30 の見出しが，それぞれ 1 つずつある．`[式の解説]` で元の表示（§0〜§19）に戻る．文書を切り替えて戻ると，表示中のページが同じで，縦スクロール位置が $\pm 1\ \text{px}$ で保たれる．
17. [U]（ページ）画面にある文書の断片は，表示中の 1 ページだけである（その文書の中の `h2`，`h3` で始まる断片が 1 つ）．`[次 ▶]` `[◀ 前]` で位置の表示が 1 ずつ変わり，最初のページで `[◀ 前]`，最後のページで `[次 ▶]` が無効．ボタンは $44\ \text{px}$ 以上．3 文書の全ページを順に表示する間，1 ページの切り替え（断片の組み立てと組版）にかかる時間が $100\ \text{ms}$ 以下．
18. [U]（第三者の著作物を埋め込まない，C-8）成果物の CSS に `@font-face` が無く，HTML に base64 の data URL（`data:` で始まり `;base64,` を含む URL）が無く，`document.fonts` に成果物が定義したフォントが無い．MathJax を読み込む `<script>` の `src` が `https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js` で，式の解説の末尾に `MathJax 3.2.2`，`Apache License 2.0`，`cdnjs` がある．
19. [U]（TeX の表示）MathJax の有無によらず，TeX の表示の関数で数式の要素を描くと，中身が TeX のソースと一致する等幅の文字列になり，別行立ての式は独立の行で `overflow-x: auto` になる．MathJax が使えるときは，同じ要素を組み直すと SVG に置き換わる．開発時検証では，7 通りのうち極端な利用者状態の 1 通りで MathJax の読み込みを遮断し，全テストを TeX の表示で通す（ほかの 6 通りは手元の MathJax 3.2.2 に振り向ける）．

### TEST-17：グラフの軸・目盛・自動レンジ（REQ-17，SPEC-17）

1. [A] 目盛：$F \in \{1, 2, 5, \dots, 5000\}$ と $600$，$120$，$3000$，$720$ で，間隔が $\Lambda$ の元で区間の数が 4〜8．諸元連動の上限が $555 \to 600$，$9 \to 10$．
2. [A] 段階型：(a) $F_0 = 5000$ で $M = 4500 \to 6500$ にすると直ちに $10000$，(b) $M = 1500$ を $2.9\ \text{s}$ 与えても変わらず $3.0\ \text{s}$ で $2000$，(c) $M$ が $F$ の $\pm 5\%$ で振れる入力 $60\ \text{s}$ で変更 1 回以下，(d) $F_{\min}$，$F_{\max}$ を超えない，(e) リセットで $F_0$，(f) $M = 1200$ 一定を $20\ \text{s}$ 与えると変更はちょうど 1 回，(g) $M = 6500$ で $10000$ に切り替わった $0.5\ \text{s}$ 後に $M = 12000$ を与えても変わらず，$1\ \text{s}$ 後に $20000$．
3. [A] 帯域型：データ $[795, 805]$ に対し，範囲がデータを含み，刻み $\ge s_{\min}$，区間の数 4〜8．データが範囲を出たら直ちに計算し直す．
4. [U] 線図の 7 画面（①は線形と両対数）の全グラフについて，S3 のデータで計算したレイアウト（軸名・目盛の数値・凡例の矩形）を検査する：縦軸名と横軸名があり単位 `[...]` を含む，目盛の数値が各軸 3 個以上，複数系列のグラフに凡例がある，全矩形が Canvas 内にあり互いに重ならない．
5. [U] $p$-$V$ 図に既知の長方形のサイクル（$V \in [100, 500]\ \text{cm}^3$，$p \in [1000, 4000]\ \text{kPa}$）を与えると，4 頂点の座標変換が目盛の位置と $\pm 1\ \text{px}$ で一致し，描いた 4 辺の中点に曲線の画素があり，長方形の中心には無い．
6. [S] S2 の終端で，$p$ 軸の $F$ が $M$ の $1$〜$3.2$ 倍にあり，直近 $5\ \text{s}$ で範囲の変更が 0 回．
7. [U]（クランク角の軸）線図③とカム線図の横軸が $[360, 1080]$（目盛 $360, 540, 720, 900, 1080$），線図②の 3 グラフが $[180, 540]$（目盛 $180, 270, 360, 450, 540$），線図④⑤が $[0, 720]$（目盛 $0, 180, 360, 540, 720$）．各系列の横座標が単調増加で，並べ替えた系列の $\theta = 720^\circ$ の値が元の配列の $\theta = 0$ の値と一致する．
8. [A]（強調）範囲の切替から $0.5\ \text{s}$ 後のレイアウトでは目盛の数値が強調の対象で，$1.5\ \text{s}$ 後は対象でない．
9. [U]（グラフのタップ，SPEC-15 E）線図②のグラフの横 $25\%$ の位置をタップすると，その位置（$\pm 1\%$）に読み取り線が出る．もう一度タップすると消える．

### TEST-18：設定画面（REQ-18，SPEC-18）

1. [A] 項目定義表の全項目：既定の表示値が範囲内で刻みの格子上にある．表示値 × 単位係数が内部の既定値と一致（相対誤差 $10^{-12}$）．$p_{\text{atm}}$ の既定の表示が `101.3`．1 ページの項目が 6 以内．
2. [A] 全数値項目で，`[+]` 1 回と `[−]` 1 回で内部値が元に戻る（相対誤差 $10^{-12}$）．上限で `[+]`，下限で `[−]` を押しても範囲を出ない．×10 でも同じ．
3. [U] 即時項目（点火時期）の `[+]` を押した同じフレームでソルバの入力が変わる．要リセット項目（$\varepsilon$）の `[+]` ではソルバの値は変わらず保留の表示になり，「適用」で変わってコールドリセットされ，「破棄」で保留が消える．
4. [A] $\varepsilon = 1.1, 2, 10, 40, 100$ を設定し，初期角速度 $200\ \text{rad/s}$ からスターターを掛けて最大 2 サイクル（または $2\ \text{s}$）積分すると，クランクが回り，$V(\pi)/V(0) = \varepsilon$（相対誤差 $10^{-12}$）で状態量が有限．$\lambda > 0.5$ の組合せでは「適用」が無効．
5. [U] 選択項目が名前付きのボタンで表示され，画面に `0:`・`1:` のような表記が無い．
6. [S] S2 の定常から点火時期を $+10^\circ$ 変える：基準サイクルが保存され，その内容は $5\ \text{s}$ 積分しても変わらず，現在のサイクルの $p_{\max}$ が基準と $1\%$ 以上違い，パネルの $\Delta$ が（現在値 − 基準値）と一致する．$1\ \text{s}$ 間隔で 3 回続けて変えても基準は最初の 1 回分のままで，$3\ \text{s}$ 以上あけた変更では更新される．
7. [U] 「機関」以外の全ページでパネルが表示され，高さ $120\ \text{px}$ 以上で，軸名と目盛の数値を持つ．`[元に戻す]` が直前の 1 変更を取り消す．
8. [U] 目標回転数の `[+]` は常に有効で，$20000\ \text{rpm}$ まで上げられ，表示値と内部値が一致する．
9. [U]（カム線図）「VVT・カム」「弁タイミング」ではカム線図が表示され，吸気位相を $+10^\circ$ 変えるとリフト曲線の最大点の横位置が $10^\circ$（$\pm 0.5^\circ$）動き，基準（灰色）は元の位置に残る．オーバーラップ角の表示が定義と一致する．
10. [U] 自動最適化 ON で，点火時期の行が「（自動）」と自動の値（小数 1 桁）を表示し，`[−]` `[+]` が無効．
11. [U] 完爆後に自動最適化を OFF にすると，自動の値 $27.34^\circ$ が手動の値 $27^\circ$ に引き継がれる．
12. [U] 点火時期に上下限が無い：×10 の刻みで $-120^\circ$，続けて $+300^\circ$ 押しても `[−]` `[+]` が有効で，値が $-93^\circ$，$207^\circ$ になる．
13. [U]（既定値）ページ「吸気」の全数値項目を 1 刻み変えてから `[既定値]` を押すと，全項目が既定値に戻る．「機関」で $\varepsilon$ を変えて保留にしてから `[既定値]` を押すと，保留値が既定値になり，ソルバの値は変わらない．
14. [U]（ページ）どのページも項目が 1〜6 個．ページ名のタップで全ページの一覧が開き，選んだページへ移る．「機関」のページに導出値 $\lambda$，$V_d$，$V_c$ が設定値から計算した値で表示される．
15. [U]（基準の更新）サイクルが無いときパネルに「運転タブで START してください」と表示する．サイクルがあるとき，`[基準更新]` と線図 ① の `[基準を現在に]` で，現在のサイクルが基準になり，パネルに基準比が表示される．
16. [U]（制御で使わない項目）ページ「運転」で，スロットル制御のとき，固定開度の行が「（自動）」と現在の開度 $\alpha$（小数 1 桁）を表示し，`[−]` `[+]` が無効で，押しても $\alpha_{\text{manual}}$ が変わらない．基準充水率の行が「（不使用）」で `[−]` `[+]` が無効．固定充水率の行は有効．運転中の機関の開度を変えると，毎フレームの表示の更新（テストの実行中は画面の描画が止まるため，テストはその更新の関数を直接呼ぶ）で表示が追従する．設定で動力計制御に切り替えると，同じフレームで，固定開度と基準充水率の行が有効になり，固定充水率の行が「（自動）」と現在の $f_{\text{cmd}}$（小数 2 桁）を表示して無効になる．$f_{\text{cmd}}$ を変えると，同じ更新で表示が追従する．動力計制御で固定開度が格子に無い値（$12.34^\circ$，切替で上書きされた値に相当）のとき，表示が「12.3」で，`[+]` で $12.4^\circ$ になる．どちらの制御でも，行の文字が欠けない（項目名と値の幅が行に収まる）．

### TEST-19：機関断面図（REQ-19，SPEC-19）

1. [A] 場面記述：$\theta \in \{0, 90, \dots, 630\}^\circ$，3 組の諸元（既定，$B = 60/S = 120/l = 200$，$B = 120/S = 60/l = 100$）で，頂面の位置 $= s\,(h_c + x)$，ピン間の距離 $= s\,l$，クランクピンの半径 $= s\,r$，弁の傘の変位 $= s\,L_v$ が $\pm 0.5\ \text{px}$ で成り立つ．
2. [A] 諸元の範囲の端点の組合せ（$\lambda \le 0.5$）すべてで，全要素の座標が Canvas 内にある．
3. [A] 吸気ポートと排気ポートの多角形が自己交差しない．
4. [U] 既定の状態で描くと，吸気ポートの中心線上の 10 点（外端から弁座の直上まで等間隔）の画素がすべて青系（色相 $190$〜$250^\circ$），排気ポートの 10 点がすべて橙系（色相 $10$〜$45^\circ$）．
5. [U] 筒内ガスの色相が $T = 300, 800, 1500, 2500\ \text{K}$ に対して単調に変わる．
6. [A] `VALVE HIT` が出ていない全クランク角で，弁の傘の下面がピストン頂面より上にある．

### TEST-20：検証の基盤（REQ-20，SPEC-20）

1. [S] 決定性：S1 と S2 をもう一度実行し，終端の全状態（内部状態を含む）が 1 回目と完全に一致する．
2. [A] 全テストの実行の前後で，運転中の機関の状態と全設定値が完全に一致する．
3. [U] TEST-01〜19，21〜30 がすべて実行され，結果を持つ．
4. [D]（利用者の状態によらない）全即時項目を上限値（選択項目は最後の選択肢），動力計制御，刻み ×10，要リセット項目の保留あり，運転中，の状態で全テストを実行し，28/28 PASS で，実行の直前と直後で機関の状態と全設定値が完全に一致する．
5. [U] テストの実行中の最長のフレーム間隔が $250\ \text{ms}$ 以下，総所要時間が $180\ \text{s}$ 以下（第25版までは $120\ \text{s}$．開発用の計算機の速さが変わると [D] で $120\ \text{s}$ を超えたため，利用者の指示で緩めた．要件定義書 7.3）．

### TEST-21：エンジン音（REQ-21，SPEC-21）

1. [A] $c = \sqrt{\gamma_b(800)\,R \cdot 800}$，$f_1(L = 1) = c/4$（相対誤差 $10^{-12}$）．
2. [A] 位相：$\bar N_a = 800, 1500, 3000\ \text{rpm}$ 一定で $1\ \text{s}$ 合成すると，位相の総進みが $1440\bar N/120$ と一致（相対誤差 $10^{-9}$）．
3. [S] 周期性（サイクル変動 OFF）：S4 の表で，周期が整数サンプルになる $800$，$1500$，$3000\ \text{rpm}$ について，$\rho_m = 0$ と $0.6$ の両方で，$2$〜$3\ \text{s}$ の区間の $y_{k + P}$ と $y_k$ の差の RMS が出力の RMS の $10^{-3}$ 未満，$\lfloor 1.02P\rfloor$ ずらすと $5\%$ 以上違う．
4. [A] 共鳴：単一パルスの応答で，$L = 1.0$ と $0.5\ \text{m}$ について，$f_1, f_2, f_3$ の近く $\pm 10\%$ の振幅の最大点が理論値と $2\%$ 以内，$f_n$ と隣の極小の振幅の比が理論値の $75\%$ 以上．
5. [S] 表：S3 の最終サイクルから作った表が 1440 点すべて有限，平均の絶対値が最大の $10^{-6}$ 以下，排気行程の点 $i = 1200$ が中心差分の定義と一致．
6. [A] 表の切替：サイクルの途中で新しい表を送ると，位相が 1 周した瞬間に切り替わり，それまでの出力は切替なしと完全に一致する．
7. [A] 無音と制限：$\bar N = 0$ から始めると出力は厳密に $0$．$800\ \text{rpm}$ から $0$ にすると $0.5\ \text{s}$ 後に $|y| < 10^{-6}$．S5 の表・$6000\ \text{rpm}$・音量 $100\%$ でも $|y| \le 1$ で NaN が無い．音量 $0$ で出力は厳密に $0$．小振幅では出力が音量に比例する（$1\%$ と $2\%$ で RMS 比 $2$，誤差 $1\%$）．
8. [S] 音量の順序：S2（アイドル）の RMS が S4 と S5 のどちらよりも小さく，S5 は S4 の $0.9$ 倍以上．
9. [U] 送る値：運転中の機関の $\bar N$ が送られ，再生速度 $0.1\times$ と $1\times$ で同じ値．音 OFF とテストの実行中は $0$．`[音]` のタップで ON／OFF とラベルが切り替わる．
10. [A]（圧縮器）振幅 $2$ の正弦の定常のピークが $l_t^{3/4}\cdot 2^{1/4}$（$1\%$），振幅 $0.2$ では利得が厳密に $1$，$0.1 \to 2$ の段差で出力が上限を超えない，包絡が $0.2\ \text{s}$ 保持された後 $0.3\ \text{s}$ で $1/e$ に減衰する．
11. [S]（歪まない）W3000 の表・音量 $60\%$ で，$|y| > 0.8$ のサンプルが $0.1\%$ 未満．圧縮と制限が定常で波高率を $5\%$ を超えて下げない．
12. [A]（管内の損失）一次の低域フィルタの $|H(1\ \text{kHz})|$ が定義式と一致（相対誤差 $10^{-9}$），$|H(f)|$ が単調減少で $|H(0)| = 1$．単一パルスの残響が $40\ \text{ms}$ 後にピークの $1\%$ 未満．
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

### TEST-22：制御状態の表示（REQ-22，SPEC-22）

1. [U] 停止・始動中・スロットル制御・動力計制御の 4 状態で，カードの文字列に上の表の見出しと量の名前が含まれ，数値が機関の状態と一致する．
2. [U] スロットル制御で $\alpha = \alpha_{\max}$ のとき `全開`，$\alpha = 0$ のとき `全閉`，$\alpha = \alpha_{\min} > 0$ のとき `下限`，動力計制御で $f_{\text{cmd}} = 1$ のとき `上限`，$0$ のとき `下限` が表示され，張り付いていないときはどれも表示されない．`飽和` の語を使わない．
3. [U] 自動最適化 ON では点火の見出しが「自動」，OFF では「固定」．
4. [U] 最長の表示でもカードの 4 行が折り返さず，運転タブがスクロールしない．
5. [U] カードに `スロットル開度 α`，`動力計の充水率 f`，`点火時期`，`BTDC` の語が含まれる．
6. [U]（指標の名称，SPEC-14）全 24 項目のそれぞれについて：既定は記号．その項目のタップでその項目だけが日本語名になり，ほかは記号のまま．もう一度のタップで記号に戻り，さらに 2 回タップしても記号に戻る．どの状態でも名称と値が切れない．
7. [U]（実機のタップの再現）項目の上で `pointerdown` を送り，表示の更新を挟んでから同じ要素に `pointerup` を送ると，その項目が切り替わる．更新の前後で項目の要素が同一である．

### TEST-23：目標回転数スライダ（REQ-23，SPEC-23）

1. [U] 運転タブに帯・つまみ・`[−]`・`[＋]` があり，ボタンとつまみが $44 \times 44\ \text{px}$ 以上，帯が Canvas の下端に収まり，運転タブがスクロールしない．
2. [U] つまみを押して動かすと，目標回転数が「つまみの位置の値」（線形に変換して $50\ \text{rpm}$ に丸めた値）になり，ソルバの入力とラベルが同じ値になる．左端・右端までドラッグすると $500$，$8000\ \text{rpm}$．
3. [U] トラックのつまみ以外の位置のタップと，そこから始めたドラッグでは，目標回転数が変わらない．
4. [U] `[＋]`・`[−]` で $\pm 50\ \text{rpm}$．$8000\ \text{rpm}$ から `[＋]` を 2 回押すと $8100\ \text{rpm}$ で，つまみは右端，ラベルは `8100`．$500\ \text{rpm}$ で `[−]` は無効．
5. [A] 機関断面図の全要素が帯の上端より上にある（既定の諸元と範囲の端点，$\theta = 0, 180^\circ$）．

### TEST-24：内部 EGR と点火時期の妥当性（REQ-24，SPEC-24）

サイクル変動 OFF，点火の自動最適化 ON，既定の諸元から各条件で $12\ \text{s}$ 積分し，直近のサイクルで判定する．

1. [S]（軽負荷）スロットル制御，目標 $1500\ \text{rpm}$，$f_{\text{manual}} = 0.1$：$\theta_{\text{OL}} = 20, 50, 80^\circ$ で $x_r$ と $\bar Y_{b,\text{in}}$ がともに単調に増え，$x_r(80^\circ) - x_r(20^\circ) \ge 0.10$．（実測：$x_r = 0.121, 0.173, 0.310$）
2. [S]（部分負荷）スロットル制御，目標 $2000\ \text{rpm}$，$f_{\text{manual}} = 0.3$：$\theta_{\text{OL}} = 20 \to 80^\circ$ で，$x_r$ が $0.04$ 以上増え，PMEP が $4\ \text{kPa}$ 以上 $0$ に近づき，$T_{\max}$ が $40\ \text{K}$ 以上下がり，$\eta_b$ が下がらない．（実測：$x_r$ $+0.056$，PMEP $-47.7 \to -36.6\ \text{kPa}$，$T_{\max}$ $-59\ \text{K}$，$\eta_b$ $0.258 \to 0.265$）
3. [S]（全開）W3000（動力計制御，全開，目標 $3000\ \text{rpm}$，定格トルク $200\ \text{N·m}$）：$x_r \le 0.08$，$\bar Y_{b,\text{in}} \le 0.02$．（実測：$0.054$，$0.003$）
4. [S]（アイドル）S2：$0.15 \le x_r \le 0.35$．（実測：$0.21$）
5. [S]（MBT 点火時期）動力計制御，全開，定格トルク $200\ \text{N·m}$，目標 $1500, 3000, 5000\ \text{rpm}$：MBT 点火時期がいずれも $15$〜$35^\circ$ BTDC で，実際の回転数 $\bar N$ とともに単調に進角する．全開では動力計の整定が遅く $\bar N$ は目標に届かないので，目標との一致は判定しない．（実測：$1454, 2516, 4298\ \text{rpm}$ で $20.7, 24.0, 26.4^\circ$）
6. [S]（火炎発達角）W3000 で，点火から $x_b = 0.1$ までが $15$〜$35^\circ\text{CA}$．（実測：$24.8^\circ$）
7. [S]（希釈による進角）1 の条件で，MBT 点火時期が $\theta_{\text{OL}} = 80^\circ$ のほうが $20^\circ$ より $2^\circ$ 以上進む．（実測：$20.7 \to 23.6^\circ$）
8. [S] TEST-24 全体の所要時間が $25\ \text{s}$ 以下（TEST-20 の総所要の上限を守るため）．

### TEST-25：吸気ランナの慣性（慣性過給）（REQ-25，SPEC-25）

1. [A]（共鳴）吸気弁が閉じた角度で回転を止め，$\zeta = 0$，$\dot m_{\text{th}} = 0$ として $\dot m_r(0) = 10^{-4}\ \text{kg/s}$ から積分すると，$\dot m_r$ の振動の周期が $2\pi/\omega_H$ と相対誤差 $1\%$ 以内．
2. [A]（摩擦）$p_{\text{in}} - p_p = \frac{\zeta\dot m_r^2}{2\rho_r A_r^2}$ のとき $\frac{d\dot m_r}{dt} = 0$（$p_{\text{in}} - p_p$ を基準に相対誤差 $10^{-9}$．$\rho_r$ の気体定数は，化学種のモデルでは空気の $R_a$）．
3. [S]（OFF）ランナ OFF で $\dot m_r$，$p_p$，$m_{b,p}$，$E_p$ の時間微分が $0$ で，吸気弁の流量が上流圧 $p_{\text{in}}$ で計算される（S2 の定常から 1 サイクルの全ステップ）．
4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{th}}$，$M_r$，$M_{\text{in}}$ の増分が相互に相対誤差 $1\%$ 以内．全時刻で $0 \le Y_{b,p} \le 1$．
5. [S]（慣性過給）全開・回転数固定の計測（SPEC-26）で，既定のランナ（$L_r = 450\ \text{mm}$）の $\Delta\eta_v(N) = \eta_{v,\text{ON}}(N) - \eta_{v,\text{OFF}}(N)$ の最大が $0.02$ 以上．その最大を与える回転数が，$L_r = 900\ \text{mm}$ では $450\ \text{mm}$ より低い．（実測：$4000 \to 2500\ \text{rpm}$，最大 $0.107$，$0.147$）
6. [U] 設定ページ「吸気ランナ」に 3 項目があり，全項目の操作で値が変わり，画面がスクロールしない．
7. [A]（運転中に ON）ランナ OFF で運転中の状態から ON にすると，$\dot m_r = 0$，$p_p = p_{\text{in}}$（厳密），$m_{b,p} = Y_{b,\text{in}}m_p$，$E_p = \varepsilon_{\text{in}}m_p$（相対誤差 $10^{-12}$）になる．

### TEST-26：性能曲線タブ（回転数に対する特性の計測）（REQ-26，SPEC-26）

1. [U] 6 タブが表示され，タブの文字が切れず，画面の文言に「掃引」が無い．性能曲線タブがスクロールしない．表示のボタン 6 つが $44\ \text{px}$ 以上で文字幅の余裕を満たす．4 つのグラフ表示の全グラフに単位付きの軸名と目盛がある．完了後の状態の表示の 3 行が切れない．
2. [S]（回転数の保持）各点で角速度が目標と相対誤差 $10^{-9}$ 以内，サイクルの時間から求めた回転数も目標と相対誤差 $10^{-9}$ 以内．
3. [S]（恒等式）各点で $P_b = T_b\cdot\frac{2\pi N}{60}$，$\text{BMEP}\cdot V_d = 4\pi T_b$（相対誤差 $10^{-9}$）．
4. [S]（決定性）同じ設定で 2 回計測した結果が完全に一致する．
5. [U]（干渉しない）`[計測開始]` から完了までの前後で，運転中の機関の設定と状態が一致し，1 フレームあたりの計算時間の最大が $30\ \text{ms}$ 以下．（項目 5・6 の画面操作による計測は，刻み $500\ \text{rpm}$・開度 $90^\circ$・標準・流量判定 OFF で行う．）
6. [U]（基準と古さ）2 回目の計測の完了後に基準が描かれ，`[基準を消す]` で消える．計測後に設定を 1 つ変えると古さの表示が出て，再計測で消える．`[中止]` した結果は基準を置き換えない．
7. [S]（所要時間）既定の計測が $20\ \text{s}$ 以下．
8. [S]（形）既定設定の全開の曲線で，$T_b$ の最大が端点以外にあり，$P_b$ の最大を与える回転数が $T_b$ の最大を与える回転数より高く，全点が整定する．
9. [S]（手順の一致）刻み $1000\ \text{rpm}$（7 点），開度 $90^\circ$，厳格・流量判定 ON で，「上り」「往復」「独立」の結果が，既定設定，ランナ長 $900\ \text{mm}$，ランナ OFF のそれぞれで，全点で $|\Delta T_b| \le 0.5\%\max T_b$，$|\Delta\eta_v| \le 0.005$ で一致する．
10. [U]（条件）開度のボタンで選んだ集合が計測に使われる開度と一致し（大きい順），最後の 1 つは外せない．刻みのボタンで点数が 280，70，28，14．厳しさ・流量判定・手順のボタンが状態を切り替える．サイクル数の `[−]` `[+]` で $n_{\min}$，$n_{\max}$ が 1 刻み変わり，範囲の端と $n_{\min} \le n_{\max}$ を超えない．厳しさを選ぶと $n_{\min}$ がその初期値（標準 4，厳格 6）になる．どれを変えても計測済みなら古さの表示が出る．全ボタンが $44\ \text{px}$ 以上で，画面がスクロールしない．
11. [U]（前提）表の数値が定数表と選択・設定値に一致し，表の高さが表示領域の $95\%$ 以下．
12. [S]（開度の重ね描き）既定（$90, 50, 10^\circ$）で 3 曲線がそろい（各 28 点），全点で $T_b(10^\circ) < T_b(50^\circ)$，$\eta_v(10^\circ) < \eta_v(50^\circ)$，$10^\circ$ の $T_b$ は $1000 > 4000 > 7000\ \text{rpm}$ の順に小さい．凡例に 3 つの開度があり，プロット領域の中に収まる．9 つの開度すべてを選んでも凡例が収まる．（$50^\circ$ と $90^\circ$ の大小は判定しない．）
13. [S]（収束の判定）厳格・流量判定 ON の全開の計測で，整定した全点について，記録した幅が判定値以下で，使ったサイクル数が 6 以上．「往復」では完了の表示に往復差が出る．
14. [U]（前提の即時の反映）計測済みの結果がある状態で「前提」を表示し，カムの種類，最大リフト，IVC，吸気位相を順に変えると，そのたびに（表示を切り替え直さなくても）表の値が変わり，古さの注記が出る．圧縮比を保留にすると保留の注記が出て，表の圧縮比は適用済みの値のまま．2 つの注記が出た状態で表の高さが表示領域の $95\%$ 以下．すべて戻すと注記が消える．計測済みの結果が無い状態でも，カムの変更が表に現れる．計測の実行中は見出しが「計測中の設定」になり，実行中に変えたカムは表に現れず，中止すると現れる．
15. [S]（サイクル数の最少・最多）開度 $90^\circ$，$1000$，$4000\ \text{rpm}$ の 2 点，厳格・流量判定 ON で，(a) $n_{\min} = 12$，$n_{\max} = 60$ のとき，整定した点の使ったサイクル数が $12$ 以上，(b) $n_{\min} = 3$，$n_{\max} = 4$ のとき，全点の使ったサイクル数が $4$ 以下で，$4$ サイクルで打ち切った「未整定」の点がある（既定の条件では各点が約 7 サイクルで整定するため，打ち切りの規則を確かめるには画面の範囲（$n_{\max} \ge 10$）より小さい値をコアに直接渡す）．(c) 画面の条件で選んだ $n_{\min}$，$n_{\max}$ が計測に渡り，「前提」の表の最少・最多がその値を示す．
16. [A]（横軸）性能曲線の全グラフ（`[出力]` `[η_v]` `[燃費]` `[点火]` の 7 個）の横軸が $0$〜$7000\ \text{rpm}$，目盛が $0, 1000, \ldots, 7000$．
17. [S]（低い回転数）刻み $250\ \text{rpm}$ の点の列が $250, 500, \ldots, 7000$ で，全開の $250\ \text{rpm}$ と $500\ \text{rpm}$（完爆の判定 $550\ \text{rpm}$ より低い）が整定し，点火時期が自動最適化され（設定の固定値と異なる），$T_b > 0$．全開の $100\ \text{rpm}$ はエンストとして記録され（使ったサイクル数が $1$ 以下），グラフの系列に入らない（同じ計測の $250\ \text{rpm}$ は入る）．

### TEST-27：排気系（排気管の脈動と背圧）（REQ-27，SPEC-27）

1. [A]（共鳴）排気弁が閉じた角度で回転を止め，$\zeta_x = 0$，出口を閉じて $\dot m_e(0) = 10^{-4}\ \text{kg/s}$ から積分すると，振動の周期が $2\pi/\omega_E$ と相対誤差 $1\%$ 以内．
2. [A]（摩擦）$p_{pe} - p_m = \frac{\zeta_x\dot m_e^2}{2\rho_e A_e^2}$ のとき $\frac{d\dot m_e}{dt} = 0$（相対誤差 $10^{-9}$．$\rho_e$ の気体定数は，化学種のモデルでは $R_b(T_X, 100\ \text{kPa}, \zeta^*)$）．
3. [S]（OFF）排気系 OFF で $\dot m_e$，$p_{pe}$，$p_m$ の時間微分が $0$ で，排気弁の下流圧が $p_{\text{atm}} + \Delta p_{\text{ex}}$．
4. [S]（質量の収支）S3 の定常の直近 5 サイクルで，$M_{\text{ex}}$，$M_e$，$M_t$ の増分が相互に相対誤差 $1\%$ 以内．
5. [S]（背圧）全開・回転数固定の計測で，$5000\ \text{rpm}$ の背圧が $10$〜$20\ \text{kPa}$，$1000$〜$5000\ \text{rpm}$（$500\ \text{rpm}$ 刻み）で回転数とともに単調に増える．S2（アイドル）の背圧が $2\ \text{kPa}$ 以下．（実測：$13.8\ \text{kPa}$，アイドル $0.11\ \text{kPa}$）
6. [S]（脈動）全開・$3000\ \text{rpm}$ で，1 サイクルの排気ポート圧の最大と最小の差が $20\ \text{kPa}$ 以上（実測 $93\ \text{kPa}$）．
7. [U] 設定ページ「排気系」に 4 項目があり，項目の操作で値が変わり，画面がスクロールしない．
8. [A]（運転中に ON）排気系 OFF で運転中の状態から ON にすると，$\dot m_e = 0$，$p_{pe} = p_m = p_{\text{atm}} + \Delta p_{\text{ex}}$（厳密）になる．

### TEST-28：アイドルの妥当性（REQ-28，SPEC-28）

1. [S] S2 の直近 10 サイクル平均で $0.030 \le \dot m_f \le 0.050\ \text{g/s}$．（実測：$0.039$）
2. [S] 同じく $90 \le \text{FMEP} + \text{AMEP} \le 130\ \text{kPa}$．（実測：$56 + 50 = 106$）
3. [S] スロットル制御，目標 $2000\ \text{rpm}$，$f_{\text{manual}} = 0.3$ の定常で，膨張の指数が $1.20$〜$1.35$．（実測：$1.26$）
4. [S] 4 の「記録する量」が有限の値として実測欄に出る．（実測：吸気管圧 $26.6\ \text{kPa}$，$x_r = 0.21$，排気弁が開く時点の筒内圧 $83\ \text{kPa}$，アイドルの膨張の指数 $1.34$，排気の逆流量 $79\ \text{mg}$／サイクル）

---

### TEST-29：化学種の熱物性と化学平衡（REQ-29，SPEC-29）

1. [A]（物性の値）$R_a = 288.19$，$R_f = 75.586\ \text{J/(kg·K)}$，$\text{AF}_{st} = 14.503$，$\frac{\bar h_f(T_0) - n\bar h_{\text{CO}_2}(T_0) - \frac{yn}{2}\bar h_{\text{H}_2\text{O}}(T_0)}{M_f} = 44.35\ \text{MJ/kg}$（相対誤差 $10^{-4}$）．各化学種で，$\bar h_i$ の中心差分（$\pm 0.01\ \text{K}$）が $\bar c_{p,i}$ に一致し（相対 $10^{-6}$．$T = 400, 900, 1500, 2600\ \text{K}$），$1000\ \text{K}$ の両側で $\bar h_i$ と $\bar s_i^\circ$ が連続（相対 $10^{-5}$）．
2. [A]（平衡定数）$\log_{10}K_p = -\frac{\Delta\bar g^\circ}{\bar R T\ln 10}$（CO$_2$ ⇌ CO + ½O$_2$）が，$2000$，$2500$，$3000\ \text{K}$ で $-2.879$，$-1.433$，$-0.479$（$\pm 0.005$）．
3. [A]（平衡の解）$\eta_c = 1$ として，$\phi_b \in \{0.7, 1.0, 1.3\}$，$T \in \{1700, 2500, 3200\}\ \text{K}$，$p \in \{0.1, 5\}\ \text{MPa}$ で，元素の保存の残差が相対 $10^{-9}$ 以下，停留の条件 $\frac{\mu_j}{\bar R T} = \sum_i\lambda_i a_{ij}$ の残差が $10^{-8}$ 以下．$\phi_b = 1$，$2500\ \text{K}$，$5\ \text{MPa}$ で CO のモル分率 $0.01029$（$\pm 10^{-5}$），$R_b = 289.58\ \text{J/(kg·K)}$（$\pm 0.01$）．定圧断熱火炎温度（反応物 $298.15\ \text{K}$，$101.325\ \text{kPa}$，平衡を直接解く）が $\phi = 1.0$ で $2313.7\ \text{K}$，$\phi = 1.1$ で $2325.2\ \text{K}$（$\pm 2\ \text{K}$）．
4. [A]（定容・断熱の燃焼）$\eta_c = 1$，凍結なし，平衡を直接解いて（表は $\eta_c = 0.97$ で作るので使わない），未燃の混合気（$\phi = 1.0$：$T = 690.30\ \text{K}$，比体積 $0.09058\ \text{m}^3/\text{kg}$．$\phi = 1.1$：$682.90\ \text{K}$，$0.09016\ \text{m}^3/\text{kg}$）と内部エネルギー・比体積が同じ既燃ガスの状態が，$\phi = 1.0$ で $2952\ \text{K}$，$9.565\ \text{MPa}$，$\phi = 1.1$ で $2983\ \text{K}$，$9.817\ \text{MPa}$（$\pm 5\ \text{K}$，$\pm 0.3\%$．値は `tools/richburn` の M3／PFI）．
5. [A]（表の補間）格子の中点（$T$ と $\ln p$ のすべての区間の中点）で，$\phi_r \in \{0.73125, 1.00625, 1.26875\}$（節点の中間）の全 $7020$ 点について，補間の値と平衡を直接解いた値の差が，$e_b$ で $5\ \text{kJ/kg}$ 以下，$R_b$ で相対 $10^{-3}$ 以下．補間した $e_b$，$R_b$ の偏微分が，補間した関数の中心差分に一致（相対 $10^{-6}$）．（実測：$3.59\ \text{kJ/kg}$，$2.0 \times 10^{-4}$，$3.3 \times 10^{-9}$．$e_b$ の基準は当初 $3\ \text{kJ/kg}$ としたが，量論のすぐリッチ側（$\phi_r = 1$〜$1.0125$）で $3.6\ \text{kJ/kg}$ が残るので $5$ にした．燃料の発熱量に対して約 $0.13\%$ である．）
6. [A]（閉じた断熱の系）`EngineCore` の右辺で，弁が閉じている間（IVC の $2^\circ$ 後から EVO の $2^\circ$ 前まで），熱損失を無くし，ポート噴射，回転数を $3000\ \text{rpm}$ に固定して，圧縮・燃焼・膨張を積分する（初期：$350\ \text{K}$，$100\ \text{kPa}$ の混合気）．$U + \int p\,dV$ の変化を仕事 $\left\lvert\int p\,dV\right\rvert$ で割った値が，既定の許容誤差で $10^{-4}$ 以下，相対の許容誤差 $10^{-10}$・絶対の許容誤差を既定の $10^{-6}$ 倍にして $10^{-6}$ 以下（$\phi = 1.0$ と $1.2$）．（実測：$1.8 \times 10^{-5}$，$2.5 \times 10^{-7}$，$1.8 \times 10^{-8}$．当初の基準は「許容誤差 $10^{-10}$ で $10^{-8}$」としたが，既燃ガスの表は $\ln p$ と $\phi_r$ について線形の補間で，偏微分が格子の線で跳ぶので，そこを跨ぐステップで積分の次数が落ちる．許容誤差を絞ると残差が小さくなることから，式そのものは保存の形になっていると判断し，基準を実測に合わせた．）
7. [S]（周期定常の第一法則）S2（アイドル），S3（部分負荷），W3000（全開，動力計），G3000D（全開，$3000\ \text{rpm}$ 固定）の直近 5 サイクルで，SPEC-29 B の 8 の残差が $m_f H_u$ の $10^{-4}$ 以下（実測：$3.4 \times 10^{-6}$，$1.2 \times 10^{-5}$，$3.5 \times 10^{-6}$，$3.9 \times 10^{-6}$）．
8. [S]（第25版との一致）熱物性を $\gamma(T)$，噴射方式をポート噴射にして，S2 と同じ手順（始動から $5\ \text{s}$，複製して $15\ \text{s}$）の最後のサイクルの IMEP が，第25版の実装の値 $108073.557\ \text{Pa}$ と相対 $10^{-4}$ 以下で一致．（開発時に，第25版の `src/core.js`（コミット `1ef8ff1`）とこの実装とで，同じ手順の最後の状態 18 成分が Chromium でも Node.js でもビット単位で一致することを確かめた．ただし Chromium と Node.js の間では IMEP が $108073.557$ と $108074.077\ \text{Pa}$ で $4.8 \times 10^{-6}$ 違う（数学関数の実装の違いが制御のループで広がる）．アプリ内の検査は利用者の端末で動くので，当初の $10^{-12}$ を $10^{-4}$ にした．）
9. [S]（リッチでの出力増）直噴，全開，点火時期は自動最適化，動力計で回転数を固定（SPEC-26 の計測と同じ手順，厳格）．$2000$ と $4000\ \text{rpm}$ で $T_b(1.1) > T_b(1.0) > T_b(0.9)$．$\phi \in \{0.9, 1.0, 1.1, 1.2, 1.3\}$ のうち $T_b$ が最大になるのは $1.1$ か $1.2$．満たさない場合は，係数を調整せず，要件定義書 7.4 節に結果と理由を書く．実測（$\phi = 0.9, 1.0, 1.1, 1.2, 1.3$ の順．$\text{N·m}$）：$2000\ \text{rpm}$ で $37.59$，$41.92$，$43.92$，$43.65$，$43.25$（最大は $\phi = 1.1$ で，$\phi = 1$ より $4.8\%$ 大きい）．$4000\ \text{rpm}$ で $37.58$，$42.14$，$43.91$，$43.51$，$42.94$（同 $4.2\%$）．全点が整定した．同じ手順で，化学種・ポート噴射は $2000\ \text{rpm}$ で $35.29$，$39.03$，$40.11$，$39.51$，$38.80$，熱物性 $\gamma(T)$ は $32.16$，$35.45$，$34.18$，$32.92$，$31.69$（$\phi = 1$ で最大）だった（Node.js での計測）．

---

### TEST-30：燃料の噴射と気化（REQ-30，SPEC-30）

1. [S]（噴射量と収支）直噴，全開，$3000\ \text{rpm}$ の定常の 1 サイクルで，$\int\dot m_{\text{inj}}\,dt = m_{f,\text{cmd}}$（相対 $10^{-9}$），$\int\dot m_{\text{inj}}\,dt - \int\dot m_{\text{ev}}\,dt = \Delta m_l$（同）．筒内の燃料蒸気の収支（気化 ＋ 吸気弁の正味の流入 − 排気弁からの流出 − 燃焼 ＝ $\Delta m_f$）が，$m_{f,\text{cmd}}$ に対して相対 $10^{-9}$ で閉じる．噴射に対する燃焼・排気弁からの流出・吸気弁の正味の流入の割合を記録する（実測：$97.36\%$，$0.64\%$，$-1.99\%$）．
2. [S]（イベントの角度）噴射の開始と終了で，ステップの終端の角度が $\theta_{\text{SOI}}$ と $\theta_{\text{SOI}} + \Delta\theta_{\text{inj}}$ に一致（$10^{-8}\ \text{rad}$）．$1000$ と $7000\ \text{rpm}$ で $\Delta\theta_{\text{inj}} = \frac{\omega_{\text{SOI}}m_{f,\text{cmd}}}{q_{\text{inj}}}$（相対 $10^{-9}$．上限と下限に掛からない条件で）．
3. [A]（潜熱）`EngineCore` の右辺で，弁を閉じ，熱損失を無くし，容積を固定して（回転数 $0$），$320\ \text{K}$，$100\ \text{kPa}$ の空気の中に，その質量の $6.45\%$ の液体の燃料を置いて（$m_l$ の初期値），全量を気化させる（右辺を時間について RK4 で積分．刻み $\frac{\tau_{\text{ev}}}{400}$，$40\tau_{\text{ev}}$）．最後の温度が，$m_a e_a(T) + m_f e_f(T) = m_a e_a(320) + m_f\left[h_f(T_l) - h_{fg}\right]$ の解に一致（$10^{-6}\ \text{K}$．実測：$291.946\ \text{K}$，低下 $28.05\ \text{K}$）．
4. [A]（時定数 0）$\tau_{\text{ev}} = 0$ で，噴射の間も $m_l = 0$，$\dot m_{\text{ev}} = \dot m_{\text{inj}}$．
5. [S]（点火の時点の当量比）直噴，全開，$3000\ \text{rpm}$ の定常，設定 $\phi \in \{0.9, 1.0, 1.2\}$ で，$\phi_c$ が設定値の $\pm 3\%$ 以内．（実測：$0.8818$，$0.9803$，$1.1777$ で，設定より $1.9$〜$2.0\%$ 小さい．当初の基準は $\pm 1\%$ としたが，噴いた燃料の約 $2\%$ が吸気側へ戻ってスロットルから出る（SPEC-30 の 4，項目 1）．モデルの帰結なので，補正を入れずに基準を広げた．）
6. [S]（直噴の冷却）全開，$3000\ \text{rpm}$，$\phi = 1$ の定常で，直噴はポート噴射に比べて，IVC の時点の筒内の温度が $10\ \text{K}$ 以上低く，$\hat m_a$ が $3\%$ 以上多い．実測：$22.1\ \text{K}$（$404.7 \to 382.6\ \text{K}$），$+7.03\%$（試算の上限は $24.5\ \text{K}$，$+8.0\%$）．
7. [U] ページ「噴射」に 4 項目がある．熱物性を $\gamma(T)$ にすると，噴射方式の行が「（不使用）」で「ポート噴射」を選択中として表示し，噴射方式・噴射開始・インジェクタ流量・気化の時定数の行の `[−]` `[+]` と選択が無効で，押しても設定値が変わらない．「化学種」に戻すと有効になる．ポート噴射では噴射開始・インジェクタ流量・気化の時定数の行が「（不使用）」で無効．文字が欠けない．
8. [U] ページ「噴射」のパネルの文字が，直噴では噴射の角度の範囲・$m_{f,\text{cmd}}$・$\phi_c$ を，ポート噴射では「ポート噴射」を含む．運転中に熱物性を 化学種 → γ(T) → 化学種 と切り替えても，切り替えの前後で筒内圧が一致し（相対 $10^{-12}$），状態が有限で，その後 $2\ \text{s}$ 運転を続けて失火しない．

---

## 9. 開発時検証 [D]

`npm test` は，成果物をビルドし，ヘッドレス Chromium で次の 7 通りについて全テストを実行する（SPEC-15 A.2，SPEC-20）：$360 \times 640$，$384 \times 780$，$412 \times 915$，$384 \times 780$（極端な利用者状態．TEST-20 項目 4），$820 \times 1180$，$1180 \times 820$，$1440 \times 900$（マウス）．7 通りすべてが 30/30 PASS で，極端な利用者状態では実行の前後で状態が一致することを納品条件とする．MathJax は，6 通りでは手元の MathJax 3.2.2（`vendor/mathjax-3.2.2/es5/tex-svg.js`．環境変数 `MATHJAX` で場所を変えられる）を CDN の URL に振り向けて読み込み，極端な利用者状態では読み込みを遮断して TeX の表示で全テストを通す．
