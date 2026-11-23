# 索引（自動生成）

`node tools/dev/index.js` が作る．手で書き換えない（`npm run check` が，今の文書とコードから作ったものと同じかを調べる）．

* **使い方**：作業のはじめにこの索引だけを読み，変更に関係する番号の断片（`docs/` の下のファイル）だけを読む．全文は `npm run build` の後，`dist/docs/` にある．
* **文書の持ち方**：4 文書は，見出し（`##` と `###`）ごとの断片のファイルに分けて `docs/requirements/`，`docs/specification/`，`docs/gui/`，`docs/glossary/` に置く．並びは各ディレクトリの `_order.txt`．ビルドと点検は，連結して 1 つの文書として読む（`tools/dev/docsrc.js`）．
* **（ ）の中**は字数．**[U]** は画面を操作する検査を持つテスト（`src/tests.js` の `UIT`）．**参照**は，REQ と SPEC の本文に出てくるほかの番号．**コード**は，番号がコメントなどに出てくる行（`src/`．`tests.js` と `doc.js` を除く）．

## 1. 項目

| 番号 | 題 | REQ | SPEC | TEST | テストの行（`src/tests.js`） | 参照 | コード |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | スライダ・クランク運動学 | `requirements/REQ-01.md`（547） | `specification/SPEC-01.md`（1450） | `specification/TEST-01.md`（534） | 234–259 | – | – |
| 02 | 作動流体の熱物性（未燃・既燃の比熱） | `requirements/REQ-02.md`（690） | `specification/SPEC-02.md`（2404） | `specification/TEST-02.md`（881） | 260–298 | 09 29 | `core.js`:143,936 |
| 03 | カムプロファイルと弁の有効開口面積 | `requirements/REQ-03.md`（680） | `specification/SPEC-03.md`（3082） | `specification/TEST-03.md`（1540） | 299–362 | 13 15 29 | `core.js`:195 |
| 04 | オリフィスの圧縮性流れ（順流・逆流・チョーク） | `requirements/REQ-04.md`（546） | `specification/SPEC-04.md`（2212） | `specification/TEST-04.md`（646） | 363–381 | 02 05 13 27 | `core.js`:215 |
| 05 | スロットルと吸気マニホールド | `requirements/REQ-05.md`（1026） | `specification/SPEC-05.md`（3730） | `specification/TEST-05.md`（1990） | 382–442 | 02 04 07 10 14 25 27 30 | `core.js`:951 |
| 06 | 筒内の組成（未燃ガスと既燃ガス） | `requirements/REQ-06.md`（318） | `specification/SPEC-06.md`（1024） | `specification/TEST-06.md`（370） | 443–453 | 05 07 | – |
| 07 | 燃焼（乱流火炎伝播に連動する単一 Wiebe モデル） | `requirements/REQ-07.md`（958） | `specification/SPEC-07.md`（4200） | `specification/TEST-07.md`（1775） | 454–550 | 29 | – |
| 08 [U] | 壁面熱伝達と壁温 | `requirements/REQ-08.md`（780） | `specification/SPEC-08.md`（2684） | `specification/TEST-08.md`（965） | 551–567 | 26 27 | `core.js`:110,828,1410 `ui.js`:173 |
| 09 | 筒内圧の式（開いた系の熱力学第一法則） | `requirements/REQ-09.md`（710） | `specification/SPEC-09.md`（2523） | `specification/TEST-09.md`（1673） | 623–650 | 02 05 06 | `core.js`:982 |
| 10 | 回転運動，摩擦，スターター | `requirements/REQ-10.md`（627） | `specification/SPEC-10.md`（2268） | `specification/TEST-10.md`（816） | 687–719 | 11 12 | – |
| 11 | 電動式動力計と運転モード | `requirements/REQ-11.md`（2062） | `specification/SPEC-11.md`（4497） | `specification/TEST-11.md`（2802） | 720–721 | 10 12 13 18 22 31 35 | `core.js`:262,2050,2076 `ui.js`:179 |
| 12 | ECU（スロットル開度の PI 制御と点火時期の自動最適化） | `requirements/REQ-12.md`（1055） | `specification/SPEC-12.md`（2696） | `specification/TEST-12.md`（1936） | 843–905 | 07 13 | `core.js`:264 |
| 13 | 数値積分 | `requirements/REQ-13.md`（2612） | `specification/SPEC-13.md`（10225） | `specification/TEST-13.md`（6540） | 906–1061 | 03 04 07 08 10 12 14 25 29 | `core.js`:745,1120,1506,1663,1741,1804… |
| 14 | 性能の指標と基準サイクル | `requirements/REQ-14.md`（823） | `specification/SPEC-14.md`（3035） | `specification/TEST-14.md`（1481） | 1388–1452 | 11 12 13 15 18 29 | `core.js`:1032,1921 |
| 15 [U] | 画面の構成と操作 | `gui/REQ-15.md`（2373） | `gui/SPEC-15.md`（9770） | `gui/TEST-15.md`（5835） | 1505–1601 | 03 13 14 16 17 18 19 20 21 22 23 26 29 31 32 33 34 36 | `core.js`:189 `plot.js`:359,497,498 `ui.js`:7,32,55,73,168,192… |
| 16 [U] | 解説タブ | `gui/REQ-16.md`（1471） | `gui/SPEC-16.md`（5683） | `gui/TEST-16.md`（3776） | 2070–2259 | 01 02 03 04 05 06 07 08 09 10 11 12 13 14 20 21 25 26 27 29 30 36 | – |
| 17 [U] | グラフの軸・目盛・自動レンジ | `gui/REQ-17.md`（1032） | `gui/SPEC-17.md`（4663） | `gui/TEST-17.md`（3653） | 2497–2631 | 11 18 26 30 | `plot.js`:18,55,86,89,164,294… |
| 18 [U] | 設定画面 | `gui/REQ-18.md`（909） | `gui/SPEC-18.md`（5499） | `gui/TEST-18.md`（2593） | 2757–3017 | 08 11 15 17 23 29 30 | `plot.js`:481 `ui.js`:110,171,557 |
| 19 [U] | 機関断面図 | `gui/REQ-19.md`（669） | `gui/SPEC-19.md`（1205） | `gui/TEST-19.md`（873） | 3082–3129 | 12 15 23 31 | `plot.js`:787,800 |
| 20 [U] | 検証の基盤 | `requirements/REQ-20.md`（1214） | `specification/SPEC-20.md`（6746） | `specification/TEST-20.md`（2158） | 3152–3152 | 01 10 13 15 16 17 24 25 26 31 32 33 34 35 36 37 | `ui.js`:994 |
| 21 [U] | エンジン音 | `requirements/REQ-21.md`（1629） | `specification/SPEC-21.md`（9859） | `specification/TEST-21.md`（5963） | 3228–3273 | 02 18 22 23 27 36 | `core.js`:1127,2569 `audio.js`:15,21,32,38,49,112… `ui.js`:990 |
| 22 [U] | 制御状態の表示 | `gui/REQ-22.md`（370） | `gui/SPEC-22.md`（1101） | `gui/TEST-22.md`（911） | 3803–3937 | 11 | – |
| 23 [U] | 目標回転数とスロットル開度のスライダ | `gui/REQ-23.md`（694） | `gui/SPEC-23.md`（1218） | `gui/TEST-23.md`（1122） | 3939–4044 | – | `ui.js`:483,485,488,557,567 |
| 24 | 内部 EGR と点火時期の妥当性 | `requirements/REQ-24.md`（659） | `specification/SPEC-24.md`（967） | `specification/TEST-24.md`（1433） | 4110–4149 | 05 | – |
| 25 [U] | 吸気ランナの慣性（慣性過給） | `requirements/REQ-25.md`（1072） | `specification/SPEC-25.md`（3857） | `specification/TEST-25.md`（2504） | 4159–4249 | 02 04 05 29 | `core.js`:1568,1581 |
| 26 [U] | 性能曲線タブ（回転数に対する特性の計測） | `requirements/REQ-26.md`（1429） | `specification/SPEC-26.md`（3254） `gui/SPEC-26B.md`（1876） | `specification/TEST-26.md`（3906） | 4296–4441 | 10 14 29 31 37 | `core.js`:469,2121,2141,2142,2170,2178… `plot.js`:238 `ui.js`:260,336 |
| 27 [U] | 排気系（排気管の脈動と背圧） | `requirements/REQ-27.md`（1475） | `specification/SPEC-27.md`（7785） | `specification/TEST-27.md`（2486） | 4682–4744 | 04 08 14 21 25 29 | `core.js`:997,1097,1229,1308,1319,1324… |
| 28 | アイドルの妥当性 | `requirements/REQ-28.md`（413） | `specification/SPEC-28.md`（1010） | `specification/TEST-28.md`（462） | 5453–5475 | – | – |
| 29 | 化学種の熱物性と化学平衡（第26版） | `requirements/REQ-29.md`（1845） | `specification/SPEC-29.md`（6572） `specification/SPEC-29B.md`（10648） | `specification/TEST-29.md`（5270） | 4854–4861 | 02 04 05 06 07 08 09 13 14 15 20 25 26 27 30 | `core.js`:162,296,390,398,469,587… |
| 30 [U] | 燃料の噴射と気化（第26版） | `requirements/REQ-30.md`（1181） | `specification/SPEC-30.md`（6594） | `specification/TEST-30.md`（3805） | 5071–5085 | 05 07 12 13 14 18 25 29 31 | `core.js`:65,662,1087,1261,1545 `plot.js`:480 `ui.js`:172 |
| 31 [U] | 全体図（系統図） | `gui/REQ-31.md`（908） | `gui/SPEC-31.md`（2954） | `gui/TEST-31.md`（1761） | 5294–5299 | 15 19 30 | `plot.js`:781,809,813,824,848,942 `ui.js`:475 |
| 32 [U] | 最適化（バルブタイミング） | `requirements/REQ-32.md`（2189） | `specification/SPEC-32.md`（6162） `gui/SPEC-32A.md`（2458） | `specification/TEST-32.md`（2333） | 5531–5534 | 03 21 33 34 | `core.js`:2546,2663,2678,2701,2720,2845… `plot.js`:1138,1260 `ui.js`:762,776,779 |
| 33 [U] | 熱効率の損失の内訳 | `requirements/REQ-33.md`（1559） | `specification/SPEC-33.md`（5223） `gui/SPEC-33C.md`（858） | `specification/TEST-33.md`（1551） | 5749–5777 | 01 03 10 12 14 29 30 32 | `core.js`:451,2956,3017,3043,3053 `plot.js`:1138,1189,1210 `ui.js`:762,776,872 |
| 34 [U] | VVT マップ | `requirements/REQ-34.md`（1380） | `specification/SPEC-34.md`（1581） `gui/SPEC-34A.md`（1620） | `specification/TEST-34.md`（1470） | 5865–5869 | 32 | `core.js`:2581,3101,3103 `plot.js`:1448,1500 `ui.js`:776,883 |
| 35 [U] | シャシーダイナモメーター | `requirements/REQ-35.md`（1303） | `specification/SPEC-35.md`（3291） `gui/SPEC-35D.md`（1020） | `specification/TEST-35.md`（1693） | 6036–6039 | 11 18 22 23 26 | `core.js`:238,242,247,2060 `plot.js`:446 `ui.js`:669 |
| 36 [U] | 振動による体感 | `requirements/REQ-36.md`（1356） | `specification/SPEC-36.md`（2141） `gui/SPEC-36D.md`（617） | `specification/TEST-36.md`（1861） | 6384–6385 | 07 13 15 | `core.js`:1503 `audio.js`:363,408 `ui.js`:990,992,1167 |
| 37 [U] | 運転点のマップ（回転数 × 軸トルク） | `requirements/REQ-37.md`（1980） | `specification/SPEC-37.md`（4760） `gui/SPEC-37A.md`（2170） | `specification/TEST-37.md`（2439） | 6547–6554 | 26 | `core.js`:2292,2295,2451 `plot.js`:1547 `ui.js`:315,377 |

