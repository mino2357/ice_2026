### SPEC-06：筒内の組成（未燃ガスと既燃ガス）（REQ-06）

#### 定義と式
$$\frac{dm}{dt} = \dot m_{\text{in}} - \dot m_{\text{ex}}, \qquad \frac{dm_u}{dt} = \dot m_{u,\text{in}} - \dot m_{u,\text{ex}} - r$$
* 吸気弁：順流は上流の容積の組成（既燃分率 $Y_{b,\text{src}}$，SPEC-05），逆流は筒内の組成で出る．
  $$\dot m_{u,\text{in}} = \begin{cases} (1 - Y_{b,\text{src}})\,\dot m_{\text{in}} & (\dot m_{\text{in}} \ge 0) \\ Y_u\,\dot m_{\text{in}} & (\dot m_{\text{in}} < 0) \end{cases}$$
* 排気弁：流出は筒内の組成，逆流は既燃ガスだけとする（排気側へ吹き抜けた新気は既燃ガスとして扱う）．
  $$\dot m_{u,\text{ex}} = \begin{cases} Y_u\,\dot m_{\text{ex}} & (\dot m_{\text{ex}} \ge 0) \\ 0 & (\dot m_{\text{ex}} < 0) \end{cases}$$
* 燃焼：吸気弁が閉じた時点（IVC）の未燃ガスの質量を $m_{u,\text{trapped}}$ とし，Wiebe 関数の燃焼割合 $x_b$（SPEC-07）に従って既燃ガスに変わる．
  $$r = m_{u,\text{trapped}}\,\frac{dx_b}{d\theta}\,\omega$$

* **出典**：[C. R. Ferguson and A. T. Kirkpatrick, *Internal Combustion Engines: Applied Thermosciences*, 3rd ed., Wiley (2015)](https://www.wiley.com/en-us/Internal+Combustion+Engines%3A+Applied+Thermosciences%2C+3rd+Edition-p-9781118533314)

---

