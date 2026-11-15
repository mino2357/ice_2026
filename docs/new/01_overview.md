# 単気筒4ストロークSI機関 数値計算・制御・可視化システム 要件定義書（第25版）

## 1. システム概要

* **目的**：単気筒4ストローク火花点火機関を，連立常微分方程式として数値積分し，ブラウザ上で実時間に可視化・解析する．扱うのは，0次元・単一ゾーンの開いた系の熱力学，等エントロピーのオリフィス流れによるガス交換，スロットル・吸気マニホールド・吸気ランナ・排気系の充填と慣性，スライダ・クランク機構とフライホイールの回転運動，水ブレーキ式動力計，ECU（始動，スロットル開度の PI 制御，点火時期の自動最適化）である．
* **配信形態**：外部ライブラリに依存しない単一 HTML ファイル（JavaScript，Canvas 2D，CSS）．スマートフォン（Android 版 Google Chrome，Samsung Galaxy S26+ を主対象，幅 $360\ \text{px}$ 以上）のタッチ操作だけで全機能を使える．タブレットと PC にも対応する（REQ-15）．
* **品質保証**：全要件（REQ-01〜28）に対応するテスト（TEST-01〜28）を定め，自動化できる項目はアプリ内に実装して「検証」タブから実行できる（REQ-20）．
* **対象外**：三元触媒，排気の熱管理，ノッキング，燃料の壁面付着と始動増量，1次元の圧力波，多気筒．

### 1.1 受入基準
* REQ-20 の納品条件（アプリ内テスト [A][S][U] と開発時検証 [D] が全 PASS）を満たし，6節の実機目視チェックリスト [M] に不合格が無いこと．
* 次は受入対象外とする（実装してもよいが，テストと納品条件に含めない）：スマートフォンの横持ち（高さ $500\ \text{px}$ 未満），グラフのピンチズーム・パン，フレーム落ち時の描画の簡略化，Screen Wake Lock，`prefers-reduced-motion`，キーボード操作．

### 1.2 アーキテクチャ
1. 物理モデル・ECU・動力計・ソルバは，DOM にもグローバル変数にも依存しない `EngineCore`（生成できるオブジェクト）にまとめ，運転用とテスト用に別々のインスタンスを作れる（REQ-20）．
2. 設定項目は1つの**項目定義表**（キー，表示名，単位，単位係数，下限，上限，刻み，既定値，分類，選択肢）で定義し，設定画面・解説タブ §0・テストがこの表を参照する（REQ-18）．
3. グラフは「レイアウト計算」と「描画」を分け，機関断面図は「場面記述」と「描画」を分ける（REQ-17，REQ-19 のテストのため）．
4. エンジン音の合成器は DOM に依存しない `Synth` とし，AudioWorklet・代替経路・テストが同じクラスを使う（REQ-21）．

### 1.3 この文書の規則
1. **本文（1〜6節）は現行の仕様だけを書く**．変更の経緯は 7 節に書く．第24版までの本文と改訂記録は `docs/history/requirements_v24.md` に残す．
2. 要件は，対応するテスト項目で合否を判定できる形で書く．自動で判定できないものは 6節のチェックリストに載せる．どちらにも無い事項は要件ではない．
3. テスト項目の実行区分は REQ-20 の定義による：[A] 解析（数式・関数の単体），[S] シナリオ（`EngineCore` を走らせる），[U] 画面（DOM と操作），[D] 開発時（ヘッドレスブラウザ），[M] 実機目視．
4. 判定値のうち，実装後の実測に余裕を持たせて決めたものは「（実測 …）」と添える．文献で確かめていない値は「推定」「未確認」と書く．
5. **表記**：句読点は「，」「．」．計算の内部は SI．圧力は Pa 系（$\text{Pa}$，$\text{kPa}$，$\text{MPa}$）で表し，$\text{bar}$ は使わない．画面の圧力の既定は $\text{kPa}$．角度は内部が $\text{rad}$，表示と本文の数値は $^\circ$（クランク角は $^\circ\text{CA}$）．定着した日本語訳の無い術語は英語のまま書く．

