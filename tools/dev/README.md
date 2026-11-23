# tools/dev — 開発用の道具

点検と調査に使う小さなスクリプト．成果物（`dist/engine.html`）には含めない．納品条件（要件定義書 5.1 節）の判定は，段階 1 は `npm run verify`，段階 2 は `npm test` で行う．

| スクリプト | 用途 | 必要なもの |
| :--- | :--- | :--- |
| `check_docs.js` | 文書とコードの整合の点検（下の一覧）．指摘があれば終了コード 1．`npm run check`，`npm test` の最初に走る | Node.js |
| `verify.js` | 段階 1 の検証（`npm run verify`）：変わったファイルから影響するテストだけを選んで実行し，PASS なら `verify.lock.json` を更新（仕様書 9 節） | Playwright |
| `inputs.js` | 検証の入力のハッシュと `verify.lock.json` の読み書き（`verify.js`，`tests/headless.js`，`delta.js` が使う） | Node.js |
| `delta.js` | 要件の差分（`npm run delta`）：承認済みの時点からの要件の断片の差分．`--approve` で今の HEAD を承認済みにする | git |
| `index.js` | 索引 `docs/INDEX.md` を作る（`npm run check` の中で作り直す） | Node.js |
| `docsrc.js` | 4 文書の断片を連結して読む（`check_docs.js`，`coverage.js`，`index.js` が使う） | Node.js |
| `fmt.js` | `src/*.js` の整形（`npm run fmt`）．空白だけを変え，構文木が同じことを確かめる | Node.js（`--expose-internals`） |
| `unused.js` | `src/` の最上位で定義した名前と定数表（`K`，`SWC`）のキーのうち，どこからも使われていないもの | Node.js |
| `run.js` | アプリ内テストを 1 つのビューポートで実行．`--only 24,26` で一部だけ，`--names` で全検査，`--time` でテストごとの所要時間，`--ui` で画面のモード（[U] の項目だけ），`--json`／`--md` で一覧を保存 | ビルド済みの成果物，Playwright |
| `coverage.js` | 仕様書のテスト項目と，`run.js --json` の検査の名前を，テストごとに並べて表示（漏れは人が読んで判定） | `run.js` の出力 |
| `bitcheck.js` | 熱物性 γ(T) の経路が第25版（commit `1ef8ff1`）とビット単位で一致するか．`--chromium` でブラウザでも比べる | git，（Playwright） |
| `node_core.js` | `src/core.js` を Node.js で読み込む（`require('./node_core').load()`）．`sub` でソースを書き換えて感度を調べられる | Node.js |
| `phi_sweep.js` | 当量比に対する全開の軸トルク，IVC の筒内温度，空気量，点火の時点の当量比．`--hfg 305e3` で気化潜熱を変える | Node.js |
| `valves4.js` | 弁の数・径・リフトと排気系（大気開放か，第42版までの消音器か）を変えたときの全開の性能の比較．JSON で渡す（`docs/review_v26.md` の 11.2，12 節） | Node.js |
| `stiff.js` | 定常のサイクルに沿ったヤコビアンの固有値の絶対値の最大（系の硬さ）と，RK4 の安定の条件 $\lvert\lambda\rvert\Delta t \le 2.79$ との比較（仕様書 SPEC-13，TEST-13 項目 10 と同じ求め方） | Node.js |
| `dyno_osc.js` | （水ブレーキ式の動力計のときの道具．電動式にした後は動かない．`docs/review_v26.md` の記録のため残す）動力計制御での回転数の振れの調査（定格・目標・ゲイン・遅れを変えた振れ幅と周期，平均化した系の Routh の条件との比較．`docs/review_v26.md` の 13.1 節） | Node.js |
| `vtopt.js` | バルブタイミングの探索（SPEC-32）を Node.js で実行し，結果の 8 近傍を別の評価器で確かめる | Node.js |
| `lossbk.js` | 熱効率の損失の内訳（SPEC-33）を Node.js で計算する | Node.js |
| `bench_core.js` | 全開・3000 rpm 固定の 1 サイクルあたりの計算時間とステップ数（熱物性・噴射方式ごと） | Node.js |
| `alloc.js` | 積分のヒープの割り当て：1 ステップあたりのバイト数と，割り当てた関数ごとの内訳（V8 の標本のヒーププロファイラ）．3 つ目の引数でソースを書き換えて，割り当てを 1 つ外したときの差を測れる（`docs/report_alloc.md`） | Node.js（`--expose-gc`） |
| `kink.js` | 流量関数 $\Psi$ の折れ目（$r_p = 1 - 10^{-3}$）をまたぐ BS3 の試行と，ステップの棄却の率（`docs/report_alloc.md` の 2 節） | Node.js |
| `vtwarm.js` | バルブタイミングの探索の評価を「前の評価の状態から始める」ことが値にどれだけ効くか（探索の中の値と，探索の前の状態から評価し直した値の差） | Node.js |
| `portmass.js` | 試算：吸気ポートの空気の質量を状態にしたときの定常の値の変化（外部のレビューの C-4 の設計案の材料） | Node.js |
| `idle.js` | 始動からのアイドルの回転数の偏差（設定の上書きを JSON で渡す） | Node.js |

## 環境

必要なもの：Node.js 22（CI と同じ系列），npm，pandoc 3.1.3（CI の ubuntu-24.04 と同じ版），Python 3，Playwright の Chromium．

管理者の権限があるとき：

```
sudo apt-get install -y pandoc libnspr4 libnss3 libasound2t64
npm install && npx playwright install chromium
```

