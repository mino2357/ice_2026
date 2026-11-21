### TEST-11：電動式動力計と運転モード（REQ-11，SPEC-11）

1. [A]（容量と右辺）既定の定格で $T_{\max}(1000\ \text{rpm}) = T_{\text{rated}}$，$T_{\max}(60000\ \text{rpm}) = P_{\text{rated}}/\omega$（相対 $10^{-12}$），回転の向きによらない．ソルバの右辺で $T_{\text{dyno}}$ がそのまま入る（吸収 $12.3$，駆動 $-4.1\ \text{N·m}$ で一致）．
2. [A] トルクの指令を $0 \to 20\ \text{N·m}$ にすると $t = \tau_d$ で $T_{\text{dyno}} = (1 - e^{-1}) \times 20\ \text{N·m}$（相対誤差 $10^{-9}$．刻み $10^{-4}\ \text{s}$ と $10^{-3}\ \text{s}$ の両方）．
3. [S] S3（スロットル制御，負荷トルク $3\ \text{N·m}$）：直近 10 サイクル平均で $T_b$ と $T_{\text{dyno}}$ の相対差が $2\%$ 以内．$T_c = T_{\text{load}}$ で一定．
4. [S] S4（動力計制御，$1500\ \text{rpm}$，開度 $15^\circ$）：最後の $5\ \text{s}$ で $\bar N$ の平均が $1500 \pm 10\ \text{rpm}$，瞬時値が $\pm 25\ \text{rpm}$，$0 < T_c < T_{\text{rated}}$（吸収），$\alpha = \alpha_{\text{manual}}$ で一定．始動はスターターを使わず，始動から $1\ \text{s}$ 以内に $\bar N > 1000\ \text{rpm}$ になる．
5. [S]（燃料の停止と駆動）S4 の終端から燃料を止めて $8\ \text{s}$：最後の $3\ \text{s}$ の $\bar N$ が $1500 \pm 25\ \text{rpm}$，$T_c < 0$（駆動），完爆の状態のまま．
6. [S] S6（動力計制御，$3000\ \text{rpm}$，開度 $7^\circ$．始動の $3\ \text{s}$ 後に定格トルクを $3\ \text{N·m}$ にする）：$T_c = -T_{\max}$ に張り付いて `UNDERPOWER` になり，その間 $\lvert I_T\rvert$ が増えない．目標を $2000\ \text{rpm}$ に下げると $5\ \text{s}$ 以内に張り付きが解け，$6\ \text{s}$ 後に $2000 \pm 50\ \text{rpm}$．
7. [S] S5（動力計制御，$800\ \text{rpm}$，全開．始動の $3\ \text{s}$ 後に定格トルクを $10\ \text{N·m}$ にする）：$T_c = T_{\max}$ に張り付いて `OVERLOAD` になる．S4b（S4 から $p_{\text{atm}} = 80\ \text{kPa}$）の定常の軸トルクが S4 より小さい．
8. [S]（モードの切替）S2 の終端からスロットル制御 → 動力計制御に切り替えた直後の 1 ステップで，$\alpha_{\text{manual}}$ が切替前の $\alpha$ に等しく，$\alpha$ が変わらず，$\lvert\Delta T_c\rvert \le 10^{-3}\ \text{N·m}$．続けてスロットル制御に戻した直後の 1 ステップで，$T_{\text{load}} = \max(0, T_c)$，$\lvert\Delta\alpha\rvert \le 0.01^\circ$．
9. [S]（定格と目標によらない整定）W3000（動力計制御，全開，定格トルク $200\ \text{N·m}$，目標 $3000\ \text{rpm}$，始動から $12\ \text{s}$）から，(a) そのまま $4\ \text{s}$，(b) 定格トルクを既定に戻し，目標を $4000\ \text{rpm}$ にして $4\ \text{s}$ 運転し，最後の $2\ \text{s}$ の $\bar N$ の最大と最小の差がどちらも $20\ \text{rpm}$ 以下．
10. [A]（既定）設定の項目「回転数の制御」の既定値が動力計（$1$）で，既定の設定（`mkP()`）でも動力計制御．
11. [S]（モータリングの操作）動力計制御，目標 $1500\ \text{rpm}$ で，停止の状態から `start()`：スターターが働かず，$1\ \text{s}$ 後に $\bar N > 1000\ \text{rpm}$，$4\ \text{s}$ 後に $1500 \pm 25\ \text{rpm}$．そこで `stop()`（FUEL CUT）して $3\ \text{s}$ 後：燃料が止まり，運転中のまま，$\bar N$ が $1500 \pm 25\ \text{rpm}$，$T_c < 0$，図示仕事が負．もう一度 `stop()`（STOP）で停止の状態になり $T_c = 0$．スロットル制御（S2 の終端）では `stop()` 1 回で停止の状態になる．
12. [S]（$40000\ \text{rpm}$ のモータリング）既定の機関と既定の定格で，角速度と $\bar N$ を $40000\ \text{rpm}$ に置き，燃料を止めた動力計制御（目標 $40000\ \text{rpm}$，全開）で $2\ \text{s}$：全状態が有限，最後の $0.4\ \text{s}$ の $\bar N$ が $40000 \pm 25\ \text{rpm}$，$\lvert T_c\rvert < T_{\max}$，`UNDERPOWER` の表示（$2\ \text{s}$ 続く）が出ない．（実測：積分の状態が $0$ から始まるので初めの $0.4\ \text{s}$ に $39569\ \text{rpm}$ まで下がって $T_c$ が上限に触れ，$1.6\ \text{s}$ で整定．定常は $T_c \approx -76$〜$-79\ \text{N·m}$，約 $320\ \text{kW}$．）

