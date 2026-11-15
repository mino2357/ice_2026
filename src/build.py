import os
d=os.path.dirname(os.path.abspath(__file__));r=lambda f:open(os.path.join(d,f),encoding='utf-8').read()
import base64
fnt=base64.b64encode(open(os.path.join(d,'fonts','lmmath-subset.otf'),'rb').read()).decode()
import re,unicodedata
# 解説タブの記号表：同じ記号を 2 回定義していないこと（後の定義が前の定義を黙って上書きするため）
_d=r('doc.js');_b=_d[_d.index('const SYM={'):_d.index('const DOCC=')];_k=[unicodedata.normalize('NFC',k) for k in re.findall(r"'([^']+)':\[",_b)]
_dup=sorted(set(k for k in _k if _k.count(k)>1));assert not _dup,'SYM に重複: '+' '.join(_dup)
h=r('index.tpl.html').replace('/*CSS*/',r('style.css').replace('/*LMFONT*/',fnt)).replace('/*JS*/','\n'.join(r(f) for f in['core.js','audio.js','plot.js','doc.js','tests.js','ui.js']))
open(os.path.join(d,'..','dist','engine.html'),'w',encoding='utf-8').write(h);print(len(h))
