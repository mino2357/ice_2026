# 単気筒4ストロークSI機関シミュレータ

0 次元単一ゾーンの筒内熱力学，スロットルと吸気マニホールド，水ブレーキ動力計，ECU（回転数 PI 制御・点火時期の自動最適化），エンジン音（クランク角ウェーブテーブル＋排気管共鳴）を，スマートフォン（Android の Chrome）で動く単一 HTML にまとめたもの．

- 成果物：`dist/engine.html`（ブラウザで開くだけで動く．外部通信なし）
- 要件定義書：`docs/requirements.md`
- アプリ内の「検証」タブで全テスト（23 件）を実行できる．

## ビルドとテスト
```
npm install && npx playwright install chromium
npm test
```

## ライセンス
- 数式フォント `src/fonts/lmmath-subset.otf` は Latin Modern Math（B. Jackowski，J. M. Nowacki，GUST e-foundry）のサブセットで，GUST Font License に従う（`src/fonts/GUST-FONT-LICENSE.txt`）．ライセンスの要請に従い，改変版として別名（ICE-Sim Math Subset）を付けている．
- それ以外（コード・文書）は Apache License 2.0（`LICENSE`）．
