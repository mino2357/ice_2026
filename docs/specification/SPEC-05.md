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

