# 単気筒4ストロークSI機関シミュレータ

0 次元単一ゾーンの筒内熱力学，スロットルと吸気マニホールド，水ブレーキ動力計，ECU（回転数 PI 制御・点火時期の自動最適化），エンジン音（クランク角ウェーブテーブル＋排気管共鳴）を，スマートフォン（Android の Chrome）で動く単一 HTML にまとめたもの．

- 成果物：`dist/engine.html`（ブラウザで開くだけで動く．外部通信なし）
- 要件定義書：`docs/requirements/`
- アプリ内の「検証」タブで全テスト（23 件）を実行できる．

## ビルドとテスト
```
npm install && npx playwright install chromium
npm test
```

## ライセンス
- 数式は，成果物が実行時に MathJax 3.2.2（Apache License 2.0）を cdnjs から読み込んで組む（読み込めなければ TeX のソースを表示する）．フォントも MathJax もリポジトリと成果物には含めない．検証（`npm test`）は，`tools/dev/mathjax.js` が同じ版を cdnjs から取り寄せ，成果物の SRI と照合して `~/.cache/ice_2026/` に置いたものを使う．
- それ以外（コード・文書）は Apache License 2.0（`LICENSE`）．
