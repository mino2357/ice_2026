### TEST-14：性能の指標と基準サイクル（REQ-14，SPEC-14）

S3（スロットル制御，負荷トルク $3\ \text{N·m}$）と S4（動力計制御）の定常について，

1. [S] $\text{IMEP}\cdot V_d = W_{i,\text{net}}$，$\text{PMEP}\cdot V_d = W_{i,\text{net}} - W_{i,\text{gross}}$（相対誤差 $10^{-12}$）．$W_{i,\text{net}}$ が，ステップ点の $p$-$V$ の台形則による値と相対差 $0.1\%$ 以内．
2. [S] $\text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}$，$P_b = \text{BMEP}\cdot V_d/t_c$（相対誤差 $10^{-9}$）．$0 < \eta_m < 1$，$\text{bsfc} > 0$ で有限．
3. [S]（理論の上限）直近 5 サイクルで $P_i \le \eta_{\text{Otto}}\,\dot m_f H_u$，$\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$．
4. [S]（動力の収支）直近 5 サイクル平均で $|W_{i,\text{net}} - \Delta W_f - \Delta W_a - \Delta W_d|/W_{i,\text{net}} \le 2\%$．
5. [S] 基準サイクルを保存した後，点火時期と開度を変えて $1\ \text{s}$ 積分しても，保存した配列が書き換わらない．
6. [S]（表示の規則）S1 の全期間（$0.05\ \text{s}$ ごと）で，完爆前の IMEP・効率の表示が「–」，効率の表示が $[0, 1.5]$ の外に出ず，`NaN`・`Infinity` を表示しない．
7. [S] $\eta_i = W_{i,\text{net}}/(m_f H_u)$（相対誤差 $10^{-12}$）．動力計制御・開度固定で，$\phi = 1.2$ の $\eta_i$ が $\phi = 1.0$ より $10\%$ 以上低い．
8. [S]（10 サイクル平均）S3 の定常で，表示用の指標のうち算術平均とするもの（IMEP，PMEP，$\eta_v$，$x_r$，$p_{\max}$，$T_{\max}$，$T_b$，BMEP，FMEP，$\bar Y_{b,\text{in}}$）が直近 10 サイクルの値の算術平均と一致する（相対誤差 $10^{-12}$）．比で定義する指標は項目 10．コールドリセットの直後は「–」に戻り，完爆後 3 サイクルの時点では 3 サイクルの平均である．
9. [S]（体積効率）化学平衡のモデル（既定）で $\eta_v = \frac{m_{a,\text{IVC}}}{\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{R_a T_{\text{amb}}}$．熱物性 $\gamma(T)$ で $\eta_v = \frac{m_{u,\text{trapped}}}{(1 + \phi/\text{AF}_{st})\,\rho_{\text{atm}}V_d}$，$\rho_{\text{atm}} = \frac{p_{\text{atm}}}{RT_{\text{amb}}}$（どちらも相対誤差 $10^{-12}$）．
10. [S]（比の指標の 10 サイクル平均．REQ-14 の 4）サイクル変動 ON，既定の運転（動力計制御）で始動から $3\ \text{s}$ の後，表示用の $\eta_i$，$\eta_m$，bsfc，$\eta_b$，$P_i$，$P_b$，動力計の出力，摩擦の動力，壁への熱流，$\dot m_f$，各断面の平均流量（th，r，in，ex，e，t），平均回転数が，直近 10 サイクルの記録から SPEC-14 の和の比で求めた値と一致する（相対誤差 $10^{-12}$）．検査が算術平均と区別できることを確かめるため，bsfc の和の比と算術平均の相対差が $10^{-6}$ 以上であることも求める．

**TEST-15〜19** は画面の文書（`docs/gui/`）にある．

---