---

## 2. 座標系・状態変数・記号

### 2.1 独立変数とクランク角
* $t$：時間 $[\text{s}]$．
* $\theta \in [0, 4\pi)$：1サイクル（$720^\circ\text{CA}$）内のクランク角 $[\text{rad}]$．サイクルの終端（$\theta = 4\pi$）で $4\pi$ を引く（REQ-13）．
  * $\theta = 0$：吸気上死点（ガス交換の上死点）
  * $\theta = \pi$（$180^\circ$）：吸気下死点
  * $\theta = 2\pi$（$360^\circ$）：圧縮上死点
  * $\theta = 3\pi$（$540^\circ$）：膨張下死点
* 角度の剰余を $\text{md}(a) = a - 4\pi\lfloor a/4\pi \rfloor \in [0, 4\pi)$ と書く．

### 2.2 状態ベクトル $\mathbf{y}(t) \in \mathbb{R}^{16}$
$\frac{d\mathbf{y}}{dt} = \mathbf{f}(\mathbf{y}; \mathbf{u})$ を時間積分する．$\mathbf{u}$ は ECU と動力計が決める入力（スロットル開度 $\alpha$，実効充水率 $f_{\text{eff}}$，点火時期 $s$ など）で，積分の1ステップの間は一定とする（REQ-13）．

| # | 記号 | 意味 | 単位 | 式 |
| ---: | :--- | :--- | :--- | :--- |
| 1 | $\theta$ | クランク角 | rad | REQ-10 |
| 2 | $\omega$ | クランク軸の角速度（回転数 $N = \frac{30}{\pi}\omega$ [rpm]） | rad/s | REQ-10 |
| 3 | $p$ | 筒内圧 | Pa | REQ-09 |
| 4 | $m$ | 筒内ガスの全質量 | kg | REQ-06 |
| 5 | $m_u$ | 筒内の未燃ガス（新気）の質量 | kg | REQ-06 |
| 6 | $T_w$ | シリンダ壁の平均温度 | K | REQ-08 |
| 7 | $p_{\text{in}}$ | 吸気マニホールド圧 | Pa | REQ-05 |
| 8 | $m_{b,\text{in}}$ | 吸気マニホールド内の既燃ガスの質量 | kg | REQ-05 |
| 9 | $\dot m_r$ | 吸気ランナの質量流量（マニホールド → ポートが正） | kg/s | REQ-25 |
| 10 | $p_p$ | 吸気ポート圧 | Pa | REQ-25 |
| 11 | $m_{b,p}$ | 吸気ポート内の既燃ガスの質量 | kg | REQ-25 |
| 12 | $\dot m_e$ | 排気管の質量流量（排気ポート → 消音器が正） | kg/s | REQ-27 |
| 13 | $p_{pe}$ | 排気ポート圧 | Pa | REQ-27 |
| 14 | $p_m$ | 消音器の圧力 | Pa | REQ-27 |
| 15 | $E_{\text{in}}$ | 吸気マニホールドの余剰エンタルピー | J | REQ-05 |
| 16 | $E_p$ | 吸気ポートの余剰エンタルピー | J | REQ-25 |

* 従属変数：筒内ガスの平均温度 $T = \frac{pV(\theta)}{mR}$，既燃ガスの質量 $m_b = m - m_u$，未燃分率 $Y_u = \text{clamp}\left(\frac{m_u}{m}, 0, 1\right)$，残留ガス率（既燃分率）$x_r = 1 - Y_u$．
* 気体定数は未燃・既燃とも $R = 287.0\ \text{J/(kg·K)}$ とする（REQ-02）．
* ランナ OFF（REQ-25）では 9〜11 と 16，排気系 OFF（REQ-27）では 12〜14 の時間微分を $0$ とする．
* **初期値（コールドリセット）**：$\theta = \pi$，$\omega = 0$，$p = p_{\text{in}} = p_p = p_{pe} = p_m = p_{\text{atm}}$，筒内ガスは温度 $320\ \text{K}$ の未燃ガス（$m = m_u = \frac{p_{\text{atm}}V(\pi)}{R \cdot 320}$），$T_w = 298.15\ \text{K}$，そのほかは $0$．IVC の基準状態（REQ-08）の初期値は $(p_{\text{atm}}, V(\pi), 320\ \text{K})$．

