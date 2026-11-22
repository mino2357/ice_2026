### SPEC-01：スライダ・クランク運動学（REQ-01）

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
* **出典**：[J. B. Heywood, *Internal Combustion Engine Fundamentals*, McGraw-Hill (1988), Ch. 2](https://www.accessengineeringlibrary.com/content/book/9781260116106)（リンク先は第 2 版，2018．この文書の章の番号は初版のもの．1〜5 章の題が第 2 版でも同じことは出版社の目次で確かめた．6 章以降は確かめていない）

---

