import os
d=os.path.dirname(os.path.abspath(__file__));r=lambda f:open(os.path.join(d,f),encoding='utf-8').read()
import re,unicodedata
# 解説タブの記号表：同じ記号を 2 回定義していないこと（後の定義が前の定義を黙って上書きするため）
_d=r('doc.js');_b=_d[_d.index('const SYM={'):_d.index('const DOCC=')];_k=[unicodedata.normalize('NFC',k) for k in re.findall(r"'([^']+)':\[",_b)]
_dup=sorted(set(k for k in _k if _k.count(k)>1));assert not _dup,'SYM に重複: '+' '.join(_dup)
# ---- 4 文書（要件定義書・仕様書・画面の文書・用語の定義集）を HTML にして埋め込む．数式は TeX のまま（SPEC-16 の 3，9） ----
import subprocess,json,html as _html
def _pd(src,mode):
    try:return subprocess.run(['pandoc','-f','gfm+tex_math_dollars','-t','html',mode,'--wrap=none',src],capture_output=True,text=True,check=True).stdout
    except FileNotFoundError:raise SystemExit('pandoc が必要です（文書を HTML に変換するため）')
def _tx(m):
    d=m.group(1)=='display';tex=_html.unescape(m.group(2)).strip()
    tex=tex[2:-2].strip() if tex[:2] in('\\(','\\[') else tex
    e=_html.escape(tex,quote=True)
    return f'<span class="dx"><span class="tx raw" data-d="1" data-tex="{e}">{e}</span></span>' if d else f'<span class="im"><span class="tx raw" data-tex="{e}">{e}</span></span>'
PGMAX=50000
def md2doc(name,key):
    # 文書は見出しごとの断片（docs/<名前>/，並びは _order.txt）を連結して読む．連結した全文は dist/docs/ に置く（読むため．Git には入れない）
    dd=os.path.join(d,'..','docs',name[:-3]);fr=[x.strip() for x in open(os.path.join(dd,'_order.txt'),encoding='utf-8').read().split('\n') if x.strip()]
    miss=sorted(set(x for x in os.listdir(dd) if x.endswith('.md'))-set(fr));assert not miss,name+'：_order.txt に無い断片：'+' '.join(miss)
    os.makedirs(os.path.join(d,'..','dist','docs'),exist_ok=True);src=os.path.join(d,'..','dist','docs',name)
    open(src,'w',encoding='utf-8').write(''.join(open(os.path.join(dd,x),encoding='utf-8').read() for x in fr))
    # TeX の誤りの検出：MathML にも変換してみて，変換できない式があれば止める（この MathML は埋め込まない）
    assert 'class="math' not in _pd(src,'--mathml'),name+'：変換できない数式があります'
    h=_pd(src,'--mathjax')
    h=re.sub(r'<span class="math (inline|display)">(.*?)</span>',_tx,h,flags=re.S)
    h=re.sub(r'<table>(.*?)</table>',r'<div class="tw"><table>\1</table></div>',h,flags=re.S)
    h=re.sub(r' (class="(?:header|odd|even)"|style="text-align: left;")','',h)
    h=h.replace('<a href="http','<a target="_blank" rel="noopener" href="http')
    toc=[];n=[0]
    def hd(m):
        n[0]+=1;i=f'{key}h{n[0]}';lv=int(m.group(1));tx=re.sub(r'<span class="(?:im|dx)">.*?</span></span>','',m.group(2),flags=re.S);tx=_html.unescape(re.sub(r'<[^>]+>','',tx)).strip()
        if lv in(2,3):toc.append([lv,i,tx])
        return f'<h{lv} id="{i}">{m.group(2)}</h{lv}>'
    h=re.sub(r'<h([1-4])[^>]*>(.*?)</h\1>',hd,h,flags=re.S)
    # 相互参照（SPEC-16 の 10）：本文の REQ-nn，SPEC-nn，TEST-nn をリンクにする（見出し・コード・数式・リンクの中は替えない）
    sk=r'(<h([1-4])[ >].*?</h\2>|<(code|pre)[ >].*?</\3>|<span class="(?:im|dx)">.*?</span></span>|<a [^>]*>.*?</a>|<[^>]+>)'
    xr=lambda t:re.sub(r'(?<![A-Za-z0-9])((?:REQ|SPEC|TEST)-(?:0[1-9]|[12][0-9]|3[0-5]))(?![0-9])',r'<a class="xr" data-x="\1">\1</a>',t)
    h=''.join(xr(c) if i%4==0 else c if i%4==1 else '' for i,c in enumerate(re.split(sk,h,flags=re.S)))  # 区切り（i%4==1）はそのまま，捕捉した下位の組（2，3）は捨てる
    parts=[c for c in re.split(r'(?=<h[23] )',h) if c.strip()]
    # 1 ページの大きさの上限（GUI SPEC-16 の 9 の「ページ」）：超える節は，同じ節番号の続きの見出し（###）で分ける
    big=[(i,len(c)) for i,c in enumerate(parts) if len(c)>PGMAX];assert not big,name+'：1 ページが %d 字を超えます（ページ，字数）：%s'%(PGMAX,big)
    return dict(chunks=parts,toc=toc,nmath=h.count('class="tx '),nchar=len(h))
DOCS={}
for _n,_k in[('requirements.md','req'),('specification.md','spec'),('gui.md','gui'),('glossary.md','glo')]:DOCS[_k]=md2doc(_n,_k)
_dj=json.dumps(DOCS,ensure_ascii=False,separators=(',',':')).replace('</','<\\/').replace('<!--','<\\!--')
print('docs',{k:(len(v['chunks']),len(v['toc']),v['nmath'],v['nchar']) for k,v in DOCS.items()})
h=r('index.tpl.html').replace('/*CSS*/',r('style.css')).replace('/*JS*/','\n'.join(r(f) for f in['core.js','audio.js','plot.js','doc.js','tests.js','ui.js']))
assert h.count('/*DOCS*/')==1;h=h.replace('/*DOCS*/',_dj)
# C-8：フォントやバイナリを埋め込まない
assert '@font-face' not in r('style.css') and not re.search(r'data:[^"\'\s)]*;base64,',h),'成果物に @font-face か base64 のデータがあります（C-8）'
# ビルドの ID（REQ-20 の 7）：成果物の内容（ID を入れる前）の SHA-1 の先頭 8 桁．同じソースと文書なら同じ ID になる
import hashlib
assert h.count('__BUILD__')==1;h=h.replace('__BUILD__',hashlib.sha1(h.encode('utf-8')).hexdigest()[:8])
open(os.path.join(d,'..','dist','engine.html'),'w',encoding='utf-8').write(h);print(len(h))
