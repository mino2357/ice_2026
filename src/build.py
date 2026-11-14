import os
d=os.path.dirname(os.path.abspath(__file__));r=lambda f:open(os.path.join(d,f),encoding='utf-8').read()
import base64
fnt=base64.b64encode(open(os.path.join(d,'fonts','lmmath-subset.otf'),'rb').read()).decode()
h=r('index.tpl.html').replace('/*CSS*/',r('style.css').replace('/*LMFONT*/',fnt)).replace('/*JS*/','\n'.join(r(f) for f in['core.js','audio.js','plot.js','doc.js','tests.js','ui.js']))
open(os.path.join(d,'..','dist','engine.html'),'w',encoding='utf-8').write(h);print(len(h))
