# 第25版の作業計画（レビュー `docs/review_requirements.md` の全項目を反映）

利用者の指示（2026-11-15）：「すべて同意．矛盾のない要件定義書を作成したうえで，それが漏れなく実現するテストを整えたうえで実装しなさい．分からないときは自分に聞くこと」．

## 利用者に確認して決めたこと
1. 比熱：未燃 $\gamma_u = 1.3488 - 13.0 \times 10^{-5}(T - 300)$，既燃 $\gamma_b = 1.3678 - 9.4 \times 10^{-5}(T - 300)$（Klein–Eriksson の表）を，燃焼割合で**比熱として**補間．内部エネルギーは積分で厳密に．
2. 吸気ポートの吹き返しの熱：断熱（壁とのやりとり無し）．
3. 層流燃焼速度：Turns の gasoline の組（$\phi_m = 1.13$，$B_m = 0.2758$，$B_2 = -0.7834\ \text{m/s}$，希釈 $1 - 2.1\,Y_{\text{dil}}$）に統一．
4. 要件定義書の再構成は全 REQ．本文は現行仕様だけ，経緯は 7 節．旧版は `docs/history/requirements_v24.md`．

## 自分で決めたこと（要件定義書に理由を書く）
* 気体定数は従来どおり共通の $R = 287$．$\gamma$ を文献値に合わせ，$c_v = R/(\gamma - 1)$ とする（$U = pV/(\gamma - 1)$ が $R$ によらないため）．
* 未燃の当てはめは $1000\ \text{K}$，既燃は $2700\ \text{K}$ で温度を頭打ちにする（有効範囲の外へ直線を延ばさない）．$500\ \text{K}$ 未満の既燃は直線のまま．
* 吸気は予混合気とする（A4．実装は変えない）．
* 吸気側の余剰エンタルピーは既燃ガスと同じ受動スカラーとして，マニホールド $E_{\text{in}}$ とポート $E_p$ の 2 状態で運ぶ．
* オリフィスの正則化は $C^0$ のまま（記述を直す）．RK4 は既定 $0.25^\circ$，刻み上限を硬さの実測から決める．
* イベント（サイクル終端，IVC，点火）でステップを切る．$p_{\max}$ は放物線補間．$\theta$ はサイクル終端で $4\pi$ を引く．
* サイクルの集計（仕事，流量，エネルギー収支）は補助積分（RK の重みで同時に積分）にする．
* ランナと排気ポートの剛性の $\gamma_0 = 1.4$ は集中定数の定数として残す（限界として明記）．

## モデルの式（確定版は要件定義書）
* $e_k(T) = \int_{T_0}^{T} \frac{R}{\gamma_k(T') - 1}dT'$（$T_0 = 298.15\ \text{K}$，$k = u, b$），$h_k = e_k + RT$．混合：$c_v = Y_u c_{v,u} + (1 - Y_u)c_{v,b}$，$\gamma = 1 + R/c_v$．
* $\frac{dp}{dt} = -\gamma\frac{p}{V}\dot V + \frac{\gamma - 1}{V}\Big[\dot Q_c + r\,(e_u(T) - e_b(T)) - \dot Q_w + \sum_{\text{in}}\dot m_j\big(h_j - Y_{u,j}e_u(T) - (1 - Y_{u,j})e_b(T) + c_v T\big) - \sum_{\text{out}}\dot m_j c_p T\Big]$，$r = m_{u,\text{trapped}}\frac{dx_b}{d\theta}\omega$．
* 吸気弁の順流：$h_j = Y_{u,j}h_u(T_{\text{in}}) + (1 - Y_{u,j})h_b(T_{\text{in}}) + \varepsilon$，$\varepsilon = E/m$（上流側の容積の余剰エンタルピー）．
* $\frac{dE_p}{dt} = \dot m_r\varepsilon_r - \dot m_{\text{in}}^+\varepsilon_p + \dot m_{\text{in}}^-\,[h(T; Y_u) - h(T_{\text{in}}; Y_u)]$，$\frac{dE_{\text{in}}}{dt} = -\dot m_r\varepsilon_r + \min(0, \dot m_{\text{th}})\varepsilon_{\text{in}}$．
* 検査：顕熱エネルギー $U_s = m_u e_u + m_b e_b$ について $\Delta U_s = -\int p\,dV - \int\dot Q_w + \int\dot Q_c + \int\dot H_{\text{in}} - \int\dot H_{\text{out}}$．

## 手順
1. scratch で物理を試作し，数値（アイドル開度と $k_T$，全開トルク，硬さ，冷間始動）を取る．
2. 要件定義書を書き直す（機関 → 画面・音）．
3. テストを書き，現行の実装で FAIL することを確かめる．
4. 実装．解説タブの式と記号表も直す．
5. `npm test` 全 PASS → 実測と検証結果を追記 → push（main 以外）→ 公開．

この計画ファイルは第25版の完了時に削除する．
