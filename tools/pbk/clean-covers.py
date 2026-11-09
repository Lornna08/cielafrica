import numpy as np, json, cv2, os, re
from PIL import Image
O='orig/'; OUT='out/'
for d in ['f','p','a']: os.makedirs(OUT+d,exist_ok=True)
covers=json.loads(re.search(r'=\s*(\[.*\]);?\s*$',open(O+'covers.js').read(),re.S).group(1))
brand=json.load(open('brand.json')); det=json.load(open('det.json'))
brand['namibia']=dict(x=455,y=1494,w=245,h=30)
def load(p,mode='RGB'): return np.asarray(Image.open(p).convert(mode)).copy()
def save(a,p,mode='RGB'): Image.fromarray(a,mode).save(p,quality=90,method=6)
def tele(img,box,pad=6):
    m=np.zeros(img.shape[:2],np.uint8); x,y,w,h=box; m[max(0,y-pad):y+h+pad,max(0,x-pad):x+w+pad]=255
    return cv2.inpaint(img,m,5,cv2.INPAINT_TELEA)
def smooth(img,boxes):
    out=img.copy()
    for (x,y,w,h) in boxes:
        x=max(0,x); y=max(0,y); x2=min(img.shape[1]-28,x+w); y2=min(img.shape[0],y+h)
        R=40; X0=max(0,x-R); Y0=max(0,y-R); X1=min(img.shape[1]-28,x2+R); Y1=min(img.shape[0],y2+R)
        reg=img[Y0:Y1,X0:X1].astype(np.float32); yy,xx=np.mgrid[Y0:Y1,X0:X1]
        ring=np.ones(reg.shape[:2],bool); ring[y-Y0:y2-Y0,x-X0:x2-X0]=False
        med=np.median(reg[ring],0); ok=ring&(np.abs(reg-med).sum(2)<45)
        A=np.stack([xx[ok],yy[ok],np.ones(ok.sum())],1)
        fill=np.zeros((y2-y,x2-x,3),np.float32); gy,gx=np.mgrid[y:y2,x:x2]
        G=np.stack([gx.ravel(),gy.ravel(),np.ones(gx.size)],1)
        for ch in range(3):
            coef,_,_,_=np.linalg.lstsq(A,reg[...,ch][ok],rcond=None); fill[...,ch]=(G@coef).reshape(fill.shape[:2])
        res=reg[ok]-(A@np.stack([np.linalg.lstsq(A,reg[...,c][ok],rcond=None)[0] for c in range(3)],1))
        sd=res.std(0)*0.7
        fill+=np.random.default_rng(x+y).normal(0,1,fill.shape).astype(np.float32)*sd
        m=np.zeros(img.shape[:2],np.float32); m[y:y2,x:x2]=1
        a=cv2.GaussianBlur(m,(0,0),2.5)[...,None]
        full=out.astype(np.float32); full[y:y2,x:x2]=fill
        out=(out*(1-a)+full*a).clip(0,255).astype(np.uint8)
    return out
