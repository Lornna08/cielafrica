import json,sys,glob,os
from fontTools.ttLib import TTFont
out={}
for f in sorted(glob.glob('fonts/*.ttf')):
    t=TTFont(f); upm=t['head'].unitsPerEm; cmap=t.getBestCmap(); hm=t['hmtx'].metrics
    hh=t['hhea']; os2=t['OS/2']
    use_typo = bool(os2.fsSelection & (1<<7))
    asc,desc=(os2.sTypoAscender,-os2.sTypoDescender) if use_typo else (hh.ascent,-hh.descent)
    lg = os2.sTypoLineGap if use_typo else hh.lineGap
    adv={}
    for cp,g in cmap.items():
        adv[cp]=round(hm[g][0]*1000/upm)
    # compress: string of chars and widths
    cps=sorted(adv)
    key=os.path.basename(f)[3:-4]
    out[key]={'a':round(asc*1000/upm),'d':round(desc*1000/upm),'g':round(lg*1000/upm),'cap':round(getattr(os2,'sCapHeight',0)*1000/upm),
      'c':''.join(chr(c) for c in cps),'w':[adv[c] for c in cps]}
print(json.dumps(out,ensure_ascii=False,separators=(',',':')))
