# 2026-11-24 MathJax の読み込みに SRI を付ける

## 指示

外部のレビュー（ソースの点検の 3.4：MathJax に SRI が無い）について，利用者が「はい（付ける）」と判断した（`docs/changes/2026-11-24-review-gemini-6.md` の「朝の判断」の 9）．

## 要件の差分（承認済み．fa2305a）

* REQ-16 の受入基準 7 の末尾に足した：「MathJax の読み込みには，その版のファイルの内容を確かめる SRI（`integrity`．cdnjs が公開するハッシュ）を付け，内容が違うときは実行せずに TeX のソースを表示する（項目 22）．」
* 6 節の対応表の REQ-16 の行に「MathJax の SRI」を足した．

## 決めたこと

* ハッシュは cdnjs が公開する SHA-512 にした（cdnjs の API が公開するのは SHA-512 だけ）：`sha512-si8sZ9hrLKf+1QHOzVXtT6F9GH5yK4VeeZ4pm0LOBFriwiXFL6Pu6+VMArzgh1sDJb5gKyktGtN0rMT16k1/cQ==`．
* 値の確かめ方：(1) cdnjs の API（`https://api.cdnjs.com/libraries/mathjax/3.2.2?fields=sri` の `es5/tex-svg.js`），(2) cdnjs から取得した `tex-svg.js` の SHA-512，(3) 手元の写し `vendor/mathjax-3.2.2/es5/tex-svg.js` の SHA-512 の 3 つが一致した（`openssl dgst -sha512 -binary | openssl base64 -A`）．SHA-384 も (2) と (3) で一致した．
* `src/doc.js` の読み込みで，`<script>` に `integrity` と `crossorigin="anonymous"` を付けた．cdnjs は `Access-Control-Allow-Origin: *` を返す（取得して確かめた）．
* 検証の道具（`tests/headless.js`，`tools/dev/run.js`）で読み込みを手元の写しに振り向けるときの応答に，`Access-Control-Allow-Origin: *` を付けた（`crossorigin` を付けると，これが無い応答は CORS で読み込めない）．
* 仕様：SPEC-16 の 3（組版）．新しい記号は無い．

## 検証の結果

* **テストを先に**：TEST-16 項目 22 を足し，直す前の成果物で FAIL することを確かめた（`integrity` 無し，中身の違うスクリプトが実行され（印 1），状態は「読み込み中」のまま．対照（`integrity` なし）の実行は成立）．
* 直した後，TEST-15，16 で機能の検査は FAIL 0 件（項目 22：`integrity` あり，違う中身は実行 0，状態「読み込めない」．MathJax は手元の写しから読めて「数式：MathJax 3.2.2 で表示」）．［性能］のページの切り替え（$778\ \text{ms}$）と相互参照の移動（$729\ \text{ms}$）の上限超えは記録するだけ（直す前の実行でも $1077$，$589\ \text{ms}$ と超えていた）．
* **段階 1**（`npm run verify`）：全項目 666 件中 FAIL 0 件，組の失敗 0，所要 $595\ \text{s}$（MathJax は `tools/dev/run.js` の振り向けで読み込んだ）．`tests/headless.js`（段階 2）の同じ変更は段階 1 では動かしていない（CI の段階 2 で動く）．性能の記録の上限超え（10 件）は段階 1 では判定せず，記録するだけ．
