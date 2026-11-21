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

