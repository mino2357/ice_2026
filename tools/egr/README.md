# tools/egr — 外部 EGR の試算

`docs/report_egr.md` の調査．製品のコードは書き換えず，`src/core.js` を読み込むときに，吸気マニホールドへの既燃ガスの流入（と，`--st` では乱流燃焼速度の乱れの項の希釈）を差し替える．

```
node tools/egr/survey1.js [--st] [出力の JSON]    # 5 つの運転点 × EGR 率 0〜30%（--st は 40% まで）．約 20 秒
```
