import os
d=os.path.dirname(os.path.abspath(__file__));r=lambda f:open(os.path.join(d,f),encoding='utf-8').read()
import base64
fnt=base64.b64encode(open(os.path.join(d,'fonts','lmmath-subset.otf'),'rb').read()).decode()
import re,unicodedata
# 解説タブの記号表：同じ記号を 2 回定義していないこと（後の定義が前の定義を黙って上書きするため）
_d=r('doc.js');_b=_d[_d.index('const SYM={'):_d.index('const DOCC=')];_k=[unicodedata.normalize('NFC',k) for k in re.findall(r"'([^']+)':\[",_b)]
_dup=sorted(set(k for k in _k if _k.count(k)>1));assert not _dup,'SYM に重複: '+' '.join(_dup)
# ---- 3 文書（要件定義書・仕様書・用語の定義集）を HTML + MathML にして埋め込む（SPEC-16 の 9） ----
import subprocess,json,html as _html
from fontTools.ttLib import TTFont
import xml.etree.ElementTree as ET
_TALL={'mfrac','msqrt','mroot','mtable','munder','munderover'}
def mfix(x):
    # pandoc の MathML を解説タブの組版の規則に合わせる：(1) 上線は内容の幅に伸びる線（CSS の上罫線）にする，
    # (2) 括弧の組は，中身に分数・根号・行列などの背の高い要素があるときだけ伸ばす（無ければ stretchy="false"）
    root=ET.fromstring(x)
    def walk(e):
        for i,c in enumerate(list(e)):
            walk(c)
            if c.tag=='mover' and len(c)==2 and c[1].tag=='mo' and (c[1].text or '') in('\u203e','\u00af','\u0305'):
                n=ET.Element('mrow',{'class':'ol'});n.append(c[0]);n.tail=c.tail;e.remove(c);e.insert(i,n)
        ch=list(e)
        if e.tag=='mrow' and len(ch)>=2 and ch[0].tag=='mo' and ch[0].get('form')=='prefix' and ch[-1].tag=='mo' and ch[-1].get('form')=='postfix':
            if not any(d.tag in _TALL for c in ch[1:-1] for d in c.iter()):
                ch[0].set('stretchy','false');ch[-1].set('stretchy','false')
    walk(root)
    return ET.tostring(root,encoding='unicode',short_empty_elements=False)
def md2doc(name,key):
    src=os.path.join(d,'..','docs',name)
    try:h=subprocess.run(['pandoc','-f','gfm+tex_math_dollars','-t','html','--mathml','--wrap=none',src],capture_output=True,text=True,check=True).stdout
    except FileNotFoundError:raise SystemExit('pandoc が必要です（文書を MathML に変換するため）')
    assert 'class="math' not in h,name+'：変換できない数式があります'
    h=re.sub(r'<annotation encoding="application/x-tex">.*?</annotation>','',h,flags=re.S).replace('<semantics>','').replace('</semantics>','').replace(' xmlns="http://www.w3.org/1998/Math/MathML"','')
    h=re.sub(r'<math.*?</math>',lambda m:mfix(m.group(0)),h,flags=re.S)
    h=re.sub(r'(<math display="block".*?</math>)',r'<span class="dx">\1</span>',h,flags=re.S)
    h=re.sub(r'(<math display="inline".*?</math>)',r'<span class="im">\1</span>',h,flags=re.S)
    h=re.sub(r'<table>(.*?)</table>',r'<div class="tw"><table>\1</table></div>',h,flags=re.S)
    h=re.sub(r' (class="(?:header|odd|even)"|style="text-align: left;")','',h)
    h=h.replace('<a href="http','<a target="_blank" rel="noopener" href="http')
    toc=[];n=[0]
    def hd(m):
        n[0]+=1;i=f'{key}h{n[0]}';lv=int(m.group(1));tx=re.sub(r'<math.*?</math>','',m.group(2),flags=re.S);tx=_html.unescape(re.sub(r'<[^>]+>','',tx)).strip()
        if lv in(2,3):toc.append([lv,i,tx])
        return f'<h{lv} id="{i}">{m.group(2)}</h{lv}>'
    h=re.sub(r'<h([1-4])[^>]*>(.*?)</h\1>',hd,h,flags=re.S)
    parts=[c for c in re.split(r'(?=<h[23] )',h) if c.strip()]
    chars=set()
    for m in re.finditer(r'<math.*?</math>',h,flags=re.S):chars|=set(_html.unescape(re.sub(r'<[^>]+>','',m.group(0))))
    return dict(chunks=parts,toc=toc,nmath=h.count('<math'),nchar=len(h)),chars
DOCS={};_ch=set()
for _n,_k in[('requirements.md','req'),('specification.md','spec'),('glossary.md','glo')]:
    DOCS[_k],_c=md2doc(_n,_k);_ch|=_c
_cm=TTFont(os.path.join(d,'fonts','lmmath-subset.otf')).getBestCmap()
_miss=sorted(c for c in _ch if ord(c) not in _cm and not c.isspace() and (ord(c)<0x2E80 or 0x1D400<=ord(c)<=0x1D7FF))
assert not _miss,'数式フォントのサブセットに無い文字: '+' '.join(f'{c}(U+{ord(c):04X})' for c in _miss)+'（src/fonts/make_subset.py に足して npm run font）'
_dj=json.dumps(DOCS,ensure_ascii=False,separators=(',',':')).replace('</','<\\/').replace('<!--','<\\!--')
print('docs',{k:(len(v['chunks']),len(v['toc']),v['nmath'],v['nchar']) for k,v in DOCS.items()})
h=r('index.tpl.html').replace('/*CSS*/',r('style.css').replace('/*LMFONT*/',fnt)).replace('/*JS*/','\n'.join(r(f) for f in['core.js','audio.js','plot.js','doc.js','tests.js','ui.js']))
assert h.count('/*DOCS*/')==1;h=h.replace('/*DOCS*/',_dj)
open(os.path.join(d,'..','dist','engine.html'),'w',encoding='utf-8').write(h);print(len(h))