def lum(c): return 0.299*c[...,0]+0.587*c[...,1]+0.114*c[...,2]
YEAR={'dubai':det['dubai'],'morocco':det['morocco'],'london-blue':det['london-blue'],'brazil':det['brazil'],'china-blossom':det['china-blossom']}
GHOST={'belgium','brazil','canada','london-blue','madagascar','maldives','namibia','new-york-bridge','sicily','china-blossom'}
report={}
for c in covers:
    n=c['id']; f=load(O+'f/'+n+'.webp'); fo=f.copy()
    pl=load(O+'p/'+n+'.webp') if os.path.exists(O+'p/'+n+'.webp') else None
    b=brand.get(n)
    if b:
        bx=(b['x'],b['y'],b['w'],b['h'])
        if b.get('n',10)<10: bx=(b['x']-28,b['y'],b['w']+56,b['h'])
        f=tele(f,bx)
        if pl is not None: pl=tele(pl,bx)
    lines=c.get('lines') or []
    # shadow detection on the original flat
    sh=0
    for l in lines[:1]:
        x,y,w,cap=l['x'],l['y'],l['w'],l['cap']; reg=fo[y-10:y+cap+30,x-10:x+w+30].astype(np.float32)
        col=np.array([int(l['color'][i:i+2],16) for i in (1,3,5)],np.float32)
        tm=(np.abs(reg-col).sum(2)<70).astype(np.uint8)
        if tm.sum()<200: continue
        s=max(3,int(cap*0.035))
        shifted=np.zeros_like(tm); shifted[s:,s:]=tm[:-s,:-s]
        band=(shifted>0)&(cv2.dilate(tm,np.ones((5,5),np.uint8))==0)
        far=cv2.dilate(tm,np.ones((31,31),np.uint8))==0
        if band.sum()<50 or far.sum()<50: continue
        dl=lum(reg[far]).mean()-lum(reg[band]).mean()
        report[n]=round(float(dl),1); sh=1 if dl>7 else 0
    c['sh']=sh
    # years
    yl=[l for l in lines if re.fullmatch(r'\d{4}',l['text'])]
    if n in YEAR:
        d=YEAR[n]; tb=max([l['y']+l['cap'] for l in lines if not re.fullmatch(r'\d{4}',l['text'])] or [det['china-title']['y']+det['china-title']['cap']]); top=max(d['y']-14,tb+6); box=(d['x']-14,top,d['w']+30,d['y']+d['cap']+26-top)
        f=smooth(f,[box])
        if pl is not None: pl=smooth(pl,[box])
        if n=='china-blossom':
            t=det['china-title']; pl=smooth(f,[(t['x']-20,t['y']-20,t['w']+50,t['cap']+50)])
            c['plate']=1
            c['lines']=[dict(text='CHINA',x=t['x'],y=t['y'],w=t['w'],cap=t['cap'],align='fill',color=t['color'])]
        c['lines'].append(dict(text='2026',x=d['x'],y=d['y'],w=d['w'],cap=d['cap'],align='right',color=d['color']))
        if c.get('art') and os.path.exists(O+'a/'+n+'.webp'):
            a=load(O+'a/'+n+'.webp','RGBA'); ab=c['art']; sx=a.shape[1]/ab[2]; sy=a.shape[0]/ab[3]
            X0=int((box[0]-ab[0])*sx); Y0=int((box[1]-ab[1])*sy); X1=int((box[0]+box[2]-ab[0])*sx); Y1=int((box[1]+box[3]-ab[1])*sy)
            a[max(0,Y0):max(0,Y1),max(0,X0):max(0,X1),3]=0
            save(a,OUT+'a/'+n+'.webp','RGBA')
            s2=load(O+'a/s/'+n+'.webp','RGBA') if os.path.exists(O+'a/s/'+n+'.webp') else None
            if s2 is not None:
                k=s2.shape[1]/a.shape[1]; s2[max(0,int(Y0*k)):max(0,int(Y1*k)),max(0,int(X0*k)):max(0,int(X1*k)),3]=0
                os.makedirs(OUT+'a/s',exist_ok=True); save(s2,OUT+'a/s/'+n+'.webp','RGBA')
    else:
        for l in yl:
            tb=lines[0]['y']+lines[0]['cap']; top=max(l['y']-14,tb+6); box=(l['x']-14,top,l['w']+30,l['y']+l['cap']+26-top); f=smooth(f,[box]); l['text']='2026'
    for l in c.get('lines') or []:
        if re.fullmatch(r'\d{4}',l['text']): l['role']='year'
    if any(l.get('role')=='year' for l in c.get('lines') or []): c['yr']=1
    if n in GHOST and pl is not None and n!='china-blossom':
        boxes=[(l['x']-30,l['y']-30,l['w']+70,l['cap']+(16 if n=='sicily' else 55)) for l in lines if not re.fullmatch(r'\d{4}',l['text'])]
        pl=smooth(pl,boxes)
    save(f,OUT+'f/'+n+'.webp')
    if pl is not None: save(pl,OUT+'p/'+n+'.webp')
json.dump(covers,open('covers.json','w'))
print(report)
print('shadow:',[c['id'] for c in covers if c['sh']])