### 2.3 補助積分 $\mathbf{z}(t) \in \mathbb{R}^{22}$
サイクルの集計と保存則の検査に使う量を，状態と同じ Runge–Kutta の重みで同時に積分する（REQ-13）．$\mathbf{z}$ は $\mathbf{f}$ に現れず，誤差判定にも含めない．

| 記号 | 被積分関数 | 用途 |
| :--- | :--- | :--- |
| $B_o$，$B_i$ | $\dot m_{\text{in}}^-(1 - Y_u)$，$\dot m_{\text{in}}^+ Y_{b,\text{src}}$ | 吸気弁を出入りする既燃ガス（REQ-05） |
| $W$，$W_g$ | $p\frac{dV}{d\theta}\omega$，同（$\pi \le \theta < 3\pi$ のみ） | 図示仕事（正味，圧縮膨張） |
| $W_f$，$W_a$，$W_d$ | $T_f\omega$，$T_{\text{aux}}\omega$，$T_{\text{dyno}}\omega$ | 摩擦・補機・動力計の仕事 |
| $M_{\text{th}}$，$M_r$，$M_{\text{in}}$，$M_{\text{ex}}$，$M_e$，$M_t$ | $\dot m_{\text{th}}$，$\dot m_r$，$\dot m_{\text{in}}$，$\dot m_{\text{ex}}$，$\dot m_e$，$\dot m_t$ | 各断面を通った質量 |
| $P_m$，$\Upsilon$ | $p_m$（排気系 OFF では排気弁の下流圧），$Y_{b,\text{in}}$ | サイクル平均の背圧と吸気管既燃率 |
| $Q_c$，$Q_w$，$H_i$，$H_o$ | $\dot Q_{\text{comb}}$，$\dot Q_{\text{wall}}$，$\dot H_{\text{in}}^s$，$\dot H_{\text{out}}^s$ | 第一法則の収支（REQ-09） |
| $X_o$，$X_i$，$X_t$ | 吸気弁の逆流が運ぶ余剰エンタルピー，順流で戻る分，スロットルの逆流で出る分 | 余剰エンタルピーの収支（REQ-05） |

ここで $\dot m^+ = \max(0, \dot m)$，$\dot m^- = \max(0, -\dot m)$．ランナ OFF では $M_r$ に $\dot m_{\text{in}}$，排気系 OFF では $M_e$ に $\dot m_{\text{ex}}$ を積分する．

---

## 3. 機能要件と対応テスト

### REQ-01：スライダ・クランク運動学
ボア $B$，ストローク $S$，クランク半径 $r = S/2$，連桿長 $l$，連桿比 $\lambda = r/l$，圧縮比 $\varepsilon$ から，行程容積 $V_d$，隙間容積 $V_c$，上死点からのピストン変位 $x(\theta)$，筒内容積 $V(\theta)$，$\frac{dV}{d\theta}$，伝熱面積 $A_w(\theta)$ を求めること．

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
* **対応テスト `TEST-01`**：
  1. [A] $V(0) = V_c$，$V(\pi) = V_c + V_d$，$V(\pi)/V(0) = \varepsilon$（相対誤差 $10^{-12}$）．
  2. [A] $\theta \in \{0.3, 1.1, 2.5, 4.2\}\ \text{rad}$ で，解析的な $\frac{dV}{d\theta}$ と中心差分（$h = 10^{-5}\ \text{rad}$）の相対誤差が $10^{-9}$ 未満．
  3. [A] 設定範囲の端点の組合せすべてで，項目 1・2 が成り立ち，$V(\theta) > 0$，$x(\theta) \in [0, S]$．$\lambda > 0.5$ の組合せは適用できない（REQ-18）．