## 2. そのほかの節

| 文書 | 見出し | ファイル | 字数 |
| :--- | :--- | :--- | ---: |
| 要件定義書 | 単気筒4ストロークSI機関シミュレータ 要件定義書（第26版） | `requirements/_head.md` | 35 |
| 要件定義書 | 1. 目的と範囲 | `requirements/s1.md` | 13 |
| 要件定義書 | 1.1 目的 | `requirements/s1.1.md` | 287 |
| 要件定義書 | 1.2 対象 | `requirements/s1.2.md` | 340 |
| 要件定義書 | 1.2a 試験の種類（大きな枠組み） | `requirements/s1.2a.md` | 490 |
| 要件定義書 | 1.3 対象外 | `requirements/s1.3.md` | 283 |
| 要件定義書 | 1.4 利用者と利用環境 | `requirements/s1.4.md` | 178 |
| 要件定義書 | 1.5 文書の体系 | `requirements/s1.5.md` | 1408 |
| 要件定義書 | 2. 前提と制約 | `requirements/s2.md` | 1214 |
| 要件定義書 | 3. 状態と記号 | `requirements/s3.md` | 933 |
| 要件定義書 | 4. 要件 | `requirements/s4.md` | 10 |
| 要件定義書 | 5. 受入 | `requirements/s5.md` | 10 |
| 要件定義書 | 5.1 納品条件 | `requirements/s5.1.md` | 608 |
| 要件定義書 | 5.2 実機目視チェックリスト [M]（Galaxy S26+／Chrome） | `requirements/s5.2.md` | 1532 |
| 要件定義書 | 6. 要件・仕様・テストの対応 | `requirements/s6.md` | 4025 |
| 要件定義書 | 7. 改訂の記録 | `requirements/s7.md` | 13 |
| 要件定義書 | 7.1 版の一覧 | `requirements/s7.1.md` | 917 |
| 要件定義書 | 7.2 未決事項と既知の限界 | `requirements/s7.2.md` | 5317 |
| 要件定義書 | 7.3 経緯の記録の場所 | `requirements/s7.3.md` | 392 |
| 仕様書 | 単気筒4ストロークSI機関シミュレータ 仕様書（第26版） | `specification/_head.md` | 33 |
| 仕様書 | 0. この文書について | `specification/s0.md` | 969 |
| 仕様書 | 1. 構成 | `specification/s1.md` | 576 |
| 仕様書 | 2. 座標系・状態変数・補助積分 | `specification/s2.md` | 21 |
| 仕様書 | 2.1 独立変数とクランク角 | `specification/s2.1.md` | 390 |
| 仕様書 | 2.2 状態ベクトル | `specification/s2.2.md` | 2431 |
| 仕様書 | 2.3 補助積分 | `specification/s2.3.md` | 1789 |
| 仕様書 | 3. 機関モデル | `specification/s3.md` | 13 |
| 仕様書 | 4. 数値積分と性能の指標 | `specification/s4.md` | 18 |
| 仕様書 | 5. 性能曲線と最適化 | `specification/s5.md` | 176 |
| 仕様書 | 6. エンジン音と振動 | `specification/s6.md` | 16 |
| 仕様書 | 7. 検証 | `specification/s7.md` | 10 |
| 仕様書 | 8. テスト項目 | `specification/s8.md` | 313 |
| 仕様書 | 9. 開発時検証 [D] | `specification/s9.md` | 2047 |
| 画面の文書 | 単気筒4ストロークSI機関シミュレータ 画面の文書（第26版） | `gui/_head.md` | 35 |
| 画面の文書 | 0. この文書について | `gui/s0.md` | 628 |
| 画面の文書 | 1. 要件 | `gui/s1.md` | 10 |
| 画面の文書 | 2. 仕様 | `gui/s2.md` | 10 |
| 画面の文書 | 3. 計算の章の画面の節 | `gui/s3.md` | 17 |
| 画面の文書 | 4. テスト項目 | `gui/s4.md` | 76 |
| 用語の定義集 | 単気筒4ストロークSI機関シミュレータ 用語の定義集（第26版） | `glossary/_head.md` | 187 |
| 用語の定義集 | 1. 表記の規則 | `glossary/s1.md` | 738 |
| 用語の定義集 | 2. 記号 | `glossary/s2.md` | 10 |
| 用語の定義集 | 2.1 独立変数とクランク角 | `glossary/s2.1.md` | 261 |
| 用語の定義集 | 2.2 状態ベクトル | `glossary/s2.2.md` | 3166 |
| 用語の定義集 | 2.3 補助積分 | `glossary/s2.3.md` | 2137 |
| 用語の定義集 | 2.4 幾何（スライダ・クランク機構と弁） | `glossary/s2.4.md` | 2002 |
| 用語の定義集 | 2.5 熱力学と物性 | `glossary/s2.5.md` | 1544 |
| 用語の定義集 | 2.5a 化学種の熱物性と噴射（第26版．SPEC-29，SPEC-30） | `glossary/s2.5a.md` | 2288 |
| 用語の定義集 | 2.6 流れと吸排気系 | `glossary/s2.6.md` | 5293 |
| 用語の定義集 | 2.7 燃焼 | `glossary/s2.7.md` | 2045 |
| 用語の定義集 | 2.8 壁面熱伝達 | `glossary/s2.8.md` | 744 |
| 用語の定義集 | 2.9 回転運動，摩擦，動力計 | `glossary/s2.9.md` | 1307 |
| 用語の定義集 | 2.9a 車両（SPEC-35） | `glossary/s2.9a.md` | 846 |
| 用語の定義集 | 2.10 制御 | `glossary/s2.10.md` | 1070 |
| 用語の定義集 | 2.11 数値積分 | `glossary/s2.11.md` | 595 |
| 用語の定義集 | 2.12 性能の指標 | `glossary/s2.12.md` | 2360 |
| 用語の定義集 | 2.13 エンジン音と振動 | `glossary/s2.13.md` | 1383 |
| 用語の定義集 | 3. 用語 | `glossary/s3.md` | 10 |
| 用語の定義集 | 3.1 機関 | `glossary/s3.1.md` | 2123 |
| 用語の定義集 | 3.2 モデルと数値計算 | `glossary/s3.2.md` | 1353 |
| 用語の定義集 | 3.3 制御と動力計 | `glossary/s3.3.md` | 1095 |
| 用語の定義集 | 3.3a 最適化と熱効率の内訳（SPEC-32〜34） | `glossary/s3.3a.md` | 2642 |
| 用語の定義集 | 3.4 画面と検証 | `glossary/s3.4.md` | 2888 |
| 用語の定義集 | 4. 略語 | `glossary/s4.md` | 1052 |

