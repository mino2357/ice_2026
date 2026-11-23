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
   * **ゲインの決め方**：トルクの指令が直接トルクになる（$\tau_d$ は小さい）ので，偏差から動力計のトルクまでのゲインは定格トルクと回転数によらない．$\tau_d$ と $\bar N$ の遅れ $\tau_N$ を無視すると，目標の近くの閉ループは $I_{\text{tot}}\ddot e + K_p'\dot e + K_i' e = 0$（$K_p' = \frac{30}{\pi}K_{p,d}$，$K_i' = \frac{30}{\pi}K_{i,d}$．$\omega$ で書いたゲイン）で，固有角振動数 $\omega_n = \sqrt{K_i'/I_{\text{tot}}}$，減衰比 $\zeta = \frac{K_p'}{2\sqrt{I_{\text{tot}}K_i'}}$ である．既定（$I_{\text{tot}} = I + I_{\text{dyno}} = 0.17\ \text{kg·m}^2$）で $\omega_n = 5.8\ \text{rad/s}$，$\zeta = 0.97$．比例は瞬時の回転数，積分は $\bar N$（$\frac{1}{\tau_N s + 1}$ の遅れ）で作るので，$\tau_N$ を入れた閉ループの特性方程式は $I_{\text{tot}}s + K_p' + \frac{K_i'}{s(\tau_N s + 1)} = 0$ から $I_{\text{tot}}\tau_N s^3 + (I_{\text{tot}} + K_p'\tau_N)s^2 + K_p's + K_i' = 0$ で，Routh の条件 $(I_{\text{tot}} + K_p'\tau_N)K_p' > I_{\text{tot}}\tau_N K_i'$（$0.873 > 0.146$）を満たす（根 $-13.6$，$-2.15 \pm 3.45i$）．動力計のトルクの遅れ $\tau_d$ を入れると 4 次 $I_{\text{tot}}\tau_d\tau_N s^4 + I_{\text{tot}}(\tau_d + \tau_N)s^3 + (I_{\text{tot}} + K_p'\tau_N)s^2 + K_p's + K_i' = 0$ で，根は $-87.1$，$-15.3$，$-2.17 \pm 3.49i$（安定）．（以前は $s^2$ の係数を $I_{\text{tot}}$ とし，条件を $K_p' > \tau_N K_i'$ と書いていた．比例も $\bar N$ で作っていたころの式で，誤りだった．外部のレビューの指摘．`docs/changes/2026-11-24-review-gemini-6.md`）．なお，1 気筒の爆発の脈動（$\frac{\bar N}{120}$ [Hz]）に対しては，$\tau_d$ による位相の遅れがあり（$3000\ \text{rpm}$ で約 $57^\circ$），比例の項は純粋な減衰にはならない（線形化の範囲の外．調べていない）．
   * ゲインが小さすぎると，既定の始動で完爆後に $\bar N$ が行き過ぎ，その間にたまった積分で回転を引き下げてエンストする（$0.035\ \text{N·m/rpm}$，$0.07\ \text{N·m/(rpm·s)}$ での実測．第26版の経緯の 26）．上の既定のゲインでは始動からエンストせず，燃料を止めても $\pm 25\ \text{rpm}$ に保てる．
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