---

### REQ-02：作動流体の熱物性（未燃・既燃の比熱）
筒内ガスを理想気体（$pV = mRT$）とし，比熱を**未燃ガス（新気の混合気）と既燃ガスで分け**，未燃分率で補間すること．内部エネルギーとエンタルピーは比熱の積分で与え，REQ-09 のエネルギーの式と整合させること．比較用に定比熱比のモデルへ切り替えられること．

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

#### 仮定と限界
* 当量比・圧力による $\gamma$ の変化は扱わない（当てはめは量論比．既燃ガスは $1500\ \text{K}$ 以上で圧力にも依存する）．
* 既燃ガスの線形当てはめは，平衡組成の $\gamma$ を $1\%$ 弱の誤差で表す（同論文）．より正確な Krieger–Borman の多項式は，係数を原典で確認できていないため採用していない．
* 単一ゾーンなので，未燃ガスの比熱も筒内の平均温度 $T$ で評価する（実際の未燃部は $1000\ \text{K}$ 程度までにとどまる．$T_{c,u}$ の頭打ちがこれに対応する）．

* **出典**：[M. Klein and L. Eriksson, "A specific heat ratio model for single-zone heat release models"（Linköping 大学，2004．表 1，表 2）](https://www.fs.isy.liu.se/Publications/Articles/CCSSE_04_MK.pdf)
* **対応テスト `TEST-02`**：
  1. [A]（当てはめの値）$\gamma_u(300) = 1.3488$，$\gamma_u(700) = 1.2968$，$\gamma_u(1000) = \gamma_u(1500) = 1.2578$，$\gamma_b(300) = 1.3678$，$\gamma_b(2000) = 1.2080$，$\gamma_b(2700) = \gamma_b(3200) = 1.1422$（絶対誤差 $10^{-12}$）．
  2. [A] $T \in [300, 3000]\ \text{K}$，$Y \in \{0, 0.3, 1\}$ で $c_p - c_v = R$，$c_p/c_v = \gamma(T, Y)$（相対誤差 $10^{-12}$）．$\gamma(T, Y)$ は $\gamma_u(T)$ と $\gamma_b(T)$ の間にあり，$c_v$ は $Y$ について線形（$Y = 0.3$ の値が両端の内分に一致）．
  3. [A]（積分の整合）$T \in \{350, 900, 1500, 2600, 2900\}\ \text{K}$（頭打ちの上下を含む）で，$e_k$ の中心差分（$\pm 0.01\ \text{K}$）が $c_{v,k}(T)$ と相対誤差 $10^{-6}$ で一致する．$e_k(T_0) = 0$．$e_k$ は $T_{c,k}$ で連続（$\pm 10^{-6}\ \text{K}$ の差が $10^{-2}\ \text{J/kg}$ 以下）．
  4. [A] $\gamma_u$，$\gamma_b$ は頭打ちより下で $T$ について単調減少，$c_{v,k}$ は単調増加．
  5. [A]（定比熱比）定比熱比モデルで $\gamma(T, Y) = 1.35$（すべての $T$，$Y$），$e_k(T) = \frac{R}{0.35}(T - T_0)$．

---

### REQ-03：カムプロファイルと弁の有効開口面積
吸気弁と排気弁の開閉時期，最大リフト，弁径から，クランク角ごとのリフトと有効開口面積を求めること．カムプロファイルを 3 種類から選べること．カムの位相を運転中に変えられること（VVT）．弁とピストンの干渉を警告すること．

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
* **数値上の注意**：$A_{\text{eff}}$ は開閉点で折れる（Aggressive では傾きが無限大になる）．開閉点は積分のステップの境界にそろえる（REQ-13）．
* **出典**：Heywood (1988) Ch. 6．
* **対応テスト `TEST-03`**：
  1. [A] 3 種とも $L_v(0) = L_v(1) = 0$，$L_v(0.5) = L_{\max}$（相対誤差 $10^{-12}$），閉弁域で $A_{\text{eff}} = 0$．
  2. [A] $\xi = 0.25$ のリフト比が Aggressive $0.8123$（$= \sin^{0.6}(\pi/4)$），Polynomial $0.5625$，Standard $0.5$（相対誤差 $10^{-4}$，$10^{-12}$，$10^{-12}$）．
  3. [A]（滑らかさ）Standard と Polynomial は $L_v(10^{-4})/L_{\max} \le 10^{-6}$（端の傾きが $0$），Aggressive は $L_v(10^{-4})/L_{\max} \ge 10^{-3}$．
  4. [A]（弁径）$d_v = 38\ \text{mm}$，$B = 86\ \text{mm}$ で $d_{v,\text{in}} = 38\ \text{mm}$，$d_{v,\text{ex}} = 35.625\ \text{mm}$．$d_v = 50\ \text{mm}$ で $d_{v,\text{in}} = 38.7\ \text{mm}$（$0.45B$）．
  5. [A]（VVT）$\varphi \in \{-40, -15, 0, 15, 40\}^\circ$ で $L_v(\theta; \varphi) = L_v(\theta - \varphi; 0)$ が全周 $1^\circ$ 刻みで成り立ち（相対誤差 $10^{-12}$），作用角と $\int L_v\,d\theta$ が $\varphi$ によらない．
  6. [A]（干渉）既定設定では `VALVE HIT` が出ない．$\varepsilon = 40$，$L_{\max} = 14\ \text{mm}$，$\varphi_{\text{in}} = -40^\circ$ では出る．判定が定義式の直接の評価と一致する．
  7. [S] S8（S4 の定常から $\varphi_{\text{in}} = 30^\circ$，$5\ \text{s}$）：状態量が有限で，$\eta_v$ が $1\%$ 以上変わる．

---

### REQ-04：オリフィスの圧縮性流れ（順流・逆流・チョーク）
弁，スロットル，テールパイプ出口を通る質量流量を，等エントロピー流れのオリフィスの式で求めること．チョークと逆流を扱うこと．

#### 定義と式
上流（高圧側）のよどみ圧 $p_0 = \max(p_1, p_2)$，よどみ温度 $T_0$，比熱比 $\gamma_0$，下流の静圧 $p_d = \min(p_1, p_2)$，圧力比 $r_p = p_d/p_0 \in (0, 1]$ とする．エネルギーの式 $c_p T_0 = c_p T + \frac{u^2}{2}$ と等エントロピーの関係 $\frac{T}{T_0} = r_p^{(\gamma_0 - 1)/\gamma_0}$，$\rho = \frac{p_0}{RT_0}r_p^{1/\gamma_0}$ から，のど部の質量流束は
$$\rho u = \frac{p_0}{\sqrt{RT_0}}\,\Psi_{\text{sub}}(r_p), \qquad \Psi_{\text{sub}}(r_p) = r_p^{1/\gamma_0}\sqrt{\frac{2\gamma_0}{\gamma_0 - 1}\left(1 - r_p^{(\gamma_0 - 1)/\gamma_0}\right)}$$
$\frac{\partial(\rho u)}{\partial r_p} = 0$ から，流速が音速に達する臨界圧力比は $r_{\text{crit}} = \left(\frac{2}{\gamma_0 + 1}\right)^{\gamma_0/(\gamma_0 - 1)}$．$r_p \le r_{\text{crit}}$ では流量が飽和する（チョーク）．

$r_p \to 1$ では $\frac{d\Psi_{\text{sub}}}{dr_p} \to -\infty$ となり，右辺が Lipschitz 連続でなくなる．これを避けるため，$1 - r_p < \delta_r = 10^{-3}$ では原点を通る直線に置き換える：
$$\Psi(r_p) = \begin{cases} \sqrt{\gamma_0\left(\frac{2}{\gamma_0 + 1}\right)^{(\gamma_0 + 1)/(\gamma_0 - 1)}} & (r_p \le r_{\text{crit}}) \\[4pt] \Psi_{\text{sub}}(r_p) & (r_{\text{crit}} < r_p \le 1 - \delta_r) \\[4pt] \dfrac{1 - r_p}{\delta_r}\,\Psi_{\text{sub}}(1 - \delta_r) & (1 - \delta_r < r_p \le 1) \end{cases}$$
$r_p = 1 - \delta_r$ で値は連続だが，**傾きは連続でない**（$C^0$．直線の傾きは $\Psi_{\text{sub}}$ の傾きの約 2 倍）．直線部の傾き $\Psi_{\text{sub}}(1 - \delta_r)/\delta_r \approx \sqrt{2/\delta_r} = 44.7$ が系の硬さを決める（REQ-13）．

質量流量は，有効面積 $A$ に対し
$$\dot m = \text{sgn}(p_1 - p_2)\,\frac{A\,p_0}{\sqrt{RT_0}}\,\Psi(r_p)$$
$T_0$ と $\gamma_0$ は上流側のガスの値を使う（下表）．$\gamma_0 = \gamma(T_0, Y)$ は REQ-02 の混合の式による．

| 流れ | $p_1$，$p_2$ | 正の向き | 順流の上流（$T_0$，組成） | 逆流の上流（$T_0$，組成） |
| :--- | :--- | :--- | :--- | :--- |
| スロットル $\dot m_{\text{th}}$ | $p_{\text{atm}}$，$p_{\text{in}}$ | マニホールドへ | $T_{\text{amb}}$，未燃 | マニホールドのガス（REQ-05） |
| 吸気弁 $\dot m_{\text{in}}$ | $p_p$（ランナ OFF では $p_{\text{in}}$），$p$ | 筒内へ | ポートのガス（REQ-05） | 筒内（$T$，$Y_u$） |
| 排気弁 $\dot m_{\text{ex}}$ | $p$，$p_{pe}$（排気系 OFF では $p_{\text{atm}} + \Delta p_{\text{ex}}$） | 筒内から外へ | 筒内（$T$，$Y_u$） | $T_X$，既燃 |
| テールパイプ $\dot m_t$ | $p_m$，$p_{\text{atm}}$ | 大気へ | $T_X$，既燃 | $T_{\text{amb}}$，未燃 |

* **出典**：Heywood (1988) Appendix C．
* **対応テスト `TEST-04`**：
  1. [A] $p_1 = p_2$ で厳密に $\dot m = 0$．$(p_1, p_2)$ を入れ替えると，同じ上流温度・比熱比のもとで絶対値が等しく符号が反転する．
  2. [A] $\gamma_0 = 1.4$ で $r_{\text{crit}} = 0.5282817877$（相対誤差 $10^{-9}$），$r_p = 0.50$ と $0.25$ で $\Psi = 0.68473145$（相対誤差 $10^{-7}$，両者は完全に一致）．$\gamma_0 = 1.3$ で $r_{\text{crit}} = \left(\frac{2}{2.3}\right)^{1.3/0.3}$，$\Psi_{\max} = \sqrt{1.3\left(\frac{2}{2.3}\right)^{2.3/0.3}}$（相対誤差 $10^{-12}$）．
  3. [A]（正則化）$r_p = 1 - \delta_r$ の両側で値が一致（相対誤差 $10^{-9}$），$\Psi(1) = 0$，$r_p = 1 - \delta_r/2$ で $\Psi = \frac{1}{2}\Psi_{\text{sub}}(1 - \delta_r)$，$(r_{\text{crit}}, 1]$ で $\Psi$ が単調減少．