## 3. そのほかの文書とコード

| ファイル | 字数 |
| :--- | ---: |
| `CLAUDE.md` | 5999 |
| `docs/dev-notes.md` | 4228 |
| `docs/verification.md` | 41822 |
| `docs/review_v26.md` | 34714 |
| `docs/report_solver.md` | 19042 |
| `docs/report_egr.md` | 8062 |
| `docs/report_burn.md` | 4288 |
| `docs/report_devices.md` | 7019 |
| `docs/report_vt.md` | 8968 |
| `docs/history/changes_v25.md` | 8270 |
| `docs/history/changes_v26.md` | 31648 |
| `src/core.js` | 102188 |
| `src/audio.js` | 15516 |
| `src/plot.js` | 64744 |
| `src/doc.js` | 58233 |
| `src/ui.js` | 53620 |
| `src/tests.js` | 293089 |
| `docs/changes/2026-11-21-solver.md` | 4176 |
| `docs/changes/2026-11-21-structure.md` | 3379 |
| `docs/changes/2026-11-22-burn-dilution.md` | 1760 |
| `docs/changes/2026-11-22-ci.md` | 1294 |
| `docs/changes/2026-11-22-egr.md` | 414 |
| `docs/changes/2026-11-22-operating-map.md` | 6512 |
| `docs/changes/2026-11-22-perf-scope.md` | 591 |
| `docs/changes/2026-11-22-result-copy.md` | 5486 |
| `docs/changes/2026-11-22-review-gemini-1.md` | 11174 |
| `docs/changes/2026-11-22-valve-timing-search.md` | 5374 |
| `docs/changes/2026-11-23-c7-wording.md` | 470 |
| `docs/changes/2026-11-23-event-theta-exact.md` | 2977 |
| `docs/changes/2026-11-23-exhaust-sound-speed.md` | 3044 |
| `docs/changes/2026-11-23-plot-fixes.md` | 1826 |
| `docs/changes/2026-11-23-port-air-mass.md` | 2179 |
| `docs/changes/2026-11-23-review-followup.md` | 2038 |
| `docs/changes/2026-11-23-review-gemini-2.md` | 2485 |
| `docs/changes/2026-11-23-review-gemini-3.md` | 2693 |
| `docs/changes/2026-11-23-review-gemini-4.md` | 4343 |
| `docs/changes/2026-11-23-review-gemini-5.md` | 7273 |
| `docs/changes/2026-11-23-run-state-copy.md` | 2494 |
