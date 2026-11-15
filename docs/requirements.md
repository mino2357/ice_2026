# 単気筒4ストロークSI機関 数値計算・制御・可視化システム 要件定義書

## 1. システム概要とアーキテクチャ要件

* **目的**：単気筒4ストローク火花点火機関（Spark-Ignition Engine）の0次元Single-Zone開サイクル熱力学，1次元等エントロピー圧縮性オリフィス流れによるガス交換，スロットルバルブと吸気マニホールドの充填・排出ダイナミクス，スライダ・クランク機構とフライホイール慣性を連成したクランク軸回転運動，水ブレーキ式エンジンダイナモメータによる負荷，およびECU制御（スターター始動・スロットル開度PI制御）を連立常微分方程式（ODE）として数値積分し，ブラウザ上でリアルタイムに可視化・解析する．
* **配信形態**：外部ライブラリに一切依存しない単一HTMLファイル（Vanilla JavaScript ES6+, HTML5 Canvas 2D, CSS3）．PC（マウス・キーボード）に加え，スマートフォン（**Android版 Google Chrome／Samsung Galaxy S26+ を主対象端末として想定**，画面幅360 px以上）のタッチ操作のみで全機能を操作できるレスポンシブUIとする（詳細はREQ-15）．
* **品質保証（組み込み自動検証スイート）**：全要件（`REQ-01` 〜 `REQ-26`）に対応するテスト（`TEST-01` 〜 `TEST-26`）を定め，自動化できる項目はすべてアプリ内に実装して「検証」タブから実行できること．実行形態・シナリオ・納品条件は REQ-20 に定める．三元触媒・排気熱管理は対象外とする．

### 1.1 本版のスコープと受入基準
* **受入基準**：REQ-20 の納品条件（アプリ内テスト [A][S][U] が全 PASS，開発時検証 [D] が全 PASS）を満たし，6節の実機目視チェックリスト [M] に不合格が無いこと．
* **本版の受入対象外（将来拡張）**：横持ち・PC幅の専用レイアウト，グラフのピンチズーム・パン（廃止），フレーム落ち時の段階的な描画簡略化，Screen Wake Lock，`prefers-reduced-motion` 対応．これらは実装してもよいが，テストと納品条件には含めない．
* **仕様とテストの関係**：本書の要件は，対応するテスト項目で合否を判定できる形で書く．テストで判定できない要件は 6節のチェックリストに載せる．どちらにも載っていない事項は要件ではない．

### 1.2 アーキテクチャ要件
1. 物理モデル・ECU・動力計・ソルバは，DOM にもグローバル変数にも依存しない `EngineCore`（生成可能なオブジェクト）としてまとめ，運転用とテスト用に別々のインスタンスを作れること（REQ-20）．
2. 設定項目は1つの**項目定義表**（キー，表示名，単位，単位係数，下限，上限，刻み，既定値，分類（即時／要リセット），選択肢）で定義し，設定画面・解説タブ §0・テストがすべてこの表を参照する（REQ-18）．
3. グラフは「レイアウト計算（軸・目盛・文字の位置）」と「描画」を分け，機関断面図は「場面記述（幾何）」と「描画」を分ける（REQ-17，REQ-19 のテストのため）．

---

## 2. 座標系・状態変数・記号定義

本システムで用いる全物理量と単位系（計算内部はすべてSI基本単位系で統一し，UI表示のみ実用単位を併記．**圧力は Pa 系の単位（$\text{Pa}$，$\text{kPa}$，$\text{MPa}$）で表し，$\text{bar}$ は使用しない**（第13版で変更．旧版は「kPa で統一し bar・MPa は使用しない」としていた．利用者の指示「Pa を使えばよく，bar を禁止するのみ」による）．UI の圧力表示の既定は $\text{kPa}$ とする．式中の圧力記号の単位 $[\text{Pa}]$ は内部計算用のSI単位であり，数値を kPa で記すときは $1\ \text{kPa} = 1000\ \text{Pa}$ で換算する）を以下に定義する．

### 2.1 独立変数とクランク角座標系
* $t \in [0, \infty)$：実時間 $[\text{s}]$
* $\theta \in [0, \infty)$：積算クランク角 $[\text{rad}]$
* $\tilde{\theta} = \theta \bmod 4\pi \in [0, 4\pi)$：1サイクル（$720^\circ\ \text{CA}$）内の位相クランク角 $[\text{rad}]$．本仕様では以下の通り基準点を定める：
  * $\tilde{\theta} = 0\ (0^\circ\ \text{CA})$：**吸気上死点（Intake TDC / Gas Exchange TDC）**
  * $\tilde{\theta} = \pi\ (180^\circ\ \text{CA})$：**吸気下死点（Intake BDC）**
  * $\tilde{\theta} = 2\pi\ (360^\circ\ \text{CA})$：**圧縮・燃焼上死点（Compression / Firing TDC）**
  * $\tilde{\theta} = 3\pi\ (540^\circ\ \text{CA})$：**膨張・排気下死点（Expansion BDC）**

### 2.2 基本状態ベクトル $\mathbf{y}(t) \in \mathbb{R}^{11}$
連立常微分方程式系 $\frac{d\mathbf{y}}{dt} = \mathbf{f}(t, \mathbf{y})$ が直接時間積分する11の状態変数を以下のように定義する（第11版で $m_{b,\text{in}}$，第12版で吸気ランナの $\dot m_r, p_p, m_{b,p}$ を追加）：

$$\mathbf{y}(t) = \begin{pmatrix} \theta(t) \\ \omega(t) \\ p(t) \\ m(t) \\ m_u(t) \\ T_w(t) \\ p_{\text{in}}(t) \\ m_{b,\text{in}}(t) \\ \dot m_r(t) \\ p_p(t) \\ m_{b,p}(t) \end{pmatrix}$$

1. $\theta$：積算クランク角 $[\text{rad}]$
2. $\omega = \frac{d\theta}{dt}$：クランク軸角速度 $[\text{rad/s}]$（機関回転数 $N = \frac{30}{\pi}\omega$ $[\text{rpm}]$）
3. $p$：筒内ガス圧力 $[\text{Pa}]$
4. $m$：筒内ガス総質量 $[\text{kg}]$
5. $m_u$：筒内未燃新気（Unburned Fresh Charge）質量 $[\text{kg}]$．既燃（残留）ガス質量は $m_b = m - m_u$ $[\text{kg}]$，未燃ガス質量分率は $Y_u = \frac{m_u}{m} \in [0, 1]$，残留ガス質量分率は $x_r = 1 - Y_u \in [0, 1]$ で定義される．
6. $T_w$：シリンダ壁面平均温度 $[\text{K}]$
7. $p_{\text{in}}$：吸気マニホールド圧力 $[\text{Pa}]$（REQ-05．スロットル開度 $\alpha$ は制御入力であり状態変数ではない）
8. $m_{b,\text{in}}$：吸気マニホールド内の既燃ガス質量 $[\text{kg}]$（REQ-05，第11版）．管内ガス質量を $m_{\text{in}} = \frac{p_{\text{in}} V_{\text{in}}}{R T_{\text{in}}}$ として，管内の既燃ガス質量分率を $Y_{b,\text{in}} = \text{clamp}\left(\frac{m_{b,\text{in}}}{m_{\text{in}}}, 0, 1\right)$ と定義する．初期値は $m_{b,\text{in}}(0) = 0$（コールドリセットでも $0$ に戻す）．

9. $\dot m_r$：吸気ランナ内の質量流量 $[\text{kg/s}]$（REQ-25，第12版．マニホールドからポートへ向かう向きを正）
10. $p_p$：吸気ポート（ランナの弁側端）の圧力 $[\text{Pa}]$（REQ-25）
11. $m_{b,p}$：吸気ポート内の既燃ガス質量 $[\text{kg}]$（REQ-25）．ポートのガス質量を $m_p = \frac{p_p V_p}{R T_{\text{in}}}$ として，既燃ガス分率を $Y_{b,p} = \text{clamp}\left(\frac{m_{b,p}}{m_p}, 0, 1\right)$ と定義する．

ランナを OFF にした場合（REQ-25），9〜11 番目の状態は時間変化せず，吸気弁は第11版と同じくマニホールドに直接つながる．

**補助積分（第12版）**：上の11成分のほかに，検証用の積分 $B_o = \int \max(0, -\dot m_{\text{in}})(1 - Y_u)\,dt$（吸気弁から吹き返した既燃ガス）と $B_i = \int \max(0, \dot m_{\text{in}})\,Y_{b,p}\,dt$（吸気弁から戻った既燃ガス）を，同じソルバで同時に積分する（物理状態ではなく，DOPRI5 の誤差判定にも含めない）．吸気側の既燃ガス量 $m_{b,\text{in}} + m_{b,p}$ の時間微分は $\frac{dB_o}{dt} - \frac{dB_i}{dt}$（スロットル逆流の項を除く）と一致するので，Runge–Kutta の各段で恒等式が保たれ，TEST-05 項目7 を丸め誤差の水準で判定できる．

なお，筒内ガス平均温度 $T$ $[\text{K}]$ は理想気体の状態方程式より従属変数として $T = \frac{p V(\theta)}{m R}$ から一意に定まる（ここで $R = 287.0\ \text{J/(kg}\cdot\text{K)}$ は作動ガスの比気体定数）．

---

## 3. 機能要件（数理モデル・UI）および対応テスト仕様

### REQ-01：スライダ・クランク運動学モデル
ボア（シリンダ内径）$B$ $[\text{m}]$，ストローク $S$ $[\text{m}]$，クランク半径 $r = \frac{S}{2}$ $[\text{m}]$，コンロッド長 $l$ $[\text{m}]$，連桿比 $\lambda = \frac{r}{l} < 1$，圧縮比 $\varepsilon > 1$ に対し，行程容積 $V_d$，隙間容積（クリアランス容積）$V_c$，上死点からのピストン変位 $x(\theta)$，瞬時シリンダ容積 $V(\theta)$，クランク角に対する容積変化率 $\frac{dV}{d\theta}$，および瞬時シリンダ内伝熱面積 $A_w(\theta)$ を次式で算出すること．

#### 【数式導出と定義】
ピストンピンオフセットを $0$ とするとき，クランク角 $\theta$ に対するコンロッドの傾き角を $\beta$ とすると，幾何学的拘束条件 $r \sin\theta = l \sin\beta$ より $\cos\beta = \sqrt{1 - \lambda^2 \sin^2\theta}$ が成り立つ．上死点（$\theta = 0$）でのピストン位置 $r + l$ からの変位 $x(\theta)$ は次式で与えられる：

$$x(\theta) = (r + l) - (r \cos\theta + l \cos\beta) = r \left( (1 - \cos\theta) + \frac{1}{\lambda} \left( 1 - \sqrt{1 - \lambda^2 \sin^2\theta} \right) \right)$$

行程容積 $V_d$ と隙間容積 $V_c$ は，最大容積と最小容積の比 $\frac{V_c + V_d}{V_c} = \varepsilon$ より，

$$V_d = \frac{\pi B^2}{4} S, \quad V_c = \frac{V_d}{\varepsilon - 1}$$

したがって瞬時容積 $V(\theta)$ は，

$$V(\theta) = V_c + \frac{\pi B^2}{4} x(\theta)$$

これを $\theta$ で微分すると，合成関数の微分法則 $\frac{d}{d\theta}\sqrt{1 - \lambda^2 \sin^2\theta} = \frac{-\lambda^2 \sin\theta \cos\theta}{\sqrt{1 - \lambda^2 \sin^2\theta}}$ より，

$$\frac{dV}{d\theta} = \frac{\pi B^2}{4} \frac{dx}{d\theta} = \frac{\pi B^2}{4} r \sin\theta \left( 1 + \frac{\lambda \cos\theta}{\sqrt{1 - \lambda^2 \sin^2\theta}} \right)$$

また，ピストン頂面面積を $\frac{\pi B^2}{4}$，シリンダヘッド燃焼室壁面積を $\frac{\pi B^2}{4} + \pi B h_c$（ただし等価クリアランス高さ $h_c = \frac{4 V_c}{\pi B^2}$）とすると，瞬時伝熱面積 $A_w(\theta)$ は次式となる：

$$A_w(\theta) = \frac{\pi B^2}{2} + \pi B \left( x(\theta) + \frac{4 V_c}{\pi B^2} \right)$$

* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Chapter 2, pp. 43-45](https://www.accessengineeringlibrary.com/content/book/9781260116106)
* **対応テスト `TEST-01`（幾何学・微分整合性検証）**：
  1. 上死点（$\theta = 0, 2\pi$）にて $V(0) = V_c$，下死点（$\theta = \pi, 3\pi$）にて $V(\pi) = V_c + V_d$，および容積比 $\frac{V(\pi)}{V(0)} = \varepsilon$ が相対誤差 $10^{-12}$ 以内で成立すること．
  2. 任意のクランク角 $\theta \in \{0.3, 1.1, 2.5, 4.2\}\ \text{rad}$ において，解析的導関数 $\frac{dV}{d\theta}$ と2次中心差分近似 $\frac{V(\theta + h) - V(\theta - h)}{2h}$（$h = 10^{-5}\ \text{rad}$）の相対誤差が $10^{-9}$ 未満であること．
  3. 設定可能範囲（REQ-18：$B, S \in [40, 150]\ \text{mm}$，$l \in [60, 300]\ \text{mm}$，$\lambda \le 0.5$，$\varepsilon \in [1.1, 100]$）の端点の組合せすべてで，項目1・2が成立し，$V(\theta) > 0$ かつ $x(\theta) \in [0, S]$ であること．

* **設定範囲の根拠**：$V_c = V_d/(\varepsilon - 1)$ より $\varepsilon > 1$ が必要十分であり，それ以上の制限は設けない（下限 $1.1$ は数値上の余裕）．$\lambda < 1$ は $\sqrt{1 - \lambda^2\sin^2\theta}$ が実数となる条件で，機構として成立する実用範囲として $\lambda \le 0.5$ を課す．

---

### REQ-02：作動流体の熱物性モデル（定比熱比 vs 温度依存比熱）
作動流体を理想気体（$p V = m R T$）とみなし，以下の2つの比熱モデルをUI上でリアルタイムに切り替え・比較できること．

#### 【数式導出と定義】
1. **定比熱比モデル（Constant $\gamma$）**：
   ユーザー指定の定数比熱比 $\gamma_0 \in [1.25, 1.40]$ に対し，Meyerの関係式 $c_p - c_v = R$ および比熱比定義 $\gamma_0 = \frac{c_p}{c_v}$ を連立して定積比熱 $c_v$ と定圧比熱 $c_p$ を定数として与える：
   $$c_v = \frac{R}{\gamma_0 - 1}, \quad c_p = \frac{\gamma_0 R}{\gamma_0 - 1}$$
2. **温度依存比熱モデル（Variable $\gamma(T)$）**：
   高温時の分子振動励起による比熱増大（比熱比の低下）を再現するため，NASA熱力学多項式をフィッティングした温度 $T$ $[\text{K}]$ の2次近似式を用いる：
   $$\tilde{\gamma}(T) = 1.38 - 6.5 \times 10^{-5} (T - 300) + 1.0 \times 10^{-8} (T - 300)^2$$
   $$\gamma(T) = \min\left( 1.40, \ \max\left( 1.24, \ \tilde{\gamma}(T) \right) \right)$$
   $$c_v(T) = \frac{R}{\gamma(T) - 1}, \quad c_p(T) = c_v(T) + R = \frac{\gamma(T) R}{\gamma(T) - 1}$$

* **出典**：[G. P. Blair, *Design and Simulation of Four-Stroke Engines*, SAE International (1999), Chapter 1](https://www.sae.org/publications/books/content/r-186/) および [M. J. Zucrow and J. D. Hoffman, *Gas Dynamics*, Vol. 1, John Wiley & Sons (1976)](https://books.google.co.jp/books?id=4R9RAAAAMAAJ)
* **対応テスト `TEST-02`（熱物性・Meyerの関係式検証）**：
  1. $T \in [300\ \text{K}, 3000\ \text{K}]$ の全域で $c_p(T) - c_v(T) = R$ および $\frac{c_p(T)}{c_v(T)} = \gamma(T)$ が相対誤差 $10^{-12}$ 以内で成立すること．
  2. 温度依存比熱モデルにおいて，$T_1 = 350\ \text{K}$ と $T_2 = 2500\ \text{K}$ を比較したとき $\gamma(T_2) < \gamma(T_1)$ かつ $c_v(T_2) > c_v(T_1)$ を満たすこと．

---

### REQ-03：吸排気カムプロファイルとバルブ有効開口面積モデル
吸気弁（添字 $\text{in}$）および排気弁（添字 $\text{ex}$）について，開時期 $\theta_{\text{open}}$，閉時期 $\theta_{\text{close}}$，最大リフト $L_{\max}$ $[\text{m}]$，バルブ傘径 $d_v$ $[\text{m}]$，平均流量係数 $C_d$ を個別に設定でき，以下の3種類のカムプロファイル関数 $L_v(\xi)$ を選択できること．

#### 【数式導出と定義】
1サイクル周期 $4\pi$ を考慮した開弁期間角を $\Delta\theta_{\text{cam}} = (\theta_{\text{close}} - \theta_{\text{open}}) \bmod 4\pi$ とし，現在のクランク角 $\tilde{\theta}$ の開弁開始からの経過角を $\delta\theta = (\tilde{\theta} - \theta_{\text{open}}) \bmod 4\pi$ とする．$\delta\theta \in [0, \Delta\theta_{\text{cam}}]$ のときバルブは開弁状態にあり，正規化カム位相 $\xi = \frac{\delta\theta}{\Delta\theta_{\text{cam}}} \in [0, 1]$ に対するリフト量 $L_v(\xi)$ を以下の3式で定義する（$\delta\theta > \Delta\theta_{\text{cam}}$ の閉弁期間は $L_v = 0$）：

1. **Standard ($\sin^2$ プロファイル)**：
   $$L_v(\xi) = L_{\max} \sin^2(\pi \xi)$$
2. **Polynomial ($C^2$ 連続多項式プロファイル)**：
   $$L_v(\xi) = 16 L_{\max} \xi^2 (1 - \xi)^2$$
3. **Aggressive (Flat-Top 台形近似高リフトプロファイル)**：
   $$L_v(\xi) = L_{\max} \left( \sin(\pi \xi) \right)^{0.6}$$

このとき，バルブカーテン面積に基づく有効開口面積 $A_{\text{eff}}(\tilde{\theta})$ $[\text{m}^2]$ は，バルブシート最小流路面積 $A_{\text{seat}} = \frac{\pi}{4} d_v^2$ を上限として次式で与えられる：

$$A_{\text{eff}}(\tilde{\theta}) = C_d \min\left( \pi d_v L_v(\xi), \ \frac{\pi}{4} d_v^2 \right)$$

* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Chapter 6, pp. 220-226](https://www.accessengineeringlibrary.com/content/book/9781260116106)
* **対応テスト `TEST-03`（カムプロファイル境界値・連続性検証）**：
  1. 3種すべてのプロファイルについて，境界 $\xi = 0$ および $\xi = 1$ で $L_v(0) = L_v(1) = 0$，中央 $\xi = 0.5$ で最大リフト $L_v(0.5) = L_{\max}$ と相対誤差 $10^{-12}$ 以内で一致し，閉弁領域で $A_{\text{eff}} = 0$ となること．
  2. $\xi = 0.25$ におけるリフト量が $L_{v,\text{Aggressive}}(0.25) \approx 0.811 > L_{v,\text{Polynomial}}(0.25) = 0.5625 > L_{v,\text{Standard}}(0.25) = 0.5$ の大小関係を満たすこと．


#### 【可変バルブタイミング（VVT，カム位相式）】
吸気カム・排気カムそれぞれに位相オフセット $\varphi_{\text{in}}, \varphi_{\text{ex}}$ $[^\circ\text{CA}]$（正が遅角，範囲 $\pm 40^\circ$，刻み $1^\circ$，既定 $0$）を持ち，開閉時期を同量だけずらす（作用角 $\Delta\theta_{\text{cam}}$ とリフト曲線の形は不変）：

$$\theta_{\text{open}}' = \theta_{\text{open}} + \varphi, \quad \theta_{\text{close}}' = \theta_{\text{close}} + \varphi, \quad L_v(\tilde\theta; \varphi) = L_v(\tilde\theta - \varphi; 0)$$

$\varphi$ は**運転中に変更できる即時項目**（REQ-18）であり，変更は次の積分ステップから反映する．基本タイミング（IVO，IVC，EVO，EVC），最大リフト，弁径，カム種も即時項目とする．

#### 【弁とピストンの干渉判定】
平らなヘッド面とピストン冠面を仮定し，弁の傘がヘッド面から $L_v$ だけ筒内へ出るとすると，干渉しない条件は全クランク角で

$$L_v(\tilde\theta) < h_c + x(\tilde\theta), \quad h_c = \frac{V_c}{A_p}$$

である．設定変更時に $0.5^\circ$ 刻みで全周を検査し，条件を破る角度があれば `VALVE HIT` を運転タブに警告表示する（機械的な衝突はモデル化せず，計算は継続する）．

* **対応テスト `TEST-03`（追加項目）**：
  3. [A] $\varphi \in \{-40, -15, 0, 15, 40\}^\circ$ について，$L_v(\tilde\theta; \varphi) = L_v(\tilde\theta - \varphi; 0)$ が全周 $1^\circ$ 刻みで相対誤差 $10^{-12}$ で成立し，作用角と $\int L_v\,d\theta$ が $\varphi$ によらず一定であること．
  4. [A] 既定設定では `VALVE HIT` が出ない．$\varepsilon = 40$，$L_{\max} = 14\ \text{mm}$，$\varphi_{\text{in}} = -40^\circ$ では出る．判定結果が定義式の直接評価と一致する．
  5. [S] シナリオ S8（REQ-20）：運転中に $\varphi_{\text{in}}$ を変更しても状態量が有限で，$\eta_v$ が $1\%$ 以上変化する．

---

### REQ-04：1次元等エントロピー圧縮性オリフィス流量モデル（順流・逆流・チョーク対応）
吸気弁および排気弁前後の圧力差から，チョーク（音速到達による流量飽和）および順流・逆流（吹き返し・内部EGR）を考慮した質量流量 $\dot{m}$ $[\text{kg/s}]$ をSaint-Venant & Wantzelの式により算出すること．

#### 【数式導出と定義】
バルブ前後の2領域の圧力を $p_1, p_2$ とするとき，高圧側を上流（全圧 $p_0 = \max(p_1, p_2)$，上流温度 $T_0$，上流比熱比 $\gamma_0 = \gamma(T_0)$），低圧側を下流（静圧 $p_{\text{down}} = \min(p_1, p_2)$）と定義し，圧力比を $r_p = \frac{p_{\text{down}}}{p_0} \in (0, 1]$ とおく．
1次元定常等エントロピー流れのエネルギー式 $h_0 = h + \frac{1}{2} u^2$ すなわち $c_p T_0 = c_p T + \frac{1}{2} u^2$ と，等エントロピー関係式 $\frac{T}{T_0} = r_p^{\frac{\gamma_0 - 1}{\gamma_0}}$，$\rho = \rho_0 r_p^{\frac{1}{\gamma_0}} = \frac{p_0}{R T_0} r_p^{\frac{1}{\gamma_0}}$ より，スロート流速 $u$ と質量流束 $\rho u$ は次式となる：

$$u = \sqrt{2 c_p T_0 \left( 1 - r_p^{\frac{\gamma_0 - 1}{\gamma_0}} \right)} = \sqrt{\frac{2 \gamma_0 R T_0}{\gamma_0 - 1} \left( 1 - r_p^{\frac{\gamma_0 - 1}{\gamma_0}} \right)}$$

$$\rho u = \frac{p_0}{\sqrt{R T_0}} r_p^{\frac{1}{\gamma_0}} \sqrt{\frac{2 \gamma_0}{\gamma_0 - 1} \left( 1 - r_p^{\frac{\gamma_0 - 1}{\gamma_0}} \right)}$$

$\frac{\partial (\rho u)}{\partial r_p} = 0$ を解くと，流速 $u$ が局所音速 $a = \sqrt{\gamma_0 R T}$ に達する臨界圧力比（Critical Pressure Ratio）$r_{\text{crit}}$ が得られる：

$$r_{\text{crit}} = \left( \frac{2}{\gamma_0 + 1} \right)^{\frac{\gamma_0}{\gamma_0 - 1}}$$

$r_p \le r_{\text{crit}}$ では流れがチョーク（Choked Flow）し，スロート圧力は $p^* = r_{\text{crit}} p_0$ に固定される．さらに，$r_p \to 1$ 近傍で $\frac{d\sqrt{1 - r_p}}{dr_p} \to -\infty$ となってODEが数値的にStiffになるのを防ぐため，$1 - r_p < \delta_r$（$\delta_r = 10^{-3}$）の微小差圧領域では境界値と勾配を一致させた線形正則化を導入し，無次元流量関数 $\Psi(r_p)$ を次式で定義する：

$$\Psi_{\text{sub}}(r_p) = r_p^{\frac{1}{\gamma_0}} \sqrt{\frac{2\gamma_0}{\gamma_0 - 1} \left( 1 - r_p^{\frac{\gamma_0 - 1}{\gamma_0}} \right)}$$

$$\Psi(r_p) = \begin{cases} \sqrt{\gamma_0 \left( \frac{2}{\gamma_0 + 1} \right)^{\frac{\gamma_0 + 1}{\gamma_0 - 1}}} & (r_p \le r_{\text{crit}} \text{ : Choked}) \\[8pt] \Psi_{\text{sub}}(r_p) & (r_{\text{crit}} < r_p \le 1 - \delta_r \text{ : Subsonic}) \\[8pt] \frac{1 - r_p}{\delta_r} \Psi_{\text{sub}}(1 - \delta_r) & (1 - \delta_r < r_p \le 1 \text{ : Regularized Laminar}) \end{cases}$$

これより，質量流量 $\dot{m}$ は次式で与えられる：

$$\dot{m} = \text{sgn}(p_1 - p_2) \frac{A_{\text{eff}} p_0}{\sqrt{R T_0}} \Psi(r_p)$$

* **符号規約**：
  * **吸気弁流量 $\dot{m}_{\text{in}}$**：$p_1 = p_{\text{in}}$（吸気マニホールド圧，REQ-05で定義する状態変数），$p_2 = p$（筒内圧）．$\dot{m}_{\text{in}} > 0$ が筒内への新気流入，$\dot{m}_{\text{in}} < 0$ が吸気ポートへの吹き返し（逆流）．
  * **排気弁流量 $\dot{m}_{\text{ex}}$**：$p_1 = p$（筒内圧），$p_2 = p_{\text{ex}}$（排気ポート背圧）．$\dot{m}_{\text{ex}} > 0$ が排気ポートへの流出，$\dot{m}_{\text{ex}} < 0$ が排気ポートからの既燃ガス逆流（内部EGR吸入）．

* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Appendix C, pp. 906-907](https://www.accessengineeringlibrary.com/content/book/9781260116106)
* **対応テスト `TEST-04`（圧縮性オリフィス流量・チョーク特性検証）**：
  1. $p_1 = p_2$ のとき厳密に $\dot{m} = 0$ となること．
  2. $\gamma_0 = 1.4$ において臨界圧力比が $r_{\text{crit}} = \left(\frac{2}{2.4}\right)^{3.5} \approx 0.5282817877$ となり，$r_p = 0.50 < r_{\text{crit}}$ と $r_p = 0.25 < r_{\text{crit}}$ で無次元流量関数 $\Psi(r_p)$ がともに最大値 $\Psi_{\max} \approx 0.68473145$ で完全一致（飽和）すること．
  3. 同一の上流温度のもとで $(p_1, p_2)$ を入れ替えたとき，流量の絶対値が等しく符号が反転すること．

---

### REQ-05：スロットルバルブ・吸気マニホールドモデル（大気圧可変）
ECUが操作するスロットル開度 $\alpha$ $[\text{rad}]$（UI表示は $\text{deg}$）から，スロットル通過質量流量 $\dot{m}_{\text{th}}$ $[\text{kg/s}]$ と吸気マニホールド圧 $p_{\text{in}}$ $[\text{Pa}]$ の動的変化を求めること．スロットル上流は大気とし，大気圧 $p_{\text{atm}}$ を可変パラメータとして与える．$p_{\text{in}}$ は本システムの状態変数（§2.2の7番目．管内の既燃ガス質量 $m_{b,\text{in}}$ は8番目）である．

#### 【数式導出と定義】
**1. 環境条件（上流境界）**：大気圧 $p_{\text{atm}}$ $[\text{Pa}]$ を**可変パラメータ**（既定 $101.3\ \text{kPa}$（設定の刻み $0.1\ \text{kPa}$ の格子に合わせた値），設定範囲 $60 \sim 110\ \text{kPa}$：高地から低気圧・高気圧を想定），大気温を $T_{\text{amb}}$ $[\text{K}]$（既定 $298.15\ \text{K}$）とする．スロットル上流はよどみ状態 $p_0 = p_{\text{atm}}$，$T_0 = T_{\text{amb}}$ とし，エアクリーナ・吸気ダクトの圧力損失は無視する．$p_{\text{atm}}$ は次の箇所で共通に用いる：
   * スロットル上流圧（本REQ）
   * 排気背圧 $p_{\text{ex}} = p_{\text{atm}} + \Delta p_{\text{ex}}$（$\Delta p_{\text{ex}}$：排気系圧損，既定 $4\ \text{kPa}$）
   * クランクケース背圧（REQ-10の $T_{\text{ind}}$）
   * 体積効率の基準密度 $\rho_{\text{atm}} = \frac{p_{\text{atm}}}{R T_{\text{amb}}}$（REQ-14）
   * 初期条件 $p(0) = p_{\text{in}}(0) = p_{\text{atm}}$

   なお，燃焼速度式の基準圧 $p_{\text{ref}} = 101.325\ \text{kPa}$（REQ-07）は物性式の基準値であり $p_{\text{atm}}$ とは独立である．

**2. スロットル有効開口面積**：開度 $\alpha \in [0,\ \pi/2]$（$\alpha = 0$：全閉，$\alpha = \pi/2$：全開）に対し，
   $$A_{\text{th}}(\alpha) = C_{d,\text{th}} \left[ A_{\text{leak}} + \frac{\pi}{4} D_{\text{th}}^2 \, (1 - \cos\alpha) \right]$$
   $D_{\text{th}}$：スロットルボア径 $[\text{m}]$（既定 $0.040\ \text{m}$），$A_{\text{leak}}$：全閉時の漏れ・アイドルバイパス等価面積 $[\text{m}^2]$（既定 $2.0 \times 10^{-6}\ \text{m}^2$（無負荷でも目標 $800\ \text{rpm}$ で整定できる大きさとして設定．プロトタイプで $1.0 \times 10^{-5}\ \text{m}^2$ は全閉でも約 $1800\ \text{rpm}$ に達して過大だった）），$C_{d,\text{th}}$：流量係数（既定 $0.8$）．導出：円形バルブ板は全閉時（$\alpha = 0$）に流路断面を塞ぎ，開度 $\alpha$ では板の流れ方向への投影面積が $\cos\alpha$ 倍になるため，開口面積は $\frac{\pi}{4} D_{\text{th}}^2 (1 - \cos\alpha)$ で近似される（板厚・軸による閉塞は無視）．

   **2″. 理想スロットル（第16版で変更）**：漏れ面積 $A_{\text{leak}}$ を廃止し，$A_{\text{th}}(\alpha) = C_{d,\text{th}}\frac{\pi}{4} D_{\text{th}}^2 (1 - \cos\alpha)$ とする．開度 $0$ で流量は $0$ になる（利用者の提案「開度 0 で流量 0，理想的なスロットル」）．旧版は漏れ面積 $1\ \text{mm}^2$ を持たせていたが，第12版で弁諸元とランナを変えた後は，全閉の漏れだけで無負荷のエンジンが約 $1500\ \text{rpm}$ まで回り，目標 $800\ \text{rpm}$ に下げられず開度が $0$ に張り付いた（実機の画面で確認．「飽和」の表示が意味不明との指摘の原因）．理想スロットルでは，回転が上がりすぎれば開度を絞って空気を止められるので，開度が全閉に張り付くことは無い．なお $\alpha = 90^\circ$ はバタフライ弁の板が流れと平行になる全開の位置で，物理的にあり得る角度である．以下の 2′ は第15版までの記述で，第16版では適用しない．
   **2′. 漏れ面積の設計指針（第15版まで）**：全閉（$\alpha = 0$）付近では $p_{\text{in}}/p_{\text{atm}} < r_{\text{crit}} \approx 0.528$（$p_{\text{in}} < 53.5\ \text{kPa}$）の間，漏れ流量はチョークして $p_{\text{in}}$・回転数に依らず一定となる：
   $$\dot{m}_{\text{leak}} = C_{d,\text{th}} A_{\text{leak}} \frac{p_{\text{atm}}}{\sqrt{R T_{\text{amb}}}} \Psi_{\max}, \quad \Psi_{\max} \approx 0.6847\ (\gamma_0 = 1.4)$$
   このとき無負荷での定常回転数は，正味図示仕事と摩擦仕事のつり合い $\text{IMEP}_{\text{net}} = \text{FMEP}(\omega)$（FMEP は REQ-10 の Chen–Flynn 式）で決まる．$A_{\text{leak}}$ は「全閉の漏れだけではアイドル回転数に届かない」大きさに選び，不足分を ECU がスロットルを開いて補う設計とする（全閉で目標を超えると ECU は回転数を下げる手段を持たない）．
   $$\dot{m}_{\text{leak}} < \dot{m}_{\text{idle}} = \frac{m_{\text{air,trapped}}\,N_{\text{idle}}}{120}$$
   既定諸元・$N_{\text{idle}} = 800\ \text{rpm}$ の実装検証値は $\text{FMEP} \approx 55\ \text{kPa}$，$\eta_v \approx 0.12$，$\dot{m}_{\text{idle}} \approx 0.46\ \text{g/s}$ である．既定値 $A_{\text{leak}} = 1.0\ \text{mm}^2$ では $\dot{m}_{\text{leak}} = 0.8 \times 10^{-6} \cdot 101300 / \sqrt{287 \cdot 298.15} \cdot 0.6847 \approx 0.19\ \text{g/s}$ で不足し，定常開度は $\alpha \approx 2.3^\circ$ となる（$2\ \text{mm}^2$ では全閉のまま約 $800\ \text{rpm}$ で平衡し，$\alpha$ が下限に張り付く）．

**3. スロットル質量流量**：REQ-04のオリフィス流量式（$\Psi(r_p)$ と符号規約）をそのまま適用する．$p_1 = p_{\text{atm}}$，$p_2 = p_{\text{in}}$ として，
   $$\dot{m}_{\text{th}} = \text{sgn}(p_{\text{atm}} - p_{\text{in}}) \frac{A_{\text{th}}(\alpha) \, p_0}{\sqrt{R T_0}} \Psi(r_p), \quad p_0 = \max(p_{\text{atm}}, p_{\text{in}}), \quad r_p = \frac{\min(p_{\text{atm}}, p_{\text{in}})}{\max(p_{\text{atm}}, p_{\text{in}})}$$
   上流温度は順流（$p_{\text{atm}} \ge p_{\text{in}}$）のとき $T_0 = T_{\text{amb}}$，逆流のとき $T_0 = T_{\text{in}}$ とする．$\dot{m}_{\text{th}} > 0$ がマニホールドへの流入である．

**4. 吸気マニホールド圧力方程式**：次を仮定する．(a) 内容積 $V_{\text{in}}$ $[\text{m}^3]$（既定 $1.5 \times 10^{-3}\ \text{m}^3$）は一様，(b) 管内ガス温度 $T_{\text{in}}$ $[\text{K}]$ は一定（等温，既定 $T_{\text{in}} = T_{\text{amb}}$），(c) 管内ガスは完全混合とし，吸気弁から吹き返した筒内ガスの既燃分を $m_{b,\text{in}}$ で追跡する（第11版で変更．旧版は「組成は新気とし吹き返しガスの混入は無視」としていたため，吹き返した既燃ガスが次の吸気行程で新気として数えられ，オーバーラップによる内部 EGR を過小評価していた．7.7 節），(d) 燃料は当量比 $\phi$（REQ-07）で別途与え，管内質量収支に含めない．管内ガス質量 $m_{\text{in}} = \frac{p_{\text{in}} V_{\text{in}}}{R T_{\text{in}}}$ の質量保存則
   $$\frac{dm_{\text{in}}}{dt} = \dot{m}_{\text{th}} - \dot{m}_{\text{in}}$$
   に $V_{\text{in}}, T_{\text{in}} = \text{const}$ を用いると，
   $$\frac{dp_{\text{in}}}{dt} = \frac{R T_{\text{in}}}{V_{\text{in}}} \left( \dot{m}_{\text{th}} - \dot{m}_{\text{in}} \right)$$
   ここで $\dot{m}_{\text{in}}$ はREQ-04の吸気弁流量（$p_1 = p_{\text{in}}$，$p_2 = p$）であり，この式によりスロットルとシリンダが連成する．

**4′. 吸気マニホールドの既燃ガス収支（第11版で追加）**：スロットルからの流入は新気（既燃分 $0$）とする．吸気弁流量 $\dot{m}_{\text{in}}$（REQ-04，$\dot{m}_{\text{in}} > 0$ が筒内への流入）に乗って運ばれる既燃ガスの割合を，流れの上流側の組成で決める：
   $$Y_{\text{src}} = \begin{cases} Y_{b,\text{in}} & (\dot{m}_{\text{in}} \ge 0：\text{管から筒内へ}) \\ 1 - Y_u & (\dot{m}_{\text{in}} < 0：\text{筒内から管へ吹き返し}) \end{cases}$$
   管内の既燃ガス質量の保存則は
   $$\frac{dm_{b,\text{in}}}{dt} = -\dot{m}_{\text{in}}\,Y_{\text{src}}$$
   である．スロットルの逆流（$\dot{m}_{\text{th}} < 0$，$p_{\text{in}} > p_{\text{atm}}$）は管内組成のまま流出するので，この場合に限り右辺に $+\min(0, \dot{m}_{\text{th}})\,Y_{b,\text{in}}$ を加える．**限界**：管内温度は $T_{\text{in}}$ 一定のままとし，高温の吹き返しガスによる管内温度の上昇は扱わない．

**5. 数値上の要件**：全開付近ではこの項の固有値の大きさが $10^4\ \text{s}^{-1}$ オーダとなり，陽的RK4の安定条件から時間刻みに上限が必要となる．REQ-13のソルバは刻みを $\Delta t \le \Delta t_{\max} = 1.0 \times 10^{-4}\ \text{s}$ に制限すること（低回転時に $\Delta t = \Delta\theta / \omega$ が大きくなりすぎるのを防ぐ）．

* **出典**：[L. Guzzella and C. H. Onder, *Introduction to Modeling and Control of Internal Combustion Engine Systems*, 2nd Ed., Springer (2010), Chapter 2](https://doi.org/10.1007/978-3-642-10775-7)，[E. Hendricks and S. C. Sorenson, "Mean Value Modelling of Spark Ignition Engines", SAE Technical Paper 900616 (1990)](https://doi.org/10.4271/900616)
* **対応テスト `TEST-05`（スロットル特性・マニホールド質量保存・大気圧可変検証）**：
  1. （第16版で変更）$A_{\text{th}}(0) = 0$（厳密），$A_{\text{th}}(\pi/2) = C_{d,\text{th}}\frac{\pi}{4} D_{\text{th}}^2$ が相対誤差 $10^{-12}$ 以内で成立し，$A_{\text{th}}$ が $\alpha$ について単調増加であること．
  2. 吸気弁を閉じた状態（$\dot{m}_{\text{in}} = 0$）で $p_{\text{in}}(0) = 0.3\,p_{\text{atm}}$ から積分したとき，$p_{\text{in}}$ が単調に増加して $p_{\text{atm}}$ に収束し，かつ $\int \dot{m}_{\text{th}}\,dt = \frac{V_{\text{in}}}{R T_{\text{in}}}\left(p_{\text{in}}(t) - p_{\text{in}}(0)\right)$ が相対誤差 $10^{-6}$ 以内で成立すること（質量保存）．
  3. チョーク域（$r_p < r_{\text{crit}}$）で $\dot{m}_{\text{th}}$ が $p_{\text{in}}$ に依存せず $\frac{A_{\text{th}} p_{\text{atm}}}{\sqrt{R T_{\text{amb}}}}\Psi_{\max}$ と一致し，$p_{\text{atm}}$ を $101.325\ \text{kPa}$ から $80\ \text{kPa}$ に変更すると $\dot{m}_{\text{th}}$ が $\frac{80000}{101325}$ 倍になること（相対誤差 $10^{-12}$ 以内）．
  4. 一定の $\alpha$ で運転した定常状態において，数サイクル平均の $\dot{m}_{\text{th}}$ と吸気弁流量 $\dot{m}_{\text{in}}$ が相対誤差 $1\%$ 以内で一致すること．
  5. $p_{\text{atm}}$ を変更して初期化した無燃焼・停止状態で，$p(0) = p_{\text{in}}(0) = p_{\text{atm}}$ かつ $T_{\text{ind}} = 0$ となること．
  6. [S]（第11版）運転中の全時刻で $0 \le Y_{b,\text{in}} \le 1$．コールドリセット直後に $m_{b,\text{in}} = 0$．
  7. [S]（既燃ガスの収支，第11版，第12版で修正）既定設定のアイドル定常（S2）の直近 5 サイクルで，筒内から吸気側へ吹き返した既燃ガス質量 $B_o = \int_{\dot m_{\text{in}} < 0} (1 - Y_u)\,|\dot{m}_{\text{in}}|\,dt$ と，吸気側から筒内へ戻った既燃ガス質量 $B_i = \int_{\dot m_{\text{in}} \ge 0} Y_{b,p}\,\dot{m}_{\text{in}}\,dt$（ランナ OFF では $Y_{b,p} = Y_{b,\text{in}}$）の差が，両者の平均の $2\%$ 以内（定常では既燃ガスが溜まり続けない）．かつ 5 サイクル間の吸気側の既燃ガス量 $m_{b,\text{in}} + m_{b,p}$ の増分と $B_o - B_i$ の差が $10^{-3} B_o$ 以内（$B_o, B_i$ は §2.2 の補助積分）．（判定の分母を $B_o$ とした理由：定常では $B_o - B_i$ が $B_o$ の約 $0.1\%$ と小さいため．第11版の実装は $B_o, B_i$ をステップ始点の値の矩形則で累積しており，差は $4.6 \times 10^{-8}\ \text{kg}$（$B_o$ の $0.06\%$）だった．第12版ではランナの振動で矩形則の誤差が $B_o$ の $0.75\%$ に増えたため，補助積分に替えた．第12版の実装検証：増分と $B_o - B_i$ はともに $-6.759 \times 10^{-8}\ \text{kg}$ で一致．）

---

### REQ-06：筒内2成分ガス組成追跡（新気 $m_u$・既燃ガス $m_b$ と残留ガス率 $x_r$）
筒内総質量 $m$ と未燃新気質量 $m_u$ の保存則を連立して解き，バルブオーバーラップ時の吹き返し，内部EGR，および過給時の掃気（Scavenging）を一貫して追跡すること．

#### 【数式導出と定義】
筒内総質量 $m$ の時間微分は，吸気弁流入質量流量 $\dot{m}_{\text{in}}$ と排気弁流出質量流量 $\dot{m}_{\text{ex}}$ の収支より，

$$\frac{dm}{dt} = \dot{m}_{\text{in}} - \dot{m}_{\text{ex}}$$

筒内の未燃新気質量分率を $Y_u = \text{clamp}\left(\frac{m_u}{m}, 0, 1\right)$ とする．
* 吸気弁を通じた新気質量流束 $\dot{m}_{u,\text{in}}$ は，順流時（$\dot{m}_{\text{in}} \ge 0$）には吸気マニホールドの組成（既燃ガス分率 $Y_{b,\text{in}}$，REQ-05 4′）のガスが流入し，逆流時（$\dot{m}_{\text{in}} < 0$）には筒内混合気が質量分率 $Y_u$ で吹き返すため：
  $$\dot{m}_{u,\text{in}} = \begin{cases} (1 - Y_{b,\text{in}})\,\dot{m}_{\text{in}} & (\dot{m}_{\text{in}} \ge 0) \\ Y_u \dot{m}_{\text{in}} & (\dot{m}_{\text{in}} < 0) \end{cases}$$
  （第11版で変更．旧版は順流を常に $100\%$ 新気としていた．）
* 排気弁を通じた新気質量流束 $\dot{m}_{u,\text{ex}}$ は，流出時（$\dot{m}_{\text{ex}} \ge 0$）には筒内混合気が質量分率 $Y_u$ で流出し，逆流時（$\dot{m}_{\text{ex}} < 0$）には排気ポートから既燃ガスのみ（新気率 $0$）が逆流するため：
  $$\dot{m}_{u,\text{ex}} = \begin{cases} Y_u \dot{m}_{\text{ex}} & (\dot{m}_{\text{ex}} \ge 0) \\ 0 & (\dot{m}_{\text{ex}} < 0) \end{cases}$$
* 燃焼による新気から既燃ガスへの変換速度 $\dot{m}_{u,\text{comb}}$ は，吸気弁閉（IVC）時点で確定したトラップ新気質量を $m_{u,\text{trapped}}$，Wiebe関数の燃焼率微分を $\frac{dx_b}{d\theta}$ とすると：
  $$\dot{m}_{u,\text{comb}} = m_{u,\text{trapped}} \frac{dx_b}{d\theta} \omega$$

以上より，未燃新気質量 $m_u$ の支配方程式は次式となる：

$$\frac{dm_u}{dt} = \dot{m}_{u,\text{in}} - \dot{m}_{u,\text{ex}} - \dot{m}_{u,\text{comb}}$$

* **出典**：[C. R. Ferguson and A. T. Kirkpatrick, *Internal Combustion Engines: Applied Thermosciences*, 3rd Ed., Wiley (2015)](https://www.wiley.com/en-us/Internal+Combustion+Engines%3A+Applied+Thermosciences%2C+3rd+Edition-p-9781118533314)
* **対応テスト `TEST-06`（質量保存・組成有界性検証）**：
  1. 任意のサイクル計算を通じて常に $0 \le m_u \le m$（すなわち $Y_u \in [0, 1]$，$x_r = 1 - Y_u \in [0, 1]$）が成立し，燃焼終了後（排気弁開前）に $Y_u < 0.01$（Wiebe燃焼効率 $99.3\%$ に対応）まで新気が消費されること．

---

### REQ-07：乱流火炎伝播連動Single-Wiebe燃焼モデル
点火時期 $\theta_{\text{spark}}$，当量比 $\phi$，残留ガス率 $x_r$，および機関回転速度 $\omega$ に応じて着火遅れ角 $\Delta\theta_d$ と燃焼期間 $\Delta\theta_b$ が物理的に変化する乱流火炎伝播連動Single-Wiebeモデルを実装すること．着火遅れと熱発生の速さは，物理モデルの値に掛かる係数と Wiebe 形状係数で利用者が調整できること（第8版．旧版の「Manualモード」は未実装だったため，この調整機能で置き換える）．

#### 【数式導出と定義】
1. **Metghalchi & Keckの層流燃焼速度式**：
   基準温度 $T_{\text{ref}} = 298\ \text{K}$，基準圧力 $p_{\text{ref}} = 101.325\ \text{kPa}$ におけるイソオクタン・ガソリン混合気の基準層流燃焼速度 $S_{L,0}(\phi)$ $[\text{m/s}]$ は，定数 $B_m = 0.305\ \text{m/s}$，$B_\phi = -0.549\ \text{m/s}$，$\phi_m = 1.1$ を用いて次式で与えられる：
   $$S_{L,0}(\phi) = \max\left( 0.05, \ B_m + B_\phi (\phi - \phi_m)^2 \right)$$
   温度指数 $\alpha = 2.18 - 0.8(\phi - 1)$，圧力指数 $\beta = -0.16 + 0.22(\phi - 1)$，および残留ガス率 $x_r$ による希釈減速項を用いると，点火時の筒内未燃ガス状態 $(T_{\text{spark}}, p_{\text{spark}})$ における層流燃焼速度 $S_L$ $[\text{m/s}]$ は次式となる：
   $$S_L = S_{L,0}(\phi) \left( \frac{T_{\text{spark}}}{T_{\text{ref}}} \right)^\alpha \left( \frac{p_{\text{spark}}}{p_{\text{ref}}} \right)^\beta \max\left( 0.15, \ 1 - 2.06 x_r^{0.77} \right)$$
2. **乱流燃焼速度 $S_T$ と着火遅れ $\Delta\theta_d$・燃焼期間 $\Delta\theta_b$ の算出**：
   平均ピストン速度 $c_m = \frac{S \omega}{\pi}$ $[\text{m/s}]$ に比例する筒内乱流強度を $u' = 0.5 c_m$ とすると，Damköhlerの乱流火炎伝播スケーリングより有効乱流燃焼速度は $S_T = S_L + C_{\text{turb}} u'$ となる．また，点火を圧縮上死点後（ATDC）へ大きく遅角（リタード）させた場合，膨張に伴う乱流減衰と温度低下によって火炎伝播が緩慢になる効果を反映するため，点火角 $\theta_{\text{spark}}$（圧縮TDC $\tilde{\theta}=2\pi$ からの相対角 $\Delta\theta_{\text{ign}} = \theta_{\text{spark}} - 2\pi$）に対する膨張遅角ペナルティ係数 $f_{\text{ret}} = 1 + 0.025 \max(0, \Delta\theta_{\text{ign,deg}})$ を導入し，着火遅れ角 $\Delta\theta_d$ $[\text{rad}]$ と燃焼期間 $\Delta\theta_b$ $[\text{rad}]$ を次式で算出する：
   $$\Delta\theta_d = c_d\,\frac{\ell_{\text{kernel}} \omega}{S_L + C_k u'}, \quad \Delta\theta_b = \frac{f_{\text{ret}}}{c_b} \frac{\ell_{\text{chamber}} \omega}{S_T}$$
   **調整係数（第8版で追加，設定「燃焼速度」ページ，即時項目）**：着火遅れ係数 $c_d$（$0.1$〜$10$，刻み $0.1$，既定 $1$），燃焼速度係数 $c_b$（$0.1$〜$10$，刻み $0.1$，既定 $1$．$c_b = 2$ で燃焼期間が半分＝熱発生が2倍速い），Wiebe 形状係数 $m_w$（$0$〜$6$，刻み $0.5$，既定 $2$．大きいほど熱発生のピークが燃焼期間の後ろへ寄る）．$m_w$ は点火時の値をそのサイクルの燃焼に固定する．
   （ここで $\ell_{\text{kernel}} = 0.025 B$ は火炎核形成距離，$C_k = 0.4$ は火炎核成長への乱れの寄与係数，$\ell_{\text{chamber}} \approx 0.65 B$ は代表燃焼室伝播距離）．
   **着火遅れの校正（第11版）**：旧版の $\ell_{\text{kernel}} = 0.05 B$，$C_k = 0.2$ では着火遅れが約 $45^\circ\text{CA}$ と長く，MBT 点火時期が全開 $3000\ \text{rpm}$ で $64^\circ$ BTDC，$5000\ \text{rpm}$ で $76^\circ$ BTDC と実機の典型（全開で $20$〜$35^\circ$ BTDC 程度，推定）より大きく進んでいた．試作で校正した値 $\ell_{\text{kernel}} = 0.025 B$，$C_k = 0.4$ では，全開 $1500 / 3000 / 5000\ \text{rpm}$ の MBT が $20 / 24 / 27^\circ$ BTDC（回転とともに進角）となる（REQ-24，TEST-24 で判定）．**限界**：部分負荷で MBT が全開より大きく進む実機の傾向は，$S_L$ の圧力指数 $\beta < 0$ により低圧で $S_L$ がかえって大きくなるため，十分には再現しない．
3. **Single-Wiebe関数と熱発生率（ROHR）**：
   燃焼開始角を $\theta_0 = \theta_{\text{spark}} + \Delta\theta_d$，正規化燃焼進行度を $\zeta = \frac{\tilde{\theta} - \theta_0}{\Delta\theta_b}$ とすると，質量燃焼割合 $x_b(\tilde{\theta})$ とそのクランク角微分 $\frac{dx_b}{d\theta}$ は次式で与えられる（$a = 5.0$，形状因子 $m_w$：設定値，既定 $2.0$）：
   $$x_b(\tilde{\theta}) = \begin{cases} 0 & (\zeta \le 0) \\ 1 - \exp\left( -a \zeta^{m_w + 1} \right) & (0 < \zeta \le 1) \\ 1 - \exp(-a) & (\zeta > 1) \end{cases}$$
   $$\frac{dx_b}{d\theta} = \begin{cases} \frac{a (m_w + 1)}{\Delta\theta_b} \zeta^{m_w} \exp\left( -a \zeta^{m_w + 1} \right) & (0 < \zeta \le 1) \\ 0 & (\text{otherwise}) \end{cases}$$
4. **1サイクル総投入熱量 $Q_{\text{in}}$ と瞬時熱発生率 $\dot{Q}_{\text{comb}}$**：
   理論空燃比を $\text{AF}_{\text{stoich}} = 14.7$，ガソリン低位発熱量を $Q_{\text{LHV}} = 44.0 \times 10^6\ \text{J/kg}$ とすると，トラップ新気質量 $m_{u,\text{trapped}}$ に含まれる空気質量は $m_{\text{air}} = \frac{m_{u,\text{trapped}}}{1 + \phi / \text{AF}_{\text{stoich}}}$，燃料質量は $m_f = \frac{\phi}{\text{AF}_{\text{stoich}}} m_{\text{air}}$ である．リッチ領域（$\phi > 1$）では酸素不足により未燃燃料が残るため，酸素律速を考慮した有効燃焼熱量 $Q_{\text{in}}$ $[\text{J}]$ と時間あたり熱発生率 $\dot{Q}_{\text{comb}}$ $[\text{W}]$ は次式となる：
   $$Q_{\text{in}} = m_f\, Q_{\text{LHV}}\, \eta_{\text{comb}}\, \varepsilon(\phi), \quad \dot{Q}_{\text{comb}} = Q_{\text{in}} \frac{dx_b}{d\theta} \omega$$
   **リッチ側の不完全燃焼（第8版で修正）**：旧版は $Q_{\text{in}} \propto \min(\phi, 1)/(1 + \phi/\text{AF})$ で，$\phi > 1$ の燃料を「燃えない」としか扱わず，$\phi = 1 \to 1.3$ で IMEP が $1.7\%$ しか変わらなかった．第8版では，燃料を $\text{CH}_y$（$y = 1.87$）とし，酸素不足のときの生成物 $a\,\text{CO}_2 + b\,\text{CO} + c\,\text{H}_2\text{O} + d\,\text{H}_2$ を元素保存と水性ガスシフト平衡で決める（Heywood, 1988, Sec. 4.9.1）：
   $$a + b = 1,\quad 2c + 2d = y,\quad 2a + b + c = \frac{2(1 + y/4)}{\phi},\quad K = \frac{b\,c}{a\,d} = 3.5$$
   第1〜3式から $b + d = S \equiv \left(2 + \frac{y}{2}\right)\left(1 - \frac{1}{\phi}\right)$，これと $K$ の式から $b$ の2次方程式 $(K - 1)\,b^2 - \left[\frac{y}{2} - S + K(1 + S)\right] b + K S = 0$ を得て，$[0, \min(1, S)]$ の根を取る．燃え残る CO と H₂ が持ち去る発熱量の割合を差し引き，
   $$\varepsilon(\phi) = 1 - \frac{b\,\Delta h_{\text{CO}} + d\,\Delta h_{\text{H}_2}}{M_f\, Q_{\text{LHV}}} \quad (\phi > 1), \qquad \varepsilon(\phi) = 1 \quad (\phi \le 1)$$
   とする（$\Delta h_{\text{CO}} = 283.0\ \text{kJ/mol}$，$\Delta h_{\text{H}_2} = 241.8\ \text{kJ/mol}$，$M_f = 13.896\ \text{g/mol}$）．空気量あたりの熱発生 $\phi\,\varepsilon(\phi)$ は $\phi = 1$ で最大の $1$，$\phi = 1.1$ で $0.969$，$\phi = 1.2$ で $0.938$ となる．
   **限界**：生成物のモル数の増加と比熱比の変化（実機で出力最大が $\phi \approx 1.1$ になる要因）は扱わない．このため本モデルの出力最大は $\phi = 1$ にある．

* **出典**：
  * [M. Metghalchi and J. C. Keck, "Burning Velocities of Mixtures of Air with Methanol, Isooctane, and Indolene at High Pressure and Temperature", *Combustion and Flame*, Vol. 48, pp. 191-210 (1982)](https://doi.org/10.1016/0010-2180(82)90127-4)
  * [I. I. Wiebe, *Brennverlauf und Kreisprozess von Verbrennungsmotoren*, VEB Verlag Technik, Berlin (1970)](https://books.google.co.jp/books?id=6fcJAQAAMAAJ)
**燃焼のサイクル変動（第7版で追加，設定「燃焼」の `[サイクル変動 OFF／ON]`，既定 ON）**：実機では火炎核の成長が点火時の乱れに左右され，燃焼がサイクルごとにばらつく．点火のたびに，一様乱数 $z_1, z_2$（平均 $0$，分散 $1$，区間 $[-\sqrt{3}, \sqrt{3}]$）を引き，
$$\theta_0 \leftarrow \theta_0 + \sigma_{\theta}\,z_1, \qquad \Delta\theta_b \leftarrow \Delta\theta_b \max\left(0.5,\ 1 + \sigma_b\,z_2\right), \qquad \sigma_\theta = 3^\circ\text{CA},\ \sigma_b = 0.12$$
とする．乱数は `EngineCore` ごとに種を固定した擬似乱数（mulberry32）で生成し，状態の複製で乱数状態も複製されるので，結果は決定的である．係数は，本モデルで IMEP の変動係数が実機の目安（アイドル $5$〜$10\%$，部分負荷 $1$〜$3\%$）に入るよう選んだ（実装検証値：アイドル $8.9\%$，$1500\ \text{rpm}$・開度 $15^\circ$ で $1.1\%$，$3000\ \text{rpm}$ 全開で $1.4\%$）．MBT 制御（REQ-12）はサイクルごとの CA50 を使うので，ばらつきの平均を目標に合わせる．
* **音への波及（調査結果）**：燃焼をばらつかせても，排気音のピークのばらつきは $0.1$〜$0.35\ \text{dB}$ にとどまる（排気のブローダウンは膨張後の圧力で決まり，燃焼時期の影響が小さい）．音の不規則さは REQ-21 の流れ雑音が担う．

* **対応テスト `TEST-07`（Wiebe積分・燃焼速度感度検証）**：
  1. 区間 $[\theta_0, \theta_0 + \Delta\theta_b]$ にわたる $\frac{dx_b}{d\theta}$ の台形則数値積分値（分割数 $N=2000$）が，解析解 $1 - e^{-a} \approx 0.993262053$ と相対誤差 $10^{-5}$ 以内で一致すること．
  2. 残留ガス率を $x_r = 0.05 \to 0.25$ へ増加させたとき層流燃焼速度 $S_L$ が減少し，また点火時期を $20^\circ\ \text{BTDC} \to 10^\circ\ \text{ATDC}$ へ遅角させたとき燃焼期間 $\Delta\theta_b$ が増大すること．

  3. [S]（サイクル変動）S4V（S4 の定常からサイクル変動 ON で $10\ \text{s}$）：直近60サイクルの COV(IMEP) が $0.5$〜$5\%$，平均 IMEP が OFF（S4）と $2\%$ 以内，摂動 $z_1, z_2$ の標本平均の絶対値が $0.3$ 未満・標準偏差が $1 \pm 0.25$・$|z| \le \sqrt{3}$，平均 CA50 が ATDC $10 \pm 1^\circ$．
  4. [S]（決定性）S4 の終端を複製してサイクル変動 ON で $10\ \text{s}$ 積分した状態が S4V の終端と完全一致．OFF では摂動が $0$．

  5. [A]（リッチ燃焼，第8版）$\varepsilon(1) = 1$．$\phi = 1.1, 1.2, 1.4$ で，求めた $a, b, c, d$ が元素保存3式と $K = 3.5$ を相対誤差 $10^{-12}$ で満たし，$0 \le a, b, c, d$．$\phi\,\varepsilon(\phi)$ が $\phi \ge 1$ で単調減少し，$\phi = 1.1$ で $0.969 \pm 0.002$，$1.2$ で $0.938 \pm 0.002$．
  6. [S]（当量比の効果，第8版）S4 の定常から当量比だけを変えて各 $3\ \text{s}$：モードB（開度固定）の IMEP が $\phi = 0.8 < 0.9 < 1.0$ で増加し，$1.0 > 1.1 > 1.2$ で減少する．モードA（S2 の定常から）では $\phi = 1.2$ の燃料流量が $\phi = 1.0$ より $15\%$ 以上多く，回転数は目標 $\pm 25\ \text{rpm}$ に保たれる．
  7. [A]（調整係数，第8版）同じ状態で `burn` を評価すると，$c_d = 2$ で着火遅れ（$\theta_0 - \theta_{\text{spark}}$）がちょうど2倍，$c_b = 2$ で燃焼期間がちょうど半分．$m_w = 0.5, 2, 4$ で $\int_0^1 \frac{dx_b}{d\zeta} d\zeta = 1 - e^{-a}$（$10^{-5}$），$x_b(\zeta_{50}) = 0.5$（$\zeta_{50} = (\ln 2 / a)^{1/(m_w+1)}$）．
  8. [S]（調整係数の効果）S4 の定常から点火固定（自動最適化 OFF）で $c_b = 2$ にすると $p_{\max}$ が $5\%$ 以上上がる．自動最適化 ON では点火時期が遅角側へ動き，CA50 が ATDC $10 \pm 0.5^\circ$ に戻る．

---

### REQ-08：Woschni壁面熱伝達モデルとシリンダ壁熱容量モデル
筒内ガスからシリンダ壁への瞬時熱損失流量 $\dot{Q}_{\text{wall}}$ $[\text{W}]$ をWoschniの経験式で評価し，シリンダ壁温度 $T_w$ の過渡応答（暖機過程）を連立して解くこと．

#### 【数式導出と定義】
平均ピストン速度を $c_m = \frac{S \omega}{\pi}$ $[\text{m/s}]$ とする．IVC時点の筒内状態を $(p_{\text{IVC}}, V_{\text{IVC}}, T_{\text{IVC}})$ とし，燃焼がないと仮定したときのモータリング（断熱圧縮膨張）圧力を $p_{\text{motored}}(\theta) = p_{\text{IVC}} \left( \frac{V_{\text{IVC}}}{V(\theta)} \right)^{1.33}$ と定義すると，Woschniの特性ガス速度 $w$ $[\text{m/s}]$ は次式で与えられる：

$$w = C_1 c_m + C_2 \frac{V_d T_{\text{IVC}}}{p_{\text{IVC}} V_{\text{IVC}}} \max\left( 0, \ p(\theta) - p_{\text{motored}}(\theta) \right)$$

ここで係数は，
* ガス交換期間（EVO $\sim$ IVC）：$C_1 = 6.18,\ C_2 = 0$
* 圧縮・燃焼・膨張期間（IVC $\sim$ EVO）：$C_1 = 2.28,\ C_2 = 3.24 \times 10^{-3}\ \text{m/(s}\cdot\text{K)}$

Woschniの瞬時熱伝達率 $h_c$ $[\text{W/(m}^2\cdot\text{K)}]$（単位変換後のSI整合形：$p$ を $[\text{kPa}]$ すなわち $\frac{p}{1000}$ で代入）は，スケール調整係数を $C_{\text{woschni}} \ge 0$ として次式となる：

$$h_c = C_{\text{woschni}} \cdot 3.26 B^{-0.2} \left( \frac{p}{1000} \right)^{0.8} T^{-0.55} \left( \max(w, 0.5) \right)^{0.8}$$

これより，壁面熱損失流量 $\dot{Q}_{\text{wall}}$ $[\text{W}]$ およびシリンダ壁面温度 $T_w$ $[\text{K}]$ の時間発展方程式は次式で与えられる：

$$\dot{Q}_{\text{wall}} = h_c A_w(\theta) (T - T_w)$$

$$C_{w,\text{th}} \frac{dT_w}{dt} = \dot{Q}_{\text{wall}} - G_{\text{cool}} (T_w - T_{\text{cool}})$$

（ここで $C_{w,\text{th}}$ $[\text{J/K}]$ はシリンダライナー・ヘッド表層の有効熱容量，$T_{\text{cool}} = 360\ \text{K}$ は冷却水温度，$G_{\text{cool}}$ $[\text{W/K}]$ は冷却水への熱コンダクタンス）．

* **出典**：[G. Woschni, "A Universally Applicable Equation for the Instantaneous Heat Transfer Coefficient in the Internal Combustion Engine", *SAE Technical Paper* 670931 (1967)](https://doi.org/10.4271/670931)
* **対応テスト `TEST-08`（熱伝達符号・断熱極限検証）**：
  1. $C_{\text{woschni}} = 0$（熱損失OFF）のとき，任意の温度・圧力下で恒等的に $\dot{Q}_{\text{wall}} = 0$ となること．
  2. $C_{\text{woschni}} = 1.0$ のとき，燃焼圧力上昇 $(p - p_{\text{motored}}) > 0$ がある場合はモータリング時（$p = p_{\text{motored}}$）よりも特性速度 $w$ および熱伝達率 $h_c$ が厳密に大きくなること．

---

### REQ-09：開サイクル熱力学第一法則（筒内圧力 $p$ の支配方程式）
質量流出入を伴う開系（Open System）の熱力学第一法則と理想気体の状態方程式から，筒内圧力 $p$ の時間微分方程式 $\frac{dp}{dt}$ を厳密に導出して解くこと．

#### 【数式導出と定義】
検査体積（シリンダ内空間）の総内部エネルギーを $U = m u(T)$ とすると，開系のエネルギー保存則（熱力学第一法則）は次式で表される：

$$\frac{dU}{dt} = -p \frac{dV}{dt} + \dot{Q}_{\text{comb}} - \dot{Q}_{\text{wall}} + \dot{H}_{\text{in}} - \dot{H}_{\text{ex}}$$

ここで，吸気弁を通じた流入エンタルピー流束 $\dot{H}_{\text{in}}$ $[\text{W}]$ と排気弁を通じた流出エンタルピー流束 $\dot{H}_{\text{ex}}$ $[\text{W}]$ は，各バルブの上流側温度 $T_{\text{up}}$ と上流側定圧比熱 $c_p(T_{\text{up}})$ を用いて次式で定義される：

$$\dot{H}_{\text{in}} = \begin{cases} \dot{m}_{\text{in}} c_p(T_{\text{in}}) T_{\text{in}} & (\dot{m}_{\text{in}} \ge 0 \text{ : 吸気流入}) \\ \dot{m}_{\text{in}} c_p(T) T & (\dot{m}_{\text{in}} < 0 \text{ : 吸気吹き返し}) \end{cases}$$

$$\dot{H}_{\text{ex}} = \begin{cases} \dot{m}_{\text{ex}} c_p(T) T & (\dot{m}_{\text{ex}} \ge 0 \text{ : 排気流出}) \\ \dot{m}_{\text{ex}} c_p(T_{\text{ex}}) T_{\text{ex}} & (\dot{m}_{\text{ex}} < 0 \text{ : 排気逆流}) \end{cases}$$

一方，左辺の $\frac{dU}{dt}$ を展開すると，比内部エネルギーの変化が $du = c_v(T) dT$ であることから，

$$\frac{dU}{dt} = u(T) \frac{dm}{dt} + m c_v(T) \frac{dT}{dt} \approx c_v(T) T \frac{dm}{dt} + m c_v(T) \frac{dT}{dt}$$

また，理想気体の状態方程式 $p V = m R T$ の両辺を時間 $t$ で微分すると，

$$p \frac{dV}{dt} + V \frac{dp}{dt} = R T \frac{dm}{dt} + m R \frac{dT}{dt} \implies m \frac{dT}{dt} = \frac{1}{R} \left( p \frac{dV}{dt} + V \frac{dp}{dt} - R T \frac{dm}{dt} \right)$$

これを $\frac{dU}{dt}$ の式へ代入し，$\frac{c_v(T)}{R} = \frac{1}{\gamma(T) - 1}$ を用いると，

$$c_v(T) T \frac{dm}{dt} + \frac{1}{\gamma(T) - 1} \left( p \frac{dV}{dt} + V \frac{dp}{dt} - R T \frac{dm}{dt} \right) = -p \frac{dV}{dt} + \dot{Q}_{\text{comb}} - \dot{Q}_{\text{wall}} + \dot{H}_{\text{in}} - \dot{H}_{\text{ex}}$$

$\frac{dV}{dt} = \frac{dV}{d\theta} \omega$ および $c_v(T) - \frac{R}{\gamma(T) - 1} = 0$ を用いて $\frac{dp}{dt}$ について整理すると，求める筒内圧力の支配方程式が得られる：

$$\frac{dp}{dt} = -\gamma(T) \frac{p}{V} \frac{dV}{d\theta} \omega + \frac{\gamma(T) - 1}{V} \left( \dot{Q}_{\text{comb}} - \dot{Q}_{\text{wall}} + \dot{H}_{\text{in}} - \dot{H}_{\text{ex}} \right)$$

（※ 注：$u(T) = c_v(T) T$ の基準点選び方によらず，$c_v(T) - \frac{R}{\gamma(T)-1} = 0$ が恒等的に成り立つため，$\frac{dm}{dt}$ の陽な項はエンタルピー流束 $\dot{H}_{\text{in}} - \dot{H}_{\text{ex}}$ の中に完全に吸収される．実際，筒内からの純粋な流出 $\dot{m}_{\text{out}} = -\frac{dm}{dt} > 0$ のとき，$\dot{H}_{\text{out}} = \dot{m}_{\text{out}} c_p(T) T = \dot{m}_{\text{out}} \frac{\gamma R}{\gamma - 1} T$ となり，第2項は $\frac{\gamma - 1}{V} \left( -\dot{m}_{\text{out}} \frac{\gamma R T}{\gamma - 1} \right) = \frac{\gamma p}{m} \frac{dm}{dt}$ となって断熱膨張関係式 $\frac{dp}{p} + \gamma \frac{dV}{V} - \gamma \frac{dm}{m} = 0$ と厳密に一致する）．

* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Chapter 14, pp. 750-755](https://www.accessengineeringlibrary.com/content/book/9781260116106)
* **対応テスト `TEST-09`（断熱閉サイクル可逆性・ポリトロープ関係検証）**：
  1. バルブ閉鎖（$\dot{m}_{\text{in}} = \dot{m}_{\text{ex}} = 0$），無燃焼（$\dot{Q}_{\text{comb}} = 0$），断熱（$\dot{Q}_{\text{wall}} = 0$），定比熱比 $\gamma_0 = 1.35$ の閉サイクルにおいて，下死点 $\tilde{\theta} = \pi$（初期圧 $p(\pi) = 100\ \text{kPa}$）から上死点 $\tilde{\theta} = 2\pi$ まで数値積分した際の最高圧力が，断熱圧縮の解析解 $p(2\pi) = p(\pi) \varepsilon^{\gamma_0}$ と相対誤差 $10^{-5}$ 以内で一致すること．
  2. さらに $\tilde{\theta} = 3\pi$（膨張下死点）まで積分した際，$p(3\pi) = p(\pi)$ へ相対誤差 $10^{-5}$ 以内で可逆的に戻り，1往復の図示仕事 $\int_{\pi}^{3\pi} p\,dV$ が $0$ となること．

---

### REQ-10：クランク軸・フライホイール回転運動とスターター（セルモーター）モデル
クランク軸・フライホイール系の慣性モーメント $I$ $[\text{kg}\cdot\text{m}^2]$（動力計の慣性 $I_{\text{dyno}}$ を加えた $I_{\text{tot}}$ で扱う） に対する角運動量保存則を連立し，セルモーターによるクランキング始動から完爆（ワンウェイクラッチ離脱）・自力運転・エンストまでの角速度変動 $\omega(t)$ を再現すること（比較用に定常角速度 $\omega = \text{const.}$ モードへの切り替えも可能とすること）．

#### 【数式導出と定義】
大気圧（クランクケース背圧）を $p_{\text{atm}}$ $[\text{Pa}]$（REQ-05の可変パラメータ，既定 $101.3\ \text{kPa}$）とすると，筒内ガス圧力がピストン・コンロッドを介してクランク軸に及ぼす瞬時図示トルク $T_{\text{ind}}(\theta)$ $[\text{N}\cdot\text{m}]$ は，仮想仕事の原理 $T_{\text{ind}}\,d\theta = (p - p_{\text{atm}})\,dV$ より次式で与えられる：

$$T_{\text{ind}}(\theta) = \left( p(\theta) - p_{\text{atm}} \right) \frac{dV}{d\theta}$$

スターターモーター（セルモーター）はワンウェイクラッチ（Overrunning Clutch）を介してクランク軸を駆動する．スターター作動フラグが ON かつ完爆判定フラグ $\text{isFired} = \text{false}$ のとき，ストールトルク $T_{\text{stall}}$ $[\text{N}\cdot\text{m}]$ と無負荷角速度 $\omega_{\text{no-load}} = \frac{\pi N_{\text{no-load}}}{30}$ $[\text{rad/s}]$ を持つDCモーター線形特性に従う駆動トルク $T_{\text{starter}}(\omega)$ を発生する：

$$T_{\text{starter}}(\omega) = \begin{cases} T_{\text{stall}} \max\left( 0, \ 1 - \frac{\omega}{\omega_{\text{no-load}}} \right) & (\text{starterActive} \land \neg\text{isFired}) \\ 0 & (\text{otherwise}) \end{cases}$$

サイクル平均回転数 $\bar{N}$ が完爆判定閾値 $N_{\text{fire}}$（デフォルト $550\ \text{rpm}$）を超えた瞬間にワンウェイクラッチが自動離脱し，$\text{isFired} = \text{true},\ \text{starterActive} = \text{false}$ へ遷移する．
摩擦損失は Chen–Flynn 型の摩擦平均有効圧で与える．直前の完了サイクルの筒内最高圧を $p_{\max}$（初期値 $p_{\text{atm}}$），平均ピストン速度を $\bar{S}_p = \frac{S\omega}{\pi}$ として

$$\text{FMEP}(\omega) = F_0 + F_1\,p_{\max} + F_2\,\bar{S}_p, \quad T_f(\omega) = \frac{\text{FMEP}\cdot V_d}{4\pi} \quad (\omega > 0)$$

$F_0 = 13.7\ \text{kPa}$，$F_1 = 0.005$，$F_2 = 16.2\ \text{kPa}\cdot\text{s/m}$（原論文の $0.137\ \text{bar}$，$0.005$，$0.162\ \text{bar}\cdot\text{s/m}$ を kPa へ換算）．$p_{\max}$ はサイクル完了時に更新し，サイクル内では一定とする．動力計の吸収トルクを $T_{\text{dyno}}$（REQ-11，運転モードにより変化），軸系の総慣性を $I_{\text{tot}} = I + I_{\text{dyno}}$ とすると，クランク軸角速度 $\omega$ の運動方程式は次式となる：

$$I_{\text{tot}} \frac{d\omega}{dt} = T_{\text{ind}}(\theta) + T_{\text{starter}}(\omega) - T_f(\omega) - T_{\text{aux}} - T_{\text{dyno}}(\omega)$$

**補機の負荷（第16版で追加）**：オルタネータ・ウォーターポンプ・オイルポンプなどの補機が吸収するトルクを，一定値 $T_{\text{aux}}$ $[\text{N·m}]$ で与える（$\omega > 0$ のとき．設定「運転」ページの「補機負荷トルク」，$0$〜$20\ \text{N·m}$，刻み $0.1$，既定 $2.0\ \text{N·m}$，即時項目）．平均有効圧に直すと $\text{AMEP} = \frac{4\pi T_{\text{aux}}}{V_d}$（既定諸元で約 $50\ \text{kPa}$）．回転数依存は無視する（実機のポンプ類はおおむね回転数に比例して増えるので，近似である）．既定値は，無負荷アイドルの吸気管圧が実機の典型に近づくように選んだ（試作：$T_{\text{aux}} = 0, 1, 2, 3, 4\ \text{N·m}$ でアイドルの $p_{\text{in}} = 18.9, 21.5, 23.9, 25.4, 27.3\ \text{kPa}$，全開の最大トルク $43.0, 42.0, 41.0, 40.0, 39.0\ \text{N·m}$）．

（ただし逆転防止のため，$\omega \le 0$ かつ右辺 $< 0$ のときは $\omega = 0, \frac{d\omega}{dt} = 0$ とする）．

* **出典**：[U. Kiencke and L. Nielsen, *Automotive Control Systems: For Engine, Driveline, and Vehicle*, 2nd Ed., Springer (2005), Chapter 6](https://doi.org/10.1007/b137654)
* **出典（摩擦）**：[S. K. Chen and P. F. Flynn, "Development of a Single Cylinder Compression Ignition Research Engine", SAE Technical Paper 650733 (1965)](https://doi.org/10.4271/650733)
* **対応テスト `TEST-10`（始動・摩擦）**：
  1. [A] $\text{FMEP}(p_{\max} = 5000\ \text{kPa},\ 3000\ \text{rpm}) = 13.7 + 25 + 16.2 \times 8.6 = 178.02\ \text{kPa}$ と相対誤差 $10^{-12}$ で一致する．
  2. [S] 無燃焼クランキング $5\ \text{s}$ 後のサイクル平均角速度が，$T_f = a + b\,\omega$（$a = (F_0 + F_1 p_{\max})\frac{V_d}{4\pi}$，$b = F_2 \frac{S}{\pi}\frac{V_d}{4\pi}$）とした平衡値 $\omega_{\text{eq}} = \frac{T_{\text{stall}} - a}{T_{\text{stall}}/\omega_{\text{no-load}} + b}$ の $\pm 15\%$ 以内にある（差はポンピング損失）．無燃焼では完爆判定されない．
  3. [S] S1：$3\ \text{s}$ 以内に完爆判定し，完爆後 $T_{\text{starter}} = 0$，全状態量が有限．
  4. [S] S3 の定常サイクルで $W_f = \text{FMEP}\cdot V_d$（$W_f = \oint T_f\,d\theta$）が相対誤差 $10^{-12}$ で成立する．

---

### REQ-11：水ブレーキ式エンジンダイナモメータ（負荷装置）モデルと運転モード
エンジンに負荷を与え，軸トルク（ブレーキトルク）・正味出力・BMEPを評価するための水ブレーキ式動力計を実装すること．動力計は**吸収専用**（負トルク・モータリングは扱わない）とし，運転モードは次の2つに限定する．

* **画面上の名称（第14版，第15版で設定の選択肢を短縮）**：画面では「モードA／B」と書かず，モードAを「スロットル制御」，モードBを「動力計制御」と呼ぶ（機関断面図の表示，制御状態カード）．設定では項目名「回転数の制御」，選択肢「スロットル」「動力計」とする．初見で意味が分かるように（利用者の指摘）．
* **モードA（ISC：スロットル制御）**：スロットル開度 $\alpha$ をECUのPI制御（REQ-12）が操作して $N_{\text{target}}$ に追従させる．動力計の充水率指令は運転者設定の一定値 $f_{\text{manual}}$（既定 $0$：無負荷）とし，負荷は外乱として作用する．
* **モードB（動力計 speed モード）**：スロットル開度は運転者設定の一定値 $\alpha_{\text{manual}}$ とし，動力計の充水率指令を速度PI制御で操作して $N_{\text{target}}$ に保持する．定常点でのトルク・出力・BMEP・bsfc の取得に用いる．

2つの閉ループが同時に回転数を制御して競合しないよう，**モードA・Bは排他**とする．完爆前（クランキング中）は両モードとも $f_{\text{cmd}} = 0$，$\alpha = \alpha_{\text{crank}}$ とする．

#### 【数式導出と定義】
**1. 吸収トルク特性**：水ブレーキは，ロータが水を撹拌・加速するときの運動量交換により回転を制動する．このときの吸収トルクは回転数の2乗に比例し，ケーシング内の水量（充水率）にほぼ比例すると近似する．実効充水率を $f_{\text{eff}} \in [0, 1]$，比例定数を $k_w$ $[\text{N}\cdot\text{m}\cdot\text{s}^2]$ とすると，
   $$T_{\text{dyno}}(\omega) = f_{\text{eff}} \, k_w \, \omega^2 \ \ge 0$$
   $k_w$ は定格吸収トルク $T_{\text{rated}}$ $[\text{N}\cdot\text{m}]$（既定 $35$）と定格回転数 $N_{\text{rated}}$ $[\text{rpm}]$（既定 $1500$）から $k_w = T_{\text{rated}} / \omega_{\text{rated}}^2$，$\omega_{\text{rated}} = \frac{\pi N_{\text{rated}}}{30}$ で定める（既定値で $k_w \approx 1.42 \times 10^{-3}\ \text{N}\cdot\text{m}\cdot\text{s}^2$）．ゆえに最大吸収トルクは $T_{\max}(\omega) = k_w\omega^2$，最大吸収動力は $k_w\omega^3$ であり，**低回転ほど吸収容量が急減する**（既定値で $800\ \text{rpm}$：$9.9\ \text{N}\cdot\text{m}$（$0.83\ \text{kW}$），$1500\ \text{rpm}$：$35\ \text{N}\cdot\text{m}$，$3000\ \text{rpm}$：$140\ \text{N}\cdot\text{m}$）．ゆえにモードBの定常試験点は $T_b(\alpha, N) \le k_w \omega^2$ を満たす必要がある．

**2. 充水応答（一次遅れ）**：充水率指令 $f_{\text{cmd}} \in [0, 1]$ に対し，
   $$\tau_d \frac{d f_{\text{eff}}}{dt} = f_{\text{cmd}} - f_{\text{eff}}$$
   $\tau_d$：充水応答時定数 $[\text{s}]$（既定 $0.3$）．$f_{\text{eff}}$ は状態ベクトル $\mathbf{y}$ には含めず，ECU内部状態と同様に各積分ステップ末で更新する．$\Delta t \ll \tau_d$ のため，1ステップ内（RK4の各段）では $f_{\text{eff}}$ を一定（零次ホールド）とし，更新には指数形 $f_{\text{eff}} \leftarrow f_{\text{cmd}} + (f_{\text{eff}} - f_{\text{cmd}}) e^{-\Delta t / \tau_d}$ を用いる（$\Delta t$ に依らず厳密）．

**3. 軸系慣性**：動力計ロータ・カップリングの慣性 $I_{\text{dyno}}$ $[\text{kg}\cdot\text{m}^2]$（既定 $0.05$）を加え，REQ-10の運動方程式の慣性を $I_{\text{tot}} = I + I_{\text{dyno}}$ とする．軸のねじり剛性は剛体とみなして無視する．

**4. モードBの速度PI制御**：回転数偏差を $e_d(t) = \bar{N}(t) - N_{\text{target}}$（回転数が目標を超えたとき正で，充水を増やす向き），比例ゲインを $K_{p,d}$ $[1/\text{rpm}]$，積分ゲインを $K_{i,d}$ $[1/(\text{rpm}\cdot\text{s})]$，基準充水率を $f_{\text{base}}$（既定 $0$）として，
   $$f_{\text{cmd}}(t) = \text{clamp}\left( f_{\text{base}} + K_{p,d}\, e_d(t) + I_f(t),\ 0,\ 1 \right)$$
   $$\frac{dI_f}{dt} = \begin{cases} 0 & (\text{飽和中で，かつ } e_d \text{ が飽和を深める向き}) \\ K_{i,d}\, e_d(t) & (\text{それ以外}) \end{cases}$$
   モードA・B切替時は，指令が連続になるよう積分状態を再初期化する（A→B：$\alpha_{\text{manual}} \leftarrow \alpha$，$I_f = f_{\text{cmd}} - f_{\text{base}} - K_{p,d} e_d$．B→A：$f_{\text{manual}} \leftarrow f_{\text{cmd}}$，$I_\alpha = \alpha - \alpha_{\text{base}} - K_p e_N$）．完爆時は $I_f = 0$ とする（回転数が目標より低い間は $f_{\text{cmd}} = 0$ のままで，目標に届く前に負荷を掛けない．完爆時刻の偏差で積分を初期化すると，完爆回転数を目標とするかのように早期に負荷が掛かるため採用しない）．
   * 既定値（S4 で $1500 \pm 10\ \text{rpm}$ への整定を確認済み）：$K_{p,d} = 0.001\ \text{/rpm}$，$K_{i,d} = 0.002\ \text{/(rpm}\cdot\text{s)}$．$T_{\text{dyno}} \propto \omega^2$ の非線形性による低回転での感度低下に対するゲインスケジューリングは，本版では行わない．

**5. 容量超過判定**：$f_{\text{cmd}} = 1$ に飽和したまま $\bar{N} > N_{\text{target}} + 100\ \text{rpm}$ が $2\ \text{s}$ 継続したとき `OVERLOAD`（動力計容量不足），$f_{\text{cmd}} = 0$ に飽和したまま $\bar{N} < N_{\text{target}} - 100\ \text{rpm}$ が $2\ \text{s}$ 継続したとき `UNDERPOWER`（エンジン出力不足）をUIに表示する．

**6. 軸トルクと動力計吸収トルクの関係**：瞬時の軸トルクを $T_b^{\text{inst}}(t) = T_{\text{ind}}(\theta) - T_f(\omega)$（$T_{\text{ind}}$ はREQ-10のとおりポンピング仕事を含む）とすると，REQ-10の運動方程式（完爆後）は
   $$I_{\text{tot}} \frac{d\omega}{dt} = T_b^{\text{inst}} - T_{\text{dyno}}$$
   となる．定常状態ではサイクル平均で $\overline{T_b} = \overline{T_{\text{dyno}}}$ が成立する．軸トルク $T_b$ のサイクル平均値と，これから導く性能指標の定義はREQ-14に従う．

**7. 容量設計条件と回転数安定性（設計根拠）**：
   * 定常の動力収支は $\eta_{\text{net}} P_f = T_f\,\omega + f\,k_w\,\omega^3$ である．ここから目標回転数 $\omega_t$ を保持するのに必要な充水率は $f^* = \dfrac{\eta_{\text{net}} P_f - T_f\,\omega_t}{k_w\omega_t^3}$ であり，$f^* > 1$ となる点は保持不能（`OVERLOAD`）である．
   * 設計条件：試験回転数範囲の下限 $N_{\min}$ で必要な軸トルク最大値 $T_{b,\max}(N_{\min})$ に対し $k_w \ge T_{b,\max}(N_{\min}) / \omega_{\min}^2$ を満たすこと．この条件から，全開（実装検証値 $T_b \approx 41\ \text{N}\cdot\text{m}$）を保持できる最低回転数は $N_{\min,\text{WOT}} = \frac{30}{\pi}\sqrt{T_b / k_w}$ であり，既定値で約 $1630\ \text{rpm}$ である（S5 の平衡回転数と一致）（旧既定 $50\ \text{N}\cdot\text{m}$@$3000\ \text{rpm}$ では約 $2400\ \text{rpm}$ で不足）．
   * 安定性：$\partial T_{\text{dyno}} / \partial\omega = 2 f k_w \omega > 0$ は回転数に対する負帰還であり，充水率を固定しても暴走しない．開ループ時定数は $\tau_\omega \approx I_{\text{tot}} / (\partial T_f/\partial\omega + 2 T_{\text{dyno}} / \omega)$（$3000\ \text{rpm}$・$31.8\ \text{N}\cdot\text{m}$ で約 $0.7\ \text{s}$）．回転数超過は，$f_{\text{cmd}} = 1$ に飽和して容量が不足した場合にのみ生じる．
* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Chapter 2](https://www.accessengineeringlibrary.com/content/book/9781260116106)（ブレーキトルク・BMEP）．水ブレーキの特性は G. Martyr and M. Plint, *Engine Testing: Theory and Practice*, Elsevier（動力計の章．版・ページは要確認）．
* **対応テスト `TEST-11`（水ブレーキ動力計・運転モード）**：
  1. [A] $T_{\text{dyno}}(1, \omega_{\text{rated}}) = T_{\text{rated}}$，$T(2\omega)/T(\omega) = 4$，$T_{\text{dyno}}(1,\ 800\ \text{rpm}) = 9.9\ \text{N}\cdot\text{m}$（$1\%$），ソルバ内の $T_{\text{dyno}} = f_{\text{eff}} k_w \omega^2$（$f_{\text{eff}} = 0.5$，相対誤差 $10^{-12}$）．
  2. [A] $f_{\text{cmd}}$ を $0 \to 1$ にステップさせたとき $t = \tau_d$ で $f_{\text{eff}} = 1 - e^{-1}$（相対誤差 $10^{-9}$）．刻み $10^{-4}\ \text{s}$ と $3 \times 10^{-3}\ \text{s}$ の両方で成立する．
  3. [S] S3（モードA，$f_{\text{manual}} = 0.3$）：直近10サイクル平均で $T_b$ と $T_{\text{dyno}}$ の相対差が $2\%$ 以内．$f_{\text{cmd}} = f_{\text{manual}}$ で一定．
  4. [S] S4（モードB）：最後の $5\ \text{s}$ で $\bar{N}$ の平均が $1500 \pm 10\ \text{rpm}$，瞬時値が $\pm 25\ \text{rpm}$，$0 < f_{\text{cmd}} < 1$，$\alpha = \alpha_{\text{manual}}$ で一定．
  5. [S] S6：$f_{\text{cmd}} = 0$ に飽和して `UNDERPOWER` が点灯し，飽和中（$5\ \text{s} \to 10\ \text{s}$）に $|I_f|$ が増えない．目標を $1400\ \text{rpm}$ へ戻すと $5\ \text{s}$ 以内に $f_{\text{cmd}} > 0$ となり，$8\ \text{s}$ 後に $1400 \pm 50\ \text{rpm}$ にある．
  6. [S] S4b：$p_{\text{atm}} = 80\ \text{kPa}$ の定常軸トルクが S4 より小さい．
  7. [S] S5：$f_{\text{cmd}} = 1$ に飽和し `OVERLOAD` が点灯する．

---

### REQ-12：ECU制御ロジック（スロットル開度による目標回転数PI制御：運転モードA）
完爆後のアイドリングおよび目標回転数追従を，電子制御スロットルの**開度 $\alpha$** を操作量とするPI制御器で実現すること（運転モードA）．吸気管圧 $p_{\text{in}}$ は制御器が直接指令する量ではなく，REQ-05のスロットル・マニホールド動特性を経て結果として定まる状態変数である．点火時期は運転者設定値（Manual）とする．モードBではこのPIを無効とし，$\alpha = \alpha_{\text{manual}}$ に固定する（REQ-11）．

#### 【数式導出と定義】
**1. 制御量・操作量・目標値**：制御量は移動平均した実回転数 $\bar{N}$ $[\text{rpm}]$，操作量はスロットル開度 $\alpha$ $[\text{rad}]$（UI表示は $\text{deg}$），目標値は $N_{\text{target}}$ $[\text{rpm}]$ である．$\bar{N}$ は1次遅れ平均 $\frac{d\bar{N}}{dt} = \frac{N - \bar{N}}{\tau_N}$（$N = \frac{30}{\pi}\omega$，$\tau_N$ 既定 $0.15\ \text{s}$）で与える．$\bar{N}$ と積分状態 $I_\alpha$ はECU内部状態であり，状態ベクトル $\mathbf{y}$ には含めずソルバの各ステップ末で更新する．

**2. アンチワインドアップ付きPI制御器**：回転数偏差を $e_N(t) = N_{\text{target}} - \bar{N}(t)$，比例ゲインを $K_p$ $[\text{rad/rpm}]$，積分ゲインを $K_i$ $[\text{rad/(rpm}\cdot\text{s)}]$，基準開度を $\alpha_{\text{base}}$ $[\text{rad}]$ として，
   $$\alpha(t) = \text{clamp}\left( \alpha_{\text{base}} + K_p e_N(t) + I_\alpha(t),\ \alpha_{\min},\ \alpha_{\max} \right)$$
   $$\frac{dI_\alpha}{dt} = \begin{cases} 0 & \left(\text{飽和中で，かつ } e_N \text{ が飽和を深める向き}\right) \\ K_i e_N(t) & (\text{それ以外}) \end{cases}$$
   $\alpha_{\min} = 0$（全閉．空気は $A_{\text{leak}}$ から供給される），$\alpha_{\max} = \pi/2$（全開）とする．スロットルアクチュエータの応答遅れは本版では非モデル化（$\alpha$ は指令値に即時追従する理想アクチュエータ）とする．
   * 既定値（第5版で再調整）：$\alpha_{\text{base}} = 3^\circ$，$K_p = 0.008\ \text{deg/rpm}$（第12版で $0.005$ から変更：吸気ランナと弁諸元の変更で応答が遅くなり，TEST-12 の 1200 rpm への整定が $\pm 38\ \text{rpm}$ になったため．$K_p = 0.003$〜$0.010$，$K_i = 0.003$〜$0.008$ を試し，$K_p = 0.008$，$K_i = 0.004$ でアイドル $\pm 4.6$，1200 rpm $\pm 6.0$，大気圧 80 kPa $\pm 7.8\ \text{rpm}$ と最良だった），$K_i = 0.004\ \text{deg/(rpm}\cdot\text{s)}$，$\alpha_{\max} = 90^\circ$（設定可）．摩擦を Chen–Flynn 型へ変えて無負荷時の減衰が小さくなったため，旧値 $0.01/0.02$ では $\pm 60\ \text{rpm}$ の持続振動となった．全閉付近は $A_{\text{th}} \propto 1 - \cos\alpha$ によりゲインが開度に比例して増えるので，低ゲインとした．

**3. 運転モードごとの開度**：
   * 完爆前（$\text{isFired} = \text{false}$，クランキング中）：$\alpha = \alpha_{\text{crank}}$（既定 $6^\circ$，設定可）．
   * 完爆後・モードA：上記のPI制御．完爆へ移行する時刻に $I_\alpha = 0$ とする（開度は $\alpha_{\text{base}} + K_p e_N$ から始まる．開度を連続にする初期化は，始動時の吹け上がりからの収束を遅らせるため採用しない）．
   * 完爆後・モードB：$\alpha = \alpha_{\text{manual}}$（運転者設定値）．このとき $I_\alpha$ は更新しない．モードBからAへ切り替える際は，開度が連続になるよう $I_\alpha = \alpha_{\text{manual}} - \alpha_{\text{base}} - K_p e_N$ と再初期化する．
* **出典**：[L. Guzzella and C. H. Onder, *Introduction to Modeling and Control of Internal Combustion Engine Systems*, 2nd Ed., Springer (2010), Chapter 4](https://doi.org/10.1007/978-3-642-10775-7)
**4. 点火時期の自動最適化（MBT 制御，第6版で追加）**：
   * **目的**：点火時期を，図示仕事が最大となる時期（MBT：Minimum advance for Best Torque）へ自動で合わせる．ノッキングは考慮しない（本モデルにノック判定は無い）．設定「燃焼」に `[点火時期の自動最適化 OFF／ON]`（既定 ON）を置き，ON のときの点火時期の設定値は初期値として使う．
   * **方式（CA50 フィードバック）**：各サイクルの燃焼開始角 $\theta_0$ と燃焼期間 $\Delta\theta_b$（REQ-07）から，質量燃焼割合 $50\%$ の時期を
     $$\theta_{50} = \theta_0 + \Delta\theta_b \left(\frac{\ln 2}{a}\right)^{1/(m+1)}$$
     （$x_b = 1 - e^{-a z^{m+1}} = 0.5$ を $z$ について解いた値，$a = 5$，$m = 2$）として求め，上死点後の角度 $\text{CA50} = \theta_{50} - 360^\circ$ を目標 $\text{CA50}^* = 10^\circ\ \text{ATDC}$ に合わせる：
     $$s_{j+1} = s_j + k_s\,(\text{CA50}_j - \text{CA50}^*), \quad k_s = 0.6$$
     $s_j$ は第 $j$ サイクルの点火進角 [°BTDC]．CA50 が目標より遅ければ進角する．完爆前は $s = $ 設定値．
   * **目標値の根拠**：MBT では CA50 がおよそ ATDC $8$〜$10^\circ$ にある（Heywood, *Internal Combustion Engine Fundamentals*, 1988, Sec. 9.2.2）．本モデルで点火時期を掃引した結果，IMEP 最大の CA50 は $1500\ \text{rpm}$・開度 $15^\circ$ で ATDC $11.7^\circ$，$1500\ \text{rpm}$ 全開で $13.2^\circ$，$3000\ \text{rpm}$ 全開で $7.9^\circ$ であり，目標 $10^\circ$ での IMEP 低下は3条件とも $0.43\%$ 以内だった．
   * **方式の比較**：IMEP そのものを探索する極値探索（摂動を与えて勾配を推定）は，最適点付近の IMEP の曲率が小さく（$4^\circ$ ずらして $0.5\%$ 程度），アイドルのサイクル変動（COV $1.5\%$）に勾配推定が埋もれるため採用しない．
   * **制約なし（第7版で変更）**：点火時期には上下限を設けない（設定・自動とも）．点火の判定はクランク角 $4\pi$ の剰余で行うので，どの値でも計算は破綻しない．
   * **表示（第7版で追加）**：自動最適化が ON のとき，設定「燃焼」の点火時期の行は現在の自動値を毎フレーム表示し（小数1桁，項目名に「（自動）」），$[-]$ $[+]$ は無効にする．ON から OFF に切り替えた瞬間（完爆後）は，その時点の自動値を $1^\circ$ に丸めて手動値に引き継ぎ，点火時期を連続に保つ．

* **対応テスト `TEST-12`（ECU スロットルPI制御）**：
  1. [S] S2：最後の $3\ \text{s}$ で $|\bar{N} - 800| \le 25\ \text{rpm}$，かつ $\alpha > 0$（下限に張り付かない）．
  2. [S] N1200（S2 の定常から $N_{\text{target}} = 1200$，$8\ \text{s}$）：最後の $2\ \text{s}$ で $\pm 25\ \text{rpm}$．
  3. [S] S7（S2 の定常から $p_{\text{atm}} = 80\ \text{kPa}$，$10\ \text{s}$）：$800 \pm 25\ \text{rpm}$ を保ち，定常開度が S2 より大きい．
  4. [S] AMAX（S2 の定常から $N_{\text{target}} = 2000$，$\alpha_{\max} = 5^\circ$，$8\ \text{s}$．第16版で $3^\circ$ から変更：理想スロットルと補機負荷により，$3^\circ$ ではアイドルも保てず失火するため）：$\alpha = \alpha_{\max}$ に張り付き，$4\ \text{s} \to 8\ \text{s}$ で $I_\alpha$ が増えない．
  5. [S] S4（モードB）：最後の $10\ \text{s}$ で $I_\alpha$ が更新されない．

  6. [S]（MBT）S4 の定常（自動最適化 ON）で，最後の $2\ \text{s}$ の CA50 が ATDC $10 \pm 0.5^\circ$．
  7. [S]（MBT）S4 の定常から，自動最適化を OFF にして点火時期を自動値 $s^*$ の $\pm 4^\circ$，$\pm 8^\circ$ に固定した各 $2\ \text{s}$ の IMEP の最大値に対し，自動値での IMEP が $99\%$ 以上．
  8. [A]（MBT）$\theta_{50}$ の式が，Wiebe 関数 $x_b(\theta_{50}) = 0.5$ を満たす（相対誤差 $10^{-12}$）．自動最適化 OFF では点火時期が設定値に一致する．

---

### REQ-13：数値積分ソルバ（RK4固定刻み ＆ RK45 Dormand-Prince適応ステップ）
状態ベクトル $\frac{d\mathbf{y}}{dt} = \mathbf{f}(t, \mathbf{y})$ の数値積分スキームとして，4次古典的Runge-Kutta法（RK4）と5(4)次Dormand-Prince法（RK45・適応ステップ制御）の両方を実装し，UIからリアルタイムに切り替え可能とすること．**既定は DOPRI5(4)**（第6版で変更．相対許容誤差 $10^{-5}$，最大刻み $0.5^\circ\text{CA}$）．UI では RK45 ではなく `DOPRI5(4)` と表示する．最大刻みを $1^\circ\text{CA}$ に緩めるとアイドルで約2.6倍速くなるが，最高圧を刻み点でしか拾えないため $p_{\max}$ が RK4（$0.25^\circ$）と $0.55\%$ ずれて TEST-13 の許容 $0.3\%$ を超える．したがって $0.5^\circ\text{CA}$ のままとする（開発機での実時間比：アイドル $8.4\times$，$3000\ \text{rpm}$ 全開 $3.9\times$．スマートフォンの $1\times$ 再生で高回転時に実時間より遅れる場合がある）．

#### 【数式導出と定義】
1. **4次古典的Runge-Kutta法（RK4）**：
   指定されたクランク角刻み $\Delta\theta_{\text{step}}$（デフォルト $0.5^\circ\ \text{CA}$）から時間刻み $\Delta t = \frac{\Delta\theta_{\text{step}}}{\max(\omega, \omega_{\min})}$ を決定し，4段の勾配ベクトル $\mathbf{k}_1, \mathbf{k}_2, \mathbf{k}_3, \mathbf{k}_4$ により更新する：
   $$\mathbf{k}_1 = \mathbf{f}(t_n, \mathbf{y}_n), \quad \mathbf{k}_2 = \mathbf{f}\left(t_n + \frac{\Delta t}{2}, \mathbf{y}_n + \frac{\Delta t}{2}\mathbf{k}_1\right)$$
   $$\mathbf{k}_3 = \mathbf{f}\left(t_n + \frac{\Delta t}{2}, \mathbf{y}_n + \frac{\Delta t}{2}\mathbf{k}_2\right), \quad \mathbf{k}_4 = \mathbf{f}(t_n + \Delta t, \mathbf{y}_n + \Delta t\,\mathbf{k}_3)$$
   $$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{\Delta t}{6} (\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$
2. **5(4)次Dormand-Prince法（DOPRI5 / RK45）**：
   ノード係数 $c = (0, \frac{1}{5}, \frac{3}{10}, \frac{4}{5}, \frac{8}{9}, 1, 1)$，5次解重み $b_5 = (\frac{35}{384}, 0, \frac{500}{1113}, \frac{125}{192}, -\frac{2187}{6784}, \frac{11}{84}, 0)$，4次埋め込み解重み $b_4 = (\frac{5179}{57600}, 0, \frac{7571}{16695}, \frac{393}{640}, -\frac{92097}{339200}, \frac{187}{2100}, \frac{1}{40})$ を用いて5次近似解 $\mathbf{y}_5$ と4次近似解 $\mathbf{y}_4$ を算出し，スケール化された最大ノルム誤差 $E = \max_i \frac{|y_{5,i} - y_{4,i}|}{\text{atol}_i + \text{rtol} \cdot \max(|y_{n,i}|, |y_{5,i}|)}$ を評価する．$E \le 1$ ならステップを受理し，次ステップ幅を $\Delta t_{\text{next}} = \Delta t \cdot \min\left(2.5, \max\left(0.2, 0.9 E^{-1/5}\right)\right)$ で自動調整する．

* **出典**：[J. R. Dormand and P. J. Prince, "A family of embedded Runge-Kutta formulae", *Journal of Computational and Applied Mathematics*, Vol. 6, No. 1, pp. 19-26 (1980)](https://doi.org/10.1016/0771-050X(80)90013-3)
* **対応テスト `TEST-13`（数値積分）**：
  1. [A] 調和振動子 $\dot{y} = (y_2, -y_1)$ を $t = 1$ まで RK4 で積分したとき，刻みを半分にすると大域誤差が $1/16$（比が $14$〜$18$）になる．
  2. [A] DOPRI5 の1ステップ誤差が刻み半減で $1/64$（比 $50$〜$80$），埋め込み誤差推定 $|y_5 - y_4|$ が $1/32$（比 $26$〜$38$）になる．
  3. [S] S3 の定常状態から，RK4（$\Delta\theta = 0.25^\circ$），RK45（$\text{rtol} = 10^{-5}$，最大刻み $0.5^\circ\text{CA}$），参照解 RK4（$\Delta\theta = 0.05^\circ$）でそれぞれ完全な1サイクルを積分し，RK4（$0.25^\circ$）と RK45 の $p_{\max}$ がそれぞれ参照解と相対差 $0.3\%$ 未満，RK4（$0.25^\circ$）と RK45 の $W_{i,\text{net}}$ の相対差が $0.3\%$ 未満．（第12版で変更：旧版は $p_{\max}$ も2つを直接比べていた．吸気ランナを入れると両者の誤差が逆符号に出て（RK4 $+0.17\%$，RK45 $-0.17\%$．参照解は $\Delta\theta = 0.10^\circ$ と $0.05^\circ$ で $0.004\%$ 以内に収束），直接の差 $0.32\%$ が判定値を超えたため，各々を参照解と比べる形にした．）

---

### REQ-14：パフォーマンス・メトリクス集計と基準サイクル比較
1サイクル（$720^\circ\ \text{CA}$）完了ごとに以下の性能指標を台形則積分で正確に更新し，さらに1サイクル全波形を**基準サイクル**として保存し，重ね描き比較できること（保存の規則と表示は REQ-18 D）．

* **表示規則（値の有効性）**：各メトリクスは，完爆後に完了したサイクルの値のみを表示する．クランキング中・停止中・初回サイクル完了前，および定義の分母が $0$ 以下となる場合は「–」を表示する．$\eta_v$，$\eta_i$，$\eta_m$，$\eta_b$ は $[0, 1.5]$ の外の値を表示しない（「–」とする）．

#### 【数式導出と定義】
* **正味図示仕事 $W_{i,\text{net}}$・圧縮膨張図示仕事 $W_{i,\text{gross}}$・ポンピング仕事 $W_{\text{pump}}$**：
  $$W_{i,\text{net}} = \oint_{0}^{4\pi} p(\tilde{\theta}) \frac{dV}{d\theta}\,d\tilde{\theta}, \quad W_{i,\text{gross}} = \int_{\pi}^{3\pi} p(\tilde{\theta}) \frac{dV}{d\theta}\,d\tilde{\theta}, \quad W_{\text{pump}} = W_{i,\text{net}} - W_{i,\text{gross}}$$
* **図示平均有効圧（$\text{IMEP}_{\text{net}}$, $\text{IMEP}_{\text{gross}}$, $\text{PMEP}$）**：
  $$\text{IMEP}_{\text{net}} = \frac{W_{i,\text{net}}}{V_d}, \quad \text{IMEP}_{\text{gross}} = \frac{W_{i,\text{gross}}}{V_d}, \quad \text{PMEP} = \frac{W_{\text{pump}}}{V_d}$$
* **図示熱効率 $\eta_{i,\text{net}}$ と図示出力 $P_i$ $[\text{W}]$**：
  $$\eta_{i,\text{net}} = \frac{W_{i,\text{net}}}{m_f\, Q_{\text{LHV}}}, \quad P_i = \frac{W_{i,\text{net}} \bar{N}}{120}$$
  （第8版で修正：旧版は分母を実際の発熱 $Q_{\text{in}}$ としていたため，燃え残りや燃焼効率の損失が効率に現れなかった．燃料転換効率の定義（Heywood, 1988, Eq. 2.23）に合わせ，分母を供給燃料の発熱量とする．）
* **吸気管の既燃ガス分率の表示（第11版で追加）**：メトリクス2ページ目の `f_cmd`（充水率の指令値．制御状態カード（REQ-22）にも表示される）を，1サイクル平均の $\bar{Y}_{b,\text{in}}$（表記 `Yb,in`，小数3桁，無次元）に替える（1ページ12項目の枠を保つため）．内部 EGR のうち，吸気側へ吹き返して戻る分の大きさを示す．
* **10 サイクル平均（第16版で追加）**：サイクルごとに求める指標（IMEP，PMEP，$\eta_i$，$P_i$，$\eta_v$，$x_r$，$p_{\max}$，$T_{\max}$，$\dot m_f$，$T_b$，$P_b$，BMEP，FMEP，$\eta_m$，bsfc，$\eta_b$，$Y_{b,\text{in}}$）は，完爆後の直近 $10$ サイクル（$10$ サイクルに満たないときは完爆後の全サイクル）の算術平均を表示する．燃焼のサイクル変動で表示がばらつくため（利用者の指摘）．瞬時値である $\bar N$，$T_w$，$\alpha$，$p_{\text{in}}$，$T_{\text{dyno}}$，$f_{\text{eff}}$，点火時期は現在値のままとする．コールドリセット，停止，完爆の解除で平均をやり直す．
* **補機の負荷（第16版）**：$\text{BMEP} = \text{IMEP}_{\text{net}} - \text{FMEP} - \text{AMEP}$，$T_b = \frac{W_{i,\text{net}} - W_f - W_{\text{aux}}}{4\pi}$（$W_{\text{aux}} = \oint T_{\text{aux}}\,d\theta$）とする．
* **メトリクスの日本語名（第13版で追加，第15版で項目ごとの切替に変更）**：既定では記号だけを示す．**項目をタップすると，その項目だけが日本語名に切り替わり，もう一度タップすると記号に戻る．何度でも切り替えられ，ほかの項目は変わらない**（利用者の指示「IMEP をタッチしたらその日本語，日本語をタッチしたら IMEP」．第14版は欄全体を一括で切り替えており，意図と違った）．日本語名が長いときは2行に折り返す（文字 $11\ \text{px}$）．タップの判定は各項目の枠内とする．**値は描画フレームごとに更新されるが，項目の要素は作り直さず文字だけを書き換える**（第17版．要素を毎フレーム作り直すと，指を置いた要素が離す前に DOM から外れ，タッチの暗黙のポインタキャプチャにより `pointerup` が外れた要素に届いて親へ伝わらず，実機でタップが効かなかった）．名称は次のとおり．
  * 1ページ目：平均回転数 $\bar N$，図示平均有効圧 IMEP，ポンプ損失平均有効圧 PMEP，図示熱効率 $\eta_i$，図示出力 $P_i$，体積効率 $\eta_v$，残留ガス率 $x_r$，最高筒内圧 $p_{\max}$，最高ガス温度 $T_{\max}$，壁温 $T_w$，スロットル開度 $\alpha$，吸気管圧 $p_{\text{in}}$
  * 2ページ目：燃料流量 $\dot m_f$，軸トルク $T_b$，軸出力 $P_b$，正味平均有効圧 BMEP，摩擦平均有効圧 FMEP，機械効率 $\eta_m$，正味燃料消費率 bsfc，正味熱効率 $\eta_b$，動力計トルク $T_{\text{dyno}}$，実効充水率 $f_{\text{eff}}$，吸気管既燃率 $Y_{b,\text{in}}$，点火時期（値に `°BTDC` を付ける）
* **燃料流量の表示（第8版で追加）**：メトリクス2ページ目の先頭を $N_{\text{target}}$（制御状態カードと重複）から燃料流量 $\dot{m}_f$ [g/s] に替える．
* **体積効率 $\eta_v$（大気基準および吸気管基準）**：
  $$\eta_{v,\text{atm}} = \frac{m_{\text{air,trapped}}}{\rho_{\text{atm}} V_d} \quad \left(\rho_{\text{atm}} = \frac{p_{\text{atm}}}{R T_{\text{amb}}},\ p_{\text{atm}} \text{ は設定中の現在値}\right)$$
  $$\eta_{v,\text{man}} = \frac{m_{\text{air,trapped}}}{\rho_{\text{in}} V_d} \quad \left(\rho_{\text{in}} = \frac{p_{\text{in}}(\text{IVC})}{R T_{\text{in}}}\right)$$

* **軸トルク・正味出力・BMEP・機械効率・bsfc**：1サイクルの摩擦仕事を $W_f = \oint T_f\,d\theta$，所要時間を $t_c$ として，
  $$\text{FMEP} = \frac{W_f}{V_d}, \quad \text{BMEP} = \text{IMEP}_{\text{net}} - \text{FMEP}, \quad T_b = \frac{W_{i,\text{net}} - W_f}{4\pi}, \quad P_b = \frac{W_{i,\text{net}} - W_f}{t_c}, \quad \eta_m = \frac{\text{BMEP}}{\text{IMEP}_{\text{net}}}$$
  （$T_b$ はクランク角平均，$P_b$ は時間平均の厳密値であり，$P_b = \text{BMEP}\cdot V_d / t_c$ が恒等的に成立する）．1サイクルの燃料質量を $m_f = \frac{\phi\, m_{\text{air,trapped}}}{\text{AFR}_{st}}$（$\text{AFR}_{st} = 14.7$），燃料流量を $\dot{m}_f = m_f / t_c$，低位発熱量を $H_u = 44\ \text{MJ/kg}$ として，
  $$\text{bsfc} = \frac{\dot{m}_f}{P_b}\ [\text{g/kWh}], \quad \eta_b = \frac{P_b}{\dot{m}_f H_u}$$
  $P_b \le 0$ のとき bsfc，$\eta_b$ は未定義として「–」を表示する．ポンピング損失（PMEP）は $\text{IMEP}_{\text{net}}$ に含まれ，FMEP には含めない．

* **対応テスト `TEST-14`（メトリクス）**：S3（モードA負荷）と S4（モードB）の定常サイクルについて，
  1. [S] $\text{IMEP}_{\text{net}} \cdot V_d = W_{i,\text{net}}$，$\text{PMEP}\cdot V_d = W_{i,\text{net}} - W_{i,\text{gross}}$（相対誤差 $10^{-12}$）．
  2. [S] $\text{BMEP} = \text{IMEP}_{\text{net}} - \text{FMEP} - \text{AMEP}$（第16版），$P_b = \text{BMEP}\cdot V_d / t_c$（相対誤差 $10^{-9}$）．$0 < \eta_m < 1$，$\text{bsfc} > 0$ かつ有限．
  3. [S]（理論上限）直近5サイクルで $P_i \le \eta_{\text{Otto}}\,\dot{m}_f H_u$，$\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$．
  4. [S]（動力収支）直近5サイクル平均で $|W_{i,\text{net}} - W_f - W_{\text{aux}} - W_{\text{dyno}}| / W_{i,\text{net}} \le 2\%$（$W_{\text{dyno}} = \oint T_{\text{dyno}}\,d\theta$．第16版で $W_{\text{aux}}$ を追加）．
  5. [S] 基準サイクルを保存した後，点火時期と開度を変えて $1\ \text{s}$ 積分しても，保存済み配列が書き換わらない（ディープコピー）．
  6. [S]（表示規則）S1 の全期間（$0.05\ \text{s}$ ごと）で，完爆前の IMEP・効率類の表示が「–」であり，$\eta$ 類の表示が $[0, 1.5]$ の外に出ず，`NaN`・`Infinity` を表示しない．

  7. [S]（第8版）$\eta_{i,\text{net}} = W_{i,\text{net}} / (m_f Q_{\text{LHV}})$ が相対誤差 $10^{-12}$ で成立し，$\phi = 1.2$ の $\eta_{i,\text{net}}$ が $\phi = 1.0$ より $10\%$ 以上低い（モードB，開度固定）．
  9. [S]（10 サイクル平均，第16版）S3 の定常で，表示用の各指標が直近 $10$ サイクルの値の算術平均と相対誤差 $10^{-12}$ で一致する．コールドリセット直後は表示が「–」に戻り，完爆後 $3$ サイクルの時点では $3$ サイクルの平均である．

---

### REQ-15：画面構成・スマートフォン操作要件（1画面固定・上部タブ・即時反映）
単一HTMLを，画面最上部に固定した6つのトップタブで切り替えるページ構成とし（第12版で追加したタブを第13版で「性能曲線」と命名），スマートフォン（縦持ち）でスクロールなしに全機能を操作できること．

#### A. 対象環境（主対象）
1. 端末：Samsung Galaxy S26+（6.7 inch，縦横比 $19.5:9$，適応型リフレッシュレート $1\text{–}120\ \text{Hz}$）．ブラウザ：Android版 Google Chrome（最新安定版）．
2. 基準ビューポートは **$360 \times 640\ \text{CSS px}$（最小）〜 $412 \times 915\ \text{CSS px}$**（縦持ち）とし，この範囲で破綻しないこと．横持ち・PC幅は動作を妨げないが，本版の受入対象外とする（1.1節）．

#### B. 画面構成原則
1. **上部トップタブ**：画面最上部に高さ $48\ \text{px}$ のタブバーを固定し，「**運転**」「**線図**」「**性能曲線**」「**設定**」「**検証**」「**解説**」の6タブを等幅で常時表示する（$360\ \text{px}$ 幅で1タブ $60\ \text{px}$ となり，$44\ \text{px}$ 以上を満たす）．切り替えはタップのみ．切り替えてもシミュレーションは中断せず，各タブのサブページ選択状態と「解説」の縦スクロール位置を保持する．
2. **1画面固定（No-scroll）原則**：「解説」を除く全タブ・全サブページは，ページ全体も内部コンテナも縦横にスクロールしない．収まらない項目はサブページまたはページ送り（◀ ▶）へ分割する．高さは `100dvh` 基準とし，`overscroll-behavior: none` を指定する．
3. `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`，`color-scheme: light dark`，`text-size-adjust: 100%` を指定する．

#### C. 各タブの内容
1. **運転**：
   * 目標回転数スライダ（REQ-23）：機関断面図の下端に重ねて表示する．
   * 機関断面図（REQ-19）．高さは残り領域に追従し，最小 $140\ \text{px}$．
   * 操作ボタン：`[START]`，`[FUEL CUT]`，`[RESET 長押し]`（コールドリセット）．ボタンの文字は1行に収める．
   * 再生速度の離散ボタン（$0.02\times,\ 0.1\times,\ 0.5\times,\ 1\times$）と，同じ行にメトリクスのページ切替ボタンと `[音ON/音OFF]`（REQ-21）．
   * 回転数の制御方式（「スロットル制御」／「動力計制御」，REQ-11）と `OVERLOAD`／`UNDERPOWER`／`VALVE HIT`（REQ-03）の表示．
   * 制御状態カード（REQ-22）：機関断面図と操作ボタンの間に4行で表示する．
   * メトリクス（2列 $\times$ 6行，2ページ，第15版で記述を更新）：ページ1：$\bar{N}$, $\text{IMEP}_{\text{net}}$, $\text{PMEP}$, $\eta_i$, $P_i$, $\eta_v$, $x_r$, $p_{\max}$, $T_{\max}$, $T_w$, $\alpha$, $p_{\text{in}}$．ページ2：$\dot m_f$, $T_b$, $P_b$, $\text{BMEP}$, $\text{FMEP}$, $\eta_m$, $\text{bsfc}$, $\eta_b$, $T_{\text{dyno}}$, $f_{\text{eff}}$, $Y_{b,\text{in}}$, 点火時期（° BTDC）．各項目は既定で記号を示し，**その項目をタップするとその項目だけが日本語名に切り替わり，もう一度タップすると記号に戻る**（何度でも．REQ-14）．
2. **線図**：上部のセグメントボタン（1行，文字は折り返さない）で次の7画面を切り替える．すべてのグラフは REQ-17（軸・目盛・自動レンジ）に従う．
   * ① $p$-$V$ 線図（Linear／$\log$-$\log$ 切替，基準サイクル重ね描き）　② $p$-$\theta$：$p(\theta)$，$T(\theta)$，熱発生率（ボタン名 `p-θ`）　③ バルブリフトと弁質量流量　④ 筒内質量内訳，$p_{\text{in}}(\theta)$，$\dot{m}_{\text{th}}(\theta)$　⑤ トルク内訳，$N(\theta)$，$v_p(\theta)$　⑥ ECUトレンド（$\bar{N}$ と $N_{\text{target}}$，$\alpha$，$p_{\text{in}}$，$T_w$）　⑦ 動力計トレンド（$\bar{N}$ と $N_{\text{target}}$，$T_b$ と $T_{\text{dyno}}$，$f_{\text{cmd}}$ と $f_{\text{eff}}$）
2′. **性能曲線**：REQ-26 に従う（全開・回転数固定の計測と，4 種類のグラフ）．
3. **設定**：REQ-18 に従う．
4. **検証**：「全テスト実行」ボタン，進捗表示，総合結果（PASS $n$/26），26個の結果チップ（7列），選択中テストの詳細カード（検証項目・理論値または基準・実測値・誤差・PASS/FAIL），項目送り ◀ ▶．選択中のチップは枠で明示する．詳細は REQ-20．
5. **解説**：REQ-16 に従う（唯一，縦スクロールを許可するタブ）．

#### D. 誤操作防止
1. **スライダの制限**：`<input type="range">` はいかなる入力にも用いない．値の変更はボタン（ステッパー，選択ボタン）で行う．**唯一の例外**として，運転タブの目標回転数スライダ（REQ-23）を，誤操作対策付きの独自実装で設ける（第9版，利用者の要望）．
2. **編集ロックは設けない**（ボタン操作は誤って触れても1刻みしか変わらず，直後に元へ戻せるため）．代わりに REQ-18 の「元に戻す」と変更通知で保護する．
3. **タップ判定**：押下から離すまでの移動量が $8\ \text{CSS px}$ 未満かつ接触時間が $500\ \text{ms}$ 未満の `pointerup` のみをタップとして受理する．**接触幅（`PointerEvent.width`）による棄却は行わない**（端末依存で正当なタップを棄却するおそれがあり，実機で検証できないため廃止）．
4. **破壊的操作の保護**：`[COLD RESET]` は長押し（$0.6\ \text{s}$）でのみ実行する．コールドリセットを伴う設定（REQ-18 の「要リセット」項目）は「適用」ボタンで確定する．
5. 隣接する操作要素の間隔は $4\ \text{px}$ 以上，操作要素は $44 \times 44\ \text{CSS px}$ 以上，`touch-action: manipulation` を指定する．

#### E. グラフのタッチ操作
グラフ上のタップで，その横位置の値を読み取るクロスヘアと数値を表示する（再タップで消去）．ピンチズーム・パンは設けない（表示範囲は REQ-17 の自動レンジのみで決まる）．

#### F. 描画品質と性能
1. Canvas の内部解像度は常に $\text{CSS サイズ} \times \min(\text{devicePixelRatio},\ 2.5)$ と一致させる．**描画のたびに一致を確認し，不一致なら再設定する**（レイアウト確定前に測った寸法が残り，図が歪む・前の絵が消え残る不具合の再発防止）．毎フレーム，ビットマップ全面を消去してから描く．
2. 描画は $60\ \text{fps}$ に間引く．シミュレーションの時間進行は `performance.now()` の実経過時間から算出し，リフレッシュレートに依存しない．1フレームの積分に使う時間は $9\ \text{ms}$ を上限とする．
3. `visibilitychange` でバックグラウンドへ移行した際は積分と描画を止め，復帰時に巨大な $\Delta t$ を発生させない．

#### G. 可読性
圧力は Pa 系の単位（既定は $\text{kPa}$）で表示し，$\text{bar}$ は表示しない（第13版）．本文最小フォントは $12\ \text{px}$，数値は等幅数字，ダーク／ライト配色は `prefers-color-scheme` に追従する．ボタンの文字は折り返さない．**端末のフォントの差を見込み，ボタンの文字幅はボタンの利用可能幅（内寸から左右の余白を除いた幅）の $95\%$ 以下とする**（第15版．実機の Galaxy で，ヘッドレス Chromium では収まっていたタブ名「性能曲線」と設定の選択肢「スロットル制御」が，フォントの違いで僅かにはみ出し，TEST-15・26 が FAIL したため）．タブの文字は $13\ \text{px}$ とし，タブのボタンの左右余白は $0$ とする（第16版．実機で「性能曲線」が利用可能幅の $95\%$ ちょうどになり，TEST-15 項目8 が FAIL したため）．

* **対応テスト `TEST-15`（画面構成・操作）**　実行区分は REQ-20 の定義による．
  1. [U] 「解説」以外の5タブを順に表示し，全タブ・全サブページ（線図7画面，性能曲線4表示，設定の全ページ，検証，運転のメトリクス2ページ）で，ルート要素と全コンテナが `scrollHeight <= clientHeight` かつ `scrollWidth <= clientWidth` を満たす（現在のビューポートで判定）．
  2. [U] 表示中の全ボタンの `getBoundingClientRect()` が $44 \times 44\ \text{px}$ 以上で，互いに重ならず，ビューポート内にある．ボタンの文字が折り返していない（高さが1行分）．
  3. [U] DOM に `input[type="range"]` が存在しない．全表示テキストに `bar` を含まない（第13版で `MPa` の禁止を解除）．
  4. [U] 合成 Pointer Events で，(a) 移動量 $\ge 8\ \text{px}$ または接触 $\ge 500\ \text{ms}$ の入力はタップとして扱われない，(b) 接触幅 $100\ \text{px}$ のタップも受理される，(c) `[COLD RESET]` は単押しで無効・$0.6\ \text{s}$ 長押しで有効，(d) 検証タブの26チップすべてがタップで選択でき，詳細カードの見出しが選択したテスト番号になる．
  5. [U] 2つの Canvas について，ビットマップ寸法が $\text{CSS サイズ} \times \min(\text{dpr}, 2.5)$（四捨五入）と一致する．タブ切替を10回繰り返した後も一致する．
  6. [A] フレーム間隔を $8.3\ \text{ms}$ と $16.7\ \text{ms}$ に模擬したとき，同一の実経過時間 $2\ \text{s}$ に対するシミュレーション時間の進みの差が $1\%$ 未満である．hidden → visible を模擬した直後の1フレームで進む時間が $50\ \text{ms}\times$再生速度 以下である．
  7. [D] ヘッドレス Chromium で $360 \times 640$，$384 \times 780$，$412 \times 915$ の3ビューポートについて項目1・2を実行し，全タブのスクリーンショットを目視確認する．
  8. [U]（第15版）表示中の全ボタンについて，文字幅（`Range.getBoundingClientRect` で測る）が利用可能幅の $95\%$ 以下．

---

### REQ-16：解説タブ（支配方程式ドキュメント）
「解説」タブに，本システムが解いている連立常微分方程式とその構成式を，式変形の途中過程を含めて読めるドキュメントとして表示すること．これは**スクロールを許可する唯一のタブ**である（縦スクロールのみ）．

1. **章立て**（REQ-01〜REQ-14，REQ-21 に対応）：§16 エンジン音（REQ-21：音源，位相，排気管共鳴）を加える．§0 記号表（全記号の定義・単位・既定値）／§1 状態方程式系の全体像 $\dot{\mathbf{y}} = \mathbf{f}(\mathbf{y};\mathbf{u})$（7成分の各右辺をどのREQが与えるかの対応表）／§2 クランク運動学（REQ-01）／§3 作動流体の熱物性（REQ-02）／§4 バルブ有効開口面積（REQ-03）／§5 オリフィス流量（REQ-04）／§6 スロットルと吸気マニホールド（REQ-05）／§7 筒内組成追跡（REQ-06）／§8 燃焼（REQ-07）／§9 壁面熱伝達と壁温（REQ-08）／§10 筒内圧力方程式の導出（REQ-09，熱力学第一法則から $\frac{dp}{dt}$ まで）／§11 回転運動とスターター（REQ-10）／§12 水ブレーキ動力計と運転モードA・B（REQ-11，$T_{\text{dyno}} = f_{\text{eff}} k_w \omega^2$ と軸トルクの関係を含む）／§13 ECU制御（REQ-12）／§14 数値積分法（REQ-13）／§15 評価指標（REQ-14，$T_b$・BMEP・bsfc を含む）．
2. **各章の構成**：(a) 目的の一文，(b) 支配式（途中の式変形を含む），(c) 式中の**全記号の定義と単位**（未定義語を残さない），(d) 仮定と適用範囲，(e) 出典へのリンク（本書の各REQの出典と同一）．
3. **数式表示**：（第7版）Android の Chrome には OpenType MATH 表を持つ数式フォントが標準で無く，根号・分数・括弧の伸縮が代替フォントで崩れたため，**Latin Modern Math**（GUST e-foundry，GUST Font License）を解説で使う文字だけに絞って（約 $68\ \text{KB}$，MATH 表を保持）ページに埋め込み，全端末で同じ組版にする．組版規則：括弧の組は独立した行にまとめ，中身に分数・根号・上付き記号を含むときだけ伸縮させる．関数名（sin，cos，exp，ln，max など）の後に関数適用と細いすき間を置く．微分の d は立体．添字とべきが同じ記号に付くときは同時添字にする．上線（$\bar{N}$）は U+2015 を上に置く．絶対値の縦線は伸縮させない．並べた式は「，」の後に $1.2\ \text{em}$ あける．本文中の記号（$C_1$ など）も数式として組む．画面幅からはみ出す式は最小 $0.85$ 倍まで縮小し，それでもはみ出す式は2行に分ける．べき指数が括弧の組に掛かるときは，括弧を含む組全体を底とし，括弧が中身の高さに合わせて伸びること（第6版で修正：$r_c = (\cdots)^{\gamma/(\gamma-1)}$ で閉じ括弧だけに指数が付き，括弧の大きさが揃わなかった）．外部ライブラリを用いず，ブラウザ標準の MathML（Chrome 109以降で対応）で記述する．式は1画面幅に収まるよう適宜改行し，収まらない式のみ式ブロック内で横スクロール（`overflow-x: auto`）を許可する．ページ全体は横スクロールしない．
4. **ナビゲーション**：冒頭に目次（章へのジャンプ）を置き，「先頭へ戻る」ボタンを設ける（第13版で実装．第12版までは要件にあったが未実装で，テストも無かった）．目次は全章の見出しを並べ，タップでその章の見出しが解説タブの上端に来るよう縦スクロールする．「先頭へ戻る」は画面右下に常に表示する．他タブへ移動して戻っても縦スクロール位置を保持する．
4″. **方程式のまとめ（第13版で追加）**：§1 に，ソルバが時間積分している連立常微分方程式の全11式（$\theta, \omega, p, m, m_u, T_w, p_{\text{in}}, m_{b,\text{in}}, \dot m_r, p_p, m_{b,p}$ の時間微分）を，各式の詳細を述べる章の番号とともに並べる（利用者の要望「解いている方程式のまとめがほしい」）．
4‴. **長い数式・表の横スクロール（第13版）**：数式は縮小せず元の大きさで組み，画面幅を超える数式は式ごとに横スクロールできるようにする．記号表・設定項目表も表ごとに横スクロールできるようにする．ページ全体（解説タブ）は横にスクロールしない（利用者の指示「横スクロールも可，長い数式を許容」．第7版の「はみ出す式は縮小」をやめる）．
4′. **第11版の反映**：§1 の状態ベクトルを8成分（$m_{b,\text{in}}$ を追加）にし，吸気マニホールドの章に既燃ガス収支（REQ-05 4′），筒内組成の章に順流の組成 $(1 - Y_{b,\text{in}})$（REQ-06），燃焼の章に着火遅れの係数 $C_k$ と $\ell_{\text{kernel}} = 0.025 B$（REQ-07）を書く．新しい記号 $m_{b,\text{in}}, Y_{b,\text{in}}, Y_{\text{src}}, C_k$ を §0 記号表に加える（TEST-16 項目2で判定）．
5. **単一情報源**：本文中の数値定数・係数（Woschniの $C_1, C_2$，Wiebeの $a, m$，弁流量係数 $C_d$ など）と現在の設定値は，ソルバ内の定数・設定値から生成し，ドキュメント側へ重複してハードコードしない．選択中の比熱モデル・カムプロファイルに対応する式は強調表示する．
6. **可読性**：本文 $14\ \text{px}$ 以上，行間 $1.6$ 以上，見出しは階層化し，ライト／ダーク配色に追従する．ネットワーク接続なしで閲覧できること．
* **対応テスト `TEST-16`（解説ドキュメントの網羅性・整合性検証）**：
  1. 解説内の全 `<math>` 要素がエラー（`<merror>`）なく描画され，§0〜§16 がすべて存在すること（章に付けた `data-req` 属性が REQ-01〜REQ-14 を網羅していること）．
  2. 式中に現れる全識別子（`<mi>`）の集合が，§0 記号表の記号集合に含まれること（未定義記号が $0$ 個）．
  3. 解説に表示された係数値（$C_1, C_2$，Wiebe $a, m$，$C_d$ 等）がソルバ内定数と完全一致すること．
  4. 「解説」のみ縦スクロール可能で，他タブへ移動して戻った後のスクロール位置が $\pm 1\ \text{px}$ 以内で保持され，ページ全体の横スクロールが発生しないこと．
  5. 外部ネットワークへのリクエストが発生せず（本文中の出典リンクを除く），オフラインで全章が表示されること．
  6. [U]（数式の組版）全 `<math>` 要素の計算済み `display` が `block math` または `inline math` であること（CSS で `display: block` などに上書きすると MathML の子要素が縦に積まれて崩れるため，数式の横スクロールは外側の `div` で行う）．分数を含まない1行の式の高さが $3\ \text{em}$ 以下，全数式の幅が $1\ \text{em}$ 以上であること．
  7. [D] 解説タブ全体のスクリーンショットを取り，全章の数式を目視確認する．

  8. [U]（べき指数の掛かり方）全数式で，`<msup>` の底が閉じ括弧1文字だけ（`<mo>)</mo>`）になっているものが無い（括弧の組全体を底とする）．$\Psi$ の式が標準形 $\Psi = \sqrt{\frac{2\gamma}{\gamma-1}\left(r^{2/\gamma} - r^{(\gamma+1)/\gamma}\right)}$ で書かれ，根号が右辺全体に掛かる．

  9. [U]（第7版）数式フォント `LM Math` が読み込まれ（`document.fonts.check`），数式に適用されている．
  10. [U] 本文（段落・表）に生の下付き表記（`C_1` のような `X_y`）が残っていない．
  11. [U]（第13版で変更）全数式が縮小されずに組まれ（`font-size` の指定が無い），画面幅を超える数式の容器（`.mx`）と表の容器は計算済み `overflow-x` が `auto` で横スクロールでき，解説タブ全体は横にスクロールしない（`scrollWidth ≤ clientWidth`）．旧版の判定「全数式が画面幅に収まる」は，利用者の指示で長い数式を許容したため廃止した．
  12. [U]（目次，第13版）目次に §0〜§16 の全章があり，各項目のタップで対応する見出しの上端が解説タブの上端から $\pm 4\ \text{px}$ 以内に来る．「先頭へ戻る」のタップで縦スクロール位置が $0$ になる．
  13. [U]（方程式のまとめ，第13版）§1 に 11 個の時間微分の式があり，左辺が状態ベクトルの11成分の時間微分に一対一で対応する．

---

### REQ-17：グラフの軸・目盛・自動レンジ
「線図」タブ，「性能曲線」タブ（REQ-26）と設定画面の $p$-$V$ 図（REQ-18）のすべてのグラフに，軸線・目盛・目盛数値・軸名（単位付き）を表示する．表示範囲は**原則固定**とし，データが収まらない・小さすぎる場合に限り，あらかじめ決めた段階へ自動で切り替える．利用者が範囲を操作する手段は設けない．

#### A. 軸の表示
1. 各グラフは，プロット領域の左に縦軸，下に横軸を持ち，目盛線（薄色のグリッド），目盛数値，軸名を表示する．軸名は「量 [単位]」の形式（例：`p [kPa]`，`V [cm³]`，`θ [°CA]`，`t [s]`）とする．
2. 目盛間隔 $d$ は $\Lambda = \{1, 2, 5\} \times 10^k$（$k \in \mathbb{Z}$）から選び，目盛区間数が4〜8となるようにする．目盛数値は互いに重ならず，Canvas の外へはみ出さない．
3. 複数系列を描くグラフには凡例（系列名と色）をプロット領域内の隅に表示する．色だけに頼らず系列名を文字で示す．
4. 体積の表示単位は $\text{cm}^3$，クランク角は $^\circ\text{CA}$ とする．**クランク角の横軸は $0$〜$720^\circ$**（$0$ = 吸気上死点，$360$ = 圧縮上死点）を基本とし，**弁オーバーラップを見るグラフ（線図③「弁」とカム線図）だけ $360$〜$1080^\circ$**（$720$ = 吸気上死点）とする（第8版で変更．第6版は全グラフを $360$ 起点にしていた）．**線図②「$p$-$\theta$」の3グラフ（$p$，$T$，熱発生率）だけは圧縮・膨張行程を拡大するため $180$〜$540^\circ$**（$360$ = 圧縮上死点，目盛 $90^\circ$ ごと：$180, 270, 360, 450, 540$）とし，範囲外の点は描画領域で切り取る（第10版）．$\theta < 360^\circ$ のデータは $\theta + 720^\circ$ として配列ごと並べ替え，$1080 \to 360$ の折返しで線をつながない．目盛は $180^\circ$ ごと（$360, 540, 720, 900, 1080$）．

#### B. レンジの方式
各軸は次の4方式のいずれかを取る．フルスケールを $F$，評価窓（$\theta$ 系は直近の完了1サイクル，トレンド系は表示中の時間窓）でのデータの最大値を $M$（対称型では $\max|\cdot|$）とする．

1. **固定型**：範囲は定数．
2. **諸元連動型**：範囲は設定値から一意に決まる（例：$V$ 軸の上限は $(V_c + V_d)$ 以上で最小の目盛の倍数）．設定変更時にのみ変わる．
3. **段階型（0起点 $[0, F]$ または対称 $[-F, F]$）**：$F \in \Lambda$，$F_{\min} \le F \le F_{\max}$．
   * 拡大：$M > F$ となったら直ちに $F \leftarrow \min\{F' \in \Lambda : F' \ge 1.1 M\}$．
   * 縮小：$M < 0.4 F$ が実時間で $3\ \text{s}$ 連続したら $F \leftarrow \max(F_{\min},\ \min\{F' \in \Lambda : F' \ge 1.25 M\})$．
   * 安定性：縮小後は $M \le 0.8 F$ なので直後に拡大せず，拡大後の縮小先は $\min\{F' \ge 1.25M\} \ge \min\{F' \ge 1.1M\}$ で現在値以上となるから，$M$ が一定なら範囲は高々1回の変更で不動となる（ばたつかない）．
   * 既定値への復帰：COLD RESET と要リセット設定の適用時に $F$ を既定値 $F_0$ へ戻す．
4. **帯域型 $[a, b]$**（平均値まわりの小さな変動を見る量）：刻み $s \in \Lambda$（$s \ge s_{\min}$）に対し $a = s\lfloor m_-/s \rfloor$，$b = s\lceil m_+/s \rceil$（$m_\pm$ はデータの最小・最大に幅の $10\%$ の余裕を付けた値）．$s$ は区間数 $(b-a)/s$ が8以下となる最小の値とし，区間数が4未満なら下・上の順に $s$ ずつ広げて4にする（目盛は $s$ ごと）．データが $[a,b]$ を出たら直ちに，または占有率 $(M - m)/(b - a) < 0.25$ が $3\ \text{s}$ 連続したら再計算する．

#### C. 各軸の割当（既定値）
| グラフ | 軸 | 方式 | 既定 $F_0$／範囲 | $F_{\min}$〜$F_{\max}$ |
| :--- | :--- | :--- | :--- | :--- |
| ① $p$-$V$（Linear） | $V\ [\text{cm}^3]$ | 諸元連動 | $0$〜$(V_c{+}V_d)$ 以上の目盛倍数（既定 $600$） | – |
| ①② | $p\ [\text{kPa}]$（①②と設定画面で共有） | 段階・0起点 | $5000$ | $500$〜$50000$ |
| ① $p$-$V$（log-log） | $p$，$V$ | 段階（10の整数乗の区間） | $p$：$10$〜$10^4$，$V$：$V_c$，$V_c{+}V_d$ を含む最小の区間 | $p$ 上限 $10^5$ |
| ② | $T\ [\text{K}]$ | 段階・0起点 | $3000$ | $3000$〜$5000$ |
| ② | 熱発生率 $[\text{J}/^\circ\text{CA}]$ | 段階・0起点 | $100$ | $10$〜$1000$ |
| ③ | リフト $[\text{mm}]$ | 諸元連動 | $0$〜$L_{\max}$ 以上の目盛倍数（既定 $10$） | – |
| ③ | 弁質量流量 $[\text{g/s}]$ | 段階・対称 | $200$ | $20$〜$2000$ |
| ④ | 筒内質量 $[\text{mg}]$ | 段階・0起点 | $1000$ | $100$〜$5000$ |
| ④⑥ | $p_{\text{in}}\ [\text{kPa}]$ | 固定 | $0$〜$120$ | – |
| ④ | $\dot{m}_{\text{th}}\ [\text{g/s}]$ | 段階・0起点 | $20$ | $1$〜$100$ |
| ⑤ | トルク $[\text{N·m}]$ | 段階・対称 | $500$ | $50$〜$5000$ |
| ⑤ | $N(\theta)\ [\text{rpm}]$ | 帯域 | $s_{\min} = 10$ | – |
| ⑤ | $v_p\ [\text{m/s}]$ | 段階・対称 | $10$ | $5$〜$50$ |
| ⑥⑦ | 横軸 $t\ [\text{s}]$ | 固定 | 直近 $30\ \text{s}$（右端が現在，目盛 $5\ \text{s}$） | – |
| ⑥⑦ | $\bar{N}\ [\text{rpm}]$ | 段階・0起点 | $2000$ | $1000$〜$10000$ |
| ⑥ | $\alpha\ [^\circ]$ | 固定 | $0$〜$90$ | – |
| ⑥ | $T_w\ [\text{K}]$ | 帯域 | $s_{\min} = 10$ | – |
| ⑦ | $T_b$，$T_{\text{dyno}}\ [\text{N·m}]$ | 段階（負値があれば対称，なければ0起点） | $50$ | $10$〜$500$ |
| ⑦ | $f_{\text{cmd}}$，$f_{\text{eff}}$ | 固定 | $0$〜$1$ | – |

表の既定値は実装時に運転結果を見て見直してよいが，その場合は本表を先に更新する．

#### D. 範囲変更の見せ方
範囲が切り替わったときは，新しい目盛数値を $1\ \text{s}$ 間強調表示（アクセント色）して，切り替わったことが分かるようにする．切替は軸ごとに1秒あたり高々1回とする．目盛数値どうしが重なる場合は数値を間引く（目盛線は残す）．軸名は，縦軸をプロット領域の左上に横書きで，横軸を目盛数値の下に置く．

* **対応テスト `TEST-17`（軸・目盛・自動レンジ）**
  1. [A] 目盛生成：$F \in \{1,2,5,\dots,5000\}$ と $600$，$120$，$3000$，$720$ について，目盛間隔が $\Lambda$ の元で区間数が4〜8．諸元連動の上限が $555 \to 600$，$9 \to 10$．
  2. [A] 段階型の状態機械：(a) $F_0 = 5000$ で $M = 4500 \to 6500$ とすると直ちに $10000$ へ拡大，(b) $M = 1500$ を $2.9\ \text{s}$ 与えても不変で $3.0\ \text{s}$ で $2000$ へ縮小，(c) $M$ が $F$ の $\pm 5\%$ で振動する入力 $60\ \text{s}$ で変更1回以下，(d) $F_{\min}$，$F_{\max}$ を超えない，(e) リセットで $F_0$，(f) $M$ 一定（$1200$）を $20\ \text{s}$ 与えると変更はちょうど1回．
  3. [A] 帯域型：データ $[795, 805]$ に対し範囲がデータを含み，刻み $\ge s_{\min}$，区間数4〜8．データが範囲を出たら直ちに再計算される．
  4. [U] 7画面（①は Linear と log-log の両方）の全グラフ（計20）について，S3 の実データで計算したレイアウト情報（軸名・目盛数値・凡例の矩形一覧）を検査する：縦軸名と横軸名があり単位 `[...]` を含む，目盛数値が各軸3個以上，複数系列のグラフに凡例がある，全矩形が Canvas 内にあり互いに重ならない．
  5. [U] $p$-$V$ 図に既知の長方形サイクル（$V \in [100, 500]\ \text{cm}^3$，$p \in [1000, 4000]\ \text{kPa}$）を与え，4頂点の座標変換が目盛位置と $\pm 1\ \text{px}$ で一致し，実際に描画した4辺の中点に曲線の画素があり，長方形の中心には無い．
  6. [S] S2 の終端で $p$ 軸の $F$ が $M$ の $1$〜$3.2$ 倍にあり（第12版で下限を $1.25$ から $1$ に変更：縮小は $F \ge 1.25 M$ で行うが，縮小後に $M$ が増えても $F$ を超えない限り範囲は変えない規則なので，暖機に伴う $M$ の増加で比が $1.25$ を下回りうる．実装検証：$8.1\ \text{s}$ に $M = 782\ \text{kPa}$ で $F = 1000$ に縮小し，終端で $M = 851\ \text{kPa}$），直近 $5\ \text{s}$ で範囲変更が0回．

  7. [U]（クランク角軸，第8版）線図③とカム線図の横軸が $[360, 1080]$（目盛 $\{360, 540, 720, 900, 1080\}$），線図②の3グラフの横軸が $[180, 540]$（目盛 $\{180, 270, 360, 450, 540\}$，第10版），線図④⑤の横軸が $[0, 720]$（目盛 $\{0, 180, 360, 540, 720\}$）であり，各系列の横座標が単調増加（折返しの線が無い）であり，並べ替えた系列の $\theta = 720^\circ$ の値が元の配列の $\theta = 0$ の値と一致する．

---

### REQ-18：設定画面（ボタン操作・即時反映・$p$-$V$ による効果確認）
全パラメータをボタン操作のみで変更でき，運転中に変えてよい設定は押した瞬間に反映され，その効果を同じ画面の $p$-$V$ 線図で確認できること．

#### A. 項目の2分類
| 分類 | 対象 | 反映 |
| :--- | :--- | :--- |
| **即時項目** | 下記「要リセット項目」以外のすべて（点火時期，当量比，VVT位相，弁の基本タイミング・リフト・弁径，カム種，スロットル・マニホールド諸元，大気圧，Woschni係数，比熱モデル，ECU・動力計の全設定，運転モード，目標回転数，ソルバ設定） | ボタンを押した時点の積分ステップ境界で反映する．状態 $\mathbf{y}$ は連続のまま保つ． |
| **要リセット項目** | $B$，$S$，$l$，$\varepsilon$（$V(\theta)$ が不連続に変わり，$p, m$ と整合しなくなるため） | 保留値として強調表示し，「適用」で確定してコールドリセットする．「破棄」で保留を捨てる． |

#### B. 項目の表示と入力
1. 1項目は1行（高さ $46\ \text{px}$，ボタンは $44\ \text{px}$）：項目名（単位付き），現在値，`[−]` `[+]`．2〜3値の選択項目（運転モード A/B，比熱モデル，カム種，ソルバ）は，数値ではなく**名前付きの選択ボタン**で表示する（`0/1` のような符号化を画面に出さない）．
2. **表示値の規則**：表示値 $=$ 内部値（SI）$\div$ 単位係数．単位係数は項目定義の1か所だけで持ち，表示と入力の両方がそれを使う（表示だけ逆に掛ける誤りの防止．例：$p_{\text{atm}}$ の内部値 $101325\ \text{Pa}$ は `101.3 kPa` と表示する）．
3. 刻み：1タップ＝1刻み．行の下の `[刻み ×1 / ×10]` ボタンで刻みを10倍にできる．長押しリピートは設けない．範囲端ではボタンを無効表示にする．
4. **範囲**：各項目は下限・上限・刻み・既定値を持つ．主な範囲：$B, S \in [40, 150]\ \text{mm}$，$l \in [60, 300]\ \text{mm}$（ただし $\lambda = r/l \le 0.5$ を満たすこと．満たさない組合せは「適用」を無効にし理由を表示），$\varepsilon \in [1.1, 100]$（刻み $0.1$）．**目標回転数 $N_{\text{target}}$ は上限を設けない**（第6版で変更．下限 $500\ \text{rpm}$，刻み $50\ \text{rpm}$．`[+]` は常に有効）．**圧縮比は $\varepsilon > 1$ であれば受け付ける**（$V_c = V_d/(\varepsilon - 1)$ より $\varepsilon \le 1$ は幾何学的に定義できないため，下限を $1.1$ とする）．$p_{\text{atm}} \in [60, 110]\ \text{kPa}$．その他の項目の範囲は実装内の項目定義表を唯一の情報源とし，解説タブ §0 に同じ表を自動生成して掲載する．
5. **変更通知と取り消し**：変更のたびに「項目名：旧値 → 新値」を1行表示する．`[元に戻す]` で直前の1変更を取り消す．`[既定値]` で表示中ページの全項目を既定値へ戻す（要リセット項目は保留値として）．

#### C. ページ構成
1. ページ選択は1行のページ送り `◀ ［ページ名 k/n］ ▶` とし，中央のページ名をタップすると全ページの一覧（大きなボタン）が開いて直接移動できる．
2. ページ（各6項目以内）：**機関**（$B, S, l, \varepsilon$；$\lambda$，$V_d$，$V_c$ を導出値として表示）／**VVT・カム**（吸気位相 $\varphi_{\text{in}}$，排気位相 $\varphi_{\text{ex}}$，カム種，最大リフト，吸気弁径）／**弁タイミング**（基本 IVO，IVC，EVO，EVC）／**吸気**（$p_{\text{atm}}$，$D_{\text{th}}$，$A_{\text{leak}}$，$V_{\text{in}}$）／**燃焼**（点火時期，点火の自動最適化，サイクル変動，$\phi$，Woschni係数，比熱モデル）／**燃焼速度**（着火遅れ係数 $c_d$，燃焼速度係数 $c_b$，Wiebe 形状係数 $m_w$．第8版で追加）／**運転**（運転モード，$N_{\text{target}}$，$\alpha_{\text{manual}}$，$f_{\text{manual}}$，$f_{\text{base}}$）／**ECU**（$\tau_N$，$\alpha_{\text{crank}}$，$\alpha_{\text{base}}$，$K_p$，$K_i$，$\alpha_{\max}$）／**動力計**（$T_{\text{rated}}$，$N_{\text{rated}}$，$\tau_d$，$I_{\text{dyno}}$，$K_{pd}$，$K_{id}$）／**解法**（ソルバ種別，$\Delta\theta_{\text{step}}$，rtol）．

#### D. 設定画面の効果確認パネル（$p$-$V$ 図／カム線図）
0. **カム線図（第6版で追加）**：「VVT・カム」と「弁タイミング」のページでは，$p$-$V$ 図の代わりに**カム線図**を表示する．横軸はクランク角 $360$〜$1080^\circ$（REQ-17），縦軸はリフト [mm]（$0$〜$L_{\max}$ 以上の目盛倍数）．描く系列は，吸気・排気の現在のリフト曲線（VVT 位相を含む有効値），変更前の基準（灰色，$p$-$V$ の基準サイクルと同じ $3\ \text{s}$ 規則で保存），ピストン冠面までの余裕 $h_c + x(\theta)$（弁がこれを超えると `VALVE HIT`）．パネル上の1行に，有効な IVO・IVC・EVO・EVC とオーバーラップ角 $\text{EVC} - (\text{IVO} + 720^\circ)$ を表示する．
1. 「機関」「VVT・カム」「弁タイミング」以外のページの下部に，$p$-$V$ 線図（Linear，REQ-17 の軸・自動レンジ，$p$ 軸は線図タブと共有）を表示する．高さは残り領域に追従し，$360 \times 640$ で $120\ \text{px}$ 以上．
2. **基準サイクルの重ね描き**：現在のサイクル（直近の完了1サイクル，アクセント色）と**基準サイクル**（灰色）を重ねる．基準サイクルは次の規則で決まる．
   * 即時項目を変更したとき，直前の変更から $3\ \text{s}$ 以上経っていれば，変更直前に完了していた1サイクルを基準サイクルとして保存する（ディープコピー）．$3\ \text{s}$ 未満の連続操作では基準を更新しない（連打しても，連打を始める前との比較が残る）．
   * `[基準を現在に]` ボタンで，現在のサイクルを基準にできる．COLD RESET と要リセット項目の適用で基準は消える．
3. **差分の数値表示**：パネル内に「$\text{IMEP}_{\text{net}}$：現在値（基準比 $\pm\Delta$）」「$p_{\max}$：現在値（$\pm\Delta$）」「$\bar{N}$」を1〜2行で表示する．基準が無いときは現在値のみ．
4. 機関が停止中でサイクルが無いときは「運転タブで START してください」と表示する．
5. 線図タブの ① $p$-$V$ も同じ基準サイクルを重ね描きする（従来の「スナップショット」機能は基準サイクルへ統合する）．

* **対応テスト `TEST-18`（設定）**
  1. [A] 項目定義表の全項目について：既定の表示値が $[\min, \max]$ 内にあり刻みの格子上にある．表示値 $\times$ 単位係数が内部既定値と相対誤差 $10^{-12}$ で一致する．$p_{\text{atm}}$ の既定表示が `101.3`（$\pm 0.05$）である．
  2. [A] 全数値項目について，`[+]` を1回，`[−]` を1回押すと内部値が元の値へ相対誤差 $10^{-12}$ で戻る．上限で `[+]`，下限で `[−]` を押しても範囲を出ない．×10 刻みでも同様．
  3. [U] 即時項目（点火時期）の `[+]` を押した同一フレーム内に，ソルバの入力値が変わる．要リセット項目（$\varepsilon$）の `[+]` ではソルバの値は変わらず保留表示になり，「適用」で変わってコールドリセットされ，「破棄」で保留が消える．
  4. [A] $\varepsilon = 1.1,\ 2,\ 10,\ 40,\ 100$ を設定し，初期角速度 $200\ \text{rad/s}$ からスターターを掛けて最大2サイクル（または $2\ \text{s}$）積分し，クランクが回り，$V(\pi)/V(0) = \varepsilon$（相対誤差 $10^{-12}$）かつ状態量が有限である（高圧縮比では圧縮トルクがスターターを上回り停止することがあるため，完走は要求しない）．$\lambda > 0.5$ となる $(S, l)$ の組合せでは「適用」が無効になる．
  5. [U] 選択項目（運転モードなど）が名前付きボタンで表示され，画面の文字列に `0:`・`1:` のような符号化表記を含まない．
  6. [S] シナリオ S2 の定常から点火時期を $+10^\circ$（進角）変更：基準サイクルが保存され，その内容は変更後 $5\ \text{s}$ 積分しても不変（ディープコピー），現在サイクルの $p_{\max}$ が基準と $1\%$ 以上異なり，パネルの $\Delta$ 表示が（現在値 $-$ 基準値）と一致する．$1\ \text{s}$ 間隔で3回続けて変更しても基準は最初の1回分のままで，$3\ \text{s}$ 以上あけた変更では更新される．
  7. [U] 「機関」以外の全ページで $p$-$V$ パネルが表示され，高さ $120\ \text{px}$ 以上，REQ-17 の軸要素（軸名・目盛数値）を持つ．`[元に戻す]` が直前の1変更を取り消す．

  8. [U]（上限撤廃）$N_{\text{target}}$ の `[+]` は常に有効で，$20000\ \text{rpm}$ まで押し上げられ，表示値と内部値が一致する．範囲端の検査は上限の無い項目では下限のみ行う．
  9. [U]（カム線図）「VVT・カム」「弁タイミング」ではカム線図が表示され（高さ $\ge 120\ \text{px}$），吸気位相を $+10^\circ$ 変えると，描画されるリフト曲線の最大点の横位置が $10^\circ$（$\pm 0.5^\circ$）移動し，基準（灰色）は変更前の位置に残る．オーバーラップ角の表示が $\text{EVC} - (\text{IVO} + 720)$ と一致する．

  10. [U]（第7版）自動最適化 ON：点火時期の行が「（自動）」と自動値（小数1桁）を表示し，$[-]$ $[+]$ が無効．
  11. [U] 完爆後に自動最適化を OFF にすると，自動値 $27.34^\circ$ が手動値 $27^\circ$ に引き継がれ，点火時期が $27^\circ$ になる．
  12. [U] 点火時期に上下限が無い：×10 刻みで $-120^\circ$，続けて $+300^\circ$ 押しても $[-]$ $[+]$ が有効で，値が $-93^\circ$，$207^\circ$ になる．

---

### REQ-19：機関断面図
「運転」タブに，現在の設定諸元と状態を反映した機関の断面図を描くこと．

1. **実寸比**：$B$，$S$，$l$，$r$，クリアランス高さ $h_c = V_c/A_p$，弁径，リフトを同一の縮尺 $s\ [\text{px/m}]$ で描く．設定を変えると図の比率が変わる．縮尺は，取り得る全諸元範囲で図全体が Canvas に収まるよう毎回決める．
2. **描画要素**：シリンダブロックとヘッド，ピストン（リング，ピン），コンロッド，クランク（ウェブ，カウンタウェイト，主軸），クランクケース，**吸気ポート・排気ポート**，吸気弁・排気弁（傘，ステム，スプリング），点火プラグと火花，筒内ガス，火炎．
3. **位置の規則**：ピストン冠面は $y = h_c + x(\theta)$，ピストンピンとクランクピンの距離は常に $l$，クランクピンは主軸から半径 $r$，弁の傘はシート面から $L_v(\theta)$ だけ筒内側へ移動する（VVT 位相を反映）．
4. **色の規則**：吸気ポートは，外端からバルブシートまでの**流路全体を連続した1つの領域**として塗る（途中に塗り残しを作らない）．色は青系で，濃さが $p_{\text{in}}/p_{\text{atm}}$ を表す．排気ポートは同様に橙系で塗る．筒内ガスの色は温度 $T$ に単調に対応させる（低温：青，高温：赤〜橙）．燃焼中は質量燃焼割合 $x_b$ に応じた火炎を点火プラグ位置から描く．
5. **流れの表示**：吸気・排気ポートに，弁質量流量の向き（順流・逆流）と大きさを示す矢印を描く．
6. **文字情報**：運転状態（STOP／CRANK／RUN），回転数，モード，行程名，$\theta$，$p$ [kPa]，$T$，両弁のリフト，$B \times S$，$l/r$，$\varepsilon$ を図に重ならない位置に表示する．
7. 図は幾何計算（場面記述：要素ごとの多角形・円の座標）と描画を分離し，場面記述をテストできるようにする．

* **対応テスト `TEST-19`（機関断面図）**
  1. [A] 場面記述について，$\theta \in \{0, 90, 180, 270, 360, 450, 540, 630\}^\circ$，3組の諸元（既定，$B{=}60/S{=}120/l{=}200$，$B{=}120/S{=}60/l{=}100$）で：冠面位置 $= s\,(h_c + x(\theta))$，ピン間距離 $= s\,l$，クランクピン半径 $= s\,r$，弁傘の変位 $= s\,L_v(\theta)$ がいずれも $\pm 0.5\ \text{px}$ で成立する．
  2. [A] 諸元範囲の端点の組合せ（$B, S, l, \varepsilon$ の最小・最大，$\lambda \le 0.5$ を満たすもの）すべてで，全要素の座標が Canvas 内にある．
  3. [A] 吸気ポート・排気ポートの多角形が単純多角形（自己交差なし）である．
  4. [U] 既定状態で実際に描画し，吸気ポート中心線上の10点（外端からシート直上まで等間隔）の画素がすべて青系（色相 $190^\circ$〜$250^\circ$），排気ポートの対応する10点がすべて橙系（色相 $10^\circ$〜$45^\circ$）である．
  5. [U] 筒内ガス色の色相が $T = 300, 800, 1500, 2500\ \text{K}$ に対して単調に変化する．
  6. [A] `VALVE HIT`（REQ-03）が出ていない全クランク角で，弁傘の下面がピストン冠面より上にある．

---

### REQ-20：検証基盤（全テストのアプリ内実行）
「テストがすべて PASS すれば，求める製品になっている」ことを目標に，テストの実行形態と合否の扱いを定める．

#### A. 実行区分
| 区分 | 内容 | 実行場所 |
| :--- | :--- | :--- |
| [A] 解析 | 純関数・状態機械・恒等式の検査（即時に終わる） | アプリ内 |
| [S] シナリオ | 下表のシナリオでシミュレーションを走らせる動的検査 | アプリ内 |
| [U] UI自己検査 | DOM・Canvas・合成 Pointer Events による検査（現在のビューポートで） | アプリ内 |
| [D] 開発時 | 複数ビューポートのヘッドレス検証とスクリーンショット確認 | 開発時（納品報告に結果を記載） |
| [M] 実機目視 | 自動化できない見た目・操作感の確認（6節のチェックリスト） | 利用者の実機 |

#### B. 規則
1. `TEST-01`〜`TEST-26` の [A][S][U] 項目は**すべてアプリ内に実装**し，「全テスト実行」で実行できること．チップの状態は「未実行／実行中／PASS／FAIL」の4つだけとし，「未実装」という状態を持たない．
2. **利用者の状態に依存しない**：[U] のうち設定画面・解説・画面構成を操作する検査（TEST-15，16，18）は，開始時に全設定を既定値，刻みを ×1，保留なし，機関をコールドリセットした状態にしてから行い，終了後に実行前の状態（設定値・保留値・刻み・運転状態・基準サイクル・表示ページ）へ完全に戻す．テストが前提とする値は，テスト自身が設定する．
3. [S] は，運転中の機関とは**別のシミュレーション・インスタンス**で実行し，運転中の機関の状態 $\mathbf{y}$ と設定を変えない．このためソルバ・ECU・動力計を，グローバル変数に依存しない生成可能なオブジェクト（`EngineCore`）として実装する．
4. テスト実行中も画面が固まらないよう，1フレームあたり $12\ \text{ms}$ 以内に分割して実行し，進捗（完了数／総数）を表示する．途中で中止できる．実行中は運転中の機関の時間進行を一時停止してよい（状態は保持）．
5. 所要時間：全テスト $120\ \text{s}$ 以内（第19版で $90\ \text{s}$ から変更．利用者の指示）．
6. 決定性：乱数を使わない．同じビルドで2回実行した結果の数値が完全に一致する．
7. 各検証項目は，項目名・基準（理論値または許容範囲）・実測値・誤差・合否を持ち，詳細カードに表示する．
8. **納品条件**：[A][S][U] が全 PASS，[D] が全 PASS であること．1件でも FAIL があれば成果物として公開しない．[M] は利用者が確認し，不合格項目は次の改訂で仕様とテストへ反映する（目視でしか見つからなかった不具合には，再発防止の自動テストを追加する）．

#### C. シナリオ定義（既定設定から**サイクル変動のみ OFF**（制御精度を決定的に検査するため），既定ソルバ DOPRI5(4)．「継続」は元シナリオ終端の状態を複製して続ける．S4V だけはサイクル変動 ON）
| ID | 開始 | 操作 | 積分時間 | 使用テスト |
| :--- | :--- | :--- | :--- | :--- |
| S1 始動 | コールドリセット | START | $5\ \text{s}$ | TEST-10，14，20 |
| S2 アイドル（モードA） | S1 を継続 | なし（$N_{\text{target}} = 800$，$f_{\text{manual}} = 0$） | $+15\ \text{s}$ | TEST-12，17，18，20 |
| S3 負荷（モードA） | S2 を継続 | $f_{\text{manual}} = 0.3$ | $+12\ \text{s}$ | TEST-05，06，10，11，13，14，17 |
| N1200 | S2 を継続 | $N_{\text{target}} = 1200$ | $+8\ \text{s}$ | TEST-12 |
| S7 低気圧 | S2 を継続 | $p_{\text{atm}} = 80\ \text{kPa}$ | $+10\ \text{s}$ | TEST-12 |
| AMAX | S2 を継続 | $N_{\text{target}} = 2000$，$\alpha_{\max} = 3^\circ$ | $+8\ \text{s}$ | TEST-12 |
| S4 動力計速度制御（モードB） | コールドリセット | モードB，$N_{\text{target}} = 1500$，$\alpha_{\text{manual}} = 15^\circ$，START | $20\ \text{s}$ | TEST-03，06，11，12，14 |
| S4b | S4 を継続 | $p_{\text{atm}} = 80\ \text{kPa}$ | $+10\ \text{s}$ | TEST-11 |
| S8 VVT | S4 を継続 | $\varphi_{\text{in}} = +30^\circ$ | $+5\ \text{s}$ | TEST-03 |
| S5 容量超過 | コールドリセット | モードB，$N_{\text{target}} = 800$，$\alpha_{\text{manual}} = 90^\circ$，START | $10\ \text{s}$ | TEST-11 |
| S6 出力不足 | コールドリセット | モードB，$N_{\text{target}} = 3000$，$\alpha_{\text{manual}} = 7^\circ$（第16版で $5^\circ$ から変更：漏れの廃止と補機負荷で，$5^\circ$ では $1400\ \text{rpm}$ も出せなくなったため．$7^\circ$ で $10\ \text{s}$ 後 $1993\ \text{rpm}$（UNDERPOWER），目標 $1400$ で $1401\ \text{rpm}$ に再整定），START．$10\ \text{s}$ 後に $N_{\text{target}} = 1400$ | $10 + 8\ \text{s}$ | TEST-11 |
| S4V サイクル変動 | S4 を継続 | サイクル変動 ON | $+10\ \text{s}$ | TEST-07 |
| CRANK | コールドリセット | スターターのみ（無燃焼） | $5\ \text{s}$ | TEST-10 |

各シナリオの合格基準は，使用する各テストの項目に定める．実装検証値（参考）：S2 終端 $\bar{N} \approx 794$〜$800\ \text{rpm}$，$\alpha \approx 2.3^\circ$．S3 $T_b \approx 3.0\ \text{N}\cdot\text{m}$．S4 $f_{\text{cmd}} \approx 0.90$，$T_b \approx 31.7\ \text{N}\cdot\text{m}$．S4b $T_b \approx 24.3\ \text{N}\cdot\text{m}$．S5 平衡 $\approx 1630\ \text{rpm}$．S8 $\eta_v$：$0.70 \to 0.61$．

* **対応テスト `TEST-20`（検証基盤の自己検査）**
  1. [S] 決定性：S1・S2 を再実行し，終端の全状態量（内部状態を含む）が1回目と完全に一致する．
  2. [A] 全テスト実行の前後で，運転中の機関の状態 $\mathbf{y}$・内部状態と全設定値が完全に一致する（UI自己検査で操作した値も元へ戻す）．
  3. [U] TEST-01〜19，21〜26 がすべて実行され，結果を持つ（未実行・未実装が残らない）．
  4. [D]（利用者状態への非依存）全即時項目を上限値（選択項目は最後の選択肢），モードB，刻み ×10，要リセット項目の保留あり，運転中，の状態で全テストを実行し，26/26 PASS かつ実行直前と直後で機関の状態と全設定値が完全に一致する．
  5. [U] テスト実行中の最長フレーム間隔が $250\ \text{ms}$ 以下（解説タブの初回組版が最長），総所要時間が $120\ \text{s}$ 以下．

---

### REQ-21：エンジン音（クランク角ウェーブテーブル＋排気管共鳴）
機関の回転数の違いが音で分かるよう，シミュレーションの排気流量から作った音を，**現在の平均回転数に対応する実時間の速さで**鳴らすこと．再生速度（$0.02\times$〜$1\times$）によらず，$800\ \text{rpm}$ は $800\ \text{rpm}$ の音として聞こえること．

#### A. 音源（ウェーブテーブル）
1. 排気口を点音源とみなすと，遠方の音圧は排気の体積流量の時間微分に比例する（$p' = \frac{\rho}{4\pi r}\frac{dq_V}{dt}$）．これに倣い，音源信号を排気弁質量流量の時間微分とする：
   $$q(\theta) = \frac{d\dot{m}_{\text{ex}}}{dt} = \omega\,\frac{d\dot{m}_{\text{ex}}}{d\theta}$$
2. 直前に完了したサイクルの $\dot{m}_{\text{ex}}(\theta)$（$0.5^\circ$ 刻み，1440点）から，中心差分で $\frac{d\dot{m}_{\text{ex}}}{d\theta}$ の表 $s_i$（1440点，周期境界）を作り，平均値を差し引く（直流成分の除去）．未記録点（NaN）は $0$ とする．表はサイクル完了ごとに更新する．
3. 再生位相 $\psi$（表の添字，$[0, 1440)$）を，サンプリング周波数 $f_s$ に対し1サンプルごとに
   $$\Delta\psi = \frac{1440\,\bar{N}_a}{120\,f_s}$$
   だけ進め，表を線形補間して読む．$\bar{N}_a$ は運転中の機関の $\bar{N}$ を時定数 $50\ \text{ms}$ の一次遅れで平滑した値である．したがって出力の周期は厳密に $120/\bar{N}_a\ [\text{s}]$（爆発周波数 $f_{\text{fire}} = \bar{N}/120$）となる．
4. 音源の振幅は $q = \frac{\pi \bar{N}_a}{30}\, s(\psi)$ とする（回転数に比例）．
5. **表の切替**：新しい表は，位相が1周して $0$ へ戻る瞬間に切り替える（サイクルの途中で波形を不連続にしない）．
6. **停止時**：$\bar{N}_a \le 30\ \text{rpm}$ では音源の包絡を時定数 $30\ \text{ms}$ で $0$ へ下げ，共鳴器の残響が減衰した後は出力を厳密に $0$ とする．

* **音量と負荷の関係（実装検証で判明した事実）**：同じ $800\ \text{rpm}$ でも，無負荷アイドル（$p_{\text{in}} \approx 16\ \text{kPa}$）は弁オーバーラップ時の排気逆流が大きく，$|d\dot{m}_{\text{ex}}/d\theta|$ の最大値が負荷時（$f = 0.3$）より大きい．したがって「同一回転数で負荷を上げると音が大きくなる」は本モデルでは成立しない．音量の単調性は，回転数と開度がともに上がる順（アイドル → $1500\ \text{rpm}$・$15^\circ$ → 全開）で判定する．

#### B. 排気管の共鳴（片端開放管，周波数依存の損失付き）
1. 長さ $L$，内径 $d_e$ の排気管を，入口（排気弁側）を閉端，出口を開放端とする1次元の管とみなす．往復時間 $2L/c$ の遅延と，出口での位相反転反射を持つ帰還型くし形フィルタで表す：
   $$v_k = q_k - \rho_m\, (h * v)_{k-D}, \quad D = \frac{2 L f_s}{c}$$
   $\rho_m$ は消音器による広帯域の吸収を表す反射率（設定，既定 $0.6$），$h$ は管内の周波数依存の損失を表すフィルタである．
2. **管内損失（第5版で追加）**：往復の振幅減衰を，管壁の粘性・熱伝導による減衰（Kirchhoff）と開口端からの放射損失の積とする：
   $$|H(f)| = \exp\left(-2\alpha_w L - \frac{(k a)^2}{2}\right), \quad \alpha_w = \frac{\sqrt{\pi f \nu}}{a\,c}\left(1 + \frac{\gamma - 1}{\sqrt{Pr}}\right), \quad k = \frac{2\pi f}{c},\ a = \frac{d_e}{2}$$
   $\nu = 8.4 \times 10^{-5}\ \text{m}^2/\text{s}$（$800\ \text{K}$ の排気），$Pr = 0.7$，$\gamma = 1.35$．$|H|$ は $f$ について単調減少で $|H(0)| = 1$．これを，$1\ \text{kHz}$ で $|H|$ が一致する一次低域フィルタ $h$（$y_k = (1 - b)x_k + b\,y_{k-1}$）で近似する．$b$ は $m^2|1 - b e^{-i\omega}|^2 = (1 - b)^2$（$m = |H(1\ \text{kHz})|$）の $[0, 1)$ の根．既定（$L = 1\ \text{m}$，$d_e = 40\ \text{mm}$）で $|H(1\ \text{kHz})| = 0.855$．$h$ の低域群遅延 $b/(1-b)$ サンプルを $D$ から差し引いて補正し，$D$ の小数部は線形補間する．
3. 共鳴周波数は1/4波長管の $f_n = \frac{(2n - 1)\,c}{4L}$，極小は $\frac{nc}{2L}$．極大と極小の比は $\frac{1 + g}{1 - g}$（$g = \rho_m |H(f)|$）．
4. 音速は $T_{\text{ex}} = 800\ \text{K}$ で $c = \sqrt{\gamma(T_{\text{ex}}) R T_{\text{ex}}} \approx 556.7\ \text{m/s}$．既定 $L = 1.0\ \text{m}$ で $f_1 \approx 139\ \text{Hz}$．
5. **残響の要件**：単一パルスに対する共鳴の残響は，$40\ \text{ms}$ 後（$3000\ \text{rpm}$ の爆発間隔）にピークの $1\%$ 未満であること（第4版の $\rho_e = 0.8$ では $4.7\%$ 残り，回転数に無関係な一定の高さの唸りとなって「電子音」に聞こえる原因となった．既定値で $0.04\%$）．

#### B′. 音量の制御（圧縮器，第5版で追加）
1. 第4版は出力を瞬時の $\tanh$ で制限していたため，$3000\ \text{rpm}$ 全開でサンプルの $12.5\%$ が飽和域（$|y| > 0.6$）に入り，波形が矩形波状に歪んだ（波高率 $2.1$）．これを「電子音」の主因と判断し，次の圧縮器に置き換える．
2. 圧縮器の入力を $x_c = 0.16(1 - \rho_m)\,v$ とし，ピーク包絡 $e_p$ を即応で立ち上げ，$0.2\ \text{s}$ 保持した後，時定数 $\tau_r = 0.3\ \text{s}$ で戻す（入力が包絡の $99.9\%$ 以上なら保持を更新する）．利得は
   $$G = \min\left(1,\ \left(\frac{l_t}{e_p}\right)^{1 - 1/R_c}\right), \quad l_t = 0.35,\ R_c = 4$$
   で，出力を $u = 1.6\,V\,G\,x_c$ に対し $|u| \le 0.8$ では $y = u$，$|u| > 0.8$ では $y = \text{sgn}(u)\,(0.8 + 0.2\tanh((|u| - 0.8)/0.2))$ とする（$V$：音量．$|y| < 1$ が保証される．第6版で $\tanh$ から変更）．保持時間 $0.2\ \text{s}$ はアイドルの爆発間隔 $150\ \text{ms}$ より長いので，定常運転では1サイクルの中で利得が一定となり，波形の衝撃性を損なわない．$\tanh$ は安全装置として残す．
3. 静特性は単調（比 $R_c = 4$ の圧縮）なので，音量の大小関係（アイドル $<$ 中負荷 $<$ 全開）は保たれる．

#### B″. サイクル変動（第5版で追加，設定で ON/OFF）
実機の燃焼はサイクルごとにばらつく（IMEP の変動係数で数%）．完全に同じ波形の繰返しは純粋な線スペクトルとなり電子音的に聞こえるため，位相が1周するごとに，一様乱数 $z_1, z_2$（平均 $0$，分散 $1$，種を固定した擬似乱数で決定的）を用いて
$$A_j = 1 + 0.03\,z_1, \qquad P_j = \frac{120}{\bar{N}}\left(1 + 0.005\,z_2\right)$$
とする（$A_j$：第 $j$ サイクルの振幅係数，$P_j$：周期）．振幅係数はサイクル内で前サイクルの値から線形に移し，波形に段差を作らない．平均周期は $120/\bar{N}$ のまま．OFF では厳密に周期的となる（A＋B のみの比較用）．

**第6版の調査（利用者の「ON/OFF の効果が分からない」への回答）**：アプリを $1\times$ で動かしたときと同じく表をサイクルごとに更新して，サイクルごとのピーク音圧のばらつき（標準偏差）を測った．

| 運転点 | 変動 OFF | 変動 ON | シミュレーション自体の COV(IMEP) |
| :--- | :--- | :--- | :--- |
| アイドル $800\ \text{rpm}$ | $0.59\ \text{dB}$ | $0.60\ \text{dB}$ | $1.55\%$ |
| $1500\ \text{rpm}$・$15^\circ$ | $0.00\ \text{dB}$ | $0.14\ \text{dB}$ | $0.02\%$ |
| $3000\ \text{rpm}$ 全開 | $0.11\ \text{dB}$ | $0.15\ \text{dB}$ | $3.5\%$（加速中） |

追加するばらつきは $0.04$〜$0.14\ \text{dB}$ で，音の大きさの弁別閾（およそ $0.5$〜$1\ \text{dB}$）より1桁小さい．周期のばらつき $0.5\%$（$3000\ \text{rpm}$ で約 $0.2\ \text{ms}$）も時間間隔の弁別閾より小さい．アイドルではシミュレーション自体のばらつき（ECU の微小な揺れによる）に埋もれる．したがって**現在の設定値では聞き分けられないのが正しい**．倍音／中間比（TEST-21 項目14）では差が出るが，それは厳密周期（OFF）と比べた数値上の差である．聞き分けられるようにする方法は 7節の未決事項に挙げる．機能は利用者の判断で残す．

#### B‴. 排気噴流の流れ雑音（第7版で追加）
排気弁から噴き出す高速流の乱れは広帯域の雑音を出す．弁質量流量の絶対値の表 $e(\psi) = |\dot{m}_{\text{ex}}(\psi)|$（$q$ の表と同時に作り，同じ瞬間に切り替える）を用い，音源に
$$q_n = F\,A_n \left(\frac{e(\psi)}{e_{\text{ref}}}\right)^2 w_{\text{bp}}, \qquad A_n = 40,\ e_{\text{ref}} = 0.05\ \text{kg/s}$$
を加える．$w_{\text{bp}}$ は分散 $1$ の一様白色雑音（種を固定した擬似乱数）を，$1\ \text{kHz}$ の2次高域通過と $6\ \text{kHz}$ の2次低域通過（いずれも $Q = 1/\sqrt{2}$ の双2次フィルタ）に通した信号，$F$ は設定「音響」の流れ雑音（$0$〜$100\%$，既定 $40\%$）である．振幅を流量の2乗に比例させたので，回転数と負荷が上がるほど雑音が強くなる（既定で排気脈動に対する RMS 比：アイドル約 $0.12$，$3000\ \text{rpm}$ 全開約 $0.4$）．雑音は共鳴器（B）を通る．

#### C. 実装
1. 合成は **AudioWorklet**（音声専用スレッド）で行う．合成器は DOM に依存しない純粋なクラス `Synth` とし，Worklet のコードはそのソースから生成し，Blob URL → data URL の順で読み込む（file:// で開いた場合は Blob URL が拒否されるため）．どちらも失敗する環境では ScriptProcessorNode に同じ `Synth` を載せて代替する．テストも同じ `Synth` を直接使う．
2. メインスレッドは毎フレーム $\bar{N}$，音量，$L$，$\rho_e$ を送り，サイクル完了時に新しい表を送る．
3. Chrome の自動再生ポリシーにより，音声は利用者の操作なしに開始できない．`[START]` または `[音]` ボタンのタップ時に AudioContext を生成・再開する．
4. 次のときは送る回転数を $0$ にする（無音へ移行）：音が OFF のとき，テスト実行中，ページが非表示のとき．非表示中は AudioContext を一時停止する．
5. 設定（REQ-18）に「音響」ページを設ける：音量（$0$〜$100\%$，刻み $5$，既定 $60$），排気管長 $L$（$0.3$〜$3.0\ \text{m}$，刻み $0.1$，既定 $1.0$），排気管内径 $d_e$（$20$〜$80\ \text{mm}$，刻み $2$，既定 $40$），消音器の反射率 $\rho_m$（$0$〜$0.95$，刻み $0.05$，既定 $0.6$），流れ雑音 $F$（$0$〜$100\%$，刻み $10$，既定 $40$）．いずれも即時項目．サイクル変動の切替は第7版で「燃焼」ページへ移し，燃焼のばらつき（REQ-07）と音のばらつき（B″）を同時に切り替える．
6. 運転タブの再生速度の行に `[音ON]`／`[音OFF]` の切替ボタンを置く（既定 ON）．
7. スマートフォンの内蔵スピーカーは低音（概ね数百 Hz 以下）の再生が弱いため，共鳴の低音を聞くにはヘッドホンを推奨する旨を解説タブに記す．
* **出典**：点音源の音圧：L. E. Kinsler et al., *Fundamentals of Acoustics*, 4th ed., Wiley (2000), Ch. 7．AudioWorklet：[W3C, Web Audio API](https://www.w3.org/TR/webaudio/)．自動再生ポリシー：[Chrome for Developers, Autoplay policy in Chrome](https://developer.chrome.com/blog/autoplay)．

* **対応テスト `TEST-21`（エンジン音）**
  1. [A] $c = \sqrt{\gamma(800) R \cdot 800}$，$f_1(L = 1) = c/4$（相対誤差 $10^{-12}$）．
  2. [A] 位相：$\bar{N}_a = 800, 1500, 3000\ \text{rpm}$ 一定で $1\ \text{s}$ 合成したとき，位相の総進み（周回数 $\times 1440 +$ 端数）が $1440\,\bar{N}/120$ と相対誤差 $10^{-9}$ で一致する．
  3. [S] 周期性（サイクル変動 OFF）：S4 の表を用い，$f_s = 48\ \text{kHz}$ で周期がちょうど整数サンプルになる $800$（$P = 7200$），$1500$（$3840$），$3000\ \text{rpm}$（$1920$）について，共鳴なし（$\rho_m = 0$）と既定共鳴（$\rho_m = 0.6$）の両方で，圧縮器が定常に達した $2$〜$3\ \text{s}$ の区間で $y_{k+P}$ と $y_k$ の差の RMS が出力 RMS の $10^{-3}$ 未満であり，$\lfloor 1.02P \rfloor$ ずらすと $5\%$ 以上異なる．
  4. [A] 共鳴：単一パルスの応答の離散フーリエ変換で，$L = 1.0$ と $0.5\ \text{m}$ のそれぞれについて，$f_1, f_2, f_3$ の近傍 $\pm 10\%$ の振幅最大点が理論値と $2\%$ 以内で一致し，$f_n$ での振幅と隣接する極小 $\frac{nc}{2L}$ での振幅の比が理論値 $\frac{1+g}{1-g}$ の $75\%$ 以上である．
  5. [S] 表の作成：S3 の最終サイクルから作った表が1440点すべて有限，平均の絶対値が最大値の $10^{-6}$ 以下，排気行程中の点 $i = 1200$（$\theta = 600^\circ$）が中心差分の定義と，表の最大値の $10^{-6}$ 以内で一致する（排気弁が閉じた点は値がほぼ $0$ で判定にならないため）．
  6. [A] 表の切替：サイクル途中で新しい表を送ると，位相が1周した瞬間に切り替わり，それまでの出力は切替なしの場合と完全に一致する．
  7. [A] 無音と制限：$\bar{N} = 0$ から始めると出力は厳密に $0$．$800\ \text{rpm}$ から $0$ にすると $0.5\ \text{s}$ 後に $|y| < 10^{-6}$．S5 の表・$6000\ \text{rpm}$・音量 $100\%$ でも $|y| \le 1$ かつ NaN が無い．音量 $0$ で出力は厳密に $0$．小振幅域で出力が音量に比例する（$1\%$ と $2\%$ で RMS 比 $2$，誤差 $1\%$．$\tanh$ がほぼ線形な領域）．
  8. [S] 音量の順序：音量 $60\%$，既定共鳴で，S2（アイドル）$<$ S4（$1500\ \text{rpm}$）$<$ S5（全開）の順に RMS が大きい．
  9. [U] 送信値：運転中の機関の $\bar{N}$ が送られ，再生速度 $0.1\times$ と $1\times$ で同じ値になる．音 OFF とテスト実行中は $0$ が送られる．`[音]` ボタンのタップで ON／OFF とラベルが切り替わる．
  10. [A]（圧縮器）振幅 $2$ の正弦に対し定常ピークが $l_t^{3/4}\cdot 2^{1/4}$（$1\%$），振幅 $0.2$（しきい値以下）では利得が厳密に $1$，$0.1 \to 2$ の段差で出力が上限を超えない（立ち上がり即応），包絡が $0.2\ \text{s}$ 保持された後 $0.3\ \text{s}$ で $1/e$ に減衰する．
  11. [S]（歪みの解消）W3000（コールドリセットからモードB，$N_{\text{target}} = 3000$，全開，$T_{\text{rated}} = 200\ \text{N}\cdot\text{m}$，$12\ \text{s}$）の表・音量 $60\%$ で，$|y| > 0.8$（制限段の非線形域）のサンプルが $0.1\%$ 未満（第12版で $0.6$ から $0.8$ に変更：第6版で制限段を「$|u| \le 0.8$ は線形」に変えたので，歪むのは $0.8$ を超えた分だけである．第12版の既定諸元では W3000 が $3096\ \text{rpm}$ まで回り，$|y|$ の最大は $0.662$（$0.6$ を超えるのは $1.8\%$，$0.7$ を超えるのは $0\%$）で，歪みは無い）．定常区間（$2$〜$3\ \text{s}$）で，圧縮・制限段を通した後の波高率が通す前の $0.95$ 倍以上．
  12. [A]（管内損失）一次低域フィルタの $|H(1\ \text{kHz})|$ が定義式と相対誤差 $10^{-9}$ で一致し，$|H(f)|$ が単調減少で $|H(0)| = 1$．単一パルスの残響が $40\ \text{ms}$ 後にピークの $1\%$ 未満．
  13. [A]（サイクル変動）ON で $10\ \text{s}$（$1500\ \text{rpm}$，約 $120$ サイクル）合成したとき，周期の変動係数が $0.5\%$，振幅係数の変動係数が $3\%$（いずれも $\pm 25\%$），平均周期が $120/\bar{N}$（$0.2\%$）．OFF では周期が一定（$\pm 1$ サンプル）．同じ種で出力が完全に一致し，種が異なれば異なる．
  14. [A]（純音らしさの解消）Hann 窓・ちょうど $24$ 周期の窓で，倍音とその中間（$f_0(k + 0.5)$）のエネルギー比が，OFF で $100\ \text{dB}$ 以上（厳密周期），ON で $40\ \text{dB}$ 以下．
  16. [A]（流れ雑音，第7版）$F = 0$ で出力が雑音なしと完全一致．包絡 $e = 0$ では $F > 0$ でも雑音が出ない．雑音の振幅が $F$ に比例する（$20\%$ と $40\%$ で RMS 比 $2$，誤差 $2\%$）．雑音の帯域：$1$〜$6\ \text{kHz}$ にエネルギーの $70\%$ 以上，$0.5\ \text{kHz}$ 以下と $12\ \text{kHz}$ 以上は各 $10\%$ 以下（2次フィルタの裾を許容）．同じ種で完全一致．
  17. [S]（流れ雑音）W3000 の表・既定 $F = 40\%$ で，雑音 RMS / 排気脈動 RMS が $0.1$〜$0.5$．
  15. [U] 音声経路：OfflineAudioContext で AudioWorklet を構築し，S4 の表・$1500\ \text{rpm}$・サイクル変動 ON・流れ雑音 $40\%$（種固定）で $0.5\ \text{s}$ 描画した出力が，同じ条件の `Synth` の直接計算と最大差 $10^{-5}$ 以内で一致する．AudioWorklet が使えない環境では ScriptProcessorNode による代替経路が構築できることを確認する（どちらの経路かを結果に表示する）．

---

### REQ-22：制御状態の表示（第6版で追加）
いま何が変数で，制御が何を目標に何を動かしているかを，運転タブで一目で分かるようにすること．

1. 運転タブの機関断面図と操作ボタンの間に，**制御状態カード**（4行，各行は1行に収め折り返さない．第13版で2行から変更．3行では最長の表示が $360\ \text{px}$ 幅でちょうど一杯になり，端末のフォントによって切れるおそれがあったため4行とした）を置く．量は記号だけでなく日本語名で示す（第13版．利用者の指摘「操作量 α・f の意味が分からない」「点火が ATDC か BTDC か分からない」による）：$\alpha$ は「スロットル開度 α」，$f$ は「動力計の充水率 f」，点火は「点火時期 ○° BTDC」．
2. 各量に役割の色付き見出しを付ける：**目標**（緑），**制御量**（橙），**操作量**（青），**固定**（灰：利用者が与えた一定値），**自動**（紫：自動最適化）．
3. 表示内容（状態ごと）：

| 状態 | 1行目 | 2行目 | 3行目 | 4行目 |
| :--- | :--- | :--- | :--- | :--- |
| 停止 | `停止中` | `START で始動` | （空） | （空） |
| 始動中（完爆前） | `始動中` 目標 完爆 $\bar{N} > 550$ rpm／制御量 $\bar{N}$ | 固定 スロットル開度 $\alpha = \alpha_{\text{crank}}$（始動開度） | （空） | 固定 点火時期 $s$° BTDC |
| モードA（完爆後） | `スロットル制御` 目標 $N_{\text{target}}$／制御量 $\bar{N}$ | 操作量 スロットル開度 $\alpha$ | 固定 動力計の充水率 $f_{\text{manual}}$ | 自動または固定 点火時期 $s$° BTDC |
| モードB（完爆後） | `動力計制御` 目標 $N_{\text{target}}$／制御量 $\bar{N}$ | 操作量 動力計の充水率 $f_{\text{cmd}}$ | 固定 スロットル開度 $\alpha_{\text{manual}}$ | 自動または固定 点火時期 $s$° BTDC |

4. 操作量が上下限に張り付いているときは，その値に，スロットルなら `全開`（$\alpha = \alpha_{\max}$）または `全閉`（$\alpha = 0$），充水率なら `上限`（$f_{\text{cmd}} = 1$）または `下限`（$f_{\text{cmd}} = 0$）を付ける（第16版で「飽和」から変更．「飽和」の意味が分かりにくいとの指摘による）．
5. 表示は描画フレームごとに更新する．

* **対応テスト `TEST-22`（制御状態の表示）**
  1. [U] 停止・始動中・モードA・モードB の4状態（運転中の機関を一時的にその状態にして表示を更新）で，カードの文字列に上表の見出し（目標・制御量・操作量・固定・自動）と対応する量の名前が含まれ，数値が機関の状態と一致する（$\bar{N}$ は四捨五入した整数，$\alpha$ は小数1桁，$f_{\text{cmd}}$ は小数2桁）．
  2. [U] モードAで $\alpha = \alpha_{\max}$ のとき `全開`，$\alpha = 0$ のとき `全閉`，モードBで $f_{\text{cmd}} = 1$ のとき `上限`，$0$ のとき `下限` が表示され，張り付いていないときはどれも表示されず，`飽和` の語は使わない．
  3. [U] 自動最適化 ON では点火の見出しが「自動」，OFF では「固定」．
  4. [U] $360 \times 640$ を含む現在のビューポートで，最長の表示内容でもカードの4行が折り返さず（`scrollWidth ≤ clientWidth`），運転タブがスクロールしない．
  5. [U]（第13版）モードA・B で，カードに `スロットル開度 α`，`動力計の充水率 f`，`点火時期`，`BTDC` の語が含まれる．
  6. [U]（メトリクスの日本語名，第13版．第15版で変更．REQ-14）2ページの全24項目のそれぞれについて：既定は記号の表示．その項目のタップでその項目だけが日本語名（かな・漢字を含む）になり，ほかの23項目は記号のまま．再タップで記号に戻り，さらに2回タップしても記号に戻る．どの状態でも，$360 \times 640$ を含む現在のビューポートで，各項目の名称・値が切れない（`scrollWidth ≤ clientWidth`）．
  7. [U]（実機のタップの再現，第17版）項目の上で `pointerdown` を送り，描画の更新（メトリクスの再描画）を挟んでから，同じ要素に `pointerup` を送る（タッチの暗黙のキャプチャの再現）と，その項目が切り替わる．再描画の前後で項目の要素が同一（作り直されない）．

---

### REQ-23：目標回転数スライダ（第9版で追加）
運転タブで，目標回転数 $N_{\text{target}}$ をスライダで大きく動かし，$[-]$ $[+]$ ボタンで微調整できること．

1. **配置**：機関断面図（Canvas）の下端に，高さ $48\ \text{px}$ の帯を重ねる．帯には左から `[−]`，スライダ（現在値のラベル付き），`[＋]` を置く．機関断面図はこの帯の上の領域に収まるよう縮尺を決め，帯と重ならない．
2. **範囲と刻み**：スライダの範囲は $500$〜$8000\ \text{rpm}$，刻み $50\ \text{rpm}$（位置と値は線形）．ボタンは $\pm 50\ \text{rpm}$．$N_{\text{target}}$ 自体には上限が無い（REQ-18）ので，ボタンではスライダの範囲を超えて上げられ，そのときつまみは右端に留まり，ラベルは実際の値を表示する．下限は $500\ \text{rpm}$．
3. **誤操作対策**：値を変えるのは**つまみ（当たり判定 $44 \times 44\ \text{px}$ 以上）から始めたドラッグだけ**とする．トラックのタップ，つまみ以外から始めたドラッグでは値が変わらない．ドラッグ中は指の横位置に合わせて値を即時に反映し（ECU が追従する），ラベルに表示する．
4. **反映**：設定画面の目標回転数（REQ-18）と同じ値で，変更は即時項目として扱う（変更通知・基準サイクルの規則も同じ）．モードA・B のどちらでも目標回転数として働く．
5. スライダは独自実装（`div` と Pointer Events）とし，`input[type="range"]` は使わない（REQ-15 D.1 の検査を保つ）．

* **対応テスト `TEST-23`（目標回転数スライダ）**
  1. [U] 運転タブに帯・つまみ・`[−]`・`[＋]` があり，ボタンとつまみが $44 \times 44\ \text{px}$ 以上，帯が Canvas の下端に収まり，運転タブがスクロールしない．DOM に `input[type="range"]` が無い．
  2. [U] つまみを押して右へ $\Delta x$ 動かすと，$N_{\text{target}}$ が「つまみ位置の値」（トラック幅で線形変換し $50\ \text{rpm}$ に丸めた値）になり，ソルバの入力（`live.P.nt`）とラベルが同じ値になる．トラックの左端・右端までドラッグすると $500$，$8000\ \text{rpm}$．
  3. [U] トラックのつまみ以外の位置をタップ，またはそこから始めたドラッグでは $N_{\text{target}}$ が変わらない．
  4. [U] `[＋]`・`[−]` で $\pm 50\ \text{rpm}$．$8000\ \text{rpm}$ から `[＋]` を2回押すと $8100\ \text{rpm}$ になり，つまみは右端，ラベルは `8100`．$500\ \text{rpm}$ で `[−]` は無効．
  5. [A] 機関断面図の場面記述（REQ-19）の全要素が，帯の上端より上にある（既定諸元と諸元範囲の端点，$\theta = 0, 180^\circ$）．

---

### REQ-24：内部 EGR と点火時期の妥当性（第11版で追加）
バルブオーバーラップによる内部 EGR（残留ガス）と MBT 点火時期が，物理的にもっともらしい大きさと傾向を示すこと．モデルの変更は REQ-05 4′（吸気管の既燃ガス追跡），REQ-06（順流の組成），REQ-07（着火遅れの校正）で行い，本 REQ はその結果を判定する．

1. **オーバーラップの変え方**：オーバーラップ角 $\theta_{\text{OL}} = \text{EVC} - (\text{IVO} + 720^\circ)$ を，カム位相ではなく IVO と EVC だけで変える（$\text{IVO} = -10, -25, -40^\circ$，$\text{EVC} = 730, 745, 760^\circ$ の組で $\theta_{\text{OL}} = 20, 50, 80^\circ$）．位相を動かすと EVO・IVC も動き，効果が混ざるため．
2. **期待する傾向**（Fox–Cheng–Heywood の相関で，オーバーラップによる残留ガスは $\frac{OF}{N}\sqrt{p_{\text{em}} - p_{\text{im}}}$ に比例する項を持つ．$OF$：オーバーラップ係数，$N$：回転数，$p_{\text{em}}, p_{\text{im}}$：排気・吸気マニホールド圧）：
   * 吸気管負圧が大きい軽負荷ほど，オーバーラップで $x_r$ が大きく増える．
   * 部分負荷では，$x_r$ の増加に伴って $p_{\text{in}}$ が上がりポンプ損失が減る（PMEP が $0$ に近づく），$T_{\max}$ が下がる，$\eta_b$ がわずかに上がる．
   * 全開では吸排気の差圧が小さく，内部 EGR は小さい．
   * MBT 点火時期は，回転とともに進角し，希釈（$x_r$ の増加）でも進角する．
3. **判定値の根拠**：試作（7.7 節）の結果に余裕を持たせて決めた．実機の典型値との比較は推定であり，文献値で確かめたものではない．

* **出典**：[J. W. Fox, W. K. Cheng, J. B. Heywood, "A Model for Predicting Residual Gas Fraction in Spark-Ignition Engines", SAE Technical Paper 931025 (1993)](https://doi.org/10.4271/931025)，[P. Öberg ほか（Linköping 大学）による同相関の再校正，SAE (2006)](https://www.fs.isy.liu.se/Publications/Articles/SAE_06_POLE.pdf)，J. B. Heywood, *Internal Combustion Engine Fundamentals*, 2nd Ed., McGraw-Hill (2018)．
* **対応テスト `TEST-24`（内部 EGR と点火時期）**：サイクル変動 OFF，点火の自動最適化 ON，既定諸元から各条件で定常まで積分し（整定時間は実装で確認して決め，各条件 $\le 12\ \text{s}$），直近サイクルの値で判定する．
  1. [S]（軽負荷）モードA，目標 $1500\ \text{rpm}$，充水率 $f = 0.1$：$\theta_{\text{OL}} = 20, 50, 80^\circ$ で $x_r$ と $\bar{Y}_{b,\text{in}}$ がともに単調増加し，$x_r(80^\circ) - x_r(20^\circ) \ge 0.10$．（試作：$x_r = 0.17, 0.23, 0.38$）
  2. [S]（部分負荷）モードA，目標 $2000\ \text{rpm}$，$f = 0.3$：$\theta_{\text{OL}} = 20 \to 80^\circ$ で，$x_r$ が $0.04$ 以上増え，PMEP が $4\ \text{kPa}$ 以上 $0$ に近づき，$T_{\max}$ が $80\ \text{K}$ 以上下がり，$\eta_b$ が下がらない．（試作：$x_r$ $+0.081$，PMEP $-57 \to -49\ \text{kPa}$，$T_{\max}$ $-176\ \text{K}$，$\eta_b$ $0.300 \to 0.308$）
  3. [S]（全開）上記 W3000（モードB，開度 $90^\circ$，目標 $3000\ \text{rpm}$，既定のオーバーラップ）：$x_r \le 0.08$，$\bar{Y}_{b,\text{in}} \le 0.02$．（試作：$0.053$，$0.006$）
  4. [S]（アイドル）既定設定の無負荷アイドル（S2）：$0.15 \le x_r \le 0.35$．（試作：$0.28$）
  5. [S]（MBT 点火時期）モードB，開度 $90^\circ$，動力計の定格トルク $T_r = 200\ \text{N·m}$，目標 $1500, 3000, 5000\ \text{rpm}$（$3000\ \text{rpm}$ は TEST-21 と共用のシナリオ W3000）：MBT 点火時期がいずれも $15$〜$35^\circ$ BTDC で，実回転数 $\bar N$ の増加とともに単調に進角する．水ブレーキの PI 制御は全開で整定が遅く，判定時の $\bar N$ は目標に届かない（実装検証：$1480, 2533, 4816\ \text{rpm}$）ので，目標との一致は判定しない（回転数を固定する動力計は第12版で扱う）．（実装：$19.5, 23.3, 26.8^\circ$）
  6. [S]（火炎発達角）上記 W3000 で，点火から $x_b = 0.1$ までのクランク角が $15$〜$35^\circ\text{CA}$．（試作：約 $25^\circ$）
  7. [S]（希釈による進角）1 の条件で，MBT 点火時期が $\theta_{\text{OL}} = 80^\circ$ のほうが $20^\circ$ より $3^\circ$ 以上進む．（試作：$22.6 \to 28.7^\circ$）
  8. [S] TEST-24 全体の所要時間が $360 \times 640$ で $25\ \text{s}$ 以下（全テストの総所要の上限（TEST-20）を守るため）．

---

### REQ-25：吸気ランナの慣性（慣性過給，第12版で追加）
吸気マニホールド（プレナム）と吸気弁の間に，長さ $L_r$，内径 $d_r$ の吸気ランナを1本置き，管内のガス柱の慣性を扱うこと．回転数によって吸気弁が閉じる直前のポート圧が上下し（慣性過給，ram 効果），体積効率 $\eta_v$ とトルクに回転数の「山」ができる．ランナ長で山の位置が動くこと．

#### 【数式導出と定義】
**1. 寸法**：断面積 $A_r = \frac{\pi}{4} d_r^2$．ランナの弁側半分の容積をポート容積 $V_p = \frac{1}{2} A_r L_r$ とみなし（集中定数近似．プレナム側半分はマニホールド容積 $V_{\text{in}}$ に含める），ポート内の圧力を $p_p$ とする．

**2. 運動量の式**：ランナ内のガスを密度 $\rho_r = \frac{p_{\text{in}}}{R T_{\text{in}}}$ 一定，速度 $u$ 一様の柱とみなす．柱の質量は $\rho_r A_r L_r$，両端の圧力差による力は $A_r (p_{\text{in}} - p_p)$，管摩擦と入口損失による圧力損失は $\Delta p_\zeta = \zeta \frac{\rho_r u |u|}{2}$ である．Newton の第2法則
$$\rho_r A_r L_r \frac{du}{dt} = A_r (p_{\text{in}} - p_p) - A_r \Delta p_\zeta$$
に $\dot m_r = \rho_r A_r u$ を代入すると（$\rho_r$ の時間変化は無視），
$$\frac{d\dot m_r}{dt} = \frac{A_r}{L_r}(p_{\text{in}} - p_p) - \frac{\zeta\,\dot m_r |\dot m_r|}{2 \rho_r A_r L_r}, \qquad \zeta = f_r \frac{L_r}{d_r} + \zeta_e$$
ここで $f_r = 0.02$ は Darcy の管摩擦係数（滑らかな管の乱流の典型値），$\zeta_e = 0.2$ は入口損失係数（ベルマウス付きの典型値）である．

**3. ポートの圧力の式**：ポート容積のガスは断熱的に圧縮・膨張するとし（音響的な剛性），$p_p \propto \rho_p^{\gamma_0}$ から $\frac{dp_p}{dt} = \gamma_0 \frac{p_p}{\rho_p}\frac{d\rho_p}{dt} = \frac{\gamma_0 R T_{\text{in}}}{V_p}\frac{dm_p}{dt}$．$\frac{dm_p}{dt} = \dot m_r - \dot m_{\text{in}}$ より，
$$\frac{dp_p}{dt} = \frac{\gamma_0 R T_{\text{in}}}{V_p}\left(\dot m_r - \dot m_{\text{in}}\right), \qquad \gamma_0 = 1.4$$
吸気弁流量 $\dot m_{\text{in}}$（REQ-04）は，上流圧を $p_{\text{in}}$ から $p_p$ に替えて求める（順流の上流温度は $T_{\text{in}}$）．マニホールドの式（REQ-05 4）は $\dot m_{\text{in}}$ を $\dot m_r$ に替える：$\frac{dp_{\text{in}}}{dt} = \frac{R T_{\text{in}}}{V_{\text{in}}}(\dot m_{\text{th}} - \dot m_r)$．

**4. 既燃ガスの追跡**（REQ-05 4′ をランナの両端に適用）：
$$\frac{dm_{b,\text{in}}}{dt} = -\dot m_r Y_r + \min(0, \dot m_{\text{th}})\,Y_{b,\text{in}}, \qquad \frac{dm_{b,p}}{dt} = \dot m_r Y_r - \dot m_{\text{in}} Y_v$$
$$Y_r = \begin{cases} Y_{b,\text{in}} & (\dot m_r \ge 0) \\ Y_{b,p} & (\dot m_r < 0) \end{cases}, \qquad Y_v = \begin{cases} Y_{b,p} & (\dot m_{\text{in}} \ge 0) \\ 1 - Y_u & (\dot m_{\text{in}} < 0) \end{cases}$$
筒内へ入る新気は $\dot m_{u,\text{in}} = (1 - Y_{b,p})\,\dot m_{\text{in}}$（$\dot m_{\text{in}} \ge 0$）とする（REQ-06 の $Y_{b,\text{in}}$ を $Y_{b,p}$ に替える）．

**5. 共鳴の目安**：弁が閉じているとき，摩擦を無視して線形化すると，ランナの質量流量は角振動数
$$\omega_H = \sqrt{\frac{A_r}{L_r}\left(\frac{\gamma_0 R T_{\text{in}}}{V_p} + \frac{R T_{\text{in}}}{V_{\text{in}}}\right)}$$
で振動する（導出：$\frac{d^2 \dot m_r}{dt^2} = \frac{A_r}{L_r}\left(\frac{dp_{\text{in}}}{dt} - \frac{dp_p}{dt}\right) = -\frac{A_r}{L_r}\left(\frac{R T_{\text{in}}}{V_{\text{in}}} + \frac{\gamma_0 R T_{\text{in}}}{V_p}\right)\dot m_r$，$\dot m_{\text{th}}$ と $\dot m_{\text{in}}$ は $0$ とする）．弁が開くと筒内容積が加わって振動数が下がり，その周期が吸気行程と合う回転数で充填が増える．

**6. 設定**（新しい設定ページ「吸気ランナ」，即時項目）：ランナ ON／OFF（既定 ON），ランナ長 $L_r$（$100$〜$1000\ \text{mm}$，刻み $10\ \text{mm}$，既定 $450\ \text{mm}$），ランナ内径 $d_r$（$20$〜$60\ \text{mm}$，刻み $1\ \text{mm}$，既定 $40\ \text{mm}$）．運転中に OFF から ON にしたときは $\dot m_r = 0$，$p_p = p_{\text{in}}$，$m_{b,p} = Y_{b,\text{in}}\,m_p$ から始める．OFF のときは 9〜11 番目の状態の時間微分を $0$ とし，第11版の式に戻る．

**7. 数値上の要件**：$L_r \ge 100\ \text{mm}$，$d_r \le 60\ \text{mm}$ では $\omega_H \lesssim 5 \times 10^3\ \text{s}^{-1}$ で，RK4 の刻み上限 $10^{-4}\ \text{s}$（REQ-05 5）で $\omega_H \Delta t \le 0.5$ となり安定に解ける．DOPRI5 の誤差判定には 9〜11 番目の状態も含める（絶対許容誤差 $10^{-6}\ \text{kg/s}$，$1\ \text{Pa}$，$10^{-9}\ \text{kg}$）．

**8. 限界**：1次元の波動（管内の圧力波の往復）は解かず，集中定数（質量とばね）で近似する．そのため2次以上の同調や，排気側の脈動との干渉は表現しない．ポートの温度は $T_{\text{in}}$ 一定とし（$m_p$ の計算に用いる），断熱の剛性 $\gamma_0$ とは厳密には整合しない．

**9. 試作での確認（推定を含む）**：第11版までの既定諸元（吸気弁径 $32\ \text{mm}$，IVC $240^\circ$），全開・回転数固定・MBT で，ランナ OFF と ON（$L_r = 450, 900\ \text{mm}$，$d_r = 40\ \text{mm}$）の $\eta_v$ は次のとおり．

| $N$ [rpm] | 1500 | 2000 | 2500 | 3000 | 3500 | 4000 | 5000 | 6000 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| OFF | 0.894 | 0.883 | 0.869 | 0.851 | 0.827 | 0.793 | 0.702 | 0.602 |
| ON 450 mm | 0.899 | 0.907 | 0.907 | 0.896 | 0.873 | 0.831 | 0.673 | 0.564 |
| ON 900 mm | 0.899 | 0.971 | 0.983 | 0.941 | 0.765 | 0.773 | 0.513 | 0.493 |

ランナを長くすると山が低回転へ移り，高くなる．山の後ろには同調が外れた谷ができる．

第12版の既定諸元（吸気弁径 $38\ \text{mm}$，IVC $264^\circ$，7.2 節）では次のとおり（$T_b$ [N·m] / $\eta_v$）．

| $N$ [rpm] | 1500 | 2000 | 2500 | 3000 | 3500 | 4000 | 4500 | 5000 | 6000 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| OFF | 42.5 / 0.828 | 42.8 / 0.830 | 42.1 / 0.825 | 40.9 / 0.817 | 39.3 / 0.807 | 37.5 / 0.794 | 35.4 / 0.777 | 33.0 / 0.758 | 27.5 / 0.707 |
| ON 450 mm | 42.5 / 0.830 | 43.2 / 0.838 | 43.4 / 0.851 | 43.6 / 0.868 | 43.6 / 0.885 | 43.2 / 0.897 | 39.9 / 0.863 | 36.8 / 0.830 | 28.2 / 0.729 |
| ON 900 mm | 42.2 / 0.825 | 46.9 / 0.906 | 49.9 / 0.968 | 48.5 / 0.958 | 43.6 / 0.888 | 41.4 / 0.864 | 37.4 / 0.823 | 25.4 / 0.639 | 19.8 / 0.567 |

* **出典**：Heywood (2018) Ch. 7（吸気系の動的効果，慣性過給）；[D. Winterbone and R. Pearson, *Design Techniques for Engine Manifolds: Wave Action Methods for IC Engines*, Professional Engineering Publishing (1999)](https://www.wiley.com/en-us/Design+Techniques+for+Engine+Manifolds%3A+Wave+Action+Methods+for+IC+Engines-p-9781860581793)
* **対応テスト `TEST-25`（吸気ランナ）**：
  1. [A]（共鳴）吸気弁が閉じている角度で回転を止め（$\omega = 0$），$\zeta = 0$，$\dot m_{\text{th}} = 0$ として $\dot m_r(0) = 10^{-4}\ \text{kg/s}$ から積分したとき，$\dot m_r$ の振動の周期が $2\pi/\omega_H$ と相対誤差 $1\%$ 以内で一致する．
  2. [A]（摩擦）$p_{\text{in}} - p_p = \frac{\zeta \dot m_r^2}{2 \rho_r A_r^2}$ を満たす状態で $\frac{d\dot m_r}{dt} = 0$（相対誤差 $10^{-9}$，$p_{\text{in}} - p_p$ を基準）．
  3. [S]（OFF の一致）ランナ OFF で 9〜11 番目の状態の時間微分が恒等的に $0$ で，吸気弁流量が上流圧 $p_{\text{in}}$ で計算される（S2 の定常から 1 サイクル，全ステップで判定）．
  4. [S]（質量の収支）ランナ ON の部分負荷定常（S3）の直近 5 サイクル平均で，$\dot m_{\text{th}}$，$\dot m_r$，$\dot m_{\text{in}}$ が相互に相対誤差 $1\%$ 以内．全時刻で $0 \le Y_{b,p} \le 1$．
  5. [S]（慣性過給）全開・回転数固定の掃引（REQ-26）で，既定のランナ（$L_r = 450\ \text{mm}$）の $\Delta\eta_v(N) = \eta_{v,\text{ON}}(N) - \eta_{v,\text{OFF}}(N)$ の最大値が $0.02$ 以上．その最大を与える回転数 $N^*$ が，$L_r = 900\ \text{mm}$ では $450\ \text{mm}$ より低い．（第12版の既定諸元での試作：$N^* = 4000 \to 2500\ \text{rpm}$，最大値 $0.103$，$0.143$）

---

### REQ-26：性能曲線タブ（回転数特性の計測，第12版で追加，第19版で改訂）
「性能曲線」タブ（第13版で「特性」から改名）で，現在の設定のまま全開（WOT）で回転数を掃引し，軸トルク・出力などの回転数特性を描くこと．運転中のエンジンは止めずに裏で計算する．

（第19版で本 REQ の本文を全面的に書き直した．第12〜18版の経緯は 7.8〜7.15 節にある．）

#### A. 計測の条件
1. **設定の複製**：計測開始時点の設定（適用済みの値．適用待ちの要リセット項目は含めない）を複製した独立の `EngineCore` で計算する．運転中のエンジンの状態と設定は変えない．
2. **スロットル開度**：$10^\circ$ 刻みの $10, 20, \dots, 90^\circ$ から，計測前に「条件」画面のチェック式ボタンで複数を選ぶ（既定は $90^\circ, 50^\circ, 10^\circ$）．大きい開度から順に計測する．$90^\circ$ は全開．少なくとも1つは選ばれている（最後の1つは外せない）．
3. **固定する条件**：点火は自動最適化 ON（MBT：CA50 $= 10^\circ$ ATDC に自動調整，REQ-12），サイクル変動 OFF，壁温 $T_w = 360\ \text{K}$ 固定（暖機後を想定．壁の熱容量の時定数は約 $100\ \text{s}$ で，各点で整定を待てないため）．
4. **回転数の保持**：理想的な速度一定の動力計とみなし，$\frac{d\omega}{dt} = 0$ とする．軸トルクは REQ-14 の $T_b = \frac{W_{i,\text{net}} - W_f - W_{\text{aux}}}{4\pi}$ で求める．
5. **回転数の点**：$N = 1000$〜$7000\ \text{rpm}$ を刻み $\Delta N$ で区切る．刻みは $100$，$250$，$500\ \text{rpm}$（$61$，$25$，$13$ 点）から選び，既定は $250\ \text{rpm}$．
6. **収束の判定**（選択式．数値はコードの定数表 `SWC` を唯一の情報源とし，「前提」画面にもそこから書き出す）：完爆後のサイクルについて，直近 $3$ サイクルの各量の幅（最大 − 最小）で判定する．
   * **厳しさ**：「標準」は $T_b$ の幅 $\le 0.3\%\,|T_b| + 0.02\ \text{N·m}$，MBT 点火時期の幅 $\le 0.3^\circ$，最少 $4$ サイクル．「厳格」（既定）は $T_b$ の幅 $\le 0.1\%\,|T_b| + 0.01\ \text{N·m}$，MBT の幅 $\le 0.1^\circ$，最少 $6$ サイクル（計算が速いので厳しくした．利用者の指示）．
   * **流量・状態量の判定**（ON／OFF，既定 ON）：上の判定に加え，同じ 3 サイクルで，吸入空気量（$\eta_v$），サイクル平均のスロットル流量 $\bar{\dot m}_{\text{th}}$，サイクル終わりの吸気管圧 $p_{\text{in}}$ の幅が，それぞれの平均の「厳しさ」の相対幅（$0.3\%$ または $0.1\%$）以下であることを求める（利用者の指示「流量とかでも条件付けて」）．
   * 最多 $60$ サイクルで判定を満たさない点は「未整定」とし，白抜きの印で描く．その点の値は最後のサイクルの値とする．
7. **手順**（選択式．利用者の指示「a，b，c，d どれか決められるように」）：
   * 「上り」（既定）：低回転から順に，各点は前の点の状態から続ける．
   * 「往復」：上りに続けて高回転から順（下り）にも計測し，各点で両者の平均を値とする．両者の差の最大（$|\Delta T_b| / \max T_b$，$|\Delta \eta_v|$）を完了表示に出す．計算は約 2 倍．
   * 「独立」：各点を，その回転数で燃料を入れて単独に始める．前の点に引きずられることは原理的に無い．
8. **記録する量**：$N$，$T_b$ [N·m]，$P_b$ [kW]，BMEP [kPa]，$\eta_v$，bsfc [g/kWh]，$\eta_b$，MBT 点火時期 [°BTDC]，$x_r$，整定の可否，用いたサイクル数，判定に使った各量の幅．

#### B. 画面
0. **用語**：画面の文言では「掃引」を使わず「計測」と言う．タブ名は「性能曲線」．
1. 上段に `[計測開始]`（実行中は `[中止]`）と `[基準を消す]`，その下に表示の切替ボタン6つ `[出力]` `[η_v]` `[燃費]` `[点火]` `[条件]` `[前提]`，残りの高さにグラフまたは表を置く（スクロール無し，REQ-15）．`[条件]` と `[前提]` の表示中は状態表示（3行）を隠す．
2. **条件画面**（計測前に選ぶ）：開度のチェック式ボタン9つ（$10$〜$90$），刻み（$100$，$250$，$500$），厳しさ（標準，厳格），流量・状態量の判定（ON／OFF），手順（上り，往復，独立）．どれかを変えると，計測済みの結果に「設定が変わりました」と表示する．
3. **前提画面**：計測の仮定を数値で書き出す表．固定する条件（開度の一覧，回転数の保持，点火，サイクル変動，壁温），回転数の点（範囲，刻み，点数，手順），収束の判定（選んだ厳しさの数値，流量・状態量の判定の有無，最少・最多サイクル数，採る値），計測に使う設定（計測済みなら計測時の値：大気圧，当量比，圧縮比，ボア×ストローク，吸気弁径，IVO・IVC・EVO・EVC（VVT を含む実効値），吸気ランナ，補機負荷トルク）．
4. **グラフ**：`[出力]` は $T_b$ と $P_b$，`[η_v]` は $\eta_v$，`[燃費]` は bsfc と $\eta_b$，`[点火]` は MBT 点火時期と $x_r$．横軸は $N$（$1000$〜$7000\ \text{rpm}$，目盛 $1000\ \text{rpm}$ ごと）．縦軸は 0 起点の段階的な自動レンジで，負の値があれば負側にも広げる．$\eta_v$ は $0$〜$1.2$，$\eta_b$ は $0$〜$0.5$ に固定．$P_b \le 0$ の点では bsfc と $\eta_b$ を描かない．
5. **重ね描き**：選んだ開度の曲線を，開度に応じた色（$10^\circ$ を青，$90^\circ$ を赤とする色相の連続な変化）で重ね，凡例に開度を示す．点は印（●）と線でつなぎ，求まるたびに描き足す．凡例はプロット領域内に収まる．
6. **状態表示（3行）**：計測中は開度・回転数の進捗．完了後は所要時間，最大の開度の曲線の最大トルクと最大出力（各回転数），往復なら往復差の最大．3行目に基準または古さの注記．$360\ \text{px}$ 幅で切れない．
7. **基準**：新しい計測が完了したとき，それまでの結果（全開度）を「基準」として灰色の細線で重ねる．`[基準を消す]` で消す．中止した計測は基準を置き換えない．
8. 実行中はタブを切り替えても計測を続ける．検証タブの全テスト実行中は計測を開始できない．

#### C. 実行
1. 計測は時間分割で実行し（1 フレームあたり計算 $8\ \text{ms}$ 以内．経過時間は 4 ステップごとに確かめる），運転中のエンジンの実時間の進行を妨げない．
2. 既定（3 開度 × 25 点，厳格，流量・状態量の判定 ON，上り）の計測の所要時間は，ヘッドレス Chromium の $360 \times 640$ で $20\ \text{s}$ 以下．

* **対応テスト `TEST-26`（性能曲線タブ）**：
  1. [U] 6 タブが表示され，タブの文字が切れず，画面の文言に「掃引」が無い．性能曲線タブがスクロールしない．表示ボタン6つが $44\ \text{px}$ 以上で文字幅の余裕（REQ-15 G）を満たす．4 つのグラフ表示の全グラフに単位付きの軸名と目盛がある．完了後の状態表示の3行が切れない．
  2. [S]（回転数の保持）各点で角速度の状態 $\omega$ が目標と相対誤差 $10^{-9}$ 以内で一致し，サイクル時間から求めた回転数が目標 $\pm N \cdot \frac{0.5^\circ}{720^\circ}$ 以内（サイクル境界の検出の量子化の上限）．
  3. [S]（恒等式）各点で $P_b = T_b \cdot \frac{2\pi N}{60}$，$\text{BMEP} \cdot V_d = 4\pi T_b$（相対誤差 $10^{-9}$）．
  4. [S]（決定性）同じ設定で2回計測した結果が完全一致．
  5. [U]（非干渉）`[計測開始]` から完了までの前後で，運転中のエンジンの設定と状態が一致し，1 フレームあたりの計算時間の最大が $30\ \text{ms}$ 以下．（項目5・6 の画面操作による計測は，全テストの所要を抑えるため，刻み $500\ \text{rpm}$・開度 $90^\circ$ のみで行う．）
  6. [U]（基準と古さ）2回目の計測完了後に基準が描かれ，`[基準を消す]` で消える．計測後に設定を1つ変えると古さの表示が出て，再計測で消える．`[中止]` で止めた結果は基準を置き換えない．
  7. [S]（所要時間）既定の計測（C.2）が $20\ \text{s}$ 以下．
  8. [S]（物理的な形）既定設定の全開の曲線で，$T_b$ の最大が端点以外にあり，$P_b$ の最大を与える回転数が $T_b$ の最大を与える回転数より高く，全点が整定する．
  9. [S]（手順の一致）刻み $500\ \text{rpm}$，開度 $90^\circ$，厳格・流量判定 ON で，「上り」「往復」「独立」の結果が，既定設定，ランナ長 $900\ \text{mm}$，ランナ OFF のそれぞれで，全点で $|\Delta T_b| \le 0.5\%\,\max T_b$，$|\Delta \eta_v| \le 0.005$ で一致する．
  10. [U]（条件画面）開度のボタンで選んだ集合が計測に使われる開度と一致し（大きい順），最後の1つは外せない．刻みのボタンで点数が $61$，$25$，$13$．厳しさ・流量判定・手順のボタンが状態を切り替える．どれを変えても計測済みなら古さの表示が出る．全ボタンが $44\ \text{px}$ 以上で文字幅の余裕を満たし，画面がスクロールしない．
  11. [U]（前提画面）表の数値（開度の一覧，壁温，刻み，点数，選んだ厳しさの数値，最少・最多サイクル数，補機負荷トルク）が定数表 `SWC` と選択・設定値に一致し，表の高さが表示領域の $95\%$ 以下．
  12. [S]（開度の重ね描き）既定（$90, 50, 10^\circ$）で3曲線がそろい（各 25 点），全点で $T_b(10^\circ) < T_b(50^\circ)$，$\eta_v(10^\circ) < \eta_v(50^\circ)$，$10^\circ$ の $T_b$ は回転数とともに単調に減る．凡例に3開度があり，プロット領域内に収まる．9開度すべてを選んでも凡例が収まる．（$50^\circ$ と $90^\circ$ の大小は判定しない．このモデルでは高回転で $50^\circ$ が全開をわずかに上回り，その結果を尊重する．利用者の指示による）
  13. [S]（収束の判定）厳格・流量判定 ON の全開の計測で，整定した全点について，記録した幅が判定値以下で，用いたサイクル数が $6$ 以上．流量判定の幅（$\eta_v$，$\bar{\dot m}_{\text{th}}$，$p_{\text{in}}$）も判定値以下．「往復」では完了表示に往復差が出る．

---

## 4. 要件・テストトレーサビリティマトリクス

| 要件ID | 要件名称 | 対応テストID | 検証内容と合格基準（アサーション） |
| :--- | :--- | :--- | :--- |
| `REQ-01` | スライダ・クランク運動学モデル | `TEST-01` | $V(\pi)/V(0) = \varepsilon$（誤差 $<10^{-12}$），$\frac{dV}{d\theta}$ と中心差分の相対誤差 $<10^{-9}$，設定範囲端点（$\varepsilon \in [1.1, 100]$，$\lambda \le 0.5$）での成立 |
| `REQ-02` | 作動流体の熱物性モデル | `TEST-02` | Meyerの関係式 $c_p - c_v = R$（誤差 $<10^{-12}$），$\gamma(T)$ の高温単調減少性 |
| `REQ-03` | カムプロファイル・有効開口面積 | `TEST-03` | 3種カムの境界値 $L_v(0)=L_v(1)=0$，最大値 $L_v(0.5)=L_{\max}$，プロファイル間の大小関係，VVT位相によるリフト曲線の平行移動と作用角不変，弁・ピストン干渉判定，運転中の位相変更 |
| `REQ-04` | 圧縮性オリフィス流量モデル | `TEST-04` | $\Delta p=0$ で流量 $0$，$r_p \le r_{\text{crit}}$ でのチョーク流量飽和，圧力反転時の反対称性 |
| `REQ-05` | スロットル・吸気マニホールド（大気圧可変） | `TEST-05` | $A_{\text{th}}$ の端点・単調性，マニホールド質量保存（相対誤差 $10^{-6}$），チョーク流量の $p_{\text{atm}}$ 比例，スロットル流量と吸気弁流量のサイクル平均一致（$1\%$ 以内） |
| `REQ-06` | 筒内2成分ガス組成追跡 | `TEST-06` | 全サイクルでの有界性 $0 \le m_u \le m$，燃焼終了時の新気消費整合性 |
| `REQ-07` | 乱流火炎伝播連動Wiebe燃焼 | `TEST-07` | $\int \frac{dx_b}{d\theta}d\theta = 1 - e^{-a}$（誤差 $<10^{-5}$），残留ガス・遅角に対する燃焼期間感度，リッチ燃焼の生成物（元素保存・水性ガスシフト）と $\phi\varepsilon(\phi)$，当量比の効果（モードA・B），着火遅れ・燃焼速度・形状係数の効果 |
| `REQ-08` | Woschni壁面熱伝達・壁温モデル | `TEST-08` | $C_{\text{woschni}}=0$ での断熱性，燃焼増圧による熱伝達率 $h_c$ の増大 |
| `REQ-09` | 開サイクル熱力学第一法則 | `TEST-09` | 断熱閉サイクルでの $p(2\pi) = p(\pi)\varepsilon^{\gamma_0}$（誤差 $<10^{-5}$）および膨張後の可逆性 |
| `REQ-10` | クランク運動・スターター・摩擦（Chen–Flynn） | `TEST-10` | FMEP 式の数値，無燃焼クランキング平衡回転数，完爆判定とスターター離脱，$W_f = \text{FMEP}\cdot V_d$ |
| `REQ-11` | 水ブレーキ動力計・運転モードA/B | `TEST-11` | $T_{\text{dyno}} \propto f_{\text{eff}}\omega^2$ と定格点の一致，充水一次遅れの厳密性，モードA/Bの排他（同時に2つの制御が動作しない），モードBでの目標回転数整定（$\pm 10\ \text{rpm}$），アンチワインドアップ，定常での軸トルクと吸収トルクの一致（$2\%$ 以内），大気圧低下時の軸トルク減少，容量超過時の `OVERLOAD` 点灯 |
| `REQ-12` | ECU スロットル開度PI制御 | `TEST-12` | 目標回転数への整定（$\pm 25\ \text{rpm}$ 以内），$p_{\text{atm}}$ 低下時の定常開度増加，アンチワインドアップ，モードBでの開度固定，無負荷アイドル（$800\ \text{rpm}$）の成立，点火時期の自動最適化（CA50 ≈ ATDC 10°，最大 IMEP の 99% 以上） |
| `REQ-13` | 数値積分ソルバ（RK4 & RK45） | `TEST-13` | RK4 の4次収束，DOPRI5 の局所誤差次数と誤差推定次数，両ソルバの1サイクル $p_{\max}$・$W_{i,\text{net}}$ の一致（$0.3\%$） |
| `REQ-14` | メトリクス集計・基準サイクル | `TEST-14` | IMEP・PMEP・BMEP・$P_b$ の恒等式，$\eta_m$・bsfc の範囲，Otto 上限，動力収支 $2\%$，基準サイクルの不変性，無効値を表示しない規則 |
| `REQ-15` | 画面構成・スマートフォン操作 | `TEST-15` | 全タブ（解説を除く）のスクロール無し，ボタン寸法 $\ge 44$ px・重なり無し・折り返し無し，`input[type="range"]` 不使用，kPa 統一，タップ判定（接触幅で棄却しない），24チップの選択，Canvas ビットマップ寸法の一致，フレームレート非依存の時間進行 |
| `REQ-16` | 解説タブ | `TEST-16` | 全章の存在，未定義記号 $0$，係数の単一情報源，MathML の `display` 値と組版寸法，スクロール位置保持 |
| `REQ-17` | グラフの軸・目盛・自動レンジ | `TEST-17` | 目盛が1-2-5系列で4〜8区間，段階型の拡大・縮小・非振動，帯域型，全グラフの軸名・単位・目盛数値・凡例，既知図形の描画位置 $\pm 1$ px，定常での範囲不変 |
| `REQ-18` | 設定画面（即時反映・$p$-$V$ 効果確認） | `TEST-18` | 表示値と内部値の単位整合（$p_{\text{atm}} = 101.3$ kPa），増減の可逆性，即時項目と要リセット項目の反映タイミング，$\varepsilon \in [1.1, 100]$ の受理，選択ボタン表示，基準サイクルの保存規則と不変性，差分表示 |
| `REQ-19` | 機関断面図 | `TEST-19` | 実寸比（冠面・連桿長・クランク半径・弁変位 $\pm 0.5$ px），全諸元範囲で Canvas 内，ポート多角形の単純性，ポート中心線の色，ガス色の単調性，弁とピストンの非干渉 |
| `REQ-20` | 検証基盤 | `TEST-20` | 全26テストのアプリ内実行（未実装なし），運転中の機関への非干渉，決定性，実行中のフレーム時間と総所要時間 |
| `REQ-21` | エンジン音（ウェーブテーブル＋排気管共鳴＋圧縮器＋サイクル変動） | `TEST-21` | 音速と共鳴周波数，位相の進み（$10^{-9}$），厳密周期（変動 OFF），共鳴の極大位置と極大／極小比，表の作成と周回時の切替，無音と振幅制限，音量の順序，送信値の再生速度非依存，圧縮器の静特性・即応・保持・戻り，3000 rpm 全開で飽和 $< 0.1\%$ と波高率の維持，管内損失と残響 $< 1\%$（40 ms），サイクル変動の統計と決定性，倍音／中間比（OFF $\ge 100$ dB，ON $\le 40$ dB），AudioWorklet 出力と純粋合成の一致 |
| `REQ-22` | 制御状態の表示 | `TEST-22` | 4状態の見出しと数値，飽和表示，点火の自動／固定，折り返し無し |
| `REQ-23` | 目標回転数スライダ | `TEST-23` | 部品の寸法と配置，つまみからのドラッグでの値と反映，トラックのタップで値が飛ばない，±ボタンと範囲外の扱い，機関図と帯の非重なり |
| `REQ-24` | 内部 EGR と点火時期の妥当性 | `TEST-24`（＋`TEST-05` 6・7） | 吸気管の既燃ガス追跡と収支，軽負荷・部分負荷・全開・アイドルの $x_r$ の大きさと傾向，ポンプ損失と $T_{\max}$ の変化，MBT 点火時期と火炎発達角 |
| `REQ-25` | 吸気ランナの慣性（慣性過給） | `TEST-25` | 共鳴周期，摩擦の式，OFF での一致，質量収支と組成の有界性，ランナ長による $\eta_v$ の山の移動 |
| `REQ-26` | 性能曲線タブ（回転数特性の計測） | `TEST-26` | 画面と軸，回転数の保持，恒等式，決定性，非干渉，基準と古さ，所要時間，カーブの形，手順の一致，条件画面，前提画面，開度の重ね描き，収束の判定 |

---

## 5. 改訂の経緯と批判的レビュー（第5版）

前版までの実装と検証を見直し，不具合の原因を「仕様とテストの穴」として整理した．各項目は本版の要件・テストで塞いである．

| 見つかった問題 | 原因（仕様・テスト側） | 本版での対策 |
| :--- | :--- | :--- |
| 大気圧が `101325000 kPa` と表示された | 表示値と内部値の単位換算を検査するテストが無かった．単位係数を表示と入力で別々に扱っていた | 項目定義表の単位係数を唯一の情報源とする（1.2節，REQ-18 B.2）．`TEST-18` 項目1・2 |
| 3000 rpm の音が「電子音」に聞こえた（利用者の試聴） | 音の品質を判定する基準が無く，振幅制限の歪み・一定の高さの共鳴の唸り・完全な周期性を検出できなかった | 圧縮器，管内損失と消音器，サイクル変動を追加し，飽和率・波高率・残響・倍音／中間比をテスト化（REQ-21 B〜B″，`TEST-21` 項目10〜14）．実装中にテストが圧縮器の不具合2件（包絡の更新式の誤り，保持の更新判定の浮動小数点誤差）を検出 |
| 吸気ポートの一部が塗られなかった | 図の要件が「描くこと」だけで，塗りの連続性を判定する基準が無かった．多角形が自己交差していた | REQ-19 項目4，`TEST-19` 項目3・4 |
| 機関図が二重に描かれ縦に歪んだ | Canvas のビットマップ寸法と表示寸法の一致を，描画時に確認していなかった | REQ-15 F.1，`TEST-15` 項目5 |
| 解説の数式が縦に崩れた | 「`<merror>` が無い」ことしか検査しておらず，組版の崩れを検出できなかった | `TEST-16` 項目6・7 |
| 検証タブのチップが押せなかった | 接触幅による棄却という，実機でしか効かず検証できない規則を入れていた．チップの選択をテストしていなかった | 接触幅での棄却を廃止（REQ-15 D.3），`TEST-15` 項目4 |
| 16テスト中8件が「未実装」のまま公開された | 「全テスト PASS が納品条件」と書きながら，未実装を許す状態が実装に存在した | 「未実装」状態の廃止と納品条件の明文化（REQ-20 B） |
| 停止中に $\eta_v = 1162$ などの無意味な値が出た | メトリクスの有効条件が未定義だった | REQ-14 表示規則，`TEST-14` 項目6 |
| グラフに軸も目盛も無く，範囲が毎フレーム変わって読み取れなかった | グラフの要件が系列の列挙だけだった | REQ-17 全体，`TEST-17` |
| 設定を変えても効果が分からなかった．ロック解除と適用の2手間が必要だった | 誤操作防止を優先しすぎ，ボタン操作の安全性を過小評価していた | ロック廃止・即時反映・$p$-$V$ 効果確認パネル（REQ-18） |
| 実機で TEST-18 が FAIL した（点火時期 60 → 60） | テストが「設定は既定値のまま」と暗黙に仮定していた．利用者が点火時期を上限にしていたため `[+]` が無効だった | UI自己検査は既定設定から開始し終了後に復元（REQ-20 B.2），極端な設定での実行を [D] に追加（`TEST-20` 項目4） |
| 運転モードが `0:A 1:B` と表示された | 選択項目の表示方法が未定義だった | REQ-18 B.1，`TEST-18` 項目5 |
| 弁タイミングを変えるとコールドリセットされた | リセットが必要な項目の範囲を，物理的な根拠なしに広く取っていた | 要リセット項目を $B, S, l, \varepsilon$ に限定（REQ-18 A） |
| 仕様にあるが実装されなかった機能が多数あった（RK45，スナップショット，クロスヘア，横持ち，性能適応など） | 仕様の範囲が実装の実力と合っておらず，優先順位が無かった | 1.1節でスコープを明示．スナップショットは基準サイクルへ統合．ピンチズームは廃止 |

**テストで保証できないことの明示**：見た目の良し悪し（配色，図の「それらしさ」），実機の指での操作感，実機での処理速度は，自動テストでは完全には判定できない．これらは 6節のチェックリストで利用者が確認し，不合格が出たら，その不具合を検出できる自動テストを追加してから直す．

---

## 6. 実機目視チェックリスト [M]（Galaxy S26+／Chrome）

1. 運転タブ：機関図が1つだけ，歪まずに表示される．吸気ポートが外端からバルブまで途切れず青い．START で回り始め，火花・火炎・弁の動きが見える．
2. 運転タブ：全ボタンが指で押せ，押した結果が直ちに画面に現れる．
3. 線図タブ：7画面とも軸名・目盛数値が読める大きさで，曲線が枠内に収まる．定常運転中に範囲がばたつかない．
4. 設定タブ：`[+]` `[−]` を押すと値が1刻み変わり，$p$-$V$ 図に基準（灰）と現在（橙）が重なって違いが見える．大気圧が `101.3 kPa` 付近で表示される．
5. 設定タブ：「機関」で $\varepsilon$ を変えて適用すると，機関図の比率が変わる．
6. 検証タブ：「全テスト実行」で進捗が進み，26チップがすべて PASS になる．各チップを押すと詳細が切り替わる．
7. 解説タブ：数式が横書きで正しく組まれ，縦スクロールできる．
8. どのタブでも（解説を除き）画面がスクロールしない．
9. 運転タブで START すると音が鳴り（ヘッドホン推奨），回転数の上昇とともに「トトト」という連続音から「ブー」という音の高さのある音へ変わる．`[音OFF]` で止まる．設定「音響」で排気管長を変えると音色が変わる．
10. 性能曲線タブで計測を始めてから運転タブへ切り替えても，エンジンが滑らかに回り続け，戻ると計測が進んでいる．計測の完了後，トルクの山が中回転にある．
11. 運転タブのメトリクスの項目をタップすると，その項目だけが日本語名と記号の間で切り替わる．タブ名・ボタンの文字が欠けない．

---

## 7. 第5版の確定事項と実装検証結果

1. **$\varepsilon$ の範囲**：$1.1$〜$100$（刻み $0.1$，×10 切替）．$\varepsilon > 1$ は幾何学的な必要条件．
2. **スナップショット**：基準サイクル（自動保存＋`[基準更新]`／`[基準を現在に]`）へ統合した．
3. **摩擦モデル**：Chen–Flynn 型を採用した（REQ-10）．アイドルの FMEP は約 $55\ \text{kPa}$．これに伴い $A_{\text{leak}}$（$2 \to 1\ \text{mm}^2$），ECU ゲイン，$\alpha_{\text{crank}}$，$\alpha_{\text{base}}$ を再調整した（REQ-05，REQ-12）．
4. **大気圧の既定値**：設定の格子（刻み $0.1\ \text{kPa}$）に合わせ $101.3\ \text{kPa}$ とした．
5. **REQ-17 C の既定フルスケール**：机上値のまま実装した．アイドルでは $p$ 軸が $5000 \to 1000\ \text{kPa}$ へ自動縮小する．
6. **VVT による $\eta_v$ の変化**：S8（$1500\ \text{rpm}$，$\varphi_{\text{in}} = +30^\circ$）で $0.70 \to 0.61$（低下）．テストは「$1\%$ 以上変化」のみを判定する．
7. **スターター**：無負荷 $2000\ \text{rpm}$・拘束 $60\ \text{N}\cdot\text{m}$ の従来仕様のままで，クランキング回転数は約 $1750\ \text{rpm}$ と実機（$200$〜$300\ \text{rpm}$）より高い．始動直後の吹け上がり（約 $1500\ \text{rpm}$）とアイドル整定の遅さ（約 $12\ \text{s}$）の一因であり，次の改訂の検討事項とする．
8. **実装検証結果（開発時 [D]）**：ヘッドレス Chromium の $360 \times 640$，$384 \times 780$，$412 \times 915$ で，アプリ内テスト 20/20（検証項目 177 件）が PASS．所要 約 $15\ \text{s}$．全項目を上限にした利用者状態からの実行でも 20/20 PASS し，実行前後で状態が完全一致した．
9. **実機結果（第5版）**：Galaxy S26+ で初回 19/20（TEST-18 が3件 FAIL，所要 $5.4\ \text{s}$．原因はテスト側の前提，上表）．修正版で **20/20 PASS** を確認した．
10. **REQ-21（エンジン音）の実装検証**：ヘッドレス Chromium の3ビューポートで 21/21（検証項目 195 件）PASS．AudioWorklet の出力は，http 配信（Blob URL）と file://（data URL）の両方で純粋合成と完全一致（最大差 $0$）した．実機での聞こえ方は 6節 項目9で確認する．
11. **REQ-21 改訂（A＋B＋C）の実装検証**：3ビューポートと極端な利用者状態で 21/21（検証項目 211 件）PASS．$3000\ \text{rpm}$ 全開：飽和 $12.5\% \to 0\%$，残響（$40\ \text{ms}$）$4.7\% \to 0.04\%$，倍音／中間比（$1500\ \text{rpm}$）：変動 OFF $270\ \text{dB}$，ON $27\ \text{dB}$．A＋B のみとの比較は，設定「音響」のサイクル変動 OFF で行える．

### 7.1 第6版（利用者コメント9件）の対応
| コメント | 対応 | 要件 |
| :--- | :--- | :--- |
| クランク角が 360 から始まるように（弁オーバーラップを見たい） | 横軸 $360$〜$1080^\circ$ | REQ-17 A.4，TEST-17 項目7 |
| `p·T` は p-θ では？ | ボタン名を `p-θ` に変更 | REQ-15 C.2 |
| カムプロフィールを見ながら設定したい | 「VVT・カム」「弁タイミング」にカム線図 | REQ-18 D.0，TEST-18 項目9 |
| 点火時期の自動最適化と ON/OFF（ノック無視） | CA50 フィードバック（目標 ATDC 10°） | REQ-12 4，TEST-12 項目6〜8 |
| 既定で DOPRI5(4) | 既定ソルバを変更 | REQ-13 |
| ルートのかかり方が変 | 指数の底を括弧の組全体に，$\Psi$ を標準形に | REQ-16 3，TEST-16 項目8 |
| 回転数の上限撤廃 | $N_{\text{target}}$ の上限なし | REQ-18 B.4，TEST-18 項目8 |
| サイクル変動の効果が分からない（機能は残す） | 調査：追加量が弁別閾より1桁小さい | REQ-21 B″ |
| 何を目標に何を動かしているか一目で分かるように | 制御状態カード | REQ-22，TEST-22 |

**第6版の実装検証**：ヘッドレス Chromium の $360 \times 640$，$384 \times 780$，$412 \times 915$ と極端な利用者状態で 22/22（検証項目 233 件）PASS，所要 約 $40\ \text{s}$（DOPRI5(4) 既定化と MBT の掃引検査で増加）．一度だけ TEST-13 実行中に $336\ \text{ms}$ のフレーム停止を観測したが再現せず，処理の分割単位を超える同期区間はコード上に無いことから，ガベージコレクションによる停止と推定している（再発すれば TEST-20 項目5 が検出する）．実装中にテストが検出した修正：圧縮器の出力制限を $\tanh$ から「$0.8$ まで線形・以降を丸める」折れ点付き制限へ変更（$\tanh$ のピーク付近の曲がりで波高率が $5.5\%$ 下がった），制御状態カードの文言短縮（最長表示で $360\ \text{px}$ 幅をはみ出した），TEST-15 項目6 の許容を「$50\ \text{ms} \times$ 速度 ＋ 最大刻み $1\ \text{ms}$」に修正（DOPRI5(4) の低回転での刻みが大きく，最後の1ステップ分行き過ぎる）．

### 7.2 未決事項
1. **（第7版で解決：(b)＋(c) を採用，7.3節）サイクル変動を聞き分けられるようにするか**：(a) 強さの倍率（$\times 1$〜$\times 10$）を設定に加える（$\times 10$ で振幅 $30\%$・周期 $5\%$．実機より誇張），(b) ばらつきを音ではなく燃焼モデル（燃焼期間・着火遅れ）に入れ，IMEP・$p_{\max}$・排気音に物理的に波及させる，(c) 排気噴流の乱流による広帯域雑音（前回の案D）を加える．私の推奨は (b)＋(c)．
2. **（第12版で解決：(b) を採用）既定の吸気弁諸元を見直すか**：(a) 現状維持（吸気弁径 $32\ \text{mm}$，IVC $240^\circ$．トルクの山は約 $2000\ \text{rpm}$），(b) 吸気弁径 $38\ \text{mm}$・IVC $264^\circ$ に変える（山は $3000$〜$4000\ \text{rpm}$．既存テストの基準値への影響の確認が要る）．
3. **（第18版．第19版で解決：(a)〜(d) を選択式にした）性能曲線の計測を前の点からさらに独立にするか**：(a) 整定の判定を厳しくする（幅 $0.1\%$，最少 $6$ サイクル），(b) 判定を出力だけでなく状態量（サイクル始点の $p_{\text{in}}, m_{b,\text{in}}, \dot m_r, p_p$）の変化にも課す，(c) 上りと下りの両方を計測し，平均と差（不確かさ）を示す，(d) 各点を独立に始める（計算は約 2 倍）．

### 7.3 第7版（推奨 B・C の採用と追加コメント3件）の対応
| 項目 | 対応 | 要件 |
| :--- | :--- | :--- |
| 推奨 B：燃焼モデルのサイクル変動 | 着火時期 $\sigma = 3^\circ$CA，燃焼期間 $\sigma = 12\%$．COV(IMEP) は実機の目安内 | REQ-07，TEST-07 項目3・4 |
| 推奨 C：排気噴流の流れ雑音 | 流量の2乗に比例する帯域雑音（1〜6 kHz） | REQ-21 B‴，TEST-21 項目16・17 |
| まだルート直ってなさそう，数式が美しくない | 数式フォント埋め込み，組版規則の整備，本文の記号も数式化，はみ出す式の縮小 | REQ-16 3，TEST-16 項目9〜11 |
| 点火時期の自動値を行に反映，制約をなくす | 自動値の表示，OFF 時の引継ぎ，上下限の撤廃 | REQ-12 4，TEST-18 項目10〜12 |
| TEST-16 が実機で FAIL | 実機の結果詳細は未入手．Android に数式フォントが無いことによる組版寸法の検査の不合格と推定し，フォント埋め込みで全端末の組版を揃えた．再確認を依頼 | REQ-16 |

**誤りの訂正**：第6版の検証記録で「TEST-13 実行中の $336\ \text{ms}$ のフレーム停止はガベージコレクションによる」と推定したが，誤りだった．TEST-12 の末尾に $2\ \text{s}$ 分の積分を分割せずに回す処理があり，次のフレームで TEST-13 の計測に計上されていた（第7版で再発し $273\ \text{ms}$，原因を特定して修正）．

**第7版の実装検証**：ヘッドレス Chromium の3ビューポートで 22/22（検証項目 251 件）PASS，所要約 $42\ \text{s}$．

### 7.4 第8版（利用者の指摘3件）の対応
| 指摘 | 原因・対応 | 要件 |
| :--- | :--- | :--- |
| 当量比を動かしても出力に影響しない | 2つの原因を確認した．(1) 既定のモードA では回転数が制御量で，ECU が開度で打ち消す（設計どおり．燃料流量は変わるので，メトリクスに燃料流量を表示する）．(2) リッチ側の物理が不足：$\phi > 1$ の燃料を「燃えない」としか扱わず，IMEP がほぼ一定だった．不完全燃焼（CO・H₂）を元素保存と水性ガスシフト平衡で扱う．あわせて，図示熱効率の分母が実際の発熱になっていた定義の誤りを，供給燃料の発熱量に直した | REQ-07 4，REQ-14，TEST-07 項目5・6，TEST-14 項目7 |
| 弁オーバーラップを見るときだけ 360° から，他は 0° から | 線図③「弁」とカム線図だけ $360$〜$1080^\circ$ | REQ-17 A.4，TEST-17 項目7 |
| 着火遅れや熱発生の速度を変えるパラメータ | 着火遅れ係数，燃焼速度係数，Wiebe 形状係数を追加（「燃焼速度」ページ） | REQ-07 2・3，REQ-18 C.2，TEST-07 項目7・8 |

**第8版の実装検証**：`npm test`（3ビューポート＋極端な利用者状態）で 22/22（検証項目 265 件）PASS，状態復元 OK．実測値：モードB・開度固定の IMEP は $\phi = 0.8 / 0.9 / 1.0 / 1.1 / 1.2$ で $798 / 883 / 962 / 930 / 901\ \text{kPa}$，$\eta_{i}$ は $\phi = 1.0 \to 1.2$ で $0.393 \to 0.311$．モードA（アイドル）の燃料流量は $\phi = 1.0 \to 1.2$ で $0.032 \to 0.041\ \text{g/s}$（回転数は $800\ \text{rpm}$ のまま）．$c_b = 2$（点火固定）で $p_{\max}$ $5249 \to 7196\ \text{kPa}$，自動最適化 ON では点火が $45.5 \to 30.9^\circ$ に遅角し CA50 $9.97^\circ$．

### 7.5 第9版（利用者コメント：目標回転数スライダ）
| 指摘 | 対応 | 要件 |
| :--- | :--- | :--- |
| 運転タブの機関図の位置に，目標回転数を指定するスライダと ± の微調整ボタンがほしい | 「スライダ禁止」（REQ-15 D.1）の唯一の例外として，つまみからのドラッグだけが値を変える誤操作対策付きのスライダを設ける | REQ-15 D.1，REQ-23，TEST-23 |


**第9版の検証**：`npm test` を実行し，3 ビューポート（360×640，384×780，412×915）と極端な利用者状態で PASS 23/23（検証項目 279 件中 FAIL 0 件），状態復元 OK を確認した．TEST-23 では，360×640 でトラックの有効幅が約 128 px（1 px あたり約 59 rpm）であることを実測した．細かな調整は ± ボタンで行う設計とした．

### 7.6 第10版（利用者コメント：線図②の横軸範囲）
| 指摘 | 対応 | 要件 |
| :--- | :--- | :--- |
| 線図（$p$，$T$，熱発生率の3グラフ）だけ $180$〜$540^\circ$ の範囲で描画してほしい | 線図②「$p$-$\theta$」の3グラフの横軸を $[180, 540]$（$360$ = 圧縮上死点，目盛 $90^\circ$ ごと）に変更．他の線図は変更なし | REQ-17 A.4，TEST-17 項目7 |


**第10版の検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 23/23（検証項目 279 件中 FAIL 0 件），状態復元 OK を確認した．

### 7.7 第11版（内部 EGR の検討と着火遅れの校正）
**検討の結果**：既定諸元で IVO・EVC だけを変えてオーバーラップを $20 \to 80^\circ$ に広げても，軽負荷（$1500\ \text{rpm}$，$f = 0.1$）の $x_r$ は $0.102 \to 0.105$ しか増えなかった．このとき吸気側へ吹き返した量は新気の $79\%$ に達していた．原因は REQ-05 の仮定 (c)「管内は新気」で，吹き返した既燃ガスが次の吸気行程で新気として数えられていた．Fox–Cheng–Heywood の相関（吸排気差圧が大きいほどオーバーラップの残留ガスが増える）とも合わない．

**対応（利用者の選択：案1＋案3）**：
| 指摘 | 対応 | 要件 |
| :--- | :--- | :--- |
| オーバーラップによる内部 EGR の効果がほとんど出ない | 吸気管に既燃ガス質量 $m_{b,\text{in}}$ を状態として加え（$\mathbf{y} \in \mathbb{R}^8$），順流の組成を管内組成にする | §2.2，REQ-05 4′，REQ-06，TEST-05 6・7 |
| MBT 点火時期が進みすぎ（全開 $3000\ \text{rpm}$ で $64^\circ$ BTDC） | 着火遅れの $\ell_{\text{kernel}}$ を $0.05B \to 0.025B$，$C_k$ を $0.2 \to 0.4$ に校正 | REQ-07 |
| 上記の妥当性を判定できるようにする | 軽負荷・部分負荷・全開・アイドルの $x_r$ と傾向，MBT と火炎発達角のテストを追加．$\bar{Y}_{b,\text{in}}$ をメトリクスに表示 | REQ-14，REQ-24，TEST-24 |

**試作での確認（推定を含む）**：変更を成果物の複製に当てて回した結果を次に示す（点火は自動 MBT，サイクル変動 OFF，20 s 後）．

| 条件 | $\theta_{\text{OL}}$ | $x_r$（変更前→後） | $\bar{Y}_{b,\text{in}}$ | PMEP [kPa] | $\eta_b$ | $T_{\max}$ [K] | MBT [°BTDC]（変更前→後） |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 軽負荷 1500 rpm，$f = 0.1$ | 20° | 0.102 → 0.173 | 0.068 | −81 | 0.135 | 2564 | 47.7 → 22.6 |
| 〃 | 80° | 0.105 → 0.380 | 0.305 | −73 | 0.145 | 2128 | 47.5 → 28.7 |
| 部分負荷 2000 rpm，$f = 0.3$ | 20° | 0.065 → 0.081 | 0.016 | −57 | 0.300 | 2833 | 54.8 → 22.1 |
| 〃 | 80° | 0.078 → 0.162 | 0.079 | −49 | 0.308 | 2656 | 56.5 → 24.6 |
| 全開 3000 rpm | 20° | 0.047 → 0.053 | 0.005 | −55 | 0.353 | 2978 | 63.9 → 23.8 |
| アイドル（既定） | 20° | 0.12 程度 → 0.28 | 0.17 | −87 | – | 2208 | 約 55 → 23.4 |

**既存テストへの影響**：点火の自動最適化 ON では CA50 が目標に保たれるので性能値の変化は小さいと見込むが，点火固定のシナリオや音の基準値は変わりうる．実装時に全テストを回し，基準値を変える場合は理由をここに記す．


**第11版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 24/24（検証項目 291 件中 FAIL 0 件），状態復元 OK を確認した．既存テストの基準値は変更不要だった．実装中の修正は次の 3 点である．
- TEST-05 項目7 の判定の分母を $B_o$ に変えた（理由は同項目に記した）．
- TEST-24 項目5 は，水ブレーキが全開で目標回転数に届かないため，目標との一致の判定をやめ，実回転数に対する単調性で判定することにした．
- §6 の既燃ガス収支の式が 360 px 幅に収まらなかったため，2 行に分けた．

全テストの所要時間は約 43 s から約 61 s に増えた（PC の headless Chromium での値）．実機では TEST-20 の上限 90 s に近づく可能性がある（推定）．

### 7.8 第12版（利用者の要望：全開トルクカーブのタブ）
| 要望・選択 | 対応 | 要件 |
| :--- | :--- | :--- |
| タブを追加して WOT のトルクカーブを引きたい | 「特性」タブで，設定を複製した計算を裏で回して回転数を掃引する | REQ-15 B.1，REQ-26，TEST-26 |
| 回転数の保持は「回転数固定（推奨）」 | 理想的な速度一定の動力計（$d\omega/dt = 0$）．水ブレーキ（モードB）では全開のエンジンを約 $1700\ \text{rpm}$ 未満に保てず，中回転でも 8 s で整定しなかったため（試算） | REQ-26 A.3 |
| 慣性過給のモデルも「同時に入れる」 | 吸気ランナを集中定数（質量とばね）で表し，状態を3つ追加 | §2.2，REQ-25，TEST-25 |
| 描く量は トルク・出力，$\eta_v$，燃費・効率，点火・$x_r$ の全部 | 4 つの表示に分ける | REQ-26 B.2 |

**試算の記録**：第11版の時点で，水ブレーキのモードBで全開・目標 $1000$〜$7000\ \text{rpm}$ を回したところ，トルクは $1700\ \text{rpm}$ の $45.6\ \text{N·m}$ から単調に下がり，$\eta_v$ も $0.89$ から $0.56$ へ単調に下がった．0-D の吸気モデルには慣性過給が無いためである．

**既定の弁諸元についての注意（推定を含む）**：既定の吸気弁径 $32\ \text{mm}$ はボア $86\ \text{mm}$ に対して小さく（2弁の単気筒としては小さめ），高回転で弁の流れが絞られて $\eta_v$ が早く下がる．そのため，ランナを入れてもトルクの山は $2000\ \text{rpm}$ 付近に留まる．試作では，弁径 $38\ \text{mm}$，IVC $264^\circ$ にすると，$L_r = 450\ \text{mm}$ でトルクが $3000$〜$4000\ \text{rpm}$ で平らな山（$43.7\ \text{N·m}$）になった．利用者の選択により，既定値を吸気弁径 $38\ \text{mm}$，IVC $264^\circ$ に変える（REQ-03 の設定の既定値．`ITEMS` が唯一の情報源）．既存テストの基準値への影響は実装時に確認し，変える場合は理由をここに記す．

**第12版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 310 件中 FAIL 0 件），状態復元 OK を確認した．実装中に既存テストが 4 件 FAIL したので，原因を確かめたうえで次のとおり対処した（いずれも上の各項目に理由を記した）．
- TEST-12（1200 rpm への整定 $\pm 38\ \text{rpm}$）：ECU の既定の $K_p$ を $0.008$ に再調整した．
- TEST-13（RK4 と RK45 の $p_{\max}$ の差 $0.32\%$）：それぞれを参照解と比べる形にした．
- TEST-17（$F/M = 1.18$）：判定の下限を $1$ に変えた．
- TEST-21（$|y| > 0.6$ が $1.8\%$）：判定の閾値を，制限段の非線形域の境界 $0.8$ に変えた．
- TEST-05 項目7 は補助積分に替えた．

全テストの所要時間は PC の headless Chromium で約 $83\ \text{s}$ になった（第11版 $61\ \text{s}$）．ランナの速い振動で DOPRI5 の刻みが細かくなったためである．TEST-20 の上限 $90\ \text{s}$ に近く，実機では超える恐れがある（推定）．実機で超えた場合は，テストの短縮か上限の見直しを検討する．

掃引の結果（既定設定，ランナ ON $450\ \text{mm}$）：最大トルク $43.0\ \text{N·m}$ @ $3500\ \text{rpm}$，最大出力 $19.15\ \text{kW}$ @ $5000\ \text{rpm}$，計算時間 $0.74\ \text{s}$．

### 7.9 第13版（利用者コメント：UI の言葉と解説タブ）
| 指摘 | 対応 | 要件 |
| :--- | :--- | :--- |
| 「操作量 α」の意味が分かりにくい．スロットル開度では？ | 制御状態カードで「スロットル開度 α」と書く．カードを4行にする | REQ-22，TEST-22 |
| f が何か分からない | 「動力計の充水率 f」と書く | REQ-22 |
| 点火が ATDC か BTDC か分からない | 「点火時期 ○° BTDC」と書く（メトリクスも） | REQ-14，REQ-22 |
| 「特性」は意味が分かりにくい．適切な言葉を提案して | 「性能曲線」に改名（候補：性能曲線，全開性能，トルク曲線） | REQ-15，REQ-26 |
| 「掃引」は日本語として分からない | 画面では「計測」と言う（`[計測開始]`，「計測中」） | REQ-26 |
| 目次があってタップで飛べるとよい | 目次と「先頭へ戻る」を実装（要件にあったが未実装だった．テストを追加） | REQ-16 4，TEST-16 12 |
| 解いている方程式（連立常微分方程式）のまとめがほしい | §1 に全11式を並べる | REQ-16 4″，TEST-16 13 |
| 横スクロールも可，長い数式を許容，テストも見直し | 数式を縮小せず，式・表ごとに横スクロール．TEST-16 項目11 を変更 | REQ-16 4‴，TEST-16 11 |
| 圧力は Pa を使えばよく，bar を禁止するのみ（kPa，MPa は可） | 単位の規則を変更し，MPa の禁止を解除 | §2，REQ-15 G，TEST-15 3 |
| メトリクスに標準的な日本語を付けたい（ローマ字の略語だけだと難しい） | 各項目に日本語名を上段に付ける | REQ-14，TEST-22 6 |


**第13版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 314 件中 FAIL 0 件），状態復元 OK を確認した．実装中に次の 2 点の不備が見つかり，あわせて直した．
- 解説の本文で `ṁ_th` のような ṁ 付きの下付き表記が数式に変換されず，生のまま残っていた．TEST-16 項目10 の検出パターンが ṁ を含んでいなかったためである．パターンを直してから変換を直した．
- 解説の冒頭の「bar は使いません」という文が，TEST-15 項目3（表示テキストに bar を含まない）に掛かった．文を「圧力は Pa 系の単位で表します」に改めた．

### 7.10 第14版（利用者コメント3件）
| 指摘 | 対応 | 要件 |
| :--- | :--- | :--- |
| 「モードA」は初見で分からないので，端的に分かる日本語にして | 画面では「スロットル制御」「動力計制御」と呼ぶ（設定の選択肢，機関断面図，制御状態カード） | REQ-11，REQ-22，TEST-22 |
| メトリクスは既定で記号，タップで日本語，再タップで記号 | メトリクスの欄のタップで全項目の表示を切り替える | REQ-14，TEST-22 6 |
| 検証タブで TEST-26 が1つ失敗している（実機） | どの項目かは未確認．推定：1 フレームあたりの計測の計算時間（判定 $\le 30\ \text{ms}$）が，実機の遅い CPU では，経過時間を 32 ステップごとにしか確かめないために超えた．ヘッドレス Chromium で CPU を 8 倍遅くしても $18.8\ \text{ms}$ で通るため確証は無い．4 ステップごとに確かめるよう直し，失敗した項目を利用者に確認する | REQ-26 C.1 |


**第14版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 314 件中 FAIL 0 件），状態復元 OK を確認した．CPU を 8 倍遅くしたヘッドレス Chromium では，TEST-26 の「1 回の計算」が $18.8\ \text{ms}$ から $15.2\ \text{ms}$ に下がった．

### 7.11 第15版（実機の検証結果と利用者の指摘）
**実機（Galaxy S26+，第14版）の結果**：PASS 24/26（検証項目 314 件中 FAIL 2 件，所要 $46.5\ \text{s}$）．
- TEST-15 の FAIL は「全ボタンが 44px 以上・重なりなし・画面内・折返しなし」で，実測は「設定:運転:スロットル制御:折返」だった．
- TEST-26 の FAIL は「6 タブ…文字が切れない」で，実測はタブ幅 $60\ \text{px}$ だった．

いずれも，ヘッドレス Chromium（Linux のフォント）では文字がちょうど収まっていたが，実機のフォントではわずかに広く，はみ出した．第14版の 7.10 節で TEST-26 の失敗を「1 フレームの計算時間」と推定したのは誤りだった（ここで訂正する．時間分割を細かくした変更は無害なので残す）．

| 指摘・結果 | 対応 | 要件 |
| :--- | :--- | :--- |
| 実機で TEST-15・26 が FAIL（文字のはみ出し） | まず，ヘッドレスでも同種の問題を検出できるよう，文字幅を利用可能幅の 95% 以下とするテストを加えた（追加直後に「性能曲線」100%，「スロットル制御」101% で FAIL することを確認）．そのうえで，タブの文字を 13 px にし，設定の選択肢を「スロットル」「動力計」に短縮した | REQ-15 G，TEST-15 8，REQ-11 |
| 日本語と記号は項目ごとに切り替えたい（IMEP をタッチでその日本語，日本語をタッチで IMEP，何度でも） | 項目ごとの切替に変更 | REQ-14，TEST-22 6 |
| ここまでの UI 修正を要件定義書に反映 | REQ-15 C（各タブの内容），G（可読性），TEST-15，REQ-17，6 節のチェックリストを現在の画面に合わせて更新 | REQ-15，REQ-17，6 節 |


**所要時間の推定の訂正**：第12版の検証で，「全テストの所要が実機では TEST-20 の上限 90 s を超える恐れがある（推定）」と書いた．実機の所要は $46.5\ \text{s}$ で，ヘッドレス Chromium（約 $80\ \text{s}$）より短かった．この推定は誤りだったので訂正する．

**第15版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 315 件中 FAIL 0 件），状態復元 OK を確認した．

### 7.12 第16版（実機の検証結果と利用者の提案4件）
**実機（Galaxy S26+，第15版）の結果**：PASS 25/26（検証項目 315 件中 FAIL 1 件，所要 $42.2\ \text{s}$）．FAIL は TEST-15 項目8 で，タブ「性能曲線」の文字幅が利用可能幅の $95\%$ だった（実機のフォントで判定）．

| 指摘・提案 | 対応 | 要件 |
| :--- | :--- | :--- |
| TEST-15 項目8 が実機で FAIL（タブ「性能曲線」が 95%） | タブのボタンの左右余白を 0 にし，利用可能幅を 56 px から 60 px に広げた | REQ-15 G |
| 「スロットル開度 … 飽和」の意味が分かりにくい．開度 0 で流量 0 でよいのでは．理想的なスロットルとしては | 漏れ面積を廃止し，理想スロットルとした．張り付いたときの表示は「全開／全閉」「上限／下限」とした | REQ-05 2″，REQ-22 4，TEST-05 1，TEST-22 2 |
| 補機類の負荷を与えたい | 一定の補機負荷トルク $T_{\text{aux}}$（既定 2.0 N·m）を追加 | REQ-10，REQ-14，TEST-14 2・4 |
| 表示が燃焼変動でぶれるので直近 10 サイクル平均にしたい | サイクルごとの指標を直近 10 サイクルの算術平均で表示 | REQ-14，TEST-14 9 |

設定項目の名前に残っていた「(A)」「(B)」も，「固定開度」「固定充水率 f」「基準充水率 f」に改めた．

**第16版で見直したテストのシナリオと判定**：理想スロットルと補機負荷の追加で，次の 3 件が FAIL した．原因を確かめ，上の各項目に理由を記して直した．
- TEST-11 S6：$\alpha_{\text{manual}}$ を $5^\circ$ から $7^\circ$ に変えた．
- TEST-12 AMAX：$\alpha_{\max}$ を $3^\circ$ から $5^\circ$ に変えた．
- TEST-26 項目2：判定を量子化の理論上限に変えた．
- TEST-20：テスト実行中の最長フレーム間隔が，$360 \times 640$ で $250.9\ \text{ms}$ になり，上限 $250\ \text{ms}$ を超えた（TEST-16 の実行中）．TEST-16 の目次の検査（第13版で追加）が 17 項目を1フレームでタップしていたためである．項目ごとにフレームを譲るよう直した．

**第16版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 319 件中 FAIL 0 件），状態復元 OK を確認した．既定設定の無負荷アイドルは，開度約 $4.2^\circ$，吸気管圧約 $24\ \text{kPa}$ で目標 $800\ \text{rpm}$ に整定する（試作の値）．

### 7.13 第17版（利用者の指摘：性能曲線の計測が前の点に引きずられそう）
| 指摘 | 対応 | 要件 |
| :--- | :--- | :--- |
| 前の点に引きずられそう．テストを追加 | 上り・下り・単独の 3 通りの計測が一致することを判定するテストを追加．計測の回転数の並びを引数で与えられるようにした（既定は従来どおり上り） | REQ-26 A.4，TEST-26 9 |
| なぜ 13 点か | 第12版で計算時間と見やすさの兼ね合いで決めた値で，物理的な根拠は無いことを明記 | REQ-26 A.4 |
| 実機でメトリクスの項目をタップしても切り替わらない（バグか？） | バグだった．メトリクスを毎フレーム `innerHTML` で作り直していたため，指を置いた要素が離す前に作り直され，`pointerup` が外れた要素に届いて親の判定へ伝わらなかった．ヘッドレスのテストは押下と離しを同じフレームで送っていたので検出できなかった．まず，押下と離しの間に再描画を挟むテストを追加して FAIL を確かめ，要素を作り直さず文字だけを書き換えるよう直した | REQ-14，TEST-22 7 |
| あの場所に表示されているものは全部見られるように | メトリクスの 24 項目すべてが項目ごとに切り替わる（上のバグで全項目が効いていなかった） | REQ-14 |

**全テストの所要時間**：項目9 を加えた直後，ヘッドレス Chromium の極端な利用者状態で全テストの所要が $90.9\ \text{s}$ になり，TEST-20 の上限 $90\ \text{s}$ を超えた．上りの計測は TEST-25・26 の計測結果を使い回し，単独の計測は 1000 rpm おきの 7 点に絞った．実機の所要はヘッドレスの約半分である（第15・16版で $42$〜$47\ \text{s}$）．

**第17版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 321 件中 FAIL 0 件），状態復元 OK を確認した．項目9 の実測値は，上り・下り・単独の差の最大が，既定 $0.18\%$／$0.0012$，$L_r = 900\ \text{mm}$ で $0.15\%$／$0.0012$，ランナ OFF で $0.32\%$／$0.0027$ だった．このテストが引きずりを検出できることも確かめた．各点を 1 サイクルで打ち切る改悪版で上りと下りを比べると，差は $37\%$／$0.28$ となり，判定値を大きく超えた．

### 7.14 第18版（利用者の指示：計測の点数と条件表示）
| 指示 | 対応 | 要件 |
| :--- | :--- | :--- |
| 25 点にして，可能なら可変に | 刻みを 100／250／500 rpm から選べるようにし，既定を 250 rpm（25 点）にした | REQ-26 A.4，TEST-26 10 |
| 性能曲線の仮定を性能曲線のところにタブを作って数値で書き出して | 表示の切替に `[条件]` を加え，固定する条件・回転数の点・整定の判定・計測に使う設定を数値で表にした．判定の数値はコードの定数表から書き出す | REQ-26 B.1′，TEST-26 10 |
| スロットル開度 10°，50° の性能曲線も重ねたい | 90°・50°・10° の 3 開度を計測して色を変えて重ねる | REQ-26 A.2，B.3，TEST-26 11 |
| 37% も違ったら話にならない．対策案を | 37% は，テストが引きずりを検出できるかを確かめるために，わざと各点を 1 サイクルで打ち切った改悪版の値であり，実際の計測の差は最大 0.32% である（説明の書き方が誤解を招いた）．そのうえで，さらに確実にする対策案を利用者に示した（採否は未定） | 7.2 節 3 |


**第18版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 323 件中 FAIL 0 件），状態復元 OK を確認した．全テストの所要は，ヘッドレス Chromium で $83$〜$86\ \text{s}$ と上限 $90\ \text{s}$ に近い（実機はおよそ半分）．テストの計測は，同じ条件の結果を TEST-25・26 の間で使い回して時間を抑えた．

**250 rpm 刻みで見えた細かな凹凸（調査結果）**：全開の $T_b$ に，$250\ \text{rpm}$ ごとに上下する約 $\pm 1\%$ の凹凸がある（例：$2750$，$3000$，$3250\ \text{rpm}$ で $41.16$，$40.91$，$41.82\ \text{N·m}$）．次の 3 点を確かめた．
- 各点を単独で 40 サイクル回した値と，計測の値は $0.01\ \text{N·m}$ 以内で一致した．したがって前の点の引きずりではない．
- RK4 で解いても同じ値になった．したがって数値誤差でもない．
- ランナを OFF にすると凹凸は消えた．

以上から，集中定数のランナ（減衰の小さい共鳴器）が，弁の閉止後も鳴り続け，その位相が回転数で変わるために生じる，モデルの性質である（推定）．

### 7.15 第19版（利用者の指示：性能曲線の計測条件を選べるように）
| 指示 | 対応 | 要件 |
| :--- | :--- | :--- |
| 「50° は全開 +5% まで許す」はテストにしない．このモデルの結果を尊重する | 50° と 90° の大小の判定を外した | TEST-26 12 |
| テストの所要は 120 s でよい | TEST-20 の上限を 120 s に | REQ-20，TEST-20 |
| 70° なども欲しい．10° ごとに欲しいものを事前にチェックボックスで指定 | 条件画面に 10〜90° のチェック式ボタン | REQ-26 A.2，B.2，TEST-26 10・12 |
| 計算が速いので収束判定を厳しくしたい | 厳しさ「厳格」を既定に（0.1%，0.1°，最少 6 サイクル） | REQ-26 A.6 |
| a，b，c，d のどれかを指定できるように | (a) 厳しさ，(b) 流量・状態量の判定，(c) 往復，(d) 独立を条件画面で選べるようにした（(c)(d) は手順として択一） | REQ-26 A.6・A.7 |
| 流量などでも条件を付けて | 流量・状態量の判定に $\eta_v$，$\bar{\dot m}_{\text{th}}$，$p_{\text{in}}$ を入れた | REQ-26 A.6 |
| 要件定義書を更新 | REQ-26 の本文を現状に合わせて全面的に書き直した．仮定の表は「前提」画面に分けた | REQ-26 |


**第19版の実装検証**：`npm test` を実行し，3 ビューポートと極端な利用者状態で PASS 26/26（検証項目 323 件中 FAIL 0 件），状態復元 OK を確認した．全テストの所要はヘッドレス Chromium で $102$〜$104\ \text{s}$ で，新しい上限 $120\ \text{s}$ 以内だった．

実装中に，9 開度を選んだときの凡例が1行に収まらず，プロットの外へはみ出した（TEST-26 項目12 で検出）．凡例が軸名の右に収まらないときは次の行へ折り返すよう直した（REQ-17 A.3 の凡例の規則の範囲内）．

既定の計測（3 開度 × 25 点，厳格＋流量，上り）は，画面操作でヘッドレス Chromium の $360 \times 640$ に約 $10$〜$18\ \text{s}$ かかる（時間分割のため，計算そのものより長い）．
