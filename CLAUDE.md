# CLAUDE.md — 単気筒4ストロークSI機関シミュレータ

このリポジトリは，要件定義書 `docs/requirements.md` と，それを実装した単一 HTML の成果物 `dist/engine.html` を管理する．

## 作業の進め方（厳守）
1. **要件が先**：仕様の変更・追加は，まず `docs/requirements.md` を更新する（該当 REQ，対応 TEST，4節のトレーサビリティ表，7節の改訂記録）．利用者が実装を指示するまで実装しない．
2. **テストで判定できる形に書く**：要件はテスト項目で合否を判定できる形にする．判定できないものは 6節の実機目視チェックリストへ．どちらにも無い事項は要件ではない．
3. **テストを先に**：不具合は，それを検出するテストを追加してから直す．テストを通すために判定基準を緩めるときは，理由を要件定義書に書く．
4. **納品条件**：`npm test`（スマートフォン 3 ビューポート ＋ 極端な利用者状態 ＋ タブレット縦・横 ＋ PC の計 7 通り）がすべて PASS してから成果物を公開する．1 件でも FAIL があれば公開しない．
5. 数値や結論は実行して確かめる．推定は推定と書き，後で誤りと分かったら改訂記録で訂正する．

## 表記の規則
- 句読点は「，」「．」．
- 圧力は Pa 系（Pa，kPa，MPa）．bar は使わない．画面の既定は kPa．内部計算は SI．
- 定着していない術語は英語のまま．
- 数式は導出を省略せず，記号はすべて定義する（解説タブ §0 の記号表と TEST-16）．

## 構成
| パス | 内容 |
| :--- | :--- |
| `docs/requirements.md` | 要件定義書（REQ-01〜28，TEST-01〜28） |
| `src/core.js` | `EngineCore`：物理モデル・ECU・動力計・ソルバ・項目定義表 `ITEMS`（DOM 非依存） |
| `src/audio.js` | エンジン音の合成器 `Synth`（AudioWorklet と共用，DOM 非依存） |
| `src/plot.js` | グラフの軸・自動レンジ・レイアウト，機関断面図の場面記述と描画，制御状態の文言 |
| `src/doc.js` | 解説タブ（MathML 生成器 `mp`，記号表 `SYM`） |
| `src/tests.js` | アプリ内テスト TEST-01〜28 とシナリオ |
| `src/ui.js` | 画面・入力・ループ |
| `src/style.css`，`src/index.tpl.html` | 見た目とひな形 |
| `src/fonts/` | 数式フォント（Latin Modern Math のサブセット，GUST Font License）と生成スクリプト |
| `src/build.py` | 上記を結合して `dist/engine.html` を生成 |
| `tests/headless.js` | 開発時検証 [D]（Playwright） |
| `tools/wav_demo.js` | 試聴用 WAV の生成 |

## コマンド
```
npm install && npx playwright install chromium   # 初回のみ
npm run build      # dist/engine.html を生成
npm test           # ビルドして全テスト（約 10 分）
npm run wav        # 試聴用 WAV を dist/ に生成
npm run font       # 数式フォントのサブセットを作り直す（Latin Modern Math が必要）
```

## 設計上の注意
- 設定項目は `src/core.js` の `ITEMS` が唯一の情報源．単位換算は項目の `f`（表示値 × f = 内部値）だけで行う．
- テストのシナリオはサイクル変動 OFF（`mkPT()`）で決定的に回す．乱数は種を固定した擬似乱数のみ．
- UI 自己検査（TEST-15，16，18，22）は既定設定から始め，終了後に利用者の状態を完全に戻す．
- Canvas はビットマップ寸法を毎回 CSS 寸法 × dpr と照合する．
- 成果物は claude.ai のアーティファクトとしても公開している（公開は利用者の確認のうえで行う）．
