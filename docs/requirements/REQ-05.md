### REQ-05：スロットルと吸気マニホールド

**要求**：スロットル開度 $\alpha$ から，スロットルの質量流量 $\dot m_{\text{th}}$ と吸気マニホールド圧 $p_{\text{in}}$ の変化を求めること．大気圧を設定で変えられること．吸気側へ吹き返した筒内ガスの**既燃分**と**熱**を追跡し，次の吸気で筒内へ戻すこと．

**受入基準**：

1. **質量**：吸気弁を閉じたとき $\displaystyle\int\dot m_{\text{th}}\,dt = \frac{V_{\text{in}}}{RT_{\text{in}}}\,\Delta p_{\text{in}}$（相対誤差 $10^{-6}$）．周期定常で $\Delta M_{\text{th}} = \Delta M_{\text{in}}$（$0.2\%$．TEST-05 項目 2，4）．
2. **既燃ガス**：$\Delta\left(m_{b,\text{in}} + m_{b,p}\right) = \Delta B_o - \Delta B_i$（差が $10^{-3}\,\Delta B_o$ 以下）．周期定常で $\Delta B_o = \Delta B_i$（$2\%$．項目 7）．
3. **熱**：$\Delta\left(E_{\text{in}} + E_p\right) = \Delta X_o - \Delta X_i - \Delta X_t$（差が $10^{-6}\,\Delta X_o$ 以下）．周期定常で $\Delta X_o = \Delta X_i$（$2\%$．項目 8）．
4. アイドルで，吸気弁の順流の上流温度の流量加重平均が $T_{\text{in}} + 15\ \text{K}$ 以上（吹き返しが吸気を温める．項目 9）．
5. 全時刻で $0 \le Y_{b,\text{in}} \le 1$，$0 \le Y_{b,p} \le 1$，$E_{\text{in}} \ge 0$，$E_p \ge 0$（項目 6）．
6. チョークしたスロットルの流量が大気圧 $p_{\text{atm}}$ に比例する（相対誤差 $10^{-12}$．項目 3）．

**仕様**：仕様書 SPEC-05　**検証**：TEST-05

---

