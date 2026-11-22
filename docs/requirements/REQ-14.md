### REQ-14：性能の指標と基準サイクル

**要求**：サイクルの終端ごとに，そのサイクルの性能の指標を補助積分（仕様書 2.3 節）の増分から求めること．1 サイクルの波形を基準サイクルとして保存し，重ね描きで比べられること（保存の規則は REQ-18）．

**受入基準**：

1. 定義の恒等式（TEST-14 項目 1，2，7，9）：
   $$\text{IMEP}\cdot V_d = W_{i,\text{net}}, \qquad \text{BMEP} = \text{IMEP} - \text{FMEP} - \text{AMEP}, \qquad P_b = \frac{\text{BMEP}\cdot V_d}{t_c}, \qquad \eta_i = \frac{W_{i,\text{net}}}{m_f H_u}$$
2. 理論の上限を超えない：$P_i \le \eta_{\text{Otto}}\,\dot m_f H_u$，$\eta_{\text{Otto}} = 1 - \varepsilon^{1 - 1.40}$（項目 3）．
3. 動力の収支：$\left|W_{i,\text{net}} - \Delta W_f - \Delta W_a - \Delta W_d\right| \le 0.02\,W_{i,\text{net}}$（定常の 5 サイクル平均．項目 4）．
4. 完爆前の指標は「–」と表示し，`NaN`・`Infinity` を表示しない．サイクルごとの指標は直近 10 サイクルの算術平均を表示する（項目 6，8）．
5. 基準サイクルは，保存した後に書き換わらない（項目 5）．

**仕様**：仕様書 SPEC-14　**検証**：TEST-14

---

**REQ-15〜19** は画面の文書（`docs/gui/`）にある．

---