管理者の権限が無いとき（ホームの下に入れる．2026-11-22 に WSL2 の Ubuntu 26.04 で行った手順）：

1. Node.js：`https://nodejs.org/dist/latest-v22.x/` の `node-v22.*-linux-x64.tar.xz` を `~/.local/opt` に展開し（`SHASUMS256.txt` で確かめる），`node`，`npm`，`npx` を `~/.local/bin` にリンクする．
2. pandoc：`https://github.com/jgm/pandoc/releases/download/3.1.3/pandoc-3.1.3-linux-amd64.tar.gz` を同じように展開してリンクする．
3. `npm install`，`npx playwright install chromium`（Chromium は `~/.cache/ms-playwright` に入る）．
4. Chromium が要るシステムのライブラリ（`libnspr4`，`libnss3`，`libasound2t64`）が無いと，起動に失敗する（`ldd` で `not found` と出る）．`apt` の deb を取って（署名のある `InRelease` → `Packages.xz` のハッシュ → deb のハッシュの順に確かめる），`dpkg-deb -x` で `~/.local/opt/chromium-libs` に展開し，実行のときに `LD_LIBRARY_PATH=$HOME/.local/opt/chromium-libs/usr/lib/x86_64-linux-gnu` を付ける．
5. GitHub CLI（`gh`．プルリクエストと CI の結果を見るのに使う．道具の実行には要らない）：`https://github.com/cli/cli/releases` の最新版の `gh_*_linux_amd64.tar.gz` と `gh_*_checksums.txt` を取り，`sha256sum -c` で確かめてから，`bin/gh` を `~/.local/bin` に置く（2026-11-23 に 2.105.0 で行った）．ログインは端末で `gh auth login`（利用者が行う）．
6. 新しく開いた端末では `~/.profile` が `~/.local/bin` を `PATH` に入れる．入っていない殻では `export PATH=$HOME/.local/bin:$PATH` を付ける．

`git fetch`／`git push` が `Permission denied (publickey)` になるとき：鍵にパスフレーズがあり，エージェントに鍵が載っていない．端末で `ssh-add` する（`~/.ssh/config` の `IdentityAgent` の場所のエージェントに載せる）．

この PC（Core i5-8350U）では，性能の記録のうち，TEST-16 のページの切り替えと相互参照の移動，TEST-20 の最長フレーム間隔と総所要時間，TEST-34 の VVT マップの所要が，手を入れる前のコードでも上限を超える（2026-11-23 の実測．`docs/changes/2026-11-22-review-gemini-1.md`）．

## 使い方の例

```
npm run check                                   # 整合の点検と，使っていない名前の点検
npm run build && node tools/dev/run.js --only 17,30 --names
node tools/dev/run.js --vp 1440x900 --time      # PC の大きさで全テスト．FAIL だけ表示
node tools/dev/run.js --json /tmp/tr.json && node tools/dev/coverage.js /tmp/tr.json 26 30
node tools/dev/run.js --md docs/measured_v26.md # 全検査の実測値の一覧を作り直す
node tools/dev/bitcheck.js --chromium
node tools/dev/phi_sweep.js --rpm 2000,4000
node tools/dev/stiff.js 2                      # 系の硬さ（2° ごと）
node tools/dev/vtopt.js '{"mode":1,"nt":1500,"alm":15}' 0   # S4 相当でバルブタイミングを探索
node tools/dev/lossbk.js                        # 熱効率の損失の内訳
```

## `check_docs.js` が調べること

1. **番号と題**：REQ-01〜35，SPEC-01〜35，TEST-01〜35 の見出しがそろい（要件定義書・仕様書と画面の文書 `docs/gui/` を合わせて，どちらか一方に 1 つずつ），題が同じ（SPEC の「の確かめ方」は許す）．
2. **対応表**：要件定義書 6 節の表が 34 行で，同じ番号の SPEC と TEST を引いている．
3. **連番**：受入基準とテスト項目の番号が 1 から続く．4 文書の番号付きリストの番号が飛ばない（pandoc は先頭の番号から振り直すので，原稿の番号が飛ぶと，本文の「〜の 14」という参照と表示がずれる）．
4. **参照の切れ**：`REQ-nn`，`SPEC-nn`，`TEST-nn` が 01〜34 の範囲にある．「TEST-nn 項目 k」「REQ-nn の受入基準 k」の k が項目の数以下．「SPEC-nn X」の節 X がある．
5. **設定の表**：仕様書 SPEC-18 C の表が，項目定義表 `ITEMS` の全項目（ページ，範囲，刻み，既定，選択肢）を含む．1 ページが 6 項目以内．
6. **数**：`NY`，テストの数，設定のページの数についての記述．「$n$/$n$ PASS」の $n$ が 34．`src/tests.js` の `UIT`（画面のモードで実行するテスト）が，仕様書で [U] の項目を持つテストの集合と一致する．
7. **表記と古い記述**：句読点「、」「。」，トルクの単位の書き方（N·m），SI 接頭辞の大文字と小文字，句読点の重なり（「．．」など），ファイルの末尾の改行，圧力の単位 bar，題の版の番号，改めた名前（「化学種」「比熱」など）の残り．要件定義書の 7 節（改訂の記録）は調べない．
8. **受入基準とテスト項目**：受入基準が「項目 k」「TEST-nn」「[M]」のどれかを引いている．`-v` を付けると，どの受入基準からも引かれていないテスト項目を表示する（仕様の細部の検査で，要件ではないもの）．

機械的に調べられない整合（式と実装の一致，参照先の意味の正しさ，古い実測値）は，`docs/review_v26.md` の方法で人が読んで確かめる．
