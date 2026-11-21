# tools/solver — 積分の解法の比較の試算

REQ-13 の受入基準 11〜13 のための調査（`docs/report_solver.md`）．製品のコードは書き換えず，`lib.js` が `src/core.js` を読み込むときに，刻みの上限・刻みの制御・1 ステップの公式を差し替える．

| スクリプト | 内容 |
| :--- | :--- |
| `lib.js` | 差し替え，4 条件の実行，陽的 Runge–Kutta の埋め込み対（一般の係数表）と RKC |
| `survey1.js`，`survey1b.js` | DOPRI5 のまま刻みの上限と許容誤差を変える．低負荷の条件の選び直し，参照解の不確かさ |
| `survey2.js` | 公式の比較（DOPRI5，BS3(2)，Heun–Euler，Ralston，RKC） |
| `survey3.js` | 刻みを決めている成分，不受理の割合，クランク角ごとのステップ数 |
| `survey4.js` | BS3(2) の周りの工夫（ノルム，PI 制御，安全率）と SSP(4,3)，Merson |

```
node tools/solver/survey2.js BS3      # 名前に BS3 を含む公式だけ（1 分ほど）
```
