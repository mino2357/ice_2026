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

