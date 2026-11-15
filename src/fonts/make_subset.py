# Latin Modern Math (GUST Font License) を解説タブで使う文字だけに絞る．MATH 表は保持する．
from fontTools import subset
from fontTools.ttLib import TTFont
import string,sys
src=sys.argv[1] if len(sys.argv)>1 else '/usr/share/texmf/fonts/opentype/public/lm-math/latinmodern-math.otf'
chars=set(string.ascii_letters+string.digits+"+-=()[]{}|/.,:;<>!*'")
chars|=set("αβγδεζηθικλμνξπρστυφχψωΓΔΘΛΞΠΣΦΨΩ−×·∂∇∑∫√≤≥≈≡←→⇒∞°′″˙¯―̄̇ϕϵ")
chars.add('⁡')
# 埋め込む 3 文書（要件定義書・仕様書・用語の定義集）の数式で使う文字
chars|=set("%±÷…ℓℝ∈∘∝∮≠⋅⌈⌉⌊⌋\u0302\u0305ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ")
chars|=set(chr(c) for c in range(0x1D400,0x1D434))   # 数式用の太字 A〜z（\\mathbf）
opts=subset.Options();opts.layout_features=['*'];opts.notdef_outline=True;opts.name_IDs=['*']
f=TTFont(src);s=subset.Subsetter(opts);s.populate(unicodes=[ord(c) for c in chars]);s.subset(f)
assert 'MATH' in f
# GUST Font License（LPPL 準拠）の要請に従い，改変版（サブセット）には元と異なる名前を付ける
nm=f['name']
for rec in nm.names:
    if rec.nameID in (1,4,16):rec.string='ICE-Sim Math Subset (from Latin Modern Math)'
    elif rec.nameID==3:rec.string='ICE-Sim-Math-Subset-1.0'
    elif rec.nameID==6:rec.string='ICESimMathSubset-Regular'
# LPPL 1.3c 第 6 節 (b)：変更の内容を部品（フォント）自体に書く．原本の著作権表示（ID 0）は変えない
DESC='Modified version: a subset of Latin Modern Math 1.959 (GUST e-foundry) containing only the characters used by the formulas of the single-cylinder SI engine simulator (ICE-Sim); the MATH table is kept. The font names were changed. Not supported by the original authors. Original: https://ctan.org/pkg/lm-math . License: GUST Font License (LaTeX Project Public License 1.3c).'
nm.setName(DESC,10,3,1,0x409);nm.setName(DESC,10,1,0,0)
f.save(__file__.replace('make_subset.py','lmmath-subset.otf'))
